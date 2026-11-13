import React, { useState, useEffect } from 'react';
import { MyWorkItem, WorkItemPriority, WorkItemStatus, WorkItemModule, UserRoleType } from '../types';
import {
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  ArrowUpRight,
  RefreshCw,
  Tag,
  CheckSquare,
  Flame,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface MyWorkInboxViewProps {
  onNavigateTab: (tabId: string) => void;
  token?: string | null;
  currentRole: UserRoleType;
}

export const MyWorkInboxView: React.FC<MyWorkInboxViewProps> = ({
  onNavigateTab,
  token,
  currentRole
}) => {
  const [items, setItems] = useState<MyWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const fetchWorkItems = async () => {
    setIsLoading(true);
    try {
      let url = `/api/v1/my-work?role=${currentRole}`;
      if (selectedModule !== 'ALL') url += `&module=${selectedModule}`;
      if (selectedPriority !== 'ALL') url += `&priority=${selectedPriority}`;
      if (selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching work items', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkItems();
  }, [selectedModule, selectedPriority, selectedStatus, currentRole]);

  const handleUpdateStatus = async (id: string, newStatus: WorkItemStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingItemId(id);
    try {
      const res = await fetch(`/api/v1/my-work/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setItems(prev =>
          prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Error updating work item status', err);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const getPriorityBadge = (p: WorkItemPriority) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3C7C2]/60 text-[#B94A40] border border-[#B94A40]/30 flex items-center gap-1"><Flame className="w-3 h-3 text-[#B94A40]" /> CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4DFA3]/60 text-[#7A5A1B] border border-[#C58A16]/30">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C9DDE0]/60 text-[#1E331B] border border-[#4C8994]/30">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">LOW</span>;
    }
  };

  const getStatusBadge = (s: WorkItemStatus) => {
    switch (s) {
      case 'OVERDUE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F3C7C2]/50 text-[#B94A40] border border-[#B94A40]/30">OVERDUE</span>;
      case 'DUE TODAY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4DFA3]/50 text-[#7A5A1B] border border-[#C58A16]/30">DUE TODAY</span>;
      case 'HIGH PRIORITY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4DFA3]/80 text-[#7A5A1B] border border-[#C58A16]/30">HIGH PRIORITY</span>;
      case 'WAITING FOR APPROVAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4DFA3]/50 text-[#7A5A1B] border border-[#C58A16]/20">AWAITING APPROVAL</span>;
      case 'IN PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#C9DDE0]/50 text-[#1E331B] border border-[#4C8994]/30">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">PENDING</span>;
    }
  };

  const overdueCount = items.filter(i => i.status === 'OVERDUE').length;
  const dueTodayCount = items.filter(i => i.status === 'DUE TODAY').length;
  const pendingCount = items.filter(i => i.status !== 'COMPLETED').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30">
              OPERATIONAL INBOX
            </span>
            <span className="text-xs text-slate-400 font-medium">● Dynamic Cross-Module Aggregation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Inbox className="w-6 h-6 text-[#1E331B]" />
            Unified "My Work" Inbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Aggregated real-time operational tasks from Orders, Payments, Approvals, Complaints, PM, and Ledger reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium">
            <span className="text-slate-500">Active Tasks:</span>
            <span className="font-bold text-slate-900">{pendingCount}</span>
            {overdueCount > 0 && (
              <span className="text-[#B94A40] font-bold bg-[#F3C7C2]/40 px-1.5 py-0.5 rounded border border-[#B94A40]/30">
                {overdueCount} Overdue
              </span>
            )}
          </div>

          <button
            onClick={fetchWorkItems}
            disabled={isLoading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh tasks"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1E331B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F3C7C2]/30 border border-[#F3C7C2] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#B94A40] uppercase tracking-wider">Overdue Tasks</div>
            <div className="text-2xl font-extrabold text-[#B94A40] mt-0.5">{overdueCount}</div>
            <div className="text-[11px] text-[#B94A40] mt-0.5">Immediate attention required</div>
          </div>
          <div className="p-3 bg-[#F3C7C2] text-[#B94A40] border border-[#B94A40]/20 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#F4DFA3]/40 border border-[#F4DFA3] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#7A5A1B] uppercase tracking-wider">Due Today</div>
            <div className="text-2xl font-extrabold text-[#7A5A1B] mt-0.5">{dueTodayCount}</div>
            <div className="text-[11px] text-[#7A5A1B] mt-0.5">Target SLA before EOD</div>
          </div>
          <div className="p-3 bg-[#F4DFA3] text-[#C58A16] border border-[#C58A16]/20 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#C9DDE0]/40 border border-[#C9DDE0] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#245B63] uppercase tracking-wider">Total Pending Work</div>
            <div className="text-2xl font-extrabold text-[#1E331B] mt-0.5">{pendingCount}</div>
            <div className="text-[11px] text-[#245B63] mt-0.5">Across authorized modules</div>
          </div>
          <div className="p-3 bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/20 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task title, module, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchWorkItems()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Modules</option>
            <option value="ORDERS">Orders</option>
            <option value="PAYMENTS">Payments</option>
            <option value="APPROVALS">Approvals</option>
            <option value="CUSTOMERS">Customers</option>
            <option value="SERVICE">Service & Complaints</option>
            <option value="PM">Preventive Maintenance</option>
            <option value="LEDGER">Customer Ledger</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">Overdue</option>
            <option value="DUE TODAY">Due Today</option>
            <option value="WAITING FOR APPROVAL">Waiting Approval</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <button
            onClick={fetchWorkItems}
            className="px-3.5 py-2 bg-[#22381E] hover:bg-[#1E331B] text-white font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Task List Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E331B]" />
            <span className="text-xs font-medium">Aggregating live operational tasks...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-[#5F8F4D]" />
            <h4 className="text-sm font-bold text-slate-700">Inbox Zero</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              All assigned tasks for your role are up-to-date and compliant with backend business rules.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.navigationTab)}
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left Task Details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(item.priority)}
                    {getStatusBadge(item.status)}
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">
                      Module: {item.module}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#1E331B] transition-colors flex items-center gap-1.5">
                    <span>{item.title}</span>
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.shortDescription}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(item.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>Role Target: {item.assignedUserRole || 'Authorized Staff'}</span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status !== 'COMPLETED' ? (
                    <button
                      onClick={(e) => handleUpdateStatus(item.id, 'COMPLETED', e)}
                      disabled={updatingItemId === item.id}
                      className="px-3 py-1.5 bg-[#D2E7C4]/50 hover:bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5F8F4D]" />
                      <span>Mark Done</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-[#5F8F4D] flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}

                  <button
                    onClick={() => onNavigateTab(item.navigationTab)}
                    className="px-3 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-98"
                  >
                    <span>Open Record</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D2E7C4]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
