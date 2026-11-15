import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  Sliders,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ThermometerSnowflake,
  FileText,
  Eye,
  ChevronRight,
  RefreshCw,
  Building2,
  Truck,
  Lock,
  DollarSign,
  Percent,
  Download,
  X,
  History,
  Check,
  Zap,
  MessageSquare,
  Bell,
  Plus
} from 'lucide-react';
import { Phase4Order, PaymentTransaction, PaymentRulesConfig } from '../types';
import { CustomerCreditBackOfficeView } from './CustomerCreditBackOfficeView';

export function AdminOrdersManagementView({ token }: { token?: string | null } = {}) {
  const [orders, setOrders] = useState<Phase4Order[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [paymentRules, setPaymentRules] = useState<PaymentRulesConfig | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Phase4Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'transactions' | 'payment_rules' | 'credit_management'>('orders');
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [coldChainFilter, setColdChainFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Status Change Modal State
  const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('PROCESSING');
  const [statusComment, setStatusComment] = useState<string>('');
  const [sensorTempInput, setSensorTempInput] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Payment Rules Edit State
  const [advanceDiscountInput, setAdvanceDiscountInput] = useState<number>(2);
  const [advanceDiscountEnabled, setAdvanceDiscountEnabled] = useState<boolean>(true);
  const [codMaxLimitInput, setCodMaxLimitInput] = useState<number>(50000);
  const [codAllowColdChain, setCodAllowColdChain] = useState<boolean>(false);
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  const [rulesSaveSuccess, setRulesSaveSuccess] = useState<boolean>(false);

  // Authoritative Product Master & Batch Stock Catalog
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Manual WhatsApp Order Entry State (Part 13)
  const [isManualWhatsAppModalOpen, setIsManualWhatsAppModalOpen] = useState<boolean>(false);
  const [isSubmittingManualOrder, setIsSubmittingManualOrder] = useState<boolean>(false);
  const [manualOrderSuccessMsg, setManualOrderSuccessMsg] = useState<string | null>(null);
  const [manualOrderErrorMsg, setManualOrderErrorMsg] = useState<string | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState<string>('u-cust-01');
  const [manualCustomerName, setManualCustomerName] = useState<string>('Metropolis Diagnostics Lab');
  const [manualCustomerPhone, setManualCustomerPhone] = useState<string>('+91 98200 11223');
  const [manualShippingAddress, setManualShippingAddress] = useState<string>('Unit 4, Worli Industrial Hub, Mumbai');
  const [manualWhatsappRef, setManualWhatsappRef] = useState<string>('WA-MSG-8812');
  const [manualNotes, setManualNotes] = useState<string>('Customer confirmed order via official WhatsApp conversation');
  const [manualItems, setManualItems] = useState<Array<{ productName: string; packSize: string; price: number; quantity: number; gstRate: number }>>([
    { productName: 'Biochemistry Multi-Calibrator Pro', packSize: '6 x 5 mL', price: 8400, quantity: 2, gstRate: 18 }
  ]);

  // 4-Hour Reminder Action State
  const [reminderActionNotice, setReminderActionNotice] = useState<string | null>(null);
  const [isDispatchingReminders, setIsDispatchingReminders] = useState<boolean>(false);

  const handleDispatchOrderReminder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}/dispatch-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setReminderActionNotice(data.message || '4-Hour reminder alert dispatched to assigned staff & Super Admin.');
        loadData();
      } else {
        setReminderActionNotice(data.message || 'Failed to dispatch reminder.');
      }
    } catch (err) {
      setReminderActionNotice('Network error dispatching 4-hour reminder alert.');
    }
    setTimeout(() => setReminderActionNotice(null), 4000);
  };

  const handleDispatchAllPendingReminders = async () => {
    setIsDispatchingReminders(true);
    try {
      const res = await fetch('/api/v1/admin/orders/dispatch-all-pending-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok) {
        setReminderActionNotice(data.message || 'Dispatched 4-hour pending order reminders sweep.');
        loadData();
      }
    } catch (err) {
      setReminderActionNotice('Failed to dispatch reminder sweep.');
    } finally {
      setIsDispatchingReminders(false);
      setTimeout(() => setReminderActionNotice(null), 4000);
    }
  };

  const handleCreateManualWhatsAppOrder = async () => {
    if (!manualCustomerId || manualItems.length === 0) {
      setManualOrderErrorMsg('Please specify customer and at least one order product item.');
      return;
    }
    setIsSubmittingManualOrder(true);
    setManualOrderErrorMsg(null);
    try {
      const res = await fetch('/api/v1/admin/orders/manual-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          customerId: manualCustomerId,
          customerName: manualCustomerName,
          customerPhone: manualCustomerPhone,
          shippingAddress: manualShippingAddress,
          whatsappReferenceNumber: manualWhatsappRef,
          notes: manualNotes,
          items: manualItems
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setManualOrderErrorMsg(data.message || 'Failed to create manual WhatsApp order.');
        return;
      }
      setManualOrderSuccessMsg(data.message || 'Manual WhatsApp order created successfully.');
      loadData();
      setTimeout(() => {
        setIsManualWhatsAppModalOpen(false);
        setManualOrderSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setManualOrderErrorMsg('Network error submitting manual WhatsApp order.');
    } finally {
      setIsSubmittingManualOrder(false);
    }
  };

  // Authorized Order Amendment Modal State
  const [amendmentModalOpen, setAmendmentModalOpen] = useState<boolean>(false);
  const [amendmentJustification, setAmendmentJustification] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditNoteNumber, setCreditNoteNumber] = useState<string>('');
  const [isSubmittingAmendment, setIsSubmittingAmendment] = useState<boolean>(false);
  const [amendmentError, setAmendmentError] = useState<string | null>(null);
  const [amendmentSuccess, setAmendmentSuccess] = useState<string | null>(null);

  // Load Admin Data
  const loadData = async () => {
    setLoading(true);
    try {
      const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [ordersRes, txnsRes, rulesRes, catalogRes] = await Promise.all([
        fetch(`/api/v1/admin/orders?status=${statusFilter}&paymentMethod=${paymentFilter}&isColdChain=${coldChainFilter}&search=${encodeURIComponent(searchTerm)}`, { headers: authHeaders }),
        fetch('/api/v1/admin/payment-transactions', { headers: authHeaders }),
        fetch('/api/v1/admin/payment-rules', { headers: authHeaders }),
        fetch('/api/v1/accounting/products-with-batches', { headers: authHeaders })
      ]);

      if (catalogRes.ok) {
        const cData = await catalogRes.json();
        setCatalogProducts(cData.data || []);
      }

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        setOrders(oData.data || []);
      }
      if (txnsRes.ok) {
        const tData = await txnsRes.json();
        setTransactions(tData.data || []);
      }
      if (rulesRes.ok) {
        const rData = await rulesRes.json();
        setPaymentRules(rData.data);
        if (rData.data) {
          setAdvanceDiscountInput(rData.data.advanceDiscountPercent);
          setAdvanceDiscountEnabled(rData.data.advanceDiscountEnabled);
          setCodMaxLimitInput(rData.data.codEligibility.maxOrderLimit);
          setCodAllowColdChain(rData.data.codEligibility.allowColdChain);
          setCodEnabled(rData.data.codEligibility.isEnabled);
        }
      }
    } catch (err) {
      console.error('Failed to load admin orders data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, paymentFilter, coldChainFilter, searchTerm]);

  // Handle Status Update
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: newStatus,
          comment: statusComment,
          coldChainSensorTemp: sensorTempInput || undefined
        })
      });

      if (res.ok) {
        setStatusModalOpen(false);
        setStatusComment('');
        // Reload single order details
        const detRes = await fetch(`/api/v1/admin/orders/${selectedOrder.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (detRes.ok) {
          const d = await detRes.json();
          setSelectedOrder(d.data);
        }
        loadData();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProcessAmendment = async () => {
    if (!selectedOrder) return;
    if (!amendmentJustification.trim()) {
      setAmendmentError('A mandatory justification is required for authorized financial amendments.');
      return;
    }

    setIsSubmittingAmendment(true);
    setAmendmentError(null);
    setAmendmentSuccess(null);

    try {
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const payload = {
        amendmentType: 'PRICE_CORRECTION_CREDIT_NOTE',
        revisedSubtotal: Math.max(0, (selectedOrder.subtotal || 0) - Number(creditAmount || 0)),
        creditAmount: Number(creditAmount || 0),
        creditNoteNumber: creditNoteNumber.trim() || undefined,
        justification: amendmentJustification.trim(),
        makerId: 'u-office-01',
        checkerId: 'u-admin-01'
      };

      const res = await fetch(`/api/v1/admin/orders/${selectedOrder.id}/amend`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit order amendment');
      }

      setAmendmentSuccess(`Financial amendment recorded successfully. Credit Note: ${json.data?.creditNoteNumber || 'Issued'}`);
      await loadData();
      setTimeout(() => {
        setAmendmentModalOpen(false);
        setAmendmentSuccess(null);
      }, 2500);
    } catch (err: any) {
      setAmendmentError(err.message || 'Error processing order amendment');
    } finally {
      setIsSubmittingAmendment(false);
    }
  };

  // Handle Save Payment Rules
  const handleSavePaymentRules = async () => {
    try {
      const res = await fetch('/api/v1/admin/payment-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          advanceDiscountPercent: advanceDiscountInput,
          advanceDiscountEnabled,
          codEligibility: {
            isEnabled: codEnabled,
            maxOrderLimit: codMaxLimitInput,
            allowColdChain: codAllowColdChain
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPaymentRules(data.data);
        setRulesSaveSuccess(true);
        setTimeout(() => setRulesSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save payment rules', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      {/* Top Banner */}
      <div className="bg-[#F5F6F0] border border-[#D2E7C4] rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/40 text-[11px] font-black uppercase rounded-full tracking-wider">
              Orders & Payments
            </span>
            <span className="text-xs text-[#6B7F6A] font-mono">Server-Side Verified &bull; Immutable Snapshots</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#22381E] tracking-tight mt-1">
            Order & Payment Operations Center
          </h1>
          <p className="text-xs text-[#415439] mt-1 max-w-2xl">
            Monitor client orders, audit immutable price snapshots, control real-time advance payment discounts (2%), enforce COD and credit limit boundaries, and inspect cryptographic payment verification logs.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:items-center bg-[#E4E8DF]/60 p-1 rounded-xl border border-[#D2E7C4] w-full xl:w-auto gap-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full xl:w-auto ${activeTab === 'orders' ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs' : 'text-[#3D5A37] hover:text-[#22381E]'
              }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="truncate">Customer Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full xl:w-auto ${activeTab === 'transactions' ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs' : 'text-[#3D5A37] hover:text-[#22381E]'
              }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Payment Gateway Verifications ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('payment_rules')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full xl:w-auto ${activeTab === 'payment_rules' ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs' : 'text-[#3D5A37] hover:text-[#22381E]'
              }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">Payment &amp; Discount Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('credit_management')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center sm:justify-start gap-2 cursor-pointer w-full xl:w-auto ${activeTab === 'credit_management' ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs' : 'text-[#3D5A37] hover:text-[#22381E]'
              }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="truncate">Customer Credit &amp; Extensions</span>
          </button>
        </div>
      </div>

      {/* 0. CUSTOMER CREDIT & EXTENSIONS VIEW */}
      {activeTab === 'credit_management' && (
        <CustomerCreditBackOfficeView />
      )}

      {/* 1. ORDERS LIST & DETAILS VIEW */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Table / List */}
          <div className={`${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-200 min-w-0`}>
            {/* Filters Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search order #, lab name, address, SKU..."
                  className="w-full text-xs text-slate-800 bg-transparent focus:outline-hidden min-w-0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden cursor-pointer w-full sm:w-auto"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden cursor-pointer w-full sm:w-auto"
                >
                  <option value="ALL">All Payment Types</option>
                  <option value="ADVANCE_PAYMENT">Advance Payment (2% Off)</option>
                  <option value="CREDIT_ORDER">Approved Credit Line</option>
                  <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  <option value="PAYMENT_GATEWAY">Online Gateway</option>
                </select>

                <button
                  onClick={() => setIsManualWhatsAppModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Manual WhatsApp Order Entry (Source: WhatsApp — Manually Entered)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Order</span>
                </button>

                <button
                  onClick={handleDispatchAllPendingReminders}
                  disabled={isDispatchingReminders}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  title="Dispatch scheduled 4-hour pending order reminders (9 AM, 1 PM, 5 PM, 9 PM, 1 AM) to staff and Super Admin"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>4h Reminders Sweep</span>
                </button>

                <button
                  onClick={loadData}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer self-center"
                  title="Refresh orders"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4-Hour Reminder Action Feedback Banner */}
            {reminderActionNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>{reminderActionNotice}</span>
                </div>
                <button onClick={() => setReminderActionNotice(null)} className="text-amber-700 hover:text-amber-950">✕</button>
              </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order Number & Lab</th>
                      <th className="py-3 px-4">Items / Logistics</th>
                      <th className="py-3 px-4">Payment Method & Disc</th>
                      <th className="py-3 px-4 text-right">Grand Total</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          No customer orders match current filters.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const isSelected = selectedOrder?.id === order.id;
                        return (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`hover:bg-[#E4F1DC]/40 cursor-pointer transition ${isSelected ? 'bg-[#E4F1DC]/70 font-medium' : ''
                              }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-[#22381E] flex items-center gap-1.5">
                                {order.orderNumber}
                                {order.pricingSnapshot && (
                                  <span className="p-0.5 bg-[#D2E7C4] text-[#22381E] rounded text-[9px]" title="Immutable Snapshot Verified">
                                    <Lock className="w-2.5 h-2.5" />
                                  </span>
                                )}
                                {(order as any).source === 'WhatsApp — Manually Entered' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    WhatsApp
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#22381E] font-bold truncate max-w-[200px]">
                                {order.customerLabName}
                              </div>
                              <div className="text-[10px] text-[#6B7F6A]">
                                {new Date(order.createdAt).toLocaleString()}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#22381E]">
                                {order.itemCount} items ({order.items.length} line items)
                              </div>
                              {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                                    4h Alerts: {(order as any).reminderCount || 0}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDispatchOrderReminder(order.id);
                                    }}
                                    title="Dispatch immediate 4-hour reminder alert to assigned staff & Super Admin"
                                    className="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer"
                                  >
                                    <Bell className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              {order.attachmentUrl && (
                                <div className="text-[10px] text-[#4B5A48] font-bold flex items-center gap-1 mt-0.5">
                                  <FileText className="w-2.5 h-2.5 text-[#82917C]" /> Attached PO Doc
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#22381E] text-[11px]">
                                {order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}
                              </div>
                              {order.pricingSnapshot?.isAdvanceDiscountApplied && (
                                <div className="text-[10px] text-[#22381E] font-bold flex items-center gap-1 mt-0.5">
                                  <Percent className="w-2.5 h-2.5 text-[#5F8F4D]" />
                                  {order.pricingSnapshot.advanceDiscountPercent}% Advance Discount Applied (-₹{order.pricingSnapshot.advanceDiscountAmount})
                                </div>
                              )}
                              <div className="text-[10px] text-[#6B7F6A]">
                                Payment: <span className="font-semibold text-[#22381E]">{order.paymentStatus}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="font-black text-sm text-[#22381E] font-mono">
                                ₹{(order.grandTotal ?? 0).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-[#6B7F6A]">
                                GST: ₹{(order.gstAmount ?? 0).toLocaleString('en-IN')}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.status === 'DELIVERED'
                                    ? 'bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/40'
                                    : order.status === 'DISPATCHED' || order.status === 'OUT_FOR_DELIVERY'
                                      ? 'bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40'
                                      : order.status === 'PROCESSING'
                                        ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40'
                                        : order.status === 'CANCELLED' || order.status === 'PAYMENT_FAILED'
                                          ? 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40'
                                          : 'bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40'
                                  }`}
                              >
                                {order.status?.replace(/_/g, ' ') || 'PENDING'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                                className="px-2.5 py-1 bg-[#F5F6F0] hover:bg-[#22381E] hover:text-[#F9FAF6] border border-[#D2E7C4] rounded-lg text-[11px] font-bold text-[#22381E] transition cursor-pointer"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Detail Pane: Immutable Snapshot & Audit Inspection */}
          {selectedOrder && (
            <div className="lg:col-span-5 bg-[#F9FAF6] rounded-2xl border border-[#D2E7C4] p-5 shadow-sm space-y-5 sticky top-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#D2E7C4] pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#5F8F4D] uppercase tracking-wider">
                    Authoritative Order Snapshot
                  </span>
                  <h3 className="text-lg font-black text-[#22381E] flex items-center gap-2">
                    {selectedOrder.orderNumber}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCreditAmount(0);
                      setCreditNoteNumber('');
                      setAmendmentJustification('');
                      setAmendmentError(null);
                      setAmendmentSuccess(null);
                      setAmendmentModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#4C8994] hover:bg-[#3B6E77] text-white rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Authorized Amendment</span>
                  </button>
                  <button
                    onClick={() => {
                      setNewStatus(selectedOrder.status);
                      setStatusModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#22381E] hover:bg-[#2E4B29] text-[#F9FAF6] rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 text-[#6B7F6A] hover:text-[#22381E] rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Immutable Snapshot Certificate Card */}
              <div className="p-3.5 bg-[#22381E] text-white rounded-xl space-y-2 font-mono text-[11px] border border-[#2E4B29]">
                <div className="flex items-center justify-between text-[#D2E7C4] border-b border-[#2E4B29] pb-1.5">
                  <span className="flex items-center gap-1 text-[#D2E7C4] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D2E7C4]" />
                    IMMUTABLE PRICING SNAPSHOT
                  </span>
                  <span>{selectedOrder.pricingSnapshot?.calculatedAt ? new Date(selectedOrder.pricingSnapshot.calculatedAt).toLocaleTimeString() : 'LOCKED'}</span>
                </div>
                <div className="text-[10px] text-slate-300 break-all">
                  <span className="text-slate-500">Hash: </span>
                  {selectedOrder.pricingSnapshot?.snapshotHash || '0x9a8f3b21c4e8d76a01b52e3c99f84a'}
                </div>
                <div className="text-[10px] text-slate-400">
                  <span className="text-slate-500">Engine: </span>
                  Server B2B Dynamic Contract Engine v4.0 (Zero Client Leakage)
                </div>
              </div>

              {/* Lab & Address */}
              <div className="p-3 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] space-y-1.5 text-xs">
                <div className="font-bold text-[#22381E] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#5F8F4D]" />
                  {selectedOrder.customerLabName}
                </div>
                <div className="text-[#415439] text-[11px]">
                  <strong>Delivery To:</strong> {selectedOrder.deliveryAddress ? `${selectedOrder.deliveryAddress.contactPerson} (${selectedOrder.deliveryAddress.phoneNumber}), ${selectedOrder.deliveryAddress.addressLine1}, ${selectedOrder.deliveryAddress.city} - ${selectedOrder.deliveryAddress.postalCode}` : selectedOrder.shippingAddress}
                </div>
                {selectedOrder.orderNotes && (
                  <div className="p-2 bg-[#F4DFA3]/40 rounded-lg text-[#6B4B12] text-[11px] border border-[#C58A16]/30 mt-2">
                    <strong>Customer Notes:</strong> {selectedOrder.orderNotes}
                  </div>
                )}
                {selectedOrder.attachmentUrl && (
                  <div className="p-2 bg-[#E4E8DF] rounded-lg text-[#4B5A48] text-[11px] border border-[#82917C]/30 mt-2 flex items-center justify-between">
                    <div>
                      <strong>Attached PO Slip:</strong> {selectedOrder.attachmentFileName || 'purchase_order.pdf'}
                    </div>
                    <a
                      href={selectedOrder.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 bg-[#22381E] hover:bg-[#2E4B29] text-[#F9FAF6] rounded text-[10px] font-bold"
                    >
                      View
                    </a>
                  </div>
                )}
              </div>

              {/* Line Items Breakdown with Authoritative Product Name Resolution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#22381E] uppercase tracking-wider">
                    Ordered Line Items ({selectedOrder.items.length})
                  </div>
                  <div className="text-[10px] text-[#5F8F4D] font-mono font-bold">
                    Master Catalogue Verified
                  </div>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item, idx) => {
                    const matchedProduct = catalogProducts.find(
                      p => p.id === item.productId || p.sku === item.productSku || p.sku === (item as any).sku
                    );
                    const resolvedName = matchedProduct?.name || item.productName || item.productSku || `Product #${idx + 1}`;
                    const isUnknown = !matchedProduct && (!item.productName || item.productName.startsWith('prod-') || item.productName.toLowerCase().includes('unknown'));
                    const uom = matchedProduct?.unit || item.packSize || 'Units';
                    const activeBatches = matchedProduct?.batches || [];
                    const totalAvailableStock = activeBatches.reduce((acc: number, b: any) => acc + (b.availableStock || 0), 0);
                    const primaryBatch = activeBatches[0];
                    const gstRate = matchedProduct?.gstRate || 12;
                    const lineTotal = item.totalPrice ?? (item.quantity * item.unitPrice);
                    const estimatedGst = Math.round((lineTotal * (gstRate / (100 + gstRate))) * 100) / 100;

                    return (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-[#D2E7C4] text-xs space-y-2 shadow-2xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            {isUnknown ? (
                              <div className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700 text-[11px] font-bold flex items-center gap-1.5 mb-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                                <span>Unverified / Unknown Product Reference: [{item.productSku || item.productId || 'UNKNOWN'}]</span>
                              </div>
                            ) : null}

                            <div className="font-extrabold text-[#22381E] text-xs leading-snug">
                              {resolvedName}
                            </div>
                            <div className="text-[10px] text-[#6B7F6A] font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>SKU: <strong className="text-slate-800">{item.productSku || matchedProduct?.sku || 'N/A'}</strong></span>
                              <span>&bull;</span>
                              <span>UOM: <strong className="text-slate-800">{uom}</strong></span>
                              {matchedProduct?.hsn && (
                                <>
                                  <span>&bull;</span>
                                  <span>HSN: <strong className="text-slate-800">{matchedProduct.hsn}</strong></span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-black text-[#22381E] font-mono text-sm">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-[#415439] font-mono">
                              {item.quantity} {uom} &times; ₹{item.unitPrice}
                            </div>
                          </div>
                        </div>

                        {/* Batch, Expiry, Tax & Stock Validation Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#E4E8DF] text-[10px]">
                          {/* Batch & Expiry Tag */}
                          {primaryBatch ? (
                            <span className="bg-[#E4E8DF] text-[#22381E] px-2 py-0.5 rounded font-mono font-medium border border-[#D2E7C4]">
                              Batch: <strong>{primaryBatch.batchNumber}</strong> (Exp: {primaryBatch.expiryDate})
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              Batch: Standard Distributor Lot
                            </span>
                          )}

                          {/* Tax Exclusive Badge */}
                          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-200">
                            Tax-Exclusive &bull; GST @ {gstRate}% (₹{estimatedGst})
                          </span>

                          {/* Live Available Stock Validation Badge */}
                          {matchedProduct ? (
                            totalAvailableStock >= item.quantity ? (
                              <span className="bg-[#D2E7C4] text-[#22381E] px-2 py-0.5 rounded font-bold font-mono border border-[#5F8F4D]/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#5F8F4D]" />
                                In Stock ({totalAvailableStock} {uom} available)
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold font-mono border border-amber-300 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-700" />
                                Stock Alert (Only {totalAvailableStock} in stock vs {item.quantity} ordered)
                              </span>
                            )
                          ) : null}

                          {/* Cold Chain Tag */}
                          {item.isColdChain && (
                            <span className="text-[#245B63] bg-[#C9DDE0] px-2 py-0.5 rounded font-bold flex items-center gap-1 border border-[#4C8994]/30">
                              <ThermometerSnowflake className="w-3 h-3 text-[#4C8994]" /> 2-8°C Cold Chain Required
                            </span>
                          )}
                        </div>

                        {item.itemNotes && (
                          <div className="text-[10px] text-[#6B7F6A] italic bg-slate-50 p-1.5 rounded border border-slate-100">
                            Note: "{item.itemNotes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cold Chain IoT Live Telemetry */}
              {selectedOrder.coldChainMonitoring?.required && (
                <div className="p-3 bg-[#C9DDE0]/40 border border-[#4C8994]/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#245B63] font-bold">
                    <span className="flex items-center gap-1.5">
                      <ThermometerSnowflake className="w-4 h-4 text-[#4C8994] animate-pulse" />
                      IoT Cold-Chain Telemetry ({selectedOrder.coldChainMonitoring.sensorId})
                    </span>
                    <span className="text-[10px] bg-[#C9DDE0] text-[#245B63] px-2 py-0.5 rounded font-mono border border-[#4C8994]/30">
                      {selectedOrder.coldChainMonitoring.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-[#C9DDE0]">
                      <div className="text-[#6B7F6A] text-[10px]">Current Temp</div>
                      <div className="font-black text-[#245B63] text-sm">{selectedOrder.coldChainMonitoring.currentTemp}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-[#C9DDE0]">
                      <div className="text-[#6B7F6A] text-[10px]">Safe Envelope</div>
                      <div className="font-bold text-[#22381E]">{selectedOrder.coldChainMonitoring.targetTemp}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className="p-3.5 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#415439]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono">₹{(selectedOrder.subtotal ?? 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#415439]">
                  <span>Applicable GST (18%):</span>
                  <span className="font-mono">₹{(selectedOrder.gstAmount ?? 0).toLocaleString('en-IN')}</span>
                </div>
                {(selectedOrder.coldChainFee ?? 0) > 0 && (
                  <div className="flex justify-between text-[#245B63]">
                    <span>IoT Cold-Chain Bio-Packaging:</span>
                    <span className="font-mono">+₹{(selectedOrder.coldChainFee ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedOrder.pricingSnapshot?.isAdvanceDiscountApplied && (
                  <div className="flex justify-between text-[#22381E] font-bold">
                    <span>Advance Payment Discount ({selectedOrder.pricingSnapshot.advanceDiscountPercent}%):</span>
                    <span className="font-mono">-₹{(selectedOrder.pricingSnapshot.advanceDiscountAmount ?? 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#D2E7C4] flex justify-between text-sm font-black text-[#22381E]">
                  <span>Final Grand Total:</span>
                  <span className="font-mono text-[#22381E]">₹{(selectedOrder.grandTotal ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PAYMENT GATEWAY VERIFICATIONS AUDIT TAB */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-[#F5F6F0] p-4 rounded-xl border border-[#D2E7C4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-[#22381E]">
                Cryptographic Payment Transactions & Server-Side HMAC Authorizations
              </h3>
              <p className="text-xs text-[#415439] mt-0.5">
                Every online payment is validated strictly server-side using Razorpay HMAC-SHA256 signature verification. No client payment assertion is trusted.
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-[#D2E7C4] hover:bg-[#C3E2B8] text-[#22381E] border border-[#C3E2B8] rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#D2E7C4] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#22381E]">
                <thead className="bg-[#F5F6F0] border-b border-[#D2E7C4] text-[#415439] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Order Number & Lab</th>
                    <th className="py-3 px-4">Method & Gateway</th>
                    <th className="py-3 px-4">Gateway Payment ID</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Verification Status</th>
                    <th className="py-3 px-4 text-right">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4F1DC]">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#6B7F6A]">
                        No payment transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-[#E4F1DC]/30">
                        <td className="py-3 px-4 font-mono font-bold text-[#22381E]">
                          {txn.transactionReference}
                          <div className="text-[10px] text-[#6B7F6A] font-normal">
                            {new Date(txn.createdAt).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-extrabold text-[#22381E]">{txn.orderNumber}</div>
                          <div className="text-[11px] text-[#415439]">{txn.customerLabName}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-[#22381E]">{txn.paymentMethod}</span>
                          <div className="text-[10px] text-[#6B7F6A] font-mono">{txn.gatewayProvider}</div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-[#415439]">
                          {txn.gatewayPaymentId || <span className="text-[#82917C] italic">Pending Callback</span>}
                        </td>

                        <td className="py-3 px-4 text-right font-black font-mono text-[#22381E]">
                          ₹{(txn.amount ?? 0).toLocaleString('en-IN')}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${txn.verificationStatus === 'VERIFIED_SUCCESS'
                                ? 'bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/40'
                                : txn.verificationStatus === 'VERIFICATION_FAILED'
                                  ? 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40'
                                  : 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40'
                              }`}
                          >
                            {txn.verificationStatus === 'VERIFIED_SUCCESS' ? <CheckCircle2 className="w-3 h-3 text-[#5F8F4D]" /> : <Clock className="w-3 h-3" />}
                            {txn.verificationStatus?.replace(/_/g, ' ') || 'PENDING'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right text-[11px] font-mono text-[#6B7F6A]">
                          {txn.verifiedBy || 'Awaiting'}
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

      {/* 3. PAYMENT & ADVANCE DISCOUNT RULES CONFIGURATION */}
      {activeTab === 'payment_rules' && paymentRules && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-[#F5F6F0] rounded-2xl border border-[#D2E7C4] p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-[#22381E] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#5F8F4D]" />
                Configurable Payment & Advance Discount Rules
              </h3>
              <p className="text-xs text-[#415439] mt-1">
                All discount percentages and eligibility policies are executed on the backend. Changing these values immediately governs future order calculations.
              </p>
            </div>

            {/* Advance Payment Discount Section */}
            <div className="p-4 bg-[#D2E7C4]/40 border border-[#D2E7C4] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#22381E] flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#5F8F4D]" />
                    Advance Payment Discount Rule
                  </h4>
                  <p className="text-[11px] text-[#415439] mt-0.5">
                    Laboratories that pay in advance via NetBanking, UPI, or Instant Gateway receive this instant discount on their order total.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advanceDiscountEnabled}
                    onChange={(e) => setAdvanceDiscountEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#E4E8DF] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22381E]"></div>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-32">
                  <label className="block text-[11px] font-bold text-[#22381E] mb-1">Discount Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="15"
                      value={advanceDiscountInput}
                      onChange={(e) => setAdvanceDiscountInput(Number(e.target.value))}
                      className="w-full text-sm font-bold bg-white border border-[#D2E7C4] rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#22381E]"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-[#6B7F6A]">%</span>
                  </div>
                </div>

                <div className="flex-1 text-[11px] text-[#415439] pt-5">
                  Initial requirement: <strong>2%</strong> discount. E.g. A ₹1,00,000 order gets an automatic ₹2,000 deduction on checkout.
                </div>
              </div>
            </div>

            {/* Cash on Delivery (COD) Rules */}
            <div className="p-4 bg-white border border-[#D2E7C4] rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#22381E] flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#5F8F4D]" />
                    Cash on Delivery (COD) Eligibility Boundary
                  </h4>
                  <p className="text-[11px] text-[#415439] mt-0.5">
                    Prevents risk of high-value or cold-chain spoilage by gating COD eligibility.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#E4E8DF] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#22381E]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Order Value for COD (₹)</label>
                  <input
                    type="number"
                    step="5000"
                    value={codMaxLimitInput}
                    onChange={(e) => setCodMaxLimitInput(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Orders above this amount must pay via Advance or Credit Line.</span>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={codAllowColdChain}
                      onChange={(e) => setCodAllowColdChain(e.target.checked)}
                      className="rounded text-[#22381E] focus:ring-[#22381E] w-4 h-4"
                    />
                    Allow COD on Cold-Chain Reagents (2-8°C)
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {codAllowColdChain ? 'Enabled (Higher spoilage risk if rejected)' : 'Restricted (Recommended: Cold-chain requires prepaid/credit)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-[#D2E7C4]">
              {rulesSaveSuccess ? (
                <div className="text-xs font-bold text-[#22381E] bg-[#D2E7C4] px-3 py-1.5 rounded-lg border border-[#5F8F4D]/40 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#5F8F4D]" /> Payment rules updated successfully!
                </div>
              ) : <div />}

              <button
                onClick={handleSavePaymentRules}
                className="px-6 py-2.5 bg-[#22381E] hover:bg-[#2E4B29] text-[#D2E7C4] rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#D2E7C4]" /> Save & Deploy Payment Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS TRANSITION MODAL */}
      {statusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Update Status for #{selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {newStatus === 'CANCELLED' && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Super Admin Cancellation Governance</span>
                  </div>
                  <p>Order cancellation requires Super Admin authorization. Please enter an exhaustive explanation below.</p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mandatory Audit Comment / Dispatch Note</label>
                <textarea
                  rows={3}
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder={newStatus === 'CANCELLED' ? "Enter mandatory cancellation reason (min 5 chars)..." : "e.g. Handed over to BlueDart Bio-Express Courier AWB #88921102"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                disabled={isUpdatingStatus}
                onClick={handleUpdateStatus}
                className="px-4 py-2 bg-[#22381E] hover:bg-[#2E4B29] text-[#F9FAF6] rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingStatus ? 'Updating...' : 'Commit Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authorized Order Amendment & Credit Note Modal */}
      {amendmentModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#4C8994]" />
                <h3 className="font-extrabold text-[#22381E] text-base">
                  Authorized Order Amendment & Credit Note
                </h3>
              </div>
              <button
                onClick={() => setAmendmentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Dual-Control Financial Governance Policy</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Confirmed and posted orders cannot be silently mutated. Financial amendments require a formal justification, dual-control Maker-Checker verification, and issue a traceable Credit Note.
              </p>
            </div>

            {amendmentSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{amendmentSuccess}</span>
              </div>
            )}

            {amendmentError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{amendmentError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Order</label>
                <div className="font-mono font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {selectedOrder.orderNumber} &bull; Subtotal: ₹{(selectedOrder.subtotal || 0).toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Note Number (Optional, auto-generated if blank)</label>
                <input
                  type="text"
                  placeholder="e.g. CN-2026-8812"
                  value={creditNoteNumber}
                  onChange={(e) => setCreditNoteNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800 focus:outline-none focus:border-[#4C8994]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Amount (₹) to Deduct/Amend</label>
                <input
                  type="number"
                  min="0"
                  max={selectedOrder.subtotal || 0}
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-xs text-slate-800 focus:outline-none focus:border-[#4C8994]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mandatory Authorized Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={amendmentJustification}
                  onChange={(e) => setAmendmentJustification(e.target.value)}
                  placeholder="State the approved reason for financial correction (e.g. Rate revised as per authorized contract amendment)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-[#4C8994]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAmendmentModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSubmittingAmendment}
                onClick={handleProcessAmendment}
                className="px-5 py-2 bg-[#4C8994] hover:bg-[#3B6E77] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
              >
                {isSubmittingAmendment ? 'Processing...' : 'Authorize & Issue Credit Note'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MANUAL WHATSAPP ORDER ENTRY MODAL (Part 13) */}
      {isManualWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-emerald-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Manual WhatsApp Order Entry
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Source: <span className="font-bold text-emerald-700">WhatsApp — Manually Entered</span> (Part 13)
                  </p>
                </div>
              </div>
              <button onClick={() => setIsManualWhatsAppModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {manualOrderErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{manualOrderErrorMsg}</span>
              </div>
            )}
            {manualOrderSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{manualOrderSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Laboratory Name</label>
                <input
                  type="text"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Customer Phone Number</label>
                <input
                  type="text"
                  value={manualCustomerPhone}
                  onChange={(e) => setManualCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-700">Delivery / Shipping Address</label>
                <input
                  type="text"
                  value={manualShippingAddress}
                  onChange={(e) => setManualShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">WhatsApp Message Ref / Thread ID</label>
                <input
                  type="text"
                  value={manualWhatsappRef}
                  onChange={(e) => setManualWhatsappRef(e.target.value)}
                  placeholder="e.g. WA-CHAT-9928"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Order Notes / Communication Summary</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Urgent Saturday delivery requested"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Product Items Table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
                  Order Line Items
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setManualItems([
                      ...manualItems,
                      { productName: 'Hematology Lyse Reagent 500 mL', packSize: '500 mL', price: 4200, quantity: 1, gstRate: 18 }
                    ])
                  }
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Item</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {manualItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => {
                          const updated = [...manualItems];
                          updated[idx].productName = e.target.value;
                          setManualItems(updated);
                        }}
                        placeholder="Product Name"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...manualItems];
                          updated[idx].quantity = Math.max(1, Number(e.target.value));
                          setManualItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => {
                          const updated = [...manualItems];
                          updated[idx].price = Number(e.target.value);
                          setManualItems(updated);
                        }}
                        placeholder="Price"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-mono"
                      />
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-slate-800">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                    <div className="col-span-1 text-center">
                      {manualItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invariant Safeguard */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-0.5">
              <span className="font-bold">WhatsApp Governance Rule:</span>
              <p>WhatsApp conversations do NOT automatically create orders. This entry is explicitly logged under your authorized staff account with a 4-hour pending reminder schedule.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsManualWhatsAppModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingManualOrder}
                onClick={handleCreateManualWhatsAppOrder}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingManualOrder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                <span>Book Manual WhatsApp Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
