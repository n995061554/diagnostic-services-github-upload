// ============================================================================
// CUSTOMER MOBILE APPLICATION DATA MODELS & CONTRACTS
// Production-grade types for Diagnostic & Clinical Laboratory Procurement
// ============================================================================

export type MobileTab = 'home' | 'orders' | 'track' | 'support' | 'more';

// 1. Multi-Location / Site
export interface CustomerSite {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isPrimary: boolean;
  activeEquipmentCount: number;
  contactPerson: string;
  contactPhone: string;
  operatingHours: string;
  licenseNumber: string;
}

// 2. Order Tracking & Delivery Timeline
export type DeliveryStepStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';

export interface DeliveryTimelineStep {
  stepId: string;
  title: string;
  description: string;
  timestamp: string;
  status: DeliveryStepStatus;
  location?: string;
  temperature?: string;
  sensorReading?: string;
  verifiedBy?: string;
}

export interface OrderItemRecord {
  productId: string;
  productName: string;
  productSku: string;
  productImageUrl: string;
  companyName: string;
  packSize: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isColdChain: boolean;
  batchNumber: string;
  lotNumber: string;
  mfgDate: string;
  expiryDate: string;
  storageTemp: string;
  qcReleaseStatus: 'RELEASED' | 'PENDING' | 'QUARANTINED';
}

export interface CustomerOrderDetailed {
  id: string;
  orderNumber: string;
  siteId: string;
  siteName: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  orderDate: string;
  estimatedDelivery: string;
  deliveredDate?: string;
  subtotal: number;
  taxAmount: number;
  coldChainFee: number;
  totalAmount: number;
  paymentStatus: 'CREDIT_ACCOUNT' | 'PAID' | 'PARTIAL';
  paymentMethod: string;
  items: OrderItemRecord[];
  coldChainMonitoring: {
    required: boolean;
    sensorId: string;
    currentTemp: string;
    targetTemp: string;
    status: 'OPTIMAL' | 'WARNING' | 'BREACH';
    lastLogged: string;
    tempHistory: { time: string; temp: number }[];
  };
  carrier: {
    name: string;
    awbNumber: string;
    driverName?: string;
    driverPhone?: string;
    vehicleNumber?: string;
  };
  timeline: DeliveryTimelineStep[];
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

// 3. Service Ticket
export type ServiceTicketCategory = 
  | 'EQUIPMENT_BREAKDOWN'
  | 'PREVENTIVE_MAINTENANCE'
  | 'CALIBRATION_REQUEST'
  | 'REAGENT_QUALITY_ISSUE'
  | 'SOFTWARE_CONNECTIVITY'
  | 'GENERAL_QUERY';

export type ServiceTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ServiceTicketStatus = 
  | 'NEW'
  | 'ASSIGNED'
  | 'ENGINEER_ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'RESOLVED'
  | 'CLOSED';

export interface TicketChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'ENGINEER' | 'AI_BOT' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
  isActionable?: boolean;
}

export interface CustomerServiceTicket {
  id: string;
  ticketNumber: string;
  siteId: string;
  siteName: string;
  equipmentId?: string;
  equipmentName?: string;
  equipmentModel?: string;
  serialNumber?: string;
  category: ServiceTicketCategory;
  priority: ServiceTicketPriority;
  status: ServiceTicketStatus;
  title: string;
  description: string;
  errorCode?: string;
  assignedEngineer?: {
    name: string;
    phone: string;
    designation: string;
    avatarUrl?: string;
    eta?: string;
    currentLocation?: string;
  };
  slaHours: number;
  slaDeadline: string;
  createdAt: string;
  resolvedAt?: string;
  messages: TicketChatMessage[];
  customerRating?: number;
  customerFeedback?: string;
}

// 4. Digital Documents
export type DocumentCategoryType = 
  | 'TAX_INVOICE'
  | 'SERVICE_REPORT'
  | 'CALIBRATION_CERT'
  | 'COA_QUALITY'
  | 'MSDS_IFU';

export interface DigitalDocument {
  id: string;
  category: DocumentCategoryType;
  title: string;
  referenceNumber: string;
  date: string;
  fileSize: string;
  downloadUrl: string;
  siteId: string;
  relatedEquipmentId?: string;
  relatedEquipmentName?: string;
  relatedOrderNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  issuedBy: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
}

// 5. Reagent Expiry Alert
export interface ReagentExpiryItem {
  id: string;
  productId: string;
  productName: string;
  companyName: string;
  companyLogo: string;
  imageUrl: string;
  siteId: string;
  siteName: string;
  batchNumber: string;
  lotNumber: string;
  packSize: string;
  currentStockUnits: number;
  expiryDate: string;
  daysRemaining: number;
  urgencyLevel: 'CRITICAL' | 'WARNING' | 'SAFE'; // <30d, 30-60d, >60d
  storageTemp: string;
  unitPrice: number;
}

// 6. Traceability Record (Material / Batch / Serial)
export interface TraceabilityRecord {
  id: string;
  type: 'REAGENT_BATCH' | 'EQUIPMENT_SERIAL' | 'ORDER_SHIPMENT';
  identifier: string; // e.g. "LOT-TROP-9012" or "ROC-6000-88412"
  title: string;
  subtitle: string;
  siteId: string;
  mfgDate: string;
  expiryDate?: string;
  status: 'ACTIVE' | 'IN_TRANSIT' | 'RELEASED' | 'FLAGGED';
  coldChainCompliant: boolean;
  temperatureLog: {
    minRecorded: number;
    maxRecorded: number;
    averageTemp: number;
    excursionCount: number;
    sensorBattery: string;
    telemetryReadings: { time: string; temp: number }[];
  };
  qualityCertificateNumber: string;
  qualityAuditor: string;
  releaseDate: string;
  chainOfCustody: {
    timestamp: string;
    event: string;
    operator: string;
    facility: string;
  }[];
}

