import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, X, ShieldAlert, Sparkles, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../utils/offlineMediaStorage';

interface LabVisitCameraCaptureProps {
  onPhotoCaptured: (photoBlob: Blob, previewUrl: string) => void;
  onCancel?: () => void;
  requiredLabel?: string;
  initialPreviewUrl?: string;
}

export const LabVisitCameraCapture: React.FC<LabVisitCameraCaptureProps> = ({
  onPhotoCaptured,
  onCancel,
  requiredLabel = 'Mandatory Lab Visit Selfie & Name Board Photo',
  initialPreviewUrl,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Direct camera API is not supported in this browser. Please use the file selector.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        err?.message || 'Could not access device camera. Please allow camera permissions or upload using device gallery.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const takePhoto = async () => {
    if (!videoRef.current) return;
    setIsCompressing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas rendering context unavailable');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setCameraError('Failed to capture image snapshot.');
            setIsCompressing(false);
            return;
          }

          const compressed = await compressImage(blob, 1600, 0.8);
          const url = URL.createObjectURL(compressed);
          setCapturedBlob(compressed);
          setPreviewUrl(url);
          stopCamera();
          setIsCompressing(false);
        },
        'image/jpeg',
        0.85
      );
    } catch (err: any) {
      setCameraError(err?.message || 'Error capturing photograph.');
      setIsCompressing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPEG, PNG).');
      return;
    }

    setIsCompressing(true);
    setCameraError(null);
    try {
      const compressed = await compressImage(file, 1600, 0.8);
      const url = URL.createObjectURL(compressed);
      setCapturedBlob(compressed);
      setPreviewUrl(url);
      stopCamera();
    } catch (err: any) {
      setCameraError('Error processing selected image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRetake = () => {
    if (previewUrl && !initialPreviewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedBlob && previewUrl) {
      onPhotoCaptured(capturedBlob, previewUrl);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{requiredLabel}</h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Requirement Notice */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Mandatory Dual-Subject Verification:</strong> Photograph must capture{' '}
          <span className="underline font-semibold">both your face</span> and the{' '}
          <span className="underline font-semibold">laboratory name board</span> together. Form cannot be submitted without this photograph.
        </div>
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Viewport / Preview State */}
      <div className="relative aspect-4/3 w-full max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* State A: Photo Preview */}
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img src={previewUrl} alt="Visit Photo Preview" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Photograph Attached</span>
            </div>
          </div>
        ) : isCameraActive ? (
          /* State B: Live Video Viewfinder with Alignment Guides */
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

            {/* Viewfinder Overlays */}
            <div className="absolute inset-0 pointer-events-none flex">
              {/* Left Guide: Sales Face */}
              <div className="flex-1 flex flex-col items-center justify-center border-r border-dashed border-white/40 p-2">
                <div className="w-24 h-32 rounded-full border-2 border-indigo-400/80 bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-slate-950/70 px-2 py-0.5 rounded">Your Face</span>
                </div>
              </div>
              {/* Right Guide: Lab Sign */}
              <div className="flex-1 flex flex-col items-center justify-center p-2">
                <div className="w-36 h-28 rounded-xl border-2 border-emerald-400/80 bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-slate-950/70 px-2 py-0.5 rounded">Lab Signage</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
              <span className="text-[11px] font-semibold text-white bg-slate-900/80 px-3 py-1 rounded-full shadow">
                Align face on left and lab name on right
              </span>
            </div>
          </div>
        ) : (
          /* State C: Idle Prompt */
          <div className="text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Device Camera Ready</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Activate camera or select photo from device storage</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Device Gallery</span>
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Input Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2">
        {isCameraActive ? (
          <div className="flex items-center gap-2 w-full justify-center">
            <button
              type="button"
              disabled={isCompressing}
              onClick={takePhoto}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{isCompressing ? 'Compressing...' : 'Capture Photo'}</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : previewUrl ? (
          <div className="flex items-center gap-2 w-full justify-between">
            <button
              type="button"
              onClick={handleRetake}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retake Photo</span>
            </button>
            {capturedBlob && (
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Attach Photo</span>
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Visual Verification Disclaimer */}
      <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center italic">
        * Upload verifies file presence, resolution, and integrity. Compliance of face and lab signage visibility is subject to supervisor administrative review.
      </p>
    </div>
  );
};
