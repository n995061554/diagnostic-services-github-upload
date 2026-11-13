/**
 * Tally ERP 9 / TallyPrime Accounting System Types
 * Non-floating point precision: All amounts stored as integer paise (100 paise = ₹1.00)
 */

export type AccountNature = 'Asset' | 'Liability' | 'Income' | 'Expense';
export type DrCr = 'Dr' | 'Cr';

export type VoucherBaseType = 
  | 'Contra' 
  | 'Payment' 
  | 'Receipt' 
  | 'Journal' 
  | 'Sales' 
  | 'Purchase' 
  | 'Credit Note' 
  | 'Debit Note' 
  | 'Delivery Note' 
  | 'Receipt Note';

export interface TallyCompanyFeatures {
  enableInventory: boolean;
  enableGst: boolean;
  enableBillByBill: boolean;
  enableCostCentres: boolean;
  highContrastMode?: boolean;
}

export interface TallyCompany {
  id: string;
  name: string;
  mailingName: string;
  address: string;
  state: string;
  stateCode: string;
  country: string;
  pincode: string;
  telephone: string;
  mobile: string;
  email: string;
  currencySymbol: string;
  formalName: string;
  financialYearStart: string; // YYYY-MM-DD
  booksBeginningDate: string; // YYYY-MM-DD
  gstin: string;
  pan: string;
  cin: string;
  features: TallyCompanyFeatures;
  createdAt: string;
  updatedAt: string;
}

export interface TallyAccountGroup {
  id: string;
  companyId: string;
  name: string;
  parentGroupName: string | null;
  nature: AccountNature;
  affectsGrossProfit: boolean;
  isDefault: boolean;
}

export interface BankDetailsConfig {
  accountNo?: string;
  ifsc?: string;
  bankName?: string;
  branch?: string;
}

export interface TallyLedger {
  id: string;
  companyId: string;
  name: string;
  alias?: string;
  groupId: string;
  groupName: string;
  openingBalancePaise: number; // positive integer paise
  openingBalanceType: DrCr;
  billByBillEnabled: boolean;
  gstin?: string;
  state?: string;
  stateCode?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  bankDetails?: BankDetailsConfig;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TallyVoucherType {
  id: string;
  companyId: string;
  name: string;
  baseType: VoucherBaseType;
  prefix: string;
  suffix: string;
  numberingMethod: 'Automatic' | 'Manual';
  startingNumber: number;
  currentNumber: number;
  restartPeriod: 'Yearly' | 'Never';
  isDefault: boolean;
}

export interface TallyUnit {
  id: string;
  companyId: string;
  type: 'Simple' | 'Compound';
  symbol: string;
  formalName: string;
  uqc: string;
  decimalPlaces: number;
  compoundFirstUnitId?: string;
  compoundConversion?: number;
  compoundSecondUnitId?: string;
}

export interface TallyGodown {
  id: string;
  companyId: string;
  name: string;
  address: string;
  isColdChain: boolean;
}

export interface TallyStockGroup {
  id: string;
  companyId: string;
  name: string;
  parentGroupId?: string;
  hsnSac?: string;
  gstRate?: number;
}

export interface TallyStockCategory {
  id: string;
  companyId: string;
  name: string;
}

export type ValuationMethod = 'FIFO' | 'Weighted Average' | 'Last Purchase Price';

export interface TallyStockItem {
  id: string;
  companyId: string;
  name: string;
  partNumber?: string;
  stockGroupId: string;
  stockGroupName: string;
  stockCategoryId?: string;
  unitId: string;
  unitSymbol: string;
  hsnSac: string;
  gstRate: number;
  valuationMethod: ValuationMethod;
  openingQty: number;
  openingRatePaise: number;
  openingValuePaise: number;
  standardCostPaise: number;
  standardSellingPricePaise: number;
  reorderLevel: number;
  godownId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TallyBillAllocation {
  id: string;
  voucherEntryId: string;
  ledgerId: string;
  refType: 'New Ref' | 'Against Ref' | 'Advance' | 'On Account';
  refName: string;
  amountPaise: number;
  dueDate?: string;
}

export interface TallyInventoryEntry {
  id: string;
  voucherId: string;
  stockItemId: string;
  stockItemName: string;
  godownId?: string;
  quantity: number;
  unitRatePaise: number;
  discountPercent: number;
  amountPaise: number;
  gstRate: number;
  hsnSac: string;
}

export interface TallyVoucherEntry {
  id: string;
  voucherId: string;
  ledgerId: string;
  ledgerName: string;
  entryType: DrCr;
  amountPaise: number; // strictly positive integer
  narration?: string;
  billAllocations?: TallyBillAllocation[];
}

export interface TallyVoucher {
  id: string;
  companyId: string;
  voucherTypeId: string;
  voucherTypeName: string;
  baseType: VoucherBaseType;
  voucherNumber: string;
  date: string; // YYYY-MM-DD
  referenceNo?: string;
  referenceDate?: string;
  narration: string;
  entries: TallyVoucherEntry[];
  inventoryEntries?: TallyInventoryEntry[];
  totalDebitPaise: number;
  totalCreditPaise: number;
  isDraft: boolean;
  isCancelled: boolean;
  cancellationReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TallyAuditRecord {
  id: string;
  companyId: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  timestamp: string;
  details: Record<string, any>;
}

export interface TallyStoreSchema {
  version: string;
  companies: TallyCompany[];
  selectedCompanyId: string | null;
  groups: TallyAccountGroup[];
  ledgers: TallyLedger[];
  voucherTypes: TallyVoucherType[];
  units: TallyUnit[];
  godowns: TallyGodown[];
  stockGroups: TallyStockGroup[];
  stockCategories: TallyStockCategory[];
  stockItems: TallyStockItem[];
  vouchers: TallyVoucher[];
  auditLogs: TallyAuditRecord[];
}
