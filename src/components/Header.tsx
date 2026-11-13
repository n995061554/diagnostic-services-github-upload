import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../types';
import {
  ChevronDown,
  RefreshCw,
  Menu,
  X,
  Search,
  Inbox,
  ShieldCheck,
  Palette,
  LogOut,
  Bell,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { getActiveTheme, onThemeChange, ThemePalette } from '../utils/themeSystem';

interface HeaderProps {
  currentUser: User | null;
  currentRole: UserRoleType;
  onSelectRole?: (role: UserRoleType) => void;
  onRefreshSession: () => void;
  onLogout: () => void;
  isBackendHealthy: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileSidebarOpen?: boolean;
  setIsMobileSidebarOpen?: (open: boolean) => void;
  onOpenGlobalSearch?: () => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenSecurityConsole?: () => void;
  onOpenStageThemeModal?: () => void;
  currentTheme?: ThemePalette;
  onToggleMobilePreview?: () => void;
  isMobilePreviewActive?: boolean;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onSelectRole,
  onRefreshSession,
  onLogout,
  isBackendHealthy,
  activeTab,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onOpenGlobalSearch,
  onNavigateTab,
  onOpenSecurityConsole,
  onOpenStageThemeModal,
  currentTheme: propTheme,
  onToggleMobilePreview,
  isMobilePreviewActive,
  unreadNotificationsCount = 5,
  onOpenNotifications,
}) => {
  const [theme, setTheme] = useState<ThemePalette>(propTheme || getActiveTheme());

  useEffect(() => {
    if (propTheme) {
      setTheme(propTheme);
    }
  }, [propTheme]);

  useEffect(() => {
    const unsub = onThemeChange((updated) => {
      setTheme(updated);
    });
    return () => unsub();
  }, []);
  const roleBadges: Record<UserRoleType, { label: string; short: string; color: string; icon: string }> = {
    [UserRoleType.SUPER_ADMIN]: { label: 'Super Admin', short: 'SA', color: 'bg-[#0E1035] text-white border-[#15253F]', icon: '👑' },
    [UserRoleType.OFFICE_ADMIN]: { label: 'Office Admin', short: 'OA', color: 'bg-[#15253F] text-[#D0DEE5] border-[#2B3D5B]', icon: '🏢' },
    [UserRoleType.CUSTOMER]: { label: 'Customer (Lab)', short: 'CU', color: 'bg-[#D0DEE5] text-[#0E1035] border-[#7C8594]/40', icon: '🔬' },
    [UserRoleType.DISTRIBUTOR]: { label: 'Distributor', short: 'DI', color: 'bg-[#E4ECF0] text-[#15253F] border-[#2B3D5B]/40', icon: '📦' },
    [UserRoleType.SALES_PERSON]: { label: 'Sales Person', short: 'SP', color: 'bg-[#D0DEE5] text-[#0E1035] border-[#C3C3C3]', icon: '💼' },
    [UserRoleType.SERVICE_ENGINEER]: { label: 'Service Engineer', short: 'SE', color: 'bg-[#2B3D5B] text-white border-[#15253F]', icon: '🔧' },
    [UserRoleType.SERVICE_MANAGER]: { label: 'Service Manager', short: 'SM', color: 'bg-[#15253F] text-white border-[#2B3D5B]', icon: '📊' },
    [UserRoleType.MARKETING_STAFF]: { label: 'Marketing Staff', short: 'MS', color: 'bg-[#E4ECF0] text-[#0E1035] border-[#C3C3C3]', icon: '📢' },
    [UserRoleType.OFFICE_STAFF]: { label: 'Office Staff', short: 'OS', color: 'bg-[#E4ECF0] text-[#15253F] border-[#7C8594]/40', icon: '📋' },
    [UserRoleType.ACCOUNTS_STAFF]: { label: 'Accounts & Finance', short: 'ACC', color: 'bg-[#D0DEE5] text-[#0E1035] border-[#2B3D5B]/40', icon: '💰' },
    [UserRoleType.SALES_MANAGER]: { label: 'Sales Manager', short: 'S-MGR', color: 'bg-[#2B3D5B] text-white border-[#15253F]', icon: '📈' },
    [UserRoleType.AUTHORIZED_APPROVER]: { label: 'Authorized Approver', short: 'APPR', color: 'bg-[#0E1035] text-[#D0DEE5] border-[#15253F]', icon: '🛡️' },
    [UserRoleType.DELIVERY_STAFF]: { label: 'Delivery Staff', short: 'DEL', color: 'bg-[#15253F] text-amber-300 border-amber-500/40', icon: '🚚' },
    [UserRoleType.APPLICATION_SUPPORT]: { label: 'Application Support', short: 'APP', color: 'bg-[#0E1035] text-cyan-300 border-cyan-500/40', icon: '🔬' },
    [UserRoleType.FINANCE_STAFF]: { label: 'Finance Director', short: 'FIN', color: 'bg-[#15253F] text-emerald-300 border-emerald-500/40', icon: '🏛️' },
  };

  const tabLabels: Record<string, string> = {
    quotations: 'Quotation Management & Commercial GST Desk',
    sales_field_mobile: 'Sales Field App (Customer Visits & Selfie Proof)',
    delivery_mobile: 'Delivery & Logistics Dispatch Run',
    app_support_mobile: 'Application Support & Reagent Protocol Desk',
    payroll_management: 'Dual-Control Payroll Governance & Itemized Slips',
    backoffice_dashboard: 'Executive Leadership & KPI Dashboard',
    customers_labs: 'Customer Master & Laboratory Management',
    products_pricing: 'Products, Pricing & Contract Rules',
    orders_management: 'Orders Management & Operations',
    complaints_tickets: 'Complaints & Support Tickets Desk',
    application_requests: 'Reagent Application & Demo Requests',
    inventory_management: 'Stock & Warehouse Inventory',
    reports_analytics: 'Executive Reports & Business Analytics',
    staff_attendance: 'Staff Attendance, Punches & Geofencing',
    backoffice_hub: 'Back Office Operations Hub (Role Dashboard)',
    my_work: 'Unified "My Work" Operational Inbox',
    approvals: 'Centralized Approval Governance Hub',
    background_jobs: 'Background Processing & Job Engine',
    system_health: 'System Health & Infrastructure Monitor',
    import_hub: 'Enterprise Master Data Import Suite Hub',
    customer_import: 'Customer Master Import Engine',
    pricing_import: 'Customer-Specific Price Contract Import',
    equipment_import: 'Installed Equipment Fleet Import Engine',
    ledger_import: 'Opening Ledger & Receivables Import',
    target_import: 'Sales Target & Rep Quota Import',
    sync_activity: 'Offline Sync Engine & Idempotency Queue',
    preventive_maintenance: 'Preventive Maintenance (PM) & Equipment Lifecycle',
    service_engineer: 'Service Desk & Field Engineer Console',
    mobile_app: 'Flutter Mobile App Simulator & Storefront',
    admin_orders: 'Orders & Payment Operations',
    credit_management: 'Customer Credit, Grace Extensions & Brand Matrix',
    mobile_cms: 'Mobile CMS & Dynamic Pricing Rules',
    products: 'Product Master & Storage Specs',
    companies: 'Diagnostic Companies & OEMs',
    categories: 'Category Hierarchy Tree',
    architecture: 'System Architecture & Monorepo Topology',
    database: 'PostgreSQL 16 Schema & ERD',
    api_sandbox: 'API Contracts & JWT Sandbox',
    rbac: 'RBAC & Permission Matrix',
    users: 'Users & Diagnostic Personas',
    audit: 'Enterprise Security Audit Logs',
    security_test_suite: 'Security Governance & Automated Test Suite',
    security_sessions: 'Security Sessions & Active Device Logins',
    auth_pipeline: '7-Stage Zero-Trust Auth & Scope Pipeline',
  };

  return (
    <header
      className="h-16 border-b flex items-center justify-between px-3 sm:px-6 lg:px-8 shadow-xs z-30 sticky top-0 transition-colors duration-300 bg-white w-full max-w-full min-w-0"
      style={{
        backgroundColor: theme.brand.surface,
        borderColor: theme.brand.lightPista,
        color: theme.brand.forest,
      }}
    >
      {/* Left: Mobile Toggle & Welcome Message */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-1 sm:mr-2">
        {setIsMobileSidebarOpen && (
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0"
            style={{
              backgroundColor: theme.brand.dominant,
              borderColor: theme.brand.lightPista,
              color: theme.brand.forest,
            }}
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold truncate max-w-[120px] sm:max-w-none" style={{ color: theme.brand.forest }}>
                {currentUser?.name || currentUser?.firstName || 'Administrator'}
              </span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded border text-[9px] sm:text-[10px] font-bold shrink-0 ${roleBadges[currentRole]?.color || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                {roleBadges[currentRole]?.icon} <span className="hidden sm:inline">{roleBadges[currentRole]?.label || currentRole}</span><span className="sm:hidden">{roleBadges[currentRole]?.short || currentRole}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">
              Diagnostic Services • {tabLabels[activeTab] || 'Executive Operations'}
            </p>
          </div>
        </div>
      </div>

      {/* Center Search Bar Trigger (Cmd + K) */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-3 px-3.5 py-1.5 border rounded-xl text-xs transition-all shadow-2xs w-72 justify-between cursor-pointer hover:shadow-xs bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-400"
          title="Search customers, orders, and laboratories (Cmd+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search customers, orders, labs...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border bg-white text-slate-600 border-slate-200 shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="md:hidden p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Global Search (Cmd+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <button
          id="header-notifications-btn"
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else if (onNavigateTab) {
              onNavigateTab('backoffice_dashboard');
            }
          }}
          className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
          title="Notifications & Alerts"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Exactly ONE Single Mobile View Button */}
        <button
          id="header-mobile-view-btn"
          onClick={onToggleMobilePreview}
          title="Toggle responsive mobile view of current screen"
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${isMobilePreviewActive
            ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
            }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mobile View</span>
        </button>

        {/* User Profile Avatar with Name */}
        <div className="hidden lg:flex items-center gap-2 pl-1 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {(currentUser?.name || currentUser?.firstName || 'U')[0].toUpperCase()}
          </div>
          <div className="text-left leading-tight hidden xl:block">
            <span className="text-xs font-bold text-slate-800 block truncate max-w-[110px]">
              {currentUser?.name || currentUser?.firstName || 'Admin'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {currentUser?.email?.split('@')[0] || 'online'}
            </span>
          </div>
        </div>

        {/* Logout Action */}
        <button
          id="header-logout-btn"
          onClick={onLogout}
          title="Sign out of Diagnostic Services"
          className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="hidden sm:inline text-xs font-semibold">Logout</span>
        </button>
      </div>
    </header>
  );
};

