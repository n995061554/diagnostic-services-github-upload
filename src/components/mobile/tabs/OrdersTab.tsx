import React, { useState } from 'react';
import {
  Clock,
  Package,
  ThermometerSnowflake,
  Repeat,
  Download,
  CheckCircle2,
  ChevronRight,
  Filter,
  Search,
  Truck,
  Plus,
  Minus
} from 'lucide-react';
import { CustomerOrderDetailed } from '../customerAppTypes';
import { ReagentProduct, formatINR } from '../mobileMockData';
import { ThemePalette } from '../../../utils/themeSystem';

interface OrdersTabProps {
  orders: CustomerOrderDetailed[];
  mostOrderedReagents: ReagentProduct[];
  theme: ThemePalette;
  onSelectOrder: (order: CustomerOrderDetailed) => void;
  onQuickReorderItem: (product: ReagentProduct, qty: number) => void;
  onRepeatMultipleOrders: (productIds: string[], quantities: Record<string, number>) => void;
  onDownloadInvoice: (order: CustomerOrderDetailed) => void;
  onNavigateToTrack: (orderNumber: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  mostOrderedReagents,
  theme,
  onSelectOrder,
  onQuickReorderItem,
  onRepeatMultipleOrders,
  onDownloadInvoice,
  onNavigateToTrack
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');
  const [quickOrderSelectedIds, setQuickOrderSelectedIds] = useState<string[]>([
    'prod-trop-t',
    'prod-alt'
  ]);
  const [quickOrderQuantities, setQuickOrderQuantities] = useState<Record<string, number>>({
    'prod-trop-t': 2,
    'prod-alt': 3,
    'prod-diluent': 4,
    'prod-lyphochek': 1
  });

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'ACTIVE') return o.status !== 'DELIVERED';
    if (filterStatus === 'DELIVERED') return o.status === 'DELIVERED';
    return true;
  });

  const handleBulkRepeat = () => {
    onRepeatMultipleOrders(quickOrderSelectedIds, quickOrderQuantities);
  };

  return (
    <div className="p-4 space-y-4 pb-6 animate-in fade-in text-xs">
      {/* Tab Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0E1035]" />
            Diagnostic Orders & Cold Chain
          </h2>
          <p className="text-[10px] text-[#7C8594]">Current shipments, past orders & 1-click reorder</p>
        </div>
        <span className="text-[10px] font-bold bg-[#D0DEE5]/50 text-[#0E1035] px-2 py-0.5 rounded-full">
          {orders.length} Total POs
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-[#D0DEE5]/30 p-1 rounded-2xl text-xs font-bold text-[#7C8594] border border-[#D0DEE5]">
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'ACTIVE', label: 'Current / In-Transit' },
          { id: 'DELIVERED', label: 'Delivered' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id as any)}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer text-center ${
              filterStatus === tab.id
                ? 'bg-[#0E1035] text-white shadow-xs font-black'
                : 'hover:text-[#0E1035]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-[#D0DEE5] text-center space-y-2 shadow-xs">
            <Package className="w-8 h-8 text-[#7C8594] mx-auto opacity-40" />
            <h4 className="font-extrabold text-xs text-[#0E1035]">No orders found for this filter</h4>
            <p className="text-[10px] text-[#7C8594]">
              Switch to "All Orders" or select from Quick 1-Click Reorder below.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#D0DEE5] p-3.5 shadow-xs hover:border-[#0E1035] transition space-y-2.5"
              >
                {/* Card Header */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-[#0E1035]">{order.orderNumber}</span>
                    <span className="text-[10px] text-[#7C8594]">&bull; {order.siteName.split('(')[0]}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isDelivered ? 'bg-[#D0DEE5] text-[#0E1035]' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Items Summary */}
                <div 
                  onClick={() => onSelectOrder(order)}
                  className="space-y-1 cursor-pointer group"
                >
                  <div className="text-xs font-extrabold text-[#0E1035] group-hover:text-[#2B3D5B] transition flex items-center justify-between">
                    <span>{order.items.map(it => `${it.productName} (${it.quantity}x)`).join(', ')}</span>
                    <ChevronRight className="w-4 h-4 text-[#7C8594] group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                  <div className="text-[10px] text-[#7C8594]">
                    Carrier: {order.carrier.name} &bull; {isDelivered ? `Delivered on: ${order.deliveredDate}` : `ETA: ${order.estimatedDelivery}`}
                  </div>
                </div>

                {/* Cold-Chain Telemetry Pill */}
                {order.coldChainMonitoring?.required && (
                  <div className="p-2 bg-[#D0DEE5]/20 border border-[#D0DEE5] rounded-xl flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold text-[#0E1035]">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-[#2B3D5B]" />
                      <span>Live Temp: <strong className="text-[#0E1035]">{order.coldChainMonitoring.currentTemp}</strong> (Optimal 2°C - 8°C)</span>
                    </div>
                    <button
                      onClick={() => onNavigateToTrack(order.orderNumber)}
                      className="text-[#2B3D5B] font-black hover:underline cursor-pointer"
                    >
                      Track Sensor &rarr;
                    </button>
                  </div>
                )}

                {/* Footer Row */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-black text-sm text-[#0E1035]">₹{formatINR(order.totalAmount)}</span>
                    <span className="text-[9px] text-[#7C8594] ml-1.5 font-bold">({order.items.length} materials)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDownloadInvoice(order)}
                      className="text-[#0E1035] text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Download className="w-3 h-3 text-[#0E1035]" />
                      Tax Invoice
                    </button>
                    <button
                      onClick={() => onSelectOrder(order)}
                      className="px-2.5 py-1 bg-[#0E1035] hover:bg-[#15253F] text-white font-bold rounded-lg text-[10px] transition cursor-pointer shadow-xs"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* QUICK REORDER / REPEAT PURCHASE DRAWER */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3 bg-slate-50 border border-[#D0DEE5] rounded-3xl p-3.5 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-[#0E1035]" />
              QUICK 1-CLICK REORDER
            </h3>
            <p className="text-[10px] text-[#7C8594]">Frequently ordered reagents & controls</p>
          </div>
          <button
            onClick={handleBulkRepeat}
            disabled={quickOrderSelectedIds.length === 0}
            className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] disabled:opacity-40 text-white rounded-xl text-xs font-black transition shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Repeat className="w-3 h-3" />
            Repeat ({quickOrderSelectedIds.length})
          </button>
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {mostOrderedReagents.map(prod => {
            const isChecked = quickOrderSelectedIds.includes(prod.id);
            const qty = quickOrderQuantities[prod.id] || 1;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-[#D0DEE5] p-2.5 flex items-center justify-between gap-2 shadow-xs"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    setQuickOrderSelectedIds(prev =>
                      prev.includes(prod.id) ? prev.filter(x => x !== prod.id) : [...prev, prod.id]
                    );
                  }}
                  className="w-4 h-4 rounded text-[#0E1035] focus:ring-[#0E1035] cursor-pointer"
                />
                <img 
                  src={prod.imageUrl} 
                  alt="" 
                  className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-0.5 border border-[#D0DEE5] shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold text-[#2B3D5B] uppercase">{prod.companyName}</div>
                  <div className="font-extrabold text-xs text-[#0E1035] truncate">{prod.name}</div>
                  <div className="text-[9px] font-mono font-bold text-[#0E1035]">
                    ₹{formatINR(prod.customerNetPrice)} <span className="text-[#7C8594] font-normal">/ {prod.packSize}</span>
                  </div>
                </div>

                {/* Counter */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-slate-50 border border-[#D0DEE5] rounded-lg px-1.5 py-0.5 text-xs font-bold">
                    <button
                      onClick={() => {
                        setQuickOrderQuantities(prev => ({
                          ...prev,
                          [prod.id]: Math.max(1, (prev[prod.id] || 1) - 1)
                        }));
                      }}
                      className="p-0.5 hover:text-[#0E1035]"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-5 text-center font-bold text-[#0E1035]">{qty}</span>
                    <button
                      onClick={() => {
                        setQuickOrderQuantities(prev => ({
                          ...prev,
                          [prod.id]: (prev[prod.id] || 1) + 1
                        }));
                      }}
                      className="p-0.5 hover:text-[#0E1035]"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onQuickReorderItem(prod, qty)}
                    className="px-2.5 py-1 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
