import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserRoleType, 
  EquipmentCoverageState, 
  PmFrequencyType, 
  PmWorkOrderStatus,
  PmChecklistCategory,
  PmChecklistItemResult,
  CoverageRecord,
  PmWorkOrder,
  PmChecklistTemplate,
  EngineerQualification,
  EquipmentTimelineEvent,
  ComprehensiveEquipmentDetail,
  PmAdminDashboardMetrics
} from '../types';
import {
  Wrench,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  FileCheck,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  Info,
  ChevronRight,
  Building2,
  Cpu,
  Zap,
  Gauge,
  Thermometer,
  Eye,
  Sliders,
  Check,
  X,
  FileText,
  UserCheck,
  Layers,
  History,
  AlertCircle,
  HelpCircle,
  Wifi,
  WifiOff,
  CloudOff
} from 'lucide-react';

interface PreventiveMaintenanceViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
}

export const PreventiveMaintenanceView: React.FC<PreventiveMaintenanceViewProps> = ({
  accessToken,
  currentRole,
}) => {
  // Navigation & Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'FLEET_EQUIPMENT' | 'PM_WORK_ORDERS' | 'SCHEDULE_ENGINE' | 'COVERAGE_CONTRACTS' | 'CHECKLIST_TEMPLATES'>('FLEET_EQUIPMENT');
  
  // Data States
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [workOrdersList, setWorkOrdersList] = useState<any[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [engineersList, setEngineersList] = useState<any[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCoverage, setFilterCoverage] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] = useState<any | null>(null);
  const [equipmentDrawerTab, setEquipmentDrawerTab] = useState<'OVERVIEW' | 'HEALTH' | 'COVERAGE_HISTORY' | 'TIMELINE' | 'WORK_ORDERS'>('OVERVIEW');
  const [activeChecklistModalWo, setActiveChecklistModalWo] = useState<any | null>(null);
  const [checklistValues, setChecklistValues] = useState<Record<string, { result: string; reading?: string; notes?: string }>>({});
  const [engineerNotesDraft, setEngineerNotesDraft] = useState<string>('');
  const [customerSignatoryDraft, setCustomerSignatoryDraft] = useState<string>('Dr. Rajesh Kulkarni');
  const [newCoverageModalEq, setNewCoverageModalEq] = useState<any | null>(null);
  const [newCoverageForm, setNewCoverageForm] = useState({
    coverageType: 'AMC',
    provider: 'A2Z Diagnostics Authorized Service Network',
    contractNumber: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    coveredServices: '4x Scheduled PM Visits, Unlimited Emergency Breakdown Visits, NABL Calibration',
    coveredParts: 'Labor Free, 50% Optical Lamp Discount, Free Silicone Tubing',
    exclusions: 'Main Motherboard, Physical Drop Damage'
  });
  const [offlineModeSimulated, setOfflineModeSimulated] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Fetch Core PM Data from Backend
  const fetchAllPmData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      
      const [eqRes, woRes, tmplRes, engRes, metricsRes] = await Promise.all([
        fetch('/api/v1/pm/equipment', { headers }),
        fetch('/api/v1/pm/work-orders', { headers }),
        fetch('/api/v1/pm/templates', { headers }),
        fetch('/api/v1/pm/engineers', { headers }),
        fetch('/api/v1/pm/metrics/admin', { headers })
      ]);

      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(eqData.data || []);
      }
      if (woRes.ok) {
        const woData = await woRes.json();
        setWorkOrdersList(woData.data || []);
      }
      if (tmplRes.ok) {
        const tmplData = await tmplRes.json();
        setTemplatesList(tmplData.data || []);
      }
      if (engRes.ok) {
        const engData = await engRes.json();
        setEngineersList(engData.data || []);
      }
      if (metricsRes.ok) {
        const metData = await metricsRes.json();
        setAdminMetrics(metData.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch PM data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAllPmData();
  }, [fetchAllPmData]);

  // Load single equipment detail
  const openEquipmentDetail = async (eqId: string) => {
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const res = await fetch(`/api/v1/pm/equipment/${eqId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedEquipmentDetail(data.data);
        setEquipmentDrawerTab('OVERVIEW');
      }
    } catch (err) {
      console.error('Failed to load equipment detail:', err);
    }
  };

  // Open checklist execution modal
  const openChecklistModal = (wo: any) => {
    setActiveChecklistModalWo(wo);
    const initialMap: Record<string, { result: string; reading?: string; notes?: string }> = {};
    if (wo.checklistItems) {
      wo.checklistItems.forEach((item: any) => {
        initialMap[item.itemId] = {
          result: item.result || 'NOT_APPLICABLE',
          reading: item.observedReading || '',
          notes: item.engineerNotes || ''
        };
      });
    }
    setChecklistValues(initialMap);
    setEngineerNotesDraft(wo.engineerNotes || 'All preventive maintenance checks executed according to OEM protocols.');
    setCustomerSignatoryDraft(wo.customerSignatoryName || wo.contactPerson || 'Dr. Rajesh Kulkarni');
  };

  // Submit PM Checklist & Completion to Backend
  const handleCompleteWorkOrder = async () => {
    if (!activeChecklistModalWo) return;
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    // Build submitted checklist items
    const submittedItems = (activeChecklistModalWo.checklistItems || []).map((item: any) => {
      const val = checklistValues[item.itemId] || { result: 'PASS' };
      return {
        ...item,
        result: val.result,
        observedReading: val.reading,
        engineerNotes: val.notes
      };
    });

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      };

      const res = await fetch(`/api/v1/pm/work-orders/${activeChecklistModalWo.id}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          checklistItems: submittedItems,
          engineerNotes: engineerNotesDraft,
          customerSignatoryName: customerSignatoryDraft,
          customerSignatureUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          autoCreateTicketForFailures: true
        })
      });

      const resData = await res.json();

      if (res.ok) {
        setActionSuccessMessage(`PM Work Order #${activeChecklistModalWo.pmWorkOrderNumber} completed successfully! Next PM scheduled for ${resData.data.nextWorkOrder?.scheduledDueDate}.`);
        setActiveChecklistModalWo(null);
        fetchAllPmData();
      } else {
        setActionErrorMessage(resData.message || 'Failed to complete PM Work Order. Please check mandatory items.');
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Network error occurred while submitting PM completion.');
    }
  };

  // Batch PM Schedule Generator
  const handleRunScheduleEngine = async () => {
    setIsLoading(true);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      };

      const res = await fetch('/api/v1/pm/work-orders/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ forceAll: false })
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccessMessage(`Maintenance Schedule Engine: ${data.data.generated.length} PM Work Orders scheduled, ${data.data.skipped.length} existing cycles protected.`);
        fetchAllPmData();
      } else {
        setActionErrorMessage(data.message || 'Failed to execute schedule engine');
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Network error executing schedule engine');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Coverage Contract Submit
  const handleAddCoverageContract = async () => {
    if (!newCoverageModalEq) return;
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      };

      const res = await fetch(`/api/v1/pm/equipment/${newCoverageModalEq.id}/coverages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          coverageType: newCoverageForm.coverageType,
          provider: newCoverageForm.provider,
          contractNumber: newCoverageForm.contractNumber || undefined,
          startDate: newCoverageForm.startDate,
          endDate: newCoverageForm.endDate,
          coveredServices: newCoverageForm.coveredServices.split(',').map(s => s.trim()),
          coveredParts: newCoverageForm.coveredParts.split(',').map(s => s.trim()),
          exclusions: newCoverageForm.exclusions.split(',').map(s => s.trim())
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccessMessage(`Coverage Contract #${data.data.contractNumber} successfully registered! Past history preserved.`);
        setNewCoverageModalEq(null);
        fetchAllPmData();
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Failed to register coverage contract');
    }
  };

  // Coverage State Badge Helper
  const renderCoverageBadge = (state: string) => {
    switch (state) {
      case 'UNDER_WARRANTY':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40"><ShieldCheck className="w-3.5 h-3.5 text-[#5F8F4D]" /> Under Warranty</span>;
      case 'WARRANTY_EXPIRING_SOON':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40"><AlertTriangle className="w-3.5 h-3.5 text-[#C58A16] animate-pulse" /> Warranty Expiring Soon</span>;
      case 'WARRANTY_EXPIRED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40"><AlertCircle className="w-3.5 h-3.5 text-[#B94A40]" /> Warranty Expired</span>;
      case 'UNDER_AMC':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40"><ShieldCheck className="w-3.5 h-3.5 text-[#4C8994]" /> Active AMC</span>;
      case 'AMC_EXPIRING_SOON':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40"><Clock className="w-3.5 h-3.5 text-[#C58A16]" /> AMC Expiring Soon</span>;
      case 'AMC_EXPIRED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40"><Clock className="w-3.5 h-3.5 text-[#82917C]" /> AMC Expired</span>;
      case 'UNDER_CMC':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40"><Sparkles className="w-3.5 h-3.5 text-[#5F8F4D]" /> Comprehensive CMC</span>;
      case 'CMC_EXPIRING_SOON':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40"><Clock className="w-3.5 h-3.5 text-[#C58A16]" /> CMC Expiring Soon</span>;
      case 'NO_ACTIVE_COVERAGE':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40"><Info className="w-3.5 h-3.5 text-[#82917C]" /> No Active Coverage</span>;
    }
  };

  // Health Score Badge Helper
  const renderHealthScoreBadge = (score: number, level: string) => {
    let color = 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40';
    let icon = <Activity className="w-3.5 h-3.5 text-[#5F8F4D]" />;
    if (level === 'ATTENTION') {
      color = 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40';
      icon = <Activity className="w-3.5 h-3.5 text-[#4C8994]" />;
    } else if (level === 'AT_RISK') {
      color = 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]/40';
      icon = <AlertTriangle className="w-3.5 h-3.5 text-[#C58A16]" />;
    } else if (level === 'CRITICAL') {
      color = 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]/40';
      icon = <AlertCircle className="w-3.5 h-3.5 text-[#B94A40] animate-pulse" />;
    }

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${color}`}>
        {icon}
        <span>Score {score}/100</span>
        <span className="text-[10px] font-medium opacity-80 uppercase">({level})</span>
      </div>
    );
  };

  // Work Order Status Badge Helper
  const renderWoStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40"><Calendar className="w-3.5 h-3.5 text-[#82917C]" /> Scheduled</span>;
      case 'DUE_SOON':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40"><Clock className="w-3.5 h-3.5 text-[#C58A16]" /> Due Soon (30d)</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40"><UserCheck className="w-3.5 h-3.5 text-[#4C8994]" /> Assigned</span>;
      case 'ACCEPTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E4F1DC] text-[#22381E] border border-[#D2E7C4]"><CheckCircle2 className="w-3.5 h-3.5 text-[#5F8F4D]" /> Accepted</span>;
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40"><Wrench className="w-3.5 h-3.5 text-[#5F8F4D] animate-spin" /> In Progress</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40"><CheckCircle2 className="w-3.5 h-3.5 text-[#5F8F4D]" /> Completed</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40"><FileCheck className="w-3.5 h-3.5 text-[#5F8F4D]" /> Closed & Audited</span>;
      case 'OVERDUE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40"><AlertTriangle className="w-3.5 h-3.5 text-[#B94A40]" /> Overdue</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40">{status}</span>;
    }
  };

  // Filtered equipment
  const filteredEquipment = equipmentList.filter(eq => {
    if (filterCoverage !== 'ALL' && eq.coverageState !== filterCoverage) return false;
    if (filterStatus !== 'ALL' && eq.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        eq.equipmentName?.toLowerCase().includes(q) ||
        eq.modelNumber?.toLowerCase().includes(q) ||
        eq.serialNumber?.toLowerCase().includes(q) ||
        eq.customerLabName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Module Overview & KPI Metrics */}
      <div className="bg-gradient-to-r from-[#1E331B] via-[#22381E] to-[#2E4B29] rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-[#2E4B29]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D2E7C4]/20 text-[#D2E7C4] border border-[#D2E7C4]/30 uppercase tracking-wide">
                Enterprise Maintenance Lifecycle
              </span>
              {offlineModeSimulated ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4DFA3]/20 text-[#F4DFA3] border border-[#F4DFA3]/30 flex items-center gap-1">
                  <CloudOff className="w-3 h-3" /> Offline Draft Mode
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D2E7C4]/20 text-[#D2E7C4] border border-[#D2E7C4]/30 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Live Server Authoritative
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F9FAF6] flex items-center gap-3">
              <Wrench className="w-7 h-7 text-[#D2E7C4]" />
              Preventive Maintenance & Biomedical Equipment Lifecycle
            </h1>
            <p className="text-xs sm:text-sm text-[#E4F1DC]/90 max-w-3xl leading-relaxed">
              Planned maintenance schedule engine, multi-tier warranty/AMC/CMC contract tracking, model-specific NABL calibration checklists, qualified engineer dispatch, explainable health scores, and automated fault ticket escalation.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunScheduleEngine}
              disabled={isLoading}
              className="px-4 py-2.5 bg-[#D2E7C4] hover:bg-[#C3E2B8] text-[#1E331B] rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Run Schedule Engine</span>
            </button>
            <button
              onClick={() => setOfflineModeSimulated(!offlineModeSimulated)}
              className="px-3.5 py-2.5 bg-[#1E331B]/80 hover:bg-[#1E331B] text-[#ECEFE5] rounded-xl text-xs font-medium border border-[#3D5A37] flex items-center gap-2 transition-all cursor-pointer"
            >
              {offlineModeSimulated ? <Wifi className="w-4 h-4 text-[#D2E7C4]" /> : <WifiOff className="w-4 h-4 text-[#F4DFA3]" />}
              <span>{offlineModeSimulated ? 'Switch to Online' : 'Simulate Poor Network'}</span>
            </button>
            <button
              onClick={fetchAllPmData}
              title="Refresh Data"
              className="p-2.5 bg-[#1E331B]/80 hover:bg-[#1E331B] text-[#D2E7C4] rounded-xl border border-[#3D5A37] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* High-Level Executive Metrics Cards */}
        {adminMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#3D5A37]/80">
            <div className="bg-[#1E331B]/60 backdrop-blur-xs p-3.5 rounded-xl border border-[#3D5A37]">
              <span className="text-[11px] text-[#C3E2B8] font-medium block">Total Equipment</span>
              <span className="text-xl font-bold text-white mt-1 block">{adminMetrics.totalEquipment} Units</span>
              <span className="text-[10px] text-[#D2E7C4] font-medium">100% Tracked in Fleet</span>
            </div>
            <div className="bg-[#1E331B]/60 backdrop-blur-xs p-3.5 rounded-xl border border-[#3D5A37]">
              <span className="text-[11px] text-[#C3E2B8] font-medium block">PM Compliance</span>
              <span className="text-xl font-bold text-[#D2E7C4] mt-1 block">{adminMetrics.complianceRate}%</span>
              <span className="text-[10px] text-[#E4F1DC] font-medium">On-Time Execution</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xs p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium block">PM Due Soon (30d)</span>
              <span className="text-xl font-bold text-amber-300 mt-1 block">{adminMetrics.dueSoonCount} Jobs</span>
              <span className="text-[10px] text-amber-400/80 font-medium">Reminder Window Open</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xs p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium block">PM Overdue</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">{adminMetrics.overdueCount} Jobs</span>
              <span className="text-[10px] text-rose-400/80 font-medium">Immediate Action</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xs p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium block">Expiring Contracts</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{adminMetrics.expiringCoverageCount} Expiring</span>
              <span className="text-[10px] text-slate-400 font-medium">Warranty/AMC/CMC</span>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xs p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium block">Critical Health</span>
              <span className="text-xl font-bold text-rose-300 mt-1 block">{adminMetrics.criticalHealthCount} Units</span>
              <span className="text-[10px] text-rose-400 font-medium">Score &lt; 60/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Messages */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {actionErrorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage(null)} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D2E7C4] overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('FLEET_EQUIPMENT')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'FLEET_EQUIPMENT'
              ? 'bg-[#F5F6F0] text-[#1E331B] border-t-2 border-[#22381E] border-x border-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:text-[#1E331B] hover:bg-[#E4F1DC]/30'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>1. Equipment Fleet & Health ({equipmentList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('PM_WORK_ORDERS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'PM_WORK_ORDERS'
              ? 'bg-[#F5F6F0] text-[#1E331B] border-t-2 border-[#22381E] border-x border-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:text-[#1E331B] hover:bg-[#E4F1DC]/30'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>2. PM Work Orders & Checklists ({workOrdersList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('SCHEDULE_ENGINE')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'SCHEDULE_ENGINE'
              ? 'bg-[#F5F6F0] text-[#1E331B] border-t-2 border-[#22381E] border-x border-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:text-[#1E331B] hover:bg-[#E4F1DC]/30'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>3. Schedule Engine & Frequency</span>
        </button>
        <button
          onClick={() => setActiveSubTab('COVERAGE_CONTRACTS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'COVERAGE_CONTRACTS'
              ? 'bg-[#F5F6F0] text-[#1E331B] border-t-2 border-[#22381E] border-x border-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:text-[#1E331B] hover:bg-[#E4F1DC]/30'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Warranty, AMC & CMC Contracts</span>
        </button>
        <button
          onClick={() => setActiveSubTab('CHECKLIST_TEMPLATES')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'CHECKLIST_TEMPLATES'
              ? 'bg-[#F5F6F0] text-[#1E331B] border-t-2 border-[#22381E] border-x border-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:text-[#1E331B] hover:bg-[#E4F1DC]/30'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5. PM Checklist Protocols ({templatesList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: EQUIPMENT FLEET & HEALTH SCORES */}
      {/* ========================================================================= */}
      {activeSubTab === 'FLEET_EQUIPMENT' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#F5F6F0] p-4 rounded-xl border border-[#D2E7C4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search equipment by model, serial number, lab name, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#D2E7C4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22381E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-600 font-medium">Coverage:</span>
                <select
                  value={filterCoverage}
                  onChange={(e) => setFilterCoverage(e.target.value)}
                  className="bg-white border border-[#D2E7C4] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                >
                  <option value="ALL">All Coverage States</option>
                  <option value="UNDER_WARRANTY">Under Warranty</option>
                  <option value="WARRANTY_EXPIRING_SOON">Warranty Expiring Soon</option>
                  <option value="UNDER_AMC">Active AMC</option>
                  <option value="AMC_EXPIRING_SOON">AMC Expiring Soon</option>
                  <option value="UNDER_CMC">Active CMC</option>
                  <option value="NO_ACTIVE_COVERAGE">No Active Coverage</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-[#D2E7C4] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPERATIONAL">OPERATIONAL</option>
                  <option value="DEGRADED">DEGRADED</option>
                  <option value="DOWN">DOWN</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment Fleet Table */}
          <div className="bg-white rounded-xl border border-[#D2E7C4] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#F5F6F0] border-b border-[#D2E7C4] text-[11px] font-bold text-[#1E331B] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Equipment & Model</th>
                    <th className="py-3 px-4">Customer Lab</th>
                    <th className="py-3 px-4">Health Score</th>
                    <th className="py-3 px-4">Active Coverage</th>
                    <th className="py-3 px-4">PM Milestone & Due Date</th>
                    <th className="py-3 px-4">Operational State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEquipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-[#E4F1DC]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{eq.equipmentName}</div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          Model: {eq.modelNumber} • S/N: {eq.serialNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{eq.customerLabName}</div>
                        <div className="text-[11px] text-slate-500">{eq.locationDepartment}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {renderHealthScoreBadge(eq.healthScore || 90, eq.healthLevel || 'HEALTHY')}
                      </td>
                      <td className="py-3.5 px-4">
                        {renderCoverageBadge(eq.coverageState)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-[#5F8F4D]" />
                          <span>Due: {eq.nextPmDueDate || 'Scheduled'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Last PM: {eq.lastServiceDate || 'Initial Setup'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          eq.status === 'OPERATIONAL' ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40' :
                          eq.status === 'DEGRADED' ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40' :
                          'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEquipmentDetail(eq.id)}
                            className="px-2.5 py-1.5 bg-[#C9DDE0]/50 hover:bg-[#C9DDE0] text-[#245B63] rounded-lg font-semibold text-[11px] border border-[#4C8994]/30 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lifecycle</span>
                          </button>
                          <button
                            onClick={() => {
                              setNewCoverageModalEq(eq);
                              setNewCoverageForm(prev => ({
                                ...prev,
                                contractNumber: `A2Z-AMC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                              }));
                            }}
                            className="px-2.5 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold text-[11px] shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Register / Renew AMC or CMC Contract"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#D2E7C4]" />
                            <span>Coverage</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEquipment.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No equipment records found matching the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PM WORK ORDERS & ACTIVE CHECKLISTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'PM_WORK_ORDERS' && (
        <div className="space-y-4">
          <div className="bg-[#F5F6F0] p-4 rounded-xl border border-[#D2E7C4] shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1E331B]">Preventive Maintenance Work Orders Queue</h2>
              <p className="text-xs text-slate-600">
                Server-dispatched PM tasks, model qualification matching, checklist validation, and customer sign-off.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#1E331B] font-semibold bg-[#E4F1DC] px-2.5 py-1 rounded-lg border border-[#D2E7C4]">Total Orders: {workOrdersList.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workOrdersList.map((wo) => {
              const completedChecklistCount = (wo.checklistItems || []).filter((i: any) => i.result && i.result !== 'NOT_APPLICABLE').length;
              const totalChecklistCount = (wo.checklistItems || []).length;
              const percentComplete = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

              return (
                <div key={wo.id} className="bg-white rounded-xl border border-[#D2E7C4] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#5F8F4D] transition-all">
                  <div>
                    {/* Top Row: PM Number + Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#1E331B] bg-[#E4F1DC] px-2 py-0.5 rounded border border-[#D2E7C4]">
                        #{wo.pmWorkOrderNumber}
                      </span>
                      {renderWoStatusBadge(wo.status)}
                    </div>

                    {/* Equipment & Customer Details */}
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{wo.equipmentName}</h3>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Model: {wo.modelNumber} • S/N: {wo.serialNumber}
                    </div>

                    <div className="mt-3 p-2.5 bg-[#F5F6F0] rounded-lg border border-[#D2E7C4]/60 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Customer Lab:</span>
                        <span className="text-slate-800 font-semibold text-right">{wo.customerLabName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Scheduled Due:</span>
                        <span className="text-slate-900 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#5F8F4D]" />
                          {wo.scheduledDueDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Assigned Engineer:</span>
                        <span className="text-slate-800 font-medium">{wo.assignedEngineerName || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Checklist Progress Bar */}
                    {totalChecklistCount > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Checklist Protocol Progress:</span>
                          <span className="text-slate-700 font-bold">{completedChecklistCount}/{totalChecklistCount} Items ({percentComplete}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              percentComplete === 100 ? 'bg-[#5F8F4D]' : 'bg-[#22381E]'
                            }`}
                            style={{ width: `${percentComplete}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEquipmentDetail(wo.equipmentId)}
                      className="text-xs text-slate-600 hover:text-[#1E331B] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>History</span>
                    </button>

                    {wo.status !== 'CLOSED' && wo.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => openChecklistModal(wo)}
                        className="px-3 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Execute PM Protocol</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openChecklistModal(wo)}
                        className="px-3 py-1.5 bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#5F8F4D]" />
                        <span>View Audit Certificate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SCHEDULE ENGINE & AUTOMATED PLANNING */}
      {/* ========================================================================= */}
      {activeSubTab === 'SCHEDULE_ENGINE' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#D2E7C4] shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1E331B] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#5F8F4D]" />
                  Preventive Maintenance Schedule Engine & Rule Matrices
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Calculates upcoming PM due dates based on equipment frequency (Monthly, Quarterly, Half-Yearly, Annual), opens 30-day reminder windows, and prevents duplicate work order generation for the same period.
                </p>
              </div>

              <button
                onClick={handleRunScheduleEngine}
                disabled={isLoading}
                className="px-5 py-2.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Execute Batch Schedule Engine Now</span>
              </button>
            </div>

            {/* Schedule Flow Diagram Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 bg-[#E4F1DC]/60 rounded-xl border border-[#D2E7C4]">
                <div className="w-7 h-7 rounded-lg bg-[#22381E] text-[#D2E7C4] flex items-center justify-center font-bold text-xs mb-2">1</div>
                <h3 className="font-bold text-xs text-[#1E331B]">Equipment Installation Baseline</h3>
                <p className="text-[11px] text-slate-600 mt-1">
                  Commissioning date sets the initial PM calendar anchor. Frequency defaults to Quarterly for clinical chemistry and bi-monthly for 5-part hematology.
                </p>
              </div>
              <div className="p-4 bg-[#F4DFA3]/40 rounded-xl border border-[#C58A16]/30">
                <div className="w-7 h-7 rounded-lg bg-[#C58A16] text-[#1E331B] flex items-center justify-center font-bold text-xs mb-2">2</div>
                <h3 className="font-bold text-xs text-[#6B4B12]">30-Day Reminder Window</h3>
                <p className="text-[11px] text-[#6B4B12] mt-1">
                  When current date enters the reminder window, status advances to <span className="font-semibold text-[#6B4B12]">DUE_SOON</span> and engineer dispatch is queued.
                </p>
              </div>
              <div className="p-4 bg-[#C9DDE0]/50 rounded-xl border border-[#4C8994]/30">
                <div className="w-7 h-7 rounded-lg bg-[#4C8994] text-white flex items-center justify-center font-bold text-xs mb-2">3</div>
                <h3 className="font-bold text-xs text-[#245B63]">Smart Engineer Assignment</h3>
                <p className="text-[11px] text-[#245B63] mt-1">
                  Engineers are matched based on Model Certification + Territory Authorization + Lowest Active Workload Balancing.
                </p>
              </div>
              <div className="p-4 bg-[#D2E7C4]/60 rounded-xl border border-[#5F8F4D]/40">
                <div className="w-7 h-7 rounded-lg bg-[#5F8F4D] text-[#1E331B] flex items-center justify-center font-bold text-xs mb-2">4</div>
                <h3 className="font-bold text-xs text-[#1E331B]">Completion & Next Cycle</h3>
                <p className="text-[11px] text-slate-700 mt-1">
                  Upon server-validated checklist completion, next PM due date is automatically generated and equipment health score is recalculated.
                </p>
              </div>
            </div>
          </div>

          {/* Qualified Biomedical Engineers Matrix */}
          <div className="bg-white p-5 rounded-xl border border-[#D2E7C4] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1E331B] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#5F8F4D]" />
              Certified Biomedical Service Engineers & Workload Balancing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {engineersList.map((eng) => (
                <div key={eng.engineerId} className="p-4 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#1E331B]">{eng.engineerName}</div>
                      <div className="text-xs text-slate-500">{eng.phone}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">
                      AVAILABLE
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Qualified Models:</span>
                    <div className="flex flex-wrap gap-1">
                      {eng.qualifiedModels?.map((model: string) => (
                        <span key={model} className="px-2 py-0.5 bg-white text-slate-700 text-[10px] font-medium rounded border border-[#D2E7C4]">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Authorized Territories:</span>
                    <div className="text-xs text-slate-700 font-medium">
                      {eng.authorizedTerritories?.join(', ')}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D2E7C4]/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Active PM Workload:</span>
                    <span className="font-bold text-[#1E331B]">{eng.activeWorkloadCount} / {eng.maxConcurrentJobs} Jobs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: WARRANTY, AMC & CMC CONTRACT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'COVERAGE_CONTRACTS' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Equipment Coverage & Maintenance Contracts Registry</h2>
                <p className="text-xs text-slate-500">
                  Preserves complete chronological contract history without overwriting past records. Coverage status is calculated from official coverage records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {equipmentList.map((eq) => (
                <div key={eq.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{eq.equipmentName}</span>
                      {renderCoverageBadge(eq.coverageState)}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      S/N: {eq.serialNumber} • Customer: {eq.customerLabName}
                    </div>

                    {eq.activeCoverage ? (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Contract Number:</span>
                          <span className="font-mono font-bold text-slate-900">{eq.activeCoverage.contractNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Provider / OEM:</span>
                          <span className="font-semibold text-slate-800">{eq.activeCoverage.provider}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Valid Contract Period:</span>
                          <span className="font-medium text-slate-700">{eq.activeCoverage.startDate} to {eq.activeCoverage.endDate}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                          <span className="font-semibold">Covered Services:</span> {eq.activeCoverage.coveredServices?.join(', ')}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-[#F4DFA3]/40 rounded-lg border border-[#C58A16]/30 text-xs text-[#6B4B12]">
                        No active AMC/CMC contract currently registered. Post-warranty breakdown repairs are billable.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => openEquipmentDetail(eq.id)}
                      className="text-xs text-[#22381E] hover:text-[#1E331B] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#5F8F4D]" />
                      <span>View Full Contract History</span>
                    </button>

                    <button
                      onClick={() => {
                        setNewCoverageModalEq(eq);
                        setNewCoverageForm(prev => ({
                          ...prev,
                          contractNumber: `A2Z-AMC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                        }));
                      }}
                      className="px-3 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      + Add / Renew Contract
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: PM CHECKLIST PROTOCOL TEMPLATES */}
      {/* ========================================================================= */}
      {activeSubTab === 'CHECKLIST_TEMPLATES' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#D2E7C4] shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#1E331B]">Biomedical Diagnostic PM Protocols & Checklist Definitions</h2>
              <p className="text-xs text-slate-500">
                Configured across 12 inspection categories: Visual, Cleaning, Electrical, Mechanical, Fluidics, Temperature, Calibration, QC, Consumables, Software, Safety, and Performance.
              </p>
            </div>

            <div className="space-y-4">
              {templatesList.map((tmpl) => (
                <div key={tmpl.id} className="p-5 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4]/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-[#1E331B]">{tmpl.templateName}</h3>
                      <div className="text-xs text-slate-500">
                        OEM: {tmpl.companyName} • Model: {tmpl.modelNumber} • Plan: {tmpl.maintenancePlan} (v{tmpl.version})
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-xs font-bold bg-[#C9DDE0]/50 text-[#245B63] border border-[#4C8994]/40 self-start sm:self-auto">
                      {tmpl.items?.length || 0} Standard Items
                    </span>
                  </div>

                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Checklist Item Title</th>
                          <th className="py-2 px-3">Expected Range / Units</th>
                          <th className="py-2 px-3 text-center">Mandatory</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tmpl.items?.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-900">{item.title}</div>
                              {item.description && <div className="text-[11px] text-slate-500">{item.description}</div>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                              {item.expectedRange ? `${item.expectedRange} ${item.readingUnit || ''}` : 'Inspection Pass / Fail'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.isMandatory ? (
                                <span className="text-rose-600 font-bold text-xs">Required</span>
                              ) : (
                                <span className="text-slate-400 text-xs">Optional</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INTERACTIVE PM CHECKLIST RUNNER (ENGINEER VIEW) */}
      {/* ========================================================================= */}
      {activeChecklistModalWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-[#1E331B] text-white flex items-center justify-between border-b border-[#2E4B29]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#D2E7C4]/20 text-[#D2E7C4] border border-[#D2E7C4]/30">
                    #{activeChecklistModalWo.pmWorkOrderNumber}
                  </span>
                  <span className="text-xs text-[#E4F1DC] font-medium">Preventive Maintenance Protocol</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  {activeChecklistModalWo.equipmentName} ({activeChecklistModalWo.modelNumber})
                </h2>
                <div className="text-xs text-[#C3E2B8]">
                  Lab: {activeChecklistModalWo.customerLabName} • S/N: {activeChecklistModalWo.serialNumber}
                </div>
              </div>
              <button
                onClick={() => setActiveChecklistModalWo(null)}
                className="p-2 text-[#C3E2B8] hover:text-white rounded-lg hover:bg-[#22381E] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Checklist Items */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="bg-[#C9DDE0]/50 border border-[#4C8994]/40 rounded-xl p-3.5 text-xs text-[#245B63] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#4C8994] shrink-0" />
                <span>
                  All mandatory checklist items marked with <span className="text-[#8F2D25] font-bold">*</span> must be verified before completing the PM work order. If any item fails, a breakdown service ticket will be automatically created.
                </span>
              </div>

              {/* Checklist Items List */}
              <div className="space-y-4">
                {(activeChecklistModalWo.checklistItems || []).map((item: any, idx: number) => {
                  const currentVal = checklistValues[item.itemId] || { result: item.result || 'NOT_APPLICABLE' };
                  const isFail = currentVal.result === 'FAIL';
                  const isPass = currentVal.result === 'PASS';

                  return (
                    <div
                      key={item.itemId || idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isFail
                          ? 'bg-[#F3C7C2]/40 border-[#B94A40]/40'
                          : isPass
                          ? 'bg-[#D2E7C4]/30 border-[#5F8F4D]/40'
                          : 'bg-white border-[#D2E7C4]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F6F0] text-[#1E331B] border border-[#D2E7C4] uppercase">
                              {item.category}
                            </span>
                            {item.isMandatory && (
                              <span className="text-[#8F2D25] font-bold text-xs">* Mandatory</span>
                            )}
                          </div>
                          <h3 className="font-bold text-xs text-slate-900">{item.title}</h3>
                          {item.description && (
                            <p className="text-[11px] text-slate-500">{item.description}</p>
                          )}
                          {item.expectedRange && (
                            <div className="text-[11px] text-[#245B63] font-mono font-medium">
                              Expected Range: {item.expectedRange} {item.readingUnit || ''}
                            </div>
                          )}
                        </div>

                        {/* Result Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setChecklistValues(prev => ({
                                ...prev,
                                [item.itemId]: { ...prev[item.itemId], result: 'PASS' }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isPass
                                ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]'
                                : 'bg-[#F5F6F0] text-slate-700 border border-[#D2E7C4] hover:bg-[#D2E7C4]/30'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 text-[#5F8F4D]" />
                            <span>PASS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setChecklistValues(prev => ({
                                ...prev,
                                [item.itemId]: { ...prev[item.itemId], result: 'FAIL' }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              isFail
                                ? 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]'
                                : 'bg-[#F5F6F0] text-slate-700 border border-[#D2E7C4] hover:bg-[#F3C7C2]/30'
                            }`}
                          >
                            <X className="w-3.5 h-3.5 text-[#B94A40]" />
                            <span>FAIL</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setChecklistValues(prev => ({
                                ...prev,
                                [item.itemId]: { ...prev[item.itemId], result: 'NOT_APPLICABLE' }
                              }));
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              currentVal.result === 'NOT_APPLICABLE'
                                ? 'bg-[#E4E8DF] text-[#4B5A48] font-bold border border-[#82917C]/40'
                                : 'bg-[#F5F6F0] text-slate-500 hover:bg-[#E4E8DF]/50'
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                      </div>

                      {/* Numerical Reading Input if Required */}
                      {item.requiresReading && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                          <label className="text-xs font-semibold text-slate-700">Observed Reading:</label>
                          <input
                            type="text"
                            placeholder={`e.g. ${item.expectedRange || 'Reading'}`}
                            value={currentVal.reading || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setChecklistValues(prev => ({
                                ...prev,
                                [item.itemId]: { ...prev[item.itemId], reading: val }
                              }));
                            }}
                            className="w-40 px-3 py-1 bg-white border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E] focus:outline-none"
                          />
                          <span className="text-xs text-slate-500 font-mono">{item.readingUnit}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Engineer Summary & Customer Signatory */}
              <div className="p-4 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#1E331B] block mb-1">
                    Biomedical Engineer Service Report & Calibration Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={engineerNotesDraft}
                    onChange={(e) => setEngineerNotesDraft(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D2E7C4] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                    placeholder="Enter comprehensive findings, optical calibration results, and recommendations..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1E331B] block mb-1">
                      Customer Signee Name & Lab Designation:
                    </label>
                    <input
                      type="text"
                      value={customerSignatoryDraft}
                      onChange={(e) => setCustomerSignatoryDraft(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D2E7C4] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="px-3 py-2 bg-[#D2E7C4] border border-[#5F8F4D]/40 rounded-lg text-xs text-[#1E331B] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#5F8F4D]" />
                      <span>Digital Sign-Off Ready (NABL Calibration Certified)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-[#F5F6F0] border-t border-[#D2E7C4] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveChecklistModalWo(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCompleteWorkOrder}
                className="px-5 py-2.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <FileCheck className="w-4 h-4 text-[#D2E7C4]" />
                <span>Submit & Validate PM Completion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER 2: COMPREHENSIVE EQUIPMENT LIFECYCLE, HEALTH & CONTRACTS */}
      {/* ========================================================================= */}
      {selectedEquipmentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 bg-[#1E331B] text-white flex items-center justify-between border-b border-[#2E4B29]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D2E7C4]/20 text-[#D2E7C4] border border-[#D2E7C4]/30">
                    LIFECYCLE INTELLIGENCE
                  </span>
                  <span className="text-xs text-[#E4F1DC]">{selectedEquipmentDetail.customerLabName}</span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  {selectedEquipmentDetail.equipmentName}
                </h2>
                <div className="text-xs text-[#C3E2B8] font-mono">
                  S/N: {selectedEquipmentDetail.serialNumber} • Model: {selectedEquipmentDetail.modelNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedEquipmentDetail(null)}
                className="p-2 text-[#C3E2B8] hover:text-white rounded-lg hover:bg-[#22381E] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Sub-Tabs */}
            <div className="flex items-center gap-1 px-4 bg-[#F5F6F0] border-b border-[#D2E7C4] overflow-x-auto">
              <button
                onClick={() => setEquipmentDrawerTab('OVERVIEW')}
                className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  equipmentDrawerTab === 'OVERVIEW' ? 'border-[#22381E] text-[#1E331B] bg-white' : 'border-transparent text-slate-600 hover:text-[#1E331B]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setEquipmentDrawerTab('HEALTH')}
                className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  equipmentDrawerTab === 'HEALTH' ? 'border-[#22381E] text-[#1E331B] bg-white' : 'border-transparent text-slate-600 hover:text-[#1E331B]'
                }`}
              >
                Health Breakdown
              </button>
              <button
                onClick={() => setEquipmentDrawerTab('COVERAGE_HISTORY')}
                className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  equipmentDrawerTab === 'COVERAGE_HISTORY' ? 'border-[#22381E] text-[#1E331B] bg-white' : 'border-transparent text-slate-600 hover:text-[#1E331B]'
                }`}
              >
                Coverage History ({selectedEquipmentDetail.coverageHistory?.length || 0})
              </button>
              <button
                onClick={() => setEquipmentDrawerTab('TIMELINE')}
                className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  equipmentDrawerTab === 'TIMELINE' ? 'border-[#22381E] text-[#1E331B] bg-white' : 'border-transparent text-slate-600 hover:text-[#1E331B]'
                }`}
              >
                Timeline ({selectedEquipmentDetail.timeline?.length || 0})
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {equipmentDrawerTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] space-y-2">
                    <h3 className="text-xs font-bold text-[#1E331B] uppercase">Core Asset Specs</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Installation Date:</span> <span className="font-semibold text-slate-800">{selectedEquipmentDetail.installationDate}</span></div>
                      <div><span className="text-slate-500">Department:</span> <span className="font-semibold text-slate-800">{selectedEquipmentDetail.locationDepartment}</span></div>
                      <div><span className="text-slate-500">Contact Person:</span> <span className="font-semibold text-slate-800">{selectedEquipmentDetail.contactPerson}</span></div>
                      <div><span className="text-slate-500">Phone:</span> <span className="font-semibold text-slate-800">{selectedEquipmentDetail.contactPhone}</span></div>
                      <div><span className="text-slate-500">Last PM Date:</span> <span className="font-semibold text-slate-800">{selectedEquipmentDetail.lastServiceDate || 'N/A'}</span></div>
                      <div><span className="text-slate-500">Next PM Due:</span> <span className="font-bold text-[#1E331B]">{selectedEquipmentDetail.nextPmDueDate || 'N/A'}</span></div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#C9DDE0]/30 rounded-xl border border-[#4C8994]/30">
                    <h3 className="text-xs font-bold text-[#245B63] uppercase mb-2">Current Active Coverage</h3>
                    {selectedEquipmentDetail.activeCoverage ? (
                      <div className="text-xs text-[#245B63] space-y-1">
                        <div><span className="font-semibold">Contract:</span> #{selectedEquipmentDetail.activeCoverage.contractNumber} ({selectedEquipmentDetail.activeCoverage.coverageType})</div>
                        <div><span className="font-semibold">Provider:</span> {selectedEquipmentDetail.activeCoverage.provider}</div>
                        <div><span className="font-semibold">Valid Period:</span> {selectedEquipmentDetail.activeCoverage.startDate} to {selectedEquipmentDetail.activeCoverage.endDate}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-[#6B4B12]">No active contract. Repairs billable at standard rates.</div>
                    )}
                  </div>
                </div>
              )}

              {equipmentDrawerTab === 'HEALTH' && selectedEquipmentDetail.healthScoreBreakdown && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#1E331B] text-white rounded-xl flex items-center justify-between border border-[#2E4B29]">
                    <div>
                      <span className="text-xs text-[#C3E2B8] font-medium">Server Calculated Health Score</span>
                      <div className="text-2xl font-bold text-white mt-0.5">
                        {selectedEquipmentDetail.healthScoreBreakdown.score} / 100
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D2E7C4]/20 text-[#D2E7C4] border border-[#D2E7C4]/30">
                      {selectedEquipmentDetail.healthScoreBreakdown.level}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#1E331B] uppercase">Explainable Score Factors:</h3>
                    {selectedEquipmentDetail.healthScoreBreakdown.factors?.map((f: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#F5F6F0] rounded-lg border border-[#D2E7C4]/60 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{f.name}</div>
                          <div className="text-slate-600 text-[11px] mt-0.5">{f.detail}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-xs shrink-0 ${
                          f.scoreImpact > 0 ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40' : 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40'
                        }`}>
                          {f.scoreImpact > 0 ? `+${f.scoreImpact}` : f.scoreImpact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {equipmentDrawerTab === 'COVERAGE_HISTORY' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#1E331B] uppercase">Historical Coverage Contracts (Preserved):</h3>
                  {selectedEquipmentDetail.coverageHistory?.map((cov: any) => (
                    <div key={cov.id} className="p-4 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4]/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#1E331B]">#{cov.contractNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cov.status === 'ACTIVE' ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40' : 'bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40'
                        }`}>
                          {cov.coverageType} • {cov.status}
                        </span>
                      </div>
                      <div className="text-slate-700"><span className="font-semibold">Provider:</span> {cov.provider}</div>
                      <div className="text-slate-500 font-mono text-[11px]">Period: {cov.startDate} to {cov.endDate}</div>
                      <div className="text-[11px] text-slate-600"><span className="font-semibold">Covered Services:</span> {cov.coveredServices?.join(', ')}</div>
                    </div>
                  ))}
                </div>
              )}

              {equipmentDrawerTab === 'TIMELINE' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[#1E331B] uppercase">Equipment Lifecycle Timeline:</h3>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D2E7C4]">
                    {selectedEquipmentDetail.timeline?.map((evt: any) => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#5F8F4D] ring-4 ring-[#E4F1DC]" />
                        <div className="p-3.5 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4]/60 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1E331B]">{evt.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(evt.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{evt.description}</p>
                          <div className="text-[10px] text-slate-500">Performer: {evt.performerName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / RENEW COVERAGE CONTRACT */}
      {/* ========================================================================= */}
      {newCoverageModalEq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Register / Renew Coverage Contract</h2>
                <p className="text-xs text-slate-500">{newCoverageModalEq.equipmentName}</p>
              </div>
              <button onClick={() => setNewCoverageModalEq(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Type:</label>
                <select
                  value={newCoverageForm.coverageType}
                  onChange={(e) => setNewCoverageForm(prev => ({ ...prev, coverageType: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="AMC">AMC (Annual Maintenance Contract)</option>
                  <option value="CMC">CMC (Comprehensive Maintenance Contract)</option>
                  <option value="WARRANTY">OEM Warranty Extension</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Number:</label>
                <input
                  type="text"
                  value={newCoverageForm.contractNumber}
                  onChange={(e) => setNewCoverageForm(prev => ({ ...prev, contractNumber: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date:</label>
                  <input
                    type="date"
                    value={newCoverageForm.startDate}
                    onChange={(e) => setNewCoverageForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date:</label>
                  <input
                    type="date"
                    value={newCoverageForm.endDate}
                    onChange={(e) => setNewCoverageForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Covered Services (comma separated):</label>
                <input
                  type="text"
                  value={newCoverageForm.coveredServices}
                  onChange={(e) => setNewCoverageForm(prev => ({ ...prev, coveredServices: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Covered Spare Parts (comma separated):</label>
                <input
                  type="text"
                  value={newCoverageForm.coveredParts}
                  onChange={(e) => setNewCoverageForm(prev => ({ ...prev, coveredParts: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNewCoverageModalEq(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCoverageContract}
                className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Save & Register Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
