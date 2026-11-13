import * as XLSX from 'xlsx';

export interface RowValidationIssue {
  rowNumber: number;
  column: string;
  field: string;
  value?: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

// ============================================================================
// 1. PHASE 3A: CUSTOMER MASTER IMPORT ENGINE
// ============================================================================

export interface CustomerValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newCustomersCount: number;
  updatedCustomersCount: number;
  skippedRowsCount: number;
  issues: RowValidationIssue[];
  validatedRows: any[];
}

export function validateCustomerImportRows(
  rawRows: any[],
  mode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE',
  existingUsers: any[],
  existingCompanies: any[]
): CustomerValidationResult {
  const issues: RowValidationIssue[] = [];
  const validatedRows: any[] = [];
  const seenCustomerCodes = new Set<string>();
  const seenGstins = new Set<string>();

  const validCustomerTypes = ['PATHOLOGY_LAB', 'HOSPITAL', 'DIAGNOSTIC_CENTER', 'CLINIC', 'RESEARCH_INSTITUTE'];
  const validDiscountTiers = ['TIER_A_15PCT', 'TIER_B_10PCT', 'TIER_C_5PCT', 'STANDARD_NET'];
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'ON_HOLD', 'LEAD'];

  let newCount = 0;
  let updateCount = 0;
  let skippedCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header
    const rowErrors: RowValidationIssue[] = [];
    const rowWarnings: RowValidationIssue[] = [];

    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    const customerCode = getVal(['Customer Code', 'CustomerCode', 'customer_code', 'Code', 'CUSTOMER_CODE']).toUpperCase();
    const labName = getVal(['Lab / Hospital Name', 'Lab Name', 'Hospital Name', 'Customer Name', 'customer_name', 'lab_name', 'Name']);
    let customerType = getVal(['Customer Type', 'CustomerType', 'customer_type', 'Type']).toUpperCase().replace(/[\s-]/g, '_');
    const contactPerson = getVal(['Contact Person', 'Contact Person Name', 'contact_person', 'Contact', 'Doctor / In-Charge Name']);
    const designation = getVal(['Designation', 'Role', 'designation', 'Contact Designation']) || 'Lab Director';
    const phone = getVal(['Mobile / Phone', 'Phone', 'Mobile', 'phone', 'mobile', 'Contact Phone']);
    const email = getVal(['Email Address', 'Email', 'email', 'Contact Email']).toLowerCase();
    const gstin = getVal(['GSTIN', 'GST Number', 'gstin', 'gst_number']).toUpperCase();
    const panNumber = getVal(['PAN Number', 'PAN', 'pan', 'pan_number']).toUpperCase();
    const drugLicenseNo = getVal(['Drug License No', 'Drug License', 'drug_license', 'DL Number']);
    const clinicalEstablishmentNo = getVal(['Clinical Establishment Reg No', 'CER No', 'clinical_establishment_no', 'Registration No']);
    const billingAddress1 = getVal(['Billing Address Line 1', 'Billing Address', 'Address Line 1', 'address', 'Address']);
    const billingAddress2 = getVal(['Billing Address Line 2', 'Address Line 2', 'Billing Line 2']);
    const city = getVal(['City', 'city', 'Billing City']);
    const state = getVal(['State', 'state', 'Billing State']) || 'Maharashtra';
    const pincode = getVal(['Pincode', 'PIN', 'Postal Code', 'pincode', 'zip']);
    const shippingAddress1 = getVal(['Shipping Address Line 1', 'Shipping Address', 'shipping_address']);
    const shippingCity = getVal(['Shipping City', 'shipping_city']) || city;
    const shippingState = getVal(['Shipping State', 'shipping_state']) || state;
    const shippingPincode = getVal(['Shipping Pincode', 'shipping_pincode']) || pincode;
    const territory = getVal(['Territory / Zone', 'Territory', 'Zone', 'territory', 'Region']) || 'MUMBAI_METRO';
    const assignedSalesRep = getVal(['Assigned Sales Rep Email / ID', 'Sales Rep', 'sales_rep', 'Sales Rep Name']);
    const assignedEngineer = getVal(['Assigned Engineer Email / ID', 'Service Engineer', 'engineer', 'service_engineer']);
    const creditLimitRaw = getVal(['Credit Limit (INR)', 'Credit Limit', 'credit_limit', 'CreditLimit']);
    const creditDaysRaw = getVal(['Credit Days', 'Payment Terms', 'credit_days', 'CreditDays']);
    let discountTier = getVal(['Discount Tier', 'Discount Category', 'discount_tier']).toUpperCase().replace(/[\s-]/g, '_');
    let status = getVal(['Status', 'Account Status', 'status']).toUpperCase();

    // 1. Mandatory Customer Code Check
    if (!customerCode) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCode',
        message: 'Customer Code is strictly required (e.g. CUST-MUM-001).',
        severity: 'ERROR'
      });
    } else if (seenCustomerCodes.has(customerCode)) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCode',
        value: customerCode,
        message: `Duplicate Customer Code '${customerCode}' encountered multiple times in this Excel file.`,
        severity: 'ERROR'
      });
    } else {
      seenCustomerCodes.add(customerCode);
    }

    // 2. Lab / Hospital Name Check
    if (!labName) {
      rowErrors.push({
        rowNumber,
        column: 'Lab / Hospital Name',
        field: 'labName',
        message: 'Lab / Hospital Name is required.',
        severity: 'ERROR'
      });
    }

    // 3. Customer Type Normalization
    if (!customerType) {
      customerType = 'PATHOLOGY_LAB';
    } else if (!validCustomerTypes.includes(customerType)) {
      if (customerType.includes('PATH') || customerType.includes('LAB')) customerType = 'PATHOLOGY_LAB';
      else if (customerType.includes('HOSP')) customerType = 'HOSPITAL';
      else if (customerType.includes('DIAG')) customerType = 'DIAGNOSTIC_CENTER';
      else if (customerType.includes('CLIN')) customerType = 'CLINIC';
      else if (customerType.includes('RES')) customerType = 'RESEARCH_INSTITUTE';
      else {
        rowWarnings.push({
          rowNumber,
          column: 'Customer Type',
          field: 'customerType',
          value: customerType,
          message: `Unrecognized Customer Type '${customerType}'. Defaulting to 'PATHOLOGY_LAB'.`,
          severity: 'WARNING'
        });
        customerType = 'PATHOLOGY_LAB';
      }
    }

    // 4. Contact Person & Phone
    if (!contactPerson) {
      rowWarnings.push({
        rowNumber,
        column: 'Contact Person',
        field: 'contactPerson',
        message: 'Contact Person is empty. Defaulted to Lab Director.',
        severity: 'WARNING'
      });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!phone) {
      rowErrors.push({
        rowNumber,
        column: 'Mobile / Phone',
        field: 'phone',
        message: 'Primary Contact Mobile / Phone is required for OTP login & dispatch alerts.',
        severity: 'ERROR'
      });
    } else if (cleanPhone.length < 10) {
      rowErrors.push({
        rowNumber,
        column: 'Mobile / Phone',
        field: 'phone',
        value: phone,
        message: `Phone number '${phone}' is invalid. Must contain at least 10 digits.`,
        severity: 'ERROR'
      });
    }

    // 5. Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      rowErrors.push({
        rowNumber,
        column: 'Email Address',
        field: 'email',
        message: 'Email Address is required for customer portal authentication.',
        severity: 'ERROR'
      });
    } else if (!emailRegex.test(email)) {
      rowErrors.push({
        rowNumber,
        column: 'Email Address',
        field: 'email',
        value: email,
        message: `Email format '${email}' is invalid.`,
        severity: 'ERROR'
      });
    }

    // 6. GSTIN Validation
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstin) {
      if (!gstinRegex.test(gstin)) {
        rowWarnings.push({
          rowNumber,
          column: 'GSTIN',
          field: 'gstin',
          value: gstin,
          message: `GSTIN '${gstin}' does not match standard 15-digit Indian GST format (e.g. 27AABCA1234F1Z5).`,
          severity: 'WARNING'
        });
      } else if (seenGstins.has(gstin)) {
        rowWarnings.push({
          rowNumber,
          column: 'GSTIN',
          field: 'gstin',
          value: gstin,
          message: `GSTIN '${gstin}' is used by multiple customer records in this import.`,
          severity: 'WARNING'
        });
      } else {
        seenGstins.add(gstin);
      }
    }

    // 7. PAN Validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (panNumber && !panRegex.test(panNumber)) {
      rowWarnings.push({
        rowNumber,
        column: 'PAN Number',
        field: 'panNumber',
        value: panNumber,
        message: `PAN Number '${panNumber}' does not match standard 10-character alphanumeric PAN format.`,
        severity: 'WARNING'
      });
    }

    // 8. Address & Pincode
    if (!billingAddress1) {
      rowErrors.push({
        rowNumber,
        column: 'Billing Address Line 1',
        field: 'billingAddressLine1',
        message: 'Billing Address Line 1 is required.',
        severity: 'ERROR'
      });
    }
    if (!city) {
      rowErrors.push({
        rowNumber,
        column: 'City',
        field: 'city',
        message: 'City is required.',
        severity: 'ERROR'
      });
    }
    if (!pincode) {
      rowErrors.push({
        rowNumber,
        column: 'Pincode',
        field: 'pincode',
        message: 'Pincode is required.',
        severity: 'ERROR'
      });
    } else if (!/^\d{6}$/.test(pincode.replace(/\s/g, ''))) {
      rowWarnings.push({
        rowNumber,
        column: 'Pincode',
        field: 'pincode',
        value: pincode,
        message: `Pincode '${pincode}' is not a standard 6-digit Indian postal code.`,
        severity: 'WARNING'
      });
    }

    // 9. Financial & Credit Terms
    const creditLimit = Number(creditLimitRaw.replace(/[^0-9.]/g, '')) || 100000;
    const creditDays = Number(creditDaysRaw.replace(/[^0-9]/g, '')) || 30;

    if (!validDiscountTiers.includes(discountTier)) {
      discountTier = 'STANDARD_NET';
    }

    if (!status || !validStatuses.includes(status)) {
      status = 'ACTIVE';
    }

    // 10. Existing Customer Lookup
    const existingUser = existingUsers.find(
      (u) =>
        (u.customerCode && u.customerCode.toLowerCase() === customerCode.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === email.toLowerCase()) ||
        (u.labName && u.labName.toLowerCase() === (labName || '').toLowerCase())
    );

    const isExisting = Boolean(existingUser);
    let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR' = 'CREATE';

    if (rowErrors.length > 0) {
      action = 'ERROR';
    } else if (mode === 'CREATE_ONLY') {
      if (isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Customer Code',
          field: 'customerCode',
          value: customerCode,
          message: `Customer already exists (${existingUser?.labName || customerCode}). Skipped because mode is CREATE_ONLY.`,
          severity: 'WARNING'
        });
      } else {
        action = 'CREATE';
        newCount++;
      }
    } else if (mode === 'UPDATE_ONLY') {
      if (!isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Customer Code',
          field: 'customerCode',
          value: customerCode,
          message: `Customer does not exist in master. Skipped because mode is UPDATE_ONLY.`,
          severity: 'WARNING'
        });
      } else {
        action = 'UPDATE';
        updateCount++;
      }
    } else {
      // CREATE_AND_UPDATE
      if (isExisting) {
        action = 'UPDATE';
        updateCount++;
      } else {
        action = 'CREATE';
        newCount++;
      }
    }

    // Push issues
    rowErrors.forEach((e) => issues.push(e));
    rowWarnings.forEach((w) => issues.push(w));

    validatedRows.push({
      rowNumber,
      customerCode,
      labName: labName || `${contactPerson || 'Customer'} Diagnostic Lab`,
      customerType,
      contactPerson: contactPerson || 'Lab Director',
      designation,
      phone: phone || '+91-98000-00000',
      email,
      gstin,
      panNumber,
      drugLicenseNo,
      clinicalEstablishmentNo,
      billingAddressLine1: billingAddress1,
      billingAddressLine2: billingAddress2,
      city,
      state,
      pincode,
      shippingAddressSameAsBilling: !shippingAddress1 || shippingAddress1 === billingAddress1,
      shippingAddressLine1: shippingAddress1 || billingAddress1,
      shippingCity,
      shippingState,
      shippingPincode,
      territory,
      assignedSalesRepId: assignedSalesRep || 'u-sales-01',
      assignedSalesRepName: assignedSalesRep ? 'Assigned Rep' : 'Vikram Malhotra',
      assignedEngineerId: assignedEngineer || 'u-eng-01',
      assignedEngineerName: assignedEngineer ? 'Assigned Engineer' : 'Sameer Joshi',
      creditLimit,
      creditDays,
      discountTier,
      status,
      action,
      isExisting,
      existingCustomerId: existingUser?.id,
      errors: rowErrors,
      warnings: rowWarnings,
      isValid: rowErrors.length === 0 && action !== 'ERROR'
    });
  });

  const errorRowsCount = validatedRows.filter((r) => r.errors.length > 0 || r.action === 'ERROR').length;
  const warningRowsCount = validatedRows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length;
  const validRowsCount = validatedRows.filter((r) => r.isValid && r.action !== 'SKIP').length;

  return {
    totalRows: rawRows.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    warningRows: warningRowsCount,
    newCustomersCount: newCount,
    updatedCustomersCount: updateCount,
    skippedRowsCount: skippedCount,
    issues,
    validatedRows
  };
}

