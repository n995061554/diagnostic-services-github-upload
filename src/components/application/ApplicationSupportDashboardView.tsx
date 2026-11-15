import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Stethoscope,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
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
  Award,
  Layers,
  Sparkles,
  BookOpen,
  Settings,
  Cpu,
  MapPin,
  ChevronRight,
  X,
  Plus,
  Lock
} from 'lucide-react';

interface ApplicationTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerLabCode: string;
  instrumentName: string;
  instrumentModel: string;
  serialNumber: string;
  assayName: string;
  reagentLotNumber: string;
  ticketCategory: 'ASSAY_PROTOCOL' | 'IQ_OQ_INSTALLATION' | 'TRAINING_CERTIFICATION' | 'QC_CALIBRATION' | 'APPLICATION_DEMO';
  problemDescription: string;
  assignedStaffId: string;
  assignedStaffName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  ticketStatus: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  scheduledVisit: string;
  visitDate?: string;
  installationStatus?: 'SCHEDULED' | 'IQ_COMPLETED' | 'OQ_COMPLETED' | 'HANDOVER_COMPLETE';
  resolutionDetails?: string;
  trainingDetails?: {
    attendeesCount: number;
    topicsCovered: string;
    certificateIssued: boolean;
  };
  completionDate?: string;
  closureApprovedByAdmin?: boolean;
  closureApprovedByName?: string;
  gpsWorkRecord?: {
    lat: number;
    lng: number;
    locationName: string;
  };
  createdAt: string;
}

interface ApplicationSpecialist {
  id: string;
  name: string;
  employeeCode: string;
  specialization: string;
  phone: string;
  dutyStatus: 'ON_DUTY' | 'AT_LAB_VISIT' | 'OFF_DUTY';
  activeTicketsCount: number;
  completedInstallations: number;
  certificationsGranted: number;
  slaComplianceRate: number;
  rating: number;
}

interface ApplicationSupportDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
}

