import React, { useState } from 'react';
import { UserRoleType } from '../types';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Search, 
  Filter, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface RbacMatrixViewProps {
  currentRole: UserRoleType;
  onSelectRole: (role: UserRoleType) => void;
}

export const RbacMatrixView: React.FC<RbacMatrixViewProps> = ({
  currentRole,
  onSelectRole,
}) => {
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allRoles: { type: UserRoleType; label: string; short: string; badgeColor: string }[] = [
    { type: UserRoleType.SUPER_ADMIN, label: 'Super Admin', short: 'S-ADM', badgeColor: 'bg-[#F3C7C2] text-[#8F2D25]' },
    { type: UserRoleType.OFFICE_ADMIN, label: 'Office Admin', short: 'O-ADM', badgeColor: 'bg-[#F4DFA3] text-[#6B4B12]' },
    { type: UserRoleType.OFFICE_STAFF, label: 'Office Staff', short: 'O-STF', badgeColor: 'bg-slate-100 text-slate-700' },
    { type: UserRoleType.CUSTOMER, label: 'Customer (Lab)', short: 'CUST', badgeColor: 'bg-[#D2E7C4] text-[#1E331B]' },
    { type: UserRoleType.DISTRIBUTOR, label: 'Distributor', short: 'DIST', badgeColor: 'bg-cyan-50 text-cyan-700' },
    { type: UserRoleType.SALES_PERSON, label: 'Sales Person', short: 'SLS', badgeColor: 'bg-[#C9DDE0] text-[#245B63]' },
    { type: UserRoleType.MARKETING_STAFF, label: 'Marketing Staff', short: 'MKTG', badgeColor: 'bg-pink-50 text-pink-700' },
    { type: UserRoleType.SERVICE_ENGINEER, label: 'Service Engineer', short: 'ENG', badgeColor: 'bg-[#E4F1DC] text-[#1E331B]' },
    { type: UserRoleType.SERVICE_MANAGER, label: 'Service Manager', short: 'MGR', badgeColor: 'bg-purple-50 text-purple-700' },
  ];

  interface PermissionDef {
    code: string;
    name: string;
    module: string;
    description: string;
    allowedRoles: UserRoleType[];
  }

  const permissions: PermissionDef[] = [
    // AUTH & USERS
    { code: 'auth:login', name: 'User Authentication', module: 'AUTH', description: 'Log in with credentials or OTP and obtain JWT tokens', allowedRoles: Object.values(UserRoleType) },
    { code: 'users:read', name: 'View Users List', module: 'USERS', description: 'View user profiles and identity records', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.OFFICE_STAFF, UserRoleType.SALES_PERSON, UserRoleType.SERVICE_MANAGER] },
    { code: 'users:manage', name: 'Manage User Accounts', module: 'USERS', description: 'Create, update, deactivate users and assign roles', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN] },
    { code: 'audit:view', name: 'View Security Audit Logs', module: 'AUDIT', description: 'Inspect immutable system security and activity logs', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN] },

    // CATALOG & COMPANIES
    { code: 'catalog:browse', name: 'Browse Product Catalog', module: 'CATALOG', description: 'View reagent, equipment & consumable listings', allowedRoles: Object.values(UserRoleType) },
    { code: 'catalog:manage', name: 'Manage Products & Categories', module: 'CATALOG', description: 'Create, edit, upload datasheets and activate products', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN] },
    { code: 'companies:manage', name: 'Manage Diagnostic Brands', module: 'CATALOG', description: 'Configure Agappe, Snibe, Diasys, Arkray, etc.', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN] },

    // PRICING
    { code: 'pricing:view_own', name: 'View Authorized Customer Pricing', module: 'PRICING', description: 'View custom lab rates (hidden from distributors)', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.CUSTOMER, UserRoleType.SALES_PERSON] },
    { code: 'pricing:manage', name: 'Manage Customer Price Matrices', module: 'PRICING', description: 'Define lab-specific contracts, quantity discounts and rules', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN] },

    // ORDERS
    { code: 'orders:create', name: 'Place Diagnostic Orders', module: 'ORDERS', description: 'Create order, select pack sizes and advance payment', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.CUSTOMER, UserRoleType.DISTRIBUTOR, UserRoleType.SALES_PERSON] },
    { code: 'orders:view_own', name: 'View Own Lab Orders', module: 'ORDERS', description: 'Track order timeline from packing to delivery', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.OFFICE_STAFF, UserRoleType.CUSTOMER, UserRoleType.DISTRIBUTOR] },
    { code: 'orders:manage_all', name: 'Process & Dispatch Orders', module: 'ORDERS', description: 'Update status: Confirmed, Packed, Shipped, Delivered', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.OFFICE_STAFF] },

    // WALLET & QR
    { code: 'wallet:scan_qr', name: 'Scan Reagent QR Codes', module: 'WALLET', description: 'Scan reagent packaging QR to claim loyalty reward points', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.CUSTOMER] },
    { code: 'wallet:view_balance', name: 'View Loyalty Balance & Ledger', module: 'WALLET', description: 'View point balance, statements, and transaction history', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.CUSTOMER] },
    { code: 'wallet:redeem', name: 'Redeem Loyalty Points', module: 'WALLET', description: 'Apply loyalty points towards order discounts', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.CUSTOMER] },

    // SERVICE & TICKETS
    { code: 'service:create_ticket', name: 'Raise Equipment Breakdown Ticket', module: 'SERVICE', description: 'Customer raises breakdown with serial no and photos', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.CUSTOMER] },
    { code: 'service:view_assigned', name: 'View Assigned Service Tickets', module: 'SERVICE', description: 'Service engineer work orders and assigned hospital visits', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.SERVICE_ENGINEER, UserRoleType.SERVICE_MANAGER] },
    { code: 'service:execute_ticket', name: 'Field Service Check-in & Parts Log', module: 'SERVICE', description: 'Check in on-site, record spare parts, resolve ticket', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.SERVICE_ENGINEER, UserRoleType.SERVICE_MANAGER] },
    { code: 'service:manage_all', name: 'Service Manager Dispatch & SLA', module: 'SERVICE', description: 'Assign tickets, review SLA breaches, handle repeat alerts', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.SERVICE_MANAGER] },
    { code: 'service:feedback', name: 'Submit Service Rating', module: 'SERVICE', description: 'Customer grades engineer behavior & resolution (1-5 stars)', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.CUSTOMER] },

    // SALES & MARKETING
    { code: 'sales:check_in', name: 'Sales Field Check-in / Check-out', module: 'SALES', description: 'GPS verified customer visit logging', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.SALES_PERSON] },
    { code: 'sales:targets_view', name: 'View Sales Targets & Achievements', module: 'SALES', description: 'Monthly target vs achievement reports', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.SALES_PERSON] },
    { code: 'sales:expenses_submit', name: 'Submit Field Expenses & Bills', module: 'SALES', description: 'Upload travel and lodging expense vouchers', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.SALES_PERSON] },

    // REPORTS
    { code: 'reports:view_admin', name: 'Executive & Commercial Reports', module: 'REPORTS', description: 'Product sales, customer ledgers, engineer SLA metrics', allowedRoles: [UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.SERVICE_MANAGER, UserRoleType.MARKETING_STAFF] },
  ];

  const modules = ['ALL', 'AUTH', 'USERS', 'CATALOG', 'PRICING', 'ORDERS', 'WALLET', 'SERVICE', 'SALES', 'REPORTS', 'AUDIT'];

  const filteredPermissions = permissions.filter((p) => {
    const matchesModule = selectedModule === 'ALL' || p.module === selectedModule;
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = 
      (p.code || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q);
    return matchesModule && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Section Top Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#22381E] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#1E331B] rounded flex items-center justify-center text-xs font-bold">04</span>
              <span>Granular Authorization Grid</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise Role-Based Access Control (RBAC) Matrix
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Deterministic permission boundaries governing all 9 diagnostic distribution personas.
            </p>
          </div>

          {/* Active Persona Banner */}
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Currently Simulating:</div>
              <div className="text-xs font-bold text-[#1E331B]">{currentRole}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#D2E7C4] border border-[#5F8F4D]/30 flex items-center justify-center text-[#1E331B] font-bold text-xs">
              ✓
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search permission code (e.g., pricing:view_own, wallet:scan_qr)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
            {modules.map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModule(mod)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  selectedModule === mod
                    ? 'bg-[#22381E] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Evaluation for Active Role */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <span>Active Role Access Summary:</span>
          <span className="text-[#22381E] font-bold">{currentRole}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Total Granted Permissions</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {permissions.filter((p) => (p.allowedRoles || []).includes(currentRole) || currentRole === UserRoleType.SUPER_ADMIN).length}
              <span className="text-xs text-slate-400 font-normal"> / {permissions.length}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Catalog & Pricing Visibility</div>
            <div className="text-xs font-semibold text-slate-800 mt-1 flex items-center space-x-1">
              {currentRole === UserRoleType.DISTRIBUTOR ? (
                <span className="text-[#6B4B12] flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Distributor Catalog Only
                </span>
              ) : currentRole === UserRoleType.CUSTOMER ? (
                <span className="text-[#1E331B] flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Authorized Lab Rates
                </span>
              ) : (
                <span className="text-[#1E331B] flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Full Commercial Access
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">QR Loyalty & Wallet Access</div>
            <div className="text-xs font-semibold mt-1">
              {currentRole === UserRoleType.CUSTOMER || currentRole === UserRoleType.SUPER_ADMIN ? (
                <span className="text-[#1E331B] flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> QR Scanning & Redeem Enabled
                </span>
              ) : (
                <span className="text-slate-400 flex items-center">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Restricted from Role
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Service Work Order Execution</div>
            <div className="text-xs font-semibold mt-1">
              {currentRole === UserRoleType.SERVICE_ENGINEER || currentRole === UserRoleType.SERVICE_MANAGER || currentRole === UserRoleType.SUPER_ADMIN ? (
                <span className="text-[#1E331B] flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Check-in & Parts Logging
                </span>
              ) : (
                <span className="text-slate-400 flex items-center">
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Customer/Staff View Only
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Table Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-4 font-semibold text-slate-900 min-w-[220px]">Permission & Description</th>
                <th className="p-4 font-semibold text-slate-900 text-center min-w-[80px]">Module</th>
                {allRoles.map((r) => {
                  const isCurrent = r.type === currentRole;
                  return (
                    <th
                      key={r.type}
                      onClick={() => onSelectRole(r.type)}
                      title={`Click to switch to ${r.label}`}
                      className={`p-3.5 text-center font-semibold cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#E4F1DC] text-[#1E331B] border-x border-[#D2E7C4]'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{r.short}</div>
                      <div className="text-[9px] font-medium opacity-80">{r.label}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map((perm) => {
                return (
                  <tr key={perm.code} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">{perm.code}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{perm.description}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {perm.module}
                      </span>
                    </td>
                    {allRoles.map((r) => {
                      const hasAccess = (perm.allowedRoles || []).includes(r.type) || r.type === UserRoleType.SUPER_ADMIN;
                      const isCurrent = r.type === currentRole;
                      return (
                        <td
                          key={r.type}
                          className={`p-3 text-center ${
                            isCurrent ? 'bg-[#E4F1DC]/40 border-x border-[#D2E7C4]/60' : ''
                          }`}
                        >
                          {hasAccess ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                              <X className="w-3.5 h-3.5 stroke-[1.5]" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

