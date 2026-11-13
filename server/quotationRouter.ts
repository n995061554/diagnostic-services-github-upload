import { Router, Request, Response } from 'express';

export interface QuotationItemEntity {
  id: string;
  productId?: string;
  productName: string;
  productDescription?: string;
  unitPrice: number;
  quantity: number;
  taxableValue: number;
  gstRate: 5 | 12 | 18 | 28;
  gstAmount: number;
  totalAmount: number;
  hsnCode?: string;
}

export interface QuotationRevisionEntity {
  revisionNumber: number;
  revisedAt: string;
  revisedByUserId: string;
  revisedByName: string;
  reason: string;
  previousGrandTotal: number;
  snapshot: any;
}

export interface QuotationEntity {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntilDate?: string;
  customerId?: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail?: string;
  customerGstin?: string;
  customerState?: string;
  customerStateCode?: string;
  subject: string;
  reference?: string;
  items: QuotationItemEntity[];
  subtotal: number;
  totalGst: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  isInterState?: boolean;
  grandTotal: number;
  notes?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  warrantyTerms?: string;
  validityTerms?: string;
  standardTermsApplied?: boolean;
  hasLetterhead: boolean;
  signatoryName?: string;
  signatoryDesignation?: string;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signatureVersion?: string;
  status: 'DRAFT' | 'FINALIZED' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedAt: string;
    changedByUserId: string;
    changedByName: string;
    reason?: string;
  }>;
  revisionNumber: number;
  originalQuotationId?: string;
  revisions?: QuotationRevisionEntity[];
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedByUserId?: string;
  updatedByName?: string;
  updatedAt: string;
}

export interface QuotationSettingsEntity {
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
  standardPaymentTerms: string;
  standardDeliveryTerms: string;
  standardWarrantyTerms: string;
  standardValidityTerms: string;
  standardDefaultNotes: string;
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signatureVersion: string;
  nextSequence: number;
  prefix: string;
}

export const DEFAULT_QUOTATION_SETTINGS: QuotationSettingsEntity = {
  companyName: "Diagnostic Services",
  companyLegalName: "A2Z Diagnostic Services India Pvt Ltd",
  companyLogoUrl: "",
  companyAddressLine1: "Plot No. 42, Diagnostic Corridor, MIDC Industrial Area, Andheri East",
  companyCity: "Mumbai",
  companyState: "Maharashtra",
  companyPincode: "400093",
  companyStateCode: "27",
  companyPhone: "+91 22 2834-8800",
  companyEmail: "sales@dsdistributor.com",
  companyGstin: "27AABCU9603R1ZM",
  companyWebsite: "https://dsdistributor.com",
  standardPaymentTerms: "Payment strictly within 30 days of invoice date via RTGS / NEFT. 100% advance required for capital biomedical equipment and imported automated analyzers.",
  standardDeliveryTerms: "Standard dispatch within 24 to 48 hours from our central warehouse. Reagent kits handled in validated ambient/controlled storage as per OEM manufacturer specifications.",
  standardWarrantyTerms: "12 months standard OEM manufacturer warranty on analyzers and laboratory instruments from date of installation. Consumables and reagents warranted until stated expiry date.",
  standardValidityTerms: "This quotation remains strictly valid for 30 calendar days from the date of issue, subject to manufacturer price revisions and statutory GST tariff modifications.",
  standardDefaultNotes: "Prices quoted are inclusive of local delivery to laboratory site. Calibration consumables and assay parameter programming included with initial reagent pack.",
  authorizedSignatoryName: "Rajesh Sharma",
  authorizedSignatoryDesignation: "Managing Director / Authorised Signatory",
  signatureImageUrl: "",
  stampImageUrl: "",
  signatureVersion: "v1.0-2026",
  nextSequence: 1003,
  prefix: "DS-QT-2026-"
};

