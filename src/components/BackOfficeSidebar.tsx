import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  Boxes,
  ShoppingCart,
  CreditCard,
  LifeBuoy,
  ClipboardList,
  Package,
  BarChart3,
  Smartphone,
  Sliders,
  Clock,
  Inbox,
  ShieldAlert,
  Cpu,
  Activity,
  FileSpreadsheet,
  FileText,
  Users,
  DollarSign,
  Wrench,
  Receipt,
  Target,
  RotateCcw,
  RefreshCw,
  CalendarCheck,
  Layers,
  Database,
  Terminal,
  ShieldCheck,
  ScrollText,
  Fingerprint,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  X,
  Search,
  Truck,
  Stethoscope,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { ThemePalette } from '../utils/themeSystem';
import { UserRoleType, User } from '../types';

export interface NavItemDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  badge?: string;
  targetTab?: string;
  superAdminOnly?: boolean;
  subItems?: {
    id: string;
    label: string;
    targetTab: string;
    badge?: string;
    groupHeader?: string;
  }[];
}

// Exactly 11 Main Menu Items as specified in Diagnostic Services prompt
export const PRIMARY_NAV_ITEMS: NavItemDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    targetTab: 'backoffice_dashboard',
  },
  {
    id: 'field_staff_suite',
    label: 'Field Staff Apps & GPS',
    icon: Smartphone,
    targetTab: 'field_staff_suite',
    badge: '4 Apps',
    subItems: [
      { id: 'all_field_apps', label: 'All 4 Apps Overview', targetTab: 'field_staff_suite' },
      { id: 'ds_sales_app', label: '1. DS Sales (Rohit Sharma)', targetTab: 'sales_field_mobile', badge: 'Selfie' },
      { id: 'ds_service_app', label: '2. DS Service (Amit Kumar)', targetTab: 'service_mobile', badge: 'AMC' },
      { id: 'ds_delivery_app', label: '3. DS Delivery (Suresh Yadav)', targetTab: 'delivery_mobile', badge: 'Logistics' },
      { id: 'ds_app_support', label: '4. DS Application (Neha Singh)', targetTab: 'app_support_mobile', badge: 'Assay' },
      { id: 'live_tracking_map', label: 'Back Office Live GPS Tracking', targetTab: 'live_staff_tracking', badge: 'Live' },
    ],
  },
  {
    id: 'quotation_management',
    label: 'Quotation Management',
    icon: FileText,
    targetTab: 'quotations',
    badge: 'GST & PDF',
    subItems: [
      { id: 'all_quotations', label: 'All Quotations', targetTab: 'quotations' },
      { id: 'create_quotation', label: 'Create New Quotation', targetTab: 'quotations', badge: 'New' },
      { id: 'quotation_reports', label: 'GST & Quotation Reports', targetTab: 'quotations', badge: 'Reports' },
    ],
  },
  {
    id: 'orders_sales',
    label: 'Orders & Sales',
    icon: ShoppingCart,
    targetTab: 'orders_management',
    subItems: [
      { id: 'all_orders', label: 'All Orders', targetTab: 'orders_management' },
      { id: 'new_orders', label: 'New Orders', targetTab: 'orders_management', badge: 'New' },
      { id: 'pending_orders', label: 'Pending Orders', targetTab: 'orders_management', badge: 'Pending' },
      { id: 'dispatch_orders', label: 'Dispatch Orders', targetTab: 'admin_orders' },
      { id: 'delivered_orders', label: 'Delivered Orders', targetTab: 'orders_management' },
      { id: 'cancelled_orders', label: 'Cancelled Orders', targetTab: 'orders_management' },
    ],
  },
  {
    id: 'customers_labs',
    label: 'Customers / Labs',
    icon: Building2,
    targetTab: 'customers_labs',
    subItems: [
      { id: 'all_customers', label: 'All Customers / Labs', targetTab: 'customers_labs' },
      { id: 'lab_visits', label: 'Lab Visits', targetTab: 'sales_field_mobile', badge: 'GPS' },
      { id: 'customer_history', label: 'Customer History', targetTab: 'customers_labs' },
    ],
  },
  {
    id: 'service_amc',
    label: 'Service & AMC',
    icon: Wrench,
    targetTab: 'service_mobile',
    subItems: [
      { id: 'ds_service_mobile', label: 'DS Service Mobile App', targetTab: 'service_mobile', badge: 'App' },
      { id: 'service_calls', label: 'Service Calls & Tickets', targetTab: 'service_engineer' },
      { id: 'preventive_maintenance', label: 'Preventive Maintenance (PM)', targetTab: 'preventive_maintenance' },
      { id: 'customer_complaints', label: 'Customer Complaints Desk', targetTab: 'complaints_tickets' },
    ],
  },
  {
    id: 'delivery_logistics',
    label: 'Delivery & Logistics',
    icon: Truck,
    targetTab: 'delivery_mobile',
  },
  {
    id: 'application_support',
    label: 'Application Support',
    icon: Stethoscope,
    targetTab: 'app_support_mobile',
  },
  {
    id: 'attendance_leave',
    label: 'Attendance & Leave',
    icon: Clock,
    targetTab: 'staff_attendance',
    subItems: [
      { id: 'attendance_register', label: 'Attendance Console & Geo-Punch', targetTab: 'staff_attendance' },
      { id: 'all_staff_attendance_rep', label: 'All Staff Attendance Report', targetTab: 'live_staff_tracking', badge: 'Report' },
    ],
  },
  {
    id: 'payroll_finance',
    label: 'Payroll & Finance',
    icon: DollarSign,
    targetTab: 'payroll_management',
    subItems: [
      { id: 'payroll_governance', label: 'Dual-Control Payroll', targetTab: 'payroll_management', badge: 'Draft' },
      { id: 'credit_ledger', label: 'Customer Receivables & Credit', targetTab: 'credit_management' },
    ],
  },
  {
    id: 'tally_integration',
    label: 'External Tally Integration & Sync Manager',
    icon: RefreshCw,
    targetTab: 'tally_integration',
    badge: 'Tally ERP 9 / Prime',
  },
  {
    id: 'accounting_tally',
    label: 'Accounting & Ledgers',
    icon: Receipt,
    targetTab: 'acc_dashboard',
    badge: 'External Tally',
    subItems: [
      // 1. Overview & Books
      { id: 'acc_dashboard', label: '1. Accounting Dashboard', targetTab: 'acc_dashboard', groupHeader: 'Overview & Registers' },
      { id: 'acc_daybook_gl', label: '19. Day Book & General Ledger', targetTab: 'acc_daybook_gl' },
      
      // 2. Chart of Accounts
      { id: 'acc_coa', label: '2. Chart of Accounts', targetTab: 'acc_coa', groupHeader: 'Chart of Accounts' },
      { id: 'acc_ledger_groups', label: '3. Ledger Groups', targetTab: 'acc_ledger_groups' },
      { id: 'acc_ledger_accounts', label: '4. Ledger Accounts', targetTab: 'acc_ledger_accounts' },

      // 3. Voucher Registers (Read-only from External Tally)
      { id: 'acc_sales_invoices', label: '5. Sales Invoices', targetTab: 'acc_sales_invoices', groupHeader: 'Voucher Registers & Invoices' },
      { id: 'acc_purchase_bills', label: '6. Purchase Bills', targetTab: 'acc_purchase_bills' },
      { id: 'acc_receipts', label: '7. Receipts Register', targetTab: 'acc_receipts' },
      { id: 'acc_payments', label: '8. Payments Register', targetTab: 'acc_payments' },
      { id: 'acc_journals', label: '9. Journal Vouchers', targetTab: 'acc_journals' },
      { id: 'acc_contras', label: '10. Contra Vouchers', targetTab: 'acc_contras' },
      { id: 'acc_credit_debit_notes', label: '11. Credit & Debit Notes', targetTab: 'acc_credit_debit_notes' },

      // 4. Receivables, Payables & Banking
      { id: 'acc_customer_receivables', label: '12. Customer Receivables', targetTab: 'acc_customer_receivables', groupHeader: 'Receivables & Banking' },
      { id: 'acc_supplier_payables', label: '13. Supplier Payables', targetTab: 'acc_supplier_payables' },
      { id: 'acc_cash_bank_book', label: '14. Cash Book & Bank Book', targetTab: 'acc_cash_bank_book' },
      { id: 'acc_bank_recon', label: '15. Bank Reconciliation', targetTab: 'acc_bank_recon' },

      // 5. Taxation & Inventory
      { id: 'acc_inventory_valuation', label: '16. Inventory Valuation', targetTab: 'acc_inventory_valuation', groupHeader: 'Taxation & Inventory' },
      { id: 'acc_gst_tax_reports', label: '17. GST and Tax Reports', targetTab: 'acc_gst_tax_reports' },

      // 6. Financial Statements & Governance
      { id: 'acc_trial_balance', label: '18. Trial Balance', targetTab: 'acc_trial_balance', groupHeader: 'Final Accounts & Governance' },
      { id: 'acc_profit_loss', label: '19. Profit & Loss', targetTab: 'acc_profit_loss' },
      { id: 'acc_balance_sheet', label: '20. Balance Sheet', targetTab: 'acc_balance_sheet' },
      { id: 'acc_cash_flow', label: '21. Cash Flow', targetTab: 'acc_cash_flow' },
      { id: 'acc_audit_period_closing', label: '22. Audit Trail & Period Closing', targetTab: 'acc_audit_period_closing' },
      { id: 'acc_settings', label: '23. Accounting Settings', targetTab: 'acc_settings' },
    ],
  },
  {
    id: 'inventory_purchase',
    label: 'Inventory & Purchase',
    icon: Package,
    targetTab: 'inventory_management',
    subItems: [
      { id: 'stock_inventory', label: 'Warehouse Stock & Lots', targetTab: 'inventory_management' },
      { id: 'products_pricing', label: 'Products & Price Contracts', targetTab: 'products_pricing' },
    ],
  },
  {
    id: 'reports_analytics',
    label: 'Reports & Analytics',
    icon: BarChart3,
    targetTab: 'reports_analytics',
  },
  {
    id: 'user_management',
    label: 'User Management',
    icon: Users,
    targetTab: 'users',
    superAdminOnly: true,
  },
];

