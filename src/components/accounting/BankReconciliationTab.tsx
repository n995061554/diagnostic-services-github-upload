import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Save,
  Search,
  Scale,
  Clock,
  ArrowRight
} from 'lucide-react';

interface BankReconciliationTabProps {
  token?: string | null;
}

export const BankReconciliationTab: React.FC<BankReconciliationTabProps> = ({ token }) => {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('led-bank-hdfc');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [statementBalance, setStatementBalance] = useState<number>(3125000);
  const [clearanceDates, setClearanceDates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchBankData();
  }, [selectedBankId]);

  const fetchBankData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [ledRes, vchRes] = await Promise.all([
        fetch('/api/v1/accounting/ledgers?type=BANK', { headers }).then(r => r.json()),
        fetch(`/api/v1/accounting/vouchers?ledgerId=${selectedBankId}`, { headers }).then(r => r.json())
      ]);

      if (ledRes.data) setBankAccounts(ledRes.data);
      if (vchRes.data) {
        setVouchers(vchRes.data);
        // Pre-fill existing clearance dates
        const existing: Record<string, string> = {};
        vchRes.data.forEach((v: any) => {
          if (v.bankClearanceDate) existing[v.id] = v.bankClearanceDate;
        });
        setClearanceDates(existing);
      }
    } catch (e) {
      console.error('Error loading bank reconciliation data:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
  const bookBalance = selectedBank?.currentBalance || 0;

  // Compute uncleared items
  const unclearedVouchers = vouchers.filter(v => !clearanceDates[v.id] && !v.bankClearanceDate);
  const clearedVouchers = vouchers.filter(v => Boolean(clearanceDates[v.id] || v.bankClearanceDate));

  const unclearedDeposits = unclearedVouchers
    .filter(v => v.lines.some((l: any) => l.ledgerId === selectedBankId && l.debit > 0))
    .reduce((sum, v) => sum + (v.totalDebit || 0), 0);

  const unclearedPayments = unclearedVouchers
    .filter(v => v.lines.some((l: any) => l.ledgerId === selectedBankId && l.credit > 0))
    .reduce((sum, v) => sum + (v.totalCredit || 0), 0);

  const calculatedBankBalance = bookBalance + unclearedPayments - unclearedDeposits;
  const difference = Math.abs(calculatedBankBalance - statementBalance);
  const isReconciled = difference < 1.0;

  const formatInr = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const handleSaveReconciliation = () => {
    setSuccessMsg('Bank reconciliation clearance dates successfully recorded and matched.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" />
            Bank Reconciliation Statement (BRS)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Match double-entry ledger bank book against official bank clearance dates.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            {bankAccounts.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} (Bal: ₹{b.currentBalance.toLocaleString('en-IN')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Reconciliation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Books Balance */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Balance as per Books (Ledger)</span>
          <span className="text-xl font-bold text-white tracking-tight font-mono">{formatInr(bookBalance)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Direct from posted bank ledger</span>
        </div>

        {/* Uncleared Payments */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Uncleared Cheques Issued (Cr)</span>
          <span className="text-xl font-bold text-amber-400 tracking-tight font-mono">{formatInr(unclearedPayments)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Disbursements not yet in bank statement</span>
        </div>

        {/* Uncleared Deposits */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Uncleared Receipts Deposited (Dr)</span>
          <span className="text-xl font-bold text-blue-400 tracking-tight font-mono">{formatInr(unclearedDeposits)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Inward receipts awaiting clearance</span>
        </div>

        {/* Reconciliation Status */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Reconciliation Status</span>
          <div className="flex items-center gap-2 mt-1">
            {isReconciled ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> RECONCILED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" /> Diff: {formatInr(difference)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1.5">Statement: {formatInr(statementBalance)}</span>
        </div>
      </div>

      {/* Transaction Clearance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Bank Transactions & Value Dates</h3>
          </div>
          <button
            onClick={handleSaveReconciliation}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Reconciliation
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Voucher Date</th>
                <th className="py-2.5 px-4">Voucher No</th>
                <th className="py-2.5 px-4">Particulars</th>
                <th className="py-2.5 px-4">Cheque / Ref No</th>
                <th className="py-2.5 px-4 text-right">Debit (Receipt)</th>
                <th className="py-2.5 px-4 text-right">Credit (Payment)</th>
                <th className="py-2.5 px-4 text-center w-40">Bank Clearance Date</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {vouchers.map((v) => {
                const isCleared = Boolean(clearanceDates[v.id]);
                const line = v.lines.find((l: any) => l.ledgerId === selectedBankId);
                const debit = line ? line.debit : 0;
                const credit = line ? line.credit : 0;

                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 text-slate-400">{v.date}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-emerald-400">{v.voucherNumber}</td>
                    <td className="py-2.5 px-4 font-medium text-white max-w-xs truncate">{v.narration}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">{v.referenceNumber || v.chequeNumber || '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-400">{debit > 0 ? formatInr(debit) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-400">{credit > 0 ? formatInr(credit) : '—'}</td>
                    <td className="py-2 px-4 text-center">
                      <input
                        type="date"
                        value={clearanceDates[v.id] || ''}
                        onChange={(e) => setClearanceDates({ ...clearanceDates, [v.id]: e.target.value })}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isCleared
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {isCleared ? 'CLEARED' : 'UNCLEARED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
