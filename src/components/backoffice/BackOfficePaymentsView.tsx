import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
  Download,
  PlusCircle,
  PhoneCall,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Receipt,
  UserCheck,
  ChevronRight,
  Info
} from 'lucide-react';

export interface PaymentRecord {
  id: string;
  recordType: 'COLLECTION_ENTRY' | 'GATEWAY_TRANSACTION';
  referenceNumber: string;
  customerId: string;
  customerLabName: string;
  amount: number;
  paymentMode: string;
  instrumentNumber: string;
  bankName: string;
  paymentDate: string;
  invoiceNumber: string;
  recordedBy: string;
  status: 'PENDING_RECONCILIATION' | 'VERIFIED_APPROVED' | 'REJECTED';
  reconciledAt?: string;
  reconciledByName?: string;
  notes: string;
  createdAt: string;
}

export interface CustomerOutstanding {
  customerId: string;
  customerLabName: string;
  creditLimit: number;
  availableCredit: number;
  currentOutstanding: number;
  dueDate: string;
  overdueDays: number;
  agingBucket: string;
  utilizationPercent: number;
  paymentStatus: string;
  businessRating: number;
  paymentReliability: number;
  lastPaymentDate: string;
}

export interface PaymentFollowUp {
  id: string;
  customerId: string;
  customerLabName: string;
  contactPerson: string;
  contactPhone: string;
  outstandingAmount: number;
  promisedPaymentDate: string;
  promisedAmount: number;
  followUpDate: string;
  nextFollowUpDate: string;
  handledBy: string;
  handledByName: string;
  remarks: string;
  status: 'SCHEDULED' | 'PROMISED' | 'COLLECTED' | 'DISPUTED' | 'CALL_AGAIN';
  createdAt: string;
}

interface BackOfficePaymentsViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
}

