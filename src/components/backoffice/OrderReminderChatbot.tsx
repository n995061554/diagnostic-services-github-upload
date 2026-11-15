import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Sparkles,
  ShieldCheck,
  Building2,
  ShoppingCart,
  UserCheck,
  Calendar,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';

export interface OrderReminderItem {
  id: string;
  orderNumber: string;
  customerId: string;
  customerLabName: string;
  orderDate: string;
  status: string;
  grandTotal: number;
  itemCount: number;
  assignedStaffName: string;
  elapsedHours: number;
  elapsedFormatted: string;
  reminderIntervalHours: number;
  reminderCount: number;
  nextReminderInHours: number;
  nextReminderAt: string;
  isOverdue: boolean; // elapsedHours >= 4
  statusCategory: 'WAITING_FOR_PROCESSING' | 'BEING_PROCESSED' | 'COMPLETED' | 'CANCELLED';
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedByName?: string;
  acknowledgmentNote?: string;
  progressNotes?: Array<{ timestamp: string; note: string; author: string }>;
  isEscalated?: boolean;
  escalationReason?: string;
  escalatedAt?: string;
}

export interface ReminderHistoryEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  customerLabName: string;
  action: 'REMINDER_TRIGGERED' | 'ACKNOWLEDGED' | 'STATUS_CHANGE';
  timestamp: string;
  performedBy: string;
  note?: string;
}

interface OrderReminderChatbotProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
  onOpenOrder?: (orderId: string) => void;
  isFloating?: boolean;
}

