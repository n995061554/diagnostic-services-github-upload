/**
 * TALLY ACCOUNTING & CUSTOMER LAB INTEGRATION CONTRACTS
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Defines normalized, typed domain contracts for:
 * - Product price synchronization
 * - Customer & accounting ledger mappings
 * - Authoritative customer outstanding balance snapshots
 * - Verified payment lifecycle (online gateway & bank transfer)
 * - Sync batches & dual-control approval decisions
 * - Reconciliation exceptions & immutable audit events
 */

export type SyncBatchStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'APPLYING'
  | 'APPLIED'
  | 'REJECTED'
  | 'FAILED';

export type SyncBatchType =
  | 'PRICE_SYNC'
  | 'LEDGER_OUTSTANDING_SYNC'
  | 'PAYMENT_RECONCILIATION'
  | 'INVENTORY_BATCH_SYNC';

export type SyncSourceType = 'BUILTIN_TALLY' | 'COMMERCIAL_TALLYPRIME' | 'EXTERNAL_TALLY_ERP9';

export interface InventoryBatchSyncItem {
  guid: string;
  distributorProductId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  hsnCode: string;
  uom: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  daysRemaining: number;
  urgencyLevel: 'CRITICAL' | 'WARNING' | 'SAFE' | 'EXPIRED';
  isExpired: boolean;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gstRate: number;
  availableQuantity: number;
  reservedQuantity: number;
  godown: string;
  stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'QUARANTINED';
  isActive: boolean;
  validationErrors?: string[];
}

export interface CustomerLedgerTransaction {
  date: string;
  voucherType: string;
  voucherNumber: string;
  reference?: string;
  debit: number;
  credit: number;
  runningBalance: number;
  narration?: string;
}

export interface CustomerLedgerSyncItem {
  tallyLedgerId: string;
  tallyLedgerName: string;
  distributorCustomerId: string;
  distributorCustomerName: string;
  gstin?: string;
  openingBalance: number;
  totalInvoiced: number;
  totalReceipts: number;
  creditNotes: number;
  debitNotes: number;
  tallyOutstanding: number;
  distributorOutstanding: number;
  discrepancyAmount: number;
  hasDiscrepancy: boolean;
  creditLimit: number;
  creditPeriodDays: number;
  overdueAmount: number;
  oldestUnpaidInvoiceDate?: string;
  lastSyncTimestamp: string;
  transactions: CustomerLedgerTransaction[];
  validationErrors?: string[];
}

export interface TallyDiscrepancyItem {
  customerId: string;
  customerName: string;
  tallyLedgerName: string;
  distributorOutstanding: number;
  tallyOutstanding: number;
  discrepancyAmount: number;
  discrepancyDirection: 'TALLY_HIGHER' | 'DISTRIBUTOR_HIGHER' | 'BALANCED';
  lastSynchronizedAt: string;
  status: 'PENDING_REVIEW' | 'RECONCILED' | 'IGNORED';
  notes?: string;
}

export interface TallyConnectionStatus {
  connected: boolean;
  environment: 'MOCK_LOCAL' | 'EXTERNAL_TALLY_HTTP' | 'OFFICE_TALLY_BRIDGE';
  tallyVersion: 'Tally ERP 9' | 'TallyPrime 4.x' | 'TallyPrime 7.0+ (REST JSON)' | 'Office Tally Bridge' | 'Offline / Disconnected';
  companyName: string;
  host: string;
  port: number;
  exportFormat: 'XML' | 'JSON';
  lastPingTimestamp: string;
  latencyMs: number;
  statusMessage: string;
  versionCompatible: boolean;
  bridgeDevice?: {
    deviceId: string;
    deviceName: string;
    lastSeenAt: string;
    status: 'ONLINE' | 'OFFLINE' | 'REVOKED' | 'NOT_PAIRED';
  };
}

export interface ExternalTallyConfig {
  enabled: boolean;
  environment: 'MOCK_LOCAL' | 'EXTERNAL_TALLY_HTTP' | 'OFFICE_TALLY_BRIDGE';
  tallyVersion: 'TALLY_ERP_9' | 'TALLY_PRIME' | 'TALLY_PRIME_7_PLUS';
  host: string;
  port: number;
  companyName: string;
  authUsername?: string;
  authPassword?: string;
  exportFormat: 'XML' | 'JSON';
  timeoutMs: number;
  autoSyncIntervalMinutes: number; // 0 = manual only
  lastSuccessfulSync?: string;
  nextScheduledSync?: string;
}

// ============================================================================
// OFFICE TALLY BRIDGE AGENT CONTRACTS (Outbound HTTPS Tunnel from Office PC)
// ============================================================================
export type TallyBridgeCommandType =
  | 'TEST_CONNECTION'
  | 'LIST_COMPANIES'
  | 'GET_STOCK_SUMMARY'
  | 'GET_PRODUCT_PRICES'
  | 'GET_CUSTOMER_LEDGERS'
  | 'GET_RECEIPT_VOUCHERS';

