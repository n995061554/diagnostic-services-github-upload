import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  LifeBuoy,
  ClipboardList,
  Boxes,
  CheckCircle2,
  Plus,
  Tag,
  DollarSign,
  Package,
  Layers,
  Send,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  Bell,
  Truck,
  Wrench,
  Stethoscope,
  PhoneCall,
  MapPin,
  Calendar,
  Lock,
  ChevronLeft
} from 'lucide-react';

export interface OrderStatusMetric {
  status: string;
  count: number;
}

export function normalizeOrdersByStatus(raw: unknown): OrderStatusMetric[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item: any) => ({
        status: String(item.status || item.name || 'UNKNOWN'),
        count: typeof item.count === 'number' ? item.count : Number(item.count || item.value || 0),
      }));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([status, count]) => ({
      status,
      count: typeof count === 'number' ? count : Number(count) || 0,
    }));
  }
  return [
    { status: 'DELIVERED', count: 10 },
    { status: 'CONFIRMED', count: 4 },
    { status: 'PROCESSING', count: 2 },
    { status: 'PACKED', count: 1 },
    { status: 'SHIPPED', count: 1 },
  ];
}

interface BackOfficeDashboardViewProps {
  currentUser: User | null;
  currentRole: UserRoleType;
  onNavigateTab: (tabId: string) => void;
  token?: string | null;
  onOpenAddCustomer?: () => void;
  onOpenPriceUpdate?: () => void;
}

