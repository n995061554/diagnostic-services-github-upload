import {
  CustomerOrderDetailed,
  CustomerServiceTicket,
  MobileNotification,
  DeliveryTimelineStep,
  ServiceTicketCategory,
  ServiceTicketPriority,
  ServiceTicketStatus,
  TicketChatMessage,
  CustomerCreditProfile,
  PaymentExtensionRequest,
  CustomerTestimonial,
  RelatedProductItem,
  OrderCheckoutPreview,
  ExtensionReason,
  ServiceSlaConfig,
  CustomerAuthSession,
  LabTeamMember,
  CustomerFinancialStatusSummary
} from './customerAppTypes';
import {
  CUSTOMER_ORDERS_DETAILED,
  CUSTOMER_SERVICE_TICKETS,
  CUSTOMER_NOTIFICATIONS,
  CUSTOMER_FINANCIALS_DEFAULT
} from './mobileMockData';

const BASE_URL = '/api/v1';

let currentCustomerToken: string | null = null;

export const customerAuthStore = {
  getToken: (): string | null => {
    if (currentCustomerToken) return currentCustomerToken;
    try {
      return localStorage.getItem('diagnostic_services_token');
    } catch {
      return null;
    }
  },
  setToken: (token: string | null) => {
    currentCustomerToken = token;
    try {
      if (token) localStorage.setItem('diagnostic_services_token', token);
      else localStorage.removeItem('diagnostic_services_token');
    } catch {}
  },
  getSession: (): CustomerAuthSession | null => {
    try {
      const raw = localStorage.getItem('diagnostic_services_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setSession: (session: CustomerAuthSession | null) => {
    try {
      if (session) {
        localStorage.setItem('diagnostic_services_session', JSON.stringify(session));
        customerAuthStore.setToken(session.token);
      } else {
        localStorage.removeItem('diagnostic_services_session');
        customerAuthStore.setToken(null);
      }
    } catch {}
  },
  clearSession: () => {
    try {
      localStorage.removeItem('diagnostic_services_session');
      localStorage.removeItem('diagnostic_services_token');
    } catch {}
    currentCustomerToken = null;
  }
};

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = customerAuthStore.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}


/**
 * Normalizes backend order representation into high-fidelity CustomerOrderDetailed
 */
function mapBackendOrderToDetailed(backendOrder: any): CustomerOrderDetailed {
  const isColdChain = backendOrder.coldChainMonitoring?.required ?? true;
  const targetTemp = backendOrder.coldChainMonitoring?.targetTemp || '2.0°C - 8.0°C';
  const currentTemp = backendOrder.coldChainMonitoring?.currentTemp || '4.2°C';
  const sensorId = backendOrder.coldChainMonitoring?.sensorId || `IOT-SENS-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Synthesize 6-step cold chain timeline based on status
  const steps: DeliveryTimelineStep[] = [
    {
      stepId: 'step-1',
      title: 'Order Confirmed',
      description: 'Institutional purchase order validated against revolving credit line.',
      timestamp: backendOrder.createdAt ? new Date(backendOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
      status: 'COMPLETED'
    },
    {
      stepId: 'step-2',
      title: 'Cold-Chain Packing & Staging',
      description: 'Validated active cooling packs staged in thermal containers (2°C - 8°C).',
      timestamp: backendOrder.status !== 'CONFIRMED' ? '10:30 AM' : 'Pending',
      status: backendOrder.status === 'CONFIRMED' ? 'IN_PROGRESS' : 'COMPLETED'
    },
    {
      stepId: 'step-3',
      title: 'QC Release & Secondary Verification',
      description: 'NABL Certificate of Analysis (COA) and batch matching verified.',
      timestamp: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendOrder.status) ? '11:15 AM' : 'Pending',
      status: backendOrder.status === 'PROCESSING' ? 'IN_PROGRESS' : ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendOrder.status) ? 'COMPLETED' : 'PENDING'
    },
    {
      stepId: 'step-4',
      title: 'Dispatched via Cold Express',
      description: 'Handed over to MediLogistics Direct Fleet with live IoT GPS & thermistor.',
      timestamp: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendOrder.status) ? '12:00 PM' : 'Pending',
      status: backendOrder.status === 'DISPATCHED' ? 'IN_PROGRESS' : ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendOrder.status) ? 'COMPLETED' : 'PENDING'
    },
    {
      stepId: 'step-5',
      title: 'Out for Laboratory Delivery',
      description: 'Courier en route to laboratory receiving dock.',
      timestamp: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(backendOrder.status) ? '02:00 PM' : 'Pending',
      status: backendOrder.status === 'OUT_FOR_DELIVERY' ? 'IN_PROGRESS' : backendOrder.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING'
    },
    {
      stepId: 'step-6',
      title: 'Delivered & Handed Over',
      description: 'Received at temperature dock with chain-of-custody barcode confirmation.',
      timestamp: backendOrder.status === 'DELIVERED' ? '03:45 PM' : 'Expected 04:00 PM',
      status: backendOrder.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING'
    }
  ];

  return {
    id: backendOrder.id || `ord-${Date.now()}`,
    orderNumber: backendOrder.orderNumber || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    siteId: backendOrder.siteId || 'site-powai',
    siteName: backendOrder.customerLabName || 'Apex Clinical & Pathology Laboratories',
    status: (['PENDING', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(backendOrder.status) ? backendOrder.status : 'CONFIRMED') as any,
    orderDate: backendOrder.createdAt ? new Date(backendOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
    estimatedDelivery: backendOrder.deliveryDate || 'Tomorrow, by 2:00 PM',
    subtotal: backendOrder.subtotal || 0,
    taxAmount: backendOrder.gstAmount || Math.round((backendOrder.subtotal || 0) * 0.12),
    coldChainFee: backendOrder.coldChainFee || 0,
    totalAmount: backendOrder.grandTotal || backendOrder.totalAmount || 0,
    paymentStatus: backendOrder.paymentStatus || 'CREDIT_ACCOUNT',
    paymentMethod: backendOrder.paymentMethod || 'Institutional Revolving Credit (30D Net)',
    invoiceNumber: `INV-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    carrier: {
      name: 'MediLogistics Direct Cold-Express',
      awbNumber: `ML-COLD-${Math.floor(100000 + Math.random() * 900000)}`
    },
    coldChainMonitoring: {
      required: isColdChain,
      sensorId: sensorId,
      currentTemp: currentTemp,
      targetTemp: targetTemp,
      status: (backendOrder.coldChainMonitoring?.status as any) || 'OPTIMAL',
      lastLogged: '2 mins ago',
      tempHistory: [
        { time: '09:00', temp: 4.1 },
        { time: '10:30', temp: 4.3 },
        { time: '12:00', temp: 3.9 },
        { time: '13:30', temp: 4.2 }
      ]
    },
    items: (backendOrder.items || []).map((it: any, index: number) => ({
      productId: it.productId || `prod-${index}`,
      productName: it.productName || 'Laboratory Diagnostic Reagent',
      productSku: it.productSku || `SKU-${index}`,
      productImageUrl: it.productImageUrl || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80',
      companyName: it.companyName || 'Roche Diagnostics',
      packSize: it.packSize || '100 Tests/Kit',
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || 0,
      totalPrice: it.totalPrice || (it.unitPrice || 0) * (it.quantity || 1),
      isColdChain: it.isColdChain ?? true,
      batchNumber: it.batchNumber || `BATCH-26-${Math.floor(1000 + Math.random() * 9000)}`,
      lotNumber: it.lotNumber || `LOT-99${Math.floor(10 + Math.random() * 90)}`,
      mfgDate: '15 Aug 2026',
      expiryDate: '15 Aug 2027',
      storageTemp: '2°C - 8°C (Refrigerated)',
      qcReleaseStatus: 'RELEASED'
    })),
    timeline: steps
  };
}

