/**
 * TALLY-STYLE SALES INVOICE & PRODUCT BILLING ENGINE
 * Project: Diagnostic Services (D:\diagnostic-services)
 *
 * Implements:
 * 1. Decimal-safe server arithmetic for INR monetary calculations.
 * 2. Product and batch inventory integration with real-time stock and expiry validation.
 * 3. Configurable GST rules (Intra-state CGST+SGST vs Inter-state IGST).
 * 4. Multi-level discounts, transport/freight charges, and round-off arithmetic.
 * 5. Atomicity: Posting validates stock/expiry, deducts inventory batches,
 *    logs dispatch movements, and generates authoritative double-entry accounting vouchers.
 * 6. Non-silent safe cancellations with stock restoration, voucher reversal, and audit trails.
 */

import fs from 'fs';
import path from 'path';
import {
  SalesInvoice,
  SalesInvoiceItem,
  SalesInvoiceStatus,
  InventoryBatch,
  InvoiceCalculationInput,
  InvoiceCalculationResult,
  DocumentType,
  FinancialYearFormat,
  InvoiceNumberingConfig
} from './accountingTypes.js';
import { accountingEngine } from './doubleEntryEngine.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const INVOICES_STORE_FILE = path.join(DATA_DIR, 'sales_invoices_store.json');
const BATCHES_STORE_FILE = path.join(DATA_DIR, 'inventory_batches_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function round2(num: number): number {
  return Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;
}