export function generateCustomerExcelTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Customer Code': 'CUST-MUM-010',
      'Lab / Hospital Name': 'Metro Super Speciality Pathology & Research Centre',
      'Customer Type': 'PATHOLOGY_LAB',
      'Contact Person': 'Dr. Rajesh Deshmukh',
      'Designation': 'Head of Pathology',
      'Mobile / Phone': '+91-98200-11223',
      'Email Address': 'dr.deshmukh@metropath.com',
      'GSTIN': '27AABCM9988F1Z2',
      'PAN Number': 'AABCM9988F',
      'Drug License No': 'MH-MZ2-2024-9981',
      'Clinical Establishment Reg No': 'CER-MUM-2023-4412',
      'Billing Address Line 1': 'Unit 301, Lotus Business Park, Off Link Road',
      'Billing Address Line 2': 'Andheri West',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Pincode': '400053',
      'Shipping Address Line 1': 'Central Diagnostic Store, Gr Floor, Lotus Park',
      'Shipping City': 'Mumbai',
      'Shipping State': 'Maharashtra',
      'Shipping Pincode': '400053',
      'Territory / Zone': 'MUMBAI_METRO',
      'Assigned Sales Rep Email / ID': 'vikram.sales@a2zdiagnostic.com',
      'Assigned Engineer Email / ID': 'sameer.service@a2zdiagnostic.com',
      'Credit Limit (INR)': 350000,
      'Credit Days': 30,
      'Discount Tier': 'TIER_A_15PCT',
      'Status': 'ACTIVE'
    },
    {
      'Customer Code': 'CUST-PUN-025',
      'Lab / Hospital Name': 'Ruby Hall Clinical Diagnostic & Imaging Wing',
      'Customer Type': 'HOSPITAL',
      'Contact Person': 'Dr. Meena Iyer',
      'Designation': 'Chief Biochemist',
      'Mobile / Phone': '+91-98500-77661',
      'Email Address': 'procurement@rubyhallclinic.org',
      'GSTIN': '27AAATR5544B1ZV',
      'PAN Number': 'AAATR5544B',
      'Drug License No': 'MH-PUN-2022-7714',
      'Clinical Establishment Reg No': 'CER-PUN-2021-081',
      'Billing Address Line 1': '40 Sassoon Road, Near Railway Station',
      'Billing Address Line 2': 'Sangamvadi',
      'City': 'Pune',
      'State': 'Maharashtra',
      'Pincode': '411001',
      'Shipping Address Line 1': 'Central Lab Stores, Basement Wing B',
      'Shipping City': 'Pune',
      'Shipping State': 'Maharashtra',
      'Shipping Pincode': '411001',
      'Territory / Zone': 'PUNE_WEST',
      'Assigned Sales Rep Email / ID': 'vikram.sales@a2zdiagnostic.com',
      'Assigned Engineer Email / ID': 'sameer.service@a2zdiagnostic.com',
      'Credit Limit (INR)': 500000,
      'Credit Days': 45,
      'Discount Tier': 'TIER_A_15PCT',
      'Status': 'ACTIVE'
    },
    {
      'Customer Code': 'CUST-THN-042',
      'Lab / Hospital Name': 'Zenith Molecular & Haematology Diagnostic Lab',
      'Customer Type': 'DIAGNOSTIC_CENTER',
      'Contact Person': 'Dr. Amit Bansal',
      'Designation': 'Lab Director',
      'Mobile / Phone': '+91-97690-33445',
      'Email Address': 'dr.bansal@zenithlab.in',
      'GSTIN': '27AACFZ8877K1ZD',
      'PAN Number': 'AACFZ8877K',
      'Drug License No': 'MH-THN-2023-1190',
      'Clinical Establishment Reg No': 'CER-THN-2023-552',
      'Billing Address Line 1': 'Shop 14-16, Sai Arcade, Gokhale Road',
      'Billing Address Line 2': 'Naupada',
      'City': 'Thane',
      'State': 'Maharashtra',
      'Pincode': '400602',
      'Shipping Address Line 1': 'Shop 14-16, Sai Arcade, Gokhale Road',
      'Shipping City': 'Thane',
      'Shipping State': 'Maharashtra',
      'Shipping Pincode': '400602',
      'Territory / Zone': 'THANE_NAVI_MUMBAI',
      'Assigned Sales Rep Email / ID': 'vikram.sales@a2zdiagnostic.com',
      'Assigned Engineer Email / ID': 'sameer.service@a2zdiagnostic.com',
      'Credit Limit (INR)': 200000,
      'Credit Days': 15,
      'Discount Tier': 'TIER_B_10PCT',
      'Status': 'ACTIVE'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Customer_Master_Import');

  // Add Reference Reference Sheet
  const refTypes = [
    { 'Allowed Customer Types': 'PATHOLOGY_LAB', Description: 'Standalone or chain pathology labs' },
    { 'Allowed Customer Types': 'HOSPITAL', Description: 'Hospital in-house diagnostic labs' },
    { 'Allowed Customer Types': 'DIAGNOSTIC_CENTER', Description: 'Multi-modality pathology + imaging' },
    { 'Allowed Customer Types': 'CLINIC', Description: 'Daycare or small clinical setups' },
    { 'Allowed Customer Types': 'RESEARCH_INSTITUTE', Description: 'Medical colleges & biotech labs' }
  ];
  const wsRef = XLSX.utils.json_to_sheet(refTypes);
  XLSX.utils.book_append_sheet(wb, wsRef, 'Reference_Values');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

// ============================================================================
// 2. PHASE 4A: CUSTOMER-SPECIFIC PRICE IMPORT ENGINE
// ============================================================================

export interface PriceContractValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newContractsCount: number;
  updatedContractsCount: number;
  skippedRowsCount: number;
  issues: RowValidationIssue[];
  validatedRows: any[];
}

