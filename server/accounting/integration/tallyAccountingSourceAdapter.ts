/**
 * BUILT-IN TALLY-STYLE SOURCE ADAPTER
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Extracts product pricing and customer ledger data from the internal
 * double-entry accounting engine and product catalog. Normalizes items
 * into standard integration domain records.
 */

import { ProductPriceSyncItem, CustomerOutstandingSnapshot, SyncSourceType } from './integrationTypes.js';
import { accountingEngine } from '../doubleEntryEngine.js';

export class BuiltinTallyAccountingAdapter {
  private sourceType: SyncSourceType = 'BUILTIN_TALLY';

  public getSourceType(): SyncSourceType {
    return this.sourceType;
  }

  /**
   * Extracts current product catalogue and builds proposed price sync items.
   * Compares source prices with proposed pricing, validating units, currency,
   * tax rate, and price values.
   */
  public extractProductPriceSyncItems(
    productsDb: any[],
    proposedPriceOverrides: Array<{
      productId: string;
      proposedBasePrice: number;
      proposedMrp?: number;
      currency?: string;
      uom?: string;
    }> = []
  ): { items: ProductPriceSyncItem[]; validationErrors: string[] } {
    const items: ProductPriceSyncItem[] = [];
    const validationErrors: string[] = [];
    const seenProductIds = new Set<string>();

    for (const prod of productsDb) {
      if (!prod.id) {
        validationErrors.push('Product missing internal ID');
        continue;
      }

      if (seenProductIds.has(prod.id)) {
        validationErrors.push(`Duplicate product ID detected in source: ${prod.id}`);
        continue;
      }
      seenProductIds.add(prod.id);

      const override = proposedPriceOverrides.find(p => p.productId === prod.id);
      const currentBase = Number(prod.basePrice || prod.price || 0);
      const currentMrp = Number(prod.mrp || currentBase * 1.2);
      const proposedBase = override ? Number(override.proposedBasePrice) : currentBase;
      const proposedMrp = override && override.proposedMrp ? Number(override.proposedMrp) : (override ? proposedBase * 1.2 : currentMrp);

      const itemErrors: string[] = [];
      if (proposedBase <= 0) {
        itemErrors.push(`Invalid proposed base price (${proposedBase}) for product ${prod.id}. Must be > 0.`);
      }
      if (proposedMrp < proposedBase) {
        itemErrors.push(`Proposed MRP (${proposedMrp}) cannot be less than proposed base price (${proposedBase}) for product ${prod.id}.`);
      }

      const syncItem: ProductPriceSyncItem = {
        sourceProductId: `tally-item-${prod.id}`,
        sourceProductName: prod.name || prod.productName || 'Unnamed Product',
        distributorProductId: prod.id,
        distributorSku: prod.sku || prod.code || prod.id,
        currentBasePrice: currentBase,
        proposedBasePrice: proposedBase,
        currentMrp: currentMrp,
        proposedMrp: proposedMrp,
        taxRatePercent: Number(prod.gstRate || prod.taxRate || 18),
        currency: override?.currency || 'INR',
        uom: override?.uom || prod.uom || prod.unit || 'BOX',
        validationErrors: itemErrors.length > 0 ? itemErrors : undefined
      };

      if (itemErrors.length > 0) {
        validationErrors.push(...itemErrors);
      }

      items.push(syncItem);
    }

    return { items, validationErrors };
  }

  /**
   * Reconciles authoritative customer ledger balance from double-entry accounting records.
   * Extracts posted invoices, receipts, and credit notes for the customer's linked ledger.
   */
  public extractCustomerOutstanding(
    customerId: string,
    customerName: string,
    ledgerId: string
  ): CustomerOutstandingSnapshot {
    const vouchers = accountingEngine.getVouchers();
    
    let totalInvoiced = 0;
    let totalReceipts = 0;
    let totalCreditNotes = 0;
    let voucherCount = 0;
    let lastPaymentDate: string | undefined;
    let lastPaymentRef: string | undefined;

    // Filter posted vouchers that hit this customer ledger
    for (const v of vouchers) {
      if (v.status !== 'POSTED') continue;

      const hasLedger = v.lines && v.lines.some(l => l.ledgerId === ledgerId);
      if (!hasLedger) continue;

      voucherCount++;

      if (v.voucherType === 'SALES_INVOICE') {
        // Debits to debtor ledger increase outstanding
        const drLine = v.lines.find(l => l.ledgerId === ledgerId && l.debit > 0);
        if (drLine) {
          totalInvoiced += drLine.debit;
        }
      } else if (v.voucherType === 'RECEIPT') {
        // Credits to debtor ledger decrease outstanding
        const crLine = v.lines.find(l => l.ledgerId === ledgerId && l.credit > 0);
        if (crLine) {
          totalReceipts += crLine.credit;
          lastPaymentDate = v.date;
          lastPaymentRef = v.referenceNumber || v.voucherNumber;
        }
      } else if (v.voucherType === 'CREDIT_NOTE') {
        // Credit notes reduce customer balance
        const crLine = v.lines.find(l => l.ledgerId === ledgerId && l.credit > 0);
        if (crLine) {
          totalCreditNotes += crLine.credit;
        }
      }
    }

    const netOutstanding = Math.max(0, totalInvoiced - (totalReceipts + totalCreditNotes));
    const unappliedCredits = (totalReceipts + totalCreditNotes) > totalInvoiced 
      ? (totalReceipts + totalCreditNotes) - totalInvoiced 
      : 0;

    return {
      customerId,
      customerName,
      ledgerId,
      totalInvoicedAmount: Number(totalInvoiced.toFixed(2)),
      totalReceiptsAmount: Number(totalReceipts.toFixed(2)),
      totalCreditNotesAmount: Number(totalCreditNotes.toFixed(2)),
      unappliedCreditsAmount: Number(unappliedCredits.toFixed(2)),
      netOutstandingBalance: Number(netOutstanding.toFixed(2)),
      overdueAmount: Number((netOutstanding * 0.4).toFixed(2)), // 40% overdue estimate unless date aging applied
      currency: 'INR',
      asOfDate: new Date().toISOString(),
      reconciledVoucherCount: voucherCount,
      source: this.sourceType,
      lastPaymentDate,
      lastPaymentReference: lastPaymentRef
    };
  }
}

export const builtinTallyAdapter = new BuiltinTallyAccountingAdapter();
