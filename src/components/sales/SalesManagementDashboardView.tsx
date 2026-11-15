import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  Target,
  Sparkles,
  MapPin,
  ChevronRight,
  Download,
  X,
  Plus
} from 'lucide-react';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerLabCode: string;
  salesRepName: string;
  orderDate: string;
  grandTotal: number;
  itemCount: number;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'CREDIT_APPROVED' | 'PENDING';
  quotationRef?: string;
}

interface CustomerVisit {
  id: string;
  visitDate: string;
  customerName: string;
  salesRepName: string;
  purpose: 'REGULAR_BEAT' | 'PRODUCT_DEMO' | 'PAYMENT_COLLECTION' | 'REAGENT_SURVEY';
  status: 'COMPLETED' | 'SCHEDULED' | 'RESCHEDULED';
  notes: string;
  gpsVerified: boolean;
  followUpDate?: string;
}

interface QuotationDiscountRequest {
  id: string;
  quotationNumber: string;
  customerName: string;
  totalAmount: number;
  requestedDiscountPercent: number;
  discountAmount: number;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  justification: string;
}

interface SalesRepMember {
  id: string;
  name: string;
  employeeCode: string;
  phone: string;
  territory: string;
  dutyStatus: 'ON_FIELD' | 'AT_HQ' | 'OFF_DUTY';
  monthlyTarget: number;
  monthlyAchieved: number;
  ordersBooked: number;
  visitsCompleted: number;
  achievementPercent: number;
}

interface SalesManagementDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
}