// Default Seed Batches for Distributor Products
export const DEFAULT_INVENTORY_BATCHES: InventoryBatch[] = [
  // 1. Accu-Chek Inform II Reagent Glucose Test Strips
  {
    id: 'bth-001-a',
    productId: 'prod-001',
    sku: 'RCH-GLUC-500T',
    productName: 'Accu-Chek Inform II Reagent Glucose Test Strips',
    batchNumber: 'BTH-ROC-9921',
    expiryDate: '2027-08-15',
    manufacturingDate: '2025-08-01',
    availableStock: 90,
    initialStock: 100,
    unitCost: 3900.00,
    mrp: 5800.00,
    sellingPrice: 4850.00,
    storageLocation: 'Cold Room #1 (2-8°C)',
    isColdChain: true,
    storageTemperature: '2°C to 8°C',
    isActive: true
  },
  {
    id: 'bth-001-b',
    productId: 'prod-001',
    sku: 'RCH-GLUC-500T',
    productName: 'Accu-Chek Inform II Reagent Glucose Test Strips',
    batchNumber: 'BTH-ROC-9934',
    expiryDate: '2027-12-20',
    manufacturingDate: '2025-12-01',
    availableStock: 50,
    initialStock: 50,
    unitCost: 3900.00,
    mrp: 5800.00,
    sellingPrice: 4850.00,
    storageLocation: 'Cold Room #1 (2-8°C)',
    isColdChain: true,
    storageTemperature: '2°C to 8°C',
    isActive: true
  },
  // Expired batch for validation testing
  {
    id: 'bth-001-expired',
    productId: 'prod-001',
    sku: 'RCH-GLUC-500T',
    productName: 'Accu-Chek Inform II Reagent Glucose Test Strips',
    batchNumber: 'BTH-ROC-EXP-9900',
    expiryDate: '2025-01-10',
    manufacturingDate: '2023-01-01',
    availableStock: 5,
    initialStock: 50,
    unitCost: 3800.00,
    mrp: 5800.00,
    sellingPrice: 4850.00,
    storageLocation: 'Quarantine Section Q1',
    isColdChain: true,
    storageTemperature: '2°C to 8°C',
    isActive: true
  },

  // 2. Sysmex CELLPACK DCL 20L
  {
    id: 'bth-002-a',
    productId: 'prod-002',
    sku: 'SYS-DCL-20L',
    productName: 'Sysmex CELLPACK DCL 20L Automated Hematology Diluent',
    batchNumber: 'BTH-SYS-4410',
    expiryDate: '2027-11-20',
    manufacturingDate: '2025-11-01',
    availableStock: 45,
    initialStock: 50,
    unitCost: 9800.00,
    mrp: 14500.00,
    sellingPrice: 12400.00,
    storageLocation: 'Warehouse Bay 3A',
    isColdChain: false,
    storageTemperature: '15°C to 25°C',
    isActive: true
  },
  {
    id: 'bth-002-b',
    productId: 'prod-002',
    sku: 'SYS-DCL-20L',
    productName: 'Sysmex CELLPACK DCL 20L Automated Hematology Diluent',
    batchNumber: 'BTH-SYS-4422',
    expiryDate: '2028-03-15',
    manufacturingDate: '2026-03-01',
    availableStock: 20,
    initialStock: 20,
    unitCost: 9900.00,
    mrp: 14500.00,
    sellingPrice: 12400.00,
    storageLocation: 'Warehouse Bay 3A',
    isColdChain: false,
    storageTemperature: '15°C to 25°C',
    isActive: true
  },

  // 3. Transasia Erba Chem 7 Semi-Automated Clinical Chemistry Analyzer
  {
    id: 'bth-003-a',
    productId: 'prod-003',
    sku: 'TRA-CHEM7-EQ',
    productName: 'Transasia Erba Chem 7 Semi-Automated Clinical Chemistry Analyzer',
    batchNumber: 'LOT-ERB-2026-01',
    expiryDate: '2034-01-01',
    manufacturingDate: '2026-01-01',
    availableStock: 8,
    initialStock: 10,
    unitCost: 132000.00,
    mrp: 195000.00,
    sellingPrice: 165000.00,
    storageLocation: 'Equipment Storage Bay E1',
    isColdChain: false,
    storageTemperature: 'Ambient (15°C to 30°C)',
    isActive: true
  },
  {
    id: 'bth-003-b',
    productId: 'prod-003',
    sku: 'TRA-CHEM7-EQ',
    productName: 'Transasia Erba Chem 7 Semi-Automated Clinical Chemistry Analyzer',
    batchNumber: 'LOT-ERB-2026-02',
    expiryDate: '2034-06-01',
    manufacturingDate: '2026-06-01',
    availableStock: 4,
    initialStock: 4,
    unitCost: 132000.00,
    mrp: 195000.00,
    sellingPrice: 165000.00,
    storageLocation: 'Equipment Storage Bay E1',
    isColdChain: false,
    storageTemperature: 'Ambient (15°C to 30°C)',
    isActive: true
  },

  // 4. Abbott Architect High-Sensitive Troponin-I Calibrator Set
  {
    id: 'bth-004-a',
    productId: 'prod-004',
    sku: 'ABT-TROP-CAL',
    productName: 'Abbott Architect High-Sensitive Troponin-I Calibrator Set',
    batchNumber: 'BTH-TROP-8812',
    expiryDate: '2027-04-30',
    manufacturingDate: '2026-04-01',
    availableStock: 14,
    initialStock: 20,
    unitCost: 7100.00,
    mrp: 10500.00,
    sellingPrice: 8900.00,
    storageLocation: '-20°C Deep Freeze Unit',
    isColdChain: true,
    storageTemperature: '-20°C Deep Freeze',
    isActive: true
  },
  {
    id: 'bth-004-b',
    productId: 'prod-004',
    sku: 'ABT-TROP-CAL',
    productName: 'Abbott Architect High-Sensitive Troponin-I Calibrator Set',
    batchNumber: 'BTH-TROP-8830',
    expiryDate: '2027-09-15',
    manufacturingDate: '2026-09-01',
    availableStock: 10,
    initialStock: 10,
    unitCost: 7100.00,
    mrp: 10500.00,
    sellingPrice: 8900.00,
    storageLocation: '-20°C Deep Freeze Unit',
    isColdChain: true,
    storageTemperature: '-20°C Deep Freeze',
    isActive: true
  },

  // 5. Bio-Rad Liquichek Immunology Quality Control
  {
    id: 'bth-005-a',
    productId: 'prod-005',
    sku: 'BR-IMM-QC3',
    productName: 'Bio-Rad Liquichek Immunology Quality Control Level 1-2-3',
    batchNumber: 'LOT-BR-7712',
    expiryDate: '2027-10-31',
    manufacturingDate: '2025-10-01',
    availableStock: 18,
    initialStock: 20,
    unitCost: 14500.00,
    mrp: 21000.00,
    sellingPrice: 18200.00,
    storageLocation: 'Cold Room #2 (2-8°C)',
    isColdChain: true,
    storageTemperature: '2°C to 8°C',
    isActive: true
  },

  // 6. VacuGuard K2 EDTA Blood Collection Tubes
  {
    id: 'bth-006-a',
    productId: 'prod-006',
    sku: 'VAC-EDTA-3ML',
    productName: 'VacuGuard K2 EDTA Blood Collection Tubes (Lavender Cap, 3.0 mL)',
    batchNumber: 'BTH-VAC-3301',
    expiryDate: '2028-05-31',
    manufacturingDate: '2026-05-01',
    availableStock: 300,
    initialStock: 350,
    unitCost: 520.00,
    mrp: 850.00,
    sellingPrice: 650.00,
    storageLocation: 'Consumables Racks A4-A6',
    isColdChain: false,
    storageTemperature: '4°C to 25°C',
    isActive: true
  },
  {
    id: 'bth-006-b',
    productId: 'prod-006',
    sku: 'VAC-EDTA-3ML',
    productName: 'VacuGuard K2 EDTA Blood Collection Tubes (Lavender Cap, 3.0 mL)',
    batchNumber: 'BTH-VAC-3305',
    expiryDate: '2028-08-31',
    manufacturingDate: '2026-08-01',
    availableStock: 150,
    initialStock: 150,
    unitCost: 520.00,
    mrp: 850.00,
    sellingPrice: 650.00,
    storageLocation: 'Consumables Racks A4-A6',
    isColdChain: false,
    storageTemperature: '4°C to 25°C',
    isActive: true
  },

  // 7. Erba SGPT / ALT Liquid Stable Kinetic Reagent Kit
  {
    id: 'bth-007-a',
    productId: 'prod-007',
    sku: 'ERB-SGPT-ALT',
    productName: 'Erba SGPT / ALT Liquid Stable Kinetic Reagent Kit',
    batchNumber: 'LOT-ERB-9941',
    expiryDate: '2027-07-31',
    manufacturingDate: '2025-07-01',
    availableStock: 88,
    initialStock: 100,
    unitCost: 1550.00,
    mrp: 2350.00,
    sellingPrice: 1950.00,
    storageLocation: 'Cold Room #1 (2-8°C)',
    isColdChain: true,
    storageTemperature: '2°C to 8°C',
    isActive: true
  },

  // 8. Standard Q Dengue Duo NS1 + IgG/IgM Rapid Test Cards
  {
    id: 'bth-008-a',
    productId: 'prod-008',
    sku: 'SD-DENG-DUO',
    productName: 'Standard Q Dengue Duo NS1 + IgG/IgM Rapid Test Cards',
    batchNumber: 'BTH-SD-1109',
    expiryDate: '2027-12-31',
    manufacturingDate: '2025-12-01',
    availableStock: 120,
    initialStock: 150,
    unitCost: 3000.00,
    mrp: 4600.00,
    sellingPrice: 3800.00,
    storageLocation: 'Ambient Bay 2B',
    isColdChain: false,
    storageTemperature: '2°C to 30°C',
    isActive: true
  }
];

export class SalesInvoiceEngine {
  private invoices: SalesInvoice[] = [];
  private batches: InventoryBatch[] = [];
  private invoiceSequence: number = 1048;
  private postQueue: Promise<any> = Promise.resolve();

  constructor() {
    this.loadState();
  }

  /**
   * Concurrency-safe invoice posting wrapper.
   * Ensures that concurrent requests selling the same batches are queued sequentially,
   * preventing race conditions and negative inventory stock.
   */
  public async postInvoiceSafe(
    payload: any,
    user: { id: string; name: string; role?: string },
    inventoryMovementsDb?: any[],
    productsDb?: any[]
  ): Promise<SalesInvoice> {
    const run = () => this.postInvoice(payload, user, inventoryMovementsDb, productsDb);
    const queued = this.postQueue.then(run, run);
    this.postQueue = queued;
    return queued;
  }

