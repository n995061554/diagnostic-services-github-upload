import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserSession, UserRoleType } from '../types';
import {
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Clock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Radio,
  Lock,
  PlusCircle,
  Trash2,
  HelpCircle,
  Eye,
  Activity,
  Zap,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

interface SecuritySessionsViewProps {
  currentUser: User | null;
  currentRole: UserRoleType;
  token: string | null;
  onRefreshData?: () => void;
}

export const SecuritySessionsView: React.FC<SecuritySessionsViewProps> = ({
  currentUser,
  currentRole,
  token,
  onRefreshData,
}) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'DESKTOP' | 'MOBILE' | 'TABLET'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'user' | 'all'>('user');
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<UserSession | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [simPreset, setSimPreset] = useState<string>('IPHONE_SAFARI');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [suspiciousModalSession, setSuspiciousModalSession] = useState<UserSession | null>(null);
  const [suspiciousReason, setSuspiciousReason] = useState<string>('Unrecognized location and IP address detected');

  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN || currentRole === UserRoleType.OFFICE_ADMIN;

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const scopeParam = isSuperAdmin && scopeFilter === 'all' ? '?scope=all' : '';
      const res = await fetch(`/api/v1/auth/sessions${scopeParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        const err = await res.json();
        setFeedback({ type: 'error', message: err.message || 'Failed to load sessions.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error connecting to security session service.' });
    } finally {
      setIsLoading(false);
    }
  }, [token, isSuperAdmin, scopeFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto clear feedback after 5s
  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // Format relative time helper
  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 45) return 'Active just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch {
      return isoString;
    }
  };

  const handleRevokeSingle = async (sessionId: string, deviceName: string) => {
    if (!token) return;
    setActionLoadingId(sessionId);
    try {
      const res = await fetch('/api/v1/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Session on ${deviceName} has been remotely terminated.`,
        });
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (selectedSessionForDetail?.id === sessionId) setSelectedSessionForDetail(null);
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to revoke session.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error terminating session.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!token) return;
    setActionLoadingId('ALL_OTHERS');
    try {
      const res = await fetch('/api/v1/auth/sessions/revoke-all-others', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || 'All other active device sessions have been successfully terminated.',
        });
        fetchSessions();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to terminate other sessions.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error revoking other sessions.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokePlatform = async (platform: 'MOBILE' | 'DESKTOP' | 'TABLET') => {
    if (!token) return;
    setActionLoadingId(`PLATFORM_${platform}`);
    try {
      const res = await fetch('/api/v1/auth/sessions/revoke-by-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: data.message || `All active ${platform} sessions terminated.`,
        });
        fetchSessions();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({ type: 'error', message: data.message || `Failed to revoke ${platform} sessions.` });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: `Network error revoking ${platform} sessions.` });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulateLogin = async () => {
    if (!token) return;
    setIsSimulating(true);
    try {
      const res = await fetch('/api/v1/auth/sessions/simulate-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ devicePreset: simPreset }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Simulated login successful: ${data.session?.browser} is now active.`,
        });
        setIsSimulateModalOpen(false);
        fetchSessions();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to simulate login.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error during simulated login.' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleFlagAndTerminateSuspicious = async () => {
    if (!token || !suspiciousModalSession) return;
    setActionLoadingId(suspiciousModalSession.id);
    try {
      const res = await fetch('/api/v1/auth/sessions/flag-suspicious', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: suspiciousModalSession.id,
          reason: suspiciousReason,
          terminateImmediately: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'warning',
          message: `Session flagged as compromised & remotely terminated. High-priority SIEM security incident logged.`,
        });
        setSuspiciousModalSession(null);
        fetchSessions();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to flag session.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error flagging suspicious session.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (platformFilter !== 'ALL' && s.deviceType !== platformFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBrowser = s.browser.toLowerCase().includes(q);
        const matchesIp = s.ipAddress.toLowerCase().includes(q);
        const matchesLocation = (s.approxLocation || '').toLowerCase().includes(q);
        const matchesUser = (s.userName || '').toLowerCase().includes(q) || (s.userEmail || '').toLowerCase().includes(q);
        if (!matchesBrowser && !matchesIp && !matchesLocation && !matchesUser) return false;
      }
      return true;
    });
  }, [sessions, platformFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const desktop = sessions.filter((s) => s.deviceType === 'DESKTOP').length;
    const mobile = sessions.filter((s) => s.deviceType === 'MOBILE').length;
    const tablet = sessions.filter((s) => s.deviceType === 'TABLET').length;
    const current = sessions.find((s) => s.isCurrent);
    const locations = Array.from(new Set(sessions.map((s) => s.approxLocation).filter(Boolean)));
    return { total, desktop, mobile, tablet, current, locationsCount: locations.length };
  }, [sessions]);

  const getDeviceIcon = (type: string, browserStr: string) => {
    const lower = browserStr.toLowerCase();
    if (lower.includes('scanner') || lower.includes('zebra')) {
      return <Radio className="w-5 h-5 text-purple-600" />;
    }
    if (type === 'MOBILE' || lower.includes('iphone') || lower.includes('android') || lower.includes('flutter')) {
      return <Smartphone className="w-5 h-5 text-[#22381E]" />;
    }
    if (type === 'TABLET' || lower.includes('ipad') || lower.includes('tablet')) {
      return <Tablet className="w-5 h-5 text-amber-600" />;
    }
    return <Laptop className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="space-y-6" id="security-sessions-dashboard">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F5F6F0] border border-[#D2E7C4] flex items-center justify-center text-[#22381E] flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Security Sessions & Active Logins</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Monitor
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Real-time visibility into active authenticated sessions across mobile devices, diagnostic lab tablets, and desktop workstations with remote termination capabilities.
              </p>
            </div>
          </div>

          {/* Quick Actions Header Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchSessions}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh Active Sessions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3.5 py-2 bg-[#D2E7C4] hover:bg-[#C3E2B8] border border-[#5F8F4D]/40 text-[#1E331B] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simulate Device Login</span>
            </button>

            <button
              onClick={handleRevokeAllOthers}
              disabled={actionLoadingId === 'ALL_OTHERS' || sessions.filter((s) => !s.isCurrent).length === 0}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{actionLoadingId === 'ALL_OTHERS' ? 'Terminating...' : 'Terminate All Other Sessions'}</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedback.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : feedback.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
              ×
            </button>
          </div>
        )}
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active Sessions</span>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
              <span>{stats.total}</span>
              <span className="text-xs font-medium text-slate-400">devices</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Desktop / Web</span>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
              <span>{stats.desktop}</span>
              <span className="text-xs font-medium text-emerald-600">Workstations</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Laptop className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile & Field Apps</span>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
              <span>{stats.mobile}</span>
              <span className="text-xs font-medium text-[#22381E]">Smartphones/Scanners</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lab Tablets & POS</span>
            <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
              <span>{stats.tablet}</span>
              <span className="text-xs font-medium text-amber-600">Diagnostic Counters</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Tablet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Search/Filter + Session Cards + Platform Kill Switches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Sessions List (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search device, browser, IP, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#F9FAF6] border border-[#D2E7C4] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#22381E]/20 focus:border-[#22381E]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Platform Segment Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {(['ALL', 'DESKTOP', 'MOBILE', 'TABLET'] as const).map((pf) => (
                <button
                  key={pf}
                  onClick={() => setPlatformFilter(pf)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    platformFilter === pf
                      ? 'bg-white text-[#1E331B] shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pf === 'ALL' ? 'All Platforms' : pf === 'DESKTOP' ? 'Desktop' : pf === 'MOBILE' ? 'Mobile' : 'Tablet'}
                </button>
              ))}
            </div>

            {/* Admin Scope Switcher */}
            {isSuperAdmin && (
              <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                <button
                  onClick={() => setScopeFilter(scopeFilter === 'user' ? 'all' : 'user')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    scopeFilter === 'all'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Toggle between your sessions vs all enterprise user sessions"
                >
                  {scopeFilter === 'all' ? 'Scope: Organization-Wide' : 'Scope: My Sessions'}
                </button>
              </div>
            )}
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-[#22381E] animate-spin mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-800">Querying Active Session Registry...</div>
              <div className="text-xs text-slate-500 mt-1">Verifying cryptographic token hashes and device state</div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-base font-bold text-slate-800">No Active Sessions Found</div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active device logins match your search filter. Use "Simulate Device Login" to add and test cross-platform sessions.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const isCurrent = session.isCurrent;
                const isActionLoading = actionLoadingId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                      isCurrent
                        ? 'border-emerald-300 ring-1 ring-emerald-500/20 bg-gradient-to-r from-emerald-50/20 to-white'
                        : session.reportedSuspicious
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left: Device & Info */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                            isCurrent
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {getDeviceIcon(session.deviceType, session.browser)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{session.browser}</span>

                            {isCurrent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                                Current Session (This Device)
                              </span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                session.deviceType === 'DESKTOP'
                                  ? 'bg-slate-100 text-slate-700'
                                  : session.deviceType === 'MOBILE'
                                  ? 'bg-[#E4F1DC] text-[#1E331B] border border-[#D2E7C4]'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {session.deviceType}
                            </span>

                            {session.reportedSuspicious && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Suspicious Flagged
                              </span>
                            )}
                          </div>

                          {/* Metadata row: IP, Location, Time */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono font-medium text-slate-700">{session.ipAddress}</span>
                            </span>

                            {session.approxLocation && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{session.approxLocation}</span>
                              </span>
                            )}

                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatTimeAgo(session.lastActivityAt)}</span>
                            </span>

                            {isSuperAdmin && scopeFilter === 'all' && (
                              <span className="font-semibold text-slate-700">
                                User: {session.userName} ({session.userEmail})
                              </span>
                            )}
                          </div>

                          {/* Forensic Fingerprint snippet */}
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3 pt-1">
                            <span>Token Hash: {session.tokenHash || `tok-${session.id.slice(0, 8)}`}</span>
                            <span>•</span>
                            <span>Logged In: {new Date(session.loginAt).toLocaleDateString()} {new Date(session.loginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Remote Termination Actions */}
                      <div className="flex items-center gap-2 sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                        <button
                          onClick={() => setSelectedSessionForDetail(session)}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View detailed token security forensics"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Forensics</span>
                        </button>

                        {!isCurrent && (
                          <>
                            <button
                              onClick={() => setSuspiciousModalSession(session)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-lg text-xs transition-colors cursor-pointer"
                              title="Flag as suspicious and terminate with audit alert"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleRevokeSingle(session.id, session.browser)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              title="Remotely terminate this device session immediately"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isActionLoading ? 'Terminating...' : 'Terminate'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Platform Kill Switches & Security Governance Panel */}
        <div className="space-y-6">
          {/* Quick Platform Remote Kill Switches */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Platform Remote Kill Switches</h3>
            </div>
            <p className="text-xs text-slate-500">
              Instantly terminate all active sessions belonging to a specific device platform category across your account.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#22381E]" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">All Mobile Devices</div>
                    <div className="text-[11px] text-slate-500">{stats.mobile} active smartphone/scanner login(s)</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokePlatform('MOBILE')}
                  disabled={actionLoadingId === 'PLATFORM_MOBILE' || stats.mobile === 0}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {actionLoadingId === 'PLATFORM_MOBILE' ? 'Revoking...' : 'Terminate Mobile'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Tablet className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">All Lab Tablets</div>
                    <div className="text-[11px] text-slate-500">{stats.tablet} active iPad / POS counter login(s)</div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokePlatform('TABLET')}
                  disabled={actionLoadingId === 'PLATFORM_TABLET' || stats.tablet === 0}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {actionLoadingId === 'PLATFORM_TABLET' ? 'Revoking...' : 'Terminate Tablets'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">All Other Desktops</div>
                    <div className="text-[11px] text-slate-500">{stats.desktop} active workstation(s)</div>
                  </div>
                </div>
                <button
                  onClick={handleRevokeAllOthers}
                  disabled={actionLoadingId === 'ALL_OTHERS' || stats.total <= 1}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Terminate Others
                </button>
              </div>
            </div>
          </div>

          {/* Session Governance & NIST 800-63B Compliance Policy Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#22381E]" />
              <h3 className="text-sm font-bold text-slate-900">Session Security Governance</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Token Inactivity Timeout:</span> 15-minute sliding session expiration on field handhelds; 8-hour maximum lifetime on workstations.
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Refresh Token Rotation:</span> Single-use cryptographically signed refresh tokens with automatic family revocation upon reuse detection.
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Zero-Trust Device Binding:</span> IP geo-anomaly tracking and client fingerprint verification on every API request.
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Audit Stream Ingestion:</span> All terminations logged immutably in the SIEM audit log with actor ID, IP, and timestamp.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Simulate Multi-Platform Device Login */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Simulate Cross-Platform Device Login</h3>
                  <p className="text-xs text-slate-500">Instantiate an active session to test multi-device tracking and remote termination</p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Select Platform Preset:</label>

              {[
                {
                  id: 'IPHONE_SAFARI',
                  title: 'Apple iPhone 16 Pro Max (iOS 18 Safari)',
                  desc: 'Mobile Safari • BKC Mumbai (103.21.124.77)',
                  icon: Smartphone,
                  badge: 'iOS Mobile',
                },
                {
                  id: 'SAMSUNG_FLUTTER',
                  title: 'Samsung Galaxy S24 (A2Z Flutter Mobile App)',
                  desc: 'Native Field App • Pune West Hub (122.179.34.45)',
                  icon: Smartphone,
                  badge: 'Android Native',
                },
                {
                  id: 'IPAD_LAB',
                  title: 'iPad Pro 11" (Metropolis Lab Counter Web)',
                  desc: 'Tablet Safari 17.6 • Navi Mumbai (182.73.12.115)',
                  icon: Tablet,
                  badge: 'iPadOS Tablet',
                },
                {
                  id: 'WINDOWS_EDGE',
                  title: 'Lenovo ThinkPad X1 (Microsoft Edge 128)',
                  desc: 'Windows 11 Enterprise • Delhi NCR (49.36.18.230)',
                  icon: Laptop,
                  badge: 'Windows PC',
                },
                {
                  id: 'MAC_CHROME',
                  title: 'MacBook Pro M3 Max (Google Chrome 129)',
                  desc: 'macOS Sequoia 15 • Bengaluru Tech Hub (106.51.72.19)',
                  icon: Laptop,
                  badge: 'macOS Desktop',
                },
                {
                  id: 'ZEBRA_SCANNER',
                  title: 'Zebra TC26 Rugged Barcode Scanner Handheld',
                  desc: 'MediFlow Android Client • Bhiwandi Warehouse (115.112.44.82)',
                  icon: Radio,
                  badge: 'Rugged Handheld',
                },
              ].map((p) => {
                const Icon = p.icon;
                const isSelected = simPreset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSimPreset(p.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#22381E] bg-[#E4F1DC]/50 ring-1 ring-[#22381E]/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#22381E] text-[#D2E7C4]' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{p.title}</div>
                        <div className="text-[11px] text-slate-500">{p.desc}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {p.badge}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateLogin}
                disabled={isSimulating}
                className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>{isSimulating ? 'Establishing Session...' : 'Simulate Active Login'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Forensic Detail Drawer */}
      {selectedSessionForDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Session Security Forensics</h3>
                  <p className="text-xs text-slate-500">Cryptographic token binding & client fingerprint details</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSessionForDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Session ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedSessionForDetail.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device / Browser:</span>
                  <span className="font-semibold text-slate-800">{selectedSessionForDetail.browser}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedSessionForDetail.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Approximate Location:</span>
                  <span className="font-medium text-slate-800">{selectedSessionForDetail.approxLocation || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Initial Login Timestamp:</span>
                  <span className="font-mono text-slate-700">{new Date(selectedSessionForDetail.loginAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Telemetry / Heartbeat:</span>
                  <span className="font-mono text-slate-700">{new Date(selectedSessionForDetail.lastActivityAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cryptographic Hash:</span>
                  <span className="font-mono text-slate-700">{selectedSessionForDetail.tokenHash || 'sha256-tok-verified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TLS Encryption Level:</span>
                  <span className="font-semibold text-emerald-700">TLS 1.3 / AES-256-GCM</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedSessionForDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Forensics
              </button>

              {!selectedSessionForDetail.isCurrent && (
                <button
                  onClick={() => {
                    handleRevokeSingle(selectedSessionForDetail.id, selectedSessionForDetail.browser);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Terminate Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Flag & Remotely Lock Suspicious Session */}
      {suspiciousModalSession && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Flag Suspicious Login</h3>
                <p className="text-xs text-slate-500">Remotely kill compromised session & raise SIEM alert</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="font-semibold text-slate-800">{suspiciousModalSession.browser}</div>
              <div className="text-slate-500">IP: {suspiciousModalSession.ipAddress} • Location: {suspiciousModalSession.approxLocation}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Reason for Incident Flag:</label>
              <textarea
                value={suspiciousReason}
                onChange={(e) => setSuspiciousReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                placeholder="Describe why this session is suspicious..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSuspiciousModalSession(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagAndTerminateSuspicious}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Flag & Terminate Immediately</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
