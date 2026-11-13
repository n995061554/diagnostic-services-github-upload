import React, { useState, useEffect } from 'react';
import {
  Landmark,
  DollarSign,
  Calendar,
  Search,
  Download,
  Printer,
  Scale
} from 'lucide-react';

interface CashBankBookTabProps {
  token?: string | null;
}

export const CashBankBookTab: React.FC<CashBankBookTabProps> = ({ token }) => {
  const [selectedBook, setSelectedBook] = useState<'CASH' | 'BANK'>('BANK');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('led-bank-hdfc');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAccounts();
  }, [selectedBook]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchStatement();
    }
  }, [selectedAccountId]);

  const fetchAccounts = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/accounting/ledgers?type=${selectedBook}`, { headers });
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setAccounts(json.data);
        setSelectedAccountId(json.data[0].id);
      }
    } catch (e) {
      console.error('Error fetching accounts:', e);
    }
  };

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/accounting/reports/general-ledger/${selectedAccountId}`, { headers });
      const json = await res.json();
      if (json.data) setStatement(json.data);
    } catch (e) {
      console.error('Error fetching book statement:', e);
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

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {selectedBook === 'BANK' ? (
              <Landmark className="w-5 h-5 text-purple-400" />
            ) : (
              <DollarSign className="w-5 h-5 text-emerald-400" />
            )}
            {selectedBook === 'BANK' ? 'Bank Book (Bank Accounts Ledger)' : 'Cash Book (Petty Cash Ledger)'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Running double-entry cash and bank movements directly from the posted ledger.
          </p>
        </div>

        {/* Switcher & Account Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setSelectedBook('BANK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                selectedBook === 'BANK'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bank Book
            </button>
            <button
              onClick={() => setSelectedBook('CASH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                selectedBook === 'CASH'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cash Book
            </button>
          </div>

          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Opening Balance b/f</span>
          <span className="text-xl font-bold text-slate-200 font-mono">
            {formatInr(statement?.openingBalance || 0)} {statement?.openingBalanceType}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">At start of financial period</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Period Receipts (Dr)</span>
          <span className="text-xl font-bold text-blue-400 font-mono">
            {formatInr(statement?.totalDebit || 0)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Inward cash/bank collections</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Current Book Balance</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            {formatInr(statement?.closingBalance || 0)} {statement?.closingBalanceType}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Closing available balance</span>
        </div>
      </div>

      {/* Book Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4 text-right">Inward Receipts (Dr)</th>
                <th className="py-3 px-4 text-right">Disbursements (Cr)</th>
                <th className="py-3 px-4 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {statement?.transactions?.map((t: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 text-slate-400">{t.date}</td>
                  <td className="py-2.5 px-4 font-mono font-medium text-emerald-400">{t.voucherNumber}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {t.voucherType}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-white font-medium max-w-xs truncate">{t.narration}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-400">
                    {t.debit > 0 ? formatInr(t.debit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-amber-400">
                    {t.credit > 0 ? formatInr(t.credit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                    {formatInr(t.runningBalance)} {t.runningBalanceType}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950 font-mono font-bold text-xs text-white border-t border-slate-800">
              <tr>
                <td colSpan={4} className="py-3 px-4">Net Closing Balance c/d</td>
                <td className="py-3 px-4 text-right text-blue-400">{formatInr(statement?.totalDebit || 0)}</td>
                <td className="py-3 px-4 text-right text-amber-400">{formatInr(statement?.totalCredit || 0)}</td>
                <td className="py-3 px-4 text-right text-emerald-400">
                  {formatInr(statement?.closingBalance || 0)} {statement?.closingBalanceType}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
