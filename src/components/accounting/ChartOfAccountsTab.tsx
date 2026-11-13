import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Search,
  Building2,
  Landmark,
  Scale,
  CreditCard,
  CheckCircle2,
  X,
  Edit2,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ChartOfAccountsTabProps {
  token?: string | null;
  onNavigateTo?: (screen: string) => void;
}

export const ChartOfAccountsTab: React.FC<ChartOfAccountsTabProps> = ({ token, onNavigateTo }) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<string>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [groupsRes, ledgersRes] = await Promise.all([
        fetch('/api/v1/accounting/groups', { headers }).then(r => r.json()),
        fetch('/api/v1/accounting/ledgers', { headers }).then(r => r.json())
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (ledgersRes.data) setLedgers(ledgersRes.data);
    } catch (e) {
      console.error('Error fetching Chart of Accounts:', e);
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

  const filteredLedgers = ledgers.filter(l => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.gstin && l.gstin.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedPrimaryType === 'ALL') return true;
    const grp = groups.find(g => g.id === l.groupId);
    return grp?.primaryType === selectedPrimaryType;
  });

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            Chart of Accounts & Ledger Master
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard Chart of Accounts synchronized from External Tally ERP 9 / TallyPrime ({groups.length} Groups, {ledgers.length} Ledgers)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigateTo ? onNavigateTo('tally_integration') : null}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2 font-mono"
            title="Manage Ledgers and Groups in External Tally ERP"
          >
            <RefreshCw className="w-4 h-4" />
            Manage in External Tally
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search account name, code, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Primary Classification Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'ASSETS', label: 'Assets' },
            { id: 'LIABILITIES', label: 'Liabilities' },
            { id: 'INCOME', label: 'Income' },
            { id: 'EXPENSES', label: 'Expenses' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedPrimaryType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition shrink-0 ${
                selectedPrimaryType === tab.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Ledger Account Name</th>
                <th className="py-3 px-4">Parent Group</th>
                <th className="py-3 px-4">Account Type</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                <th className="py-3 px-4 text-center">GSTIN / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLedgers.map((ledger) => {
                const group = groups.find(g => g.id === ledger.groupId);
                const isDebit = ledger.currentBalanceType === 'DEBIT';

                return (
                  <tr key={ledger.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-emerald-400">{ledger.accountNumber}</td>
                    <td className="py-3 px-4 font-medium text-white">{ledger.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300">{group?.name || ledger.groupName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {group?.primaryType || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {ledger.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatInr(ledger.openingBalance)} {ledger.openingBalanceType}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={isDebit ? 'text-blue-400' : 'text-emerald-400'}>
                        {formatInr(ledger.currentBalance)} {ledger.currentBalanceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ledger.gstin ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                          {ledger.gstin}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
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
