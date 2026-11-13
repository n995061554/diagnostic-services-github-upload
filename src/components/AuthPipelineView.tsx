import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  User, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowDown, 
  ArrowRight, 
  RefreshCw, 
  Terminal, 
  Smartphone, 
  LayoutDashboard, 
  Sliders, 
  Database, 
  Building2, 
  Eye, 
  Fingerprint, 
  FileCode2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
  SlidersHorizontal,
  Clock,
  Briefcase
} from 'lucide-react';
import { UserRoleType, User as UserType } from '../types';

interface PipelineStage {
  stage: number;
  name: string;
  title: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED_DUE_TO_BLOCK' | 'RENDERED_SUCCESSFULLY' | 'BLOCKED_UI_SHOWN';
  evaluationTimeMs: number;
  details: Record<string, any>;
  auditLog: string;
}

interface PipelineEvaluationResult {
  statusCode: number;
  evaluatedUser: {
    id: string;
    email: string;
    name: string;
    role: UserRoleType;
    status: string;
    dataScope: string;
    organization: string;
  };
  pipelineSummary: {
    totalStages: number;
    passedStages: number;
    overallStatus: 'AUTHORIZED_AND_RENDERED' | 'ACCESS_DENIED';
    totalEvaluationTimeMs: number;
  };
  stages: PipelineStage[];
}

interface AuthPipelineViewProps {
  currentUser: UserType | null;
  currentRole: UserRoleType;
  token: string | null;
  onNavigateTab?: (tab: string) => void;
}