/**
 * Normalizes backend service tickets into CustomerServiceTicket format
 */
function mapBackendTicketToCustomerTicket(backendTicket: any): CustomerServiceTicket {
  const status: ServiceTicketStatus = (
    ['NEW', 'ASSIGNED', 'ENGINEER_ON_THE_WAY', 'IN_PROGRESS', 'WAITING_FOR_PARTS', 'RESOLVED', 'CLOSED'].includes(backendTicket.status)
      ? backendTicket.status
      : 'ASSIGNED'
  ) as ServiceTicketStatus;

  const messages: TicketChatMessage[] = (backendTicket.customerCommunication || []).map((comm: any, idx: number) => ({
    id: comm.id || `msg-${idx}`,
    sender: (comm.authorRole === 'CUSTOMER' ? 'CUSTOMER' : 'ENGINEER') as any,
    senderName: comm.authorName || 'Biomedical Service Support',
    text: comm.content || comm.message || '',
    timestamp: comm.createdAt ? new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
  }));

  return {
    id: backendTicket.id || `tck-${Date.now()}`,
    ticketNumber: backendTicket.ticketNumber || `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    siteId: backendTicket.siteId || 'site-powai',
    siteName: backendTicket.customerLabName || 'Apex Clinical & Pathology Laboratories',
    equipmentId: backendTicket.equipmentId || 'eq-cobas-6000',
    equipmentName: backendTicket.equipmentName || backendTicket.title || 'Laboratory Equipment',
    category: (backendTicket.category || 'EQUIPMENT_BREAKDOWN') as ServiceTicketCategory,
    priority: (backendTicket.priority || 'HIGH') as ServiceTicketPriority,
    status: status,
    title: backendTicket.title || 'Service Ticket',
    description: backendTicket.description || '',
    slaHours: backendTicket.slaTargetHours || 4,
    slaDeadline: backendTicket.slaTargetTimestamp 
      ? `Within ${backendTicket.slaTargetHours || 4} Hours` 
      : 'Within 4 Hours (SLA Active)',
    createdAt: backendTicket.createdAt ? new Date(backendTicket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
    assignedEngineer: {
      name: backendTicket.assignedEngineer?.name || 'Vikram Sethi',
      phone: backendTicket.assignedEngineer?.phone || '+91 98450 11992',
      designation: 'Senior Field Biomedical Specialist',
      eta: 'Arriving in 45 mins'
    },
    messages: messages.length > 0 ? messages : [
      {
        id: `msg-${Date.now()}`,
        sender: 'CUSTOMER',
        senderName: 'Dr. Arvind Kulkarni',
        text: backendTicket.description || 'Service ticket lodged.',
        timestamp: 'Just now'
      }
    ]
  };
}

export const customerApiService = {
  /**
   * Fetches customer purchase orders from backend with fallback
   */
  async getOrders(customerId: string = 'u-cust-01'): Promise<CustomerOrderDetailed[]> {
    try {
      const res = await fetch(`${BASE_URL}/customer/orders?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const backendList = Array.isArray(json.data) ? json.data : [];
      
      const mappedBackend = backendList.map(mapBackendOrderToDetailed);
      
      // Merge backend orders with mock orders ensuring no duplicate IDs
      const backendIds = new Set(mappedBackend.map(o => o.orderNumber));
      const filteredMocks = CUSTOMER_ORDERS_DETAILED.filter(o => !backendIds.has(o.orderNumber));
      
      return [...mappedBackend, ...filteredMocks];
    } catch (err) {
      console.warn('[customerApiService] Error getting orders, using rich local dataset:', err);
      return CUSTOMER_ORDERS_DETAILED;
    }
  },

  /**
   * Fetches customer revolving credit & wallet info
   */
  async getWallet(customerId: string = 'u-cust-01'): Promise<typeof CUSTOMER_FINANCIALS_DEFAULT> {
    try {
      const res = await fetch(`${BASE_URL}/customer/wallet?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const w = json.data || {};
      
      return {
        ...CUSTOMER_FINANCIALS_DEFAULT,
        creditLimit: w.creditLimit ?? CUSTOMER_FINANCIALS_DEFAULT.creditLimit,
        availableCredit: w.availableCredit ?? CUSTOMER_FINANCIALS_DEFAULT.availableCredit,
        totalOutstanding: w.totalOutstanding ?? CUSTOMER_FINANCIALS_DEFAULT.totalOutstanding,
        overdueAmount: w.overdueAmount ?? CUSTOMER_FINANCIALS_DEFAULT.overdueAmount,
        walletPoints: w.walletPoints ?? (w as any).pointsBalance ?? 1250
      };
    } catch (err) {
      console.warn('[customerApiService] Error getting wallet, using local defaults:', err);
      return CUSTOMER_FINANCIALS_DEFAULT;
    }
  },

  /**
   * Fetches active service tickets
   */
  async getServiceTickets(customerId: string = 'u-cust-01'): Promise<CustomerServiceTicket[]> {
    try {
      const res = await fetch(`${BASE_URL}/service/tickets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const backendList = Array.isArray(json.data) ? json.data : [];
      
      // Filter tickets relevant to customer or general demo
      const mapped = backendList.map(mapBackendTicketToCustomerTicket);
      
      const backendIds = new Set(mapped.map(t => t.ticketNumber));
      const filteredMocks = CUSTOMER_SERVICE_TICKETS.filter(t => !backendIds.has(t.ticketNumber));
      
      return [...mapped, ...filteredMocks];
    } catch (err) {
      console.warn('[customerApiService] Error getting tickets, using rich local dataset:', err);
      return CUSTOMER_SERVICE_TICKETS;
    }
  },

  /**
   * Creates a service ticket on the live backend
   */
  async createServiceTicket(ticketData: {
    customerId?: string;
    customerLabName?: string;
    equipmentId?: string;
    category: string;
    priority: string;
    title: string;
    description: string;
    errorCode?: string;
  }): Promise<CustomerServiceTicket> {
    const payload = {
      customerId: ticketData.customerId || 'u-cust-01',
      customerLabName: ticketData.customerLabName || 'Apex Clinical & Pathology Laboratories',
      equipmentId: ticketData.equipmentId || 'eq-cobas-6000',
      category: ticketData.category,
      priority: ticketData.priority,
      title: ticketData.title,
      description: ticketData.description,
      errorCode: ticketData.errorCode || undefined
    };

    try {
      const res = await fetch(`${BASE_URL}/service/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data) {
        return mapBackendTicketToCustomerTicket(json.data);
      }
      throw new Error(json.message || 'Creation failed');
    } catch (err) {
      console.warn('[customerApiService] Error creating ticket via API, returning local ticket:', err);
      // Fallback: Return locally generated ticket
      return {
        id: `tck-${Date.now()}`,
        ticketNumber: `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        siteId: 'site-powai',
        siteName: ticketData.customerLabName || 'Apex Clinical & Pathology Laboratories',
        equipmentId: ticketData.equipmentId || 'eq-cobas-6000',
        equipmentName: ticketData.title,
        category: (ticketData.category || 'EQUIPMENT_BREAKDOWN') as ServiceTicketCategory,
        priority: (ticketData.priority || 'HIGH') as ServiceTicketPriority,
        status: 'ASSIGNED',
        title: ticketData.title,
        description: ticketData.description,
        slaHours: ticketData.priority === 'CRITICAL' ? 2 : 4,
        slaDeadline: ticketData.priority === 'CRITICAL' ? 'Within 2 Hours (STAT)' : 'Within 4 Hours (SLA Active)',
        createdAt: 'Just now',
        assignedEngineer: {
          name: 'Vikram Sethi',
          phone: '+91 98450 11992',
          designation: 'Senior Field Biomedical Specialist',
          eta: 'Arriving in 45 mins'
        },
        messages: [
          {
            id: 'msg-init',
            sender: 'CUSTOMER',
            senderName: 'Apex Lab Admin',
            text: ticketData.description,
            timestamp: 'Just now'
          }
        ]
      };
    }
  },

  /**
   * Places an institutional purchase order on the live backend
   */
  async placeOrder(orderData: {
    customerId?: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod?: 'CREDIT_ACCOUNT' | 'PAY_NOW';
    walletPointsRedeemed?: number;
    shippingAddress?: string;
  }): Promise<{ success: boolean; data?: CustomerOrderDetailed; error?: string; code?: string; details?: any }> {
    const payload = {
      customerId: orderData.customerId || 'u-cust-01',
      items: orderData.items,
      paymentMethod: orderData.paymentMethod || 'CREDIT_ACCOUNT',
      walletPointsRedeemed: orderData.walletPointsRedeemed || 0,
      shippingAddress: orderData.shippingAddress || 'Apex Clinical & Pathology Laboratories, Mumbai'
    };

    try {
      const res = await fetch(`${BASE_URL}/customer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: json.message || json.error || `HTTP ${res.status}`,
          code: json.code || (res.status === 403 ? 'PAYMENT_OVERDUE' : 'ORDER_FAILED'),
          details: json.details || json
        };
      }
      if (json.data) {
        return {
          success: true,
          data: mapBackendOrderToDetailed(json.data)
        };
      }
      return { success: false, error: 'Empty response data from server' };
    } catch (err: any) {
      console.warn('[customerApiService] Error placing order via API:', err);
      return { success: false, error: err?.message || 'Network error placing order' };
    }
  },

  /**
   * Calculates preview breakdown including 2% Pay Now discount or credit check
   */
  async getOrderPreview(payload: {
    customerId?: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: 'CREDIT_ACCOUNT' | 'PAY_NOW';
  }): Promise<OrderCheckoutPreview | null> {
    try {
      const res = await fetch(`${BASE_URL}/customer/orders/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: payload.customerId || 'u-cust-01',
          items: payload.items,
          paymentMethod: payload.paymentMethod
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.warn('[customerApiService] Error getting order preview:', err);
      return null;
    }
  },

  /**
   * Fetches customer credit and account standing profile
   */
  async getCreditStatus(customerId: string = 'u-cust-01'): Promise<CustomerCreditProfile> {
    try {
      const res = await fetch(`${BASE_URL}/customer/credit/status?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data) {
        const d = json.data;
        return {
          customerId: d.customerId || customerId,
          customerLabName: d.customerLabName || 'Apex Clinical & Pathology Laboratories',
          creditLimit: d.creditLimit ?? 500000,
          creditDays: d.creditDays ?? d.creditPeriodDays ?? 30,
          outstandingAmount: d.outstandingAmount ?? d.currentOutstanding ?? 0,
          availableCredit: d.availableCredit ?? (d.creditLimit ? d.creditLimit - (d.currentOutstanding ?? 0) : 315000),
          dueDate: d.dueDate || '15 Oct 2026',
          paymentStatus: d.paymentStatus || 'GOOD_STANDING',
          daysOverdue: d.daysOverdue ?? 0,
          walletPoints: d.walletPoints ?? 1250,
          businessRating: d.businessRating ?? 4.8,
          paymentReliability: d.paymentReliability || (d.paymentReliabilityPercent ? `${d.paymentReliabilityPercent}% On-Time` : 'EXCELLENT'),
          activeExtensionDays: d.activeExtensionDays ?? 0,
          hasApprovedExtension: Boolean(d.hasApprovedExtension),
          canPlaceCreditOrder: d.canPlaceCreditOrder ?? (d.paymentStatus !== 'PAYMENT_OVERDUE'),
          paymentPromises: Array.isArray(d.paymentPromises) ? d.paymentPromises.map((p: any) => ({
            id: p.id || `prom-${Date.now()}`,
            promisedDate: p.promisedDate || p.promisedPaymentDate || '2026-11-03',
            amount: p.amount ?? 0,
            status: p.status || 'PENDING'
          })) : [],
          latePaymentHistory: Array.isArray(d.latePaymentHistory) ? d.latePaymentHistory : []
        };
      }
    } catch (err) {
      console.warn('[customerApiService] Error getting credit status, fallback:', err);
    }
    // Graceful default aligned with backend defaults
    return {
      customerId: customerId,
      customerLabName: 'Apex Clinical & Pathology Laboratories',
      creditLimit: 500000,
      creditDays: 30,
      outstandingAmount: 185000,
      availableCredit: 315000,
      dueDate: '15 Oct 2026',
      paymentStatus: 'GOOD_STANDING',
      daysOverdue: 0,
      walletPoints: 1250,
      businessRating: 4.8,
      paymentReliability: 'EXCELLENT',
      activeExtensionDays: 0,
      hasApprovedExtension: false,
      canPlaceCreditOrder: true,
      paymentPromises: [],
      latePaymentHistory: []
    };
  },

  /**
   * Submits a payment extension request to the back office
   */
  async requestPaymentExtension(payload: {
    customerId?: string;
    invoiceNumber?: string;
    outstandingAmount?: number;
    requestedDays: 5 | 10 | 15 | 30;
    reason: ExtensionReason;
    explanation: string;
  }): Promise<{ success: boolean; data?: PaymentExtensionRequest; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/customer/credit/extension-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: payload.customerId || 'u-cust-01',
          invoiceNumber: payload.invoiceNumber || 'INV-2026-8812',
          outstandingAmount: payload.outstandingAmount || 185000,
          requestedDays: payload.requestedDays,
          reason: payload.reason,
          explanation: payload.explanation
        })
      });
      const json = await res.json();
      if (!res.ok) {
        return { success: false, message: json.message || `HTTP ${res.status}` };
      }
      return { success: true, data: json.data, message: json.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to submit extension request' };
    }
  },

  /**
   * Fetches customer's payment extension requests
   */
  async getExtensionRequests(customerId: string = 'u-cust-01'): Promise<PaymentExtensionRequest[]> {
    try {
      const res = await fetch(`${BASE_URL}/customer/credit/extension-requests?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (err) {
      console.warn('[customerApiService] Error getting extension requests:', err);
      return [];
    }
  },

  /**
   * Fetches live customer testimonials for Home screen carousel
   */
  async getTestimonials(): Promise<CustomerTestimonial[]> {
    try {
      const res = await fetch(`${BASE_URL}/customer/testimonials`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((t: any, index: number) => ({
          id: t.id || `test-${index}`,
          authorName: t.authorName || t.customerName || 'Dr. Arvind Kulkarni',
          designation: t.designation || 'Chief Pathologist & Lab Director',
          organizationName: t.organizationName || t.laboratory || t.companyName || 'Apex Clinical & Pathology Laboratories',
          quote: t.quote || t.testimonial || 'High-fidelity diagnostic reagent procurement with certified cold chain delivery.',
          rating: t.rating || 5,
          isActive: t.isActive !== false,
          displayOrder: t.displayOrder || (index + 1),
          avatarUrl: t.avatarUrl
        }));
      }
    } catch (err) {
      console.warn('[customerApiService] Error getting testimonials:', err);
    }
    return [
      {
        id: 'test-1',
        authorName: 'Dr. Arvind Mehra',
        designation: 'Laboratory Director',
        organizationName: 'Metropolis Diagnostics Centre',
        quote: 'The refrigerated cold-chain tracking and rapid automated reagent replenishment have cut our downtime to zero. Absolute game-changer for high-throughput labs.',
        rating: 5,
        isActive: true,
        displayOrder: 1
      },
      {
        id: 'test-2',
        authorName: 'Dr. Sunita Deshmukh',
        designation: 'Chief Pathologist',
        organizationName: 'Lilavati Medical Research Lab',
        quote: 'Being able to compare assay kits across Abbott, Roche, and Siemens with verified batch certificates of analysis saves our team hours every week.',
        rating: 5,
        isActive: true,
        displayOrder: 2
      }
    ];
  },

  /**
   * Fetches related / comparable diagnostic products
   */
  async getRelatedProducts(productId?: string): Promise<RelatedProductItem[]> {
    try {
      const url = productId ? `${BASE_URL}/customer/products/${productId}/related` : `${BASE_URL}/customer/related-products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((p: any, index: number) => {
          const packStr = p.packSize || '100 Tests / Kit';
          const matchTests = typeof packStr === 'string' ? packStr.match(/\d+/) : null;
          const analyte = p.analyte || '';
          const name = p.name || p.productName || 'Diagnostic Reagent';
          
          let inferredCategory = p.category;
          if (!inferredCategory) {
            if (analyte.toLowerCase().includes('sgpt') || analyte.toLowerCase().includes('alt') || name.toLowerCase().includes('sgpt') || name.toLowerCase().includes('alt')) {
              inferredCategory = 'Biochemistry';
            } else if (analyte.toLowerCase().includes('troponin') || name.toLowerCase().includes('troponin')) {
              inferredCategory = 'Immunology';
            } else {
              inferredCategory = 'Clinical Diagnostics';
            }
          }

          return {
            id: p.id || `rel-prod-${index}`,
            name: name,
            companyName: p.companyName || p.company || 'Diagnostic Brand',
            packSize: packStr,
            price: p.price ?? p.customerNetPrice ?? 0,
            testsCount: p.testsCount || (matchTests ? parseInt(matchTests[0], 10) : undefined),
            category: inferredCategory,
            compatibility: p.compatibility || p.analyzerCompatibility || p.compatibilitySpecs || '',
            inStock: p.inStock ?? (p.availability === 'IN_STOCK'),
            imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=120&q=80',
            leadTime: p.leadTime || 'Same-Day Dispatch'
          };
        });
      }
    } catch (err) {
      console.warn('[customerApiService] Error getting related products:', err);
    }
    return [];
  },

  /**
   * Triggers 1-click reorder for an existing order
   */
  async reorderOrder(orderId: string): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/customer/orders/${orderId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err) {
      console.warn('[customerApiService] Error reordering via API:', err);
      return null;
    }
  },

  /**
   * Fetches customer notifications
   */
  async getNotifications(): Promise<MobileNotification[]> {
    try {
      const res = await fetch(`${BASE_URL}/customer/notifications`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((n: any) => ({
          id: n.id || `notif-${Date.now()}`,
          title: n.title,
          message: n.message,
          type: n.type || 'SYSTEM',
          timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          isRead: Boolean(n.isRead),
          actionType: n.actionType,
          actionPayload: n.actionPayload
        }));
      }
      return CUSTOMER_NOTIFICATIONS;
    } catch (err) {
      console.warn('[customerApiService] Error getting notifications, using local:', err);
      return CUSTOMER_NOTIFICATIONS;
    }
  },

  /**
   * Marks a notification as read on the backend
   */
  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/customer/notifications/${id}/read`, {
        method: 'PATCH'
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  /**
   * Fetches actual configured service response SLA policies from backend
   */
  async getServiceSlaConfig(): Promise<ServiceSlaConfig> {
    try {
      const res = await fetch(`${BASE_URL}/service/sla-config`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.data) return json.data;
    } catch (err) {
      console.warn('[customerApiService] Error getting SLA config, using fallback:', err);
    }
    return {
      criticalResponseHours: 4,
      highResponseHours: 8,
      mediumResponseHours: 24,
      lowResponseHours: 48,
      serviceTierName: 'Contracted Service Level Agreement',
      dispatchDescription: 'Emergency biomedical field engineer dispatch per contracted response SLA',
      disclaimer: 'Response times subject to active AMC/CMC service agreement terms and regional technical centre proximity.'
    };
  },

  /**
   * Updates service response SLA policies from back office
   */
  async updateServiceSlaConfig(config: Partial<ServiceSlaConfig>): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/admin/service/sla-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      return res.ok;
    } catch (err) {
      console.warn('[customerApiService] Error updating SLA config:', err);
      return false;
    }
  },

  // ==========================================================================
  // CUSTOMER AUTHENTICATION, REGISTRATION & ROLE-BASED ACCESS APIS
  // ==========================================================================

  /**
   * Registers a new laboratory/hospital customer account (First user = OWNER)
   */
  async registerCustomer(payload: {
    labName: string;
    contactPersonName: string;
    labAddress: string;
    email: string;
    contactNumber: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; message: string; otpToken?: string; debugOtp?: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Registration failed', error: data.error };
      }
      return {
        success: true,
        message: data.message,
        otpToken: data.otpToken,
        debugOtp: data.debugOtp
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during registration' };
    }
  },

  /**
   * Verifies 6-digit OTP to activate customer account
   */
  async verifyRegistrationOtp(payload: {
    otpToken: string;
    otp: string;
    identifier?: string;
  }): Promise<{ success: boolean; session?: CustomerAuthSession; message: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'OTP verification failed', error: data.error };
      }

      const session: CustomerAuthSession = {
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      };
      customerAuthStore.setSession(session);

      return { success: true, session, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during OTP verification' };
    }
  },

  /**
   * Resends 6-digit registration OTP with rate limiting
   */
  async resendOtp(payload: {
    otpToken?: string;
    identifier?: string;
  }): Promise<{ success: boolean; message: string; otpToken?: string; debugOtp?: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Resend OTP failed', error: data.error };
      }
      return {
        success: true,
        message: data.message,
        otpToken: data.otpToken,
        debugOtp: data.debugOtp
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error resending OTP' };
    }
  },

  /**
   * Logs in customer with lockout protection
   */
  async loginCustomer(identifier: string, password: string): Promise<{
    success: boolean;
    session?: CustomerAuthSession;
    message: string;
    isPendingActivation?: boolean;
    otpToken?: string;
    debugOtp?: string;
    error?: string;
    statusCode?: number;
  }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || 'Authentication failed',
          error: data.error,
          statusCode: res.status,
          isPendingActivation: data.isPendingActivation,
          otpToken: data.otpToken,
          debugOtp: data.debugOtp
        };
      }

      const session: CustomerAuthSession = {
        token: data.accessToken,
        refreshToken: data.refreshToken,
        role: (data.user?.customerRole || data.user?.roleType || 'OWNER') as any,
        name: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
        email: data.user?.email || '',
        labName: data.user?.labName || data.user?.customerProfile?.labName || 'Diagnostic Services',
        permissions: data.user?.customerPermissions || [],
        user: data.user
      };
      customerAuthStore.setSession(session);

      return { success: true, session, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login' };
    }
  },

  /**
   * Secure logout clearing token and session
   */
  async logoutCustomer(): Promise<boolean> {
    try {
      await fetch(`${BASE_URL}/auth/customer/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      customerAuthStore.clearSession();
    }
    return true;
  },

  /**
   * Forgot password: Step 1 - Request OTP
   */
  async forgotPassword(identifier: string): Promise<{ success: boolean; message: string; token?: string; debugOtp?: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Request failed', error: data.error };
      }
      return { success: true, message: data.message, token: data.token, debugOtp: data.debugOtp };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  },

  /**
   * Forgot password: Step 2 - Verify OTP
   */
  async verifyOtp(identifier: string, otp: string, token?: string): Promise<{ success: boolean; message: string; resetToken?: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp, token })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Verification failed', error: data.error };
      }
      return { success: true, message: data.message, resetToken: data.resetToken };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  },

  /**
   * Forgot password: Step 3 - Reset password with strong validation
   */
  async resetPassword(identifier: string, resetToken: string, newPassword: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, resetToken, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Reset failed', error: data.error };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error' };
    }
  },

  /**
   * Fetches laboratory team members for Owner (Enforces Tenant Isolation)
   */
  async getLabUsers(): Promise<LabTeamMember[]> {
    try {
      const res = await fetch(`${BASE_URL}/customer/users`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    } catch (err) {
      console.warn('[customerApiService] Error getting lab users:', err);
      return [];
    }
  },

  /**
   * Invites a new team member (Admin / Staff / Viewer) to the laboratory
   */
  async inviteLabUser(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    role: 'ADMIN' | 'STAFF' | 'VIEWER';
    permissions?: string[];
  }): Promise<{ success: boolean; message: string; inviteToken?: string; debugOtp?: string; user?: any; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/customer/users/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to invite user', error: data.error };
      }
      return {
        success: true,
        message: data.message,
        inviteToken: data.inviteToken,
        debugOtp: data.debugOtp,
        user: data.user
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error inviting user' };
    }
  },

  /**
   * Invited user activates account with their own password
   */
  async activateInvite(payload: {
    inviteToken?: string;
    otp?: string;
    password: string;
  }): Promise<{ success: boolean; session?: CustomerAuthSession; message: string; error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/customer/activate-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Activation failed', error: data.error };
      }
      const session: CustomerAuthSession = {
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      };
      customerAuthStore.setSession(session);
      return { success: true, session, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error activating invite' };
    }
  },

  /**
   * Deactivates or reactivates a laboratory user (Owner only)
   */
  async updateUserStatus(userId: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${BASE_URL}/customer/users/${encodeURIComponent(userId)}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to update user status' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error updating user status' };
    }
  },

  /**
   * Updates roles and assigned permissions for a team member (Owner only)
   */
  async updateUserPermissions(userId: string, role: string, permissions: string[]): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${BASE_URL}/customer/users/${encodeURIComponent(userId)}/permissions`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role, permissions })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || 'Failed to update user permissions' };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error updating user permissions' };
    }
  },

  /**
   * Fetches financial status summary (Outstanding, Overdue, Due Soon, Credit Limit, Available Credit)
   */
  async getFinancialStatusSummary(customerId?: string): Promise<CustomerFinancialStatusSummary> {
    try {
      const url = customerId 
        ? `${BASE_URL}/customer/financial-status?customerId=${encodeURIComponent(customerId)}`
        : `${BASE_URL}/customer/financial-status`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        ...json.data,
        walletPoints: json.data?.walletPoints ?? 1250
      };
    } catch (err) {
      console.warn('[customerApiService] Error getting financial summary, using defaults:', err);
      return {
        totalOutstanding: 125000,
        overdueAmount: 35000,
        dueSoonAmount: 40000,
        creditLimit: 500000,
        availableCredit: 250000,
        dueDate: '15 Oct 2026',
        paymentReliability: 'EXCELLENT',
        canMakePayments: true,
        walletPoints: 1250,
        paymentHistory: []
      };
    }
  },

  /**
   * Settles overdue payment (Strict Payment Authority Required)
   */
  async settleOverduePayment(amount?: number, paymentMode: string = 'IMPS Instant Settlement'): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      const res = await fetch(`${BASE_URL}/customer/payments/settle-overdue`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount, paymentMode })
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || 'Payment processing failed',
          error: data.error
        };
      }
      return {
        success: true,
        message: data.message,
        data: data.data
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error settling overdue payment' };
    }
  }
};



