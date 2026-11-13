import fs from 'fs';
import path from 'path';
import {
  TallyCompany,
  TallyAccountGroup,
  TallyLedger,
  TallyVoucherType,
  TallyUnit,
  TallyGodown,
  TallyStockGroup,
  TallyStockCategory,
  TallyStockItem,
  TallyStoreSchema,
  TallyAuditRecord
} from './tallyTypes';

const TALLY_STORE_PATH = path.join(process.cwd(), 'data', 'tally_store.json');

// Standard 28 Tally Groups
export const STANDARD_TALLY_GROUPS = [
  // Primary Liabilities
  { name: 'Capital Account', nature: 'Liability', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Reserves & Surplus', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Capital Account' },
  { name: 'Loans (Liability)', nature: 'Liability', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Bank OD A/c', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Loans (Liability)' },
  { name: 'Secured Loans', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Loans (Liability)' },
  { name: 'Unsecured Loans', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Loans (Liability)' },
  { name: 'Current Liabilities', nature: 'Liability', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Duties & Taxes', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Current Liabilities' },
  { name: 'Provisions', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Current Liabilities' },
  { name: 'Sundry Creditors', nature: 'Liability', affectsGrossProfit: false, parentGroupName: 'Current Liabilities' },

  // Primary Assets
  { name: 'Fixed Assets', nature: 'Asset', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Investments', nature: 'Asset', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Current Assets', nature: 'Asset', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Stock-in-Hand', nature: 'Asset', affectsGrossProfit: false, parentGroupName: 'Current Assets' },
  { name: 'Deposits (Asset)', nature: 'Asset', affectsGrossProfit: false, parentGroupName: 'Current Assets' },
  { name: 'Loans & Advances (Asset)', nature: 'Asset', affectsGrossProfit: false, parentGroupName: 'Current Assets' },
  { name: 'Sundry Debtors', nature: 'Asset', affectsGrossProfit: false, parentGroupName: 'Current Assets' },
  { name: 'Cash-in-Hand', nature: 'Asset', affectsGrossProfit: false, parentGroupName: 'Current Assets' },
  { name: 'Bank Accounts', nature: 'Asset', affectsGrossProfit: false, parentGroupName: 'Current Assets' },

  // Primary Incomes
  { name: 'Direct Incomes', nature: 'Income', affectsGrossProfit: true, parentGroupName: null },
  { name: 'Sales Accounts', nature: 'Income', affectsGrossProfit: true, parentGroupName: null },
  { name: 'Indirect Incomes', nature: 'Income', affectsGrossProfit: false, parentGroupName: null },

  // Primary Expenses
  { name: 'Direct Expenses', nature: 'Expense', affectsGrossProfit: true, parentGroupName: null },
  { name: 'Purchase Accounts', nature: 'Expense', affectsGrossProfit: true, parentGroupName: null },
  { name: 'Indirect Expenses', nature: 'Expense', affectsGrossProfit: false, parentGroupName: null },

  // Special Groups
  { name: 'Branch / Divisions', nature: 'Liability', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Suspense A/c', nature: 'Liability', affectsGrossProfit: false, parentGroupName: null },
  { name: 'Misc. Expenses (ASSET)', nature: 'Asset', affectsGrossProfit: false, parentGroupName: null },
] as const;

// Default Voucher Types
export const DEFAULT_VOUCHER_TYPES = [
  { name: 'Contra', baseType: 'Contra', prefix: 'CNTR-', suffix: '', startingNumber: 1 },
  { name: 'Payment', baseType: 'Payment', prefix: 'PYMT-', suffix: '', startingNumber: 1 },
  { name: 'Receipt', baseType: 'Receipt', prefix: 'RCPT-', suffix: '', startingNumber: 1 },
  { name: 'Journal', baseType: 'Journal', prefix: 'JRNL-', suffix: '', startingNumber: 1 },
  { name: 'Sales', baseType: 'Sales', prefix: 'SINV-', suffix: '', startingNumber: 1 },
  { name: 'Purchase', baseType: 'Purchase', prefix: 'PURC-', suffix: '', startingNumber: 1 },
  { name: 'Credit Note', baseType: 'Credit Note', prefix: 'CRNT-', suffix: '', startingNumber: 1 },
  { name: 'Debit Note', baseType: 'Debit Note', prefix: 'DBNT-', suffix: '', startingNumber: 1 },
  { name: 'Delivery Note', baseType: 'Delivery Note', prefix: 'DLNT-', suffix: '', startingNumber: 1 },
  { name: 'Receipt Note', baseType: 'Receipt Note', prefix: 'RCNT-', suffix: '', startingNumber: 1 },
] as const;

export class TallyEngine {
  private static instance: TallyEngine;
  private store: TallyStoreSchema;

  private constructor() {
    this.store = this.loadStore();
  }

  public static getInstance(): TallyEngine {
    if (!TallyEngine.instance) {
      TallyEngine.instance = new TallyEngine();
    }
    return TallyEngine.instance;
  }

  private loadStore(): TallyStoreSchema {
    try {
      if (fs.existsSync(TALLY_STORE_PATH)) {
        const raw = fs.readFileSync(TALLY_STORE_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[TallyEngine] Warning loading store, initializing fresh store:', err);
    }
    return this.initializeFreshStore();
  }

  private saveStore(): void {
    try {
      const dir = path.dirname(TALLY_STORE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(TALLY_STORE_PATH, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (err) {
      console.error('[TallyEngine] Failed to save tally store:', err);
    }
  }

  private initializeFreshStore(): TallyStoreSchema {
    const defaultCompanyId = 'cmp-tally-001';
    const now = new Date().toISOString();

    const defaultCompany: TallyCompany = {
      id: defaultCompanyId,
      name: 'A2Z Diagnostic Services Pvt Ltd',
      mailingName: 'A2Z Diagnostic Services Pvt Ltd',
      address: 'Plot 42, Midc Industrial Area, Andheri East',
      state: 'Maharashtra',
      stateCode: '27',
      country: 'India',
      pincode: '400093',
      telephone: '022-28394000',
      mobile: '+91 98200 12345',
      email: 'accounts@a2zdiagnostics.com',
      currencySymbol: '₹',
      formalName: 'INR',
      financialYearStart: '2026-04-01',
      booksBeginningDate: '2026-04-01',
      gstin: '27AABCU9603R1ZM',
      pan: 'AABCU9603R',
      cin: 'U74999MH2021PTC368920',
      features: {
        enableInventory: true,
        enableGst: true,
        enableBillByBill: true,
        enableCostCentres: false,
        highContrastMode: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    const initialStore: TallyStoreSchema = {
      version: '1.0.0',
      companies: [defaultCompany],
      selectedCompanyId: defaultCompanyId,
      groups: [],
      ledgers: [],
      voucherTypes: [],
      units: [],
      godowns: [],
      stockGroups: [],
      stockCategories: [],
      stockItems: [],
      vouchers: [],
      auditLogs: [],
    };

    this.store = initialStore;
    this.seedCompanyDefaults(defaultCompanyId, 'System Seed');
    this.seedDemoMasters(defaultCompanyId);
    this.saveStore();
    return this.store;
  }

  // Seed default groups, voucher types, and ledgers for a new company
  public seedCompanyDefaults(companyId: string, actor: string = 'System'): void {
    const now = new Date().toISOString();

    // 1. Seed 28 Standard Groups
    const createdGroups: TallyAccountGroup[] = STANDARD_TALLY_GROUPS.map((g, idx) => ({
      id: `grp-${companyId}-${idx + 1}`,
      companyId,
      name: g.name,
      parentGroupName: g.parentGroupName,
      nature: g.nature as any,
      affectsGrossProfit: g.affectsGrossProfit,
      isDefault: true,
    }));
    this.store.groups.push(...createdGroups);

    // 2. Seed Default Voucher Types
    const createdVTypes: TallyVoucherType[] = DEFAULT_VOUCHER_TYPES.map((vt, idx) => ({
      id: `vt-${companyId}-${idx + 1}`,
      companyId,
      name: vt.name,
      baseType: vt.baseType as any,
      prefix: vt.prefix,
      suffix: vt.suffix,
      numberingMethod: 'Automatic',
      startingNumber: vt.startingNumber,
      currentNumber: vt.startingNumber,
      restartPeriod: 'Yearly',
      isDefault: true,
    }));
    this.store.voucherTypes.push(...createdVTypes);

    // 3. Seed Default System Ledgers: "Cash" (under Cash-in-Hand) and "Profit & Loss A/c"
    const cashInHandGroup = createdGroups.find((g) => g.name === 'Cash-in-Hand') || createdGroups[0];
    const defaultLedgers: TallyLedger[] = [
      {
        id: `led-${companyId}-cash`,
        companyId,
        name: 'Cash',
        alias: 'Cash A/c',
        groupId: cashInHandGroup.id,
        groupName: cashInHandGroup.name,
        openingBalancePaise: 0,
        openingBalanceType: 'Dr',
        billByBillEnabled: false,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `led-${companyId}-pnl`,
        companyId,
        name: 'Profit & Loss A/c',
        alias: 'P&L A/c',
        groupId: `primary-pnl`,
        groupName: 'Primary',
        openingBalancePaise: 0,
        openingBalanceType: 'Cr',
        billByBillEnabled: false,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
    this.store.ledgers.push(...defaultLedgers);

    // 4. Default Units
    const defaultUnits: TallyUnit[] = [
      { id: `unt-${companyId}-1`, companyId, type: 'Simple', symbol: 'NOS', formalName: 'Numbers', uqc: 'NOS-NUMBERS', decimalPlaces: 0 },
      { id: `unt-${companyId}-2`, companyId, type: 'Simple', symbol: 'BOX', formalName: 'Boxes', uqc: 'BOX-BOXES', decimalPlaces: 0 },
      { id: `unt-${companyId}-3`, companyId, type: 'Simple', symbol: 'KIT', formalName: 'Kits', uqc: 'KIT-KITS', decimalPlaces: 0 },
      { id: `unt-${companyId}-4`, companyId, type: 'Simple', symbol: 'PCS', formalName: 'Pieces', uqc: 'PCS-PIECES', decimalPlaces: 0 },
    ];
    this.store.units.push(...defaultUnits);

    // 5. Default Godown
    const defaultGodown: TallyGodown = {
      id: `gdn-${companyId}-1`,
      companyId,
      name: 'Main Location',
      address: 'Central Warehouse Midc, Mumbai',
      isColdChain: false,
    };
    this.store.godowns.push(defaultGodown);

    this.recordAudit(companyId, 'COMPANY_INITIALIZED', 'Company', companyId, actor, {
      groupsCount: createdGroups.length,
      vouchersTypesCount: createdVTypes.length,
      ledgersCount: defaultLedgers.length,
    });
  }

  // Seed demo master ledgers and stock items for realistic accounting
  private seedDemoMasters(companyId: string): void {
    const now = new Date().toISOString();
    const findGroup = (name: string) => this.store.groups.find((g) => g.companyId === companyId && g.name === name);

    const bankGroup = findGroup('Bank Accounts');
    const debtorsGroup = findGroup('Sundry Debtors');
    const creditorsGroup = findGroup('Sundry Creditors');
    const salesGroup = findGroup('Sales Accounts');
    const purchaseGroup = findGroup('Purchase Accounts');
    const taxesGroup = findGroup('Duties & Taxes');
    const indirectExpGroup = findGroup('Indirect Expenses');

    if (bankGroup && debtorsGroup && creditorsGroup && salesGroup && purchaseGroup && taxesGroup) {
      const demoLedgers: TallyLedger[] = [
        {
          id: `led-${companyId}-hdfc`,
          companyId,
          name: 'HDFC Current A/c - 5020001',
          alias: 'HDFC Bank',
          groupId: bankGroup.id,
          groupName: bankGroup.name,
          openingBalancePaise: 45000000, // ₹4,50,000.00
          openingBalanceType: 'Dr',
          billByBillEnabled: false,
          bankDetails: {
            accountNo: '50200019283746',
            ifsc: 'HDFC0000123',
            bankName: 'HDFC Bank Ltd',
            branch: 'Andheri East, Mumbai',
          },
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-metro-lab`,
          companyId,
          name: 'Metropolis Diagnostics Lab',
          alias: 'Metro Lab',
          groupId: debtorsGroup.id,
          groupName: debtorsGroup.name,
          openingBalancePaise: 18500000, // ₹1,85,000.00 Dr
          openingBalanceType: 'Dr',
          billByBillEnabled: true,
          gstin: '27AABCM8821Q1Z4',
          state: 'Maharashtra',
          stateCode: '27',
          address: 'Kohinoor Square, Dadar West, Mumbai',
          contactPerson: 'Dr. Sameer Joshi',
          phone: '+91 98210 99887',
          email: 'accounts@metropolis.in',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-roche`,
          companyId,
          name: 'Roche Diagnostics India Pvt Ltd',
          alias: 'Roche Vendor',
          groupId: creditorsGroup.id,
          groupName: creditorsGroup.name,
          openingBalancePaise: 32000000, // ₹3,20,000.00 Cr
          openingBalanceType: 'Cr',
          billByBillEnabled: true,
          gstin: '27AABCR4412K1Z9',
          state: 'Maharashtra',
          stateCode: '27',
          address: 'B-Wing, Hiranandani Business Park, Powai, Mumbai',
          contactPerson: 'Mr. Rajesh Verma',
          phone: '+91 22 6789 0000',
          email: 'india.orders@roche.com',
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-sales`,
          companyId,
          name: 'Diagnostic Reagents Sales',
          alias: 'Sales A/c',
          groupId: salesGroup.id,
          groupName: salesGroup.name,
          openingBalancePaise: 0,
          openingBalanceType: 'Cr',
          billByBillEnabled: false,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-purchase`,
          companyId,
          name: 'Reagents & Consumables Purchase',
          alias: 'Purchase A/c',
          groupId: purchaseGroup.id,
          groupName: purchaseGroup.name,
          openingBalancePaise: 0,
          openingBalanceType: 'Dr',
          billByBillEnabled: false,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-cgst`,
          companyId,
          name: 'CGST Input / Output',
          alias: 'CGST 6%',
          groupId: taxesGroup.id,
          groupName: taxesGroup.name,
          openingBalancePaise: 0,
          openingBalanceType: 'Dr',
          billByBillEnabled: false,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-sgst`,
          companyId,
          name: 'SGST Input / Output',
          alias: 'SGST 6%',
          groupId: taxesGroup.id,
          groupName: taxesGroup.name,
          openingBalancePaise: 0,
          openingBalanceType: 'Dr',
          billByBillEnabled: false,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `led-${companyId}-igst`,
          companyId,
          name: 'IGST Output / Input',
          alias: 'IGST 12%',
          groupId: taxesGroup.id,
          groupName: taxesGroup.name,
          openingBalancePaise: 0,
          openingBalanceType: 'Dr',
          billByBillEnabled: false,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        },
      ];

      if (indirectExpGroup) {
        demoLedgers.push({
          id: `led-${companyId}-rent`,
          companyId,
          name: 'Office & Cold Room Rent',
          alias: 'Rent Exp',
          groupId: indirectExpGroup.id,
          groupName: indirectExpGroup.name,
          openingBalancePaise: 0,
          openingBalanceType: 'Dr',
          billByBillEnabled: false,
          isDefault: false,
          createdAt: now,
          updatedAt: now,
        });
      }

      this.store.ledgers.push(...demoLedgers);
    }

    // Demo Stock Groups & Items
    const stockGroup: TallyStockGroup = {
      id: `sg-${companyId}-1`,
      companyId,
      name: 'Biochemistry Diagnostic Reagents',
      hsnSac: '38220090',
      gstRate: 12,
    };
    this.store.stockGroups.push(stockGroup);

    const kitUnit = this.store.units.find((u) => u.companyId === companyId && u.symbol === 'KIT') || this.store.units[0];
    const godown = this.store.godowns.find((g) => g.companyId === companyId) || this.store.godowns[0];

    const stockItem: TallyStockItem = {
      id: `itm-${companyId}-1`,
      companyId,
      name: 'Accu-Chek Inform II Glucose Strips 500T',
      partNumber: 'RCH-GLUC-500T',
      stockGroupId: stockGroup.id,
      stockGroupName: stockGroup.name,
      unitId: kitUnit.id,
      unitSymbol: kitUnit.symbol,
      hsnSac: '38220090',
      gstRate: 12,
      valuationMethod: 'FIFO',
      openingQty: 100,
      openingRatePaise: 390000, // ₹3,900.00
      openingValuePaise: 39000000, // ₹3,90,000.00
      standardCostPaise: 390000,
      standardSellingPricePaise: 485000, // ₹4,850.00
      reorderLevel: 20,
      godownId: godown.id,
      createdAt: now,
      updatedAt: now,
    };
    this.store.stockItems.push(stockItem);
  }

  // --- Audit Logger ---
  public recordAudit(companyId: string, action: string, entityType: string, entityId: string, actor: string, details: Record<string, any>): void {
    const record: TallyAuditRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      companyId,
      action,
      entityType,
      entityId,
      actor,
      timestamp: new Date().toISOString(),
      details,
    };
    this.store.auditLogs.unshift(record);
    if (this.store.auditLogs.length > 500) {
      this.store.auditLogs = this.store.auditLogs.slice(0, 500);
    }
  }

  // ==========================================
  // COMPANY OPERATIONS
  // ==========================================
  public listCompanies(): TallyCompany[] {
    return this.store.companies;
  }

  public getSelectedCompanyId(): string | null {
    return this.store.selectedCompanyId || (this.store.companies[0]?.id ?? null);
  }

  public getSelectedCompany(): TallyCompany | null {
    const id = this.getSelectedCompanyId();
    if (!id) return null;
    return this.store.companies.find((c) => c.id === id) || null;
  }

  public selectCompany(companyId: string, user: string = 'User'): TallyCompany {
    const comp = this.store.companies.find((c) => c.id === companyId);
    if (!comp) throw new Error(`Company with ID "${companyId}" not found`);
    this.store.selectedCompanyId = comp.id;
    this.recordAudit(comp.id, 'COMPANY_SELECTED', 'Company', comp.id, user, { name: comp.name });
    this.saveStore();
    return comp;
  }

  public createCompany(data: Partial<TallyCompany>, user: string = 'User'): TallyCompany {
    if (!data.name || !data.name.trim()) {
      throw new Error('Company Name is mandatory');
    }

    const trimmedName = data.name.trim();
    if (this.store.companies.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error(`Company with name "${trimmedName}" already exists`);
    }

    const id = `cmp-tally-${Date.now()}`;
    const now = new Date().toISOString();

    const newCompany: TallyCompany = {
      id,
      name: trimmedName,
      mailingName: data.mailingName?.trim() || trimmedName,
      address: data.address?.trim() || '',
      state: data.state || 'Maharashtra',
      stateCode: data.stateCode || '27',
      country: data.country || 'India',
      pincode: data.pincode?.trim() || '',
      telephone: data.telephone?.trim() || '',
      mobile: data.mobile?.trim() || '',
      email: data.email?.trim() || '',
      currencySymbol: data.currencySymbol || '₹',
      formalName: data.formalName || 'INR',
      financialYearStart: data.financialYearStart || '2026-04-01',
      booksBeginningDate: data.booksBeginningDate || data.financialYearStart || '2026-04-01',
      gstin: data.gstin?.trim() || '',
      pan: data.pan?.trim() || '',
      cin: data.cin?.trim() || '',
      features: {
        enableInventory: data.features?.enableInventory ?? true,
        enableGst: data.features?.enableGst ?? true,
        enableBillByBill: data.features?.enableBillByBill ?? true,
        enableCostCentres: data.features?.enableCostCentres ?? false,
        highContrastMode: data.features?.highContrastMode ?? false,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.store.companies.push(newCompany);
    this.store.selectedCompanyId = newCompany.id;

    // Seed 28 groups and default voucher types
    this.seedCompanyDefaults(newCompany.id, user);

    this.recordAudit(newCompany.id, 'COMPANY_CREATED', 'Company', newCompany.id, user, { name: newCompany.name });
    this.saveStore();
    return newCompany;
  }

  public updateCompany(companyId: string, updates: Partial<TallyCompany>, user: string = 'User'): TallyCompany {
    const comp = this.store.companies.find((c) => c.id === companyId);
    if (!comp) throw new Error(`Company not found: ${companyId}`);

    if (updates.name && updates.name.trim() !== comp.name) {
      const existing = this.store.companies.find(
        (c) => c.id !== companyId && c.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (existing) throw new Error(`Another company with name "${updates.name}" already exists`);
      comp.name = updates.name.trim();
    }

    if (updates.mailingName !== undefined) comp.mailingName = updates.mailingName.trim();
    if (updates.address !== undefined) comp.address = updates.address.trim();
    if (updates.state !== undefined) comp.state = updates.state;
    if (updates.stateCode !== undefined) comp.stateCode = updates.stateCode;
    if (updates.pincode !== undefined) comp.pincode = updates.pincode.trim();
    if (updates.telephone !== undefined) comp.telephone = updates.telephone.trim();
    if (updates.mobile !== undefined) comp.mobile = updates.mobile.trim();
    if (updates.email !== undefined) comp.email = updates.email.trim();
    if (updates.gstin !== undefined) comp.gstin = updates.gstin.trim();
    if (updates.pan !== undefined) comp.pan = updates.pan.trim();
    if (updates.cin !== undefined) comp.cin = updates.cin.trim();
    if (updates.financialYearStart !== undefined) comp.financialYearStart = updates.financialYearStart;
    if (updates.booksBeginningDate !== undefined) comp.booksBeginningDate = updates.booksBeginningDate;
    if (updates.features) {
      comp.features = { ...comp.features, ...updates.features };
    }
    comp.updatedAt = new Date().toISOString();

    this.recordAudit(companyId, 'COMPANY_ALTERED', 'Company', companyId, user, updates);
    this.saveStore();
    return comp;
  }

  public deleteCompany(companyId: string, confirmationName: string, user: string = 'User'): void {
    const comp = this.store.companies.find((c) => c.id === companyId);
    if (!comp) throw new Error(`Company not found: ${companyId}`);

    if (confirmationName.trim() !== comp.name) {
      throw new Error(`Confirmation name mismatch. Type exact company name "${comp.name}" to delete.`);
    }

    if (this.store.companies.length <= 1) {
      throw new Error('Cannot delete the only remaining company.');
    }

    // Cascade remove masters and vouchers
    this.store.companies = this.store.companies.filter((c) => c.id !== companyId);
    this.store.groups = this.store.groups.filter((g) => g.companyId !== companyId);
    this.store.ledgers = this.store.ledgers.filter((l) => l.companyId !== companyId);
    this.store.voucherTypes = this.store.voucherTypes.filter((vt) => vt.companyId !== companyId);
    this.store.units = this.store.units.filter((u) => u.companyId !== companyId);
    this.store.godowns = this.store.godowns.filter((g) => g.companyId !== companyId);
    this.store.stockGroups = this.store.stockGroups.filter((sg) => sg.companyId !== companyId);
    this.store.stockCategories = this.store.stockCategories.filter((sc) => sc.companyId !== companyId);
    this.store.stockItems = this.store.stockItems.filter((si) => si.companyId !== companyId);
    this.store.vouchers = this.store.vouchers.filter((v) => v.companyId !== companyId);

    if (this.store.selectedCompanyId === companyId) {
      this.store.selectedCompanyId = this.store.companies[0]?.id ?? null;
    }

    this.recordAudit(companyId, 'COMPANY_DELETED', 'Company', companyId, user, { name: comp.name });
    this.saveStore();
  }

  // ==========================================
  // ACCOUNT GROUPS
  // ==========================================
  public listGroups(companyId: string): TallyAccountGroup[] {
    return this.store.groups.filter((g) => g.companyId === companyId);
  }

  public createGroup(companyId: string, data: { name: string; parentGroupName?: string | null; nature?: any; affectsGrossProfit?: boolean }, user: string = 'User'): TallyAccountGroup {
    if (!data.name || !data.name.trim()) throw new Error('Group name is required');
    const trimmed = data.name.trim();

    const exists = this.store.groups.some(
      (g) => g.companyId === companyId && g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) throw new Error(`Group "${trimmed}" already exists`);

    let nature = data.nature || 'Asset';
    let affectsGrossProfit = !!data.affectsGrossProfit;

    if (data.parentGroupName) {
      const parent = this.store.groups.find(
        (g) => g.companyId === companyId && g.name.toLowerCase() === data.parentGroupName!.toLowerCase()
      );
      if (parent) {
        nature = parent.nature;
        affectsGrossProfit = parent.affectsGrossProfit;
      }
    }

    const group: TallyAccountGroup = {
      id: `grp-${companyId}-${Date.now()}`,
      companyId,
      name: trimmed,
      parentGroupName: data.parentGroupName || null,
      nature,
      affectsGrossProfit,
      isDefault: false,
    };

    this.store.groups.push(group);
    this.recordAudit(companyId, 'GROUP_CREATED', 'AccountGroup', group.id, user, { name: group.name });
    this.saveStore();
    return group;
  }

  // ==========================================
  // LEDGERS
  // ==========================================
  public listLedgers(companyId: string): TallyLedger[] {
    return this.store.ledgers.filter((l) => l.companyId === companyId);
  }

  public getLedger(companyId: string, ledgerId: string): TallyLedger | null {
    return this.store.ledgers.find((l) => l.companyId === companyId && l.id === ledgerId) || null;
  }

  public createLedger(companyId: string, data: Partial<TallyLedger>, user: string = 'User'): TallyLedger {
    if (!data.name || !data.name.trim()) throw new Error('Ledger Name is required');
    if (!data.groupId && !data.groupName) throw new Error('Parent Group is required');

    const trimmedName = data.name.trim();
    const exists = this.store.ledgers.some(
      (l) => l.companyId === companyId && l.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) throw new Error(`Ledger "${trimmedName}" already exists`);

    let targetGroup: TallyAccountGroup | undefined;
    if (data.groupId) {
      targetGroup = this.store.groups.find((g) => g.companyId === companyId && g.id === data.groupId);
    }
    if (!targetGroup && data.groupName) {
      targetGroup = this.store.groups.find(
        (g) => g.companyId === companyId && g.name.toLowerCase() === data.groupName!.toLowerCase()
      );
    }
    if (!targetGroup) throw new Error(`Parent group "${data.groupName || data.groupId}" not found`);

    const now = new Date().toISOString();
    const openingPaise = Math.round(Number(data.openingBalancePaise) || 0);

    const ledger: TallyLedger = {
      id: `led-${companyId}-${Date.now()}`,
      companyId,
      name: trimmedName,
      alias: data.alias?.trim() || '',
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      openingBalancePaise: Math.abs(openingPaise),
      openingBalanceType: data.openingBalanceType || 'Dr',
      billByBillEnabled: !!data.billByBillEnabled,
      gstin: data.gstin?.trim() || '',
      state: data.state || '',
      stateCode: data.stateCode || '',
      address: data.address?.trim() || '',
      contactPerson: data.contactPerson?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      bankDetails: data.bankDetails || {},
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    this.store.ledgers.push(ledger);
    this.recordAudit(companyId, 'LEDGER_CREATED', 'Ledger', ledger.id, user, { name: ledger.name });
    this.saveStore();
    return ledger;
  }

  public updateLedger(companyId: string, ledgerId: string, updates: Partial<TallyLedger>, user: string = 'User'): TallyLedger {
    const ledger = this.store.ledgers.find((l) => l.companyId === companyId && l.id === ledgerId);
    if (!ledger) throw new Error(`Ledger with ID "${ledgerId}" not found`);

    if (updates.name && updates.name.trim() !== ledger.name) {
      const exists = this.store.ledgers.some(
        (l) => l.companyId === companyId && l.id !== ledgerId && l.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (exists) throw new Error(`Another ledger with name "${updates.name}" already exists`);
      ledger.name = updates.name.trim();
    }

    if (updates.alias !== undefined) ledger.alias = updates.alias.trim();
    if (updates.groupId) {
      const targetGroup = this.store.groups.find((g) => g.companyId === companyId && g.id === updates.groupId);
      if (targetGroup) {
        ledger.groupId = targetGroup.id;
        ledger.groupName = targetGroup.name;
      }
    }
    if (updates.openingBalancePaise !== undefined) {
      ledger.openingBalancePaise = Math.abs(Math.round(Number(updates.openingBalancePaise)));
    }
    if (updates.openingBalanceType !== undefined) ledger.openingBalanceType = updates.openingBalanceType;
    if (updates.billByBillEnabled !== undefined) ledger.billByBillEnabled = updates.billByBillEnabled;
    if (updates.gstin !== undefined) ledger.gstin = updates.gstin.trim();
    if (updates.state !== undefined) ledger.state = updates.state;
    if (updates.stateCode !== undefined) ledger.stateCode = updates.stateCode;
    if (updates.address !== undefined) ledger.address = updates.address.trim();
    if (updates.contactPerson !== undefined) ledger.contactPerson = updates.contactPerson.trim();
    if (updates.phone !== undefined) ledger.phone = updates.phone.trim();
    if (updates.email !== undefined) ledger.email = updates.email.trim();
    if (updates.bankDetails) ledger.bankDetails = { ...ledger.bankDetails, ...updates.bankDetails };
    ledger.updatedAt = new Date().toISOString();

    this.recordAudit(companyId, 'LEDGER_ALTERED', 'Ledger', ledgerId, user, updates);
    this.saveStore();
    return ledger;
  }

  public deleteLedger(companyId: string, ledgerId: string, user: string = 'User'): void {
    const ledger = this.store.ledgers.find((l) => l.companyId === companyId && l.id === ledgerId);
    if (!ledger) throw new Error(`Ledger "${ledgerId}" not found`);
    if (ledger.isDefault) throw new Error(`Cannot delete standard system ledger "${ledger.name}"`);

    // Check if referenced in vouchers
    const isUsedInVouchers = this.store.vouchers.some(
      (v) => v.companyId === companyId && v.entries.some((e) => e.ledgerId === ledgerId)
    );
    if (isUsedInVouchers) {
      throw new Error(`Cannot delete ledger "${ledger.name}" because it contains accounting voucher entries.`);
    }

    this.store.ledgers = this.store.ledgers.filter((l) => !(l.companyId === companyId && l.id === ledgerId));
    this.recordAudit(companyId, 'LEDGER_DELETED', 'Ledger', ledgerId, user, { name: ledger.name });
    this.saveStore();
  }

  // ==========================================
  // VOUCHER TYPES
  // ==========================================
  public listVoucherTypes(companyId: string): TallyVoucherType[] {
    return this.store.voucherTypes.filter((vt) => vt.companyId === companyId);
  }

  public createVoucherType(companyId: string, data: Partial<TallyVoucherType>, user: string = 'User'): TallyVoucherType {
    if (!data.name || !data.name.trim()) throw new Error('Voucher Type name is required');
    if (!data.baseType) throw new Error('Base Voucher Type is required');

    const trimmed = data.name.trim();
    const exists = this.store.voucherTypes.some(
      (vt) => vt.companyId === companyId && vt.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) throw new Error(`Voucher type "${trimmed}" already exists`);

    const vt: TallyVoucherType = {
      id: `vt-${companyId}-${Date.now()}`,
      companyId,
      name: trimmed,
      baseType: data.baseType,
      prefix: data.prefix || '',
      suffix: data.suffix || '',
      numberingMethod: data.numberingMethod || 'Automatic',
      startingNumber: data.startingNumber || 1,
      currentNumber: data.startingNumber || 1,
      restartPeriod: data.restartPeriod || 'Yearly',
      isDefault: false,
    };

    this.store.voucherTypes.push(vt);
    this.recordAudit(companyId, 'VOUCHER_TYPE_CREATED', 'VoucherType', vt.id, user, { name: vt.name });
    this.saveStore();
    return vt;
  }

  // ==========================================
  // INVENTORY MASTERS: UNITS, GODOWNS, STOCK GROUPS, STOCK ITEMS
  // ==========================================
  public listUnits(companyId: string): TallyUnit[] {
    return this.store.units.filter((u) => u.companyId === companyId);
  }

  public createUnit(companyId: string, data: Partial<TallyUnit>, user: string = 'User'): TallyUnit {
    if (!data.symbol || !data.symbol.trim()) throw new Error('Unit Symbol is required (e.g. PCS, NOS)');
    const symbol = data.symbol.trim().toUpperCase();

    const exists = this.store.units.some(
      (u) => u.companyId === companyId && u.symbol.toUpperCase() === symbol
    );
    if (exists) throw new Error(`Unit symbol "${symbol}" already exists`);

    const unit: TallyUnit = {
      id: `unt-${companyId}-${Date.now()}`,
      companyId,
      type: data.type || 'Simple',
      symbol,
      formalName: data.formalName?.trim() || symbol,
      uqc: data.uqc || `${symbol}-${symbol}`,
      decimalPlaces: Number(data.decimalPlaces) || 0,
      compoundFirstUnitId: data.compoundFirstUnitId,
      compoundConversion: data.compoundConversion,
      compoundSecondUnitId: data.compoundSecondUnitId,
    };

    this.store.units.push(unit);
    this.recordAudit(companyId, 'UNIT_CREATED', 'Unit', unit.id, user, { symbol: unit.symbol });
    this.saveStore();
    return unit;
  }

  public listGodowns(companyId: string): TallyGodown[] {
    return this.store.godowns.filter((g) => g.companyId === companyId);
  }

  public createGodown(companyId: string, data: Partial<TallyGodown>, user: string = 'User'): TallyGodown {
    if (!data.name || !data.name.trim()) throw new Error('Godown Name is required');
    const name = data.name.trim();

    const exists = this.store.godowns.some(
      (g) => g.companyId === companyId && g.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) throw new Error(`Godown "${name}" already exists`);

    const godown: TallyGodown = {
      id: `gdn-${companyId}-${Date.now()}`,
      companyId,
      name,
      address: data.address?.trim() || '',
      isColdChain: !!data.isColdChain,
    };

    this.store.godowns.push(godown);
    this.recordAudit(companyId, 'GODOWN_CREATED', 'Godown', godown.id, user, { name: godown.name });
    this.saveStore();
    return godown;
  }

  public listStockGroups(companyId: string): TallyStockGroup[] {
    return this.store.stockGroups.filter((sg) => sg.companyId === companyId);
  }

  public createStockGroup(companyId: string, data: Partial<TallyStockGroup>, user: string = 'User'): TallyStockGroup {
    if (!data.name || !data.name.trim()) throw new Error('Stock Group Name is required');
    const name = data.name.trim();

    const exists = this.store.stockGroups.some(
      (sg) => sg.companyId === companyId && sg.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) throw new Error(`Stock Group "${name}" already exists`);

    const stockGroup: TallyStockGroup = {
      id: `sg-${companyId}-${Date.now()}`,
      companyId,
      name,
      parentGroupId: data.parentGroupId,
      hsnSac: data.hsnSac?.trim() || '',
      gstRate: Number(data.gstRate) || 0,
    };

    this.store.stockGroups.push(stockGroup);
    this.recordAudit(companyId, 'STOCK_GROUP_CREATED', 'StockGroup', stockGroup.id, user, { name: stockGroup.name });
    this.saveStore();
    return stockGroup;
  }

  public listStockItems(companyId: string): TallyStockItem[] {
    return this.store.stockItems.filter((si) => si.companyId === companyId);
  }

  public createStockItem(companyId: string, data: Partial<TallyStockItem>, user: string = 'User'): TallyStockItem {
    if (!data.name || !data.name.trim()) throw new Error('Stock Item name is required');
    if (!data.unitId) throw new Error('Unit of Measure is required');

    const name = data.name.trim();
    const exists = this.store.stockItems.some(
      (si) => si.companyId === companyId && si.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) throw new Error(`Stock Item "${name}" already exists`);

    const unit = this.store.units.find((u) => u.companyId === companyId && u.id === data.unitId);
    if (!unit) throw new Error(`Unit with ID "${data.unitId}" not found`);

    let stockGroupName = 'Primary';
    if (data.stockGroupId) {
      const sg = this.store.stockGroups.find((g) => g.companyId === companyId && g.id === data.stockGroupId);
      if (sg) stockGroupName = sg.name;
    }

    const now = new Date().toISOString();
    const openingQty = Number(data.openingQty) || 0;
    const openingRatePaise = Math.round(Number(data.openingRatePaise) || 0);
    const openingValuePaise = Math.round(Number(data.openingValuePaise) || (openingQty * openingRatePaise));

    const item: TallyStockItem = {
      id: `itm-${companyId}-${Date.now()}`,
      companyId,
      name,
      partNumber: data.partNumber?.trim() || '',
      stockGroupId: data.stockGroupId || 'primary',
      stockGroupName,
      stockCategoryId: data.stockCategoryId,
      unitId: unit.id,
      unitSymbol: unit.symbol,
      hsnSac: data.hsnSac?.trim() || '',
      gstRate: Number(data.gstRate) || 0,
      valuationMethod: data.valuationMethod || 'FIFO',
      openingQty,
      openingRatePaise,
      openingValuePaise,
      standardCostPaise: Math.round(Number(data.standardCostPaise) || openingRatePaise),
      standardSellingPricePaise: Math.round(Number(data.standardSellingPricePaise) || 0),
      reorderLevel: Number(data.reorderLevel) || 0,
      godownId: data.godownId,
      createdAt: now,
      updatedAt: now,
    };

    this.store.stockItems.push(item);
    this.recordAudit(companyId, 'STOCK_ITEM_CREATED', 'StockItem', item.id, user, { name: item.name });
    this.saveStore();
    return item;
  }

  public updateStockItem(companyId: string, itemId: string, updates: Partial<TallyStockItem>, user: string = 'User'): TallyStockItem {
    const item = this.store.stockItems.find((si) => si.companyId === companyId && si.id === itemId);
    if (!item) throw new Error(`Stock Item "${itemId}" not found`);

    if (updates.name && updates.name.trim() !== item.name) {
      const exists = this.store.stockItems.some(
        (si) => si.companyId === companyId && si.id !== itemId && si.name.toLowerCase() === updates.name!.trim().toLowerCase()
      );
      if (exists) throw new Error(`Another stock item named "${updates.name}" already exists`);
      item.name = updates.name.trim();
    }

    if (updates.partNumber !== undefined) item.partNumber = updates.partNumber.trim();
    if (updates.stockGroupId) {
      const sg = this.store.stockGroups.find((g) => g.companyId === companyId && g.id === updates.stockGroupId);
      if (sg) {
        item.stockGroupId = sg.id;
        item.stockGroupName = sg.name;
      }
    }
    if (updates.unitId) {
      const u = this.store.units.find((unit) => unit.companyId === companyId && unit.id === updates.unitId);
      if (u) {
        item.unitId = u.id;
        item.unitSymbol = u.symbol;
      }
    }
    if (updates.hsnSac !== undefined) item.hsnSac = updates.hsnSac.trim();
    if (updates.gstRate !== undefined) item.gstRate = Number(updates.gstRate);
    if (updates.valuationMethod !== undefined) item.valuationMethod = updates.valuationMethod;
    if (updates.openingQty !== undefined) item.openingQty = Number(updates.openingQty);
    if (updates.openingRatePaise !== undefined) item.openingRatePaise = Math.round(Number(updates.openingRatePaise));
    if (updates.openingValuePaise !== undefined) item.openingValuePaise = Math.round(Number(updates.openingValuePaise));
    if (updates.standardCostPaise !== undefined) item.standardCostPaise = Math.round(Number(updates.standardCostPaise));
    if (updates.standardSellingPricePaise !== undefined) item.standardSellingPricePaise = Math.round(Number(updates.standardSellingPricePaise));
    if (updates.reorderLevel !== undefined) item.reorderLevel = Number(updates.reorderLevel);
    if (updates.godownId !== undefined) item.godownId = updates.godownId;
    item.updatedAt = new Date().toISOString();

    this.recordAudit(companyId, 'STOCK_ITEM_ALTERED', 'StockItem', itemId, user, updates);
    this.saveStore();
    return item;
  }

  public deleteStockItem(companyId: string, itemId: string, user: string = 'User'): void {
    const item = this.store.stockItems.find((si) => si.companyId === companyId && si.id === itemId);
    if (!item) throw new Error(`Stock Item "${itemId}" not found`);

    this.store.stockItems = this.store.stockItems.filter((si) => !(si.companyId === companyId && si.id === itemId));
    this.recordAudit(companyId, 'STOCK_ITEM_DELETED', 'StockItem', itemId, user, { name: item.name });
    this.saveStore();
  }
}
