import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Clock,
  HelpCircle,
  Search,
  Filter,
  ShoppingCart,
  Bell,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  AlertCircle,
  ThermometerSnowflake,
  Sparkles,
  Package,
  Layers,
  ShieldCheck,
  MoreHorizontal,
  Scan,
  Wrench,
  Repeat,
  DollarSign,
  TrendingUp,
  X,
  ExternalLink,
  MapPin,
  Cpu,
  Info,
  Users,
  Sliders,
  Menu,
  CreditCard
} from 'lucide-react';

import {
  COMPANY_BRANDS,
  REAGENT_CATEGORIES,
  EQUIPMENT_CATEGORIES,
  REAGENTS_DATABASE,
  EQUIPMENT_DATABASE,
  CUSTOMER_FINANCIALS_DEFAULT,
  OUTSTANDING_INVOICES_DEFAULT,
  CUSTOMER_SITES,
  CUSTOMER_ORDERS_DETAILED,
  CUSTOMER_SERVICE_TICKETS,
  DIGITAL_DOCUMENTS_DATABASE,
  REAGENT_EXPIRIES_DATABASE,
  TRACEABILITY_RECORDS,
  CUSTOMER_NOTIFICATIONS,
  CompanyBrand,
  ReagentCategory,
  EquipmentCategory,
  ReagentProduct,
  EquipmentItem,
  OutstandingInvoice,
  formatINR
} from './mobileMockData';

import {
  CustomerSite,
  CustomerOrderDetailed,
  CustomerServiceTicket,
  DigitalDocument,
  ReagentExpiryItem,
  MobileNotification,
  MobileTab,
  CustomerCreditProfile,
  PaymentExtensionRequest,
  OrderCheckoutPreview,
  ExtensionReason,
  CustomerAuthSession,
  CustomerRole
} from './customerAppTypes';

import {
  EquipmentDetailsModal,
  EquipmentInquiryModal,
  PaymentForOldOrdersModal
} from './MobileModals';

import { OrderDetailsModal } from './modals/OrderDetailsModal';
import { RaiseTicketModal } from './modals/RaiseTicketModal';
import { BarcodeScannerModal } from './modals/BarcodeScannerModal';
import { DocumentPreviewModal } from './modals/DocumentPreviewModal';
import { SiteSwitcherModal } from './modals/SiteSwitcherModal';
import { CustomerProfileModal } from './modals/CustomerProfileModal';
import { CustomerSearchModal } from './modals/CustomerSearchModal';
import { PaymentExtensionModal } from './modals/PaymentExtensionModal';
import { ProductOrderSelectionModal } from './modals/ProductOrderSelectionModal';
import { LabUsersManagementModal } from './modals/LabUsersManagementModal';
import { CustomerAuthView } from './auth/CustomerAuthView';
import { customerApiService, customerAuthStore } from './customerApiService';
import { MobileServiceEngineerView } from './views/MobileServiceEngineerView';
import { MobileStaffAttendanceView } from './views/MobileStaffAttendanceView';
import { CollapsibleNavDrawer } from './navigation/CollapsibleNavDrawer';

import { HomeTab } from './tabs/HomeTab';
import { OrdersTab } from './tabs/OrdersTab';
import { TrackTab } from './tabs/TrackTab';
import { SupportTab } from './tabs/SupportTab';
import { MoreTab } from './tabs/MoreTab';

import { getActiveTheme, onThemeChange, ThemePalette } from '../../utils/themeSystem';

export interface CustomerMobileAppProps {
  deviceType?: 'iphone' | 'android' | 'responsive';
  onNavigateToEnterprise?: () => void;
}

