import React, { useState } from 'react';
import { AuditLog } from '../types';
import { Shield, Clock, Search, Filter, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLog[];
  onRefreshLogs: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onRefreshLogs }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const q = (search || '').toLowerCase();
    const matchesSearch =
      (log.action || '').toLowerCase().includes(q) ||
      (log.userEmail || '').toLowerCase().includes(q) ||
      (log.module || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#D2E7C4] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#22381E] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#1E331B] rounded flex items-center justify-center text-xs font-bold">06</span>
              <span>Compliance & Security</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise Immutable Security Audit Trail
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Every authentication attempt, role transition, and API guard interception is cryptographically recorded.
            </p>
          </div>

          <button
            onClick={onRefreshLogs}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#F5F6F0] hover:bg-[#E4F1DC] text-[#1E331B] text-xs font-semibold rounded-lg transition-all border border-[#D2E7C4] shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#22381E]" />
            <span>Refresh Audit Feed</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-[#E4F1DC]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by action (e.g. AUTH_LOGIN), user, or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F9FAF6] border border-[#D2E7C4] rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F9FAF6] border border-[#D2E7C4] rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
          >
            <option value="ALL">All Statuses ({logs.length})</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-4 font-semibold text-slate-900">Timestamp</th>
                <th className="p-4 font-semibold text-slate-900">Action & Module</th>
                <th className="p-4 font-semibold text-slate-900">Actor Identity</th>
                <th className="p-4 font-semibold text-slate-900">IP & Client</th>
                <th className="p-4 font-semibold text-slate-900">Status</th>
                <th className="p-4 font-semibold text-slate-900">Metadata Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 text-slate-600 text-[11px] whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-xs">{log.action}</div>
                    <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-900 font-sans font-medium text-xs">{log.userEmail || 'ANONYMOUS'}</div>
                    <div className="text-[10px] text-slate-500 font-sans">{log.userRole || 'GUEST'}</div>
                  </td>
                  <td className="p-4 text-slate-600 text-[11px]">
                    <div className="font-medium text-slate-800">{log.ipAddress}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{log.userAgent}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30'
                          : log.status === 'WARNING'
                          ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/30'
                          : 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/30'
                      }`}
                    >
                      {log.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3 text-[#5F8F4D]" />}
                      {log.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-[#C58A16]" />}
                      {log.status === 'FAILURE' && <XCircle className="w-3 h-3 text-[#B94A40]" />}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-[11px] text-slate-600">
                    <pre className="bg-slate-900 p-2.5 rounded-lg text-slate-200 text-[10px] max-w-[280px] overflow-x-auto shadow-inner">
                      {JSON.stringify(log.details || {}, null, 1)}
                    </pre>
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