export const AuthPipelineView: React.FC<AuthPipelineViewProps> = ({
  currentUser,
  currentRole,
  token,
  onNavigateTab,
}) => {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('admin@a2zdiagnostic.com');
  const [providedPassword, setProvidedPassword] = useState<string>('');
  const [simulateRoleOverride, setSimulateRoleOverride] = useState<string>('');
  const [simulateStatusOverride, setSimulateStatusOverride] = useState<string>('');
  const [simulateScopeOverride, setSimulateScopeOverride] = useState<string>('');
  const [simulate2faOverride, setSimulate2faOverride] = useState<boolean | null>(null);
  const [simulateFailedAttempts, setSimulateFailedAttempts] = useState<number>(0);
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<PipelineEvaluationResult | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(1);
  const [viewMode, setViewMode] = useState<'pipeline_visualizer' | 'stage_cards' | 'json_audit'>('pipeline_visualizer');

  // Preset scenarios
  const PRESET_SCENARIOS = [
    {
      label: '1. Super Admin (Executive & Zero-Trust)',
      email: 'admin@a2zdiagnostic.com',
      password: '',
      role: '',
      status: '',
      scope: '',
      failedAttempts: 0,
      badge: 'Tier 1 Global Scope',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    {
      label: '2. Field Sales Rep (Regional Western Scope)',
      email: 'sales.rep@a2zdiagnostic.com',
      password: '',
      role: '',
      status: '',
      scope: '',
      failedAttempts: 0,
      badge: 'Tier 3 Assigned / Region',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      label: '3. Biomedical Service Engineer (Assigned Scope)',
      email: 'service.eng@a2zdiagnostic.com',
      password: '',
      role: '',
      status: '',
      scope: '',
      failedAttempts: 0,
      badge: 'Tier 3 Work Orders',
      badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    },
    {
      label: '4. Clinical Lab Customer (Metropolis - Own Scope)',
      email: 'lab.director@metropolisdiag.com',
      password: '',
      role: '',
      status: '',
      scope: '',
      failedAttempts: 0,
      badge: 'Tier 4 Own Lab Scope',
      badgeColor: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40'
    },
    {
      label: '5. Wholesale Distributor (Gujarat Diag - Own Scope)',
      email: 'distributor@biomeddist.com',
      password: '',
      role: '',
      status: '',
      scope: '',
      failedAttempts: 0,
      badge: 'Tier 4 Channel Partner',
      badgeColor: 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40'
    },
    {
      label: '⚠️ EDGE CASE: Locked Account (5 Failed Attempts)',
      email: 'admin@a2zdiagnostic.com',
      password: 'SimulatedMismatchPass#1',
      role: '',
      status: 'LOCKED',
      scope: '',
      failedAttempts: 5,
      badge: 'Blocked at Stage 3',
      badgeColor: 'bg-red-100 text-red-800 border-red-200'
    },
    {
      label: '⚠️ EDGE CASE: Suspended by Compliance',
      email: 'sales.rep@a2zdiagnostic.com',
      password: '',
      role: '',
      status: 'SUSPENDED',
      scope: '',
      failedAttempts: 0,
      badge: 'Blocked at Stage 3',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      label: '⚠️ EDGE CASE: Incorrect Password Challenge',
      email: 'admin@a2zdiagnostic.com',
      password: 'InvalidPass_Test',
      role: '',
      status: '',
      scope: '',
      failedAttempts: 1,
      badge: 'Fails at Stage 2',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    }
  ];

  const runPipelineEvaluation = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/v1/auth/pipeline/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: selectedUserEmail,
          providedPassword: providedPassword,
          simulateRole: simulateRoleOverride || undefined,
          simulateStatus: simulateStatusOverride || undefined,
          simulateScope: simulateScopeOverride || undefined,
          simulate2faEnabled: simulate2faOverride !== null ? simulate2faOverride : undefined,
          simulateFailedAttempts: simulateFailedAttempts,
          simulatedDevice: 'macOS Sonoma Chrome 122.0 (TLS 1.3 Strict Encrypted Transport)'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluationResult(data);
      }
    } catch (err) {
      console.error('Failed to run auth pipeline evaluation', err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runPipelineEvaluation();
  }, [selectedUserEmail, providedPassword, simulateRoleOverride, simulateStatusOverride, simulateScopeOverride, simulateFailedAttempts]);

  const applyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedUserEmail(preset.email);
    setProvidedPassword(preset.password);
    setSimulateRoleOverride(preset.role);
    setSimulateStatusOverride(preset.status);
    setSimulateScopeOverride(preset.scope);
    setSimulateFailedAttempts(preset.failedAttempts);
    setSimulate2faOverride(null);
  };

  const getStageIcon = (stageNum: number) => {
    switch (stageNum) {
      case 1: return <User className="w-5 h-5" />;
      case 2: return <Lock className="w-5 h-5" />;
      case 3: return <Shield className="w-5 h-5" />;
      case 4: return <Briefcase className="w-5 h-5" />;
      case 5: return <Key className="w-5 h-5" />;
      case 6: return <Database className="w-5 h-5" />;
      case 7: return <LayoutDashboard className="w-5 h-5" />;
      default: return <ShieldCheck className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: PipelineStage['status']) => {
    switch (status) {
      case 'PASSED':
      case 'RENDERED_SUCCESSFULLY':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Passed</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Failed</span>
          </span>
        );
      case 'BLOCKED':
      case 'BLOCKED_UI_SHOWN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Access Blocked</span>
          </span>
        );
      case 'SKIPPED_DUE_TO_BLOCK':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <span>Skipped</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#22381E] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#1E331B] rounded flex items-center justify-center text-xs font-bold">14a</span>
              <span>Zero-Trust Enterprise Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>7-Stage Authentication & RBAC Data-Scope Pipeline</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-3xl">
              Deterministic, zero-trust cryptographic ingress & authorization evaluation sequence. Evaluates identity, password hashes, lifecycle states, roles, fine-grained capability matrices, and row-level data scoping before compiling personalized dashboards.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={runPipelineEvaluation}
              disabled={isRunning}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Re-Evaluate Pipeline</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('pipeline_visualizer')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
                viewMode === 'pipeline_visualizer' ? 'bg-white text-[#1E331B] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interactive Pipeline Visualizer
            </button>
            <button
              onClick={() => setViewMode('stage_cards')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
                viewMode === 'stage_cards' ? 'bg-white text-[#1E331B] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Detailed Stage Breakdown
            </button>
            <button
              onClick={() => setViewMode('json_audit')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-all ${
                viewMode === 'json_audit' ? 'bg-white text-[#1E331B] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SIEM Execution Log Stream
            </button>
          </div>

          {evaluationResult && (
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Pipeline Ingress:</span>
                <span className={`font-bold px-2 py-0.5 rounded-md ${
                  evaluationResult.pipelineSummary.overallStatus === 'AUTHORIZED_AND_RENDERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {evaluationResult.pipelineSummary.overallStatus === 'AUTHORIZED_AND_RENDERED' ? 'AUTHORIZED & RENDERED' : 'ACCESS FORBIDDEN'}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{evaluationResult.pipelineSummary.totalEvaluationTimeMs} ms total</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preset Scenarios & Interactive Simulation Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Interactive Persona & Edge Case Presets</span>
          </div>
          <span className="text-[11px] text-slate-500">Click any preset to test the 7-stage evaluation pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className={`p-3 text-left rounded-lg border transition-all text-xs cursor-pointer flex flex-col justify-between ${
                selectedUserEmail === preset.email && (preset.status === '' || simulateStatusOverride === preset.status)
                  ? 'border-[#22381E] bg-[#E4F1DC]/50 shadow-xs ring-1 ring-[#22381E]'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900 leading-snug">{preset.label}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">{preset.email}</div>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                  {preset.badge}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Fine-Tuning Simulation Controls (Collapsible) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Persona / Email</label>
            <input
              type="text"
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#22381E] focus:border-[#22381E] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Provided Password</label>
            <input
              type="password"
              value={providedPassword}
              onChange={(e) => setProvidedPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#22381E] focus:border-[#22381E] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Override Lifecycle Status</label>
            <select
              value={simulateStatusOverride}
              onChange={(e) => setSimulateStatusOverride(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#22381E] focus:border-[#22381E]"
            >
              <option value="">Default (From Database)</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="PENDING_ACTIVATION">PENDING_ACTIVATION</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
              <option value="LOCKED">LOCKED (Exceeded Attempts)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Override Data Scope</label>
            <select
              value={simulateScopeOverride}
              onChange={(e) => setSimulateScopeOverride(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-[#22381E] focus:border-[#22381E]"
            >
              <option value="">Default (From Role/User)</option>
              <option value="ALL">ALL (Global Organization)</option>
              <option value="REGION">REGION (Territory Scope)</option>
              <option value="BRANCH">BRANCH (Warehouse / Office)</option>
              <option value="ASSIGNED">ASSIGNED (Direct Work Orders)</option>
              <option value="OWN">OWN (Self-Authored / Customer)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Mode 1: Interactive Pipeline Visualizer */}
      {viewMode === 'pipeline_visualizer' && evaluationResult && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <div className="text-[11px] font-bold text-[#D2E7C4] uppercase tracking-wider">LIVE INGRESS EVALUATION PIPELINE</div>
                <h3 className="text-lg font-bold text-white mt-0.5 flex items-center space-x-2">
                  <span>{evaluationResult.evaluatedUser.name}</span>
                  <span className="text-slate-400 font-normal text-sm">({evaluationResult.evaluatedUser.email})</span>
                </h3>
                <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{evaluationResult.evaluatedUser.organization}</span>
                  <span>•</span>
                  <span className="font-mono text-[#D2E7C4]">{evaluationResult.evaluatedUser.role}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Pipeline Execution</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {evaluationResult.pipelineSummary.passedStages} / {evaluationResult.pipelineSummary.totalStages} Stages Passed
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border ${
                  evaluationResult.pipelineSummary.overallStatus === 'AUTHORIZED_AND_RENDERED'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-500/20 border-red-500/40 text-red-400'
                }`}>
                  {evaluationResult.pipelineSummary.overallStatus === 'AUTHORIZED_AND_RENDERED' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
              </div>
            </div>

            {/* Vertical Interactive 7-Step Sequence */}
            <div className="py-6 space-y-4">
              {evaluationResult.stages.map((stage, idx) => {
                const isPassed = stage.status === 'PASSED' || stage.status === 'RENDERED_SUCCESSFULLY';
                const isBlocked = stage.status === 'BLOCKED' || stage.status === 'BLOCKED_UI_SHOWN' || stage.status === 'FAILED';
                const isExpanded = expandedStage === stage.stage;

                return (
                  <div key={stage.stage} className="relative">
                    {/* Connecting line between stages */}
                    {idx < evaluationResult.stages.length - 1 && (
                      <div className={`absolute left-6 top-12 bottom-0 w-0.5 -mb-4 z-0 ${
                        isPassed ? 'bg-emerald-500/40' : 'bg-slate-700'
                      }`} />
                    )}

                    <div 
                      onClick={() => setExpandedStage(isExpanded ? null : stage.stage)}
                      className={`relative z-10 p-4 rounded-xl border transition-all cursor-pointer ${
                        isExpanded
                          ? 'bg-slate-800/90 border-[#D2E7C4] shadow-md ring-1 ring-[#D2E7C4]/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                            isPassed
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                              : isBlocked
                              ? 'bg-red-500/20 border-red-500/40 text-red-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {stage.stage}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-white">
                                {stage.name}
                              </span>
                              <span className="text-slate-400 text-xs hidden sm:inline">—</span>
                              <span className="text-slate-300 text-xs hidden sm:inline">{stage.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate max-w-xl">
                              {stage.auditLog}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-slate-400 font-mono">{stage.evaluationTimeMs} ms</span>
                          </div>
                          {getStatusBadge(stage.status)}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded In-Depth Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                            <div className="font-semibold text-[#D2E7C4] text-[11px] uppercase tracking-wider">
                              Stage Details & Parameters
                            </div>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px] text-slate-300">
                              {Object.entries(stage.details).map(([k, v]) => (
                                <div key={k} className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-800/60 pb-1">
                                  <span className="text-slate-400">{k}:</span>
                                  <span className="text-emerald-300 text-right truncate max-w-xs">
                                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="font-semibold text-[#D2E7C4] text-[11px] uppercase tracking-wider">
                              Zero-Trust Policy & Audit Assertion
                            </div>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300 text-xs leading-relaxed space-y-2">
                              <p>
                                🛡️ <strong>Assertion:</strong> {stage.auditLog}
                              </p>
                              {stage.stage === 7 && isPassed && onNavigateTab && (
                                <div className="pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onNavigateTab(stage.details.landingTab || 'dashboard');
                                    }}
                                    className="px-3 py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded font-semibold text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                                  >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span>Launch Rendered Dashboard ({stage.details.landingTab})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Mode 2: Detailed Stage Breakdown Grid */}
      {viewMode === 'stage_cards' && evaluationResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {evaluationResult.stages.map((stage) => {
            const isPassed = stage.status === 'PASSED' || stage.status === 'RENDERED_SUCCESSFULLY';
            return (
              <div 
                key={stage.stage}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#D2E7C4] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-[#D2E7C4] text-[#1E331B] rounded-lg border border-[#5F8F4D]/40">
                        {getStageIcon(stage.stage)}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STAGE 0{stage.stage}</div>
                        <div className="font-bold text-slate-900 text-sm">{stage.name}</div>
                      </div>
                    </div>
                    {getStatusBadge(stage.status)}
                  </div>

                  <p className="text-xs text-slate-600 font-medium mb-3">{stage.title}</p>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
                    {Object.entries(stage.details).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{k}:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono truncate">
                  ⚡ Evaluated in {stage.evaluationTimeMs}ms
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Mode 3: JSON Audit Stream */}
      {viewMode === 'json_audit' && evaluationResult && (
        <div className="bg-slate-950 text-emerald-400 p-5 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
          <div className="text-slate-400 text-xs pb-3 mb-3 border-b border-slate-800 flex items-center justify-between">
            <span>// SIEM PIPELINE JSON LOG STREAM - DETERMINISTIC ZERO-TRUST EVALUATION REPORT</span>
            <span>TOTAL TIME: {evaluationResult.pipelineSummary.totalEvaluationTimeMs} ms</span>
          </div>
          <pre>{JSON.stringify(evaluationResult, null, 2)}</pre>
        </div>
      )}

      {/* Technical Summary Reference Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#22381E]" />
          <span>7-Stage Pipeline Enterprise Architecture Specifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">1. Unique User</div>
            <p className="text-slate-600 text-[11px] mt-1">Single persona identity disambiguation; eliminates shared credentials.</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">2. Secure Login</div>
            <p className="text-slate-600 text-[11px] mt-1">Bcrypt hash verification, optional TOTP 2FA, JWT token family issuance.</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">3. Status Check</div>
            <p className="text-slate-600 text-[11px] mt-1">State machine check (ACTIVE only; blocks USER_CREATED, SUSPENDED, LOCKED).</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">4. Role Check</div>
            <p className="text-slate-600 text-[11px] mt-1">Role tier hierarchy mapping & route guard evaluation (@Roles).</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">5. Permissions</div>
            <p className="text-slate-600 text-[11px] mt-1">Granular capability matrix evaluation directly from JWT claim payload.</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">6. Data-Scope</div>
            <p className="text-slate-600 text-[11px] mt-1">Row-Level Security (RLS) filtering: ALL, REGION, BRANCH, ASSIGNED, OWN.</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900">7. Dashboard</div>
            <p className="text-slate-600 text-[11px] mt-1">Dynamic persona workspace compiled with scoped widgets & quick actions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
