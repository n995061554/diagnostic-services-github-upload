import React, { useState } from 'react';
import { User, UserRoleType, PermissionDataScope, UserAccountStatus, UserStatusHistoryItem, toPrimaryRole, PrimaryBusinessRole } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  XCircle,
  CreditCard,
  Briefcase,
  FileSpreadsheet,
  Lock,
  Unlock,
  LogOut,
  MapPin,
  Globe,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  Send,
  History,
  ArrowRight,
  KeyRound,
  Copy,
  Check,
  UserX,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Smartphone,
  Fingerprint,
  Edit2,
  Trash2,
  Key
} from 'lucide-react';

interface UserDirectoryViewProps {
  users: User[];
  currentRole: UserRoleType;
  token?: string | null;
  onRefreshUsers: () => void;
  onNavigateToCustomerImport?: () => void;
  onOpenSecuritySuite?: () => void;
  onNavigateToSecuritySessions?: () => void;
  onNavigateToAuthPipeline?: () => void;
}

export const UserDirectoryView: React.FC<UserDirectoryViewProps> = ({
  users,
  currentRole,
  token,
  onRefreshUsers,
  onNavigateToCustomerImport,
  onOpenSecuritySuite,
  onNavigateToSecuritySessions,
  onNavigateToAuthPipeline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'EMPLOYEES' | 'CUSTOMERS' | 'DISTRIBUTORS' | 'USER_CREATED' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED' | 'LOCKED'>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showSelfActivateModal, setShowSelfActivateModal] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
  const [selectedUserForTransition, setSelectedUserForTransition] = useState<User | null>(null);
  
  // Lifecycle Transition Form State
  const [targetStatus, setTargetStatus] = useState<UserAccountStatus>('ACTIVE');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);

  // Self-Activation Form State (Simulated Public Activation flow)
  const [activationTokenInput, setActivationTokenInput] = useState('');
  const [activationPassword, setActivationPassword] = useState('');
  const [activationFirstName, setActivationFirstName] = useState('');
  const [activationLastName, setActivationLastName] = useState('');
  const [isActivatingAccount, setIsActivatingAccount] = useState(false);

  // Feedback & Copy State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Super Admin Edit User & Role Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    roleType: UserRoleType.SALES_PERSON,
    dataScope: 'ALL' as PermissionDataScope,
    department: '',
    designation: '',
    status: 'ACTIVE' as UserAccountStatus,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Super Admin Reset Password Modal State
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<User | null>(null);
  const [customTempPassword, setCustomTempPassword] = useState('');
  const [resetResult, setResetResult] = useState<{ temporaryPassword?: string; message?: string } | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Super Admin Delete User Confirmation State
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Employee Exit & Handover Modal State (Part 3.5)
  const [selectedUserForExit, setSelectedUserForExit] = useState<User | null>(null);
  const [exitPendingItems, setExitPendingItems] = useState<any | null>(null);
  const [isLoadingExitItems, setIsLoadingExitItems] = useState(false);
  const [replacementUserId, setReplacementUserId] = useState('');
  const [exitReason, setExitReason] = useState('Employee offboarded. Responsibilities reassigned.');
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  const handleOpenExitModal = async (u: User) => {
    setSelectedUserForExit(u);
    setExitPendingItems(null);
    setReplacementUserId('');
    setExitReason('Employee offboarded. Responsibilities reassigned.');
    setIsLoadingExitItems(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${u.id}/pending-items`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setExitPendingItems(json.data);
      }
    } catch (err) {
      console.warn('Failed to load employee pending items', err);
    } finally {
      setIsLoadingExitItems(false);
    }
  };

  const handleConfirmExit = async () => {
    if (!selectedUserForExit || !token) return;
    setIsSubmittingExit(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserForExit.id}/exit-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          replacementUserId: replacementUserId || undefined,
          reason: exitReason
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', message: data.message || 'Failed to process employee exit handover.' });
        return;
      }
      setFeedback({
        type: 'success',
        message: data.message || `Employee ${selectedUserForExit.email} offboarded and items reassigned successfully.`
      });
      onRefreshUsers();
      setSelectedUserForExit(null);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error executing employee exit handover.' });
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Customer Form Data
  const [customerForm, setCustomerForm] = useState({
    email: '',
    phoneNumber: '',
    password: '',
    firstName: '',
    lastName: '',
    labName: '',
    customerType: 'HOSPITAL_LAB',
    gstNumber: '',
    drugLicenseNumber: '',
    branch: 'MUMBAI_CENTRAL',
  });

  // Employee Form Data
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    roleType: UserRoleType.SALES_PERSON,
    dataScope: 'ASSIGNED' as PermissionDataScope,
    initialStatus: 'PENDING_ACTIVATION' as UserAccountStatus,
    department: 'FIELD_SALES',
    designation: 'Territory Executive',
    branch: 'MUMBAI_CENTRAL',
    region: 'WEST',
    team: 'WEST_SALES_ALPHA',
    employeeCode: '',
    twoFactorEnabled: false,
    password: '',
  });

  const isStaffRole = (role: UserRoleType) => {
    return role !== UserRoleType.CUSTOMER && role !== UserRoleType.DISTRIBUTOR;
  };

  const filteredUsers = users.filter((u) => {
    // Tab filter
    if (activeTab === 'EMPLOYEES' && !isStaffRole(u.roleType)) return false;
    if (activeTab === 'CUSTOMERS' && u.roleType !== UserRoleType.CUSTOMER) return false;
    if (activeTab === 'DISTRIBUTORS' && u.roleType !== UserRoleType.DISTRIBUTOR) return false;
    if (activeTab === 'USER_CREATED' && u.status !== 'USER_CREATED') return false;
    if (activeTab === 'PENDING_ACTIVATION' && u.status !== 'PENDING_ACTIVATION') return false;
    if (activeTab === 'ACTIVE' && u.status !== 'ACTIVE') return false;
    if (activeTab === 'SUSPENDED' && u.status !== 'SUSPENDED') return false;
    if (activeTab === 'DEACTIVATED' && u.status !== 'DEACTIVATED') return false;
    if (activeTab === 'LOCKED' && u.status !== 'LOCKED' && (u.failedLoginAttempts || 0) < 3) return false;

    // Role filter (matches against primary business role or legacy roleType)
    const primary = toPrimaryRole(u.roleType);
    const matchesRole =
      selectedRoleFilter === 'ALL' ||
      primary === selectedRoleFilter ||
      u.roleType === selectedRoleFilter;

    // Search filter
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q) ||
      (u.phoneNumber || '').includes(q) ||
      (u.status || '').toLowerCase().includes(q) ||
      (u.customerProfile?.labName || '').toLowerCase().includes(q) ||
      (u.employeeProfile?.employeeCode || '').toLowerCase().includes(q) ||
      (u.employeeProfile?.department || '').toLowerCase().includes(q);

    return matchesRole && matchesSearch;
  });

  // Handle Customer Registration
  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `Customer account registered for ${data.user.labName} (Code: ${data.user.customerCode})` });
        onRefreshUsers();
        setShowCustomerModal(false);
        setCustomerForm({
          email: '',
          phoneNumber: '',
          password: '',
          firstName: '',
          lastName: '',
          labName: '',
          customerType: 'HOSPITAL_LAB',
          gstNumber: '',
          drugLicenseNumber: '',
          branch: 'MUMBAI_CENTRAL',
        });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Registration failed.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during customer registration.' });
    }
  };

  // Handle Employee Registration (with individual naming checks)
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce no generic names like "sales1", "admin1", "officeuser"
    const genericIdentifiers = ['sales1', 'admin1', 'office1', 'user1', 'engineer1', 'sales2', 'manager1'];
    const normUser = employeeForm.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normEmail = employeeForm.email.toLowerCase();

    if (genericIdentifiers.some(g => normUser.includes(g) || normEmail.includes(g))) {
      setFeedback({
        type: 'error',
        message: 'Security Policy Violation: Generic shared logins (e.g. "sales1", "admin1") are strictly forbidden. Please use individual named accounts (e.g., salesperson.rahul@company.com).',
      });
      return;
    }

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: employeeForm.firstName,
          lastName: employeeForm.lastName,
          email: employeeForm.email,
          username: employeeForm.username || `${employeeForm.firstName.toLowerCase()}.${employeeForm.lastName.toLowerCase()}`,
          phoneNumber: employeeForm.phoneNumber,
          roleType: employeeForm.roleType,
          status: employeeForm.initialStatus,
          dataScope: employeeForm.dataScope,
          branch: employeeForm.branch,
          region: employeeForm.region,
          team: employeeForm.team,
          twoFactorEnabled: employeeForm.twoFactorEnabled,
          password: employeeForm.password,
          employeeProfile: {
            employeeCode: employeeForm.employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`,
            department: employeeForm.department,
            designation: employeeForm.designation,
            isActive: employeeForm.initialStatus === 'ACTIVE',
            branch: employeeForm.branch,
            region: employeeForm.region,
            team: employeeForm.team,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `Individual employee account created for ${employeeForm.firstName} ${employeeForm.lastName} (Status: ${employeeForm.initialStatus})` });
        onRefreshUsers();
        setShowEmployeeModal(false);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to create employee account.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error creating employee account.' });
    }
  };

  // Handle Lifecycle State Machine Transition
  const handleExecuteLifecycleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForTransition || !token) return;

    setIsSubmittingTransition(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserForTransition.id}/lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetStatus,
          reason: transitionReason || `Administrator transitioned status to ${targetStatus}`,
          notes: transitionNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Lifecycle transition successful: ${selectedUserForTransition.email} transitioned to ${targetStatus}.`,
        });
        onRefreshUsers();
        setSelectedUserForTransition(null);
        setTransitionReason('');
        setTransitionNotes('');
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to transition user status.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during lifecycle state transition.' });
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  // Handle Dispatch Activation Token
  const handleDispatchActivationLink = async (user: User) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/send-activation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Activation token generated for ${user.email}. User moved to PENDING_ACTIVATION. Token: ${data.activationToken}`,
        });
        onRefreshUsers();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to dispatch activation token.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error dispatching activation link.' });
    }
  };

  // Handle Public / Self-Activation Simulator
  const handleSelfActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivatingAccount(true);
    try {
      const res = await fetch('/api/v1/auth/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activationTokenInput.trim(),
          password: activationPassword,
          firstName: activationFirstName || undefined,
          lastName: activationLastName || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Account activated successfully! ${data.user?.email || 'User'} is now ACTIVE and can sign in.`,
        });
        onRefreshUsers();
        setShowSelfActivateModal(false);
        setActivationTokenInput('');
        setActivationPassword('');
        setActivationFirstName('');
        setActivationLastName('');
      } else {
        setFeedback({ type: 'error', message: data.message || 'Activation failed.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error during account activation.' });
    } finally {
      setIsActivatingAccount(false);
    }
  };

  // Handle Account Unlock
  const handleUnlockUser = async (userId: string, email: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `Account for ${email} has been unlocked. Failed login counter reset.` });
        onRefreshUsers();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to unlock account.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error unlocking account.' });
    }
  };

  // Handle Terminate User Sessions
  const handleTerminateSessions = async (userId: string, email: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/terminate-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `All active device sessions terminated for ${email}.` });
        onRefreshUsers();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to terminate sessions.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error terminating sessions.' });
    }
  };

  // Super Admin: Open Edit User Modal
  const handleOpenEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setEditUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      roleType: user.roleType || UserRoleType.SALES_PERSON,
      dataScope: user.dataScope || 'ALL',
      department: user.employeeProfile?.department || '',
      designation: user.employeeProfile?.designation || '',
      status: user.status || 'ACTIVE',
    });
  };

  // Super Admin: Save User Edit
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit || !token) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editUserForm.firstName,
          lastName: editUserForm.lastName,
          email: editUserForm.email,
          phoneNumber: editUserForm.phoneNumber,
          roleType: editUserForm.roleType,
          dataScope: editUserForm.dataScope,
          status: editUserForm.status,
          employeeProfile: {
            department: editUserForm.department,
            designation: editUserForm.designation,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `User ${editUserForm.email} updated successfully. Role assigned: ${editUserForm.roleType}.`,
        });
        onRefreshUsers();
        setSelectedUserForEdit(null);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update user.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error updating user.' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Super Admin: Open Reset Password Modal
  const handleOpenResetPassword = (user: User) => {
    setSelectedUserForPasswordReset(user);
    setCustomTempPassword('');
    setResetResult(null);
  };

  // Super Admin: Execute Password Reset
  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordReset || !token) return;

    setIsSubmittingReset(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserForPasswordReset.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          temporaryPassword: customTempPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetResult({
          temporaryPassword: data.temporaryPassword,
          message: data.message || 'Temporary password generated successfully.',
        });
        setFeedback({
          type: 'success',
          message: `Temporary credentials generated for ${selectedUserForPasswordReset.email}. User must change password on next sign-in.`,
        });
        onRefreshUsers();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to reset password.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error resetting password.' });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Super Admin: Open Delete User Modal
  const handleOpenDeleteUser = (user: User) => {
    setSelectedUserForDelete(user);
    setDeleteConfirmationText('');
  };

  // Super Admin: Execute Delete User
  const handleExecuteDeleteUser = async () => {
    if (!selectedUserForDelete || !token) return;

    setIsSubmittingDelete(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserForDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: `Account for ${selectedUserForDelete.email} has been permanently deleted.`,
        });
        onRefreshUsers();
        setSelectedUserForDelete(null);
        setDeleteConfirmationText('');
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to delete user.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error deleting user.' });
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const getStatusBadgeConfig = (status: UserAccountStatus) => {
    switch (status) {
      case 'USER_CREATED':
        return {
          bg: 'bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40',
          icon: Clock,
          label: 'USER CREATED',
          description: 'Record created, awaiting activation dispatch'
        };
      case 'PENDING_ACTIVATION':
        return {
          bg: 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40',
          icon: Sparkles,
          label: 'PENDING ACTIVATION',
          description: 'Activation link dispatched, awaiting password setup'
        };
      case 'ACTIVE':
        return {
          bg: 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40',
          icon: CheckCircle2,
          label: 'ACTIVE',
          description: 'Fully authenticated & operational'
        };
      case 'SUSPENDED':
        return {
          bg: 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40',
          icon: AlertTriangle,
          label: 'SUSPENDED',
          description: 'Temporary administrative or credit hold'
        };
      case 'DEACTIVATED':
        return {
          bg: 'bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40',
          icon: UserX,
          label: 'DEACTIVATED',
          description: 'Permanently offboarded or closed'
        };
      case 'LOCKED':
        return {
          bg: 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40 animate-pulse',
          icon: Lock,
          label: 'LOCKED',
          description: 'Locked due to failed login attempts'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Info,
          label: status,
          description: 'Standard Account Status'
        };
    }
  };

  const getScopeBadge = (scope?: PermissionDataScope) => {
    switch (scope) {
      case 'ALL':
        return 'bg-[#22381E] text-[#D2E7C4] border-[#1E331B]';
      case 'REGION':
        return 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40';
      case 'BRANCH':
        return 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40';
      case 'TEAM':
        return 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]/40';
      case 'ASSIGNED':
        return 'bg-[#E4F1DC] text-[#1E331B] border-[#D2E7C4]';
      case 'OWN':
        return 'bg-[#E4E8DF] text-[#4B5A48] border-[#82917C]/40';
      default:
        return 'bg-[#E4E8DF] text-[#4B5A48] border-[#82917C]/40';
    }
  };

  const counts = {
    all: users.length,
    employees: users.filter(u => isStaffRole(u.roleType)).length,
    customers: users.filter(u => u.roleType === UserRoleType.CUSTOMER).length,
    distributors: users.filter(u => u.roleType === UserRoleType.DISTRIBUTOR).length,
    userCreated: users.filter(u => u.status === 'USER_CREATED').length,
    pendingActivation: users.filter(u => u.status === 'PENDING_ACTIVATION').length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
    deactivated: users.filter(u => u.status === 'DEACTIVATED').length,
    locked: users.filter(u => u.status === 'LOCKED' || (u.failedLoginAttempts || 0) >= 3).length,
  };

  const allowedTransitionsMap: Record<UserAccountStatus, UserAccountStatus[]> = {
    USER_CREATED: ['PENDING_ACTIVATION', 'ACTIVE', 'DEACTIVATED'],
    PENDING_ACTIVATION: ['ACTIVE', 'DEACTIVATED', 'USER_CREATED'],
    ACTIVE: ['SUSPENDED', 'DEACTIVATED'],
    SUSPENDED: ['ACTIVE', 'DEACTIVATED'],
    DEACTIVATED: ['PENDING_ACTIVATION', 'ACTIVE'],
    LOCKED: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
    PASSWORD_RESET_REQUIRED: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
    INACTIVE: ['ACTIVE', 'DEACTIVATED'],
    PENDING_VERIFICATION: ['ACTIVE', 'DEACTIVATED']
  };

  if (currentRole !== UserRoleType.SUPER_ADMIN) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted — Super Admin Only</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            User &amp; Role Management is exclusively restricted to the Super Admin role. Back Office staff, Office Admin, and other roles are not authorized to create, modify, or assign user accounts or administrative permissions.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono text-slate-700">
            <span>Current Session Role:</span>
            <strong>{currentRole}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header with Formal State Machine Diagram */}
      <div className="bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#1E331B] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40 rounded flex items-center justify-center text-xs font-bold">14</span>
              <span>Account Lifecycle & RBAC Directory</span>
            </div>
            <h2 className="text-xl font-bold text-[#1E331B] tracking-tight">
              User Account Lifecycle & Identity Management
            </h2>
            <p className="text-sm text-[#415439] mt-1">
              Strict individual credentials with state machine governance: <strong>USER CREATED</strong> → <strong>PENDING ACTIVATION</strong> → <strong>ACTIVE</strong> → <strong>SUSPENDED</strong> → <strong>DEACTIVATED</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSelfActivateModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#F4DFA3] hover:bg-[#F4DFA3]/80 text-[#6B4B12] border border-[#C58A16]/40 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#C58A16]" />
              <span>Simulate Account Activation</span>
            </button>

            {onOpenSecuritySuite && (
              <button
                onClick={onOpenSecuritySuite}
                className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#F3C7C2]/70 hover:bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#B94A40]" />
                <span>Security Test Suite</span>
              </button>
            )}

            {onNavigateToSecuritySessions && (
              <button
                onClick={onNavigateToSecuritySessions}
                className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#C9DDE0] hover:bg-[#C9DDE0]/80 text-[#245B63] border border-[#4C8994]/40 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#4C8994]" />
                <span>Security Sessions & Logins</span>
              </button>
            )}

            {onNavigateToAuthPipeline && (
              <button
                onClick={onNavigateToAuthPipeline}
                className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#E4F1DC] hover:bg-[#D2E7C4] text-[#1E331B] border border-[#D2E7C4] text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Fingerprint className="w-4 h-4 text-[#5F8F4D]" />
                <span>7-Stage Auth Pipeline</span>
              </button>
            )}

            {onNavigateToCustomerImport && (
              <button
                onClick={onNavigateToCustomerImport}
                className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#D2E7C4] hover:bg-[#C3E2B8] text-[#1E331B] border border-[#5F8F4D]/40 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1E331B]" />
                <span>Bulk Customer Import</span>
              </button>
            )}

            <button
              onClick={() => setShowEmployeeModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#D2E7C4]" />
              <span>Create Employee Account</span>
            </button>

            <button
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 bg-[#D2E7C4] hover:bg-[#C3E2B8] text-[#1E331B] border border-[#5F8F4D]/40 text-xs font-semibold rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#5F8F4D]" />
              <span>Register Diagnostic Lab</span>
            </button>
          </div>
        </div>

        {/* Visual Lifecycle State Machine Stepper */}
        <div className="mt-5 p-3.5 bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl">
          <div className="text-[11px] font-bold text-[#1E331B] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Mandated User Lifecycle State Machine</span>
            <span className="text-[10px] font-normal text-slate-500 font-mono">NIST 800-63B Compliant</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#C9DDE0] text-[#245B63] rounded-lg font-semibold border border-[#4C8994]/40">
              <Clock className="w-3.5 h-3.5 text-[#4C8994]" />
              <span>1. USER CREATED</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F4DFA3] text-[#6B4B12] rounded-lg font-semibold border border-[#C58A16]/40">
              <Sparkles className="w-3.5 h-3.5 text-[#C58A16]" />
              <span>2. PENDING ACTIVATION</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#D2E7C4] text-[#1E331B] rounded-lg font-semibold border border-[#5F8F4D]/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5F8F4D]" />
              <span>3. ACTIVE</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F3C7C2] text-[#8F2D25] rounded-lg font-semibold border border-[#B94A40]/40">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B94A40]" />
              <span>4. SUSPENDED (if required)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E4E8DF] text-[#4B5A48] rounded-lg font-semibold border border-[#82917C]/40">
              <UserX className="w-3.5 h-3.5 text-[#82917C]" />
              <span>5. DEACTIVATED</span>
            </div>
          </div>
        </div>

        {/* Global Feedback */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs flex items-center justify-between border ${
              feedback.type === 'success'
                ? 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40'
                : feedback.type === 'error'
                ? 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]/40'
                : 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#5F8F4D] flex-shrink-0" />
              ) : feedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-[#B94A40] flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-[#4C8994] flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Tabs Filter Bar */}
        <div className="flex border-b border-[#D2E7C4] mt-6 pt-2 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ALL'
                ? 'border-[#22381E] text-[#1E331B] bg-[#E4F1DC]/30'
                : 'border-transparent text-slate-500 hover:text-[#1E331B]'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setActiveTab('USER_CREATED')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'USER_CREATED'
                ? 'border-[#4C8994] text-[#245B63] bg-[#C9DDE0]/30'
                : 'border-transparent text-slate-500 hover:text-[#245B63]'
            }`}
          >
            User Created ({counts.userCreated})
          </button>

          <button
            onClick={() => setActiveTab('PENDING_ACTIVATION')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'PENDING_ACTIVATION'
                ? 'border-[#C58A16] text-[#6B4B12] bg-[#F4DFA3]/30'
                : 'border-transparent text-slate-500 hover:text-[#6B4B12]'
            }`}
          >
            Pending Activation ({counts.pendingActivation})
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ACTIVE'
                ? 'border-[#5F8F4D] text-[#1E331B] bg-[#D2E7C4]/30'
                : 'border-transparent text-slate-500 hover:text-[#1E331B]'
            }`}
          >
            Active ({counts.active})
          </button>

          <button
            onClick={() => setActiveTab('SUSPENDED')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'SUSPENDED'
                ? 'border-[#B94A40] text-[#8F2D25] bg-[#F3C7C2]/30'
                : 'border-transparent text-slate-500 hover:text-[#8F2D25]'
            }`}
          >
            Suspended ({counts.suspended})
          </button>

          <button
            onClick={() => setActiveTab('DEACTIVATED')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'DEACTIVATED'
                ? 'border-[#82917C] text-[#4B5A48] bg-[#E4E8DF]/40'
                : 'border-transparent text-slate-500 hover:text-[#4B5A48]'
            }`}
          >
            Deactivated ({counts.deactivated})
          </button>

          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'EMPLOYEES'
                ? 'border-[#22381E] text-[#1E331B] bg-[#E4F1DC]/30'
                : 'border-transparent text-slate-500 hover:text-[#1E331B]'
            }`}
          >
            Staff & Engineers ({counts.employees})
          </button>

          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'CUSTOMERS'
                ? 'border-[#22381E] text-[#1E331B] bg-[#E4F1DC]/30'
                : 'border-transparent text-slate-500 hover:text-[#1E331B]'
            }`}
          >
            Labs ({counts.customers})
          </button>

          <button
            onClick={() => setActiveTab('LOCKED')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1 cursor-pointer whitespace-nowrap ${
              activeTab === 'LOCKED'
                ? 'border-[#B94A40] text-[#8F2D25] bg-[#F3C7C2]/30'
                : 'border-transparent text-slate-500 hover:text-[#8F2D25]'
            }`}
          >
            <span>Locked ({counts.locked})</span>
          </button>
        </div>

        {/* Search and Role Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, username, employee ID, lab name, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#D2E7C4] rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#22381E] transition-colors"
            />
          </div>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-white border border-[#D2E7C4] rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#22381E]"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="SUPER_ADMIN">1. Super Admin</option>
            <option value="BACK_OFFICE">2. Back Office</option>
            <option value="LABORATORY">3. Laboratory</option>
            <option value="SALES_STAFF">4. Sales Staff</option>
            <option value="SERVICE_STAFF">5. Service Staff</option>
            <option value="DELIVERY_STAFF">6. Delivery Staff</option>
            <option value="APPLICATION_STAFF">7. Application Staff</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isLocked = user.status === 'LOCKED' || (user.failedLoginAttempts || 0) >= 5;
          const hasFailedAttempts = (user.failedLoginAttempts || 0) > 0;
          const statusConfig = getStatusBadgeConfig(user.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={user.id}
              className={`bg-white border rounded-xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                user.status === 'SUSPENDED'
                  ? 'border-[#B94A40]/40 bg-[#F3C7C2]/15'
                  : user.status === 'DEACTIVATED'
                  ? 'border-[#82917C]/40 bg-[#E4E8DF]/30 opacity-75'
                  : isLocked
                  ? 'border-[#B94A40]/50 bg-[#F3C7C2]/20 ring-1 ring-[#B94A40]/30'
                  : 'border-[#D2E7C4] hover:border-[#5F8F4D]'
              }`}
            >
              <div>
                {/* Header with Name and Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 truncate">
                      <span className="truncate">{user.firstName} {user.lastName}</span>
                      {user.twoFactorEnabled && (
                        <span title="2FA Active" className="text-[#5F8F4D] flex-shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-1 font-mono">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{user.phoneNumber}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center space-x-1 ${statusConfig.bg}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </span>
                    {user.statusHistory && user.statusHistory.length > 0 && (
                      <button
                        onClick={() => setSelectedUserForHistory(user)}
                        className="text-[10px] text-[#22381E] hover:text-[#1E331B] font-semibold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <History className="w-3 h-3 text-[#5F8F4D]" />
                        <span>History ({user.statusHistory.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Specific Warning/Reason Banners */}
                {user.status === 'USER_CREATED' && (
                  <div className="mt-3 p-2.5 bg-[#C9DDE0]/50 border border-[#4C8994]/40 rounded-lg text-xs flex items-center justify-between text-[#245B63]">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#4C8994] flex-shrink-0" />
                      <span className="text-[11px] font-medium">Record created. Awaiting activation dispatch.</span>
                    </div>
                    <button
                      onClick={() => handleDispatchActivationLink(user)}
                      className="px-2 py-1 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] text-[10px] font-bold rounded flex items-center space-x-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Link</span>
                    </button>
                  </div>
                )}

                {user.status === 'PENDING_ACTIVATION' && (
                  <div className="mt-3 p-2.5 bg-[#F4DFA3]/40 border border-[#C58A16]/40 rounded-lg text-xs space-y-1.5 text-[#6B4B12]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#C58A16]" />
                        <span>Pending User Activation</span>
                      </span>
                      {user.activationToken && (
                        <button
                          onClick={() => copyToClipboard(user.activationToken!, user.id)}
                          className="text-[10px] font-mono text-[#6B4B12] bg-[#F4DFA3] hover:bg-[#F4DFA3]/80 px-1.5 py-0.5 rounded flex items-center space-x-1 cursor-pointer border border-[#C58A16]/30"
                          title="Copy activation token"
                        >
                          {copiedTokenId === user.id ? <Check className="w-3 h-3 text-[#5F8F4D]" /> : <Copy className="w-3 h-3" />}
                          <span>Copy Token</span>
                        </button>
                      )}
                    </div>
                    {user.activationExpiresAt && (
                      <p className="text-[10px] text-[#6B4B12]/80">
                        Expires: {new Date(user.activationExpiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {user.status === 'SUSPENDED' && (
                  <div className="mt-3 p-2.5 bg-[#F3C7C2]/40 border border-[#B94A40]/40 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-[#8F2D25] flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B94A40]" />
                      <span>Account Suspended</span>
                    </div>
                    <p className="text-[11px] text-[#8F2D25]/90">
                      {user.suspendedReason || 'Access temporarily frozen by management.'}
                    </p>
                  </div>
                )}

                {user.status === 'DEACTIVATED' && (
                  <div className="mt-3 p-2.5 bg-[#E4E8DF]/60 border border-[#82917C]/40 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-[#4B5A48] flex items-center space-x-1">
                      <UserX className="w-3.5 h-3.5 text-[#82917C]" />
                      <span>Account Deactivated</span>
                    </div>
                    <p className="text-[11px] text-[#4B5A48]">
                      {user.deactivatedReason || 'Offboarded / Access revoked.'}
                    </p>
                  </div>
                )}

                {/* Account Lock Alert Box */}
                {isLocked && (
                  <div className="mt-3 p-3 bg-[#F3C7C2]/40 border border-[#B94A40]/40 rounded-lg text-xs space-y-2">
                    <div className="text-[#8F2D25] font-bold flex items-center space-x-1.5">
                      <Lock className="w-4 h-4 text-[#B94A40]" />
                      <span>Account Temporarily Locked</span>
                    </div>
                    <p className="text-[11px] text-[#8F2D25]">
                      {user.lockReason || 'Exceeded maximum allowed failed password attempts (5 attempts).'}
                    </p>
                    <button
                      onClick={() => handleUnlockUser(user.id, user.email)}
                      className="w-full py-1.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Unlock className="w-3.5 h-3.5 text-[#D2E7C4]" />
                      <span>Unlock Account & Reset Counter</span>
                    </button>
                  </div>
                )}

                {/* Warning if failed attempts > 0 but not yet locked */}
                {!isLocked && hasFailedAttempts && (
                  <div className="mt-2.5 p-2 bg-[#F4DFA3]/40 border border-[#C58A16]/40 rounded-lg text-[11px] text-[#6B4B12] flex items-center justify-between">
                    <span>⚠️ {user.failedLoginAttempts} failed login attempt(s)</span>
                    <button
                      onClick={() => handleUnlockUser(user.id, user.email)}
                      className="text-[#6B4B12] font-bold hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {/* Profile Details: Customer */}
                {user.customerProfile && (
                  <div className="mt-3 p-3 rounded-lg bg-[#F5F6F0] border border-[#D2E7C4] space-y-1.5 text-xs">
                    <div className="font-bold text-[#1E331B] flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#5F8F4D] flex-shrink-0" />
                      <span className="truncate">{user.customerProfile.labName}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Code: <strong className="text-slate-800 font-semibold">{user.customerProfile.customerCode}</strong></span>
                      <span>Credit: <strong className="text-slate-800 font-semibold">₹{(user.customerProfile?.creditLimit ?? 0).toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>
                )}

                {/* Profile Details: Employee */}
                {user.employeeProfile && (
                  <div className="mt-3 p-3 rounded-lg bg-[#F5F6F0] border border-[#D2E7C4] space-y-1.5 text-xs">
                    <div className="font-bold text-[#1E331B] flex items-center space-x-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#5F8F4D] flex-shrink-0" />
                      <span className="truncate">{user.employeeProfile.designation}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Dept: <strong className="text-slate-800 font-semibold">{user.employeeProfile.department}</strong></span>
                      <span>ID: <strong className="text-slate-800 font-semibold">{user.employeeProfile.employeeCode}</strong></span>
                    </div>
                  </div>
                )}

                {/* Security Metadata */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1 truncate">
                    <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="font-mono truncate">{user.lastLoginIp || '103.21.124.58'}</span>
                  </div>
                  <div className="flex items-center space-x-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{user.lastLoginLocation || 'Mumbai, MH'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200 truncate">
                    {user.roleType}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-semibold font-mono text-[10px] border ${getScopeBadge(user.dataScope)}`}>
                    {user.dataScope || 'ALL'}
                  </span>
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEditUser(user)}
                    title="Edit user details and assign role"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border border-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenResetPassword(user)}
                    title="Reset user password (generate temporary credential)"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer border border-slate-200"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUserForTransition(user);
                      const allowed = allowedTransitionsMap[user.status] || ['ACTIVE'];
                      setTargetStatus(allowed[0] || 'ACTIVE');
                      setTransitionReason('');
                      setTransitionNotes('');
                    }}
                    title="Transition account lifecycle status"
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-[#F5F6F0] hover:bg-[#E4F1DC] text-[#1E331B] border border-[#D2E7C4] transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Lifecycle</span>
                  </button>

                  {currentRole === UserRoleType.SUPER_ADMIN && user.status !== 'DEACTIVATED' && user.roleType !== UserRoleType.CUSTOMER && (
                    <button
                      onClick={() => handleOpenExitModal(user)}
                      title="Employee Exit Management & Responsibility Handover (Part 3.5)"
                      className="px-2 py-1 rounded-md text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <UserX className="w-3 h-3 text-rose-600" />
                      <span>Exit Handover</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleTerminateSessions(user.id, user.email)}
                    title="Terminate active login sessions"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenDeleteUser(user)}
                    title="Permanently delete user account"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-slate-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: REGISTER EMPLOYEE ACCOUNT */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Individual Employee Account</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every employee must have a dedicated individual login (No generic accounts).
                </p>
              </div>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                    placeholder="e.g. Rahul"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email Address *</label>
                  <input
                    required
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="salesperson.rahul@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    required
                    type="tel"
                    value={employeeForm.phoneNumber}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phoneNumber: e.target.value })}
                    placeholder="+919876543200"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Primary Enterprise Role *</label>
                  <select
                    value={employeeForm.roleType}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, roleType: e.target.value as UserRoleType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white text-xs font-semibold text-slate-800"
                  >
                    <option value={UserRoleType.SUPER_ADMIN}>Super Admin (Executive Leadership)</option>
                    <option value={UserRoleType.OFFICE_ADMIN}>Back Office (Operations &amp; Dispatch)</option>
                    <option value={UserRoleType.SALES_PERSON}>Sales Staff (Territory &amp; Visits)</option>
                    <option value={UserRoleType.SERVICE_ENGINEER}>Service Staff (Biomedical Engineering)</option>
                    <option value={UserRoleType.DELIVERY_STAFF}>Delivery Staff (Logistics &amp; Handover)</option>
                    <option value={UserRoleType.APPLICATION_SUPPORT}>Application Staff (Clinical Assay &amp; Training)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Lifecycle Status *</label>
                  <select
                    value={employeeForm.initialStatus}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, initialStatus: e.target.value as UserAccountStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white font-semibold text-[#1E331B]"
                  >
                    <option value="USER_CREATED">USER_CREATED (Pre-registered)</option>
                    <option value="PENDING_ACTIVATION">PENDING_ACTIVATION (Send Link)</option>
                    <option value="ACTIVE">ACTIVE (Immediate Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Permission Data Scope *</label>
                  <select
                    value={employeeForm.dataScope}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, dataScope: e.target.value as PermissionDataScope })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  >
                    <option value="ALL">ALL (Company-wide HQ Access)</option>
                    <option value="REGION">REGION (Regional Territory)</option>
                    <option value="BRANCH">BRANCH (Local Branch)</option>
                    <option value="TEAM">TEAM (Specific Team Cluster)</option>
                    <option value="ASSIGNED">ASSIGNED (Assigned Clients Only)</option>
                    <option value="OWN">OWN (Own Records Only)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    placeholder="e.g. FIELD_SALES"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    placeholder="e.g. Territory Manager"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={employeeForm.twoFactorEnabled}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, twoFactorEnabled: e.target.checked })}
                    className="rounded text-[#22381E] focus:ring-[#22381E] border-slate-300"
                  />
                  <span className="font-semibold text-slate-800">Enforce Two-Factor Authentication (2FA) on Login</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] font-bold rounded-lg text-xs shadow-xs"
                >
                  Provision Employee Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER CUSTOMER LAB */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register Diagnostic Lab Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Laboratory / Hospital Name *</label>
                <input
                  required
                  type="text"
                  value={customerForm.labName}
                  onChange={(e) => setCustomerForm({ ...customerForm, labName: e.target.value })}
                  placeholder="e.g. Metro Clinical Reference Laboratory"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact First Name *</label>
                  <input
                    required
                    type="text"
                    value={customerForm.firstName}
                    onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                    placeholder="Dr. Rajesh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Last Name *</label>
                  <input
                    required
                    type="text"
                    value={customerForm.lastName}
                    onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                    placeholder="Kulkarni"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="lab.contact@hospital.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    required
                    type="tel"
                    value={customerForm.phoneNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                    placeholder="+919820011223"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Number</label>
                  <input
                    type="text"
                    value={customerForm.gstNumber}
                    onChange={(e) => setCustomerForm({ ...customerForm, gstNumber: e.target.value })}
                    placeholder="27AABCM8921N1ZM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Customer Category</label>
                  <select
                    value={customerForm.customerType}
                    onChange={(e) => setCustomerForm({ ...customerForm, customerType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  >
                    <option value="HOSPITAL_LAB">Hospital Laboratory</option>
                    <option value="DIAGNOSTIC_CHAIN">Diagnostic Chain</option>
                    <option value="PATHOLOGY_CLINIC">Pathology Clinic</option>
                    <option value="RESEARCH_INSTITUTE">Research Institute</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] font-bold rounded-lg text-xs shadow-xs"
                >
                  Create Lab Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LIFECYCLE STATE MACHINE TRANSITION */}
      {selectedUserForTransition && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D2E7C4] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#5F8F4D]" />
                  <span>Execute Lifecycle State Transition</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target Account: <strong>{selectedUserForTransition.firstName} {selectedUserForTransition.lastName}</strong> ({selectedUserForTransition.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForTransition(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current vs Target State Display */}
            <div className="p-3 bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current State</div>
                <div className="font-mono font-bold text-xs text-slate-800 mt-0.5">{selectedUserForTransition.status}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#5F8F4D]" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target State</div>
                <div className="font-mono font-bold text-xs text-[#1E331B] mt-0.5">{targetStatus}</div>
              </div>
            </div>

            <form onSubmit={handleExecuteLifecycleTransition} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select New Status *</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as UserAccountStatus)}
                  className="w-full px-3 py-2 bg-white border border-[#D2E7C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22381E] font-semibold text-slate-900"
                >
                  {(allowedTransitionsMap[selectedUserForTransition.status] || ['ACTIVE', 'SUSPENDED', 'DEACTIVATED']).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enforces transition matrix: USER_CREATED → PENDING_ACTIVATION → ACTIVE → SUSPENDED → DEACTIVATED.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transition Reason / Justification *</label>
                <input
                  required
                  type="text"
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="e.g. Identity documents verified / Credit freeze / Offboarding resignation"
                  className="w-full px-3 py-2 bg-white border border-[#D2E7C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Administrative Audit Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="Additional governance notes..."
                  className="w-full px-3 py-2 bg-white border border-[#D2E7C4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              {(targetStatus === 'SUSPENDED' || targetStatus === 'DEACTIVATED') && (
                <div className="p-3 bg-[#F3C7C2]/40 border border-[#B94A40]/40 rounded-lg text-[#8F2D25] text-[11px] flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-[#B94A40] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> Transitioning to <strong>{targetStatus}</strong> will immediately revoke all active JWT sessions and block any subsequent login attempts.
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForTransition(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransition}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isSubmittingTransition ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#D2E7C4]" />}
                  <span>Commit Lifecycle Change</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: STATUS HISTORY AUDIT TIMELINE */}
      {selectedUserForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D2E7C4] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <History className="w-4 h-4 text-[#5F8F4D]" />
                  <span>Lifecycle State Transition Audit Log</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  User: <strong>{selectedUserForHistory.firstName} {selectedUserForHistory.lastName}</strong> ({selectedUserForHistory.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForHistory(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current State Summary */}
            <div className="p-3 bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Current Status:</span>{' '}
                <strong className="font-mono text-slate-900">{selectedUserForHistory.status}</strong>
              </div>
              <div>
                <span className="text-slate-500">Account Created:</span>{' '}
                <strong className="text-slate-800">{new Date(selectedUserForHistory.createdAt).toLocaleDateString()}</strong>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3 mt-4">
              {(!selectedUserForHistory.statusHistory || selectedUserForHistory.statusHistory.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-[#F5F6F0] rounded-lg border border-[#D2E7C4]">
                  No historical state transitions recorded for this user account.
                </div>
              ) : (
                selectedUserForHistory.statusHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl border border-[#D2E7C4] bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 font-mono font-bold">
                        <span className="px-2 py-0.5 bg-[#E4E8DF] text-[#4B5A48] rounded text-[10px] border border-[#82917C]/40">
                          {item.fromStatus}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 bg-[#D2E7C4] text-[#1E331B] rounded text-[10px] border border-[#5F8F4D]/40">
                          {item.toStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.changedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800">
                      <strong>Reason:</strong> {item.reason || 'Not specified'}
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        {item.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Changed by: <strong>{item.changedByName || item.changedBy}</strong></span>
                      {item.ipAddress && <span>IP: {item.ipAddress}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedUserForHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: SIMULATE ACCOUNT ACTIVATION (SELF-SERVICE) */}
      {showSelfActivateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D2E7C4] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-[#C58A16]" />
                  <span>Public Account Activation Simulator</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulates user clicking their emailed activation link to transition from <strong>PENDING_ACTIVATION</strong> → <strong>ACTIVE</strong>.
                </p>
              </div>
              <button
                onClick={() => setShowSelfActivateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Token Selector from Pending Users */}
            {users.filter(u => u.status === 'PENDING_ACTIVATION' && u.activationToken).length > 0 && (
              <div className="p-3 bg-[#F4DFA3]/30 border border-[#C58A16]/30 rounded-xl space-y-2 text-xs">
                <div className="text-[11px] font-bold text-[#6B4B12] uppercase tracking-wider">
                  Select a Pending User to Auto-Fill Token:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {users.filter(u => u.status === 'PENDING_ACTIVATION' && u.activationToken).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setActivationTokenInput(u.activationToken || '');
                        setActivationFirstName(u.firstName);
                        setActivationLastName(u.lastName);
                        setActivationPassword('');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-[#F4DFA3]/60 text-[#6B4B12] border border-[#C58A16]/40 rounded font-semibold text-[11px] cursor-pointer"
                    >
                      {u.firstName} {u.lastName} ({u.roleType})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSelfActivateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Activation Token *</label>
                <input
                  required
                  type="text"
                  value={activationTokenInput}
                  onChange={(e) => setActivationTokenInput(e.target.value)}
                  placeholder="e.g. act-pooja-7721-tok"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#D2E7C4] rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Create Secure Initial Password (NIST 800-63B Compliant) *</label>
                <input
                  required
                  type="text"
                  value={activationPassword}
                  onChange={(e) => setActivationPassword(e.target.value)}
                  placeholder="At least 8 characters with upper, lower, number & special char"
                  className="w-full px-3 py-2 bg-slate-50 border border-[#D2E7C4] rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Confirm First Name</label>
                  <input
                    type="text"
                    value={activationFirstName}
                    onChange={(e) => setActivationFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#D2E7C4] rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Confirm Last Name</label>
                  <input
                    type="text"
                    value={activationLastName}
                    onChange={(e) => setActivationLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#D2E7C4] rounded-lg focus:outline-none focus:border-[#22381E] focus:ring-1 focus:ring-[#22381E] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSelfActivateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActivatingAccount || !activationTokenInput}
                  className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isActivatingAccount ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D2E7C4]" /> : <CheckCircle2 className="w-3.5 h-3.5 text-[#D2E7C4]" />}
                  <span>Activate Account Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 6: EDIT USER & ROLE ASSIGNMENT */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>Edit User &amp; Role Permissions</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Super Admin control: modify user profile, department, and assigned security role.
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name *</label>
                  <input
                    required
                    type="text"
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                  <input
                    required
                    type="text"
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    required
                    type="tel"
                    value={editUserForm.phoneNumber}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Role *</label>
                  <select
                    value={editUserForm.roleType}
                    onChange={(e) => setEditUserForm({ ...editUserForm, roleType: e.target.value as UserRoleType })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white font-semibold text-blue-900 text-xs"
                  >
                    <option value={UserRoleType.SUPER_ADMIN}>Super Admin (Executive Leadership)</option>
                    <option value={UserRoleType.OFFICE_ADMIN}>Back Office (Operations &amp; Dispatch)</option>
                    <option value={UserRoleType.CUSTOMER}>Laboratory (Customer Portal)</option>
                    <option value={UserRoleType.SALES_PERSON}>Sales Staff (Field Territory)</option>
                    <option value={UserRoleType.SERVICE_ENGINEER}>Service Staff (Field Service)</option>
                    <option value={UserRoleType.DELIVERY_STAFF}>Delivery Staff (Logistics)</option>
                    <option value={UserRoleType.APPLICATION_SUPPORT}>Application Staff (Assay Desk)</option>
                    {![UserRoleType.SUPER_ADMIN, UserRoleType.OFFICE_ADMIN, UserRoleType.CUSTOMER, UserRoleType.SALES_PERSON, UserRoleType.SERVICE_ENGINEER, UserRoleType.DELIVERY_STAFF, UserRoleType.APPLICATION_SUPPORT].includes(editUserForm.roleType) && (
                      <option value={editUserForm.roleType}>[Legacy Historical] {editUserForm.roleType}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lifecycle Status *</label>
                  <select
                    value={editUserForm.status}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as UserAccountStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_ACTIVATION">PENDING_ACTIVATION</option>
                    <option value="USER_CREATED">USER_CREATED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="DEACTIVATED">DEACTIVATED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Data Scope *</label>
                  <select
                    value={editUserForm.dataScope}
                    onChange={(e) => setEditUserForm({ ...editUserForm, dataScope: e.target.value as PermissionDataScope })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="ALL">ALL (Company HQ)</option>
                    <option value="REGION">REGION</option>
                    <option value="BRANCH">BRANCH</option>
                    <option value="TEAM">TEAM</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="OWN">OWN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={editUserForm.department}
                    onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })}
                    placeholder="e.g. FIELD_SALES"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                  <input
                    type="text"
                    value={editUserForm.designation}
                    onChange={(e) => setEditUserForm({ ...editUserForm, designation: e.target.value })}
                    placeholder="e.g. Service Engineer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <span className="font-semibold">Security Note:</span> Role modifications take effect immediately. All active sessions for this user will receive refreshed permissions.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save User &amp; Role Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: RESET PASSWORD */}
      {selectedUserForPasswordReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>Reset User Password</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  User: <strong>{selectedUserForPasswordReset.name || selectedUserForPasswordReset.firstName}</strong> ({selectedUserForPasswordReset.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForPasswordReset(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {resetResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Temporary Password Generated Successfully</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Share this temporary password securely with the user. They will be forced to change it upon first login.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      readOnly
                      type="text"
                      value={resetResult.temporaryPassword || ''}
                      className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono text-sm font-bold text-slate-900 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(resetResult.temporaryPassword || '', 'temp_pass')}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {copiedTokenId === 'temp_pass' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedTokenId === 'temp_pass' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs">
                  All active device sessions for <strong>{selectedUserForPasswordReset.email}</strong> have been terminated.
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPasswordReset(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecutePasswordReset} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Custom Temporary Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTempPassword}
                    onChange={(e) => setCustomTempPassword(e.target.value)}
                    placeholder="Leave blank to auto-generate a strong NIST password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-600 focus:bg-white font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    If left blank, the system automatically creates a secure 16-character temporary credential.
                  </span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Security Safeguard</span>
                  </div>
                  <p>
                    Resetting will terminate all active sessions for this account immediately and flag the user with <code>mustChangePassword = true</code>.
                  </p>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPasswordReset(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSubmittingReset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>Issue Temporary Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 8: DELETE USER CONFIRMATION */}
      {selectedUserForDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Permanently Delete User</h3>
                  <p className="text-xs text-slate-500">Irreversible administrative action</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForDelete(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <p className="font-semibold">Are you sure you want to delete this account?</p>
                <p>
                  User: <strong>{selectedUserForDelete.name || selectedUserForDelete.firstName}</strong> ({selectedUserForDelete.email})
                </p>
                <p>
                  Role: <span className="font-mono font-bold">{selectedUserForDelete.roleType}</span>
                </p>
              </div>

              {selectedUserForDelete.roleType === UserRoleType.SUPER_ADMIN && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Last Super Admin Protection</span>
                  </p>
                  <p>
                    The backend safety guard will reject deletion if this is the only active Super Admin account.
                  </p>
                </div>
              )}

              <p className="text-slate-600">
                To confirm permanent deletion, type <strong className="font-mono text-rose-600">DELETE</strong> below:
              </p>

              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-600 focus:bg-white font-mono text-center"
              />

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmationText !== 'DELETE' || isSubmittingDelete}
                  onClick={handleExecuteDeleteUser}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmittingDelete ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete User Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Employee Exit Management & Handover Modal (Part 3.5) */}
      {selectedUserForExit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Employee Exit Management &amp; Handover
                  </h3>
                  <p className="text-xs text-slate-500">
                    Part 3.5: Deactivate credentials, terminate sessions &amp; reassign pending responsibilities
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForExit(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Departing Employee Overview */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
              <div className="font-extrabold text-rose-950 flex justify-between">
                <span>Departing Staff: {selectedUserForExit.firstName} {selectedUserForExit.lastName}</span>
                <span className="font-mono text-[10px] bg-rose-200/80 px-2 py-0.5 rounded text-rose-800">{selectedUserForExit.roleType}</span>
              </div>
              <div className="text-slate-600 font-mono">{selectedUserForExit.email} • ID: {selectedUserForExit.id}</div>
            </div>

            {/* Pending Responsibilities Audit */}
            <div className="space-y-2 text-xs">
              <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wide">
                Pending Responsibilities Requiring Reassignment:
              </span>
              {isLoadingExitItems ? (
                <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                  <span>Inspecting active orders, service tickets, and field visits...</span>
                </div>
              ) : exitPendingItems ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-lg font-black text-slate-900">{exitPendingItems.pendingOrders?.length || 0}</span>
                    <p className="text-[10px] text-slate-500 font-bold">Pending Orders</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-lg font-black text-slate-900">{exitPendingItems.pendingTickets?.length || 0}</span>
                    <p className="text-[10px] text-slate-500 font-bold">Service Tickets</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <span className="text-lg font-black text-slate-900">{exitPendingItems.pendingPMs?.length || 0}</span>
                    <p className="text-[10px] text-slate-500 font-bold">PM Schedules</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500">0 pending responsibilities currently flagged.</p>
              )}
            </div>

            {/* Designated Replacement Employee Dropdown */}
            <div className="space-y-1.5 text-xs">
              <label className="font-extrabold text-slate-800">
                Designated Replacement Employee (Active Staff):
              </label>
              <select
                value={replacementUserId}
                onChange={(e) => setReplacementUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-rose-600"
              >
                <option value="">-- Select Active Replacement Employee --</option>
                {users
                  .filter((u) => u.id !== selectedUserForExit.id && u.status === 'ACTIVE' && u.roleType !== UserRoleType.CUSTOMER)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.roleType}) — {u.email}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-slate-500">
                All open orders, breakdown tickets, and field schedules will be atomically reassigned to this employee.
              </p>
            </div>

            {/* Exit Handover Reason */}
            <div className="space-y-1.5 text-xs">
              <label className="font-extrabold text-slate-800">Exit / Handover Reason:</label>
              <textarea
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                rows={2}
                placeholder="Reason for departure (e.g. Resigned, contract completed, territory reorganized)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-rose-600"
              />
            </div>

            {/* Safeguard Notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Immediate Security &amp; Data Integrity Invariants:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-amber-800">
                <li>Login deactivated immediately &amp; all active web/mobile sessions revoked.</li>
                <li>Historical logs and previously completed work permanently preserved under employee name.</li>
                <li>Departing staff will never be assigned new items.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedUserForExit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingExit}
                onClick={handleConfirmExit}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
              >
                {isSubmittingExit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                <span>Execute Exit &amp; Reassign Responsibilities</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