export interface TallyVoucherSyncItem {
  guid: string;
  voucherType: 'Receipt' | 'Payment' | 'Sales' | 'Journal' | 'Credit Note' | 'Debit Note' | string;
  voucherNumber: string;
  date: string; // YYYY-MM-DD
  reference?: string;
  narration?: string;
  amount: number;
  originSystem?: string;
  isDistributorOrigin: boolean;
  matchedFactor?: string;
  customerLedgerName?: string;
  bankLedgerName?: string;
  partyGstin?: string;
  isReconciled: boolean;
  matchedInternalPaymentId?: string;
  status: 'PENDING_RECONCILIATION' | 'RECONCILED' | 'IGNORED' | 'DUPLICATE';
  validationErrors?: string[];
}

export interface TallyBridgeCommand {
  commandId: string;
  commandType: TallyBridgeCommandType;
  targetCompany: string;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  payload?: any;
  commandSignature: string;
}

export interface TallyBridgeExecutionResult {
  commandId: string;
  commandType: TallyBridgeCommandType;
  success: boolean;
  executedAt: string;
  targetCompany: string;
  activeTallyCompany?: string;
  companyMatched: boolean;
  data?: any;
  error?: string;
  rawResponseSummary?: string;
  latencyMs: number;
}

export interface TallyBridgeDeviceRecord {
  deviceId: string;
  deviceName: string;
  secretHash: string; // SHA-256 hash of device secret
  status: 'ACTIVE' | 'REVOKED';
  pairedAt: string;
  lastSeenAt: string;
  clientVersion: string;
  osInfo: string;
  tallyHost: string;
  tallyPort: number;
  lastCompanyReported?: string;
}

export interface TallyBridgePairingToken {
  pairingKey: string; // e.g. "BRG-PAIR-8912-7741"
  expiresAt: string;
  generatedByUserId: string;
  generatedByUserName: string;
  used: boolean;
  usedAt?: string;
  usedByDeviceId?: string;
}

export interface ProductPriceSyncItem {
  sourceProductId: string;
  sourceProductName: string;
  distributorProductId: string; // Mapped internal product ID
  distributorSku: string;
  currentBasePrice: number;
  proposedBasePrice: number;
  currentMrp: number;
  proposedMrp: number;
  taxRatePercent: number;
  currency: string;
  uom: string;
  validationErrors?: string[];
}

export interface CustomerLedgerMapping {
  customerId: string; // Internal customer / lab ID (e.g. "u-cust-01")
  customerCode: string;
  customerName: string;
  accountingLedgerId: string; // Internal ledger ID (e.g. "led-debtor-metropolis")
  accountingLedgerName: string;
  gstin?: string;
  creditLimit: number;
  creditPeriodDays: number;
  isVerified: boolean;
}

export interface CustomerOutstandingSnapshot {
  customerId: string;
  customerName: string;
  ledgerId: string;
  totalInvoicedAmount: number;
  totalReceiptsAmount: number;
  totalCreditNotesAmount: number;
  unappliedCreditsAmount: number;
  netOutstandingBalance: number;
  overdueAmount: number;
  currency: string;
  asOfDate: string;
  reconciledVoucherCount: number;
  source: SyncSourceType;
  lastPaymentDate?: string;
  lastPaymentReference?: string;
}

export type PaymentLifecycleStatus =
  | 'INITIATED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'ALLOCATED'
  | 'POSTED_TO_ACCOUNTING'
  | 'REJECTED'
  | 'REVERSED';

export type PaymentMethodType = 'ONLINE_GATEWAY' | 'BANK_TRANSFER' | 'UPI_INSTANT';

export interface InvoiceAllocationItem {
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  alreadyPaidAmount: number;
  allocatedAmount: number;
}

export interface PaymentRecord {
  id: string; // Internal stable payment ID (e.g. "pay-int-1001")
  idempotencyKey: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  gatewayTransactionId?: string;
  gatewaySignature?: string;
  bankReferenceNumber?: string;
  bankName?: string;
  evidenceNotes?: string;
  status: PaymentLifecycleStatus;
  statusHistory: Array<{
    status: PaymentLifecycleStatus;
    timestamp: string;
    actor: string;
    notes?: string;
  }>;
  allocations: InvoiceAllocationItem[];
  unallocatedAmount: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  accountingVoucherId?: string;
  accountingVoucherNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncBatch {
  id: string; // e.g. "sync-batch-202610-001"
  batchType: SyncBatchType;
  source: SyncSourceType;
  contentFingerprint: string; // SHA-256 hash of items
  status: SyncBatchStatus;
  recordCount: number;
  items: any[];
  validationIssues: string[];
  submittedBy: {
    id: string;
    name: string;
    role: string;
  };
  submittedAt: string;
  approvalDecision?: {
    action: 'APPROVED' | 'REJECTED';
    decidedBy: {
      id: string;
      name: string;
      role: string;
    };
    decidedAt: string;
    reasonNotes: string;
  };
  appliedAt?: string;
  appliedBy?: string;
  executionSummary?: {
    succeededCount: number;
    failedCount: number;
    details: string;
  };
  auditTrail: Array<{
    action: string;
    actor: string;
    timestamp: string;
    details: string;
  }>;
}

export interface IntegrationAuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'BATCH' | 'PAYMENT' | 'PRICE' | 'LEDGER' | 'ADAPTER';
  entityId: string;
  status: 'SUCCESS' | 'REJECTED' | 'ERROR';
  details: string;
  redactedMetadata?: Record<string, any>;
}

export interface TallyPrimeConfig {
  enabled: boolean;
  host: string;
  port: number;
  companyName: string;
  timeoutMs: number;
  exportFormat: 'XML' | 'JSON';
}