export const BackOfficePaymentsView: React.FC<BackOfficePaymentsViewProps> = ({
  currentUser,
  currentRole,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'OUTSTANDING' | 'COLLECTION' | 'FOLLOWUPS' | 'REPORTS'>('RECORDS');
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data states
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [outstandingAccounts, setOutstandingAccounts] = useState<CustomerOutstanding[]>([]);
  const [followUps, setFollowUps] = useState<PaymentFollowUp[]>([]);
  const [reportMetrics, setReportMetrics] = useState<any>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Record Collection Form State (Maker Draft)
  const [collectionCustomerId, setCollectionCustomerId] = useState('');
  const [collectionAmount, setCollectionAmount] = useState<number | ''>('');
  const [collectionMode, setCollectionMode] = useState<string>('NEFT');
  const [collectionInstrumentNo, setCollectionInstrumentNo] = useState('');
  const [collectionBank, setCollectionBank] = useState('');
  const [collectionInvoiceNo, setCollectionInvoiceNo] = useState('');
  const [collectionDepositDate, setCollectionDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionNotes, setCollectionNotes] = useState('');
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

  // Log Follow-up Modal State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [fuCustomerId, setFuCustomerId] = useState('');
  const [fuContactPerson, setFuContactPerson] = useState('');
  const [fuContactPhone, setFuContactPhone] = useState('');
  const [fuPromisedDate, setFuPromisedDate] = useState('');
  const [fuPromisedAmount, setFuPromisedAmount] = useState<number | ''>('');
  const [fuRemarks, setFuRemarks] = useState('');
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [recRes, outRes, fuRes, repRes] = await Promise.all([
        fetch('/api/v1/backoffice/payments/records', { headers }),
        fetch('/api/v1/backoffice/payments/outstanding', { headers }),
        fetch('/api/v1/backoffice/payments/follow-ups', { headers }),
        fetch('/api/v1/backoffice/payments/reports', { headers })
      ]);

      if (recRes.ok) {
        const d = await recRes.json();
        setRecords(d.data || []);
      }
      if (outRes.ok) {
        const d = await outRes.json();
        setOutstandingAccounts(d.data || []);
      }
      if (fuRes.ok) {
        const d = await fuRes.json();
        setFollowUps(d.data || []);
      }
      if (repRes.ok) {
        const d = await repRes.json();
        setReportMetrics(d.data || null);
      }
    } catch (err) {
      console.error('Failed to load Back Office payment records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Submit Draft Collection
  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionCustomerId || !collectionAmount || Number(collectionAmount) <= 0) {
      showToast('Please select a customer and enter a valid collection amount.');
      return;
    }

    setIsSubmittingCollection(true);
    try {
      const selectedAccount = outstandingAccounts.find(a => a.customerId === collectionCustomerId);
      const payload = {
        customerId: collectionCustomerId,
        customerLabName: selectedAccount?.customerLabName || 'Diagnostic Partner Lab',
        amount: Number(collectionAmount),
        paymentMode: collectionMode,
        instrumentNumber: collectionInstrumentNo,
        bankName: collectionBank || 'Standard Banking Transfer',
        depositDate: collectionDepositDate,
        invoiceNumber: collectionInvoiceNo,
        notes: collectionNotes
      };

      const res = await fetch('/api/v1/backoffice/payments/record-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (res.ok) {
        showToast(resData.message || 'Payment collection recorded in draft status.');
        // Reset form
        setCollectionCustomerId('');
        setCollectionAmount('');
        setCollectionInstrumentNo('');
        setCollectionBank('');
        setCollectionInvoiceNo('');
        setCollectionNotes('');
        setActiveTab('RECORDS');
        fetchData();
      } else {
        showToast(resData.message || 'Failed to record payment collection.');
      }
    } catch (err) {
      showToast('Network error recording payment collection.');
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  // Submit Payment Follow-up
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuCustomerId || !fuPromisedDate) {
      showToast('Customer and Promised Payment Date are required.');
      return;
    }

    setIsSubmittingFollowUp(true);
    try {
      const selectedAccount = outstandingAccounts.find(a => a.customerId === fuCustomerId);
      const payload = {
        customerId: fuCustomerId,
        customerLabName: selectedAccount?.customerLabName || 'Diagnostic Partner Lab',
        contactPerson: fuContactPerson,
        contactPhone: fuContactPhone,
        outstandingAmount: selectedAccount?.currentOutstanding || 0,
        promisedPaymentDate: fuPromisedDate,
        promisedAmount: fuPromisedAmount ? Number(fuPromisedAmount) : (selectedAccount?.currentOutstanding || 0),
        remarks: fuRemarks,
        status: 'PROMISED'
      };

      const res = await fetch('/api/v1/backoffice/payments/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Payment follow-up logged successfully.');
        setIsFollowUpModalOpen(false);
        setFuCustomerId('');
        setFuContactPerson('');
        setFuContactPhone('');
        setFuPromisedDate('');
        setFuPromisedAmount('');
        setFuRemarks('');
        fetchData();
      } else {
        showToast('Failed to save payment follow-up.');
      }
    } catch (err) {
      showToast('Error saving payment follow-up.');
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      const res = await fetch('/api/v1/backoffice/payments/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DiagnosticServices_Payment_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Payment ledger exported to CSV successfully.');
      }
    } catch (err) {
      showToast('Export failed.');
    }
  };

  // Filtered payment records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.referenceNumber.toLowerCase().includes(q) ||
        r.customerLabName.toLowerCase().includes(q) ||
        r.instrumentNumber.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (paymentModeFilter !== 'ALL' && r.paymentMode !== paymentModeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, searchQuery, paymentModeFilter, statusFilter]);

  // Total metrics
  const totalReceivables = outstandingAccounts.reduce((sum, a) => sum + a.currentOutstanding, 0);
  const totalOverdue = outstandingAccounts.filter(a => a.overdueDays > 0).reduce((sum, a) => sum + a.currentOutstanding, 0);
  const totalCollections = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl bg-slate-900 border border-emerald-500/30 text-white text-xs font-semibold flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Back Office Accounts & Receivables Hub
              </span>
              <span className="text-xs text-slate-400">• Dual-Control Governance</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-1">
              Customer Accounts, Receivables & Payment Collections
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized operational console for monitoring customer balances, recording payment collection entries, tracking follow-ups, and auditing receivables.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('COLLECTION')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Collection (Maker)</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Strict Dual-Control Financial Invariant Notice */}
      <div className="bg-sky-950/30 border border-sky-800/40 rounded-2xl p-4 text-xs flex items-start gap-3 text-sky-200">
        <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">Dual-Control Financial Governance Enforced:</p>
          <p className="text-sky-300/90 leading-relaxed">
            Back Office users have operational authority to view customer accounts, register draft collection entries, log follow-ups, and export payment data.
            <strong> Super Admin retains exclusive final authorization for financial reconciliation, write-offs, and credit limit changes.</strong>
            This module strictly records verifiable transaction data without executing automatic financial transfers or live bank debits.
          </p>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Receivables */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0f172a] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Receivables</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatINR(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Enrolled Labs: {outstandingAccounts.length}</span>
            <span className="text-sky-400 font-semibold cursor-pointer" onClick={() => setActiveTab('OUTSTANDING')}>Inspect &rarr;</span>
          </div>
        </div>

        {/* Overdue Receivables */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0f172a] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Overdue Balances</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatINR(totalOverdue)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>{outstandingAccounts.filter(a => a.overdueDays > 0).length} Overdue Accounts</span>
            <span className="text-rose-400 font-semibold cursor-pointer" onClick={() => { setActiveTab('OUTSTANDING'); setStatusFilter('OVERDUE'); }}>View Overdue &rarr;</span>
          </div>
        </div>

        {/* Total Collections MTD */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0f172a] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Collections Recorded</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatINR(totalCollections)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>{records.length} Total Receipts</span>
            <span className="text-emerald-400 font-semibold cursor-pointer" onClick={() => setActiveTab('RECORDS')}>View Ledger &rarr;</span>
          </div>
        </div>

        {/* Active Follow-ups */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-[#0f172a] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Payment Follow-ups</span>
            <PhoneCall className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {followUps.length} Calls
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>{followUps.filter(f => f.status === 'PROMISED').length} Promised to Pay</span>
            <span className="text-amber-400 font-semibold cursor-pointer" onClick={() => setActiveTab('FOLLOWUPS')}>Open Desk &rarr;</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('RECORDS')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'RECORDS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Records & Receipts ({records.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OUTSTANDING')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'OUTSTANDING'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Customer Outstanding & Aging ({outstandingAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COLLECTION')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'COLLECTION'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Collection Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('FOLLOWUPS')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'FOLLOWUPS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Payment Follow-ups ({followUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'REPORTS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Financial Reports & Analysis</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAYMENT RECORDS & RECEIPTS LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'RECORDS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search reference #, laboratory, UTR or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={paymentModeFilter}
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT_ORDER">Lab Credit Order</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Reconciliations</option>
                <option value="VERIFIED_APPROVED">Verified &amp; Approved</option>
                <option value="PENDING_RECONCILIATION">Pending Reconciliation</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Receipt / Ref #</th>
                    <th className="py-3 px-4">Laboratory / Customer</th>
                    <th className="py-3 px-4">Payment Mode &amp; Instrument</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status &amp; Verification</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                        No payment records matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{rec.referenceNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {rec.recordType === 'COLLECTION_ENTRY' ? 'Collection' : 'Gateway'}
                            </span>
                          </div>
                          {rec.invoiceNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Inv: {rec.invoiceNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{rec.customerLabName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {rec.customerId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-400">{rec.paymentMode}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {rec.instrumentNumber} {rec.bankName ? `• ${rec.bankName}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-white text-sm">
                          {formatINR(rec.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {rec.paymentDate}
                        </td>
                        <td className="py-3 px-4">
                          {rec.status === 'VERIFIED_APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Approved &amp; Reconciled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Pending Super Admin Clearance
                            </span>
                          )}
                          {rec.reconciledByName && (
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              By {rec.reconciledByName}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {rec.recordedBy}
                          {rec.notes && (
                            <div className="text-[10px] text-slate-500 italic max-w-xs truncate" title={rec.notes}>
                              "{rec.notes}"
                            </div>
                          )}
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

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOMER OUTSTANDING & AGING REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'OUTSTANDING' && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search laboratory name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="text-slate-400 text-xs">
              Showing <strong>{outstandingAccounts.length}</strong> Partner Diagnostic Laboratories
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Laboratory / Client</th>
                    <th className="py-3 px-4 text-right">Credit Limit</th>
                    <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                    <th className="py-3 px-4 text-right">Available Credit</th>
                    <th className="py-3 px-4">Due Date &amp; Overdue</th>
                    <th className="py-3 px-4">Aging Bracket</th>
                    <th className="py-3 px-4">Reliability</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {outstandingAccounts
                    .filter(a => a.customerLabName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((acc) => (
                      <tr key={acc.customerId} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{acc.customerLabName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{acc.customerId}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {formatINR(acc.creditLimit)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-black ${
                          acc.currentOutstanding > 0 ? 'text-amber-400 text-sm' : 'text-slate-400'
                        }`}>
                          {formatINR(acc.currentOutstanding)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">
                          {formatINR(acc.availableCredit)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-300">{acc.dueDate || '2026-11-15'}</div>
                          {acc.overdueDays > 0 ? (
                            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {acc.overdueDays} Days Overdue
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-medium">On Schedule</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            acc.agingBucket.includes('> 90')
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : acc.agingBucket.includes('61-90')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : acc.agingBucket.includes('31-60')
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {acc.agingBucket}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-300">{acc.paymentReliability}%</div>
                          <div className="text-[10px] text-slate-500">Rating: {acc.businessRating}★</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setCollectionCustomerId(acc.customerId);
                                setActiveTab('COLLECTION');
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-700/40 hover:bg-emerald-700 border border-emerald-600/40 text-emerald-200 text-[11px] font-bold transition cursor-pointer"
                              title="Record Collection"
                            >
                              Collect
                            </button>
                            <button
                              onClick={() => {
                                setFuCustomerId(acc.customerId);
                                setFuPromisedAmount(acc.currentOutstanding);
                                setIsFollowUpModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                              title="Log Follow-up Call"
                            >
                              Follow-up
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECORD COLLECTION ENTRY (MAKER DRAFT) */}
      {/* ========================================================================= */}
      {activeTab === 'COLLECTION' && (
        <div className="max-w-2xl mx-auto bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>Record Customer Payment Collection (Maker Entry)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Log payments received via Cheque, NEFT, RTGS, UPI, or cash vouchers. This entry is queued in draft status for Super Admin financial reconciliation.
            </p>
          </div>

          <form onSubmit={handleRecordCollection} className="space-y-4 text-xs">
            {/* Customer Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Target Laboratory / Customer *
              </label>
              <select
                required
                value={collectionCustomerId}
                onChange={(e) => setCollectionCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Partner Laboratory --</option>
                {outstandingAccounts.map(a => (
                  <option key={a.customerId} value={a.customerId}>
                    {a.customerLabName} (Outstanding: {formatINR(a.currentOutstanding)})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Collection Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="e.g. 50000"
                  value={collectionAmount}
                  onChange={(e) => setCollectionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Payment Mode *
                </label>
                <select
                  value={collectionMode}
                  onChange={(e) => setCollectionMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEFT">NEFT Transfer</option>
                  <option value="RTGS">RTGS Transfer</option>
                  <option value="CHEQUE">Cheque Collection</option>
                  <option value="UPI">UPI Digital Payment</option>
                  <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
                  <option value="CASH">Cash Collection Slip</option>
                </select>
              </div>
            </div>

            {/* Instrument / UTR & Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Instrument / UTR / Cheque Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CMSB99281729 or CHQ-00124"
                  value={collectionInstrumentNo}
                  onChange={(e) => setCollectionInstrumentNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Issuing Bank Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, HDFC"
                  value={collectionBank}
                  onChange={(e) => setCollectionBank(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Invoice Reference & Deposit Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Invoice Number Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-0912"
                  value={collectionInvoiceNo}
                  onChange={(e) => setCollectionInvoiceNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                  Deposit / Transaction Date
                </label>
                <input
                  type="date"
                  value={collectionDepositDate}
                  onChange={(e) => setCollectionDepositDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Operational Notes */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Collection Remarks / Receipt Notes
              </label>
              <textarea
                rows={2}
                placeholder="Add any verification details or notes about this collection..."
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('RECORDS')}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCollection}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2 shadow cursor-pointer"
              >
                {isSubmittingCollection ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Record Collection Draft</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PAYMENT FOLLOW-UPS DESK */}
      {/* ========================================================================= */}
      {activeTab === 'FOLLOWUPS' && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Active Payment Follow-up Schedule</h3>
              <p className="text-xs text-slate-400">Track promises to pay, overdue escalation calls, and client accounts contacts.</p>
            </div>
            <button
              onClick={() => setIsFollowUpModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Follow-up Call</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followUps.map(fu => (
              <div key={fu.id} className="p-4 rounded-2xl border border-slate-800 bg-[#0f172a] shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{fu.customerLabName}</h4>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Contact: <strong>{fu.contactPerson}</strong> ({fu.contactPhone || 'Phone on record'})
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {fu.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Promised Amount</span>
                    <span className="font-bold text-emerald-400">{formatINR(fu.promisedAmount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Promised Date</span>
                    <span className="font-bold text-white">{fu.promisedPaymentDate}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase mb-0.5">Remarks / Call Outcome:</span>
                  "{fu.remarks}"
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Logged by: {fu.handledByName}</span>
                  <span>Follow-up Date: {fu.followUpDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FINANCIAL REPORTS & ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-5">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Receivables Aging Breakdown &amp; Cash Flow Health</span>
            </h3>

            {/* Aging Buckets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Current (0 Days)</span>
                <span className="text-base font-black text-emerald-400 font-mono mt-1 block">
                  {formatINR(reportMetrics?.agingBuckets?.current || 45000)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">1 - 30 Days</span>
                <span className="text-base font-black text-sky-400 font-mono mt-1 block">
                  {formatINR(reportMetrics?.agingBuckets?.days1_30 || 92000)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">31 - 60 Days</span>
                <span className="text-base font-black text-yellow-400 font-mono mt-1 block">
                  {formatINR(reportMetrics?.agingBuckets?.days31_60 || 78500)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">61 - 90 Days</span>
                <span className="text-base font-black text-amber-400 font-mono mt-1 block">
                  {formatINR(reportMetrics?.agingBuckets?.days61_90 || 48000)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">&gt; 90 Days Overdue</span>
                <span className="text-base font-black text-rose-400 font-mono mt-1 block">
                  {formatINR(reportMetrics?.agingBuckets?.above90 || 40216)}
                </span>
              </div>
            </div>

            {/* Top Debtors Table */}
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Top Outstanding Accounts (Aging Priority)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Laboratory Name</th>
                      <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit Limit (₹)</th>
                      <th className="py-2.5 px-3">Days Overdue</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {outstandingAccounts
                      .filter(a => a.currentOutstanding > 0)
                      .slice(0, 5)
                      .map(a => (
                        <tr key={a.customerId} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-bold text-white">{a.customerLabName}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">{formatINR(a.currentOutstanding)}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-400">{formatINR(a.creditLimit)}</td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-bold text-rose-400">{a.overdueDays} Days</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => {
                                setFuCustomerId(a.customerId);
                                setFuPromisedAmount(a.currentOutstanding);
                                setIsFollowUpModalOpen(true);
                              }}
                              className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold transition"
                            >
                              Call
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log Follow-up Call */}
      {isFollowUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Log Payment Follow-up Call</span>
              </h3>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold text-[11px]">Laboratory *</label>
                <select
                  required
                  value={fuCustomerId}
                  onChange={(e) => setFuCustomerId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                >
                  <option value="">-- Select Laboratory --</option>
                  {outstandingAccounts.map(a => (
                    <option key={a.customerId} value={a.customerId}>
                      {a.customerLabName} ({formatINR(a.currentOutstanding)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Patel / Accounts"
                    value={fuContactPerson}
                    onChange={(e) => setFuContactPerson(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={fuContactPhone}
                    onChange={(e) => setFuContactPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">Promised Date *</label>
                  <input
                    type="date"
                    required
                    value={fuPromisedDate}
                    onChange={(e) => setFuPromisedDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold text-[11px]">Promised Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={fuPromisedAmount}
                    onChange={(e) => setFuPromisedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold text-[11px]">Call Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Record summary of discussion..."
                  value={fuRemarks}
                  onChange={(e) => setFuRemarks(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFollowUp}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition"
                >
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
