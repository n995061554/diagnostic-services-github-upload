import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Tag,
  ShieldCheck,
  FileCheck,
  History,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react';
import { UserRoleType, User } from '../../types';
import {
  Quotation,
  QuotationSettings,
  QuotationStatus,
  QuotationSummaryReport
} from '../../types/quotationTypes';
import { QuotationPrintDocument } from './QuotationPrintDocument';
import { QuotationCreateEditModal } from './QuotationCreateEditModal';
import { QuotationSettingsModal } from './QuotationSettingsModal';

interface GstSlabBreakdownItem {
  taxable: number;
  gst: number;
  total: number;
}

interface QuotationManagementViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tab: string) => void;
}

export const QuotationManagementView: React.FC<QuotationManagementViewProps> = ({
  currentUser,
  currentRole = UserRoleType.SUPER_ADMIN,
  token,
  onNavigateTab
}) => {
  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  // View Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'ALL_QUOTATIONS' | 'REPORTS_ANALYTICS'>('ALL_QUOTATIONS');

  // Quotation List and Settings state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [settings, setSettings] = useState<QuotationSettings | null>(null);
  const [report, setReport] = useState<QuotationSummaryReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  // Modals state
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState<boolean>(false);
  const [quotationToEdit, setQuotationToEdit] = useState<Quotation | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Print Document state
  const [selectedQuotationForPrint, setSelectedQuotationForPrint] = useState<Quotation | null>(null);
  const [printDefaultLetterhead, setPrintDefaultLetterhead] = useState<boolean>(true);

  // Status Change Dialog state
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    quotation: Quotation;
    newStatus: QuotationStatus;
  } | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState<string>('');

  // Revision History Viewer state
  const [viewingRevisionsQuotation, setViewingRevisionsQuotation] = useState<Quotation | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Quotations, Settings, and Reports from Backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const [quotationsRes, settingsRes, reportRes] = await Promise.all([
        fetch('/api/v1/quotations', { headers }),
        fetch('/api/v1/quotations/settings', { headers }),
        fetch('/api/v1/quotations/summary-report', { headers })
      ]);

      if (quotationsRes.ok) {
        const qData = await quotationsRes.json();
        if (qData.success && Array.isArray(qData.quotations)) {
          setQuotations(qData.quotations);
        }
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.success && sData.settings) {
          setSettings(sData.settings);
        }
      }

      if (reportRes.ok) {
        const rData = await reportRes.json();
        if (rData.success && rData.report) {
          setReport(rData.report);
        }
      }
    } catch (err: any) {
      console.error('Failed to load quotation data:', err);
      showToast('Error connecting to quotation server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Status Update
  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    const { quotation, newStatus } = statusChangeTarget;

    try {
      const res = await fetch(`/api/v1/quotations/${quotation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          newStatus,
          reason: statusChangeReason.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update quotation status');
      }

      setQuotations(prev => prev.map(q => q.id === quotation.id ? data.quotation : q));
      showToast(`Quotation ${quotation.quotationNumber} marked as ${newStatus}.`);
      setStatusChangeTarget(null);
      setStatusChangeReason('');
      fetchData(); // refresh report counts
    } catch (err: any) {
      showToast(err?.message || 'Failed to change status');
    }
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
      if (startDateFilter && q.quotationDate < startDateFilter) return false;
      if (endDateFilter && q.quotationDate > endDateFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = q.quotationNumber.toLowerCase().includes(query);
        const matchesCustomer = q.customerName.toLowerCase().includes(query);
        const matchesSubject = q.subject?.toLowerCase().includes(query);
        const matchesPhone = q.customerPhone?.includes(query);
        if (!matchesNumber && !matchesCustomer && !matchesSubject && !matchesPhone) return false;
      }
      return true;
    });
  }, [quotations, statusFilter, startDateFilter, endDateFilter, searchQuery]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 text-slate-100 bg-slate-950 min-h-screen">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-sky-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Quotation Management Module
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Commercial Hub
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate, manage and print professional commercial quotations with multi-item GST calculations and letterhead options.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {isSuperAdmin && settings && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Configure Letterhead & Terms</span>
            </button>
          )}

          <button
            onClick={() => {
              setQuotationToEdit(null);
              setIsCreateEditModalOpen(true);
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-sky-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quotation</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Quotations */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Quotations</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-black text-white mt-1">
            {report?.totalCount ?? quotations.length}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Total Value: {formatINR(report?.totalValue ?? quotations.reduce((sum, q) => sum + q.grandTotal, 0))}
          </div>
        </div>

        {/* Draft Quotations */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Draft Quotes</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 mt-1">
            {report?.draftCount ?? quotations.filter(q => q.status === 'DRAFT').length}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Pending Finalization
          </div>
        </div>

        {/* Finalized & Sent */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Finalized / Issued</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-indigo-300 mt-1">
            {(report?.finalizedCount ?? 0) + (report?.sentCount ?? 0) || quotations.filter(q => q.status === 'FINALIZED' || q.status === 'SENT').length}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Issued to Customers
          </div>
        </div>

        {/* Accepted Quotes */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Accepted (Orders)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            {report?.acceptedCount ?? quotations.filter(q => q.status === 'ACCEPTED').length}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Value: {formatINR(report?.acceptedValue ?? quotations.filter(q => q.status === 'ACCEPTED').reduce((sum, q) => sum + q.grandTotal, 0))}
          </div>
        </div>

        {/* Expired / Cancelled */}
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Expired / Cancelled</span>
            <X className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-1">
            {(report?.expiredCount ?? 0) + (report?.cancelledCount ?? 0) + (report?.rejectedCount ?? 0) || quotations.filter(q => ['EXPIRED', 'CANCELLED', 'REJECTED'].includes(q.status)).length}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Closed or Inactive
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('ALL_QUOTATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'ALL_QUOTATIONS'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          All Quotations Register ({filteredQuotations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('REPORTS_ANALYTICS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'REPORTS_ANALYTICS'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          GST & Commercial Reports
        </button>
      </div>

      {/* TAB 1: ALL QUOTATIONS REGISTER */}
      {activeSubTab === 'ALL_QUOTATIONS' && (
        <div className="space-y-4">
          
          {/* Search and Filters Bar */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by quote #, customer name, phone, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="FINALIZED">Finalized</option>
                <option value="SENT">Sent to Customer</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[11px]">From:</span>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500"
              />
              <span className="text-slate-400 font-semibold text-[11px]">To:</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-sky-500"
              />
              {(searchQuery || statusFilter !== 'ALL' || startDateFilter || endDateFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setStartDateFilter('');
                    setEndDateFilter('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Clear Filters"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quotations Data Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-3">Quotation #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 min-w-[180px]">Customer / Laboratory</th>
                    <th className="py-3 px-3 min-w-[200px]">Subject</th>
                    <th className="py-3 px-3 text-right">Subtotal (₹)</th>
                    <th className="py-3 px-3 text-right">GST (₹)</th>
                    <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Created By</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="text-sm font-semibold">No quotations found matching your criteria</p>
                        <p className="text-xs text-slate-500 mt-1">Click "Create New Quotation" to generate an official commercial quote.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-800/30 transition">
                        {/* Quotation Number */}
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-sky-400 flex items-center gap-1.5">
                            {q.quotationNumber}
                            {q.revisionNumber > 0 && (
                              <button
                                onClick={() => setViewingRevisionsQuotation(q)}
                                className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded text-[9px] font-bold hover:bg-purple-500/30 cursor-pointer"
                                title="Click to view revision history"
                              >
                                Rev R{q.revisionNumber}
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Valid until: {q.validUntilDate || '30 days'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                          {q.quotationDate}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white leading-snug">{q.customerName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{q.customerPhone || 'No phone'}</span>
                            {q.customerGstin && <span>• GST: {q.customerGstin}</span>}
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-3">
                          <p className="text-slate-300 line-clamp-1 font-medium">{q.subject}</p>
                          <span className="text-[10px] text-slate-500">
                            {q.items.length} product{q.items.length !== 1 ? 's' : ''} listed
                          </span>
                        </td>

                        {/* Subtotal */}
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {q.subtotal.toFixed(2)}
                        </td>

                        {/* GST Total */}
                        <td className="py-3 px-3 text-right font-mono text-sky-400">
                          {q.totalGst.toFixed(2)}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-400 text-xs">
                          {q.grandTotal.toFixed(2)}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            q.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            q.status === 'FINALIZED' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                            q.status === 'SENT' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                            q.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {q.status}
                          </span>
                        </td>

                        {/* Created By */}
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {q.createdByName}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* View / Print with Letterhead */}
                            <button
                              onClick={() => {
                                setSelectedQuotationForPrint(q);
                                setPrintDefaultLetterhead(true);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg transition cursor-pointer"
                              title="Print / PDF With Letterhead (Option A)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Print without Letterhead */}
                            <button
                              onClick={() => {
                                setSelectedQuotationForPrint(q);
                                setPrintDefaultLetterhead(false);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                              title="Print / PDF Without Letterhead (Option B)"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Quotation */}
                            <button
                              onClick={() => {
                                setQuotationToEdit(q);
                                setIsCreateEditModalOpen(true);
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition cursor-pointer"
                              title={q.status === 'FINALIZED' ? 'Revise Finalized Quotation' : 'Edit Quotation'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Status Workflow Selector */}
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  setStatusChangeTarget({ quotation: q, newStatus: e.target.value as QuotationStatus });
                                  e.target.value = '';
                                }
                              }}
                              className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded px-1 py-1 text-[10px] cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>Status...</option>
                              {q.status === 'DRAFT' && <option value="FINALIZED">Finalize</option>}
                              {q.status === 'FINALIZED' && <option value="SENT">Mark Sent</option>}
                              {(q.status === 'FINALIZED' || q.status === 'SENT') && (
                                <>
                                  <option value="ACCEPTED">Mark Accepted</option>
                                  <option value="REJECTED">Mark Rejected</option>
                                </>
                              )}
                              {q.status !== 'CANCELLED' && q.status !== 'ACCEPTED' && (
                                <option value="CANCELLED">Cancel Quotation</option>
                              )}
                            </select>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: REPORTS & GST BREAKDOWN */}
      {activeSubTab === 'REPORTS_ANALYTICS' && report && (
        <div className="space-y-6">
          
          {/* GST Schedule Breakdown */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sky-400" />
                  Taxable Value & GST Tariff Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aggregate GST distribution across all commercial quotations issued in the system.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.entries(report.gstBreakdown) as [string, GstSlabBreakdownItem][]).map(([rateKey, b]) => {
                const rate = rateKey.replace('gst', '');
                return (
                  <div key={rateKey} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                      <span>GST Slab {rate}%</span>
                      <span className="text-[10px] text-slate-500 font-normal">Standard Tariff</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Taxable Value:</span>
                        <span className="font-mono text-white">{formatINR(b.taxable)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>GST Amount:</span>
                        <span className="font-mono text-sky-400">{formatINR(b.gst)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white border-t border-slate-800/80 pt-1">
                        <span>Total (Incl. Tax):</span>
                        <span className="font-mono text-emerald-400">{formatINR(b.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quotation Pipeline Conversion Performance */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Quotation Pipeline Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400">Quote-to-Order Conversion Rate:</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {report.totalCount > 0 ? Math.round((report.acceptedCount / report.totalCount) * 100) : 0}%
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {report.acceptedCount} quotations converted into confirmed diagnostic supply orders.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400">Active Pipeline Value:</span>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  {formatINR(report.finalizedValue + report.sentValue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Value of finalized and issued quotations currently under customer evaluation.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-slate-400">Average Quotation Size:</span>
                <div className="text-2xl font-black text-purple-400 mt-1">
                  {report.totalCount > 0 ? formatINR(report.totalValue / report.totalCount) : '₹0'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Average commercial value per diagnostic supply quotation.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: Create / Edit Quotation Modal */}
      <QuotationCreateEditModal
        isOpen={isCreateEditModalOpen}
        onClose={() => setIsCreateEditModalOpen(false)}
        quotationToEdit={quotationToEdit}
        settings={settings}
        onSaveSuccess={(saved) => {
          showToast(`Quotation ${saved.quotationNumber} saved successfully.`);
          fetchData();
        }}
        token={token}
      />

      {/* MODAL 2: Settings Modal (Super Admin) */}
      {isSettingsModalOpen && settings && (
        <QuotationSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={settings}
          onSaveSuccess={(updated) => {
            setSettings(updated);
            showToast('Quotation settings and letterhead branding updated.');
          }}
          token={token}
        />
      )}

      {/* MODAL 3: Print / PDF Document Viewer Modal */}
      {selectedQuotationForPrint && (
        <QuotationPrintDocument
          quotation={selectedQuotationForPrint}
          settings={settings}
          onClose={() => setSelectedQuotationForPrint(null)}
          defaultHasLetterhead={printDefaultLetterhead}
        />
      )}

      {/* MODAL 4: Status Change Confirmation Dialog */}
      {statusChangeTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md my-auto space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Update Quotation Status
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Change status of {statusChangeTarget.quotation.quotationNumber} to {statusChangeTarget.newStatus}.
                </p>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">
                Reason / Remarks (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Enter reason for status change (e.g., Customer issued Purchase Order #PO-981)..."
                value={statusChangeReason}
                onChange={(e) => setStatusChangeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500 mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStatusChangeTarget(null);
                  setStatusChangeReason('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold cursor-pointer"
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Revision History Viewer Drawer / Modal */}
      {viewingRevisionsQuotation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl my-auto space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Revision History — {viewingRevisionsQuotation.quotationNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Current Version: Revision R{viewingRevisionsQuotation.revisionNumber} (Total: ₹{viewingRevisionsQuotation.grandTotal.toFixed(2)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRevisionsQuotation(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {viewingRevisionsQuotation.revisions && viewingRevisionsQuotation.revisions.length > 0 ? (
                viewingRevisionsQuotation.revisions.map((rev, i) => (
                  <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span>Revision R{rev.revisionNumber} Snapshot</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {new Date(rev.revisedAt).toLocaleString('en-IN')} by {rev.revisedByName}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">
                      <span className="font-semibold text-slate-400">Reason:</span> {rev.reason}
                    </p>
                    <div className="text-xs text-slate-400 font-mono flex justify-between border-t border-slate-800/80 pt-1.5">
                      <span>Previous Grand Total:</span>
                      <span className="text-amber-400">₹{rev.previousGrandTotal?.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <Info className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p>No previous revision snapshots recorded for this quotation.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewingRevisionsQuotation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

