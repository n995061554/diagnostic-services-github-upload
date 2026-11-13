/**
 * TALLY-STYLE SALES INVOICE & DELIVERY NOTE PRINT DOCUMENT
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Implements high-fidelity print layout modeled after Tally ERP / Prime
 * reference: `invoice-preview-in-tally.jpg` and `16-Delivery-Note-1.gif`:
 * 1. Distinct document types: TAX INVOICE, PROFORMA INVOICE, DELIVERY NOTE, CREDIT NOTE.
 * 2. Classic Tally 2-column header box:
 *    - Left: Company details -> Consignee (Ship To) -> Buyer (Bill To).
 *    - Right: Invoice No, Date, Delivery Note, Payment Terms, Buyer PO, Dispatch info, Transport.
 * 3. Line item table with Sl No, Description of Goods (SKU/Batch/Expiry), HSN/SAC, GST%, Qty, Rate, per, Disc, Amount.
 * 4. Tally HSN/SAC Tax Schedule Breakdown table (Taxable Value, CGST, SGST, IGST, Total Tax).
 * 5. Amount in Words for both Total Invoice and Total Tax Amount.
 * 6. Bank Details, Terms & Conditions, and Authorised Signatory box.
 * 7. Copy labels: ORIGINAL FOR RECIPIENT, DUPLICATE FOR TRANSPORTER, TRIPLICATE FOR SUPPLIER.
 * 8. @media print CSS for clean, professional A4 printing.
 */

import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Calendar,
  CreditCard,
  Truck,
  Smartphone,
  Monitor,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { SalesInvoice, DocumentType } from '../../../server/accounting/accountingTypes';

interface SalesInvoicePrintDocumentProps {
  invoice: SalesInvoice;
  onClose: () => void;
  token?: string | null;
}

export type InvoiceCopyType = 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' | 'TRANSPORT';

