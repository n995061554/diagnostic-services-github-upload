import React from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Package,
  ThermometerSnowflake,
  FileText,
  Repeat,
  MapPin,
  Truck,
  Phone,
  ShieldCheck,
  Download,
  AlertTriangle
} from 'lucide-react';
import { CustomerOrderDetailed } from '../customerAppTypes';
import { formatINR } from '../mobileMockData';
import { ThemePalette } from '../../../utils/themeSystem';

interface OrderDetailsModalProps {
  order: CustomerOrderDetailed | null;
  theme: ThemePalette;
  onClose: () => void;
  onReorder: (order: CustomerOrderDetailed) => void;
  onDownloadInvoice: (order: CustomerOrderDetailed) => void;
  onViewTraceability?: (batchNumber: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  theme,
  onClose,
  onReorder,
  onDownloadInvoice,
  onViewTraceability
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5] transition-all"
      >
        {/* Header */}
        <div 
          className="p-4 text-white flex items-center justify-between shadow-md bg-[#0E1035]"
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white/10 text-[#D0DEE5]"
            >
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/70">Order Details</span>
                <span 
                  className={`text-[9px] font-black px-2 py-0.2 rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-[#D0DEE5] text-[#0E1035]' : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-sm font-black font-mono text-white mt-0.5">{order.orderNumber}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-xs bg-slate-50">
          
          {/* Destination & Timing Card */}
          <div className="bg-white rounded-2xl p-3 border border-[#D0DEE5] shadow-xs space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#0E1035] shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-[#7C8594] font-bold uppercase">Delivery Destination</div>
                <div className="font-extrabold text-[#0E1035] text-xs">{order.siteName}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
              <span className="text-[#7C8594]">Ordered: <strong className="text-[#0E1035]">{order.orderDate}</strong></span>
              <span className="text-[#7C8594]">ETA: <strong className="text-[#0E1035]">{order.estimatedDelivery}</strong></span>
            </div>
          </div>

          {/* Cold-Chain IoT Sensor Telemetry Card */}
          {order.coldChainMonitoring?.required && (
            <div className="bg-gradient-to-br from-[#0E1035] via-[#15253F] to-[#2B3D5B] text-white rounded-2xl p-3.5 shadow-md border border-[#2B3D5B] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ThermometerSnowflake className="w-4 h-4 text-[#D0DEE5]" />
                  <span className="font-extrabold text-xs text-[#D0DEE5]">
                    Active Cold-Chain Telemetry
                  </span>
                </div>
                <span className="text-[9px] font-black bg-[#D0DEE5] text-[#0E1035] px-2 py-0.5 rounded-full">
                  {order.coldChainMonitoring.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-black/25 p-2 rounded-xl border border-white/10">
                <div>
                  <div className="text-[9px] text-white/70">Current Temp</div>
                  <div className="text-base font-black font-mono text-white mt-0.5">
                    {order.coldChainMonitoring.currentTemp}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-white/70">Target Range</div>
                  <div className="text-xs font-bold font-mono mt-1 text-[#D0DEE5]">
                    {order.coldChainMonitoring.targetTemp}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-white/70">IoT Sensor ID</div>
                  <div className="text-[10px] font-bold font-mono text-white/90 mt-1 truncate">
                    {order.coldChainMonitoring.sensorId}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/70 pt-1">
                <span>Verified compliance: 100% in-range</span>
                <span>Last ping: {order.coldChainMonitoring.lastLogged}</span>
              </div>
            </div>
          )}

          {/* Delivery Timeline Tracker */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0E1035]" />
                Live Delivery Milestones
              </h4>
              <span className="text-[9px] font-bold text-[#7C8594]">AWB: {order.carrier.awbNumber}</span>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D0DEE5]">
              {order.timeline.map((step) => (
                <div key={step.stepId} className="relative">
                  <span 
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 ${
                      step.status === 'COMPLETED' 
                        ? 'bg-[#0E1035] border-[#0E1035] text-white' 
                        : step.status === 'IN_PROGRESS' 
                        ? 'bg-[#D0DEE5] border-[#0E1035] animate-pulse text-[#0E1035]' 
                        : 'bg-white border-[#CBD5E1] text-[#94A3B8]'
                    }`}
                  >
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-[#0E1035]">
                        {step.title}
                      </span>
                      <span className="text-[9px] font-bold text-[#7C8594]">{step.timestamp}</span>
                    </div>
                    <p className="text-[10px] text-[#7C8594] mt-0.5 leading-snug">{step.description}</p>
                    {step.temperature && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-[#D0DEE5]/50 text-[#0E1035] px-1.5 py-0.2 rounded">
                        ❄ {step.temperature}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Carrier Info */}
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#7C8594]">
              <span className="flex items-center gap-1 font-bold">
                <Truck className="w-3 h-3 text-[#0E1035]" />
                {order.carrier.name}
              </span>
              {order.carrier.driverPhone && (
                <a 
                  href={`tel:${order.carrier.driverPhone}`}
                  className="text-[#0E1035] font-bold flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  Call Driver
                </a>
              )}
            </div>
          </div>

          {/* Line Items & Batch Traceability */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] shadow-xs space-y-2.5">
            <h4 className="font-black text-xs text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#0E1035]" />
              Ordered Materials & Batches ({order.items.length})
            </h4>

            <div className="space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-[#D0DEE5] space-y-2">
                  <div className="flex gap-2.5">
                    <img 
                      src={item.productImageUrl} 
                      alt="" 
                      className="w-12 h-12 object-contain bg-white rounded-lg p-0.5 border border-[#D0DEE5] shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-bold text-[#2B3D5B] uppercase">{item.companyName}</div>
                      <div className="font-extrabold text-xs text-[#0E1035] leading-tight truncate">{item.productName}</div>
                      <div className="text-[10px] text-[#7C8594] mt-0.5">
                        Qty: <strong>{item.quantity}</strong> &bull; Pack: {item.packSize}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-xs text-[#0E1035]">
                        ₹{formatINR(item.totalPrice)}
                      </div>
                      <div className="text-[9px] text-[#7C8594]">
                        ₹{formatINR(item.unitPrice)}/ea
                      </div>
                    </div>
                  </div>

                  {/* Batch & QC Tag */}
                  <div className="pt-2 border-t border-[#D0DEE5]/60 flex items-center justify-between text-[9px] text-[#7C8594]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#0E1035] bg-white px-1.5 py-0.5 rounded border border-[#D0DEE5]">
                        Batch: {item.batchNumber}
                      </span>
                      <span className="text-[#7C8594]">Exp: {item.expiryDate}</span>
                    </div>
                    {onViewTraceability && (
                      <button
                        onClick={() => onViewTraceability(item.batchNumber)}
                        className="text-[#0E1035] font-extrabold hover:underline cursor-pointer"
                      >
                        Trace &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex justify-between text-[#7C8594]">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold">₹{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#7C8594]">
                <span>Estimated GST (12%):</span>
                <span className="font-mono font-bold">₹{formatINR(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-[#7C8594]">
                <span>Cold-Chain Fee:</span>
                <span className="font-bold text-[#0E1035] bg-[#D0DEE5]/60 px-1.5 py-0.2 rounded text-[10px]">
                  INCLUDED
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#D0DEE5] font-black text-sm text-[#0E1035]">
                <span>Grand Total:</span>
                <span className="font-mono">₹{formatINR(order.totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-slate-50 border-t border-[#D0DEE5] flex items-center gap-2">
          <button
            onClick={() => onDownloadInvoice(order)}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 text-[#0E1035] font-bold rounded-xl border border-[#D0DEE5] text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#0E1035]" />
            Download Tax Invoice
          </button>
          <button
            onClick={() => onReorder(order)}
            className="flex-1 py-2.5 px-3 bg-[#0E1035] hover:bg-[#15253F] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Repeat className="w-3.5 h-3.5" />
            1-Click Reorder
          </button>
        </div>

      </div>
    </div>
  );
};