export const ApplicationSupportDashboardView: React.FC<ApplicationSupportDashboardViewProps> = ({
  currentUser,
  currentRole = UserRoleType.OFFICE_ADMIN,
  token,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;
  const isBackOffice = [
    UserRoleType.OFFICE_ADMIN,
    UserRoleType.OFFICE_STAFF,
    UserRoleType.AUTHORIZED_APPROVER
  ].includes(currentRole as UserRoleType) || (currentRole as string) === 'BACK_OFFICE';
  const canScheduleVisits = isSuperAdmin || isBackOffice;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REGISTER' | 'MODULES' | 'STAFF'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState<ApplicationTicket | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    customerName: '',
    customerLabCode: '',
    instrumentName: '',
    instrumentModel: '',
    serialNumber: '',
    assayName: '',
    reagentLotNumber: '',
    ticketCategory: 'APPLICATION_DEMO' as ApplicationTicket['ticketCategory'],
    assignedStaffId: 'u-app-01',
    assignedStaffName: 'Pooja Iyer (Lead Application Specialist)',
    priority: 'MEDIUM' as ApplicationTicket['priority'],
    scheduledVisit: '',
    problemDescription: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenScheduleModal = () => {
    if (!canScheduleVisits) {
      showToast('PERMISSION RESTRICTION: Only Super Admin and authorized Back Office staff can schedule application visits and demos.');
      return;
    }
    setIsScheduleModalOpen(true);
  };

  // Sample Application Support Tickets
  const [tickets, setTickets] = useState<ApplicationTicket[]>([
    {
      id: 'app-tk-01',
      ticketNumber: 'APP-2026-1041',
      customerName: 'Metropolis Diagnostics Lab',
      customerLabCode: 'CUST-MET-101',
      instrumentName: 'cobas c 311 Clinical Chemistry System',
      instrumentModel: 'Roche Diagnostics c 311',
      serialNumber: 'SN-ROC-311-8910',
      assayName: 'HbA1c Gen.3 Whole Blood Protocol',
      reagentLotNumber: 'LOT-HBA1C-4421',
      ticketCategory: 'ASSAY_PROTOCOL',
      problemDescription: 'Assay calibration slope drift on 2-level controls during third reagent reconstitution.',
      assignedStaffId: 'u-app-01',
      assignedStaffName: 'Pooja Iyer (Lead Application Specialist)',
      priority: 'HIGH',
      ticketStatus: 'IN_PROGRESS',
      scheduledVisit: '2026-10-24 14:00',
      visitDate: '2026-10-24 14:15',
      resolutionDetails: 'Recalibrated photometric blank, cleaned sample probe, verified 5-point standard curve.',
      gpsWorkRecord: {
        lat: 19.0760,
        lng: 72.8777,
        locationName: 'Metropolis Navi Mumbai Reference Lab'
      },
      createdAt: '2026-10-23 16:30'
    },
    {
      id: 'app-tk-02',
      ticketNumber: 'APP-2026-1042',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerLabCode: 'CUST-MH-2041',
      instrumentName: 'cobas e 411 Immunoassay Analyzer',
      instrumentModel: 'Roche Diagnostics e 411 Disc System',
      serialNumber: 'SN-ROC-411-6621',
      assayName: 'Elecsys Troponin T hs & NT-proBNP Panel',
      reagentLotNumber: 'LOT-TROP-9081',
      ticketCategory: 'IQ_OQ_INSTALLATION',
      problemDescription: 'New instrument commissioning: Installation Qualification (IQ) and Operational Qualification (OQ).',
      assignedStaffId: 'u-app-01',
      assignedStaffName: 'Pooja Iyer (Lead Application Specialist)',
      priority: 'CRITICAL',
      ticketStatus: 'RESOLVED',
      scheduledVisit: '2026-10-23 10:00',
      visitDate: '2026-10-23 10:10',
      installationStatus: 'OQ_COMPLETED',
      resolutionDetails: 'IQ and OQ protocols validated. Precision tests within 1.4% CV. Handover certificate generated.',
      completionDate: '2026-10-24 11:30',
      closureApprovedByAdmin: true,
      closureApprovedByName: 'Rajesh Sharma (Super Admin)',
      trainingDetails: {
        attendeesCount: 4,
        topicsCovered: 'Daily start-up, reagent cassette loading, ECLIA calibration and Westgard rules.',
        certificateIssued: true
      },
      gpsWorkRecord: {
        lat: 19.1176,
        lng: 72.9060,
        locationName: 'Apex Pathology Powai Installation Suite'
      },
      createdAt: '2026-10-22 09:00'
    },
    {
      id: 'app-tk-03',
      ticketNumber: 'APP-2026-1043',
      customerName: 'Suburban Pathology Centre',
      customerLabCode: 'CUST-SUB-402',
      instrumentName: 'Sysmex XN-550 Automated Hematology Analyzer',
      instrumentModel: 'Sysmex XN Series',
      serialNumber: 'SN-SYS-550-1142',
      assayName: 'Complete Blood Count & 5-Part Differential',
      reagentLotNumber: 'LOT-CELLPACK-3310',
      ticketCategory: 'TRAINING_CERTIFICATION',
      problemDescription: 'Hands-on operator training and certification session for newly inducted biomedical technicians.',
      assignedStaffId: 'u-app-02',
      assignedStaffName: 'Suresh Patil (Application Support Specialist)',
      priority: 'MEDIUM',
      ticketStatus: 'IN_PROGRESS',
      scheduledVisit: '2026-10-24 11:00',
      visitDate: '2026-10-24 11:05',
      trainingDetails: {
        attendeesCount: 6,
        topicsCovered: 'Hematology flag review, clot sensor cleaning, QC Levey-Jennings chart analysis.',
        certificateIssued: false
      },
      gpsWorkRecord: {
        lat: 19.1136,
        lng: 72.8697,
        locationName: 'Suburban Pathology Andheri East'
      },
      createdAt: '2026-10-23 14:00'
    },
    {
      id: 'app-tk-04',
      ticketNumber: 'APP-2026-1044',
      customerName: 'Lifeline Health Diagnostic Centre',
      customerLabCode: 'CUST-THN-801',
      instrumentName: 'Stago Compact Max Coagulation Analyzer',
      instrumentModel: 'Stago Compact Max',
      serialNumber: 'SN-STA-MAX-7714',
      assayName: 'PT/INR & aPTT Clot Detection Reagents',
      reagentLotNumber: 'LOT-NEOPLAST-8890',
      ticketCategory: 'QC_CALIBRATION',
      problemDescription: 'Elevated ISI calibration curve on STA-Neoplastine CI Plus lot transition.',
      assignedStaffId: 'u-app-02',
      assignedStaffName: 'Suresh Patil (Application Support Specialist)',
      priority: 'HIGH',
      ticketStatus: 'NEW',
      scheduledVisit: '2026-10-25 09:30',
      createdAt: '2026-10-24 09:00'
    },
    {
      id: 'app-tk-05',
      ticketNumber: 'APP-2026-1045',
      customerName: 'CarePlus Diagnostics & Research',
      customerLabCode: 'CUST-DOM-301',
      instrumentName: 'bioMérieux VITEK 2 Compact',
      instrumentModel: 'VITEK 2 Automated ID/AST',
      serialNumber: 'SN-VIT-2C-5510',
      assayName: 'Gram Negative Identification & Susceptibility Card (GN/AST)',
      reagentLotNumber: 'LOT-GN04-9912',
      ticketCategory: 'APPLICATION_DEMO',
      problemDescription: 'On-site clinical demonstration for prospective hospital laboratory expansion board.',
      assignedStaffId: 'u-app-01',
      assignedStaffName: 'Pooja Iyer (Lead Application Specialist)',
      priority: 'MEDIUM',
      ticketStatus: 'ASSIGNED',
      scheduledVisit: '2026-10-26 14:00',
      createdAt: '2026-10-24 10:30'
    }
  ]);

  const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // Hydrate live application support tickets from backend API
  useEffect(() => {
    const fetchLiveTickets = async () => {
      try {
        const res = await fetch('/api/v1/application-support/tickets', {
          headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setTickets(prev => {
              const apiTickets: ApplicationTicket[] = json.data.map((t: any, idx: number) => ({
                id: t.id || `app-tk-${idx}`,
                ticketNumber: t.ticketNumber || `APP-2026-${1040 + idx}`,
                customerName: t.customerName || 'Diagnostic Partner Lab',
                customerLabCode: t.customerLabCode || 'CUST-LAB-01',
                instrumentName: t.instrumentName || 'Clinical Analyzer System',
                instrumentModel: t.instrumentModel || 'Automated Benchtop',
                serialNumber: t.serialNumber || 'SN-APP-101',
                assayName: t.assayName || 'Clinical Reagent Assay',
                reagentLotNumber: t.reagentLotNumber || 'LOT-2026-01',
                ticketCategory: t.ticketCategory || 'ASSAY_PROTOCOL',
                problemDescription: t.problemDescription || 'Routine protocol calibration and quality verification.',
                assignedStaffId: t.assignedStaffId || 'u-app-01',
                assignedStaffName: t.assignedStaffName || 'Pooja Iyer (Lead Application Specialist)',
                priority: t.priority || 'MEDIUM',
                ticketStatus: t.ticketStatus || 'IN_PROGRESS',
                scheduledVisit: t.scheduledVisit || '2026-10-24 14:00',
                installationStatus: t.installationStatus,
                resolutionDetails: t.resolutionDetails,
                completionDate: t.completionDate,
                createdAt: t.createdAt || '2026-10-24 10:00'
              }));
              // Merge live API tickets with baseline records so tickets not in backend are preserved
              const apiIds = new Set(apiTickets.map(at => at.id));
              const preserved = prev.filter(p => !apiIds.has(p.id));
              return [...apiTickets, ...preserved];
            });
          }
        }
      } catch (e) {
        // Keep initial state if offline
      }
    };
    fetchLiveTickets();
  }, [effectiveToken]);

  const [specialists, setSpecialists] = useState<ApplicationSpecialist[]>([
    {
      id: 'u-app-01',
      name: 'Pooja Iyer',
      employeeCode: 'EMP-APP-201',
      specialization: 'Biochemistry & ECLIA Immunoassays (Roche Certified)',
      phone: '+91 98203 11884',
      dutyStatus: 'AT_LAB_VISIT',
      activeTicketsCount: 3,
      completedInstallations: 14,
      certificationsGranted: 38,
      slaComplianceRate: 98,
      rating: 4.95
    },
    {
      id: 'u-app-02',
      name: 'Suresh Patil',
      employeeCode: 'EMP-APP-202',
      specialization: 'Automated Hematology & Hemostasis (Sysmex/Stago)',
      phone: '+91 98207 44192',
      dutyStatus: 'ON_DUTY',
      activeTicketsCount: 2,
      completedInstallations: 9,
      certificationsGranted: 24,
      slaComplianceRate: 96,
      rating: 4.88
    }
  ]);

  // Compute 11 KPI Cards
  const kpis = useMemo(() => {
    const totalTickets = tickets.length;
    const newTickets = tickets.filter(t => t.ticketStatus === 'NEW').length;
    const pendingTickets = tickets.filter(t => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.ticketStatus)).length;
    const assignedTickets = tickets.filter(t => t.ticketStatus === 'ASSIGNED').length;
    const inProgress = tickets.filter(t => t.ticketStatus === 'IN_PROGRESS').length;
    const resolvedTickets = tickets.filter(t => t.ticketStatus === 'RESOLVED' || t.ticketStatus === 'CLOSED').length;
    const overdueTickets = tickets.filter(t => t.priority === 'CRITICAL' && t.ticketStatus !== 'CLOSED').length;
    const scheduledInstallations = tickets.filter(t => t.ticketCategory === 'IQ_OQ_INSTALLATION' && t.ticketStatus !== 'CLOSED').length;
    const completedInstallations = tickets.filter(t => t.installationStatus === 'OQ_COMPLETED' || t.installationStatus === 'HANDOVER_COMPLETE').length;
    const trainingSessions = tickets.filter(t => t.ticketCategory === 'TRAINING_CERTIFICATION').length;
    const staffOnDuty = specialists.filter(s => s.dutyStatus !== 'OFF_DUTY').length;

    return {
      totalTickets,
      newTickets,
      pendingTickets,
      assignedTickets,
      inProgress,
      resolvedTickets,
      overdueTickets,
      scheduledInstallations,
      completedInstallations,
      trainingSessions,
      staffOnDuty
    };
  }, [tickets, specialists]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch =
        searchQuery === '' ||
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.instrumentName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.ticketStatus === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || t.ticketCategory === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [tickets, searchQuery, statusFilter, categoryFilter]);

  // Super Admin Ticket Closure Authorization
  const handleSuperAdminCloseTicket = (ticketId: string) => {
    if (!isSuperAdmin) {
      showToast('SECURITY RESTRICTION: Ticket closure approval is strictly restricted to Super Admin.');
      return;
    }

    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
            ...t,
            ticketStatus: 'CLOSED',
            closureApprovedByAdmin: true,
            closureApprovedByName: currentUser?.name || 'Super Admin Approver',
            completionDate: new Date().toISOString().split('T')[0]
          }
          : t
      )
    );
    showToast(`Support Ticket closed and archived with Super Admin sign-off.`);
    setSelectedTicket(null);
  };

  // Schedule Application Visit or Clinical Demo (Super Admin & Authorized Back Office)
  const handleScheduleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canScheduleVisits) {
      showToast('PERMISSION RESTRICTION: Only Super Admin and authorized Back Office can schedule visits.');
      return;
    }
    if (!scheduleForm.customerName.trim() || !scheduleForm.instrumentName.trim()) {
      showToast('Please provide both Customer Name and Instrument Name.');
      return;
    }

    const assignedSpecialist = specialists.find(s => s.id === scheduleForm.assignedStaffId);
    const assignedName = assignedSpecialist ? `${assignedSpecialist.name} (Application Specialist)` : scheduleForm.assignedStaffName;

    const newTicket: ApplicationTicket = {
      id: `app-tk-${Date.now()}`,
      ticketNumber: `APP-2026-${1050 + tickets.length}`,
      customerName: scheduleForm.customerName.trim(),
      customerLabCode: scheduleForm.customerLabCode.trim() || 'CUST-GEN-01',
      instrumentName: scheduleForm.instrumentName.trim(),
      instrumentModel: scheduleForm.instrumentModel.trim() || 'Clinical Chemistry / Analyzer',
      serialNumber: scheduleForm.serialNumber.trim() || 'SN-PENDING',
      assayName: scheduleForm.assayName.trim() || 'Clinical Diagnostics Protocol',
      reagentLotNumber: scheduleForm.reagentLotNumber.trim() || 'LOT-NEW-01',
      ticketCategory: scheduleForm.ticketCategory,
      problemDescription: scheduleForm.problemDescription.trim() || 'Application specialist consultation and demonstration scheduled.',
      assignedStaffId: scheduleForm.assignedStaffId,
      assignedStaffName: assignedName,
      priority: scheduleForm.priority,
      ticketStatus: 'ASSIGNED',
      scheduledVisit: scheduleForm.scheduledVisit || new Date().toISOString().replace('T', ' ').slice(0, 16),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setTickets(prev => [newTicket, ...prev]);
    setIsScheduleModalOpen(false);
    showToast(`Visit/Demo ${newTicket.ticketNumber} scheduled successfully.`);

    // Reset form
    setScheduleForm({
      customerName: '',
      customerLabCode: '',
      instrumentName: '',
      instrumentModel: '',
      serialNumber: '',
      assayName: '',
      reagentLotNumber: '',
      ticketCategory: 'APPLICATION_DEMO',
      assignedStaffId: 'u-app-01',
      assignedStaffName: 'Pooja Iyer (Lead Application Specialist)',
      priority: 'MEDIUM',
      scheduledVisit: '',
      problemDescription: ''
    });
  };

  const getStatusBadge = (status: ApplicationTicket['ticketStatus']) => {
    switch (status) {
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Closed (Approved)</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3" /> Resolved (Pending Closure)</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><Clock className="w-3 h-3 animate-spin" /> In Progress</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><Users className="w-3 h-3" /> Assigned</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><AlertTriangle className="w-3 h-3" /> New Request</span>;
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-teal-500/30 text-teal-300 border border-teal-500/40">
              Department Operations Management
            </span>
            <span className="text-xs text-slate-400">● Clinical Biochemistry, Immunoassays &amp; IQ/OQ</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-7 h-7 text-teal-400" />
            <span>Application Support &amp; Clinical Assay Management Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Assay protocol optimization, instrument installation qualification (IQ/OQ), technician certifications, and clinical validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Application telemetry and instrument logs refreshed.')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Support Logs</span>
          </button>
          {isSuperAdmin && (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Closure Sign-off Authority</span>
            </span>
          )}
          {isBackOffice && !isSuperAdmin && (
            <span className="px-3 py-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Back Office Operations Desk</span>
            </span>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white rounded-xl p-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'OVERVIEW'
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Operational Dashboard &amp; 8 Graphs</span>
        </button>
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'REGISTER'
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Application Support Register ({tickets.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('MODULES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'MODULES'
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Operational Modules &amp; IQ/OQ Protocols</span>
        </button>
        <button
          onClick={() => setActiveTab('STAFF')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'STAFF'
            ? 'bg-teal-700 text-white shadow-xs'
            : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Application Specialists ({specialists.length})</span>
        </button>
      </div>

      {/* 11 Application KPI Summary Cards (Interactive Drill-Down) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Total Support Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ALL'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
          title="Click to view all support tickets"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-teal-700">1. Total Tickets &rarr;</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{kpis.totalTickets}</div>
          <div className="text-[10px] text-slate-400 mt-1">Logged this month</div>
        </div>

        {/* 2. New Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('NEW'); }}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
          title="Click to filter new tickets"
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider group-hover:text-rose-900">2. New Tickets &rarr;</div>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{kpis.newTickets}</div>
          <div className="text-[10px] text-rose-700 mt-1">Awaiting specialist assign</div>
        </div>

        {/* 3. Pending Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('PENDING'); }}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to filter pending tickets"
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider group-hover:text-amber-900">3. Pending Tickets &rarr;</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{kpis.pendingTickets}</div>
          <div className="text-[10px] text-amber-700 mt-1">Active resolution queue</div>
        </div>

        {/* 4. Assigned Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ASSIGNED'); }}
          className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          title="Click to filter assigned tickets"
        >
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider group-hover:text-blue-900">4. Assigned &rarr;</div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">{kpis.assignedTickets}</div>
          <div className="text-[10px] text-blue-700 mt-1">Visit scheduled</div>
        </div>

        {/* 5. In Progress */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('IN_PROGRESS'); }}
          className="bg-white p-4 rounded-xl border border-teal-200 shadow-2xs cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
          title="Click to filter in-progress visits"
        >
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider group-hover:text-teal-900">5. In Progress &rarr;</div>
          <div className="text-2xl font-black text-teal-600 mt-1 font-mono">{kpis.inProgress}</div>
          <div className="text-[10px] text-teal-700 mt-1">On-site at customer lab</div>
        </div>

        {/* 6. Resolved Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('RESOLVED'); }}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to filter resolved tickets"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">6. Resolved &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.resolvedTickets}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Completed &amp; validated</div>
        </div>

        {/* 7. Overdue Tickets */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ALL'); }}
          className="bg-white p-4 rounded-xl border border-rose-300 shadow-2xs cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
          title="Click to inspect overdue SLA tickets"
        >
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider group-hover:text-rose-900">7. Overdue &rarr;</div>
          <div className="text-2xl font-black text-rose-700 mt-1 font-mono">{kpis.overdueTickets}</div>
          <div className="text-[10px] text-rose-800 mt-1">Critical SLA breach flag</div>
        </div>

        {/* 8. Scheduled Installations */}
        <div
          onClick={() => { setActiveTab('MODULES'); }}
          className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group"
          title="Click to inspect IQ/OQ installations"
        >
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider group-hover:text-indigo-900">8. Scheduled IQ/OQ &rarr;</div>
          <div className="text-2xl font-black text-indigo-600 mt-1 font-mono">{kpis.scheduledInstallations}</div>
          <div className="text-[10px] text-indigo-700 mt-1">New instruments booked</div>
        </div>

        {/* 9. Completed Installations */}
        <div
          onClick={() => { setActiveTab('MODULES'); }}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to view certified IQ/OQ handovers"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">9. Completed IQ/OQ &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.completedInstallations}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Certified for clinical use</div>
        </div>

        {/* 10. Training Sessions */}
        <div
          onClick={() => { setActiveTab('MODULES'); }}
          className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
          title="Click to view technician operator workshops"
        >
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider group-hover:text-purple-900">10. Training Sessions &rarr;</div>
          <div className="text-2xl font-black text-purple-600 mt-1 font-mono">{kpis.trainingSessions}</div>
          <div className="text-[10px] text-purple-700 mt-1">Operator workshops</div>
        </div>

        {/* 11. Staff on Duty */}
        <div
          onClick={() => { setActiveTab('STAFF'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
          title="Click to view application specialists"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-teal-700">11. Staff on Duty &rarr;</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">{kpis.staffOnDuty} / {specialists.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Field specialists active</div>
        </div>
      </div>

      {/* TAB 1: OPERATIONAL DASHBOARD & 8 APPLICATION GRAPHS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-700" />
            <span>Application Support Analytics (8 Operational Trends &amp; Graphs)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Graph 1: Daily Ticket Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">1. Daily Ticket Inflow</span>
                <span className="text-[10px] text-teal-700 font-bold font-mono">Today: 5 Logged</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { time: '09h', val: 1 },
                  { time: '11h', val: 3 },
                  { time: '13h', val: 4 },
                  { time: '15h', val: 5 },
                  { time: '17h', val: 2 }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-teal-600 rounded-t-md hover:bg-teal-700" style={{ height: `${(bar.val / 5) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{bar.time}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Peak assay calls occur during mid-day batch runs.</p>
            </div>

            {/* Graph 2: Weekly Ticket Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">2. Weekly Ticket Trends</span>
                <span className="text-[10px] text-blue-600 font-bold">28 Requests</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
                  const h = [60, 80, 95, 75, 90, 40][i];
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{d}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Wednesday has peak reagent calibration calls.</p>
            </div>

            {/* Graph 3: Monthly Ticket Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">3. Monthly Support Volume</span>
                <span className="text-[10px] text-purple-600 font-bold">114 Tickets</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['Jul', 'Aug', 'Sep', 'Oct'].map((m, i) => {
                  const h = [75, 82, 88, 96][i];
                  return (
                    <div key={m} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-purple-500 rounded-t-md hover:bg-purple-600" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{m}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">+14% increase due to 5 new hospital lab onboardings.</p>
            </div>

            {/* Graph 4: Resolved vs Pending Tickets */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">4. Resolved vs Pending</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">82% Closed</span>
              </div>
              <div className="pt-2 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Resolved &amp; Closed</span>
                    <span className="font-bold text-emerald-600">82%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>In Progress</span>
                    <span className="font-bold text-teal-600">12%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>New / Assigned</span>
                    <span className="font-bold text-amber-600">6%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '6%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Graph 5: Employee-wise Ticket Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">5. Specialist Performance</span>
                <span className="text-[10px] text-slate-400">2 Specialists</span>
              </div>
              <div className="space-y-2 text-xs pt-1">
                {specialists.map(s => (
                  <div key={s.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="text-teal-700 font-mono font-bold">{s.slaComplianceRate}% SLA</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: `${s.slaComplianceRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graph 6: Installation Performance (IQ/OQ) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">6. Installation Performance</span>
                <span className="text-[10px] text-emerald-600 font-bold">100% Pass</span>
              </div>
              <div className="h-32 flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-indigo-600 font-mono">14</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">IQ Handover</div>
                </div>
                <div className="h-12 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-600 font-mono">14</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">OQ Certified</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">Zero validation deviations recorded.</p>
            </div>

            {/* Graph 7: Training Activity */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">7. Technician Training</span>
                <span className="text-[10px] text-purple-600 font-bold">62 Certified</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { cat: 'Biochem', count: 24 },
                  { cat: 'Immuno', count: 18 },
                  { cat: 'Hemato', count: 12 },
                  { cat: 'Coag', count: 8 }
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-purple-500 rounded-t-md hover:bg-purple-600" style={{ height: `${(item.count / 24) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 truncate max-w-[45px]">{item.cat}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">62 lab operators trained on SOPs.</p>
            </div>

            {/* Graph 8: Customer-wise Support Activity */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">8. Top Labs by Support Calls</span>
                <span className="text-[10px] text-slate-400">Oct 2026</span>
              </div>
              <div className="space-y-1.5 text-xs pt-1">
                {[
                  { name: 'Metropolis Healthcare', count: 4 },
                  { name: 'Apex Pathology Lab', count: 3 },
                  { name: 'Suburban Diagnostic', count: 2 },
                  { name: 'Lifeline Health', count: 2 }
                ].map((l, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] text-slate-700">
                    <span className="truncate max-w-[150px]">{l.name}</span>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded">{l.count} tickets</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED APPLICATION SUPPORT REGISTER */}
      {activeTab === 'REGISTER' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Support Ticket Register</h2>
              <p className="text-xs text-slate-500">Complete clinical logs, instrument details, scheduled visits, and IQ/OQ status.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ticket #, lab, instrument, assay..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed (Approved)</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="ASSAY_PROTOCOL">Assay Protocol</option>
                <option value="IQ_OQ_INSTALLATION">IQ/OQ Installation</option>
                <option value="TRAINING_CERTIFICATION">Training &amp; Certification</option>
                <option value="QC_CALIBRATION">QC &amp; Calibration</option>
                <option value="APPLICATION_DEMO">Application Demo</option>
              </select>

              {canScheduleVisits && (
                <button
                  type="button"
                  onClick={handleOpenScheduleModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Visit / Demo</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Ticket #</th>
                  <th className="py-3 px-3">Customer / Laboratory</th>
                  <th className="py-3 px-3">Instrument &amp; Assay</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Assigned Specialist</th>
                  <th className="py-3 px-3">Priority / Status</th>
                  <th className="py-3 px-3">Scheduled Visit</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-teal-700">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{t.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.customerLabCode}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{t.instrumentName}</div>
                      <div className="text-[10px] text-teal-700 font-medium">{t.assayName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {t.ticketCategory.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900">{t.assignedStaffName}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                          }`}>
                          {t.priority}
                        </span>
                        {getStatusBadge(t.ticketStatus)}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {t.scheduledVisit}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 transition-colors cursor-pointer"
                        title="View Full Ticket Details & Protocols"
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

      {/* TAB 3: OPERATIONAL MODULES (IQ/OQ, ASSAYS, CERTIFICATIONS) */}
      {activeTab === 'MODULES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Application Operational Modules</h2>
              <p className="text-xs text-slate-500">Standard operating procedures, assay master configurations, IQ/OQ checklists, and certifications.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenScheduleModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Application Visit / Demo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Module 1: IQ/OQ Instrument Installation */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Installation Qualification (IQ/OQ)</h3>
              <p className="text-xs text-slate-500">
                Validated checklists for analyzer unboxing, power/UPS grounding, deionized water purity, temperature control, and precision testing.
              </p>
              <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                <span>14 Active IQ/OQ dossiers certified</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Module 2: Assay Master Configuration */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Assay Protocol &amp; Chemistry Config</h3>
              <p className="text-xs text-slate-500">
                Roche cobas, Sysmex, and Stago application parameters, wavelength filters, reaction times, and calibrator master curves.
              </p>
              <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                <span>124 Certified IVD protocols</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Module 3: Operator Training & Certification */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Technician Training &amp; Certifications</h3>
              <p className="text-xs text-slate-500">
                Structured hands-on laboratory workshops covering sample handling, daily maintenance, calibration, and troubleshooting.
              </p>
              <div className="text-[11px] text-purple-700 font-bold flex items-center gap-1">
                <span>38 Official Certificates Issued</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: APPLICATION SPECIALISTS */}
      {activeTab === 'STAFF' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Biomedical Application Specialists</h2>
              <p className="text-xs text-slate-500">Field specialists certified in clinical biochemistry, ECLIA, automated hematology, and coagulation.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              2 Certified Specialists on Duty
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialists.map(sp => (
              <div key={sp.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{sp.name}</h3>
                    <div className="text-[11px] font-mono text-slate-400">{sp.employeeCode}</div>
                    <div className="text-xs text-teal-800 font-medium mt-0.5">{sp.specialization}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sp.dutyStatus === 'AT_LAB_VISIT'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                    {sp.dutyStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase">Active</div>
                    <div className="font-extrabold font-mono text-slate-900">{sp.activeTicketsCount}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100">
                    <div className="text-[10px] text-indigo-700 uppercase">IQ/OQ</div>
                    <div className="font-extrabold font-mono text-indigo-700">{sp.completedInstallations}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-100">
                    <div className="text-[10px] text-purple-700 uppercase">Certifications</div>
                    <div className="font-extrabold font-mono text-purple-700">{sp.certificationsGranted}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 uppercase">SLA</div>
                    <div className="font-extrabold font-mono text-emerald-700">{sp.slaComplianceRate}%</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Specialist Rating:</span>
                  <span className="font-bold text-amber-600 font-mono">★ {sp.rating} / 5.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: FULL APPLICATION TICKET DOSSIER & PROTOCOL DETAILS */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                  Application Support Ticket Dossier
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
                <div className="font-bold text-slate-700 uppercase text-[10px]">Instrument &amp; Assay</div>
                <div className="font-extrabold text-slate-900">{selectedTicket.instrumentName}</div>
                <div className="text-slate-600 font-mono">Model: {selectedTicket.instrumentModel}</div>
                <div className="text-slate-600 font-mono">Serial: {selectedTicket.serialNumber}</div>
                <div className="text-teal-800 font-bold pt-1">Assay: {selectedTicket.assayName}</div>
                <div className="text-slate-500 font-mono">Reagent Lot: {selectedTicket.reagentLotNumber}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Specialist Assignment</div>
                <div className="font-extrabold text-slate-900">{selectedTicket.assignedStaffName}</div>
                <div className="text-slate-600">Category: {selectedTicket.ticketCategory.replace(/_/g, ' ')}</div>
                <div className="text-slate-600">Priority: {selectedTicket.priority}</div>
                <div className="text-slate-600">Scheduled: {selectedTicket.scheduledVisit}</div>
                {selectedTicket.visitDate && (
                  <div className="text-emerald-700 font-bold">Actual Visit: {selectedTicket.visitDate}</div>
                )}
              </div>
            </div>

            {/* Problem & Clinical Resolution */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
              <div className="font-bold text-slate-800 uppercase text-[10px]">Problem Description</div>
              <p className="text-slate-700 leading-relaxed">{selectedTicket.problemDescription}</p>

              {selectedTicket.resolutionDetails && (
                <div className="pt-2 border-t border-slate-200">
                  <div className="font-bold text-emerald-800 uppercase text-[10px]">Resolution &amp; Protocol Calibration</div>
                  <p className="text-slate-800 font-medium leading-relaxed mt-0.5">{selectedTicket.resolutionDetails}</p>
                </div>
              )}

              {selectedTicket.trainingDetails && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="font-bold text-purple-800 uppercase text-[10px]">Training Workshop Details</div>
                  <div className="text-slate-700">Attendees Trained: <strong>{selectedTicket.trainingDetails.attendeesCount} Operators</strong></div>
                  <div className="text-slate-700">Topics: {selectedTicket.trainingDetails.topicsCovered}</div>
                  <div className="text-emerald-700 font-bold">
                    Certification Status: {selectedTicket.trainingDetails.certificateIssued ? '✓ Certificate Issued & Signed' : 'Pending final quiz review'}
                  </div>
                </div>
              )}
            </div>

            {/* Super Admin Closure Authority Gate */}
            {selectedTicket.ticketStatus === 'RESOLVED' && (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Super Admin Ticket Closure Authorization</span>
                </div>
                <p className="text-slate-600">
                  Per Part 3 &amp; Part 15 rules, ticket resolution requires Super Admin sign-off to formally archive the clinical support dossier.
                </p>
                {isSuperAdmin ? (
                  <button
                    onClick={() => handleSuperAdminCloseTicket(selectedTicket.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize Ticket Closure (Super Admin Sign-off)</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 text-center font-medium">
                    Resolved by specialist. Awaiting Super Admin final closure sign-off.
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
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE APPLICATION VISIT / DEMO (Super Admin & Back Office) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                  {isSuperAdmin ? 'Super Admin Scheduling' : 'Back Office Operations'}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Schedule Application Visit / Demo</h3>
                <p className="text-xs text-slate-500">Book specialist on-site demonstration, IQ/OQ installation, or clinical training.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleVisitSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer / Laboratory Name *</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.customerName}
                    onChange={e => setScheduleForm(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Suburban Diagnostic Center"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Customer Lab Code</label>
                  <input
                    type="text"
                    value={scheduleForm.customerLabCode}
                    onChange={e => setScheduleForm(prev => ({ ...prev, customerLabCode: e.target.value }))}
                    placeholder="e.g. CUST-SUB-501"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Instrument Name *</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.instrumentName}
                    onChange={e => setScheduleForm(prev => ({ ...prev, instrumentName: e.target.value }))}
                    placeholder="e.g. cobas e 411"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={scheduleForm.instrumentModel}
                    onChange={e => setScheduleForm(prev => ({ ...prev, instrumentModel: e.target.value }))}
                    placeholder="e.g. Disc System"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={scheduleForm.serialNumber}
                    onChange={e => setScheduleForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="e.g. SN-411-9021"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assay / Protocol Name</label>
                  <input
                    type="text"
                    value={scheduleForm.assayName}
                    onChange={e => setScheduleForm(prev => ({ ...prev, assayName: e.target.value }))}
                    placeholder="e.g. Elecsys Thyroid / Cardiac Panel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Reagent Lot #</label>
                  <input
                    type="text"
                    value={scheduleForm.reagentLotNumber}
                    onChange={e => setScheduleForm(prev => ({ ...prev, reagentLotNumber: e.target.value }))}
                    placeholder="e.g. LOT-2026-THY-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Visit Category</label>
                  <select
                    value={scheduleForm.ticketCategory}
                    onChange={e => setScheduleForm(prev => ({ ...prev, ticketCategory: e.target.value as any }))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    <option value="APPLICATION_DEMO">Application Demo</option>
                    <option value="ASSAY_PROTOCOL">Assay Protocol</option>
                    <option value="IQ_OQ_INSTALLATION">IQ/OQ Installation</option>
                    <option value="TRAINING_CERTIFICATION">Training &amp; Certification</option>
                    <option value="QC_CALIBRATION">QC &amp; Calibration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={scheduleForm.priority}
                    onChange={e => setScheduleForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Assign Specialist</label>
                  <select
                    value={scheduleForm.assignedStaffId}
                    onChange={e => {
                      const spId = e.target.value;
                      const sp = specialists.find(s => s.id === spId);
                      setScheduleForm(prev => ({
                        ...prev,
                        assignedStaffId: spId,
                        assignedStaffName: sp ? `${sp.name} (${sp.specialization.split(' ')[0]})` : prev.assignedStaffName
                      }));
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    {specialists.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.dutyStatus.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Scheduled Date &amp; Time</label>
                <input
                  type="text"
                  value={scheduleForm.scheduledVisit}
                  onChange={e => setScheduleForm(prev => ({ ...prev, scheduledVisit: e.target.value }))}
                  placeholder="e.g. 2026-10-27 11:00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Visit Scope / Clinical Demonstration Goals</label>
                <textarea
                  rows={3}
                  value={scheduleForm.problemDescription}
                  onChange={e => setScheduleForm(prev => ({ ...prev, problemDescription: e.target.value }))}
                  placeholder="Describe demonstration requirements, clinical parameters to test, or training objectives..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-600 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Schedule Visit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationSupportDashboardView;