export const SalesManagementDashboardView: React.FC<SalesManagementDashboardViewProps> = ({
  currentUser,
  currentRole = UserRoleType.OFFICE_ADMIN,
  token,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'VISITS' | 'QUOTATIONS_DISCOUNTS' | 'REPS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Seed Data: Sales Orders
  const [orders, setOrders] = useState<SalesOrder[]>([
    {
      id: 'ord-101',
      orderNumber: 'ORD-2026-8812',
      customerName: 'Metropolis Healthcare Diagnostics',
      customerLabCode: 'CUST-MET-101',
      salesRepName: 'Rohit Sharma',
      orderDate: '2026-10-24',
      grandTotal: 148500,
      itemCount: 4,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      quotationRef: 'DS-QT-2026-1001'
    },
    {
      id: 'ord-102',
      orderNumber: 'ORD-2026-8811',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerLabCode: 'CUST-MH-2041',
      salesRepName: 'Rohit Sharma',
      orderDate: '2026-10-24',
      grandTotal: 72400,
      itemCount: 2,
      status: 'CONFIRMED',
      paymentStatus: 'CREDIT_APPROVED',
      quotationRef: 'DS-QT-2026-1002'
    },
    {
      id: 'ord-103',
      orderNumber: 'ORD-2026-8809',
      customerName: 'Suburban Pathology Centre',
      customerLabCode: 'CUST-SUB-402',
      salesRepName: 'Sneha Kulkarni',
      orderDate: '2026-10-23',
      grandTotal: 31200,
      itemCount: 1,
      status: 'DELIVERED',
      paymentStatus: 'PAID'
    },
    {
      id: 'ord-104',
      orderNumber: 'ORD-2026-8808',
      customerName: 'Lifeline Health Diagnostic Centre',
      customerLabCode: 'CUST-THN-801',
      salesRepName: 'Sneha Kulkarni',
      orderDate: '2026-10-22',
      grandTotal: 89000,
      itemCount: 3,
      status: 'PROCESSING',
      paymentStatus: 'PENDING'
    },
    {
      id: 'ord-105',
      orderNumber: 'ORD-2026-8807',
      customerName: 'CarePlus Diagnostics & Research',
      customerLabCode: 'CUST-DOM-301',
      salesRepName: 'Rohit Sharma',
      orderDate: '2026-10-21',
      grandTotal: 42000,
      itemCount: 2,
      status: 'DELIVERED',
      paymentStatus: 'PAID'
    }
  ]);

  const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // Hydrate live sales orders from backend API
  useEffect(() => {
    const fetchLiveSales = async () => {
      try {
        const res = await fetch('/api/v1/sales/summary-records', {
          headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.orders && Array.isArray(json.data.orders) && json.data.orders.length > 0) {
            setOrders(prev => {
              const apiOrders: SalesOrder[] = json.data.orders.map((o: any, idx: number) => ({
                id: o.id || `ord-api-${idx}`,
                orderNumber: o.orderNumber || 'ORD-2026-8800',
                customerName: o.customerName || 'Diagnostic Partner Lab',
                customerLabCode: o.customerLabCode || 'CUST-01',
                salesRepName: o.salesRepName || 'Rohit Sharma',
                orderDate: o.orderDate || '2026-10-24',
                grandTotal: Number(o.grandTotal) || 50000,
                itemCount: o.itemCount || 1,
                status: o.status || 'PROCESSING',
                paymentStatus: o.paymentStatus || 'PAID',
                quotationRef: o.quotationRef
              }));
              return apiOrders;
            });
          }
        }
      } catch (e) {
        // Keep initial state if offline
      }
    };
    fetchLiveSales();
  }, [effectiveToken]);

  // Seed Data: Customer Visits & Beat Plan
  const [visits, setVisits] = useState<CustomerVisit[]>([
    {
      id: 'v-01',
      visitDate: '2026-10-24 11:30',
      customerName: 'Metropolis Healthcare Diagnostics',
      salesRepName: 'Rohit Sharma',
      purpose: 'REGULAR_BEAT',
      status: 'COMPLETED',
      notes: 'Reviewed monthly reagent indent. Client interested in cobas pro ISE module addition.',
      gpsVerified: true,
      followUpDate: '2026-10-31'
    },
    {
      id: 'v-02',
      visitDate: '2026-10-24 14:00',
      customerName: 'Apex Clinical Laboratory',
      salesRepName: 'Rohit Sharma',
      purpose: 'PRODUCT_DEMO',
      status: 'COMPLETED',
      notes: 'Demonstrated Elecsys Troponin T high-sensitivity assay benefits. Quotation requested.',
      gpsVerified: true,
      followUpDate: '2026-10-28'
    },
    {
      id: 'v-03',
      visitDate: '2026-10-25 10:30',
      customerName: 'Suburban Pathology Centre',
      salesRepName: 'Sneha Kulkarni',
      purpose: 'PAYMENT_COLLECTION',
      status: 'SCHEDULED',
      notes: 'Follow-up on RTGS payment clearance for Invoice #INV-2026-9041.',
      gpsVerified: false
    }
  ]);

  // Seed Data: Quotation Discount Requests
  const [discountRequests, setDiscountRequests] = useState<QuotationDiscountRequest[]>([
    {
      id: 'disc-01',
      quotationNumber: 'DS-QT-2026-1002',
      customerName: 'Apex Clinical & Pathology Laboratories',
      totalAmount: 336688,
      requestedDiscountPercent: 18,
      discountAmount: 60604,
      requestedBy: 'Rohit Sharma (Sales Staff)',
      status: 'PENDING',
      justification: 'Competitor offering 15% discount on automated hematology reagent kit. Volume commitment for 12 months.'
    },
    {
      id: 'disc-02',
      quotationNumber: 'DS-QT-2026-1003',
      customerName: 'Lifeline Health Diagnostic Centre',
      totalAmount: 148500,
      requestedDiscountPercent: 10,
      discountAmount: 14850,
      requestedBy: 'Sneha Kulkarni (Sales Staff)',
      status: 'APPROVED',
      justification: 'Prompt payment within 7 days agreement signed by lab managing director.'
    }
  ]);

  // Seed Data: Sales Staff
  const [salesReps, setSalesReps] = useState<SalesRepMember[]>([
    {
      id: 'u-sales-01',
      name: 'Rohit Sharma',
      employeeCode: 'EMP-SLS-401',
      phone: '+91 98201 22334',
      territory: 'Mumbai Central & Western Suburbs',
      dutyStatus: 'ON_FIELD',
      monthlyTarget: 1200000,
      monthlyAchieved: 1045000,
      ordersBooked: 18,
      visitsCompleted: 34,
      achievementPercent: 87.1
    },
    {
      id: 'u-sales-02',
      name: 'Sneha Kulkarni',
      employeeCode: 'EMP-SLS-402',
      phone: '+91 98204 99110',
      territory: 'Thane & Navi Mumbai Industrial Corridor',
      dutyStatus: 'ON_FIELD',
      monthlyTarget: 950000,
      monthlyAchieved: 890000,
      ordersBooked: 14,
      visitsCompleted: 28,
      achievementPercent: 93.7
    }
  ]);

  // Compute 12 Sales KPI Cards
  const kpis = useMemo(() => {
    const totalSales = 5824000;
    const monthlySales = 1935000;
    const dailySales = 220900;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['PENDING', 'PROCESSING'].includes(o.status)).length;
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const totalCustomers = 42;
    const customerVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
    const pendingFollowups = visits.filter(v => v.followUpDate).length;
    const salesStaffOnDuty = salesReps.filter(s => s.dutyStatus !== 'OFF_DUTY').length;
    const targetAchievement = 90.0;

    return {
      totalSales,
      monthlySales,
      dailySales,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      customerVisits,
      completedVisits,
      pendingFollowups,
      salesStaffOnDuty,
      targetAchievement
    };
  }, [orders, visits, salesReps]);

  const handleApproveDiscount = (reqId: string) => {
    if (!isSuperAdmin) {
      showToast('SECURITY RESTRICTION: Commercial discount waivers require Super Admin approval.');
      return;
    }
    setDiscountRequests(prev =>
      prev.map(d => d.id === reqId ? { ...d, status: 'APPROVED' } : d)
    );
    showToast('Commercial discount waiver approved and applied to quotation.');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-3.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
              Department Operations Management
            </span>
            <span className="text-xs text-slate-400">● Revenue, Beat Plans &amp; Commercial Quotations</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-emerald-400" />
            <span>Sales &amp; Commercial Operations Management Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Sales order bookings, beat plan customer visits, target achievements, commercial quotations, and volume discount requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Sales registers and telemetry synchronized.')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Sales Data</span>
          </button>
          {isSuperAdmin && (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Commercial Approver</span>
            </span>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white rounded-xl p-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'OVERVIEW'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Operational Dashboard &amp; 11 Graphs</span>
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'ORDERS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Sales Orders Register ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('VISITS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'VISITS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Beat Plan Visits ({visits.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('QUOTATIONS_DISCOUNTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'QUOTATIONS_DISCOUNTS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Discount Approvals ({discountRequests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('REPS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'REPS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Sales Representatives ({salesReps.length})</span>
        </button>
      </div>

      {/* 12 Sales KPI Summary Cards (Interactive Drill-Down) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Sales */}
        <div
          onClick={() => setActiveTab('ORDERS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to inspect sales orders"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700">1. Total Sales (FY) &rarr;</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">₹{formatINR(kpis.totalSales)}</div>
          <div className="text-[10px] text-emerald-600 mt-1 font-bold">+18.4% YoY</div>
        </div>

        {/* 2. Monthly Sales */}
        <div
          onClick={() => setActiveTab('ORDERS')}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to view monthly orders"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-800">2. Monthly Sales (MTD) &rarr;</div>
          <div className="text-xl font-black text-emerald-600 mt-1 font-mono">₹{formatINR(kpis.monthlySales)}</div>
          <div className="text-[10px] text-emerald-700 mt-1">October 2026 MTD</div>
        </div>

        {/* 3. Daily Sales */}
        <div
          onClick={() => setActiveTab('ORDERS')}
          className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          title="Click to view daily booked orders"
        >
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider group-hover:text-blue-800">3. Daily Sales &rarr;</div>
          <div className="text-xl font-black text-blue-600 mt-1 font-mono">₹{formatINR(kpis.dailySales)}</div>
          <div className="text-[10px] text-blue-700 mt-1">Booked today</div>
        </div>

        {/* 4. Total Orders */}
        <div
          onClick={() => setActiveTab('ORDERS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"
          title="Click to inspect all active orders"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800">4. Total Orders &rarr;</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{kpis.totalOrders}</div>
          <div className="text-[10px] text-slate-400 mt-1">Active order records</div>
        </div>

        {/* 5. Pending Orders */}
        <div
          onClick={() => setActiveTab('ORDERS')}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to view pending processing orders"
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider group-hover:text-amber-800">5. Pending Orders &rarr;</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{kpis.pendingOrders}</div>
          <div className="text-[10px] text-amber-700 mt-1">Processing queue</div>
        </div>

        {/* 6. Completed Orders */}
        <div
          onClick={() => setActiveTab('ORDERS')}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to inspect delivered orders"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">6. Completed Orders &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.completedOrders}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Delivered &amp; settled</div>
        </div>

        {/* 7. Total Customers */}
        <div
          onClick={() => setActiveTab('VISITS')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"
          title="Click to view customer visits and accounts"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800">7. Total Customers &rarr;</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{kpis.totalCustomers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Diagnostic labs &amp; hosp.</div>
        </div>

        {/* 8. Customer Visits */}
        <div
          onClick={() => setActiveTab('VISITS')}
          className="bg-white p-4 rounded-xl border border-teal-200 shadow-2xs cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
          title="Click to view beat plan customer visits"
        >
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider group-hover:text-teal-900">8. Field Visits &rarr;</div>
          <div className="text-2xl font-black text-teal-600 mt-1 font-mono">{kpis.customerVisits}</div>
          <div className="text-[10px] text-teal-700 mt-1">Beat plan activity</div>
        </div>

        {/* 9. Completed Visits */}
        <div
          onClick={() => setActiveTab('VISITS')}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to inspect GPS-verified visits"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">9. Completed Visits &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.completedVisits}</div>
          <div className="text-[10px] text-emerald-700 mt-1">GPS selfie verified</div>
        </div>

        {/* 10. Pending Follow-ups */}
        <div
          onClick={() => setActiveTab('DISCOUNTS')}
          className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to inspect discount approvals and quotation follow-ups"
        >
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider group-hover:text-amber-900">10. Follow-ups Due &rarr;</div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{kpis.pendingFollowups}</div>
          <div className="text-[10px] text-amber-800 mt-1">Scheduled next 7 days</div>
        </div>

        {/* 11. Sales Staff on Duty */}
        <div
          onClick={() => setActiveTab('REPS')}
          className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          title="Click to view sales representatives"
        >
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider group-hover:text-blue-900">11. Reps on Duty &rarr;</div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">{kpis.salesStaffOnDuty} / {salesReps.length}</div>
          <div className="text-[10px] text-blue-700 mt-1">Active field duty</div>
        </div>

        {/* 12. Target Achievement */}
        <div
          onClick={() => setActiveTab('REPS')}
          className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
          title="Click to inspect sales rep targets"
        >
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider group-hover:text-indigo-900">12. Target Rate &rarr;</div>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">{kpis.targetAchievement}%</div>
          <div className="text-[10px] text-indigo-700 mt-1">October run-rate</div>
        </div>
      </div>

      {/* TAB 1: OPERATIONAL DASHBOARD & 11 SALES GRAPHS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <span>Sales Analytics &amp; Commercial Trends (11 Operational Graphs)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Graph 1: Daily Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">1. Daily Sales Trend</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">₹2.20L Today</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { d: '19', v: 140 },
                  { d: '20', v: 180 },
                  { d: '21', v: 210 },
                  { d: '22', v: 195 },
                  { d: '23', v: 240 },
                  { d: '24', v: 220 }
                ].map((b, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-600" style={{ height: `${(b.v / 250) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{b.d}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Consistent daily sales average: ₹1.98 Lakh.</p>
            </div>

            {/* Graph 2: Weekly Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">2. Weekly Revenue</span>
                <span className="text-[10px] text-blue-600 font-bold">W3: ₹4.85L</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['W1', 'W2', 'W3', 'W4'].map((w, i) => {
                  const h = [70, 85, 95, 80][i];
                  return (
                    <div key={w} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{w}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Week 3 logged highest diagnostic kit shipments.</p>
            </div>

            {/* Graph 3: Monthly Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">3. Monthly Sales (H2)</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">₹19.35L MTD</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((m, i) => {
                  const h = [65, 75, 80, 85, 90, 95][i];
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-emerald-600 rounded-t-md hover:bg-emerald-700" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{m}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">MoM growth: +6.2% average across all tiers.</p>
            </div>

            {/* Graph 4: Yearly Sales (FY 24-25 vs FY 25-26) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">4. Yearly Revenue Trajectory</span>
                <span className="text-[10px] text-indigo-600 font-bold">+24% YoY</span>
              </div>
              <div className="h-32 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xl font-black text-slate-400 font-mono">₹46.8L</div>
                  <div className="text-[10px] text-slate-500 mt-1">FY 24-25</div>
                </div>
                <div className="h-12 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-black text-indigo-600 font-mono">₹58.2L</div>
                  <div className="text-[10px] text-indigo-700 mt-1">FY 25-26 YTD</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">Projected annual closing: ₹72.5 Lakh.</p>
            </div>

            {/* Graph 5: Target vs Achievement */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">5. Target vs Achievement</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">90% Met</span>
              </div>
              <div className="pt-2 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Monthly Target: ₹21.5L</span>
                    <span className="font-bold text-slate-900">100%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Achieved MTD: ₹19.35L</span>
                    <span className="font-bold text-emerald-600">90.0%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">7 days remaining to exceed quota.</p>
            </div>

            {/* Graph 6: Employee-wise Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">6. Rep Contribution</span>
                <span className="text-[10px] text-slate-400">2 Field Reps</span>
              </div>
              <div className="space-y-2 text-xs pt-1">
                {salesReps.map(rep => (
                  <div key={rep.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{rep.name}</span>
                      <span className="text-emerald-700 font-mono font-bold">{rep.achievementPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, rep.achievementPercent)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graph 7: Customer-wise Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">7. Top Revenue Labs</span>
                <span className="text-[10px] text-slate-400">Oct 2026</span>
              </div>
              <div className="space-y-1.5 text-xs pt-1">
                {[
                  { name: 'Metropolis Diagnostics', rev: 596400 },
                  { name: 'Apex Pathology Lab', rev: 442100 },
                  { name: 'Suburban Pathology', rev: 312000 },
                  { name: 'Lifeline Health', rev: 289000 }
                ].map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] text-slate-700">
                    <span className="truncate max-w-[150px]">{c.name}</span>
                    <span className="font-mono font-bold text-emerald-700">₹{formatINR(c.rev)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Graph 8: Product-wise Sales */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">8. Product Category Share</span>
                <span className="text-[10px] text-teal-700 font-mono font-bold">Top IVD Reagents</span>
              </div>
              <div className="pt-1 space-y-1.5 text-xs">
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span>Clinical Chemistry Reagents</span>
                  <span className="font-bold font-mono text-emerald-700">42%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span>Immunoassay ECLIA Kits</span>
                  <span className="font-bold font-mono text-blue-700">34%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span>Hematology Cellpack Fluids</span>
                  <span className="font-bold font-mono text-indigo-700">16%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-700">
                  <span>Coagulation &amp; Consumables</span>
                  <span className="font-bold font-mono text-amber-700">8%</span>
                </div>
              </div>
            </div>

            {/* Graph 9: Order Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">9. Order Size Distribution</span>
                <span className="text-[10px] text-slate-400">Order Bands</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { band: '<₹25k', cnt: 12 },
                  { band: '₹50k', cnt: 24 },
                  { band: '₹1L', cnt: 18 },
                  { band: '>₹2L', cnt: 8 }
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-cyan-600 rounded-t-md hover:bg-cyan-700" style={{ height: `${(item.cnt / 24) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{item.band}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Core order value clustered between ₹50k – ₹1L.</p>
            </div>

            {/* Graph 10: Visit Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">10. Beat Plan Completion</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">94% Adherence</span>
              </div>
              <div className="h-32 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600 font-mono">{kpis.completedVisits}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Completed</div>
                </div>
                <div className="h-12 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-black text-amber-600 font-mono">1</div>
                  <div className="text-[10px] text-slate-500 mt-1">Scheduled</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">GPS geo-punch verified on all lab entries.</p>
            </div>

            {/* Graph 11: Revenue Trends (MTD Run-Rate) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">11. Revenue Run-Rate Projection</span>
                <span className="text-[10px] text-emerald-600 font-bold">₹24.8L Forecast</span>
              </div>
              <div className="pt-2 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Current MTD:</span>
                  <span className="font-bold text-emerald-700 font-mono">₹19.35L</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Daily Velocity:</span>
                  <span className="font-bold text-blue-700 font-mono">₹80.6k / day</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Expected Month-End:</span>
                  <span className="font-bold text-indigo-700 font-mono">₹24.80L</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">Exceeds monthly milestone by 15.3%.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES ORDERS REGISTER */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Commercial Sales Orders Register</h2>
              <p className="text-xs text-slate-500">Every sales order with booking date, representative, line items, and payment status.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order #, lab, rep..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PROCESSING">Processing</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer Laboratory</th>
                  <th className="py-3 px-3">Booking Date</th>
                  <th className="py-3 px-3">Sales Rep</th>
                  <th className="py-3 px-3">Grand Total</th>
                  <th className="py-3 px-3">Order Status</th>
                  <th className="py-3 px-3">Payment Standing</th>
                  <th className="py-3 px-3 text-right">Quotation Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{ord.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ord.customerLabCode}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {ord.orderDate}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {ord.salesRepName}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-slate-900">
                      ₹{formatINR(ord.grandTotal)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ord.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ord.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ord.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.paymentStatus === 'CREDIT_APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                        {ord.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-500">
                      {ord.quotationRef || 'Direct Order'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BEAT PLAN VISITS */}
      {activeTab === 'VISITS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Field Beat Plan &amp; Customer Visit Logs</h2>
              <p className="text-xs text-slate-500">GPS selfie-verified on-site client interactions, reagent surveys, and clinical demos.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              100% Geo-Punched Field Visits
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Visit Date &amp; Time</th>
                  <th className="py-3 px-3">Customer / Laboratory</th>
                  <th className="py-3 px-3">Sales Representative</th>
                  <th className="py-3 px-3">Purpose</th>
                  <th className="py-3 px-3">Status / GPS</th>
                  <th className="py-3 px-3">Meeting Notes</th>
                  <th className="py-3 px-3 text-right">Next Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {v.visitDate}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {v.customerName}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {v.salesRepName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {v.purpose.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                          {v.status}
                        </span>
                        {v.gpsVerified && (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> GPS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={v.notes}>
                      {v.notes}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-700 font-bold">
                      {v.followUpDate || 'None Scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMMERCIAL DISCOUNT APPROVALS */}
      {activeTab === 'QUOTATIONS_DISCOUNTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Commercial Quotation Special Discount Approvals</h2>
              <p className="text-xs text-slate-500">Dual-control commercial review: Volume discount requests require Super Admin approval.</p>
            </div>
            {isSuperAdmin && (
              <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-xl">
                Super Admin Final Discount Sign-off Active
              </span>
            )}
          </div>

          <div className="space-y-3">
            {discountRequests.map(disc => (
              <div key={disc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{disc.quotationNumber}</span>
                    <span className="font-bold text-slate-900">{disc.customerName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${disc.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : disc.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                      {disc.status}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Requested Discount: <strong className="text-slate-900">{disc.requestedDiscountPercent}%</strong> (Waiver Amount: <strong className="text-rose-600">₹{formatINR(disc.discountAmount)}</strong> on Quotation Total ₹{formatINR(disc.totalAmount)})
                  </p>
                  <p className="text-slate-500 text-[11px] italic">Justification: {disc.justification}</p>
                  <p className="text-[10px] text-slate-400">Initiated by: {disc.requestedBy}</p>
                </div>

                <div className="shrink-0">
                  {disc.status === 'PENDING' ? (
                    isSuperAdmin ? (
                      <button
                        onClick={() => handleApproveDiscount(disc.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Authorize Discount (Super Admin)</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
                        Pending Super Admin Sign-off
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approved &amp; Locked</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SALES REPRESENTATIVES */}
      {activeTab === 'REPS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sales Representatives &amp; Territory Achievements</h2>
              <p className="text-xs text-slate-500">Field sales specialists, target tracking, visits completed, and monthly quotas.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              2 Reps Active on Field Duty
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesReps.map(rep => (
              <div key={rep.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{rep.name}</h3>
                    <div className="text-[11px] font-mono text-slate-400">{rep.employeeCode} • {rep.phone}</div>
                    <div className="text-xs text-emerald-800 font-medium mt-0.5">{rep.territory}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {rep.dutyStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Monthly Target:</span>
                    <span className="font-bold text-slate-900 font-mono">₹{formatINR(rep.monthlyTarget)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Achieved MTD:</span>
                    <span className="font-bold text-emerald-600 font-mono">₹{formatINR(rep.monthlyAchieved)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, rep.achievementPercent)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase">Orders Booked</div>
                    <div className="font-extrabold font-mono text-slate-900">{rep.ordersBooked}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase">Visits Completed</div>
                    <div className="font-extrabold font-mono text-slate-900">{rep.visitsCompleted}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManagementDashboardView;
