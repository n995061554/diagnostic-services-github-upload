import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Building2,
  Wrench,
  Truck,
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  MapPin,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Filter,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Lock,
  Calendar,
  BarChart3,
  CheckSquare,
  AlertCircle,
  Package,
  Receipt,
  Cpu,
  Eye,
  Sliders,
  Award
} from 'lucide-react';
import { SalesManagementDashboardView } from '../sales/SalesManagementDashboardView';
import { ServiceManagementDashboardView } from '../service/ServiceManagementDashboardView';
import { DeliveryManagementDashboardView } from '../delivery/DeliveryManagementDashboardView';
import { ApplicationSupportDashboardView } from '../application/ApplicationSupportDashboardView';
import { LaboratoryManagementDashboardView } from '../laboratory/LaboratoryManagementDashboardView';

interface SuperAdminDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab: (tab: string) => void;
}

export const SuperAdminDashboardView: React.FC<SuperAdminDashboardViewProps> = ({
  currentUser,
  currentRole,
  token,
  onNavigateTab,
}) => {
  const [activeDepartment, setActiveDepartment] = useState<'OVERVIEW' | 'SALES' | 'SERVICE' | 'DELIVERY' | 'APPLICATION' | 'LABORATORY'>('OVERVIEW');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [quotationSummary, setQuotationSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'FY_2026'>('THIS_MONTH');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Approval quick action state
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([
    {
      id: 'appr-01',
      type: 'PAYROLL_DISBURSEMENT',
      title: 'October 2026 Executive Payroll Authorization',
      requestedBy: 'Amit Deshmukh (Finance Lead)',
      amount: 1689000,
      urgency: 'HIGH',
      description: 'Draft salary run computed on 26-day divisor, 8-hour shift, biometric geofence deductions.',
      status: 'PENDING'
    },
    {
      id: 'appr-02',
      type: 'QUOTATION_DISCOUNT',
      title: 'Commercial Quotation #DS-QT-2026-1002 Special Discount (18%)',
      requestedBy: 'Rohit Sharma (Sales Staff)',
      amount: 60604,
      urgency: 'MEDIUM',
      description: 'Metropolis Health Services requested volume waiver on automated hematology reagent kit.',
      status: 'PENDING'
    },
    {
      id: 'appr-03',
      type: 'CREDIT_LIMIT_EXTENSION',
      title: 'Credit Limit Extension Request: Ruby Hall Clinic (₹15L ➔ ₹22L)',
      requestedBy: 'Vinay Trivedi (Accounts Staff)',
      amount: 700000,
      urgency: 'NORMAL',
      description: 'Quarterly reagent supply indent awaiting dispatch pending credit clearance.',
      status: 'PENDING'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchExecutiveData = async () => {
    setIsRefreshing(true);
    try {
      const [dashRes, quoteRes] = await Promise.all([
        fetch('/api/v1/backoffice/dashboard-summary?role=SUPER_ADMIN', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/v1/quotations/summary/report', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        setDashboardData(json.data);
      }
      if (quoteRes.ok) {
        const qJson = await quoteRes.json();
        setQuotationSummary(qJson.data);
      }
    } catch (err) {
      console.error('Failed to load Super Admin dashboard telemetry', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, [token, timeRange]);

  const handleApprove = (id: string, title: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    showToast(`Approved: "${title}" successfully recorded with Super Admin authorization.`);
  };

  const handleReject = (id: string, title: string) => {
    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    showToast(`Rejected: "${title}" request dismissed.`);
  };

  // Executive Metrics (Synthesized from live backend telemetry + durable seeds)
  const kpis = useMemo(() => {
    const rawRev = dashboardData?.salesVsTarget?.totalSalesAchieved || 1425000;
    const targetRev = dashboardData?.salesVsTarget?.totalSalesTarget || 1800000;
    const activeLabsCount = dashboardData?.stats?.totalCustomers || 48;
    const pendingOrdersCount = dashboardData?.pendingOrders?.length || 7;
    const openTicketsCount = dashboardData?.stats?.openServiceTickets || 4;
    const activeQuotesCount = quotationSummary?.totalCount || 3;
    const totalQuoteValue = quotationSummary?.totalValue || 200676;

    return {
      totalRevenue: rawRev,
      targetRevenue: targetRev,
      revenueAchievementPercent: Math.round((rawRev / (targetRev || 1)) * 100),
      grossMarginPercent: 32.4,
      totalActiveLabs: activeLabsCount,
      pendingOrdersCount,
      openTicketsCount,
      activeQuotesCount,
      totalQuoteValue,
      onDutyStaffCount: 22,
      totalHeadcount: 28,
      payrollDue: 1689000,
      receivablesDue: 845200,
    };
  }, [dashboardData, quotationSummary]);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0E1035] text-white rounded-xl shadow-xl border border-white/20 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Executive Cockpit Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0E1035] text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="w-3 h-3 text-amber-300" />
              SUPER ADMIN EXECUTIVE COCKPIT
            </span>
            <span className="text-xs text-slate-400 font-medium">● Enterprise Operations Leadership</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic Services Executive Command Centre
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consolidated organizational telemetry, financial controls, multi-department oversight, and governance approvals.
          </p>
        </div>

        {/* Date Filter & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_QUARTER', 'FY_2026'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'TODAY' && 'Today'}
                {r === 'THIS_WEEK' && 'Week'}
                {r === 'THIS_MONTH' && 'Month'}
                {r === 'THIS_QUARTER' && 'Quarter'}
                {r === 'FY_2026' && 'FY 2026'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchExecutiveData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            title="Refresh Real-Time Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 5-Department Executive Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveDepartment('OVERVIEW')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'OVERVIEW'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-300" />
          <span>Executive Cockpit Overview</span>
        </button>

        <button
          onClick={() => setActiveDepartment('SALES')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'SALES'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>1. Sales Department</span>
        </button>

        <button
          onClick={() => setActiveDepartment('SERVICE')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'SERVICE'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-sky-400" />
          <span>2. Service &amp; AMC Department</span>
        </button>

        <button
          onClick={() => setActiveDepartment('DELIVERY')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'DELIVERY'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Delivery &amp; Logistics</span>
        </button>

        <button
          onClick={() => setActiveDepartment('APPLICATION')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'APPLICATION'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
          <span>4. Application Support</span>
        </button>

        <button
          onClick={() => setActiveDepartment('LABORATORY')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'LABORATORY'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>5. Laboratory &amp; Customer 360</span>
        </button>
      </div>

      {activeDepartment === 'SALES' && (
        <SalesManagementDashboardView
          currentUser={currentUser}
          currentRole={currentRole}
          token={token}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeDepartment === 'SERVICE' && (
        <ServiceManagementDashboardView
          currentUser={currentUser}
          currentRole={currentRole}
          token={token}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeDepartment === 'DELIVERY' && (
        <DeliveryManagementDashboardView
          currentUser={currentUser}
          currentRole={currentRole}
          token={token}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeDepartment === 'APPLICATION' && (
        <ApplicationSupportDashboardView
          currentUser={currentUser}
          currentRole={currentRole}
          token={token}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeDepartment === 'LABORATORY' && (
        <LaboratoryManagementDashboardView
          currentUser={currentUser}
          currentRole={currentRole}
          token={token}
          onNavigateTab={onNavigateTab}
        />
      )}

      {activeDepartment === 'OVERVIEW' && (
        <>
      {/* 1. Executive KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Invoiced Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Invoiced Revenue ({timeRange.replace('_', ' ')})</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatINR(kpis.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-1">
              <span className="text-emerald-700 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {kpis.revenueAchievementPercent}%
              </span>
              <span className="text-slate-400">of ₹{Math.round(kpis.targetRevenue / 100000)}L Target</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.revenueAchievementPercent)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Customer Lab Network */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Institutional Labs Network</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpis.totalActiveLabs} <span className="text-xs font-semibold text-slate-500">Active Centers</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-1 text-slate-500">
              <span className="text-sky-700 font-bold">14 Hospital Chains</span>
              <span>• 34 Clinical Labs</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('customers_labs')}
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>Inspect Customer Registry</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* KPI 3: Commercial Pipeline & Quotations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Quotations Value</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {formatINR(kpis.totalQuoteValue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-1 text-slate-500">
              <span className="font-bold text-indigo-700">{kpis.activeQuotesCount} Commercial Quotes</span>
              <span>• GST Compliant</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('quotations')}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>Open Quotation Management</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* KPI 4: Staff Duty & Operational Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Field & Office Attendance</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {kpis.onDutyStaffCount} / {kpis.totalHeadcount} <span className="text-xs font-semibold text-slate-500">On Duty</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-1 text-slate-500">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                92% Geofence Checked
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('staff_attendance')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer pt-1"
          >
            <span>View Attendance Console</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. Executive Dual-Control Approval Centre */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Super Admin Dual-Control Authorizations ({pendingApprovals.length})
              </h2>
              <p className="text-xs text-slate-500">
                Critical corporate transactions, payroll disbursement, and pricing exceptions requiring owner sign-off.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('approvals')}
            className="text-xs font-bold text-[#1E331B] hover:text-[#5F8F4D] flex items-center gap-1 cursor-pointer"
          >
            <span>Full Approval Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700">All Executive Approvals Cleared</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No pending financial disbursements or quotation exceptions in queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                    <span>Initiated by: <strong>{item.requestedBy}</strong></span>
                    <span>•</span>
                    <span>Financial Scope: <strong className="text-slate-900 font-mono">{formatINR(item.amount)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleReject(item.id, item.title)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(item.id, item.title)}
                    className="px-4 py-1.5 rounded-lg bg-[#1E331B] hover:bg-[#15253F] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Authorize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Operational Departments Telemetry & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department 1 & 2: Sales & Delivery Field Telemetry */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Commercial &amp; Logistics Execution</h3>
                <p className="text-xs text-slate-500">Live operational status across Sales beat visits and Delivery dispatches.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('live_staff_tracking')}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Live GPS Map</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Field Visits Today</span>
                <Users className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">18 / 24</div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>100% Selfie Evidence Verified</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Deliveries Dispatched</span>
                <Truck className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">14 / 16</div>
              <div className="text-[11px] text-sky-700 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>2 Active On Route</span>
              </div>
            </div>
          </div>

          {/* Quick Deep Link Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('sales_field_mobile')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Inspect Sales App</span>
            </button>
            <button
              onClick={() => onNavigateTab('delivery_mobile')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Truck className="w-3.5 h-3.5 text-orange-600" />
              <span>Inspect Delivery App</span>
            </button>
            <button
              onClick={() => onNavigateTab('admin_orders')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Order Dispatch Matrix</span>
            </button>
          </div>
        </div>

        {/* Department 3 & 4: Biomedical Service & Clinical Applications */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Biomedical Engineering &amp; Clinical Apps</h3>
                <p className="text-xs text-slate-500">Analyzer uptimes, breakdown resolution, and assay protocol training.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('service_engineer')}
              className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Service Calls</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Active Breakdown Calls</span>
                <Wrench className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-700 font-mono">1 Critical</div>
              <div className="text-[11px] text-slate-500">3 Under Scheduled PM</div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 font-semibold">
                <span>Application Protocol SLA</span>
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="text-xl font-black text-slate-900 font-mono">100%</div>
              <div className="text-[11px] text-emerald-700 font-semibold">Zero Protocol Delays</div>
            </div>
          </div>

          {/* Quick Deep Link Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('service_mobile')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5 text-purple-600" />
              <span>Inspect Service App</span>
            </button>
            <button
              onClick={() => onNavigateTab('app_support_mobile')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Inspect Application App</span>
            </button>
            <button
              onClick={() => onNavigateTab('preventive_maintenance')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Preventive Maintenance (PM)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Executive Management Fast Controls Bar */}
      <div className="bg-[#0E1035] text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Super Admin Governance &amp; System Configuration</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage corporate users, configure standard quotation letterhead, review Tally syncs, and inspect security logs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('users')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>User &amp; Role Management</span>
          </button>
          <button
            onClick={() => onNavigateTab('payroll_management')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payroll Governance</span>
          </button>
          <button
            onClick={() => onNavigateTab('tally_integration')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
            <span>Tally ERP 9 Bridge</span>
          </button>
          <button
            onClick={() => onNavigateTab('audit')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Security Audit Logs</span>
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
