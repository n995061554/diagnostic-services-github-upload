/**
 * BACK OFFICE ACCOUNTING & INVOICE SETTINGS
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Implements comprehensive configuration for:
 * 1. Company & Statutory Tax Registration (GSTIN, PAN, State Code, Addresses)
 * 2. Server-Authoritative Invoice Numbering Series per Document Type
 * 3. Tally Sales & Voucher Configuration (HSN/SAC, GST, Discount visibility)
 * 4. Supplementary Delivery Note & Dispatch Details Configuration
 * 5. Print Layout, Copies & Signatory Settings
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Receipt,
  Percent,
  Hash,
  Save,
  CheckCircle2,
  AlertCircle,
  Printer,
  Truck,
  ShieldCheck,
  FileText,
  DollarSign,
  HelpCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  AccountingSettings,
  DocumentType,
  FinancialYearFormat,
  InvoiceNumberingConfig
} from '../../../server/accounting/accountingTypes';

interface AccountingSettingsTabProps {
  token?: string | null;
}

export const AccountingSettingsTab: React.FC<AccountingSettingsTabProps> = ({ token }) => {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'numbering' | 'columns' | 'dispatch' | 'print'>('numbering');
  const [settings, setSettings] = useState<AccountingSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active docType for numbering editor
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('TAX_INVOICE');
  const [numberPreview, setNumberPreview] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/accounting/settings', { headers });
      const json = await res.json();
      if (json.data) {
        setSettings(json.data);
      } else {
        throw new Error(json.message || 'Failed to retrieve accounting settings');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumberPreview = async (docType: DocumentType) => {
    setPreviewLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/v1/accounting/settings/next-number?docType=${docType}`, { headers });
      const json = await res.json();
      if (json.data?.previewNumber) {
        setNumberPreview(json.data.previewNumber);
      }
    } catch (e) {
      console.error('Error fetching preview number:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (settings) {
      fetchNextNumberPreview(selectedDocType);
    }
  }, [selectedDocType, settings?.numberingConfigs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/accounting/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save settings');
      }

      setSettings(json.data);
      setSuccessMsg('Accounting & Invoice Configuration updated successfully. Audit event recorded.');
      fetchNextNumberPreview(selectedDocType);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Loading authoritative accounting settings...</span>
      </div>
    );
  }

  const currentNumberConfig: InvoiceNumberingConfig = settings.numberingConfigs?.[selectedDocType] || {
    prefix: selectedDocType === 'DELIVERY_NOTE' ? 'DN-' : selectedDocType === 'PROFORMA_INVOICE' ? 'PI-' : selectedDocType === 'CREDIT_NOTE' ? 'CN-' : 'SINV-',
    financialYearFormat: 'YY-YY',
    separator: '/',
    startingNumber: 1001,
    padding: 4,
    currentSequence: 1001,
    resetOnFinancialYear: true
  };

  const updateNumberConfig = (field: keyof InvoiceNumberingConfig, value: any) => {
    setSettings(prev => {
      if (!prev) return prev;
      const existingConfigs = prev.numberingConfigs || {} as any;
      return {
        ...prev,
        numberingConfigs: {
          ...existingConfigs,
          [selectedDocType]: {
            ...currentNumberConfig,
            [field]: value
          }
        }
      };
    });
  };

  const updatePrintConfig = (field: string, value: any) => {
    setSettings(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        printConfig: {
          ...(prev.printConfig || {}),
          [field]: value
        }
      };
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Tally-Style Accounting & Invoice Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure server-authoritative numbering series, print layouts, tax rules, and dispatch fields.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'numbering', label: 'Voucher Numbering Series', icon: Hash },
          { id: 'columns', label: 'Item & Tax Columns (Sales Config)', icon: Receipt },
          { id: 'dispatch', label: 'Delivery & Transport Details', icon: Truck },
          { id: 'print', label: 'Print & Copy Layout', icon: Printer },
          { id: 'company', label: 'Statutory & Company Details', icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* TAB 1: VOUCHER NUMBERING SERIES */}
        {activeSubTab === 'numbering' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-emerald-400" />
                  <span>Configurable Server-Authoritative Document Numbering</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Transactional sequential numbering guaranteed on server with financial year boundaries.
                </p>
              </div>

              {/* Document Type Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['TAX_INVOICE', 'PROFORMA_INVOICE', 'DELIVERY_NOTE', 'CREDIT_NOTE'] as DocumentType[]).map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => setSelectedDocType(doc)}
                    className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                      selectedDocType === doc ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {doc === 'TAX_INVOICE' ? 'Tax Invoice' : doc === 'PROFORMA_INVOICE' ? 'Proforma' : doc === 'DELIVERY_NOTE' ? 'Delivery Note' : 'Credit Note'}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Next Document Number Preview</span>
                <div className="text-lg font-mono font-black text-emerald-400 mt-0.5 flex items-center gap-2">
                  <span>{previewLoading ? 'Generating preview...' : numberPreview || 'Previewing...'}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 font-sans">
                    Server Authoritative
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400">
                Document Type: <span className="text-white font-semibold">{selectedDocType}</span>
              </div>
            </div>

            {/* Form Fields for Selected Document Number Series */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Series Prefix</label>
                <input
                  type="text"
                  value={currentNumberConfig.prefix}
                  onChange={(e) => updateNumberConfig('prefix', e.target.value)}
                  placeholder="e.g. SINV-"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Optional Suffix</label>
                <input
                  type="text"
                  value={currentNumberConfig.suffix || ''}
                  onChange={(e) => updateNumberConfig('suffix', e.target.value)}
                  placeholder="e.g. /HO"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Separator</label>
                <input
                  type="text"
                  value={currentNumberConfig.separator || '/'}
                  onChange={(e) => updateNumberConfig('separator', e.target.value)}
                  placeholder="/"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Financial Year Format</label>
                <select
                  value={currentNumberConfig.financialYearFormat}
                  onChange={(e) => updateNumberConfig('financialYearFormat', e.target.value as FinancialYearFormat)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="YY-YY">YY-YY (e.g. 26-27)</option>
                  <option value="YYYY-YYYY">YYYY-YYYY (e.g. 2026-2027)</option>
                  <option value="YY">YY (e.g. 26)</option>
                  <option value="NONE">None (Omit FY)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Starting Number</label>
                <input
                  type="number"
                  value={currentNumberConfig.startingNumber}
                  onChange={(e) => updateNumberConfig('startingNumber', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Digit Padding</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={currentNumberConfig.padding}
                  onChange={(e) => updateNumberConfig('padding', parseInt(e.target.value) || 4)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(currentNumberConfig.resetOnFinancialYear)}
                  onChange={(e) => updateNumberConfig('resetOnFinancialYear', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span>Automatically reset sequence number to starting value on Financial Year boundary (April 1st)</span>
              </label>

              <div className="text-[11px] font-mono text-slate-400">
                Current Sequence: <span className="text-white font-bold">{currentNumberConfig.currentSequence}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ITEM & TAX COLUMNS (SALES CONFIG) */}
        {activeSubTab === 'columns' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Invoice / Sales Voucher Entry Column Configuration</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enable or disable standard columns in voucher line-item entry matching Tally reference `sales_config1.gif` and `05-Inv-Orders-Entry1.gif`.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { key: 'showHsnColumn', label: 'Show HSN / SAC Code Column', desc: 'Displays 8-digit HSN or 6-digit SAC column for statutory GST filing' },
                { key: 'showGstRateColumn', label: 'Show GST % & Tax Rate Column', desc: 'Displays applicable CGST, SGST, or IGST rate breakdown' },
                { key: 'showDiscountColumn', label: 'Show Discount % and Amount Column', desc: 'Allows line-item trade discount entry' },
                { key: 'showBatchDetails', label: 'Show Batch / Lot & Expiry Details', desc: 'Mandatory for IVD reagents, controls, and cold-chain diagnostics' },
                { key: 'showStorageTemp', label: 'Show Storage Temperature / Cold-Chain Tag', desc: 'Flags 2-8°C refrigerated storage products on lines' },
                { key: 'showVehicleDetails', label: 'Provide Motor Vehicle / LR Number', desc: 'Captures transport dispatch vehicle registration for e-Way bills' }
              ].map(item => (
                <div key={item.key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={Boolean((settings.printConfig as any)?.[item.key] ?? true)}
                    onChange={(e) => updatePrintConfig(item.key, e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <label htmlFor={item.key} className="text-xs font-semibold text-white cursor-pointer">
                      {item.label}
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Default Pricing Mode */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Default Pricing Mode</label>
                <select
                  value={settings.defaultPricingMode || 'TAX_EXCLUSIVE'}
                  onChange={(e) => setSettings({ ...settings, defaultPricingMode: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="TAX_EXCLUSIVE">Tax-Exclusive (Rates exclude GST, tax added at line total)</option>
                  <option value="TAX_INCLUSIVE">Tax-Inclusive (Rates include GST, tax back-calculated)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Invoice Total Rounding Policy</label>
                <select
                  value={settings.roundingPolicy || 'NEAREST_RUPEE'}
                  onChange={(e) => setSettings({ ...settings, roundingPolicy: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEAREST_RUPEE">Round off to nearest ₹1 (Standard Indian Accounting)</option>
                  <option value="EXACT_PAISE">Exact Paise (No automatic rounding)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DELIVERY & DISPATCH DETAILS */}
        {activeSubTab === 'dispatch' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Supplementary Delivery Note & Order Details (Reference: `16-Delivery-Note-1.gif`)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Toggle supplementary dispatch information captured in Delivery Notes and Invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { key: 'showDispatchDetails', label: 'Print Dispatch Details (Dispatched through, Destination)', desc: 'Prints courier/transport name and final delivery destination' },
                { key: 'showOrderDetails', label: "Print Order Details (Buyer's Order No. & Date)", desc: 'Prints customer lab purchase order reference and date' },
                { key: 'showTermsOfDelivery', label: 'Print Terms of Delivery', desc: 'Prints delivery terms like FOR Destination, Door Delivery, or Cold-Chain Protocol' },
                { key: 'showEwayBill', label: 'Provide e-Way Bill Number Field', desc: 'Allows recording mandatory 12-digit e-Way Bill for consignments over ₹50,000' }
              ].map(item => (
                <div key={item.key} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={item.key}
                    checked={Boolean((settings.printConfig as any)?.[item.key] ?? true)}
                    onChange={(e) => updatePrintConfig(item.key, e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <label htmlFor={item.key} className="text-xs font-semibold text-white cursor-pointer">
                      {item.label}
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Default Terms of Delivery & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Default Terms of Delivery</label>
                <textarea
                  rows={2}
                  value={settings.printConfig?.defaultTermsOfDelivery || 'Door Delivery with Validated 2-8°C Cold Chain Packaging'}
                  onChange={(e) => updatePrintConfig('defaultTermsOfDelivery', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Default Mode / Terms of Payment</label>
                <textarea
                  rows={2}
                  value={settings.printConfig?.defaultPaymentTerms || '30 Days Net Credit against invoice'}
                  onChange={(e) => updatePrintConfig('defaultPaymentTerms', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRINT & COPY LAYOUT */}
        {activeSubTab === 'print' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Invoice & Delivery Note Print Layout (Reference: `invoice-preview-in-tally.jpg`)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure Tally 2-column header box, page dimensions, number of copies, and statutory declaration.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Paper Size</label>
                <select
                  value={settings.printConfig?.paperSize || 'A4'}
                  onChange={(e) => updatePrintConfig('paperSize', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="A4">A4 (Standard 210 x 297 mm)</option>
                  <option value="LETTER">Letter (8.5 x 11 in)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Orientation</label>
                <select
                  value={settings.printConfig?.orientation || 'PORTRAIT'}
                  onChange={(e) => updatePrintConfig('orientation', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="PORTRAIT">Portrait</option>
                  <option value="LANDSCAPE">Landscape</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Number of Print Copies</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={settings.printConfig?.numberOfCopies || 3}
                  onChange={(e) => updatePrintConfig('numberOfCopies', parseInt(e.target.value) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bank Details for Direct Payment */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mt-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-emerald-400">
                Company Bank Details (Printed on Invoice Footer)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.bankName || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...(settings.bankDetails || {} as any), bankName: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.accountNumber || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...(settings.bankDetails || {} as any), accountNumber: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.ifscCode || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...(settings.bankDetails || {} as any), ifscCode: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.branch || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...(settings.bankDetails || {} as any), branch: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Declaration & Signatory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Statutory Tax Declaration</label>
                <textarea
                  rows={3}
                  value={settings.printConfig?.declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                  onChange={(e) => updatePrintConfig('declaration', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Authorized Signatory Title</label>
                <input
                  type="text"
                  value={settings.printConfig?.signatoryTitle || 'for A2Z Diagnostic Services India Pvt Ltd (Authorised Signatory)'}
                  onChange={(e) => updatePrintConfig('signatoryTitle', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 mb-3"
                />
                <label className="block text-slate-400 text-xs mb-1 font-medium">Invoice Footer Note</label>
                <input
                  type="text"
                  value={settings.printConfig?.footerNote || 'SUBJECT TO MUMBAI JURISDICTION • This is a Computer Generated Document'}
                  onChange={(e) => updatePrintConfig('footerNote', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STATUTORY & COMPANY DETAILS */}
        {activeSubTab === 'company' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Company Identity & Statutory Tax Registration</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Legal entity name, GSTIN, PAN, and corporate billing address for sales invoicing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Legal Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Trade Name (if different)</label>
                <input
                  type="text"
                  value={settings.tradeName || settings.companyName}
                  onChange={(e) => setSettings({ ...settings, tradeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">GSTIN (15 Digits)</label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Permanent Account Number (PAN)</label>
                <input
                  type="text"
                  value={settings.pan}
                  onChange={(e) => setSettings({ ...settings, pan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">State & State Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.state}
                    onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                    className="w-3/4 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={settings.stateCode}
                    onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                    placeholder="Code"
                    className="w-1/4 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">CIN (Corporate Identity No)</label>
                <input
                  type="text"
                  value={settings.cin || ''}
                  onChange={(e) => setSettings({ ...settings, cin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">Registered Address (Line 1 & 2)</label>
                <textarea
                  rows={2}
                  value={settings.address?.line1 || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    address: { ...(settings.address || {} as any), line1: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1 font-medium">City, Pincode & Contacts</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={settings.address?.city || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      address: { ...(settings.address || {} as any), city: e.target.value }
                    })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={settings.address?.pincode || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      address: { ...(settings.address || {} as any), pincode: e.target.value }
                    })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Email"
                    value={settings.contacts?.email || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      contacts: { ...(settings.contacts || {} as any), email: e.target.value }
                    })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={settings.contacts?.phone || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      contacts: { ...(settings.contacts || {} as any), phone: e.target.value }
                    })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            * Changes are persisted to the authoritative store and recorded in the audit trail.
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Configuration...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
