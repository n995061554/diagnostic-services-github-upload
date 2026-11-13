import React, { useState } from 'react';
import {
  HelpCircle,
  Wrench,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ChevronRight,
  ExternalLink,
  Plus,
  Scan,
  Repeat,
  ThermometerSnowflake
} from 'lucide-react';
import { CustomerServiceTicket, ServiceSlaConfig } from '../customerAppTypes';
import { customerApiService } from '../customerApiService';
import { BiomedicalChatbot } from '../chat/BiomedicalChatbot';
import { ThemePalette } from '../../../utils/themeSystem';

interface SupportTabProps {
  tickets: CustomerServiceTicket[];
  theme: ThemePalette;
  initialSubTab?: 'ai_chat' | 'tickets' | 'escalate';
  initialExpandedTicketId?: string | null;
  onOpenRaiseTicket: () => void;
  onOpenScanner?: () => void;
  onOneClickBuy?: () => void;
  onOpenColdChain?: () => void;
  onCallEngineer: (phone?: string) => void;
  onOpenWhatsApp: () => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({
  tickets,
  theme,
  initialSubTab = 'ai_chat',
  initialExpandedTicketId = null,
  onOpenRaiseTicket,
  onOpenScanner,
  onOneClickBuy,
  onOpenColdChain,
  onCallEngineer,
  onOpenWhatsApp
}) => {
  const [supportSubTab, setSupportSubTab] = useState<'ai_chat' | 'tickets' | 'escalate'>(initialSubTab);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(initialExpandedTicketId || (tickets[0]?.id || null));
  const [newTicketMessage, setNewTicketMessage] = useState<string>('');
  const [slaConfig, setSlaConfig] = useState<ServiceSlaConfig>({
    criticalResponseHours: 4,
    highResponseHours: 8,
    mediumResponseHours: 24,
    lowResponseHours: 48,
    serviceTierName: 'Contracted Service Level Agreement',
    dispatchDescription: 'Emergency biomedical field engineer dispatch per contracted response SLA',
    disclaimer: 'Response times subject to active AMC/CMC service agreement terms and regional technical centre proximity.'
  });

  React.useEffect(() => {
    customerApiService.getServiceSlaConfig().then(cfg => {
      if (cfg) setSlaConfig(cfg);
    });
  }, []);

  React.useEffect(() => {
    if (initialSubTab) setSupportSubTab(initialSubTab);
  }, [initialSubTab]);

  React.useEffect(() => {
    if (initialExpandedTicketId) setExpandedTicketId(initialExpandedTicketId);
  }, [initialExpandedTicketId]);

  const activeTicketsCount = tickets.filter(t => !['CLOSED', 'RESOLVED'].includes(t.status)).length;

  return (
    <div className="flex flex-col h-full p-4 space-y-3.5 pb-6 animate-in fade-in text-xs">
      {/* 1. OPERATIONAL CUSTOMER-SERVICE CENTER LAUNCHERS (Promoted from Home) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#7C8594]">
            Operational Command Center
          </span>
          <span className="text-[9px] font-bold text-[#2B3D5B] bg-[#D0DEE5]/50 px-2 py-0.5 rounded-full">
            24/7 SLA Active
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={onOpenRaiseTicket}
            className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] hover:border-[#0E1035] shadow-xs hover:shadow-md transition flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#0E1035] flex items-center justify-center text-white group-hover:scale-105 transition">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black text-[#0E1035]">Raise Ticket</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] hover:border-[#0E1035] shadow-xs hover:shadow-md transition flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#15253F] flex items-center justify-center text-white group-hover:scale-105 transition">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black text-[#0E1035]">Scan Barcode</span>
          </button>

          <button
            onClick={onOneClickBuy}
            className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] hover:border-[#0E1035] shadow-xs hover:shadow-md transition flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#2B3D5B] flex items-center justify-center text-white group-hover:scale-105 transition">
              <Repeat className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black text-[#0E1035]">1-Click Buy</span>
          </button>

          <button
            onClick={onOpenColdChain}
            className="p-2.5 bg-white rounded-2xl border border-[#D0DEE5] hover:border-[#0E1035] shadow-xs hover:shadow-md transition flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#15253F] flex items-center justify-center text-[#D0DEE5] group-hover:scale-105 transition">
              <ThermometerSnowflake className="w-4 h-4 text-[#D0DEE5]" />
            </div>
            <span className="text-[10px] font-black text-[#0E1035]">Cold Chain</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TABS: AI MediBot | Existing Tickets | Human Escalation */}
      <div className="flex items-center gap-1 bg-[#D0DEE5]/30 p-1 rounded-2xl text-xs font-bold text-[#7C8594] border border-[#D0DEE5]">
        <button
          onClick={() => setSupportSubTab('ai_chat')}
          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            supportSubTab === 'ai_chat'
              ? 'bg-[#0E1035] text-white shadow-xs font-extrabold'
              : 'hover:text-[#0E1035]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D0DEE5]" />
          AI MediBot
        </button>

        <button
          onClick={() => setSupportSubTab('tickets')}
          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 relative ${
            supportSubTab === 'tickets'
              ? 'bg-[#0E1035] text-white shadow-xs font-extrabold'
              : 'hover:text-[#0E1035]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Existing Tickets ({tickets.length})
          {activeTicketsCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setSupportSubTab('escalate')}
          className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
            supportSubTab === 'escalate'
              ? 'bg-[#0E1035] text-white shadow-xs font-extrabold'
              : 'hover:text-[#0E1035]'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          Human Support
        </button>
      </div>

      {/* SUB-VIEW 1: AI CHATBOT */}
      {supportSubTab === 'ai_chat' && (
        <div className="flex-1 min-h-[420px] max-h-[580px]">
          <BiomedicalChatbot
            theme={theme}
            onRaiseTicket={onOpenRaiseTicket}
            onCallEngineer={() => onCallEngineer()}
          />
        </div>
      )}

      {/* SUB-VIEW 2: ACTIVE & PAST TICKETS */}
      {supportSubTab === 'tickets' && (
        <div className="space-y-3 overflow-y-auto">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 border border-[#D0DEE5] text-center space-y-2 shadow-xs">
              <Wrench className="w-8 h-8 text-[#7C8594] mx-auto opacity-40" />
              <h4 className="font-extrabold text-xs text-[#0E1035]">No Service Tickets Lodged</h4>
              <p className="text-[10px] text-[#7C8594]">
                All registered clinical instruments are operating normally. Tap "Raise Ticket" if support is needed.
              </p>
            </div>
          ) : (
            tickets.map(ticket => {
              const isExpanded = expandedTicketId === ticket.id;
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-[#D0DEE5] p-3.5 shadow-xs space-y-2.5 transition"
                >
                  {/* Header */}
                  <div 
                    onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                    className="flex justify-between items-start cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-[#0E1035]">{ticket.ticketNumber}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                          ticket.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          ticket.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-[#0E1035] mt-1 leading-snug">{ticket.title}</h4>
                      <div className="text-[10px] text-[#7C8594] mt-0.5">
                        {ticket.equipmentName} ({ticket.serialNumber})
                      </div>
                    </div>

                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isResolved ? 'bg-[#D0DEE5] text-[#0E1035]' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Assigned Engineer Card */}
                  {ticket.assignedEngineer && (
                    <div className="p-2.5 bg-[#D0DEE5]/20 border border-[#D0DEE5] rounded-xl flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#0E1035] text-white flex items-center justify-center font-bold">
                          {ticket.assignedEngineer.name.split(' ')[1]?.[0] || 'E'}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#0E1035]">{ticket.assignedEngineer.name}</div>
                          <div className="text-[#7C8594]">{ticket.assignedEngineer.designation}</div>
                          {ticket.assignedEngineer.eta && (
                            <div className="text-[#2B3D5B] font-bold mt-0.5">
                              ⚡ ETA: {ticket.assignedEngineer.eta}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onCallEngineer(ticket.assignedEngineer?.phone)}
                        className="p-2 bg-white hover:bg-[#D0DEE5]/40 border border-[#D0DEE5] text-[#0E1035] rounded-xl transition cursor-pointer shadow-xs"
                        title="Call Engineer"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#0E1035]" />
                      </button>
                    </div>
                  )}

                  {/* SLA Bar */}
                  <div className="flex justify-between items-center text-[10px] text-[#7C8594] pt-1 border-t border-[#D0DEE5]/40">
                    <span>SLA Guarantee: <strong className="text-[#0E1035]">{ticket.slaDeadline}</strong></span>
                    <button
                      onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                      className="text-[#2B3D5B] font-bold hover:underline"
                    >
                      {isExpanded ? 'Hide Thread ▲' : 'View Thread & Notes ▼'}
                    </button>
                  </div>

                  {/* Expanded Thread & Messages */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-[#D0DEE5] space-y-2 animate-in fade-in">
                      <p className="text-[10px] text-[#2B3D5B] bg-[#D0DEE5]/25 p-2 rounded-lg italic">
                        "{ticket.description}"
                      </p>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {ticket.messages.map(m => (
                          <div
                            key={m.id}
                            className={`p-2 rounded-xl text-[10px] ${
                              m.sender === 'CUSTOMER'
                                ? 'bg-[#0E1035] text-white ml-6'
                                : 'bg-white border border-[#D0DEE5] text-[#0E1035] mr-6'
                            }`}
                          >
                            <div className="font-extrabold text-[9px] mb-0.5 opacity-80">{m.senderName}:</div>
                            <div>{m.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-VIEW 3: HUMAN ESCALATION DESK */}
      {supportSubTab === 'escalate' && (
        <div className="space-y-3.5 overflow-y-auto">
          {/* Account Manager Card */}
          <div className="p-4 bg-[#0E1035] text-white rounded-3xl space-y-3 shadow-md border border-[#15253F]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D0DEE5] text-[#0E1035] flex items-center justify-center font-black text-lg">
                VS
              </div>
              <div>
                <span className="text-[10px] text-[#D0DEE5] font-bold uppercase tracking-wider">
                  Dedicated Biomedical Account Lead
                </span>
                <h3 className="font-black text-sm text-white">Eng. Vikram Sethi</h3>
                <p className="text-[10px] text-[#D0DEE5]/80">Senior Clinical Field Specialist</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/25 p-2.5 rounded-2xl border border-white/10">
              <div>
                <span className="text-white/70 block">Direct Mobile:</span>
                <span className="font-mono font-bold text-white">+91 98450 11992</span>
              </div>
              <div>
                <span className="text-white/70 block">Emergency Response:</span>
                <span className="font-bold text-[#D0DEE5]">&lt; 15 Minutes</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onCallEngineer('+919845011992')}
                className="flex-1 py-2.5 px-3 bg-[#D0DEE5] hover:bg-white text-[#0E1035] font-black rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Manager
              </button>
              <button
                onClick={onOpenWhatsApp}
                className="flex-1 py-2.5 px-3 bg-[#15253F] hover:bg-[#2B3D5B] border border-white/20 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#D0DEE5]" />
                WhatsApp Desk
              </button>
            </div>
          </div>

          {/* Configured Service Response SLA */}
          <div className="p-3.5 bg-white border border-[#D0DEE5] rounded-2xl space-y-2 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0E1035]" />
              <div>
                <h4 className="font-black text-xs text-[#0E1035]">{slaConfig.serviceTierName}</h4>
                <p className="text-[10px] text-[#7C8594]">{slaConfig.dispatchDescription}</p>
              </div>
            </div>
            <ul className="text-[10px] text-[#7C8594] space-y-1 pl-1">
              <li>&bull; Critical Breakdown: On-site arrival within <strong>{slaConfig.criticalResponseHours} hours</strong>.</li>
              <li>&bull; High Priority Issue: Service response within <strong>{slaConfig.highResponseHours} hours</strong>.</li>
              <li>&bull; {slaConfig.disclaimer}</li>
            </ul>
          </div>

          {/* Quick Action */}
          <button
            onClick={onOpenRaiseTicket}
            className="w-full py-3 bg-[#0E1035] hover:bg-[#15253F] text-white font-black rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            Raise Urgent Breakdown Ticket
          </button>
        </div>
      )}
    </div>
  );
};