export function validatePriceContractImportRows(
  rawRows: any[],
  mode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE',
  existingUsers: any[],
  existingProducts: any[],
  existingPriceRules: any[] = []
): PriceContractValidationResult {
  const issues: RowValidationIssue[] = [];
  const validatedRows: any[] = [];
  const seenContracts = new Set<string>();

  const validContractTypes = ['CUSTOM_NET_RATE', 'DISCOUNT_PERCENT_ON_MRP', 'DISCOUNT_PERCENT_ON_BASE', 'FLAT_MARGIN_FIXED'];
  let newCount = 0;
  let updateCount = 0;
  let skippedCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: RowValidationIssue[] = [];
    const rowWarnings: RowValidationIssue[] = [];

    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    const customerCodeOrId = getVal(['Customer Code', 'CustomerCode', 'customer_code', 'Customer ID', 'customer_id', 'CUSTOMER_CODE']).toUpperCase();
    const productSku = getVal(['Product SKU', 'ProductSKU', 'sku', 'SKU', 'PRODUCT_SKU', 'Item Code']).toUpperCase();
    let contractType = getVal(['Contract Type', 'ContractType', 'Pricing Type', 'contract_type']).toUpperCase().replace(/[\s-]/g, '_');
    const netPriceRaw = getVal(['Contract Net Price (INR)', 'Contract Net Price', 'Net Price', 'net_price', 'Special Price', 'Custom Price']);
    const discountPercentRaw = getVal(['Discount Percent (%)', 'Discount %', 'Discount', 'discount_percent', 'DiscountPercent']);
    const moqRaw = getVal(['Min Order Quantity (MOQ)', 'MOQ', 'min_order_quantity', 'Min Quantity']);
    const startDate = getVal(['Effective Start Date', 'Start Date', 'start_date', 'Effective Date']) || '2026-04-01';
    const endDate = getVal(['Effective End Date', 'End Date', 'end_date', 'Expiry Date']) || '2027-03-31';
    const priceLockRaw = getVal(['Price Lock Guarantee (YES/NO)', 'Price Lock', 'price_lock', 'Is Price Locked']).toUpperCase();
    const notes = getVal(['Contract Notes / Tender Ref', 'Notes', 'Remarks', 'tender_ref', 'Contract Notes']);
    let status = getVal(['Status', 'Contract Status', 'status']).toUpperCase();

    // 1. Customer Verification
    if (!customerCodeOrId) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCodeOrId',
        message: 'Customer Code is mandatory.',
        severity: 'ERROR'
      });
    }

    const matchedCustomer = existingUsers.find(
      (u) =>
        (u.customerCode && u.customerCode.toUpperCase() === customerCodeOrId) ||
        (u.id && u.id.toLowerCase() === customerCodeOrId.toLowerCase()) ||
        (u.labName && u.labName.toLowerCase().includes(customerCodeOrId.toLowerCase()))
    );

    if (customerCodeOrId && !matchedCustomer) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCodeOrId',
        value: customerCodeOrId,
        message: `Customer Code '${customerCodeOrId}' not found in active customer database.`,
        severity: 'ERROR'
      });
    }

    // 2. Product SKU Verification
    if (!productSku) {
      rowErrors.push({
        rowNumber,
        column: 'Product SKU',
        field: 'productSku',
        message: 'Product SKU is mandatory.',
        severity: 'ERROR'
      });
    }

    const matchedProduct = existingProducts.find(
      (p) =>
        (p.sku && p.sku.toUpperCase() === productSku) ||
        (p.id && p.id.toLowerCase() === productSku.toLowerCase())
    );

    if (productSku && !matchedProduct) {
      rowErrors.push({
        rowNumber,
        column: 'Product SKU',
        field: 'productSku',
        value: productSku,
        message: `Product SKU '${productSku}' does not exist in Product Master catalog.`,
        severity: 'ERROR'
      });
    }

    // 3. Duplicate Contract in same Batch
    const contractKey = `${customerCodeOrId}:::${productSku}`;
    if (seenContracts.has(contractKey)) {
      rowErrors.push({
        rowNumber,
        column: 'Product SKU',
        field: 'productSku',
        value: productSku,
        message: `Duplicate contract rule for Customer '${customerCodeOrId}' and SKU '${productSku}' in this batch.`,
        severity: 'ERROR'
      });
    } else {
      seenContracts.add(contractKey);
    }

    // 4. Contract Type & Price Math
    if (!contractType || !validContractTypes.includes(contractType)) {
      contractType = 'CUSTOM_NET_RATE';
    }

    const mrp = matchedProduct?.mrp || 0;
    const basePrice = matchedProduct?.basePrice || mrp * 0.8;
    let netPrice = Number(netPriceRaw.replace(/[^0-9.]/g, '')) || 0;
    let discountPercent = Number(discountPercentRaw.replace(/[^0-9.]/g, '')) || 0;

    if (contractType === 'CUSTOM_NET_RATE') {
      if (netPrice <= 0 && discountPercent > 0 && mrp > 0) {
        netPrice = Number((mrp * (1 - discountPercent / 100)).toFixed(2));
      } else if (netPrice <= 0) {
        rowErrors.push({
          rowNumber,
          column: 'Contract Net Price (INR)',
          field: 'contractNetPrice',
          message: 'Contract Net Price must be greater than ₹0.00.',
          severity: 'ERROR'
        });
      }
      if (mrp > 0 && netPrice > mrp) {
        rowErrors.push({
          rowNumber,
          column: 'Contract Net Price (INR)',
          field: 'contractNetPrice',
          value: netPrice,
          message: `Contract Net Price (₹${netPrice}) cannot be higher than Product MRP (₹${mrp}).`,
          severity: 'ERROR'
        });
      }
      if (mrp > 0) {
        discountPercent = Number((((mrp - netPrice) / mrp) * 100).toFixed(1));
      }
    } else if (contractType === 'DISCOUNT_PERCENT_ON_MRP') {
      if (discountPercent <= 0 && netPrice > 0 && mrp > 0) {
        discountPercent = Number((((mrp - netPrice) / mrp) * 100).toFixed(1));
      } else if (discountPercent <= 0 || discountPercent >= 100) {
        rowErrors.push({
          rowNumber,
          column: 'Discount Percent (%)',
          field: 'discountPercent',
          value: discountPercent,
          message: 'Discount % must be between 1% and 99%.',
          severity: 'ERROR'
        });
      }
      if (mrp > 0) {
        netPrice = Number((mrp * (1 - discountPercent / 100)).toFixed(2));
      }
    }

    if (netPrice > 0 && basePrice > 0 && netPrice < basePrice * 0.85) {
      rowWarnings.push({
        rowNumber,
        column: 'Contract Net Price (INR)',
        field: 'contractNetPrice',
        value: netPrice,
        message: `Contract Net Price (₹${netPrice}) is >15% below base distributor cost (₹${basePrice}). Requires Managerial Approval.`,
        severity: 'WARNING'
      });
    }

    // 5. MOQ & Dates
    const minOrderQuantity = Number(moqRaw.replace(/[^0-9]/g, '')) || matchedProduct?.minOrderQuantity || 1;
    const isPriceLocked = priceLockRaw === 'YES' || priceLockRaw === 'TRUE' || priceLockRaw === 'Y';

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      rowErrors.push({
        rowNumber,
        column: 'Effective End Date',
        field: 'effectiveEndDate',
        value: endDate,
        message: `Effective End Date (${endDate}) cannot precede Start Date (${startDate}).`,
        severity: 'ERROR'
      });
    }

    if (!status || !['ACTIVE', 'EXPIRED', 'PENDING_REVIEW'].includes(status)) {
      status = 'ACTIVE';
    }

    // 6. Action check against existing price contracts
    const existingRule = existingPriceRules.find(
      (r) =>
        (r.customerId === matchedCustomer?.id || r.customerCode === customerCodeOrId) &&
        (r.productId === matchedProduct?.id || r.productSku === productSku)
    );

    const isExisting = Boolean(existingRule);
    let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR' = 'CREATE';

    if (rowErrors.length > 0) {
      action = 'ERROR';
    } else if (mode === 'CREATE_ONLY') {
      if (isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Product SKU',
          field: 'productSku',
          value: productSku,
          message: `Special price contract already exists for this Customer & SKU. Skipped in CREATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'CREATE';
        newCount++;
      }
    } else if (mode === 'UPDATE_ONLY') {
      if (!isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Product SKU',
          field: 'productSku',
          value: productSku,
          message: `Special price contract does not exist. Skipped in UPDATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'UPDATE';
        updateCount++;
      }
    } else {
      if (isExisting) {
        action = 'UPDATE';
        updateCount++;
      } else {
        action = 'CREATE';
        newCount++;
      }
    }

    rowErrors.forEach((e) => issues.push(e));
    rowWarnings.forEach((w) => issues.push(w));

    validatedRows.push({
      rowNumber,
      customerCodeOrId,
      customerLabName: matchedCustomer?.labName || matchedCustomer?.firstName || customerCodeOrId,
      customerId: matchedCustomer?.id,
      productSku,
      productName: matchedProduct?.name || productSku,
      productId: matchedProduct?.id,
      contractType,
      contractNetPrice: netPrice,
      discountPercent,
      minOrderQuantity,
      effectiveStartDate: startDate,
      effectiveEndDate: endDate,
      isPriceLocked,
      mrp,
      standardBasePrice: basePrice,
      contractSavingsPercent: discountPercent,
      contractNotes: notes,
      contractStatus: status,
      action,
      isExisting,
      existingContractId: existingRule?.id,
      errors: rowErrors,
      warnings: rowWarnings,
      isValid: rowErrors.length === 0 && action !== 'ERROR'
    });
  });

  const errorRowsCount = validatedRows.filter((r) => r.errors.length > 0 || r.action === 'ERROR').length;
  const warningRowsCount = validatedRows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length;
  const validRowsCount = validatedRows.filter((r) => r.isValid && r.action !== 'SKIP').length;

  return {
    totalRows: rawRows.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    warningRows: warningRowsCount,
    newContractsCount: newCount,
    updatedContractsCount: updateCount,
    skippedRowsCount: skippedCount,
    issues,
    validatedRows
  };
}