  private loadState(): void {
    // 1. Load Batches
    if (fs.existsSync(BATCHES_STORE_FILE)) {
      try {
        const raw = fs.readFileSync(BATCHES_STORE_FILE, 'utf8');
        this.batches = JSON.parse(raw);
      } catch (e) {
        console.error('[SalesInvoiceEngine] Error reading batches store, resetting to defaults:', e);
        this.batches = [...DEFAULT_INVENTORY_BATCHES];
        this.persistBatches();
      }
    } else {
      this.batches = [...DEFAULT_INVENTORY_BATCHES];
      this.persistBatches();
    }

    // 2. Load Invoices
    if (fs.existsSync(INVOICES_STORE_FILE)) {
      try {
        const raw = fs.readFileSync(INVOICES_STORE_FILE, 'utf8');
        const data = JSON.parse(raw);
        this.invoices = data.invoices || [];
        this.invoiceSequence = data.invoiceSequence || 1048;
      } catch (e) {
        console.error('[SalesInvoiceEngine] Error reading invoices store:', e);
        this.invoices = [];
        this.seedInitialInvoices();
      }
    } else {
      this.invoices = [];
      this.seedInitialInvoices();
    }
  }

  private persistInvoices(): void {
    try {
      const data = {
        invoices: this.invoices,
        invoiceSequence: this.invoiceSequence,
        lastModifiedAt: new Date().toISOString()
      };
      fs.writeFileSync(INVOICES_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[SalesInvoiceEngine] Error persisting invoices:', e);
    }
  }

  private persistBatches(): void {
    try {
      fs.writeFileSync(BATCHES_STORE_FILE, JSON.stringify(this.batches, null, 2), 'utf8');
    } catch (e) {
      console.error('[SalesInvoiceEngine] Error persisting batches:', e);
    }
  }

  private seedInitialInvoices(): void {
    // Seed one realistic posted sales invoice
    const dealerState = '27';
    const custState = '27'; // Intra-state (Maharashtra)
    const calculation = this.calculateInvoiceTotals({
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Inform II Reagent Glucose Test Strips',
          sku: 'RCH-GLUC-500T',
          batchNumber: 'BTH-ROC-9921',
          expiryDate: '2027-08-15',
          availableStock: 100,
          quantity: 10,
          unit: 'Kits',
          unitPrice: 4850.00,
          discountPercent: 5,
          gstRate: 12.00,
          hsnSac: '38220090'
        },
        {
          productId: 'prod-002',
          productName: 'Sysmex CELLPACK DCL 20L Automated Hematology Diluent',
          sku: 'SYS-DCL-20L',
          batchNumber: 'BTH-SYS-4410',
          expiryDate: '2027-11-20',
          availableStock: 50,
          quantity: 5,
          unit: 'Drums',
          unitPrice: 12400.00,
          discountPercent: 0,
          gstRate: 12.00,
          hsnSac: '38220090'
        }
      ],
      customerStateCode: custState,
      dealerStateCode: dealerState,
      freightCharges: 1200.00,
      applyRoundOff: true,
      amountReceived: 50000.00
    });

    const invoice: SalesInvoice = {
      id: 'sinv-initial-001',
      invoiceNumber: 'SINV-26/1046',
      invoiceDate: '2026-10-20',
      dueDate: '2026-11-19',
      status: 'POSTED',
      customerId: 'u-cust-01',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerCode: 'CUST-MH-2041',
      customerGstin: '27AABCM8921N1ZM',
      customerPan: 'AABCM8921N',
      customerState: 'Maharashtra',
      customerStateCode: '27',
      billingAddress: 'Ground Floor, Sunrise Healthcare Complex, LBS Marg, Powai, Mumbai - 400076',
      shippingAddress: 'Ground Floor, Sunrise Healthcare Complex, LBS Marg, Powai, Mumbai - 400076',
      placeOfSupply: 'Maharashtra (27)',
      poNumber: 'PO-APEX-2026-8841',
      paymentTerms: '30 Days Credit Line',
      salesperson: 'Pooja Desai',
      deliveryReference: 'A2Z Cold Logistics (Van MH-03-CP-9012)',
      narration: 'Diagnostic reagents supplies for October routine lab testing',
      termsAndConditions: '1. Goods once sold will not be taken back without temperature log sheet.\n2. Invoices overdue beyond credit period attract 18% p.a. interest.\n3. Subject to Mumbai Jurisdiction only.',
      items: calculation.items,
      grossSubtotal: calculation.grossSubtotal,
      itemDiscountsTotal: calculation.itemDiscountsTotal,
      invoiceDiscountType: 'FIXED',
      invoiceDiscountValue: 0,
      invoiceDiscountAmount: 0,
      taxableAmount: calculation.taxableAmount,
      totalCgst: calculation.totalCgst,
      totalSgst: calculation.totalSgst,
      totalIgst: calculation.totalIgst,
      totalTax: calculation.totalTax,
      freightCharges: calculation.freightCharges,
      otherCharges: 0,
      roundOff: calculation.roundOff,
      finalTotal: calculation.finalTotal,
      amountReceived: 50000.00,
      outstandingBalance: round2(calculation.finalTotal - 50000.00),
      voucherId: 'vch-seeded-sinv-001',
      voucherNumber: 'SINV-26/1046',
      idempotencyKey: 'SEED_SINV_1046',
      createdById: 'u-admin-01',
      createdByName: 'Rajesh Sharma',
      createdAt: '2026-10-20T10:30:00.000Z',
      updatedAt: '2026-10-20T10:30:00.000Z'
    };

