import React from 'react';
import {
  CreditCard,
  Building2,
  Package,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  ShoppingCart,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Info,
  Truck,
  RotateCcw,
  LifeBuoy
} from 'lucide-react';
import {
  CompanyBrand,
  ReagentCategory,
  ReagentProduct,
  COMPANY_BRANDS,
  REAGENT_CATEGORIES,
  formatINR
} from '../mobileMockData';
import {
  CustomerSite,
  CustomerCreditProfile,
  CustomerRole,
  CustomerOrderDetailed
} from '../customerAppTypes';
import { ThemePalette } from '../../../utils/themeSystem';

interface HomeTabProps {
  theme: ThemePalette;
  activeSite: CustomerSite;
  financials: {
    availableCredit: number;
    creditLimit: number;
    totalOutstanding: number;
    overdueAmount: number;
    dueSoonAmount?: number;
  };
  creditProfile?: CustomerCreditProfile;
  userRole?: CustomerRole;
  canMakePayments?: boolean;
  bestsellers: (ReagentProduct & { dynamicScore?: number })[];
  rankingPreset: 'balanced' | 'velocity' | 'repeat_freq' | 'cold_chain';
  onSetRankingPreset: (preset: 'balanced' | 'velocity' | 'repeat_freq' | 'cold_chain') => void;
  onAddToCart: (prod: any, qty?: number) => void;
  onSelectProduct?: (prod: ReagentProduct) => void;
  onOpenCompanyDetail: (company: CompanyBrand) => void;
  onOpenOrderCategory: (category: ReagentCategory) => void;
  onNavigateToTab: (tab: 'orders' | 'track' | 'support' | 'more') => void;
  onViewExpiryAlerts: () => void;
  urgentExpiriesCount: number;
  onPayNow?: () => void;
  onRequestExtension?: () => void;
  recentOrders?: CustomerOrderDetailed[];
  onSelectOrder?: (order: CustomerOrderDetailed) => void;
  onQuickReorderItem?: (prod: any, qty: number) => void;
  onOpenPayments?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  theme,
  activeSite,
  financials,
  creditProfile,
  userRole = 'OWNER',
  canMakePayments = true,
  bestsellers,
  rankingPreset,
  onSetRankingPreset,
  onAddToCart,
  onSelectProduct,
  onOpenCompanyDetail,
  onOpenOrderCategory,
  onNavigateToTab,
  onViewExpiryAlerts,
  urgentExpiriesCount,
  onPayNow,
  onRequestExtension,
  recentOrders = [],
  onSelectOrder,
  onQuickReorderItem,
  onOpenPayments
}) => {
  const activeCreditStatus = creditProfile?.paymentStatus || (financials.overdueAmount > 0 ? 'PAYMENT_OVERDUE' : 'GOOD_STANDING');
  const isOverdue = activeCreditStatus === 'PAYMENT_OVERDUE';
  const isDueSoon = activeCreditStatus === 'PAYMENT_DUE_SOON';
  const walletPoints = creditProfile?.walletPoints ?? (financials as any)?.walletPoints ?? 1250;

  return (
    <div className="space-y-4 pb-6 animate-in fade-in select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 1. LABORATORY IDENTITY & PAYMENT STATUS CARD */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-4 pt-1">
        <div 
          className="rounded-3xl p-4 text-white shadow-xl border relative overflow-hidden transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, #0E1035 0%, #15253F 55%, #2B3D5B 100%)`,
            borderColor: '#7C8594',
          }}
        >
          {/* Top Row: Lab Identity + Wallet Points Badge + Standing Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-white/15">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: 'rgba(208, 222, 229, 0.15)',
                  color: '#D0DEE5',
                  borderColor: 'rgba(208, 222, 229, 0.3)',
                }}
              >
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#D0DEE5] uppercase font-bold tracking-wider block truncate">
                  {activeSite.name}
                </span>
                <h4 className="text-xs font-black text-white truncate">
                  Account &amp; Payment Status
                </h4>
              </div>
            </div>

            {/* Standing Indicator & Wallet Points Badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="bg-amber-400/25 text-amber-200 border border-amber-300/40 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-xs">
                <span>🪙</span>
                <span>{walletPoints.toLocaleString('en-IN')} Pts</span>
              </span>
              <span
                className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  isOverdue
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse'
                    : isDueSoon
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-400' : isDueSoon ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {isOverdue ? 'Payment Overdue' : isDueSoon ? 'Payment Due Soon' : 'Good Standing'}
              </span>
            </div>
          </div>

          {/* Account & Payment Status Grid — Outstanding and Wallet Points in Front Row */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {/* 1. Outstanding */}
            <div className="bg-black/25 p-2.5 rounded-2xl border border-white/10">
              <div className="text-[9px] text-[#D0DEE5]/80 uppercase font-semibold">Outstanding</div>
              <div className="text-sm font-black font-mono mt-0.5 text-white">
                ₹{formatINR(creditProfile?.outstandingAmount ?? (creditProfile as any)?.currentOutstanding ?? financials.totalOutstanding)}
              </div>
              <div className="text-[8.5px] text-[#D0DEE5]/60 mt-0.5 truncate">
                Total unpaid invoices
              </div>
            </div>

            {/* 2. Wallet Points (Prominently displayed right next to Outstanding) */}
            <div className="bg-black/25 p-2.5 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/15 via-black/20 to-transparent relative overflow-hidden shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-amber-200 uppercase font-bold flex items-center gap-1">
                  <span>🪙</span> Wallet Points
                </span>
                <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-400/25 px-1.5 py-0.2 rounded-full border border-amber-300/40">
                  Active
                </span>
              </div>
              <div className="text-sm font-black font-mono mt-0.5 text-amber-300 flex items-center gap-1.5">
                <span>{walletPoints.toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-sans font-bold text-amber-200/80">PTS</span>
              </div>
              <div className="text-[8.5px] text-amber-100/70 mt-0.5 font-medium truncate">
                ≈ ₹{walletPoints.toLocaleString('en-IN')} order discount
              </div>
            </div>

            {/* 3. Available Credit */}
            <div className="bg-black/25 p-2.5 rounded-2xl border border-white/10">
              <div className="text-[9px] text-[#D0DEE5]/80 uppercase font-semibold">Available Credit</div>
              <div className="text-sm font-black font-mono mt-0.5 text-emerald-300">
                ₹{formatINR(creditProfile?.availableCredit ?? financials.availableCredit)}
              </div>
              <div className="text-[8.5px] text-[#D0DEE5]/60 mt-0.5 truncate">
                Limit: ₹{formatINR(creditProfile?.creditLimit ?? financials.creditLimit)}
              </div>
            </div>

            {/* 4. Overdue / Due Soon */}
            <div className="bg-black/25 p-2.5 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-[#D0DEE5]/80 uppercase font-semibold">
                  {isOverdue ? 'Overdue' : 'Due Soon'}
                </span>
                <span className={`w-2 h-2 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-400'} shrink-0`} />
              </div>
              <div className={`text-sm font-black font-mono mt-0.5 flex items-center gap-1 ${isOverdue ? 'text-rose-300' : 'text-amber-300'}`}>
                <span>₹{formatINR(isOverdue ? financials.overdueAmount : (financials.dueSoonAmount ?? 40000))}</span>
                <span className="text-[10px]">{isOverdue ? '🔴' : '🟠'}</span>
              </div>
              <div className="text-[8.5px] text-[#D0DEE5]/60 mt-0.5 truncate">
                {isOverdue ? `${creditProfile?.daysOverdue ?? 14} days overdue` : 'Due in next cycle'}
              </div>
            </div>
          </div>

          {/* Health Bar & Credit Limit Reference */}
          <div className="mt-3 pt-2">
            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: isOverdue ? '#FB7185' : '#D0DEE5',
                  width: `${Math.min(100, Math.max(0, ((creditProfile?.availableCredit ?? financials.availableCredit) / ((creditProfile?.creditLimit ?? financials.creditLimit) || 1)) * 100))}%` 
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] text-[#D0DEE5] mt-1.5 font-medium">
              <span>Credit Limit: <strong className="text-white">₹{formatINR(creditProfile?.creditLimit ?? financials.creditLimit)}</strong></span>
              <span>Reliability: <strong className="text-white">{creditProfile?.paymentReliability || 'EXCELLENT'}</strong></span>
            </div>
          </div>

          {/* Overdue Warning or Payment Authority Notice */}
          {isOverdue && (
            <div className="mt-3 p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-black text-rose-200 leading-tight">
                    Payment Overdue ({creditProfile?.daysOverdue ?? 14} Days)
                  </div>
                  <p className="text-[10px] text-rose-300/90 leading-snug mt-0.5">
                    Please clear your previous overdue amount of ₹{formatINR(financials.overdueAmount)} before placing new credit orders.
                  </p>
                </div>
              </div>

              {/* Payment Action Buttons for Owner / Payment-authorized user */}
              {canMakePayments ? (
                <div className="flex gap-2 pt-1">
                  {onPayNow && (
                    <button
                      onClick={onPayNow}
                      className="flex-1 py-1.5 px-3 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Pay Now (2% Off)
                    </button>
                  )}
                  {onRequestExtension && (
                    <button
                      onClick={onRequestExtension}
                      className="flex-1 py-1.5 px-3 bg-[#15253F] hover:bg-[#2B3D5B] border border-rose-400/40 text-rose-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Request Extension
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2 p-2 rounded-xl bg-black/40 border border-white/10 text-[10px] text-[#D0DEE5] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>
                    Payment Authority: Reserved for Laboratory Owner. You have view-only financial authority.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Admin Info Banner when not overdue */}
          {!isOverdue && !canMakePayments && (
            <div className="mt-3 p-2.5 rounded-xl bg-blue-950/40 border border-blue-400/30 text-[10px] text-[#D0DEE5] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-300 shrink-0" />
              <span>
                <strong>Admin Account Visibility:</strong> Full financial visibility enabled. Payment processing is reserved for Laboratory Owner.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. IMPORTANT ALERTS (Urgent Reagent Expiry / Overdue Warnings) */}
      {/* ------------------------------------------------------------------ */}
      {urgentExpiriesCount > 0 && (
        <div className="px-4">
          <div 
            onClick={onViewExpiryAlerts}
            className="p-3 bg-amber-50 border border-amber-300/60 rounded-2xl flex items-center justify-between cursor-pointer shadow-xs hover:shadow-md transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="text-[11px] font-black text-amber-900">
                  {urgentExpiriesCount} Reagent Lots Expiring Soon (&lt; 30 Days)
                </div>
                <div className="text-[9px] text-amber-800/80">
                  Bio-Rad HbA1c &amp; cobas Creatinine need replenishment
                </div>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-amber-900 flex items-center">
              Review &rarr;
            </span>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 0. GREETING & INSTITUTIONAL HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-4 pt-1 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0E1035] tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {activeSite?.doctorInCharge?.split(' ')[0] || 'Director'}
          </h2>
          <p className="text-[11px] text-[#7C8594] font-medium">
            {activeSite?.name || 'Diagnostic Services Clinical Portal'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold text-[#7C8594] bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. RESTRAINED PASTEL QUICK ACTION GRID */}
      {/* Shortcuts: Shop Products, Place Order, My Orders, */}
      {/* Track Delivery, Payments & Credit, Support & Help */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#0E1035] uppercase tracking-wider">
            Quick Actions
          </h3>
          <span className="text-[10px] text-[#7C8594] font-medium">Frequent Tasks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* 1. Shop Products (Light Blue) */}
          <button
            id="btn-home-shop-products"
            onClick={() => onOpenOrderCategory(REAGENT_CATEGORIES[0])}
            className="p-3 rounded-2xl bg-[#E0F2FE] hover:bg-[#BAE6FD]/70 border border-[#BAE6FD] hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 text-[#0284C7] shadow-xs flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0E1035] mt-2 leading-tight">
              Shop Products
            </span>
            <span className="text-[10px] text-[#0369A1] font-normal leading-tight mt-0.5">
              Reagents &amp; kits
            </span>
          </button>

          {/* 2. Place Order (Light Blue / Indigo) */}
          <button
            id="btn-home-place-order"
            onClick={() => {
              if (userRole === 'VIEWER') {
                alert('Lab Viewer has read-only access. Only Lab Owner and Lab Admin can place orders.');
                return;
              }
              const prod = bestsellers[0];
              if (prod) onAddToCart(prod, 1);
            }}
            className="p-3 rounded-2xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 text-[#2563EB] shadow-xs flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0E1035] mt-2 leading-tight">
              Place Order
            </span>
            <span className="text-[10px] text-[#1D4ED8] font-normal leading-tight mt-0.5">
              Direct requisition
            </span>
          </button>

          {/* 3. My Orders (Light Green) */}
          <button
            id="btn-home-my-orders"
            onClick={() => onNavigateToTab('orders')}
            className="p-3 rounded-2xl bg-[#DCFCE7] hover:bg-[#BBF7D0] border border-[#BBF7D0] hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 text-[#16A34A] shadow-xs flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0E1035] mt-2 leading-tight">
              My Orders
            </span>
            <span className="text-[10px] text-[#15803D] font-normal leading-tight mt-0.5">
              Status &amp; reorders
            </span>
          </button>

          {/* 4. Track Delivery (Light Violet) */}
          <button
            id="btn-home-track-delivery"
            onClick={() => onNavigateToTab('track')}
            className="p-3 rounded-2xl bg-[#EDE9FE] hover:bg-[#DDD6FE] border border-[#DDD6FE] hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 text-[#7C3AED] shadow-xs flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0E1035] mt-2 leading-tight">
              Track Delivery
            </span>
            <span className="text-[10px] text-[#6D28D9] font-normal leading-tight mt-0.5">
              Cold-chain IoT
            </span>
          </button>

          {/* 5. Payments & Credit (Light Pink) */}
          <button
            id="btn-home-payments"
            onClick={() => {
              if (onOpenPayments) onOpenPayments();
              else if (onPayNow) onPayNow();
            }}
            className="p-3 rounded-2xl bg-[#FCE7F3] hover:bg-[#FBCFE8] border border-[#FBCFE8] hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 text-[#DB2777] shadow-xs flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0E1035] mt-2 leading-tight">
              Payments &amp; Credit
            </span>
            <span className="text-[10px] text-[#BE185D] font-normal leading-tight mt-0.5">
              Ledger &amp; limits
            </span>
          </button>

          {/* 6. Support & Help (Light Cyan) */}
          <button
            id="btn-home-support"
            onClick={() => onNavigateToTab('support')}
            className="p-3 rounded-2xl bg-[#CFFAFE] hover:bg-[#A5F3FC] border border-[#A5F3FC] hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 text-[#0891B2] shadow-xs flex items-center justify-center shrink-0">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#0E1035] mt-2 leading-tight">
              Support &amp; Help
            </span>
            <span className="text-[10px] text-[#0E7490] font-normal leading-tight mt-0.5">
              Biomedical SLA
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. RECENT ORDERS & FAST REORDER (Prioritizing recent orders)       */}
      {/* ------------------------------------------------------------------ */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0E1035]" />
                Recent Orders
              </h3>
              <p className="text-[10px] text-[#7C8594]">Track shipment status &amp; fast reorder</p>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="text-[10px] font-bold text-[#0E1035] hover:underline cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {recentOrders.slice(0, 2).map((order) => (
              <div
                key={order.id}
                className="p-3 bg-white rounded-2xl border border-[#D0DEE5] shadow-xs flex items-center justify-between gap-3 hover:border-[#0E1035] transition"
              >
                <div 
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectOrder && onSelectOrder(order)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0E1035]">
                      #{order.orderNumber}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full border ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'IN_TRANSIT' || order.status === 'DISPATCHED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7C8594] mt-0.5 truncate">
                    {order.items?.length || 1} items &bull; ₹{formatINR(order.totalAmount)} &bull; {order.orderDate}
                  </div>
                </div>

                {userRole !== 'VIEWER' && (
                  <button
                    onClick={() => {
                      if (order.items && order.items[0]) {
                        onAddToCart({
                          id: order.items[0].productId,
                          name: order.items[0].productName,
                          companyName: order.items[0].companyName,
                          customerNetPrice: order.items[0].unitPrice,
                          packSize: order.items[0].packSize,
                          imageUrl: order.items[0].productImageUrl || '/logo.jpeg',
                          discountPercent: 12
                        }, order.items[0].quantity || 1);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer shrink-0"
                    title="Repeat this order"
                  >
                    <RotateCcw className="w-3 h-3 text-[#D0DEE5]" />
                    <span>Reorder</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 5. SHOP BY COMPANY                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-2.5">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0E1035]" />
              SHOP BY COMPANY
            </h3>
            <p className="text-[10px] text-[#7C8594]">Global Diagnostic Brand Principals</p>
          </div>
          <span className="text-[10px] font-bold text-[#0E1035] bg-[#D0DEE5]/40 px-2 py-0.5 rounded-full">
            7 Partners
          </span>
        </div>

        {/* Company Logo Cards: Aspect ratio preserved, full available area */}
        <div className="flex gap-2.5 overflow-x-auto px-4 pb-2 scrollbar-none">
          {COMPANY_BRANDS.map(company => (
            <button
              key={company.id}
              onClick={() => onOpenCompanyDetail(company)}
              className="shrink-0 w-28 h-22 bg-white rounded-2xl border border-[#D0DEE5] hover:border-[#0E1035] shadow-xs hover:shadow-md transition p-2 flex flex-col items-center justify-between group cursor-pointer"
            >
              <div className="w-full h-12 flex items-center justify-center rounded-xl bg-slate-50/80 px-1 border border-slate-100 overflow-hidden">
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="max-h-10 max-w-full object-contain group-hover:scale-105 transition duration-200"
                />
              </div>
              <span className="text-[10px] font-black text-[#0E1035] truncate max-w-full text-center leading-tight">
                {company.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. REAGENT CATEGORIES (15 Categories)                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-2.5 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#0E1035]" />
              REAGENT CATEGORIES
            </h3>
            <p className="text-[10px] text-[#7C8594]">Select Category &bull; Select Company &bull; Order</p>
          </div>
          <span className="text-[10px] font-bold text-[#7C8594]">15 Categories</span>
        </div>

        {/* 3-Column Uniform Responsive Grid */}
        <div className="grid grid-cols-3 gap-2">
          {REAGENT_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => onOpenOrderCategory(category)}
              className="bg-white rounded-2xl border border-[#D0DEE5] p-2 shadow-xs hover:border-[#0E1035] hover:shadow-md transition flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-full h-14 rounded-xl bg-[#D0DEE5]/20 p-1 flex items-center justify-center border border-[#D0DEE5]/40 overflow-hidden">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition"
                />
              </div>
              <span className="text-[10px] font-black text-[#0E1035] line-clamp-2 mt-1.5 leading-tight group-hover:text-[#2B3D5B]">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. MAXIMUM SELLING PRODUCTS (Prioritize Products)                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#0E1035]" />
              MAXIMUM SELLING PRODUCTS
            </h3>
            <p className="text-[10px] text-[#7C8594]">Ranked by laboratory consumption velocity</p>
          </div>
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-[#D0DEE5]/30 p-0.5 rounded-lg text-[9px] font-bold border border-[#D0DEE5]">
            <button
              onClick={() => onSetRankingPreset('balanced')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${rankingPreset === 'balanced' ? 'bg-[#0E1035] text-white shadow-xs font-extrabold' : 'text-[#7C8594] hover:bg-[#D0DEE5]'}`}
            >
              AI Rank
            </button>
            <button
              onClick={() => onSetRankingPreset('repeat_freq')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${rankingPreset === 'repeat_freq' ? 'bg-[#0E1035] text-white shadow-xs font-extrabold' : 'text-[#7C8594] hover:bg-[#D0DEE5]'}`}
            >
              Repeat
            </button>
            <button
              onClick={() => onSetRankingPreset('velocity')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${rankingPreset === 'velocity' ? 'bg-[#0E1035] text-white shadow-xs font-extrabold' : 'text-[#7C8594] hover:bg-[#D0DEE5]'}`}
            >
              Velocity
            </button>
          </div>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {bestsellers.slice(0, 6).map(prod => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-[#D0DEE5] p-3 shadow-xs hover:border-[#0E1035] transition flex flex-col justify-between group"
            >
              <div 
                className="space-y-1.5 cursor-pointer"
                onClick={() => onSelectProduct ? onSelectProduct(prod) : onAddToCart(prod, 1)}
              >
                <div className="relative w-full h-24 bg-slate-50 rounded-xl overflow-hidden p-1 flex items-center justify-center border border-slate-200">
                  <img src={prod.imageUrl} alt={prod.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition" />
                  <span className="absolute top-1 left-1 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs bg-[#0E1035] text-white">
                    {prod.salesIndicator || 'Trending'}
                  </span>
                </div>

                <div className="text-[10px] font-bold text-[#7C8594] uppercase">{prod.companyName}</div>
                <h4 className="font-extrabold text-xs text-[#0E1035] line-clamp-2 leading-tight group-hover:text-[#2B3D5B] transition">
                  {prod.name}
                </h4>
                <div className="text-[10px] text-[#7C8594]">Pack: {prod.packSize}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div>
                  <div className="font-mono font-black text-xs text-[#0E1035]">
                    ₹{formatINR(prod.customerNetPrice)}
                  </div>
                  <div className="text-[9px] text-emerald-600 font-bold">
                    {prod.discountPercent}% OFF
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {onSelectProduct && (
                    <button
                      onClick={() => onSelectProduct(prod)}
                      className="p-1.5 bg-[#D0DEE5]/50 hover:bg-[#D0DEE5] text-[#0E1035] rounded-xl transition cursor-pointer"
                      title="View Details & Similar Kits"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {userRole !== 'VIEWER' && (
                    <button
                      onClick={() => onAddToCart(prod, 1)}
                      className="p-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                      title="Add to Cart"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
