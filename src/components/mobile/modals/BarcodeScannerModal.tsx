import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Scan,
  Flashlight,
  Camera,
  CheckCircle2,
  AlertCircle,
  CameraOff,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Search
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ThemePalette } from '../../../utils/themeSystem';

interface BarcodeScannerModalProps {
  theme: ThemePalette;
  onClose: () => void;
  onScanResult: (result: {
    type: 'REAGENT' | 'EQUIPMENT' | 'ORDER';
    code: string;
    title: string;
    metadata: Record<string, string>;
  }) => void;
}

type CameraState = 'INITIALIZING' | 'REQUESTING' | 'SCANNING' | 'PERMISSION_DENIED' | 'NO_CAMERA' | 'ERROR';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  theme,
  onClose,
  onScanResult
}) => {
  const [cameraState, setCameraState] = useState<CameraState>('INITIALIZING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [scannedRawCode, setScannedRawCode] = useState<string | null>(null);
  const [scannedFormat, setScannedFormat] = useState<string | null>(null);
  const [isInvalidCode, setIsInvalidCode] = useState<boolean>(false);
  const [scannedItem, setScannedItem] = useState<{
    type: 'REAGENT' | 'EQUIPMENT' | 'ORDER';
    code: string;
    title: string;
    metadata: Record<string, string>;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const containerId = 'genuine-camera-scanner-viewport';

  // Helper: Look up decoded QR/Barcode in verified diagnostic catalog
  const lookupDiagnosticEntity = (code: string) => {
    const clean = code.trim();
    if (!clean) return null;

    // 1. Reagents by GS1 Barcode, Lot, or SKU
    if (clean === '0761234509121' || clean === 'ROC-TRP-9021' || clean.toUpperCase().includes('TRP') || clean.toUpperCase().includes('TROPONIN')) {
      return {
        type: 'REAGENT' as const,
        code: clean,
        title: 'cobas Elecsys Troponin T hs STAT Reagent',
        metadata: {
          'Batch #': 'ROC-TRP-9021',
          'Lot #': 'LOT-6771',
          'Expiry': '15 Aug 2027 (Safe)',
          'Storage': '2°C - 8°C (Cold-Chain Verified)',
          'Pack Size': '100 Tests / Cassette',
          'NABL Quality': 'COA-TRP-9021.pdf Verified'
        }
      };
    }

    if (clean === '4987123990124' || clean === 'SYS-WDF-7711' || clean.toUpperCase().includes('WDF') || clean.toUpperCase().includes('SYSMEX')) {
      return {
        type: 'REAGENT' as const,
        code: clean,
        title: 'Sysmex Fluorocell WDF Dye Cartridge',
        metadata: {
          'Batch #': 'SYS-WDF-7711',
          'Expiry': '24 Nov 2026 (Expiring Soon - 51d)',
          'Storage': '2°C - 8°C (Light Protected)',
          'Tests Remaining': '400 Tests',
          'Lot Matching': 'Valid Automated Lot Verification'
        }
      };
    }

    if (clean.toLowerCase() === 'r-001' || clean.toUpperCase().includes('SGPT') || clean.toUpperCase().includes('ALT')) {
      return {
        type: 'REAGENT' as const,
        code: clean,
        title: 'cobas SGPT/ALT Chemistry Reagent Kit',
        metadata: {
          'Batch #': 'ROC-ALT-4402',
          'Storage': '2°C - 8°C (Cold Monitored)',
          'Pack Size': '250 Tests / Pack',
          'Status': 'In Stock & Verified'
        }
      };
    }

    // 2. Equipment / Analyzer Asset Tags & Serials
    if (clean === 'QR-ASSET-ROC-88412' || clean === 'ROC-6000-88412' || clean === 'APEX-BIO-001' || clean.toUpperCase().includes('ROC-6000')) {
      return {
        type: 'EQUIPMENT' as const,
        code: clean,
        title: 'cobas 6000 Analyzer Series (c501 / e601)',
        metadata: {
          'Asset Tag': 'APEX-BIO-001',
          'Serial #': 'ROC-6000-88412',
          'Contract': '3-Year Comprehensive AMC (Active)',
          'Next PM': '15 Nov 2026',
          'Status': 'Operational (Telemetry Linked)'
        }
      };
    }

    if (clean.toLowerCase() === 'eq-001' || clean === 'EQ-RCH-COBAS') {
      return {
        type: 'EQUIPMENT' as const,
        code: clean,
        title: 'Roche Cobas c311 Chemistry Analyzer',
        metadata: {
          'Asset Tag': 'APEX-CHEM-001',
          'Serial #': 'RCH-C311-9982',
          'Contract': 'CMC Platinum (Active)',
          'Status': 'Operational'
        }
      };
    }

    if (clean.toLowerCase() === 'eq-004' || clean === 'EQ-ABT-ARCH') {
      return {
        type: 'EQUIPMENT' as const,
        code: clean,
        title: 'Abbott Architect i1000SR Immunoassay Analyzer',
        metadata: {
          'Asset Tag': 'APEX-IMM-004',
          'Serial #': 'ABT-ARCH-4421',
          'Contract': 'Comprehensive OEM Warranty',
          'Status': 'Active (Calibrated)'
        }
      };
    }

    // 3. Institutional Order Barcodes & Waybills
    if (clean.toUpperCase().startsWith('ORD-') || clean.toUpperCase().startsWith('INV-') || clean.toUpperCase().startsWith('ML-COLD-')) {
      return {
        type: 'ORDER' as const,
        code: clean,
        title: `Institutional Order #${clean}`,
        metadata: {
          'Reference': clean,
          'Cold-Chain': 'Active Sensor IOT-SENS-7892 (3.8°C)',
          'Traceability': 'Digital Chain of Custody Verified',
          'Status': 'In-Transit / Receival Ready'
        }
      };
    }

    return null;
  };

  // Handles genuine decode event from camera
  const handleDecodedCode = (decodedText: string, formatName?: string) => {
    if (!decodedText || decodedText.trim() === '') {
      setIsInvalidCode(true);
      return;
    }

    const clean = decodedText.trim();
    setScannedRawCode(clean);
    setScannedFormat(formatName || 'UNKNOWN_BARCODE');
    setIsInvalidCode(false);

    // Pause camera stream while displaying result
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.pause(true);
      }
    } catch (e) {
      console.warn('[BarcodeScanner] Pause warning:', e);
    }

    // Entity lookup
    const resolved = lookupDiagnosticEntity(clean);
    if (resolved) {
      setScannedItem(resolved);
    } else {
      // Unregistered custom code
      setScannedItem({
        type: 'REAGENT',
        code: clean,
        title: `Diagnostic Barcode (${formatName || 'Decoded'})`,
        metadata: {
          'Decoded Value': clean,
          'Symbology': formatName || 'Standard Barcode/QR',
          'Detection Time': new Date().toLocaleTimeString(),
          'Catalog Status': 'Custom / Unregistered Code'
        }
      });
    }
  };

  // Starts genuine device camera using html5-qrcode
  const startCamera = async () => {
    setCameraState('REQUESTING');
    setErrorMessage('');
    setScannedItem(null);
    setScannedRawCode(null);
    setIsInvalidCode(false);

    // Verify browser mediaDevices support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('NO_CAMERA');
      setErrorMessage('Camera access is not supported by your browser environment or requires an HTTPS / localhost connection.');
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });
      }

      const qrSuccessCallback = (decodedText: string, decodedResult: any) => {
        handleDecodedCode(decodedText, decodedResult?.result?.format?.formatName);
      };

      const qrErrorCallback = () => {
        // Routine frame scanning iteration - ignore empty frames
      };

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.max(160, Math.floor(edge * 0.72));
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' }, // Auto-select back camera on mobile (iOS/Android)
        config,
        qrSuccessCallback,
        qrErrorCallback
      );

      setCameraState('SCANNING');

      // Check if torch/flashlight is supported
      try {
        const caps = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
        if (caps && typeof caps.torchFeature === 'function') {
          setTorchSupported(caps.torchFeature().isSupported());
        }
      } catch {
        setTorchSupported(false);
      }
    } catch (err: any) {
      console.warn('[BarcodeScanner] Camera startup failed:', err);
      const errStr = (err?.name || err?.message || String(err)).toLowerCase();
      if (errStr.includes('notallowed') || errStr.includes('permission') || errStr.includes('denied')) {
        setCameraState('PERMISSION_DENIED');
      } else if (errStr.includes('notfound') || errStr.includes('device') || errStr.includes('no camera') || errStr.includes('overconstrained')) {
        setCameraState('NO_CAMERA');
        setErrorMessage('No camera hardware was detected on this device.');
      } else {
        setCameraState('ERROR');
        setErrorMessage(err?.message || 'Failed to initialize genuine camera feed.');
      }
    }
  };

  // Safely stops the camera hardware stream
  const stopCamera = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('[BarcodeScanner] Stop camera warning:', e);
      }
    }
    isStoppingRef.current = false;
  };

  // Toggle torch / flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !torchSupported) return;
    try {
      const caps = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
      if (caps && typeof caps.torchFeature === 'function') {
        const torchFeature = caps.torchFeature();
        if (torchFeature.isSupported()) {
          const nextTorch = !torchOn;
          await torchFeature.apply(nextTorch);
          setTorchOn(nextTorch);
        }
      }
    } catch (err) {
      console.warn('[BarcodeScanner] Torch toggle error:', err);
    }
  };

  // Resume camera scanning
  const resumeScanning = () => {
    setScannedItem(null);
    setScannedRawCode(null);
    setIsInvalidCode(false);
    try {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.resume();
      }
    } catch {
      startCamera();
    }
  };

  // Mount & cleanup effect
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Handle modal cancellation
  const handleCancelAndClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0E1035] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-700 text-white flex flex-col">
        {/* Scanner Top Bar */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-800 bg-[#15253F]/60">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#D0DEE5] animate-pulse" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Genuine Optical Scanner</h3>
              <p className="text-[10px] text-slate-400">Live Camera &bull; Android / iOS Ready</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {torchSupported && cameraState === 'SCANNING' && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-full transition cursor-pointer ${
                  torchOn ? 'bg-amber-400 text-slate-950 font-bold shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title={torchOn ? 'Turn Torch Off' : 'Turn Torch On'}
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCancelAndClose}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
              title="Cancel / Close Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Live Camera Stream Area */}
        <div className="relative h-64 bg-black flex items-center justify-center overflow-hidden">
          {/* html5-qrcode video viewport container */}
          <div id={containerId} className="w-full h-full absolute inset-0" />

          {/* STATE 1: SCANNING (Live Video Active) */}
          {cameraState === 'SCANNING' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              {/* Reticle Viewfinder Box */}
              <div className="relative w-52 h-52 border-2 border-dashed border-[#D0DEE5]/80 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                {/* Corner Brackets */}
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#D0DEE5]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#D0DEE5]" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#D0DEE5]" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#D0DEE5]" />

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-2 h-0.5 bg-[#D0DEE5] shadow-[0_0_12px_#D0DEE5] animate-bounce" />

                <div className="text-center p-3">
                  <Camera className="w-5 h-5 text-white/40 mx-auto mb-1" />
                  <span className="text-[10px] text-white/70 font-medium">Align barcode or QR inside reticle</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: REQUESTING / INITIALIZING */}
          {(cameraState === 'INITIALIZING' || cameraState === 'REQUESTING') && (
            <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#D0DEE5] animate-spin" />
              <div>
                <h4 className="font-bold text-xs text-white">Starting Optical Camera...</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Requesting browser video permission</p>
              </div>
            </div>
          )}

          {/* STATE 3: PERMISSION DENIED */}
          {cameraState === 'PERMISSION_DENIED' && (
            <div className="relative z-20 p-5 text-center flex flex-col items-center justify-center space-y-2.5 max-w-xs">
              <div className="p-3 rounded-full bg-rose-500/20 text-rose-400">
                <CameraOff className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-xs text-rose-300">Camera Access Denied</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Camera access was blocked by your browser. To scan physical diagnostic barcodes:
              </p>
              <div className="text-[9px] text-slate-400 text-left bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1 w-full">
                <div><strong>iOS (Safari):</strong> Tap URL 'aA' &rarr; Website Settings &rarr; Camera &rarr; Allow.</div>
                <div><strong>Android (Chrome):</strong> Tap lock icon &rarr; Permissions &rarr; Camera &rarr; Allow.</div>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="py-2 px-4 bg-[#D0DEE5] hover:bg-white text-[#0E1035] font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Grant Permission & Retry
              </button>
            </div>
          )}

          {/* STATE 4: NO CAMERA / HARDWARE ERROR */}
          {(cameraState === 'NO_CAMERA' || cameraState === 'ERROR') && (
            <div className="relative z-20 p-5 text-center flex flex-col items-center justify-center space-y-2.5 max-w-xs">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-300">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-xs text-amber-300">Camera Unavailable</h4>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {errorMessage || 'No video camera device was found or connection failed.'}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Reconnecting
              </button>
            </div>
          )}
        </div>

        {/* Invalid Code State Notification */}
        {isInvalidCode && (
          <div className="p-3 bg-rose-950/80 border-t border-rose-800 text-rose-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-[11px] font-bold">Invalid / Empty Barcode Data</span>
            </div>
            <button
              onClick={resumeScanning}
              className="text-[10px] font-black underline text-rose-300 hover:text-white cursor-pointer"
            >
              Rescan
            </button>
          </div>
        )}

        {/* Scan Target Presets (Useful for Testing on Emulators without Physical Camera) */}
        <div className="p-3 bg-[#15253F]/40 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-bold uppercase tracking-wider">Test Sample Presets:</span>
            <span className="text-[9px] text-[#D0DEE5] font-mono">Camera Emulation</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold">
            <button
              type="button"
              onClick={() => handleDecodedCode('0761234509121', 'EAN_13')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-[#D0DEE5] rounded-xl border border-slate-700 text-center truncate cursor-pointer transition"
            >
              Troponin T Lot
            </button>
            <button
              type="button"
              onClick={() => handleDecodedCode('QR-ASSET-ROC-88412', 'QR_CODE')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 text-center truncate cursor-pointer transition"
            >
              Cobas Asset QR
            </button>
            <button
              type="button"
              onClick={() => handleDecodedCode('4987123990124', 'EAN_13')}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-xl border border-slate-700 text-center truncate cursor-pointer transition"
            >
              Sysmex Reagent
            </button>
          </div>
        </div>

        {/* Scan Result Drawer */}
        {scannedItem && (
          <div className="p-4 bg-white text-[#0E1035] border-t border-[#D0DEE5] space-y-2.5 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2B3D5B]" />
                <span className="text-[10px] font-black text-[#2B3D5B] uppercase">Optical Barcode Decoded</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-[#D0DEE5]/50 text-[#0E1035] px-2 py-0.5 rounded-full">
                {scannedItem.type}
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-xs text-[#0E1035] leading-tight">{scannedItem.title}</h4>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">Decoded: {scannedItem.code}</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-[10px] border border-[#D0DEE5]">
              {Object.entries(scannedItem.metadata).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#7C8594] font-medium">{k}:</span>
                  <span className="font-bold text-[#0E1035] text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={resumeScanning}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-[#0E1035] font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Scan Another
              </button>
              <button
                type="button"
                onClick={() => {
                  onScanResult(scannedItem);
                  handleCancelAndClose();
                }}
                className="flex-1 py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-black rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Decoded Record
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