export const CustomerMobileApp: React.FC<CustomerMobileAppProps> = ({
  deviceType = 'iphone',
  onNavigateToEnterprise
}) => {
  // Theme Engine Synchronization
  const [theme, setTheme] = useState<ThemePalette>(getActiveTheme());

  useEffect(() => {
    const unsub = onThemeChange((updated) => {
      setTheme(updated);
    });
    return () => unsub();
  }, []);

  // Primary 5-Tab Navigation State (Home, Orders, Track, Support, More)
  const [activeTab, setActiveTab] = useState<MobileTab>('home');

  // Sub-screens Overlay
  const [subView, setSubView] = useState<
    'none' | 'company_detail' | 'category_reagents' | 'cart' | 'notifications'
  >('none');

  // Multi-Site State
  const [activeSite, setActiveSite] = useState<CustomerSite>(CUSTOMER_SITES[0]);

  // Dynamic Datasets State
  const [ordersList, setOrdersList] = useState<CustomerOrderDetailed[]>(CUSTOMER_ORDERS_DETAILED);
  const [serviceTickets, setServiceTickets] = useState<CustomerServiceTicket[]>(CUSTOMER_SERVICE_TICKETS);
  const [documentsList, setDocumentsList] = useState<DigitalDocument[]>(DIGITAL_DOCUMENTS_DATABASE);
  const [expiriesList, setExpiriesList] = useState<ReagentExpiryItem[]>(REAGENT_EXPIRIES_DATABASE);
  const [notificationsList, setNotificationsList] = useState<MobileNotification[]>(CUSTOMER_NOTIFICATIONS);
  const [financials, setFinancials] = useState(CUSTOMER_FINANCIALS_DEFAULT);
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>(OUTSTANDING_INVOICES_DEFAULT);
  const [creditProfile, setCreditProfile] = useState<CustomerCreditProfile | null>(null);
  const [extensionRequests, setExtensionRequests] = useState<PaymentExtensionRequest[]>([]);
  const [installedEquipment] = useState<EquipmentItem[]>(EQUIPMENT_DATABASE);

  // Checkout Payment Selection State (Requirement 9)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'CREDIT_ACCOUNT' | 'PAY_NOW'>('CREDIT_ACCOUNT');
  const [useWalletPoints, setUseWalletPoints] = useState<boolean>(false);
  const [orderPreview, setOrderPreview] = useState<OrderCheckoutPreview | null>(null);
  const [overdueError, setOverdueError] = useState<{ isOverdue: boolean; message: string; details?: any } | null>(null);

  // Flow & Filter States
  const [selectedCompany, setSelectedCompany] = useState<CompanyBrand | null>(null);
  const [companyDetailTab, setCompanyDetailTab] = useState<'REAGENTS' | 'EQUIPMENT'>('REAGENTS');
  const [orderReagentSelectedCategory, setOrderReagentSelectedCategory] = useState<ReagentCategory | null>(null);
  const [orderReagentSelectedCompany, setOrderReagentSelectedCompany] = useState<CompanyBrand | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rankingAlgorithmPreset, setRankingAlgorithmPreset] = useState<'balanced' | 'velocity' | 'repeat_freq' | 'cold_chain'>('balanced');

  // Cart State
  const [cart, setCart] = useState<{ product: ReagentProduct; quantity: number }[]>([
    { product: REAGENTS_DATABASE[0], quantity: 2 },
    { product: REAGENTS_DATABASE[1], quantity: 1 }
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Control States
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<CustomerOrderDetailed | null>(null);
  const [isRaiseTicketOpen, setIsRaiseTicketOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedDocumentForPreview, setSelectedDocumentForPreview] = useState<DigitalDocument | null>(null);
  const [isSiteSwitcherOpen, setIsSiteSwitcherOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPaymentExtensionOpen, setIsPaymentExtensionOpen] = useState<boolean>(false);
  const [supportInitialSubTab, setSupportInitialSubTab] = useState<'ai_chat' | 'tickets' | 'escalate'>('ai_chat');
  const [supportTargetTicketId, setSupportTargetTicketId] = useState<string | null>(null);
  const [detailsModalEquipment, setDetailsModalEquipment] = useState<EquipmentItem | null>(null);
  const [inquiryModalEquipment, setInquiryModalEquipment] = useState<EquipmentItem | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<ReagentProduct | null>(null);

  // Customer Authentication Session State (Requirements 1-8)
  const [session, setSession] = useState<CustomerAuthSession | null>(() => customerAuthStore.getSession());
  const [isUsersManagementOpen, setIsUsersManagementOpen] = useState<boolean>(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);

  // Collapsible Navigation Drawer State (Requirements 2 & 3)
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState<boolean>(false);
  const [activeMenuSelection, setActiveMenuSelection] = useState<string>('Dashboard');

  // Unified Handler for the 7 Simple Menu Groups (Requirement 3 & 6)
  const handleSelectNavMenuItem = (group: string, item: string) => {
    setActiveMenuSelection(item);
    setOverdueError(null);

    switch (item) {
      case 'Dashboard':
        setSubView('none');
        setActiveTab('home');
        break;
      case 'Alerts':
        setSubView('notifications');
        break;
      case 'All Products':
        setOrderReagentSelectedCategory(null);
        setOrderReagentSelectedCompany(null);
        setSubView('category_reagents');
        break;
      case 'Shop by Company':
        setSubView('none');
        setActiveTab('home');
        break;
      case 'Categories':
        setSubView('none');
        setActiveTab('home');
        break;
      case 'Search Products':
        setIsSearchOpen(true);
        break;
      case 'Price List':
        setSelectedDocumentForPreview(documentsList.find(d => d.type === 'TAX_INVOICE' || d.title.includes('Price')) || documentsList[0]);
        break;
      case 'Place Order':
        if (session?.role === 'VIEWER') {
          showToast('Lab Viewer has read-only access and cannot place orders.');
          return;
        }
        if (cart.length > 0) {
          setSubView('cart');
        } else {
          setSelectedProductForOrder(REAGENTS_DATABASE[0]);
        }
        break;
      case 'My Orders':
        setSubView('none');
        setActiveTab('orders');
        break;
      case 'Order History':
        setSubView('none');
        setActiveTab('orders');
        break;
      case 'Reorder':
        setSubView('none');
        setActiveTab('orders');
        break;
      case 'Outstanding Balance':
        setPaymentModalOpen(true);
        break;
      case 'Payment History':
        setSubView('none');
        setActiveTab('more');
        break;
      case 'Credit Limit':
        setIsPaymentExtensionOpen(true);
        break;
      case 'Payment Extensions':
        if (session?.role === 'VIEWER') {
          showToast('Lab Viewer has read-only access.');
          return;
        }
        setIsPaymentExtensionOpen(true);
        break;
      case 'My Equipment':
        setSubView('none');
        setActiveTab('more');
        break;
      case 'Preventive Maintenance':
        setSubView('none');
        setActiveTab('support');
        break;
      case 'Service Requests':
        if (session?.role === 'VIEWER') {
          setSubView('none');
          setActiveTab('support');
        } else {
          setIsRaiseTicketOpen(true);
        }
        break;
      case 'Warranty':
        setSubView('none');
        setActiveTab('more');
        break;
      case 'Raise a Complaint':
        if (session?.role === 'VIEWER') {
          showToast('Lab Viewer has read-only access.');
        } else {
          setIsRaiseTicketOpen(true);
        }
        break;
      case 'My Complaints':
        setSubView('none');
        setActiveTab('support');
        setSupportInitialSubTab('tickets');
        break;
      case 'Help & FAQs':
        setSubView('none');
        setActiveTab('support');
        setSupportInitialSubTab('ai_chat');
        break;
      case 'Contact Support':
        showToast('Dialing 24/7 Clinical Support Hotline (+91 98450 11992)...');
        break;
      case 'Chat Support':
        setSubView('none');
        setActiveTab('support');
        setSupportInitialSubTab('ai_chat');
        break;
      case 'My Profile':
        setIsProfileOpen(true);
        break;
      case 'My Laboratory':
        setIsSiteSwitcherOpen(true);
        break;
      case 'Manage Users':
        if (session?.role === 'OWNER') {
          setIsUsersManagementOpen(true);
        } else {
          showToast('User Management is strictly reserved for Laboratory Owners.');
        }
        break;
      case 'Change Password':
        setIsProfileOpen(true);
        break;
      case 'Sign Out':
        handleLogout();
        break;
      default:
        setSubView('none');
        setActiveTab('home');
        break;
    }
  };

  // Quick Role Switching Handler (Isolated Demonstration Mock)
  const handleSwitchRole = (targetRole: CustomerRole) => {
    let identifier = 'lab.director@metropolisdiag.com';
    if (targetRole === 'ADMIN') identifier = 'meera.admin@apexlab.in';
    if (targetRole === 'VIEWER') identifier = 'kunal.viewer@apexlab.in';
    if (targetRole === 'SERVICE_ENGINEER') identifier = 'service.eng@a2zdiagnostic.com';
    if (targetRole === 'SALES_PERSON') identifier = 'sales.west@a2zdiagnostic.com';
    if (targetRole === 'OFFICE_ADMIN' || targetRole === 'STAFF') identifier = 'office.admin@a2zdiagnostic.com';

    const simulatedSession = {
      token: `sim-mobile-${Date.now()}`,
      role: targetRole,
      labId: 'u-cust-01',
      user: {
        id: `sim-cust-${targetRole.toLowerCase()}`,
        email: identifier,
        firstName: targetRole === 'ADMIN' ? 'Meera' : (targetRole === 'VIEWER' ? 'Kunal' : 'Demo'),
        lastName: targetRole === 'ADMIN' ? 'Admin' : 'Specialist',
        customerRole: targetRole,
        roleType: targetRole === 'OFFICE_ADMIN' || targetRole === 'SERVICE_ENGINEER' ? targetRole : 'CUSTOMER',
        labId: 'u-cust-01',
        labName: 'Apex Diagnostic Core Lab'
      }
    };
    setSession(simulatedSession as any);
    showToast(`Switched active persona to ${targetRole} (Demo Mode)`);
  };

  // Sync with Live Express Backend APIs on Mount / Session Change
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        const labId = session?.labId || 'u-cust-01';
        const [apiOrders, apiTickets, apiWallet, apiNotifs, apiCredit, apiExtensions, finSummary] = await Promise.all([
          customerApiService.getOrders(),
          customerApiService.getServiceTickets(),
          customerApiService.getWallet(),
          customerApiService.getNotifications(),
          customerApiService.getCreditStatus(labId),
          customerApiService.getExtensionRequests(labId),
          customerApiService.getFinancialStatusSummary()
        ]);
        if (isMounted) {
          if (apiOrders && apiOrders.length > 0) setOrdersList(apiOrders);
          if (apiTickets && apiTickets.length > 0) setServiceTickets(apiTickets);
          if (finSummary) {
            setFinancials(prev => ({
              ...prev,
              availableCredit: finSummary.availableCredit,
              creditLimit: finSummary.creditLimit,
              totalOutstanding: finSummary.totalOutstanding,
              overdueAmount: finSummary.overdueAmount,
              dueSoonAmount: finSummary.dueSoonAmount,
              customerName: finSummary.labName || prev.customerName
            }));
          } else if (apiWallet) {
            setFinancials(apiWallet);
          }
          if (apiNotifs && apiNotifs.length > 0) setNotificationsList(apiNotifs);
          if (apiCredit) setCreditProfile(apiCredit);
          if (apiExtensions) setExtensionRequests(apiExtensions);
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, [session?.token, session?.labId]);

  // Fetch Order Breakdown Preview whenever cart or payment method changes (Requirement 9)
  useEffect(() => {
    if (cart.length === 0) {
      setOrderPreview(null);
      return;
    }
    customerApiService.getOrderPreview({
      customerId: 'u-cust-01',
      items: cart.map(it => ({ productId: it.product.id, quantity: it.quantity })),
      paymentMethod: selectedPaymentMethod
    }).then(res => {
      if (res) setOrderPreview(res);
    });
  }, [cart, selectedPaymentMethod]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Cart Calculations
  const totalCartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalCartAmount = useMemo(() => cart.reduce((sum, item) => sum + (item.product.customerNetPrice * item.quantity), 0), [cart]);

  const handleAddToCart = (product: any, qty: number = 1) => {
    if (session?.role === 'VIEWER') {
      showToast('Viewer accounts have read-only access. Ordering is restricted.');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    showToast(`Added ${product.name} (${qty}x) to Cart`);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: ReagentProduct; quantity: number }[]
    );
  };

  // 1-Click Order Handler
  const handleRepeatOrder = async (order: CustomerOrderDetailed) => {
    if (session?.role === 'VIEWER') {
      showToast('Viewer accounts have read-only access. Ordering is restricted.');
      return;
    }
    try {
      const res = await customerApiService.reorderOrder(order.id);
      if (res && res.data) {
        setOrdersList(prev => [res.data, ...prev]);
        showToast(`Order ${res.data.orderNumber} placed via 1-Click Reorder!`);
      } else {
        const reorderPayload = order.items.map(it => ({
          product: REAGENTS_DATABASE.find(r => r.id === it.productId) || {
            id: it.productId,
            name: it.productName,
            companyId: 'roche',
            companyName: it.companyName,
            companyLogo: '',
            categoryId: 'cat-biochem-fully',
            categoryName: 'Biochemistry',
            productCode: it.productSku,
            packSize: it.packSize,
            storageTemp: it.storageTemp,
            mrp: it.unitPrice * 1.2,
            customerNetPrice: it.unitPrice,
            discountPercent: 15,
            imageUrl: it.productImageUrl,
            description: '',
            inStock: true,
            salesRankScore: 90
          },
          quantity: it.quantity
        }));
        setCart(reorderPayload);
        setSubView('cart');
        showToast(`Loaded ${order.items.length} items from ${order.orderNumber} into Cart.`);
      }
    } catch (err) {
      showToast('1-Click Reorder initiated.');
    }
  };

  const handleRepeatMultipleOrders = (orders: CustomerOrderDetailed[]) => {
    if (session?.role === 'VIEWER') {
      showToast('Viewer accounts have read-only access. Ordering is restricted.');
      return;
    }
    const itemsToAdd: { product: ReagentProduct; quantity: number }[] = [];
    orders.forEach(ord => {
      ord.items.forEach(it => {
        const foundProd = REAGENTS_DATABASE.find(r => r.id === it.productId) || {
          id: it.productId,
          name: it.productName,
          companyId: 'roche',
          companyName: it.companyName,
          companyLogo: '',
          categoryId: 'cat-biochem-fully',
          categoryName: 'Biochemistry',
          productCode: it.productSku,
          packSize: it.packSize,
          storageTemp: it.storageTemp,
          mrp: it.unitPrice * 1.2,
          customerNetPrice: it.unitPrice,
          discountPercent: 15,
          imageUrl: it.productImageUrl,
          description: '',
          inStock: true,
          salesRankScore: 90
        };
        itemsToAdd.push({ product: foundProd, quantity: it.quantity });
      });
    });
    setCart(itemsToAdd);
    setSubView('cart');
    showToast(`Staged ${itemsToAdd.length} reagents from selected orders into Cart.`);
  };

  // Barcode Decoded Handler
  const handleBarcodeDecoded = (decoded: string, meta?: any) => {
    setIsScannerOpen(false);
    showToast(`Scanned Barcode: ${decoded}`);
    if (meta?.type === 'REAGENT_EXPIRY' || decoded.startsWith('LOT-')) {
      const match = expiriesList.find(e => e.lotNumber === decoded || e.batchNumber === decoded);
      if (match) {
        showToast(`Matched Batch: ${match.productName} (Exp: ${match.expiryDate})`);
        return;
      }
    }
    const matchedReagent = REAGENTS_DATABASE.find(r => r.productCode === decoded || decoded.includes(r.productCode));
    if (matchedReagent) {
      handleAddToCart(matchedReagent, 1);
    }
  };

  // Ticket Submission
  const handleTicketSubmitted = (ticketData: any) => {
    setIsRaiseTicketOpen(false);
    customerApiService.createServiceTicket(ticketData).then(created => {
      setServiceTickets(prev => [created, ...prev]);
      showToast(`Ticket #${created.ticketNumber} lodged. Biomedical Engineer assigned!`);
      setSupportInitialSubTab('tickets');
      setSupportTargetTicketId(created.id);
      setActiveTab('support');
    });
  };

  // Submit Payment Extension Request (Requirement 14)
  const handlePaymentExtensionSubmit = async (data: {
    requestedDays: 5 | 10 | 15 | 30;
    reason: ExtensionReason;
    explanation: string;
  }): Promise<boolean> => {
    const res = await customerApiService.requestPaymentExtension({
      customerId: 'u-cust-01',
      invoiceNumber: 'INV-2026-8812',
      outstandingAmount: creditProfile?.outstandingAmount ?? 185000,
      requestedDays: data.requestedDays,
      reason: data.reason,
      explanation: data.explanation
    });

    if (res.success && res.data) {
      setExtensionRequests(prev => [res.data!, ...prev]);
      showToast(`Extension of ${data.requestedDays} days requested. Status: Under Review.`);
      return true;
    } else {
      showToast(`Extension request failed: ${res.message || 'Error'}`);
      return false;
    }
  };

  // Document Download
  const handleDownloadDocument = (doc: DigitalDocument) => {
    showToast(`Downloading secure PDF: ${doc.title} (${doc.referenceNumber})...`);
  };

  const handleDownloadInvoice = (orderNumber: string) => {
    showToast(`Downloading Official Tax Invoice for ${orderNumber}...`);
  };

  const handleDownloadBrochure = (model: string) => {
    showToast(`Downloading Engineering Brochure & Specs for ${model}...`);
  };

  const handleReplenishExpiryItem = (item: ReagentExpiryItem) => {
    const prod = REAGENTS_DATABASE.find(r => r.id === item.productId) || {
      id: item.productId,
      name: item.productName,
      companyId: 'roche',
      companyName: item.companyName,
      companyLogo: item.companyLogo,
      categoryId: 'cat-biochem-fully',
      categoryName: 'Biochemistry',
      productCode: item.lotNumber,
      packSize: item.packSize,
      storageTemp: item.storageTemp,
      mrp: item.unitPrice * 1.2,
      customerNetPrice: item.unitPrice,
      discountPercent: 12,
      imageUrl: item.imageUrl,
      description: '',
      inStock: true,
      salesRankScore: 88
    };
    handleAddToCart(prod, item.currentStockUnits > 0 ? item.currentStockUnits : 2);
    setSubView('cart');
  };

  const handlePaymentSuccess = (invoiceNumber: string, amount: number) => {
    setPaymentModalOpen(false);
    setInvoices(prev => prev.filter(inv => inv.invoiceNumber !== invoiceNumber));
    setFinancials(prev => ({
      ...prev,
      availableCredit: prev.availableCredit + amount,
      totalOutstanding: Math.max(0, prev.totalOutstanding - amount),
      overdueAmount: Math.max(0, prev.overdueAmount - amount)
    }));
    if (creditProfile) {
      setCreditProfile({
        ...creditProfile,
        availableCredit: creditProfile.availableCredit + amount,
        outstandingAmount: Math.max(0, creditProfile.outstandingAmount - amount),
        paymentStatus: 'GOOD_STANDING',
        daysOverdue: 0,
        canPlaceCreditOrder: true
      });
    }
    setOverdueError(null);
    showToast(`₹${formatINR(amount)} payment verified via NEFT/RTGS gateway!`);
  };

  // Logout Handler (Requirement 22)
  const handleLogout = async () => {
    try {
      await customerApiService.logoutCustomer();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    customerAuthStore.clearSession();
    setSession(null);
    setCart([]);
    setSelectedOrderForModal(null);
    setOverdueError(null);
    showToast('Signed out of session. Session credentials cleared.');
    if (onNavigateToEnterprise) {
      onNavigateToEnterprise();
    }
  };

  const handleOpenCompanyDetail = (company: CompanyBrand) => {
    setSelectedCompany(company);
    setCompanyDetailTab('REAGENTS');
    setSubView('company_detail');
  };

  const handleOpenOrderCategory = (category: ReagentCategory) => {
    setOrderReagentSelectedCategory(category);
    setOrderReagentSelectedCompany(null);
    setSubView('category_reagents');
  };

  // Algorithm ranking
  const rankedBestsellers = useMemo(() => {
    return [...REAGENTS_DATABASE].sort((a, b) => {
      if (rankingAlgorithmPreset === 'velocity') return (b.orderCount || 20) - (a.orderCount || 10);
      if (rankingAlgorithmPreset === 'repeat_freq') return (b.discountPercent) - (a.discountPercent);
      if (rankingAlgorithmPreset === 'cold_chain') return (a.storageTemp.includes('2°C') ? -1 : 1);
      return b.salesRankScore - a.salesRankScore;
    });
  }, [rankingAlgorithmPreset]);

  const mostOrderedReagents = useMemo(() => {
    return REAGENTS_DATABASE.filter(r => r.salesIndicator === 'Most Ordered' || r.salesIndicator === 'Best Seller');
  }, []);

  const unreadNotifsCount = notificationsList.filter(n => !n.isRead).length;

  // Unauthenticated Entry Flow: Welcome -> Sign In -> Register (Requirements 1 & 2)
  if (!session) {
    return (
      <div
        className="relative w-full h-full flex flex-col font-sans select-none overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: '#0E1035',
          color: '#FFFFFF',
        }}
      >
        <CustomerAuthView
          onAuthenticated={(newSession) => {
            setSession(newSession);
            showToast(`Welcome, ${newSession.name}! Authenticated as ${newSession.role}`);
          }}
        />
      </div>
    );
  }

  const activeUserRole = (session.role || session.user?.customerRole || session.user?.roleType) as any;

  // 1. Specialized Mobile Interface for Field Service Engineer (PM & Ticket Logging)
  if (activeUserRole === 'SERVICE_ENGINEER') {
    return (
      <MobileServiceEngineerView
        session={session}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />
    );
  }

  // 2. Specialized Mobile Interface for Staff Attendance & Field Sales Console
  if (
    activeUserRole === 'SALES_PERSON' ||
    activeUserRole === 'OFFICE_ADMIN' ||
    activeUserRole === 'STAFF'
  ) {
    return (
      <MobileStaffAttendanceView
        session={session}
        isSalesPerson={activeUserRole === 'SALES_PERSON'}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />
    );
  }

  return (
    <div
      className="relative w-full h-full flex flex-col font-sans select-none overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#0E1035',
      }}
    >
      {/* ==================================================================== */}
      {/* 1. APP HEADER: Navy Blue + Light Grey Theme with Safe Area Handling */}
      {/* ==================================================================== */}
      <header
        className="text-white px-3 pt-7 pb-2.5 flex items-center justify-between border-b z-30 shadow-md min-h-[66px] bg-[#0E1035] border-[#15253F]"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
          {subView !== 'none' ? (
            <button
              onClick={() => {
                if (subView === 'category_reagents' && orderReagentSelectedCompany) {
                  setOrderReagentSelectedCompany(null);
                } else {
                  setSubView('none');
                }
              }}
              className="p-1.5 -ml-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <button
              id="btn-open-nav-drawer"
              onClick={() => setIsNavDrawerOpen(true)}
              className="p-2 -ml-1 rounded-xl bg-white/10 hover:bg-white/20 text-[#D0DEE5] hover:text-white transition cursor-pointer shrink-0 flex items-center justify-center border border-white/10 shadow-xs"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>
          )}

          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-md cursor-pointer transition shrink-0 hover:scale-105 border border-white/20 bg-white"
            title="View Institutional Profile & Accreditations"
          >
            <img src="/logo.jpeg" alt="Diagnostic Services" className="w-full h-full object-cover" />
          </button>

          <div
            onClick={() => setIsSiteSwitcherOpen(true)}
            className="cursor-pointer min-w-0 flex-1"
            title="Switch Laboratory Location"
          >
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs text-white tracking-tight truncate leading-tight">
                {session.labName || activeSite.name}
              </h1>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0 bg-[#D0DEE5]"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border truncate ${session.role === 'OWNER'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                    : session.role === 'ADMIN'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      : 'bg-slate-500/20 text-slate-300 border-slate-400/40'
                  }`}
              >
                {session.role}
              </span>
              <span className="text-[9px] text-white/70 truncate">&bull; {activeSite.city}</span>
            </div>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Universal Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 relative transition cursor-pointer text-[#D0DEE5]"
            title="Search Materials, Analyzers, Orders & Tickets"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Barcode Scanner Trigger */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 relative transition cursor-pointer text-[#D0DEE5]"
            title="Scan Barcode / QR"
          >
            <Scan className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setSubView(subView === 'notifications' ? 'none' : 'notifications')}
            className="p-2 rounded-full hover:bg-white/10 relative transition cursor-pointer text-[#D0DEE5]"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-400 rounded-full ring-2 ring-[#0E1035]" />
            )}
          </button>

          {/* Shopping Cart (Requirement 8: Inside safe area, always visible, badge never clipped) */}
          <button
            onClick={() => setSubView(subView === 'cart' ? 'none' : 'cart')}
            className="p-2 rounded-full hover:bg-white/10 relative transition cursor-pointer text-[#D0DEE5] shrink-0"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalCartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs bg-[#D0DEE5] text-[#0E1035]"
              >
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          className="absolute top-18 left-4 right-4 z-50 text-white border px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center justify-between text-xs backdrop-blur-md animate-in fade-in slide-in-from-top-2 bg-[#0E1035] border-[#D0DEE5]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D0DEE5]" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white cursor-pointer">&times;</button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. BODY VIEWPORT WITH DYNAMIC SUBVIEWS & TABS */}
      {/* ==================================================================== */}
      <div className="flex-1 overflow-y-auto pb-16">

        {/* SUB-VIEW: COMPANY DETAIL */}
        {subView === 'company_detail' && selectedCompany && (
          <div className="p-4 space-y-4 animate-in fade-in text-xs">
            <div className="bg-white rounded-3xl p-4 border border-[#D0DEE5] shadow-xs flex items-center gap-3">
              <div className="w-16 h-12 flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-[#D0DEE5]">
                <img src={selectedCompany.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-[#7C8594] uppercase">{selectedCompany.country}</span>
                <h2 className="text-base font-black text-[#0E1035]">{selectedCompany.name}</h2>
                <p className="text-[10px] text-[#7C8594]">{selectedCompany.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl text-xs font-bold text-[#7C8594] border border-[#D0DEE5]">
              <button
                onClick={() => setCompanyDetailTab('REAGENTS')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${companyDetailTab === 'REAGENTS' ? 'bg-[#0E1035] text-white shadow-xs font-extrabold' : 'hover:text-[#0E1035]'
                  }`}
              >
                Reagents & Tests
              </button>
              <button
                onClick={() => setCompanyDetailTab('EQUIPMENT')}
                className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${companyDetailTab === 'EQUIPMENT' ? 'bg-[#0E1035] text-white shadow-xs font-extrabold' : 'hover:text-[#0E1035]'
                  }`}
              >
                Analyzers & Instruments
              </button>
            </div>

            {companyDetailTab === 'REAGENTS' ? (
              <div className="grid grid-cols-2 gap-2.5">
                {REAGENTS_DATABASE.filter(r => r.companyId === selectedCompany.id).map(prod => (
                  <div key={prod.id} className="bg-white rounded-2xl border border-[#D0DEE5] p-3 flex flex-col justify-between shadow-xs hover:border-[#0E1035] transition group">
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedProductForOrder(prod)}
                    >
                      <div className="w-full h-20 bg-slate-50 rounded-xl p-1 flex items-center justify-center border border-[#D0DEE5] mb-1.5 overflow-hidden">
                        <img src={prod.imageUrl} alt="" className="max-h-full max-w-full object-contain group-hover:scale-105 transition" />
                      </div>
                      <h4 className="font-extrabold text-xs text-[#0E1035] line-clamp-2 leading-tight group-hover:text-[#2B3D5B] transition">{prod.name}</h4>
                      <div className="text-[10px] text-[#7C8594] mt-0.5">Pack: {prod.packSize}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <div className="font-mono font-black text-xs text-[#0E1035]">₹{formatINR(prod.customerNetPrice)}</div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedProductForOrder(prod)}
                          className="p-1.5 bg-[#D0DEE5]/50 hover:bg-[#D0DEE5] text-[#0E1035] rounded-xl transition cursor-pointer"
                          title="View Details & Similar Kits"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddToCart(prod, 1)}
                          className="p-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {EQUIPMENT_DATABASE.filter(e => e.companyId === selectedCompany.id).map(eq => (
                  <div
                    key={eq.id}
                    onClick={() => setDetailsModalEquipment(eq)}
                    className="p-3 bg-white rounded-2xl border border-[#D0DEE5] flex items-center gap-3 cursor-pointer shadow-xs"
                  >
                    <img src={eq.imageUrl} alt="" className="w-16 h-16 object-contain bg-slate-50 rounded-xl p-1 border border-[#D0DEE5]" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-[#2B3D5B] uppercase">{eq.categoryName}</span>
                      <h4 className="font-extrabold text-xs text-[#0E1035] truncate">{eq.name}</h4>
                      <div className="text-[10px] text-[#7C8594]">Model: {eq.modelNumber}</div>
                      <span className="text-[10px] text-[#0E1035] font-bold mt-1 block">Inquiry & Brochure Only &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW: CATEGORY REAGENTS */}
        {subView === 'category_reagents' && orderReagentSelectedCategory && (
          <div className="p-4 space-y-4 animate-in fade-in text-xs">
            <div className="bg-white rounded-3xl p-3.5 border border-[#D0DEE5] shadow-xs flex items-center gap-3">
              <img src={orderReagentSelectedCategory.imageUrl} alt="" className="w-12 h-12 object-cover rounded-xl border border-[#D0DEE5]" />
              <div>
                <span className="text-[9px] font-bold text-[#7C8594] uppercase">Category</span>
                <h2 className="text-sm font-black text-[#0E1035]">{orderReagentSelectedCategory.name}</h2>
                <p className="text-[10px] text-[#7C8594]">{orderReagentSelectedCategory.shortDesc}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {REAGENTS_DATABASE.filter(r => r.categoryId === orderReagentSelectedCategory.id).map(prod => (
                <div key={prod.id} className="bg-white rounded-2xl border border-[#D0DEE5] p-3 flex flex-col justify-between shadow-xs hover:border-[#0E1035] transition group">
                  <div
                    className="cursor-pointer"
                    onClick={() => setSelectedProductForOrder(prod)}
                  >
                    <div className="w-full h-20 bg-slate-50 rounded-xl p-1 flex items-center justify-center border border-[#D0DEE5] mb-1.5 overflow-hidden">
                      <img src={prod.imageUrl} alt="" className="max-h-full max-w-full object-contain group-hover:scale-105 transition" />
                    </div>
                    <span className="text-[9px] font-bold text-[#2B3D5B] uppercase">{prod.companyName}</span>
                    <h4 className="font-extrabold text-xs text-[#0E1035] line-clamp-2 leading-tight group-hover:text-[#2B3D5B] transition">{prod.name}</h4>
                    <div className="text-[10px] text-[#7C8594] mt-0.5">Pack: {prod.packSize}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <div className="font-mono font-black text-xs text-[#0E1035]">₹{formatINR(prod.customerNetPrice)}</div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedProductForOrder(prod)}
                        className="p-1.5 bg-[#D0DEE5]/50 hover:bg-[#D0DEE5] text-[#0E1035] rounded-xl transition cursor-pointer"
                        title="View Details & Similar Kits"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddToCart(prod, 1)}
                        className="p-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-VIEW: SHOPPING CART */}
        {subView === 'cart' && (
          <div className="p-4 space-y-4 animate-in fade-in text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#0E1035]" />
                Institutional Reagent Cart ({totalCartCount})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-rose-700 font-bold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-[#D0DEE5] text-center space-y-3">
                <Package className="w-12 h-12 text-[#7C8594] mx-auto opacity-40" />
                <h3 className="font-black text-sm text-[#0E1035]">Your Cart is Empty</h3>
                <p className="text-[11px] text-[#7C8594]">
                  Explore bestsellers or repeat past orders with 1-click.
                </p>
                <button
                  onClick={() => {
                    setSubView('none');
                    setActiveTab('home');
                  }}
                  className="px-4 py-2 bg-[#0E1035] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Browse Reagents
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 shadow-xs"
                    >
                      <img src={item.product.imageUrl} alt="" className="w-12 h-12 object-contain bg-slate-50 rounded-xl p-1 border border-[#D0DEE5]" />
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-xs text-[#0E1035] truncate">{item.product.name}</div>
                        <div className="text-[10px] text-[#7C8594]">Pack: {item.product.packSize}</div>
                        <div className="font-mono font-bold text-xs text-[#0E1035]">
                          ₹{formatINR(item.product.customerNetPrice * item.quantity)}
                        </div>
                      </div>

                      <div className="flex items-center bg-slate-50 border border-[#D0DEE5] rounded-xl px-2 py-1 font-bold">
                        <button onClick={() => updateCartQuantity(item.product.id, -1)} className="p-0.5 hover:text-[#0E1035] cursor-pointer">-</button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.product.id, 1)} className="p-0.5 hover:text-[#0E1035] cursor-pointer">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overdue Order Blocking Alert Banner (Req 13) */}
                {overdueError && overdueError.isOverdue && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-3xl space-y-2.5 shadow-md animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-xs text-rose-900 uppercase tracking-wide">
                          Payment Overdue — Order Blocked
                        </h4>
                        <p className="text-[11px] text-rose-800 font-semibold mt-0.5">
                          Please clear your previous outstanding payment before placing a new order.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white/80 p-2 rounded-xl text-center text-[10px] border border-rose-200">
                      <div>
                        <span className="text-slate-500 block">Outstanding</span>
                        <strong className="text-rose-700 font-mono text-xs">
                          ₹{formatINR(creditProfile?.outstandingAmount ?? 185000)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Due Date</span>
                        <strong className="text-slate-800">{creditProfile?.dueDate ?? '15 Oct 2026'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Days Overdue</span>
                        <strong className="text-rose-700">{creditProfile?.daysOverdue ?? 14} Days</strong>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedPaymentMethod('PAY_NOW');
                          setOverdueError(null);
                        }}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Pay Now (2% Off)
                      </button>
                      <button
                        onClick={() => setIsPaymentExtensionOpen(true)}
                        className="flex-1 py-2 px-3 bg-[#0E1035] hover:bg-[#15253F] text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Request Extension
                      </button>
                    </div>
                  </div>
                )}

                {/* CHECKOUT PAYMENT OPTIONS (Requirement 9) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider">
                    Select Payment Method (Required)
                  </h3>

                  {/* Option 1: Credit Account */}
                  <label
                    onClick={() => {
                      setSelectedPaymentMethod('CREDIT_ACCOUNT');
                      setOverdueError(null);
                    }}
                    className={`block p-3.5 rounded-2xl border transition cursor-pointer ${selectedPaymentMethod === 'CREDIT_ACCOUNT'
                        ? 'bg-slate-50 border-[#0E1035] ring-2 ring-[#0E1035] shadow-xs'
                        : 'bg-white border-[#D0DEE5] hover:border-slate-400'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={selectedPaymentMethod === 'CREDIT_ACCOUNT'}
                          onChange={() => { }}
                          className="w-4 h-4 text-[#0E1035] cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-[#0E1035] block">
                            Option 1 — Credit Account
                          </span>
                          <span className="text-[10px] text-[#7C8594]">
                            Institutional 30-Day Revolving Terms
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase text-[#2B3D5B] bg-[#D0DEE5]/60 px-2 py-0.5 rounded-full">
                        {creditProfile?.paymentReliability || 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-[10px]">
                      <div>
                        <span className="text-[#7C8594] block">Available Credit:</span>
                        <strong className="text-[#0E1035] font-mono">₹{formatINR(creditProfile?.availableCredit ?? financials.availableCredit)}</strong>
                      </div>
                      <div>
                        <span className="text-[#7C8594] block">Credit Limit:</span>
                        <strong className="text-slate-800 font-mono">₹{formatINR(creditProfile?.creditLimit ?? financials.creditLimit)}</strong>
                      </div>
                      <div>
                        <span className="text-[#7C8594] block">Current Outstanding:</span>
                        <strong className="text-amber-700 font-mono">₹{formatINR(creditProfile?.outstandingAmount ?? financials.totalOutstanding)}</strong>
                      </div>
                      <div>
                        <span className="text-[#7C8594] block">Expected Payment Date:</span>
                        <strong className="text-slate-800">{creditProfile?.dueDate ?? '15 Oct 2026'} ({creditProfile?.creditDays ?? 30} Days)</strong>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Pay Now with 2% Instant Discount */}
                  <label
                    onClick={() => {
                      setSelectedPaymentMethod('PAY_NOW');
                      setOverdueError(null);
                    }}
                    className={`block p-3.5 rounded-2xl border transition cursor-pointer ${selectedPaymentMethod === 'PAY_NOW'
                        ? 'bg-slate-50 border-[#0E1035] ring-2 ring-[#0E1035] shadow-xs'
                        : 'bg-white border-[#D0DEE5] hover:border-slate-400'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentOption"
                          checked={selectedPaymentMethod === 'PAY_NOW'}
                          onChange={() => { }}
                          className="w-4 h-4 text-[#0E1035] cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-xs text-[#0E1035] block">
                            Option 2 — Pay Now (Instant Settlement)
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            Save 2% Instant Commercial Discount
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        2% Discount
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] space-y-1">
                      <div className="flex justify-between text-[#7C8594]">
                        <span>Original Order Subtotal:</span>
                        <span className="font-mono font-bold text-slate-700">₹{formatINR(totalCartAmount)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>2% Instant Discount:</span>
                        <span className="font-mono">-₹{formatINR(Math.round(totalCartAmount * 0.02))}</span>
                      </div>
                      <div className="flex justify-between text-[#0E1035] font-extrabold">
                        <span>Discounted Payable Subtotal:</span>
                        <span className="font-mono">₹{formatINR(Math.round(totalCartAmount * 0.98))}</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Option 3: Loyalty Wallet Points Redemption */}
                {(() => {
                  const availableWalletPoints = creditProfile?.walletPoints ?? (financials as any)?.walletPoints ?? 1250;
                  const maxPointsDiscount = Math.min(availableWalletPoints, Math.floor(totalCartAmount * 0.25));
                  const walletDiscount = useWalletPoints ? maxPointsDiscount : 0;

                  return (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 rounded-3xl p-4 border border-amber-300 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-sm shadow-xs shrink-0">
                            🪙
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-[#0E1035]">
                                Redeem Wallet Points
                              </span>
                              <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-full border border-amber-300">
                                {availableWalletPoints.toLocaleString('en-IN')} PTS
                              </span>
                            </div>
                            <span className="text-[10px] text-[#7C8594] block mt-0.5">
                              Apply loyalty points for direct invoice discount (1 Pt = ₹1)
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useWalletPoints}
                            onChange={(e) => setUseWalletPoints(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>

                      {useWalletPoints && (
                        <div className="mt-2 pt-2 border-t border-amber-200 flex justify-between items-center text-[11px] text-amber-950 font-bold animate-in fade-in">
                          <span className="flex items-center gap-1">
                            <span>✨</span> Wallet Discount Applied:
                          </span>
                          <span className="font-mono text-emerald-700 font-black text-xs">
                            -₹{formatINR(walletDiscount)} ({walletDiscount} pts redeemed)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Final Bill Summary */}
                {(() => {
                  const availableWalletPoints = creditProfile?.walletPoints ?? (financials as any)?.walletPoints ?? 1250;
                  const maxPointsDiscount = Math.min(availableWalletPoints, Math.floor(totalCartAmount * 0.25));
                  const walletDiscount = useWalletPoints ? maxPointsDiscount : 0;
                  const payNowDiscount = selectedPaymentMethod === 'PAY_NOW' ? Math.round(totalCartAmount * 0.02) : 0;
                  const gst = Math.round((totalCartAmount - payNowDiscount) * 0.12);
                  const finalTotal = Math.max(0, Math.round((totalCartAmount - payNowDiscount + gst) - walletDiscount));

                  return (
                    <div className="bg-white rounded-3xl p-4 border border-[#D0DEE5] space-y-2 shadow-xs">
                      <div className="flex justify-between text-[#7C8594]">
                        <span>Base Items Subtotal:</span>
                        <span className="font-mono font-bold text-[#0E1035]">₹{formatINR(totalCartAmount)}</span>
                      </div>
                      {selectedPaymentMethod === 'PAY_NOW' && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Instant 2% Pay Now Discount:</span>
                          <span className="font-mono">-₹{formatINR(payNowDiscount)}</span>
                        </div>
                      )}
                      {useWalletPoints && walletDiscount > 0 && (
                        <div className="flex justify-between text-amber-700 font-bold">
                          <span>Wallet Points Redeemed ({walletDiscount} pts):</span>
                          <span className="font-mono text-emerald-700">-₹{formatINR(walletDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#7C8594]">
                        <span>Cold-Chain Telemetry Packaging:</span>
                        <span className="font-bold text-[#0E1035] bg-[#D0DEE5]/60 px-1.5 py-0.2 rounded text-[10px]">INCLUDED</span>
                      </div>
                      <div className="flex justify-between text-[#7C8594]">
                        <span>Estimated GST (12%):</span>
                        <span className="font-mono font-bold text-[#0E1035]">
                          ₹{formatINR(gst)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#D0DEE5] font-black text-sm text-[#0E1035]">
                        <span>Final Payable Total:</span>
                        <span className="font-mono text-emerald-800">
                          ₹{formatINR(finalTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Submit Purchase Order Button */}
                {session?.role === 'VIEWER' ? (
                  <div className="w-full p-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-center font-bold text-xs text-slate-600">
                    Viewer Account: Read-only access. Ordering is disabled for this role.
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!selectedPaymentMethod) {
                        showToast('Please select Option 1 (Credit Account) or Option 2 (Pay Now) to proceed.');
                        return;
                      }

                      if (selectedPaymentMethod === 'PAY_NOW' && session?.role !== 'OWNER' && !session?.permissions?.canMakePayments) {
                        showToast('Payment Authority: Reserved for Laboratory Owner. Choose Credit Account or consult your Owner.');
                        return;
                      }

                      const availableWalletPoints = creditProfile?.walletPoints ?? (financials as any)?.walletPoints ?? 1250;
                      const maxPointsDiscount = Math.min(availableWalletPoints, Math.floor(totalCartAmount * 0.25));
                      const walletDiscount = useWalletPoints ? maxPointsDiscount : 0;

                      const res = await customerApiService.placeOrder({
                        customerId: session?.userId || 'u-cust-01',
                        items: cart.map(it => ({ productId: it.product.id, quantity: it.quantity })),
                        paymentMethod: selectedPaymentMethod,
                        walletPointsRedeemed: walletDiscount,
                        shippingAddress: `${session?.labAddress || activeSite.address}, ${activeSite.city}`
                      });

                      if (!res.success) {
                        if (res.code === 'PAYMENT_OVERDUE') {
                          setOverdueError({
                            isOverdue: true,
                            message: res.error || 'Payment overdue: Please clear your previous outstanding payment before placing a new order.',
                            details: res.details
                          });
                          showToast('Order blocked: Payment is overdue.');
                        } else {
                          showToast(`Order failed: ${res.error || 'Validation error'}`);
                        }
                        return;
                      }

                      if (res.data) {
                        setOrdersList(prev => [res.data!, ...prev]);
                        setCart([]);
                        setSelectedOrderForModal(res.data);
                        showToast(`Order ${res.data.orderNumber} successfully placed!`);
                        setSubView('none');
                      }
                    }}
                    className="w-full py-3.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-2xl font-black text-xs cursor-pointer shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#D0DEE5]" />
                    {selectedPaymentMethod === 'PAY_NOW' ? 'Pay Now & Confirm Purchase Order (2% Off)' : 'Place Institutional Credit Order'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUB-VIEW: NOTIFICATIONS */}
        {subView === 'notifications' && (
          <div className="p-4 space-y-3 animate-in fade-in text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#0E1035]" />
                Laboratory Notifications ({notificationsList.length})
              </h2>
              <button
                onClick={() => {
                  setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
                  showToast('All notifications marked as read.');
                }}
                className="text-[10px] text-[#0E1035] font-bold hover:underline"
              >
                Mark All Read
              </button>
            </div>

            <div className="space-y-2">
              {notificationsList.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => {
                    setNotificationsList(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                    if (notif.actionType === 'VIEW_ORDER') {
                      const ord = ordersList.find(o => o.id === notif.actionPayload) || ordersList[0];
                      setSelectedOrderForModal(ord);
                      setSubView('none');
                    } else if (notif.actionType === 'VIEW_TICKET') {
                      setSupportInitialSubTab('tickets');
                      setSupportTargetTicketId(notif.actionPayload || null);
                      setSubView('none');
                      setActiveTab('support');
                    } else if (notif.actionType === 'VIEW_EXPIRY') {
                      setSubView('none');
                      setActiveTab('more');
                    }
                  }}
                  className={`p-3 rounded-2xl border transition cursor-pointer shadow-xs space-y-1 ${notif.isRead ? 'bg-white border-[#D0DEE5]' : 'bg-[#D0DEE5]/30 border-[#0E1035] ring-1 ring-[#0E1035]/20'
                    }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold uppercase text-[#0E1035] bg-white px-2 py-0.5 rounded-full border border-[#D0DEE5]">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[#7C8594]">{notif.timestamp}</span>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0E1035]">{notif.title}</h4>
                  <p className="text-[10px] text-[#7C8594] leading-snug">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MAIN TAB SWITCHER */}
        {/* ------------------------------------------------------------------ */}
        {subView === 'none' && (
          <>
            {activeTab === 'home' && (
              <HomeTab
                theme={theme}
                activeSite={activeSite}
                financials={financials}
                creditProfile={creditProfile || undefined}
                userRole={session.role}
                canMakePayments={session.role === 'OWNER' || !!session.permissions?.canMakePayments}
                bestsellers={rankedBestsellers}
                rankingPreset={rankingAlgorithmPreset}
                onSetRankingPreset={setRankingAlgorithmPreset}
                onAddToCart={handleAddToCart}
                onSelectProduct={(prod) => setSelectedProductForOrder(prod)}
                onOpenCompanyDetail={handleOpenCompanyDetail}
                onOpenOrderCategory={handleOpenOrderCategory}
                onNavigateToTab={setActiveTab}
                onViewExpiryAlerts={() => setActiveTab('more')}
                urgentExpiriesCount={expiriesList.filter(e => e.urgencyLevel === 'CRITICAL').length}
                onPayNow={() => {
                  setSelectedPaymentMethod('PAY_NOW');
                  setSubView('cart');
                }}
                onRequestExtension={() => setIsPaymentExtensionOpen(true)}
                recentOrders={ordersList}
                onSelectOrder={setSelectedOrderForModal}
                onQuickReorderItem={(prod, qty) => handleAddToCart(prod, qty)}
                onOpenPayments={() => setPaymentModalOpen(true)}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab
                orders={ordersList}
                mostOrderedReagents={mostOrderedReagents}
                theme={theme}
                onSelectOrder={setSelectedOrderForModal}
                onQuickReorderItem={(prod, qty) => handleAddToCart(prod, qty)}
                onRepeatMultipleOrders={handleRepeatMultipleOrders}
                onDownloadInvoice={handleDownloadInvoice}
                onNavigateToTrack={(orderNumber) => setActiveTab('track')}
              />
            )}

            {activeTab === 'track' && (
              <TrackTab
                theme={theme}
                onOpenScanner={() => setIsScannerOpen(true)}
                onViewDocument={(refNumber) => {
                  const doc = documentsList.find(d => d.referenceNumber === refNumber || d.title.includes(refNumber)) || documentsList[0];
                  setSelectedDocumentForPreview(doc);
                }}
              />
            )}

            {activeTab === 'support' && (
              <SupportTab
                tickets={serviceTickets}
                theme={theme}
                initialSubTab={supportInitialSubTab}
                initialExpandedTicketId={supportTargetTicketId}
                onOpenRaiseTicket={() => setIsRaiseTicketOpen(true)}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOneClickBuy={() => setActiveTab('orders')}
                onOpenColdChain={() => setActiveTab('track')}
                onCallEngineer={(phone) => {
                  showToast(`Dialing Clinical Field Engineer (${phone || '+91 98450 11992'})...`);
                }}
                onOpenWhatsApp={() => {
                  showToast('Opening 24/7 Clinical WhatsApp Support Desk (+91 98450 11992)...');
                }}
              />
            )}

            {activeTab === 'more' && (
              <MoreTab
                theme={theme}
                activeSite={activeSite}
                sites={CUSTOMER_SITES}
                installedEquipment={installedEquipment}
                documents={documentsList}
                expiries={expiriesList}
                invoices={invoices}
                financials={financials}
                creditProfile={creditProfile || undefined}
                extensionRequests={extensionRequests}
                userRole={session.role}
                onOpenUsersManagement={() => setIsUsersManagementOpen(true)}
                onOpenSiteSwitcher={() => setIsSiteSwitcherOpen(true)}
                onSelectEquipment={setDetailsModalEquipment}
                onSelectDocument={setSelectedDocumentForPreview}
                onReplenishExpiryItem={handleReplenishExpiryItem}
                onOpenPaymentModal={() => setPaymentModalOpen(true)}
                onRequestExtension={() => setIsPaymentExtensionOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 3. COMPACT COLLAPSIBLE BOTTOM NAVIGATION                             */}
      {/* ==================================================================== */}
      <nav
        className="absolute bottom-0 left-0 right-0 h-16 border-t z-30 flex items-center justify-around px-2 shadow-lg transition-colors duration-300 bg-white border-[#D0DEE5]"
        aria-label="Bottom Navigation Bar"
      >
        {/* 1. Home */}
        <button
          id="btn-bottom-nav-home"
          onClick={() => {
            setSubView('none');
            setActiveTab('home');
          }}
          className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition font-bold"
          style={{
            color: activeTab === 'home' && subView === 'none' ? '#0E1035' : '#7C8594',
          }}
        >
          <Building2 className={`w-4 h-4 ${activeTab === 'home' && subView === 'none' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Home</span>
        </button>

        {/* 2. Products */}
        <button
          id="btn-bottom-nav-products"
          onClick={() => {
            setOrderReagentSelectedCategory(null);
            setOrderReagentSelectedCompany(null);
            setSubView('category_reagents');
          }}
          className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition font-bold"
          style={{
            color: subView === 'category_reagents' ? '#0E1035' : '#7C8594',
          }}
        >
          <Package className={`w-4 h-4 ${subView === 'category_reagents' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Products</span>
        </button>

        {/* 3. Orders */}
        <button
          id="btn-bottom-nav-orders"
          onClick={() => {
            setSubView('none');
            setActiveTab('orders');
          }}
          className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition font-bold relative"
          style={{
            color: activeTab === 'orders' && subView === 'none' ? '#0E1035' : '#7C8594',
          }}
        >
          <Clock className={`w-4 h-4 ${activeTab === 'orders' && subView === 'none' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Orders</span>
        </button>

        {/* 4. Payments */}
        <button
          id="btn-bottom-nav-payments"
          onClick={() => setPaymentModalOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition font-bold"
          style={{
            color: paymentModalOpen ? '#0E1035' : '#7C8594',
          }}
        >
          <CreditCard className={`w-4 h-4 ${paymentModalOpen ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Payments</span>
        </button>

        {/* 5. Menu (Opens Collapsible Navigation Drawer) */}
        <button
          id="btn-bottom-nav-menu"
          onClick={() => setIsNavDrawerOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 cursor-pointer transition font-bold"
          style={{
            color: isNavDrawerOpen ? '#0E1035' : '#7C8594',
          }}
        >
          <Menu className={`w-4 h-4 ${isNavDrawerOpen ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {/* ==================================================================== */}
      {/* 4. COLLAPSIBLE NAVIGATION DRAWER (Requirements 2, 3, 6)             */}
      {/* ==================================================================== */}
      <CollapsibleNavDrawer
        isOpen={isNavDrawerOpen}
        onClose={() => setIsNavDrawerOpen(false)}
        userRole={session.role}
        userName={session.name}
        labName={session.labName || activeSite.name}
        activeItem={activeMenuSelection}
        onSelectMenu={handleSelectNavMenuItem}
        onLogout={handleLogout}
      />

      {/* ==================================================================== */}
      {/* 4. SYSTEM MODALS */}
      {/* ==================================================================== */}

      {/* Order Details Modal with 6-step cold chain timeline */}
      {selectedOrderForModal && (
        <OrderDetailsModal
          order={selectedOrderForModal}
          theme={theme}
          onClose={() => setSelectedOrderForModal(null)}
          onReorder={handleRepeatOrder}
          onDownloadInvoice={handleDownloadInvoice}
          onViewTraceability={(batch) => {
            setSelectedOrderForModal(null);
            setActiveTab('track');
          }}
        />
      )}

      {/* Raise Service Ticket Modal */}
      {isRaiseTicketOpen && (
        <RaiseTicketModal
          installedEquipment={installedEquipment}
          siteName={activeSite.name}
          theme={theme}
          onClose={() => setIsRaiseTicketOpen(false)}
          onSubmitSuccess={handleTicketSubmitted}
        />
      )}

      {/* Optical Barcode & QR Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          theme={theme}
          onClose={() => setIsScannerOpen(false)}
          onScanResult={handleBarcodeDecoded}
        />
      )}

      {/* Digital Document Viewer / Previewer */}
      {selectedDocumentForPreview && (
        <DocumentPreviewModal
          document={selectedDocumentForPreview}
          theme={theme}
          onClose={() => setSelectedDocumentForPreview(null)}
          onDownload={handleDownloadDocument}
        />
      )}

      {/* Multi-Site Location Switcher */}
      {isSiteSwitcherOpen && (
        <SiteSwitcherModal
          sites={CUSTOMER_SITES}
          activeSiteId={activeSite.id}
          theme={theme}
          onClose={() => setIsSiteSwitcherOpen(false)}
          onSelectSite={(site) => {
            setActiveSite(site);
            showToast(`Switched active lab location to ${site.name}`);
          }}
        />
      )}

      {/* Payment Extension Request Modal (Requirement 14) */}
      <PaymentExtensionModal
        isOpen={isPaymentExtensionOpen}
        onClose={() => setIsPaymentExtensionOpen(false)}
        outstandingAmount={creditProfile?.outstandingAmount ?? financials.totalOutstanding}
        dueDate={creditProfile?.dueDate ?? '15 Oct 2026'}
        invoiceNumber="INV-2026-8812"
        onSubmit={handlePaymentExtensionSubmit}
      />

      {/* Equipment Details Modal (Zero Pricing strictly enforced) */}
      {detailsModalEquipment && (
        <EquipmentDetailsModal
          equipment={detailsModalEquipment}
          onClose={() => setDetailsModalEquipment(null)}
          onOpenInquiry={(eq) => {
            setDetailsModalEquipment(null);
            setInquiryModalEquipment(eq);
          }}
          onDownloadBrochure={handleDownloadBrochure}
          onRaiseServiceRequest={(eq) => {
            setDetailsModalEquipment(null);
            setIsRaiseTicketOpen(true);
          }}
          onAddToCartReagent={(r) => handleAddToCart(r, 1)}
          allReagents={REAGENTS_DATABASE}
        />
      )}

      {/* Equipment Procurement Inquiry Modal */}
      {inquiryModalEquipment && (
        <EquipmentInquiryModal
          equipment={inquiryModalEquipment}
          customerName={activeSite.name}
          onClose={() => setInquiryModalEquipment(null)}
          onSubmitSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Settle Old Invoices Modal */}
      {paymentModalOpen && (
        <PaymentForOldOrdersModal
          invoices={invoices}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Customer Regulatory & Accreditations Profile Modal */}
      {isProfileOpen && (
        <CustomerProfileModal
          theme={theme}
          activeSite={activeSite}
          sites={CUSTOMER_SITES}
          financials={financials}
          userRole={session.role}
          userName={session.name}
          userEmail={session.email}
          onClose={() => setIsProfileOpen(false)}
          onOpenSiteSwitcher={() => {
            setIsProfileOpen(false);
            setIsSiteSwitcherOpen(true);
          }}
          onShowToast={showToast}
          onOpenUsersManagement={() => {
            setIsProfileOpen(false);
            setIsUsersManagementOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Lab Team & Role-Based Access Modal (Owner only) */}
      {isUsersManagementOpen && session && (
        <LabUsersManagementModal
          isOpen={isUsersManagementOpen}
          onClose={() => setIsUsersManagementOpen(false)}
          currentUserRole={session.role}
          labId={session.labId}
          labName={session.labName}
          onShowToast={showToast}
        />
      )}

      {/* Universal Search & Fast Shortcuts Modal */}
      {isSearchOpen && (
        <CustomerSearchModal
          theme={theme}
          orders={ordersList}
          tickets={serviceTickets}
          documents={documentsList}
          expiries={expiriesList}
          onClose={() => setIsSearchOpen(false)}
          onSelectReagent={(prod) => {
            setSelectedProductForOrder(prod);
            setIsSearchOpen(false);
          }}
          onSelectEquipment={(eq) => {
            setDetailsModalEquipment(eq);
            setIsSearchOpen(false);
          }}
          onSelectOrder={(ord) => {
            setSelectedOrderForModal(ord);
            setIsSearchOpen(false);
          }}
          onSelectTicket={(tck) => {
            setSupportInitialSubTab('tickets');
            setSupportTargetTicketId(tck.id);
            setActiveTab('support');
            setIsSearchOpen(false);
          }}
          onSelectDocument={(doc) => {
            setSelectedDocumentForPreview(doc);
            setIsSearchOpen(false);
          }}
          onTriggerShortcut={(shortcut) => {
            setIsSearchOpen(false);
            if (shortcut === 'reorder') {
              setActiveTab('orders');
            } else if (shortcut === 'scanner') {
              setIsScannerOpen(true);
            } else if (shortcut === 'ticket') {
              setIsRaiseTicketOpen(true);
            } else if (shortcut === 'track') {
              setActiveTab('track');
            } else if (shortcut === 'expiry') {
              setActiveTab('more');
            }
          }}
        />
      )}

      {/* Product / Assay Kit Order Selection & Similar Kits Modal */}
      {selectedProductForOrder && (
        <ProductOrderSelectionModal
          theme={theme}
          product={selectedProductForOrder}
          onClose={() => setSelectedProductForOrder(null)}
          onAddToCart={(prod, qty) => {
            handleAddToCart(prod, qty);
          }}
          onSelectAlternativeProduct={(altProd) => {
            setSelectedProductForOrder(altProd);
          }}
        />
      )}

      {/* Mobile Role Switcher Modal */}
      {isRoleModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#15253F] border border-[#2B3D5B] rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D0DEE5]" />
                Switch Mobile Role
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 rounded-full text-[#D0DEE5] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  handleSwitchRole('OWNER');
                }}
                className="w-full p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold text-left hover:bg-amber-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>👑</span>
                <div>
                  <div>Apex Owner (Customer Lab)</div>
                  <div className="text-[10px] text-amber-200/70 font-normal">Reagents catalog, cart & orders</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  handleSwitchRole('SERVICE_ENGINEER');
                }}
                className="w-full p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold text-left hover:bg-blue-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>🔧</span>
                <div>
                  <div>Field Service Engineer (PM &amp; Tickets)</div>
                  <div className="text-[10px] text-blue-200/70 font-normal">PM schedules &amp; breakdown tickets</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  handleSwitchRole('SALES_PERSON');
                }}
                className="w-full p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold text-left hover:bg-emerald-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>💼</span>
                <div>
                  <div>Field Sales Representative</div>
                  <div className="text-[10px] text-emerald-200/70 font-normal">Sales quotas &amp; client visits</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  handleSwitchRole('OFFICE_ADMIN');
                }}
                className="w-full p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold text-left hover:bg-purple-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>⏱️</span>
                <div>
                  <div>Staff Attendance Console</div>
                  <div className="text-[10px] text-purple-200/70 font-normal">Geofence punch &amp; shift tracking</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
