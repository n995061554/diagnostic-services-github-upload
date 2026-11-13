import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Camera,
  Package,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2,
  Activity,
  ArrowRight,
  X,
  FileCheck2,
  Calendar,
  Sparkles,
  LogOut,
  RefreshCw,
  Cpu,
  User,
  Sliders,
  FileText,
  MapPin,
  QrCode
} from 'lucide-react';
import { CustomerAuthSession, CustomerRole } from '../customerAppTypes';
import { customerAuthStore } from '../customerApiService';

interface MobileServiceEngineerViewProps {
  session: CustomerAuthSession;
  onLogout: () => void;
  onSwitchRole: (role: CustomerRole) => void;
}

interface PmItem {
  id: string;
  analyzerName: string;
  modelCode: string;
  serialNumber: string;
  labName: string;
  labLocation: string;
  dueDate: string;
  isOverdue: boolean;
  status: 'DUE' | 'SCHEDULED' | 'COMPLETED';
  contractType: 'CMC' | 'AMC';
  lastPmDate: string;
}

interface BreakdownTicket {
  id: string;
  ticketNumber: string;
  analyzerName: string;
  serialNumber: string;
  labName: string;
  errorCode: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  reportedAt: string;
  slaRemainingHours: number;
  issueDescription: string;
}

const INITIAL_PM_LIST: PmItem[] = [
  {
    id: 'pm-101',
    analyzerName: 'Roche Cobas c311 Chemistry Analyzer',
    modelCode: 'COBAS-C311-PRO',
    serialNumber: 'SN-COB-2024-9982',
    labName: 'Apex Diagnostics & Research Lab',
    labLocation: 'Powai Hub, Mumbai',
    dueDate: 'Today (Immediate)',
    isOverdue: true,
    status: 'DUE',
    contractType: 'CMC',
    lastPmDate: '10-Jul-2026'
  },
  {
    id: 'pm-102',
    analyzerName: 'Sysmex XN-550 Automated Hematology',
    modelCode: 'XN-550-FLU',
    serialNumber: 'SN-SYS-8821-4410',
    labName: 'Metropolis Diagnostics Center',
    labLocation: 'Andheri West, Mumbai',
    dueDate: '14-Oct-2026 (In 4 Days)',
    isOverdue: false,
    status: 'SCHEDULED',
    contractType: 'AMC',
    lastPmDate: '14-Jul-2026'
  },
  {
    id: 'pm-103',
    analyzerName: 'Roche Cobas Pure Integrated Platform',
    modelCode: 'COBAS-PURE-CC',
    serialNumber: 'SN-PURE-2025-1102',
    labName: 'Lilavati Diagnostic Laboratory',
    labLocation: 'Bandra, Mumbai',
    dueDate: '22-Oct-2026 (In 12 Days)',
    isOverdue: false,
    status: 'SCHEDULED',
    contractType: 'CMC',
    lastPmDate: '22-Jun-2026'
  }
];

const INITIAL_TICKETS: BreakdownTicket[] = [
  {
    id: 'tkt-881',
    ticketNumber: 'TKT-2026-881',
    analyzerName: 'Roche Cobas c311',
    serialNumber: 'SN-COB-2024-9982',
    labName: 'Apex Diagnostics (Powai)',
    errorCode: 'E-104: Reaction Carousel Lockup',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    reportedAt: '1 hr ago',
    slaRemainingHours: 3,
    issueDescription: 'Photometer optical sensor read error during run cycle. Immediate lamp calibration required.'
  },
  {
    id: 'tkt-882',
    ticketNumber: 'TKT-2026-882',
    analyzerName: 'Sysmex XN-550',
    serialNumber: 'SN-SYS-8821-4410',
    labName: 'Metropolis Center (Andheri)',
    errorCode: 'OPT-331: Reagent Barcode Misalignment',
    priority: 'HIGH',
    status: 'ASSIGNED',
    reportedAt: '3 hrs ago',
    slaRemainingHours: 5,
    issueDescription: 'Barcode scanner fails to register CBC diluent vial barcode. Mechanical realignment needed.'
  }
];

