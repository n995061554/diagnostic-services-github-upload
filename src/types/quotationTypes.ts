/**
 * QUOTATION MANAGEMENT SYSTEM TYPINGS
 * Project: Diagnostic Services
 * Requirement: ANTIGRAVITY IMPLEMENTATION PROMPT — QUOTATION MANAGEMENT MODULE
 */

export type QuotationStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type GstRate = 5 | 12 | 18 | 28;

export interface QuotationItem {
  id: string;
  productId?: string;
  productName: string;
  productDescription?: string;
  unitPrice: number;
  quantity: number;
  taxableValue: number; // unitPrice * quantity
  gstRate: GstRate; // 5, 12, 18, 28
  gstAmount: number; // taxableValue * gstRate / 100
  totalAmount: number; // taxableValue + gstAmount
  hsnCode?: string;
}

export interface QuotationRevision {
  revisionNumber: number;
  revisedAt: string;
  revisedByUserId: string;
  revisedByName: string;
  reason: string;
  previousGrandTotal: number;
  snapshot: any; // complete snapshot of the quotation at that revision
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "DS-QT-2026-0001"
  quotationDate: string; // YYYY-MM-DD
  validUntilDate?: string; // YYYY-MM-DD
  
  // Customer Details
  customerId?: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail?: string;
  customerGstin?: string;
  customerState?: string;
  customerStateCode?: string;

  // Metadata
  subject: string;
  reference?: string;

  // Items & Calculations
  items: QuotationItem[];
  subtotal: number; // Sum of taxable values
  totalGst: number; // Sum of GST amounts
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  isInterState?: boolean;
  grandTotal: number; // Subtotal + Total GST

  // Notes & Terms
  notes?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  validityTerms?: string;
  standardTermsApplied?: boolean;

  // Letterhead, Signatures & Stamp
  hasLetterhead: boolean; // Option A (true) vs Option B (false)
  signatoryName?: string;
  signatoryDesignation?: string;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signatureVersion?: string;

  // Status & Governance
  status: QuotationStatus;
  statusHistory?: Array<{
    id: string;
    fromStatus: QuotationStatus;
    toStatus: QuotationStatus;
    changedAt: string;
    changedByUserId: string;
    changedByName: string;
    reason?: string;
  }>;

  // Version Control & Revisions
  revisionNumber: number; // 0 for initial, 1, 2... for revisions
  originalQuotationId?: string;
  revisions?: QuotationRevision[];

  // Audit info
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedByUserId?: string;
  updatedByName?: string;
  updatedAt: string;
}

export interface QuotationSettings {
  companyName: string;
  companyLegalName?: string;
  companyLogoUrl?: string;
  companyAddressLine1: string;
  companyCity: string;
  companyState: string;
  companyPincode: string;
  companyStateCode: string;
  companyPhone: string;
  companyEmail: string;
  companyGstin: string;
  companyWebsite?: string;

  // Standard terms maintained by Super Admin
  standardPaymentTerms: string;
  standardDeliveryTerms: string;
  standardWarrantyTerms: string;
  standardValidityTerms: string;
  standardDefaultNotes: string;

  // Official Signature & Company Stamp
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signatureVersion: string;

  // Numbering
  nextSequence: number;
  prefix: string; // e.g. "DS-QT-2026-"
}

export interface QuotationFilter {
  searchQuery?: string;
  status?: QuotationStatus | 'ALL';
  customerId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  createdBy?: string;
}

export interface QuotationSummaryReport {
  totalCount: number;
  totalValue: number;
  draftCount: number;
  draftValue: number;
  finalizedCount: number;
  finalizedValue: number;
  sentCount: number;
  sentValue: number;
  acceptedCount: number;
  acceptedValue: number;
  rejectedCount: number;
  rejectedValue: number;
  expiredCount: number;
  cancelledCount: number;
  gstBreakdown: {
    gst5: { taxable: number; gst: number; total: number };
    gst12: { taxable: number; gst: number; total: number };
    gst18: { taxable: number; gst: number; total: number };
    gst28: { taxable: number; gst: number; total: number };
  };
}