export function generatePriceContractExcelTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Customer Code': 'CUST-APEX-001',
      'Product SKU': 'TRA-CHEM7-RGT01',
      'Contract Type': 'CUSTOM_NET_RATE',
      'Contract Net Price (INR)': 2450.0,
      'Discount Percent (%)': 23.4,
      'Min Order Quantity (MOQ)': 2,
      'Effective Start Date': '2026-04-01',
      'Effective End Date': '2027-03-31',
      'Price Lock Guarantee (YES/NO)': 'YES',
      'Contract Notes / Tender Ref': 'Annual Rate Contract ARC-2026-APEX-01',
      'Status': 'ACTIVE'
    },
    {
      'Customer Code': 'CUST-APEX-001',
      'Product SKU': 'TRA-ERBA-GLUC',
      'Contract Type': 'CUSTOM_NET_RATE',
      'Contract Net Price (INR)': 1350.0,
      'Discount Percent (%)': 25.0,
      'Min Order Quantity (MOQ)': 5,
      'Effective Start Date': '2026-04-01',
      'Effective End Date': '2027-03-31',
      'Price Lock Guarantee (YES/NO)': 'YES',
      'Contract Notes / Tender Ref': 'Glucose Bulk Reagent Rate Contract',
      'Status': 'ACTIVE'
    },
    {
      'Customer Code': 'CUST-METRO-002',
      'Product SKU': 'SYS-XN-CELLPACK',
      'Contract Type': 'DISCOUNT_PERCENT_ON_MRP',
      'Contract Net Price (INR)': 4160.0,
      'Discount Percent (%)': 20.0,
      'Min Order Quantity (MOQ)': 4,
      'Effective Start Date': '2026-05-01',
      'Effective End Date': '2027-04-30',
      'Price Lock Guarantee (YES/NO)': 'NO',
      'Contract Notes / Tender Ref': 'Hematology Diluent Institutional Discount',
      'Status': 'ACTIVE'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Special_Price_Contracts');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

// ============================================================================
// 3. PHASE 5A: INSTALLED BASE EQUIPMENT IMPORT ENGINE
// ============================================================================

export interface EquipmentValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newEquipmentCount: number;
  updatedEquipmentCount: number;
  skippedRowsCount: number;
  issues: RowValidationIssue[];
  validatedRows: any[];
}

