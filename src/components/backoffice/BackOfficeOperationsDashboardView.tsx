import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Wrench,
  Truck,
  Stethoscope,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Package,
  Layers,
  Inbox,
  Send,
  Eye,
  CheckSquare,
  AlertCircle,
  Receipt,
  Users,
  ChevronLeft,
  Calendar,
  Lock,
  TrendingUp
} from 'lucide-react';
import { SalesManagementDashboardView } from '../sales/SalesManagementDashboardView';
import { ServiceManagementDashboardView } from '../service/ServiceManagementDashboardView';
import { DeliveryManagementDashboardView } from '../delivery/DeliveryManagementDashboardView';
import { ApplicationSupportDashboardView } from '../application/ApplicationSupportDashboardView';
import { LaboratoryManagementDashboardView } from '../laboratory/LaboratoryManagementDashboardView';
import { OrderReminderChatbot } from './OrderReminderChatbot';

interface BackOfficeOperationsDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab: (tabId: string) => void;
}

export const BackOfficeOperationsDashboardView: React.FC<BackOfficeOperationsDashboardViewProps> = ({
  currentUser,
  currentRole,
  token,
  onNavigateTab,
}) => {
  const [activeDepartment, setActiveDepartment] = useState<'OPERATIONS' | 'SALES' | 'SERVICE' | 'DELIVERY' | 'APPLICATION' | 'LABORATORY'>('OPERATIONS');
  const [data, setData] = useState<any>(null);
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [quotationsCount, setQuotationsCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeOperationalTab, setActiveOperationalTab] = useState<'MY_WORK' | 'ORDERS' | 'QUOTATIONS' | 'RECEIVABLES' | 'INVENTORY'>('MY_WORK');

  const ordersPerPage = 5;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchOperationsData = async () => {
    setIsRefreshing(true);
    try {
      const [dashRes, workRes, quoteRes] = await Promise.all([
        fetch(`/api/v1/backoffice/dashboard-summary?role=${currentRole || 'OFFICE_ADMIN'}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch(`/api/v1/my-work?role=${currentRole || 'OFFICE_ADMIN'}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/v1/quotations/summary/report', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        setData(json.data);
      }
      if (workRes.ok) {
        const wJson = await workRes.json();
        setWorkItems(wJson.data || []);
      }
      if (quoteRes.ok) {
        const qJson = await quoteRes.json();
        if (qJson.data?.totalCount) {
          setQuotationsCount(qJson.data.totalCount);
        }
      }
    } catch (err) {
      console.error('Failed to load Back Office operations data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, [currentRole, token]);

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

  // Complete work item action
  const handleMarkDone = (id: string) => {
    setWorkItems(prev => prev.filter(w => w.id !== id));
    showToast('Task marked as completed.');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0E1035] text-white rounded-xl shadow-xl border border-white/20 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Operations Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#1E331B] text-[#D2E7C4] border border-[#5F8F4D]/40 flex items-center gap-1 shadow-2xs">
              BACK OFFICE OPERATIONS DESK
            </span>
            <span className="text-xs text-slate-400 font-medium">● Daily Dispatch &amp; Work Queue</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic Services Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time execution queue: customer orders, quotation drafts, inventory warnings, and assigned tasks.
          </p>
        </div>

        {/* Quick Operational Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('quotations')}
            className="px-3 py-2 rounded-xl bg-[#1E331B] hover:bg-[#15253F] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>Create Quotation</span>
          </button>
          <button
            onClick={() => onNavigateTab('orders_management')}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-sky-600" />
            <span>Book WhatsApp Order</span>
          </button>
          <button
            onClick={fetchOperationsData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5-Department Operational Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveDepartment('OPERATIONS')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'OPERATIONS'
              ? 'bg-[#1E331B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-300" />
          <span>Daily Operations Desk</span>
        </button>

        <button
          onClick={() => setActiveDepartment('SALES')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'SALES'
              ? 'bg-[#1E331B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>1. Sales Operations</span>
        </button>

        <button
          onClick={() => setActiveDepartment('SERVICE')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'SERVICE'
              ? 'bg-[#1E331B] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-sky-400" />
          <span>2. Service &amp; AMC</span>
        </button>

        <button
          onClick={() => setActiveDepartment('DELIVERY')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeDepartment === 'DELIVERY'
              ? 'bg-[#1E331B] text-white shadow-xs'
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
              ? 'bg-[#1E331B] text-white shadow-xs'
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
              ? 'bg-[#1E331B] text-white shadow-xs'
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

      {activeDepartment === 'OPERATIONS' && (
        <>
      {/* Operational Work Ribbon (4 Key Counters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Counter 1: Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders_management')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pending Orders for Dispatch</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {data?.pendingOrders?.length || 6} <span className="text-xs font-semibold text-slate-400">Orders</span>
          </div>
          <div className="text-[11px] text-sky-700 font-semibold flex items-center gap-1">
            <span>Requires warehouse picking</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Counter 2: Commercial Quotations */}
        <div
          onClick={() => onNavigateTab('quotations')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Quotations Desk</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {quotationsCount} <span className="text-xs font-semibold text-slate-400">Total Quotes</span>
          </div>
          <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
            <span>Draft &amp; Finalized GST Quotes</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Counter 3: Assigned Work Items */}
        <div
          onClick={() => setActiveOperationalTab('MY_WORK')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Assigned Tasks ("My Work")</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {workItems.length || 4} <span className="text-xs font-semibold text-slate-400">Actionable</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>High-priority items flagged</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Counter 4: Inventory Critical Alerts */}
        <div
          onClick={() => onNavigateTab('inventory_management')}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Warehouse Stock Alerts</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            3 <span className="text-xs font-semibold text-amber-700">Low Reagent Batches</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
            <span>Inspect inventory levels</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Embedded Operational Order Reminder Assistant (Requirement 10) */}
      <OrderReminderChatbot
        currentUser={currentUser}
        currentRole={currentRole}
        token={token}
        onNavigateTab={onNavigateTab}
        onOpenOrder={(_orderId) => onNavigateTab('orders_management')}
        isFloating={false}
      />

      {/* Operational Work Stage (Tabs: My Work, Orders, Quotations, Receivables) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6 pt-3 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveOperationalTab('MY_WORK')}
            className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeOperationalTab === 'MY_WORK'
                ? 'border-[#1E331B] text-[#1E331B] font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Assigned Tasks Queue ({workItems.length || 4})</span>
          </button>
          <button
            onClick={() => setActiveOperationalTab('ORDERS')}
            className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeOperationalTab === 'ORDERS'
                ? 'border-[#1E331B] text-[#1E331B] font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Recent Orders &amp; Dispatches</span>
          </button>
          <button
            onClick={() => onNavigateTab('quotations')}
            className="pb-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotation Desk</span>
          </button>
          <button
            onClick={() => onNavigateTab('credit_management')}
            className="pb-3 px-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Customer Receivables &amp; Credit</span>
          </button>
        </div>

        {/* Tab 1: My Work Queue */}
        {activeOperationalTab === 'MY_WORK' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Immediate Action Items Assigned to Back Office</span>
              <button
                onClick={() => onNavigateTab('my_work')}
                className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full My-Work Console</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(workItems.length > 0 ? workItems : [
                { id: 'w-1', title: 'Verify Cold-Chain Batch Reagent Lot #DCL-2026-X1 for Metropolis', module: 'ORDERS', priority: 'HIGH', dueTime: '2:00 PM' },
                { id: 'w-2', title: 'Review WhatsApp manual order booking from Dr. Anil Mehta (Apex Lab)', module: 'ORDERS', priority: 'HIGH', dueTime: '3:30 PM' },
                { id: 'w-3', title: 'Check credit grace extension status for Suburban Pathology', module: 'ACCOUNTS', priority: 'MEDIUM', dueTime: 'Today' },
                { id: 'w-4', title: 'Follow up on AMC renewal quotation for Sysmex KX-21 at Lifeline Health', module: 'SERVICE', priority: 'NORMAL', dueTime: 'Tomorrow' },
              ]).map((w) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      w.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {w.priority}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{w.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">{w.dueTime}</span>
                    <button
                      onClick={() => handleMarkDone(w.id)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Orders & Dispatches */}
        {activeOperationalTab === 'ORDERS' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter orders by ID or customer..."
                  value={ordersSearch}
                  onChange={(e) => {
                    setOrdersSearch(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <button
                onClick={() => onNavigateTab('orders_management')}
                className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Orders Management</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer / Laboratory</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Dispatch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{o.customerName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatINR(o.totalAmount)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          o.status === 'PROCESSING' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 font-medium">
                        {o.deliveryStatus || 'PENDING'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalOrdersPages > 1 && (
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-500">Page {ordersPage} of {totalOrdersPages}</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage(p => p - 1)}
                    className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={ordersPage >= totalOrdersPages}
                    onClick={() => setOrdersPage(p => p + 1)}
                    className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Operational Policy & Safe Governance Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Operational Governance:</strong> Back Office user sessions are constrained to daily order fulfillment, quotation drafting, and dispatch tracking. System configuration and payroll disbursement gates are managed by Super Admin.
          </span>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
