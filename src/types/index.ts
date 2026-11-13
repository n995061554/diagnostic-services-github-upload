export * from './quotationTypes';

export enum UserRoleType {
  CUSTOMER = 'CUSTOMER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  OFFICE_STAFF = 'OFFICE_STAFF',
  ACCOUNTS_STAFF = 'ACCOUNTS_STAFF',
  FINANCE_STAFF = 'FINANCE_STAFF',
  SALES_PERSON = 'SALES_PERSON',
  SALES_MANAGER = 'SALES_MANAGER',
  MARKETING_STAFF = 'MARKETING_STAFF',
  SERVICE_ENGINEER = 'SERVICE_ENGINEER',
  SERVICE_MANAGER = 'SERVICE_MANAGER',
  DELIVERY_STAFF = 'DELIVERY_STAFF',
  APPLICATION_SUPPORT = 'APPLICATION_SUPPORT',
  AUTHORIZED_APPROVER = 'AUTHORIZED_APPROVER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Exactly Seven Business Roles as specified in Master System Update Part 2
export enum PrimaryBusinessRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BACK_OFFICE = 'BACK_OFFICE',
  LABORATORY = 'LABORATORY',
  SALES_STAFF = 'SALES_STAFF',
  SERVICE_STAFF = 'SERVICE_STAFF',
  DELIVERY_STAFF = 'DELIVERY_STAFF',
  APPLICATION_STAFF = 'APPLICATION_STAFF',
}

export function toPrimaryRole(role: UserRoleType | string | undefined | null): PrimaryBusinessRole {
  if (!role) return PrimaryBusinessRole.BACK_OFFICE;
  const r = String(role);
  if (r === 'SUPER_ADMIN') {
    return PrimaryBusinessRole.SUPER_ADMIN;
  }
  if (r === 'CUSTOMER' || r === 'LABORATORY') {
    return PrimaryBusinessRole.LABORATORY;
  }
  if (r === 'SALES_PERSON' || r === 'SALES_EXECUTIVE' || r === 'SALES_STAFF') {
    return PrimaryBusinessRole.SALES_STAFF;
  }
  if (r === 'SERVICE_ENGINEER' || r === 'SERVICE_STAFF') {
    return PrimaryBusinessRole.SERVICE_STAFF;
  }
  if (r === 'DELIVERY_STAFF' || r === 'DELIVERY_BOY') {
    return PrimaryBusinessRole.DELIVERY_STAFF;
  }
  if (r === 'APPLICATION_SUPPORT' || r === 'APPLICATION_SPECIALIST' || r === 'APPLICATION_STAFF') {
    return PrimaryBusinessRole.APPLICATION_STAFF;
  }
  // All desk and back-office management roles map to BACK_OFFICE
  // (OFFICE_ADMIN, OFFICE_STAFF, ACCOUNTS_STAFF, FINANCE_STAFF, SALES_MANAGER, SERVICE_MANAGER, MARKETING_STAFF, AUTHORIZED_APPROVER)
  return PrimaryBusinessRole.BACK_OFFICE;
}

// Employee Exit Management & Reassignment Types (Part 3.5)
export interface EmployeeExitReassignmentRequest {
  exitEmployeeId: string;
  exitEmployeeName?: string;
  replacementEmployeeId: string;
  replacementEmployeeName?: string;
  reassignOrders: boolean;
  reassignTasks: boolean;
  reassignTickets: boolean;
  reassignComplaints: boolean;
  reassignDeliveries: boolean;
  effectiveAt: string;
  reason: string;
}

export interface EmployeeExitReassignmentAudit {
  id: string;
  originalEmployeeId: string;
  originalEmployeeName: string;
  newEmployeeId: string;
  newEmployeeName: string;
  reassignedAt: string;
  performedByUserId: string;
  performedByName: string;
  reassignedEntities: {
    ordersCount: number;
    tasksCount: number;
    ticketsCount: number;
    complaintsCount: number;
    deliveriesCount: number;
  };
  reason: string;
}

// 4-Hour Pending Order Reminder Types (Part 13)
export interface PendingOrderReminder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  source: 'Laboratory App' | 'WhatsApp — Manually Entered' | 'Internal Staff Order' | string;
  orderAgeHours: number;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  status: string;
  lastReminderSentAt?: string;
  nextReminderDueAt?: string;
  whatsappScreenshotUrl?: string;
  enteringEmployeeName?: string;
}

// Mandatory 40-Min Lunch & Attendance Policy Types (Part 11)
export interface AttendanceLunchRecord {
  lunchStartTime?: string;
  lunchEndTime?: string;
  lunchDurationMinutes?: number;
  isMandatoryCompleted?: boolean;
}

export type UserAccountStatus = 
  | 'USER_CREATED'
  | 'PENDING_ACTIVATION'
  | 'ACTIVE' 
  | 'SUSPENDED' 
  | 'DEACTIVATED'
  | 'LOCKED' 
  | 'PASSWORD_RESET_REQUIRED'
  | 'INACTIVE'
  | 'PENDING_VERIFICATION';

export interface UserStatusHistoryItem {
  id: string;
  fromStatus: UserAccountStatus;
  toStatus: UserAccountStatus;
  changedAt: string;
  changedBy: string;
  changedByName?: string;
  reason?: string;
  notes?: string;
  ipAddress?: string;
}

export type PermissionDataScope = 
  | 'ALL' 
  | 'BRANCH' 
  | 'REGION' 
  | 'TEAM' 
  | 'ASSIGNED' 
  | 'OWN' 
  | 'NONE';

export interface Permission {
  id: string;
  code: string;
  module: string;
  action: string;
  description: string;
  defaultScope?: PermissionDataScope;
}

export interface Role {
  id: string;
  name: UserRoleType;
  displayName: string;
  description: string;
  permissions: string[];
  allowedDataScope: PermissionDataScope;
  requiresTwoFactor?: boolean;
}

export interface CustomerProfile {
  labName: string;
  customerCode: string;
  customerType: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  creditLimit: number;
  creditPeriodDays: number;
  currentOutstanding: number;
  isApproved: boolean;
}

export interface EmployeeProfile {
  employeeCode: string;
  department: string;
  designation: string;
  emergencyPhone?: string;
  isActive: boolean;
  branch?: string;
  region?: string;
  team?: string;
  reportingManagerId?: string;
}

export interface UserSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRoleType;
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'BROWSER';
  browser: string;
  ipAddress: string;
  approxLocation?: string;
  loginAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
  isRevoked: boolean;
  reportedSuspicious?: boolean;
  suspiciousReason?: string;
}

export interface User {
  id: string;
  username?: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  roleType: UserRoleType;
  primaryBusinessRole?: PrimaryBusinessRole;
  status: UserAccountStatus;
  statusHistory?: UserStatusHistoryItem[];
  suspendedReason?: string;
  deactivatedReason?: string;
  activationToken?: string;
  activationExpiresAt?: string;
  dataScope?: PermissionDataScope;
  branch?: string;
  region?: string;
  team?: string;
  assignedCustomerIds?: string[];
  twoFactorEnabled?: boolean;
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  lockReason?: string;
  passwordCreatedAt?: string;
  passwordChangedAt?: string;
  lastLoginAt?: string;
  lastLogoutAt?: string;
  lastLoginIp?: string;
  lastLoginUserAgent?: string;
  lastLoginLocation?: string;
  customerProfile?: CustomerProfile;
  employeeProfile?: EmployeeProfile;
  customerRole?: 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER';
  labId?: string;
  labAddress?: string;
  customerPermissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  permissions: string[];
  expiresIn: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requires2FA?: boolean;
  tempSessionId?: string;
  twoFactorMethod?: string;
}

export interface SecurityTestCase {
  id: string;
  category: string;
  role: UserRoleType;
  module: string;
  action: string;
  dataScope: PermissionDataScope;
  scenario: string;
  expectedResult: 'ALLOW' | 'DENY' | 'ISOLATED' | 'MASKED' | 'LOCKED' | 'CHALLENGE_2FA';
  expectedStatusCode: number;
  actualResult?: string;
  actualStatusCode?: number;
  status?: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL';
  executionTimeMs?: number;
  details?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  details?: any;
  timestamp: string;
}

// ----------------------------------------------------------------------------
// PHASE 2: PRODUCT MASTER, COMPANIES & CATEGORIES TYPES
// ----------------------------------------------------------------------------