export function validateEquipmentImportRows(
  rawRows: any[],
  mode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE',
  existingUsers: any[],
  existingCompanies: any[],
  existingEquipment: any[]
): EquipmentValidationResult {
  const issues: RowValidationIssue[] = [];
  const validatedRows: any[] = [];
  const seenSerialNumbers = new Set<string>();

  const validContractStatuses = ['UNDER_WARRANTY', 'ACTIVE_AMC', 'ACTIVE_CMC', 'EXPIRED', 'NO_CONTRACT'];
  const validOpStatuses = ['OPTIMAL', 'OPERATIONAL', 'DEGRADED', 'BREAKDOWN_CRITICAL', 'STANDBY', 'DECOMMISSIONED'];
  const validFrequencies = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL'];

  let newCount = 0;
  let updateCount = 0;
  let skippedCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: RowValidationIssue[] = [];
    const rowWarnings: RowValidationIssue[] = [];

    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    const serialNumber = getVal(['Serial Number', 'SerialNumber', 'serial_number', 'Serial No', 'SERIAL_NUMBER']).toUpperCase();
    const modelOrSku = getVal(['Equipment Model / SKU', 'Model / SKU', 'Model Number', 'model_number', 'SKU']);
    const equipmentName = getVal(['Equipment Name', 'equipment_name', 'Name', 'Instrument Name']);
    const oemName = getVal(['OEM Brand', 'Manufacturer', 'Company', 'Brand', 'oem_name']) || 'Transasia Bio-Medicals';
    const customerCode = getVal(['Customer Code', 'CustomerCode', 'customer_code', 'Customer ID']).toUpperCase();
    const labName = getVal(['Customer Lab Name', 'Lab Name', 'Hospital Name', 'lab_name']);
    const locationDept = getVal(['Location / Department', 'Location', 'Department', 'Room', 'section']) || 'Main Pathology Lab';
    const installDate = getVal(['Installation Date', 'installation_date', 'Install Date']) || '2024-01-15';
    let contractStatus = getVal(['Warranty / Contract Status', 'Contract Status', 'Warranty Status', 'contract_status']).toUpperCase().replace(/[\s-]/g, '_');
    const contractStartDate = getVal(['Contract Start Date', 'start_date', 'Contract Start']) || installDate;
    const contractEndDate = getVal(['Contract Expiry Date', 'expiry_date', 'Contract End', 'Warranty Expiry']) || '2027-01-14';
    const assignedEngineer = getVal(['Assigned Service Engineer Email / ID', 'Service Engineer', 'engineer', 'assigned_engineer']);
    let pmFrequency = getVal(['PM Frequency', 'Maintenance Frequency', 'pm_frequency']).toUpperCase().replace(/[\s-]/g, '_');
    const lastServiceDate = getVal(['Last Service Date', 'last_service_date', 'Last PM Date']);
    const nextPmDueDate = getVal(['Next PM Due Date', 'next_pm_due_date', 'Next PM Date']) || '2026-10-15';
    let opStatus = getVal(['Operational Status', 'Status', 'operational_status', 'Health']).toUpperCase().replace(/[\s-]/g, '_');
    const healthScoreRaw = getVal(['Health Score (1-100)', 'Health Score', 'health_score']);
    const contactPerson = getVal(['Contact Person', 'contact_person', 'Doctor In Charge']);
    const contactPhone = getVal(['Contact Phone', 'contact_phone', 'Phone']);

    // 1. Serial Number
    if (!serialNumber) {
      rowErrors.push({
        rowNumber,
        column: 'Serial Number',
        field: 'serialNumber',
        message: 'Equipment Serial Number is mandatory and unique.',
        severity: 'ERROR'
      });
    } else if (seenSerialNumbers.has(serialNumber)) {
      rowErrors.push({
        rowNumber,
        column: 'Serial Number',
        field: 'serialNumber',
        value: serialNumber,
        message: `Duplicate Serial Number '${serialNumber}' in this batch.`,
        severity: 'ERROR'
      });
    } else {
      seenSerialNumbers.add(serialNumber);
    }

    // 2. Customer Lookup
    if (!customerCode) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCode',
        message: 'Customer Code is mandatory to bind installed equipment to a Lab.',
        severity: 'ERROR'
      });
    }

    const matchedCustomer = existingUsers.find(
      (u) =>
        (u.customerCode && u.customerCode.toUpperCase() === customerCode) ||
        (u.id && u.id.toLowerCase() === customerCode.toLowerCase()) ||
        (u.labName && u.labName.toLowerCase().includes(customerCode.toLowerCase()))
    );

    if (customerCode && !matchedCustomer) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCode',
        value: customerCode,
        message: `Customer '${customerCode}' does not exist in the database.`,
        severity: 'ERROR'
      });
    }

    // 3. Equipment Name & OEM
    if (!equipmentName) {
      rowErrors.push({
        rowNumber,
        column: 'Equipment Name',
        field: 'equipmentName',
        message: 'Equipment Name is mandatory.',
        severity: 'ERROR'
      });
    }

    // 4. Contract Status & Frequency
    if (!contractStatus || !validContractStatuses.includes(contractStatus)) {
      if (contractStatus.includes('WARRANTY')) contractStatus = 'UNDER_WARRANTY';
      else if (contractStatus.includes('AMC')) contractStatus = 'ACTIVE_AMC';
      else if (contractStatus.includes('CMC')) contractStatus = 'ACTIVE_CMC';
      else if (contractStatus.includes('EXP')) contractStatus = 'EXPIRED';
      else contractStatus = 'ACTIVE_AMC';
    }

    if (!pmFrequency || !validFrequencies.includes(pmFrequency)) {
      pmFrequency = 'QUARTERLY';
    }

    if (!opStatus || !validOpStatuses.includes(opStatus)) {
      if (opStatus.includes('OPT')) opStatus = 'OPTIMAL';
      else if (opStatus.includes('DEG')) opStatus = 'DEGRADED';
      else if (opStatus.includes('BREAK') || opStatus.includes('DOWN')) opStatus = 'BREAKDOWN_CRITICAL';
      else opStatus = 'OPERATIONAL';
    }

    const healthScore = Math.min(100, Math.max(1, Number(healthScoreRaw.replace(/[^0-9]/g, '')) || 90));

    // 5. Existing equipment lookup
    const existingEq = existingEquipment.find(
      (e) => e.serialNumber && e.serialNumber.toUpperCase() === serialNumber
    );

    const isExisting = Boolean(existingEq);
    let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR' = 'CREATE';

    if (rowErrors.length > 0) {
      action = 'ERROR';
    } else if (mode === 'CREATE_ONLY') {
      if (isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Serial Number',
          field: 'serialNumber',
          value: serialNumber,
          message: `Equipment with Serial '${serialNumber}' already exists. Skipped in CREATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'CREATE';
        newCount++;
      }
    } else if (mode === 'UPDATE_ONLY') {
      if (!isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Serial Number',
          field: 'serialNumber',
          value: serialNumber,
          message: `Equipment does not exist. Skipped in UPDATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'UPDATE';
        updateCount++;
      }
    } else {
      if (isExisting) {
        action = 'UPDATE';
        updateCount++;
      } else {
        action = 'CREATE';
        newCount++;
      }
    }

    rowErrors.forEach((e) => issues.push(e));
    rowWarnings.forEach((w) => issues.push(w));

    validatedRows.push({
      rowNumber,
      serialNumber,
      equipmentModelOrSku: modelOrSku || 'Analyzer Model X',
      equipmentName,
      oemCompanyName: oemName,
      customerCode,
      customerLabName: matchedCustomer?.labName || labName || `${customerCode} Diagnostic Lab`,
      customerId: matchedCustomer?.id,
      locationDepartment: locationDept,
      installationDate: installDate,
      contractStatus,
      contractStartDate,
      contractEndDate,
      assignedEngineerId: assignedEngineer || 'u-eng-01',
      assignedEngineerName: assignedEngineer ? 'Assigned Engineer' : 'Sameer Joshi',
      pmFrequency,
      lastServiceDate,
      nextPmDueDate,
      operationalStatus: opStatus,
      healthScore,
      qrCode: `QR-EQ-${serialNumber}`,
      contactPerson: contactPerson || matchedCustomer?.contactPerson || 'Lab Director',
      contactPhone: contactPhone || matchedCustomer?.phone || '+91-98200-11223',
      action,
      isExisting,
      existingEquipmentId: existingEq?.id,
      errors: rowErrors,
      warnings: rowWarnings,
      isValid: rowErrors.length === 0 && action !== 'ERROR'
    });
  });

  const errorRowsCount = validatedRows.filter((r) => r.errors.length > 0 || r.action === 'ERROR').length;
  const warningRowsCount = validatedRows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length;
  const validRowsCount = validatedRows.filter((r) => r.isValid && r.action !== 'SKIP').length;

  return {
    totalRows: rawRows.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    warningRows: warningRowsCount,
    newEquipmentCount: newCount,
    updatedEquipmentCount: updateCount,
    skippedRowsCount: skippedCount,
    issues,
    validatedRows
  };
}

