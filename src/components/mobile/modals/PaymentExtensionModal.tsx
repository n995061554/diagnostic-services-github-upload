import React, { useState } from 'react';
import { X, Clock, Calendar, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ExtensionReason, PaymentExtensionRequest } from '../customerAppTypes';
import { formatINR } from '../mobileMockData';
import { ThemePalette } from '../../../utils/themeSystem';

interface PaymentExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  outstandingAmount: number;
  dueDate: string;
  invoiceNumber?: string;
  onSubmit: (data: {
    requestedDays: 5 | 10 | 15 | 30;
    reason: ExtensionReason;
    explanation: string;
  }) => Promise<boolean>;
}

const EXTENSION_REASONS: ExtensionReason[] = [
  'Cheque not ready',
  'Signature not done',
  'Doctor unavailable',
  'Accounts approval pending',
  'Payment processing delay',
  'Internal approval pending',
  'Other'
];

export const PaymentExtensionModal: React.FC<PaymentExtensionModalProps> = ({
  isOpen,
  onClose,
  outstandingAmount,
  dueDate,
  invoiceNumber = 'INV-2026-8812',
  onSubmit
}) => {
  const [requestedDays, setRequestedDays] = useState<5 | 10 | 15 | 30>(10);
  const [reason, setReason] = useState<ExtensionReason>('Cheque not ready');
  const [explanation, setExplanation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await onSubmit({
      requestedDays,
      reason,
      explanation
    });
    setIsSubmitting(false);
    if (success) {
      setSuccessMessage('Payment extension request submitted. Under review by back office.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#D0DEE5] shadow-2xl w-full max-w-sm overflow-hidden text-xs">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D0DEE5]/20 flex items-center justify-center text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Request Payment Extension</h3>
              <p className="text-[10px] text-[#D0DEE5]">Grace Period Approval Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {successMessage ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-extrabold text-sm text-[#0E1035]">Request Lodged Successfully</h4>
            <p className="text-[11px] text-[#7C8594]">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
            {/* Account Details Summary */}
            <div className="p-3 bg-[#D0DEE5]/20 border border-[#D0DEE5] rounded-2xl space-y-1 text-[11px]">
              <div className="flex justify-between text-[#7C8594]">
                <span>Invoice / Account:</span>
                <span className="font-mono font-bold text-[#0E1035]">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-[#7C8594]">
                <span>Outstanding Amount:</span>
                <span className="font-mono font-bold text-[#0E1035]">₹{formatINR(outstandingAmount)}</span>
              </div>
              <div className="flex justify-between text-[#7C8594]">
                <span>Original Due Date:</span>
                <span className="font-bold text-[#0E1035]">{dueDate}</span>
              </div>
            </div>

            {/* Requested Days Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[#7C8594] block">
                Requested Extension Days
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([5, 10, 15, 30] as const).map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRequestedDays(days)}
                    className={`py-2 rounded-xl font-black text-xs border transition cursor-pointer ${
                      requestedDays === days
                        ? 'bg-[#0E1035] text-white border-[#0E1035] shadow-xs'
                        : 'bg-white text-[#7C8594] border-[#D0DEE5] hover:bg-slate-50'
                    }`}
                  >
                    +{days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#7C8594] block">
                Operational Reason
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as ExtensionReason)}
                className="w-full p-2.5 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-semibold text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
              >
                {EXTENSION_REASONS.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Explanation Note */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#7C8594] block">
                Short Explanation & Commitment Note
              </label>
              <textarea
                value={explanation}
                onChange={e => setExplanation(e.target.value)}
                placeholder="Explain the reason for delay and provide expected date..."
                rows={2}
                className="w-full p-2.5 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
              />
            </div>

            {/* Penalty Reminder Notice */}
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[10px] text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Approved grace period deductions apply at <strong>0.50 wallet points/day</strong> (reduced from standard 1.0 pt/day).
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#7C8594] rounded-xl font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl font-black text-xs cursor-pointer shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
