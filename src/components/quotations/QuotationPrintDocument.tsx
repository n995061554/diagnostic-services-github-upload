import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Download,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Globe,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Quotation, QuotationSettings } from '../../types/quotationTypes';

interface QuotationPrintDocumentProps {
  quotation: Quotation;
  settings?: QuotationSettings | null;
  onClose: () => void;
  defaultHasLetterhead?: boolean;
}

export const QuotationPrintDocument: React.FC<QuotationPrintDocumentProps> = ({
  quotation,
  settings,
  onClose,
  defaultHasLetterhead = true
}) => {
  // Option A (With Letterhead) vs Option B (Without Letterhead) toggle
  const [hasLetterhead, setHasLetterhead] = useState<boolean>(
    defaultHasLetterhead !== undefined ? defaultHasLetterhead : quotation.hasLetterhead !== false
  );

  const handlePrint = () => {
    window.print();
  };

  // Convert numbers to Indian Words (Rupees & Paise)
  const numberToWordsIndian = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      let str = '';
      if (n > 99) {
        str += a[Math.floor(n / 100)] + 'Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      } else {
        str += a[n];
      }
      return str;
    };

    const n = Math.floor(num);
    const paise = Math.round((num - n) * 100);

    if (n === 0 && paise === 0) return 'Zero Rupees Only';

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    let res = '';
    if (crore > 0) res += inWords(crore) + 'Crore ';
    if (lakh > 0) res += inWords(lakh) + 'Lakh ';
    if (thousand > 0) res += inWords(thousand) + 'Thousand ';
    if (remainder > 0) res += inWords(remainder);

    res += 'Rupees ';
    if (paise > 0) {
      res += 'and ' + inWords(paise) + 'Paise ';
    }
    return res.trim() + ' Only';
  };

  // Group items by GST% for the Tax Summary Breakdown
  const gstBreakdown: Record<number, { taxable: number; gst: number; total: number }> = {};
  if (Array.isArray(quotation.items)) {
    quotation.items.forEach(it => {
      const rate = it.gstRate;
      if (!gstBreakdown[rate]) {
        gstBreakdown[rate] = { taxable: 0, gst: 0, total: 0 };
      }
      gstBreakdown[rate].taxable += Number(it.taxableValue) || 0;
      gstBreakdown[rate].gst += Number(it.gstAmount) || 0;
      gstBreakdown[rate].total += Number(it.totalAmount) || 0;
    });
  }

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const companyName = settings?.companyName || 'Diagnostic Services';
  const companyLegalName = settings?.companyLegalName || 'A2Z Diagnostic Services India Pvt Ltd';
  const companyAddress = settings?.companyAddressLine1 || 'Plot No. 42, Diagnostic Corridor, MIDC Industrial Area, Andheri East';
  const companyCityState = `${settings?.companyCity || 'Mumbai'}, ${settings?.companyState || 'Maharashtra'} - ${settings?.companyPincode || '400093'}, India`;
  const companyGstin = settings?.companyGstin || '27AABCU9603R1ZM';
  const companyPhone = settings?.companyPhone || '+91 22 2834-8800';
  const companyEmail = settings?.companyEmail || 'sales@dsdistributor.com';
  const companyWebsite = settings?.companyWebsite || 'www.dsdistributor.com';

  const signatoryName = quotation.signatoryName || settings?.authorizedSignatoryName || 'Rajesh Sharma';
  const signatoryDesignation = quotation.signatoryDesignation || settings?.authorizedSignatoryDesignation || 'Managing Director / Authorised Signatory';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl transition-all duration-300 print:border-none print:shadow-none print:w-full print:bg-white print:rounded-none">
        
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Quotation — {quotation.quotationNumber}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  quotation.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  quotation.status === 'FINALIZED' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  quotation.status === 'SENT' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                  quotation.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {quotation.status}
                </span>
                {quotation.revisionNumber > 0 && (
                  <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    Rev R{quotation.revisionNumber}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Created: {new Date(quotation.createdAt).toLocaleDateString('en-IN')} by {quotation.createdByName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Letterhead Mode Selector (Mandatory Requirement) */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setHasLetterhead(true)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  hasLetterhead ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                With Letterhead
              </button>
              <button
                type="button"
                onClick={() => setHasLetterhead(false)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  !hasLetterhead ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                Without Letterhead
              </button>
            </div>

            {/* Print / Download Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE QUOTATION SHEET */}
        <div className="p-4 sm:p-8 bg-white text-black font-sans leading-relaxed text-xs overflow-x-auto print:p-0">
          
          {/* OPTION A: COMPANY OFFICIAL LETTERHEAD */}
          {hasLetterhead ? (
            <div className="border-b-2 border-black pb-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {settings?.companyLogoUrl ? (
                    <img
                      src={settings.companyLogoUrl}
                      alt="Company Logo"
                      className="h-14 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-sky-900 text-white rounded-lg flex items-center justify-center font-black text-xl tracking-wider">
                      DS
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {companyName}
                    </h1>
                    <p className="text-[11px] font-semibold text-slate-600">
                      {companyLegalName}
                    </p>
                    <p className="text-[10px] text-slate-700 leading-tight mt-0.5">
                      {companyAddress}, {companyCityState}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[10px] space-y-0.5 shrink-0">
                  <p><span className="font-bold">GSTIN/UIN:</span> {companyGstin}</p>
                  <p><span className="font-bold">State:</span> Maharashtra (Code: 27)</p>
                  <p><span className="font-bold">Phone:</span> {companyPhone}</p>
                  <p><span className="font-bold">Email:</span> {companyEmail}</p>
                  <p><span className="font-bold">Website:</span> {companyWebsite}</p>
                </div>
              </div>
            </div>
          ) : (
            /* OPTION B: WITHOUT LETTERHEAD - Clean company branding for standard / pre-printed stationery */
            <div className="pt-2 pb-2 border-b-2 border-slate-900 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {companyName}
                  </h1>
                  <span className="text-[10px] text-slate-600 block">
                    {companyLegalName} • GSTIN: {companyGstin}
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <span className="font-bold text-slate-700 block">Official Commercial Quotation</span>
                  <span className="text-[9px] text-slate-400">[ Standard Stationery / Pre-Printed Paper ]</span>
                </div>
              </div>
            </div>
          )}

          {/* QUOTATION TITLE BAR */}
          <div className="flex items-center justify-between border border-black bg-slate-100 p-2 mb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                COMMERCIAL QUOTATION
              </span>
              {quotation.revisionNumber > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-900 border border-purple-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                  REVISION R{quotation.revisionNumber}
                </span>
              )}
            </div>
            <div className="text-right text-[11px] font-bold text-slate-900">
              Quotation No: <span className="font-black text-black">{quotation.quotationNumber}</span>
            </div>
          </div>

          {/* METADATA 2-COLUMN BOX */}
          <div className="border border-black grid grid-cols-1 md:grid-cols-2 text-[11px] divide-y md:divide-y-0 md:divide-x divide-black mb-4">
            
            {/* LEFT: Customer / Quoted To Details */}
            <div className="p-3 bg-slate-50/50">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                QUOTED TO (CUSTOMER):
              </div>
              <div className="font-black text-slate-900 text-xs uppercase">
                {quotation.customerName}
              </div>
              <p className="text-slate-800 leading-relaxed mt-1">
                {quotation.customerAddress || 'Customer registered facility address on file.'}
              </p>
              <div className="mt-2 space-y-0.5 text-[10px] text-slate-700">
                <p><span className="font-bold">Contact Phone:</span> {quotation.customerPhone || 'Not provided'}</p>
                {quotation.customerEmail && <p><span className="font-bold">Email:</span> {quotation.customerEmail}</p>}
                <p><span className="font-bold">GSTIN/UIN:</span> {quotation.customerGstin || 'Unregistered / Medical Clinic'}</p>
                {quotation.customerState && (
                  <p><span className="font-bold">State Name:</span> {quotation.customerState} {quotation.customerStateCode ? `(Code: ${quotation.customerStateCode})` : ''}</p>
                )}
              </div>
            </div>

            {/* RIGHT: Quotation Metadata */}
            <div className="p-3 flex flex-col justify-between">
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="font-bold text-slate-600">Quotation Date:</span>
                  <span className="font-semibold">{quotation.quotationDate}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="font-bold text-slate-600">Valid Until:</span>
                  <span className="font-semibold text-rose-700 font-bold">{quotation.validUntilDate || '30 Days from date of issue'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="font-bold text-slate-600">Customer Ref / Inquiry:</span>
                  <span className="font-semibold">{quotation.reference || 'Direct Commercial Request'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="font-bold text-slate-600">Transaction Type:</span>
                  <span className="font-semibold">{quotation.isInterState ? 'Inter-State (IGST Applicable)' : 'Intra-State (CGST + SGST Applicable)'}</span>
                </div>
              </div>

              {quotation.subject && (
                <div className="mt-2 pt-2 border-t border-slate-300">
                  <span className="font-bold text-[10px] text-slate-600 uppercase">Subject:</span>
                  <p className="text-[11px] font-semibold text-slate-900 mt-0.5 leading-snug">
                    {quotation.subject}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT LINE ITEMS TABLE */}
          <div className="border border-black mb-4 overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-black text-[10px] font-bold text-black uppercase">
                  <th className="py-2 px-2 border-r border-black w-8 text-center">#</th>
                  <th className="py-2 px-2 border-r border-black">Description of Goods / Services</th>
                  <th className="py-2 px-2 border-r border-black text-center w-20">HSN</th>
                  <th className="py-2 px-2 border-r border-black text-right w-20">Price (₹)</th>
                  <th className="py-2 px-2 border-r border-black text-center w-12">Qty</th>
                  <th className="py-2 px-2 border-r border-black text-right w-24">Taxable (₹)</th>
                  <th className="py-2 px-2 border-r border-black text-center w-14">GST %</th>
                  <th className="py-2 px-2 border-r border-black text-right w-20">GST (₹)</th>
                  <th className="py-2 px-2 text-right w-24">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20">
                {quotation.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-2 border-r border-black text-center font-semibold text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 border-r border-black">
                      <div className="font-bold text-slate-900">{it.productName}</div>
                      {it.productDescription && (
                        <div className="text-[10px] text-slate-600 mt-0.5">{it.productDescription}</div>
                      )}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-center text-slate-700 text-[10px]">
                      {it.hsnCode || '38220090'}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-right font-mono">
                      {it.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-center font-bold">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-right font-mono font-medium">
                      {it.taxableValue.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 border-r border-black text-center font-bold text-sky-800">
                      {it.gstRate}%
                    </td>
                    <td className="py-2 px-2 border-r border-black text-right font-mono">
                      {it.gstAmount.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                      {it.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-black bg-slate-50 font-bold text-black">
                <tr>
                  <td colSpan={5} className="py-2 px-3 text-right uppercase text-[10px] border-r border-black">
                    Subtotals (Taxable & Tax):
                  </td>
                  <td className="py-2 px-2 text-right font-mono border-r border-black">
                    {quotation.subtotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 border-r border-black text-center text-[10px] text-slate-500">
                    -
                  </td>
                  <td className="py-2 px-2 text-right font-mono border-r border-black">
                    {quotation.totalGst.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-black text-xs text-black">
                    {quotation.grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* TAX BREAKDOWN SCHEDULE & AMOUNT IN WORDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* LEFT: Amount in Words */}
            <div className="border border-black p-3 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="font-bold text-[10px] text-slate-600 uppercase">Amount Chargeable (in words):</span>
                <p className="text-xs font-black text-slate-900 mt-1 italic leading-relaxed">
                  {numberToWordsIndian(quotation.grandTotal)}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] space-y-1">
                <p><span className="font-bold">Total Tax Amount (in words):</span> {numberToWordsIndian(quotation.totalGst)}</p>
                <p className="text-slate-600">Company Bank Details for RTGS/NEFT: HDFC Bank, A/C: 50200088991122, IFSC: HDFC0000123</p>
              </div>
            </div>

            {/* RIGHT: GST Tax Schedule Breakdown */}
            <div className="border border-black">
              <div className="bg-slate-100 border-b border-black p-1.5 text-[10px] font-bold uppercase text-slate-800">
                GST Tax Schedule Breakdown
              </div>
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-black/40 text-slate-700 bg-slate-50 font-bold">
                    <th className="p-1.5 border-r border-black/20">GST Rate</th>
                    <th className="p-1.5 border-r border-black/20 text-right">Taxable (₹)</th>
                    {quotation.isInterState ? (
                      <th className="p-1.5 border-r border-black/20 text-right">IGST (₹)</th>
                    ) : (
                      <>
                        <th className="p-1.5 border-r border-black/20 text-right">CGST (₹)</th>
                        <th className="p-1.5 border-r border-black/20 text-right">SGST (₹)</th>
                      </>
                    )}
                    <th className="p-1.5 text-right">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {Object.entries(gstBreakdown).map(([rateStr, data]) => {
                    const rate = Number(rateStr);
                    const cgst = quotation.isInterState ? 0 : data.gst / 2;
                    const sgst = quotation.isInterState ? 0 : data.gst / 2;
                    const igst = quotation.isInterState ? data.gst : 0;
                    return (
                      <tr key={rateStr} className="font-mono">
                        <td className="p-1.5 border-r border-black/20 font-bold text-slate-900 font-sans">
                          GST @ {rate}%
                        </td>
                        <td className="p-1.5 border-r border-black/20 text-right">{data.taxable.toFixed(2)}</td>
                        {quotation.isInterState ? (
                          <td className="p-1.5 border-r border-black/20 text-right">{igst.toFixed(2)}</td>
                        ) : (
                          <>
                            <td className="p-1.5 border-r border-black/20 text-right">{cgst.toFixed(2)}</td>
                            <td className="p-1.5 border-r border-black/20 text-right">{sgst.toFixed(2)}</td>
                          </>
                        )}
                        <td className="p-1.5 text-right font-bold text-black">{data.gst.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-black bg-slate-100 font-bold font-mono">
                  <tr>
                    <td className="p-1.5 border-r border-black text-left font-sans text-[9px] uppercase">Total:</td>
                    <td className="p-1.5 border-r border-black text-right">{quotation.subtotal.toFixed(2)}</td>
                    {quotation.isInterState ? (
                      <td className="p-1.5 border-r border-black text-right">{(quotation.igstAmount || quotation.totalGst).toFixed(2)}</td>
                    ) : (
                      <>
                        <td className="p-1.5 border-r border-black text-right">{(quotation.cgstAmount || quotation.totalGst / 2).toFixed(2)}</td>
                        <td className="p-1.5 border-r border-black text-right">{(quotation.sgstAmount || quotation.totalGst / 2).toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-1.5 text-right font-black text-black">{quotation.totalGst.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* NOTES AND TERMS & CONDITIONS */}
          <div className="border border-black p-3 mb-4 space-y-2 text-[10px]">
            <div className="font-bold uppercase text-slate-900 border-b border-black pb-1 flex items-center justify-between">
              <span>Standard Terms & Conditions of Sale</span>
              <span className="text-[9px] text-slate-500 font-normal">Diagnostic Services Commercial Protocol</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-800">
              <div>
                <p><span className="font-bold text-black">1. Payment Terms:</span> {quotation.paymentTerms || 'Payment strictly within 30 days of invoice date.'}</p>
                <p className="mt-1"><span className="font-bold text-black">2. Delivery Terms:</span> {quotation.deliveryTerms || 'Doorstep delivery within 24 to 48 hours of confirmed purchase order.'}</p>
                <p className="mt-1"><span className="font-bold text-black">3. Validity:</span> {quotation.validityTerms || 'This quotation remains valid for 30 calendar days from the date of issue.'}</p>
              </div>
              <div>
                <p><span className="font-bold text-black">4. Warranty Terms:</span> {quotation.warrantyTerms || 'Standard OEM replacement warranty on unopened reagent kits.'}</p>
                {quotation.notes && (
                  <p className="mt-1"><span className="font-bold text-black">5. Special Notes:</span> {quotation.notes}</p>
                )}
                <p className="mt-1"><span className="font-bold text-black">6. Jurisdiction:</span> Disputes subject to Mumbai / Ahmedabad judicial jurisdiction only.</p>
              </div>
            </div>
          </div>

          {/* SIGNATURE AND COMPANY STAMP BOX */}
          <div className="border border-black grid grid-cols-2 text-[11px] divide-x divide-black">
            
            {/* Customer Acceptance Signoff */}
            <div className="p-3 flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="font-bold text-[10px] text-slate-600 uppercase">Customer Acceptance / Confirmation:</span>
                <p className="text-[9px] text-slate-500 mt-0.5">Please sign and return copy with official purchase order.</p>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-600 flex justify-between">
                <span>Authorized Signatory & Seal</span>
                <span>Date: ____________</span>
              </div>
            </div>

            {/* Official Diagnostic Services Signatory & Stamp */}
            <div className="p-3 flex flex-col justify-between min-h-[110px] text-right">
              <div>
                <span className="font-bold text-[10px] text-slate-700 uppercase">For {companyName}</span>
              </div>

              {/* Signature / Stamp Area */}
              <div className="my-2 flex items-center justify-end gap-4">
                {settings?.stampImageUrl ? (
                  <img src={settings.stampImageUrl} alt="Company Stamp" className="h-14 w-auto object-contain opacity-80" />
                ) : (
                  <div className="w-16 h-12 border border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 uppercase font-bold">
                    Official Stamp
                  </div>
                )}

                {settings?.signatureImageUrl ? (
                  <img src={settings.signatureImageUrl} alt="Authorised Signature" className="h-12 w-auto object-contain" />
                ) : (
                  <div className="w-24 h-12 border-b border-slate-400 flex items-end justify-center text-[10px] font-serif italic text-slate-700 pb-1">
                    {signatoryName}
                  </div>
                )}
              </div>

              <div className="border-t border-black pt-1 text-[10px]">
                <div className="font-bold text-black uppercase">{signatoryName}</div>
                <div className="text-[9px] text-slate-600">{signatoryDesignation}</div>
              </div>
            </div>
          </div>

          {/* PAGE FOOTER NOTICE */}
          <div className="mt-3 text-center text-[9px] text-slate-400 print:text-[8px]">
            This is a computer-generated commercial quotation issued by {companyName}.
          </div>

        </div>
      </div>
    </div>
  );
};

