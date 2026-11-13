/**
 * TALLY-STYLE DOUBLE-ENTRY ACCOUNTING SYSTEM TYPES
 * Project: Diagnostic Services (D:\diagnostic-services)
 *
 * Adheres strictly to Indian accounting principles and TallyPrime group hierarchies.
 */

export type PrimaryGroupType = 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSES';

export type NatureOfAccount = 'DEBIT' | 'CREDIT';

export interface AccountGroup {
  id: string;
  name: string;
  code: string;
  primaryType: PrimaryGroupType;
  parentGroupId?: string | null;
  nature: NatureOfAccount;
  isPredefined: boolean;
  affectsGrossProfit?: boolean;
  description?: string;
}

export type LedgerAccountType =
  | 'BANK'
  | 'CASH'
  | 'SUNDRY_DEBTOR'
  | 'SUNDRY_CREDITOR'
  | 'SALES'
  | 'PURCHASE'
  | 'DIRECT_EXPENSE'
  | 'INDIRECT_EXPENSE'
  | 'DIRECT_INCOME'
  | 'INDIRECT_INCOME'
  | 'DUTIES_AND_TAXES'
  | 'FIXED_ASSET'
  | 'CURRENT_ASSET'
  | 'CURRENT_LIABILITY'
  | 'CAPITAL'
  | 'PROVISION';

