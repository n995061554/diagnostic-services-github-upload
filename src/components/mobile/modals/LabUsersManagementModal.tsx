import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  User,
  KeyRound,
  Eye,
  RefreshCw,
  Clock,
  Lock,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { LabTeamMember, CustomerRole, CustomerAuthSession } from '../customerAppTypes';
import { customerApiService } from '../customerApiService';

export interface LabUsersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: CustomerRole;
  labName: string;
}

export const LabUsersManagementModal: React.FC<LabUsersManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  labName
}) => {
  const [teamMembers, setTeamMembers] = useState<LabTeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite Form State
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'STAFF' | 'VIEWER'>('ADMIN');
  const [inviteAllowOrders, setInviteAllowOrders] = useState(true);
  const [inviteAllowTickets, setInviteAllowTickets] = useState(true);
  const [inviteAllowFinancials, setInviteAllowFinancials] = useState(true);
  const [inviteAllowPayments, setInviteAllowPayments] = useState(false); // Default false for security
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [lastInviteData, setLastInviteData] = useState<{ token: string; debugOtp?: string; email: string } | null>(null);

  // Load team users from backend on open
  useEffect(() => {
    if (!isOpen) return;
    loadUsers();
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await customerApiService.getLabUsers();
      setTeamMembers(data);
    } catch (err) {
      console.warn('Error loading lab users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: LabTeamMember) => {
    if (user.role === 'OWNER') return;
    const newStatus = user.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    try {
      const res = await customerApiService.updateUserStatus(user.id, newStatus);
      if (res.success) {
        setTeamMembers(prev =>
          prev.map(m => (m.id === user.id ? { ...m, status: newStatus } : m))
        );
        setActionMessage({
          type: 'success',
          text: `User ${user.fullName} is now ${newStatus}.`
        });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFullName.trim() || !inviteEmail.trim() || !invitePhone.trim()) {
      setActionMessage({ type: 'error', text: 'All fields are required.' });
      return;
    }

    setIsSubmittingInvite(true);
    setActionMessage(null);

    // Build permissions list
    const permissions: string[] = ['lab:view', 'products:view'];
    if (inviteAllowOrders && inviteRole !== 'VIEWER') permissions.push('orders:create', 'orders:view');
    else permissions.push('orders:view');

    if (inviteAllowTickets && inviteRole !== 'VIEWER') permissions.push('tickets:create', 'applications:create');
    if (inviteAllowFinancials && inviteRole !== 'VIEWER') permissions.push('financials:view');
    if (inviteAllowPayments && inviteRole === 'ADMIN') permissions.push('payments:make');

    try {
      const res = await customerApiService.inviteLabUser({
        fullName: inviteFullName.trim(),
        email: inviteEmail.trim(),
        phoneNumber: invitePhone.trim(),
        role: inviteRole,
        permissions
      });

      if (res.success) {
        setLastInviteData({
          token: res.inviteToken || '',
          debugOtp: res.debugOtp,
          email: inviteEmail.trim()
        });
        setActionMessage({
          type: 'success',
          text: `Invitation sent to ${inviteEmail.trim()}! An activation OTP was generated.`
        });
        setInviteFullName('');
        setInviteEmail('');
        setInvitePhone('');
        setInviteRole('ADMIN');
        setInviteAllowPayments(false);
        setIsInviteOpen(false);
        loadUsers();
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to send invite.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Invitation error.' });
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0E1035] border border-[#2B3D5B] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white font-sans">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#15253F] flex items-center justify-between bg-[#0E1035]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#15253F] border border-[#2B3D5B] flex items-center justify-center text-[#D0DEE5]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Users &amp; Permissions</h3>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Owner Suite
                </span>
              </div>
              <p className="text-[10px] text-[#D0DEE5] truncate max-w-xs">{labName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D0DEE5] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-[#15253F]/90 border-b border-[#2B3D5B]/70 px-5 flex items-start gap-2.5 text-[11px] text-[#D0DEE5]">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>Strict Password Privacy:</strong> Invited team members receive an activation OTP and create their own password securely. Passwords are never visible to Administrators or Owners.
          </div>
        </div>

        {/* Feedback Message */}
        {actionMessage && (
          <div
            className={`p-3 mx-4 mt-3 rounded-2xl flex items-start gap-2 text-xs border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{actionMessage.text}</div>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">&times;</button>
          </div>
        )}

        {/* Simulation Simulation Token Helper */}
        {lastInviteData && (
          <div className="mx-4 mt-2 p-3 bg-amber-500/10 border border-amber-400/40 rounded-2xl text-[11px] text-amber-200">
            <div className="font-bold flex items-center justify-between">
              <span>Simulation Activation Code for {lastInviteData.email}:</span>
              <button onClick={() => setLastInviteData(null)} className="text-amber-400 text-xs font-bold">&times;</button>
            </div>
            <div className="mt-1 font-mono text-xs text-amber-100">
              OTP: <strong>{lastInviteData.debugOtp}</strong> &bull; Token: {lastInviteData.token.substring(0, 16)}...
            </div>
          </div>
        )}

        {/* Body Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Action Button: Add User */}
          {currentUserRole === 'OWNER' && (
            <div className="flex justify-between items-center pb-2">
              <span className="text-xs font-bold text-[#D0DEE5]">
                Active Laboratory Members ({teamMembers.length})
              </span>
              <button
                onClick={() => {
                  setActionMessage(null);
                  setIsInviteOpen(true);
                }}
                className="py-1.5 px-3 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite User</span>
              </button>
            </div>
          )}

          {/* Members List */}
          {isLoading ? (
            <div className="py-8 text-center text-xs text-[#D0DEE5]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D0DEE5]" />
              Loading laboratory users...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#D0DEE5]/70 bg-[#15253F]/40 rounded-2xl border border-dashed border-[#2B3D5B]">
              No invited team members yet. Tap "Invite User" to add lab administrators or staff.
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map(member => {
                const isSelf = member.role === 'OWNER';
                return (
                  <div
                    key={member.id}
                    className="p-3 bg-[#15253F] border border-[#2B3D5B] rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          member.role === 'OWNER'
                            ? 'bg-amber-400 text-black'
                            : member.role === 'ADMIN'
                            ? 'bg-blue-400 text-black'
                            : member.role === 'STAFF'
                            ? 'bg-slate-300 text-slate-900'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white truncate">{member.fullName}</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                              member.role === 'OWNER'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                : member.role === 'ADMIN'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                                : member.role === 'STAFF'
                                ? 'bg-slate-500/20 text-slate-300 border border-slate-400/40'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {member.role}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
                              member.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : member.status === 'DEACTIVATED'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-[#D0DEE5]/80 mt-0.5 truncate">
                          {member.email} &bull; {member.phoneNumber}
                        </div>

                        {/* Permissions snippet */}
                        <div className="text-[9px] text-[#D0DEE5]/60 mt-1 flex items-center gap-1 flex-wrap">
                          {member.permissions.includes('orders:create') && (
                            <span className="bg-[#2B3D5B] px-1 py-0.2 rounded">Orders</span>
                          )}
                          {member.permissions.includes('financials:view') && (
                            <span className="bg-[#2B3D5B] px-1 py-0.2 rounded">View Finance</span>
                          )}
                          {member.permissions.includes('payments:make') && (
                            <span className="bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded font-bold">Payments</span>
                          )}
                          {member.permissions.includes('tickets:create') && (
                            <span className="bg-[#2B3D5B] px-1 py-0.2 rounded">Complaints</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Action */}
                    {currentUserRole === 'OWNER' && !isSelf && (
                      <div className="shrink-0 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(member)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-xl transition cursor-pointer ${
                            member.status === 'ACTIVE'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/80'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80'
                          }`}
                        >
                          {member.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-[#15253F] flex justify-end bg-[#0E1035]">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-[#15253F] hover:bg-[#2B3D5B] text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUB-MODAL: INVITE USER FORM */}
      {/* ------------------------------------------------------------------ */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#0E1035] border border-[#2B3D5B] rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 text-white font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#15253F] pb-3">
              <div>
                <h4 className="text-sm font-black text-white">Invite Team Member</h4>
                <p className="text-[10px] text-[#D0DEE5]">New member will create their own password.</p>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-[#D0DEE5] hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#D0DEE5] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteFullName}
                  onChange={(e) => setInviteFullName(e.target.value)}
                  placeholder="e.g. Meera Nair"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] rounded-xl py-2 px-3 text-white placeholder-[#D0DEE5]/40 outline-none focus:border-[#D0DEE5]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#D0DEE5] mb-1">
                  Email ID *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="meera.admin@apexlab.in"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] rounded-xl py-2 px-3 text-white placeholder-[#D0DEE5]/40 outline-none focus:border-[#D0DEE5]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#D0DEE5] mb-1">
                  Contact Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543230 (10 digits)"
                  className="w-full bg-[#15253F] border border-[#2B3D5B] rounded-xl py-2 px-3 text-white placeholder-[#D0DEE5]/40 outline-none focus:border-[#D0DEE5] font-mono"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#D0DEE5] mb-1.5">
                  Assign Customer Role *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADMIN', 'STAFF', 'VIEWER'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setInviteRole(role);
                        if (role === 'VIEWER') {
                          setInviteAllowOrders(false);
                          setInviteAllowTickets(false);
                          setInviteAllowFinancials(false);
                          setInviteAllowPayments(false);
                        } else {
                          setInviteAllowOrders(true);
                          setInviteAllowTickets(true);
                          setInviteAllowFinancials(true);
                        }
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                        inviteRole === role
                          ? 'bg-white text-[#0E1035] border-white shadow-sm'
                          : 'bg-[#15253F] text-[#D0DEE5] border-[#2B3D5B] hover:bg-[#2B3D5B]'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-[#D0DEE5]/70 mt-1.5">
                  {inviteRole === 'ADMIN' && 'Admin can place orders, view financials, raise service tickets, and view lab records. Cannot pay by default.'}
                  {inviteRole === 'STAFF' && 'Staff can access features assigned by the Owner/Admin.'}
                  {inviteRole === 'VIEWER' && 'Viewer has read-only access to catalog and order status. Ordering and payments are disabled.'}
                </div>
              </div>

              {/* Permissions Checklist */}
              {inviteRole !== 'VIEWER' && (
                <div className="p-3 bg-[#15253F] rounded-2xl border border-[#2B3D5B] space-y-2 mt-2">
                  <div className="text-[10px] font-bold uppercase text-[#D0DEE5]">Feature Permissions:</div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={inviteAllowOrders}
                      onChange={(e) => setInviteAllowOrders(e.target.checked)}
                      className="rounded accent-white"
                    />
                    <span>Place Institutional Orders</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={inviteAllowFinancials}
                      onChange={(e) => setInviteAllowFinancials(e.target.checked)}
                      className="rounded accent-white"
                    />
                    <span>View Financial / Overdue Status</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={inviteAllowTickets}
                      onChange={(e) => setInviteAllowTickets(e.target.checked)}
                      className="rounded accent-white"
                    />
                    <span>Submit Service &amp; Application Complaints</span>
                  </label>
                  {inviteRole === 'ADMIN' && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-bold pt-1 border-t border-[#2B3D5B]/60">
                      <input
                        type="checkbox"
                        checked={inviteAllowPayments}
                        onChange={(e) => setInviteAllowPayments(e.target.checked)}
                        className="rounded accent-amber-400"
                      />
                      <span>Grant Payment Authority (Explicit Owner Delegation)</span>
                    </label>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 py-2.5 bg-[#15253F] hover:bg-[#2B3D5B] text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="flex-1 py-2.5 bg-white text-[#0E1035] hover:bg-[#D0DEE5] font-black rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingInvite ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Invitation</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