export const INITIAL_SEED_QUOTATIONS: QuotationEntity[] = [
  {
    id: "qt-1001",
    quotationNumber: "DS-QT-2026-1001",
    quotationDate: "2026-10-18",
    validUntilDate: "2026-11-17",
    customerId: "u-cust-01",
    customerName: "Apex Clinical & Pathology Laboratories",
    customerAddress: "402 Medical Arts Building, Relief Road, Ahmedabad, Gujarat - 380001",
    customerPhone: "+91 98250 11223",
    customerEmail: "purchase@apexclinical.com",
    customerGstin: "24AAACA1234A1Z5",
    customerState: "Gujarat",
    customerStateCode: "24",
    subject: "Quotation for Roche cobas c311 Clinical Chemistry Reagents & Calibrators",
    reference: "REQ-APX-2026-8812",
    items: [
      {
        id: "qi-1",
        productId: "prod-001",
        productName: "cobas c311 Albumin Gen 2 Reagent Kit (300 Tests)",
        productDescription: "OEM Roche diagnostic reagent cassette with RFID barcode tracking",
        unitPrice: 4200,
        quantity: 5,
        taxableValue: 21000,
        gstRate: 12,
        gstAmount: 2520,
        totalAmount: 23520,
        hsnCode: "38220090"
      },
      {
        id: "qi-2",
        productId: "prod-002",
        productName: "cobas c311 Bilirubin Total Reagent (250 Tests)",
        productDescription: "Photometric clinical chemistry reagent pack",
        unitPrice: 3800,
        quantity: 4,
        taxableValue: 15200,
        gstRate: 12,
        gstAmount: 1824,
        totalAmount: 17024,
        hsnCode: "38220090"
      },
      {
        id: "qi-3",
        productId: "prod-003",
        productName: "C.f.a.s. Multicalibrator Clinical Chemistry (12 x 3 mL)",
        productDescription: "Universal calibrator for automated clinical chemistry systems",
        unitPrice: 8500,
        quantity: 2,
        taxableValue: 17000,
        gstRate: 18,
        gstAmount: 3060,
        totalAmount: 20060,
        hsnCode: "38220090"
      }
    ],
    subtotal: 53200,
    totalGst: 7404,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 7404,
    isInterState: true,
    grandTotal: 60604,
    notes: "Prices valid for quarterly supply agreement. Includes lot-to-lot calibration protocol support.",
    paymentTerms: "30 Days Net from date of delivery.",
    deliveryTerms: "Doorstep delivery via express diagnostic cargo within 48 hours.",
    warrantyTerms: "OEM warranty on shelf-life until expiry (minimum 8 months remaining).",
    validityTerms: "Valid for 30 days from 18 October 2026.",
    standardTermsApplied: true,
    hasLetterhead: true,
    signatoryName: "Rajesh Sharma",
    signatoryDesignation: "Managing Director / Authorised Signatory",
    status: "FINALIZED",
    statusHistory: [
      {
        id: "sh-1",
        fromStatus: "DRAFT",
        toStatus: "FINALIZED",
        changedAt: "2026-10-18T10:30:00Z",
        changedByUserId: "u-admin-01",
        changedByName: "Rajesh Sharma (Super Admin)",
        reason: "Initial quote finalized and authorized for customer issue."
      }
    ],
    revisionNumber: 0,
    createdByUserId: "u-admin-01",
    createdByName: "Rajesh Sharma",
    createdAt: "2026-10-18T10:15:00Z",
    updatedAt: "2026-10-18T10:30:00Z"
  },
  {
    id: "qt-1002",
    quotationNumber: "DS-QT-2026-1002",
    quotationDate: "2026-10-21",
    validUntilDate: "2026-11-20",
    customerId: "u-cust-02",
    customerName: "Metropolis Clinical Diagnostic Centre",
    customerAddress: "Sunrise Complex, Floor 2, LBS Marg, Powai, Mumbai - 400076",
    customerPhone: "+91 98765 43212",
    customerEmail: "procurement@metropolisdiag.com",
    customerGstin: "27AABCM8899K1Z4",
    customerState: "Maharashtra",
    customerStateCode: "27",
    subject: "Quotation for Mindray Hematology BC-5150 5-Part Diluent & Lyse",
    reference: "MET-HEM-Q4-09",
    items: [
      {
        id: "qi-4",
        productId: "prod-007",
        productName: "M-52D Diluent for Mindray 5-Part Hematology (20 Litres)",
        productDescription: "Dedicated isotonic diluent container for automated blood counting",
        unitPrice: 5600,
        quantity: 6,
        taxableValue: 33600,
        gstRate: 12,
        gstAmount: 4032,
        totalAmount: 37632,
        hsnCode: "38220090"
      },
      {
        id: "qi-5",
        productId: "prod-008",
        productName: "M-52LH Lyse Reagent (500 mL x 2)",
        productDescription: "Hemoglobin cyan-free reagent bottle set",
        unitPrice: 4900,
        quantity: 3,
        taxableValue: 14700,
        gstRate: 12,
        gstAmount: 1764,
        totalAmount: 16464,
        hsnCode: "38220090"
      }
    ],
    subtotal: 48300,
    totalGst: 5796,
    cgstAmount: 2898,
    sgstAmount: 2898,
    igstAmount: 0,
    isInterState: false,
    grandTotal: 54096,
    notes: "Local Maharashtra delivery. CGST (6%) and SGST (6%) applied.",
    paymentTerms: "Payment via NEFT within 15 days.",
    deliveryTerms: "Same-day dispatch from Mumbai warehouse.",
    warrantyTerms: "100% replacement warranty in case of transit leakage.",
    validityTerms: "Valid for 30 calendar days.",
    standardTermsApplied: true,
    hasLetterhead: true,
    signatoryName: "Rajesh Sharma",
    signatoryDesignation: "Managing Director / Authorised Signatory",
    status: "DRAFT",
    statusHistory: [],
    revisionNumber: 0,
    createdByUserId: "u-office-01",
    createdByName: "Priya Sharma (Office Admin)",
    createdAt: "2026-10-21T14:00:00Z",
    updatedAt: "2026-10-21T14:00:00Z"
  }
];

