import React, { useState } from 'react';
import {
  X,
  Building2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Sliders,
  Phone,
  Mail,
  MapPin,
  Globe
} from 'lucide-react';
import { QuotationSettings } from '../../types/quotationTypes';

interface QuotationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuotationSettings;
  onSaveSuccess: (updatedSettings: QuotationSettings) => void;
  token?: string | null;
}

export const QuotationSettingsModal: React.FC<QuotationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSuccess,
  token
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<QuotationSettings>({ ...settings });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (field: keyof QuotationSettings, val: any) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/quotations/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update quotation settings');
      }
      onSaveSuccess(data.settings);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error saving settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col w-full max-w-3xl my-auto text-slate-100 text-xs">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Quotation Letterhead, Signatures & Standard Terms
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                  Super Admin
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure official company letterhead branding, stamp & signature images, and standardized terms.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-4">
          
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Company Details for Letterhead */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="border-b border-slate-800 pb-2 font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-400" />
              Official Company Letterhead Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Display Brand Name *</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Legal Entity Name</label>
                <input
                  type="text"
                  value={form.companyLegalName || ''}
                  onChange={(e) => handleChange('companyLegalName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Registered Address Line 1</label>
              <input
                type="text"
                value={form.companyAddressLine1}
                onChange={(e) => handleChange('companyAddressLine1', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">City</label>
                <input
                  type="text"
                  value={form.companyCity}
                  onChange={(e) => handleChange('companyCity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">State</label>
                <input
                  type="text"
                  value={form.companyState}
                  onChange={(e) => handleChange('companyState', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Pincode</label>
                <input
                  type="text"
                  value={form.companyPincode}
                  onChange={(e) => handleChange('companyPincode', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">State Code</label>
                <input
                  type="text"
                  value={form.companyStateCode}
                  onChange={(e) => handleChange('companyStateCode', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">GSTIN / UIN *</label>
                <input
                  type="text"
                  value={form.companyGstin}
                  onChange={(e) => handleChange('companyGstin', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white uppercase focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Contact Phone</label>
                <input
                  type="text"
                  value={form.companyPhone}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Official Email</label>
                <input
                  type="email"
                  value={form.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Company Logo Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={form.companyLogoUrl || ''}
                onChange={(e) => handleChange('companyLogoUrl', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>
          </div>

          {/* Section 2: Authorized Signatory & Company Stamp */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="border-b border-slate-800 pb-2 font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Authorized Signatory and Official Stamp
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Signatory Full Name *</label>
                <input
                  type="text"
                  value={form.authorizedSignatoryName}
                  onChange={(e) => handleChange('authorizedSignatoryName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Official Designation *</label>
                <input
                  type="text"
                  value={form.authorizedSignatoryDesignation}
                  onChange={(e) => handleChange('authorizedSignatoryDesignation', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Signature Image URL (PNG/Transparent)</label>
                <input
                  type="text"
                  placeholder="https://example.com/signature.png"
                  value={form.signatureImageUrl || ''}
                  onChange={(e) => handleChange('signatureImageUrl', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Company Stamp Image URL (PNG)</label>
                <input
                  type="text"
                  placeholder="https://example.com/stamp.png"
                  value={form.stampImageUrl || ''}
                  onChange={(e) => handleChange('stampImageUrl', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Standard Terms and Conditions */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="border-b border-slate-800 pb-2 font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Standard Terms & Conditions (Pre-populated in new quotations)
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Standard Payment Terms</label>
              <textarea
                rows={2}
                value={form.standardPaymentTerms}
                onChange={(e) => handleChange('standardPaymentTerms', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Standard Delivery Terms</label>
              <textarea
                rows={2}
                value={form.standardDeliveryTerms}
                onChange={(e) => handleChange('standardDeliveryTerms', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Standard Warranty Terms</label>
              <textarea
                rows={2}
                value={form.standardWarrantyTerms}
                onChange={(e) => handleChange('standardWarrantyTerms', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Standard Validity Terms</label>
              <input
                type="text"
                value={form.standardValidityTerms}
                onChange={(e) => handleChange('standardValidityTerms', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Standard Default Notes</label>
              <textarea
                rows={2}
                value={form.standardDefaultNotes}
                onChange={(e) => handleChange('standardDefaultNotes', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

