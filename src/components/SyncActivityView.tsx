import React, { useState, useEffect } from 'react';
import { 
  SyncQueueItem, 
  SyncActionType, 
  OfflineFeaturePolicyClass, 
  SyncItemStatus, 
  NetworkConnectionState, 
  AttendanceActionPayload,
  ServiceDraftPayload,
  VisitReportPayload,
  ExpenseSubmissionPayload,
  ConflictDetails
} from '../types';
import { syncEngine } from '../utils/syncEngine';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Trash2, 
  FileText, 
  Plus, 
  MapPin, 
  Layers, 
  Wrench, 
  Receipt, 
  UserCheck, 
  Send, 
  ShieldAlert, 
  Sliders, 
  Sparkles, 
  RotateCcw, 
  ArrowRight,
  Database,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Code,
  Smartphone,
  Eye,
  Edit3,
  X
} from 'lucide-react';

interface SyncActivityViewProps {
  accessToken?: string | null;
  currentRole?: string;
}

export const SyncActivityView: React.FC<SyncActivityViewProps> = ({ accessToken, currentRole = 'SERVICE_ENGINEER' }) => {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [networkState, setNetworkState] = useState<NetworkConnectionState>('ONLINE');
  const [simulationMode, setSimulationMode] = useState<'LIVE' | 'SIMULATE_OFFLINE' | 'SIMULATE_FLAKY'>('LIVE');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'FAILED' | 'CONFLICT' | 'SYNCED'>('ALL');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // Modals & Panels
  const [showQueueModal, setShowQueueModal] = useState<boolean>(false);
  const [newActionType, setNewActionType] = useState<SyncActionType>('ATTENDANCE_CHECKIN');
  const [selectedConflictItem, setSelectedConflictItem] = useState<SyncQueueItem | null>(null);
  const [editingItem, setEditingItem] = useState<SyncQueueItem | null>(null);
  const [editedPayloadJson, setEditedPayloadJson] = useState<string>('');

  // Server Stats & Activity Log
  const [serverStats, setServerStats] = useState<any>(null);
  const [serverActivityLogs, setServerActivityLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'QUEUE_MANAGER' | 'SERVER_LEDGER' | 'IDEMPOTENCY_SANDBOX'>('QUEUE_MANAGER');

  // Quick Action Form State
  const [attForm, setAttForm] = useState({
    engineerName: 'Anand Deshmukh',
    punchType: 'PUNCH_IN' as 'PUNCH_IN' | 'PUNCH_OUT',
    shift: 'GENERAL_MORNING' as 'GENERAL_MORNING' | 'EVENING_EMERGENCY' | 'NIGHT_ONCALL',
    odometerReadingKm: 42210,
    notes: 'Onsite arrival at Suburban Diagnostic Hub'
  });

  const [servForm, setServForm] = useState({
    ticketId: 'tck-001',
    ticketNumber: 'TCK-2026-001',
    customerLabName: 'Apex Clinical & Pathology Laboratories',
    equipmentName: 'Erba Chem 7 Photometer',
    observations: 'Replaced optical filter wheel and performed 340nm zeroing test.',
    actionTaken: 'Completed 5-point calibration verification with Roche standard serum.',
    partName: 'Quartz Halogen Lamp 12V 20W',
    partNumber: 'SP-CHEM7-HL12',
    partQuantity: 1,
    partPrice: 1850.00,
    customerName: 'Dr. Arvind Kulkarni'
  });

  const [visitForm, setVisitForm] = useState({
    labName: 'Lilavati Hospital & Research Center',
    labAddress: 'Bandra West, Mumbai',
    directorName: 'Dr. Nitin Deshmukh',
    contactNumber: '+919820099881',
    discussion: 'Demonstrated Erba XL-640 automated reagent bulk discount contracts.',
    competitorNoticed: 'Beckman Coulter AU480 currently running biochemistry line',
    potentialInr: 250000
  });

  const [expForm, setExpForm] = useState({
    category: 'TRAVEL_FUEL' as 'TRAVEL_FUEL' | 'MEALS_PER_DIEM' | 'HOTEL_LODGING' | 'TOLL_PARKING' | 'EMERGENCY_FREIGHT',
    amount: 1250,
    billNumber: 'BOM-EXP-9921',
    merchant: 'Bandrawest Petrol Pump',
    description: 'Emergency travel for photometer breakdown replacement'
  });

  useEffect(() => {
    // Subscribe to Sync Engine updates
    const unsubscribe = syncEngine.subscribe((items, netState) => {
      setQueue(items);
      setNetworkState(netState);
      setSimulationMode(syncEngine.getSimulationMode());
    });

    fetchServerTelemetry();

    return () => {
      unsubscribe();
    };
  }, [accessToken]);

  const fetchServerTelemetry = async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/v1/sync/stats', { headers }),
        fetch('/api/v1/sync/activity?limit=25', { headers })
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setServerStats(s.data);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setServerActivityLogs(l.data?.logs || []);
      }
    } catch (e) {
      console.warn('Could not fetch server telemetry:', e);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    await syncEngine.processBatchSync(accessToken);
    setIsSyncing(false);
    fetchServerTelemetry();
  };

  const handleRetryItem = async (itemId: string) => {
    await syncEngine.retryItem(itemId, accessToken);
    fetchServerTelemetry();
  };

  const handleDiscardItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to discard this queued action?')) {
      syncEngine.discardItem(itemId);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulationModeChange = (mode: 'LIVE' | 'SIMULATE_OFFLINE' | 'SIMULATE_FLAKY') => {
    syncEngine.setSimulationMode(mode);
    setSimulationMode(mode);
  };

  const handleCreateQueuedAction = (e: React.FormEvent) => {
    e.preventDefault();

    if (newActionType === 'ATTENDANCE_CHECKIN' || newActionType === 'ATTENDANCE_CHECKOUT') {
      if (newActionType === 'ATTENDANCE_CHECKIN') {
        syncEngine.queueAttendanceCheckin({
          engineerId: 'u-eng-01',
          engineerName: attForm.engineerName,
          punchType: attForm.punchType,
          shift: attForm.shift,
          odometerReadingKm: Number(attForm.odometerReadingKm),
          batteryLevelPercent: 91,
          notes: attForm.notes
        });
      } else {
        syncEngine.queueAttendanceCheckout({
          engineerId: 'u-eng-01',
          engineerName: attForm.engineerName,
          punchType: 'PUNCH_OUT',
          shift: attForm.shift,
          odometerReadingKm: Number(attForm.odometerReadingKm) + 25,
          batteryLevelPercent: 78,
          notes: attForm.notes
        });
      }
    } else if (newActionType === 'SERVICE_WORK_UPDATE') {
      syncEngine.queueServiceDraft({
        ticketId: servForm.ticketId,
        ticketNumber: servForm.ticketNumber,
        customerLabName: servForm.customerLabName,
        equipmentName: servForm.equipmentName,
        preliminaryObservations: servForm.observations,
        draftActionTaken: servForm.actionTaken,
        testRunCompleted: true,
        sparePartsDraft: [
          {
            partId: 'sp-001',
            partName: servForm.partName,
            partNumber: servForm.partNumber,
            quantity: Number(servForm.partQuantity),
            unitPrice: Number(servForm.partPrice)
          }
        ],
        customerAcknowledgedBy: servForm.customerName,
        customerDesignation: 'Lab Biochemist'
      });
    } else if (newActionType === 'VISIT_REPORT') {
      syncEngine.queueVisitReport({
        labName: visitForm.labName,
        labAddress: visitForm.labAddress,
        doctorOrDirectorName: visitForm.directorName,
        contactNumber: visitForm.contactNumber,
        discussionSummary: visitForm.discussion,
        followUpRequired: true,
        followUpDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        sampleCollectionRequired: false,
        competitorReagentsNoticed: visitForm.competitorNoticed,
        estimatedMonthlyPotentialInr: Number(visitForm.potentialInr)
      });
    } else if (newActionType === 'EXPENSE_SUBMISSION') {
      syncEngine.queueExpenseClaim({
        expenseCategory: expForm.category,
        amount: Number(expForm.amount),
        currency: 'INR',
        billNumber: expForm.billNumber,
        billDate: new Date().toISOString().split('T')[0],
        merchantName: expForm.merchant,
        description: expForm.description
      });
    }

    setShowQueueModal(false);
  };

  const handleResolveConflict = async (resolution: 'SERVER_WINS' | 'CLIENT_CHANGE_ACCEPTED' | 'MERGE_FIELDS') => {
    if (!selectedConflictItem) return;
    await syncEngine.resolveConflict(
      selectedConflictItem.id,
      resolution,
      { notes: 'Resolved via Sync Activity Manager UI' },
      selectedConflictItem.businessData?.ticketId || 'tck-001',
      accessToken
    );
    setSelectedConflictItem(null);
    fetchServerTelemetry();
  };

  const handleSaveEditedPayload = () => {
    if (!editingItem) return;
    try {
      const parsed = JSON.parse(editedPayloadJson);
      syncEngine.updateItemPayload(editingItem.id, parsed);
      setEditingItem(null);
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  // Filtered Items
  const filteredQueue = queue.filter(item => {
    if (activeFilter === 'PENDING' && item.syncStatus !== 'PENDING' && item.syncStatus !== 'SYNCING') return false;
    if (activeFilter === 'FAILED' && item.syncStatus !== 'FAILED') return false;
    if (activeFilter === 'CONFLICT' && item.syncStatus !== 'CONFLICT' && item.syncStatus !== 'REQUIRES_USER_ACTION') return false;
    if (activeFilter === 'SYNCED' && item.syncStatus !== 'SYNCED') return false;

    if (actionTypeFilter !== 'ALL' && item.actionType !== actionTypeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = (item.idempotencyKey || '').toLowerCase().includes(q);
      const matchType = (item.actionType || '').toLowerCase().includes(q);
      const matchData = JSON.stringify(item.businessData || {}).toLowerCase().includes(q);
      return matchKey || matchType || matchData;
    }

    return true;
  });

  const pendingCount = queue.filter(i => i.syncStatus === 'PENDING' || i.syncStatus === 'SYNCING').length;
  const failedCount = queue.filter(i => i.syncStatus === 'FAILED').length;
  const conflictCount = queue.filter(i => i.syncStatus === 'CONFLICT' || i.syncStatus === 'REQUIRES_USER_ACTION').length;
  const syncedCount = queue.filter(i => i.syncStatus === 'SYNCED').length;

  return (
    <div className="space-y-6" id="sync-activity-root">
      {/* 1. Header and Connection Status Banner */}
      <div className="bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22381E] text-[#D2E7C4] flex items-center justify-center font-bold shadow-xs">
                <RotateCcw className="w-5 h-5 text-[#D2E7C4]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1E331B] flex items-center gap-2">
                  Offline Sync Engine & Idempotency Queue
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">
                    Resilient Offline Sync
                  </span>
                </h1>
                <p className="text-sm text-[#415439]">
                  Client-side transactional queuing with cryptographic idempotency keys, background reconciliation, and conflict resolution.
                </p>
              </div>
            </div>
          </div>

          {/* Network Simulator Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-[#E4E8DF]/60 p-1 rounded-lg border border-[#D2E7C4] text-xs font-medium">
              <button
                type="button"
                onClick={() => handleSimulationModeChange('LIVE')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  simulationMode === 'LIVE'
                    ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs font-semibold'
                    : 'text-[#415439] hover:text-[#1E331B]'
                }`}
                title="Use real browser network detection"
              >
                <Wifi className="w-3.5 h-3.5 text-[#5F8F4D]" />
                Live Online
              </button>
              <button
                type="button"
                onClick={() => handleSimulationModeChange('SIMULATE_OFFLINE')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  simulationMode === 'SIMULATE_OFFLINE'
                    ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40 shadow-xs font-bold'
                    : 'text-[#415439] hover:text-[#1E331B]'
                }`}
                title="Force offline state to test queueing actions"
              >
                <WifiOff className="w-3.5 h-3.5 text-[#C58A16]" />
                Simulate Offline
              </button>
              <button
                type="button"
                onClick={() => handleSimulationModeChange('SIMULATE_FLAKY')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  simulationMode === 'SIMULATE_FLAKY'
                    ? 'bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40 shadow-xs font-bold'
                    : 'text-[#415439] hover:text-[#1E331B]'
                }`}
                title="Simulate slow spotty 2G connection with latency"
              >
                <Activity className="w-3.5 h-3.5 text-[#4C8994]" />
                Spotty 2G
              </button>
            </div>

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing || networkState === 'OFFLINE' || pendingCount + failedCount === 0}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isSyncing || networkState === 'OFFLINE' || pendingCount + failedCount === 0
                  ? 'bg-[#E4E8DF] text-[#82917C] cursor-not-allowed'
                  : 'bg-[#22381E] hover:bg-[#1E331B] text-[#F9FAF6] shadow-xs'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing...' : `Sync All (${pendingCount + failedCount})`}
            </button>

            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="px-4 py-2 bg-[#D2E7C4] hover:bg-[#C3E2B8] text-[#1E331B] border border-[#5F8F4D]/40 rounded-lg text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Queue Action
            </button>
          </div>
        </div>

        {/* Realtime Status Sub-bar */}
        <div className="mt-4 pt-4 border-t border-[#D2E7C4] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                networkState === 'ONLINE' ? 'bg-[#5F8F4D] animate-pulse' :
                networkState === 'SYNCING' ? 'bg-[#4C8994] animate-spin' :
                networkState === 'LIMITED_CONNECTION' ? 'bg-[#82917C]' : 'bg-[#C58A16]'
              }`} />
              <strong className="text-[#1E331B] uppercase">Engine Connection:</strong> {networkState}
              {simulationMode !== 'LIVE' && (
                <span className="text-[#6B4B12] font-medium">({simulationMode})</span>
              )}
            </span>
            <span>•</span>
            <span>
              <strong>Device ID:</strong> MUMBAI-FIELD-TAB-01
            </span>
            <span>•</span>
            <span>
              <strong>Last Full Sync:</strong> {syncEngine.getLastSyncTime() ? new Date(syncEngine.getLastSyncTime()!).toLocaleTimeString() : 'Never'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                syncEngine.seedDemoActions();
                fetchServerTelemetry();
              }}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Seed Demo Actions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => syncEngine.clearCompletedSynced()}
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              Clear Synced History
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div 
          onClick={() => setActiveFilter('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Total In Queue</span>
            <Layers className="w-4 h-4 opacity-70" />
          </div>
          <div className="text-2xl font-bold">{queue.length}</div>
          <div className="text-xs opacity-70 mt-1">Actions in local ledger</div>
        </div>

        <div 
          onClick={() => setActiveFilter('PENDING')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'PENDING' ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Sync</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{pendingCount}</div>
          <div className="text-xs text-amber-700 mt-1">Awaiting online dispatch</div>
        </div>

        <div 
          onClick={() => setActiveFilter('SYNCED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'SYNCED' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Synced / Replayed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{syncedCount}</div>
          <div className="text-xs text-emerald-700 mt-1">Server confirmed & committed</div>
        </div>

        <div 
          onClick={() => setActiveFilter('FAILED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'FAILED' ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Failed / Retrying</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900">{failedCount}</div>
          <div className="text-xs text-rose-700 mt-1">Network or validation errors</div>
        </div>

        <div 
          onClick={() => setActiveFilter('CONFLICT')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeFilter === 'CONFLICT' ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-sm' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Conflicts Detected</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-900">{conflictCount}</div>
          <div className="text-xs text-purple-700 mt-1">Needs review or merge</div>
        </div>
      </div>

      {/* 3. Main Navigation Tabs */}
      <div className="border-b border-[#D2E7C4] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('QUEUE_MANAGER')}
            className={`pb-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'QUEUE_MANAGER'
                ? 'border-[#22381E] text-[#1E331B]'
                : 'border-transparent text-[#415439] hover:text-[#1E331B]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Local Queue Manager ({queue.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('SERVER_LEDGER');
              fetchServerTelemetry();
            }}
            className={`pb-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'SERVER_LEDGER'
                ? 'border-[#22381E] text-[#1E331B]'
                : 'border-transparent text-[#415439] hover:text-[#1E331B]'
            }`}
          >
            <Database className="w-4 h-4" />
            Server Processed Ledger & Idempotency Store
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('IDEMPOTENCY_SANDBOX')}
            className={`pb-3 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'IDEMPOTENCY_SANDBOX'
                ? 'border-[#22381E] text-[#1E331B]'
                : 'border-transparent text-[#415439] hover:text-[#1E331B]'
            }`}
          >
            <Code className="w-4 h-4" />
            Idempotency & Policy Architecture
          </button>
        </div>
      </div>

      {/* TAB 1: LOCAL QUEUE MANAGER */}
      {activeTab === 'QUEUE_MANAGER' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search idempotency key, lab, engineer, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-teal-600 w-64"
              />

              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              >
                <option value="ALL">All Action Types</option>
                <option value="ATTENDANCE_CHECKIN">Attendance Punch-In</option>
                <option value="ATTENDANCE_CHECKOUT">Attendance Punch-Out</option>
                <option value="SERVICE_WORK_UPDATE">Service Work Draft</option>
                <option value="VISIT_REPORT">Field Visit Report</option>
                <option value="EXPENSE_SUBMISSION">Expense Claim</option>
                <option value="SERVICE_FEEDBACK_SUBMISSION">Customer Feedback</option>
                <option value="ORDER_DRAFT_SYNC">Cart / Order Draft</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredQueue.length} of {queue.length} items
            </div>
          </div>

          {/* Queue Items List */}
          {filteredQueue.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Queue is Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                No actions match your current filter. You can queue new offline actions or generate demo items to test synchronization.
              </p>
              <button
                type="button"
                onClick={() => syncEngine.seedDemoActions()}
                className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-semibold inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Seed Sample Offline Actions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueue.map((item) => {
                const isExpanded = expandedItemId === item.id;
                const isPending = item.syncStatus === 'PENDING' || item.syncStatus === 'SYNCING';
                const isFailed = item.syncStatus === 'FAILED';
                const isConflict = item.syncStatus === 'CONFLICT' || item.syncStatus === 'REQUIRES_USER_ACTION';
                const isSynced = item.syncStatus === 'SYNCED';

                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl transition-all shadow-2xs overflow-hidden ${
                      isConflict ? 'border-purple-300 ring-1 ring-purple-200' :
                      isFailed ? 'border-rose-300' :
                      isPending ? 'border-amber-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Action Summary */}
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl text-white mt-0.5 shrink-0 ${
                          (item.actionType || '').includes('ATTENDANCE') ? 'bg-[#4C8994]' :
                          (item.actionType || '').includes('SERVICE') ? 'bg-[#C58A16]' :
                          (item.actionType || '').includes('VISIT') ? 'bg-[#22381E] text-[#D2E7C4]' :
                          (item.actionType || '').includes('EXPENSE') ? 'bg-[#5F8F4D]' : 'bg-[#1E331B]'
                        }`}>
                          {(item.actionType || '').includes('ATTENDANCE') ? <UserCheck className="w-5 h-5" /> :
                           (item.actionType || '').includes('SERVICE') ? <Wrench className="w-5 h-5" /> :
                           (item.actionType || '').includes('VISIT') ? <FileText className="w-5 h-5" /> :
                           (item.actionType || '').includes('EXPENSE') ? <Receipt className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#1E331B]">
                              {item.actionType.replace(/_/g, ' ')}
                            </span>
                            
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              item.policyClass === 'QUEUE_FOR_SERVER_SYNC' ? 'bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40' :
                              item.policyClass === 'OFFLINE_DRAFT_ONLY' ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40' : 'bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40'
                            }`}>
                              {item.policyClass.replace(/_/g, ' ')}
                            </span>

                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              isSynced ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40' :
                              isPending ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40' :
                              isFailed ? 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40' : 'bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40'
                            }`}>
                              {isSynced && <CheckCircle2 className="w-3 h-3 text-[#5F8F4D]" />}
                              {isPending && <Clock className="w-3 h-3 animate-spin text-[#C58A16]" />}
                              {isFailed && <AlertTriangle className="w-3 h-3 text-[#B94A40]" />}
                              {isConflict && <ShieldAlert className="w-3 h-3" />}
                              {item.syncStatus}
                            </span>
                          </div>

                          {/* Business Data Snapshot */}
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {item.actionType === 'ATTENDANCE_CHECKIN' && (
                              <span>
                                <strong>Engineer:</strong> {item.businessData?.engineerName} • <strong>Shift:</strong> {item.businessData?.shift} • <strong>Odo:</strong> {item.businessData?.odometerReadingKm} km
                              </span>
                            )}
                            {item.actionType === 'ATTENDANCE_CHECKOUT' && (
                              <span>
                                <strong>Engineer:</strong> {item.businessData?.engineerName} • <strong>Checkout Shift:</strong> {item.businessData?.shift}
                              </span>
                            )}
                            {item.actionType === 'SERVICE_WORK_UPDATE' && (
                              <span>
                                <strong>Ticket:</strong> #{item.businessData?.ticketNumber} • <strong>Lab:</strong> {item.businessData?.customerLabName} • <strong>Parts Drafted:</strong> {item.businessData?.sparePartsDraft?.length || 0}
                              </span>
                            )}
                            {item.actionType === 'VISIT_REPORT' && (
                              <span>
                                <strong>Client Lab:</strong> {item.businessData?.labName} • <strong>Director:</strong> {item.businessData?.doctorOrDirectorName} • <strong>Potential:</strong> ₹{item.businessData?.estimatedMonthlyPotentialInr?.toLocaleString() || 0}
                              </span>
                            )}
                            {item.actionType === 'EXPENSE_SUBMISSION' && (
                              <span>
                                <strong>Category:</strong> {item.businessData?.expenseCategory} • <strong>Amount:</strong> ₹{item.businessData?.amount} • <strong>Merchant:</strong> {item.businessData?.merchantName}
                              </span>
                            )}
                          </div>

                          {/* Idempotency Key pill */}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-mono">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              ������ {item.idempotencyKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyKey(item.idempotencyKey)}
                              className="text-slate-400 hover:text-slate-700 p-0.5"
                              title="Copy Idempotency Key"
                            >
                              {copiedKey === item.idempotencyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <span>•</span>
                            <span className="text-slate-400">
                              Created: {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                            {item.serverConfirmedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">
                                  Synced: {new Date(item.serverConfirmedAt).toLocaleTimeString()}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Error or Conflict Alert Banner */}
                          {item.errorMessage && (
                            <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                              <span>{item.errorMessage}</span>
                            </div>
                          )}

                          {isConflict && (
                            <div className="mt-2 bg-purple-50 border border-purple-200 text-purple-900 text-xs px-3 py-1.5 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 shrink-0 text-purple-600" />
                                <span>Concurrent modification conflict detected on server. Action required.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedConflictItem(item)}
                                className="px-2.5 py-1 bg-purple-700 text-white rounded text-[11px] font-bold hover:bg-purple-800"
                              >
                                Resolve Conflict
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {(isFailed || isPending) && (
                          <button
                            type="button"
                            onClick={() => handleRetryItem(item.id)}
                            disabled={networkState === 'OFFLINE'}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry Sync
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditedPayloadJson(JSON.stringify(item.businessData, null, 2));
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                          title="Edit Payload Data"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
                          title="View JSON Payload details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDiscardItem(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs"
                          title="Discard / Remove Action"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable JSON Inspector & Location snapshot */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 text-xs space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                              <Code className="w-3.5 h-3.5 text-teal-600" />
                              Payload Body (Business Data)
                            </div>
                            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-48">
                              {JSON.stringify(item.businessData, null, 2)}
                            </pre>
                          </div>

                          <div className="space-y-2">
                            <div className="font-bold text-slate-700 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#22381E]" />
                              Device Snapshot & Geolocation
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-[#D2E7C4] space-y-1 text-slate-600">
                              <div><strong>Device ID:</strong> {item.deviceId}</div>
                              <div><strong>Retry Count:</strong> {item.retryCount}</div>
                              {item.location && (
                                <>
                                  <div><strong>Coordinates:</strong> {item.location.latitude.toFixed(6)}, {item.location.longitude.toFixed(6)}</div>
                                  <div><strong>GPS Accuracy:</strong> ±{item.location.accuracyMeters} meters</div>
                                  <div><strong>GPS Status:</strong> <span className="text-[#245B63] font-semibold">{item.location.status}</span></div>
                                </>
                              )}
                              {item.lastAttemptAt && (
                                <div><strong>Last Attempt:</strong> {new Date(item.lastAttemptAt).toLocaleString()}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERVER PROCESSED LEDGER & IDEMPOTENCY STORE */}
      {activeTab === 'SERVER_LEDGER' && (
        <div className="space-y-6">
          {/* Server Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#D2E7C4]">
              <div className="text-xs font-semibold text-slate-500 uppercase">Server Idempotency Keys</div>
              <div className="text-2xl font-bold text-[#1E331B] mt-1">{serverStats?.totalIdempotencyKeys || 0}</div>
              <div className="text-xs text-[#245B63] mt-1">Deduplication cache active</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D2E7C4]">
              <div className="text-xs font-semibold text-slate-500 uppercase">Attendance Punches</div>
              <div className="text-2xl font-bold text-[#1E331B] mt-1">{serverStats?.totalAttendance || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Verified with GPS tags</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D2E7C4]">
              <div className="text-xs font-semibold text-slate-500 uppercase">Field Visit Reports</div>
              <div className="text-2xl font-bold text-[#1E331B] mt-1">{serverStats?.totalVisits || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Client interactions registered</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D2E7C4]">
              <div className="text-xs font-semibold text-slate-500 uppercase">Synced Expenses</div>
              <div className="text-2xl font-bold text-[#1E331B] mt-1">{serverStats?.totalExpenses || 0}</div>
              <div className="text-xs text-slate-500 mt-1">Vouchers in audit pipeline</div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                Server Synchronization Audit Log
              </h3>
              <button
                type="button"
                onClick={fetchServerTelemetry}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Idempotency Key</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Server Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {serverActivityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                        No server sync activity logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    serverActivityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3 whitespace-nowrap text-slate-500 font-sans">
                          {new Date(log.serverProcessedAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-sans font-bold text-slate-800">
                          {log.actionType}
                        </td>
                        <td className="p-3 text-[11px] text-slate-600">
                          {log.idempotencyKey}
                        </td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            log.status === 'SUCCESS' ? 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40' :
                            log.status === 'REPLAY' ? 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40' : 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]/40'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 font-sans text-slate-700">
                          {log.message}
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

      {/* TAB 3: IDEMPOTENCY & POLICY ARCHITECTURE EXPLAINER */}
      {activeTab === 'IDEMPOTENCY_SANDBOX' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-teal-600" />
              Idempotency Key Guarantees
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In field biomedical service operations, connectivity is often intermittent. Engineers punch in, take notes, and replace parts in hospital basements. Without idempotency keys, repeated network retries can duplicate attendance records or submit double expense claims.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-xs text-slate-800">1. Client Token Generation</div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  IDEM-{'{ACTION_TYPE}'}-{'{USER_ID}'}-{'{TIMESTAMP}'}-{'{RANDOM_HASH}'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-xs text-slate-800">2. Server Transaction Deduplication</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Server checks its memory/database registry. If a key matches a previously completed transaction, it returns HTTP 200 with header <code>X-Idempotency-Replayed: 1</code> and does NOT re-execute the business logic.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-xs text-slate-800">3. Safe Batching Protocol</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The client sends an ordered batch of all pending items upon reconnection. The server processes each atomically and returns precise per-item receipts.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#D2E7C4] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#1E331B] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#22381E]" />
              Offline Feature Policy Classification
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#D2E7C4]/40 border border-[#5F8F4D]/30">
                <div className="font-bold text-[#1E331B]">FULLY_OFFLINE_CAPABLE</div>
                <div className="text-[#1E331B] text-[11px] mt-0.5">
                  Cached read-only access: Product catalog, customer lab profiles, installed equipment directory, MSDS documents.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#C9DDE0]/40 border border-[#4C8994]/30">
                <div className="font-bold text-[#245B63]">QUEUE_FOR_SERVER_SYNC (Non-Sensitive)</div>
                <div className="text-[#245B63] text-[11px] mt-0.5">
                  Attendance punch-in/out, field visit reports, engineer customer communication, customer ratings. Queued with cryptographic idempotency.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F4DFA3]/40 border border-[#C58A16]/30">
                <div className="font-bold text-[#6B4B12]">OFFLINE_DRAFT_ONLY</div>
                <div className="text-[#6B4B12] text-[11px] mt-0.5">
                  Field service draft observations, PM checklist drafts, expense claims drafts. Clearly badged as "LOCAL DRAFT" until verified.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <div className="font-bold text-rose-900">ONLINE_REQUIRED (Strict Authority)</div>
                <div className="text-rose-800 text-[11px] mt-0.5">
                  Final order placement, credit limit authorization, payment gateway capture, security permission changes. Cannot be committed offline.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUEUE NEW ACTION */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                Queue Non-Sensitive Offline Action
              </h3>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQueuedAction} className="space-y-4 mt-4 text-xs">
              {/* Action Type Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Action Type</label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800"
                >
                  <option value="ATTENDANCE_CHECKIN">1. Attendance Punch-In (Field Check-In)</option>
                  <option value="ATTENDANCE_CHECKOUT">2. Attendance Punch-Out (Field Shift End)</option>
                  <option value="SERVICE_WORK_UPDATE">3. Service Work Update / Repair Draft</option>
                  <option value="VISIT_REPORT">4. Field Client Visit Report</option>
                  <option value="EXPENSE_SUBMISSION">5. Field Expense Claim Submission</option>
                </select>
              </div>

              {/* Action Specific Fields */}
              {newActionType === 'ATTENDANCE_CHECKIN' && (
                <div className="space-y-3 p-3 bg-[#C9DDE0]/30 rounded-xl border border-[#4C8994]/30">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Engineer Name</label>
                    <input
                      type="text"
                      value={attForm.engineerName}
                      onChange={(e) => setAttForm({ ...attForm, engineerName: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Shift</label>
                      <select
                        value={attForm.shift}
                        onChange={(e) => setAttForm({ ...attForm, shift: e.target.value as any })}
                        className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                      >
                        <option value="GENERAL_MORNING">General Morning Shift</option>
                        <option value="EVENING_EMERGENCY">Evening Emergency Oncall</option>
                        <option value="NIGHT_ONCALL">Night ICU Urgent Shift</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Odometer (km)</label>
                      <input
                        type="number"
                        value={attForm.odometerReadingKm}
                        onChange={(e) => setAttForm({ ...attForm, odometerReadingKm: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Field Notes</label>
                    <input
                      type="text"
                      value={attForm.notes}
                      onChange={(e) => setAttForm({ ...attForm, notes: e.target.value })}
                      className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {newActionType === 'SERVICE_WORK_UPDATE' && (
                <div className="space-y-3 p-3 bg-[#F4DFA3]/30 rounded-xl border border-[#C58A16]/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Ticket Number</label>
                      <input
                        type="text"
                        value={servForm.ticketNumber}
                        onChange={(e) => setServForm({ ...servForm, ticketNumber: e.target.value })}
                        className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Customer Lab</label>
                      <input
                        type="text"
                        value={servForm.customerLabName}
                        onChange={(e) => setServForm({ ...servForm, customerLabName: e.target.value })}
                        className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Preliminary Observations</label>
                    <textarea
                      value={servForm.observations}
                      onChange={(e) => setServForm({ ...servForm, observations: e.target.value })}
                      rows={2}
                      className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Action Taken Draft</label>
                    <textarea
                      value={servForm.actionTaken}
                      onChange={(e) => setServForm({ ...servForm, actionTaken: e.target.value })}
                      rows={2}
                      className="w-full p-2 bg-white border border-[#D2E7C4] rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {newActionType === 'VISIT_REPORT' && (
                <div className="space-y-3 p-3 bg-[#D2E7C4]/30 rounded-xl border border-[#5F8F4D]/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Lab / Hospital Name</label>
                      <input
                        type="text"
                        value={visitForm.labName}
                        onChange={(e) => setVisitForm({ ...visitForm, labName: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Doctor / Director</label>
                      <input
                        type="text"
                        value={visitForm.directorName}
                        onChange={(e) => setVisitForm({ ...visitForm, directorName: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Discussion Summary</label>
                    <textarea
                      value={visitForm.discussion}
                      onChange={(e) => setVisitForm({ ...visitForm, discussion: e.target.value })}
                      rows={2}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {newActionType === 'EXPENSE_SUBMISSION' && (
                <div className="space-y-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Category</label>
                      <select
                        value={expForm.category}
                        onChange={(e) => setExpForm({ ...expForm, category: e.target.value as any })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="TRAVEL_FUEL">Travel / Fuel (Petrol/Diesel)</option>
                        <option value="MEALS_PER_DIEM">Meals & Daily Per Diem</option>
                        <option value="HOTEL_LODGING">Hotel / Outstation Lodging</option>
                        <option value="TOLL_PARKING">Toll Plaza & Hospital Parking</option>
                        <option value="EMERGENCY_FREIGHT">Emergency Spares Freight Courier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Amount (INR)</label>
                      <input
                        type="number"
                        value={expForm.amount}
                        onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Description & Justification</label>
                    <input
                      type="text"
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  Queue with Idempotency Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFLICT RESOLUTION */}
      {selectedConflictItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-purple-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-purple-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                Resolve Server Conflict: {selectedConflictItem.actionType}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedConflictItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              The target server entity was modified on the cloud database while this client was working offline. Choose how to reconcile the conflicting changes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-700 mb-1">Local Client Draft</div>
                <pre className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 max-h-36 overflow-y-auto">
                  {JSON.stringify(selectedConflictItem.businessData, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="font-bold text-purple-900 mb-1">Server Current State</div>
                <pre className="text-[10px] font-mono bg-white p-2 rounded border border-purple-200 max-h-36 overflow-y-auto">
                  {JSON.stringify((selectedConflictItem as any).conflictDetails?.serverData || { status: 'CLOSED', message: 'Record updated by supervisor' }, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl text-xs space-y-2">
              <div className="font-bold text-slate-800">Select Resolution Strategy:</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleResolveConflict('SERVER_WINS')}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-center font-medium text-slate-700"
                >
                  🛡️ Keep Server Version
                  <div className="text-[10px] text-slate-500 mt-0.5">Discard client draft</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveConflict('CLIENT_CHANGE_ACCEPTED')}
                  className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center font-bold"
                >
                  🚀 Accept Client Draft
                  <div className="text-[10px] opacity-80 mt-0.5">Overwrite server data</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleResolveConflict('MERGE_FIELDS')}
                  className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-center font-bold"
                >
                  ⚖️ Merge Both
                  <div className="text-[10px] opacity-80 mt-0.5">Append observations</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAYLOAD EDITOR */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                Edit Action Payload ({editingItem.actionType})
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                JSON Business Data (Modify before retrying):
              </label>
              <textarea
                value={editedPayloadJson}
                onChange={(e) => setEditedPayloadJson(e.target.value)}
                rows={10}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl focus:outline-teal-600 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedPayload}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs shadow-xs"
              >
                Save & Set to Pending
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
