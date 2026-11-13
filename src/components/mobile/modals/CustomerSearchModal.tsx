import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Package,
  Cpu,
  Clock,
  HelpCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Scan,
  Repeat,
  ThermometerSnowflake,
  Plus
} from 'lucide-react';
import { ThemePalette } from '../../../utils/themeSystem';
import {
  ReagentProduct,
  EquipmentItem,
  REAGENTS_DATABASE,
  EQUIPMENT_DATABASE,
  formatINR
} from '../mobileMockData';
import {
  CustomerOrderDetailed,
  CustomerServiceTicket,
  DigitalDocument,
  ReagentExpiryItem
} from '../customerAppTypes';

interface CustomerSearchModalProps {
  theme: ThemePalette;
  orders: CustomerOrderDetailed[];
  tickets: CustomerServiceTicket[];
  documents: DigitalDocument[];
  expiries: ReagentExpiryItem[];
  onClose: () => void;
  onSelectReagent: (reagent: ReagentProduct) => void;
  onSelectEquipment: (equipment: EquipmentItem) => void;
  onSelectOrder: (order: CustomerOrderDetailed) => void;
  onSelectTicket: (ticket: CustomerServiceTicket) => void;
  onSelectDocument: (doc: DigitalDocument) => void;
  onTriggerShortcut: (shortcut: 'reorder' | 'scanner' | 'ticket' | 'track' | 'expiry') => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  theme,
  orders,
  tickets,
  documents,
  expiries,
  onClose,
  onSelectReagent,
  onSelectEquipment,
  onSelectOrder,
  onSelectTicket,
  onSelectDocument,
  onTriggerShortcut
}) => {
  const [query, setQuery] = useState<string>('');

  const trimmed = query.trim().toLowerCase();

  // Search Results Categorization
  const matchedReagents = useMemo(() => {
    if (!trimmed) return [];
    return REAGENTS_DATABASE.filter(r => 
      r.name.toLowerCase().includes(trimmed) ||
      r.companyName.toLowerCase().includes(trimmed) ||
      r.productCode.toLowerCase().includes(trimmed) ||
      r.categoryName.toLowerCase().includes(trimmed)
    ).slice(0, 4);
  }, [trimmed]);

  const matchedEquipment = useMemo(() => {
    if (!trimmed) return [];
    return EQUIPMENT_DATABASE.filter(e =>
      e.name.toLowerCase().includes(trimmed) ||
      e.companyName.toLowerCase().includes(trimmed) ||
      e.modelNumber.toLowerCase().includes(trimmed) ||
      e.categoryName.toLowerCase().includes(trimmed)
    ).slice(0, 3);
  }, [trimmed]);

  const matchedOrders = useMemo(() => {
    if (!trimmed) return [];
    return orders.filter(o =>
      o.orderNumber.toLowerCase().includes(trimmed) ||
      o.carrier.awbNumber?.toLowerCase().includes(trimmed) ||
      o.items.some(i => i.productName.toLowerCase().includes(trimmed) || i.batchNumber?.toLowerCase().includes(trimmed))
    ).slice(0, 3);
  }, [trimmed, orders]);

  const matchedTickets = useMemo(() => {
    if (!trimmed) return [];
    return tickets.filter(t =>
      t.ticketNumber.toLowerCase().includes(trimmed) ||
      t.title.toLowerCase().includes(trimmed) ||
      t.equipmentName.toLowerCase().includes(trimmed)
    ).slice(0, 3);
  }, [trimmed, tickets]);

  const matchedDocuments = useMemo(() => {
    if (!trimmed) return [];
    return documents.filter(d =>
      d.title.toLowerCase().includes(trimmed) ||
      d.referenceNumber.toLowerCase().includes(trimmed) ||
      d.category.toLowerCase().includes(trimmed)
    ).slice(0, 3);
  }, [trimmed, documents]);

  const totalResults = matchedReagents.length + matchedEquipment.length + matchedOrders.length + matchedTickets.length + matchedDocuments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 pt-6 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-[#D0DEE5] overflow-hidden"
        style={{ color: theme.deepNavy || '#15253F' }}
      >
        {/* Top Search Input Bar */}
        <div 
          className="p-3 border-b flex items-center gap-2"
          style={{ backgroundColor: theme.primaryNavy || '#0E1035', borderColor: theme.deepNavy || '#15253F' }}
        >
          <Search className="w-5 h-5 text-[#D0DEE5] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reagents, instruments, orders, tickets..."
            autoFocus
            className="flex-1 bg-transparent text-white placeholder-white/60 text-xs font-semibold focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-[#D0DEE5] hover:underline"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Search Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
          
          {/* Default State: Fast Customer Shortcuts */}
          {!trimmed && (
            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider block mb-2">
                  Frequently Used Shortcuts
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onTriggerShortcut('reorder');
                    }}
                    className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center gap-2 hover:border-[#0E1035] transition text-left cursor-pointer shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D0DEE5]/40 flex items-center justify-center text-[#0E1035]">
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-[11px] text-[#0E1035]">Quick Reorder</div>
                      <div className="text-[9px] text-[#7C8594]">Repeat frequent kits</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onTriggerShortcut('scanner');
                    }}
                    className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center gap-2 hover:border-[#0E1035] transition text-left cursor-pointer shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D0DEE5]/40 flex items-center justify-center text-[#0E1035]">
                      <Scan className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-[11px] text-[#0E1035]">Scan Barcode</div>
                      <div className="text-[9px] text-[#7C8594]">Camera QR scanner</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onTriggerShortcut('ticket');
                    }}
                    className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center gap-2 hover:border-[#0E1035] transition text-left cursor-pointer shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D0DEE5]/40 flex items-center justify-center text-[#0E1035]">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-[11px] text-[#0E1035]">Raise Ticket</div>
                      <div className="text-[9px] text-[#7C8594]">Biomedical 4h SLA</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onTriggerShortcut('track');
                    }}
                    className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center gap-2 hover:border-[#0E1035] transition text-left cursor-pointer shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#D0DEE5]/40 flex items-center justify-center text-[#0E1035]">
                      <ThermometerSnowflake className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-[11px] text-[#0E1035]">Cold-Chain IoT</div>
                      <div className="text-[9px] text-[#7C8594]">Live 2°C - 8°C graph</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Popular Searches */}
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider block mb-2">
                  Popular Reagents & Equipment
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Troponin T', 'Cobas 6000', 'Diluent', 'ALT/GPT', 'Lyphochek QC', 'Sysmex XN', 'Architect c4000'].map(term => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-2.5 py-1 bg-white hover:bg-[#D0DEE5]/30 rounded-xl border border-[#D0DEE5] text-[10px] font-bold text-[#0E1035] transition cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Search Results */}
          {trimmed && (
            <div className="space-y-4 animate-in fade-in">
              {totalResults === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Search className="w-8 h-8 text-[#7C8594] mx-auto opacity-40" />
                  <div className="font-bold text-xs text-[#0E1035]">No records matching "{query}"</div>
                  <p className="text-[10px] text-[#7C8594]">
                    Try searching for a company brand, product code, ticket ID, or lot number.
                  </p>
                </div>
              ) : null}

              {/* Matched Reagents */}
              {matchedReagents.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#0E1035]" />
                    Reagents & Test Kits ({matchedReagents.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedReagents.map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onClose();
                          onSelectReagent(prod);
                        }}
                        className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 hover:border-[#0E1035] transition cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={prod.imageUrl} alt="" className="w-9 h-9 object-contain bg-slate-50 rounded-lg p-0.5 border border-[#D0DEE5]" />
                          <div className="truncate">
                            <div className="font-extrabold text-[11px] text-[#0E1035] truncate">{prod.name}</div>
                            <div className="text-[9px] text-[#7C8594]">{prod.companyName} &bull; {prod.packSize}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono font-bold text-xs text-[#0E1035]">₹{formatINR(prod.customerNetPrice)}</div>
                          <span className="text-[9px] font-bold text-[#2B3D5B]">+ Add</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Equipment */}
              {matchedEquipment.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#2B3D5B]" />
                    Instruments & Analyzers ({matchedEquipment.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedEquipment.map(eq => (
                      <div
                        key={eq.id}
                        onClick={() => {
                          onClose();
                          onSelectEquipment(eq);
                        }}
                        className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 hover:border-[#0E1035] transition cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={eq.imageUrl} alt="" className="w-9 h-9 object-contain bg-slate-50 rounded-lg p-0.5 border border-[#D0DEE5]" />
                          <div className="truncate">
                            <div className="font-extrabold text-[11px] text-[#0E1035] truncate">{eq.name}</div>
                            <div className="text-[9px] text-[#7C8594]">{eq.companyName} &bull; Model: {eq.modelNumber}</div>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-[#0E1035] bg-[#D0DEE5]/50 px-2 py-0.5 rounded-lg flex-shrink-0">
                          Specs &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Orders */}
              {matchedOrders.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#0E1035]" />
                    Orders & Shipments ({matchedOrders.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedOrders.map(ord => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          onClose();
                          onSelectOrder(ord);
                        }}
                        className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 hover:border-[#0E1035] transition cursor-pointer shadow-2xs"
                      >
                        <div>
                          <div className="font-extrabold text-[11px] text-[#0E1035]">#{ord.orderNumber}</div>
                          <div className="text-[9px] text-[#7C8594]">{ord.items.length} materials &bull; {ord.status}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#0E1035]">
                          ₹{formatINR(ord.totalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Tickets */}
              {matchedTickets.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-[#2B3D5B]" />
                    Service Tickets ({matchedTickets.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedTickets.map(tck => (
                      <div
                        key={tck.id}
                        onClick={() => {
                          onClose();
                          onSelectTicket(tck);
                        }}
                        className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 hover:border-[#0E1035] transition cursor-pointer shadow-2xs"
                      >
                        <div className="truncate">
                          <div className="font-extrabold text-[11px] text-[#0E1035] truncate">#{tck.ticketNumber} - {tck.title}</div>
                          <div className="text-[9px] text-[#7C8594]">{tck.equipmentName} &bull; {tck.status}</div>
                        </div>
                        <span className="text-[9px] font-bold text-[#0E1035] bg-[#D0DEE5]/50 px-2 py-0.5 rounded-lg flex-shrink-0">
                          View &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Documents */}
              {matchedDocuments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#0E1035]" />
                    Documents & Certificates ({matchedDocuments.length})
                  </span>
                  <div className="space-y-1.5">
                    {matchedDocuments.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          onClose();
                          onSelectDocument(doc);
                        }}
                        className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 hover:border-[#0E1035] transition cursor-pointer shadow-2xs"
                      >
                        <div className="truncate">
                          <div className="font-extrabold text-[11px] text-[#0E1035] truncate">{doc.title}</div>
                          <div className="text-[9px] text-[#7C8594]">Ref: {doc.referenceNumber} &bull; {doc.fileSize}</div>
                        </div>
                        <span className="text-[9px] font-bold text-[#0E1035] bg-[#D0DEE5]/50 px-2 py-0.5 rounded-lg flex-shrink-0">
                          PDF &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
