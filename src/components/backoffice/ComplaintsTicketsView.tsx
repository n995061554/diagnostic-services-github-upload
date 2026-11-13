import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../../types';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2,
  ChevronRight,
  RefreshCw,
  Plus,
  MessageSquare,
  ShieldAlert,
  Send,
  Calendar,
  X
} from 'lucide-react';

interface ComplaintsTicketsViewProps {
  token?: string | null;
  currentRole: UserRoleType;
  currentUser?: User | null;
  onNavigateTab: (tabId: string) => void;
}

export const ComplaintsTicketsView: React.FC<ComplaintsTicketsViewProps> = ({
  token,
  currentRole,
  currentUser,
  onNavigateTab,
}) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Ticket Modal / Drawer
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>('IN_PROGRESS');
  const [assignedStaff, setAssignedStaff] = useState<string>('Vikram Malhotra (Senior Application Specialist)');
  const [resolutionComment, setResolutionComment] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/service/tickets', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.tickets)
          ? json.tickets
          : (Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
        setTickets(list);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerLabName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerContactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      t.status === statusFilter ||
      (statusFilter === 'OPEN' && ['NEW', 'ASSIGNED', 'ACKNOWLEDGED', 'SCHEDULED', 'ON_THE_WAY'].includes(t.status)) ||
      (statusFilter === 'IN_PROGRESS' && ['IN_PROGRESS', 'WAITING_FOR_PARTS', 'CUSTOMER_FEEDBACK_PENDING', 'BACK_OFFICE_REVIEW'].includes(t.status)) ||
      (statusFilter === 'WAITING_FOR_CUSTOMER' && ['CUSTOMER_FEEDBACK_PENDING', 'CUSTOMER_DISPUTED_RESOLUTION'].includes(t.status));
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/v1/service/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          comment: resolutionComment || `Status updated to ${newStatus} from complaints console`,
        }),
      });

      if (res.ok) {
        showToast(`Ticket ${selectedTicket.ticketNumber || selectedTicket.id} updated to ${newStatus}.`);
        setSelectedTicket(null);
        setResolutionComment('');
        fetchTickets();
      } else {
        const errJson = await res.json().catch(() => ({}));
        showToast(errJson.message || `Failed to update ticket ${selectedTicket.ticketNumber || selectedTicket.id}.`);
      }
    } catch (err) {
      showToast('Network error while updating ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E1035] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#2B3D5B] flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0E1035] text-white rounded-2xl p-6 shadow-md border border-[#15253F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#2B3D5B] text-[#D0DEE5]">
              Customer Service Desk
            </span>
            <span className="text-xs text-[#7C8594]">● SLA Compliance Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Complaints &amp; Support Tickets
          </h1>
          <p className="text-xs sm:text-sm text-[#D0DEE5] mt-0.5">
            Track customer complaints, reagent QC anomalies, hardware breakdowns, and assign application specialists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets()}
            disabled={isLoading}
            className="p-2.5 bg-[#15253F] hover:bg-[#2B3D5B] text-white rounded-xl border border-[#2B3D5B] transition cursor-pointer"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Quick Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Tickets' },
          { id: 'OPEN', label: 'Open' },
          { id: 'ASSIGNED', label: 'Assigned' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'WAITING_FOR_CUSTOMER', label: 'Waiting for Customer' },
          { id: 'RESOLVED', label: 'Resolved' },
          { id: 'CLOSED', label: 'Closed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-[#0E1035] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Priority Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket #, customer, issue summary..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#0E1035] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:border-[#0E1035] focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical (&le; 2h SLA)</option>
            <option value="HIGH">High (&le; 4h SLA)</option>
            <option value="MEDIUM">Medium (&le; 8h SLA)</option>
            <option value="LOW">Low (&le; 24h SLA)</option>
          </select>
        </div>
      </div>

      {/* Tickets Table (Section 10 Columns) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[#2B3D5B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-3">Customer Lab</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">SLA Compliance</th>
                <th className="py-3 px-3">Assigned Employee</th>
                <th className="py-3 px-3">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Ticket ID */}
                  <td className="py-3 px-4 font-mono font-bold text-[#0E1035]">
                    {t.ticketNumber || `TKT-2026-${t.id.slice(-4)}`}
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 truncate max-w-[150px]">
                      {t.customerLabName || t.customerName || 'Apex Clinical Laboratories'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.customerContactPerson || 'Primary Site'}</div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    <div>{t.category}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px] font-normal">{t.title}</div>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      t.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      t.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      t.status === 'ASSIGNED' ? 'bg-purple-100 text-purple-800' :
                      t.status === 'WAITING_FOR_CUSTOMER' ? 'bg-slate-100 text-slate-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* SLA */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      t.slaStatus === 'BREACHED' ? 'bg-rose-100 text-rose-800' :
                      t.slaStatus === 'AT_RISK' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {t.slaStatus || 'WITHIN_SLA'}
                    </span>
                  </td>

                  {/* Assigned Employee */}
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {t.assignedEngineerName || 'Unassigned'}
                  </td>

                  {/* Created Date */}
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                    {t.createdAt?.split('T')[0] || '2026-10-02'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedTicket(t);
                        setNewStatus(t.status);
                        setAssignedStaff(t.assignedEngineerName || 'Vikram Malhotra (Senior Application Specialist)');
                      }}
                      className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredTickets.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No tickets found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#2B3D5B]" />
                <h3 className="text-base font-bold text-[#0E1035]">
                  Manage Ticket {selectedTicket.ticketNumber || `TKT-${selectedTicket.id}`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedTicket.customerLabName || selectedTicket.customerName || 'Apex Clinical Laboratories'}</div>
                <div className="text-slate-600 mt-1 font-medium">{selectedTicket.title}</div>
                <div className="text-slate-500 mt-0.5">{selectedTicket.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-bold"
                  >
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Assign Specialist</label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  >
                    <option value="Vikram Malhotra (Senior Application Specialist)">Vikram Malhotra (Senior Specialist)</option>
                    <option value="Dr. Sneha Roy (Quality Control Manager)">Dr. Sneha Roy (QC Manager)</option>
                    <option value="Pooja Mehta (Field Service Engineer)">Pooja Mehta (Field Engineer)</option>
                    <option value="Rohan Deshmukh (Customer Care Lead)">Rohan Deshmukh (Support Lead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">Resolution / Progress Notes</label>
                <textarea
                  rows={3}
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                  placeholder="Record diagnostics actions, reagent lot batch replacements, or instructions provided to the lab technician..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-[#0E1035] hover:bg-[#15253F] text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Ticket Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
