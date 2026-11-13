import React, { useState, useEffect } from 'react';
import { ApprovalRequest, ApprovalStatus, ApprovalRequestType, UserRoleType } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Plus,
  Send,
  Lock,
  DollarSign,
  Layers,
  ChevronDown
} from 'lucide-react';

interface ApprovalCenterViewProps {
  currentUserId?: string;
  currentUserRole: UserRoleType;
  token?: string | null;
  onNavigateTab: (tabId: string) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({
  currentUserId,
  currentUserRole,
  token,
  onNavigateTab
}) => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  // Modal states
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [modalMode, setModalMode] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Request Modal
  const [showNewRequestModal, setShowNewRequestModal] = useState<boolean>(false);
  const [newRequestType, setNewRequestType] = useState<ApprovalRequestType>('SPECIAL_PRICE_CONTRACT');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newEntityId, setNewEntityId] = useState<string>('prod-002');
  const [newEntityName, setNewEntityName] = useState<string>('Sysmex CELLPACK DCL 20L');
  const [newBeforePrice, setNewBeforePrice] = useState<number>(6800);
  const [newAfterPrice, setNewAfterPrice] = useState<number>(5200);
  const [newFinancialImpact, setNewFinancialImpact] = useState<number>(48000);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      let url = `/api/v1/approvals`;
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.append('status', activeTab);
      if (selectedModule !== 'ALL') params.append('module', selectedModule);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setApprovals(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching approvals', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeTab, selectedModule]);

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/approvals/${selectedApproval.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approvalNotes: actionNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalMode(null);
        setSelectedApproval(null);
        setActionNotes('');
        fetchApprovals();
      } else {
        setErrorMessage(data.message || 'Failed to approve request.');
      }
    } catch (err) {
      setErrorMessage('Network error approving request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    if (!actionNotes.trim()) {
      setErrorMessage('A detailed rejection reason is strictly mandatory.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/approvals/${selectedApproval.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ rejectionReason: actionNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalMode(null);
        setSelectedApproval(null);
        setActionNotes('');
        fetchApprovals();
      } else {
        setErrorMessage(data.message || 'Failed to reject request.');
      }
    } catch (err) {
      setErrorMessage('Network error rejecting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        requestType: newRequestType,
        title: newTitle,
        description: newDescription,
        module: 'PRICING',
        entityId: newEntityId,
        entityName: newEntityName,
        beforeValue: { standardPrice: newBeforePrice },
        afterValue: { proposedContractNet: newAfterPrice },
        financialImpactAmount: newFinancialImpact,
        priority: 'HIGH'
      };

      const res = await fetch('/api/v1/approvals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowNewRequestModal(false);
        setNewTitle('');
        setNewDescription('');
        fetchApprovals();
      } else {
        const d = await res.json();
        setErrorMessage(d.message || 'Failed to create request.');
      }
    } catch (err) {
      setErrorMessage('Network error submitting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canApprove = currentUserRole === UserRoleType.SUPER_ADMIN || currentUserRole === UserRoleType.OFFICE_ADMIN;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/30">
              APPROVAL GOVERNANCE
            </span>
            <span className="text-xs text-slate-400 font-medium">● Dual-Control Authorization Workflow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#22381E]" />
            Centralized Approval Governance Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Strict audit-backed control for sensitive pricing contracts, credit limits, discounts, and customer adjustments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#22381E] hover:bg-[#2E4B29] active:scale-98 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D2E7C4]" />
            <span>Draft Special Approval</span>
          </button>

          <button
            onClick={fetchApprovals}
            disabled={isLoading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh approvals"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#22381E]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Module Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#22381E] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter by Module:</span>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="PRICING">Pricing & Contracts</option>
            <option value="CUSTOMERS">Credit & Customers</option>
            <option value="SERVICE">Service & Goodwill</option>
            <option value="ORDERS">High-Value Orders</option>
          </select>
        </div>
      </div>

      {/* Approval Requests Cards / List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#22381E]" />
            <span className="text-xs font-medium">Loading approval requests...</span>
          </div>
        ) : approvals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-10 h-10 text-[#5F8F4D]" />
            <h4 className="text-sm font-bold text-slate-700">No {activeTab} Approvals</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              All governance requests under this filter have been addressed.
            </p>
          </div>
        ) : (
          approvals.map((req) => {
            const isSelfRequest = Boolean(currentUserId && currentUserId === req.requestedByUserId);

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200 hover:border-[#5F8F4D]/50 rounded-2xl p-5 shadow-xs transition-all space-y-4"
              >
                {/* Top Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#22381E] bg-[#D2E7C4]/40 px-2 py-0.5 rounded border border-[#5F8F4D]/25">
                      {req.requestNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {req.requestType.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      req.status === 'PENDING' ? 'bg-[#F4DFA3] text-[#7A5A1B] border border-[#C58A16]/20' :
                      req.status === 'APPROVED' ? 'bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/30' :
                      'bg-[#F3C7C2] text-[#B94A40] border border-[#B94A40]/30'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Requester: <strong>{req.requestedByUserName}</strong> ({req.requestedByUserRole})
                    </span>
                    <span>●</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(req.requestedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Title and Scope Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {/* VISUAL BEFORE VS AFTER COMPARISON DIFF (SAFE CHANGE AUDIT) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  {/* Before Box */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-slate-400" />
                      Original / Current Value (Before)
                    </div>
                    <div className="text-xs font-semibold text-slate-800 font-mono">
                      {req.beforeValue ? (
                        <pre className="text-[11px] whitespace-pre-wrap text-slate-600">
                          {JSON.stringify(req.beforeValue, null, 2)}
                        </pre>
                      ) : (
                        'Standard Default System Rule'
                      )}
                    </div>
                  </div>

                  {/* After Box */}
                  <div className="bg-[#D2E7C4]/20 p-3 rounded-lg border border-[#5F8F4D]/30 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#22381E] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-[#5F8F4D]" />
                      Proposed New Value (After)
                    </div>
                    <div className="text-xs font-semibold text-[#22381E] font-mono">
                      {req.afterValue ? (
                        <pre className="text-[11px] whitespace-pre-wrap text-[#22381E]">
                          {JSON.stringify(req.afterValue, null, 2)}
                        </pre>
                      ) : (
                        'Custom Adjustment'
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Impact & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <DollarSign className="w-4 h-4 text-[#5F8F4D]" />
                    <span className="text-slate-500">Estimated Financial Impact:</span>
                    <span className="font-bold text-slate-900">
                      ₹{Number(req.financialImpactAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div className="flex items-center gap-2">
                      {/* Self approval restriction note */}
                      {isSelfRequest && currentUserRole !== UserRoleType.SUPER_ADMIN ? (
                        <div className="text-xs text-[#7A5A1B] font-medium flex items-center gap-1.5 bg-[#F4DFA3]/40 px-3 py-1.5 rounded-lg border border-[#F4DFA3]">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Self-Approval Restricted (Another authorized manager must review)</span>
                        </div>
                      ) : canApprove ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedApproval(req);
                              setModalMode('REJECT');
                              setActionNotes('');
                            }}
                            className="px-3.5 py-1.5 bg-white border border-[#B94A40]/30 text-[#B94A40] hover:bg-[#F3C7C2]/30 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Reject Request
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApproval(req);
                              setModalMode('APPROVE');
                              setActionNotes('');
                            }}
                            className="px-4 py-1.5 bg-[#22381E] hover:bg-[#2E4B29] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#D2E7C4]" />
                            <span>Approve & Apply</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">Awaiting Manager Review</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      <span>Reviewed by <strong>{req.reviewedByUserName}</strong></span>
                      {req.approvalNotes && <span className="ml-2 italic text-slate-400">"{req.approvalNotes}"</span>}
                      {req.rejectionReason && <span className="ml-2 text-[#B94A40] font-medium">Reason: "{req.rejectionReason}"</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* APPROVE / REJECT MODAL */}
      {selectedApproval && modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {modalMode === 'APPROVE' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-[#5F8F4D]" />
                    <span>Approve Request {selectedApproval.requestNumber}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-[#B94A40]" />
                    <span>Reject Request {selectedApproval.requestNumber}</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setModalMode(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">{selectedApproval.title}</div>
              <div>Financial Impact: ₹{Number(selectedApproval.financialImpactAmount || 0).toLocaleString('en-IN')}</div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-[#F3C7C2]/40 border border-[#B94A40]/30 text-[#B94A40] text-xs rounded-lg font-medium">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {modalMode === 'APPROVE' ? 'Approval Notes (Optional)' : 'Rejection Reason (Strictly Mandatory)'}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  modalMode === 'APPROVE'
                    ? 'e.g., Approved under Q1 2026 Volume Rebate Framework.'
                    : 'e.g., Net price is below allowable gross margin threshold of 18%.'
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedApproval(null);
                  setModalMode(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {modalMode === 'APPROVE' ? (
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#2E4B29] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#D2E7C4]" />}
                  <span>Confirm Approval</span>
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#B94A40] hover:bg-[#96372E] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Confirm Rejection</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAFT NEW APPROVAL REQUEST MODAL */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#22381E]" />
                <span>Submit Special Approval Request</span>
              </h3>
              <button onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateNewRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Request Type</label>
                <select
                  value={newRequestType}
                  onChange={(e) => setNewRequestType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="SPECIAL_PRICE_CONTRACT">Customer Special Price Contract</option>
                  <option value="CREDIT_LIMIT_INCREASE">Credit Limit Increase</option>
                  <option value="LARGE_DISCOUNT_ORDER">Large Volume Order Discount</option>
                  <option value="WALLET_ADJUSTMENT">Goodwill Wallet Adjustment</option>
                  <option value="SERVICE_QUOTE_SPECIAL">Special Service Quotation</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Request Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Apollo Diagnostics Bulk Reagent Rate Contract"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Business Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe reasons for requested concession..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard / Before (₹)</label>
                  <input
                    type="number"
                    value={newBeforePrice}
                    onChange={(e) => setNewBeforePrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proposed / After (₹)</label>
                  <input
                    type="number"
                    value={newAfterPrice}
                    onChange={(e) => setNewAfterPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Financial Impact (₹)</label>
                <input
                  type="number"
                  value={newFinancialImpact}
                  onChange={(e) => setNewFinancialImpact(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#5F8F4D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#2E4B29] text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-[#D2E7C4]" />}
                  <span>Submit for Dual-Control Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