    this.invoices.push(invoice);
    this.invoiceSequence = 1047;
    this.persistInvoices();
  }

  // ============================================================================
  // CALCULATION ENGINE (DECIMAL-SAFE SERVER ARITHMETIC)
  // ============================================================================

  public calculateInvoiceTotals(input: InvoiceCalculationInput): InvoiceCalculationResult {
    const isInterState = input.customerStateCode !== input.dealerStateCode;
    let grossSubtotal = 0;
    let itemDiscountsTotal = 0;
    let taxableSum = 0;

    const calculatedItems: SalesInvoiceItem[] = input.items.map((item, index) => {
      const qty = Number(item.quantity || 0);
      let unitPriceExcl = Number(item.unitPrice || 0);
      const gstRate = Number(item.gstRate || 0);

      // Handle tax-inclusive pricing conversion
      if (item.priceIsTaxInclusive && gstRate > 0) {
        unitPriceExcl = round2((unitPriceExcl * 100) / (100 + gstRate));
      }

      const grossLine = round2(qty * unitPriceExcl);
      grossSubtotal = round2(grossSubtotal + grossLine);

      // Line Discount
      let lineDiscount = 0;
      const discountPct = Number(item.discountPercent || 0);
      if (discountPct > 0) {
        lineDiscount = round2((grossLine * discountPct) / 100);
      } else if (item.discountAmount) {
        lineDiscount = round2(Number(item.discountAmount));
      }
      itemDiscountsTotal = round2(itemDiscountsTotal + lineDiscount);

      const taxableAmount = Math.max(0, round2(grossLine - lineDiscount));
      taxableSum = round2(taxableSum + taxableAmount);

      // Tax Calculations
      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (gstRate > 0) {
        if (isInterState) {
          igstRate = gstRate;
          igstAmount = round2((taxableAmount * igstRate) / 100);
        } else {
          cgstRate = round2(gstRate / 2);
          sgstRate = round2(gstRate / 2);
          cgstAmount = round2((taxableAmount * cgstRate) / 100);
          sgstAmount = round2((taxableAmount * sgstRate) / 100);
        }
      }

      const totalTax = round2(cgstAmount + sgstAmount + igstAmount);
      const lineTotal = round2(taxableAmount + totalTax);
      const unitPriceInclusive = qty > 0 ? round2(lineTotal / qty) : unitPriceExcl;

      return {
        id: `item-${Date.now()}-${index}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        availableStock: item.availableStock,
        quantity: qty,
        unit: item.unit || 'Units',
        unitPrice: unitPriceExcl,
        discountPercent: discountPct,
        discountAmount: lineDiscount,
        taxableAmount,
        hsnSac: item.hsnSac || '38220090',
        gstRate,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalTax,
        lineTotal,
        unitPriceInclusive,
        isColdChain: item.isColdChain,
        storageTemperature: item.storageTemperature
      };
    });

    // Invoice-Level Discount
    let invoiceDiscountAmount = 0;
    if (input.invoiceDiscountType === 'PERCENTAGE' && input.invoiceDiscountValue) {
      invoiceDiscountAmount = round2((taxableSum * Number(input.invoiceDiscountValue)) / 100);
    } else if (input.invoiceDiscountType === 'FIXED' && input.invoiceDiscountValue) {
      invoiceDiscountAmount = round2(Number(input.invoiceDiscountValue));
    }

    const netTaxable = Math.max(0, round2(taxableSum - invoiceDiscountAmount));

    // Sum Taxes
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    calculatedItems.forEach(item => {
      // If invoice discount applies, proportionally adjust taxes
      if (taxableSum > 0 && invoiceDiscountAmount > 0) {
        const factor = netTaxable / taxableSum;
        totalCgst = round2(totalCgst + round2(item.cgstAmount * factor));
        totalSgst = round2(totalSgst + round2(item.sgstAmount * factor));
        totalIgst = round2(totalIgst + round2(item.igstAmount * factor));
      } else {
        totalCgst = round2(totalCgst + item.cgstAmount);
        totalSgst = round2(totalSgst + item.sgstAmount);
        totalIgst = round2(totalIgst + item.igstAmount);
      }
    });

    const totalTax = round2(totalCgst + totalSgst + totalIgst);
    const freightCharges = round2(Number(input.freightCharges || 0));
    const otherCharges = round2(Number(input.otherCharges || 0));

    const unroundedGrand = round2(netTaxable + totalTax + freightCharges + otherCharges);

    let roundOff = 0;
    let finalTotal = unroundedGrand;

    if (input.applyRoundOff) {
      finalTotal = Math.round(unroundedGrand);
      roundOff = round2(finalTotal - unroundedGrand);
    }

    const amountReceived = round2(Number(input.amountReceived || 0));
    const outstandingBalance = Math.max(0, round2(finalTotal - amountReceived));

    return {
      items: calculatedItems,
      grossSubtotal,
      itemDiscountsTotal,
      invoiceDiscountAmount,
      taxableAmount: netTaxable,
      totalCgst,
      totalSgst,
      totalIgst,
      totalTax,
      freightCharges,
      otherCharges,
      roundOff,
      finalTotal,
      amountReceived,
      outstandingBalance,
      isInterState
    };
  }

  // ============================================================================
  // INVENTORY BATCH LOOKUPS
  // ============================================================================

  public getAllBatches(): InventoryBatch[] {
    return [...this.batches];
  }

  public getBatchesForProduct(productId: string): InventoryBatch[] {
    return this.batches.filter(b => b.productId === productId && b.isActive);
  }

  public getBatch(productId: string, batchNumber: string): InventoryBatch | undefined {
    return this.batches.find(
      b => b.productId === productId && b.batchNumber.toLowerCase() === batchNumber.toLowerCase()
    );
  }

  // ============================================================================
  // INVOICE NUMBER SERIES GENERATOR & CONCURRENCY-SAFE ALLOCATION
  // ============================================================================

  public getFinancialYearString(dateStr?: string, format: FinancialYearFormat = 'YY-YY'): string {
    if (format === 'NONE') return '';
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed: 0 = Jan, 2 = Mar, 3 = Apr
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;

    const startYY = String(startYear).slice(-2);
    const endYY = String(endYear).slice(-2);

    switch (format) {
      case 'YYYY-YYYY':
        return `${startYear}-${endYear}`;
      case 'YY':
        return startYY;
      case 'YY-YY':
      default:
        return `${startYY}-${endYY}`;
    }
  }

  public formatDocumentNumber(
    config: InvoiceNumberingConfig,
    sequence: number,
    dateStr?: string
  ): string {
    const fy = this.getFinancialYearString(dateStr, config.financialYearFormat);
    const padded = String(sequence).padStart(config.padding, '0');
    const sep = config.separator || '/';

    let num = config.prefix;
    if (fy) {
      num += `${fy}${sep}`;
    }
    num += padded;
    if (config.suffix) {
      num += config.suffix;
    }
    return num;
  }

  public getNextInvoiceNumber(docType: DocumentType = 'TAX_INVOICE', dateStr?: string): string {
    const settings = accountingEngine.getSettings();
    const config = settings.numberingConfigs?.[docType] || {
      prefix: docType === 'DELIVERY_NOTE' ? 'DN-' : docType === 'PROFORMA_INVOICE' ? 'PI-' : docType === 'CREDIT_NOTE' ? 'CN-' : 'SINV-',
      financialYearFormat: 'YY-YY' as FinancialYearFormat,
      separator: '/',
      startingNumber: 1001,
      padding: 4,
      currentSequence: this.invoiceSequence || 1048,
      resetOnFinancialYear: true
    };

    const fy = this.getFinancialYearString(dateStr, config.financialYearFormat);
    let seq = config.currentSequence || this.invoiceSequence || 1001;

    if (config.resetOnFinancialYear && fy && config.lastResetFY && config.lastResetFY !== fy) {
      seq = config.startingNumber || 1001;
    }

    let candidate = this.formatDocumentNumber(config, seq, dateStr);
    while (this.invoices.some(inv => inv.status === 'POSTED' && inv.invoiceNumber === candidate)) {
      seq++;
      candidate = this.formatDocumentNumber(config, seq, dateStr);
    }
    return candidate;
  }

  public allocateDocumentNumber(docType: DocumentType = 'TAX_INVOICE', dateStr?: string): string {
    const settings = accountingEngine.getSettings();
    const config = settings.numberingConfigs?.[docType] || {
      prefix: docType === 'DELIVERY_NOTE' ? 'DN-' : docType === 'PROFORMA_INVOICE' ? 'PI-' : docType === 'CREDIT_NOTE' ? 'CN-' : 'SINV-',
      financialYearFormat: 'YY-YY' as FinancialYearFormat,
      separator: '/',
      startingNumber: 1001,
      padding: 4,
      currentSequence: this.invoiceSequence || 1048,
      resetOnFinancialYear: true
    };

    const fy = this.getFinancialYearString(dateStr, config.financialYearFormat);
    let seq = config.currentSequence || this.invoiceSequence || 1001;

    if (config.resetOnFinancialYear && fy && config.lastResetFY && config.lastResetFY !== fy) {
      seq = config.startingNumber || 1001;
    }

    let candidate = this.formatDocumentNumber(config, seq, dateStr);
    while (this.invoices.some(inv => inv.status === 'POSTED' && inv.invoiceNumber === candidate)) {
      seq++;
      candidate = this.formatDocumentNumber(config, seq, dateStr);
    }

    const nextSeq = seq + 1;
    this.invoiceSequence = nextSeq;

    const updatedConfigs = {
      ...(settings.numberingConfigs || {}),
      [docType]: {
        ...config,
        currentSequence: nextSeq,
        lastResetFY: fy || config.lastResetFY
      }
    };

    accountingEngine.updateSettings({ numberingConfigs: updatedConfigs as any });
    this.persistInvoices();
    return candidate;
  }

  public previewNextInvoiceNumber(docType: DocumentType = 'TAX_INVOICE', dateStr?: string): { previewNumber: string; isDraft: boolean; docType: DocumentType; financialYear: string } {
    const settings = accountingEngine.getSettings();
    const config = settings.numberingConfigs?.[docType] || {
      prefix: docType === 'DELIVERY_NOTE' ? 'DN-' : docType === 'PROFORMA_INVOICE' ? 'PI-' : docType === 'CREDIT_NOTE' ? 'CN-' : 'SINV-',
      financialYearFormat: 'YY-YY' as FinancialYearFormat,
      separator: '/',
      startingNumber: 1001,
      padding: 4,
      currentSequence: this.invoiceSequence || 1048,
      resetOnFinancialYear: true
    };

    const fy = this.getFinancialYearString(dateStr, config.financialYearFormat);
    let seq = config.currentSequence || this.invoiceSequence || 1001;
    if (config.resetOnFinancialYear && fy && config.lastResetFY && config.lastResetFY !== fy) {
      seq = config.startingNumber || 1001;
    }

    let candidate = this.formatDocumentNumber(config, seq, dateStr);
    while (this.invoices.some(inv => inv.status === 'POSTED' && inv.invoiceNumber === candidate)) {
      seq++;
      candidate = this.formatDocumentNumber(config, seq, dateStr);
    }

    return {
      previewNumber: candidate,
      isDraft: true,
      docType,
      financialYear: fy
    };
  }

  // ============================================================================
  // SAVE DRAFT (WITHOUT INVENTORY OR ACCOUNTING IMPACT)
  // ============================================================================

  public saveDraft(payload: any, user: { id: string; name: string }): SalesInvoice {
    const existing = payload.id ? this.invoices.find(inv => inv.id === payload.id) : null;
    const isExplicitOfficial = payload.invoiceNumber && !payload.invoiceNumber.startsWith('[DRAFT]');
    const invoiceNumber = isExplicitOfficial
      ? payload.invoiceNumber
      : (existing ? existing.invoiceNumber : `[DRAFT] ${this.getNextInvoiceNumber(payload.documentType || 'TAX_INVOICE', payload.invoiceDate)}`);

    const settings = accountingEngine.getSettings();
    const dealerStateCode = settings.stateCode || '27';
    const customerStateCode = payload.customerStateCode || '27';

    const calculation = this.calculateInvoiceTotals({
      items: (payload.items || []).map((it: any) => ({
        ...it,
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || 0),
        discountAmount: Number(it.discountAmount || 0),
        gstRate: Number(it.gstRate || 12),
        priceIsTaxInclusive: Boolean(it.priceIsTaxInclusive)
      })),
      customerStateCode,
      dealerStateCode,
      invoiceDiscountType: payload.invoiceDiscountType || 'FIXED',
      invoiceDiscountValue: Number(payload.invoiceDiscountValue || 0),
      freightCharges: Number(payload.freightCharges || 0),
      otherCharges: Number(payload.otherCharges || 0),
      applyRoundOff: Boolean(payload.applyRoundOff !== false),
      amountReceived: Number(payload.amountReceived || 0)
    });

    const draftInvoice: SalesInvoice = {
      id: existing ? existing.id : `sinv-${Date.now()}`,
      invoiceNumber,
      invoiceDate: payload.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'DRAFT',
      customerId: payload.customerId || '',
      customerName: payload.customerName || 'Draft Customer',
      customerCode: payload.customerCode || '',
      customerGstin: payload.customerGstin || '',
      customerPan: payload.customerPan || '',
      customerState: payload.customerState || 'Maharashtra',
      customerStateCode,
      billingAddress: payload.billingAddress || '',
      shippingAddress: payload.shippingAddress || payload.billingAddress || '',
      placeOfSupply: payload.placeOfSupply || `${payload.customerState || 'Maharashtra'} (${customerStateCode})`,
      poNumber: payload.poNumber || '',
      paymentTerms: payload.paymentTerms || '30 Days Credit Line',
      salesperson: payload.salesperson || user.name,
      deliveryReference: payload.deliveryReference || '',
      narration: payload.narration || '',
      termsAndConditions: payload.termsAndConditions || '1. Goods once sold are not returnable without cold-chain verification.\n2. Overdue payments attract 18% p.a. interest.',
      items: calculation.items,
      grossSubtotal: calculation.grossSubtotal,
      itemDiscountsTotal: calculation.itemDiscountsTotal,
      invoiceDiscountType: payload.invoiceDiscountType || 'FIXED',
      invoiceDiscountValue: Number(payload.invoiceDiscountValue || 0),
      invoiceDiscountAmount: calculation.invoiceDiscountAmount,
      taxableAmount: calculation.taxableAmount,
      totalCgst: calculation.totalCgst,
      totalSgst: calculation.totalSgst,
      totalIgst: calculation.totalIgst,
      totalTax: calculation.totalTax,
      freightCharges: calculation.freightCharges,
      otherCharges: calculation.otherCharges,
      roundOff: calculation.roundOff,
      finalTotal: calculation.finalTotal,
      amountReceived: calculation.amountReceived,
      outstandingBalance: calculation.outstandingBalance,
      createdById: user.id,
      createdByName: user.name,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      const idx = this.invoices.findIndex(inv => inv.id === existing.id);
      this.invoices[idx] = draftInvoice;
    } else {
      this.invoices.unshift(draftInvoice);
    }

    this.persistInvoices();
    return draftInvoice;
  }

  // ============================================================================
  // POST INVOICE (ATOMIC VALIDATION, INVENTORY MOVEMENT & DOUBLE-ENTRY POSTING)
  // ============================================================================

  public postInvoice(
    payload: any,
    user: { id: string; name: string; role?: string },
    inventoryMovementsDb?: any[],
    productsDb?: any[]
  ): SalesInvoice {
    // 1. Basic validation
    if (!payload.customerId) {
      throw new Error('Customer selection is mandatory to post a Sales Invoice.');
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('At least one product line is required to post a Sales Invoice.');
    }

    const invoiceDate = payload.invoiceDate || new Date().toISOString().split('T')[0];
    const settings = accountingEngine.getSettings();

    // 2. Period Closing Lock Check
    if (settings.periodLockDate && invoiceDate <= settings.periodLockDate) {
      throw new Error(
        `Financial Period Locked: Invoices on or before ${settings.periodLockDate} cannot be posted. Please contact Super Admin.`
      );
    }

    // 3. Idempotency Check
    const idempotencyKey = payload.idempotencyKey || `INVOICE_POST_${payload.invoiceNumber || payload.id || 'GEN'}`;
    const existingPosted = this.invoices.find(
      inv => inv.status === 'POSTED' && (inv.idempotencyKey === idempotencyKey || (payload.invoiceNumber && inv.invoiceNumber === payload.invoiceNumber))
    );
    if (existingPosted) {
      console.log(`[SalesInvoiceEngine] Idempotent return for existing posted invoice ${existingPosted.invoiceNumber}`);
      return existingPosted;
    }

    // 4. Batch Stock & Expiry Validation
    const todayStr = new Date().toISOString().split('T')[0];
    for (const item of payload.items) {
      const qty = Number(item.quantity || 0);
      if (qty <= 0) {
        throw new Error(`Quantity must be greater than zero for product: ${item.productName || item.sku}`);
      }

      if (!item.batchNumber) {
        throw new Error(`Batch/Lot number must be selected for product: ${item.productName || item.sku}`);
      }

      const batch = this.getBatch(item.productId, item.batchNumber);
      if (!batch) {
        throw new Error(`Batch ${item.batchNumber} not found for product ${item.productName || item.sku}`);
      }

      // Expiry Check
      if (batch.expiryDate < todayStr || batch.expiryDate < invoiceDate) {
        throw new Error(
          `Cannot sell expired batch! Batch ${batch.batchNumber} for ${batch.productName} expired on ${batch.expiryDate}.`
        );
      }

      // Stock Quantity Check
      if (qty > batch.availableStock) {
        throw new Error(
          `Insufficient Stock: Requested ${qty} ${item.unit || 'units'} of batch ${batch.batchNumber} (${batch.productName}), but only ${batch.availableStock} are available in stock.`
        );
      }
    }

    // 5. Authoritative Decimal-Safe Totals
    const dealerStateCode = settings.stateCode || '27';
    const customerStateCode = payload.customerStateCode || '27';

    const calculation = this.calculateInvoiceTotals({
      items: payload.items.map((it: any) => ({
        ...it,
        quantity: Number(it.quantity || 1),
        unitPrice: Number(it.unitPrice || 0),
        discountPercent: Number(it.discountPercent || 0),
        discountAmount: Number(it.discountAmount || 0),
        gstRate: Number(it.gstRate || 12),
        priceIsTaxInclusive: Boolean(it.priceIsTaxInclusive)
      })),
      customerStateCode,
      dealerStateCode,
      invoiceDiscountType: payload.invoiceDiscountType || 'FIXED',
      invoiceDiscountValue: Number(payload.invoiceDiscountValue || 0),
      freightCharges: Number(payload.freightCharges || 0),
      otherCharges: Number(payload.otherCharges || 0),
      applyRoundOff: Boolean(payload.applyRoundOff !== false),
      amountReceived: Number(payload.amountReceived || 0)
    });

    let invoiceNumber = payload.invoiceNumber;
    if (!invoiceNumber || invoiceNumber.startsWith('[DRAFT]')) {
      invoiceNumber = this.allocateDocumentNumber(payload.documentType || 'TAX_INVOICE', invoiceDate);
    } else {
      // Uniqueness validation against existing posted invoices
      const isDuplicate = this.invoices.some(
        inv => inv.status === 'POSTED' && inv.invoiceNumber === invoiceNumber && inv.idempotencyKey !== idempotencyKey
      );
      if (isDuplicate) {
        throw new Error(`Invoice number "${invoiceNumber}" has already been issued to a posted invoice and cannot be reused.`);
      }
    }

    // 6. Deduct Batch Inventory & Record Movements (Guarded by Compensating Rollback)
    const stockMovementIds: string[] = [];
    const deductionsToRollback: Array<{ batch: InventoryBatch; qty: number; prodId?: string }> = [];
    const movementsToRollback: string[] = [];

    try {
      payload.items.forEach((item: any, idx: number) => {
        const batch = this.getBatch(item.productId, item.batchNumber)!;
        const qty = Number(item.quantity);
        batch.availableStock = round2(batch.availableStock - qty);
        deductionsToRollback.push({ batch, qty, prodId: item.productId });

        // Also decrement product stock in productsDb if provided
        if (productsDb) {
          const prod = productsDb.find((p: any) => p.id === item.productId);
          if (prod) {
            prod.stockQuantity = Math.max(0, Number(prod.stockQuantity || 0) - qty);
          }
        }

        // Record Stock Movement in inventoryMovementsDb
        const movId = `mov-${Date.now()}-${idx}`;
        stockMovementIds.push(movId);
        movementsToRollback.push(movId);
        if (inventoryMovementsDb) {
        inventoryMovementsDb.unshift({
          id: movId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          type: 'SALES_DISPATCH',
          quantity: -qty,
          previousStock: batch.availableStock + qty,
          newStock: batch.availableStock,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          reason: `Sales Invoice #${invoiceNumber} for ${payload.customerName}`,
          performedBy: user.name,
          createdAt: new Date().toISOString()
        });
      }
    });
    this.persistBatches();

    // 7. Post Double-Entry Accounting Voucher
    // Locate or fallback customer debtor ledger
    const ledgers = accountingEngine.getLedgers();
    const debtorLedger = ledgers.find(
      l => l.accountType === 'SUNDRY_DEBTOR' && (l.entityId === payload.customerId || l.name.toLowerCase().includes((payload.customerName || '').toLowerCase()))
    ) || ledgers.find(l => l.id === 'led-debtor-metropolis') || ledgers.find(l => l.accountType === 'SUNDRY_DEBTOR')!;

    const voucherLines: any[] = [];

    // Line 1: Debits
    if (calculation.outstandingBalance > 0) {
      voucherLines.push({
        ledgerId: debtorLedger.id,
        debit: calculation.outstandingBalance,
        credit: 0,
        narration: `Receivable from ${payload.customerName} on ${payload.paymentTerms || 'Credit'}`
      });
    }

    if (calculation.amountReceived > 0) {
      voucherLines.push({
        ledgerId: 'led-bank-hdfc',
        debit: calculation.amountReceived,
        credit: 0,
        narration: `Immediate receipt against Invoice #${invoiceNumber}`
      });
    }

    // Line 2: Credit Sales Turnover
    voucherLines.push({
      ledgerId: 'led-sales-reagents',
      debit: 0,
      credit: calculation.taxableAmount,
      taxableAmount: calculation.taxableAmount,
      narration: `Sales turnover for Invoice #${invoiceNumber}`
    });

    // Line 3: Credit Output Taxes
    if (calculation.totalCgst > 0) {
      voucherLines.push({
        ledgerId: 'led-cgst-output',
        debit: 0,
        credit: calculation.totalCgst,
        cgstAmount: calculation.totalCgst,
        narration: `Output CGST for Invoice #${invoiceNumber}`
      });
    }

    if (calculation.totalSgst > 0) {
      voucherLines.push({
        ledgerId: 'led-sgst-output',
        debit: 0,
        credit: calculation.totalSgst,
        sgstAmount: calculation.totalSgst,
        narration: `Output SGST for Invoice #${invoiceNumber}`
      });
    }

    if (calculation.totalIgst > 0) {
      voucherLines.push({
        ledgerId: 'led-igst-output',
        debit: 0,
        credit: calculation.totalIgst,
        igstAmount: calculation.totalIgst,
        narration: `Output IGST for Invoice #${invoiceNumber}`
      });
    }

    // Line 4: Credit Freight / Cold-Chain Income
    const charges = round2(calculation.freightCharges + calculation.otherCharges);
    if (charges > 0) {
      voucherLines.push({
        ledgerId: 'led-freight-cold-chain',
        debit: 0,
        credit: charges,
        narration: `Transport & Cold-chain charges for Invoice #${invoiceNumber}`
      });
    }

    // Line 5: Round-Off Balancing
    if (calculation.roundOff !== 0) {
      if (calculation.roundOff > 0) {
        voucherLines.push({
          ledgerId: 'led-retained-earnings',
          debit: 0,
          credit: calculation.roundOff,
          narration: 'Round off fraction'
        });
      } else {
        voucherLines.push({
          ledgerId: 'led-retained-earnings',
          debit: Math.abs(calculation.roundOff),
          credit: 0,
          narration: 'Round off fraction'
        });
      }
    }

    // Post to authoritative double-entry engine
    const voucher = accountingEngine.postVoucher({
      voucherType: 'SALES_INVOICE',
      date: invoiceDate,
      referenceNumber: invoiceNumber,
      narration: `Tax Invoice #${invoiceNumber} for ${payload.customerName} - Total: ₹${calculation.finalTotal.toLocaleString('en-IN')}`,
      lines: voucherLines,
      entityType: 'CUSTOMER_ORDER',
      entityId: payload.id || invoiceNumber,
      idempotencyKey
    }, {
      id: user.id,
      name: user.name,
      role: user.role || 'ACCOUNTS_STAFF'
    });

    // 8. Create Final Sales Invoice Record
    const postedInvoice: SalesInvoice = {
      id: payload.id && payload.id.startsWith('sinv-') ? payload.id : `sinv-${Date.now()}`,
      invoiceNumber,
      invoiceDate,
      dueDate: payload.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'POSTED',
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerCode: payload.customerCode || debtorLedger.accountNumber,
      customerGstin: payload.customerGstin || '',
      customerPan: payload.customerPan || '',
      customerState: payload.customerState || 'Maharashtra',
      customerStateCode,
      billingAddress: payload.billingAddress || '',
      shippingAddress: payload.shippingAddress || payload.billingAddress || '',
      placeOfSupply: payload.placeOfSupply || `${payload.customerState || 'Maharashtra'} (${customerStateCode})`,
      poNumber: payload.poNumber || '',
      paymentTerms: payload.paymentTerms || '30 Days Credit Line',
      salesperson: payload.salesperson || user.name,
      deliveryReference: payload.deliveryReference || '',
      narration: payload.narration || '',
      termsAndConditions: payload.termsAndConditions || '1. Goods once sold are not returnable without cold-chain verification.\n2. Overdue payments attract 18% p.a. interest.',
      items: calculation.items,
      grossSubtotal: calculation.grossSubtotal,
      itemDiscountsTotal: calculation.itemDiscountsTotal,
      invoiceDiscountType: payload.invoiceDiscountType || 'FIXED',
      invoiceDiscountValue: Number(payload.invoiceDiscountValue || 0),
      invoiceDiscountAmount: calculation.invoiceDiscountAmount,
      taxableAmount: calculation.taxableAmount,
      totalCgst: calculation.totalCgst,
      totalSgst: calculation.totalSgst,
      totalIgst: calculation.totalIgst,
      totalTax: calculation.totalTax,
      freightCharges: calculation.freightCharges,
      otherCharges: calculation.otherCharges,
      roundOff: calculation.roundOff,
      finalTotal: calculation.finalTotal,
      amountReceived: calculation.amountReceived,
      outstandingBalance: calculation.outstandingBalance,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      idempotencyKey,
      stockMovementIds,
      createdById: user.id,
      createdByName: user.name,
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // If existing draft had same ID, replace it; else unshift
    const existingIdx = this.invoices.findIndex(inv => inv.id === postedInvoice.id);
    if (existingIdx >= 0) {
      this.invoices[existingIdx] = postedInvoice;
    } else {
      this.invoices.unshift(postedInvoice);
    }

    this.persistInvoices();
    return postedInvoice;
    } catch (err: any) {
      console.error(`[SalesInvoiceEngine] Invoice posting failed, executing compensating rollback:`, err.message);
      // COMPENSATING ROLLBACK: Restore deducted batch stocks and product stocks
      deductionsToRollback.forEach(({ batch, qty, prodId }) => {
        batch.availableStock = round2(batch.availableStock + qty);
        if (productsDb && prodId) {
          const prod = productsDb.find((p: any) => p.id === prodId);
          if (prod) {
            prod.stockQuantity = Number(prod.stockQuantity || 0) + qty;
          }
        }
      });
      if (inventoryMovementsDb && movementsToRollback.length > 0) {
        for (const movId of movementsToRollback) {
          const idx = inventoryMovementsDb.findIndex(m => m.id === movId);
          if (idx >= 0) inventoryMovementsDb.splice(idx, 1);
        }
      }
      this.persistBatches();
      throw err;
    }
  }

  // ============================================================================
  // CANCEL INVOICE (SAFE REVERSAL, STOCK RESTORATION & VOUCHER CANCELLATION)
  // ============================================================================

  public cancelInvoice(
    invoiceId: string,
    reason: string,
    user: { id: string; name: string; role?: string },
    inventoryMovementsDb?: any[],
    productsDb?: any[]
  ): SalesInvoice {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found.`);
    }

    if (invoice.status === 'CANCELLED') {
      throw new Error(`Invoice ${invoice.invoiceNumber} is already cancelled.`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required to safely cancel an invoice.');
    }

    // 1. If Posted, restore batch quantities and record reversal movements
    if (invoice.status === 'POSTED') {
      invoice.items.forEach((item, idx) => {
        const batch = this.getBatch(item.productId, item.batchNumber);
        if (batch) {
          batch.availableStock = round2(batch.availableStock + item.quantity);
        }

        if (productsDb) {
          const prod = productsDb.find((p: any) => p.id === item.productId);
          if (prod) {
            prod.stockQuantity = Number(prod.stockQuantity || 0) + item.quantity;
          }
        }

        if (inventoryMovementsDb) {
          inventoryMovementsDb.unshift({
            id: `mov-rev-${Date.now()}-${idx}`,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            type: 'ADJUSTMENT_ADD',
            quantity: item.quantity,
            previousStock: batch ? batch.availableStock - item.quantity : 0,
            newStock: batch ? batch.availableStock : item.quantity,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            reason: `Reversal: Sales Invoice #${invoice.invoiceNumber} cancelled (${reason})`,
            performedBy: user.name,
            createdAt: new Date().toISOString()
          });
        }
      });
      this.persistBatches();

      // Cancel linked double-entry voucher
      if (invoice.voucherId) {
        try {
          accountingEngine.cancelVoucher(
            invoice.voucherId,
            `Sales Invoice #${invoice.invoiceNumber} cancelled: ${reason}`,
            {
              id: user.id,
              name: user.name,
              role: user.role || 'SUPER_ADMIN'
            }
          );
        } catch (vchErr: any) {
          console.warn('[SalesInvoiceEngine] Warning cancelling linked voucher:', vchErr.message);
        }
      }
    }

    // 2. Mark Invoice as CANCELLED
    invoice.status = 'CANCELLED';
    invoice.cancelledAt = new Date().toISOString();
    invoice.cancelledBy = user.name;
    invoice.cancellationReason = reason;
    invoice.updatedAt = new Date().toISOString();

    this.persistInvoices();
    return invoice;
  }

  // ============================================================================
  // QUERY & FILTER INVOICES
  // ============================================================================

  public getInvoices(filters: {
    search?: string;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    productId?: string;
  } = {}): SalesInvoice[] {
    let result = [...this.invoices];

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(inv => inv.status === filters.status);
    }

    if (filters.customerId && filters.customerId !== 'ALL') {
      result = result.filter(inv => inv.customerId === filters.customerId);
    }

    if (filters.startDate) {
      result = result.filter(inv => inv.invoiceDate >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter(inv => inv.invoiceDate <= filters.endDate!);
    }

    if (filters.productId && filters.productId !== 'ALL') {
      result = result.filter(inv => inv.items.some(it => it.productId === filters.productId));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerCode && inv.customerCode.toLowerCase().includes(q)) ||
        (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
        inv.items.some(it =>
          it.productName.toLowerCase().includes(q) ||
          it.sku.toLowerCase().includes(q) ||
          it.batchNumber.toLowerCase().includes(q)
        )
      );
    }

    return result;
  }

  public getInvoiceById(id: string): SalesInvoice | undefined {
    return this.invoices.find(inv => inv.id === id || inv.invoiceNumber === id);
  }
}

// Singleton Instance
export const salesInvoiceEngine = new SalesInvoiceEngine();