export interface StaffRoleViewDef {
  role: UserRoleType;
  label: string;
  tabId: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  allowedRoles: UserRoleType[];
}

export const STAFF_ROLE_VIEWS: StaffRoleViewDef[] = [
  {
    role: UserRoleType.CUSTOMER,
    label: 'Customer (Lab)',
    tabId: 'mobile_app',
    badge: 'Lab Portal',
    icon: Building2,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.ACCOUNTS_STAFF, UserRoleType.FINANCE_STAFF],
  },
  {
    role: UserRoleType.DISTRIBUTOR,
    label: 'Distributor',
    tabId: 'mobile_app',
    badge: 'Supply Chain',
    icon: Boxes,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.ACCOUNTS_STAFF, UserRoleType.FINANCE_STAFF],
  },
  {
    role: UserRoleType.OFFICE_ADMIN,
    label: 'Office Admin',
    tabId: 'backoffice_dashboard',
    badge: 'Operations',
    icon: LayoutDashboard,
    allowedRoles: [UserRoleType.SUPER_ADMIN],
  },
  {
    role: UserRoleType.OFFICE_STAFF,
    label: 'Office Staff',
    tabId: 'orders_management',
    badge: 'Orders Desk',
    icon: ShoppingCart,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.SALES_PERSON,
    label: 'Sales Person',
    tabId: 'sales_field_mobile',
    badge: 'Field GPS',
    icon: Smartphone,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.SALES_MANAGER,
    label: 'Sales Manager',
    tabId: 'orders_management',
    badge: 'Management',
    icon: Target,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.MARKETING_STAFF,
    label: 'Marketing Staff',
    tabId: 'mobile_cms',
    badge: 'Mobile CMS',
    icon: Sliders,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.SERVICE_ENGINEER,
    label: 'Service Engineer',
    tabId: 'service_engineer',
    badge: 'Field Service',
    icon: Wrench,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.SERVICE_MANAGER,
    label: 'Service Manager',
    tabId: 'preventive_maintenance',
    badge: 'PM Schedule',
    icon: CalendarCheck,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.DELIVERY_STAFF,
    label: 'Delivery Staff',
    tabId: 'delivery_mobile',
    badge: 'Logistics',
    icon: Truck,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
  {
    role: UserRoleType.APPLICATION_SUPPORT,
    label: 'Application Support',
    tabId: 'app_support_mobile',
    badge: 'Support Desk',
    icon: Stethoscope,
    allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN],
  },
];

