import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Calendar,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Award,
  Package,
  MapPin,
  CheckSquare,
  X,
  Plus,
  AlertCircle
} from 'lucide-react';

interface ServiceTicketRecord {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerLabCode: string;
  instrumentName: string;
  serialNumber: string;
  warrantyStatus: 'IN_WARRANTY' | 'OUT_OF_WARRANTY';
  amcStatus: 'ACTIVE_COMPREHENSIVE' | 'ACTIVE_NON_COMPREHENSIVE' | 'EXPIRED' | 'NOT_APPLICABLE';
  problemDescription: string;
  assignedEngineerId: string;
  assignedEngineerName: string;
  assignedEngineerPhone: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  serviceStatus: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  scheduledVisit: string;
  actualVisit?: string;
  sparePartsUsed?: {
    partNumber: string;
    partName: string;
    quantity: number;
    unitCost: number;
  }[];
  serviceReportNumber?: string;
  customerConfirmed: boolean;
  resolutionDetails?: string;
  closureApprovedByAdmin?: boolean;
  closureApprovedByName?: string;
  slaStatus: 'ON_TRACK' | 'BREACHED';
  createdAt: string;
}

interface AMCContractRecord {
  id: string;
  contractNumber: string;
  customerName: string;
  instrumentName: string;
  serialNumber: string;
  contractType: 'COMPREHENSIVE_AMC' | 'NON_COMPREHENSIVE_AMC' | 'ANNUAL_PM_ONLY';
  startDate: string;
  expiryDate: string;
  renewalStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWAL_IN_PROGRESS';
  annualValue: number;
  pmVisitsIncluded: number;
  pmVisitsCompleted: number;
  breakdownVisitsCovered: string;
  nextScheduledPM: string;
}

interface ServiceEngineerMember {
  id: string;
  name: string;
  employeeCode: string;
  specialization: string;
  phone: string;
  dutyStatus: 'ON_DUTY' | 'ON_SERVICE_VISIT' | 'OFF_DUTY';
  activeTickets: number;
  completedCalls: number;
  pmCompleted: number;
  slaRate: number;
  rating: number;
}

interface ServiceManagementDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
}

