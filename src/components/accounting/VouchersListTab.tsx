import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Calendar,
  Filter,
  Eye,
  RotateCcw,
  AlertTriangle,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { VoucherType } from '../../../server/accounting/accountingTypes';

interface VouchersListTabProps {
  initialType?: VoucherType | 'ALL';
  token?: string | null;
}

export const VouchersListTab: React.FC<VouchersListTabProps> = ({
  initialType = 'ALL',
  token
}) => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>(initialType);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [cancelModalVoucher, setCancelModalVoucher] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, [selectedType]);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = '/api/v1/accounting/vouchers';
      if (selectedType !== 'ALL') {
        url += `?type=${selectedType}`;
      }

      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.data) setVouchers(json.data);
    } catch (e) {
      console.error('Error fetching vouchers:', e);
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

  const handleCancelVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalVoucher || !cancelReason.trim()) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/accounting/vouchers/${cancelModalVoucher.id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: cancelReason })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to cancel voucher.');
      }

      setNotice({
        type: 'success',
        message: `Voucher ${cancelModalVoucher.voucherNumber} has been safely cancelled and ledger balances reversed.`
      });
      setCancelModalVoucher(null);
      setCancelReason('');
      fetchVouchers();
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    }
  };

  const filteredVouchers = vouchers.filter(v => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      v.voucherNumber.toLowerCase().includes(q) ||
      (v.referenceNumber && v.referenceNumber.toLowerCase().includes(q)) ||
      (v.narration && v.narration.toLowerCase().includes(q)) ||
      v.lines.some((l: any) => l.ledgerName.toLowerCase().includes(q));

    return matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Header & Voucher Type Shortcuts */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Vouchers Register & Day Book
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable double-entry vouchers with safe reversals and audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
            Source: External Tally ERP 9 / TallyPrime
          </span>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Type Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'ALL', label: 'All Vouchers' },
          { id: 'SALES_INVOICE', label: 'Sales Invoices' },
          { id: 'PURCHASE_BILL', label: 'Purchase Bills' },
          { id: 'RECEIPT', label: 'Receipts' },
          { id: 'PAYMENT', label: 'Payments' },
          { id: 'JOURNAL', label: 'Journal' },
          { id: 'CONTRA', label: 'Contra' },
          { id: 'CREDIT_NOTE', label: 'Credit Notes' },
          { id: 'DEBIT_NOTE', label: 'Debit Notes' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              selectedType === tab.id
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by voucher #, reference, party..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Vouchers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4">Reference No</th>
                <th className="py-3 px-4 text-right">Debit Amount</th>
                <th className="py-3 px-4 text-right">Credit Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-emerald-400">{v.voucherNumber}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                      {v.voucherType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{v.date}</td>
                  <td className="py-3 px-4 max-w-xs truncate" title={v.narration}>
                    <span className="font-medium text-white block">
                      {v.lines?.[0]?.ledgerName || 'Multiple Ledgers'}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">{v.narration}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{v.referenceNumber || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-white">
                    {formatInr(v.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-white">
                    {formatInr(v.totalCredit)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        v.status === 'POSTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedVoucher(v)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="View Voucher Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {v.status === 'POSTED' && (
                        <button
                          onClick={() => {
                            setCancelModalVoucher(v);
                            setCancelReason('');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                          title="Safe Reversal / Cancel"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  {selectedVoucher.voucherType}
                </span>
                <h3 className="text-base font-bold text-white">
                  Voucher: {selectedVoucher.voucherNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date</span>
                  <span className="font-semibold text-white">{selectedVoucher.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Reference</span>
                  <span className="font-mono text-emerald-400">{selectedVoucher.referenceNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <span className="font-bold text-emerald-400">{selectedVoucher.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Posted By</span>
                  <span className="font-medium text-slate-200 truncate block">{selectedVoucher.postedBy}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">Double-Entry Lines</span>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Ledger Account</th>
                        <th className="py-2.5 px-3">Narration</th>
                        <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                        <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {selectedVoucher.lines?.map((line: any) => (
                        <tr key={line.id}>
                          <td className="py-2.5 px-3 font-medium text-white">{line.ledgerName}</td>
                          <td className="py-2.5 px-3 text-slate-400">{line.narration || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                            {line.debit > 0 ? formatInr(line.debit) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                            {line.credit > 0 ? formatInr(line.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-950/80 font-bold border-t border-slate-800 font-mono text-xs text-white">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3">Grand Total</td>
                        <td className="py-2.5 px-3 text-right text-blue-400">{formatInr(selectedVoucher.totalDebit)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">{formatInr(selectedVoucher.totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="font-semibold text-slate-300 block mb-0.5">Narration:</span>
                <p>{selectedVoucher.narration}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe Reversal / Cancellation Modal */}
      {cancelModalVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3>Safe Reversal / Cancellation</h3>
              </div>
              <button
                onClick={() => setCancelModalVoucher(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelVoucher} className="p-6 space-y-4">
              <p className="text-xs text-slate-300">
                You are reversing voucher <strong className="text-white">{cancelModalVoucher.voucherNumber}</strong> (
                {cancelModalVoucher.voucherType}) for <strong className="text-white">{formatInr(cancelModalVoucher.totalDebit)}</strong>.
              </p>
              <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                Note: In strict compliance with Indian accounting standards, vouchers are never deleted. A formal audit log entry is written, and ledger balances are safely unwound.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Cancellation / Correction <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide detailed justification for audit trail compliance..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalVoucher(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