// 7. Notification Record
export interface MobileNotification {
  id: string;
  type: 'ORDER' | 'COLD_CHAIN' | 'EQUIPMENT_PM' | 'EXPIRY' | 'BILLING' | 'SUPPORT';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionType?: 'VIEW_ORDER' | 'VIEW_TICKET' | 'VIEW_EXPIRY' | 'VIEW_DOCUMENT' | 'VIEW_EQUIPMENT';
  actionPayload?: string;
}

// 8. Financial Credit & Payment Status
export type CreditStandingStatus = 'GOOD_STANDING' | 'PAYMENT_DUE_SOON' | 'PAYMENT_OVERDUE';

export interface CustomerCreditProfile {
  customerId: string;
  customerLabName: string;
  creditLimit: number;
  creditDays: number;
  outstandingAmount: number;
  availableCredit: number;
  dueDate: string;
  paymentStatus: CreditStandingStatus;
  daysOverdue: number;
  walletPoints: number;
  businessRating: number;
  paymentReliability: string;
  activeExtensionDays: number;
  hasApprovedExtension: boolean;
  canPlaceCreditOrder: boolean;
  paymentPromises: Array<{
    id: string;
    promisedDate: string;
    amount: number;
    status: 'FULFILLED' | 'PENDING' | 'MISSED';
  }>;
  latePaymentHistory: Array<{
    invoiceNumber: string;
    daysLate: number;
    penaltyPointsDeducted: number;
    paidDate: string;
  }>;
}

export type ExtensionReason =
  | 'Cheque not ready'
  | 'Signature not done'
  | 'Doctor unavailable'
  | 'Accounts approval pending'
  | 'Payment processing delay'
  | 'Internal approval pending'
  | 'Other';

export interface PaymentExtensionRequest {
  id: string;
  customerId: string;
  customerLabName?: string;
  siteName?: string;
  invoiceNumber?: string;
  outstandingAmount: number;
  originalDueDate: string;
  requestedDays: 5 | 10 | 15 | 30;
  reason: ExtensionReason;
  explanation: string;
  promisedPaymentDate: string;
  status: 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedDays?: number;
  internalNotes?: string;
}

// 9. Customer Testimonial
export interface CustomerTestimonial {
  id: string;
  authorName: string;
  designation: string;
  organizationName: string;
  quote: string;
  rating: number;
  isActive: boolean;
  displayOrder: number;
  avatarUrl?: string;
}

// 10. Related / Comparable Product
export interface RelatedProductItem {
  id: string;
  name: string;
  companyName: string;
  packSize: string;
  price: number;
  testsCount?: number;
  category: string;
  compatibility?: string;
  inStock: boolean;
  imageUrl?: string;
  leadTime?: string;
}

// 11. Order Checkout Preview & Calculation
export interface OrderCheckoutPreview {
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  payableSubtotal: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod: 'CREDIT_ACCOUNT' | 'PAY_NOW';
  creditCheck: {
    canOrder: boolean;
    creditLimit: number;
    availableCredit: number;
    outstandingAmount: number;
    daysOverdue: number;
    rejectionReason?: string;
    isOverdueBlocked?: boolean;
  };
}

// 12. Service Response SLA Configuration
export interface ServiceSlaConfig {
  criticalResponseHours: number;
  highResponseHours: number;
  mediumResponseHours: number;
  lowResponseHours: number;
  serviceTierName: string;
  dispatchDescription: string;
  disclaimer: string;
}

// 13. Customer Account & Role-Based Access Types
export type CustomerRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'VIEWER' | 'SERVICE_ENGINEER' | 'SALES_PERSON' | 'OFFICE_ADMIN';

export interface CustomerAuthSession {
  token: string;
  refreshToken?: string;
  role?: CustomerRole;
  name?: string;
  email?: string;
  labName?: string;
  permissions?: string[];
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    customerRole: CustomerRole;
    roleType?: string;
    employeeProfile?: {
      employeeCode: string;
      department: string;
      designation: string;
    };
    labId: string;
    labName: string;
    labAddress: string;
    customerPermissions: string[];
    isApproved: boolean;
    customerProfile?: {
      labName: string;
      customerCode: string;
      customerType: string;
      creditLimit: number;
      creditPeriodDays: number;
      currentOutstanding: number;
      isApproved: boolean;
    };
  };
}

export interface LabTeamMember {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: CustomerRole;
  status: 'ACTIVE' | 'PENDING_ACTIVATION' | 'DEACTIVATED';
  permissions: string[];
  invitedAt?: string;
  lastLoginAt?: string;
}

export interface CustomerFinancialStatusSummary {
  labName?: string;
  totalOutstanding: number;
  overdueAmount: number;
  dueSoonAmount: number;
  creditLimit: number;
  availableCredit: number;
  dueDate: string;
  paymentReliability: string;
  canMakePayments: boolean;
  walletPoints?: number;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    reference: string;
    status: string;
    mode: string;
  }>;
}


