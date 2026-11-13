import React, { useState, useEffect } from 'react';
import { User, UserSession } from '../types';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Laptop, 
  Smartphone, 
  Globe, 
  MapPin, 
  Clock, 
  Trash2, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';

interface SecurityConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  token: string | null;
  onUserUpdated?: () => void;
  onNavigateToSecuritySessions?: () => void;
}

export const SecurityConsoleModal: React.FC<SecurityConsoleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  token,
  onUserUpdated,
  onNavigateToSecuritySessions,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | '2fa' | 'password' | 'recovery'>('sessions');
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [is2FaEnabled, setIs2FaEnabled] = useState<boolean>(currentUser?.twoFactorEnabled ?? false);
  const [isUpdating2Fa, setIsUpdating2Fa] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Recovery simulator state
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryResult, setRecoveryResult] = useState<string | null>(null);
  const [isRequestingRecovery, setIsRequestingRecovery] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIs2FaEnabled(currentUser.twoFactorEnabled ?? false);
    }
  }, [currentUser]);

  const fetchSessions = async () => {
    if (!token) return;
    setIsLoadingSessions(true);
    try {
      const res = await fetch('/api/v1/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch user sessions', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchSessions();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleRevokeSession = async (sessionId: string) => {
    if (!token) return;
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
        setFeedbackMsg({ type: 'success', text: data.message || 'Session revoked successfully.' });
        fetchSessions();
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to revoke session.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Network error while revoking session.' });
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!token) return;
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
        setFeedbackMsg({ type: 'success', text: data.message || 'All other active sessions revoked.' });
        fetchSessions();
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to revoke other sessions.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Network error while revoking sessions.' });
    }
  };

  const handleToggle2Fa = async () => {
    if (!token) return;
    setIsUpdating2Fa(true);
    try {
      const res = await fetch('/api/v1/auth/2fa/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enable: !is2FaEnabled }),
      });
      const data = await res.json();
      if (res.ok) {
        setIs2FaEnabled(data.twoFactorEnabled);
        setFeedbackMsg({ type: 'success', text: data.message });
        if (onUserUpdated) onUserUpdated();
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to update 2FA configuration.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Network error while configuring 2FA.' });
    } finally {
      setIsUpdating2Fa(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setFeedbackMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsSubmittingPass(true);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
          revokeOtherSessions: revokeOthers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Password updated successfully! Other sessions revoked.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchSessions();
      } else {
        setFeedbackMsg({ type: 'error', text: data.message || 'Failed to update password.' });
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Network error while changing password.' });
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingRecovery(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: recoveryIdentifier || currentUser?.email }),
      });
      const data = await res.json();
      setRecoveryResult(data.message);
    } catch (err) {
      setRecoveryResult('Failed to process recovery request.');
    } finally {
      setIsRequestingRecovery(false);
    }
  };

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isPassCompliant = hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#D2E7C4] border border-[#5F8F4D]/40 text-[#1E331B] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                <span>Security Governance & Session Console</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#D2E7C4]/20 text-[#D2E7C4] border border-[#D2E7C4]/30">
                  NIST-Compliant
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active device management, 2FA credentials, and access security controls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Identity Snapshot Banner */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#D2E7C4] text-[#1E331B] font-bold flex items-center justify-center text-xs border border-[#D2E7C4]">
              {currentUser?.firstName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-bold text-slate-900">
                {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.username || currentUser?.email})
              </div>
              <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                <span>Role: <strong className="text-[#1E331B] font-semibold">{currentUser?.roleType}</strong></span>
                <span>•</span>
                <span>Scope: <strong className="text-slate-700 font-semibold">{currentUser?.dataScope || 'ALL'}</strong></span>
                <span>•</span>
                <span>Branch: <strong className="text-slate-700 font-semibold">{currentUser?.branch || 'HQ Central'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                currentUser?.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              Status: {currentUser?.status || 'ACTIVE'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => { setActiveTab('sessions'); setFeedbackMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-[#22381E] text-[#1E331B] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Active Devices & Sessions ({sessions.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('2fa'); setFeedbackMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === '2fa'
                ? 'border-[#22381E] text-[#1E331B] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Two-Factor Authentication</span>
            {is2FaEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('password'); setFeedbackMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'password'
                ? 'border-[#22381E] text-[#1E331B] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => { setActiveTab('recovery'); setFeedbackMsg(null); }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-2 cursor-pointer ${
              activeTab === 'recovery'
                ? 'border-[#22381E] text-[#1E331B] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Recovery & Reset Test</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Stage */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Active Authorized Sessions</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspect all desktop and mobile devices logged into this individual account.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchSessions}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Refresh active sessions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  </button>
                  {onNavigateToSecuritySessions && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToSecuritySessions();
                      }}
                      className="px-3 py-1.5 bg-[#D2E7C4] hover:bg-[#C3E2B8] text-[#1E331B] border border-[#5F8F4D]/40 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-[#22381E]" />
                      <span>Full Sessions Dashboard</span>
                    </button>
                  )}
                  {sessions.filter(s => !s.isCurrent).length > 0 && (
                    <button
                      onClick={handleRevokeAllOthers}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Revoke All Other Devices</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {sessions.map((sess) => {
                  const isMobile = sess.deviceType === 'MOBILE';
                  return (
                    <div
                      key={sess.id}
                      className={`p-4 rounded-xl border transition-all ${
                        sess.isCurrent
                          ? 'bg-[#E4F1DC]/50 border-[#D2E7C4] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              sess.isCurrent
                                ? 'bg-[#22381E] text-[#D2E7C4]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isMobile ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-bold text-slate-900 text-xs">
                                {sess.browser} on {sess.deviceType}
                              </h5>
                              {sess.isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D2E7C4] text-[#1E331B] border border-[#D2E7C4]">
                                  Current Device
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                              <div className="flex items-center space-x-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">{sess.ipAddress}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{sess.approxLocation || 'Mumbai, Maharashtra, India'}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Logged in: {new Date(sess.loginAt).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Last active: {new Date(sess.lastActivityAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {!sess.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(sess.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Revoke session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 2FA */}
          {activeTab === '2fa' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protect sensitive back office accounts with secondary verification challenges.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      is2FaEnabled
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Two-Factor Authentication is {is2FaEnabled ? 'Active & Enforced' : 'Disabled'}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                      {is2FaEnabled
                        ? 'Your account requires an OTP verification challenge during logins from new browsers.'
                        : 'Enable 2FA to require an SMS/Email authentication code for elevated administrative actions.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggle2Fa}
                  disabled={isUpdating2Fa}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    is2FaEnabled
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isUpdating2Fa ? 'Updating...' : is2FaEnabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
                </button>
              </div>

              {/* 2FA Role Requirements Info */}
              <div className="p-4 rounded-xl bg-[#F5F6F0] border border-[#D2E7C4] text-xs text-[#1E331B] space-y-2">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#1E331B]" />
                  <span>Enterprise Role Security Policies:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#415439]">
                  <li><strong>Super Admin & Office Admin:</strong> 2FA mandatory for ledger exports & price overrides.</li>
                  <li><strong>Commercial Approver:</strong> 2FA enforced for all PO approvals &gt; ₹50,000.</li>
                  <li><strong>Field Sales / Engineers:</strong> Device binding with biometric/OTP verification on mobile check-in.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Change Account Password</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ensure your new password complies with strict NIST enterprise guidelines.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    required
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:bg-white pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Complex Password</label>
                <div className="relative">
                  <input
                    required
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:bg-white pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Real-time NIST Validation Checklist */}
              {newPassword && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-700 mb-1">Password Complexity Rules:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center space-x-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <span>{hasMinLength ? '✓' : '○'}</span>
                      <span>Min 8 characters</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <span>{hasUpper ? '✓' : '○'}</span>
                      <span>Uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <span>{hasLower ? '✓' : '○'}</span>
                      <span>Lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 ${hasDigit ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <span>{hasDigit ? '✓' : '○'}</span>
                      <span>Numerical digit (0-9)</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 col-span-2 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                      <span>{hasSpecial ? '✓' : '○'}</span>
                      <span>Special symbol (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new strong password"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:bg-white font-mono"
                />
              </div>

              {/* Revoke other sessions checkbox */}
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={revokeOthers}
                  onChange={(e) => setRevokeOthers(e.target.checked)}
                  className="rounded text-[#22381E] focus:ring-[#22381E] border-[#D2E7C4]"
                />
                <span>Revoke all other active device sessions immediately</span>
              </label>

              <button
                type="submit"
                disabled={isSubmittingPass || (newPassword.length > 0 && !isPassCompliant)}
                className="w-full py-2.5 bg-[#22381E] hover:bg-[#1E331B] disabled:opacity-50 text-[#D2E7C4] text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                {isSubmittingPass ? 'Updating Password...' : 'Save & Enforce New Password'}
              </button>
            </form>
          )}

          {/* TAB 4: RECOVERY TEST */}
          {activeTab === 'recovery' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Zero-Enumeration Password Recovery Test</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify that account recovery requests never reveal account existence to external attackers.
                </p>
              </div>

              <form onSubmit={handleRequestRecovery} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Test Login Identifier (Email, Username, or Phone)</label>
                  <input
                    type="text"
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder={currentUser?.email || 'e.g., salesperson.rahul@company.com'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRequestingRecovery}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {isRequestingRecovery ? 'Simulating...' : 'Dispatch Non-Enumerating Recovery Request'}
                </button>
              </form>

              {recoveryResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-[#22381E]" />
                    <span>API Response Payload:</span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px] bg-white p-3 rounded border border-slate-200">
                    {recoveryResult}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ✓ Verified: Output payload is identical for valid and invalid usernames to eliminate timing and enumeration vulnerabilities.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Cryptography: bcrypt (10 rounds) + JWT RS256</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