export enum ProductType {
  EQUIPMENT = 'EQUIPMENT',
  REAGENT = 'REAGENT',
  RAPID_KIT = 'RAPID_KIT',
  PLASTIC_CONSUMABLE = 'PLASTIC_CONSUMABLE',
  MICROBIOLOGY = 'MICROBIOLOGY',
  FINE_CHEMICAL = 'FINE_CHEMICAL',
  BLOOD_COLLECTION_TUBE = 'BLOOD_COLLECTION_TUBE',
  URINE_STRIP = 'URINE_STRIP',
  CONTROL_CALIBRATOR = 'CONTROL_CALIBRATOR',
}

export enum DocumentType {
  MSDS = 'MSDS',
  IFU_PACK_INSERT = 'IFU_PACK_INSERT',
  CERTIFICATE_CE_FDA = 'CERTIFICATE_CE_FDA',
  BROCHURE = 'BROCHURE',
  USER_MANUAL = 'USER_MANUAL',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
}

export enum StockStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ON_ORDER = 'ON_ORDER',
}

export interface Company {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  website?: string;
  country: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  code: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  level: number;
  path: string;
  isActive: boolean;
  sortOrder: number;
  productsCount?: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends Category {
  children?: CategoryTreeNode[];
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDocument {
  id: string;
  productId: string;
  title: string;
  documentType: DocumentType;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType: string;
  version?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPackOption {
  id: string;
  productId: string;
  packName: string;
  packSku?: string;
  testsCount?: number;
  multiplier: number;
  price: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  catalogNumber?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  companyId: string;
  company?: Company;
  categoryId: string;
  category?: Category;
  productType: ProductType;
  hsnCode: string;
  gstRate: number;
  basePrice: number;
  mrp: number;
  minOrderQuantity: number;
  isColdChain: boolean;
  storageTemperature: string;
  shelfLifeMonths?: number;
  requiresPrescriptionOrAuth: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isDiscontinued: boolean;
  packSize: string;
  stockQuantity: number;
  stockStatus: StockStatus;
  leadTimeDays: number;
  brand?: string;
  classification?: 'EQUIPMENT' | 'REAGENT' | string;
  compatibleEquipment?: string;
  compatibleEquipmentProductIds?: string[];
  compatibleEquipmentModels?: string[];
  compatibleCompany?: string;
  testParameter?: string;
  method?: string;
  unit?: string;
  testsPerPack?: number;
  maxOrderQuantity?: number;
  allowOnlineOrder?: boolean;
  inquiryOnly?: boolean;
  trackInventory?: boolean;
  manufacturerPartNumber?: string;
  images: ProductImage[];
  documents: ProductDocument[];
  packOptions: ProductPackOption[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// PHASE 2A: PRODUCT EXCEL IMPORT & BATCH WORKFLOW TYPES
// ----------------------------------------------------------------------------

export enum ProductImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
}

export enum ImportBatchStatus {
  UPLOADED = 'UPLOADED',
  VALIDATING = 'VALIDATING',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IMPORTING = 'IMPORTING',
  COMPLETED = 'COMPLETED',
  PARTIALLY_FAILED = 'PARTIALLY_FAILED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface RowValidationIssue {
  rowNumber: number; // 1-based Excel row number
  column?: string;
  columnName?: string;
  field?: string;
  value?: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
  remedyHint?: string;
}

export enum CustomerImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
}

export enum PriceContractImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
}

export enum EquipmentImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
}

export enum LedgerImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
}

export enum SalesTargetImportMode {
  CREATE_ONLY = 'CREATE_ONLY',
  UPDATE_ONLY = 'UPDATE_ONLY',
  CREATE_AND_UPDATE = 'CREATE_AND_UPDATE',
}

