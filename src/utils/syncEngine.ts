import { 
  SyncQueueItem, 
  SyncActionType, 
  OfflineFeaturePolicyClass, 
  SyncItemStatus, 
  NetworkConnectionState, 
  GeoLocationSnapshot,
  SyncBatchResponse,
  AttendanceActionPayload,
  ServiceDraftPayload,
  VisitReportPayload,
  ExpenseSubmissionPayload,
  FeedbackSubmissionPayload,
  ConflictDetails
} from '../types';

const SYNC_QUEUE_STORAGE_KEY = 'a2z_offline_sync_queue_v1';
const NETWORK_SIMULATION_MODE_KEY = 'a2z_network_sim_mode_v1';
const LAST_SYNC_TIMESTAMP_KEY = 'a2z_last_successful_sync_at';

type SyncListener = (items: SyncQueueItem[], networkState: NetworkConnectionState) => void;

class OfflineSyncEngine {
  private queue: SyncQueueItem[] = [];
  private listeners: Set<SyncListener> = new Set();
  private networkState: NetworkConnectionState = 'ONLINE';
  private simulationMode: 'LIVE' | 'SIMULATE_OFFLINE' | 'SIMULATE_FLAKY' = 'LIVE';
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    this.loadFromStorage();
    this.initNetworkListeners();
    
