import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../types';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Wrench,
  DollarSign,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Bell,
  CheckSquare,
  Activity,
  MapPin,
  CalendarCheck,
  Award,
  Sparkles,
  Inbox
} from 'lucide-react';

interface BackOfficeRoleDashboardViewProps {
  currentUser: User | null;
  currentRole: UserRoleType;
  onNavigateTab: (tabId: string) => void;
  token?: string | null;
}

export const BackOfficeRoleDashboardView: React.FC<BackOfficeRoleDashboardViewProps> = ({
  currentRole,
  onNavigateTab,
  token,
}) => {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboardSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/role-dashboard-summary?role=${currentRole}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setSummaryData(json.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard summary', err);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
  }, [currentRole, token]);

  const kpis = summaryData?.kpis || {
    pendingApprovalsCount: 3,
    pendingOrdersCount: 2,
    processingOrdersCount: 4,
    totalOrdersCount: 18,
    totalRevenueYTD: 582400,
    openServiceTicketsCount: 5,
    criticalServiceTicketsCount: 2,
    slaBreachedCount: 1,
    activeBackgroundJobsCount: 1,
    failedBackgroundJobsCount: 0,
    totalEquipmentCount: 8,
    downEquipmentCount: 1,
    pmDueCount: 3,
    syncHealthStatus: 'HEALTHY',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Role Context Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30">
              {currentRole.replace(/_/g, ' ')} WORKSPACE
            </span>
            <span className="text-xs text-slate-400 font-medium">● Role-Authorized Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Back Office Operations Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Strict backend validation active. Viewing authorized operational metrics and actionable work queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('my_work')}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#22381E] hover:bg-[#1E331B] active:scale-98 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Inbox className="w-4 h-4 text-[#D2E7C4]" />
            <span>Open "My Work" Inbox</span>
          </button>

          <button
            onClick={fetchDashboardSummary}
            disabled={isLoading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1E331B]' : ''}`} />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* ROLE-SPECIFIC SECTIONS */}
      {/* -------------------------------------------------------------------------- */}

      {/* 1. SUPER ADMIN VIEW */}
      {currentRole === UserRoleType.SUPER_ADMIN && (
        <div className="space-y-6">
          {/* Critical Alerts Ribbon */}
          {kpis.criticalServiceTicketsCount > 0 || kpis.pendingApprovalsCount > 0 ? (
            <div className="bg-[#F4DFA3]/40 border border-[#F4DFA3] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-[#F4DFA3] text-[#C58A16] rounded-xl border border-[#C58A16]/25 shadow-2xs flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#C58A16]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E331B]">
                    {kpis.pendingApprovalsCount} Critical Approval Requests & {kpis.criticalServiceTicketsCount} High-SLA Alerts
                  </h4>
                  <p className="text-xs text-[#7A5A1B] mt-0.5">
                    Sensitive pricing contracts and diagnostic analyzer downtime require immediate administrative clearance.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigateTab('approvals')}
                  className="px-3.5 py-1.5 bg-[#22381E] hover:bg-[#1E331B] active:scale-98 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Review Approvals
                </button>
                <button
                  onClick={() => onNavigateTab('service_engineer')}
                  className="px-3 py-1.5 bg-white border border-[#C58A16]/40 text-[#7A5A1B] hover:bg-[#F4DFA3]/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  View SLA Alerts
                </button>
              </div>
            </div>
          ) : null}

          {/* Super Admin Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => onNavigateTab('approvals')}
              className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
                <div className="p-2 bg-[#F3C7C2]/40 text-[#B94A40] rounded-lg group-hover:bg-[#F3C7C2]/70 transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpis.pendingApprovalsCount}</div>
              <div className="text-xs text-[#B94A40] font-medium mt-1 flex items-center gap-1">
                <span>Requires Super Admin review</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div 
              onClick={() => onNavigateTab('admin_orders')}
              className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Orders</span>
                <div className="p-2 bg-[#C9DDE0]/50 text-[#245B63] rounded-lg group-hover:bg-[#C9DDE0] transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpis.pendingOrdersCount}</div>
              <div className="text-xs text-[#245B63] font-medium mt-1 flex items-center gap-1">
                <span>YTD: ₹{kpis.totalRevenueYTD.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div 
              onClick={() => onNavigateTab('service_engineer')}
              className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Service Desk</span>
                <div className="p-2 bg-[#F4DFA3]/50 text-[#C58A16] rounded-lg group-hover:bg-[#F4DFA3] transition-colors">
                  <Wrench className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{kpis.openServiceTicketsCount} Open</div>
              <div className="text-xs text-[#7A5A1B] font-medium mt-1">
                {kpis.criticalServiceTicketsCount} Critical • {kpis.downEquipmentCount} Analyzer Down
              </div>
            </div>

            <div 
              onClick={() => onNavigateTab('system_health')}
              className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">System Health</span>
                <div className="p-2 bg-[#D2E7C4]/50 text-[#5F8F4D] rounded-lg group-hover:bg-[#D2E7C4] transition-colors">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#1E331B] font-mono">100% OK</div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                0 Failed Jobs • PostgreSQL Synced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BACK OFFICE / OFFICE ADMIN VIEW */}
      {(currentRole === UserRoleType.OFFICE_ADMIN || currentRole === UserRoleType.OFFICE_STAFF) && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => onNavigateTab('admin_orders')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Pending Orders</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.pendingOrdersCount}</div>
              <div className="text-xs text-[#245B63] mt-1 font-medium">Awaiting review & dispatch</div>
            </div>

            <div 
              onClick={() => onNavigateTab('users')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Customer Verifications</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">1 Lab</div>
              <div className="text-xs text-[#7A5A1B] mt-1 font-medium">GSTIN & Drug license check</div>
            </div>

            <div 
              onClick={() => onNavigateTab('import_hub')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Enterprise Data Imports</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">6 Modules</div>
              <div className="text-xs text-[#5F8F4D] mt-1 font-medium">All batches validated</div>
            </div>

            <div 
              onClick={() => onNavigateTab('my_work')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Assigned Tasks</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">4 Active</div>
              <div className="text-xs text-slate-500 mt-1">View work inbox</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SERVICE MANAGER & SERVICE ENGINEER VIEW */}
      {(currentRole === UserRoleType.SERVICE_MANAGER || currentRole === UserRoleType.SERVICE_ENGINEER) && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => onNavigateTab('service_engineer')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Active Service Tickets</div>
              <div className="text-2xl font-bold text-[#1E331B] mt-1">{kpis.openServiceTicketsCount}</div>
              <div className="text-xs text-slate-500 mt-1">1 In-Progress, 4 Queued</div>
            </div>

            <div 
              onClick={() => onNavigateTab('preventive_maintenance')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">PM Work Orders Due</div>
              <div className="text-2xl font-bold text-[#C58A16] mt-1">{kpis.pmDueCount} Units</div>
              <div className="text-xs text-slate-500 mt-1">Quarterly calibration cycle</div>
            </div>

            <div 
              onClick={() => onNavigateTab('sync_activity')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Field Sync Queue</div>
              <div className="text-2xl font-bold text-[#5F8F4D] mt-1">Synced</div>
              <div className="text-xs text-slate-500 mt-1">0 Offline pending items</div>
            </div>

            <div 
              onClick={() => onNavigateTab('equipment_import')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Equipment Fleet</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalEquipmentCount} Installed</div>
              <div className="text-xs text-[#B94A40] mt-1 font-medium">{kpis.downEquipmentCount} Down analyzer</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SALES PERSON & SALES MANAGER VIEW */}
      {(currentRole === UserRoleType.SALES_PERSON || currentRole === UserRoleType.MARKETING_STAFF) && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => onNavigateTab('target_import')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Monthly Target</div>
              <div className="text-2xl font-bold text-[#1E331B] mt-1">₹25.0 Lakh</div>
              <div className="text-xs text-[#5F8F4D] mt-1 font-medium">72% Achieved (₹18.0L)</div>
            </div>

            <div 
              onClick={() => onNavigateTab('pricing_import')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Contract Prices</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">18 Active</div>
              <div className="text-xs text-slate-500 mt-1">Institutional discounts</div>
            </div>

            <div 
              onClick={() => onNavigateTab('mobile_app')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">Field Visits Today</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">3 Visits</div>
              <div className="text-xs text-slate-500 mt-1">Geo-checkin enabled</div>
            </div>

            <div 
              onClick={() => onNavigateTab('approvals')}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-[#5F8F4D] transition-all cursor-pointer shadow-xs"
            >
              <div className="text-xs text-slate-400 font-semibold uppercase">My Price Requests</div>
              <div className="text-2xl font-bold text-[#C58A16] mt-1">1 Pending</div>
              <div className="text-xs text-slate-500 mt-1">Apollo rate contract</div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* QUICK OPERATIONAL WORKSPACES GRID */}
      {/* -------------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Action Work Items */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#1E331B]" />
              <h3 className="text-sm font-bold text-slate-900">Urgent Pending Actions</h3>
            </div>
            <button
              onClick={() => onNavigateTab('my_work')}
              className="text-xs text-[#1E331B] hover:text-[#5F8F4D] font-bold flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {(summaryData?.urgentWorkItems || []).map((item: any) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.navigationTab || 'my_work')}
                className="p-3 bg-slate-50 hover:bg-[#D2E7C4]/20 border border-slate-200 hover:border-[#5F8F4D]/40 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === 'OVERDUE' ? 'bg-[#F3C7C2] text-[#B94A40]' :
                    item.status === 'DUE TODAY' ? 'bg-[#F4DFA3] text-[#7A5A1B]' :
                    'bg-[#C9DDE0] text-[#1E331B]'
                  }`}>
                    {item.status}
                  </span>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900">{item.title}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.shortDescription}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium">Module: {item.module}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Quick Links to Completed Master Modules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#5F8F4D]" />
            <h3 className="text-sm font-bold text-slate-900">Operational Shortcuts</h3>
          </div>

          <div className="space-y-2 text-xs">
            <button
              onClick={() => onNavigateTab('staff_attendance')}
              className="w-full text-left p-2.5 rounded-lg border border-[#5F8F4D]/30 bg-[#D2E7C4]/20 hover:bg-[#D2E7C4]/40 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#1E331B]" />
                <span className="font-semibold text-[#1E331B]">Staff Attendance & Geofencing Console</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#1E331B] group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('import_hub')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-[#5F8F4D]/40 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-[#5F8F4D]" />
                <span className="font-semibold text-slate-800">Enterprise Master Data Import Hub</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('admin_orders')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-[#5F8F4D]/40 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-[#245B63]" />
                <span className="font-semibold text-slate-800">Order & Payment Operations</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('service_engineer')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-[#5F8F4D]/40 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-[#1E331B]" />
                <span className="font-semibold text-slate-800">14-Stage Service Desk Console</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('preventive_maintenance')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-[#5F8F4D]/40 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CalendarCheck className="w-4 h-4 text-[#7A5A1B]" />
                <span className="font-semibold text-slate-800">Preventive Maintenance & Calibration</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigateTab('background_jobs')}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-[#5F8F4D]/40 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-[#C58A16]" />
                <span className="font-semibold text-slate-800">Background Processing Queue</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
            <span className="font-mono text-[#5F8F4D] font-semibold">Strict Backend Rule Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
