export type TallyView =
  | 'GATEWAY'
  | 'ACCOUNTS_INFO'
  | 'GROUPS_LIST'
  | 'GROUP_CREATE'
  | 'LEDGERS_LIST'
  | 'LEDGER_CREATE'
  | 'LEDGER_ALTER'
  | 'VOUCHER_TYPES_LIST'
  | 'VOUCHER_TYPE_CREATE'
  | 'INVENTORY_INFO'
  | 'STOCK_GROUPS_LIST'
  | 'STOCK_GROUP_CREATE'
  | 'STOCK_ITEMS_LIST'
  | 'STOCK_ITEM_CREATE'
  | 'STOCK_ITEM_ALTER'
  | 'UNITS_LIST'
  | 'UNIT_CREATE'
  | 'GODOWNS_LIST'
  | 'GODOWN_CREATE'
  | 'COMPANY_SELECT'
  | 'COMPANY_CREATE'
  | 'COMPANY_ALTER'
  | 'PERIOD_MODAL'
  | 'QUIT_CONFIRM';

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
  financialYearStart: string;
  booksBeginningDate: string;
  gstin: string;
  pan: string;
  cin: string;
  features: {
    enableInventory: boolean;
    enableGst: boolean;
    enableBillByBill: boolean;
    enableCostCentres: boolean;
    highContrastMode?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TallyAccountGroup {
  id: string;
  companyId: string;
  name: string;
  parentGroupName: string | null;
  nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
  affectsGrossProfit: boolean;
  isDefault: boolean;
}

export interface TallyLedger {
  id: string;
  companyId: string;
  name: string;
  alias?: string;
  groupId: string;
  groupName: string;
  openingBalancePaise: number;
  openingBalanceType: 'Dr' | 'Cr';
  billByBillEnabled: boolean;
  gstin?: string;
  state?: string;
  stateCode?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  bankDetails?: {
    accountNo?: string;
    ifsc?: string;
    bankName?: string;
    branch?: string;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TallyVoucherType {
  id: string;
  companyId: string;
  name: string;
  baseType: string;
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

export interface TallyStockItem {
  id: string;
  companyId: string;
  name: string;
  partNumber?: string;
  stockGroupId: string;
  stockGroupName: string;
  unitId: string;
  unitSymbol: string;
  hsnSac: string;
  gstRate: number;
  valuationMethod: 'FIFO' | 'Weighted Average' | 'Last Purchase Price';
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