export function generateEquipmentExcelTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Serial Number': 'ERB-CHEM7-2024-9988',
      'Equipment Model / SKU': 'TRA-CHEM7-EQ',
      'Equipment Name': 'Transasia Erba Chem 7 Semi-Automated Clinical Chemistry Analyzer',
      'OEM Brand': 'Transasia Bio-Medicals',
      'Customer Code': 'CUST-APEX-001',
      'Customer Lab Name': 'Apex Clinical & Pathology Laboratories',
      'Location / Department': 'Biochemistry Section, Room 204',
      'Installation Date': '2024-03-15',
      'Warranty / Contract Status': 'ACTIVE_AMC',
      'Contract Start Date': '2024-03-15',
      'Contract Expiry Date': '2027-03-14',
      'Assigned Service Engineer Email / ID': 'sameer.service@a2zdiagnostic.com',
      'PM Frequency': 'QUARTERLY',
      'Last Service Date': '2026-05-10',
      'Next PM Due Date': '2026-11-10',
      'Operational Status': 'OPTIMAL',
      'Health Score (1-100)': 94,
      'Contact Person': 'Dr. Rajesh Kulkarni',
      'Contact Phone': '+91-98200-11223'
    },
    {
      'Serial Number': 'SYS-XN350-2023-4120',
      'Equipment Model / SKU': 'SYS-XN350-EQ',
      'Equipment Name': 'Sysmex XN-350 Automated 5-Part Hematology Analyzer',
      'OEM Brand': 'Sysmex India',
      'Customer Code': 'CUST-METRO-002',
      'Customer Lab Name': 'Metro Super Speciality Pathology & Research Centre',
      'Location / Department': 'Hematology Main Wing',
      'Installation Date': '2023-08-20',
      'Warranty / Contract Status': 'ACTIVE_CMC',
      'Contract Start Date': '2023-08-20',
      'Contract Expiry Date': '2026-08-19',
      'Assigned Service Engineer Email / ID': 'sameer.service@a2zdiagnostic.com',
      'PM Frequency': 'MONTHLY',
      'Last Service Date': '2026-07-28',
      'Next PM Due Date': '2026-08-28',
      'Operational Status': 'OPTIMAL',
      'Health Score (1-100)': 98,
      'Contact Person': 'Dr. Rajesh Deshmukh',
      'Contact Phone': '+91-98200-44556'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Equipment_Master_Import');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

// ============================================================================
// 4. PHASE 6A: OPENING LEDGER & INVOICES IMPORT ENGINE
// ============================================================================

export interface LedgerValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  netOutstandingBalance: number;
  newLedgerEntriesCount: number;
  updatedLedgerEntriesCount: number;
  skippedRowsCount: number;
  issues: RowValidationIssue[];
  validatedRows: any[];
}

export function validateLedgerImportRows(
  rawRows: any[],
  mode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE',
  existingUsers: any[],
  existingLedgers: any[] = []
): LedgerValidationResult {
  const issues: RowValidationIssue[] = [];
  const validatedRows: any[] = [];
  const seenDocs = new Set<string>();

  let newCount = 0;
  let updateCount = 0;
  let skippedCount = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: RowValidationIssue[] = [];
    const rowWarnings: RowValidationIssue[] = [];

    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    const customerCode = getVal(['Customer Code', 'CustomerCode', 'customer_code', 'Customer ID']).toUpperCase();
    const labName = getVal(['Customer Lab Name', 'Lab Name', 'Customer Name', 'lab_name']);
    let balanceType = getVal(['Balance Type', 'balance_type', 'Type', 'Debit/Credit']).toUpperCase().replace(/[\s-]/g, '_');
    const docNumber = getVal(['Document / Invoice Number', 'Invoice Number', 'Invoice No', 'doc_number', 'Document No', 'Bill No']).toUpperCase();
    const invoiceDate = getVal(['Invoice Date', 'Date', 'invoice_date', 'Bill Date']) || '2026-03-01';
    const dueDate = getVal(['Due Date', 'due_date', 'Payment Due Date']) || '2026-03-31';
    const originalAmountRaw = getVal(['Original Amount (INR)', 'Original Amount', 'Bill Amount', 'original_amount', 'Amount']);
    const paidAmountRaw = getVal(['Paid Amount (INR)', 'Paid Amount', 'paid_amount', 'Received']);
    const balanceAmountRaw = getVal(['Balance Outstanding (INR)', 'Balance Amount', 'Balance Outstanding', 'balance_amount', 'Outstanding']);
    let agingBracket = getVal(['Aging Bracket', 'aging_bracket', 'Aging', 'Overdue Bracket']).toUpperCase();
    const paymentTerms = getVal(['Payment Terms', 'payment_terms', 'Terms']) || '30 Days Net';
    const salesRep = getVal(['Sales Rep Name', 'Sales Rep', 'sales_rep']);
    const remarks = getVal(['Remarks / Reconciliation Notes', 'Remarks', 'Notes', 'remarks']) || 'Opening Balance Import';

    // 1. Customer Verification
    if (!customerCode) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCode',
        message: 'Customer Code is mandatory.',
        severity: 'ERROR'
      });
    }

    const matchedCustomer = existingUsers.find(
      (u) =>
        (u.customerCode && u.customerCode.toUpperCase() === customerCode) ||
        (u.id && u.id.toLowerCase() === customerCode.toLowerCase()) ||
        (u.labName && u.labName.toLowerCase().includes(customerCode.toLowerCase()))
    );

    if (customerCode && !matchedCustomer) {
      rowErrors.push({
        rowNumber,
        column: 'Customer Code',
        field: 'customerCode',
        value: customerCode,
        message: `Customer '${customerCode}' does not exist in master customer records.`,
        severity: 'ERROR'
      });
    }

    // 2. Document Number
    if (!docNumber) {
      rowErrors.push({
        rowNumber,
        column: 'Document / Invoice Number',
        field: 'documentNumber',
        message: 'Document / Invoice Reference Number is mandatory.',
        severity: 'ERROR'
      });
    } else if (seenDocs.has(docNumber)) {
      rowErrors.push({
        rowNumber,
        column: 'Document / Invoice Number',
        field: 'documentNumber',
        value: docNumber,
        message: `Duplicate document number '${docNumber}' in this batch.`,
        severity: 'ERROR'
      });
    } else {
      seenDocs.add(docNumber);
    }

    // 3. Balance Type
    if (!balanceType || (!balanceType.includes('CREDIT') && !balanceType.includes('DEBIT'))) {
      balanceType = 'DEBIT_RECEIVABLE';
    } else if (balanceType.includes('CREDIT')) {
      balanceType = 'CREDIT_ADVANCE';
    } else {
      balanceType = 'DEBIT_RECEIVABLE';
    }

    // 4. Amount Math
    const originalAmount = Number(originalAmountRaw.replace(/[^0-9.]/g, '')) || 0;
    const paidAmount = Number(paidAmountRaw.replace(/[^0-9.]/g, '')) || 0;
    let balanceAmount = Number(balanceAmountRaw.replace(/[^0-9.]/g, '')) || 0;

    if (originalAmount <= 0 && balanceAmount <= 0) {
      rowErrors.push({
        rowNumber,
        column: 'Original Amount (INR)',
        field: 'originalAmount',
        message: 'Original Amount or Balance Amount must be greater than ₹0.00.',
        severity: 'ERROR'
      });
    }

    if (balanceAmount === 0 && originalAmount > 0) {
      balanceAmount = Math.max(0, originalAmount - paidAmount);
    }

    if (balanceType === 'DEBIT_RECEIVABLE') {
      totalDebit += balanceAmount;
    } else {
      totalCredit += balanceAmount;
    }

    // Compute automatic Aging Bracket if not supplied
    if (!agingBracket || !agingBracket.includes('DAYS')) {
      const today = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 30) agingBracket = '0-30 DAYS';
      else if (diffDays <= 60) agingBracket = '31-60 DAYS';
      else if (diffDays <= 90) agingBracket = '61-90 DAYS';
      else if (diffDays <= 180) agingBracket = '91-180 DAYS';
      else agingBracket = '180+ DAYS';
    }

    // Credit limit warning
    const customerCreditLimit = matchedCustomer?.creditLimit || 200000;
    const creditExceeded = balanceType === 'DEBIT_RECEIVABLE' && balanceAmount > customerCreditLimit;
    if (creditExceeded) {
      rowWarnings.push({
        rowNumber,
        column: 'Balance Outstanding (INR)',
        field: 'balanceAmount',
        value: balanceAmount,
        message: `Outstanding balance (₹${balanceAmount}) exceeds customer's sanctioned credit limit (₹${customerCreditLimit}).`,
        severity: 'WARNING'
      });
    }

    // 5. Existing ledger lookup
    const existingLedger = existingLedgers.find(
      (l) => l.documentNumber && l.documentNumber.toUpperCase() === docNumber
    );

    const isExisting = Boolean(existingLedger);
    let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR' = 'CREATE';

    if (rowErrors.length > 0) {
      action = 'ERROR';
    } else if (mode === 'CREATE_ONLY') {
      if (isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Document / Invoice Number',
          field: 'documentNumber',
          value: docNumber,
          message: `Ledger entry for '${docNumber}' already exists. Skipped in CREATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'CREATE';
        newCount++;
      }
    } else if (mode === 'UPDATE_ONLY') {
      if (!isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Document / Invoice Number',
          field: 'documentNumber',
          value: docNumber,
          message: `Ledger entry does not exist. Skipped in UPDATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'UPDATE';
        updateCount++;
      }
    } else {
      if (isExisting) {
        action = 'UPDATE';
        updateCount++;
      } else {
        action = 'CREATE';
        newCount++;
      }
    }

    rowErrors.forEach((e) => issues.push(e));
    rowWarnings.forEach((w) => issues.push(w));

    validatedRows.push({
      rowNumber,
      customerCode,
      customerLabName: matchedCustomer?.labName || labName || `${customerCode} Diagnostic Lab`,
      customerId: matchedCustomer?.id,
      balanceType,
      documentNumber: docNumber,
      invoiceDate,
      dueDate,
      originalAmount,
      paidAmount,
      balanceAmount,
      agingBracket,
      paymentTerms,
      salesRepName: salesRep || matchedCustomer?.assignedSalesRepName || 'Vikram Malhotra',
      customerCreditLimit,
      creditLimitExceeded: creditExceeded,
      remarks,
      action,
      isExisting,
      existingLedgerId: existingLedger?.id,
      errors: rowErrors,
      warnings: rowWarnings,
      isValid: rowErrors.length === 0 && action !== 'ERROR'
    });
  });

  const errorRowsCount = validatedRows.filter((r) => r.errors.length > 0 || r.action === 'ERROR').length;
  const warningRowsCount = validatedRows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length;
  const validRowsCount = validatedRows.filter((r) => r.isValid && r.action !== 'SKIP').length;

  return {
    totalRows: rawRows.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    warningRows: warningRowsCount,
    totalDebitAmount: totalDebit,
    totalCreditAmount: totalCredit,
    netOutstandingBalance: totalDebit - totalCredit,
    newLedgerEntriesCount: newCount,
    updatedLedgerEntriesCount: updateCount,
    skippedRowsCount: skippedCount,
    issues,
    validatedRows
  };
}

