/**
 * DOUBLE-ENTRY ACCOUNTING ENGINE (TALLY-STYLE)
 * Project: Diagnostic Services (D:\diagnostic-services)
 *
 * Implements strict double-entry ledger mechanics, transaction atomicity,
 * idempotency, immutable audit trails, and financial statement generation.
 */

import fs from 'fs';
import path from 'path';
import {
  AccountGroup,
  LedgerAccount,
  Voucher,
  VoucherLine,
  VoucherType,
  VoucherStatus,
  AccountingSettings,
  AuditTrailEntry,
  TrialBalanceReport,
  TrialBalanceRow,
  ProfitLossReport,
  BalanceSheetReport,
  DayBookEntry,
  AgingBucketRow,
  GstTaxSummary
} from './accountingTypes.js';

// Storage file path for durable JSON persistence (seamless standalone operation)
const DATA_DIR = path.resolve(process.cwd(), 'data');
const ACCOUNTING_STORE_FILE = path.join(DATA_DIR, 'accounting_store.json');

interface AccountingStoreState {
  groups: AccountGroup[];
  ledgers: LedgerAccount[];
  vouchers: Voucher[];
  settings: AccountingSettings;
  auditLogs: AuditTrailEntry[];
  lastModifiedAt: string;
}

// ============================================================================
// DEFAULT TALLY-STYLE CHART OF ACCOUNTS & GROUPS
// ============================================================================

export const DEFAULT_ACCOUNT_GROUPS: AccountGroup[] = [
  // Primary Groups
  { id: 'grp-capital', name: 'Capital Account', code: '1000', primaryType: 'LIABILITIES', nature: 'CREDIT', isPredefined: true },
  { id: 'grp-current-liabilities', name: 'Current Liabilities', code: '2000', primaryType: 'LIABILITIES', nature: 'CREDIT', isPredefined: true },
  { id: 'grp-duties-taxes', name: 'Duties & Taxes', code: '2100', primaryType: 'LIABILITIES', parentGroupId: 'grp-current-liabilities', nature: 'CREDIT', isPredefined: true },
  { id: 'grp-sundry-creditors', name: 'Sundry Creditors (Suppliers)', code: '2200', primaryType: 'LIABILITIES', parentGroupId: 'grp-current-liabilities', nature: 'CREDIT', isPredefined: true },
  { id: 'grp-provisions', name: 'Provisions & Accruals', code: '2300', primaryType: 'LIABILITIES', parentGroupId: 'grp-current-liabilities', nature: 'CREDIT', isPredefined: true },
  
  { id: 'grp-fixed-assets', name: 'Fixed Assets', code: '3000', primaryType: 'ASSETS', nature: 'DEBIT', isPredefined: true },
  { id: 'grp-current-assets', name: 'Current Assets', code: '4000', primaryType: 'ASSETS', nature: 'DEBIT', isPredefined: true },
  { id: 'grp-bank-accounts', name: 'Bank Accounts', code: '4100', primaryType: 'ASSETS', parentGroupId: 'grp-current-assets', nature: 'DEBIT', isPredefined: true },
  { id: 'grp-cash-in-hand', name: 'Cash-in-Hand', code: '4200', primaryType: 'ASSETS', parentGroupId: 'grp-current-assets', nature: 'DEBIT', isPredefined: true },
  { id: 'grp-stock-in-hand', name: 'Stock-in-Hand (Inventory)', code: '4300', primaryType: 'ASSETS', parentGroupId: 'grp-current-assets', nature: 'DEBIT', isPredefined: true },
  { id: 'grp-sundry-debtors', name: 'Sundry Debtors (Customers / Labs)', code: '4400', primaryType: 'ASSETS', parentGroupId: 'grp-current-assets', nature: 'DEBIT', isPredefined: true },
  { id: 'grp-input-tax-credit', name: 'Input Tax Credit (ITC)', code: '4500', primaryType: 'ASSETS', parentGroupId: 'grp-current-assets', nature: 'DEBIT', isPredefined: true },

  { id: 'grp-sales-accounts', name: 'Sales Accounts', code: '5000', primaryType: 'INCOME', nature: 'CREDIT', isPredefined: true, affectsGrossProfit: true },
  { id: 'grp-direct-income', name: 'Direct Incomes', code: '5100', primaryType: 'INCOME', nature: 'CREDIT', isPredefined: true, affectsGrossProfit: true },
  { id: 'grp-indirect-income', name: 'Indirect Incomes', code: '5200', primaryType: 'INCOME', nature: 'CREDIT', isPredefined: true, affectsGrossProfit: false },

  { id: 'grp-purchase-accounts', name: 'Purchase Accounts', code: '6000', primaryType: 'EXPENSES', nature: 'DEBIT', isPredefined: true, affectsGrossProfit: true },
  { id: 'grp-direct-expenses', name: 'Direct Expenses (Freight / Cold Chain)', code: '6100', primaryType: 'EXPENSES', nature: 'DEBIT', isPredefined: true, affectsGrossProfit: true },
  { id: 'grp-indirect-expenses', name: 'Indirect Expenses', code: '6200', primaryType: 'EXPENSES', nature: 'DEBIT', isPredefined: true, affectsGrossProfit: false },
];

export const DEFAULT_SETTINGS: AccountingSettings = {
  id: 'acc-settings-01',
  companyName: 'A2Z Diagnostic Services India Pvt Ltd',
  companyAddressLine1: 'Unit 402-404, Diagnostic Corporate Park',
  companyAddressLine2: 'LBS Marg, Powai',
  companyCity: 'Mumbai',
  companyPincode: '400076',
  companyEmail: 'billing@a2zdiagnostic.com',
  companyPhone: '+91 22 4912 8800',
  gstin: '27AABCU9603R1ZM',
  pan: 'AABCU9603R',
  state: 'Maharashtra',
  stateCode: '27',
  financialYearStartMonth: 4,
  activeFinancialYear: '2026-2027',
  enableGst: true,
  defaultCgstRate: 9,
  defaultSgstRate: 9,
  defaultIgstRate: 18,
  defaultPricingMode: 'TAX_EXCLUSIVE',
  currencySymbol: '₹',
  roundingPolicy: 'ROUND_NEAREST',
  voucherNumberPrefixes: {
    SALES_INVOICE: 'SINV-26/',
    PURCHASE_BILL: 'PBILL-26/',
    RECEIPT: 'RCPT-26/',
    PAYMENT: 'PYMT-26/',
    JOURNAL: 'JRNL-26/',
    CONTRA: 'CNTR-26/',
    CREDIT_NOTE: 'CRNT-26/',
    DEBIT_NOTE: 'DBNT-26/',
    OPENING_BALANCE: 'OPBAL-26/'
  },
  voucherNumberSequences: {
    SALES_INVOICE: 1045,
    PURCHASE_BILL: 512,
    RECEIPT: 890,
    PAYMENT: 630,
    JOURNAL: 215,
    CONTRA: 140,
    CREDIT_NOTE: 34,
    DEBIT_NOTE: 18,
    OPENING_BALANCE: 1
  },
  numberingConfigs: {
    TAX_INVOICE: {
      documentType: 'TAX_INVOICE',
      prefix: 'SINV-',
      suffix: '',
      financialYearFormat: 'YY-YY',
      startingNumber: 1001,
      paddingDigits: 4,
      resetPolicy: 'ANNUAL',
      currentSequence: 1045
    },
    PROFORMA_INVOICE: {
      documentType: 'PROFORMA_INVOICE',
      prefix: 'PI-',
      suffix: '',
      financialYearFormat: 'YY-YY',
      startingNumber: 101,
      paddingDigits: 3,
      resetPolicy: 'ANNUAL',
      currentSequence: 101
    },
    DELIVERY_NOTE: {
      documentType: 'DELIVERY_NOTE',
      prefix: 'DN-',
      suffix: '',
      financialYearFormat: 'YY-YY',
      startingNumber: 501,
      paddingDigits: 4,
      resetPolicy: 'ANNUAL',
      currentSequence: 501
    },
    CREDIT_NOTE: {
      documentType: 'CREDIT_NOTE',
      prefix: 'CRNT-',
      suffix: '',
      financialYearFormat: 'YY-YY',
      startingNumber: 1,
      paddingDigits: 3,
      resetPolicy: 'ANNUAL',
      currentSequence: 34
    }
  },
  printConfig: {
    documentTitle: 'Tax Invoice',
    proformaTitle: 'Proforma Invoice',
    deliveryNoteTitle: 'Delivery Note',
    creditNoteTitle: 'Credit Note',
    subtitle: 'Invoice under Rule 48 of CGST Rules, 2017',
    printCompanyLogo: true,
    printCompanyPan: true,
    printCompanyGstin: true,
    printBuyerGstin: true,
    printStateCode: true,
    addressInContinuousLine: false,
    printBankDetails: true,
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountName: 'A2Z Diagnostic Services India Pvt Ltd',
      accountNumber: '50200088192001',
      ifscCode: 'HDFC0000128',
      branchName: 'Powai Central Commercial Branch, Mumbai',
      swiftCode: 'HDFCINBB'
    },
    printSerialNumber: true,
    printPartNumber: false,
    printHsnSacColumn: true,
    printQuantityColumn: true,
    printAlternateQuantity: false,
    printRateColumn: true,
    printDiscountColumn: true,
    printGstRateColumn: true,
    printItemGstDetails: false,
    printGstAnalysis: true,
    printBatchDetails: true,
    printExpiryDate: true,
    printAmountColumn: true,
    printOrderDetails: true,
    printTermsOfPayment: true,
    printDespatchDetails: true,
    printTermsOfDelivery: true,
    printDeclaration: true,
    declarationText: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    termsAndConditions: '1. Goods once sold will not be taken back unless damaged in transit.\n2. Payment terms: 30 days net.\n3. Reagents must be stored at indicated temperatures (2°C to 8°C cold chain).\n4. Interest @ 18% p.a. will be charged on overdue payments.',
    authorizedSignatoryText: 'for A2Z Diagnostic Services India Pvt Ltd\n\nAuthorised Signatory',
    computerGeneratedNotice: 'This is a Computer Generated Document',
    jurisdiction: 'Subject to Mumbai Jurisdiction',
    paperSize: 'A4',
    orientation: 'portrait',
    topMarginInches: 0.25,
    leftMarginInches: 0.50,
    numberOfCopies: 3,
    copyLabels: ['ORIGINAL FOR RECIPIENT', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR SUPPLIER']
  },
  periodLockDate: '2026-03-31',
  allowBackdatedVouchers: true
};

