import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../../types';
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building2,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  FileQuestion,
  Check,
  Cpu,
  Boxes,
  X
} from 'lucide-react';

interface ApplicationRequestsViewProps {
  token?: string | null;
  currentRole: UserRoleType;
  currentUser?: User | null;
  onNavigateTab: (tabId: string) => void;
}

export const ApplicationRequestsView: React.FC<ApplicationRequestsViewProps> = ({
  token,
  currentRole,
  currentUser,
  onNavigateTab,
}) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Request Drawer
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [assignedStaff, setAssignedStaff] = useState<string>('Priya Sharma (Principal Application Specialist)');
  const [commentText, setCommentText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/application-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch application requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'INFO_REQUESTED') => {
    if (!selectedReq) return;
    try {
      const res = await fetch(`/api/v1/application-requests/${selectedReq.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status,
          assignedStaff,
          comment: commentText,
        }),
      });

      if (res.ok) {
        showToast(`Application request marked as ${status}.`);
        setSelectedReq(null);
        setCommentText('');
        fetchRequests();
      }
    } catch (err) {
      alert('Error updating application request');
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.customerLabName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requestType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.analyzerModel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
              Diagnostic Technical Services
            </span>
            <span className="text-xs text-[#7C8594]">● Method Validation &amp; Protocols</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Application Requests Management
          </h1>
          <p className="text-xs sm:text-sm text-[#D0DEE5] mt-0.5">
            Review customer requests for assay protocol calibration, method validation on analyzers, and QC verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRequests()}
            disabled={isLoading}
            className="p-2.5 bg-[#15253F] hover:bg-[#2B3D5B] text-white rounded-xl border border-[#2B3D5B] transition cursor-pointer"
            title="Refresh application requests"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'PENDING_REVIEW', label: 'Pending Review' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'INFO_REQUESTED', label: 'Info Requested' },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'REJECTED', label: 'Rejected' },
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

      {/* Table of Application Requests */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[#2B3D5B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Request Type</th>
                <th className="py-3 px-3">Laboratory</th>
                <th className="py-3 px-3">Analyzer Model</th>
                <th className="py-3 px-3">Reagent Kit</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#0E1035]">{req.requestType}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{req.customerLabName}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{req.analyzerModel}</td>
                  <td className="py-3 px-3 text-slate-700">{req.productName}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      req.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {req.priority || 'MEDIUM'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                      req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{req.assignedStaff || 'Unassigned'}</td>
                  <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{req.createdAt?.split('T')[0] || '2026-10-02'}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedReq(req);
                        setAssignedStaff(req.assignedStaff || 'Priya Sharma (Principal Application Specialist)');
                      }}
                      className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <span>Review</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No application requests match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#2B3D5B]" />
                <h3 className="text-base font-bold text-[#0E1035]">
                  Application Request: {selectedReq.requestType}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Customer Lab:</span>
                  <span className="font-bold text-slate-900">{selectedReq.customerLabName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Analyzer:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedReq.analyzerModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Reagent Assay Kit:</span>
                  <span className="font-semibold text-[#0E1035]">{selectedReq.productName}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Description / Notes:</span>
                  <p className="text-slate-800 mt-0.5">{selectedReq.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">Assign Application Specialist</label>
                <select
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                >
                  <option value="Priya Sharma (Principal Application Specialist)">Priya Sharma (Principal Specialist)</option>
                  <option value="Vikram Malhotra (Senior Application Specialist)">Vikram Malhotra (Senior Specialist)</option>
                  <option value="Dr. Arvind Kulkarni (Scientific Advisor)">Dr. Arvind Kulkarni (Scientific Advisor)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">Specialist Notes &amp; Actions</label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Record calibration protocol steps, validation parameters, or requested information..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('INFO_REQUESTED')}
                  className="px-3 py-1.5 border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-50 cursor-pointer"
                >
                  Request Info
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="px-3 py-1.5 border border-rose-300 text-rose-800 font-bold rounded-xl hover:bg-rose-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('APPROVED')}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
