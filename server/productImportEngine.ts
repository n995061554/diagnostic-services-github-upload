import * as XLSX from 'xlsx';

export interface ProductImportConfig {
  requireApprovalForProductImport: boolean;
  maxBatchSize: number;
  allowAutoCreateMissingCategories: boolean;
  enforceColdChainStorageRule: boolean;
}

export let importConfigSettings: ProductImportConfig = {
  requireApprovalForProductImport: false, // Default optional for product imports as per specs
  maxBatchSize: 1000,
  allowAutoCreateMissingCategories: false,
  enforceColdChainStorageRule: true,
};

export interface RowValidationIssue {
  rowNumber: number; // 1-based Excel row number (Row 1 is headers, data starts at Row 2)
  column: string;
  field: string;
  value?: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidatedProductRow {
  rowNumber: number;
  sku: string;
  name: string;
  companyNameOrCode: string;
  companyId?: string;
  brand?: string;
  productType: string;
  categoryNameOrCode: string;
  categoryId?: string;
  subcategoryNameOrCode?: string;
  subcategoryId?: string;
  description?: string;
  classification?: 'EQUIPMENT' | 'REAGENT' | string;
  compatibleEquipment?: string;
  compatibleEquipmentProductIds?: string[];
  compatibleEquipmentModels?: string[];
  compatibleCompany?: string;
  testParameter?: string;
  method?: string;
  packSize: string;
  unit: string;
  testsPerPack?: number;
  storageCondition: string;
  isColdChain: boolean;
  shelfLifeMonths?: number;
  manufacturerPartNumber?: string;
  hsnCode: string;
  basePrice: number;
  mrp: number;
  gstRate: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  allowOnlineOrder: boolean;
  inquiryOnly: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER';
  productStatus: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  imageFileName?: string;
  imageUrl?: string;
  resolvedImageUrl?: string;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  isExisting: boolean;
  existingProductId?: string;
  errors: RowValidationIssue[];
  warnings: RowValidationIssue[];
  isValid: boolean;
}

export interface ProductImportBatchEntity {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: string;
  importMode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE';
  status:
    | 'UPLOADED'
    | 'VALIDATING'
    | 'VALIDATION_FAILED'
    | 'READY_FOR_REVIEW'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'IMPORTING'
    | 'COMPLETED'
    | 'PARTIALLY_FAILED'
    | 'FAILED'
    | 'CANCELLED';
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newProductsCount: number;
  updatedProductsCount: number;
  skippedRowsCount: number;
  requiresApproval: boolean;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectedByUserId?: string;
  rejectedByUserName?: string;
  rejectedAt?: string;
  rejectionNotes?: string;
  completedAt?: string;
  errorMessage?: string;
  issues: RowValidationIssue[];
  parsedRows: ValidatedProductRow[];
  attachedImageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Initial In-Memory Batches Store
export let productImportBatchesDb: ProductImportBatchEntity[] = [
  {
    id: 'batch-imp-001',
    batchNumber: 'IMP-2026-08-01',
    fileName: 'Clinical_Chemistry_Reagents_Batch_Q3.xlsx',
    fileSizeBytes: 48200,
    uploadedByUserId: 'u-staff-01',
    uploadedByUserName: 'Amit Pandey',
    uploadedByUserEmail: 'dispatch.staff@a2zdiagnostic.com',
    uploadedByUserRole: 'OFFICE_STAFF',
    importMode: 'CREATE_ONLY',
    status: 'COMPLETED',
    totalRows: 6,
    validRows: 6,
    errorRows: 0,
    warningRows: 1,
    newProductsCount: 6,
    updatedProductsCount: 0,
    skippedRowsCount: 0,
    requiresApproval: true,
    approvedByUserId: 'u-admin-01',
    approvedByUserName: 'Dr. Rajesh Verma',
    approvedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    approvalNotes: 'Verified against Agappe and Erba Q3 official price master sheets.',
    completedAt: new Date(Date.now() - 3600000 * 24 * 2 + 120000).toISOString(),
    issues: [
      {
        rowNumber: 4,
        column: 'Shelf Life',
        field: 'shelfLifeMonths',
        value: 12,
        message: 'Shelf life is relatively short (12 months). Verified with supplier batch.',
        severity: 'WARNING',
      },
    ],
    parsedRows: [],
    attachedImageCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2 - 600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2 + 120000).toISOString(),
  },
  {
    id: 'batch-imp-002',
    batchNumber: 'IMP-2026-08-02',
    fileName: 'Sysmex_Hematology_Controls_Import.xlsx',
    fileSizeBytes: 32400,
    uploadedByUserId: 'u-staff-01',
    uploadedByUserName: 'Amit Pandey',
    uploadedByUserEmail: 'dispatch.staff@a2zdiagnostic.com',
    uploadedByUserRole: 'OFFICE_STAFF',
    importMode: 'CREATE_AND_UPDATE',
    status: 'READY_FOR_REVIEW',
    totalRows: 5,
    validRows: 5,
    errorRows: 0,
    warningRows: 0,
    newProductsCount: 3,
    updatedProductsCount: 2,
    skippedRowsCount: 0,
    requiresApproval: false,
    issues: [],
    parsedRows: [],
    attachedImageCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

// Sample template rows representing real diagnostic industry products
export const SAMPLE_TEMPLATE_PRODUCTS = [
  {
    'Product Code / SKU': 'AGP-GLUC-HK-500',
    'Product Name': 'Agappe Glucose Hexokinase Liquid Stable Reagent 500 mL',
    'Company': 'Agappe Diagnostics',
    'Brand': 'Mispa Reagents',
    'Product Type': 'REAGENT',
    'Category': 'Clinical Chemistry',
    'Subcategory': 'Biochemistry Liquid Reagents',
    'Product Description': 'Enzymatic UV Hexokinase method for precise glucose determination in serum or plasma. High linearity up to 800 mg/dL.',
    'Classification': 'REAGENT',
    'Compatible Equipment': 'Erba XL-200, Mispa Plus, Roche Cobas c311',
    'Compatible Company': 'Agappe, Transasia, Roche',
    'Test / Parameter': 'Glucose / Hexokinase',
    'Method': 'Hexokinase Enzymatic UV',
    'Pack Size': '4 x 125 mL',
    'Unit': 'Kit',
    'Tests Per Pack': 500,
    'Storage Condition': '2°C - 8°C (Cold Chain)',
    'Shelf Life (Months)': 18,
    'Manufacturer Part Number': '11401004',
    'HSN Code': '38220090',
    'Standard List Price': 3450.00,
    'MRP': 4100.00,
    'Tax / GST Rate (%)': 12,
    'Minimum Order Quantity': 1,
    'Maximum Order Quantity': 100,
    'Allow Online Order': 'YES',
    'Inquiry Only': 'NO',
    'Track Inventory': 'YES',
    'Stock Quantity': 85,
    'Product Status': 'ACTIVE',
    'Image File Name': 'AGP-GLUC-HK-500.jpg',
    'Image URL': 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80',
  },
  {
    'Product Code / SKU': 'SYS-CELLPACK-DCL',
    'Product Name': 'Sysmex CELLPACK DCL 20L Automated Hematology Diluent',
    'Company': 'Sysmex India',
    'Brand': 'Sysmex Core',
    'Product Type': 'REAGENT',
    'Category': 'Hematology & Coagulation',
    'Subcategory': '5-Part Diff & Retic Reagents',
    'Product Description': 'Dedicated isotonic sheath and diluent reagent for Sysmex XN-Series and XN-L automated 5-part hematology analyzers.',
    'Classification': 'REAGENT',
    'Compatible Equipment': 'Sysmex XN-330, Sysmex XN-550, Sysmex XN-1000',
    'Compatible Company': 'Sysmex',
    'Test / Parameter': 'CBC 5-Part Differential / Reticulocyte',
    'Method': 'Fluorescent Flow Cytometry Sheath',
    'Pack Size': '20 Litre Cubitainer',
    'Unit': 'Drum',
    'Tests Per Pack': 1200,
    'Storage Condition': '15°C - 25°C (Ambient)',
    'Shelf Life (Months)': 24,
    'Manufacturer Part Number': '954-0011-2',
    'HSN Code': '38220090',
    'Standard List Price': 12400.00,
    'MRP': 14500.00,
    'Tax / GST Rate (%)': 12,
    'Minimum Order Quantity': 1,
    'Maximum Order Quantity': 20,
    'Allow Online Order': 'YES',
    'Inquiry Only': 'NO',
    'Track Inventory': 'YES',
    'Stock Quantity': 45,
    'Product Status': 'ACTIVE',
    'Image File Name': 'SYS-CELLPACK-DCL.png',
    'Image URL': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  },
  {
    'Product Code / SKU': 'ERB-XL200-AUTO',
    'Product Name': 'Erba XL-200 Fully Automated Random Access Clinical Chemistry Analyzer',
    'Company': 'Transasia Bio-Medicals',
    'Brand': 'Erba Mannheim',
    'Product Type': 'EQUIPMENT',
    'Category': 'Diagnostic Instruments & Analyzers',
    'Subcategory': '',
    'Product Description': 'Benchtop automated analyzer with throughput of 200 photometric tests/hour. Features 80 reagent positions, refrigerated carousel, and static photometer.',
    'Classification': 'EQUIPMENT',
    'Compatible Equipment': 'Erba XL Reagents, Mispa Systems',
    'Compatible Company': 'Transasia, Agappe',
    'Test / Parameter': 'Multiparameter Clinical Chemistry & Immunoturbidimetry',
    'Method': 'Direct Photometry with Diffraction Grating',
    'Pack Size': '1 Complete Unit',
    'Unit': 'Unit',
    'Tests Per Pack': 0,
    'Storage Condition': '15°C - 30°C (Ambient)',
    'Shelf Life (Months)': 120,
    'Manufacturer Part Number': 'XL200-IND',
    'HSN Code': '90278090',
    'Standard List Price': 650000.00,
    'MRP': 750000.00,
    'Tax / GST Rate (%)': 18,
    'Minimum Order Quantity': 1,
    'Maximum Order Quantity': 5,
    'Allow Online Order': 'NO',
    'Inquiry Only': 'YES',
    'Track Inventory': 'YES',
    'Stock Quantity': 4,
    'Product Status': 'ACTIVE',
    'Image File Name': 'ERB-XL200-AUTO.jpg',
    'Image URL': 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=600&q=80',
  },
  {
    'Product Code / SKU': 'BRD-LYPHO-QC',
    'Product Name': 'Bio-Rad Liquid Assayed Multiqual Control Level 1, 2, 3 (Tri-Level QC)',
    'Company': 'Bio-Rad Laboratories',
    'Brand': 'Bio-Rad QC',
    'Product Type': 'CONTROL_CALIBRATOR',
    'Category': 'Clinical Chemistry',
    'Subcategory': 'Calibrators & Multi- Sera QC',
    'Product Description': 'Human serum based multianalyte liquid control with more than 80 analytes including enzymes, electrolytes, lipids, and proteins.',
    'Classification': 'REAGENT',
    'Compatible Equipment': 'Universal Open Analyzers, Roche Cobas, Beckman AU480, Mindray BS-240',
    'Compatible Company': 'Bio-Rad, Roche, Beckman, Mindray',
    'Test / Parameter': 'Multianalyte Assayed Quality Control',
    'Method': 'Tri-Level Assayed Human Matrix',
    'Pack Size': '12 x 5 mL (4 each level)',
    'Unit': 'Box',
    'Tests Per Pack': 360,
    'Storage Condition': '-20°C to -10°C (Frozen / Cold Chain)',
    'Shelf Life (Months)': 24,
    'Manufacturer Part Number': '694X-BIO',
    'HSN Code': '38220090',
    'Standard List Price': 18500.00,
    'MRP': 21900.00,
    'Tax / GST Rate (%)': 12,
    'Minimum Order Quantity': 1,
    'Maximum Order Quantity': 50,
    'Allow Online Order': 'YES',
    'Inquiry Only': 'NO',
    'Track Inventory': 'YES',
    'Stock Quantity': 22,
    'Product Status': 'ACTIVE',
    'Image File Name': 'BRD-LYPHO-QC.png',
    'Image URL': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
  },
  {
    'Product Code / SKU': 'SD-DENGUE-DUO',
    'Product Name': 'Standard Diagnostics Bioline Dengue Duo NS1 Ag + IgG/IgM Rapid Test Cards',
    'Company': 'Abbott Diagnostics',
    'Brand': 'SD Bioline',
    'Product Type': 'RAPID_KIT',
    'Category': 'Point of Care & Rapid Cards',
    'Subcategory': 'Infectious Disease Cards',
    'Product Description': 'Rapid immunochromatographic assay for simultaneous detection of Dengue NS1 antigen and IgG/IgM antibodies in human whole blood/serum.',
    'Classification': 'REAGENT',
    'Compatible Equipment': 'Point-of-Care Visual Lateral Flow',
    'Compatible Company': 'Universal',
    'Test / Parameter': 'Dengue NS1 Ag & IgG/IgM',
    'Method': 'Immunochromatography Rapid Card',
    'Pack Size': '25 Tests / Box',
    'Unit': 'Box',
    'Tests Per Pack': 25,
    'Storage Condition': '2°C - 30°C (Ambient)',
    'Shelf Life (Months)': 24,
    'Manufacturer Part Number': '11FK46',
    'HSN Code': '38220090',
    'Standard List Price': 3800.00,
    'MRP': 4500.00,
    'Tax / GST Rate (%)': 12,
    'Minimum Order Quantity': 2,
    'Maximum Order Quantity': 500,
    'Allow Online Order': 'YES',
    'Inquiry Only': 'NO',
    'Track Inventory': 'YES',
    'Stock Quantity': 120,
    'Product Status': 'ACTIVE',
    'Image File Name': 'SD-DENGUE-DUO.jpg',
    'Image URL': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
  },
];

/**
 * Builds the official Excel Template workbook with multi-sheet validation references
 */
export function buildProductImportWorkbook(
  companies: Array<{ code: string; name: string; country: string }>,
  categories: Array<{ code: string; name: string; level: number; parentId?: string | null }>
): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Product Import Template with pre-filled sample rows
  const wsData = XLSX.utils.json_to_sheet(SAMPLE_TEMPLATE_PRODUCTS);
  XLSX.utils.book_append_sheet(wb, wsData, 'Product_Master_Import');

  // Sheet 2: Companies Reference
  const compData = companies.map(c => ({
    'Company Code': c.code,
    'Company Name': c.name,
    'Country of Origin': c.country,
  }));
  const wsComp = XLSX.utils.json_to_sheet(compData);
  XLSX.utils.book_append_sheet(wb, wsComp, 'OEM_Companies_Reference');

  // Sheet 3: Categories Reference
  const catData = categories.map(cat => ({
    'Category Code': cat.code,
    'Category Name': cat.name,
    'Level': cat.level === 0 ? 'Root Category' : cat.level === 1 ? 'Subcategory' : 'Sub-sub Category',
  }));
  const wsCat = XLSX.utils.json_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Categories_Reference');

  // Sheet 4: Product Types Reference
  const typesData = [
    { 'Product Type Code': 'REAGENT', 'Description': 'Liquid stable, lyophilized or powdered diagnostic biochemical / clinical reagents' },
    { 'Product Type Code': 'EQUIPMENT', 'Description': 'Automated or semi-automated diagnostic instruments, analyzers, centrifuges' },
    { 'Product Type Code': 'RAPID_KIT', 'Description': 'Point-of-care rapid immunochromatographic cassette/strip test kits' },
    { 'Product Type Code': 'CONTROL_CALIBRATOR', 'Description': 'Tri-level QC, multiparameter calibrators, reference standards' },
    { 'Product Type Code': 'PLASTIC_CONSUMABLE', 'Description': 'Micropipette tips, sample cups, cuvettes, centrifuge tubes' },
    { 'Product Type Code': 'BLOOD_COLLECTION_TUBE', 'Description': 'Vacuum EDTA, Plain, Gel Clot, Sodium Fluoride, Heparin collection tubes' },
    { 'Product Type Code': 'URINE_STRIP', 'Description': '10-parameter / 11-parameter automated and visual urine test strips' },
    { 'Product Type Code': 'MICROBIOLOGY', 'Description': 'Prepared agar culture media, antibiotic sensitivity discs, blood culture bottles' },
    { 'Product Type Code': 'FINE_CHEMICAL', 'Description': 'Staining solutions, pure analytical chemicals, buffer salts, formalin' },
  ];
  const wsTypes = XLSX.utils.json_to_sheet(typesData);
  XLSX.utils.book_append_sheet(wb, wsTypes, 'Product_Types_Reference');

  // Sheet 5: Instructions & Validation Rules
  const instructionsData = [
    { 'Rule #': 1, 'Topic': 'Product Code / SKU', 'Mandatory': 'YES', 'Details': 'Must be unique across catalog in CREATE ONLY mode. Alphanumeric, spaces allowed but uppercase recommended (e.g. AGP-GLUC-500).' },
    { 'Rule #': 2, 'Topic': 'Product Name', 'Mandatory': 'YES', 'Details': 'Full official commercial product title. Min 3 characters.' },
    { 'Rule #': 3, 'Topic': 'Company / Brand', 'Mandatory': 'YES', 'Details': 'Must match an existing company name or code in OEM_Companies_Reference.' },
    { 'Rule #': 4, 'Topic': 'Category & Subcategory', 'Mandatory': 'YES', 'Details': 'Must match an existing category in Categories_Reference. Subcategory is optional if root category suffices.' },
    { 'Rule #': 5, 'Topic': 'Pricing & MRP', 'Mandatory': 'YES', 'Details': 'Standard List Price and MRP must be numeric >= 0. MRP should be >= Standard List Price.' },
    { 'Rule #': 6, 'Topic': 'Customer-Specific Pricing', 'Mandatory': 'N/A', 'Details': 'Customer-specific contract rates, hospital slabs, and discounts are NOT handled via Product Import. They remain in the separate Contract Pricing engine.' },
    { 'Rule #': 7, 'Topic': 'Tax / GST Rate (%)', 'Mandatory': 'YES', 'Details': 'Valid values: 0, 5, 12, 18, 28 (Standard diagnostic reagents: 12%, instruments: 18%).' },
    { 'Rule #': 8, 'Topic': 'Cold Chain & Storage', 'Mandatory': 'NO', 'Details': 'If storage condition contains "2°C" or "cold" or "frozen", Cold Chain flag is automatically set to TRUE.' },
    { 'Rule #': 9, 'Topic': 'Image File Linking', 'Mandatory': 'NO', 'Details': 'Provide filename (e.g. AGP-001.jpg) matching uploaded image files, or provide direct Image URL.' },
    { 'Rule #': 10, 'Topic': 'Import Modes', 'Mandatory': 'YES', 'Details': 'CREATE ONLY (default, rejects existing), UPDATE ONLY (modifies existing SKUs), CREATE AND UPDATE (upserts all).' },
  ];
  const wsRules = XLSX.utils.json_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, wsRules, 'Instructions_And_Rules');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
}

/**
 * Validates raw rows against Product Master constraints and returns detailed issues and parsed records
 */
export function validateProductImportRows(
  rawRows: any[],
  mode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE',
  companiesDb: Array<{ id: string; code: string; name: string }>,
  categoriesDb: Array<{ id: string; code: string; name: string; parentId?: string | null }>,
  productsDb: Array<{ id: string; sku: string; name: string }>,
  imageMap?: Record<string, string> // imageFileName -> base64/url
): {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newProductsCount: number;
  updatedProductsCount: number;
  skippedRowsCount: number;
  issues: RowValidationIssue[];
  parsedRows: ValidatedProductRow[];
} {
  const issues: RowValidationIssue[] = [];
  const parsedRows: ValidatedProductRow[] = [];
  const seenSkusInFile = new Map<string, number>();

  let validCount = 0;
  let errorCount = 0;
  let warningCount = 0;
  let newCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const validProductTypes = [
    'REAGENT',
    'EQUIPMENT',
    'RAPID_KIT',
    'CONTROL_CALIBRATOR',
    'PLASTIC_CONSUMABLE',
    'BLOOD_COLLECTION_TUBE',
    'URINE_STRIP',
    'MICROBIOLOGY',
    'FINE_CHEMICAL',
  ];

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // Row 1 is header
    const rowErrors: RowValidationIssue[] = [];
    const rowWarnings: RowValidationIssue[] = [];

    // Helper to safely read field from multiple possible key names
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    const getNum = (...keys: string[]): number | undefined => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          const n = Number(row[k]);
          if (!isNaN(n)) return n;
        }
      }
      return undefined;
    };

    const getBool = (...keys: string[]): boolean => {
      const v = getVal(...keys).toUpperCase();
      return v === 'YES' || v === 'TRUE' || v === '1' || v === 'Y';
    };

    // 1. SKU / Product Code
    const rawSku = getVal('Product Code / SKU', 'Product Code', 'SKU', 'sku', 'productCode');
    const sku = rawSku.toUpperCase();

    if (!sku) {
      rowErrors.push({
        rowNumber,
        column: 'Product Code / SKU',
        field: 'sku',
        value: rawSku,
        message: 'Product Code / SKU is required.',
        severity: 'ERROR',
      });
    } else if (seenSkusInFile.has(sku)) {
      rowErrors.push({
        rowNumber,
        column: 'Product Code / SKU',
        field: 'sku',
        value: sku,
        message: `Duplicate Product Code '${sku}' found in uploaded file (also in row ${seenSkusInFile.get(sku)}).`,
        severity: 'ERROR',
      });
    } else {
      seenSkusInFile.set(sku, rowNumber);
    }

    // Existing product lookup
    const existingProduct = productsDb.find(p => p.sku.toUpperCase() === sku);
    const isExisting = !!existingProduct;

    // Mode checking
    let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR' = 'CREATE';
    if (mode === 'CREATE_ONLY') {
      if (isExisting) {
        rowErrors.push({
          rowNumber,
          column: 'Product Code / SKU',
          field: 'sku',
          value: sku,
          message: `Product with SKU '${sku}' already exists in catalog. Current mode is 'CREATE ONLY'. Switch to UPDATE or UPSERT mode to modify existing products.`,
          severity: 'ERROR',
        });
        action = 'ERROR';
      } else {
        action = 'CREATE';
      }
    } else if (mode === 'UPDATE_ONLY') {
      if (!isExisting) {
        rowErrors.push({
          rowNumber,
          column: 'Product Code / SKU',
          field: 'sku',
          value: sku,
          message: `Product with SKU '${sku}' not found in catalog. Current mode is 'UPDATE ONLY'. Switch to CREATE or UPSERT mode to insert new products.`,
          severity: 'ERROR',
        });
        action = 'ERROR';
      } else {
        action = 'UPDATE';
      }
    } else {
      // CREATE_AND_UPDATE (UPSERT)
      action = isExisting ? 'UPDATE' : 'CREATE';
    }

    // 2. Product Name
    const name = getVal('Product Name', 'Name', 'productName', 'name');
    if (!name) {
      rowErrors.push({
        rowNumber,
        column: 'Product Name',
        field: 'name',
        value: name,
        message: 'Product Name is required.',
        severity: 'ERROR',
      });
    } else if (name.length < 3) {
      rowWarnings.push({
        rowNumber,
        column: 'Product Name',
        field: 'name',
        value: name,
        message: 'Product Name is unusually short (less than 3 characters).',
        severity: 'WARNING',
      });
    }

    // 3. Company
    const companyInput = getVal('Company', 'Company Name', 'Company Code', 'company', 'brandCompany');
    let matchedCompany = companiesDb.find(
      c =>
        c.name.toLowerCase() === companyInput.toLowerCase() ||
        c.code.toLowerCase() === companyInput.toLowerCase() ||
        c.name.toLowerCase().includes(companyInput.toLowerCase()) ||
        (companyInput.length > 2 && c.code.toLowerCase().includes(companyInput.toLowerCase()))
    );

    if (!companyInput) {
      rowErrors.push({
        rowNumber,
        column: 'Company',
        field: 'companyId',
        value: companyInput,
        message: 'Company is required.',
        severity: 'ERROR',
      });
    } else if (!matchedCompany) {
      rowErrors.push({
        rowNumber,
        column: 'Company',
        field: 'companyId',
        value: companyInput,
        message: `Company '${companyInput}' not found in registered OEM master. Please register the company or verify spelling.`,
        severity: 'ERROR',
      });
    }

    // 4. Category & Subcategory
    const catInput = getVal('Category', 'Category Name', 'Category Code', 'category');
    const subcatInput = getVal('Subcategory', 'Sub Category', 'subcategory');

    let matchedCategory = categoriesDb.find(
      c =>
        c.name.toLowerCase() === catInput.toLowerCase() ||
        c.code.toLowerCase() === catInput.toLowerCase() ||
        c.name.toLowerCase().includes(catInput.toLowerCase())
    );

    let matchedSubcategory = subcatInput
      ? categoriesDb.find(
          c =>
            c.name.toLowerCase() === subcatInput.toLowerCase() ||
            c.code.toLowerCase() === subcatInput.toLowerCase() ||
            c.name.toLowerCase().includes(subcatInput.toLowerCase())
        )
      : undefined;

    if (!catInput && !subcatInput) {
      rowErrors.push({
        rowNumber,
        column: 'Category',
        field: 'categoryId',
        value: catInput,
        message: 'Category is required.',
        severity: 'ERROR',
      });
    } else if (!matchedCategory && !matchedSubcategory) {
      rowErrors.push({
        rowNumber,
        column: 'Category',
        field: 'categoryId',
        value: catInput,
        message: `Category '${catInput}' not found in Category Master hierarchy.`,
        severity: 'ERROR',
      });
    }

    // If subcategory matched, use it as primary categoryId (or fallback to root)
    const effectiveCategoryId = matchedSubcategory?.id || matchedCategory?.id || categoriesDb[0]?.id;

    // 5. Product Type
    const rawType = getVal('Product Type', 'productType', 'Type').toUpperCase();
    let productType = 'REAGENT';
    if (!rawType) {
      rowWarnings.push({
        rowNumber,
        column: 'Product Type',
        field: 'productType',
        value: rawType,
        message: "Product Type missing. Defaulting to 'REAGENT'.",
        severity: 'WARNING',
      });
    } else if (!validProductTypes.includes(rawType)) {
      rowWarnings.push({
        rowNumber,
        column: 'Product Type',
        field: 'productType',
        value: rawType,
        message: `Unknown Product Type '${rawType}'. Defaulting to 'REAGENT'. Valid types: ${validProductTypes.join(', ')}`,
        severity: 'WARNING',
      });
    } else {
      productType = rawType;
    }

    // 6. Pricing: Base Price & MRP
    const basePrice = getNum('Standard List Price', 'List Price', 'Base Price', 'basePrice', 'price') ?? 0;
    const mrp = getNum('MRP', 'mrp', 'Maximum Retail Price') ?? basePrice;

    if (basePrice < 0) {
      rowErrors.push({
        rowNumber,
        column: 'Standard List Price',
        field: 'basePrice',
        value: basePrice,
        message: 'Standard List Price cannot be negative.',
        severity: 'ERROR',
      });
    }

    if (mrp < basePrice) {
      rowWarnings.push({
        rowNumber,
        column: 'MRP',
        field: 'mrp',
        value: mrp,
        message: `MRP (₹${mrp}) is lower than Standard List Price (₹${basePrice}). Standard practice requires MRP >= List Price.`,
        severity: 'WARNING',
      });
    }

    // 7. GST / Tax Rate
    const rawGst = getNum('Tax / GST Rate (%)', 'GST Rate', 'GST', 'taxRate', 'gstRate') ?? 12;
    const validGstRates = [0, 5, 12, 18, 28];
    let gstRate = rawGst;
    if (!validGstRates.includes(rawGst)) {
      rowWarnings.push({
        rowNumber,
        column: 'Tax / GST Rate (%)',
        field: 'gstRate',
        value: rawGst,
        message: `Non-standard GST rate ${rawGst}%. Typical diagnostic rates are 0%, 5%, 12%, or 18%.`,
        severity: 'WARNING',
      });
    }

    // 8. Order Limits & Inventory
    const minOrderQuantity = getNum('Minimum Order Quantity', 'MOQ', 'minOrderQuantity') ?? 1;
    const maxOrderQuantity = getNum('Maximum Order Quantity', 'Max Order', 'maxOrderQuantity');
    const stockQuantity = getNum('Stock Quantity', 'Stock', 'stockQuantity') ?? 50;

    if (minOrderQuantity < 1) {
      rowWarnings.push({
        rowNumber,
        column: 'Minimum Order Quantity',
        field: 'minOrderQuantity',
        value: minOrderQuantity,
        message: 'Minimum Order Quantity (MOQ) should be at least 1. Setting to 1.',
        severity: 'WARNING',
      });
    }

    // 9. Storage & Cold Chain
    const storageCondition = getVal('Storage Condition', 'Storage', 'storageTemperature') || '15°C to 25°C';
    const isColdChain =
      getBool('Is Cold Chain', 'isColdChain') ||
      storageCondition.toLowerCase().includes('2°c') ||
      storageCondition.toLowerCase().includes('cold') ||
      storageCondition.toLowerCase().includes('frozen') ||
      storageCondition.toLowerCase().includes('-20');

    // 10. Image Linking
    const imageFileName = getVal('Image File Name', 'Image File', 'imageFileName', 'imageFile');
    const imageUrl = getVal('Image URL', 'Image Link', 'imageUrl');

    let resolvedImageUrl = imageUrl;
    if (imageFileName && imageMap && imageMap[imageFileName]) {
      resolvedImageUrl = imageMap[imageFileName];
    } else if (imageFileName && imageMap && imageMap[imageFileName.toLowerCase()]) {
      resolvedImageUrl = imageMap[imageFileName.toLowerCase()];
    } else if (!resolvedImageUrl && imageFileName) {
      rowWarnings.push({
        rowNumber,
        column: 'Image File Name',
        field: 'imageFileName',
        value: imageFileName,
        message: `Image file '${imageFileName}' referenced in Excel was not found in attached image files.`,
        severity: 'WARNING',
      });
    }

    // Optional metadata fields
    const brand = getVal('Brand', 'brand') || matchedCompany?.name || '';
    const description = getVal('Product Description', 'Description', 'description', 'shortDescription');
    const classification = getVal('Classification', 'classification') || (productType === 'EQUIPMENT' ? 'EQUIPMENT' : 'REAGENT');
    const compatibleEquipment = getVal('Compatible Equipment', 'compatibleEquipment', 'Equipment Compatibility');
    const compatibleCompany = getVal('Compatible Company', 'compatibleCompany');
    const testParameter = getVal('Test / Parameter', 'Test Parameter', 'testParameter', 'parameter');
    const method = getVal('Method', 'method', 'Assay Method');
    const packSize = getVal('Pack Size', 'packSize', 'Pack') || '1 Unit';
    const unit = getVal('Unit', 'unit') || 'Pack';
    const testsPerPack = getNum('Tests Per Pack', 'testsPerPack', 'Tests');
    const shelfLifeMonths = getNum('Shelf Life (Months)', 'Shelf Life', 'shelfLifeMonths') || 24;
    const manufacturerPartNumber = getVal('Manufacturer Part Number', 'Catalog Number', 'catalogNumber', 'mpn', 'partNumber');
    const hsnCode = getVal('HSN Code', 'hsnCode', 'HSN') || (productType === 'EQUIPMENT' ? '90278090' : '38220090');
    const allowOnlineOrder = getVal('Allow Online Order') === '' ? true : getBool('Allow Online Order', 'allowOnlineOrder');
    const inquiryOnly = getBool('Inquiry Only', 'inquiryOnly');
    const trackInventory = getVal('Track Inventory') === '' ? true : getBool('Track Inventory', 'trackInventory');
    const rawStatus = getVal('Product Status', 'Status', 'productStatus').toUpperCase();
    const productStatus: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' =
      rawStatus === 'INACTIVE' ? 'INACTIVE' : rawStatus === 'DISCONTINUED' ? 'DISCONTINUED' : 'ACTIVE';

    const isValid = rowErrors.length === 0;

    if (isValid) {
      validCount++;
      if (action === 'CREATE') newCount++;
      if (action === 'UPDATE') updatedCount++;
    } else {
      errorCount++;
    }

    if (rowWarnings.length > 0) {
      warningCount++;
    }

    // Append to global issues
    issues.push(...rowErrors, ...rowWarnings);

    parsedRows.push({
      rowNumber,
      sku: sku || `ROW-${rowNumber}`,
      name: name || `Product Row ${rowNumber}`,
      companyNameOrCode: companyInput,
      companyId: matchedCompany?.id,
      brand,
      productType: productType as any,
      categoryNameOrCode: catInput || subcatInput,
      categoryId: effectiveCategoryId,
      subcategoryNameOrCode: subcatInput,
      subcategoryId: matchedSubcategory?.id,
      description,
      classification,
      compatibleEquipment,
      compatibleCompany,
      testParameter,
      method,
      packSize,
      unit,
      testsPerPack,
      storageCondition,
      isColdChain,
      shelfLifeMonths,
      manufacturerPartNumber,
      hsnCode,
      basePrice,
      mrp,
      gstRate,
      minOrderQuantity: Math.max(1, minOrderQuantity),
      maxOrderQuantity,
      allowOnlineOrder,
      inquiryOnly,
      trackInventory,
      stockQuantity,
      stockStatus: stockQuantity > 10 ? 'IN_STOCK' : stockQuantity > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK',
      productStatus,
      imageFileName,
      imageUrl,
      resolvedImageUrl,
      action: isValid ? action : 'ERROR',
      isExisting,
      existingProductId: existingProduct?.id,
      errors: rowErrors,
      warnings: rowWarnings,
      isValid,
    });
  });

  return {
    totalRows: rawRows.length,
    validRows: validCount,
    errorRows: errorCount,
    warningRows: warningCount,
    newProductsCount: newCount,
    updatedProductsCount: updatedCount,
    skippedRowsCount: skippedCount,
    issues,
    parsedRows,
  };
}