export const ServiceManagementDashboardView: React.FC<ServiceManagementDashboardViewProps> = ({
  currentUser,
  currentRole = UserRoleType.OFFICE_ADMIN,
  token,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REGISTER' | 'AMC_CONTRACTS' | 'ENGINEERS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicketRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Service Tickets Seed Data
  const [tickets, setTickets] = useState<ServiceTicketRecord[]>([
    {
      id: 'srv-tk-01',
      ticketNumber: 'SRV-2026-8801',
      customerName: 'Metropolis Diagnostics Lab',
      customerLabCode: 'CUST-MET-101',
      instrumentName: 'cobas c 311 Clinical Chemistry Analyzer',
      serialNumber: 'SN-ROC-311-8910',
      warrantyStatus: 'OUT_OF_WARRANTY',
      amcStatus: 'ACTIVE_COMPREHENSIVE',
      problemDescription: 'Sample syringe fluid leakage and photometer 340nm transmission error during batch calibration.',
      assignedEngineerId: 'u-srv-01',
      assignedEngineerName: 'Ramesh Patel (Senior Service Engineer)',
      assignedEngineerPhone: '+91 98202 55192',
      priority: 'CRITICAL',
      serviceStatus: 'IN_PROGRESS',
      scheduledVisit: '2026-10-24 10:30',
      actualVisit: '2026-10-24 10:45',
      sparePartsUsed: [
        { partNumber: 'SP-SYR-041', partName: 'Hamilton 100uL Precision Plunger Kit', quantity: 1, unitCost: 14500 },
        { partNumber: 'SP-SEAL-88', partName: 'Teflon Fluidic Rotor Seals (Set of 4)', quantity: 1, unitCost: 3200 }
      ],
      serviceReportNumber: 'DSR-MUM-2026-4401',
      customerConfirmed: false,
      resolutionDetails: 'Replaced syringe plunger and pump assembly seals. Photometer calibration within manufacturer specifications.',
      slaStatus: 'ON_TRACK',
      createdAt: '2026-10-24 08:30'
    },
    {
      id: 'srv-tk-02',
      ticketNumber: 'SRV-2026-8802',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerLabCode: 'CUST-MH-2041',
      instrumentName: 'cobas e 411 Disc Immunoassay System',
      serialNumber: 'SN-ROC-411-6621',
      warrantyStatus: 'IN_WARRANTY',
      amcStatus: 'ACTIVE_COMPREHENSIVE',
      problemDescription: 'Quarterly Preventive Maintenance (PM Q3) and measuring cell temperature check.',
      assignedEngineerId: 'u-srv-01',
      assignedEngineerName: 'Ramesh Patel (Senior Service Engineer)',
      assignedEngineerPhone: '+91 98202 55192',
      priority: 'MEDIUM',
      serviceStatus: 'COMPLETED',
      scheduledVisit: '2026-10-23 11:00',
      actualVisit: '2026-10-23 11:10',
      sparePartsUsed: [
        { partNumber: 'SP-PM-KIT-411', partName: 'Roche Official e411 PM 6-Month Filter Kit', quantity: 1, unitCost: 8900 }
      ],
      serviceReportNumber: 'DSR-POW-2026-1192',
      customerConfirmed: true,
      resolutionDetails: 'PM Q3 completed per SOP. Incubator temperature 37.0°C ± 0.1°C verified. Measuring cell optical check passed.',
      closureApprovedByAdmin: true,
      closureApprovedByName: 'Rajesh Sharma (Super Admin)',
      slaStatus: 'ON_TRACK',
      createdAt: '2026-10-22 14:00'
    },
    {
      id: 'srv-tk-03',
      ticketNumber: 'SRV-2026-8803',
      customerName: 'Suburban Pathology Centre',
      customerLabCode: 'CUST-SUB-402',
      instrumentName: 'Sysmex XN-550 Automated Hematology Analyzer',
      serialNumber: 'SN-SYS-550-1142',
      warrantyStatus: 'OUT_OF_WARRANTY',
      amcStatus: 'ACTIVE_NON_COMPREHENSIVE',
      problemDescription: 'Pneumatic aspirator pump pressure fluctuating between 0.35 bar and 0.48 bar.',
      assignedEngineerId: 'u-srv-02',
      assignedEngineerName: 'Amit Verma (Field Service Engineer)',
      assignedEngineerPhone: '+91 98208 77610',
      priority: 'HIGH',
      serviceStatus: 'ASSIGNED',
      scheduledVisit: '2026-10-25 10:00',
      customerConfirmed: false,
      slaStatus: 'ON_TRACK',
      createdAt: '2026-10-24 11:15'
    },
    {
      id: 'srv-tk-04',
      ticketNumber: 'SRV-2026-8804',
      customerName: 'Lifeline Health Diagnostic Centre',
      customerLabCode: 'CUST-THN-801',
      instrumentName: 'Stago Compact Max Coagulation System',
      serialNumber: 'SN-STA-MAX-7714',
      warrantyStatus: 'OUT_OF_WARRANTY',
      amcStatus: 'EXPIRED',
      problemDescription: 'Optical detection channel #3 reading fluctuating baselines. AMC expired on 30 Sep 2026.',
      assignedEngineerId: 'u-srv-02',
      assignedEngineerName: 'Amit Verma (Field Service Engineer)',
      assignedEngineerPhone: '+91 98208 77610',
      priority: 'HIGH',
      serviceStatus: 'NEW',
      scheduledVisit: '2026-10-25 14:30',
      customerConfirmed: false,
      slaStatus: 'ON_TRACK',
      createdAt: '2026-10-24 13:00'
    }
  ]);

  const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // Hydrate live service tickets from backend API
  useEffect(() => {
    const fetchLiveService = async () => {
      try {
        const res = await fetch('/api/v1/service/summary-records', {
          headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.tickets && Array.isArray(json.data.tickets) && json.data.tickets.length > 0) {
            setTickets(prev => {
              const apiTickets: ServiceTicketRecord[] = json.data.tickets.map((t: any, idx: number) => ({
                id: t.id || `srv-tk-api-${idx}`,
                ticketNumber: t.ticketNumber || `SRV-2026-${8800 + idx}`,
                customerName: t.customerName || 'Diagnostic Partner Lab',
                customerLabCode: t.customerId || 'CUST-01',
                instrumentName: t.equipmentName || 'Biomedical Analyzer System',
                serialNumber: t.serialNumber || 'SN-ROC-8800',
                warrantyStatus: t.warrantyStatus || 'IN_WARRANTY',
                amcStatus: t.amcStatus || 'ACTIVE_COMPREHENSIVE',
                problemDescription: t.description || 'Routine calibration and preventive maintenance inspection.',
                assignedEngineerId: t.assignedTo || 'u-srv-01',
                assignedEngineerName: t.assignedToName || 'Ramesh Patel (Senior Service Engineer)',
                assignedEngineerPhone: '+91 98202 55192',
                priority: t.priority || 'MEDIUM',
                serviceStatus: t.status || 'IN_PROGRESS',
                scheduledVisit: t.scheduledDate || '2026-10-24 11:00',
                actualVisit: t.actualVisit,
                sparePartsUsed: t.sparePartsUsed || [],
                serviceReportNumber: t.reportNumber,
                customerConfirmed: !!t.customerConfirmed,
                resolutionDetails: t.resolutionDetails,
                closureApprovedByAdmin: !!t.closureApprovedByAdmin,
                closureApprovedByName: t.closureApprovedByName,
                slaStatus: 'ON_TRACK',
                createdAt: t.createdAt || '2026-10-24 09:00'
              }));
              return apiTickets;
            });
          }
        }
      } catch (e) {
        // Keep initial state if offline
      }
    };
    fetchLiveService();
  }, [effectiveToken]);

  // AMC Contracts Seed Data
  const [amcContracts, setAmcContracts] = useState<AMCContractRecord[]>([
    {
      id: 'amc-01',
      contractNumber: 'AMC-2026-MH-01',
      customerName: 'Metropolis Diagnostics Lab',
      instrumentName: 'cobas c 311 Clinical Chemistry Analyzer',
      serialNumber: 'SN-ROC-311-8910',
      contractType: 'COMPREHENSIVE_AMC',
      startDate: '2026-04-01',
      expiryDate: '2027-03-31',
      renewalStatus: 'ACTIVE',
      annualValue: 185000,
      pmVisitsIncluded: 4,
      pmVisitsCompleted: 2,
      breakdownVisitsCovered: 'Unlimited (Includes Spares)',
      nextScheduledPM: '2026-12-15'
    },
    {
      id: 'amc-02',
      contractNumber: 'AMC-2026-AP-02',
      customerName: 'Apex Clinical & Pathology Laboratories',
      instrumentName: 'cobas e 411 Disc Immunoassay System',
      serialNumber: 'SN-ROC-411-6621',
      contractType: 'COMPREHENSIVE_AMC',
      startDate: '2025-11-01',
      expiryDate: '2026-10-31',
      renewalStatus: 'EXPIRING_SOON',
      annualValue: 245000,
      pmVisitsIncluded: 4,
      pmVisitsCompleted: 4,
      breakdownVisitsCovered: 'Unlimited (Includes Spares)',
      nextScheduledPM: '2026-11-20 (Post-Renewal)'
    },
    {
      id: 'amc-03',
      contractNumber: 'AMC-2026-SB-03',
      customerName: 'Suburban Pathology Centre',
      instrumentName: 'Sysmex XN-550 Automated Hematology Analyzer',
      serialNumber: 'SN-SYS-550-1142',
      contractType: 'NON_COMPREHENSIVE_AMC',
      startDate: '2026-01-01',
      expiryDate: '2026-12-31',
      renewalStatus: 'ACTIVE',
      annualValue: 95000,
      pmVisitsIncluded: 4,
      pmVisitsCompleted: 3,
      breakdownVisitsCovered: 'Labor Only (Spares Chargeable)',
      nextScheduledPM: '2026-11-10'
    },
    {
      id: 'amc-04',
      contractNumber: 'AMC-2025-LL-04',
      customerName: 'Lifeline Health Diagnostic Centre',
      instrumentName: 'Stago Compact Max Coagulation System',
      serialNumber: 'SN-STA-MAX-7714',
      contractType: 'COMPREHENSIVE_AMC',
      startDate: '2025-10-01',
      expiryDate: '2026-09-30',
      renewalStatus: 'EXPIRED',
      annualValue: 140000,
      pmVisitsIncluded: 4,
      pmVisitsCompleted: 4,
      breakdownVisitsCovered: 'Contract Expired',
      nextScheduledPM: 'Renewal Pending Quotation'
    }
  ]);

  const [engineers, setEngineers] = useState<ServiceEngineerMember[]>([
    {
      id: 'u-srv-01',
      name: 'Ramesh Patel',
      employeeCode: 'EMP-SRV-301',
      specialization: 'Roche cobas c311 / e411 Certified Master Specialist',
      phone: '+91 98202 55192',
      dutyStatus: 'ON_SERVICE_VISIT',
      activeTickets: 2,
      completedCalls: 18,
      pmCompleted: 24,
      slaRate: 98,
      rating: 4.95
    },
    {
      id: 'u-srv-02',
      name: 'Amit Verma',
      employeeCode: 'EMP-SRV-302',
      specialization: 'Automated Hematology & Coagulation Specialist',
      phone: '+91 98208 77610',
      dutyStatus: 'ON_DUTY',
      activeTickets: 2,
      completedCalls: 14,
      pmCompleted: 18,
      slaRate: 95,
      rating: 4.88
    }
  ]);

  // Compute 11 Service KPI Cards
  const kpis = useMemo(() => {
    const totalServiceTickets = tickets.length;
    const newServiceRequests = tickets.filter(t => t.serviceStatus === 'NEW').length;
    const pendingServiceCalls = tickets.filter(t => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.serviceStatus)).length;
    const assignedCalls = tickets.filter(t => t.serviceStatus === 'ASSIGNED').length;
    const inProgress = tickets.filter(t => t.serviceStatus === 'IN_PROGRESS').length;
    const completedCalls = tickets.filter(t => t.serviceStatus === 'COMPLETED' || t.serviceStatus === 'CLOSED').length;
    const overdueCalls = tickets.filter(t => t.slaStatus === 'BREACHED').length;
    const pmDue = amcContracts.filter(a => a.pmVisitsCompleted < a.pmVisitsIncluded).length;
    const amcActive = amcContracts.filter(a => a.renewalStatus === 'ACTIVE' || a.renewalStatus === 'EXPIRING_SOON').length;
    const amcExpiring = amcContracts.filter(a => a.renewalStatus === 'EXPIRING_SOON').length;
    const serviceStaffOnDuty = engineers.filter(e => e.dutyStatus !== 'OFF_DUTY').length;

    return {
      totalServiceTickets,
      newServiceRequests,
      pendingServiceCalls,
      assignedCalls,
      inProgress,
      completedCalls,
      overdueCalls,
      pmDue,
      amcActive,
      amcExpiring,
      serviceStaffOnDuty
    };
  }, [tickets, amcContracts, engineers]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch =
        searchQuery === '' ||
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.instrumentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.serviceStatus === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  // Super Admin Ticket Closure Authorization
  const handleSuperAdminCloseTicket = (ticketId: string) => {
    if (!isSuperAdmin) {
      showToast('SECURITY RESTRICTION: Ticket closure sign-off is reserved strictly for Super Admin.');
      return;
    }

    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
              ...t,
              serviceStatus: 'CLOSED',
              closureApprovedByAdmin: true,
              closureApprovedByName: currentUser?.name || 'Super Admin Sign-off'
            }
          : t
      )
    );
    showToast(`Service ticket closed and archived with Super Admin sign-off.`);
    setSelectedTicket(null);
  };

  const getStatusBadge = (status: ServiceTicketRecord['serviceStatus']) => {
    switch (status) {
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Closed (Approved)</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3" /> Completed (Pending Sign-off)</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><Clock className="w-3 h-3 animate-spin" /> In Progress</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><Users className="w-3 h-3" /> Assigned</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><AlertTriangle className="w-3 h-3" /> New Call</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-3.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/30 text-amber-300 border border-amber-500/40">
              Department Operations Management
            </span>
            <span className="text-xs text-slate-400">● Biomedical Engineering &amp; Preventive Maintenance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-amber-400" />
            <span>Service &amp; AMC Management Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Biomedical engineering call desk, spare parts inventory consumption, Daily Service Reports (DSR), and AMC lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Service telemetry, PM alerts, and engineer work queues synchronized.')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Engineering</span>
          </button>
          {isSuperAdmin && (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Super Admin Authority</span>
            </span>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white rounded-xl p-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Operational Dashboard &amp; 8 Graphs</span>
        </button>
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'REGISTER'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Detailed Service Register ({tickets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('AMC_CONTRACTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'AMC_CONTRACTS'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>AMC Contracts Register ({amcContracts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('ENGINEERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ENGINEERS'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Field Engineers ({engineers.length})</span>
        </button>
      </div>

      {/* 11 Service KPI Summary Cards (Interactive Drill-Down) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Service Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ALL'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to inspect all service tickets"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800">1. Total Tickets &rarr;</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{kpis.totalServiceTickets}</div>
          <div className="text-[10px] text-slate-400 mt-1">Logged calls</div>
        </div>

        {/* 2. New Service Requests */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('NEW'); }}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
          title="Click to filter new requests"
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider group-hover:text-rose-900">2. New Requests &rarr;</div>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{kpis.newServiceRequests}</div>
          <div className="text-[10px] text-rose-700 mt-1">Awaiting dispatch</div>
        </div>

        {/* 3. Pending Service Calls */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('PENDING'); }}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to filter pending calls"
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider group-hover:text-amber-900">3. Pending Calls &rarr;</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{kpis.pendingServiceCalls}</div>
          <div className="text-[10px] text-amber-700 mt-1">Active resolution queue</div>
        </div>

        {/* 4. Assigned Calls */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ASSIGNED'); }}
          className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          title="Click to filter assigned calls"
        >
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider group-hover:text-blue-900">4. Assigned Calls &rarr;</div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">{kpis.assignedCalls}</div>
          <div className="text-[10px] text-blue-700 mt-1">Visit scheduled</div>
        </div>

        {/* 5. In Progress */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('IN_PROGRESS'); }}
          className="bg-white p-4 rounded-xl border border-teal-200 shadow-2xs cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
          title="Click to filter in-progress calls"
        >
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider group-hover:text-teal-900">5. In Progress &rarr;</div>
          <div className="text-2xl font-black text-teal-600 mt-1 font-mono">{kpis.inProgress}</div>
          <div className="text-[10px] text-teal-700 mt-1">Engineer on-site</div>
        </div>

        {/* 6. Completed Calls */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('COMPLETED'); }}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to filter completed calls"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">6. Completed Calls &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.completedCalls}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Repairs certified</div>
        </div>

        {/* 7. Overdue Calls */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ALL'); }}
          className="bg-white p-4 rounded-xl border border-rose-300 shadow-2xs cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
          title="Click to inspect overdue SLA calls"
        >
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider group-hover:text-rose-900">7. Overdue SLA &rarr;</div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono">{kpis.overdueCalls}</div>
          <div className="text-[10px] text-rose-800 mt-1">Breached response window</div>
        </div>

        {/* 8. Preventive Maintenance Due */}
        <div
          onClick={() => { setActiveTab('AMC_CONTRACTS'); }}
          className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
          title="Click to view PM schedules and AMC contracts"
        >
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider group-hover:text-indigo-900">8. PM Due (Q3/Q4) &rarr;</div>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">{kpis.pmDue}</div>
          <div className="text-[10px] text-indigo-700 mt-1">Scheduled service</div>
        </div>

        {/* 9. AMC Active */}
        <div
          onClick={() => { setActiveTab('AMC_CONTRACTS'); }}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to inspect active AMC contracts"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">9. Active AMC &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.amcActive}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Contracts running</div>
        </div>

        {/* 10. AMC Expiring */}
        <div
          onClick={() => { setActiveTab('AMC_CONTRACTS'); }}
          className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to view expiring AMC contracts"
        >
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider group-hover:text-amber-900">10. AMC Expiring &rarr;</div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{kpis.amcExpiring}</div>
          <div className="text-[10px] text-amber-800 mt-1">Expiring within 30 days</div>
        </div>

        {/* 11. Service Staff on Duty */}
        <div
          onClick={() => { setActiveTab('ENGINEERS'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1 cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to inspect field engineers"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-800">11. Staff on Duty &rarr;</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">{kpis.serviceStaffOnDuty} / {engineers.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Field engineers logged in</div>
        </div>
      </div>

      {/* TAB 1: OPERATIONAL DASHBOARD & 8 SERVICE GRAPHS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>Service &amp; Maintenance Analytics (8 Operational Graphs)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Graph 1: Daily Service Calls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">1. Daily Service Calls</span>
                <span className="text-[10px] text-amber-700 font-bold font-mono">4 Calls Today</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { hour: '09h', val: 1 },
                  { hour: '11h', val: 3 },
                  { hour: '13h', val: 4 },
                  { hour: '15h', val: 2 },
                  { hour: '17h', val: 1 }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-amber-500 rounded-t-md hover:bg-amber-600" style={{ height: `${(bar.val / 4) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{bar.hour}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Fastest response times logged in morning shift.</p>
            </div>

            {/* Graph 2: Weekly Service Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">2. Weekly Call Volume</span>
                <span className="text-[10px] text-blue-600 font-bold font-mono">22 Completed</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                  const h = [70, 85, 90, 80, 95, 50][i];
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{d}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Friday peak in scheduled weekend PMs.</p>
            </div>

            {/* Graph 3: Monthly Service Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">3. Monthly Service Calls</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">86 Resolved</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['Jul', 'Aug', 'Sep', 'Oct'].map((m, i) => {
                  const h = [65, 75, 82, 86][i];
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-600" style={{ height: `${(h / 90) * 100}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{m}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Resolution SLA compliance: 96.8% in October.</p>
            </div>

            {/* Graph 4: Pending vs Completed Calls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">4. Pending vs Completed</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">75% Resolved</span>
              </div>
              <div className="h-32 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-600 font-mono">{kpis.completedCalls}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Completed</div>
                </div>
                <div className="h-16 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-3xl font-black text-amber-600 font-mono">{kpis.pendingServiceCalls}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Pending</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">First-time fix rate: 89%</p>
            </div>

            {/* Graph 5: Employee-wise Service Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">5. Engineer Performance</span>
                <span className="text-[10px] text-slate-400">2 Field Engineers</span>
              </div>
              <div className="space-y-2 text-xs pt-1">
                {engineers.map(eng => (
                  <div key={eng.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{eng.name}</span>
                      <span className="text-amber-700 font-mono font-bold">{eng.slaRate}% SLA</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${eng.slaRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graph 6: Preventive Maintenance Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">6. Preventive Maintenance (PM)</span>
                <span className="text-[10px] text-indigo-600 font-bold">42 Completed YTD</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { q: 'Q1', val: 12 },
                  { q: 'Q2', val: 14 },
                  { q: 'Q3', val: 16 },
                  { q: 'Q4', val: 6 }
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600" style={{ height: `${(item.val / 16) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{item.q}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Q3 target exceeded by 2 comprehensive PMs.</p>
            </div>

            {/* Graph 7: AMC Expiry Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">7. AMC Renewal Timeline</span>
                <span className="text-[10px] text-amber-700 font-bold font-mono">₹6.65L Under Contract</span>
              </div>
              <div className="pt-1 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Active Contracts</span>
                  <span className="font-bold text-emerald-700 font-mono">2 Contracts</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Expiring in 30 Days</span>
                  <span className="font-bold text-amber-700 font-mono">1 (Apex Lab)</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Expired / Pending Quote</span>
                  <span className="font-bold text-rose-700 font-mono">1 (Lifeline)</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-100">Automated 30-day renewal quotations queued.</p>
            </div>

            {/* Graph 8: Customer-wise Service Activity */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">8. Breakdown Calls by Lab</span>
                <span className="text-[10px] text-slate-400">YTD</span>
              </div>
              <div className="space-y-1.5 text-xs pt-1">
                {[
                  { name: 'Metropolis Diagnostics', calls: 3 },
                  { name: 'Apex Pathology Lab', calls: 2 },
                  { name: 'Suburban Diagnostic', calls: 1 },
                  { name: 'Lifeline Health', calls: 1 }
                ].map((l, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] text-slate-700">
                    <span className="truncate max-w-[150px]">{l.name}</span>
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded">{l.calls} calls</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED SERVICE REGISTER */}
      {activeTab === 'REGISTER' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Biomedical Engineering Service Call Register</h2>
              <p className="text-xs text-slate-500">Every ticket includes instrument serial #, warranty/AMC status, spare parts used, DSR report, and customer sign-off.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ticket #, lab, instrument, serial..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed (Approved)</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Ticket #</th>
                  <th className="py-3 px-3">Customer / Laboratory</th>
                  <th className="py-3 px-3">Instrument &amp; Serial #</th>
                  <th className="py-3 px-3">Contract Standing</th>
                  <th className="py-3 px-3">Assigned Engineer</th>
                  <th className="py-3 px-3">Priority / Status</th>
                  <th className="py-3 px-3">DSR / Spares</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(tk => (
                  <tr key={tk.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-700">
                      {tk.ticketNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{tk.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tk.customerLabCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{tk.instrumentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SN: {tk.serialNumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          tk.warrantyStatus === 'IN_WARRANTY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tk.warrantyStatus.replace('_', ' ')}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          tk.amcStatus.startsWith('ACTIVE')
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tk.amcStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">{tk.assignedEngineerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tk.assignedEngineerPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          tk.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : tk.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {tk.priority}
                        </span>
                        {getStatusBadge(tk.serviceStatus)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {tk.serviceReportNumber ? (
                        <div>
                          <div className="font-mono text-emerald-700 font-bold">{tk.serviceReportNumber}</div>
                          <span className="text-[10px] text-slate-500">
                            {tk.sparePartsUsed ? `${tk.sparePartsUsed.length} Spares Used` : 'No Spares'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">DSR Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedTicket(tk)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 transition-colors cursor-pointer"
                        title="View Full Service Dossier, Spares & DSR"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AMC CONTRACTS REGISTER & PREVENTIVE MAINTENANCE SCHEDULE */}
      {activeTab === 'AMC_CONTRACTS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Annual Maintenance Contracts (AMC) Master Register</h2>
              <p className="text-xs text-slate-500">Contract start/expiry dates, renewal status, PM schedules, and maintenance history.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              Total Contract Portfolio: ₹{formatINR(amcContracts.reduce((sum, a) => sum + a.annualValue, 0))}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amcContracts.map(amc => (
              <div key={amc.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-700">{amc.contractNumber}</span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{amc.customerName}</h3>
                    <p className="text-slate-500 font-mono text-[11px]">{amc.instrumentName} (SN: {amc.serialNumber})</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    amc.renewalStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : amc.renewalStatus === 'EXPIRING_SOON'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {amc.renewalStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white border border-slate-200 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Contract Type</span>
                    <span className="font-bold text-slate-900">{amc.contractType.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Annual Contract Value</span>
                    <span className="font-mono font-black text-emerald-600">₹{formatINR(amc.annualValue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Validity Period</span>
                    <span className="font-mono text-[11px]">{amc.startDate} ➔ {amc.expiryDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">PM Progress</span>
                    <span className="font-mono font-bold text-indigo-700">{amc.pmVisitsCompleted} of {amc.pmVisitsIncluded} Done</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>Next Scheduled PM: <strong>{amc.nextScheduledPM}</strong></span>
                  <span className="text-slate-400">{amc.breakdownVisitsCovered}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FIELD SERVICE ENGINEERS */}
      {activeTab === 'ENGINEERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Biomedical Field Service Engineers</h2>
              <p className="text-xs text-slate-500">Service engineers on duty, active service calls, preventive maintenance completed, and SLA compliance.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              2 Certified Engineers Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engineers.map(eng => (
              <div key={eng.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{eng.name}</h3>
                    <div className="text-[11px] font-mono text-slate-400">{eng.employeeCode} • {eng.phone}</div>
                    <div className="text-xs text-amber-800 font-medium mt-0.5">{eng.specialization}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    eng.dutyStatus === 'ON_SERVICE_VISIT'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {eng.dutyStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase">Active</div>
                    <div className="font-extrabold font-mono text-slate-900">{eng.activeTickets}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 uppercase">Done</div>
                    <div className="font-extrabold font-mono text-emerald-700">{eng.completedCalls}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <div className="text-[10px] text-indigo-700 uppercase">PM Visits</div>
                    <div className="font-extrabold font-mono text-indigo-700">{eng.pmCompleted}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-teal-50 border border-teal-100">
                    <div className="text-[10px] text-teal-700 uppercase">SLA</div>
                    <div className="font-extrabold font-mono text-teal-700">{eng.slaRate}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Service Rating:</span>
                  <span className="font-bold text-amber-600 font-mono">★ {eng.rating} / 5.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: FULL SERVICE DOSSIER & DSR DETAILS */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  Biomedical Service Dossier
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedTicket.ticketNumber}</h3>
                <p className="text-xs text-slate-500">{selectedTicket.customerName} ({selectedTicket.customerLabCode})</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Instrument &amp; Warranty</div>
                <div className="font-extrabold text-slate-900">{selectedTicket.instrumentName}</div>
                <div className="text-slate-600 font-mono">Serial #: {selectedTicket.serialNumber}</div>
                <div className="text-slate-600">Warranty: {selectedTicket.warrantyStatus.replace('_', ' ')}</div>
                <div className="text-slate-600">AMC Standing: {selectedTicket.amcStatus.replace(/_/g, ' ')}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Engineer &amp; Scheduling</div>
                <div className="font-extrabold text-slate-900">{selectedTicket.assignedEngineerName}</div>
                <div className="text-slate-600">Phone: {selectedTicket.assignedEngineerPhone}</div>
                <div className="text-slate-600">Scheduled: {selectedTicket.scheduledVisit}</div>
                {selectedTicket.actualVisit && (
                  <div className="text-emerald-700 font-bold">Actual Arrival: {selectedTicket.actualVisit}</div>
                )}
              </div>
            </div>

            {/* Problem & Resolution */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
              <div className="font-bold text-slate-800 uppercase text-[10px]">Breakdown Symptom</div>
              <p className="text-slate-700 leading-relaxed">{selectedTicket.problemDescription}</p>

              {selectedTicket.resolutionDetails && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="font-bold text-emerald-800 uppercase text-[10px]">Service Engineering Resolution</div>
                  <p className="text-slate-800 font-medium leading-relaxed mt-0.5">{selectedTicket.resolutionDetails}</p>
                </div>
              )}
            </div>

            {/* Spare Parts Consumed */}
            {selectedTicket.sparePartsUsed && selectedTicket.sparePartsUsed.length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="font-bold text-slate-900 uppercase text-[10px]">Spare Parts Consumed &amp; Invoiced</div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                      <th className="pb-1">Part #</th>
                      <th className="pb-1">Description</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTicket.sparePartsUsed.map((p, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-mono text-slate-700">{p.partNumber}</td>
                        <td className="py-1.5 font-medium text-slate-900">{p.partName}</td>
                        <td className="py-1.5 text-center font-mono">{p.quantity}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-slate-900">₹{formatINR(p.unitCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Super Admin Closure Authority Gate */}
            {selectedTicket.serviceStatus === 'COMPLETED' && (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Super Admin Service Closure Sign-off Gate</span>
                </div>
                <p className="text-slate-600">
                  Per Part 3.3 &amp; Part 15 rules, service engineer completion requires Super Admin sign-off to finalize the DSR and customer warranty ledger.
                </p>
                {isSuperAdmin ? (
                  <button
                    onClick={() => handleSuperAdminCloseTicket(selectedTicket.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Service Closure &amp; Archive DSR</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 text-center font-medium">
                    Repairs completed by engineer. Awaiting Super Admin final closure sign-off.
                  </div>
                )}
              </div>
            )}

            {selectedTicket.closureApprovedByAdmin && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Closed with Super Admin Authorization</span>
                <span className="font-bold text-slate-900 font-mono">{selectedTicket.closureApprovedByName}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagementDashboardView;