export const MobileServiceEngineerView: React.FC<MobileServiceEngineerViewProps> = ({
  session,
  onLogout,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'pm' | 'tickets' | 'log_ticket' | 'fleet'>('pm');
  const [pms, setPms] = useState<PmItem[]>(INITIAL_PM_LIST);
  const [tickets, setTickets] = useState<BreakdownTicket[]>(INITIAL_TICKETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // PM Execution Modal State
  const [executingPm, setExecutingPm] = useState<PmItem | null>(null);
  const [pmChecks, setPmChecks] = useState({
    lampCheck: true,
    pipetteSeals: true,
    fluidicWash: false,
    chamberTemp: false,
    zeroOptics: false
  });
  const [isSubmittingPm, setIsSubmittingPm] = useState(false);

  // New Ticket Form State
  const [newLabName, setNewLabName] = useState('Apex Diagnostics (Powai)');
  const [newAnalyzer, setNewAnalyzer] = useState('Roche Cobas c311 (SN-COB-2024-9982)');
  const [newErrorCode, setNewErrorCode] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newPriority, setNewPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCompletePm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingPm) return;
    setIsSubmittingPm(true);

    setTimeout(() => {
      setPms(prev =>
        prev.map(p =>
          p.id === executingPm.id
            ? { ...p, status: 'COMPLETED', dueDate: 'Completed Today', isOverdue: false }
            : p
        )
      );
      setIsSubmittingPm(false);
      setExecutingPm(null);
      showToast(`PM completed & NABL ISO Certificate logged for ${executingPm.analyzerName}!`);
    }, 600);
  };

  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: 'RESOLVED' } : t))
    );
    showToast(`Work order resolved & customer sign-off recorded!`);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.trim()) {
      showToast('Please enter an issue description.');
      return;
    }

    const created: BreakdownTicket = {
      id: `tkt-${Date.now().toString().slice(-4)}`,
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      analyzerName: newAnalyzer.split(' (')[0],
      serialNumber: newAnalyzer.includes('(') ? newAnalyzer.split('(')[1].replace(')', '') : 'SN-2026',
      labName: newLabName,
      errorCode: newErrorCode || 'DIAG-PM-INSPECT',
      priority: newPriority,
      status: 'ASSIGNED',
      reportedAt: 'Just now',
      slaRemainingHours: newPriority === 'CRITICAL' ? 4 : 8,
      issueDescription: newIssue.trim()
    };

    setTickets(prev => [created, ...prev]);
    setNewIssue('');
    setNewErrorCode('');
    setActiveTab('tickets');
    showToast(`Service Work Order #${created.ticketNumber} lodged successfully!`);
  };

  return (
    <div className="relative w-full h-full flex flex-col font-sans select-none overflow-hidden bg-[#0A0D1F] text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-14 left-4 right-4 z-50 p-3 bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{toastMessage}</span>
        </div>
      )}

      {/* Role Switcher Modal */}
      {isRoleModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#15253F] border border-[#2B3D5B] rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D0DEE5]" />
                Switch Mobile Role
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 rounded-full text-[#D0DEE5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('OWNER');
                }}
                className="w-full p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold text-left hover:bg-amber-500/30 transition flex items-center gap-2"
              >
                <span>👑</span>
                <div>
                  <div>Apex Owner (Customer Lab)</div>
                  <div className="text-[10px] text-amber-200/70 font-normal">Reagents catalog, cart & orders</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('SERVICE_ENGINEER');
                }}
                className="w-full p-2.5 rounded-xl bg-blue-600/30 border border-blue-400 text-white text-xs font-bold text-left flex items-center gap-2"
              >
                <span>🔧</span>
                <div>
                  <div>Field Service Engineer (Active)</div>
                  <div className="text-[10px] text-blue-200 font-normal">PM schedules & breakdown tickets</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('SALES_PERSON');
                }}
                className="w-full p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold text-left hover:bg-emerald-500/30 transition flex items-center gap-2"
              >
                <span>💼</span>
                <div>
                  <div>Field Sales Representative</div>
                  <div className="text-[10px] text-emerald-200/70 font-normal">Sales quotas & customer visits</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('OFFICE_ADMIN');
                }}
                className="w-full p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold text-left hover:bg-purple-500/30 transition flex items-center gap-2"
              >
                <span>⏱️</span>
                <div>
                  <div>Staff Attendance Console</div>
                  <div className="text-[10px] text-purple-200/70 font-normal">Geofence punch & shift tracking</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP HEADER */}
      {/* ------------------------------------------------------------------ */}
      <header className="px-4 pt-7 pb-3 flex items-center justify-between border-b border-[#1B254B] bg-[#0E1538]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300 font-black text-xs shadow-md">
            🔧
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs text-white">Anand Deshmukh</h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-[#A3B3D6] font-medium flex items-center gap-1">
              <span>Sr. Biomedical Field Engineer</span>
              <span>&bull;</span>
              <span className="text-emerald-400">On Duty</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#1B254B] hover:bg-[#253265] text-[#D0DEE5] text-[11px] font-bold flex items-center gap-1 px-2.5 transition border border-[#2B3D5B]"
            title="Switch Persona"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Role</span>
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. KPI METRICS CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-3 bg-[#0E1538]/70 border-b border-[#1B254B] grid grid-cols-4 gap-1.5">
        <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-center">
          <div className="text-sm font-black text-red-300">
            {pms.filter(p => p.isOverdue || p.status === 'DUE').length}
          </div>
          <div className="text-[9px] font-bold text-red-200/80 uppercase">Due PMs</div>
        </div>
        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center">
          <div className="text-sm font-black text-amber-300">
            {tickets.filter(t => t.status !== 'RESOLVED').length}
          </div>
          <div className="text-[9px] font-bold text-amber-200/80 uppercase">Active Tkts</div>
        </div>
        <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-center">
          <div className="text-sm font-black text-blue-300">98.4%</div>
          <div className="text-[9px] font-bold text-blue-200/80 uppercase">SLA Health</div>
        </div>
        <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
          <div className="text-sm font-black text-emerald-300">14</div>
          <div className="text-[9px] font-bold text-emerald-200/80 uppercase">Certs MTD</div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SEGMENTED NAVIGATION PILLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-2.5 flex items-center gap-1 border-b border-[#1B254B] bg-[#0A0D1F] overflow-x-auto text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('pm')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'pm'
              ? 'bg-blue-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>PM Schedules ({pms.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Breakdown Tickets ({tickets.filter(t => t.status !== 'RESOLVED').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('log_ticket')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'log_ticket'
              ? 'bg-blue-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log PM/Ticket</span>
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'fleet'
              ? 'bg-blue-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Equipment Fleet</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. MAIN TAB CONTENT */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-16">
        {/* TAB 1: PREVENTIVE MAINTENANCE SCHEDULES */}
        {activeTab === 'pm' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#A3B3D6] uppercase tracking-wider">
                Assigned Clinical Analyzers
              </span>
              <span className="text-[10px] text-blue-300 font-semibold">
                Biomedical Standard SOP v4.2
              </span>
            </div>

            {pms.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#121A3A] border border-[#1E2B58] space-y-2.5 hover:border-blue-500/50 transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {item.analyzerName}
                    </h3>
                    <div className="text-[10px] text-[#A3B3D6] mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-blue-300">{item.serialNumber}</span>
                      <span>&bull;</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-200 font-bold text-[9px]">
                        {item.contractType} Contract
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : item.isOverdue
                        ? 'bg-red-500/20 text-red-300 border border-red-400/40 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {item.status === 'COMPLETED' ? '✓ Completed' : item.isOverdue ? '⚠️ Overdue' : 'Due Soon'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-[#0A0D1F] text-[10px] space-y-1 text-[#A3B3D6]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-400" />
                      {item.labName}
                    </span>
                    <span className="text-slate-400">{item.labLocation}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#8C9BBF]">
                    <span>Last PM: {item.lastPmDate}</span>
                    <span className="font-bold text-white">Target: {item.dueDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {item.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => setExecutingPm(item)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Execute PM &amp; Calibrate</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-[10px] font-bold text-center border border-emerald-500/30">
                      ✓ NABL PM Certification Logged
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: BREAKDOWN TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#A3B3D6] uppercase tracking-wider">
                Emergency Breakdown Queue
              </span>
              <span className="text-[10px] text-amber-300 font-semibold">
                SLA Guarantee: 4hr Critical
              </span>
            </div>

            {tickets.map(tkt => (
              <div
                key={tkt.id}
                className="p-3.5 rounded-2xl bg-[#121A3A] border border-[#1E2B58] space-y-2.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-300">
                        {tkt.ticketNumber}
                      </span>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                          tkt.priority === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {tkt.priority}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white mt-1">
                      {tkt.analyzerName} &bull; <span className="font-mono text-blue-300">{tkt.serialNumber}</span>
                    </h3>
                  </div>

                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      tkt.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300 animate-pulse'
                    }`}
                  >
                    {tkt.status}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] text-red-200">
                  <span className="font-bold">Error:</span> {tkt.errorCode}
                  <p className="mt-0.5 text-[#A3B3D6] text-[10px]">{tkt.issueDescription}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#A3B3D6] px-1">
                  <span>Hospital: <strong className="text-white">{tkt.labName}</strong></span>
                  <span className="text-amber-300 font-mono font-bold">
                    ⏱️ {tkt.slaRemainingHours}h SLA remaining
                  </span>
                </div>

                {tkt.status !== 'RESOLVED' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleResolveTicket(tkt.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Work Order</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: LOG PM INSPECTION / FIELD TICKET */}
        {activeTab === 'log_ticket' && (
          <form
            onSubmit={handleCreateTicketSubmit}
            className="p-4 rounded-2xl bg-[#121A3A] border border-[#1E2B58] space-y-3"
          >
            <div className="border-b border-[#1E2B58] pb-2">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Log On-Site Service Ticket / Work Order
              </h3>
              <p className="text-[10px] text-[#A3B3D6] mt-0.5">
                Report analyzer anomaly, request spare part dispatch, or record visit.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                Hospital / Lab Account
              </label>
              <select
                value={newLabName}
                onChange={e => setNewLabName(e.target.value)}
                className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none"
              >
                <option value="Apex Diagnostics (Powai Hub)">Apex Diagnostics (Powai Hub)</option>
                <option value="Metropolis Center (Andheri)">Metropolis Center (Andheri)</option>
                <option value="Lilavati Diagnostic Lab (Bandra)">Lilavati Diagnostic Lab (Bandra)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                Analyzer & Serial Tag
              </label>
              <select
                value={newAnalyzer}
                onChange={e => setNewAnalyzer(e.target.value)}
                className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none"
              >
                <option value="Roche Cobas c311 (SN-COB-2024-9982)">Roche Cobas c311 (SN-COB-2024-9982)</option>
                <option value="Sysmex XN-550 (SN-SYS-8821-4410)">Sysmex XN-550 (SN-SYS-8821-4410)</option>
                <option value="Roche Cobas Pure (SN-PURE-2025-1102)">Roche Cobas Pure (SN-PURE-2025-1102)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                  Alarm / Error Code
                </label>
                <input
                  type="text"
                  value={newErrorCode}
                  onChange={e => setNewErrorCode(e.target.value)}
                  placeholder="e.g. E-104 or LAMP-VOLT"
                  className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                  Severity
                </label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="CRITICAL">Critical (Instrument Down)</option>
                  <option value="HIGH">High (Degraded Optics)</option>
                  <option value="MEDIUM">Medium (Routine Calib)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                Technical Observation & Actions Taken *
              </label>
              <textarea
                rows={3}
                required
                value={newIssue}
                onChange={e => setNewIssue(e.target.value)}
                placeholder="Describe mechanical anomaly, spare part needs, fluidic line leak..."
                className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Service Work Order</span>
            </button>
          </form>
        )}

        {/* TAB 4: INSTALLED EQUIPMENT FLEET */}
        {activeTab === 'fleet' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-[#A3B3D6] uppercase tracking-wider">
                Territory Installed Fleet (Analyzers)
              </span>
              <button
                onClick={() => showToast('Optical Camera Barcode/QR viewfinder active!')}
                className="p-1 px-2 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center gap-1"
              >
                <QrCode className="w-3 h-3" />
                <span>Scan Asset Tag</span>
              </button>
            </div>

            {pms.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-[#121A3A] border border-[#1E2B58] text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-white">{p.analyzerName}</span>
                  <span className="text-[10px] text-blue-300 font-mono font-bold">{p.contractType}</span>
                </div>
                <div className="text-[10px] text-[#A3B3D6] flex items-center justify-between">
                  <span>Serial: <strong className="text-white font-mono">{p.serialNumber}</strong></span>
                  <span>Hospital: <strong className="text-white">{p.labName}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. PM EXECUTION MODAL */}
      {/* ------------------------------------------------------------------ */}
      {executingPm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCompletePm}
            className="bg-[#15253F] border border-[#2B3D5B] rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#2B3D5B] pb-2.5">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  Preventive Maintenance Checklist
                </h3>
                <p className="text-[10px] text-blue-300 font-mono mt-0.5">
                  {executingPm.analyzerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExecutingPm(null)}
                className="p-1 rounded-full text-[#A3B3D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E1738] border border-[#1E2B58] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pmChecks.lampCheck}
                  onChange={e => setPmChecks({ ...pmChecks, lampCheck: e.target.checked })}
                  className="rounded text-blue-500"
                />
                <span className="text-[11px] text-white">Photometer Lamp Voltage Calibration (12V)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E1738] border border-[#1E2B58] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pmChecks.pipetteSeals}
                  onChange={e => setPmChecks({ ...pmChecks, pipetteSeals: e.target.checked })}
                  className="rounded text-blue-500"
                />
                <span className="text-[11px] text-white">Sample/Reagent Pipette Seal Tightness Check</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E1738] border border-[#1E2B58] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pmChecks.fluidicWash}
                  onChange={e => setPmChecks({ ...pmChecks, fluidicWash: e.target.checked })}
                  className="rounded text-blue-500"
                />
                <span className="text-[11px] text-white">Fluidic Wash Station Pressure Flushing</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E1738] border border-[#1E2B58] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pmChecks.chamberTemp}
                  onChange={e => setPmChecks({ ...pmChecks, chamberTemp: e.target.checked })}
                  className="rounded text-blue-500"
                />
                <span className="text-[11px] text-white">Incubation Chamber Thermal Log (37.0°C ± 0.1°C)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#0E1738] border border-[#1E2B58] cursor-pointer">
                <input
                  type="checkbox"
                  checked={pmChecks.zeroOptics}
                  onChange={e => setPmChecks({ ...pmChecks, zeroOptics: e.target.checked })}
                  className="rounded text-blue-500"
                />
                <span className="text-[11px] text-white">Optics Baseline Zero Calibration with DI Water</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExecutingPm(null)}
                className="flex-1 py-2 rounded-xl bg-[#0E1738] text-[#A3B3D6] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPm}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg"
              >
                {isSubmittingPm ? 'Logging...' : 'Sign & Certify PM'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
