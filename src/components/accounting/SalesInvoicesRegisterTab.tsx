import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  Printer,
  RotateCcw,
  AlertTriangle,
  X,
  CheckCircle2,
  Download,
  Building2,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SalesInvoice } from '../../../server/accounting/accountingTypes';
import { SalesInvoiceCreateModal } from './SalesInvoiceCreateModal';
import { SalesInvoicePrintDocument } from './SalesInvoicePrintDocument';

interface SalesInvoicesRegisterTabProps {
  token?: string | null;
  onNavigateTo?: (tabId: string) => void;
}

export const SalesInvoicesRegisterTab: React.FC<SalesInvoicesRegisterTabProps> = ({
  token,
  onNavigateTo
}) => {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingDraft, setEditingDraft] = useState<SalesInvoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<SalesInvoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<SalesInvoice | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Alerts
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [selectedStatus, selectedCustomerId, startDate, endDate]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/v1/accounting/invoices?';
      if (selectedStatus !== 'ALL') url += `status=${selectedStatus}&`;
      if (selectedCustomerId !== 'ALL') url += `customerId=${selectedCustomerId}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.data) setInvoices(json.data);
    } catch (e: any) {
      console.error('Error fetching sales invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatInr = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalInvoice || !cancelReason.trim()) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/accounting/invoices/${cancelModalInvoice.id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: cancelReason })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to cancel invoice.');

      setNotice({
        type: 'success',
        message: `Invoice ${cancelModalInvoice.invoiceNumber} cancelled safely. Inventory restored and double-entry voucher reversed.`
      });
      setCancelModalInvoice(null);
      setCancelReason('');
      fetchInvoices();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    }
  };

  // KPI Calculations
  const totalInvoiced = invoices
    .filter(inv => inv.status === 'POSTED')
    .reduce((sum, inv) => sum + inv.finalTotal, 0);

  const totalCollected = invoices
    .filter(inv => inv.status === 'POSTED')
    .reduce((sum, inv) => sum + inv.amountReceived, 0);

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'POSTED')
    .reduce((sum, inv) => sum + inv.outstandingBalance, 0);

  const draftCount = invoices.filter(inv => inv.status === 'DRAFT').length;

  // Filtered List based on search term
  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.customerCode && inv.customerCode.toLowerCase().includes(q)) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
      inv.items.some(it => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q) || it.batchNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Tax Sales Invoices & Billing Register
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              F8 Billing
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tally-style product invoicing integrated with real batch inventory, GST rates, and double-entry ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDraft(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Sales Invoice
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Total Invoiced (Posted)</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{formatInr(totalInvoiced)}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Reconciled with Sales A/c
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Collected Receipts</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{formatInr(totalCollected)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Direct Bank & Immediate receipts</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Receivables Outstanding</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">{formatInr(totalOutstanding)}</div>
          <div className="text-[11px] text-red-400/80 mt-1">Pending Customer Settlements</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Draft Invoices</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{draftCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Saved without ledger or stock lock</div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, lab, product or batch..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs self-stretch md:self-auto">
            {['ALL', 'POSTED', 'DRAFT', 'CANCELLED'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer capitalize ${
                  selectedStatus === st
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter & Clear */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs"
            />
          </div>
          {(startDate || endDate || searchTerm) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
              }}
              className="text-xs text-emerald-400 hover:underline cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading sales invoices from authoritative engine...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No sales invoices found.</p>
            <p className="text-xs text-slate-500">
              Create a new sales invoice with product and batch selection to begin.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingDraft(null);
                setIsCreateModalOpen(true);
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create First Sales Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">Customer & Lab</th>
                  <th className="py-3 px-3 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 text-right">Tax (₹)</th>
                  <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                  <th className="py-3 px-3 text-right">Paid (₹)</th>
                  <th className="py-3 px-3 text-right">Outstanding (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    {/* Invoice Number */}
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {inv.invoiceNumber}
                      {inv.voucherNumber && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          Vch: {inv.voucherNumber}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {inv.invoiceDate}
                      <div className="text-[10px] text-slate-500">Due: {inv.dueDate}</div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.customerGstin ? `GSTIN: ${inv.customerGstin}` : 'No GSTIN'} • {inv.customerState}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'} (
                        {inv.items.map(it => it.sku).slice(0, 2).join(', ')}
                        {inv.items.length > 2 ? '...' : ''})
                      </div>
                    </td>

                    {/* Taxable */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {formatInr(inv.taxableAmount)}
                    </td>

                    {/* Tax */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {formatInr(inv.totalTax)}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatInr(inv.finalTotal)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      {formatInr(inv.amountReceived)}
                    </td>

                    {/* Outstanding */}
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={inv.outstandingBalance > 0 ? 'text-red-400' : 'text-slate-500'}>
                        {formatInr(inv.outstandingBalance)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                          inv.status === 'POSTED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : inv.status === 'DRAFT'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview / Print */}
                        <button
                          type="button"
                          onClick={() => setPrintInvoice(inv)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                          title="Print Tax Invoice (Original / Duplicate / Triplicate)"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-400" />
                        </button>

                        {/* Edit Draft */}
                        {inv.status === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDraft(inv);
                              setIsCreateModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded text-[11px] font-semibold transition cursor-pointer"
                            title="Edit Draft"
                          >
                            Edit
                          </button>
                        )}

                        {/* Cancel Invoice */}
                        {inv.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setCancelModalInvoice(inv)}
                            className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                            title="Safe Reverse / Cancel Invoice"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Invoice Modal */}
      {isCreateModalOpen && (
        <SalesInvoiceCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingDraft(null);
          }}
          onSuccess={() => {
            fetchInvoices();
            setNotice({
              type: 'success',
              message: 'Sales invoice committed successfully.'
            });
          }}
          token={token}
          existingDraft={editingDraft}
        />
      )}

      {/* Print Document Modal */}
      {printInvoice && (
        <SalesInvoicePrintDocument
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
          token={token}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Cancel Sales Invoice</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to cancel invoice <strong className="text-white font-mono">{cancelModalInvoice.invoiceNumber}</strong> for{' '}
              <strong className="text-white">{cancelModalInvoice.customerName}</strong>?
              <br /><br />
              <span className="text-amber-400 font-semibold">Controlled Accounting Reversal:</span> This will safely restore batch inventory quantities, append an inventory reversal audit log, and cancel the associated double-entry accounting voucher.
            </p>
            <form onSubmit={handleCancelInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Cancellation <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer cancelled order / Wrong batch tagged / Damaged lot replaced"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalInvoice(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 cursor-pointer"
                >
                  Confirm Reversal & Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