export interface LedgerAccount {
  id: string;
  accountNumber: string;
  name: string;
  groupId: string;
  groupName?: string;
  accountType: LedgerAccountType;
  openingBalance: number;
  openingBalanceType: NatureOfAccount;
  currentBalance: number;
  currentBalanceType: NatureOfAccount;
  // Contact & GST Details for Debtors, Creditors & Banks
  partyType?: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'BANK' | 'TAX_AUTHORITY' | 'OTHER';
  entityId?: string; // Reference to existing customerId, supplierId, or userId
  gstin?: string;
  pan?: string;
  stateCode?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankBranch?: string;
  creditPeriodDays?: number;
  creditLimit?: number;
  isReconciliationEnabled?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VoucherType =
  | 'SALES_INVOICE'
  | 'PURCHASE_BILL'
  | 'RECEIPT'
  | 'PAYMENT'
  | 'JOURNAL'
  | 'CONTRA'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'OPENING_BALANCE';

export type VoucherStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface VoucherLine {
  id: string;
  ledgerId: string;
  ledgerName: string;
  accountType?: LedgerAccountType;
  debit: number;
  credit: number;
  narration?: string;
  // Line-level GST and inventory attribution
  hsnSac?: string;
  taxRatePercent?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string; // YYYY-MM-DD
  financialYear: string; // e.g. "2026-2027"
  referenceNumber?: string;
  referenceDate?: string;
  narration: string;
  status: VoucherStatus;
  lines: VoucherLine[];
  totalDebit: number;
  totalCredit: number;
  // Metadata & Audit
  entityType?: 'CUSTOMER_ORDER' | 'CUSTOMER_RECEIPT' | 'SUPPLIER_BILL' | 'EXPENSE' | 'PAYROLL' | 'STOCK_ADJUSTMENT' | 'MANUAL';
  entityId?: string; // Links back to orderNumber, payRunId, expenseId, etc.
  idempotencyKey?: string;
  postedBy: string; // User ID / Name
  postedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  reversalVoucherId?: string;
  reversedVoucherId?: string;
  // Cheque / Bank Details
  chequeNumber?: string;
  chequeDate?: string;
  bankName?: string;
  bankClearanceDate?: string;
  isReconciled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialPeriod {
  id: string;
  name: string; // e.g. "FY 2026-2027"
  startDate: string; // 2026-04-01
  endDate: string; // 2027-03-31
  isClosed: boolean;
  closedBy?: string;
  closedAt?: string;
}

export type FinancialYearFormat = 'YYYY-YYYY' | 'YYYY-YY' | 'YY-YY' | 'YYYY' | 'YY' | 'NONE';
export type DocumentType = 'TAX_INVOICE' | 'PROFORMA_INVOICE' | 'DELIVERY_NOTE' | 'CREDIT_NOTE';

export interface InvoiceNumberingConfig {
  documentType?: DocumentType;
  prefix: string;
  suffix?: string;
  financialYearFormat: FinancialYearFormat;
  separator?: string;
  startingNumber: number;
  paddingDigits?: number;
  padding?: number;
  resetPolicy?: 'ANNUAL' | 'MONTHLY' | 'NEVER';
  resetOnFinancialYear?: boolean;
  lastResetFY?: string;
  currentSequence: number;
}

export interface BankDetailsConfig {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  branch?: string;
  swiftCode?: string;
}

export interface InvoicePrintConfig {
  documentTitle: string;
  proformaTitle: string;
  deliveryNoteTitle: string;
  creditNoteTitle: string;
  subtitle?: string;

  // Header and Company
  printCompanyLogo: boolean;
  printCompanyPan: boolean;
  printCompanyGstin: boolean;
  printBuyerGstin: boolean;
  printStateCode: boolean;
  addressInContinuousLine: boolean;
  printBankDetails: boolean;
  bankDetails: BankDetailsConfig;

  // Item Table Columns
  printSerialNumber: boolean;
  printPartNumber: boolean;
  printHsnSacColumn: boolean;
  printQuantityColumn: boolean;
  printAlternateQuantity: boolean;
  printRateColumn: boolean;
  printDiscountColumn: boolean;
  printGstRateColumn: boolean;
  printItemGstDetails: boolean;
  printGstAnalysis: boolean;
  printBatchDetails: boolean;
  printExpiryDate: boolean;
  printAmountColumn: boolean;

  // Supplementary & Despatch Details
  printOrderDetails: boolean;
  printTermsOfPayment: boolean;
  printDespatchDetails: boolean;
  printTermsOfDelivery: boolean;

  // Declarations & Signatures
  printDeclaration: boolean;
  declarationText: string;
  termsAndConditions: string;
  authorizedSignatoryText: string;
  computerGeneratedNotice: string;
  jurisdiction: string;

  // Print Format & Layout
  paperSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  topMarginInches: number;
  leftMarginInches: number;
  numberOfCopies: number;
  copyLabels: string[];
}

export interface AccountingSettings {
  id: string;
  companyName: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  financialYearStartMonth: number; // 4 = April for India
  activeFinancialYear: string;
  enableGst: boolean;
  defaultCgstRate: number;
  defaultSgstRate: number;
  defaultIgstRate: number;
  voucherNumberPrefixes: Record<VoucherType, string>;
  voucherNumberSequences: Record<VoucherType, number>;
  periodLockDate?: string; // Entries on or before this date are locked
  allowBackdatedVouchers: boolean;

  // Extended Company & Operational Settings
  tradeName?: string;
  cin?: string;
  companyAddressLine1?: string;
  companyAddressLine2?: string;
  companyCity?: string;
  companyPincode?: string;
  companyEmail?: string;
  companyPhone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    pincode?: string;
  };
  contacts?: {
    email?: string;
    phone?: string;
  };
  bankDetails?: BankDetailsConfig;
  defaultPricingMode?: 'TAX_EXCLUSIVE' | 'TAX_INCLUSIVE';
  currencySymbol?: string;
  roundingPolicy?: 'ROUND_NEAREST' | 'ROUND_DOWN' | 'NO_ROUND' | 'NEAREST_RUPEE' | 'EXACT_PAISE';

  // Numbering and Print Configurations
  numberingConfigs?: Record<string, InvoiceNumberingConfig>;
  printConfig?: Partial<InvoicePrintConfig>;
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: 'VOUCHER_POSTED' | 'VOUCHER_CANCELLED' | 'VOUCHER_REVERSED' | 'LEDGER_CREATED' | 'LEDGER_UPDATED' | 'SETTINGS_CHANGED' | 'PERIOD_LOCKED' | 'PERIOD_CLOSED';
  entityType: 'VOUCHER' | 'LEDGER' | 'SETTINGS' | 'PERIOD';
  entityId: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  ipAddress?: string;
  details: string;
  previousSnapshot?: any;
  newSnapshot?: any;
}

export interface DayBookEntry {
  voucherId: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string;
  particulars: string;
  referenceNumber?: string;
  debitAmount: number;
  creditAmount: number;
  status: VoucherStatus;
}

export interface TrialBalanceRow {
  groupId: string;
  groupName: string;
  primaryType: PrimaryGroupType;
  ledgerId: string;
  ledgerName: string;
  accountType: LedgerAccountType;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceReport {
  asOfDate: string;
  financialYear: string;
  rows: TrialBalanceRow[];
  totalOpeningDebit: number;
  totalOpeningCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalClosingDebit: number;
  totalClosingCredit: number;
  isBalanced: boolean;
}

export interface ProfitLossReport {
  fromDate: string;
  toDate: string;
  tradingAccount: {
    salesAccounts: { name: string; amount: number }[];
    totalSales: number;
    closingStock: number;
    grossIncome: number;
    openingStock: number;
    purchaseAccounts: { name: string; amount: number }[];
    totalPurchases: number;
    directExpenses: { name: string; amount: number }[];
    totalDirectExpenses: number;
    grossTradingCost: number;
    grossProfitOrLoss: number; // Positive = Gross Profit, Negative = Gross Loss
  };
  incomeStatement: {
    grossProfitBroughtDown: number;
    indirectIncomes: { name: string; amount: number }[];
    totalIndirectIncome: number;
    indirectExpenses: { name: string; amount: number }[];
    totalIndirectExpenses: number;
    netProfitOrLoss: number; // Positive = Net Profit, Negative = Net Loss
  };
}

export interface BalanceSheetReport {
  asOfDate: string;
  liabilities: {
    capitalAccount: { name: string; amount: number }[];
    totalCapital: number;
    reservesAndSurplus: { name: string; amount: number }[];
    netProfitCarriedForward: number;
    totalReserves: number;
    loansAndLiabilities: { name: string; amount: number }[];
    totalLoans: number;
    currentLiabilities: { name: string; amount: number }[];
    dutiesAndTaxes: { name: string; amount: number }[];
    sundryCreditors: { name: string; amount: number }[];
    totalCurrentLiabilities: number;
    totalLiabilities: number;
  };
  assets: {
    fixedAssets: { name: string; amount: number }[];
    totalFixedAssets: number;
    currentAssets: { name: string; amount: number }[];
    stockInHand: number;
    sundryDebtors: { name: string; amount: number }[];
    cashInHand: number;
    bankAccounts: { name: string; amount: number }[];
    totalCurrentAssets: number;
    totalAssets: number;
  };
  differenceInOpeningBalances: number;
  isBalanced: boolean;
}

export interface AgingBucketRow {
  entityId: string;
  name: string;
  contactPhone?: string;
  creditLimit?: number;
  creditPeriodDays?: number;
  totalOutstanding: number;
  currentNotDue: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  daysAbove90: number;
}

export interface GstTaxSummary {
  periodMonth: string;
  financialYear: string;
  outwardSupplies: {
    b2bTaxableValue: number;
    b2bCgst: number;
    b2bSgst: number;
    b2bIgst: number;
    b2cTaxableValue: number;
    b2cCgst: number;
    b2cSgst: number;
    b2cIgst: number;
    totalOutputTax: number;
  };
  inwardSupplies: {
    eligibleItcTaxableValue: number;
    eligibleItcCgst: number;
    eligibleItcSgst: number;
    eligibleItcIgst: number;
    totalInputTaxCredit: number;
  };
  netTaxPayable: {
    cgstPayable: number;
    sgstPayable: number;
    igstPayable: number;
    totalPayable: number;
  };
}

// ============================================================================
// PRODUCT-BASED SALES INVOICING & INVENTORY BATCHES (TALLY-STYLE BILLING)
// ============================================================================

export interface InventoryBatch {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  manufacturingDate?: string;
  availableStock: number;
  initialStock: number;
  unitCost: number;
  mrp: number;
  sellingPrice: number;
  storageLocation: string;
  isColdChain: boolean;
  storageTemperature: string;
  isActive: boolean;
}

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  catalogNumber?: string;
  batchNumber: string;
  expiryDate: string;
  availableStock: number;
  quantity: number;
  unit: string;
  unitPrice: number; // excluding tax
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  hsnSac: string;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  lineTotal: number;
  unitPriceInclusive: number;
  isColdChain?: boolean;
  storageTemperature?: string;
}

export type SalesInvoiceStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;
  status: SalesInvoiceStatus;