export function generateLedgerExcelTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Customer Code': 'CUST-APEX-001',
      'Customer Lab Name': 'Apex Clinical & Pathology Laboratories',
      'Balance Type': 'DEBIT_RECEIVABLE',
      'Document / Invoice Number': 'INV-2025-26/0412',
      'Invoice Date': '2026-02-10',
      'Due Date': '2026-03-12',
      'Original Amount (INR)': 145000.0,
      'Paid Amount (INR)': 50000.0,
      'Balance Outstanding (INR)': 95000.0,
      'Aging Bracket': '31-60 DAYS',
      'Payment Terms': '30 Days Net',
      'Sales Rep Name': 'Vikram Malhotra',
      'Remarks / Reconciliation Notes': 'Reagents order dispatch - Balance overdue'
    },
    {
      'Customer Code': 'CUST-METRO-002',
      'Customer Lab Name': 'Metro Super Speciality Pathology & Research Centre',
      'Balance Type': 'DEBIT_RECEIVABLE',
      'Document / Invoice Number': 'INV-2025-26/0899',
      'Invoice Date': '2026-03-01',
      'Due Date': '2026-03-31',
      'Original Amount (INR)': 280000.0,
      'Paid Amount (INR)': 0.0,
      'Balance Outstanding (INR)': 280000.0,
      'Aging Bracket': '0-30 DAYS',
      'Payment Terms': '30 Days Net',
      'Sales Rep Name': 'Vikram Malhotra',
      'Remarks / Reconciliation Notes': 'Quarterly reagents bulk shipment'
    },
    {
      'Customer Code': 'CUST-THN-042',
      'Customer Lab Name': 'Zenith Molecular & Haematology Diagnostic Lab',
      'Balance Type': 'CREDIT_ADVANCE',
      'Document / Invoice Number': 'ADV-2026-0044',
      'Invoice Date': '2026-03-25',
      'Due Date': '2026-03-25',
      'Original Amount (INR)': 25000.0,
      'Paid Amount (INR)': 25000.0,
      'Balance Outstanding (INR)': 25000.0,
      'Aging Bracket': '0-30 DAYS',
      'Payment Terms': 'Advance Deposit',
      'Sales Rep Name': 'Vikram Malhotra',
      'Remarks / Reconciliation Notes': 'Pre-paid deposit towards upcoming analyzer delivery'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Opening_Ledger_Import');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

// ============================================================================
// 5. PHASE 7A: SALES TARGET & QUOTA IMPORT ENGINE
// ============================================================================

export interface SalesTargetValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  totalRevenueQuota: number;
  totalCollectionQuota: number;
  newTargetsCount: number;
  updatedTargetsCount: number;
  skippedRowsCount: number;
  issues: RowValidationIssue[];
  validatedRows: any[];
}

