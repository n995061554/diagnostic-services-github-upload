import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Clock,
  Building,
  FileText,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Eye,
  Download,
  Sliders,
  ChevronRight,
  Info,
  Plus,
} from 'lucide-react';
import { UserRoleType, User, PrimaryBusinessRole, toPrimaryRole, MonthlyPayrollRunRecord, EmployeeSalaryStatementRecord } from '../../types';
import { formatINR } from '../mobile/mobileMockData';

interface PayrollManagementViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  currentUserId?: string;
  currentUserRole?: UserRoleType;
  currentUserName?: string;
  token?: string | null;
}

export const PayrollManagementView: React.FC<PayrollManagementViewProps> = ({
  currentUser,
  currentRole,
  currentUserId = 'u-admin-01',
  currentUserRole,
  currentUserName = 'Rajesh Sharma',
  token,
}) => {
  const activeRole = currentRole || currentUserRole || UserRoleType.OFFICE_ADMIN;
  const activeUserId = currentUser?.id || currentUserId;
  const activeUserName = currentUser?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : currentUserName);

  const [activeTab, setActiveTab] = useState<'payroll_runs' | 'employee_statements' | 'policy_governance'>('payroll_runs');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isSuperAdmin = activeRole === UserRoleType.SUPER_ADMIN;
  const isBackOfficeMaker =
    toPrimaryRole(activeRole) === PrimaryBusinessRole.BACK_OFFICE ||
    activeRole === UserRoleType.OFFICE_ADMIN ||
    activeRole === UserRoleType.OFFICE_STAFF ||
    activeRole === UserRoleType.ACCOUNTS_STAFF ||
    activeRole === UserRoleType.FINANCE_STAFF ||
    isSuperAdmin;

  // Sample Payroll Runs
  const [payrollRuns, setPayrollRuns] = useState<MonthlyPayrollRunRecord[]>([
    {
      id: 'pr-2026-10',
      payrollMonth: '2026-10',
      status: 'PREPARED',
      preparedByUserId: 'u-office-01',
      preparedByName: 'Priya Sharma (Office Admin)',
      preparedAt: '2026-10-22T08:30:00Z',
      totalGrossSalary: 485000,
      totalIncentives: 42500,
      totalDeductions: 14200,
      totalNetSalary: 513300,
      employeeCount: 6,
      notes: 'Initial October 2026 draft compiled from biometric geofenced attendance and verified sales incentives.',
      createdAt: '2026-10-22T08:30:00Z',
    },
    {
      id: 'pr-2026-09',
      payrollMonth: '2026-09',
      status: 'APPROVED',
      preparedByUserId: 'u-office-01',
      preparedByName: 'Priya Sharma (Office Admin)',
      preparedAt: '2026-09-28T10:00:00Z',
      approvedByUserId: 'u-admin-01',
      approvedByName: 'Rajesh Sharma (Super Admin)',
      approvedAt: '2026-09-30T17:45:00Z',
      totalGrossSalary: 485000,
      totalIncentives: 38000,
      totalDeductions: 12000,
      totalNetSalary: 511000,
      employeeCount: 6,
      notes: 'Final September payroll audited and authorized for bank NEFT transfer.',
      createdAt: '2026-09-28T10:00:00Z',
    },
  ]);

  // Sample Statements
  const [statements, setStatements] = useState<EmployeeSalaryStatementRecord[]>([
    {
      id: 'st-01',
      payrollRunId: 'pr-2026-10',
      payrollMonth: '2026-10',
      employeeId: 'u-sales-01',
      employeeName: 'Vikram Malhotra',
      employeeRole: UserRoleType.SALES_PERSON,
      baseMonthlySalary: 55000,
      presentDays: 22,
      paidLeavesDays: 1,
      unpaidAbsenceDays: 0,
      eligibleOvertimeHours: 6,
      eligibleOvertimePay: 2250, // Sales is eligible if authorized
      approvedIncentives: 18500,
      itemizedAdditions: [
        { label: 'Above-Target Sales Incentive (Roche TSH Quota 112%)', amount: 18500, category: 'INCENTIVE' },
        { label: 'Authorized Field Overtime (6 hrs)', amount: 2250, category: 'OVERTIME' },
      ],
      itemizedDeductions: [
        { label: 'Professional Tax (Statutory)', amount: 200, reason: 'STATUTORY_PT' },
        { label: 'Provident Fund (Employee Contribution)', amount: 1800, reason: 'STATUTORY_PF' },
      ],
      netPayableSalary: 73750,
      isApproved: false,
    },
    {
      id: 'st-02',
      payrollRunId: 'pr-2026-10',
      payrollMonth: '2026-10',
      employeeId: 'u-eng-01',
      employeeName: 'Anand Deshmukh',
      employeeRole: UserRoleType.SERVICE_ENGINEER,
      baseMonthlySalary: 62000,
      presentDays: 23,
      paidLeavesDays: 0,
      unpaidAbsenceDays: 0,
      eligibleOvertimeHours: 0,
      eligibleOvertimePay: 0, // STRICT INVARIANT: 0 for Service
      approvedIncentives: 8000,
      itemizedAdditions: [
        { label: 'Biomedical Preventive Maintenance Completion Bonus', amount: 8000, category: 'INCENTIVE' },
      ],
      itemizedDeductions: [
        { label: 'Professional Tax (Statutory)', amount: 200, reason: 'STATUTORY_PT' },
        { label: 'Provident Fund (Employee Contribution)', amount: 1800, reason: 'STATUTORY_PF' },
      ],
      netPayableSalary: 68000,
      isApproved: false,
    },
    {
      id: 'st-03',
      payrollRunId: 'pr-2026-10',
      payrollMonth: '2026-10',
      employeeId: 'u-del-01',
      employeeName: 'Kiran Salunke',
      employeeRole: UserRoleType.DELIVERY_STAFF,
      baseMonthlySalary: 32000,
      presentDays: 22,
      paidLeavesDays: 1,
      unpaidAbsenceDays: 0,
      eligibleOvertimeHours: 0,
      eligibleOvertimePay: 0,
      approvedIncentives: 4000,
      itemizedAdditions: [
        { label: 'On-Time Diagnostic Express Delivery Bonus', amount: 4000, category: 'INCENTIVE' },
      ],
      itemizedDeductions: [
        { label: 'Professional Tax (Statutory)', amount: 200, reason: 'STATUTORY_PT' },
      ],
      netPayableSalary: 35800,
      isApproved: false,
    },
  ]);

  const [inspectingStatement, setInspectingStatement] = useState<EmployeeSalaryStatementRecord | null>(null);
  const [isCalculatingDraft, setIsCalculatingDraft] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  // Hydrate live payroll runs and statements from backend API
  const fetchLivePayrollData = async () => {
    try {
      const headers: Record<string, string> = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {};
      
      const runsRes = await fetch('/api/v1/payroll/runs', { headers });
      if (runsRes.ok) {
        const json = await runsRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setPayrollRuns(json.data);
        }
      }

      const stmtsRes = await fetch(`/api/v1/payroll/statements?payrollMonth=${selectedMonth}`, { headers });
      if (stmtsRes.ok) {
        const json = await stmtsRes.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setStatements(json.data);
        }
      }
    } catch (e) {
      // Retain seeded defaults if offline
    }
  };

  useEffect(() => {
    fetchLivePayrollData();
  }, [selectedMonth, effectiveToken]);

  // Maker: Back Office Prepares Draft Payroll with 26-Day Divisor & Attendance Rules
  const handlePrepareDraft = async () => {
    if (!isBackOfficeMaker) {
      showToast('Unauthorized: Only Back Office or Accounts staff can prepare draft payroll.');
      return;
    }

    setIsCalculatingDraft(true);
    try {
      const res = await fetch('/api/v1/payroll/calculate-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {})
        },
        body: JSON.stringify({
          payrollMonth: selectedMonth,
          notes: `Draft calculated with 26-day base divisor, 8h day, 15m grace & late occurrence rules by ${activeUserName}.`
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.run) {
          setPayrollRuns(prev => [json.data.run, ...prev.filter(r => r.id !== json.data.run.id)]);
        }
        if (json.data?.statements) {
          setStatements(json.data.statements);
        }
        showToast(`Draft payroll for ${selectedMonth} calculated & compiled. Forwarded for Super Admin approval.`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Failed to calculate draft payroll.');
      }
    } catch (err) {
      showToast('Error connecting to payroll calculation service.');
    } finally {
      setIsCalculatingDraft(false);
    }
  };

  // Checker: Only Super Admin Can Give Final Approval
  const handleSuperAdminApprove = async (runId: string) => {
    if (!isSuperAdmin) {
      showToast('SECURITY RESTRICTION: Only the Super Admin can grant final payroll authorization.');
      return;
    }

    setIsApproving(true);
    try {
      const res = await fetch(`/api/v1/payroll/runs/${runId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {})
        }
      });

      if (res.ok) {
        const json = await res.json();
        const approvedRun = json.data;

        setPayrollRuns(prev =>
          prev.map(r =>
            r.id === runId
              ? {
                  ...r,
                  status: 'APPROVED',
                  approvedByUserId: activeUserId,
                  approvedByName: activeUserName,
                  approvedAt: new Date().toISOString(),
                }
              : r
          )
        );

        // Lock statements & make visible to staff
        setStatements(prev =>
          prev.map(s =>
            s.payrollRunId === runId
              ? {
                  ...s,
                  isApproved: true,
                  approvedAt: new Date().toISOString(),
                }
              : s
          )
        );

        showToast('Monthly payroll successfully authorized and finalized! Staff can now view approved statements.');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.message || 'Access Denied: Super Admin authorization required.');
      }
    } catch (err) {
      showToast('Error authorizing payroll run.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-3.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <span>Dual-Control Payroll Governance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maker-Checker workflow: Back Office compiles draft payroll runs; Super Admin grants final disbursement approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Super Admin Approver Authority</span>
            </span>
          )}
        </div>
      </div>

      {/* Mandatory Dual-Control Policy Box */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800 text-xs space-y-1 text-indigo-950 dark:text-indigo-200">
        <div className="font-extrabold flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300">
          <Lock className="w-4 h-4" />
          <span>Strict Payroll & Overtime Invariants Active:</span>
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-700 dark:text-slate-300">
          <li><strong>Zero Overtime:</strong> Service Engineers and Application Support Staff strictly receive ₹0 overtime pay.</li>
          <li><strong>No Late Delivery Deduction:</strong> Delivery Staff never incur automated salary deductions merely for late delivery.</li>
          <li><strong>Final Approved Visibility:</strong> Employees can view their statements <em>only</em> after final approval by the Super Admin.</li>
          <li><strong>Formula Governance:</strong> Deduction rates, leave accruals, and sales overtime rates remain locked until business owner approval.</li>
        </ul>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('payroll_runs')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'payroll_runs'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Monthly Payroll Runs
        </button>
        <button
          onClick={() => setActiveTab('employee_statements')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'employee_statements'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Employee Statements (October 2026)
        </button>
        <button
          onClick={() => setActiveTab('policy_governance')}
          className={`px-4 py-2 rounded-xl font-bold transition-all ${
            activeTab === 'policy_governance'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Policy Governance & Approvals
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: MONTHLY PAYROLL RUNS */}
      {/* ==================================================================== */}
      {activeTab === 'payroll_runs' && (
        <div className="space-y-4">
          {/* Operational Action Bar for Back Office & Super Admin */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Target Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-bold font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
            {isBackOfficeMaker && (
              <button
                type="button"
                onClick={handlePrepareDraft}
                disabled={isCalculatingDraft}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCalculatingDraft ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isCalculatingDraft ? 'Calculating 26-Day Draft...' : 'Prepare & Calculate Monthly Draft Run'}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollRuns.map((run) => (
              <div
                key={run.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Month</span>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{run.payrollMonth}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                      run.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {run.status === 'APPROVED' ? 'Final Approved' : 'Draft Prepared (Pending Approval)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Total Net Payout</span>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatINR(run.totalNetSalary)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Employees</span>
                    <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                      {run.employeeCount} Staff Members
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div><strong>Prepared by:</strong> {run.preparedByName}</div>
                  {run.approvedByName && (
                    <div className="text-emerald-600 dark:text-emerald-400">
                      <strong>Approved by:</strong> {run.approvedByName}
                    </div>
                  )}
                </div>

                {run.status === 'PREPARED' && (
                  <div className="pt-2">
                    {isSuperAdmin ? (
                      <button
                        onClick={() => handleSuperAdminApprove(run.id)}
                        disabled={isApproving}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {isApproving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>{isApproving ? 'Authorizing Payroll...' : 'Grant Final Super Admin Approval'}</span>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 text-center font-medium">
                        Awaiting final approval by Super Admin.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: EMPLOYEE STATEMENTS */}
      {/* ==================================================================== */}
      {activeTab === 'employee_statements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">
              Showing itemized statements for October 2026 (Audit Preview)
            </span>
          </div>

          <div className="space-y-3">
            {statements.map((stmt) => (
              <div
                key={stmt.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{stmt.employeeName}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {stmt.employeeRole}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Present: {stmt.presentDays} days • Overtime: {stmt.eligibleOvertimeHours}h ({formatINR(stmt.eligibleOvertimePay)})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Net Pay</span>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {formatINR(stmt.netPayableSalary)}
                      </div>
                    </div>
                    <button
                      onClick={() => setInspectingStatement(stmt)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Audit Breakdown</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: POLICY GOVERNANCE (Approved Master Formula - Part 12) */}
      {/* ==================================================================== */}
      {activeTab === 'policy_governance' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-extrabold">Authoritative Master Payroll Formula &amp; Governance Rules</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configured and active per explicit Diagnostic Services Master Rules (Part 12). Dual-control Maker/Checker safeguards ensure all payroll calculations require Super Admin review and final authorization before release.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100">Monthly Working Days Divisor</span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">26 Paid Days per Month (Standard Base Divisor)</p>
              <p className="text-[10px] text-slate-500">Daily Salary = Monthly Base / 26</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100">Daily &amp; Hourly Salary Rates</span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">8 Paid Working Hours per Day (09:30 – 18:00)</p>
              <p className="text-[10px] text-slate-500">Hourly Rate = Daily / 8 • Per-Minute Rate = Hourly / 60</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100">Late Arrival &amp; Half-Day Rules</span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">15m Grace (09:45 Cutoff) • Minute-Based Deduction</p>
              <p className="text-[10px] text-slate-500">&gt;1h Late (after 10:30) = Half-Day Deduction • &gt;10 Late Days/Month = +Half-Day penalty</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100">Lunch &amp; Maker/Checker Dual Control</span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">Mandatory 40m Lunch • Super Admin Sign-off Required</p>
              <p className="text-[10px] text-slate-500">Back Office prepares draft → Super Admin approves and releases statements</p>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Statement Audit Drawer */}
      {inspectingStatement && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Itemized Salary Statement Audit
                </h3>
                <p className="text-xs text-slate-500">{inspectingStatement.employeeName} • {inspectingStatement.payrollMonth}</p>
              </div>
              <button
                onClick={() => setInspectingStatement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-600 dark:text-slate-400">Base Monthly Salary:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{formatINR(inspectingStatement.baseMonthlySalary)}</span>
              </div>

              {/* Additions */}
              <div className="space-y-1">
                <span className="font-extrabold text-emerald-600 uppercase text-[10px] tracking-wide">Approved Additions & Incentives:</span>
                {inspectingStatement.itemizedAdditions.map((add, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-slate-700 dark:text-slate-300">
                    <span>{add.label}</span>
                    <span className="font-bold text-emerald-600">+{formatINR(add.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <div className="space-y-1">
                <span className="font-extrabold text-rose-600 uppercase text-[10px] tracking-wide">Itemized Deductions:</span>
                {inspectingStatement.itemizedDeductions.map((ded, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-slate-700 dark:text-slate-300">
                    <span>{ded.label}</span>
                    <span className="font-bold text-rose-600">-{formatINR(ded.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-2.5 border-t-2 border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-slate-100">
                <span>Final Net Payable:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatINR(inspectingStatement.netPayableSalary)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setInspectingStatement(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