export interface BackOfficeSidebarProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  currentTheme?: ThemePalette;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  onOpenStageThemeModal?: () => void;
  onOpenGlobalSearch?: () => void;
  currentUser?: User | null;
  currentRole?: UserRoleType;
}

export const BackOfficeSidebar: React.FC<BackOfficeSidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onOpenGlobalSearch,
  currentUser,
  currentRole = UserRoleType.SUPER_ADMIN,
}) => {
  // Desktop collapsed rail state with local storage persistence
  const [isCollapsedRail, setIsCollapsedRail] = useState<boolean>(() => {
    try {
      return localStorage.getItem('diagnostic_backoffice_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Track which submenus are expanded. Expand submenus only when selected.
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PRIMARY_NAV_ITEMS.forEach((item) => {
      if (item.subItems) {
        // Expand if activeTab matches any child or parent targetTab
        const matches = item.targetTab === activeTab || item.subItems.some((s) => s.targetTab === activeTab);
        if (matches) {
          initial[item.id] = true;
        }
      }
    });
    return initial;
  });

  // Expand submenu automatically if user navigates to a tab inside it
  useEffect(() => {
    PRIMARY_NAV_ITEMS.forEach((item) => {
      if (item.subItems) {
        const matches = item.targetTab === activeTab || item.subItems.some((s) => s.targetTab === activeTab);
        if (matches) {
          setExpandedSubmenus((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [activeTab]);

  const toggleSubmenu = (menuId: string) => {
    setExpandedSubmenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileSidebarOpen(false);
  };

  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  // Filter items: User Management strictly visible to Super Admin only
  const visibleNavItems = useMemo(() => {
    return PRIMARY_NAV_ITEMS.filter((item) => {
      if (item.superAdminOnly && !isSuperAdmin) {
        return false;
      }
      return true;
    });
  }, [isSuperAdmin]);

  // Permission checks for Staff & Role Access preview section
  const isAuthorizedAdmin = 
    currentRole === UserRoleType.SUPER_ADMIN ||
    currentRole === UserRoleType.OFFICE_ADMIN ||
    currentRole === UserRoleType.ACCOUNTS_STAFF ||
    currentRole === UserRoleType.FINANCE_STAFF;

  const authorizedStaffViews = useMemo(() => {
    if (!isAuthorizedAdmin || !currentRole) return [];
    return STAFF_ROLE_VIEWS.filter((item) => item.allowedRoles.includes(currentRole));
  }, [isAuthorizedAdmin, currentRole]);

  const [isStaffAccessExpanded, setIsStaffAccessExpanded] = useState<boolean>(false);

  const isPreviewingStaffView = useMemo(() => {
    return activeTab !== 'backoffice_dashboard' && authorizedStaffViews.some((v) => v.tabId === activeTab);
  }, [activeTab, authorizedStaffViews]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 md:hidden bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Main Dark Navy Sidebar Container */}
      <aside
        id="backoffice-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 border-r select-none bg-[#0a101d] text-slate-200 border-[#1e293b] ${
          isMobileSidebarOpen
            ? 'translate-x-0 w-[85vw] max-w-72 shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        } ${isCollapsedRail ? 'md:w-20' : 'md:w-68 lg:w-72'}`}
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1e293b] shrink-0 bg-[#080d18]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-white border border-slate-700 shadow-md">
              <img
                src="/logo.jpeg"
                alt="DS Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {(!isCollapsedRail || isMobileSidebarOpen) && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="text-sm font-bold tracking-tight text-white block truncate">
                  Diagnostic Services
                </span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">
                  Enterprise Operations Suite
                </span>
              </div>
            )}
          </div>

          {/* Desktop Rail Collapse Toggle & Mobile Close */}
          <div className="flex items-center">
            {isMobileSidebarOpen ? (
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const next = !isCollapsedRail;
                  setIsCollapsedRail(next);
                  try {
                    localStorage.setItem('diagnostic_backoffice_sidebar_collapsed', String(next));
                  } catch {
                    // ignore
                  }
                }}
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isCollapsedRail ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsedRail ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Search Quick Trigger in Sidebar (Expanded View) */}
        {!isCollapsedRail && onOpenGlobalSearch && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-slate-900/90 text-slate-400 border border-slate-800 hover:border-blue-500/50 hover:text-slate-200 transition-all cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">Search modules...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <nav
          className={`flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar ${
            isCollapsedRail && !isMobileSidebarOpen ? 'px-2' : ''
          }`}
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const hasSub = !!item.subItems && item.subItems.length > 0;
            const isSubExpanded = !!expandedSubmenus[item.id];
            
            // Item is active if activeTab equals targetTab or matches any subItem
            const isParentActive = item.targetTab === activeTab;
            const isChildActive = hasSub && item.subItems?.some((sub) => sub.targetTab === activeTab);
            const isActive = isParentActive || isChildActive;

            if (isCollapsedRail && !isMobileSidebarOpen) {
              return (
                <div key={item.id} className="relative flex justify-center py-0.5">
                  <button
                    onClick={() => {
                      if (item.targetTab) {
                        handleSelectTab(item.targetTab);
                      } else if (item.subItems && item.subItems[0]) {
                        handleSelectTab(item.subItems[0].targetTab);
                      }
                    }}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isActive && (
                      <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-blue-400" />
                    )}
                  </button>
                </div>
              );
            }

            return (
              <div key={item.id} className="space-y-0.5">
                {/* Main Menu Item */}
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (hasSub) {
                        toggleSubmenu(item.id);
                        if (item.targetTab && activeTab !== item.targetTab) {
                          handleSelectTab(item.targetTab);
                        }
                      } else if (item.targetTab) {
                        handleSelectTab(item.targetTab);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                      isActive && !hasSub
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : isActive && hasSub
                        ? 'bg-slate-800/90 text-blue-400 border border-slate-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      <span className="truncate text-[12.5px]">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {item.badge}
                        </span>
                      )}
                      {hasSub && (
                        <span className="text-slate-400 group-hover:text-slate-200 p-0.5">
                          {isSubExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Submenu Items (Rendered when expanded) */}
                {hasSub && isSubExpanded && item.subItems && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-800 ml-5 my-0.5">
                    {item.subItems.map((sub) => {
                      const isSubActive = activeTab === sub.targetTab;
                      return (
                        <React.Fragment key={sub.id}>
                          {sub.groupHeader && (
                            <div className="pt-2 pb-0.5 px-2 text-[9px] font-bold tracking-wider uppercase text-emerald-400 font-mono flex items-center gap-1.5 border-t border-slate-800/50 mt-1.5 first:mt-0 first:border-t-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                              <span>{sub.groupHeader}</span>
                            </div>
                          )}
                          <button
                            onClick={() => handleSelectTab(sub.targetTab)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="truncate text-[11.5px]">{sub.label}</span>
                            {sub.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300">
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Staff & Role Access (Preview Staff Views) - Authorized Admin Roles Only */}
          {isAuthorizedAdmin && authorizedStaffViews.length > 0 && !isCollapsedRail && (
            <div className="pt-3 pb-1 border-t border-slate-800 mt-3">
              <div className="p-2.5 rounded-xl border border-slate-800 bg-[#0d1627] space-y-2">
                <button
                  type="button"
                  onClick={() => setIsStaffAccessExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-200 block truncate">
                        Staff &amp; Role Access
                      </span>
                      <span className="text-[9.5px] text-slate-400 block truncate">
                        Preview Staff View (Non-auth)
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-400">
                    {isStaffAccessExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                {isStaffAccessExpanded && (
                  <div className="pt-1.5 border-t border-slate-800 space-y-1">
                    {authorizedStaffViews.map((staff) => {
                      const isStaffActive = activeTab === staff.tabId;
                      const StaffIcon = staff.icon;
                      return (
                        <button
                          key={staff.role}
                          onClick={() => handleSelectTab(staff.tabId)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                            isStaffActive
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <StaffIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate text-[11px]">{staff.label}</span>
                          </div>
                          <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                            {staff.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Footer: User & System Status */}
        <div className="p-3 border-t border-[#1e293b] bg-[#080d18] shrink-0 text-xs text-slate-400">
          {(!isCollapsedRail || isMobileSidebarOpen) ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate text-[11px] font-medium text-slate-300">
                  {currentUser?.name || 'Administrator'}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                {currentRole}
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