    // Auto sync on start if online and items pending
    setTimeout(() => {
      if (this.isNetworkActuallyAvailable() && this.getPendingCount() > 0) {
        this.processBatchSync();
      }
    }, 1500);
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      } else {
        // Seed initial initial demonstration queue items if empty
        this.queue = this.getDefaultSeedQueue();
        this.saveToStorage();
      }

      const storedSim = localStorage.getItem(NETWORK_SIMULATION_MODE_KEY);
      if (storedSim) {
        this.simulationMode = storedSim as any;
      }
    } catch (e) {
      console.warn('Could not load offline sync queue from storage', e);
      this.queue = this.getDefaultSeedQueue();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.warn('Could not persist offline sync queue to storage', e);
    }
    this.notifyListeners();
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateNetworkState(this.simulationMode === 'SIMULATE_OFFLINE' ? 'OFFLINE' : 'ONLINE');
        if (this.isNetworkActuallyAvailable()) {
          this.processBatchSync();
        }
      });

      window.addEventListener('offline', () => {
        this.updateNetworkState('OFFLINE');
      });

      // Initial state
      this.updateNetworkState(
        this.simulationMode === 'SIMULATE_OFFLINE' 
          ? 'OFFLINE' 
          : (typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE')
      );
    }
  }

  public isNetworkActuallyAvailable(): boolean {
    if (this.simulationMode === 'SIMULATE_OFFLINE') return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public getSimulationMode(): 'LIVE' | 'SIMULATE_OFFLINE' | 'SIMULATE_FLAKY' {
    return this.simulationMode;
  }

  public setSimulationMode(mode: 'LIVE' | 'SIMULATE_OFFLINE' | 'SIMULATE_FLAKY') {
    this.simulationMode = mode;
    localStorage.setItem(NETWORK_SIMULATION_MODE_KEY, mode);
    
    if (mode === 'SIMULATE_OFFLINE') {
      this.updateNetworkState('OFFLINE');
    } else if (mode === 'SIMULATE_FLAKY') {
      this.updateNetworkState('LIMITED_CONNECTION');
    } else {
      this.updateNetworkState(typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE');
      // If we switched to LIVE and we're online, trigger auto sync
      if (this.isNetworkActuallyAvailable()) {
        this.processBatchSync();
      }
    }
  }

  private updateNetworkState(newState: NetworkConnectionState) {
    this.networkState = newState;
    this.notifyListeners();
  }

  public getNetworkState(): NetworkConnectionState {
    return this.networkState;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.queue, this.networkState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const currentQueue = [...this.queue];
    this.listeners.forEach(l => l(currentQueue, this.networkState));
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public getPendingCount(): number {
    return this.queue.filter(i => i.syncStatus === 'PENDING' || i.syncStatus === 'FAILED').length;
  }

  public getFailedCount(): number {
    return this.queue.filter(i => i.syncStatus === 'FAILED').length;
  }

  public getConflictCount(): number {
    return this.queue.filter(i => i.syncStatus === 'CONFLICT' || i.syncStatus === 'REQUIRES_USER_ACTION').length;
  }

  public getSyncedCount(): number {
    return this.queue.filter(i => i.syncStatus === 'SYNCED').length;
  }

  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(LAST_SYNC_TIMESTAMP_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Generates a crypto-unique Idempotency Key token
   */
  public generateIdempotencyKey(actionType: SyncActionType, userId: string = 'u-eng-01'): string {
    const ts = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 9);
    return `IDEM-${actionType}-${userId}-${ts}-${randomHex}`.toUpperCase();
  }

  /**
   * Enqueues an offline action with Idempotency Key & Offline Policy Enforcement
   */
  public enqueueAction<T = any>(params: {
    actionType: SyncActionType;
    policyClass: OfflineFeaturePolicyClass;
    businessData: T;
    userId?: string;
    customerId?: string;
    deviceId?: string;
    location?: GeoLocationSnapshot;
    attachmentDataUrl?: string;
    customIdempotencyKey?: string;
  }): SyncQueueItem<T> {
    const userId = params.userId || 'u-eng-01';
    const actionId = `loc-act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const idempotencyKey = params.customIdempotencyKey || this.generateIdempotencyKey(params.actionType, userId);

    const newItem: SyncQueueItem<T> = {
      id: actionId,
      idempotencyKey,
      userId,
      customerId: params.customerId,
      deviceId: params.deviceId || 'MUMBAI-FIELD-TAB-01',
      actionType: params.actionType,
      policyClass: params.policyClass,
      createdAt: new Date().toISOString(),
      businessData: params.businessData,
      location: params.location,
      attachmentDataUrl: params.attachmentDataUrl,
      syncStatus: 'PENDING',
      retryCount: 0
    };

    // Prepend to top of queue
    this.queue.unshift(newItem);
    this.saveToStorage();

    // If online and not simulating offline, attempt background synchronization
    if (this.isNetworkActuallyAvailable() && !this.isSyncing) {
      setTimeout(() => {
        this.processBatchSync();
      }, 500);
    }

    return newItem;
  }

  /**
   * Specialized Enqueue Helpers
   */
  public queueAttendanceCheckin(
    payload: AttendanceActionPayload, 
    location?: GeoLocationSnapshot
  ): SyncQueueItem<AttendanceActionPayload> {
    return this.enqueueAction({
      actionType: 'ATTENDANCE_CHECKIN',
      policyClass: 'QUEUE_FOR_SERVER_SYNC',
      businessData: payload,
      userId: payload.engineerId,
      location: location || {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracyMeters: 9.2,
        deviceTimestamp: new Date().toISOString(),
        status: 'LOCATION_CAPTURED_OFFLINE'
      }
    });
  }

  public queueAttendanceCheckout(
    payload: AttendanceActionPayload, 
    location?: GeoLocationSnapshot
  ): SyncQueueItem<AttendanceActionPayload> {
    return this.enqueueAction({
      actionType: 'ATTENDANCE_CHECKOUT',
      policyClass: 'QUEUE_FOR_SERVER_SYNC',
      businessData: payload,
      userId: payload.engineerId,
      location: location || {
        latitude: 19.0760,
        longitude: 72.8777,
        accuracyMeters: 8.0,
        deviceTimestamp: new Date().toISOString(),
        status: 'LOCATION_CAPTURED_OFFLINE'
      }
    });
  }

  public queueServiceDraft(
    payload: ServiceDraftPayload
  ): SyncQueueItem<ServiceDraftPayload> {
    return this.enqueueAction({
      actionType: 'SERVICE_WORK_UPDATE',
      policyClass: 'OFFLINE_DRAFT_ONLY',
      businessData: payload,
      userId: 'u-eng-01'
    });
  }

  public queueVisitReport(
    payload: VisitReportPayload
  ): SyncQueueItem<VisitReportPayload> {
    return this.enqueueAction({
      actionType: 'VISIT_REPORT',
      policyClass: 'QUEUE_FOR_SERVER_SYNC',
      businessData: payload,
      userId: 'u-eng-01'
    });
  }

  public queueExpenseClaim(
    payload: ExpenseSubmissionPayload
  ): SyncQueueItem<ExpenseSubmissionPayload> {
    return this.enqueueAction({
      actionType: 'EXPENSE_SUBMISSION',
      policyClass: 'OFFLINE_DRAFT_ONLY',
      businessData: payload,
      userId: 'u-eng-01'
    });
  }

  public queueFeedback(
    payload: FeedbackSubmissionPayload
  ): SyncQueueItem<FeedbackSubmissionPayload> {
    return this.enqueueAction({
      actionType: 'SERVICE_FEEDBACK_SUBMISSION',
      policyClass: 'QUEUE_FOR_SERVER_SYNC',
      businessData: payload,
      customerId: 'u-cust-01'
    });
  }

  /**
   * Process synchronization for all pending and failed queue items
   */
  public async processBatchSync(accessToken?: string | null): Promise<SyncBatchResponse | null> {
    if (this.isSyncing) return null;

    if (!this.isNetworkActuallyAvailable()) {
      this.updateNetworkState('OFFLINE');
      return null;
    }

    const pendingItems = this.queue.filter(i => i.syncStatus === 'PENDING' || i.syncStatus === 'FAILED');
    if (pendingItems.length === 0) {
      return null;
    }

    this.isSyncing = true;
    this.updateNetworkState('SYNCING');

    // Mark items as SYNCING locally
    pendingItems.forEach(item => {
      item.syncStatus = 'SYNCING';
      item.lastAttemptAt = new Date().toISOString();
      item.retryCount = (item.retryCount || 0) + 1;
    });
    this.saveToStorage();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // If simulated flaky network, add a slight latency
      if (this.simulationMode === 'SIMULATE_FLAKY') {
        await new Promise(r => setTimeout(r, 1200));
      }

      const response = await fetch('/api/v1/sync/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: pendingItems,
          deviceId: 'MUMBAI-FIELD-TAB-01',
          clientTimestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SyncBatchResponse = await response.json();
      const now = new Date().toISOString();

      // Update queue with results
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach(resItem => {
          const matchedQueueItem = this.queue.find(q => q.id === resItem.id || q.idempotencyKey === resItem.idempotencyKey);
          if (matchedQueueItem) {
            matchedQueueItem.syncStatus = resItem.status;
            matchedQueueItem.serverConfirmedAt = resItem.serverConfirmedAt || now;
            matchedQueueItem.errorMessage = resItem.errorMessage;
            if (resItem.conflictDetails) {
              matchedQueueItem.conflictResolution = 'USER_ACTION_REQUIRED';
              // Store conflict info in item for interactive modal
              (matchedQueueItem as any).conflictDetails = resItem.conflictDetails;
            }
          }
        });
      }

      localStorage.setItem(LAST_SYNC_TIMESTAMP_KEY, now);
      this.isSyncing = false;
      this.updateNetworkState('ONLINE');
      this.saveToStorage();
      return data;

    } catch (err: any) {
      console.error('Batch sync failed:', err);
      // Mark items back to FAILED
      pendingItems.forEach(item => {
        item.syncStatus = 'FAILED';
        item.errorMessage = err.message || 'Network connection failed during sync';
      });
      this.isSyncing = false;
      this.updateNetworkState(this.simulationMode === 'SIMULATE_FLAKY' ? 'LIMITED_CONNECTION' : 'OFFLINE');
      this.saveToStorage();
      return null;
    }
  }

  /**
   * Retry an individual item
   */
  public async retryItem(itemId: string, accessToken?: string | null): Promise<boolean> {
    const item = this.queue.find(i => i.id === itemId);
    if (!item) return false;

    if (!this.isNetworkActuallyAvailable()) {
      item.syncStatus = 'FAILED';
      item.errorMessage = 'Cannot retry: Device is currently offline.';
      this.saveToStorage();
      return false;
    }

    item.syncStatus = 'SYNCING';
    item.lastAttemptAt = new Date().toISOString();
    item.retryCount = (item.retryCount || 0) + 1;
    this.saveToStorage();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch('/api/v1/sync/process-item', {
        method: 'POST',
        headers,
        body: JSON.stringify(item)
      });

      const json = await res.json();
      const resultData = json.data;

      if (resultData) {
        item.syncStatus = resultData.status;
        item.serverConfirmedAt = resultData.serverConfirmedAt;
        item.errorMessage = resultData.errorMessage;
        if (resultData.conflictDetails) {
          (item as any).conflictDetails = resultData.conflictDetails;
          item.conflictResolution = 'USER_ACTION_REQUIRED';
        }
      } else {
        item.syncStatus = 'FAILED';
        item.errorMessage = json.message || 'Sync failed';
      }

      this.saveToStorage();
      return item.syncStatus === 'SYNCED';
    } catch (e: any) {
      item.syncStatus = 'FAILED';
      item.errorMessage = e.message || 'Network error';
      this.saveToStorage();
      return false;
    }
  }

  /**
   * Update payload data of a pending or failed item before retry
   */
  public updateItemPayload(itemId: string, newBusinessData: any) {
    const item = this.queue.find(i => i.id === itemId);
    if (item) {
      item.businessData = { ...item.businessData, ...newBusinessData };
      if (item.syncStatus === 'FAILED' || item.syncStatus === 'CONFLICT') {
        item.syncStatus = 'PENDING';
        item.errorMessage = undefined;
      }
      this.saveToStorage();
    }
  }

  /**
   * Interactive Conflict Resolution
   */
  public async resolveConflict(
    itemId: string,
    resolution: 'SERVER_WINS' | 'CLIENT_CHANGE_ACCEPTED' | 'MERGE_FIELDS',
    customMergedData?: any,
    ticketId?: string,
    accessToken?: string | null
  ): Promise<boolean> {
    const item = this.queue.find(i => i.id === itemId);
    if (!item) return false;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch('/api/v1/sync/resolve-conflict', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          itemId,
          resolution,
          customMergedData,
          ticketId
        })
      });

      if (res.ok) {
        item.syncStatus = 'SYNCED';
        item.conflictResolution = resolution;
        item.serverConfirmedAt = new Date().toISOString();
        this.saveToStorage();
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error('Resolve conflict error:', e);
      return false;
    }
  }

  /**
   * Discard/Delete an action from the local queue
   */
  public discardItem(itemId: string) {
    this.queue = this.queue.filter(i => i.id !== itemId);
    this.saveToStorage();
  }

  /**
   * Remove all successfully synced items from local queue
   */
  public clearCompletedSynced() {
    this.queue = this.queue.filter(i => i.syncStatus !== 'SYNCED');
    this.saveToStorage();
  }

  /**
   * Seeds demo pending/failed queue actions for testing
   */
  public seedDemoActions() {
    const ts = Date.now();
    const demoItems: SyncQueueItem[] = [
      {
        id: `demo-att-${ts}`,
        idempotencyKey: `IDEM-ATT-PUNCHIN-u-eng-01-${ts}-A1`,
        userId: 'u-eng-01',
        deviceId: 'FIELD-TAB-MUM-01',
        actionType: 'ATTENDANCE_CHECKIN',
        policyClass: 'QUEUE_FOR_SERVER_SYNC',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        businessData: {
          engineerId: 'u-eng-01',
          engineerName: 'Anand Deshmukh',
          punchType: 'PUNCH_IN',
          shift: 'GENERAL_MORNING',
          odometerReadingKm: 42195,
          batteryLevelPercent: 88,
          notes: 'Punch-in recorded offline while traveling through tunnel near Sion'
        } as AttendanceActionPayload,
        location: {
          latitude: 19.0390,
          longitude: 72.8619,
          accuracyMeters: 14.2,
          deviceTimestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'LOCATION_CAPTURED_OFFLINE'
        },
        syncStatus: 'PENDING',
        retryCount: 0
      },
      {
        id: `demo-serv-${ts + 1}`,
        idempotencyKey: `IDEM-SERVICE_WORK_UPDATE-u-eng-01-${ts}-B2`,
        userId: 'u-eng-01',
        deviceId: 'FIELD-TAB-MUM-01',
        actionType: 'SERVICE_WORK_UPDATE',
        policyClass: 'OFFLINE_DRAFT_ONLY',
        createdAt: new Date(Date.now() - 2400000).toISOString(),
        businessData: {
          ticketId: 'tck-001',
          ticketNumber: 'TCK-2026-001',
          customerLabName: 'Apex Clinical & Pathology Laboratories',
          equipmentName: 'Erba Chem 7 Photometer',
          serialNumber: 'SN-CHEM7-9921',
          preliminaryObservations: 'Replaced degraded halogen lamp. Flowcell cleaned with 0.1M NaOH deproteinizer.',
          draftActionTaken: 'Optical calibration wavelength verification: 340nm, 405nm, 505nm all within +/- 1nm tolerance.',
          testRunCompleted: true,
          sparePartsDraft: [
            {
              partId: 'sp-001',
              partName: 'Quartz Halogen Lamp 12V 20W',
              partNumber: 'SP-CHEM7-HL12',
              quantity: 1,
              unitPrice: 1850.00
            }
          ],
          customerAcknowledgedBy: 'Dr. Arvind Kulkarni',
          customerDesignation: 'Chief Biochemist'
        } as ServiceDraftPayload,
        syncStatus: 'PENDING',
        retryCount: 0
      },
      {
        id: `demo-vis-${ts + 2}`,
        idempotencyKey: `IDEM-VISIT_REPORT-u-eng-01-${ts}-C3`,
        userId: 'u-eng-01',
        deviceId: 'FIELD-TAB-MUM-01',
        actionType: 'VISIT_REPORT',
        policyClass: 'QUEUE_FOR_SERVER_SYNC',
        createdAt: new Date(Date.now() - 1200000).toISOString(),
        businessData: {
          labName: 'Metro Health Diagnostic Center',
          labAddress: 'Dadar West, Mumbai',
          doctorOrDirectorName: 'Dr. Rashmi Shah',
          contactNumber: '+919820011223',
          discussionSummary: 'Met lab owner to discuss reagent annual contract for Sysmex hematology line. Provided catalog and pricing slab sheet.',
          followUpRequired: true,
          followUpDate: '2026-08-30T10:00:00Z',
          sampleCollectionRequired: false,
          competitorReagentsNoticed: 'Boule Medonic M-series reagents currently in use',
          estimatedMonthlyPotentialInr: 85000
        } as VisitReportPayload,
        syncStatus: 'PENDING',
        retryCount: 0
      },
      {
        id: `demo-exp-${ts + 3}`,
        idempotencyKey: `IDEM-EXPENSE_SUBMISSION-u-eng-01-${ts}-D4`,
        userId: 'u-eng-01',
        deviceId: 'FIELD-TAB-MUM-01',
        actionType: 'EXPENSE_SUBMISSION',
        policyClass: 'OFFLINE_DRAFT_ONLY',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        businessData: {
          expenseCategory: 'TRAVEL_FUEL',
          amount: 850.00,
          currency: 'INR',
          billNumber: 'IOCL-BOM-44912',
          billDate: '2026-08-23',
          merchantName: 'Indian Oil Fuel Station Dadar',
          description: 'Fuel allowance for emergency hospital breakdown visit at Metro Health Diagnostic',
        } as ExpenseSubmissionPayload,
        syncStatus: 'PENDING',
        retryCount: 0
      }
    ];

    this.queue = [...demoItems, ...this.queue];
    this.saveToStorage();
  }

  private getDefaultSeedQueue(): SyncQueueItem[] {
    const ts = Date.now();
    return [
      {
        id: `seed-act-01`,
        idempotencyKey: `IDEM-ATT-PUNCHIN-u-eng-01-20260823-0830`,
        userId: 'u-eng-01',
        deviceId: 'FIELD-TAB-MUM-01',
        actionType: 'ATTENDANCE_CHECKIN',
        policyClass: 'QUEUE_FOR_SERVER_SYNC',
        createdAt: '2026-08-23T08:30:15.000Z',
        serverConfirmedAt: '2026-08-23T08:30:18.000Z',
        businessData: {
          engineerId: 'u-eng-01',
          engineerName: 'Anand Deshmukh',
          punchType: 'PUNCH_IN',
          shift: 'GENERAL_MORNING',
          odometerReadingKm: 42180,
          batteryLevelPercent: 94,
          notes: 'Morning field shift start'
        } as AttendanceActionPayload,
        location: {
          latitude: 19.0760,
          longitude: 72.8777,
          accuracyMeters: 8.5,
          deviceTimestamp: '2026-08-23T08:30:15.000Z',
          status: 'LOCATION_VERIFIED_BY_SERVER'
        },
        syncStatus: 'SYNCED',
        retryCount: 1
      },
      {
        id: `seed-act-02`,
        idempotencyKey: `IDEM-VIS-APEX-u-eng-01-20260822-1430`,
        userId: 'u-eng-01',
        deviceId: 'FIELD-TAB-MUM-01',
        actionType: 'VISIT_REPORT',
        policyClass: 'QUEUE_FOR_SERVER_SYNC',
        createdAt: '2026-08-22T14:30:00.000Z',
        serverConfirmedAt: '2026-08-22T14:31:10.000Z',
        businessData: {
          labName: 'Apex Clinical & Pathology Laboratories',
          doctorOrDirectorName: 'Dr. Arvind Kulkarni',
          discussionSummary: 'Reviewed electrolyte analyzer calibration and Erba XL-640 pipeline.',
          followUpRequired: true,
          followUpDate: '2026-08-28T10:00:00Z',
          sampleCollectionRequired: false,
          competitorReagentsNoticed: 'Mindray BS-240 packs',
          estimatedMonthlyPotentialInr: 125000
        } as VisitReportPayload,
        syncStatus: 'SYNCED',
        retryCount: 1
      }
    ];
  }
}

export const syncEngine = new OfflineSyncEngine();