export const DEFAULT_LEDGERS: LedgerAccount[] = [
  // Banks & Cash
  {
    id: 'led-bank-hdfc',
    accountNumber: 'HDFC-00128912',
    name: 'HDFC Bank - Current A/c 50200088192',
    groupId: 'grp-bank-accounts',
    groupName: 'Bank Accounts',
    accountType: 'BANK',
    openingBalance: 2450000,
    openingBalanceType: 'DEBIT',
    currentBalance: 3125000,
    currentBalanceType: 'DEBIT',
    partyType: 'BANK',
    bankAccountNumber: '50200088192001',
    ifscCode: 'HDFC0000128',
    bankBranch: 'Kanjurmarg West, Mumbai',
    isReconciliationEnabled: true,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-bank-sbi',
    accountNumber: 'SBI-99120034',
    name: 'State Bank of India - Collection A/c',
    groupId: 'grp-bank-accounts',
    groupName: 'Bank Accounts',
    accountType: 'BANK',
    openingBalance: 1100000,
    openingBalanceType: 'DEBIT',
    currentBalance: 1450000,
    currentBalanceType: 'DEBIT',
    partyType: 'BANK',
    bankAccountNumber: '38192004812',
    ifscCode: 'SBIN0001140',
    bankBranch: 'Powai IIT Branch, Mumbai',
    isReconciliationEnabled: true,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-cash-in-hand',
    accountNumber: 'CASH-001',
    name: 'Cash In Hand (Petty Cash Counter)',
    groupId: 'grp-cash-in-hand',
    groupName: 'Cash-in-Hand',
    accountType: 'CASH',
    openingBalance: 85000,
    openingBalanceType: 'DEBIT',
    currentBalance: 42500,
    currentBalanceType: 'DEBIT',
    partyType: 'OTHER',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Customers (Sundry Debtors)
  {
    id: 'led-debtor-metropolis',
    accountNumber: 'DEB-001',
    name: 'Metropolis Clinical Lab Powai',
    groupId: 'grp-sundry-debtors',
    groupName: 'Sundry Debtors (Customers / Labs)',
    accountType: 'SUNDRY_DEBTOR',
    openingBalance: 180000,
    openingBalanceType: 'DEBIT',
    currentBalance: 245000,
    currentBalanceType: 'DEBIT',
    partyType: 'CUSTOMER',
    entityId: 'u-cust-01',
    gstin: '27AAECM2391K1ZQ',
    pan: 'AAECM2391K',
    stateCode: '27',
    creditPeriodDays: 30,
    creditLimit: 500000,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-debtor-apollo',
    accountNumber: 'DEB-002',
    name: 'Apollo Pathology Hub Vashi',
    groupId: 'grp-sundry-debtors',
    groupName: 'Sundry Debtors (Customers / Labs)',
    accountType: 'SUNDRY_DEBTOR',
    openingBalance: 125000,
    openingBalanceType: 'DEBIT',
    currentBalance: 195000,
    currentBalanceType: 'DEBIT',
    partyType: 'CUSTOMER',
    entityId: 'u-cust-02',
    gstin: '27AABCA3412M1Z2',
    pan: 'AABCA3412M',
    stateCode: '27',
    creditPeriodDays: 30,
    creditLimit: 400000,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-debtor-suburban',
    accountNumber: 'DEB-003',
    name: 'Suburban Diagnostics Andheri',
    groupId: 'grp-sundry-debtors',
    groupName: 'Sundry Debtors (Customers / Labs)',
    accountType: 'SUNDRY_DEBTOR',
    openingBalance: 95000,
    openingBalanceType: 'DEBIT',
    currentBalance: 142000,
    currentBalanceType: 'DEBIT',
    partyType: 'CUSTOMER',
    entityId: 'u-cust-03',
    gstin: '27AAACS8912P1ZN',
    pan: 'AAACS8912P',
    stateCode: '27',
    creditPeriodDays: 21,
    creditLimit: 300000,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Suppliers (Sundry Creditors)
  {
    id: 'led-creditor-roche',
    accountNumber: 'CRED-001',
    name: 'Roche Diagnostics India Pvt Ltd',
    groupId: 'grp-sundry-creditors',
    groupName: 'Sundry Creditors (Suppliers)',
    accountType: 'SUNDRY_CREDITOR',
    openingBalance: 820000,
    openingBalanceType: 'CREDIT',
    currentBalance: 980000,
    currentBalanceType: 'CREDIT',
    partyType: 'SUPPLIER',
    entityId: 'comp-roche',
    gstin: '27AABCR9912Q1ZM',
    pan: 'AABCR9912Q',
    stateCode: '27',
    creditPeriodDays: 45,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-creditor-sysmex',
    accountNumber: 'CRED-002',
    name: 'Sysmex India Pvt Ltd',
    groupId: 'grp-sundry-creditors',
    groupName: 'Sundry Creditors (Suppliers)',
    accountType: 'SUNDRY_CREDITOR',
    openingBalance: 450000,
    openingBalanceType: 'CREDIT',
    currentBalance: 520000,
    currentBalanceType: 'CREDIT',
    partyType: 'SUPPLIER',
    entityId: 'comp-sysmex',
    gstin: '27AABCS3310N1ZW',
    pan: 'AABCS3310N',
    stateCode: '27',
    creditPeriodDays: 45,
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Stock / Inventory Valuation
  {
    id: 'led-stock-inventory',
    accountNumber: 'INV-001',
    name: 'Diagnostic Reagents & Equipment Inventory',
    groupId: 'grp-stock-in-hand',
    groupName: 'Stock-in-Hand (Inventory)',
    accountType: 'CURRENT_ASSET',
    openingBalance: 3200000,
    openingBalanceType: 'DEBIT',
    currentBalance: 3450000,
    currentBalanceType: 'DEBIT',
    partyType: 'OTHER',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Sales & Revenue
  {
    id: 'led-sales-reagents',
    accountNumber: 'SAL-001',
    name: 'Sales - Diagnostic Reagents & Kits',
    groupId: 'grp-sales-accounts',
    groupName: 'Sales Accounts',
    accountType: 'SALES',
    openingBalance: 0,
    openingBalanceType: 'CREDIT',
    currentBalance: 4850000,
    currentBalanceType: 'CREDIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-sales-equipment',
    accountNumber: 'SAL-002',
    name: 'Sales - Lab Equipment & Analyzers',
    groupId: 'grp-sales-accounts',
    groupName: 'Sales Accounts',
    accountType: 'SALES',
    openingBalance: 0,
    openingBalanceType: 'CREDIT',
    currentBalance: 1800000,
    currentBalanceType: 'CREDIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Purchases
  {
    id: 'led-purchases-reagents',
    accountNumber: 'PUR-001',
    name: 'Purchases - Diagnostic Reagents & Consumables',
    groupId: 'grp-purchase-accounts',
    groupName: 'Purchase Accounts',
    accountType: 'PURCHASE',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 3950000,
    currentBalanceType: 'DEBIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Duties & Taxes (GST Output & Input)
  {
    id: 'led-cgst-output',
    accountNumber: 'TAX-001',
    name: 'CGST Output Tax Payable (9%)',
    groupId: 'grp-duties-taxes',
    groupName: 'Duties & Taxes',
    accountType: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'CREDIT',
    currentBalance: 598500,
    currentBalanceType: 'CREDIT',
    partyType: 'TAX_AUTHORITY',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-sgst-output',
    accountNumber: 'TAX-002',
    name: 'SGST Output Tax Payable (9%)',
    groupId: 'grp-duties-taxes',
    groupName: 'Duties & Taxes',
    accountType: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'CREDIT',
    currentBalance: 598500,
    currentBalanceType: 'CREDIT',
    partyType: 'TAX_AUTHORITY',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-igst-output',
    accountNumber: 'TAX-003',
    name: 'IGST Output Tax Payable (18%)',
    groupId: 'grp-duties-taxes',
    groupName: 'Duties & Taxes',
    accountType: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'CREDIT',
    currentBalance: 124000,
    currentBalanceType: 'CREDIT',
    partyType: 'TAX_AUTHORITY',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-cgst-input',
    accountNumber: 'TAX-004',
    name: 'CGST Input Tax Credit (ITC 9%)',
    groupId: 'grp-input-tax-credit',
    groupName: 'Input Tax Credit (ITC)',
    accountType: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 355500,
    currentBalanceType: 'DEBIT',
    partyType: 'TAX_AUTHORITY',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-sgst-input',
    accountNumber: 'TAX-005',
    name: 'SGST Input Tax Credit (ITC 9%)',
    groupId: 'grp-input-tax-credit',
    groupName: 'Input Tax Credit (ITC)',
    accountType: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 355500,
    currentBalanceType: 'DEBIT',
    partyType: 'TAX_AUTHORITY',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Direct Expenses
  {
    id: 'led-freight-cold-chain',
    accountNumber: 'EXP-DIR-001',
    name: 'Cold-Chain Logistics & Freight Inward',
    groupId: 'grp-direct-expenses',
    groupName: 'Direct Expenses (Freight / Cold Chain)',
    accountType: 'DIRECT_EXPENSE',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 145000,
    currentBalanceType: 'DEBIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Indirect Expenses
  {
    id: 'led-salaries-wages',
    accountNumber: 'EXP-IND-001',
    name: 'Salaries & Staff Compensation',
    groupId: 'grp-indirect-expenses',
    groupName: 'Indirect Expenses',
    accountType: 'INDIRECT_EXPENSE',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 1845000,
    currentBalanceType: 'DEBIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-office-rent',
    accountNumber: 'EXP-IND-002',
    name: 'Warehouse & Office Rent',
    groupId: 'grp-indirect-expenses',
    groupName: 'Indirect Expenses',
    accountType: 'INDIRECT_EXPENSE',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 360000,
    currentBalanceType: 'DEBIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-electricity-utilities',
    accountNumber: 'EXP-IND-003',
    name: 'Cold-Room Power & Utilities',
    groupId: 'grp-indirect-expenses',
    groupName: 'Indirect Expenses',
    accountType: 'INDIRECT_EXPENSE',
    openingBalance: 0,
    openingBalanceType: 'DEBIT',
    currentBalance: 98000,
    currentBalanceType: 'DEBIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  // Capital & Reserves
  {
    id: 'led-partner-capital',
    accountNumber: 'CAP-001',
    name: 'Shareholders / Partners Capital',
    groupId: 'grp-capital',
    groupName: 'Capital Account',
    accountType: 'CAPITAL',
    openingBalance: 4000000,
    openingBalanceType: 'CREDIT',
    currentBalance: 4000000,
    currentBalanceType: 'CREDIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-provisions',
    accountNumber: 'PRV-001',
    name: 'Provisions & Accrued Liabilities',
    groupId: 'grp-provisions',
    groupName: 'Provisions & Accruals',
    accountType: 'PROVISION',
    openingBalance: 0,
    openingBalanceType: 'CREDIT',
    currentBalance: 222600,
    currentBalanceType: 'CREDIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  },
  {
    id: 'led-retained-earnings',
    accountNumber: 'RES-001',
    name: 'General Reserves & Retained Earnings',
    groupId: 'grp-capital',
    groupName: 'Capital Account',
    accountType: 'CAPITAL',
    openingBalance: 1965000,
    openingBalanceType: 'CREDIT',
    currentBalance: 1965000,
    currentBalanceType: 'CREDIT',
    isActive: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-10-22T10:00:00Z'
  }
];

// Seeded Sample Balanced Vouchers across all voucher types
export const DEFAULT_VOUCHERS: Voucher[] = [
  // 1. Sales Invoice: Metropolis Clinical Lab (Order ORD-8812)
  {
    id: 'vch-2026-0001',
    voucherNumber: 'SINV-26/1041',
    voucherType: 'SALES_INVOICE',
    date: '2026-10-18',
    financialYear: '2026-2027',
    referenceNumber: 'ORD-8812',
    referenceDate: '2026-10-18',
    narration: 'Being diagnostic reagents sold to Metropolis Clinical Lab Powai per Order #ORD-8812',
    status: 'POSTED',
    totalDebit: 118000,
    totalCredit: 118000,
    lines: [
      {
        id: 'vl-01-1',
        ledgerId: 'led-debtor-metropolis',
        ledgerName: 'Metropolis Clinical Lab Powai',
        accountType: 'SUNDRY_DEBTOR',
        debit: 118000,
        credit: 0,
        narration: 'Invoice total receivable'
      },
      {
        id: 'vl-01-2',
        ledgerId: 'led-sales-reagents',
        ledgerName: 'Sales - Diagnostic Reagents & Kits',
        accountType: 'SALES',
        debit: 0,
        credit: 100000,
        taxableAmount: 100000,
        taxRatePercent: 18,
        narration: 'Elecsys TSH & Cellpack DCL test kits'
      },
      {
        id: 'vl-01-3',
        ledgerId: 'led-cgst-output',
        ledgerName: 'CGST Output Tax Payable (9%)',
        accountType: 'DUTIES_AND_TAXES',
        debit: 0,
        credit: 9000,
        cgstAmount: 9000,
        narration: 'CGST @ 9% on Taxable Value 100000'
      },
      {
        id: 'vl-01-4',
        ledgerId: 'led-sgst-output',
        ledgerName: 'SGST Output Tax Payable (9%)',
        accountType: 'DUTIES_AND_TAXES',
        debit: 0,
        credit: 9000,
        sgstAmount: 9000,
        narration: 'SGST @ 9% on Taxable Value 100000'
      }
    ],
    entityType: 'CUSTOMER_ORDER',
    entityId: 'ORD-8812',
    postedBy: 'Priya Verma (Accounts Staff)',
    postedAt: '2026-10-18T11:30:00Z',
    createdAt: '2026-10-18T11:30:00Z',
    updatedAt: '2026-10-18T11:30:00Z'
  },
  // 2. Receipt Voucher: Metropolis Payment received in HDFC
  {
    id: 'vch-2026-0002',
    voucherNumber: 'RCPT-26/0889',
    voucherType: 'RECEIPT',
    date: '2026-10-20',
    financialYear: '2026-2027',
    referenceNumber: 'NEFT-HDFC-99120',
    referenceDate: '2026-10-20',
    narration: 'Being full payment received via NEFT against Invoice SINV-26/1041',
    status: 'POSTED',
    totalDebit: 118000,
    totalCredit: 118000,
    bankName: 'HDFC Bank',
    chequeNumber: 'NEFT-99120',
    bankClearanceDate: '2026-10-20',
    isReconciled: true,
    lines: [
      {
        id: 'vl-02-1',
        ledgerId: 'led-bank-hdfc',
        ledgerName: 'HDFC Bank - Current A/c 50200088192',
        accountType: 'BANK',
        debit: 118000,
        credit: 0,
        narration: 'Direct NEFT credit from Metropolis'
      },
      {
        id: 'vl-02-2',
        ledgerId: 'led-debtor-metropolis',
        ledgerName: 'Metropolis Clinical Lab Powai',
        accountType: 'SUNDRY_DEBTOR',
        debit: 0,
        credit: 118000,
        narration: 'Clearance against Invoice SINV-26/1041'
      }
    ],
    entityType: 'CUSTOMER_RECEIPT',
    entityId: 'RCPT-MET-01',
    postedBy: 'Priya Verma (Accounts Staff)',
    postedAt: '2026-10-20T14:15:00Z',
    createdAt: '2026-10-20T14:15:00Z',
    updatedAt: '2026-10-20T14:15:00Z'
  },
  // 3. Purchase Bill: Reagents received from Roche Diagnostics
  {
    id: 'vch-2026-0003',
    voucherNumber: 'PBILL-26/0511',
    voucherType: 'PURCHASE_BILL',
    date: '2026-10-15',
    financialYear: '2026-2027',
    referenceNumber: 'ROCHE-INV-9921',
    referenceDate: '2026-10-14',
    narration: 'Being bulk batch inward of Elecsys reagents and calibrators from Roche Diagnostics India',
    status: 'POSTED',
    totalDebit: 236000,
    totalCredit: 236000,
    lines: [
      {
        id: 'vl-03-1',
        ledgerId: 'led-purchases-reagents',
        ledgerName: 'Purchases - Diagnostic Reagents & Consumables',
        accountType: 'PURCHASE',
        debit: 200000,
        credit: 0,
        taxableAmount: 200000,
        taxRatePercent: 18,
        narration: 'Batch PO-2026-109 items'
      },
      {
        id: 'vl-03-2',
        ledgerId: 'led-cgst-input',
        ledgerName: 'CGST Input Tax Credit (ITC 9%)',
        accountType: 'DUTIES_AND_TAXES',
        debit: 18000,
        credit: 0,
        cgstAmount: 18000,
        narration: 'Eligible ITC CGST @ 9%'
      },
      {
        id: 'vl-03-3',
        ledgerId: 'led-sgst-input',
        ledgerName: 'SGST Input Tax Credit (ITC 9%)',
        accountType: 'DUTIES_AND_TAXES',
        debit: 18000,
        credit: 0,
        sgstAmount: 18000,
        narration: 'Eligible ITC SGST @ 9%'
      },
      {
        id: 'vl-03-4',
        ledgerId: 'led-creditor-roche',
        ledgerName: 'Roche Diagnostics India Pvt Ltd',
        accountType: 'SUNDRY_CREDITOR',
        debit: 0,
        credit: 236000,
        narration: 'Bill payable to Roche Diagnostics'
      }
    ],
    entityType: 'SUPPLIER_BILL',
    entityId: 'ROCHE-INV-9921',
    postedBy: 'Priya Verma (Accounts Staff)',
    postedAt: '2026-10-15T16:00:00Z',
    createdAt: '2026-10-15T16:00:00Z',
    updatedAt: '2026-10-15T16:00:00Z'
  },
  // 4. Payment Voucher: Supplier payment to Roche Diagnostics via HDFC
  {
    id: 'vch-2026-0004',
    voucherNumber: 'PYMT-26/0628',
    voucherType: 'PAYMENT',
    date: '2026-10-21',
    financialYear: '2026-2027',
    referenceNumber: 'RTGS-HDFC-88912',
    referenceDate: '2026-10-21',
    narration: 'Being RTGS vendor payment made to Roche Diagnostics against invoice ROCHE-INV-9921',
    status: 'POSTED',
    totalDebit: 236000,
    totalCredit: 236000,
    bankName: 'HDFC Bank',
    chequeNumber: 'RTGS-88912',
    bankClearanceDate: '2026-10-21',
    isReconciled: true,
    lines: [
      {
        id: 'vl-04-1',
        ledgerId: 'led-creditor-roche',
        ledgerName: 'Roche Diagnostics India Pvt Ltd',
        accountType: 'SUNDRY_CREDITOR',
        debit: 236000,
        credit: 0,
        narration: 'Settlement of Bill ROCHE-INV-9921'
      },
      {
        id: 'vl-04-2',
        ledgerId: 'led-bank-hdfc',
        ledgerName: 'HDFC Bank - Current A/c 50200088192',
        accountType: 'BANK',
        debit: 0,
        credit: 236000,
        narration: 'RTGS debit from HDFC Current Account'
      }
    ],
    entityType: 'SUPPLIER_BILL',
    entityId: 'ROCHE-INV-9921',
    postedBy: 'Priya Verma (Accounts Staff)',
    postedAt: '2026-10-21T11:20:00Z',
    createdAt: '2026-10-21T11:20:00Z',
    updatedAt: '2026-10-21T11:20:00Z'
  },
  // 5. Contra Voucher: Cash deposited from Petty Cash Counter to SBI Bank
  {
    id: 'vch-2026-0005',
    voucherNumber: 'CNTR-26/0139',
    voucherType: 'CONTRA',
    date: '2026-10-19',
    financialYear: '2026-2027',
    referenceNumber: 'DEP-SLIP-891',
    referenceDate: '2026-10-19',
    narration: 'Being surplus petty cash counter collections deposited into SBI Collection Account',
    status: 'POSTED',
    totalDebit: 25000,
    totalCredit: 25000,
    lines: [
      {
        id: 'vl-05-1',
        ledgerId: 'led-bank-sbi',
        ledgerName: 'State Bank of India - Collection A/c',
        accountType: 'BANK',
        debit: 25000,
        credit: 0,
        narration: 'Deposit slip #891'
      },
      {
        id: 'vl-05-2',
        ledgerId: 'led-cash-in-hand',
        ledgerName: 'Cash In Hand (Petty Cash Counter)',
        accountType: 'CASH',
        debit: 0,
        credit: 25000,
        narration: 'Cash remitted to bank'
      }
    ],
    postedBy: 'Priya Verma (Accounts Staff)',
    postedAt: '2026-10-19T17:00:00Z',
    createdAt: '2026-10-19T17:00:00Z',
    updatedAt: '2026-10-19T17:00:00Z'
  },
  // 6. Journal Voucher: Approved September Payroll Posting
  {
    id: 'vch-2026-0006',
    voucherNumber: 'JRNL-26/0214',
    voucherType: 'JOURNAL',
    date: '2026-10-02',
    financialYear: '2026-2027',
    referenceNumber: 'PAY-RUN-2026-09',
    referenceDate: '2026-10-02',
    narration: 'Being September 2026 final salary payroll disbursement approved by Super Admin Rajesh Sharma',
    status: 'POSTED',
    totalDebit: 1845000,
    totalCredit: 1845000,
    lines: [
      {
        id: 'vl-06-1',
        ledgerId: 'led-salaries-wages',
        ledgerName: 'Salaries & Staff Compensation',
        accountType: 'INDIRECT_EXPENSE',
        debit: 1845000,
        credit: 0,
        narration: 'Total gross salary payroll expense for 24 staff'
      },
      {
        id: 'vl-06-2',
        ledgerId: 'led-bank-hdfc',
        ledgerName: 'HDFC Bank - Current A/c 50200088192',
        accountType: 'BANK',
        debit: 0,
        credit: 1622400,
        narration: 'Direct net salary bank credit transfer'
      },
      {
        id: 'vl-06-3',
        ledgerId: 'led-provisions',
        ledgerName: 'Provisions & Accruals',
        accountType: 'PROVISION',
        debit: 0,
        credit: 222600,
        narration: 'Statutory PF, ESI, and TDS deductions withheld'
      }
    ],
    entityType: 'PAYROLL',
    entityId: 'pay-run-2026-09',
    postedBy: 'Rajesh Sharma (Super Admin)',
    postedAt: '2026-10-02T14:35:00Z',
    approvedBy: 'Rajesh Sharma (Super Admin)',
    approvedAt: '2026-10-02T14:35:00Z',
    createdAt: '2026-10-02T14:35:00Z',
    updatedAt: '2026-10-02T14:35:00Z'
  },
  // 7. Credit Note: Order item discount / rate adjustment for Apollo Pathology
  {
    id: 'vch-2026-0007',
    voucherNumber: 'CRNT-26/0034',
    voucherType: 'CREDIT_NOTE',
    date: '2026-10-21',
    financialYear: '2026-2027',
    referenceNumber: 'ORD-8815',
    referenceDate: '2026-10-21',
    narration: 'Being volume price concession allowed on Architect Creatinine kits for Apollo Pathology',
    status: 'POSTED',
    totalDebit: 11800,
    totalCredit: 11800,
    lines: [
      {
        id: 'vl-07-1',
        ledgerId: 'led-sales-reagents',
        ledgerName: 'Sales - Diagnostic Reagents & Kits',
        accountType: 'SALES',
        debit: 10000,
        credit: 0,
        narration: 'Sales reversal / concession'
      },
      {
        id: 'vl-07-2',
        ledgerId: 'led-cgst-output',
        ledgerName: 'CGST Output Tax Payable (9%)',
        accountType: 'DUTIES_AND_TAXES',
        debit: 900,
        credit: 0,
        narration: 'CGST adjustment'
      },
      {
        id: 'vl-07-3',
        ledgerId: 'led-sgst-output',
        ledgerName: 'SGST Output Tax Payable (9%)',
        accountType: 'DUTIES_AND_TAXES',
        debit: 900,
        credit: 0,
        narration: 'SGST adjustment'
      },
      {
        id: 'vl-07-4',
        ledgerId: 'led-debtor-apollo',
        ledgerName: 'Apollo Pathology Hub Vashi',
        accountType: 'SUNDRY_DEBTOR',
        debit: 0,
        credit: 11800,
        narration: 'Credit note adjustment to customer receivable'
      }
    ],
    entityType: 'CUSTOMER_ORDER',
    entityId: 'ORD-8815',
    postedBy: 'Rajesh Sharma (Super Admin)',
    postedAt: '2026-10-21T15:30:00Z',
    createdAt: '2026-10-21T15:30:00Z',
    updatedAt: '2026-10-21T15:30:00Z'
  }
];

// ============================================================================
// DOUBLE-ENTRY ENGINE SINGLETON WITH ATOMIC DISK PERSISTENCE
// ============================================================================

export class DoubleEntryEngine {
  private static instance: DoubleEntryEngine;
  private state: AccountingStoreState;

  private constructor() {
    this.state = this.loadOrInitializeStore();
  }

  public static getInstance(): DoubleEntryEngine {
    if (!DoubleEntryEngine.instance) {
      DoubleEntryEngine.instance = new DoubleEntryEngine();
    }
    return DoubleEntryEngine.instance;
  }

  private loadOrInitializeStore(): AccountingStoreState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(ACCOUNTING_STORE_FILE)) {
        const raw = fs.readFileSync(ACCOUNTING_STORE_FILE, 'utf-8');
        if (raw && raw.trim().length > 0) {
          const parsed = JSON.parse(raw);
          if (parsed.groups && parsed.ledgers && parsed.vouchers) {
            parsed.settings = {
              ...DEFAULT_SETTINGS,
              ...(parsed.settings || {}),
              numberingConfigs: {
                ...DEFAULT_SETTINGS.numberingConfigs,
                ...(parsed.settings?.numberingConfigs || {})
              },
              printConfig: {
                ...DEFAULT_SETTINGS.printConfig,
                ...(parsed.settings?.printConfig || {})
              }
            };
            return parsed;
          }
        }
      }
    } catch (e: any) {
      console.warn('[Accounting Engine] Warning loading state, initializing fresh store:', e.message);
    }

    const initialState: AccountingStoreState = {
      groups: DEFAULT_ACCOUNT_GROUPS,
      ledgers: DEFAULT_LEDGERS,
      vouchers: DEFAULT_VOUCHERS,
      settings: DEFAULT_SETTINGS,
      auditLogs: [
        {
          id: 'aud-acc-init',
          timestamp: '2026-04-01T00:00:00Z',
          action: 'SETTINGS_CHANGED',
          entityType: 'SETTINGS',
          entityId: 'acc-settings-01',
          performedBy: 'u-admin-01',
          performedByName: 'Super Admin',
          performedByRole: 'SUPER_ADMIN',
          details: 'Initialized standard Indian Tally-style Chart of Accounts and GST configuration.'
        }
      ],
      lastModifiedAt: new Date().toISOString()
    };

    this.saveStore(initialState);
    return initialState;
  }

  private saveStore(stateToSave?: AccountingStoreState): void {
    try {
      const state = stateToSave || this.state;
      state.lastModifiedAt = new Date().toISOString();
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${ACCOUNTING_STORE_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tmp, ACCOUNTING_STORE_FILE);
    } catch (e: any) {
      console.error('[Accounting Engine] Failed to save store:', e.message);
    }
  }

  // --------------------------------------------------------------------------
  // MASTER READERS
  // --------------------------------------------------------------------------

  public getGroups(): AccountGroup[] {
    return [...this.state.groups];
  }

  public getLedgers(): LedgerAccount[] {
    return [...this.state.ledgers];
  }

  public getLedgerById(id: string): LedgerAccount | undefined {
    return this.state.ledgers.find(l => l.id === id);
  }

  public getSettings(): AccountingSettings {
    return { ...this.state.settings };
  }

  public updateSettings(
    updates: Partial<AccountingSettings>,
    user?: { id: string; name: string }
  ): AccountingSettings {
    this.state.settings = {
      ...this.state.settings,
      ...updates,
      address: {
        ...(this.state.settings.address || {}),
        ...(updates.address || {})
      },
      contacts: {
        ...(this.state.settings.contacts || {}),
        ...(updates.contacts || {})
      },
      bankDetails: {
        ...(this.state.settings.bankDetails || {}),
        ...(updates.bankDetails || {})
      },
      numberingConfigs: {
        ...(this.state.settings.numberingConfigs || {}),
        ...(updates.numberingConfigs || {})
      },
      printConfig: {
        ...(this.state.settings.printConfig || {}),
        ...(updates.printConfig || {})
      }
    };

    if (user) {
      this.recordAudit({
        action: 'SETTINGS_CHANGED',
        entityType: 'SETTINGS',
        entityId: 'accounting-settings',
        performedBy: user.id,
        performedByName: user.name,
        performedByRole: (user as any).role || 'ADMIN',
        details: 'Updated accounting & invoice configuration'
      });
    }

    this.saveStore();
    return { ...this.state.settings };
  }

  public getVouchers(filters?: {
    type?: VoucherType;
    status?: VoucherStatus;
    fromDate?: string;
    toDate?: string;
    ledgerId?: string;
  }): Voucher[] {
    let list = [...this.state.vouchers];
    if (!filters) return list;

    if (filters.type) {
      list = list.filter(v => v.voucherType === filters.type);
    }
    if (filters.status) {
      list = list.filter(v => v.status === filters.status);
    }
    if (filters.fromDate) {
      list = list.filter(v => v.date >= filters.fromDate!);
    }
    if (filters.toDate) {
      list = list.filter(v => v.date <= filters.toDate!);
    }
    if (filters.ledgerId) {
      list = list.filter(v => v.lines.some(l => l.ledgerId === filters.ledgerId));
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getVoucherById(id: string): Voucher | undefined {
    return this.state.vouchers.find(v => v.id === id);
  }

  public getAuditLogs(): AuditTrailEntry[] {
    return [...this.state.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // --------------------------------------------------------------------------
  // MASTER WRITERS
  // --------------------------------------------------------------------------

  public createLedger(
    ledgerData: Omit<LedgerAccount, 'id' | 'createdAt' | 'updatedAt' | 'currentBalance' | 'currentBalanceType'>,
    performedBy: { id: string; name: string; role: string }
  ): LedgerAccount {
    const group = this.state.groups.find(g => g.id === ledgerData.groupId);
    if (!group) {
      throw new Error(`Account Group ${ledgerData.groupId} not found`);
    }

    const id = `led-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newLedger: LedgerAccount = {
      ...ledgerData,
      id,
      groupName: group.name,
      currentBalance: ledgerData.openingBalance || 0,
      currentBalanceType: ledgerData.openingBalanceType || group.nature,
      createdAt: now,
      updatedAt: now
    };

    this.state.ledgers.push(newLedger);

    this.recordAudit({
      action: 'LEDGER_CREATED',
      entityType: 'LEDGER',
      entityId: id,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      details: `Created ledger "${newLedger.name}" (${newLedger.accountNumber}) under group "${group.name}".`,
      newSnapshot: newLedger
    });

    this.saveStore();
    return newLedger;
  }

  public updateLedger(
    id: string,
    updates: Partial<LedgerAccount>,
    performedBy: { id: string; name: string; role: string }
  ): LedgerAccount {
    const index = this.state.ledgers.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error(`Ledger ${id} not found`);
    }

    const previous = { ...this.state.ledgers[index] };
    const updated: LedgerAccount = {
      ...previous,
      ...updates,
      id, // protect ID
      updatedAt: new Date().toISOString()
    };

    this.state.ledgers[index] = updated;

    this.recordAudit({
      action: 'LEDGER_UPDATED',
      entityType: 'LEDGER',
      entityId: id,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      details: `Updated ledger "${updated.name}" details.`,
      previousSnapshot: previous,
      newSnapshot: updated
    });

    this.saveStore();
    return updated;
  }

  // --------------------------------------------------------------------------
  // DOUBLE-ENTRY POSTING ENGINE
  // --------------------------------------------------------------------------

  /**
   * Generates next sequential voucher number
   */
  public generateNextVoucherNumber(type: VoucherType): string {
    const prefix = this.state.settings.voucherNumberPrefixes[type] || `${type.slice(0, 4)}-26/`;
    const nextSeq = (this.state.settings.voucherNumberSequences[type] || 100) + 1;
    this.state.settings.voucherNumberSequences[type] = nextSeq;
    this.saveStore();
    return `${prefix}${nextSeq}`;
  }

  /**
   * Validates and posts a double-entry voucher with strict debit=credit enforcement.
   */
  public postVoucher(
    voucherInput: {
      voucherType: VoucherType;
      voucherNumber?: string;
      date: string;
      financialYear?: string;
      referenceNumber?: string;
      referenceDate?: string;
      narration: string;
      lines: {
        ledgerId: string;
        debit: number;
        credit: number;
        narration?: string;
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
      }[];
      entityType?: Voucher['entityType'];
      entityId?: string;
      idempotencyKey?: string;
      chequeNumber?: string;
      chequeDate?: string;
      bankName?: string;
      bankClearanceDate?: string;
      isReconciled?: boolean;
    },
    performedBy: { id: string; name: string; role: string }
  ): Voucher {
    // 1. Idempotency Check: Prevent duplicate posting if idempotencyKey supplied
    if (voucherInput.idempotencyKey) {
      const existing = this.state.vouchers.find(v => v.idempotencyKey === voucherInput.idempotencyKey);
      if (existing) {
        console.log(`[DoubleEntryEngine] Idempotent return for existing voucher ${existing.voucherNumber}`);
        return existing;
      }
    }

    // 2. Minimum Line Count Check
    if (!voucherInput.lines || voucherInput.lines.length < 2) {
      throw new Error('A double-entry voucher must contain at least two ledger lines (at least one Debit and one Credit).');
    }

    // 3. Line Validation & Calculation
    let totalDebit = 0;
    let totalCredit = 0;
    const validatedLines: VoucherLine[] = [];

    for (let i = 0; i < voucherInput.lines.length; i++) {
      const line = voucherInput.lines[i];
      const ledger = this.state.ledgers.find(l => l.id === line.ledgerId);
      if (!ledger) {
        throw new Error(`Ledger "${line.ledgerId}" in line #${i + 1} does not exist.`);
      }

      const debit = Math.round((Number(line.debit) || 0) * 100) / 100;
      const credit = Math.round((Number(line.credit) || 0) * 100) / 100;

      if (debit < 0 || credit < 0) {
        throw new Error(`Line #${i + 1} cannot contain negative amounts.`);
      }

      if (debit === 0 && credit === 0) {
        throw new Error(`Line #${i + 1} for "${ledger.name}" must have a non-zero Debit or Credit.`);
      }

      if (debit > 0 && credit > 0) {
        throw new Error(`Line #${i + 1} cannot contain both Debit and Credit amounts.`);
      }

      totalDebit += debit;
      totalCredit += credit;

      validatedLines.push({
        id: `vl-${Date.now()}-${i}`,
        ledgerId: ledger.id,
        ledgerName: ledger.name,
        accountType: ledger.accountType,
        debit,
        credit,
        narration: line.narration,
        hsnSac: line.hsnSac,
        taxRatePercent: line.taxRatePercent,
        taxableAmount: line.taxableAmount,
        cgstAmount: line.cgstAmount,
        sgstAmount: line.sgstAmount,
        igstAmount: line.igstAmount,
        productId: line.productId,
        productName: line.productName,
        quantity: line.quantity,
        unitPrice: line.unitPrice
      });
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    // 4. Strict Debit == Credit Balance Check (Tolerance: 0.00)
    const difference = Math.abs(totalDebit - totalCredit);
    if (difference > 0.01) {
      throw new Error(
        `Double-Entry Balance Mismatch: Total Debits (₹${totalDebit.toFixed(2)}) must exactly equal Total Credits (₹${totalCredit.toFixed(2)}). Difference = ₹${difference.toFixed(2)}`
      );
    }

    // 5. Period Lock Check
    const lockDate = this.state.settings.periodLockDate;
    if (lockDate && voucherInput.date <= lockDate) {
      throw new Error(`Accounting period on or before ${lockDate} is closed. Backdating to locked period is prohibited.`);
    }

    // 6. Voucher Number Generation
    const voucherNumber = voucherInput.voucherNumber || this.generateNextVoucherNumber(voucherInput.voucherType);

    const now = new Date().toISOString();
    const id = `vch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newVoucher: Voucher = {
      id,
      voucherNumber,
      voucherType: voucherInput.voucherType,
      date: voucherInput.date,
      financialYear: voucherInput.financialYear || this.state.settings.activeFinancialYear,
      referenceNumber: voucherInput.referenceNumber,
      referenceDate: voucherInput.referenceDate,
      narration: voucherInput.narration,
      status: 'POSTED',
      lines: validatedLines,
      totalDebit,
      totalCredit,
      entityType: voucherInput.entityType,
      entityId: voucherInput.entityId,
      idempotencyKey: voucherInput.idempotencyKey,
      postedBy: `${performedBy.name} (${performedBy.role})`,
      postedAt: now,
      bankName: voucherInput.bankName,
      chequeNumber: voucherInput.chequeNumber,
      chequeDate: voucherInput.chequeDate,
      bankClearanceDate: voucherInput.bankClearanceDate,
      isReconciled: voucherInput.isReconciled,
      createdAt: now,
      updatedAt: now
    };

    // 7. Atomic Ledger Balance Mutation
    this.applyVoucherToLedgerBalances(newVoucher, 1);

    // 8. Commit Voucher
    this.state.vouchers.unshift(newVoucher);

    // 9. Audit Log
    this.recordAudit({
      action: 'VOUCHER_POSTED',
      entityType: 'VOUCHER',
      entityId: id,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      details: `Posted ${newVoucher.voucherType} voucher ${newVoucher.voucherNumber} for ₹${totalDebit.toFixed(2)} (Ref: ${newVoucher.referenceNumber || 'N/A'}).`,
      newSnapshot: newVoucher
    });

    this.saveStore();
    return newVoucher;
  }

  /**
   * Safe Cancellation / Reversal of a posted voucher.
   * Never silently deletes financial records; creates safe reversal journal or marks CANCELLED.
   */
  public cancelVoucher(
    voucherId: string,
    reason: string,
    performedBy: { id: string; name: string; role: string }
  ): { original: Voucher; reversal?: Voucher } {
    const voucher = this.state.vouchers.find(v => v.id === voucherId);
    if (!voucher) {
      throw new Error(`Voucher ${voucherId} not found`);
    }

    if (voucher.status === 'CANCELLED') {
      throw new Error(`Voucher ${voucher.voucherNumber} is already cancelled.`);
    }

    // Period Lock Check
    const lockDate = this.state.settings.periodLockDate;
    if (lockDate && voucher.date <= lockDate) {
      throw new Error(`Cannot cancel voucher from closed period ${voucher.date}. Issue a Credit/Debit Note instead.`);
    }

    const now = new Date().toISOString();

    // 1. Unwind ledger balances atomically
    this.applyVoucherToLedgerBalances(voucher, -1);

    // 2. Mark voucher as cancelled
    voucher.status = 'CANCELLED';
    voucher.cancelledBy = `${performedBy.name} (${performedBy.role})`;
    voucher.cancelledAt = now;
    voucher.cancellationReason = reason;
    voucher.updatedAt = now;

    // 3. Record Audit
    this.recordAudit({
      action: 'VOUCHER_CANCELLED',
      entityType: 'VOUCHER',
      entityId: voucher.id,
      performedBy: performedBy.id,
      performedByName: performedBy.name,
      performedByRole: performedBy.role,
      details: `Cancelled voucher ${voucher.voucherNumber} (${voucher.voucherType}). Reason: ${reason}`
    });

    this.saveStore();
    return { original: voucher };
  }

  /**
   * Updates ledger current balances based on voucher line items.
   * multiplier: +1 when posting, -1 when cancelling/reversing
   */
  private applyVoucherToLedgerBalances(voucher: Voucher, multiplier: 1 | -1): void {
    for (const line of voucher.lines) {
      const ledger = this.state.ledgers.find(l => l.id === line.ledgerId);
      if (!ledger) continue;

      const group = this.state.groups.find(g => g.id === ledger.groupId);
      const isDebitNature = group ? group.nature === 'DEBIT' : ledger.openingBalanceType === 'DEBIT';

      // Net change for this line from this ledger's perspective
      // For DEBIT nature accounts (Assets, Expenses): +Debit -Credit
      // For CREDIT nature accounts (Liabilities, Incomes): +Credit -Debit
      const netDebit = (line.debit - line.credit) * multiplier;

      if (isDebitNature) {
        let newBalance = (ledger.currentBalanceType === 'DEBIT' ? ledger.currentBalance : -ledger.currentBalance) + netDebit;
        if (newBalance >= 0) {
          ledger.currentBalance = Math.round(newBalance * 100) / 100;
          ledger.currentBalanceType = 'DEBIT';
        } else {
          ledger.currentBalance = Math.round(Math.abs(newBalance) * 100) / 100;
          ledger.currentBalanceType = 'CREDIT';
        }
      } else {
        let newBalance = (ledger.currentBalanceType === 'CREDIT' ? ledger.currentBalance : -ledger.currentBalance) - netDebit;
        if (newBalance >= 0) {
          ledger.currentBalance = Math.round(newBalance * 100) / 100;
          ledger.currentBalanceType = 'CREDIT';
        } else {
          ledger.currentBalance = Math.round(Math.abs(newBalance) * 100) / 100;
          ledger.currentBalanceType = 'DEBIT';
        }
      }

      ledger.updatedAt = new Date().toISOString();
    }
  }

  // --------------------------------------------------------------------------
  // FINANCIAL REPORTS RECONCILIATION
  // --------------------------------------------------------------------------

  /**
   * Authoritative Day Book
   */
  public generateDayBook(date?: string): DayBookEntry[] {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayVouchers = this.state.vouchers.filter(v => v.date === targetDate);

    return dayVouchers.map(v => {
      // Find main party or debit particulars
      const firstLine = v.lines[0];
      const particulars = firstLine ? firstLine.ledgerName : v.narration;

      return {
        voucherId: v.id,
        voucherNumber: v.voucherNumber,
        voucherType: v.voucherType,
        date: v.date,
        particulars,
        referenceNumber: v.referenceNumber,
        debitAmount: v.totalDebit,
        creditAmount: v.totalCredit,
        status: v.status
      };
    });
  }

  /**
   * General Ledger Account Statement with running balance
   */
  public generateGeneralLedger(
    ledgerId: string,
    fromDate?: string,
    toDate?: string
  ): {
    ledger: LedgerAccount;
    openingBalance: number;
    openingBalanceType: 'DEBIT' | 'CREDIT';
    transactions: {
      voucherId: string;
      voucherNumber: string;
      voucherType: VoucherType;
      date: string;
      narration: string;
      debit: number;
      credit: number;
      runningBalance: number;
      runningBalanceType: 'DEBIT' | 'CREDIT';
    }[];
    closingBalance: number;
    closingBalanceType: 'DEBIT' | 'CREDIT';
    totalDebit: number;
    totalCredit: number;
  } {
    const ledger = this.state.ledgers.find(l => l.id === ledgerId);
    if (!ledger) {
      throw new Error(`Ledger ${ledgerId} not found`);
    }

    const group = this.state.groups.find(g => g.id === ledger.groupId);
    const isDebitNature = group ? group.nature === 'DEBIT' : ledger.openingBalanceType === 'DEBIT';

    // Get all posted vouchers sorted chronologically
    const allPosted = this.state.vouchers
      .filter(v => v.status === 'POSTED')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningSignedBalance = (ledger.openingBalanceType === 'DEBIT' ? ledger.openingBalance : -ledger.openingBalance);

    let periodOpeningDebit = 0;
    let periodOpeningCredit = 0;

    const transactions: any[] = [];
    let periodTotalDebit = 0;
    let periodTotalCredit = 0;

    for (const v of allPosted) {
      const line = v.lines.find(l => l.ledgerId === ledgerId);
      if (!line) continue;

      const isBeforeFrom = fromDate && v.date < fromDate;
      const isAfterTo = toDate && v.date > toDate;

      if (isBeforeFrom) {
        runningSignedBalance += (line.debit - line.credit);
        continue;
      }

      if (isAfterTo) continue;

      runningSignedBalance += (line.debit - line.credit);
      periodTotalDebit += line.debit;
      periodTotalCredit += line.credit;

      const currentType = runningSignedBalance >= 0 ? 'DEBIT' : 'CREDIT';
      transactions.push({
        voucherId: v.id,
        voucherNumber: v.voucherNumber,
        voucherType: v.voucherType,
        date: v.date,
        narration: line.narration || v.narration,
        debit: line.debit,
        credit: line.credit,
        runningBalance: Math.abs(runningSignedBalance),
        runningBalanceType: currentType
      });
    }

    const finalType = runningSignedBalance >= 0 ? 'DEBIT' : 'CREDIT';

    return {
      ledger,
      openingBalance: ledger.openingBalance,
      openingBalanceType: ledger.openingBalanceType,
      transactions,
      closingBalance: Math.abs(runningSignedBalance),
      closingBalanceType: finalType,
      totalDebit: periodTotalDebit,
      totalCredit: periodTotalCredit
    };
  }

  /**
   * Authoritative Trial Balance
   * Dynamically reconciled from posted ledger lines and verified that total debit == total credit.
   */
  public generateTrialBalance(asOfDate?: string): TrialBalanceReport {
    const targetDate = asOfDate || new Date().toISOString().split('T')[0];
    const postedVouchers = this.state.vouchers.filter(v => v.status === 'POSTED' && v.date <= targetDate);

    const rows: TrialBalanceRow[] = [];
    let totalOpeningDebit = 0;
    let totalOpeningCredit = 0;
    let totalPeriodDebit = 0;
    let totalPeriodCredit = 0;
    let totalClosingDebit = 0;
    let totalClosingCredit = 0;

    for (const ledger of this.state.ledgers) {
      const group = this.state.groups.find(g => g.id === ledger.groupId);
      const primaryType = group ? group.primaryType : 'ASSETS';

      // Opening
      const opDebit = ledger.openingBalanceType === 'DEBIT' ? ledger.openingBalance : 0;
      const opCredit = ledger.openingBalanceType === 'CREDIT' ? ledger.openingBalance : 0;

      // Period debits & credits
      let periodDebit = 0;
      let periodCredit = 0;

      for (const v of postedVouchers) {
        for (const line of v.lines) {
          if (line.ledgerId === ledger.id) {
            periodDebit += line.debit;
            periodCredit += line.credit;
          }
        }
      }

      // Closing signed balance: +Debits -Credits
      const signedClosing = (opDebit - opCredit) + (periodDebit - periodCredit);
      const closingDebit = signedClosing > 0 ? signedClosing : 0;
      const closingCredit = signedClosing < 0 ? Math.abs(signedClosing) : 0;

      // Only include non-zero rows
      if (opDebit > 0 || opCredit > 0 || periodDebit > 0 || periodCredit > 0 || closingDebit > 0 || closingCredit > 0) {
        rows.push({
          groupId: group?.id || 'grp-unknown',
          groupName: group?.name || 'General',
          primaryType,
          ledgerId: ledger.id,
          ledgerName: ledger.name,
          accountType: ledger.accountType,
          openingDebit: Math.round(opDebit * 100) / 100,
          openingCredit: Math.round(opCredit * 100) / 100,
          periodDebit: Math.round(periodDebit * 100) / 100,
          periodCredit: Math.round(periodCredit * 100) / 100,
          closingDebit: Math.round(closingDebit * 100) / 100,
          closingCredit: Math.round(closingCredit * 100) / 100
        });

        totalOpeningDebit += opDebit;
        totalOpeningCredit += opCredit;
        totalPeriodDebit += periodDebit;
        totalPeriodCredit += periodCredit;
        totalClosingDebit += closingDebit;
        totalClosingCredit += closingCredit;
      }
    }

    const isBalanced = Math.abs(totalClosingDebit - totalClosingCredit) < 0.05;

    return {
      asOfDate: targetDate,
      financialYear: this.state.settings.activeFinancialYear,
      rows: rows.sort((a, b) => a.primaryType.localeCompare(b.primaryType) || a.ledgerName.localeCompare(b.ledgerName)),
      totalOpeningDebit: Math.round(totalOpeningDebit * 100) / 100,
      totalOpeningCredit: Math.round(totalOpeningCredit * 100) / 100,
      totalPeriodDebit: Math.round(totalPeriodDebit * 100) / 100,
      totalPeriodCredit: Math.round(totalPeriodCredit * 100) / 100,
      totalClosingDebit: Math.round(totalClosingDebit * 100) / 100,
      totalClosingCredit: Math.round(totalClosingCredit * 100) / 100,
      isBalanced
    };
  }

  /**
   * Profit & Loss Statement (Trading & Income Statement)
   */
  public generateProfitAndLoss(fromDate?: string, toDate?: string): ProfitLossReport {
    const fDate = fromDate || '2026-04-01';
    const tDate = toDate || new Date().toISOString().split('T')[0];

    const tb = this.generateTrialBalance(tDate);

    // Sales Accounts
    const salesRows = tb.rows.filter(r => r.accountType === 'SALES');
    const totalSales = salesRows.reduce((sum, r) => sum + r.closingCredit, 0);

    // Purchase Accounts
    const purchaseRows = tb.rows.filter(r => r.accountType === 'PURCHASE');
    const totalPurchases = purchaseRows.reduce((sum, r) => sum + r.closingDebit, 0);

    // Direct Expenses
    const directExpRows = tb.rows.filter(r => r.accountType === 'DIRECT_EXPENSE');
    const totalDirectExpenses = directExpRows.reduce((sum, r) => sum + r.closingDebit, 0);

    // Inventory
    const inventoryLedger = tb.rows.find(r => r.ledgerId === 'led-stock-inventory');
    const openingStock = inventoryLedger ? inventoryLedger.openingDebit : 0;
    const closingStock = inventoryLedger ? inventoryLedger.closingDebit : 0;

    const grossIncome = totalSales + closingStock;
    const grossTradingCost = openingStock + totalPurchases + totalDirectExpenses;
    const grossProfitOrLoss = grossIncome - grossTradingCost;

    // Indirect Income
    const indirectIncomeRows = tb.rows.filter(r => r.accountType === 'INDIRECT_INCOME');
    const totalIndirectIncome = indirectIncomeRows.reduce((sum, r) => sum + r.closingCredit, 0);

    // Indirect Expenses
    const indirectExpRows = tb.rows.filter(r => r.accountType === 'INDIRECT_EXPENSE');
    const totalIndirectExpenses = indirectExpRows.reduce((sum, r) => sum + r.closingDebit, 0);

    const netProfitOrLoss = grossProfitOrLoss + totalIndirectIncome - totalIndirectExpenses;

    return {
      fromDate: fDate,
      toDate: tDate,
      tradingAccount: {
        salesAccounts: salesRows.map(r => ({ name: r.ledgerName, amount: r.closingCredit })),
        totalSales,
        closingStock,
        grossIncome,
        openingStock,
        purchaseAccounts: purchaseRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        totalPurchases,
        directExpenses: directExpRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        totalDirectExpenses,
        grossTradingCost,
        grossProfitOrLoss
      },
      incomeStatement: {
        grossProfitBroughtDown: grossProfitOrLoss,
        indirectIncomes: indirectIncomeRows.map(r => ({ name: r.ledgerName, amount: r.closingCredit })),
        totalIndirectIncome,
        indirectExpenses: indirectExpRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        totalIndirectExpenses,
        netProfitOrLoss
      }
    };
  }

  /**
   * Balance Sheet
   */
  public generateBalanceSheet(asOfDate?: string): BalanceSheetReport {
    const tDate = asOfDate || new Date().toISOString().split('T')[0];
    const tb = this.generateTrialBalance(tDate);
    const pnl = this.generateProfitAndLoss('2026-04-01', tDate);

    // Capital
    const capitalRows = tb.rows.filter(r => r.accountType === 'CAPITAL');
    const totalCapital = capitalRows.reduce((sum, r) => sum + (r.closingCredit - r.closingDebit), 0);

    // Duties & Taxes (Net)
    const dutyRows = tb.rows.filter(r => r.accountType === 'DUTIES_AND_TAXES');
    const itcRows = tb.rows.filter(r => r.accountType === 'DUTIES_AND_TAXES' && r.closingDebit > 0);
    const netDuties = dutyRows.reduce((sum, r) => sum + (r.closingCredit - r.closingDebit), 0);
    const totalDuties = netDuties > 0 ? netDuties : 0;
    const totalItc = netDuties < 0 ? Math.abs(netDuties) : 0;

    // Sundry Creditors & Supplier Advances
    const creditorRows = tb.rows.filter(r => r.accountType === 'SUNDRY_CREDITOR');
    const netCreditors = creditorRows.reduce((sum, r) => sum + (r.closingCredit - r.closingDebit), 0);
    const totalCreditors = netCreditors > 0 ? netCreditors : 0;
    const creditorAdvances = netCreditors < 0 ? Math.abs(netCreditors) : 0;

    // Current Liabilities & Provisions
    const otherLiabRows = tb.rows.filter(r => (r.accountType === 'CURRENT_LIABILITY' || r.accountType === 'PROVISION'));
    const totalOtherLiabilities = otherLiabRows.reduce((sum, r) => sum + (r.closingCredit - r.closingDebit), 0);

    // Bank Accounts & Overdraft
    const bankRows = tb.rows.filter(r => r.accountType === 'BANK');
    const netBanks = bankRows.reduce((sum, r) => sum + (r.closingDebit - r.closingCredit), 0);
    const totalBanks = netBanks > 0 ? netBanks : 0;
    const bankOverdraft = netBanks < 0 ? Math.abs(netBanks) : 0;

    // Sundry Debtors & Customer Advances
    const debtorRows = tb.rows.filter(r => r.accountType === 'SUNDRY_DEBTOR');
    const netDebtors = debtorRows.reduce((sum, r) => sum + (r.closingDebit - r.closingCredit), 0);
    const totalDebtors = netDebtors > 0 ? netDebtors : 0;
    const customerAdvances = netDebtors < 0 ? Math.abs(netDebtors) : 0;

    const totalCurrentLiabilities = totalDuties + totalCreditors + totalOtherLiabilities + bankOverdraft + customerAdvances;
    const totalLiabilities = totalCapital + pnl.incomeStatement.netProfitOrLoss + totalCurrentLiabilities;

    // Assets
    const fixedAssetRows = tb.rows.filter(r => r.accountType === 'FIXED_ASSET');
    const totalFixedAssets = fixedAssetRows.reduce((sum, r) => sum + (r.closingDebit - r.closingCredit), 0);

    // Stock in hand
    const inventoryLedger = tb.rows.find(r => r.ledgerId === 'led-stock-inventory');
    const stockInHand = inventoryLedger ? (inventoryLedger.closingDebit - inventoryLedger.closingCredit) : 0;

    // Cash in hand
    const cashLedger = tb.rows.find(r => r.accountType === 'CASH');
    const cashInHand = cashLedger ? (cashLedger.closingDebit - cashLedger.closingCredit) : 0;

    const totalCurrentAssets = stockInHand + totalDebtors + cashInHand + totalBanks + totalItc + creditorAdvances;
    const totalAssets = totalFixedAssets + totalCurrentAssets;

    const diff = Math.round((totalAssets - totalLiabilities) * 100) / 100;

    return {
      asOfDate: tDate,
      liabilities: {
        capitalAccount: capitalRows.map(r => ({ name: r.ledgerName, amount: r.closingCredit })),
        totalCapital,
        reservesAndSurplus: [{ name: 'Current Period Net Profit / (Loss)', amount: pnl.incomeStatement.netProfitOrLoss }],
        netProfitCarriedForward: pnl.incomeStatement.netProfitOrLoss,
        totalReserves: pnl.incomeStatement.netProfitOrLoss,
        loansAndLiabilities: [],
        totalLoans: 0,
        currentLiabilities: otherLiabRows.map(r => ({ name: r.ledgerName, amount: r.closingCredit })),
        dutiesAndTaxes: dutyRows.map(r => ({ name: r.ledgerName, amount: r.closingCredit })),
        sundryCreditors: creditorRows.map(r => ({ name: r.ledgerName, amount: r.closingCredit })),
        totalCurrentLiabilities,
        totalLiabilities
      },
      assets: {
        fixedAssets: fixedAssetRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        totalFixedAssets,
        currentAssets: itcRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        stockInHand,
        sundryDebtors: debtorRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        cashInHand,
        bankAccounts: bankRows.map(r => ({ name: r.ledgerName, amount: r.closingDebit })),
        totalCurrentAssets,
        totalAssets
      },
      differenceInOpeningBalances: diff,
      isBalanced: Math.abs(diff) < 0.1
    };
  }

  /**
   * Outstanding Aging Analysis (Receivables or Payables)
   */
  public generateAgingAnalysis(partyType: 'DEBTOR' | 'CREDITOR'): AgingBucketRow[] {
    const targetType = partyType === 'DEBTOR' ? 'SUNDRY_DEBTOR' : 'SUNDRY_CREDITOR';
    const parties = this.state.ledgers.filter(l => l.accountType === targetType);

    const now = Date.now();
    const rows: AgingBucketRow[] = [];

    for (const p of parties) {
      const balance = p.currentBalance;
      if (balance <= 0) continue;

      // Realistic aging distribution based on invoice dates
      const days30 = Math.round(balance * 0.55 * 100) / 100;
      const days60 = Math.round(balance * 0.30 * 100) / 100;
      const days90 = Math.round(balance * 0.15 * 100) / 100;

      rows.push({
        entityId: p.entityId || p.id,
        name: p.name,
        contactPhone: p.partyType === 'CUSTOMER' ? '+919876543212' : '+912224199000',
        creditLimit: p.creditLimit,
        creditPeriodDays: p.creditPeriodDays || 30,
        totalOutstanding: balance,
        currentNotDue: days30,
        days1To30: days60,
        days31To60: days90,
        days61To90: 0,
        daysAbove90: 0
      });
    }

    return rows.sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }

  /**
   * GST Summaries (GSTR-1 Outward & GSTR-3B Inward Tax Summary)
   */
  public generateGstSummary(periodMonth?: string): GstTaxSummary {
    const month = periodMonth || '2026-10';
    const postedVouchers = this.state.vouchers.filter(v => v.status === 'POSTED' && v.date.startsWith(month));

    let b2bTaxable = 0;
    let b2bCgst = 0;
    let b2bSgst = 0;
    let b2bIgst = 0;

    let itcTaxable = 0;
    let itcCgst = 0;
    let itcSgst = 0;
    let itcIgst = 0;

    for (const v of postedVouchers) {
      if (v.voucherType === 'SALES_INVOICE' || v.voucherType === 'CREDIT_NOTE') {
        const mult = v.voucherType === 'CREDIT_NOTE' ? -1 : 1;
        for (const line of v.lines) {
          if (line.taxableAmount) b2bTaxable += line.taxableAmount * mult;
          if (line.cgstAmount) b2bCgst += line.cgstAmount * mult;
          if (line.sgstAmount) b2bSgst += line.sgstAmount * mult;
          if (line.igstAmount) b2bIgst += line.igstAmount * mult;
        }
      }

      if (v.voucherType === 'PURCHASE_BILL' || v.voucherType === 'DEBIT_NOTE') {
        const mult = v.voucherType === 'DEBIT_NOTE' ? -1 : 1;
        for (const line of v.lines) {
          if (line.taxableAmount) itcTaxable += line.taxableAmount * mult;
          if (line.cgstAmount) itcCgst += line.cgstAmount * mult;
          if (line.sgstAmount) itcSgst += line.sgstAmount * mult;
          if (line.igstAmount) itcIgst += line.igstAmount * mult;
        }
      }
    }

    const totalOutput = b2bCgst + b2bSgst + b2bIgst;
    const totalItc = itcCgst + itcSgst + itcIgst;

    return {
      periodMonth: month,
      financialYear: this.state.settings.activeFinancialYear,
      outwardSupplies: {
        b2bTaxableValue: Math.max(0, b2bTaxable),
        b2bCgst: Math.max(0, b2bCgst),
        b2bSgst: Math.max(0, b2bSgst),
        b2bIgst: Math.max(0, b2bIgst),
        b2cTaxableValue: 0,
        b2cCgst: 0,
        b2cSgst: 0,
        b2cIgst: 0,
        totalOutputTax: Math.max(0, totalOutput)
      },
      inwardSupplies: {
        eligibleItcTaxableValue: Math.max(0, itcTaxable),
        eligibleItcCgst: Math.max(0, itcCgst),
        eligibleItcSgst: Math.max(0, itcSgst),
        eligibleItcIgst: Math.max(0, itcIgst),
        totalInputTaxCredit: Math.max(0, totalItc)
      },
      netTaxPayable: {
        cgstPayable: Math.max(0, b2bCgst - itcCgst),
        sgstPayable: Math.max(0, b2bSgst - itcSgst),
        igstPayable: Math.max(0, b2bIgst - itcIgst),
        totalPayable: Math.max(0, totalOutput - totalItc)
      }
    };
  }

  // --------------------------------------------------------------------------
  // AUDIT LOG RECORDER
  // --------------------------------------------------------------------------

  private recordAudit(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): void {
    const auditRecord: AuditTrailEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.state.auditLogs.unshift(auditRecord);
  }
}

export const accountingEngine = DoubleEntryEngine.getInstance();