  // Customer & Lab Information
  customerId: string;
  customerName: string;
  customerCode?: string;
  customerGstin?: string;
  customerPan?: string;
  customerState: string;
  customerStateCode: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  poNumber?: string;
  paymentTerms?: string;
  salesperson?: string;
  deliveryReference?: string;
  narration?: string;
  termsAndConditions?: string;

  // Line Items
  items: SalesInvoiceItem[];

  // Authoritative Totals (Decimal-Safe Server Math)
  grossSubtotal: number;
  itemDiscountsTotal: number;
  invoiceDiscountType: 'PERCENTAGE' | 'FIXED';
  invoiceDiscountValue: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  freightCharges: number;
  otherCharges: number;
  roundOff: number;
  finalTotal: number;
  amountReceived: number;
  outstandingBalance: number;

  // Accounting Voucher & Inventory Links
  voucherId?: string;
  voucherNumber?: string;
  idempotencyKey?: string;
  stockMovementIds?: string[];

  // Cancellation Audit
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;

  // Audit Metadata
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCalculationInput {
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    batchNumber: string;
    expiryDate: string;
    availableStock: number;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountPercent?: number;
    discountAmount?: number;
    hsnSac?: string;
    gstRate: number;
    priceIsTaxInclusive?: boolean;
    isColdChain?: boolean;
    storageTemperature?: string;
  }>;
  customerStateCode: string;
  dealerStateCode: string;
  invoiceDiscountType?: 'PERCENTAGE' | 'FIXED';
  invoiceDiscountValue?: number;
  freightCharges?: number;
  otherCharges?: number;
  applyRoundOff?: boolean;
  amountReceived?: number;
}

export interface InvoiceCalculationResult {
  items: SalesInvoiceItem[];
  grossSubtotal: number;
  itemDiscountsTotal: number;
  invoiceDiscountAmount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  freightCharges: number;
  otherCharges: number;
  roundOff: number;
  finalTotal: number;
  amountReceived: number;
  outstandingBalance: number;
  isInterState: boolean;
}

