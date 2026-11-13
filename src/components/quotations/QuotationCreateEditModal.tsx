import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  Building2,
  FileText,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Tag,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Quotation, QuotationItem, QuotationSettings, GstRate } from '../../types/quotationTypes';

interface QuotationCreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: Quotation | null;
  settings?: QuotationSettings | null;
  onSaveSuccess: (savedQuotation: Quotation) => void;
  token?: string | null;
}

export const QuotationCreateEditModal: React.FC<QuotationCreateEditModalProps> = ({
  isOpen,
  onClose,
  quotationToEdit,
  settings,
  onSaveSuccess,
  token
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(quotationToEdit);

  // Form State
  const [quotationNumber, setQuotationNumber] = useState<string>(
    quotationToEdit?.quotationNumber || `${settings?.prefix || 'DS-QT-2026-'}${settings?.nextSequence || 1003}`
  );
  const [quotationDate, setQuotationDate] = useState<string>(
    quotationToEdit?.quotationDate || new Date().toISOString().split('T')[0]
  );
  const [validUntilDate, setValidUntilDate] = useState<string>(
    quotationToEdit?.validUntilDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Customer State
  const [customerId, setCustomerId] = useState<string>(quotationToEdit?.customerId || '');
  const [customerName, setCustomerName] = useState<string>(quotationToEdit?.customerName || '');
  const [customerAddress, setCustomerAddress] = useState<string>(quotationToEdit?.customerAddress || '');
  const [customerPhone, setCustomerPhone] = useState<string>(quotationToEdit?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(quotationToEdit?.customerEmail || '');
  const [customerGstin, setCustomerGstin] = useState<string>(quotationToEdit?.customerGstin || '');
  const [customerState, setCustomerState] = useState<string>(quotationToEdit?.customerState || 'Gujarat');
  const [customerStateCode, setCustomerStateCode] = useState<string>(quotationToEdit?.customerStateCode || '24');

  // Metadata
  const [subject, setSubject] = useState<string>(
    quotationToEdit?.subject || 'Quotation for Clinical Diagnostic Reagents & Laboratory Consumables'
  );
  const [reference, setReference] = useState<string>(quotationToEdit?.reference || '');

  // Line items state
  const [items, setItems] = useState<QuotationItem[]>(
    quotationToEdit?.items && quotationToEdit.items.length > 0
      ? quotationToEdit.items
      : [
          {
            id: `item-${Date.now()}-1`,
            productName: '',
            productDescription: '',
            unitPrice: 0,
            quantity: 1,
            taxableValue: 0,
            gstRate: 12,
            gstAmount: 0,
            totalAmount: 0,
            hsnCode: '38220090'
          }
        ]
  );

  // Terms and Notes state
  const [notes, setNotes] = useState<string>(
    quotationToEdit?.notes !== undefined
      ? quotationToEdit.notes
      : settings?.standardDefaultNotes || 'Prices valid for quarterly supply agreement. Includes lot calibration support.'
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(
    quotationToEdit?.paymentTerms !== undefined
      ? quotationToEdit.paymentTerms
      : settings?.standardPaymentTerms || 'Payment strictly within 30 days of invoice date via RTGS / NEFT.'
  );
  const [deliveryTerms, setDeliveryTerms] = useState<string>(
    quotationToEdit?.deliveryTerms !== undefined
      ? quotationToEdit.deliveryTerms
      : settings?.standardDeliveryTerms || 'Standard dispatch within 24 to 48 hours from our central warehouse.'
  );
  const [warrantyTerms, setWarrantyTerms] = useState<string>(
    quotationToEdit?.warrantyTerms !== undefined
      ? quotationToEdit.warrantyTerms
      : settings?.standardWarrantyTerms || '12 months standard OEM manufacturer warranty on instruments.'
  );
  const [validityTerms, setValidityTerms] = useState<string>(
    quotationToEdit?.validityTerms !== undefined
      ? quotationToEdit.validityTerms
      : settings?.standardValidityTerms || 'Valid for 30 calendar days from date of issue.'
  );

  // Option A vs Option B default
  const [hasLetterhead, setHasLetterhead] = useState<boolean>(
    quotationToEdit?.hasLetterhead !== undefined ? quotationToEdit.hasLetterhead : true
  );

  // Controlled Revision Reason (if editing finalized quotation)
  const [revisionReason, setRevisionReason] = useState<string>('');
  const isFinalizedEdit = isEditing && (quotationToEdit?.status === 'FINALIZED' || quotationToEdit?.status === 'SENT');

  // Available Presets for quick customer autofill
  const customerPresets = [
    {
      id: 'u-cust-01',
      name: 'Apex Clinical & Pathology Laboratories',
      address: '402 Medical Arts Building, Relief Road, Ahmedabad, Gujarat - 380001',
      phone: '+91 98250 11223',
      email: 'purchase@apexclinical.com',
      gstin: '24AAACA1234A1Z5',
      state: 'Gujarat',
      stateCode: '24'
    },
    {
      id: 'u-cust-02',
      name: 'Metropolis Clinical Diagnostic Centre',
      address: 'Sunrise Complex, Floor 2, LBS Marg, Powai, Mumbai - 400076',
      phone: '+91 98765 43212',
      email: 'procurement@metropolisdiag.com',
      gstin: '27AABCM8899K1Z4',
      state: 'Maharashtra',
      stateCode: '27'
    },
    {
      id: 'u-cust-03',
      name: 'Apollo Reference Laboratories Hub',
      address: 'Near Central Mall, MG Road, Vashi, Navi Mumbai - 400703',
      phone: '+91 98200 44556',
      email: 'lab.vashi@apollolabs.com',
      gstin: '27AABCA3344J1Z8',
      state: 'Maharashtra',
      stateCode: '27'
    }
  ];

  // Available Diagnostic Product Presets for Quick Item Addition
  const productCatalogPresets = [
    { name: 'cobas c311 Albumin Gen 2 Reagent Kit (300 Tests)', price: 4200, gst: 12, hsn: '38220090' },
    { name: 'cobas c311 Bilirubin Total Reagent (250 Tests)', price: 3800, gst: 12, hsn: '38220090' },
    { name: 'C.f.a.s. Multicalibrator Clinical Chemistry (12 x 3 mL)', price: 8500, gst: 18, hsn: '38220090' },
    { name: 'M-52D Diluent for Mindray 5-Part Hematology (20 Litres)', price: 5600, gst: 12, hsn: '38220090' },
    { name: 'M-52LH Lyse Reagent for BC-5150 (500 mL x 2)', price: 4900, gst: 12, hsn: '38220090' },
    { name: 'Elecsys TSH Quantitative Immunoassay Kit (100 Tests)', price: 11200, gst: 12, hsn: '38220090' },
    { name: 'PreciControl Universal Quality Control Serum (4 x 5 mL)', price: 6200, gst: 18, hsn: '38220090' },
    { name: 'Cellpack DCL Reagent for Sysmex XN (20 Litres)', price: 6800, gst: 12, hsn: '38220090' },
    { name: 'Biomedical Clinical Centrifuge Microspin 12-Tube', price: 28500, gst: 18, hsn: '84211999' }
  ];

  const handleSelectCustomerPreset = (presetId: string) => {
    const found = customerPresets.find(c => c.id === presetId);
    if (found) {
      setCustomerId(found.id);
      setCustomerName(found.name);
      setCustomerAddress(found.address);
      setCustomerPhone(found.phone);
      setCustomerEmail(found.email);
      setCustomerGstin(found.gstin);
      setCustomerState(found.state);
      setCustomerStateCode(found.stateCode);
    }
  };

  // Update item field and recalculate line total
  const handleItemChange = (index: number, field: keyof QuotationItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'unitPrice' || field === 'quantity' || field === 'gstRate') {
      const price = Math.max(0, Number(field === 'unitPrice' ? val : item.unitPrice) || 0);
      const qty = Math.max(1, Number(field === 'quantity' ? val : item.quantity) || 1);
      const gstR = Number(field === 'gstRate' ? val : item.gstRate) || 12;

      const taxable = Math.round(price * qty * 100) / 100;
      const gstAmt = Math.round(taxable * (gstR / 100) * 100) / 100;
      const total = Math.round((taxable + gstAmt) * 100) / 100;

      item.unitPrice = price;
      item.quantity = qty;
      item.taxableValue = taxable;
      item.gstRate = gstR as GstRate;
      item.gstAmount = gstAmt;
      item.totalAmount = total;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleApplyProductPreset = (index: number, presetName: string) => {
    const p = productCatalogPresets.find(pr => pr.name === presetName);
    if (p) {
      const updated = [...items];
      const qty = updated[index]?.quantity || 1;
      const taxable = Math.round(p.price * qty * 100) / 100;
      const gstAmt = Math.round(taxable * (p.gst / 100) * 100) / 100;

      updated[index] = {
        ...updated[index],
        productName: p.name,
        unitPrice: p.price,
        gstRate: p.gst as GstRate,
        taxableValue: taxable,
        gstAmount: gstAmt,
        totalAmount: Math.round((taxable + gstAmt) * 100) / 100,
        hsnCode: p.hsn
      };
      setItems(updated);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}-${items.length + 1}`,
        productName: '',
        productDescription: '',
        unitPrice: 0,
        quantity: 1,
        taxableValue: 0,
        gstRate: 12,
        gstAmount: 0,
        totalAmount: 0,
        hsnCode: '38220090'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.taxableValue) || 0), 0);
  const totalGst = items.reduce((acc, it) => acc + (Number(it.gstAmount) || 0), 0);
  const grandTotal = Math.round((subtotal + totalGst) * 100) / 100;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (targetStatus: 'DRAFT' | 'FINALIZED') => {
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter or select a Customer Name.');
      return;
    }
    if (items.length === 0 || !items.some(it => it.productName.trim())) {
      setErrorMessage('Please provide at least one valid Product row with name and price.');
      return;
    }
    if (isFinalizedEdit && !revisionReason.trim()) {
      setErrorMessage('A revision reason is mandatory when modifying an already finalized quotation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        quotationDate,
        validUntilDate,
        customerId: customerId || undefined,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        customerState: customerState.trim() || undefined,
        customerStateCode: customerStateCode.trim() || undefined,
        subject: subject.trim(),
        reference: reference.trim() || undefined,
        items,
        notes,
        paymentTerms,
        deliveryTerms,
        warrantyTerms,
        validityTerms,
        hasLetterhead,
        status: targetStatus,
        revisionReason: revisionReason.trim() || undefined
      };

      const url = isEditing ? `/api/v1/quotations/${quotationToEdit.id}` : '/api/v1/quotations';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save quotation');
      }

      onSaveSuccess(data.quotation);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl my-auto text-slate-100 text-xs">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {isEditing ? `Edit Quotation — ${quotationToEdit.quotationNumber}` : 'Create New Quotation'}
                {isFinalizedEdit && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                    Controlled Revision Mode
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Official commercial quotation engine with multi-item GST calculations and letterhead options.
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
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-5">
          
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isFinalizedEdit && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 space-y-1.5 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <AlertCircle className="w-4 h-4" />
                This quotation is already {quotationToEdit.status}. Modifying it will create Revision R{quotationToEdit.revisionNumber + 1}.
              </div>
              <p className="text-[11px] text-amber-300/80">
                The original quotation version will be permanently preserved in the audit history. Please state the reason for this revision:
              </p>
              <input
                type="text"
                placeholder="Reason for revision (e.g., Customer requested 5% volume discount or updated pack size)..."
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Section 1: Quotation Information & Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Details Box */}
            <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  Customer Information
                </span>

                {/* Preset Customer Selector */}
                <select
                  onChange={(e) => handleSelectCustomerPreset(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-[11px] cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Autofill from registered lab...</option>
                  {customerPresets.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Customer / Laboratory Name *</label>
                <input
                  type="text"
                  placeholder="Apex Clinical Laboratories"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Facility Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, Area, City, State, Pincode"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98250 11223"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="lab@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">GSTIN / UIN</label>
                  <input
                    type="text"
                    placeholder="24AAACA1234A1Z5"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white uppercase focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">State Name</label>
                  <input
                    type="text"
                    placeholder="Gujarat"
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">State Code</label>
                  <input
                    type="text"
                    placeholder="24"
                    value={customerStateCode}
                    onChange={(e) => setCustomerStateCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Quotation Metadata Box */}
            <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
              <div className="border-b border-slate-800 pb-2 font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Quotation Metadata
                </span>
                <span className="text-[11px] text-sky-400 font-mono font-bold">{quotationNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Quotation Date</label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">Valid Until Date</label>
                  <input
                    type="date"
                    value={validUntilDate}
                    onChange={(e) => setValidUntilDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Subject / Objective</label>
                <input
                  type="text"
                  placeholder="Quotation for Roche cobas Reagents..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Customer Ref / Tender No.</label>
                <input
                  type="text"
                  placeholder="REQ-2026-9901 or Direct Inquiry"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>

              {/* Letterhead Option Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Document Format Option
                </label>
                <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="letterhead_opt"
                      checked={hasLetterhead}
                      onChange={() => setHasLetterhead(true)}
                      className="accent-sky-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-200">With Official Letterhead (Option A)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="letterhead_opt"
                      checked={!hasLetterhead}
                      onChange={() => setHasLetterhead(false)}
                      className="accent-sky-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-200">Without Letterhead (Option B)</span>
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Section 2: Product Line Items Table */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-400" />
                Quotation Products & GST Calculations
              </span>

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Product Row
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <th className="py-2 px-2 w-8 text-center">#</th>
                    <th className="py-2 px-2 min-w-[200px]">Product / Description</th>
                    <th className="py-2 px-2 w-24">HSN</th>
                    <th className="py-2 px-2 w-24 text-right">Price (₹)</th>
                    <th className="py-2 px-2 w-16 text-center">Qty</th>
                    <th className="py-2 px-2 w-24 text-right">Taxable (₹)</th>
                    <th className="py-2 px-2 w-20 text-center">GST %</th>
                    <th className="py-2 px-2 w-24 text-right">GST (₹)</th>
                    <th className="py-2 px-2 w-28 text-right">Total (₹)</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-2 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-2 px-2 space-y-1">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Product name..."
                            value={it.productName}
                            onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white focus:outline-none focus:border-sky-500 font-semibold"
                          />
                          {/* Quick Preset Selector */}
                          <select
                            onChange={(e) => handleApplyProductPreset(idx, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-slate-400 rounded px-1.5 text-[10px] max-w-[110px] cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>Catalog...</option>
                            {productCatalogPresets.map(pr => (
                              <option key={pr.name} value={pr.name}>{pr.name}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Specification / description (optional)..."
                          value={it.productDescription || ''}
                          onChange={(e) => handleItemChange(idx, 'productDescription', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[11px] text-slate-400 focus:outline-none focus:border-sky-500"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={it.hsnCode || '38220090'}
                          onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-slate-300 font-mono text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.unitPrice || ''}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-mono text-right"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity || 1}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white font-bold text-center"
                        />
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-medium text-slate-200">
                        {it.taxableValue.toFixed(2)}
                      </td>

                      <td className="py-2 px-2">
                        <select
                          value={it.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-xs text-sky-400 font-bold text-center cursor-pointer"
                        >
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </td>

                      <td className="py-2 px-2 text-right font-mono text-slate-300">
                        {it.gstAmount.toFixed(2)}
                      </td>

                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-400">
                        {it.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className={`p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer ${
                            items.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                          }`}
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Real-time Calculation Summary Bar */}
            <div className="flex flex-col sm:flex-row justify-end items-end gap-4 pt-3 border-t border-slate-800 text-xs">
              <div className="space-y-1 text-right min-w-[240px]">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal (Taxable Value):</span>
                  <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total GST:</span>
                  <span className="font-mono text-sky-400">+ ₹{totalGst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-400 text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes and Terms & Conditions */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
            <div className="border-b border-slate-800 pb-2 font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                Notes and Terms & Conditions
              </span>
              <span className="text-[10px] text-slate-400">Standard terms automatically included in PDF</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Delivery Terms</label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Warranty Terms</label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Quotation Validity</label>
                <input
                  type="text"
                  value={validityTerms}
                  onChange={(e) => setValidityTerms(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Quotation Notes / Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('DRAFT')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('FINALIZED')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing...' : isFinalizedEdit ? 'Save Revised Quotation' : 'Finalize & Save Quotation'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