export const SalesInvoicePrintDocument: React.FC<SalesInvoicePrintDocumentProps> = ({
  invoice,
  onClose,
  token
}) => {
  const [copyType, setCopyType] = useState<InvoiceCopyType>('ORIGINAL');
  const [docTypeOverride, setDocTypeOverride] = useState<DocumentType>(
    (invoice as any).documentType || 'TAX_INVOICE'
  );
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    // Optionally fetch company and bank settings from server
    const fetchSettings = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/v1/accounting/settings', { headers });
        const json = await res.json();
        if (json.data) setCompanySettings(json.data);
      } catch (e) {
        // Fallback to invoice defaults
      }
    };
    fetchSettings();
  }, [token]);

  const formatInr = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const getCopyLabel = () => {
    if (docTypeOverride === 'DELIVERY_NOTE') {
      switch (copyType) {
        case 'ORIGINAL':
          return 'ORIGINAL FOR CONSIGNEE';
        case 'DUPLICATE':
          return 'DUPLICATE FOR TRANSPORTER';
        case 'TRIPLICATE':
          return 'TRIPLICATE FOR CONSIGNOR';
        default:
          return 'DELIVERY CHALLAN';
      }
    }

    switch (copyType) {
      case 'ORIGINAL':
        return 'ORIGINAL FOR RECIPIENT';
      case 'DUPLICATE':
        return 'DUPLICATE FOR TRANSPORTER';
      case 'TRIPLICATE':
        return 'TRIPLICATE FOR SUPPLIER';
      case 'TRANSPORT':
        return 'EXTRA COPY FOR RECORD';
    }
  };

  const getDocTitle = () => {
    switch (docTypeOverride) {
      case 'PROFORMA_INVOICE':
        return 'PROFORMA INVOICE';
      case 'DELIVERY_NOTE':
        return 'DELIVERY NOTE / CHALLAN';
      case 'CREDIT_NOTE':
        return 'CREDIT NOTE';
      case 'TAX_INVOICE':
      default:
        return 'TAX INVOICE';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert number to Indian words
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

  // Group items by HSN/SAC for the Tally Tax Breakdown Table
  const hsnSummaryMap: Record<string, { taxable: number; cgst: number; sgst: number; igst: number; rate: number }> = {};
  invoice.items.forEach(it => {
    const hsn = it.hsnSac || '38220090';
    if (!hsnSummaryMap[hsn]) {
      hsnSummaryMap[hsn] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, rate: it.gstRate };
    }
    hsnSummaryMap[hsn].taxable += it.taxableAmount;
    hsnSummaryMap[hsn].cgst += it.cgstAmount;
    hsnSummaryMap[hsn].sgst += it.sgstAmount;
    hsnSummaryMap[hsn].igst += it.igstAmount;
  });
  const hsnSummaryList = Object.entries(hsnSummaryMap);

  const printSettings = companySettings?.printConfig || {};
  const bank = companySettings?.bankDetails || {
    bankName: 'HDFC Bank Ltd',
    accountNumber: '50200088192039',
    ifscCode: 'HDFC0000128',
    branch: 'MIDC Andheri East, Mumbai'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col w-full transition-all duration-300 print:border-none print:shadow-none print:w-full print:bg-white print:rounded-none ${
        isMobilePreview ? 'max-w-md' : 'max-w-4xl'
      }`}>
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {getDocTitle()} — {invoice.invoiceNumber}
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  invoice.status === 'POSTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  invoice.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {invoice.status}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Tally ERP Print Layout • GSTIN: 27AABCU9603R1ZM • State Code: 27 (Maharashtra)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Document Type Override Selector */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              {(['TAX_INVOICE', 'DELIVERY_NOTE', 'PROFORMA_INVOICE'] as DocumentType[]).map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setDocTypeOverride(dt)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    docTypeOverride === dt ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dt === 'TAX_INVOICE' ? 'Invoice' : dt === 'DELIVERY_NOTE' ? 'Delivery Note' : 'Proforma'}
                </button>
              ))}
            </div>

            {/* Copy Selector */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              {(['ORIGINAL', 'DUPLICATE', 'TRIPLICATE'] as InvoiceCopyType[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCopyType(c)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                    copyType === c ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Mobile View Toggle */}
            <button
              type="button"
              onClick={() => setIsMobilePreview(!isMobilePreview)}
              className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1.5 text-xs ${
                isMobilePreview
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isMobilePreview ? 'Switch to Desktop View' : 'Switch to Mobile View Preview'}
            >
              {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet (Strict Tally Style Box Formatting) */}
        <div className="p-4 sm:p-8 text-black bg-white print:p-0 print:m-0 font-sans text-xs select-text">
          {/* Print Watermark / Copy Header */}
          <div className="flex justify-between items-center border border-black p-2 border-b-0 bg-slate-50">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-700">
                {docTypeOverride === 'DELIVERY_NOTE' ? 'RULE 55 DELIVERY CHALLAN UNDER CGST RULES, 2017' : 'GST INVOICE UNDER RULE 48 OF CGST RULES, 2017'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                {getDocTitle()}
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-block border-2 border-black px-3 py-1 font-mono font-black text-xs uppercase bg-white text-black shadow-xs">
                {getCopyLabel()}
              </span>
            </div>
          </div>

          {/* TALLY 2-COLUMN HEADER CONTAINER (Matching reference `invoice-preview-in-tally.jpg`) */}
          <div className="border border-black grid grid-cols-1 md:grid-cols-2 text-[11px] divide-y md:divide-y-0 md:divide-x divide-black">
            {/* LEFT COLUMN: Seller, Consignee & Buyer */}
            <div className="flex flex-col divide-y divide-black">
              {/* Seller / Supplier Details */}
              <div className="p-2.5">
                <h2 className="text-sm font-black text-black uppercase">
                  {companySettings?.companyName || 'A2Z Diagnostic Services India Pvt Ltd'}
                </h2>
                <p className="text-slate-800 leading-relaxed mt-0.5">
                  {companySettings?.address?.line1 || 'Plot No. 42, Diagnostic Corridor, MIDC Industrial Area,'}<br />
                  {companySettings?.address?.city || 'Andheri East, Mumbai, Maharashtra'} - {companySettings?.address?.pincode || '400093'}, India
                </p>
                <div className="mt-1.5 space-y-0.5 text-[10px]">
                  <p><span className="font-bold">GSTIN/UIN:</span> {companySettings?.gstin || '27AABCU9603R1ZM'}</p>
                  <p><span className="font-bold">State Name:</span> {companySettings?.state || 'Maharashtra'}, <span className="font-bold">Code:</span> {companySettings?.stateCode || '27'}</p>
                  <p><span className="font-bold">E-Mail:</span> {companySettings?.contacts?.email || 'billing@a2zdiagnostic.com'} • <span className="font-bold">Contact:</span> {companySettings?.contacts?.phone || '+91 22 2834-8800'}</p>
                </div>
              </div>

              {/* Consignee (Ship to) */}
              <div className="p-2.5 bg-slate-50/50">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                  Consignee (Ship to)
                </div>
                <div className="font-black text-black uppercase text-xs">
                  {invoice.customerName}
                </div>
                <p className="text-slate-800 leading-relaxed mt-0.5">
                  {invoice.shippingAddress || invoice.billingAddress}
                </p>
                <div className="mt-1 space-y-0.5 text-[10px]">
                  <p><span className="font-bold">GSTIN/UIN:</span> {invoice.customerGstin || 'Unregistered / Consumer'}</p>
                  <p><span className="font-bold">State Name:</span> {invoice.customerState}, <span className="font-bold">Code:</span> {invoice.customerStateCode}</p>
                  <p><span className="font-bold">Cold Chain Protocol:</span> Validated 2°C - 8°C Reagent Handling</p>
                </div>
              </div>

              {/* Buyer (Bill to) */}
              <div className="p-2.5">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">
                  Buyer (Bill to)
                </div>
                <div className="font-black text-black uppercase text-xs">
                  {invoice.customerName}
                </div>
                <p className="text-slate-800 leading-relaxed mt-0.5">
                  {invoice.billingAddress}
                </p>
                <div className="mt-1 space-y-0.5 text-[10px]">
                  <p><span className="font-bold">GSTIN/UIN:</span> {invoice.customerGstin || 'Unregistered / Consumer'}</p>
                  <p><span className="font-bold">State Name:</span> {invoice.customerState}, <span className="font-bold">Code:</span> {invoice.customerStateCode}</p>
                  <p><span className="font-bold">Place of Supply:</span> {invoice.placeOfSupply}</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Supplementary Tally Document Details */}
            <div className="divide-y divide-black flex flex-col justify-between">
              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Invoice No.</div>
                  <div className="font-black text-black font-mono">{invoice.invoiceNumber}</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Dated</div>
                  <div className="font-bold text-black">{invoice.invoiceDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Delivery Note</div>
                  <div className="font-mono text-black font-semibold">
                    {invoice.deliveryReference || `DN-${invoice.invoiceNumber.replace(/[^0-9]/g, '').slice(-4)}`}
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Mode/Terms of Payment</div>
                  <div className="font-medium text-black">{invoice.paymentTerms || '30 Days Net Credit'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Reference No. & Date</div>
                  <div className="font-mono text-black">{invoice.poNumber || 'PO-2026-MED01'}</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Other References</div>
                  <div className="font-mono text-black">A2Z-PORTAL-SYS</div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Buyer's Order No.</div>
                  <div className="font-mono text-black">{invoice.poNumber || 'N/A'}</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Dated</div>
                  <div className="text-black">{invoice.invoiceDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Dispatch Doc No.</div>
                  <div className="font-mono text-black">CC-TRK-{invoice.invoiceNumber.slice(-4)}</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Delivery Note Date</div>
                  <div className="text-black">{invoice.invoiceDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Dispatched through</div>
                  <div className="font-semibold text-black">Cold-Chain Express Logistics</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Destination</div>
                  <div className="font-semibold text-black">{invoice.customerState}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-black text-[11px]">
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Bill of Lading/LR-RR No.</div>
                  <div className="font-mono text-black">LR-MH-99410</div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] text-slate-600">Motor Vehicle No.</div>
                  <div className="font-mono font-bold text-black">MH-02-CB-4491</div>
                </div>
              </div>

              <div className="p-2 text-[11px]">
                <div className="text-[10px] text-slate-600">Terms of Delivery</div>
                <div className="text-black italic">
                  {printSettings.defaultTermsOfDelivery || 'Door Delivery with Validated 2-8°C Cold Chain Packaging'}
                </div>
              </div>
            </div>
          </div>

          {/* ITEM LINES TABLE (Strict Tally Lines formatting) */}
          <div className="border border-black border-t-0 overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-black border-b border-black font-bold text-[10px] uppercase">
                  <th className="py-2 px-2 text-center w-8 border-r border-black">SI No.</th>
                  <th className="py-2 px-2 border-r border-black">Description of Goods</th>
                  <th className="py-2 px-2 border-r border-black w-20">HSN/SAC</th>
                  <th className="py-2 px-2 border-r border-black text-center w-12">GST %</th>
                  <th className="py-2 px-2 border-r border-black text-right w-20">Quantity</th>
                  <th className="py-2 px-2 border-r border-black text-right w-24">Rate (₹)</th>
                  <th className="py-2 px-2 border-r border-black text-center w-12">per</th>
                  <th className="py-2 px-2 border-r border-black text-right w-16">Disc %</th>
                  <th className="py-2 px-2 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/30">
                {invoice.items.map((item, index) => (
                  <tr key={item.id || index} className="align-top">
                    <td className="py-2 px-2 text-center font-mono border-r border-black">{index + 1}</td>
                    <td className="py-2 px-2 border-r border-black">
                      <div className="font-black text-black">{item.productName}</div>
                      <div className="text-[10px] text-slate-700 font-mono mt-0.5">
                        SKU: {item.sku} &bull; Batch: <span className="font-bold text-black">{item.batchNumber}</span> (Exp: {item.expiryDate})
                      </div>
                      {item.isColdChain && (
                        <div className="text-[9px] text-blue-700 font-bold mt-0.5">
                          ❄ Reagent Cold Chain (2°C - 8°C Required)
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-800 border-r border-black">{item.hsnSac || '38220090'}</td>
                    <td className="py-2 px-2 font-mono text-center border-r border-black">{item.gstRate}%</td>
                    <td className="py-2 px-2 text-right font-black border-r border-black">
                      {item.quantity} <span className="text-[10px] font-normal">{item.unit}</span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono border-r border-black">{item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-center text-[10px] border-r border-black">{item.unit}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700 border-r border-black">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-black">{item.taxableAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-black font-bold text-[11px] bg-slate-50">
                <tr>
                  <td colSpan={4} className="py-2 px-2 text-right border-r border-black uppercase text-[10px]">
                    Subtotal / Total Units
                  </td>
                  <td className="py-2 px-2 text-right font-black border-r border-black">
                    {invoice.items.reduce((acc, it) => acc + it.quantity, 0)}
                  </td>
                  <td colSpan={3} className="border-r border-black"></td>
                  <td className="py-2 px-2 text-right font-black font-mono">
                    ₹{invoice.taxableAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* TOTALS & TAX ANALYSIS GRID (Strict Tally HSN/SAC Summary Box) */}
          <div className="border border-black border-t-0 p-3 space-y-3">
            {/* HSN/SAC Tax Schedule Table (Tally Style) */}
            <div>
              <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">
                Tax Analysis Schedule (by HSN/SAC)
              </div>
              <table className="w-full text-left text-[10px] border border-black border-collapse">
                <thead className="bg-slate-100 text-black border-b border-black font-bold">
                  <tr>
                    <th className="py-1 px-2 border-r border-black">HSN/SAC</th>
                    <th className="py-1 px-2 border-r border-black text-right">Taxable Value</th>
                    <th className="py-1 px-2 border-r border-black text-center" colSpan={2}>Central Tax</th>
                    <th className="py-1 px-2 border-r border-black text-center" colSpan={2}>State Tax</th>
                    <th className="py-1 px-2 border-r border-black text-center" colSpan={2}>Integrated Tax</th>
                    <th className="py-1 px-2 text-right">Total Tax Amount</th>
                  </tr>
                  <tr className="bg-slate-50 text-slate-700 border-t border-black/30 text-[9px]">
                    <th className="border-r border-black"></th>
                    <th className="border-r border-black"></th>
                    <th className="py-0.5 px-1 border-r border-black text-center">Rate</th>
                    <th className="py-0.5 px-1 border-r border-black text-right">Amount</th>
                    <th className="py-0.5 px-1 border-r border-black text-center">Rate</th>
                    <th className="py-0.5 px-1 border-r border-black text-right">Amount</th>
                    <th className="py-0.5 px-1 border-r border-black text-center">Rate</th>
                    <th className="py-0.5 px-1 border-r border-black text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/30 font-mono">
                  {hsnSummaryList.map(([hsn, data]) => (
                    <tr key={hsn}>
                      <td className="py-1 px-2 font-bold border-r border-black">{hsn}</td>
                      <td className="py-1 px-2 text-right border-r border-black">{data.taxable.toFixed(2)}</td>
                      <td className="py-1 px-1 text-center border-r border-black">{data.cgst > 0 ? `${data.rate / 2}%` : '-'}</td>
                      <td className="py-1 px-1 text-right border-r border-black">{data.cgst > 0 ? data.cgst.toFixed(2) : '-'}</td>
                      <td className="py-1 px-1 text-center border-r border-black">{data.sgst > 0 ? `${data.rate / 2}%` : '-'}</td>
                      <td className="py-1 px-1 text-right border-r border-black">{data.sgst > 0 ? data.sgst.toFixed(2) : '-'}</td>
                      <td className="py-1 px-1 text-center border-r border-black">{data.igst > 0 ? `${data.rate}%` : '-'}</td>
                      <td className="py-1 px-1 text-right border-r border-black">{data.igst > 0 ? data.igst.toFixed(2) : '-'}</td>
                      <td className="py-1 px-2 text-right font-bold text-black">{(data.cgst + data.sgst + data.igst).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-black font-bold bg-slate-50 font-mono">
                  <tr>
                    <td className="py-1 px-2 text-right border-r border-black uppercase text-[9px]">Total:</td>
                    <td className="py-1 px-2 text-right border-r border-black">{invoice.taxableAmount.toFixed(2)}</td>
                    <td colSpan={2} className="py-1 px-1 text-right border-r border-black">{invoice.totalCgst.toFixed(2)}</td>
                    <td colSpan={2} className="py-1 px-1 text-right border-r border-black">{invoice.totalSgst.toFixed(2)}</td>
                    <td colSpan={2} className="py-1 px-1 text-right border-r border-black">{invoice.totalIgst.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right font-black">{invoice.totalTax.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Amount in words & Tax in words */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-black">
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Amount Chargeable (in words):</span>
                  <span className="font-black text-black capitalize">
                    {numberToWordsIndian(invoice.finalTotal)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Tax Amount (in words):</span>
                  <span className="font-semibold text-slate-900 capitalize text-[10px]">
                    {numberToWordsIndian(invoice.totalTax)}
                  </span>
                </div>

                {/* Company's Bank Details */}
                <div className="border border-black p-2 rounded text-[10px] bg-slate-50/50 mt-2 space-y-0.5">
                  <span className="font-bold text-black block uppercase">Company's Bank Details:</span>
                  <p><span className="font-semibold">Bank Name:</span> {bank.bankName}</p>
                  <p><span className="font-semibold">A/c No.:</span> <span className="font-mono font-bold">{bank.accountNumber}</span></p>
                  <p><span className="font-semibold">Branch & IFS Code:</span> {bank.branch} • <span className="font-mono font-bold">{bank.ifscCode}</span></p>
                </div>
              </div>

              {/* Final Totals Breakdown */}
              <div className="space-y-1 text-[11px] border border-black p-2.5 rounded bg-slate-50">
                <div className="flex justify-between">
                  <span>Gross Taxable Turnover:</span>
                  <span className="font-mono">{formatInr(invoice.taxableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Output Tax:</span>
                  <span className="font-mono">{formatInr(invoice.totalTax)}</span>
                </div>
                {invoice.freightCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Freight / Cold Chain Transport:</span>
                    <span className="font-mono">{formatInr(invoice.freightCharges)}</span>
                  </div>
                )}
                {invoice.otherCharges > 0 && (
                  <div className="flex justify-between">
                    <span>Handling / Packaging Charges:</span>
                    <span className="font-mono">{formatInr(invoice.otherCharges)}</span>
                  </div>
                )}
                {invoice.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>Round-Off Adjustment:</span>
                    <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff.toFixed(2)}` : invoice.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm border-t-2 border-black pt-1 mt-1 text-black">
                  <span>Total Payable Amount:</span>
                  <span className="font-mono text-emerald-800">{formatInr(invoice.finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Declaration & Signatory Box */}
            <div className="border border-black grid grid-cols-1 md:grid-cols-2 text-[10px] divide-y md:divide-y-0 md:divide-x divide-black mt-2">
              <div className="p-2.5">
                <span className="font-bold text-black uppercase block mb-1">Declaration:</span>
                <p className="text-slate-700 leading-relaxed italic">
                  {printSettings.declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                </p>
              </div>

              <div className="p-2.5 flex flex-col justify-between text-right">
                <div className="font-bold text-black uppercase">
                  for {companySettings?.companyName || 'A2Z Diagnostic Services India Pvt Ltd'}
                </div>
                <div className="h-10 flex items-center justify-end">
                  <span className="text-[10px] text-slate-400 italic">[ Authorised Signatory ]</span>
                </div>
                <div className="border-t border-black/40 pt-1 font-semibold text-black">
                  Authorised Signatory
                </div>
              </div>
            </div>

            {/* Bottom System Footer */}
            <div className="text-center text-[9px] text-slate-500 pt-1 uppercase">
              {printSettings.footerNote || 'SUBJECT TO MUMBAI JURISDICTION • This is a Computer Generated Document'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
