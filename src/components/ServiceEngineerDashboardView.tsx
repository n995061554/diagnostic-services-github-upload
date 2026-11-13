import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  FileText, 
  Camera, 
  Package, 
  MessageSquare, 
  CheckSquare, 
  ChevronRight, 
  ExternalLink, 
  Play, 
  Sparkles, 
  Activity, 
  Sliders, 
  Building2, 
  Flame, 
  Award, 
  Cpu, 
  X, 
  Send, 
  Star, 
  HelpCircle, 
  Eye, 
  Layers, 
  RefreshCw,
  FileCheck2,
  Navigation
} from 'lucide-react';
import { 
  ServiceTicket, 
  CustomerEquipment, 
  ServiceSparePartCatalog, 
  ServiceDeskStats, 
  UserRoleType 
} from '../types';
import { runPhase5TestSuite, Phase5TestResult } from '../utils/phase5Tests';

interface ServiceEngineerDashboardViewProps {
  accessToken?: string | null;
  currentRole?: UserRoleType;
}

export function ServiceEngineerDashboardView({ accessToken, currentRole }: ServiceEngineerDashboardViewProps) {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'tickets' | 'equipment' | 'parts' | 'analytics'>('tickets');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [equipmentList, setEquipmentList] = useState<CustomerEquipment[]>([]);
  const [spareParts, setSpareParts] = useState<ServiceSparePartCatalog[]>([]);
  const [stats, setStats] = useState<ServiceDeskStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState<boolean>(false);
  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showBackOfficeModal, setShowBackOfficeModal] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [showTestRunnerModal, setShowTestRunnerModal] = useState<boolean>(false);

  // Test Suite Execution
  const [testResults, setTestResults] = useState<Phase5TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Form Field States
  const [newTicketForm, setNewTicketForm] = useState({
    customerId: 'u-cust-01',
    customerLabName: 'Apex Clinical & Pathology Laboratories',
    customerContactPerson: 'Dr. Rajesh Kulkarni',
    customerPhone: '+91-98200-11223',
    customerAddress: 'MIDC Industrial Central Lab, Andheri East, Mumbai',
    category: 'EQUIPMENT_BREAKDOWN' as any,
    equipmentId: 'eq-001',
    priority: 'HIGH' as any,
    title: '',
    description: '',
    errorCode: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitSlot: '10:00 AM - 01:00 PM'
  });

  const [checkInForm, setCheckInForm] = useState({
    latitude: 19.1197,
    longitude: 72.8464,
    locationName: 'Apex Clinical & Pathology Laboratories, Andheri East',
    casingPassed: true,
    voltagePassed: true,
    opticsPassed: true,
    fluidicsPassed: true,
    notes: 'Power input verified 228V. Optical lens shows dusting.'
  });

  const [noteForm, setNoteForm] = useState({
    noteType: 'INTERNAL' as 'INTERNAL' | 'CUSTOMER_VISIBLE',
    content: ''
  });

  const [partForm, setPartForm] = useState({
    partId: 'prt-001',
    quantity: 1,
    isWarrantyCovered: true,
    isBillable: false
  });

  const [resolveForm, setResolveForm] = useState({
    rootCause: '',
    actionTaken: '',
    testRunResult: '',
    reagentLotTested: '',
    calibrationPassed: true,
    qcValueObserved: ''
  });

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    feedbackNotes: 'Work completed satisfactorily and analyzer recalibrated.',
    customerSignatoryName: 'Dr. Rajesh Kulkarni',
    customerDesignation: 'Chief Pathologist & Lab Director'
  });

  const [backOfficeForm, setBackOfficeForm] = useState({
    isApproved: true,
    totalBillingAmount: 0,
    warrantyApproved: true,
    qaPassed: true,
    reviewNotes: 'Reviewed field engineer test logs and calibration certificate. Approved.'
  });

  const [reopenForm, setReopenForm] = useState({
    reopenReason: 'Re-occurred during high-volume sample batch run.'
  });

  const [chatMessage, setChatMessage] = useState<string>('');

  // Fetch all Phase 5 Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const safeJson = async (res: Response) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type');
        if (ct && ct.includes('application/json')) {
          return await res.json().catch(() => null);
        }
        return null;
      };

      const [ticketsRes, equipmentRes, partsRes, statsRes] = await Promise.all([
        fetch('/api/v1/service/tickets'),
        fetch('/api/v1/service/equipment'),
        fetch('/api/v1/service/parts'),
        fetch('/api/v1/service/stats')
      ]);

      const [tData, eData, pData, sData] = await Promise.all([
        safeJson(ticketsRes),
        safeJson(equipmentRes),
        safeJson(partsRes),
        safeJson(statsRes)
      ]);

      if (tData?.data) {
        setTickets(tData.data);
        if (selectedTicket) {
          const updated = tData.data.find((t: ServiceTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }

      if (eData?.data) {
        setEquipmentList(eData.data);
      }

      if (pData?.data) {
        setSpareParts(pData.data);
      }

      if (sData?.data) {
        setStats(sData.data);
      }
    } catch (err) {
      console.error('Failed to load service module data', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicket]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Run Phase 5 Automated Test Suite
  const handleExecuteTestSuite = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    try {
      const res = await runPhase5TestSuite();
      setTestResults(Array.isArray(res) ? res : []);
      await fetchData();
    } catch (err) {
      console.error('Test run failed', err);
      setTestResults([]);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Create Complaint Ticket Action
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/service/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketForm)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTicketForm({
          ...newTicketForm,
          title: '',
          description: '',
          errorCode: ''
        });
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to create ticket', err);
    }
  };

  // Assign Ticket Action
  const handleAssignEngineer = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedEngineerId: 'u-eng-01',
          assignedEngineerName: 'Anand Deshmukh',
          assignedEngineerPhone: '+91-98220-44556',
          assignedEngineerEmail: 'anand.deshmukh@diagnostics.com'
        })
      });
      if (res.ok) {
        setShowAssignModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to assign ticket', err);
    }
  };

  // Acknowledge Action
  const handleAcknowledgeTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Failed to acknowledge ticket', err);
    }
  };

  // Schedule Visit Action
  const handleScheduleVisit = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledVisitDate: scheduleForm.visitDate,
          scheduledVisitSlot: scheduleForm.visitSlot
        })
      });
      if (res.ok) {
        setShowScheduleModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to schedule visit', err);
    }
  };

  // On The Way Action
  const handleOnTheWay = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/on-the-way`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Failed to update status to on-the-way', err);
    }
  };

  // Check In Action
  const handleCheckIn = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: checkInForm.latitude,
          longitude: checkInForm.longitude,
          locationName: checkInForm.locationName,
          initialChecklist: [
            { item: 'Visual casing and power cord safety', passed: checkInForm.casingPassed },
            { item: 'Power line voltage stabilizer check', passed: checkInForm.voltagePassed },
            { item: 'Optical lenses & filter cleanliness', passed: checkInForm.opticsPassed },
            { item: 'Fluidics waste drainage line clearance', passed: checkInForm.fluidicsPassed }
          ]
        })
      });
      if (res.ok) {
        setShowCheckInModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to check in', err);
    }
  };

  // Check Out Action
  const handleCheckOut = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMinutes: 90,
          workSummary: 'Biomedical repair and recalibration verification completed.'
        })
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error('Failed to check out', err);
    }
  };

  // Add Note Action
  const handleAddNote = async (ticketId: string) => {
    if (!noteForm.content.trim()) return;
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: 'u-eng-01',
          authorName: 'Anand Deshmukh',
          authorRole: 'SERVICE_ENGINEER',
          noteType: noteForm.noteType,
          content: noteForm.content
        })
      });
      if (res.ok) {
        setShowAddNoteModal(false);
        setNoteForm({ noteType: 'INTERNAL', content: '' });
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  // Add Spare Part Action
  const handleAddPart = async (ticketId: string) => {
    const selectedCatalogItem = spareParts.find(p => p.id === partForm.partId);
    if (!selectedCatalogItem) return;

    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: selectedCatalogItem.id,
          partNumber: selectedCatalogItem.partNumber,
          partName: selectedCatalogItem.partName,
          quantity: partForm.quantity,
          unitCost: selectedCatalogItem.unitCost,
          isWarrantyCovered: partForm.isWarrantyCovered,
          isBillable: partForm.isBillable,
          addedBy: 'Anand Deshmukh'
        })
      });
      if (res.ok) {
        setShowAddPartModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to record part used', err);
    }
  };

  // Resolve Ticket Action
  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCause: resolveForm.rootCause || 'Component operational failure',
          actionTaken: resolveForm.actionTaken || 'Replaced parts and calibrated instrument',
          testRunResult: resolveForm.testRunResult || 'Passed 10-point test run with zero CV error',
          reagentLotTested: resolveForm.reagentLotTested,
          calibrationPassed: resolveForm.calibrationPassed,
          qcValueObserved: resolveForm.qcValueObserved,
          resolvedBy: 'u-eng-01',
          resolvedByName: 'Anand Deshmukh'
        })
      });
      if (res.ok) {
        setShowResolveModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to resolve ticket', err);
    }
  };

  // Customer Feedback Action
  const handleFeedbackSubmit = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackForm.rating,
          feedbackNotes: feedbackForm.feedbackNotes,
          customerSignatoryName: feedbackForm.customerSignatoryName,
          customerDesignation: feedbackForm.customerDesignation,
          signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        })
      });
      if (res.ok) {
        setShowFeedbackModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  // Back Office Review Action
  const handleBackOfficeSubmit = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/back-office-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: 'u-admin-01',
          reviewedByName: 'Sarah Jenkins (Biomedical QA)',
          isApproved: backOfficeForm.isApproved,
          totalBillingAmount: backOfficeForm.totalBillingAmount,
          warrantyApproved: backOfficeForm.warrantyApproved,
          qaPassed: backOfficeForm.qaPassed,
          reviewNotes: backOfficeForm.reviewNotes
        })
      });
      if (res.ok) {
        setShowBackOfficeModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to complete back-office review', err);
    }
  };

  // Reopen Ticket Action
  const handleReopenTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reopenedBy: 'Dr. Rajesh Kulkarni',
          reopenReason: reopenForm.reopenReason
        })
      });
      if (res.ok) {
        setShowReopenModal(false);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to reopen ticket', err);
    }
  };

  // Send Customer Chat Message
  const handleSendChatMessage = async (ticketId: string) => {
    if (!chatMessage.trim()) return;
    try {
      const res = await fetch(`/api/v1/service/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'u-eng-01',
          senderName: 'Anand Deshmukh',
          senderRole: 'SERVICE_ENGINEER',
          message: chatMessage,
          isCustomerVisible: true
        })
      });
      if (res.ok) {
        setChatMessage('');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Filtered Tickets
  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        (t.ticketNumber || '').toLowerCase().includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.customerLabName || '').toLowerCase().includes(q) ||
        (t.equipmentName && t.equipmentName.toLowerCase().includes(q)) ||
        (t.errorCode && t.errorCode.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Priority styling helper
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40">LOW</span>;
    }
  };

  // Status styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40">NEW COMPLAINT</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40">ASSIGNED</span>;
      case 'ACKNOWLEDGED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#E4F1DC] text-[#22381E] border border-[#D2E7C4]">ACKNOWLEDGED</span>;
      case 'SCHEDULED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40">SCHEDULED</span>;
      case 'ENGINEER_ON_THE_WAY':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40 animate-pulse">ON THE WAY</span>;
      case 'CHECKED_IN':
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">IN PROGRESS</span>;
      case 'WAITING_FOR_PARTS':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40">WAITING PARTS</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">RESOLVED</span>;
      case 'CUSTOMER_FEEDBACK_PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40">FEEDBACK PENDING</span>;
      case 'BACK_OFFICE_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40">QA REVIEW</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">CLOSED</span>;
      case 'CUSTOMER_DISPUTED_RESOLUTION':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40">DISPUTED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#22381E] flex items-center justify-center text-[#D2E7C4] shadow-xs flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1E331B] tracking-tight">
                  Biomedical Service Engineer & Complaint Operations
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">
                  Field Service Suite
                </span>
              </div>
              <p className="text-xs text-[#415439] mt-1 max-w-2xl">
                Server-authorized complaint ticketing lifecycle, field engineer GPS check-in/out, spare parts consumption, QC calibration signoffs, customer feedback and back-office review workflow.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowTestRunnerModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#D2E7C4] text-[#1E331B] hover:bg-[#C3E2B8] text-xs font-semibold border border-[#5F8F4D]/40 flex items-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#1E331B] text-[#1E331B]" />
              <span>Run Service API Tests (15)</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-[#22381E] text-[#F9FAF6] hover:bg-[#1E331B] text-xs font-semibold shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Service Complaint</span>
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#D2E7C4]">
          <div className="p-3 bg-white rounded-lg border border-[#D2E7C4]">
            <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
              <span>Total Tickets</span>
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-[#1E331B] mt-1 font-mono">
              {stats?.totalTickets ?? tickets.length}
            </div>
            <div className="text-[10px] text-[#4C8994] font-medium mt-0.5">
              {stats?.newTickets ?? 1} new pending triage
            </div>
          </div>

          <div className="p-3 bg-[#C9DDE0]/30 rounded-lg border border-[#4C8994]/30">
            <div className="text-[11px] font-medium text-[#245B63] flex items-center justify-between">
              <span>In Progress</span>
              <Activity className="w-3.5 h-3.5 text-[#4C8994]" />
            </div>
            <div className="text-xl font-bold text-[#1E331B] mt-1 font-mono">
              {stats?.inProgressTickets ?? tickets.filter(t => ['CHECKED_IN', 'IN_PROGRESS'].includes(t.status)).length}
            </div>
            <div className="text-[10px] text-[#245B63] font-medium mt-0.5">
              On-site field repairs
            </div>
          </div>

          <div className="p-3 bg-[#F4DFA3]/30 rounded-lg border border-[#C58A16]/30">
            <div className="text-[11px] font-medium text-[#6B4B12] flex items-center justify-between">
              <span>Waiting Parts</span>
              <Package className="w-3.5 h-3.5 text-[#C58A16]" />
            </div>
            <div className="text-xl font-bold text-[#1E331B] mt-1 font-mono">
              {stats?.waitingForPartsTickets ?? tickets.filter(t => t.status === 'WAITING_FOR_PARTS').length}
            </div>
            <div className="text-[10px] text-[#6B4B12] font-medium mt-0.5">
              Logistics transit hold
            </div>
          </div>

          <div className="p-3 bg-[#D2E7C4]/40 rounded-lg border border-[#5F8F4D]/30">
            <div className="text-[11px] font-medium text-[#1E331B] flex items-center justify-between">
              <span>SLA Compliance</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#5F8F4D]" />
            </div>
            <div className="text-xl font-bold text-[#1E331B] mt-1 font-mono">
              {stats?.slaComplianceRate ?? 86}%
            </div>
            <div className="text-[10px] text-[#1E331B] font-medium mt-0.5">
              Avg SLA: {stats?.avgResolutionTimeHours ?? 3.4}h
            </div>
          </div>

          <div className="p-3 bg-[#F3C7C2]/40 rounded-lg border border-[#B94A40]/30">
            <div className="text-[11px] font-medium text-[#8F2D25] flex items-center justify-between">
              <span>Disputed / QA</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#B94A40]" />
            </div>
            <div className="text-xl font-bold text-[#8F2D25] mt-1 font-mono">
              {stats?.disputedTickets ?? tickets.filter(t => t.status === 'CUSTOMER_DISPUTED_RESOLUTION').length}
            </div>
            <div className="text-[10px] text-[#8F2D25] font-medium mt-0.5">
              Arbitration queue
            </div>
          </div>

          <div className="p-3 bg-[#E4E8DF]/60 rounded-lg border border-[#82917C]/40">
            <div className="text-[11px] font-medium text-[#4B5A48] flex items-center justify-between">
              <span>Customer CSAT</span>
              <Star className="w-3.5 h-3.5 text-[#C58A16] fill-[#C58A16]" />
            </div>
            <div className="text-xl font-bold text-[#1E331B] mt-1 font-mono">
              {stats?.customerSatisfactionAvg ?? 4.9} / 5.0
            </div>
            <div className="text-[10px] text-[#4B5A48] font-medium mt-0.5">
              NABL verified audit
            </div>
          </div>
        </div>
      </div>

      {/* Main View Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D2E7C4] pb-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'bg-[#22381E] text-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:bg-[#E4F1DC]/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Active Service Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'equipment'
              ? 'bg-[#22381E] text-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:bg-[#E4F1DC]/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Installed Equipment Registry ({equipmentList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('parts')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'parts'
              ? 'bg-[#22381E] text-[#D2E7C4] shadow-xs'
              : 'text-[#415439] hover:bg-[#E4F1DC]/40'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Spare Parts Inventory Catalog ({spareParts.length})</span>
        </button>
      </div>

      {/* SECTION: SERVICE TICKETS */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, customer lab, equipment model, error code..."
                className="w-full pl-9 pr-4 py-2 bg-[#F9FAF6] border border-[#D2E7C4] rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#22381E]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New Complaints</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACKNOWLEDGED">Acknowledged</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ENGINEER_ON_THE_WAY">On The Way</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_PARTS">Waiting Parts</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CUSTOMER_FEEDBACK_PENDING">Feedback Pending</option>
                <option value="BACK_OFFICE_REVIEW">QA Review</option>
                <option value="CLOSED">Closed</option>
                <option value="CUSTOMER_DISPUTED_RESOLUTION">Disputed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none font-medium text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none font-medium text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="EQUIPMENT_BREAKDOWN">Equipment Breakdown</option>
                <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</option>
                <option value="REAGENT_QUALITY_ISSUE">Reagent Quality Issue</option>
                <option value="LOGISTICS_DELAY">Logistics Delay</option>
              </select>

              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setCategoryFilter('ALL');
                  setSearchQuery('');
                }}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Reset Filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ticket Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Ticket # & Time</th>
                    <th className="p-3.5">Lab Customer</th>
                    <th className="p-3.5">Equipment / Subject</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Assigned Engineer</th>
                    <th className="p-3.5">SLA Target</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No service tickets match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-[#E4F1DC]/30 transition">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-[#1E331B]">{t.ticketNumber}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{t.customerLabName}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{t.customerContactPerson}</span>
                            <span>•</span>
                            <span>{t.customerPhone}</span>
                          </div>
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <div className="font-medium text-slate-900 truncate">{t.title}</div>
                          {t.equipmentName && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {t.equipmentName} ({t.equipmentSerial || 'No SN'})
                            </div>
                          )}
                          {t.errorCode && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-[#F3C7C2]/40 text-[#8F2D25] text-[9px] font-mono rounded border border-[#B94A40]/30">
                              {t.errorCode}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {getPriorityBadge(t.priority)}
                        </td>

                        <td className="p-3.5">
                          {t.assignedEngineerName ? (
                            <div>
                              <div className="font-medium text-slate-900">{t.assignedEngineerName}</div>
                              <div className="text-[10px] text-slate-400">{t.assignedEngineerPhone}</div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setShowAssignModal(true);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-[#245B63] bg-[#C9DDE0]/50 hover:bg-[#C9DDE0] rounded border border-[#4C8994]/40 transition cursor-pointer"
                            >
                              + Assign Engineer
                            </button>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Clock className={`w-3.5 h-3.5 ${
                              t.slaStatus === 'BREACHED' ? 'text-[#B94A40]' :
                              t.slaStatus === 'WARNING' ? 'text-[#C58A16]' : 'text-[#5F8F4D]'
                            }`} />
                            <span className={
                              t.slaStatus === 'BREACHED' ? 'text-[#8F2D25] font-bold' :
                              t.slaStatus === 'WARNING' ? 'text-[#6B4B12] font-bold' : 'text-slate-700'
                            }>
                              {t.slaTargetHours}h SLA ({t.slaStatus})
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {getStatusBadge(t.status)}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="px-3 py-1.5 rounded-lg bg-[#F5F6F0] hover:bg-[#E4F1DC] hover:text-[#1E331B] text-[#1E331B] font-semibold text-xs border border-[#D2E7C4] transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: INSTALLED EQUIPMENT REGISTRY */}
      {activeTab === 'equipment' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Installed biomedical clinical chemistry, hematology, and immunoassay instruments across client healthcare networks.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipmentList.map((eq) => (
              <div key={eq.id} className="bg-white rounded-xl border border-[#D2E7C4] shadow-xs p-4 hover:border-[#5F8F4D] transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900 text-sm">{eq.equipmentName}</div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      eq.status === 'OPERATIONAL' ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40' :
                      eq.status === 'DEGRADED' ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40' : 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40'
                    }`}>
                      {eq.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-500 font-mono">
                    SN: <span className="font-semibold text-slate-800">{eq.serialNumber}</span> • Model: {eq.modelNumber}
                  </div>

                  <div className="mt-3 p-2.5 bg-[#F5F6F0] rounded-lg text-xs space-y-1 border border-[#D2E7C4]/60">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Lab Location:</span>
                      <span className="font-medium text-slate-900">{eq.customerLabName}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Department:</span>
                      <span className="font-medium text-slate-700">{eq.locationDepartment}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Warranty:</span>
                      <span className="font-bold text-[#1E331B]">{eq.warrantyStatus}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Expires:</span>
                      <span className="font-mono text-slate-700">{eq.warrantyExpiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-slate-400">QR: {eq.qrCode}</span>
                  <button
                    onClick={() => {
                      setNewTicketForm({
                        ...newTicketForm,
                        customerId: eq.customerId,
                        customerLabName: eq.customerLabName,
                        equipmentId: eq.id,
                        title: `Biomedical Service Request for ${eq.equipmentName}`
                      });
                      setShowCreateModal(true);
                    }}
                    className="px-2.5 py-1 bg-[#D2E7C4] text-[#1E331B] hover:bg-[#C3E2B8] font-semibold rounded text-[11px] border border-[#5F8F4D]/40 transition cursor-pointer"
                  >
                    + Raise Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: SPARE PARTS INVENTORY */}
      {activeTab === 'parts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#D2E7C4] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D2E7C4] text-xs font-semibold text-[#1E331B] bg-[#F5F6F0] flex items-center justify-between">
              <span>Official Biomedical Spare Parts & Consumables Catalog</span>
              <span className="text-slate-500 font-normal">Real-time warehouse stock tracking</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F0] border-b border-[#D2E7C4] text-[#1E331B] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Part #</th>
                    <th className="p-3.5">Part Name & Category</th>
                    <th className="p-3.5">Compatible Analyzers</th>
                    <th className="p-3.5">Unit Cost (₹)</th>
                    <th className="p-3.5">MRP (₹)</th>
                    <th className="p-3.5">Available Stock</th>
                    <th className="p-3.5">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {spareParts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#E4F1DC]/30 transition">
                      <td className="p-3.5 font-mono font-bold text-[#1E331B]">{p.partNumber}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{p.partName}</div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        {p.compatibleModels.join(', ')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-900">₹{(p.unitCost ?? 0).toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-slate-500">₹{(p.mrp ?? 0).toLocaleString('en-IN')}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                          p.stockQuantity > 5 ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40' : 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40'
                        }`}>
                          {p.stockQuantity} units
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{p.leadTimeDays} day(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: MANAGE TICKET & WORKFLOW ACTION PANEL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#D2E7C4] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#2E4B29] flex items-start justify-between bg-[#1E331B] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22381E] border border-[#3D5A37] flex items-center justify-center text-[#D2E7C4] font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{selectedTicket.ticketNumber}</h3>
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                  <p className="text-xs text-[#C3E2B8] mt-0.5">
                    {selectedTicket.customerLabName} • Raised on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="text-[#C3E2B8] hover:text-white p-1.5 rounded-lg hover:bg-[#22381E] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Lifecycle Action Toolbar */}
              <div className="p-4 bg-[#C9DDE0]/40 border border-[#4C8994]/40 rounded-xl">
                <div className="text-xs font-bold text-[#245B63] mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#4C8994]" />
                  <span>Available Lifecycle Actions for Current Status: {selectedTicket.status}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedTicket.status === 'NEW' && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-3.5 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      Assign Service Engineer
                    </button>
                  )}

                  {selectedTicket.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleAcknowledgeTicket(selectedTicket.id)}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      Acknowledge Ticket
                    </button>
                  )}

                  {selectedTicket.status === 'ACKNOWLEDGED' && (
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      Schedule Field Visit
                    </button>
                  )}

                  {selectedTicket.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleOnTheWay(selectedTicket.id)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Trip (On The Way)</span>
                    </button>
                  )}

                  {selectedTicket.status === 'ENGINEER_ON_THE_WAY' && (
                    <button
                      onClick={() => setShowCheckInModal(true)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>GPS Lab Check-In</span>
                    </button>
                  )}

                  {['CHECKED_IN', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(selectedTicket.status) && (
                    <>
                      <button
                        onClick={() => setShowAddNoteModal(true)}
                        className="px-3 py-1.5 bg-[#F5F6F0] hover:bg-[#E4F1DC] text-[#1E331B] border border-[#D2E7C4] rounded-lg text-xs font-semibold transition"
                      >
                        + Add Service Note
                      </button>
                      <button
                        onClick={() => setShowAddPartModal(true)}
                        className="px-3 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Record Spare Part Used</span>
                      </button>
                      <button
                        onClick={() => setShowResolveModal(true)}
                        className="px-3.5 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D2E7C4]" />
                        <span>Submit Resolution</span>
                      </button>
                    </>
                  )}

                  {selectedTicket.status === 'RESOLVED' && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-3.5 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs transition"
                    >
                      Record Customer Feedback Signoff
                    </button>
                  )}

                  {selectedTicket.status === 'CUSTOMER_FEEDBACK_PENDING' && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      Simulate Customer Signoff & Rating
                    </button>
                  )}

                  {selectedTicket.status === 'BACK_OFFICE_REVIEW' && (
                    <button
                      onClick={() => setShowBackOfficeModal(true)}
                      className="px-3.5 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Back-Office QA & Billing Signoff</span>
                    </button>
                  )}

                  {['CLOSED', 'CUSTOMER_DISPUTED_RESOLUTION'].includes(selectedTicket.status) && (
                    <button
                      onClick={() => setShowReopenModal(true)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reopen Ticket / Arbitrate Dispute</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ticket Details & Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">Complaint Overview</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedTicket.title}</div>
                  <div className="text-slate-600">{selectedTicket.description}</div>
                  {selectedTicket.errorCode && (
                    <div className="font-mono text-red-600 font-bold">Error Code: {selectedTicket.errorCode}</div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">Equipment & Location</div>
                  <div className="text-slate-700">
                    <span className="font-semibold text-slate-900">{selectedTicket.equipmentName || 'Biomedical Instrument'}</span>
                  </div>
                  <div className="text-slate-500 font-mono">
                    Serial: {selectedTicket.equipmentSerial || 'N/A'} • Model: {selectedTicket.equipmentModel || 'N/A'}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedTicket.customerAddress || selectedTicket.customerLabName}</span>
                  </div>
                </div>
              </div>

              {/* Geo Check-In & Checklist status */}
              {selectedTicket.checkIn && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>GPS Geo-Verified Field Check-In at {new Date(selectedTicket.checkIn.timestamp).toLocaleTimeString()}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-mono text-[10px]">
                      Lat: {selectedTicket.checkIn.latitude}, Lng: {selectedTicket.checkIn.longitude}
                    </span>
                  </div>
                  <div className="text-emerald-800 font-medium">{selectedTicket.checkIn.locationName}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100">
                    {selectedTicket.checkIn.initialChecklist.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-emerald-900">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${c.passed ? 'text-emerald-600' : 'text-red-500'}`} />
                        <span>{c.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spare Parts Used List */}
              {selectedTicket.partsUsed && selectedTicket.partsUsed.length > 0 && (
                <div className="p-4 bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl space-y-3">
                  <div className="font-bold text-[#1E331B] text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#22381E]" />
                      <span>Spare Parts Consumed ({selectedTicket.partsUsed.length})</span>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedTicket.partsUsed.map((part) => (
                      <div key={part.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900 font-mono">{part.partNumber} - {part.partName}</div>
                          <div className="text-[10px] text-slate-500">Qty: {part.quantity} • Unit: ₹{(part.unitCost ?? 0).toLocaleString('en-IN')} • Added by: {part.addedBy}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">₹{(part.totalCost ?? 0).toLocaleString('en-IN')}</div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {part.isWarrantyCovered ? 'Warranty Covered' : 'Billable'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Report */}
              {selectedTicket.resolution && (
                <div className="p-4 bg-cyan-50/80 border border-cyan-200 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-cyan-900 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-cyan-600" />
                    <span>Biomedical Resolution & Calibration Certificate</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 font-medium block">Root Cause:</span>
                      <span className="text-slate-800">{selectedTicket.resolution.rootCause}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Action Taken:</span>
                      <span className="text-slate-800">{selectedTicket.resolution.actionTaken}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">QC Test Result:</span>
                      <span className="text-slate-800 font-mono">{selectedTicket.resolution.testRunResult}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block">Reagent / QC Values:</span>
                      <span className="text-slate-800 font-mono">{selectedTicket.resolution.qcValueObserved || 'Standard Range'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Feedback Card */}
              {selectedTicket.customerFeedback && (
                <div className="p-4 bg-violet-50/80 border border-violet-200 rounded-xl text-xs space-y-2">
                  <div className="font-bold text-violet-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span>Customer Digital Sign-off & Satisfaction</span>
                    </span>
                    <span className="text-amber-600 font-bold font-mono">
                      Rating: {selectedTicket.customerFeedback.rating} / 5.0
                    </span>
                  </div>
                  <div className="text-slate-700 italic">"{selectedTicket.customerFeedback.feedbackNotes}"</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-violet-100">
                    <span>Signatory: <strong>{selectedTicket.customerFeedback.customerSignatoryName}</strong> ({selectedTicket.customerFeedback.customerDesignation})</span>
                    <span className="font-mono">Signed at {new Date(selectedTicket.customerFeedback.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {/* Service Notes Stream */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>Diagnostic & Service History Notes</span>
                  <button
                    onClick={() => setShowAddNoteModal(true)}
                    className="text-[#22381E] hover:text-[#1E331B] font-semibold text-[11px]"
                  >
                    + Add Note
                  </button>
                </div>
                {selectedTicket.notes.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-xs text-center">
                    No engineering notes logged yet.
                  </div>
                ) : (
                  selectedTicket.notes.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-800">{n.authorName} ({n.authorRole})</span>
                        <span className="text-[10px]">{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-700">{n.content}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Customer Communication Chat Stream */}
              <div className="p-4 bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl space-y-3">
                <div className="font-bold text-[#1E331B] text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#22381E]" />
                  <span>Direct Customer Support Communication Channel</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {selectedTicket.customerCommunication.length === 0 ? (
                    <div className="text-slate-400 text-xs text-center py-2">
                      No direct messages. Chat live with the customer laboratory.
                    </div>
                  ) : (
                    selectedTicket.customerCommunication.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-lg text-xs max-w-md ${
                          msg.senderRole === 'CUSTOMER'
                            ? 'bg-white border border-[#D2E7C4] text-[#1E331B] mr-auto'
                            : 'bg-[#22381E] text-[#D2E7C4] ml-auto'
                        }`}
                      >
                        <div className="text-[10px] opacity-75 font-semibold">{msg.senderName} ({msg.senderRole})</div>
                        <div className="mt-0.5">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Chat Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#D2E7C4]">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage(selectedTicket.id)}
                    placeholder="Send message or diagnostic update to customer..."
                    className="flex-1 px-3 py-1.5 bg-white border border-[#D2E7C4] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                  />
                  <button
                    onClick={() => handleSendChatMessage(selectedTicket.id)}
                    className="p-2 bg-[#22381E] text-[#D2E7C4] rounded-lg hover:bg-[#1E331B] transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-500">ID: {selectedTicket.id}</span>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Close Ticket View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SERVICE COMPLAINT */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create New Service Complaint</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Laboratory</label>
                <select
                  value={newTicketForm.customerId}
                  onChange={(e) => {
                    const custId = e.target.value;
                    const custName = custId === 'u-cust-01' ? 'Apex Clinical & Pathology Laboratories' :
                                     custId === 'u-cust-02' ? 'Apollo Central Clinical Research Facility' : 'Suburban Diagnostic Central Labs';
                    setNewTicketForm({ ...newTicketForm, customerId: custId, customerLabName: custName });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="u-cust-01">Apex Clinical & Pathology Laboratories</option>
                  <option value="u-cust-02">Apollo Central Clinical Research Facility</option>
                  <option value="u-cust-03">Suburban Diagnostic Network Central Labs</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="EQUIPMENT_BREAKDOWN">Equipment Breakdown</option>
                    <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</option>
                    <option value="REAGENT_QUALITY_ISSUE">Reagent Quality Issue</option>
                    <option value="LOGISTICS_DELAY">Logistics Delay</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="CRITICAL">CRITICAL (4 Hour SLA)</option>
                    <option value="HIGH">HIGH (8 Hour SLA)</option>
                    <option value="MEDIUM">MEDIUM (24 Hour SLA)</option>
                    <option value="LOW">LOW (48 Hour SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Installed Equipment (Optional)</label>
                <select
                  value={newTicketForm.equipmentId}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, equipmentId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">-- None / General Complaint --</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.equipmentName} ({eq.serialNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Complaint Title / Summary</label>
                <input
                  type="text"
                  required
                  value={newTicketForm.title}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  placeholder="e.g. Optical absorbance drift on 340nm filter"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Error Code (Optional)</label>
                <input
                  type="text"
                  value={newTicketForm.errorCode}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, errorCode: e.target.value })}
                  placeholder="e.g. ERR-340-ABS"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  placeholder="Describe instrument symptom, assay affected, or incident..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Generate Ticket & Assign SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN ENGINEER */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#D2E7C4] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E331B] text-base">Assign Service Engineer</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F5F6F0] rounded-lg border border-[#D2E7C4]">
                <div className="font-bold text-[#1E331B]">Anand Deshmukh</div>
                <div className="text-slate-500">Lead Biomedical Field Service Engineer • Mumbai Hub</div>
                <div className="text-slate-600 font-mono mt-1">+91-98220-44556 • anand.deshmukh@diagnostics.com</div>
                <div className="text-[#1E331B] font-semibold mt-1">● Available (1 active field ticket)</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignEngineer(selectedTicket.id)}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE VISIT */}
      {showScheduleModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Schedule Field Visit</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visit Date</label>
                <input
                  type="date"
                  value={scheduleForm.visitDate}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, visitDate: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={scheduleForm.visitSlot}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, visitSlot: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="09:00 AM - 12:00 PM">Morning Slot (09:00 AM - 12:00 PM)</option>
                  <option value="12:00 PM - 03:00 PM">Afternoon Slot (12:00 PM - 03:00 PM)</option>
                  <option value="03:00 PM - 06:00 PM">Evening Slot (03:00 PM - 06:00 PM)</option>
                  <option value="EMERGENCY_IMMEDIATE">Emergency Immediate Dispatch</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleScheduleVisit(selectedTicket.id)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Set Schedule & Notify Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GPS CHECK-IN WITH SAFETY CHECKLIST */}
      {showCheckInModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">GPS Verified Lab Check-In</h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>GPS Geofence Match: Verified (18m from lab)</span>
                </div>
                <div className="text-[11px] font-mono">Location: {checkInForm.locationName}</div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="font-bold text-slate-800">Pre-Repair Safety & Visual Inspection:</div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkInForm.casingPassed}
                    onChange={(e) => setCheckInForm({ ...checkInForm, casingPassed: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Visual physical casing and power cable safety</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkInForm.voltagePassed}
                    onChange={(e) => setCheckInForm({ ...checkInForm, voltagePassed: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Power line voltage stability test (220V +/- 5%)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkInForm.opticsPassed}
                    onChange={(e) => setCheckInForm({ ...checkInForm, opticsPassed: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Optical lenses, filters & lamp housing intact</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkInForm.fluidicsPassed}
                    onChange={(e) => setCheckInForm({ ...checkInForm, fluidicsPassed: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Waste drainage lines & suction peristaltic tubing</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowCheckInModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCheckIn(selectedTicket.id)}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Complete Check-In & Start Work
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NOTE */}
      {showAddNoteModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Engineering Note</h3>
              <button onClick={() => setShowAddNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visibility</label>
                <select
                  value={noteForm.noteType}
                  onChange={(e) => setNoteForm({ ...noteForm, noteType: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="INTERNAL">Internal Only (Staff & Engineers)</option>
                  <option value="CUSTOMER_VISIBLE">Customer Visible (Shown to Hospital Lab)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note Content</label>
                <textarea
                  rows={4}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  placeholder="Record diagnostic findings, voltage values, replacement notes..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddNote(selectedTicket.id)}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SPARE PART */}
      {showAddPartModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#D2E7C4] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E331B] text-base">Record Spare Part Used</h3>
              <button onClick={() => setShowAddPartModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Spare Part</label>
                <select
                  value={partForm.partId}
                  onChange={(e) => setPartForm({ ...partForm, partId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-[#D2E7C4] rounded-lg"
                >
                  {spareParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partNumber} - {p.partName} (₹{p.unitCost}, Stock: {p.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={partForm.quantity}
                  onChange={(e) => setPartForm({ ...partForm, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 bg-slate-50 border border-[#D2E7C4] rounded-lg font-mono"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={partForm.isWarrantyCovered}
                    onChange={(e) => setPartForm({ ...partForm, isWarrantyCovered: e.target.checked, isBillable: !e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Covered under active warranty / AMC contract (₹0 to customer)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowAddPartModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddPart(selectedTicket.id)}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Deduct Stock & Add to Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT RESOLUTION */}
      {showResolveModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Submit Biomedical Resolution</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Identified Root Cause</label>
                <input
                  type="text"
                  value={resolveForm.rootCause}
                  onChange={(e) => setResolveForm({ ...resolveForm, rootCause: e.target.value })}
                  placeholder="e.g. Quartz halogen lamp filament aged past 1,200 operating hours"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corrective Action Taken</label>
                <textarea
                  rows={2}
                  value={resolveForm.actionTaken}
                  onChange={(e) => setResolveForm({ ...resolveForm, actionTaken: e.target.value })}
                  placeholder="e.g. Replaced halogen lamp, aligned optical path, verified water blank drift"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Test Run & QC Replicate Result</label>
                <input
                  type="text"
                  value={resolveForm.testRunResult}
                  onChange={(e) => setResolveForm({ ...resolveForm, testRunResult: e.target.value })}
                  placeholder="e.g. Passed 10x replicate run. CV = 0.8% (Target < 2.0%)"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reagent Lot Tested</label>
                  <input
                    type="text"
                    value={resolveForm.reagentLotTested}
                    onChange={(e) => setResolveForm({ ...resolveForm, reagentLotTested: e.target.value })}
                    placeholder="e.g. Erba Chem Lot #9901"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observed QC Values</label>
                  <input
                    type="text"
                    value={resolveForm.qcValueObserved}
                    onChange={(e) => setResolveForm({ ...resolveForm, qcValueObserved: e.target.value })}
                    placeholder="e.g. L1: 98.2, L2: 242.0"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveTicket(selectedTicket.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Mark Resolved & Request Customer Signoff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER FEEDBACK & SIGNATURE */}
      {showFeedbackModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Customer Sign-off & Satisfaction</h3>
              <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Star Rating (1 to 5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 text-amber-500 hover:scale-110 transition cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= feedbackForm.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                  <span className="font-bold text-slate-700 ml-2">{feedbackForm.rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Feedback Comments</label>
                <textarea
                  rows={2}
                  value={feedbackForm.feedbackNotes}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackNotes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signatory Name</label>
                  <input
                    type="text"
                    value={feedbackForm.customerSignatoryName}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, customerSignatoryName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={feedbackForm.customerDesignation}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, customerDesignation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(selectedTicket.id)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Submit Sign-off & Send to Back Office
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BACK-OFFICE QA REVIEW */}
      {showBackOfficeModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#D2E7C4] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E331B] text-base">Back-Office QA & Billing Audit</h3>
              <button onClick={() => setShowBackOfficeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F5F6F0] rounded-lg border border-[#D2E7C4] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1E331B]">
                  <input
                    type="checkbox"
                    checked={backOfficeForm.qaPassed}
                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, qaPassed: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Biomedical QA Protocol & Calibration Check Passed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#1E331B]">
                  <input
                    type="checkbox"
                    checked={backOfficeForm.warrantyApproved}
                    onChange={(e) => setBackOfficeForm({ ...backOfficeForm, warrantyApproved: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E]"
                  />
                  <span>Warranty & AMC/CMC Contract Verified</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Review Notes</label>
                <textarea
                  rows={2}
                  value={backOfficeForm.reviewNotes}
                  onChange={(e) => setBackOfficeForm({ ...backOfficeForm, reviewNotes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-[#D2E7C4] rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowBackOfficeModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBackOfficeSubmit(selectedTicket.id)}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Approve QA & Close Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REOPEN TICKET */}
      {showReopenModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Reopen Ticket / Arbitrate Dispute</h3>
              <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Reopening</label>
                <textarea
                  rows={3}
                  value={reopenForm.reopenReason}
                  onChange={(e) => setReopenForm({ ...reopenForm, reopenReason: e.target.value })}
                  placeholder="Specify why customer reported problem recurring..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowReopenModal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReopenTicket(selectedTicket.id)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Reopen & Re-assign Engineer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AUTOMATED API TEST RUNNER */}
      {showTestRunnerModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Service & Field Complaint Test Runner</h3>
                  <p className="text-xs text-slate-500">Live verification of all 15 endpoints across the complete service lifecycle</p>
                </div>
              </div>
              <button onClick={() => setShowTestRunnerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="text-slate-600">
                Tests: Equipment, Tickets, SLA calculation, Assignment, Geo Check-In, Parts deduction, QC Resolution, Customer Signoff, Reopen
              </div>
              <button
                onClick={handleExecuteTestSuite}
                disabled={isRunningTests}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              >
                {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>{isRunningTests ? 'Executing 15 Tests...' : 'Run All Tests'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {testResults.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Click <strong>"Run All Tests"</strong> to execute live end-to-end API test assertions against the server.
                </div>
              ) : (
                testResults.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                      t.status === 'PASSED'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-red-50/70 border-red-200 text-red-950'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className={`w-4 h-4 ${t.status === 'PASSED' ? 'text-emerald-600' : 'text-red-500'}`} />
                        <span>{t.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/70 border font-mono">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-85 pl-5">{t.message}</div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.status === 'PASSED' ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                      }`}>
                        {t.status}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{t.durationMs}ms</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Passed: {testResults.filter(t => t.status === 'PASSED').length} / {testResults.length}
              </span>
              <button
                onClick={() => setShowTestRunnerModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