export function validateSalesTargetImportRows(
  rawRows: any[],
  mode: 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE',
  existingUsers: any[],
  existingTargets: any[] = []
): SalesTargetValidationResult {
  const issues: RowValidationIssue[] = [];
  const validatedRows: any[] = [];
  const seenTargetKeys = new Set<string>();

  const validDivisions = [
    'ALL_DIVISIONS',
    'CLINICAL_CHEMISTRY',
    'HEMATOLOGY',
    'IMMUNOLOGY',
    'RAPID_KITS',
    'EQUIPMENT_CAPEX',
    'CONSUMABLES_REAGENTS'
  ];

  let newCount = 0;
  let updateCount = 0;
  let skippedCount = 0;
  let totalRev = 0;
  let totalColl = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const rowErrors: RowValidationIssue[] = [];
    const rowWarnings: RowValidationIssue[] = [];

    const getVal = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      return '';
    };

    let periodType = getVal(['Period Type', 'period_type', 'Period', 'Frequency']).toUpperCase();
    const fiscalYear = getVal(['Fiscal Year', 'fiscal_year', 'FY', 'Year']) || '2026-2027';
    const periodName = getVal(['Period Name', 'period_name', 'Month / Quarter', 'Period']) || '2026-M04 (April 2026)';
    const salesRepEmailOrId = getVal(['Sales Rep Email / ID', 'Sales Rep', 'sales_rep', 'rep_email', 'rep_id']).toLowerCase();
    const salesRepName = getVal(['Sales Rep Name', 'rep_name', 'Name']);
    const territoryCode = getVal(['Territory Code', 'territory_code', 'Territory', 'Region Code']) || 'TERR-MUM-WEST';
    const territoryName = getVal(['Territory Name', 'territory_name', 'Region Name']) || 'Mumbai Metro & Suburbs';
    let productDivision = getVal(['Product Division', 'product_division', 'Division', 'Category']).toUpperCase().replace(/[\s-]/g, '_');
    const brandFocus = getVal(['Brand Focus', 'brand_focus', 'Brand', 'OEM Focus']) || 'ALL_BRANDS';
    const revenueTargetRaw = getVal(['Revenue Target (INR)', 'Revenue Target', 'revenue_target', 'Sales Target', 'Revenue Quota']);
    const collectionTargetRaw = getVal(['Collection Target (INR)', 'Collection Target', 'collection_target', 'Recovery Target']);
    const newCustomerTargetRaw = getVal(['New Customer Target Count', 'New Labs Target', 'new_customers_target']);
    const equipmentTargetRaw = getVal(['Equipment Unit Target', 'Equipment Target', 'equipment_target']);
    let incentiveSlab = getVal(['Incentive Slab', 'incentive_slab', 'Slab', 'Tier']).toUpperCase().replace(/[\s-]/g, '_');
    const remarks = getVal(['Remarks / Strategic Notes', 'Remarks', 'Notes']);

    // 1. Period Type
    if (!['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(periodType)) {
      periodType = 'MONTHLY';
    }

    // 2. Sales Rep Verification
    if (!salesRepEmailOrId) {
      rowErrors.push({
        rowNumber,
        column: 'Sales Rep Email / ID',
        field: 'salesRepEmailOrId',
        message: 'Sales Rep Email or ID is mandatory.',
        severity: 'ERROR'
      });
    }

    const matchedRep = existingUsers.find(
      (u) =>
        (u.email && u.email.toLowerCase() === salesRepEmailOrId) ||
        (u.id && u.id.toLowerCase() === salesRepEmailOrId) ||
        (u.firstName && `${u.firstName} ${u.lastName}`.toLowerCase().includes(salesRepEmailOrId))
    );

    if (salesRepEmailOrId && !matchedRep) {
      rowWarnings.push({
        rowNumber,
        column: 'Sales Rep Email / ID',
        field: 'salesRepEmailOrId',
        value: salesRepEmailOrId,
        message: `Sales Rep '${salesRepEmailOrId}' not found in active staff directory. Will assign to default territory rep.`,
        severity: 'WARNING'
      });
    }

    // 3. Division & Brand
    if (!validDivisions.includes(productDivision)) {
      productDivision = 'ALL_DIVISIONS';
    }

    // 4. Duplicate Check
    const targetKey = `${salesRepEmailOrId}:::${periodName}:::${productDivision}`;
    if (seenTargetKeys.has(targetKey)) {
      rowErrors.push({
        rowNumber,
        column: 'Period Name',
        field: 'periodName',
        value: periodName,
        message: `Duplicate sales target for Rep '${salesRepEmailOrId}', Period '${periodName}', and Division '${productDivision}'.`,
        severity: 'ERROR'
      });
    } else {
      seenTargetKeys.add(targetKey);
    }

    // 5. Numerical targets
    const revenueTarget = Number(revenueTargetRaw.replace(/[^0-9.]/g, '')) || 0;
    const collectionTarget = Number(collectionTargetRaw.replace(/[^0-9.]/g, '')) || revenueTarget * 0.9;
    const newCustomersTarget = Number(newCustomerTargetRaw.replace(/[^0-9]/g, '')) || 3;
    const equipmentUnitsTarget = Number(equipmentTargetRaw.replace(/[^0-9]/g, '')) || 1;

    if (revenueTarget <= 0) {
      rowErrors.push({
        rowNumber,
        column: 'Revenue Target (INR)',
        field: 'revenueTargetAmount',
        message: 'Primary Revenue Target must be greater than ₹0.00.',
        severity: 'ERROR'
      });
    }

    totalRev += revenueTarget;
    totalColl += collectionTarget;

    if (!['TIER_1_STANDARD', 'TIER_2_ACCELERATOR', 'TIER_3_PRESIDENT_CLUB'].includes(incentiveSlab)) {
      incentiveSlab = 'TIER_1_STANDARD';
    }

    // 6. Existing Target check
    const existingTarget = existingTargets.find(
      (t) =>
        (t.salesRepEmail === salesRepEmailOrId || t.salesRepId === matchedRep?.id) &&
        t.periodName === periodName &&
        t.productDivision === productDivision
    );

    const isExisting = Boolean(existingTarget);
    let action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR' = 'CREATE';

    if (rowErrors.length > 0) {
      action = 'ERROR';
    } else if (mode === 'CREATE_ONLY') {
      if (isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Period Name',
          field: 'periodName',
          value: periodName,
          message: `Sales Target quota already exists. Skipped in CREATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'CREATE';
        newCount++;
      }
    } else if (mode === 'UPDATE_ONLY') {
      if (!isExisting) {
        action = 'SKIP';
        skippedCount++;
        rowWarnings.push({
          rowNumber,
          column: 'Period Name',
          field: 'periodName',
          value: periodName,
          message: `Sales Target does not exist. Skipped in UPDATE_ONLY mode.`,
          severity: 'WARNING'
        });
      } else {
        action = 'UPDATE';
        updateCount++;
      }
    } else {
      if (isExisting) {
        action = 'UPDATE';
        updateCount++;
      } else {
        action = 'CREATE';
        newCount++;
      }
    }

    rowErrors.forEach((e) => issues.push(e));
    rowWarnings.forEach((w) => issues.push(w));

    validatedRows.push({
      rowNumber,
      periodType,
      fiscalYear,
      periodName,
      salesRepEmailOrId,
      salesRepName: matchedRep ? `${matchedRep.firstName} ${matchedRep.lastName}`.trim() : (salesRepName || 'Vikram Malhotra'),
      salesRepId: matchedRep?.id || 'u-sales-01',
      territoryCode,
      territoryName,
      productDivision,
      brandFocus,
      revenueTargetAmount: revenueTarget,
      collectionTargetAmount: collectionTarget,
      newCustomerTargetCount: newCustomersTarget,
      equipmentUnitTargetCount: equipmentUnitsTarget,
      incentiveSlab,
      remarks,
      action,
      isExisting,
      existingTargetId: existingTarget?.id,
      errors: rowErrors,
      warnings: rowWarnings,
      isValid: rowErrors.length === 0 && action !== 'ERROR'
    });
  });

  const errorRowsCount = validatedRows.filter((r) => r.errors.length > 0 || r.action === 'ERROR').length;
  const warningRowsCount = validatedRows.filter((r) => r.warnings.length > 0 && r.errors.length === 0).length;
  const validRowsCount = validatedRows.filter((r) => r.isValid && r.action !== 'SKIP').length;

  return {
    totalRows: rawRows.length,
    validRows: validRowsCount,
    errorRows: errorRowsCount,
    warningRows: warningRowsCount,
    totalRevenueQuota: totalRev,
    totalCollectionQuota: totalColl,
    newTargetsCount: newCount,
    updatedTargetsCount: updateCount,
    skippedRowsCount: skippedCount,
    issues,
    validatedRows
  };
}

export function generateSalesTargetExcelTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Period Type': 'MONTHLY',
      'Fiscal Year': '2026-2027',
      'Period Name': '2026-M04 (April 2026)',
      'Sales Rep Email / ID': 'vikram.sales@a2zdiagnostic.com',
      'Sales Rep Name': 'Vikram Malhotra',
      'Territory Code': 'TERR-MUM-WEST',
      'Territory Name': 'Mumbai Metro & Suburbs',
      'Product Division': 'CLINICAL_CHEMISTRY',
      'Brand Focus': 'Transasia Bio-Medicals',
      'Revenue Target (INR)': 2500000.0,
      'Collection Target (INR)': 2250000.0,
      'New Customer Target Count': 4,
      'Equipment Unit Target': 2,
      'Incentive Slab': 'TIER_2_ACCELERATOR',
      'Remarks / Strategic Notes': 'Focus on Erba Chem 7 reagent contracts across private diagnostic labs'
    },
    {
      'Period Type': 'MONTHLY',
      'Fiscal Year': '2026-2027',
      'Period Name': '2026-M04 (April 2026)',
      'Sales Rep Email / ID': 'vikram.sales@a2zdiagnostic.com',
      'Sales Rep Name': 'Vikram Malhotra',
      'Territory Code': 'TERR-MUM-WEST',
      'Territory Name': 'Mumbai Metro & Suburbs',
      'Product Division': 'HEMATOLOGY',
      'Brand Focus': 'Sysmex India',
      'Revenue Target (INR)': 1800000.0,
      'Collection Target (INR)': 1600000.0,
      'New Customer Target Count': 3,
      'Equipment Unit Target': 1,
      'Incentive Slab': 'TIER_1_STANDARD',
      'Remarks / Strategic Notes': 'Promote 5-part hematology pack renewals'
    },
    {
      'Period Type': 'MONTHLY',
      'Fiscal Year': '2026-2027',
      'Period Name': '2026-M05 (May 2026)',
      'Sales Rep Email / ID': 'vikram.sales@a2zdiagnostic.com',
      'Sales Rep Name': 'Vikram Malhotra',
      'Territory Code': 'TERR-PUN-WEST',
      'Territory Name': 'Pune Region & PCMC',
      'Product Division': 'ALL_DIVISIONS',
      'Brand Focus': 'ALL_BRANDS',
      'Revenue Target (INR)': 3200000.0,
      'Collection Target (INR)': 2900000.0,
      'New Customer Target Count': 5,
      'Equipment Unit Target': 2,
      'Incentive Slab': 'TIER_3_PRESIDENT_CLUB',
      'Remarks / Strategic Notes': 'Monsoon pre-booking for Rapid Dengue/Malaria Kits and QC reagents'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Sales_Target_Quota_Import');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