export const OrderReminderChatbot: React.FC<OrderReminderChatbotProps> = ({
  currentUser,
  currentRole,
  token,
  onNavigateTab,
  onOpenOrder,
  isFloating = false,
}) => {
  const [isOpen, setIsOpen] = useState(!isFloating);
  const [activeTab, setActiveTab] = useState<'REMINDERS' | 'SUMMARY' | 'HISTORY' | 'CHAT'>('REMINDERS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'PROCESSING' | 'OVERDUE' | 'ACKNOWLEDGED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Acknowledgment Modal
  const [acknowledgingOrder, setAcknowledgingOrder] = useState<OrderReminderItem | null>(null);
  const [acknowledgmentNote, setAcknowledgmentNote] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);

  // Progress Note Modal
  const [notingOrder, setNotingOrder] = useState<OrderReminderItem | null>(null);
  const [progressNoteText, setProgressNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Escalation Modal
  const [escalatingOrder, setEscalatingOrder] = useState<OrderReminderItem | null>(null);
  const [escalationReasonText, setEscalationReasonText] = useState('Critical operational delay exceeding 4h SLA threshold');
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);

  // Chat/Query Assistant State
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
    orderCards?: OrderReminderItem[];
    actionSuggestions?: string[];
  }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your Back Office Order Reminder Assistant. Every 4 hours, orders waiting for processing or currently in process generate automated operational reminders. You can ask me about pending, waiting or overdue orders.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionSuggestions: ['Show Overdue Orders', 'Waiting for Processing', 'Orders in Processing', 'Daily Summary', 'Reminder Policy']
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reminders List & History State
  const [orders, setOrders] = useState<OrderReminderItem[]>([]);
  const [reminderHistory, setReminderHistory] = useState<ReminderHistoryEntry[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Live Reminders from Server
  const fetchReminders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/backoffice/order-reminders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data || {};
        if (data.orders) setOrders(data.orders);
        if (data.history) setReminderHistory(data.history);
      } else {
        // Fallback calculation from admin orders if custom endpoint is not yet mounted
        const ordRes = await fetch('/api/v1/admin/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (ordRes.ok) {
          const ordJson = await ordRes.json();
          const list: any[] = ordJson.data || [];
          const now = Date.now();

          const mapped: OrderReminderItem[] = list
            .filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
            .map((o: any) => {
              const createdTime = new Date(o.createdAt || now).getTime();
              const elapsedMs = Math.max(0, now - createdTime);
              const elapsedHours = +(elapsedMs / 3600000).toFixed(1);
              const isWaiting = ['PENDING', 'NEW', 'PLACED', 'PENDING_APPROVAL'].includes(o.status);
              const isProcessing = ['PROCESSING', 'CONFIRMED', 'PACKED', 'DISPATCHED'].includes(o.status);
              const isOverdue = elapsedHours >= 4;
              const reminderCount = Math.max(1, Math.floor(elapsedHours / 4) + 1);
              const nextReminderIn = +(4 - (elapsedHours % 4)).toFixed(1);
              const nextReminderDate = new Date(now + nextReminderIn * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return {
                id: o.id,
                orderNumber: o.orderNumber,
                customerId: o.customerId,
                customerLabName: o.customerLabName || 'Diagnostic Partner Lab',
                orderDate: o.createdAt,
                status: o.status,
                grandTotal: Number(o.grandTotal || o.totalAmount) || 0,
                itemCount: o.items ? o.items.length : 1,
                assignedStaffName: o.salesRepName || (o.assignedStaffId ? 'Field Staff' : 'Back Office Dispatch Queue'),
                elapsedHours,
                elapsedFormatted: elapsedHours >= 24 ? `${Math.floor(elapsedHours / 24)}d ${Math.floor(elapsedHours % 24)}h` : `${elapsedHours} hrs`,
                reminderIntervalHours: 4,
                reminderCount,
                nextReminderInHours: nextReminderIn,
                nextReminderAt: nextReminderDate,
                isOverdue,
                statusCategory: isWaiting ? 'WAITING_FOR_PROCESSING' : 'BEING_PROCESSED',
                acknowledged: false
              };
            });
          setOrders(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching order reminders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    // 4-hour client reminder refresh interval (polling every 2 minutes for freshness)
    const interval = setInterval(fetchReminders, 120000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Operational Filter Calculations
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerLabName.toLowerCase().includes(q) ||
        o.assignedStaffName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'WAITING') return o.statusCategory === 'WAITING_FOR_PROCESSING';
      if (statusFilter === 'PROCESSING') return o.statusCategory === 'BEING_PROCESSED';
      if (statusFilter === 'OVERDUE') return o.isOverdue;
      if (statusFilter === 'ACKNOWLEDGED') return o.acknowledged;
      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // Operational Counts
  const counts = useMemo(() => {
    const totalPending = orders.length;
    const waiting = orders.filter(o => o.statusCategory === 'WAITING_FOR_PROCESSING').length;
    const processing = orders.filter(o => o.statusCategory === 'BEING_PROCESSED').length;
    const overdue = orders.filter(o => o.isOverdue).length;
    const acknowledged = orders.filter(o => o.acknowledged).length;

    return { totalPending, waiting, processing, overdue, acknowledged };
  }, [orders]);

  // Acknowledge Reminder Action (Strict requirement: Does NOT alter order status or resolve order)
  const handleAcknowledgeReminder = async () => {
    if (!acknowledgingOrder) return;
    setIsSubmittingAck(true);

    try {
      const payload = {
        orderId: acknowledgingOrder.id,
        orderNumber: acknowledgingOrder.orderNumber,
        note: acknowledgmentNote.trim() || 'Reminder acknowledged by back office staff.'
      };

      await fetch('/api/v1/backoffice/order-reminders/acknowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      }).catch(() => null);

      // Local optimistic update
      const nowStr = new Date().toISOString();
      const staffName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email : 'Back Office Specialist';

      setOrders(prev =>
        prev.map(o =>
          o.id === acknowledgingOrder.id
            ? {
                ...o,
                acknowledged: true,
                acknowledgedAt: nowStr,
                acknowledgedByName: staffName,
                acknowledgmentNote: payload.note
              }
            : o
        )
      );

      // Append to local history
      setReminderHistory(prev => [
        {
          id: `hist-${Date.now()}`,
          orderId: acknowledgingOrder.id,
          orderNumber: acknowledgingOrder.orderNumber,
          customerLabName: acknowledgingOrder.customerLabName,
          action: 'ACKNOWLEDGED',
          timestamp: nowStr,
          performedBy: staffName,
          note: payload.note
        },
        ...prev
      ]);

      showToast(`Reminder for #${acknowledgingOrder.orderNumber} acknowledged. Order remains in ${acknowledgingOrder.status} state.`);
      setAcknowledgingOrder(null);
      setAcknowledgmentNote('');
    } catch (err) {
      console.error('Failed to acknowledge reminder', err);
      showToast('Error recording acknowledgment.');
    } finally {
      setIsSubmittingAck(false);
    }
  };

  // Add Progress Note Handler (Requirement 15)
  const handleAddProgressNote = async () => {
    if (!notingOrder || !progressNoteText.trim()) return;
    setIsSubmittingNote(true);

    try {
      const payload = {
        orderId: notingOrder.id,
        orderNumber: notingOrder.orderNumber,
        note: progressNoteText.trim()
      };

      const res = await fetch('/api/v1/backoffice/order-reminders/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const staffName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email : 'Back Office Specialist';
        const nowIso = new Date().toISOString();

        setOrders(prev =>
          prev.map(o =>
            o.id === notingOrder.id
              ? {
                  ...o,
                  progressNotes: [
                    ...(o.progressNotes || []),
                    { timestamp: nowIso, note: payload.note, author: staffName }
                  ]
                }
              : o
          )
        );

        setReminderHistory(prev => [
          {
            id: `hist-${Date.now()}`,
            orderId: notingOrder.id,
            orderNumber: notingOrder.orderNumber,
            customerLabName: notingOrder.customerLabName,
            action: 'STATUS_CHANGE',
            timestamp: nowIso,
            performedBy: staffName,
            note: `Progress Note: ${payload.note}`
          },
          ...prev
        ]);

        showToast(`Progress note recorded for order #${notingOrder.orderNumber}.`);
        setNotingOrder(null);
        setProgressNoteText('');
      } else {
        showToast('Failed to record progress note.');
      }
    } catch (err) {
      showToast('Error saving progress note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Escalate Delayed Order Handler (Requirement 15)
  const handleEscalateOrder = async () => {
    if (!escalatingOrder) return;
    setIsSubmittingEscalation(true);

    try {
      const payload = {
        orderId: escalatingOrder.id,
        orderNumber: escalatingOrder.orderNumber,
        reason: escalationReasonText.trim() || 'Delayed beyond SLA'
      };

      const res = await fetch('/api/v1/backoffice/order-reminders/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const staffName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email : 'Back Office Specialist';
        const nowIso = new Date().toISOString();

        setOrders(prev =>
          prev.map(o =>
            o.id === escalatingOrder.id
              ? {
                  ...o,
                  isEscalated: true,
                  escalationReason: payload.reason,
                  escalatedAt: nowIso
                }
              : o
          )
        );

        setReminderHistory(prev => [
          {
            id: `hist-${Date.now()}`,
            orderId: escalatingOrder.id,
            orderNumber: escalatingOrder.orderNumber,
            customerLabName: escalatingOrder.customerLabName,
            action: 'STATUS_CHANGE',
            timestamp: nowIso,
            performedBy: staffName,
            note: `ESCALATED TO SUPER ADMIN: ${payload.reason}`
          },
          ...prev
        ]);

        showToast(`Order #${escalatingOrder.orderNumber} successfully escalated to Super Admin.`);
        setEscalatingOrder(null);
        setEscalationReasonText('Critical operational delay exceeding 4h SLA threshold');
      } else {
        showToast('Failed to escalate order.');
      }
    } catch (err) {
      showToast('Error escalating order.');
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  // Rule-Based Natural Language Query Handler
  const handleSendMessage = (messageText: string) => {
    const text = (messageText || userInput).trim();
    if (!text) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');

    // Process rule-based NLP matching
    setTimeout(() => {
      const lower = text.toLowerCase();
      let replyText = '';
      let matchedOrders: OrderReminderItem[] = [];
      let suggestions: string[] = ['Show Overdue Orders', 'Waiting for Processing', 'Orders in Processing', 'Daily Summary'];

      if (lower.includes('overdue')) {
        matchedOrders = orders.filter(o => o.isOverdue);
        replyText = matchedOrders.length > 0
          ? `Found ${matchedOrders.length} overdue order(s) pending beyond the 4-hour operational threshold. Review them below:`
          : 'Great news! There are currently no overdue orders pending past the 4-hour interval.';
      } else if (lower.includes('waiting') || lower.includes('unprocessed') || lower.includes('new')) {
        matchedOrders = orders.filter(o => o.statusCategory === 'WAITING_FOR_PROCESSING');
        replyText = `Found ${matchedOrders.length} order(s) waiting for initial warehouse picking and back office processing:`;
      } else if (lower.includes('processing') || lower.includes('packed') || lower.includes('dispatch')) {
        matchedOrders = orders.filter(o => o.statusCategory === 'BEING_PROCESSED');
        replyText = `Found ${matchedOrders.length} order(s) currently being processed or packed:`;
      } else if (lower.includes('summary') || lower.includes('daily') || lower.includes('report') || lower.includes('status')) {
        replyText = `📊 Daily Order Reminder Summary:\n• Total Active Orders Pending: ${counts.totalPending}\n• Waiting for Processing: ${counts.waiting}\n• Currently Being Processed: ${counts.processing}\n• Overdue (>4 Hours): ${counts.overdue}\n• Reminders Acknowledged: ${counts.acknowledged}\n\nNext automated cycle check in: 4 hours from last dispatch.`;
      } else if (lower.includes('policy') || lower.includes('rule') || lower.includes('interval') || lower.includes('hour')) {
        replyText = '📋 Diagnostic Services 4-Hour Reminder Policy:\n1. Orders placed generate reminders every 4 hours until packed or completed.\n2. Overdue threshold: Orders unresolved after 4 hours are highlighted in red.\n3. Acknowledging a reminder logs operational oversight but DOES NOT auto-resolve or cancel the order.\n4. Dual alert: Reminders are notified to the responsible staff member and Super Admin.';
      } else {
        // Customer Name Search
        const customerMatches = orders.filter(o =>
          o.customerLabName.toLowerCase().includes(lower) ||
          o.orderNumber.toLowerCase().includes(lower)
        );
        if (customerMatches.length > 0) {
          matchedOrders = customerMatches;
          replyText = `Found ${customerMatches.length} order(s) matching your inquiry:`;
        } else {
          replyText = `I analyzed your request. We currently have ${counts.totalPending} pending orders (${counts.waiting} waiting, ${counts.processing} processing, ${counts.overdue} overdue). Please select a query below or search by order number or laboratory name:`;
        }
      }

      const assistantMsg = {
        sender: 'assistant' as const,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderCards: matchedOrders.length > 0 ? matchedOrders : undefined,
        actionSuggestions: suggestions
      };

      setChatMessages(prev => [...prev, assistantMsg]);
    }, 400);
  };

  return (
    <div className={`font-sans text-slate-800 ${
      isFloating
        ? 'fixed bottom-5 right-5 z-40 max-w-lg w-[95vw] shadow-2xl'
        : 'w-full'
    }`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0E1035] text-white rounded-xl shadow-xl border border-white/20 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-[#0E1035] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 relative shadow-inner">
              <Bell className="w-5 h-5" />
              {counts.overdue > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                  {counts.overdue}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-tight">Order Reminder Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  4h Interval
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {counts.totalPending} pending • {counts.waiting} waiting • {counts.overdue} overdue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReminders}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
              title="Refresh Reminders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            {isFloating && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {isOpen && (
          <div className="flex flex-col">
            {/* Sub-Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 bg-slate-50/70 text-xs font-bold">
              <div className="flex items-center gap-1 py-1.5">
                <button
                  onClick={() => setActiveTab('REMINDERS')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'REMINDERS'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Active Reminders ({counts.totalPending})</span>
                </button>

                <button
                  onClick={() => setActiveTab('CHAT')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'CHAT'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                  <span>Assistant Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab('SUMMARY')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'SUMMARY'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Daily Summary</span>
                </button>

                <button
                  onClick={() => setActiveTab('HISTORY')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'HISTORY'
                      ? 'bg-white text-slate-900 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Log ({reminderHistory.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: ACTIVE REMINDERS LIST */}
            {activeTab === 'REMINDERS' && (
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {/* Search & Filter Chips */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search order # or lab name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
                    {[
                      { key: 'ALL', label: `All (${counts.totalPending})` },
                      { key: 'WAITING', label: `Waiting (${counts.waiting})` },
                      { key: 'PROCESSING', label: `Processing (${counts.processing})` },
                      { key: 'OVERDUE', label: `Overdue (${counts.overdue})`, alert: counts.overdue > 0 },
                      { key: 'ACKNOWLEDGED', label: `Ack'd (${counts.acknowledged})` },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key as any)}
                        className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                          statusFilter === f.key
                            ? 'bg-[#0E1035] text-white font-bold'
                            : f.alert
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No orders matching this filter.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredOrders.map(order => (
                      <div
                        key={order.id}
                        className={`border rounded-xl p-3 transition space-y-2.5 ${
                          order.isOverdue
                            ? 'bg-rose-50/40 border-rose-200'
                            : order.acknowledged
                            ? 'bg-slate-50/60 border-slate-200 opacity-90'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900">
                                #{order.orderNumber}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                order.statusCategory === 'WAITING_FOR_PROCESSING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}>
                                {order.status}
                              </span>
                              {order.isOverdue && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-rose-600 text-white animate-pulse">
                                  OVERDUE &gt; 4H
                                </span>
                              )}
                              {order.isEscalated && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-700 text-white flex items-center gap-1 shadow-2xs">
                                  <AlertTriangle className="w-3 h-3 text-amber-300" />
                                  ESCALATED TO SUPER ADMIN
                                </span>
                              )}
                              {order.acknowledged && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Ack'd
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{order.customerLabName}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-mono text-xs font-black text-slate-900">
                              {formatINR(order.grandTotal)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {order.itemCount} items
                            </div>
                          </div>
                        </div>

                        {/* Timing & Reminder Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Elapsed Time</span>
                            <span className={`font-mono font-bold ${order.isOverdue ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                              {order.elapsedFormatted}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Reminders Sent</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {order.reminderCount} (every 4h)
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Next Reminder</span>
                            <span className="font-mono font-semibold text-sky-700">
                              In {order.nextReminderInHours}h ({order.nextReminderAt})
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">Assigned Queue</span>
                            <span className="text-slate-700 font-medium truncate block">
                              {order.assignedStaffName}
                            </span>
                          </div>
                        </div>

                        {/* Progress Notes if present */}
                        {order.progressNotes && order.progressNotes.length > 0 && (
                          <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-800 space-y-1">
                            <span className="font-bold text-slate-600 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-slate-500" />
                              Latest Progress Note ({order.progressNotes[order.progressNotes.length - 1].author}):
                            </span>
                            <p className="text-slate-700 italic font-medium pl-3 border-l-2 border-slate-300">
                              "{order.progressNotes[order.progressNotes.length - 1].note}"
                            </p>
                          </div>
                        )}

                        {/* Acknowledgment metadata if present */}
                        {order.acknowledged && (
                          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-2 text-[10px] text-emerald-900 flex items-center justify-between">
                            <span>
                              Acknowledged by <strong>{order.acknowledgedByName}</strong> {order.acknowledgmentNote ? `("${order.acknowledgmentNote}")` : ''}
                            </span>
                            <span className="text-emerald-700 font-mono">
                              {new Date(order.acknowledgedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                          <button
                            onClick={() => {
                              if (onOpenOrder) onOpenOrder(order.id);
                              else if (onNavigateTab) onNavigateTab('orders_management');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            <span>View Order</span>
                          </button>

                          {/* Add Note Button (Req 15) */}
                          <button
                            onClick={() => {
                              setNotingOrder(order);
                              setProgressNoteText('');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-sky-600" />
                            <span>Add Note</span>
                          </button>

                          {/* Escalate Button (Req 15) */}
                          {!order.isEscalated ? (
                            <button
                              onClick={() => {
                                setEscalatingOrder(order);
                                setEscalationReasonText('Critical operational delay exceeding 4h SLA threshold');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3 text-purple-600" />
                              <span>Escalate</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-purple-600" />
                              <span>Escalated</span>
                            </span>
                          )}

                          {!order.acknowledged ? (
                            <button
                              onClick={() => setAcknowledgingOrder(order)}
                              className="px-2.5 py-1 rounded-lg bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Acknowledge Reminder</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Acknowledged</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ASSISTANT CHAT (Rule-Based NLP) */}
            {activeTab === 'CHAT' && (
              <div className="flex flex-col h-[460px]">
                {/* Chat Scroll Area */}
                <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#0E1035] text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs'
                      }`}>
                        <p className="whitespace-pre-line">{msg.text}</p>

                        {/* Embedded Order Cards in Assistant Reply */}
                        {msg.orderCards && msg.orderCards.length > 0 && (
                          <div className="mt-2.5 space-y-2 border-t border-slate-100 pt-2">
                            {msg.orderCards.slice(0, 4).map(card => (
                              <div key={card.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] flex items-center justify-between">
                                <div>
                                  <span className="font-mono font-bold text-slate-900">#{card.orderNumber}</span>
                                  <span className="text-slate-500 ml-1">({card.customerLabName})</span>
                                  <div className="text-[10px] text-rose-600 font-bold">Elapsed: {card.elapsedFormatted}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (onOpenOrder) onOpenOrder(card.id);
                                    else if (onNavigateTab) onNavigateTab('orders_management');
                                  }}
                                  className="px-2 py-0.5 rounded bg-[#0E1035] text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Open
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                </div>

                {/* Suggestion Chips */}
                <div className="p-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold text-slate-600">
                  {['Show Overdue Orders', 'Waiting for Processing', 'Orders in Processing', 'Apex Lab Orders', 'Daily Summary', 'Reminder Policy'].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s)}
                      className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-slate-400 hover:text-slate-900 transition whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Chat Input Field */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask about pending, waiting or overdue orders..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage(userInput)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                  <button
                    onClick={() => handleSendMessage(userInput)}
                    className="p-2 rounded-xl bg-[#0E1035] hover:bg-[#15253F] text-white transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4 text-sky-400" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DAILY SUMMARY */}
            {activeTab === 'SUMMARY' && (
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Daily Order Follow-up Status
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold block">Total Pending Orders</span>
                      <span className="text-xl font-black text-slate-900 font-mono">{counts.totalPending}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-rose-200 bg-rose-50/30 shadow-2xs">
                      <span className="text-[10px] text-rose-500 font-bold block">Overdue Beyond 4 Hours</span>
                      <span className="text-xl font-black text-rose-700 font-mono">{counts.overdue}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                      <span className="text-[10px] text-amber-600 font-bold block">Waiting for Processing</span>
                      <span className="text-xl font-black text-amber-700 font-mono">{counts.waiting}</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-sky-200 shadow-2xs">
                      <span className="text-[10px] text-sky-600 font-bold block">Currently Being Processed</span>
                      <span className="text-xl font-black text-sky-700 font-mono">{counts.processing}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2 text-xs">
                  <h5 className="font-bold text-slate-900">Automated Reminder Protocol</h5>
                  <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                    <li>Fixed 4-hour cycle timer calculated from order generation timestamp.</li>
                    <li>Dual escalation delivers alerts to the assigned employee and Super Admin.</li>
                    <li>Acknowledging a reminder logs operational follow-up without mutating order status.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: REMINDER HISTORY LOG */}
            {activeTab === 'HISTORY' && (
              <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
                {reminderHistory.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No reminder events logged yet today.
                  </div>
                ) : (
                  reminderHistory.map(entry => (
                    <div key={entry.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">#{entry.orderNumber}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-semibold">{entry.customerLabName}</p>
                      <div className="text-[10px] text-slate-500">
                        Action: <strong>{entry.action}</strong> by {entry.performedBy}
                        {entry.note && <span className="italic block text-slate-600 mt-0.5">"{entry.note}"</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acknowledgment Modal */}
      {acknowledgingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
            <div className="bg-[#0E1035] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Acknowledge Order Reminder</h3>
              </div>
              <button
                onClick={() => setAcknowledgingOrder(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900">#{acknowledgingOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Laboratory:</span>
                  <span className="font-bold text-slate-900">{acknowledgingOrder.customerLabName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Elapsed:</span>
                  <span className="font-mono text-rose-600 font-bold">{acknowledgingOrder.elapsedFormatted}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Follow-Up Action Note
                </label>
                <textarea
                  rows={3}
                  value={acknowledgmentNote}
                  onChange={e => setAcknowledgmentNote(e.target.value)}
                  placeholder="e.g. Contacted warehouse packing lead; batch being staged for afternoon dispatch..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Safeguard:</strong> Acknowledging this reminder records that Back Office is actively tracking this order. It will <strong>NOT</strong> mark the order as resolved or delivered.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setAcknowledgingOrder(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledgeReminder}
                disabled={isSubmittingAck}
                className="px-4 py-1.5 rounded-xl bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingAck ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Confirm Acknowledgment</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Progress Note Modal (Req 15) */}
      {notingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
            <div className="bg-[#0E1035] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white">Add Operational Progress Note</h3>
              </div>
              <button
                onClick={() => setNotingOrder(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900">#{notingOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Laboratory:</span>
                  <span className="font-bold text-slate-900">{notingOrder.customerLabName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Elapsed:</span>
                  <span className="font-mono text-rose-600 font-bold">{notingOrder.elapsedFormatted}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Progress / Action Note
                </label>
                <textarea
                  rows={3}
                  value={progressNoteText}
                  onChange={e => setProgressNoteText(e.target.value)}
                  placeholder="e.g. Contacted logistics dispatcher; items picked and boxed. Pending courier pickup..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-800 flex items-start gap-2">
                <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Notes are appended to the permanent audit trail for this order and are immediately visible to Super Admin and Back Office staff.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setNotingOrder(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProgressNote}
                disabled={isSubmittingNote || !progressNoteText.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingNote ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Save Progress Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal (Req 15) */}
      {escalatingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
            <div className="bg-purple-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">Escalate Delayed Order to Super Admin</h3>
              </div>
              <button
                onClick={() => setEscalatingOrder(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Order Number:</span>
                  <span className="font-mono font-bold text-slate-900">#{escalatingOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Laboratory:</span>
                  <span className="font-bold text-slate-900">{escalatingOrder.customerLabName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Elapsed Time:</span>
                  <span className="font-mono text-rose-600 font-bold">{escalatingOrder.elapsedFormatted}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Reason for Escalation
                </label>
                <textarea
                  rows={3}
                  value={escalationReasonText}
                  onChange={e => setEscalationReasonText(e.target.value)}
                  placeholder="Specify the bottleneck or operational failure requiring executive intervention..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Executive Alert:</strong> Escalating this order flags it with high-priority status and dispatches an instant notification to Super Admin.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setEscalatingOrder(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateOrder}
                disabled={isSubmittingEscalation || !escalationReasonText.trim()}
                className="px-4 py-1.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingEscalation ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Confirm Escalation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
