import React from 'react';
import {
  X,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  Calendar,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { DigitalDocument } from '../customerAppTypes';
import { ThemePalette } from '../../../utils/themeSystem';

interface DocumentPreviewModalProps {
  document: DigitalDocument | null;
  theme: ThemePalette;
  onClose: () => void;
  onDownload: (doc: DigitalDocument) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  theme,
  onClose,
  onDownload
}) => {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5]"
      >
        {/* Header */}
        <div 
          className="p-4 text-white flex items-center justify-between shadow-md bg-[#0E1035]"
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white/10 text-[#D0DEE5]"
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-white/70 uppercase font-mono tracking-wider">
                {document.category.replace('_', ' ')}
              </div>
              <h3 className="text-xs font-black text-white truncate max-w-[260px]">{document.title}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document Simulated Sheet / Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-xs bg-slate-50">
          {/* Certificate / Sheet Container */}
          <div className="bg-white rounded-2xl border-2 border-[#D0DEE5] p-4 shadow-sm space-y-3.5 relative overflow-hidden">
            {/* Background Seal Watermark */}
            <div className="absolute right-2 bottom-2 text-slate-100 -rotate-12 pointer-events-none select-none font-black text-6xl opacity-40">
              VERIFIED
            </div>

            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-[#D0DEE5] pb-3">
              <div>
                <div className="text-[10px] font-black text-[#0E1035] tracking-tight uppercase">
                  A2Z Diagnostic Services India Pvt Ltd
                </div>
                <div className="text-[9px] text-[#7C8594]">
                  Quality Assurance & Metrology Division &bull; ISO 9001 / ISO 13485
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold bg-[#D0DEE5]/60 text-[#0E1035] px-2 py-0.5 rounded-full">
                OFFICIAL COPY
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-[#D0DEE5]">
              <div>
                <span className="text-[#7C8594] block">Document Ref:</span>
                <span className="font-mono font-extrabold text-[#0E1035]">{document.referenceNumber}</span>
              </div>
              <div>
                <span className="text-[#7C8594] block">Date Issued:</span>
                <span className="font-bold text-[#0E1035]">{document.date}</span>
              </div>
              {document.expiryDate && (
                <div>
                  <span className="text-[#7C8594] block">Validity Expiry:</span>
                  <span className="font-bold text-amber-800">{document.expiryDate}</span>
                </div>
              )}
              {document.relatedEquipmentName && (
                <div>
                  <span className="text-[#7C8594] block">Target Instrument:</span>
                  <span className="font-bold text-[#0E1035] truncate block">{document.relatedEquipmentName}</span>
                </div>
              )}
              {document.batchNumber && (
                <div>
                  <span className="text-[#7C8594] block">Material Batch:</span>
                  <span className="font-mono font-bold text-[#0E1035]">{document.batchNumber}</span>
                </div>
              )}
              <div>
                <span className="text-[#7C8594] block">File Size:</span>
                <span className="font-bold text-[#0E1035]">{document.fileSize}</span>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="p-3 bg-[#D0DEE5]/30 rounded-xl border border-[#D0DEE5] flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0E1035]" />
                <div>
                  <div className="font-black text-[#0E1035]">Digitally Signed & Tamper Evident</div>
                  <div className="text-[9px] text-[#7C8594]">Issued by: {document.issuedBy}</div>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#0E1035]" />
            </div>

            <p className="text-[10px] text-[#7C8594] leading-relaxed italic border-t border-slate-100 pt-2">
              This digital document is archived in the A2Z Enterprise Laboratory Vault and conforms to 
              regulatory audit compliance standards under CAP, NABL, and ISO 15189.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-[#D0DEE5] flex items-center gap-2">
          <button
            onClick={() => onDownload(document)}
            className="flex-1 py-2.5 px-3 bg-[#0E1035] hover:bg-[#15253F] text-white font-black rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF ({document.fileSize})
          </button>
        </div>
      </div>
    </div>
  );
};