export interface ValidatedProductRow {
  rowNumber: number;
  sku: string;
  name: string;
  companyNameOrCode: string;
  companyId?: string;
  brand?: string;
  productType: ProductType;
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
  stockStatus: StockStatus;
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

export interface ProductImportBatch {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: UserRoleType;
  importMode: ProductImportMode;
  status: ImportBatchStatus;
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

export interface ImportConfigSettings {
  requireApprovalForProductImport: boolean;
  maxBatchSize: number;
  allowAutoCreateMissingCategories: boolean;
  enforceColdChainStorageRule: boolean;
}

export interface ProductFilterParams {
  search?: string;
  companyId?: string;
  categoryId?: string;
  productType?: ProductType | string;
  packSize?: string;
  availability?: 'ALL' | 'IN_STOCK' | 'COLD_CHAIN';
  isColdChain?: boolean;
  isActive?: boolean | string;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'created_at' | 'sku';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filtersApplied?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// PHASE 3: CUSTOMER MOBILE EXPERIENCE & DYNAMIC HOME TYPES
// ----------------------------------------------------------------------------

export interface MobileBanner {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  imageUrl: string;
  deepLinkType: 'CATEGORY' | 'COMPANY' | 'PRODUCT' | 'OFFER' | 'EXTERNAL';
  deepLinkId?: string;
  backgroundColor?: string;
  textColor?: string;
  sortOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface FeaturedOffer {
  id: string;
  title: string;
  subtitle: string;
  discountTag: string;
  couponCode?: string;
  iconName: string;
  bgGradient: string;
  categoryOrCompanyFilter?: {
    type: 'CATEGORY' | 'COMPANY' | 'PRODUCT_TYPE';
    id: string;
  };
  sortOrder: number;
  isActive: boolean;
}

export interface MobileHomeConfig {
  id: string;
  banners: MobileBanner[];
  featuredOffers: FeaturedOffer[];
  bestSellingProductIds: string[];
  bestSellingEquipmentIds: string[];
  visibility: {
    showBanners: boolean;
    showFeaturedOffers: boolean;
    showCompanySelection: boolean;
    showBestSellingProducts: boolean;
    showBestSellingEquipment: boolean;
    showRecentlyOrdered: boolean;
    showProductComparisonShortcut: boolean;
    showWalletSummary: boolean;
    showQuickCategories: boolean;
  };
  updatedAt: string;
}

export interface CustomerPriceRule {
  id: string;
  customerId: string;
  customerLabName?: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  companyId?: string;
  companyName?: string;
  categoryId?: string;
  categoryName?: string;
  discountPercent?: number;
  customFixedPrice?: number;
  minOrderQuantity?: number;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCalculatedPricing {
  mrp: number;
  basePrice: number;
  customerPrice: number;
  discountPercent: number;
  savingsAmount: number;
  gstRate: number;
  priceWithGst: number;
  appliedRuleType: 'CONTRACT_FIXED_PRICE' | 'CONTRACT_DISCOUNT_PERCENT' | 'COMPANY_TIER_DISCOUNT' | 'DEFAULT_STANDARD_PRICE';
  isCustomContract: boolean;
}

export interface CustomerProduct extends Product {
  pricing: CustomerCalculatedPricing;
}

export interface CustomerOrderItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productImageUrl?: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isColdChain: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerLabName: string;
  items: CustomerOrderItem[];
  itemCount: number;
  subtotal: number;
  gstAmount: number;
  coldChainFee: number;
  grandTotal: number;
  status: 'PENDING_APPROVAL' | 'PROCESSING' | 'DISPATCHED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'CREDIT_ACCOUNT' | 'PAID' | 'PARTIALLY_PAID' | 'PAYMENT_PENDING';
  coldChainMonitoring?: {
    required: boolean;
    targetTemp: string;
    currentTemp: string;
    status: 'OPTIMAL' | 'WARNING' | 'EXCURSION';
    sensorId?: string;
  };
  shippingAddress: string;
  deliveryDate?: string;
  createdAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  date: string;
  type: 'INVOICE_DEBIT' | 'PAYMENT_CREDIT' | 'CREDIT_NOTE' | 'REBATE';
  description: string;
  referenceNumber: string;
  amount: number;
  runningBalance: number;
}

export interface CustomerWallet {
  customerId: string;
  creditLimit: number;
  currentOutstanding: number;
  availableCredit: number;
  creditPeriodDays: number;
  unbilledOrdersCount: number;
  ledgerEntries: WalletLedgerEntry[];
}

export interface CustomerNotification {
  id: string;
  title: string;
  message: string;
  type: 'ORDER_STATUS' | 'COLD_CHAIN_ALERT' | 'EXCLUSIVE_PROMO' | 'PRICE_CHANGE' | 'PAYMENT_RECEIPT';
  isRead: boolean;
  timestamp: string;
  actionDeepLink?: string;
}

export interface ComparisonAttribute {
  name: string;
  category: 'Specs' | 'Pricing' | 'Storage' | 'Compliance';
  values: Record<string, string | number | boolean>;
}

// ----------------------------------------------------------------------------
// PHASE 4: ORDER AND PAYMENT SYSTEM TYPES
// ----------------------------------------------------------------------------

export enum PaymentMethodType {
  ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  CREDIT_ORDER = 'CREDIT_ORDER',
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
}

export enum OrderStatusType {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  DISPATCHED = 'DISPATCHED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatusType {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CREDIT_POSTED = 'CREDIT_POSTED',
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string; // e.g. "Main Pathology Laboratory", "Satellite ICU Center"
  contactPerson: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  gstin?: string;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productImageUrl?: string;
  companyName?: string;
  packOptionId?: string;
  packSize: string;
  packMultiplier: number;
  quantity: number;
  unitPrice: number;
  mrp: number;
  discountPercent: number;
  totalPrice: number;
  isColdChain: boolean;
  itemNotes?: string;
  addedAt: string;
}

export interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  orderNotes?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  attachmentType?: 'PURCHASE_ORDER' | 'PRESCRIPTION' | 'REQUISITION_SLIP' | 'LAB_AUTH';
  updatedAt: string;
}

export interface ImmutablePriceSnapshot {
  subtotal: number;
  taxableAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  isAdvanceDiscountApplied: boolean;
  advanceDiscountPercent: number;
  advanceDiscountAmount: number;
  coldChainFee: number;
  shippingFee: number;
  grandTotal: number;
  currency: string;
  calculatedAt: string;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productImageUrl?: string;
  companyName?: string;
  packOptionId?: string;
  packSize: string;
  packMultiplier: number;
  quantity: number;
  baseMrp: number;
  unitPrice: number;
  discountPercent: number;
  appliedRuleType: string;
  gstRate: number;
  gstAmount: number;
  totalPrice: number;
  isColdChain: boolean;
  storageTemperature?: string;
  itemNotes?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByRole: string;
  comment?: string;
  timestamp: string;
}

export interface PaymentTransaction {
  id: string;
  transactionReference: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerLabName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  gatewayProvider: 'RAZORPAY' | 'CASHFREE' | 'LAB_CREDIT' | 'COD' | 'NEFT_RTGS';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED_SUCCESS' | 'VERIFICATION_FAILED';
  verifiedAt?: string;
  verifiedBy?: string;
  failureReason?: string;
  gatewayResponseRaw?: any;
  createdAt: string;
}

export interface Phase4Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerLabName: string;
  customerCode?: string;
  status: OrderStatusType;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  items: OrderItemSnapshot[];
  itemCount: number;
  pricingSnapshot: ImmutablePriceSnapshot;
  deliveryAddress: CustomerAddress;
  orderNotes?: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  attachmentType?: string;
  coldChainMonitoring?: {
    required: boolean;
    targetTemp: string;
    currentTemp: string;
    status: 'OPTIMAL' | 'WARNING' | 'EXCURSION';
    sensorId?: string;
    telemetryLogs?: { time: string; temp: number; battery: number }[];
  };
  paymentTransactionId?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRulesConfig {
  advanceDiscountPercent: number;
  advanceDiscountEnabled: boolean;
  codEligibility: {
    isEnabled: boolean;
    maxOrderLimit: number;
    allowColdChain: boolean;
    allowedCustomerTiers: string[];
  };
  creditOrderRules: {
    requireApprovalAbove: number;
    maxOverdueGraceDays: number;
    autoApproveIfWithinLimit: boolean;
  };
  updatedAt: string;
}

export interface OrderPreviewCalculation {
  subtotal: number;
  gstAmount: number;
  coldChainFee: number;
  shippingFee: number;
  hasColdChain: boolean;
  advanceDiscountPercent: number;
  advanceDiscountAmount: number;
  grandTotalWithoutAdvance: number;
  grandTotalWithAdvance: number;
  finalGrandTotal: number;
  selectedPaymentMethod: PaymentMethodType;
  isAdvanceDiscountApplied: boolean;
  codEligibility: {
    isEligible: boolean;
    reason?: string;
    maxLimit: number;
  };
  creditEligibility: {
    isEligible: boolean;
    availableCredit: number;
    creditLimit: number;
    currentOutstanding: number;
    creditPeriodDays: number;
    shortfall?: number;
    reason?: string;
  };
  items: OrderItemSnapshot[];
}

// ----------------------------------------------------------------------------
// PHASE 5: SERVICE ENGINEER & COMPLAINT MANAGEMENT MODULE TYPES
// ----------------------------------------------------------------------------

export enum TicketStatusType {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  SCHEDULED = 'SCHEDULED',
  ENGINEER_ON_THE_WAY = 'ENGINEER_ON_THE_WAY',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_PARTS = 'WAITING_FOR_PARTS',
  WAITING_FOR_CUSTOMER = 'WAITING_FOR_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CUSTOMER_FEEDBACK_PENDING = 'CUSTOMER_FEEDBACK_PENDING',
  BACK_OFFICE_REVIEW = 'BACK_OFFICE_REVIEW',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  CUSTOMER_DISPUTED_RESOLUTION = 'CUSTOMER_DISPUTED_RESOLUTION',
}

export enum TicketPriorityType {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComplaintCategoryType {
  EQUIPMENT_BREAKDOWN = 'EQUIPMENT_BREAKDOWN',
  PREVENTIVE_MAINTENANCE = 'PREVENTIVE_MAINTENANCE',
  CALIBRATION_REQUEST = 'CALIBRATION_REQUEST',
  REAGENT_QUALITY_ISSUE = 'REAGENT_QUALITY_ISSUE',
  BILLING_DISPUTE = 'BILLING_DISPUTE',
  LOGISTICS_DELAY = 'LOGISTICS_DELAY',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
}

export enum WarrantyStatusType {
  UNDER_WARRANTY = 'UNDER_WARRANTY',
  OUT_OF_WARRANTY = 'OUT_OF_WARRANTY',
  ACTIVE_AMC = 'ACTIVE_AMC',
  ACTIVE_CMC = 'ACTIVE_CMC',
}

export interface CustomerEquipment {
  id: string;
  customerId: string;
  customerLabName: string;
  customerCode?: string;
  productId: string;
  productSku: string;
  equipmentName: string;
  modelNumber: string;
  serialNumber: string;
  installationDate: string;
  warrantyStatus: WarrantyStatusType;
  warrantyExpiryDate: string;
  locationDepartment: string;
  contactPerson: string;
  contactPhone: string;
  lastServiceDate?: string;
  nextPmDueDate?: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'DECOMMISSIONED';
  qrCode: string;
  imageUrl?: string;
  totalServiceTicketsCount?: number;
  openTicketsCount?: number;
}

export interface PersonalizedCompany extends Company {
  isYourCompany: boolean;
  installedEquipmentCount: number;
  activeContractsCount: number;
  hasOrderHistory: boolean;
  authorizedProductsCount: number;
  categoryTags: string[];
  offersCount?: number;
  isAuthorizedToBrowse: boolean;
}

export interface CustomerEquipmentWithDetails extends CustomerEquipment {
  companyId?: string;
  companyName?: string;
  companyLogoUrl?: string;
  healthScore: number;
  healthStatus: 'OPTIMAL' | 'GOOD' | 'ATTENTION' | 'CRITICAL';
  maintenanceStatusText: string;
  coverageBadgeText: string;
  coverageBadgeColor: string;
  openServiceStatusText: string;
  hasOpenTicket: boolean;
  compatibleReagentsCount: number;
  compatibleReagents: (Product & { pricing?: CustomerCalculatedPricing })[];
}

export interface CustomerInquiry {
  id: string;
  inquiryNumber: string;
  customerId: string;
  customerLabName: string;
  customerContactPerson: string;
  customerPhone: string;
  customerEmail: string;
  productId?: string;
  productName: string;
  productSku?: string;
  companyId?: string;
  companyName?: string;
  inquiryType: 'PURCHASE_QUOTE' | 'REAGENT_RENTAL_LEASE' | 'DEMO_REQUEST' | 'AMC_CMC_PROPOSAL' | 'BULK_CONTRACT';
  monthlyTestVolume?: string;
  labNotes?: string;
  preferredContactMethod: 'PHONE' | 'WHATSAPP' | 'EMAIL' | 'VISIT';
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTATION_DISPATCHED' | 'ACCEPTED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSparePartCatalog {
  id: string;
  partNumber: string;
  partName: string;
  category: 'OPTICAL' | 'FLUIDIC' | 'MECHANICAL' | 'ELECTRONIC' | 'SENSOR' | 'CONSUMABLE';
  compatibleModels: string[];
  unitCost: number;
  mrp: number;
  stockQuantity: number;
  leadTimeDays: number;
}

export interface ServiceNote {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  noteType: 'INTERNAL' | 'CUSTOMER_VISIBLE';
  content: string;
  createdAt: string;
}

export interface ServiceAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType: string;
  attachmentType: 'BEFORE_REPAIR' | 'AFTER_REPAIR' | 'ERROR_LOG' | 'PARTS_PHOTO' | 'CALIBRATION_CERT' | 'CUSTOMER_PO_REPORT';
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface ServicePartItem {
  id: string;
  ticketId: string;
  partId?: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  isWarrantyCovered: boolean;
  isBillable: boolean;
  invoiceNumber?: string;
  addedBy: string;
  addedAt: string;
}

export interface ServiceCheckInInfo {
  timestamp: string;
  latitude: number;
  longitude: number;
  locationName: string;
  distanceFromLabMeters?: number;
  isGeoVerified: boolean;
  initialChecklist: {
    item: string;
    passed: boolean;
    note?: string;
  }[];
}

export interface ServiceCheckOutInfo {
  timestamp: string;
  durationMinutes: number;
  workSummary: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceResolution {
  rootCause: string;
  actionTaken: string;
  testRunResult: string;
  reagentLotTested?: string;
  calibrationPassed: boolean;
  qcValueObserved?: string;
  resolvedAt: string;
  resolvedBy: string;
  resolvedByName: string;
}

export interface ServiceChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  isCustomerVisible: boolean;
  timestamp: string;
}

export interface CustomerServiceFeedback {
  rating: number;
  feedbackNotes?: string;
  customerSignatoryName: string;
  customerDesignation?: string;
  signatureDataUrl?: string;
  submittedAt: string;
}

export interface BackOfficeReview {
  reviewedBy: string;
  reviewedByName: string;
  reviewedAt: string;
  isApproved: boolean;
  totalBillingAmount: number;
  warrantyApproved: boolean;
  qaPassed: boolean;
  reviewNotes: string;
}

export interface TicketDisputeEntry {
  id: string;
  disputedAt: string;
  disputedBy: string;
  disputedByName: string;
  disputeReason: string;
  actionTaken?: string;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerLabName: string;
  customerContactPerson: string;
  customerPhone: string;
  customerAddress?: string;
  category: ComplaintCategoryType;
  equipmentId?: string;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
  priority: TicketPriorityType;
  title: string;
  description: string;
  errorCode?: string;
  status: TicketStatusType;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerPhone?: string;
  assignedEngineerEmail?: string;
  assignedAt?: string;
  slaTargetHours: number;
  slaTargetTimestamp: string;
  slaStatus: 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'MET';
  acknowledgedAt?: string;
  scheduledVisitDate?: string;
  scheduledVisitSlot?: string;
  engineerOnTheWayAt?: string;
  checkIn?: ServiceCheckInInfo | null;
  checkOut?: ServiceCheckOutInfo | null;
  notes: ServiceNote[];
  attachments: ServiceAttachment[];
  partsUsed: ServicePartItem[];
  resolution?: ServiceResolution | null;
  customerCommunication: ServiceChatMessage[];
  customerFeedback?: CustomerServiceFeedback | null;
  backOfficeReview?: BackOfficeReview | null;
  disputeHistory: TicketDisputeEntry[];
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceEngineerProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  employeeCode: string;
  specialization: string[];
  activeTicketsCount: number;
  resolvedTicketsMonth: number;
  avgResolutionTimeHours: number;
  customerSatisfactionScore: number;
  currentStatus: 'AVAILABLE' | 'ON_CALL' | 'TRAVELING' | 'ON_LEAVE';
  currentLocation?: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
}

export interface ServiceDeskStats {
  totalTickets: number;
  newTickets: number;
  assignedTickets: number;
  inProgressTickets: number;
  waitingForPartsTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  disputedTickets: number;
  slaBreachedCount: number;
  slaComplianceRate: number;
  avgResolutionTimeHours: number;
  customerSatisfactionAvg: number;
  equipmentBreakdownCount: number;
  reagentComplaintCount: number;
}

// ----------------------------------------------------------------------------
// NON-NEGOTIABLE CORE SYSTEM RULES: VISIBILITY, PRICING AUTHORITY, IMMUTABLE SNAPSHOTS
// ----------------------------------------------------------------------------

export enum AccessRuleType {
  FORCE_HIDE = 'FORCE_HIDE',
  FORCE_SHOW = 'FORCE_SHOW',
  EXPLICIT_ACCESS = 'EXPLICIT_ACCESS',
  RESTRICTED = 'RESTRICTED',
}

export enum PricingRuleTier {
  CONTRACT_SKU = 'CONTRACT_SKU',
  CUSTOMER_EQUIPMENT = 'CUSTOMER_EQUIPMENT',
  QUANTITY_SLAB = 'QUANTITY_SLAB',
  PAYMENT_TERM = 'PAYMENT_TERM',
  PROMOTION = 'PROMOTION',
  CUSTOMER_CATEGORY = 'CUSTOMER_CATEGORY',
  CUSTOMER_BRAND = 'CUSTOMER_BRAND',
  STANDARD = 'STANDARD',
}

export enum RuleApprovalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface QuantitySlab {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice?: number;
  discountPercent?: number;
}

export interface ProductAccessRule {
  id: string;
  ruleType: AccessRuleType | string;
  customerId?: string;
  customerLabName?: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  categoryId?: string;
  companyId?: string;
  reason?: string;
  isActive: boolean;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  approvalStatus: RuleApprovalStatus | string;
  makerId: string;
  makerEmail: string;
  checkerId?: string;
  checkerEmail?: string;
  approvedAt?: string;
  rejectionReason?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedCustomerPriceRule {
  id: string;
  customerId: string;
  customerLabName?: string;
  ruleTier: PricingRuleTier | string;
  productId?: string;
  productSku?: string;
  productName?: string;
  equipmentId?: string;
  equipmentName?: string;
  companyId?: string;
  companyName?: string;
  categoryId?: string;
  categoryName?: string;
  customFixedPrice?: number;
  discountPercent?: number;
  quantitySlabs?: QuantitySlab[];
  paymentMethod?: PaymentMethodType | string;
  priority: number;
  isActive: boolean;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  validUntil?: string;
  approvalStatus: RuleApprovalStatus | string;
  makerId: string;
  makerEmail: string;
  checkerId?: string;
  checkerEmail?: string;
  approvedAt?: string;
  rejectionReason?: string;
  pricingVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderAmendmentEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  amendedBy: string;
  amendedByName: string;
  amendedByRole: string;
  amendmentType: 'PRICE_CORRECTION_CREDIT_NOTE' | 'ITEM_SUBSTITUTION' | 'QUANTITY_ADJUSTMENT' | 'ADMIN_OVERRIDE';
  originalSubtotal: number;
  revisedSubtotal: number;
  creditNoteNumber?: string;
  creditAmount?: number;
  justification: string;
  makerId: string;
  checkerId: string;
  approvedAt: string;
  createdAt: string;
}

export interface CoreRuleTestResult {
  testNumber: number;
  name: string;
  category: 
    | 'SERVER_SIDE_VISIBILITY' 
    | 'EQUIPMENT_COMPATIBILITY' 
    | 'FORCE_OVERRIDE' 
    | 'PRICING_AUTHORITY' 
    | 'QUANTITY_SLABS' 
    | 'PAYMENT_METHOD_PRICE' 
    | 'TAMPER_PROTECTION' 
    | 'IMMUTABLE_SNAPSHOT' 
    | 'MAKER_CHECKER_SECURITY' 
    | 'IDEMPOTENCY_INTEGRITY';
  passed: boolean;
  message: string;
  durationMs: number;
  details?: any;
}

export interface CoreRulesAuditSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  executionDate: string;
  status: 'ALL_PASSED_PRODUCTION_GO' | 'FAILED_ACTION_REQUIRED';
  categories: {
    visibilitySecurity: { passed: boolean; count: number };
    pricingAuthority: { passed: boolean; count: number };
    orderSnapshotIntegrity: { passed: boolean; count: number };
    makerCheckerSecurity: { passed: boolean; count: number };
    idempotencyAndTamperProof: { passed: boolean; count: number };
  };
}

// ----------------------------------------------------------------------------
// PHASE: CUSTOMER LOGIN, HOME SCREEN & SERVICE FEEDBACK TYPES
// ----------------------------------------------------------------------------

export interface CustomerDeviceSession {
  id: string;
  userId: string;
  customerId?: string;
  deviceName: string;
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET';
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrentSession: boolean;
  createdAt: string;
  revoked?: boolean;
}

export interface CustomerPendingAction {
  id: string;
  type: 
    | 'PAYMENT_DUE'
    | 'OUTSTANDING_BALANCE'
    | 'OPEN_COMPLAINT'
    | 'ENGINEER_ASSIGNED'
    | 'SERVICE_APPOINTMENT'
    | 'ORDER_REQUIRES_ATTENTION'
    | 'PAYMENT_PENDING'
    | 'ADVANCE_PAYMENT_AVAILABLE'
    | 'REWARD_POINTS_AVAILABLE'
    | 'PREVENTIVE_MAINTENANCE_DUE'
    | 'CUSTOMER_FEEDBACK_REQUIRED';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  dueDate?: string;
  amount?: number;
  targetId?: string;
  deepLinkScreen: string;
  deepLinkParams?: Record<string, any>;
  actionLabel: string;
}

export interface CustomerMaintenanceReminder {
  id: string;
  equipmentId: string;
  equipmentName: string;
  companyName: string;
  serialNumber?: string;
  status: 'OVERDUE' | 'DUE_SOON' | 'SCHEDULED' | 'HEALTHY';
  dueDate: string;
  daysRemaining: number;
  lastServiceDate?: string;
  scheduledServiceDate?: string;
  engineerName?: string;
  urgencyText: string;
}

// ----------------------------------------------------------------------------
// PHASE: PREVENTIVE MAINTENANCE MODULE TYPES (Lifecycle, Coverage, Health, Checklists)
// ----------------------------------------------------------------------------

export type EquipmentCoverageState =
  | 'UNDER_WARRANTY'
  | 'WARRANTY_EXPIRING_SOON'
  | 'WARRANTY_EXPIRED'
  | 'UNDER_AMC'
  | 'AMC_EXPIRING_SOON'
  | 'AMC_EXPIRED'
  | 'UNDER_CMC'
  | 'CMC_EXPIRING_SOON'
  | 'CMC_EXPIRED'
  | 'NO_ACTIVE_COVERAGE';

export type PmFrequencyType = 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'HALF_YEARLY' 
  | 'ANNUAL' 
  | 'CUSTOM_INTERVAL' 
  | 'USAGE_BASED';

export type EquipmentHealthLevel = 'HEALTHY' | 'ATTENTION' | 'AT_RISK' | 'CRITICAL';

export interface CoverageRecord {
  id: string;
  equipmentId: string;
  coverageType: 'WARRANTY' | 'AMC' | 'CMC';
  provider: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  coveredServices: string[];
  coveredParts: string[];
  exclusions: string[];
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWED' | 'TERMINATED';
  documentAttachments?: Array<{ name: string; url: string }>;
  renewalReminderDates: string[];
  renewalHistory?: Array<{ date: string; previousContractNumber: string; renewedBy: string }>;
  createdAt: string;
}

export interface EquipmentHealthFactor {
  name: string;
  scoreImpact: number; // e.g. -15 or +10
  detail: string;
  category: 'PM_COMPLIANCE' | 'TICKET_HISTORY' | 'REPEAT_FAULTS' | 'AGE' | 'COVERAGE';
}

export interface EquipmentHealthScore {
  score: number; // 0 - 100
  level: EquipmentHealthLevel;
  colorClass: string;
  factors: EquipmentHealthFactor[];
  mtbfHours?: number;
  mttrHours?: number;
  openTicketCount: number;
  lastCalculatedAt: string;
}

export type PmWorkOrderStatus =
  | 'SCHEDULED'
  | 'DUE_SOON'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'PENDING_PARTS'
  | 'PENDING_CUSTOMER'
  | 'COMPLETED'
  | 'CUSTOMER_CONFIRMATION_PENDING'
  | 'CLOSED'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'FAILED_VALIDATION';

export type PmChecklistItemResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE';

export type PmChecklistCategory =
  | 'VISUAL'
  | 'CLEANING'
  | 'ELECTRICAL'
  | 'MECHANICAL'
  | 'FLUIDICS'
  | 'TEMPERATURE'
  | 'CALIBRATION'
  | 'QC'
  | 'CONSUMABLES'
  | 'SOFTWARE'
  | 'SAFETY'
  | 'PERFORMANCE';

export interface PmChecklistItemDefinition {
  id: string;
  category: PmChecklistCategory;
  title: string;
  description: string;
  isMandatory: boolean;
  requiresReading: boolean;
  expectedRange?: string;
  readingUnit?: string;
}

export interface PmChecklistTemplate {
  id: string;
  templateName: string;
  companyName: string;
  equipmentType: string;
  modelNumber: string;
  maintenancePlan: string;
  items: PmChecklistItemDefinition[];
  version: number;
  isActive: boolean;
}

export interface PmChecklistSubmittedItem {
  itemId: string;
  category: PmChecklistCategory;
  title: string;
  isMandatory: boolean;
  result: PmChecklistItemResult;
  observedReading?: string;
  readingUnit?: string;
  expectedRange?: string;
  engineerNotes?: string;
  photoAttachmentUrl?: string;
}

export interface PmWorkOrder {
  id: string;
  pmWorkOrderNumber: string;
  equipmentId: string;
  equipmentName: string;
  modelNumber: string;
  serialNumber: string;
  companyName: string;
  customerId: string;
  customerLabName: string;
  customerAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  coverageType: 'WARRANTY' | 'AMC' | 'CMC' | 'NO_ACTIVE_COVERAGE';
  coverageStatus: EquipmentCoverageState;
  maintenancePlan: string;
  pmFrequency: PmFrequencyType;
  scheduledDueDate: string;
  reminderWindowStartDate: string;
  periodKey: string; // e.g. '2026-Q3'
  status: PmWorkOrderStatus;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerPhone?: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
  checklistTemplateId: string;
  checklistItems: PmChecklistSubmittedItem[];
  partsReplaced?: Array<{
    partId: string;
    partNumber: string;
    partName: string;
    quantity: number;
    unitCost: number;
    isCovered: boolean;
  }>;
  generatedServiceTicketId?: string;
  customerSignatureUrl?: string;
  customerSignatoryName?: string;
  engineerNotes?: string;
  auditHistory: Array<{
    timestamp: string;
    fromStatus: string;
    toStatus: string;
    userId: string;
    userName: string;
    userRole: string;
    reason?: string;
  }>;
  nextGeneratedPmDate?: string;
  offlineSyncStatus?: SyncItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EngineerQualification {
  engineerId: string;
  engineerName: string;
  email: string;
  phone: string;
  qualifiedModels: string[];
  authorizedTerritories: string[];
  activeWorkloadCount: number;
  maxConcurrentJobs: number;
  isAvailable: boolean;
}

export interface EquipmentTimelineEvent {
  id: string;
  equipmentId: string;
  eventType: 'INSTALLATION' | 'PREVENTIVE_MAINTENANCE' | 'SERVICE_TICKET' | 'PART_REPLACEMENT' | 'REPEAT_FAULT' | 'COVERAGE_RENEWAL';
  title: string;
  description: string;
  status: string;
  date: string;
  referenceId?: string;
  performerName?: string;
  severity?: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export interface ComprehensiveEquipmentDetail extends CustomerEquipment {
  companyName: string;
  coverageState: EquipmentCoverageState;
  activeCoverage?: CoverageRecord;
  coverageHistory: CoverageRecord[];
  healthScore: EquipmentHealthScore;
  pmFrequency: PmFrequencyType;
  maintenancePlan: string;
  lastPmDate?: string;
  nextPmDueDate: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerPhone?: string;
  activePmWorkOrder?: PmWorkOrder;
  pmWorkOrderHistory: PmWorkOrder[];
  timeline: EquipmentTimelineEvent[];
  openTicketsCount: number;
  totalServiceTicketsCount: number;
}

export interface PmAdminDashboardMetrics {
  totalEquipment: number;
  pmDueSoon: number;
  pmDueToday: number;
  pmOverdue: number;
  pmCompletedOnTime: number;
  pmComplianceRatePercent: number;
  warrantyExpiringCount: number;
  amcExpiringCount: number;
  cmcExpiringCount: number;
  noCoverageCount: number;
  criticalHealthEquipmentCount: number;
  repeatFaultEquipmentCount: number;
  engineerWorkloads: Array<{
    engineerId: string;
    engineerName: string;
    activePmCount: number;
    activeBreakdownCount: number;
    totalAssigned: number;
    complianceRate: number;
  }>;
}


// ----------------------------------------------------------------------------
// PHASE: OFFLINE, SYNC & POOR-NETWORK RESILIENCE ENGINE TYPES
// ----------------------------------------------------------------------------

export type NetworkConnectionState = 
  | 'ONLINE'
  | 'OFFLINE'
  | 'CONNECTING'
  | 'SYNCING'
  | 'LIMITED_CONNECTION'
  | 'SERVER_UNAVAILABLE';

export type OfflineFeaturePolicyClass = 
  | 'FULLY_OFFLINE_CAPABLE'  // Cached read-only access (Customer profile, equipment list, cached products)
  | 'OFFLINE_DRAFT_ONLY'     // Can draft locally, clearly marked "DRAFT - NOT SYNCED" (Expenses, visits, service notes, cart drafts)
  | 'QUEUE_FOR_SERVER_SYNC'  // Field events queued for auto-sync with idempotency key (Attendance, field updates, feedback)
  | 'ONLINE_REQUIRED';       // Strict server authority (Final order placement, credit approval, wallet redemption, financial ledger)

export type SyncItemStatus = 
  | 'PENDING'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'CONFLICT'
  | 'REQUIRES_USER_ACTION';

export type SyncActionType = 
  | 'ATTENDANCE_CHECKIN'
  | 'ATTENDANCE_CHECKOUT'
  | 'CUSTOMER_CHECKIN'
  | 'CUSTOMER_CHECKOUT'
  | 'EXPENSE_SUBMISSION'
  | 'VISIT_REPORT'
  | 'SERVICE_WORK_UPDATE'
  | 'SERVICE_FEEDBACK_SUBMISSION'
  | 'COMPLAINT_FIELD_UPDATE'
  | 'PHOTO_ATTACHMENT_UPLOAD'
  | 'ORDER_DRAFT_SYNC';

export interface GeoLocationSnapshot {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  deviceTimestamp: string;
  status: 'LOCATION_CAPTURED_OFFLINE' | 'LOCATION_VERIFIED_BY_SERVER' | 'PERMISSION_DENIED';
}

export interface SyncQueueItem<T = any> {
  id: string; // Local Action ID
  idempotencyKey: string; // Unique idempotency token
  userId: string;
  customerId?: string;
  deviceId: string;
  actionType: SyncActionType;
  policyClass: OfflineFeaturePolicyClass;
  createdAt: string; // Local Device Time
  serverConfirmedAt?: string;
  businessData: T;
  location?: GeoLocationSnapshot;
  attachmentDataUrl?: string;
  syncStatus: SyncItemStatus;
  retryCount: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  conflictResolution?: 'SERVER_WINS' | 'CLIENT_CHANGE_ACCEPTED' | 'MERGE_REQUIRED' | 'MERGE_FIELDS' | 'USER_ACTION_REQUIRED';
}

export interface OfflineSyncSummary {
  networkState: NetworkConnectionState;
  pendingCount: number;
  syncingCount: number;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  lastSuccessfulSyncAt: string | null;
  items: SyncQueueItem[];
}

export interface AttendanceActionPayload {
  engineerId: string;
  engineerName: string;
  punchType: 'PUNCH_IN' | 'PUNCH_OUT';
  shift: 'GENERAL_MORNING' | 'EVENING_EMERGENCY' | 'NIGHT_ONCALL';
  odometerReadingKm?: number;
  batteryLevelPercent?: number;
  selfieVerificationUrl?: string;
  notes?: string;
}

export interface ServiceDraftPayload {
  ticketId: string;
  ticketNumber: string;
  customerLabName: string;
  equipmentName?: string;
  serialNumber?: string;
  preliminaryObservations: string;
  draftActionTaken: string;
  testRunCompleted?: boolean;
  sparePartsDraft?: Array<{
    partId: string;
    partName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
  }>;
  customerAcknowledgedBy?: string;
  customerDesignation?: string;
}

export interface VisitReportPayload {
  labName: string;
  labAddress?: string;
  doctorOrDirectorName: string;
  contactNumber?: string;
  discussionSummary: string;
  followUpRequired: boolean;
  followUpDate?: string;
  sampleCollectionRequired: boolean;
  competitorReagentsNoticed?: string;
  estimatedMonthlyPotentialInr?: number;
}

export interface ExpenseSubmissionPayload {
  expenseCategory: 'TRAVEL_FUEL' | 'MEALS_PER_DIEM' | 'HOTEL_LODGING' | 'TOLL_PARKING' | 'EMERGENCY_FREIGHT' | 'CLIENT_HOSPITALITY';
  amount: number;
  currency: string;
  billNumber?: string;
  billDate: string;
  merchantName?: string;
  description: string;
  receiptAttachmentUrl?: string;
}

export interface FeedbackSubmissionPayload {
  ticketId: string;
  ticketNumber: string;
  overallRating: number; // 1-5
  punctualityRating: number; // 1-5
  technicalCompetenceRating: number; // 1-5
  feedbackComments: string;
  recommendToOtherLabs: boolean;
}

export interface ConflictDetails {
  itemId: string;
  actionType: SyncActionType;
  conflictType: 'SERVER_REVISION_AHEAD' | 'TICKET_ALREADY_CLOSED' | 'DUPLICATE_PUNCH_RECORD' | 'INSUFFICIENT_STOCK_SERVER';
  message: string;
  serverData: any;
  clientData: any;
  detectedAt: string;
  resolutionOptions: Array<'SERVER_WINS' | 'CLIENT_CHANGE_ACCEPTED' | 'MERGE_FIELDS'>;
}

export interface SyncBatchResultItem {
  id: string; // queue item id
  idempotencyKey: string;
  actionType: SyncActionType;
  status: SyncItemStatus;
  isIdempotencyReplay: boolean;
  serverConfirmedAt: string;
  serverEntityId?: string;
  message: string;
  errorMessage?: string;
  conflictDetails?: ConflictDetails;
}

export interface SyncBatchResponse {
  statusCode: number;
  batchId: string;
  processedCount: number;
  successCount: number;
  replayCount: number;
  failureCount: number;
  conflictCount: number;
  results: SyncBatchResultItem[];
  timestamp: string;
}

export interface OfflineSyncTestResult {
  testNumber: number;
  name: string;
  category: 
    | 'NETWORK_DETECTION'
    | 'CACHED_ACCESS'
    | 'OFFLINE_DRAFT'
    | 'SYNC_QUEUE_IDEMPOTENCY'
    | 'LOCATION_VERIFICATION'
    | 'SERVICE_OFFLINE'
    | 'CUSTOMER_ORDER_REPRICING'
    | 'ONLINE_REQUIRED_AUTHORITY'
    | 'CONFLICT_RESOLUTION'
    | 'SECURITY_CLEANUP';
  passed: boolean;
  message: string;
  durationMs: number;
}

// ----------------------------------------------------------------------------
// PHASE 3A, 4A, 5A, 6A, 7A: ENTERPRISE EXCEL IMPORT & AUDIT TYPES
// ----------------------------------------------------------------------------

export enum BulkImportPhaseType {
  PHASE_2A_PRODUCTS = 'PHASE_2A_PRODUCTS',
  PHASE_3A_CUSTOMERS = 'PHASE_3A_CUSTOMERS',
  PHASE_4A_SPECIAL_PRICING = 'PHASE_4A_SPECIAL_PRICING',
  PHASE_5A_EQUIPMENT = 'PHASE_5A_EQUIPMENT',
  PHASE_6A_OPENING_LEDGER = 'PHASE_6A_OPENING_LEDGER',
  PHASE_7A_SALES_TARGETS = 'PHASE_7A_SALES_TARGETS',
}

// ----------------------------------------------------------------------------
// PHASE 3A: CUSTOMER MASTER IMPORT TYPES
// ----------------------------------------------------------------------------

export interface ValidatedCustomerRow {
  rowNumber: number;
  customerCode: string;
  labName: string;
  customerType: 'PATHOLOGY_LAB' | 'HOSPITAL' | 'DIAGNOSTIC_CENTER' | 'CLINIC' | 'RESEARCH_INSTITUTE';
  contactPerson: string;
  designation?: string;
  phone: string;
  email: string;
  gstin: string;
  panNumber?: string;
  drugLicenseNo?: string;
  clinicalEstablishmentNo?: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  shippingAddressSameAsBilling: boolean;
  shippingAddressLine1?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPincode?: string;
  territory: string;
  assignedSalesRepId?: string;
  assignedSalesRepName?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  creditLimit: number;
  creditDays: number;
  discountTier: 'TIER_A_15PCT' | 'TIER_B_10PCT' | 'TIER_C_5PCT' | 'STANDARD_NET';
  status: 'ACTIVE' | 'SUSPENDED' | 'ON_HOLD' | 'LEAD';
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  isExisting: boolean;
  existingCustomerId?: string;
  errors: RowValidationIssue[];
  warnings: RowValidationIssue[];
  isValid: boolean;
}

export interface CustomerImportBatch {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: UserRoleType;
  importMode: ProductImportMode;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newCustomersCount: number;
  updatedCustomersCount: number;
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
  parsedRows: ValidatedCustomerRow[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// PHASE 4A: CUSTOMER-SPECIFIC PRICE MASTER IMPORT TYPES
// ----------------------------------------------------------------------------

export interface ValidatedPriceContractRow {
  rowNumber: number;
  customerCodeOrId: string;
  customerLabName?: string;
  customerId?: string;
  productSku: string;
  productName?: string;
  productId?: string;
  contractType: 'CUSTOM_NET_RATE' | 'DISCOUNT_PERCENT_ON_MRP' | 'DISCOUNT_PERCENT_ON_BASE' | 'FLAT_MARGIN_FIXED';
  contractNetPrice: number;
  discountPercent: number;
  minOrderQuantity: number;
  effectiveStartDate: string;
  effectiveEndDate: string;
  isPriceLocked: boolean;
  mrp: number;
  standardBasePrice: number;
  contractSavingsPercent: number;
  contractNotes?: string;
  contractStatus: 'ACTIVE' | 'EXPIRED' | 'PENDING_REVIEW';
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  isExisting: boolean;
  existingContractId?: string;
  errors: RowValidationIssue[];
  warnings: RowValidationIssue[];
  isValid: boolean;
}

export interface PriceContractImportBatch {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: UserRoleType;
  importMode: ProductImportMode;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newContractsCount: number;
  updatedContractsCount: number;
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
  parsedRows: ValidatedPriceContractRow[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// PHASE 5A: INSTALLED BASE EQUIPMENT IMPORT TYPES
// ----------------------------------------------------------------------------

export interface ValidatedEquipmentRow {
  rowNumber: number;
  serialNumber: string;
  equipmentModelOrSku: string;
  equipmentName: string;
  oemCompanyName: string;
  oemCompanyId?: string;
  customerCode: string;
  customerLabName: string;
  customerId?: string;
  locationDepartment: string;
  installationDate: string;
  contractStatus: 'UNDER_WARRANTY' | 'ACTIVE_AMC' | 'ACTIVE_CMC' | 'EXPIRED' | 'NO_CONTRACT';
  contractStartDate?: string;
  contractEndDate?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  pmFrequency: 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';
  lastServiceDate?: string;
  nextPmDueDate: string;
  operationalStatus: 'OPTIMAL' | 'OPERATIONAL' | 'DEGRADED' | 'BREAKDOWN_CRITICAL' | 'STANDBY' | 'DECOMMISSIONED';
  healthScore: number;
  qrCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  isExisting: boolean;
  existingEquipmentId?: string;
  errors: RowValidationIssue[];
  warnings: RowValidationIssue[];
  isValid: boolean;
}

export interface EquipmentImportBatch {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: UserRoleType;
  importMode: ProductImportMode;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  newEquipmentCount: number;
  updatedEquipmentCount: number;
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
  parsedRows: ValidatedEquipmentRow[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// PHASE 6A: OPENING LEDGER & INVOICES IMPORT TYPES
// ----------------------------------------------------------------------------

export interface ValidatedLedgerRow {
  rowNumber: number;
  customerCode: string;
  customerLabName: string;
  customerId?: string;
  balanceType: 'DEBIT_RECEIVABLE' | 'CREDIT_ADVANCE';
  documentNumber: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  agingBracket: '0-30 DAYS' | '31-60 DAYS' | '61-90 DAYS' | '91-180 DAYS' | '180+ DAYS';
  paymentTerms: string;
  salesRepName?: string;
  customerCreditLimit?: number;
  creditLimitExceeded?: boolean;
  remarks?: string;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  isExisting: boolean;
  existingLedgerId?: string;
  errors: RowValidationIssue[];
  warnings: RowValidationIssue[];
  isValid: boolean;
}

export interface LedgerImportBatch {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: UserRoleType;
  importMode: ProductImportMode;
  status: ImportBatchStatus;
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
  parsedRows: ValidatedLedgerRow[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// PHASE 7A: SALES TARGET & QUOTA IMPORT TYPES
// ----------------------------------------------------------------------------

export interface ValidatedSalesTargetRow {
  rowNumber: number;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  fiscalYear: string;
  periodName: string;
  salesRepEmailOrId: string;
  salesRepName: string;
  salesRepId?: string;
  territoryCode: string;
  territoryName: string;
  productDivision: string;
  brandFocus: string;
  revenueTargetAmount: number;
  collectionTargetAmount: number;
  newCustomerTargetCount: number;
  equipmentUnitTargetCount: number;
  incentiveSlab: 'TIER_1_STANDARD' | 'TIER_2_ACCELERATOR' | 'TIER_3_PRESIDENT_CLUB';
  remarks?: string;
  action: 'CREATE' | 'UPDATE' | 'SKIP' | 'ERROR';
  isExisting: boolean;
  existingTargetId?: string;
  errors: RowValidationIssue[];
  warnings: RowValidationIssue[];
  isValid: boolean;
}

export interface SalesTargetImportBatch {
  id: string;
  batchNumber: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedByUserEmail: string;
  uploadedByUserRole: UserRoleType;
  importMode: ProductImportMode;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  totalRevenueQuota: number;
  totalCollectionQuota: number;
  newTargetsCount: number;
  updatedTargetsCount: number;
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
  parsedRows: ValidatedSalesTargetRow[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// BACK OFFICE DASHBOARD ENHANCEMENT TYPES (PHASES BO-1 TO BO-13)
// ============================================================================

export type WorkItemPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WorkItemStatus = 
  | 'OVERDUE' 
  | 'DUE TODAY' 
  | 'HIGH PRIORITY' 
  | 'PENDING' 
  | 'IN PROGRESS' 
  | 'WAITING FOR APPROVAL' 
  | 'COMPLETED';

export type WorkItemModule = 
  | 'ORDERS'
  | 'PAYMENTS'
  | 'APPROVALS'
  | 'CUSTOMERS'
  | 'SERVICE'
  | 'PM'
  | 'IMPORTS'
  | 'SALES'
  | 'LEDGER'
  | 'SYSTEM';

export interface MyWorkItem {
  id: string;
  title: string;
  shortDescription: string;
  module: WorkItemModule;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  dueDate: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserRole?: UserRoleType;
  targetRecordType: string;
  targetRecordId: string;
  navigationTab: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalRequestType =
  | 'SPECIAL_PRICE_CONTRACT'
  | 'OPENING_LEDGER_IMPORT'
  | 'CREDIT_LIMIT_INCREASE'
  | 'LARGE_DISCOUNT_ORDER'
  | 'WALLET_ADJUSTMENT'
  | 'PRODUCT_STATUS_CHANGE'
  | 'CUSTOMER_IMPORT_BATCH'
  | 'EQUIPMENT_DECOMMISSION';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ApprovalRequest {
  id: string;
  requestNumber: string;
  requestType: ApprovalRequestType;
  title: string;
  description: string;
  module: WorkItemModule;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserEmail: string;
  requestedByUserRole: UserRoleType;
  requestedAt: string;
  status: ApprovalStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  entityId: string;
  entityName: string;
  beforeValue?: any;
  afterValue?: any;
  financialImpactAmount?: number;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  auditLogId?: string;
}

export type BackgroundJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
export type BackgroundJobType = 
  | 'EXCEL_IMPORT_PROCESSING'
  | 'PDF_REPORT_GENERATION'
  | 'PM_REMINDER_NOTIFICATIONS'
  | 'OFFLINE_SYNC_REPLAY'
  | 'DATABASE_INTEGRITY_CHECK'
  | 'LEDGER_RECONCILIATION';

export interface BackgroundJob {
  id: string;
  jobType: BackgroundJobType;
  title: string;
  status: BackgroundJobStatus;
  progressPercent: number;
  idempotencyKey: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  payloadSummary?: string;
  triggeredByUserName: string;
  triggeredByUserRole: UserRoleType;
  createdAt: string;
}

export interface SystemHealthDetails {
  apiHealth: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  databaseStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  databasePool: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
  };
  serverUptimeSeconds: number;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  backgroundJobsSummary: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  importEngineStatus: {
    activeBatches: number;
    failedBatches24h: number;
    successRatePercent: number;
  };
  notificationQueueStatus: {
    pendingEmails: number;
    pendingSms: number;
    failedDeliveryCount: number;
  };
  backupStatus: {
    lastSuccessfulBackup: string;
    backupStorageType: string;
    backupSizeBytes: number;
    status: 'OPTIMAL' | 'PENDING' | 'WARNING';
  };
  recentSystemAlerts: Array<{
    id: string;
    severity: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
    timestamp: string;
    source: string;
  }>;
}

export interface GlobalSearchResult {
  id: string;
  category: 'CUSTOMER' | 'ORDER' | 'PRODUCT' | 'EQUIPMENT' | 'SERVICE_TICKET' | 'COMPLAINT';
  title: string;
  subtitle: string;
  badge: string;
  tab: string;
  metadata?: Record<string, string | number>;
}

// ============================================================================
// BO-15A TO BO-15E: STAFF MANAGEMENT TYPES & INTERFACES
// ============================================================================

export type AttendanceStatus = 
  | 'NOT_CHECKED_IN'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'ATTENDANCE_EXCEPTION'
  | 'PENDING_CORRECTION'
  | 'ON_APPROVED_LEAVE'
  | 'PRESENT'
  | 'HALF_DAY'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'MISSING_CHECKOUT';

export type LocationPolicy = 
  | 'NO_LOCATION'
  | 'OFFICE_GEOFENCE'
  | 'FIELD_ANYWHERE'
  | 'CUSTOMER_LOCATION';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  address?: string;
  withinGeofence?: boolean;
  distanceMeters?: number;
  locationType?: 'OFFICE' | 'FIELD' | 'CUSTOMER_SITE' | 'NO_LOCATION';
  officeName?: string;
  verifiedAt?: string;
}

export interface AttendanceCorrectionDetails {
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  appliedAt: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewerComments?: string;
  reviewedAt?: string;
}

export interface StaffAttendanceRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRoleType;
  department?: string;
  date: string; // YYYY-MM-DD
  checkInServerTime?: string;
  checkOutServerTime?: string;
  workingDurationMinutes: number;
  workingDurationFormatted: string;
  status: AttendanceStatus;
  checkInLocation?: LocationCoordinates;
  checkOutLocation?: LocationCoordinates;
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    deviceType?: string;
    sessionId?: string;
  };
  isLateArrival?: boolean;
  lateMinutesCount?: number;
  isHalfDayDeduction?: boolean;
  isEarlyCheckout?: boolean;
  hasMissingCheckout?: boolean;
  isAutoClosed?: boolean;
  lunchStartTime?: string;
  lunchEndTime?: string;
  lunchDurationMinutes?: number;
  isLunchCompleted?: boolean;
  correctionStatus: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
  correctionDetails?: AttendanceCorrectionDetails;
  approvalId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeGeofenceLocation {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
  city: string;
  state: string;
}

export interface AttendanceConfig {
  workStartTime: string; // "09:30"
  lateGracePeriodMinutes: number; // 15
  workEndTime: string; // "18:00"
  autoClosureTime: string; // "19:00"
  lunchDurationMinutes: number; // 40
  minHoursForFullDay: number; // 8.0
  minHoursForHalfDay: number; // 4.0
  officeLocations: OfficeGeofenceLocation[];
  roleLocationPolicies: Record<string, LocationPolicy>;
}

export interface MonthlyAttendanceSummary {
  userId: string;
  userName: string;
  month: string; // YYYY-MM
  totalWorkingDays: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  absentDays: number;
  onLeaveDays: number;
  totalWorkingHours: number;
  avgWorkingHoursPerDay: number;
  correctionRequestsCount: number;
}

// ============================================================================
// SALES FIELD VISITS & MANDATORY LAB SELFIE PROOF
// ============================================================================

export interface FieldVisitRecord {
  id: string;
  salesRepId: string;
  salesRepName: string;
  customerId?: string;
  labName: string;
  labAddress?: string;
  contactPerson: string;
  contactNumber?: string;
  productsDiscussed: string[];
  discussionSummary: string;
  expectedPurchaseDate?: string;
  leadStatus: 'HOT' | 'WARM' | 'COLD' | 'WON' | 'LOST';
  nextFollowUpDate?: string;
  entryTimestamp: string;
  exitTimestamp?: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  photoUrl: string; // Mandatory selfie with face + lab name board
  photoStorageKey?: string;
  photoVerified: boolean;
  idempotencyKey: string;
  createdAt: string;
}

// ============================================================================
// DELIVERY STAFF WORKFLOW & PROOF OF DELIVERY
// ============================================================================

export interface DeliveryAssignmentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerLabName: string;
  deliveryAddress: string;
  contactPerson: string;
  contactPhone: string;
  assignedStaffId: string;
  assignedStaffName: string;
  status: 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED_ATTEMPT';
  totalAmount: number;
  itemCount: number;
  dispatchedAt: string;
  deliveredAt?: string;
  recipientName?: string;
  recipientPhone?: string;
  proofPhotoUrl?: string; // Parcel / Handover photo
  deliveryNotes?: string;
  exceptionReason?: string;
  idempotencyKey: string;
}

// ============================================================================
// APPLICATION SUPPORT TICKETS & PROTOCOL ISSUES
// ============================================================================

export interface ApplicationKitTicketRecord {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerLabName: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  productId?: string;
  productName?: string;
  kitLotNumber?: string;
  ticketType: 'KIT_INSTALLATION' | 'PROTOCOL_OPTIMIZATION' | 'QC_FAILURE' | 'REAGENT_CONTAMINATION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  startedAt?: string;
  resolvedAt?: string;
  issueDescription: string;
  resolutionNotes?: string;
  protocolParameters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// DUAL-CONTROL PAYROLL & FINAL APPROVED SALARY
// ============================================================================

export interface MonthlyPayrollRunRecord {
  id: string;
  payrollMonth: string; // YYYY-MM
  status: 'DRAFT' | 'PREPARED' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  preparedByUserId: string;
  preparedByName: string;
  preparedAt?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAt?: string;
  totalGrossSalary: number;
  totalIncentives: number;
  totalDeductions: number;
  totalNetSalary: number;
  employeeCount: number;
  notes?: string;
  createdAt: string;
}

export interface EmployeeSalaryStatementRecord {
  id: string;
  payrollRunId: string;
  payrollMonth: string;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRoleType;
  baseMonthlySalary: number;
  presentDays: number;
  paidLeavesDays: number;
  unpaidAbsenceDays: number;
  eligibleOvertimeHours: number;
  eligibleOvertimePay: number; // Strictly 0 for Service & Application Support
  approvedIncentives: number;
  itemizedAdditions: Array<{ label: string; amount: number; category: string }>;
  itemizedDeductions: Array<{ label: string; amount: number; reason: string }>;
  netPayableSalary: number;
  isApproved: boolean; // Employees can ONLY view when true
  approvedAt?: string;
  notes?: string;
}

// ============================================================================
// INVENTORY STOCK MOVEMENT LEDGER
// ============================================================================

export interface StockMovementRecord {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: 'INWARD_PURCHASE' | 'OUTWARD_DISPATCH' | 'RETURN_RESTOCK' | 'ADJUSTMENT' | 'DAMAGE_SCRAP' | 'VAN_ISSUE' | 'VAN_RETURN';
  quantityChanged: number; // positive or negative
  balanceAfterMovement: number;
  referenceOrderId?: string;
  performedByUserId: string;
  performedByName: string;
  reason: string;
  batchNumber?: string;
  expiryDate?: string;
  createdAt: string;
}