export function createQuotationRouter(
  quotationsDb: QuotationEntity[],
  quotationSettings: QuotationSettingsEntity,
  auditLogsDb: any[],
  onSaveCallback?: () => void
): Router {
  const router = Router();

  const persist = () => {
    if (onSaveCallback) {
      try {
        onSaveCallback();
      } catch (err) {
        console.error('[QuotationRouter] Error executing persist callback:', err);
      }
    }
  };

  const recordAudit = (req: Request, action: string, quotationId: string, details: any) => {
    const user = (req as any).user;
    auditLogsDb.push({
      id: `aud-qt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.id || 'system',
      userRole: user?.roleType || 'SUPER_ADMIN',
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'System',
      action,
      module: 'QUOTATION_MANAGEMENT',
      resourceType: 'QUOTATION',
      resourceId: quotationId,
      status: 'SUCCESS',
      details,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  };

  // 1. GET /api/v1/quotations - List quotations with search, filters and pagination
  router.get('/', (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const {
        search,
        status,
        customerId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        createdBy
      } = req.query;

      let list = [...quotationsDb];

      // Record visibility filtering for non-superadmin
      if (user && user.roleType !== 'SUPER_ADMIN') {
        if (user.dataScope === 'OWN') {
          list = list.filter(q => q.createdByUserId === user.id);
        } else if (user.dataScope === 'ASSIGNED' && Array.isArray(user.assignedCustomerIds)) {
          list = list.filter(q => q.customerId && user.assignedCustomerIds.includes(q.customerId));
        }
      }

      // Filter by Search Query (Quotation Number, Customer Name, Subject, Phone)
      if (search && typeof search === 'string') {
        const qLower = search.toLowerCase().trim();
        list = list.filter(q =>
          q.quotationNumber.toLowerCase().includes(qLower) ||
          q.customerName.toLowerCase().includes(qLower) ||
          q.subject.toLowerCase().includes(qLower) ||
          (q.customerPhone && q.customerPhone.includes(qLower)) ||
          (q.reference && q.reference.toLowerCase().includes(qLower))
        );
      }

      // Filter by Status
      if (status && typeof status === 'string' && status !== 'ALL') {
        list = list.filter(q => q.status === status);
      }

      // Filter by Customer
      if (customerId && typeof customerId === 'string') {
        list = list.filter(q => q.customerId === customerId);
      }

      // Filter by Date Range
      if (startDate && typeof startDate === 'string') {
        list = list.filter(q => q.quotationDate >= startDate);
      }
      if (endDate && typeof endDate === 'string') {
        list = list.filter(q => q.quotationDate <= endDate);
      }

      // Filter by Amount
      if (minAmount) {
        const min = Number(minAmount);
        if (!isNaN(min)) list = list.filter(q => q.grandTotal >= min);
      }
      if (maxAmount) {
        const max = Number(maxAmount);
        if (!isNaN(max)) list = list.filter(q => q.grandTotal <= max);
      }

      // Filter by Creator
      if (createdBy && typeof createdBy === 'string') {
        list = list.filter(q => q.createdByUserId === createdBy || q.createdByName.toLowerCase().includes(createdBy.toLowerCase()));
      }

      // Sort: newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        total: list.length,
        quotations: list
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to list quotations' });
    }
  });

  // 2. GET /api/v1/quotations/settings - Get company letterhead, signature & standard terms
  router.get('/settings', (req: Request, res: Response) => {
    res.json({
      success: true,
      settings: quotationSettings
    });
  });

  // 3. POST /api/v1/quotations/settings - Update company quotation settings (Super Admin only)
  router.post('/settings', (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (user && user.roleType !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, error: 'Only Super Admin can update quotation settings and standard terms.' });
      }

      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid settings body' });
      }

      // Update fields
      if (body.companyName) quotationSettings.companyName = String(body.companyName);
      if (body.companyLegalName !== undefined) quotationSettings.companyLegalName = String(body.companyLegalName);
      if (body.companyLogoUrl !== undefined) quotationSettings.companyLogoUrl = String(body.companyLogoUrl);
      if (body.companyAddressLine1) quotationSettings.companyAddressLine1 = String(body.companyAddressLine1);
      if (body.companyCity) quotationSettings.companyCity = String(body.companyCity);
      if (body.companyState) quotationSettings.companyState = String(body.companyState);
      if (body.companyPincode) quotationSettings.companyPincode = String(body.companyPincode);
      if (body.companyStateCode) quotationSettings.companyStateCode = String(body.companyStateCode);
      if (body.companyPhone) quotationSettings.companyPhone = String(body.companyPhone);
      if (body.companyEmail) quotationSettings.companyEmail = String(body.companyEmail);
      if (body.companyGstin) quotationSettings.companyGstin = String(body.companyGstin);
      if (body.companyWebsite !== undefined) quotationSettings.companyWebsite = String(body.companyWebsite);

      if (body.standardPaymentTerms !== undefined) quotationSettings.standardPaymentTerms = String(body.standardPaymentTerms);
      if (body.standardDeliveryTerms !== undefined) quotationSettings.standardDeliveryTerms = String(body.standardDeliveryTerms);
      if (body.standardWarrantyTerms !== undefined) quotationSettings.standardWarrantyTerms = String(body.standardWarrantyTerms);
      if (body.standardValidityTerms !== undefined) quotationSettings.standardValidityTerms = String(body.standardValidityTerms);
      if (body.standardDefaultNotes !== undefined) quotationSettings.standardDefaultNotes = String(body.standardDefaultNotes);

      if (body.authorizedSignatoryName) quotationSettings.authorizedSignatoryName = String(body.authorizedSignatoryName);
      if (body.authorizedSignatoryDesignation) quotationSettings.authorizedSignatoryDesignation = String(body.authorizedSignatoryDesignation);
      if (body.signatureImageUrl !== undefined) quotationSettings.signatureImageUrl = String(body.signatureImageUrl);
      if (body.stampImageUrl !== undefined) quotationSettings.stampImageUrl = String(body.stampImageUrl);
      if (body.signatureVersion) quotationSettings.signatureVersion = String(body.signatureVersion);
      if (body.prefix) quotationSettings.prefix = String(body.prefix);

      recordAudit(req, 'UPDATE_QUOTATION_SETTINGS', 'settings', { updatedSettings: quotationSettings });
      persist();

      res.json({
        success: true,
        message: 'Quotation settings and company letterhead updated successfully.',
        settings: quotationSettings
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update quotation settings' });
    }
  });

  // 4. GET /api/v1/quotations/summary-report - Aggregated KPI metrics & reports
  router.get('/summary-report', (req: Request, res: Response) => {
    try {
      const totalCount = quotationsDb.length;
      let totalValue = 0;
      let draftCount = 0;
      let draftValue = 0;
      let finalizedCount = 0;
      let finalizedValue = 0;
      let sentCount = 0;
      let sentValue = 0;
      let acceptedCount = 0;
      let acceptedValue = 0;
      let rejectedCount = 0;
      let rejectedValue = 0;
      let expiredCount = 0;
      let cancelledCount = 0;

      const gstBreakdown = {
        gst5: { taxable: 0, gst: 0, total: 0 },
        gst12: { taxable: 0, gst: 0, total: 0 },
        gst18: { taxable: 0, gst: 0, total: 0 },
        gst28: { taxable: 0, gst: 0, total: 0 }
      };

      for (const q of quotationsDb) {
        totalValue += q.grandTotal || 0;
        switch (q.status) {
          case 'DRAFT':
            draftCount++;
            draftValue += q.grandTotal || 0;
            break;
          case 'FINALIZED':
            finalizedCount++;
            finalizedValue += q.grandTotal || 0;
            break;
          case 'SENT':
            sentCount++;
            sentValue += q.grandTotal || 0;
            break;
          case 'ACCEPTED':
            acceptedCount++;
            acceptedValue += q.grandTotal || 0;
            break;
          case 'REJECTED':
            rejectedCount++;
            rejectedValue += q.grandTotal || 0;
            break;
          case 'EXPIRED':
            expiredCount++;
            break;
          case 'CANCELLED':
            cancelledCount++;
            break;
        }

        if (Array.isArray(q.items)) {
          for (const it of q.items) {
            const rateKey = `gst${it.gstRate}` as keyof typeof gstBreakdown;
            if (gstBreakdown[rateKey]) {
              gstBreakdown[rateKey].taxable += Number(it.taxableValue) || 0;
              gstBreakdown[rateKey].gst += Number(it.gstAmount) || 0;
              gstBreakdown[rateKey].total += Number(it.totalAmount) || 0;
            }
          }
        }
      }

      res.json({
        success: true,
        report: {
          totalCount,
          totalValue: Math.round(totalValue * 100) / 100,
          draftCount,
          draftValue: Math.round(draftValue * 100) / 100,
          finalizedCount,
          finalizedValue: Math.round(finalizedValue * 100) / 100,
          sentCount,
          sentValue: Math.round(sentValue * 100) / 100,
          acceptedCount,
          acceptedValue: Math.round(acceptedValue * 100) / 100,
          rejectedCount,
          rejectedValue: Math.round(rejectedValue * 100) / 100,
          expiredCount,
          cancelledCount,
          gstBreakdown: {
            gst5: { taxable: Math.round(gstBreakdown.gst5.taxable * 100) / 100, gst: Math.round(gstBreakdown.gst5.gst * 100) / 100, total: Math.round(gstBreakdown.gst5.total * 100) / 100 },
            gst12: { taxable: Math.round(gstBreakdown.gst12.taxable * 100) / 100, gst: Math.round(gstBreakdown.gst12.gst * 100) / 100, total: Math.round(gstBreakdown.gst12.total * 100) / 100 },
            gst18: { taxable: Math.round(gstBreakdown.gst18.taxable * 100) / 100, gst: Math.round(gstBreakdown.gst18.gst * 100) / 100, total: Math.round(gstBreakdown.gst18.total * 100) / 100 },
            gst28: { taxable: Math.round(gstBreakdown.gst28.taxable * 100) / 100, gst: Math.round(gstBreakdown.gst28.gst * 100) / 100, total: Math.round(gstBreakdown.gst28.total * 100) / 100 }
          }
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to generate quotation report' });
    }
  });

  // 5. GET /api/v1/quotations/:id - Get single quotation with details
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const q = quotationsDb.find(item => item.id === req.params.id || item.quotationNumber === req.params.id);
      if (!q) {
        return res.status(404).json({ success: false, error: 'Quotation not found' });
      }
      res.json({ success: true, quotation: q });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to retrieve quotation' });
    }
  });

  // Helper for decimal-safe line item calculation
  const calculateItemsAndTotals = (rawItems: any[], customerStateCode?: string) => {
    const isInterState = customerStateCode && quotationSettings.companyStateCode
      ? customerStateCode.trim() !== quotationSettings.companyStateCode.trim()
      : false;

    let subtotal = 0;
    let totalGst = 0;

    const validatedItems: QuotationItemEntity[] = rawItems.map((item, idx) => {
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const taxableValue = Math.round(unitPrice * quantity * 100) / 100;

      // Validate allowed GST rates
      const rawGst = Number(item.gstRate);
      const gstRate: 5 | 12 | 18 | 28 = ([5, 12, 18, 28].includes(rawGst) ? rawGst : 18) as any;

      const gstAmount = Math.round(taxableValue * (gstRate / 100) * 100) / 100;
      const totalAmount = Math.round((taxableValue + gstAmount) * 100) / 100;

      subtotal += taxableValue;
      totalGst += gstAmount;

      return {
        id: item.id || `qi-${Date.now()}-${idx}`,
        productId: item.productId || undefined,
        productName: String(item.productName || 'Unspecified Diagnostic Product').trim(),
        productDescription: item.productDescription ? String(item.productDescription).trim() : undefined,
        unitPrice,
        quantity,
        taxableValue,
        gstRate,
        gstAmount,
        totalAmount,
        hsnCode: item.hsnCode ? String(item.hsnCode).trim() : '38220090'
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    totalGst = Math.round(totalGst * 100) / 100;
    const grandTotal = Math.round((subtotal + totalGst) * 100) / 100;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstAmount = totalGst;
    } else {
      cgstAmount = Math.round((totalGst / 2) * 100) / 100;
      sgstAmount = Math.round((totalGst - cgstAmount) * 100) / 100;
    }

    return {
      items: validatedItems,
      subtotal,
      totalGst,
      cgstAmount,
      sgstAmount,
      igstAmount,
      isInterState,
      grandTotal
    };
  };

  // 6. POST /api/v1/quotations - Create new quotation
  router.post('/', (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const body = req.body;

      if (!body.customerName || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ success: false, error: 'Customer Name and at least one Product item are required.' });
      }

      // Generate next quotation number
      const sequenceNum = quotationSettings.nextSequence || 1001;
      const quotationNumber = `${quotationSettings.prefix || 'DS-QT-2026-'}${sequenceNum}`;
      quotationSettings.nextSequence = sequenceNum + 1;

      const customerStateCode = body.customerStateCode || (body.customerGstin ? body.customerGstin.substring(0, 2) : undefined);
      const { items, subtotal, totalGst, cgstAmount, sgstAmount, igstAmount, isInterState, grandTotal } =
        calculateItemsAndTotals(body.items, customerStateCode);

      const quotationDate = body.quotationDate || new Date().toISOString().split('T')[0];
      // Default validity 30 days
      const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const newQuotation: QuotationEntity = {
        id: `qt-${Date.now()}`,
        quotationNumber,
        quotationDate,
        validUntilDate: body.validUntilDate || defaultValidUntil,
        customerId: body.customerId || undefined,
        customerName: String(body.customerName).trim(),
        customerAddress: String(body.customerAddress || '').trim(),
        customerPhone: String(body.customerPhone || '').trim(),
        customerEmail: body.customerEmail ? String(body.customerEmail).trim() : undefined,
        customerGstin: body.customerGstin ? String(body.customerGstin).trim() : undefined,
        customerState: body.customerState ? String(body.customerState).trim() : undefined,
        customerStateCode,
        subject: String(body.subject || 'Commercial Diagnostic Products Quotation').trim(),
        reference: body.reference ? String(body.reference).trim() : undefined,
        items,
        subtotal,
        totalGst,
        cgstAmount,
        sgstAmount,
        igstAmount,
        isInterState,
        grandTotal,
        notes: body.notes !== undefined ? String(body.notes) : quotationSettings.standardDefaultNotes,
        paymentTerms: body.paymentTerms !== undefined ? String(body.paymentTerms) : quotationSettings.standardPaymentTerms,
        deliveryTerms: body.deliveryTerms !== undefined ? String(body.deliveryTerms) : quotationSettings.standardDeliveryTerms,
        warrantyTerms: body.warrantyTerms !== undefined ? String(body.warrantyTerms) : quotationSettings.standardWarrantyTerms,
        validityTerms: body.validityTerms !== undefined ? String(body.validityTerms) : quotationSettings.standardValidityTerms,
        standardTermsApplied: body.standardTermsApplied !== false,
        hasLetterhead: body.hasLetterhead !== false, // Defaults to Option A: With Letterhead
        signatoryName: quotationSettings.authorizedSignatoryName,
        signatoryDesignation: quotationSettings.authorizedSignatoryDesignation,
        signatureImageUrl: quotationSettings.signatureImageUrl,
        stampImageUrl: quotationSettings.stampImageUrl,
        signatureVersion: quotationSettings.signatureVersion,
        status: body.status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT',
        statusHistory: [
          {
            id: `sh-${Date.now()}`,
            fromStatus: 'NONE',
            toStatus: body.status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT',
            changedAt: new Date().toISOString(),
            changedByUserId: user?.id || 'u-admin-01',
            changedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Super Admin',
            reason: body.status === 'FINALIZED' ? 'Quotation created and finalized' : 'Initial quotation draft created'
          }
        ],
        revisionNumber: 0,
        revisions: [],
        createdByUserId: user?.id || 'u-admin-01',
        createdByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Super Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      quotationsDb.unshift(newQuotation);
      recordAudit(req, 'CREATE_QUOTATION', newQuotation.id, {
        quotationNumber: newQuotation.quotationNumber,
        customerName: newQuotation.customerName,
        grandTotal: newQuotation.grandTotal,
        status: newQuotation.status
      });
      persist();

      res.status(201).json({
        success: true,
        message: `Quotation ${newQuotation.quotationNumber} created successfully.`,
        quotation: newQuotation
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to create quotation' });
    }
  });

  // 7. PUT /api/v1/quotations/:id - Edit existing quotation (with Revision history if finalized)
  router.put('/:id', (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const idx = quotationsDb.findIndex(q => q.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Quotation not found' });
      }

      const existing = quotationsDb[idx];
      const body = req.body;

      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one Product item is required.' });
      }

      const customerStateCode = body.customerStateCode || (body.customerGstin ? body.customerGstin.substring(0, 2) : existing.customerStateCode);
      const { items, subtotal, totalGst, cgstAmount, sgstAmount, igstAmount, isInterState, grandTotal } =
        calculateItemsAndTotals(body.items, customerStateCode);

      // Invariant: If quotation is already FINALIZED or SENT, retain original version snapshot as a Revision
      let revisions = existing.revisions || [];
      let revisionNumber = existing.revisionNumber || 0;

      if (existing.status === 'FINALIZED' || existing.status === 'SENT') {
        revisionNumber += 1;
        const snapshot = JSON.parse(JSON.stringify(existing));
        delete snapshot.revisions; // avoid recursive nesting
        revisions = [
          ...revisions,
          {
            revisionNumber,
            revisedAt: new Date().toISOString(),
            revisedByUserId: user?.id || 'u-admin-01',
            revisedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User',
            reason: body.revisionReason || 'Quotation terms or items updated after finalization',
            previousGrandTotal: existing.grandTotal,
            snapshot
          }
        ];
      }

      const updatedQuotation: QuotationEntity = {
        ...existing,
        quotationDate: body.quotationDate || existing.quotationDate,
        validUntilDate: body.validUntilDate || existing.validUntilDate,
        customerId: body.customerId !== undefined ? body.customerId : existing.customerId,
        customerName: body.customerName ? String(body.customerName).trim() : existing.customerName,
        customerAddress: body.customerAddress !== undefined ? String(body.customerAddress).trim() : existing.customerAddress,
        customerPhone: body.customerPhone !== undefined ? String(body.customerPhone).trim() : existing.customerPhone,
        customerEmail: body.customerEmail !== undefined ? String(body.customerEmail).trim() : existing.customerEmail,
        customerGstin: body.customerGstin !== undefined ? String(body.customerGstin).trim() : existing.customerGstin,
        customerState: body.customerState !== undefined ? String(body.customerState).trim() : existing.customerState,
        customerStateCode,
        subject: body.subject ? String(body.subject).trim() : existing.subject,
        reference: body.reference !== undefined ? String(body.reference).trim() : existing.reference,
        items,
        subtotal,
        totalGst,
        cgstAmount,
        sgstAmount,
        igstAmount,
        isInterState,
        grandTotal,
        notes: body.notes !== undefined ? String(body.notes) : existing.notes,
        paymentTerms: body.paymentTerms !== undefined ? String(body.paymentTerms) : existing.paymentTerms,
        deliveryTerms: body.deliveryTerms !== undefined ? String(body.deliveryTerms) : existing.deliveryTerms,
        warrantyTerms: body.warrantyTerms !== undefined ? String(body.warrantyTerms) : existing.warrantyTerms,
        validityTerms: body.validityTerms !== undefined ? String(body.validityTerms) : existing.validityTerms,
        hasLetterhead: body.hasLetterhead !== undefined ? Boolean(body.hasLetterhead) : existing.hasLetterhead,
        status: body.status || existing.status,
        revisionNumber,
        revisions,
        updatedByUserId: user?.id || 'u-admin-01',
        updatedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User',
        updatedAt: new Date().toISOString()
      };

      quotationsDb[idx] = updatedQuotation;
      recordAudit(req, 'EDIT_QUOTATION', updatedQuotation.id, {
        quotationNumber: updatedQuotation.quotationNumber,
        revisionNumber: updatedQuotation.revisionNumber,
        grandTotal: updatedQuotation.grandTotal
      });
      persist();

      res.json({
        success: true,
        message: `Quotation ${updatedQuotation.quotationNumber} updated successfully${revisionNumber > 0 ? ` (Revision ${revisionNumber})` : ''}.`,
        quotation: updatedQuotation
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update quotation' });
    }
  });

  // 8. PATCH /api/v1/quotations/:id/status - Update quotation status
  router.patch('/:id/status', (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const idx = quotationsDb.findIndex(q => q.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Quotation not found' });
      }

      const { newStatus, reason } = req.body;
      const validStatuses = ['DRAFT', 'FINALIZED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      const existing = quotationsDb[idx];
      const fromStatus = existing.status;

      const historyItem = {
        id: `sh-${Date.now()}`,
        fromStatus,
        toStatus: newStatus,
        changedAt: new Date().toISOString(),
        changedByUserId: user?.id || 'u-admin-01',
        changedByName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User',
        reason: reason ? String(reason).trim() : undefined
      };

      existing.status = newStatus;
      existing.statusHistory = [...(existing.statusHistory || []), historyItem];
      existing.updatedByUserId = user?.id;
      existing.updatedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined;
      existing.updatedAt = new Date().toISOString();

      recordAudit(req, 'CHANGE_QUOTATION_STATUS', existing.id, {
        quotationNumber: existing.quotationNumber,
        fromStatus,
        toStatus: newStatus,
        reason
      });
      persist();

      res.json({
        success: true,
        message: `Quotation ${existing.quotationNumber} status updated to ${newStatus}.`,
        quotation: existing
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update status' });
    }
  });

  return router;
}

