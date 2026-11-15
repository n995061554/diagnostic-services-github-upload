import React, { useState, useEffect, useCallback } from 'react';
import { UserRoleType, User, AuditLog, PrimaryBusinessRole, toPrimaryRole } from './types';
import { LogOut } from 'lucide-react';
import { Header } from './components/Header';
import { ArchitectureView } from './components/ArchitectureView';
import { RbacMatrixView } from './components/RbacMatrixView';
import { DatabaseErdView } from './components/DatabaseErdView';
import { ApiSandboxView } from './components/ApiSandboxView';
import { UserDirectoryView } from './components/UserDirectoryView';
import { AuditLogsView } from './components/AuditLogsView';
import { CompanyManagementView } from './components/CompanyManagementView';
import { CategoryTreeView } from './components/CategoryTreeView';
import { ProductMasterView } from './components/ProductMasterView';
import { ProductImportView } from './components/ProductImportView';
import { CustomerImportView } from './components/CustomerImportView';
import { SpecialPricingImportView } from './components/SpecialPricingImportView';
import { EquipmentImportView } from './components/EquipmentImportView';
import { OpeningLedgerImportView } from './components/OpeningLedgerImportView';
import { SalesTargetImportView } from './components/SalesTargetImportView';
import { EnterpriseImportHubView } from './components/EnterpriseImportHubView';
import { FlutterMobileSimulatorView } from './components/FlutterMobileSimulatorView';
import { CustomerMobileApp } from './components/mobile/CustomerMobileApp';
import { AdminMobileCmsView } from './components/AdminMobileCmsView';
import { AdminOrdersManagementView } from './components/AdminOrdersManagementView';
import { CustomerCreditBackOfficeView } from './components/CustomerCreditBackOfficeView';
import { ServiceEngineerDashboardView } from './components/ServiceEngineerDashboardView';
import { PreventiveMaintenanceView } from './components/PreventiveMaintenanceView';
import { SyncActivityView } from './components/SyncActivityView';
import { BackOfficeRoleDashboardView } from './components/BackOfficeRoleDashboardView';
import { MyWorkInboxView } from './components/MyWorkInboxView';
import { ApprovalCenterView } from './components/ApprovalCenterView';
import { BackgroundJobsView } from './components/BackgroundJobsView';
import { SystemHealthView } from './components/SystemHealthView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Customer360Modal } from './components/Customer360Modal';
import { SecurityConsoleModal } from './components/SecurityConsoleModal';
import { StageThemeColorModal } from './components/StageThemeColorModal';
import { getActiveTheme, onThemeChange, applyThemeToDocument, ThemePalette } from './utils/themeSystem';
import { SecurityTestSuiteView } from './components/SecurityTestSuiteView';
import { SecuritySessionsView } from './components/SecuritySessionsView';
import { AuthPipelineView } from './components/AuthPipelineView';
import { StaffAttendanceConsoleView } from './components/StaffAttendanceConsoleView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackOfficeSidebar } from './components/BackOfficeSidebar';
import { BackOfficeDashboardView } from './components/backoffice/BackOfficeDashboardView';
import { SuperAdminDashboardView } from './components/superadmin/SuperAdminDashboardView';
import { BackOfficeOperationsDashboardView } from './components/backoffice/BackOfficeOperationsDashboardView';
import { CustomerManagementView } from './components/backoffice/CustomerManagementView';
import { ProductsPricingView } from './components/backoffice/ProductsPricingView';
import { ComplaintsTicketsView } from './components/backoffice/ComplaintsTicketsView';
import { ApplicationRequestsView } from './components/backoffice/ApplicationRequestsView';
import { InventoryManagementView } from './components/backoffice/InventoryManagementView';
import { ReportsAnalyticsView } from './components/backoffice/ReportsAnalyticsView';
import { PayrollManagementView } from './components/backoffice/PayrollManagementView';
import { MobileSalesPersonView } from './components/mobile/views/MobileSalesPersonView';
import { MobileDeliveryStaffView } from './components/mobile/views/MobileDeliveryStaffView';
import { MobileApplicationSupportView } from './components/mobile/views/MobileApplicationSupportView';
import { MobileServiceEngineerView } from './components/mobile/views/MobileServiceEngineerView';
import { LiveStaffTrackingAndReportsView } from './components/backoffice/LiveStaffTrackingAndReportsView';
import { FieldStaffSuiteView } from './components/FieldStaffSuiteView';
import { LoginView } from './components/LoginView';
import { AccountingModuleHub } from './components/accounting/AccountingModuleHub';
import { ExternalTallySyncManagerView } from './components/backoffice/ExternalTallySyncManagerView';
import { QuotationManagementView } from './components/quotations/QuotationManagementView';
import { DeliveryManagementDashboardView } from './components/delivery/DeliveryManagementDashboardView';
import { ApplicationSupportDashboardView } from './components/application/ApplicationSupportDashboardView';
import { ServiceManagementDashboardView } from './components/service/ServiceManagementDashboardView';
import { SalesManagementDashboardView } from './components/sales/SalesManagementDashboardView';
import { LaboratoryManagementDashboardView } from './components/laboratory/LaboratoryManagementDashboardView';
import { OrderReminderChatbot } from './components/backoffice/OrderReminderChatbot';
import { BackOfficePaymentsView } from './components/backoffice/BackOfficePaymentsView';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRoleType>(UserRoleType.SUPER_ADMIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'tally' || params.get('tab') === 'tally') {
        return 'tally_integration';
      }
    }
    return 'backoffice_dashboard';
    return 'superadmin_dashboard';
  });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isSecurityConsoleOpen, setIsSecurityConsoleOpen] = useState<boolean>(false);
  const [isStageThemeModalOpen, setIsStageThemeModalOpen] = useState<boolean>(false);
  const [selected360CustomerId, setSelected360CustomerId] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(getActiveTheme());

  // Apply theme variables to root on mount and listen to changes
  useEffect(() => {
    applyThemeToDocument(getActiveTheme());
    const unsub = onThemeChange((updated) => {
      setCurrentTheme(updated);
    });
    return () => unsub();
  }, []);

  // Keyboard shortcut Cmd+K or Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real Logout Handler: Revoke session on backend and clear local credentials
  const handleLogout = useCallback(async (customNotice?: string) => {
    try {
      if (accessToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (err) {
      console.warn('Backend logout revocation could not be confirmed (server unavailable). Local session cleared.');
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setCurrentUser(null);
      setActiveTab('backoffice_dashboard');
      setActiveTab('superadmin_dashboard');
      setLogoutNotice(customNotice || 'You have been successfully logged out.');
    }
  }, [accessToken]);

  // Canonical Synthetic Persona Test Accounts Map
  const ROLE_DEMO_EMAILS: Record<UserRoleType, string> = {
    [UserRoleType.SUPER_ADMIN]: 'admin@a2zdiagnostic.com',
    [UserRoleType.OFFICE_ADMIN]: 'office.admin@a2zdiagnostic.com',
    [UserRoleType.SALES_PERSON]: 'sales.west@a2zdiagnostic.com',
    [UserRoleType.SERVICE_ENGINEER]: 'service.eng@a2zdiagnostic.com',
    [UserRoleType.DELIVERY_STAFF]: 'delivery.staff@a2zdiagnostic.com',
    [UserRoleType.APPLICATION_SUPPORT]: 'app.support@a2zdiagnostic.com',
    [UserRoleType.ACCOUNTS_STAFF]: 'accounts.hq@a2zdiagnostic.com',
    [UserRoleType.FINANCE_STAFF]: 'finance.lead@a2zdiagnostic.com',
    [UserRoleType.CUSTOMER]: 'lab.director@metropolisdiag.com',
    [UserRoleType.DISTRIBUTOR]: 'distributor@biomeddist.com',
    [UserRoleType.SALES_MANAGER]: 'sales.manager.west@a2zdiagnostic.com',
    [UserRoleType.SERVICE_MANAGER]: 'service.mgr@a2zdiagnostic.com',
    [UserRoleType.MARKETING_STAFF]: 'marketing@a2zdiagnostic.com',
    [UserRoleType.OFFICE_STAFF]: 'dispatch.staff@a2zdiagnostic.com',
    [UserRoleType.AUTHORIZED_APPROVER]: 'approver.commercial@a2zdiagnostic.com',
  };

  // Instant Persona Switcher: switches active session and navigates to the role's native dashboard
  const handleDevRoleSwitch = useCallback(async (role: UserRoleType) => {
    const demoEmail = ROLE_DEMO_EMAILS[role];
    if (demoEmail) {
      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: demoEmail, password: 'A2zSecurePass#2026' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken && data.user) {
            setAccessToken(data.accessToken);
            if (data.refreshToken) setRefreshToken(data.refreshToken);
            setCurrentUser(data.user);
            setCurrentRole(data.user.roleType || role);
            setLogoutNotice(null);

            // Navigate to native role view using Primary Business Role mapping
            const primary = toPrimaryRole(role);
            if (primary === PrimaryBusinessRole.SUPER_ADMIN) {
              setActiveTab('superadmin_dashboard');
            } else if (primary === PrimaryBusinessRole.BACK_OFFICE) {
              setActiveTab('backoffice_dashboard');
            } else if (primary === PrimaryBusinessRole.LABORATORY) {
              setActiveTab('mobile_app');
            } else if (primary === PrimaryBusinessRole.SALES_STAFF) {
              setActiveTab('sales_field_mobile');
            } else if (primary === PrimaryBusinessRole.DELIVERY_STAFF) {
              setActiveTab('delivery_mobile');
            } else if (primary === PrimaryBusinessRole.APPLICATION_STAFF) {
              setActiveTab('app_support_mobile');
            } else if (primary === PrimaryBusinessRole.SERVICE_STAFF) {
              setActiveTab('service_mobile');
            } else {
              setActiveTab('superadmin_dashboard');
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Direct role switch auto-auth failed, falling back to sign-in view.');
      }
    }
    handleLogout(`Development target switched to ${role}. Please sign in with that account's credentials.`);
  }, [handleLogout]);

  // Refresh token rotation
  const handleRefreshToken = useCallback(async () => {
    if (!refreshToken) return;
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
      }
    } catch (err) {
      console.error('Token refresh failed', err);
    }
  }, [refreshToken]);

  // Fetch users & logs
  const refreshData = useCallback(async () => {
    try {
      const healthRes = await fetch('/api/v1/system/health');
      if (healthRes.ok) setIsBackendHealthy(true);

      if (accessToken) {
        const usersRes = await fetch('/api/v1/users', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (usersRes.ok) {
          const uData = await usersRes.json();
          setUsersList(uData.users);
        }

        const logsRes = await fetch('/api/v1/audit-logs?limit=50', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (logsRes.ok) {
          const lData = await logsRes.json();
          setAuditLogs(lData.logs);
        }
      }
    } catch (err) {
      console.error('Error refreshing backend data', err);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      refreshData();
    }
  }, [accessToken, refreshData]);

  // Unauthenticated application state: show LoginView if no active authenticated session
  if (!accessToken || !currentUser) {
    return (
      <LoginView
        onLoginSuccess={({ user, accessToken: token, refreshToken: rToken }) => {
          setAccessToken(token);
          if (rToken) setRefreshToken(rToken);
          setCurrentUser(user);
          setCurrentRole(user.roleType || UserRoleType.OFFICE_ADMIN);
          setLogoutNotice(null);
          const primary = toPrimaryRole(user.roleType);
          if (primary === PrimaryBusinessRole.SUPER_ADMIN) {
            setActiveTab('superadmin_dashboard');
          } else if (primary === PrimaryBusinessRole.BACK_OFFICE) {
            setActiveTab('backoffice_dashboard');
          } else if (primary === PrimaryBusinessRole.LABORATORY) {
            setActiveTab('mobile_app');
          } else if (primary === PrimaryBusinessRole.SALES_STAFF) {
            setActiveTab('sales_field_mobile');
          } else if (primary === PrimaryBusinessRole.DELIVERY_STAFF) {
            setActiveTab('delivery_mobile');
          } else if (primary === PrimaryBusinessRole.APPLICATION_STAFF) {
            setActiveTab('app_support_mobile');
          } else if (primary === PrimaryBusinessRole.SERVICE_STAFF) {
            setActiveTab('service_mobile');
          } else {
            setActiveTab('superadmin_dashboard');
          }
        }}
        logoutNotice={logoutNotice}
        currentTheme={currentTheme}
      />
    );
  }

  // Standalone Mobile Applications Isolation (Parts 2, 5, 6, 7, 8, 9, 32)
  // When an internal field employee or laboratory customer is authenticated, render their dedicated standalone mobile app
  // strictly without embedding inside the desktop BackOfficeSidebar or admin header chrome.
  const primaryRole = toPrimaryRole(currentRole);
  const isStandaloneMobileUser =
    primaryRole === PrimaryBusinessRole.LABORATORY ||
    primaryRole === PrimaryBusinessRole.SALES_STAFF ||
    primaryRole === PrimaryBusinessRole.SERVICE_STAFF ||
    primaryRole === PrimaryBusinessRole.DELIVERY_STAFF ||
    primaryRole === PrimaryBusinessRole.APPLICATION_STAFF;

  if (isStandaloneMobileUser) {
    return (
      <div
        className="min-h-screen h-[100dvh] w-full max-w-full flex flex-col overflow-hidden font-sans select-none"
        style={{
          backgroundColor: currentTheme.brand.dominant,
          color: currentTheme.brand.forest,
        }}
      >
        {/* Sleek Top Native Mobile Bar */}
        <div className="bg-[#0E1035] text-white px-4 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-xs shrink-0 text-white shadow-xs">
              DS
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black truncate text-white">
                {primaryRole === PrimaryBusinessRole.LABORATORY && 'Diagnostic Services — Lab Portal'}
                {primaryRole === PrimaryBusinessRole.SALES_STAFF && 'Diagnostic Services — Sales Mobile'}
                {primaryRole === PrimaryBusinessRole.SERVICE_STAFF && 'Diagnostic Services — Service Mobile'}
                {primaryRole === PrimaryBusinessRole.DELIVERY_STAFF && 'Diagnostic Services — Delivery Mobile'}
                {primaryRole === PrimaryBusinessRole.APPLICATION_STAFF && 'Diagnostic Services — App Support'}
              </div>
              <div className="text-[10px] text-slate-300 font-semibold truncate flex items-center gap-1.5">
                <span>{currentUser.name || currentUser.email}</span>
                <span className="opacity-40">•</span>
                <span className="text-emerald-400 font-bold">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleLogout()}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/15 hover:bg-rose-600/80 text-white border border-white/20 transition cursor-pointer flex items-center gap-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Dedicated Standalone Mobile Screen */}
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          {primaryRole === PrimaryBusinessRole.LABORATORY && (
            <CustomerMobileApp
              deviceType="responsive"
              onNavigateToEnterprise={() => { }}
            />
          )}
          {primaryRole === PrimaryBusinessRole.SALES_STAFF && (
            <MobileSalesPersonView
              currentUser={currentUser}
              token={accessToken}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}
          {primaryRole === PrimaryBusinessRole.SERVICE_STAFF && (
            <MobileServiceEngineerView
              currentUser={currentUser}
              token={accessToken}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}
          {primaryRole === PrimaryBusinessRole.DELIVERY_STAFF && (
            <MobileDeliveryStaffView
              currentUser={currentUser}
              token={accessToken}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}
          {primaryRole === PrimaryBusinessRole.APPLICATION_STAFF && (
            <MobileApplicationSupportView
              currentUser={currentUser}
              token={accessToken}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'tally_suite') {
    // Gracefully route legacy tally_suite requests to the new External Tally Integration & Sync Manager
    setActiveTab('tally_integration');
  }

  return (
    <div
      className="min-h-screen h-[100dvh] w-full max-w-full flex overflow-hidden font-sans transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.brand.dominant,
        color: currentTheme.brand.forest,
      }}
    >
      {/* Global Search Modal Overlay */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsGlobalSearchOpen(false);
        }}
        token={accessToken}
      />

      {/* Customer 360 Modal Overlay */}
      {selected360CustomerId && (
        <Customer360Modal
          customerId={selected360CustomerId}
          onClose={() => setSelected360CustomerId(null)}
          token={accessToken}
          onNavigateTab={(tab) => {
            setActiveTab(tab);
            setSelected360CustomerId(null);
          }}
        />
      )}

      {/* Security Governance & Active Device Sessions Modal Overlay */}
      <SecurityConsoleModal
        isOpen={isSecurityConsoleOpen}
        onClose={() => setIsSecurityConsoleOpen(false)}
        currentUser={currentUser}
        token={accessToken}
        onUserUpdated={refreshData}
        onNavigateToSecuritySessions={() => setActiveTab('security_sessions')}
      />

      {/* A2Z Stage & Workflow Color System Modal */}
      <StageThemeColorModal
        isOpen={isStageThemeModalOpen}
        onClose={() => setIsStageThemeModalOpen(false)}
        onThemeApplied={(theme) => setCurrentTheme(theme)}
      />

      {/* Diagnostic Services Modern Collapsible Back Office Sidebar */}
      <BackOfficeSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={currentTheme}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        onOpenStageThemeModal={() => setIsStageThemeModalOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        currentUser={currentUser}
        currentRole={currentRole}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 min-w-0 w-full max-w-full flex flex-col h-[100dvh] overflow-hidden transition-colors duration-300"
        style={{
          backgroundColor: currentTheme.brand.dominant,
        }}
      >
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          currentRole={currentRole}
          onSelectRole={handleDevRoleSwitch}
          onRefreshSession={handleRefreshToken}
          onLogout={() => handleLogout()}
          isBackendHealthy={isBackendHealthy}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenSecurityConsole={() => setIsSecurityConsoleOpen(true)}
          onOpenStageThemeModal={() => setIsStageThemeModalOpen(true)}
          currentTheme={currentTheme}
        />

        {/* Staff Dashboard Preview Mode Banner for Authorized Admins */}
        {(() => {
          const isAuthorizedAdmin =
            currentRole === UserRoleType.SUPER_ADMIN ||
            currentRole === UserRoleType.OFFICE_ADMIN ||
            currentRole === UserRoleType.ACCOUNTS_STAFF ||
            currentRole === UserRoleType.FINANCE_STAFF;

          const STAFF_PREVIEW_TABS: Record<string, string> = {
            field_staff_suite: 'Field Staff Apps Suite (Sales, Service, Delivery, Application)',
            live_staff_tracking: 'Back Office Live Staff GPS Tracking & Reports',
            sales_field_mobile: 'Sales Person (GPS Field & Selfie)',
            service_mobile: 'Service Engineer (DS Service & AMC)',
            delivery_mobile: 'Delivery Staff (Diagnostic Express Logistics)',
            app_support_mobile: 'Application Support Desk',
            service_engineer: 'Service Engineer Console',
            preventive_maintenance: 'Service Manager (PM Schedule)',
            mobile_app: 'Customer & Distributor Mobile Portal',
            mobile_cms: 'Marketing Staff (Mobile CMS)',
            orders_management: 'Office Staff & Sales Manager (Orders)',
            credit_management: 'Accounts & Finance (Credit/Ledger)',
    accounts_payments: 'Accounts & Customer Payments (Receivables)',
            payroll_management: 'Finance Director (Dual-Control Payroll)',
          };

          const previewLabel = isAuthorizedAdmin && activeTab !== 'backoffice_dashboard' && activeTab !== 'superadmin_dashboard' ? STAFF_PREVIEW_TABS[activeTab] : null;
          if (!previewLabel) return null;

          return (
            <div
              className="px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 shadow-2xs"
              style={{
                backgroundColor: `${currentTheme.brand.lightPista}90`,
                borderColor: currentTheme.brand.lightPista,
                color: currentTheme.brand.forest,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentTheme.brand.forest }} />
                <span className="font-bold">
                  Staff View Preview: <span className="underline">{previewLabel}</span>
                </span>
                <span className="hidden lg:inline text-[11px] opacity-80">
                  (Preview mode — Active administrative session &amp; backend permissions preserved for {currentUser?.name} [{currentRole}])
                </span>
              </div>
              <button
                onClick={() => setActiveTab(toPrimaryRole(currentRole) === PrimaryBusinessRole.SUPER_ADMIN ? 'superadmin_dashboard' : 'backoffice_dashboard')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition hover:opacity-90 shadow-2xs cursor-pointer"
                style={{
                  backgroundColor: currentTheme.brand.forest,
                  borderColor: currentTheme.brand.forest,
                  color: currentTheme.brand.dominant,
                }}
              >
                <span>{toPrimaryRole(currentRole) === PrimaryBusinessRole.SUPER_ADMIN ? 'Return to Executive Dashboard' : 'Return to Operations Dashboard'}</span>
              </button>
            </div>
          );
        })()}

        {(() => {
          const renderActiveScreen = () => (
            <>
              {/* Diagnostic Back Office Core Views */}
              {/* Super Admin Executive Command Centre */}
              {activeTab === 'superadmin_dashboard' && (
                <SuperAdminDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {/* Back Office Operations Command Desk */}
              {activeTab === 'backoffice_dashboard' && (
                <BackOfficeOperationsDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {/* Department Management Dashboards (Super Admin & Back Office) */}
              {activeTab === 'customers_labs' && (
                <LaboratoryManagementDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'customer_directory' && (
                <CustomerManagementView
                  currentRole={currentRole}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}
              {activeTab === 'sales_dashboard' && (
                <SalesManagementDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'service_amc' && (
                <ServiceManagementDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'delivery_logistics' && (
                <DeliveryManagementDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'application_support' && (
                <ApplicationSupportDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'products_pricing' && (
                <ProductsPricingView
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}
              {activeTab === 'orders_management' && (
                <AdminOrdersManagementView token={accessToken} />
              )}
              {activeTab === 'quotations' && (
                <QuotationManagementView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'complaints_tickets' && (
                <ComplaintsTicketsView
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}
              {activeTab === 'application_requests' && (
                <ApplicationRequestsView
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}
              {activeTab === 'inventory_management' && (
                <InventoryManagementView
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}
              {/* Mobile Field & Role Operations Views */}
              {activeTab === 'field_staff_suite' && (
                <FieldStaffSuiteView
                  currentUser={currentUser}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'live_staff_tracking' && (
                <LiveStaffTrackingAndReportsView
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'sales_field_mobile' && (
                <MobileSalesPersonView
                  currentUser={currentUser}
                  token={accessToken}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'service_mobile' && (
                <MobileServiceEngineerView
                  currentUser={currentUser}
                  token={accessToken}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'delivery_mobile' && (
                <MobileDeliveryStaffView
                  currentUser={currentUser}
                  token={accessToken}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'app_support_mobile' && (
                <MobileApplicationSupportView
                  currentUser={currentUser}
                  token={accessToken}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'payroll_management' && (
                <PayrollManagementView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                />
              )}

              {activeTab === 'reports_analytics' && (
                <ReportsAnalyticsView
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}

              {/* External Tally ERP 9 / TallyPrime Integration & Sync Manager */}
              {(activeTab === 'tally_integration' || activeTab === 'tally_suite') && (
                <ExternalTallySyncManagerView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {/* Integrated Tally-Style Accounting Engine & Reports (25 submodules) */}
              {activeTab.startsWith('acc_') && (
                <AccountingModuleHub
                  currentTab={activeTab}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  currentUser={currentUser}
                  currentRole={currentRole}
                  token={accessToken}
                />
              )}

              {/* Back Office Operations Views */}
              {activeTab === 'backoffice_hub' && (
                <BackOfficeRoleDashboardView
                  currentUser={currentUser}
                  currentRole={currentRole}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                />
              )}
              {activeTab === 'staff_attendance' && (
                <StaffAttendanceConsoleView
                  currentUserId={currentUser?.id}
                  currentUserRole={currentRole}
                  currentUserName={currentUser?.name}
                  authToken={accessToken || undefined}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'my_work' && (
                <MyWorkInboxView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  token={accessToken}
                  currentRole={currentRole}
                />
              )}
              {activeTab === 'approvals' && (
                <ApprovalCenterView
                  currentUserId={currentUser?.id}
                  currentUserRole={currentRole}
                  token={accessToken}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}
              {activeTab === 'background_jobs' && (
                <BackgroundJobsView
                  token={accessToken}
                  currentUserRole={currentRole}
                />
              )}
              {activeTab === 'system_health' && (
                <SystemHealthView
                  token={accessToken}
                />
              )}

              {/* Enterprise Data Import Suite */}
              {activeTab === 'import_hub' && (
                <EnterpriseImportHubView
                  accessToken={accessToken}
                  currentRole={currentRole}
                  onNavigateToCatalog={() => setActiveTab('products')}
                  onNavigateToUsers={() => setActiveTab('users')}
                />
              )}
              {activeTab === 'customer_import' && (
                <CustomerImportView
                  accessToken={accessToken}
                  currentRole={currentRole}
                  onNavigateToUsers={() => setActiveTab('users')}
                />
              )}
              {activeTab === 'pricing_import' && (
                <SpecialPricingImportView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}
              {activeTab === 'equipment_import' && (
                <EquipmentImportView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}
              {activeTab === 'ledger_import' && (
                <OpeningLedgerImportView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}
              {activeTab === 'target_import' && (
                <SalesTargetImportView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}

              {/* Sync & Resilience Screens */}
              {activeTab === 'sync_activity' && (
                <SyncActivityView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}

              {/* Maintenance Screens */}
              {activeTab === 'preventive_maintenance' && (
                <PreventiveMaintenanceView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}

              {/* Service & Complaint Screens */}
              {activeTab === 'service_engineer' && (
                <ServiceEngineerDashboardView
                  accessToken={accessToken}
                  currentRole={currentRole}
                />
              )}

              {/* Customer & Order Management Screens */}
              {/* Customer Laboratory Portal - Standalone Responsive Web View */}
              {activeTab === 'mobile_app' && (
                <ErrorBoundary fallbackTitle="Laboratory Customer Portal">
                  <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900">
                    <CustomerMobileApp
                      deviceType="responsive"
                      onNavigateToEnterprise={() =>
                        setActiveTab(toPrimaryRole(currentRole) === PrimaryBusinessRole.SUPER_ADMIN ? 'superadmin_dashboard' : 'backoffice_dashboard')
                      }
                    />
                  </div>
                </ErrorBoundary>
              )}
                  {activeTab === 'admin_orders' && (
                    <AdminOrdersManagementView token={accessToken} />
                  )}
                  {activeTab === 'credit_management' && (
                    <CustomerCreditBackOfficeView />
                  )}
                  {activeTab === 'accounts_payments' && (
                    <BackOfficePaymentsView
                      currentUser={currentUser}
                      currentRole={currentRole}
                      token={accessToken}
                    />
                  )}
                  {activeTab === 'mobile_cms' && (
                    <AdminMobileCmsView />
                  )}

                  {/* Catalog & Master Data Screens */}
                  {activeTab === 'products' && (
                    <ProductMasterView
                      accessToken={accessToken}
                      currentRole={currentRole}
                    />
                  )}
                  {activeTab === 'product_import' && (
                    <ProductImportView
                      accessToken={accessToken}
                      currentRole={currentRole}
                      onNavigateToCatalog={() => setActiveTab('products')}
                    />
                  )}
                  {activeTab === 'companies' && (
                    <CompanyManagementView
                      accessToken={accessToken}
                      currentRole={currentRole}
                    />
                  )}
                  {activeTab === 'categories' && (
                    <CategoryTreeView
                      accessToken={accessToken}
                      currentRole={currentRole}
                    />
                  )}

                  {/* Core Architecture & Security Screens */}
                  {activeTab === 'architecture' && <ArchitectureView />}
                  {activeTab === 'rbac' && <RbacMatrixView currentRole={currentRole} onSelectRole={handleDevRoleSwitch} />}
                  {activeTab === 'database' && <DatabaseErdView />}
                  {activeTab === 'api_sandbox' && (
                    <ApiSandboxView
                      currentUser={currentUser}
                      currentRole={currentRole}
                      accessToken={accessToken}
                      refreshToken={refreshToken}
                      onExecuteRefresh={handleRefreshToken}
                      onExecuteLogin={async () => handleLogout('Re-authentication requested from API sandbox. Please sign in.')}
                    />
                  )}
                  {activeTab === 'users' && (
                    <UserDirectoryView
                      users={usersList}
                      currentRole={currentRole}
                      token={accessToken}
                      onRefreshUsers={refreshData}
                      onNavigateToCustomerImport={() => setActiveTab('customer_import')}
                      onOpenSecuritySuite={() => setActiveTab('security_test_suite')}
                      onNavigateToSecuritySessions={() => setActiveTab('security_sessions')}
                      onNavigateToAuthPipeline={() => setActiveTab('auth_pipeline')}
                    />
                  )}
                  {activeTab === 'audit' && (
                    <AuditLogsView logs={auditLogs} onRefreshLogs={refreshData} />
                  )}
                  {activeTab === 'security_test_suite' && (
                    <SecurityTestSuiteView
                      token={accessToken}
                      currentUserRole={currentRole}
                    />
                  )}
                  {activeTab === 'security_sessions' && (
                    <SecuritySessionsView
                      currentUser={currentUser}
                      currentRole={currentRole}
                      token={accessToken}
                      onRefreshData={refreshData}
                    />
                  )}
                  {activeTab === 'auth_pipeline' && (
                    <AuthPipelineView
                      currentUser={currentUser}
                      currentRole={currentRole}
                      token={accessToken}
                      onNavigateTab={(tab) => setActiveTab(tab)}
                    />
                  )}
                </>
              );

              return (
              <>
                {/* Main Content Stage */}
                <main className="flex-1 min-w-0 w-full max-w-full overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                  {renderActiveScreen()}

                  {/* Floating Order Reminder Assistant for Back Office & Super Admin */}
                  {(toPrimaryRole(currentRole) === PrimaryBusinessRole.SUPER_ADMIN ||
                    toPrimaryRole(currentRole) === PrimaryBusinessRole.BACK_OFFICE) && (
                    <OrderReminderChatbot
                      currentUser={currentUser}
                      currentRole={currentRole}
                      token={accessToken}
                      onNavigateTab={(tab) => setActiveTab(tab)}
                      isFloating={true}
                    />
                  )}

                  {/* Footer inside content area */}
                  <div className="pt-6 pb-2 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div>
                      Diagnostic Services • Enterprise Catalog, Operations &amp; Mobile Ecosystem
                    </div>
                    <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-600">
                      <span className="text-[#5F8F4D] font-medium">PostgreSQL 16 3NF</span>
                      <span>•</span>
                      <span className="text-[#22381E] font-medium">Express & Prisma</span>
                      <span>•</span>
                      <span className="text-[#4C8994] font-medium">Flutter Riverpod</span>
                    </div>
                  </div>
                </main>
              </>
              );
        })()}
            </div>
    </div>
      );
}

