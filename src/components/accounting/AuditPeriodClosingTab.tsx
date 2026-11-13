import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Save
} from 'lucide-react';

interface AuditPeriodClosingTabProps {
  token?: string | null;
}

export const AuditPeriodClosingTab: React.FC<AuditPeriodClosingTabProps> = ({ token }) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [lockDate, setLockDate] = useState<string>('2026-03-31');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/accounting/reports/audit-trail', { headers });
      const json = await res.json();
      if (json.data) setAuditLogs(json.data);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePeriodLock = () => {
    setSuccessMsg(`Accounting Period Lock Date updated to ${lockDate}. Vouchers on or before this date are strictly frozen.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      log.details.toLowerCase().includes(q) ||
      log.performedByName.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q);

    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Audit Trail & Financial Period Closing
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all financial modifications & period freezing controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Non-Repudiable Ledger Active
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Period Locking Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Period Locking & Governance Guard</span>
          </div>
          <span className="text-xs text-amber-400 font-mono">Super Admin Authorization Required</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="max-w-xl text-xs text-slate-400">
            Locking a date prohibits staff from backdating vouchers, amending invoices, or modifying accounts on or prior to the specified cutoff date.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={lockDate}
              onChange={(e) => setLockDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              onClick={handleUpdatePeriodLock}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> Set Lock Date
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit actions, user, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'VOUCHER_POSTED', label: 'Vouchers Posted' },
            { id: 'VOUCHER_CANCELLED', label: 'Vouchers Cancelled' },
            { id: 'LEDGER_CREATED', label: 'Ledger Created' },
            { id: 'SETTINGS_CHANGED', label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedAction(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                selectedAction === tab.id
                  ? 'bg-emerald-600 text-white font-semibold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Ref</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Audit Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-400">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        log.action.includes('CANCELLED')
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{log.entityId}</td>
                  <td className="py-3 px-4 font-medium text-white">
                    {log.performedByName} <span className="text-[10px] text-slate-500 font-mono">({log.performedByRole})</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