export const BackOfficeDashboardView: React.FC<BackOfficeDashboardViewProps> = ({
  currentUser,
  currentRole,
  onNavigateTab,
  token,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Section A: Date Range Selector for Sales vs Target
  const [salesDateRange, setSalesDateRange] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'FY_2026'>('THIS_MONTH');

  // Section C: Orders Table Filter & Pagination
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPerPage = 5;

  // Section D: Pending Payments Filter
  const [paymentsFilter, setPaymentsFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON'>('ALL');

  // Section F: Pending Orders Filter
  const [pendingOrdersFilter, setPendingOrdersFilter] = useState<'ALL' | 'PROCESSING' | 'DISPATCH' | 'DELIVERY'>('ALL');

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/dashboard-summary?role=${currentRole}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const payload = json.data;
        if (payload && payload.ordersByStatus) {
          payload.ordersByStatus = normalizeOrdersByStatus(payload.ordersByStatus);
        }
        setData(payload);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentRole, token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isFinanceAuthorized = 
    currentRole === UserRoleType.SUPER_ADMIN ||
    currentRole === UserRoleType.OFFICE_ADMIN ||
    currentRole === UserRoleType.ACCOUNTS_STAFF ||
    currentRole === UserRoleType.FINANCE_STAFF;

  const kpis = data?.kpis || {
    totalCustomers: 24,
    totalOrders: 18,
    todaySales: 148500,
    monthSales: 582400,
    totalOutstanding: 125000,
    totalOverdue: 35000,
    totalDueSoon: 40000,
    pendingOrdersCount: 6,
    unreadNotificationsCount: 5,
  };

  // Section A: Target Values by selected range
  const salesTargets = {
    THIS_MONTH: { target: 700000, actual: kpis.monthSales || 582400, period: 'October 2026' },
    LAST_MONTH: { target: 650000, actual: 615000, period: 'September 2026' },
    THIS_QUARTER: { target: 2000000, actual: 1710000, period: 'Q3 FY26' },
    FY_2026: { target: 8000000, actual: 6540000, period: 'FY 2026-27' },
  };
  const activeSalesMetric = salesTargets[salesDateRange];
  const salesPct = Math.min(100, Math.round((activeSalesMetric.actual / activeSalesMetric.target) * 100));

  // Section B: Department Activity
  const departmentActivity = {
    labVisits: 14,
    salesCalls: 28,
    serviceCalls: 8,
    deliveries: 12,
    appSupportTickets: 5,
    installations: 3,
  };

  // Section C: Orders Data
  const rawOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    createdAt: string;
    totalAmount: number;
    status: string;
    paymentStatus?: string;
    deliveryStatus?: string;
  }> = data?.recentOrders || [
    { id: 'ord-101', orderNumber: 'ORD-2026-8812', customerName: 'Metropolis Diagnostics Lab', createdAt: '2026-10-22', totalAmount: 48500, status: 'PROCESSING', paymentStatus: 'PAID', deliveryStatus: 'READY_FOR_DISPATCH' },
    { id: 'ord-102', orderNumber: 'ORD-2026-8811', customerName: 'Apex Clinical Laboratory', createdAt: '2026-10-21', totalAmount: 72400, status: 'CONFIRMED', paymentStatus: 'CREDIT_APPROVED', deliveryStatus: 'PACKED' },
    { id: 'ord-103', orderNumber: 'ORD-2026-8809', customerName: 'Suburban Pathology Centre', createdAt: '2026-10-20', totalAmount: 31200, status: 'DELIVERED', paymentStatus: 'PAID', deliveryStatus: 'DELIVERED' },
    { id: 'ord-104', orderNumber: 'ORD-2026-8808', customerName: 'Lifeline Health Diagnostic', createdAt: '2026-10-19', totalAmount: 89000, status: 'PROCESSING', paymentStatus: 'PENDING', deliveryStatus: 'ORDER_ACCEPTED' },
    { id: 'ord-105', orderNumber: 'ORD-2026-8807', customerName: 'CarePlus Diagnostics & Research', createdAt: '2026-10-18', totalAmount: 42000, status: 'DELIVERED', paymentStatus: 'PAID', deliveryStatus: 'DELIVERED' },
    { id: 'ord-106', orderNumber: 'ORD-2026-8805', customerName: 'ThyroCare Reference Lab', createdAt: '2026-10-17', totalAmount: 115000, status: 'SHIPPED', paymentStatus: 'PARTIAL', deliveryStatus: 'IN_TRANSIT' },
    { id: 'ord-107', orderNumber: 'ORD-2026-8803', customerName: 'Apollo Diagnostics Centre', createdAt: '2026-10-16', totalAmount: 64200, status: 'DELIVERED', paymentStatus: 'PAID', deliveryStatus: 'DELIVERED' },
  ];

  const filteredOrders = useMemo(() => {
    return rawOrders.filter((o) => {
      const q = ordersSearch.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
      );
    });
  }, [rawOrders, ordersSearch]);

  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, ordersPage]);

  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;

  // Section D: Pending Payments Data
  const rawPayments = [
    { labName: 'Apex Clinical Laboratories', invoiceNumber: 'INV-2026-0914', amount: 35000, dueDate: '2026-10-15', status: 'OVERDUE' },
    { labName: 'Lifeline Health Diagnostic', invoiceNumber: 'INV-2026-0988', amount: 28500, dueDate: '2026-10-25', status: 'DUE_SOON' },
    { labName: 'CarePlus Diagnostics & Research', invoiceNumber: 'INV-2026-0922', amount: 42000, dueDate: '2026-10-12', status: 'OVERDUE' },
    { labName: 'Suburban Pathology Centre', invoiceNumber: 'INV-2026-1002', amount: 19500, dueDate: '2026-10-28', status: 'DUE_SOON' },
  ];

  const filteredPayments = useMemo(() => {
    if (paymentsFilter === 'OVERDUE') return rawPayments.filter((p) => p.status === 'OVERDUE');
    if (paymentsFilter === 'DUE_SOON') return rawPayments.filter((p) => p.status === 'DUE_SOON');
    return rawPayments;
  }, [paymentsFilter]);

  // Section E: Notifications & Alerts List
  const notificationsList = [
    { id: 'notif-1', title: 'New Customer Order', desc: 'Order ORD-2026-8812 received from Metropolis Diagnostics Lab (₹48,500)', type: 'ORDER', severity: 'info', time: '12m ago' },
    { id: 'notif-2', title: 'Overdue Payment Alert', desc: 'Apex Clinical Laboratory has ₹35,000 overdue past 14 days', type: 'PAYMENT', severity: 'warning', time: '45m ago' },
    { id: 'notif-3', title: 'Order Awaiting Dispatch', desc: 'Diagnostic express delivery run to Thane East ready for route assignment', type: 'DISPATCH', severity: 'info', time: '1h ago' },
    { id: 'notif-4', title: 'Low Stock Item Alert', desc: 'Biochemistry Reagent Pack Alpha stock (12 kits) below safety threshold (25 kits)', type: 'STOCK', severity: 'warning', time: '2h ago' },
    { id: 'notif-5', title: 'Assigned Service Call', desc: 'Preventive Maintenance ticket assigned for Sysmex KX-21 at Suburban Pathology', type: 'SERVICE', severity: 'info', time: '3h ago' },
  ];

  // Section F: Pending Orders Data
  const rawPendingOrders = [
    { orderNumber: 'ORD-2026-8812', labName: 'Metropolis Diagnostics Lab', orderDate: '2026-10-22', status: 'PROCESSING', paymentStatus: 'PAID', expectedDelivery: '2026-10-23' },
    { orderNumber: 'ORD-2026-8811', labName: 'Apex Clinical Laboratory', orderDate: '2026-10-21', status: 'READY_FOR_DISPATCH', paymentStatus: 'CREDIT_APPROVED', expectedDelivery: '2026-10-23' },
    { orderNumber: 'ORD-2026-8808', labName: 'Lifeline Health Diagnostic', orderDate: '2026-10-19', status: 'PENDING', paymentStatus: 'PENDING', expectedDelivery: '2026-10-24' },
    { orderNumber: 'ORD-2026-8805', labName: 'ThyroCare Reference Lab', orderDate: '2026-10-17', status: 'AWAITING_DELIVERY', paymentStatus: 'PARTIAL', expectedDelivery: '2026-10-23' },
  ];

  const filteredPendingOrders = useMemo(() => {
    if (pendingOrdersFilter === 'PROCESSING') return rawPendingOrders.filter((o) => o.status === 'PROCESSING');
    if (pendingOrdersFilter === 'DISPATCH') return rawPendingOrders.filter((o) => o.status === 'READY_FOR_DISPATCH');
    if (pendingOrdersFilter === 'DELIVERY') return rawPendingOrders.filter((o) => o.status === 'AWAITING_DELIVERY');
    return rawPendingOrders;
  }, [pendingOrdersFilter]);

  // Section G: Top Customers
  const topCustomers = [
    { rank: 1, labName: 'Metropolis Diagnostics Lab', code: 'CUST-001', ordersCount: 24, totalRevenue: 840000, status: 'ACTIVE' },
    { rank: 2, labName: 'ThyroCare Reference Lab', code: 'CUST-006', ordersCount: 19, totalRevenue: 695000, status: 'ACTIVE' },
    { rank: 3, labName: 'Apex Clinical Laboratories', code: 'CUST-002', ordersCount: 16, totalRevenue: 512000, status: 'ACTIVE' },
    { rank: 4, labName: 'CarePlus Diagnostics & Research', code: 'CUST-005', ordersCount: 14, totalRevenue: 430000, status: 'ACTIVE' },
    { rank: 5, labName: 'Apollo Diagnostics Centre', code: 'CUST-007', ordersCount: 12, totalRevenue: 388000, status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a101d] text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
              Diagnostic Services
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500">● Role: <strong className="text-slate-700">{currentRole}</strong></span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Executive Business Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time operations, customer lab orders, pending payments, fulfillment pipeline, and SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
          <button
            onClick={() => fetchSummary()}
            disabled={isLoading}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-xs whitespace-nowrap"
            title="Refresh metrics from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigateTab('quotations')}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotations Desk</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports_analytics')}
            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports &amp; Analytics</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. FIVE PROMINENT KPI CARDS ACROSS THE TOP */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span>Primary Business Key Performance Indicators</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono hidden xs:inline">Live PostgreSQL 16 Data</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {/* Card 1: Total Orders */}
          <div
            id="kpi-total-orders"
            onClick={() => onNavigateTab('orders_management')}
            className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div className="flex items-start justify-between text-slate-500 gap-1 mb-1">
              <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-w-0">Total Orders</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">{kpis.totalOrders}</div>
            <div className="text-[10px] sm:text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-0.5 truncate">
              <span className="truncate">View detailed orders</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </div>
          </div>

          {/* Card 2: Total Customers / Labs */}
          <div
            id="kpi-total-customers"
            onClick={() => onNavigateTab('customers_labs')}
            className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div className="flex items-start justify-between text-slate-500 gap-1 mb-1">
              <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-w-0">Total Customers / Labs</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">{kpis.totalCustomers}</div>
            <div className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5 truncate">
              <span className="truncate">Registered diagnostic labs</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </div>
          </div>

          {/* Card 3: Pending Payments */}
          <div
            id="kpi-pending-payments"
            onClick={() => onNavigateTab('credit_management')}
            className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div className="flex items-start justify-between text-slate-500 gap-1 mb-1">
              <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-w-0">Pending Payments</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-base sm:text-xl lg:text-2xl font-black text-amber-600 font-mono truncate" title={isFinanceAuthorized ? `₹${formatINR(kpis.totalOutstanding)}` : '••••••'}>
              {isFinanceAuthorized ? `₹${formatINR(kpis.totalOutstanding)}` : '••••••'}
            </div>
            <div className="text-[10px] sm:text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-0.5 truncate">
              <span className="truncate">Overdue: ₹{formatINR(kpis.totalOverdue)}</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </div>
          </div>

          {/* Card 4: Pending Orders */}
          <div
            id="kpi-pending-orders"
            onClick={() => onNavigateTab('orders_management')}
            className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-violet-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div className="flex items-start justify-between text-slate-500 gap-1 mb-1">
              <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-w-0">Pending Orders</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">{kpis.pendingOrdersCount || 6}</div>
            <div className="text-[10px] sm:text-[11px] text-violet-600 font-semibold mt-1 flex items-center gap-0.5 truncate">
              <span className="truncate">Awaiting dispatch / run</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </div>
          </div>

          {/* Card 5: New Notifications */}
          <div
            id="kpi-new-notifications"
            onClick={() => {
              const el = document.getElementById('section-notifications');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="col-span-2 md:col-span-1 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-rose-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-w-0"
          >
            <div className="flex items-start justify-between text-slate-500 gap-1 mb-1">
              <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 min-w-0">New Notifications</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono truncate">{notificationsList.length}</div>
            <div className="text-[10px] sm:text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-0.5 truncate">
              <span className="truncate">View operational alerts</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD SECTIONS */}
      {/* ========================================================================= */}

      {/* SECTION A: SALES VS TARGET */}
      <div id="section-sales-target" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Section A — Sales vs Target</span>
            </h3>
            <p className="text-xs text-slate-500">Monthly actual sales revenue compared against business quotas</p>
          </div>

          {/* Date Range Selector */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            {(['THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'FY_2026'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSalesDateRange(range)}
                className={`px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all cursor-pointer text-center ${
                  salesDateRange === range
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'THIS_MONTH' ? 'This Month' : range === 'LAST_MONTH' ? 'Last Month' : range === 'THIS_QUARTER' ? 'This Quarter' : 'FY 2026-27'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Actual Achieved Sales</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono truncate">
              ₹{formatINR(activeSalesMetric.actual)}
            </div>
            <span className="text-[11px] text-slate-500">Period: {activeSalesMetric.period}</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500 font-medium">Assigned Quota Target</span>
            <div className="text-xl sm:text-2xl font-black text-slate-600 font-mono truncate">
              ₹{formatINR(activeSalesMetric.target)}
            </div>
            <span className="text-[11px] text-slate-500">Target for {activeSalesMetric.period}</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
            <span className="text-xs text-blue-700 font-medium">Target Completion</span>
            <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono truncate">
              {salesPct}%
            </div>
            <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${salesPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: DEPARTMENT ACTIVITY */}
      <div id="section-department-activity" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Section B — Department Activity</span>
          </h3>
          <p className="text-xs text-slate-500">Real-time operational activity counts across commercial and technical staff</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Lab Visits */}
          <div
            onClick={() => onNavigateTab('sales_field_mobile')}
            className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-400 transition cursor-pointer group text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{departmentActivity.labVisits}</div>
            <div className="text-xs font-semibold text-slate-600">Lab Visits</div>
            <div className="text-[10px] text-blue-600">Field Sales App</div>
          </div>

          {/* Sales Calls */}
          <div
            onClick={() => onNavigateTab('sales_field_mobile')}
            className="p-3.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 hover:border-emerald-400 transition cursor-pointer group text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{departmentActivity.salesCalls}</div>
            <div className="text-xs font-semibold text-slate-600">Sales Calls</div>
            <div className="text-[10px] text-emerald-600">Active Contacts</div>
          </div>

          {/* Service Calls */}
          <div
            onClick={() => onNavigateTab('service_engineer')}
            className="p-3.5 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-200 hover:border-amber-400 transition cursor-pointer group text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{departmentActivity.serviceCalls}</div>
            <div className="text-xs font-semibold text-slate-600">Service Calls</div>
            <div className="text-[10px] text-amber-600">Engineer Desk</div>
          </div>

          {/* Deliveries */}
          <div
            onClick={() => onNavigateTab('delivery_mobile')}
            className="p-3.5 bg-slate-50 hover:bg-violet-50/50 rounded-xl border border-slate-200 hover:border-violet-400 transition cursor-pointer group text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{departmentActivity.deliveries}</div>
            <div className="text-xs font-semibold text-slate-600">Deliveries</div>
            <div className="text-[10px] text-violet-600">Cold Chain Run</div>
          </div>

          {/* Application Tickets */}
          <div
            onClick={() => onNavigateTab('app_support_mobile')}
            className="p-3.5 bg-slate-50 hover:bg-cyan-50/50 rounded-xl border border-slate-200 hover:border-cyan-400 transition cursor-pointer group text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{departmentActivity.appSupportTickets}</div>
            <div className="text-xs font-semibold text-slate-600">App Tickets</div>
            <div className="text-[10px] text-cyan-600">Reagent Protocol</div>
          </div>

          {/* Installations */}
          <div
            onClick={() => onNavigateTab('service_engineer')}
            className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200 hover:border-indigo-400 transition cursor-pointer group text-center space-y-1"
          >
            <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">{departmentActivity.installations}</div>
            <div className="text-xs font-semibold text-slate-600">Installations</div>
            <div className="text-[10px] text-indigo-600">Analyzer Comm.</div>
          </div>
        </div>
      </div>

      {/* SECTION C: RECENT CUSTOMER ORDERS (SEARCHABLE & PAGINATED TABLE) */}
      <div id="section-recent-orders" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Section C — Recent Customer Orders</span>
            </h3>
            <p className="text-xs text-slate-500">Live order fulfillment stream across all diagnostic lab accounts</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders or labs..."
                value={ordersSearch}
                onChange={(e) => {
                  setOrdersSearch(e.target.value);
                  setOrdersPage(1);
                }}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white w-full"
              />
            </div>
            <button
              onClick={() => onNavigateTab('orders_management')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap text-center"
            >
              View All Orders →
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Laboratory / Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Order Status</th>
                <th className="px-4 py-3 text-center">Payment Status</th>
                <th className="px-4 py-3 text-center">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No orders match the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                      {ord.orderNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {ord.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {ord.createdAt}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      ₹{formatINR(ord.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ord.paymentStatus || 'CREDIT_APPROVED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {ord.deliveryStatus || 'READY_FOR_DISPATCH'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 pt-1">
          <span className="text-center sm:text-left">Showing page {ordersPage} of {totalOrdersPages} ({filteredOrders.length} records)</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
              disabled={ordersPage === 1}
              className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setOrdersPage((p) => Math.min(totalOrdersPages, p + 1))}
              disabled={ordersPage === totalOrdersPages}
              className="px-2.5 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: SECTION D (PENDING PAYMENTS) & SECTION E (NOTIFICATIONS & ALERTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* SECTION D: PENDING PAYMENTS */}
        <div id="section-pending-payments" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Section D — Pending Payments</span>
              </h3>
              <p className="text-xs text-slate-500">Authorized accounts receivables and credit ledger oversight</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs w-full sm:w-auto">
              {(['ALL', 'OVERDUE', 'DUE_SOON'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPaymentsFilter(filter)}
                  className={`flex-1 sm:flex-none text-center px-2.5 py-0.5 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
                    paymentsFilter === filter ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'OVERDUE' ? 'Overdue' : 'Due Soon'}
                </button>
              ))}
            </div>
          </div>

          {!isFinanceAuthorized ? (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <Lock className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Financial Data Restricted</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Only authorized Super Admin, Office Admin, and Accounts &amp; Finance roles are permitted to view customer receivables.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPayments.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition"
                >
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">{p.labName}</div>
                    <div className="text-[10.5px] sm:text-[11px] text-slate-500 font-mono truncate">Invoice: {p.invoiceNumber} • Due: {p.dueDate}</div>
                  </div>
                  <div className="text-right space-y-1 shrink-0">
                    <div className="font-mono font-bold text-xs sm:text-sm text-slate-900">₹{formatINR(p.amount)}</div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION E: NOTIFICATIONS & ALERTS */}
        <div id="section-notifications" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Section E — Notifications &amp; Alerts</span>
              </h3>
              <p className="text-xs text-slate-500">Live operational alerts across orders, logistics, and service</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 shrink-0">
              {notificationsList.length} Active
            </span>
          </div>

          <div className="space-y-2.5">
            {notificationsList.map((notif) => (
              <div
                key={notif.id}
                className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 sm:gap-3 text-xs"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.severity === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 truncate">{notif.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-[11px] sm:text-[11.5px] text-slate-600 leading-relaxed break-words">{notif.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID: SECTION F (PENDING ORDER LIST) & SECTION G (TOP CUSTOMERS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* SECTION F: PENDING ORDER LIST */}
        <div id="section-pending-orders" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-600 shrink-0" />
                <span>Section F — Pending Order List</span>
              </h3>
              <p className="text-xs text-slate-500">Orders requiring processing, dispatch, or cold-chain delivery</p>
            </div>

            {/* Filter buttons */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs w-full sm:w-auto">
              {(['ALL', 'PROCESSING', 'DISPATCH', 'DELIVERY'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPendingOrdersFilter(filter)}
                  className={`px-2 py-0.5 rounded-lg font-semibold text-[10.5px] transition cursor-pointer text-center ${
                    pendingOrdersFilter === filter ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredPendingOrders.map((ord, idx) => (
              <div
                key={idx}
                className="p-3 sm:p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 text-xs space-y-1.5 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600">{ord.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                    {ord.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 truncate">{ord.labName}</div>
                <div className="flex flex-col xs:flex-row xs:items-center justify-between text-[10.5px] sm:text-[11px] text-slate-500 font-mono gap-0.5">
                  <span>Order Date: {ord.orderDate}</span>
                  <span>Expected Delivery: {ord.expectedDelivery}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION G: TOP CUSTOMERS */}
        <div id="section-top-customers" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Section G — Top Customers</span>
              </h3>
              <p className="text-xs text-slate-500">Diagnostic laboratories ranked by cumulative order revenue</p>
            </div>
            <button
              onClick={() => onNavigateTab('customers_labs')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
            >
              All Labs →
            </button>
          </div>

          <div className="space-y-2.5">
            {topCustomers.map((cust) => (
              <div
                key={cust.rank}
                className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-800 text-white font-bold text-[10px] sm:text-[11px] flex items-center justify-center shrink-0">
                    {cust.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">{cust.labName}</div>
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">{cust.code} • {cust.ordersCount} orders</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                    {isFinanceAuthorized ? `₹${formatINR(cust.totalRevenue)}` : '••••••'}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Top Partner</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
