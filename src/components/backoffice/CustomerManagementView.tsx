import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Users,
  Search,
  Filter,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Award,
  ChevronRight,
  X,
  FileText,
  LifeBuoy,
  ClipboardList,
  Wrench,
  CheckCircle2,
  Calendar,
  ExternalLink,
  RefreshCw,
  Hash
} from 'lucide-react';

interface CustomerManagementViewProps {
  token?: string | null;
  currentRole: UserRoleType;
  onNavigateTab: (tabId: string) => void;
  initialSelectedCustomerId?: string | null;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  token,
  currentRole,
  onNavigateTab,
  initialSelectedCustomerId,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Customer 360 Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialSelectedCustomerId || null);
  const [customerProfile, setCustomerProfile] = useState<any | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'financials' | 'users' | 'orders' | 'complaints' | 'applications' | 'equipment'>('financials');

  // Add Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newLabName, setNewLabName] = useState<string>('');
  const [newContactPerson, setNewContactPerson] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newContactNumber, setNewContactNumber] = useState<string>('');
  const [newLabType, setNewLabType] = useState<string>('Diagnostic Center');
  const [newRegNumber, setNewRegNumber] = useState<string>('');
  const [newGstNumber, setNewGstNumber] = useState<string>('');
  const [newPanNumber, setNewPanNumber] = useState<string>('');
  const [newEstablishedYear, setNewEstablishedYear] = useState<string>('2018');
  const [newOwnership, setNewOwnership] = useState<string>('Private Limited');
  const [newAnalyzers, setNewAnalyzers] = useState<number>(2);
  const [newCreditLimit, setNewCreditLimit] = useState<number>(250000);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchQuery) q.set('search', searchQuery);
      if (statusFilter !== 'ALL') q.set('status', statusFilter);
      const res = await fetch(`/api/v1/backoffice/customers?${q.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerProfile = async (id: string) => {
    setIsProfileLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/customers/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setCustomerProfile(json.data);
      }
    } catch (err) {
      console.error('Error loading customer profile', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerProfile(selectedCustomerId);
    } else {
      setCustomerProfile(null);
    }
  }, [selectedCustomerId]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate mandatory fields
    if (!newLabName.trim() || !newContactPerson.trim() || !newAddress.trim() || !newEmail.trim() || !newContactNumber.trim()) {
      setFormError('Mandatory fields required: Lab/Hospital Name, Contact Person Name, Address, Email ID, and Contact Number.');
      return;
    }

    try {
      const res = await fetch('/api/v1/backoffice/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          labName: newLabName.trim(),
          contactPersonName: newContactPerson.trim(),
          address: newAddress.trim(),
          email: newEmail.trim(),
          contactNumber: newContactNumber.trim(),
          laboratoryType: newLabType,
          registrationNumber: newRegNumber.trim(),
          gstNumber: newGstNumber.trim(),
          panNumber: newPanNumber.trim(),
          establishedYear: Number(newEstablishedYear) || 2020,
          ownership: newOwnership,
          numberOfAnalyzers: Number(newAnalyzers) || 1,
          creditLimit: Number(newCreditLimit) || 250000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || 'Failed to register customer laboratory.');
        return;
      }

      setIsAddModalOpen(false);
      resetForm();
      showToast(`Laboratory "${newLabName}" registered successfully with Owner profile.`);
      fetchCustomers();
    } catch (err) {
      setFormError('Network error while creating customer account.');
    }
  };

  const resetForm = () => {
    setNewLabName('');
    setNewContactPerson('');
    setNewAddress('');
    setNewEmail('');
    setNewContactNumber('');
    setNewLabType('Diagnostic Center');
    setNewRegNumber('');
    setNewGstNumber('');
    setNewPanNumber('');
    setNewEstablishedYear('2018');
    setNewOwnership('Private Limited');
    setNewAnalyzers(2);
    setNewCreditLimit(250000);
    setFormError(null);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E1035] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#2B3D5B] flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0E1035] text-white rounded-2xl p-6 shadow-md border border-[#15253F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#2B3D5B] text-[#D0DEE5]">
              Customer Master &amp; Accounts
            </span>
            <span className="text-xs text-[#7C8594]">● Multi-Tier Diagnostic Labs</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Customers &amp; Diagnostic Laboratories
          </h1>
          <p className="text-xs sm:text-sm text-[#D0DEE5] mt-0.5">
            Manage laboratory profiles, credit lines, authorized users, order history, and support requests. Passwords are never exposed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCustomers()}
            disabled={isLoading}
            className="p-2.5 bg-[#15253F] hover:bg-[#2B3D5B] text-white rounded-xl border border-[#2B3D5B] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#0E1035] hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer Lab</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by lab name, contact, email, phone, code..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#0E1035] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:border-[#0E1035] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="GOOD_STANDING">Good Standing</option>
            <option value="PAYMENT_OVERDUE">Payment Overdue</option>
            <option value="EXTENSION_REQUESTED">Extension Requested</option>
          </select>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[#2B3D5B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Laboratory / Hospital</th>
                <th className="py-3 px-3">Contact Person</th>
                <th className="py-3 px-3">Email &amp; Phone</th>
                <th className="py-3 px-3 text-right">Credit Limit</th>
                <th className="py-3 px-3 text-right">Outstanding</th>
                <th className="py-3 px-3 text-right">Overdue</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((cust) => (
                <tr 
                  key={cust.id} 
                  className={`hover:bg-slate-50/80 transition-colors ${
                    selectedCustomerId === cust.id ? 'bg-[#D0DEE5]/20 font-medium' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#0E1035] text-sm">{cust.labName}</div>
                    <div className="text-[11px] text-[#7C8594] font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{cust.customerCode}</span>
                      <span>•</span>
                      <span>{cust.laboratoryType}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-800">
                    <div>{cust.contactPersonName}</div>
                    <div className="text-[11px] text-slate-500">{cust.address.split(',')[0]}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-700">{cust.email}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{cust.contactNumber}</div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-700">
                    ₹{formatINR(cust.creditLimit)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-[#0E1035]">
                    ₹{formatINR(cust.outstandingAmount)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                    {cust.overdueAmount > 0 ? `₹${formatINR(cust.overdueAmount)}` : '₹0'}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cust.paymentStatus === 'GOOD_STANDING' ? 'bg-emerald-100 text-emerald-800' :
                      cust.paymentStatus === 'EXTENSION_REQUESTED' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {cust.paymentStatus.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <span>Profile 360</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No customer laboratories match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOMER 360 FULL PROFILE DRAWER (Section 2 & 3) */}
      {/* ========================================================================= */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col animate-slide-left overflow-hidden">
            {/* Drawer Header */}
            <div className="bg-[#0E1035] text-white p-6 border-b border-[#15253F] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {customerProfile?.labName || 'Loading Customer...'}
                  </h2>
                  <div className="text-xs text-[#D0DEE5] font-mono flex items-center gap-2 mt-0.5">
                    <span>Code: {customerProfile?.customerCode || '---'}</span>
                    <span>•</span>
                    <span>{customerProfile?.laboratoryType || 'Diagnostic Lab'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomerId(null)}
                className="p-2 text-[#D0DEE5] hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Subnav Tabs */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 flex items-center gap-2 overflow-x-auto shrink-0">
              {[
                { id: 'financials', label: 'Financial Profile & Credit', icon: CreditCard },
                { id: 'users', label: 'Contacts & Staff Users', icon: Users },
                { id: 'orders', label: 'Order History', icon: FileText },
                { id: 'complaints', label: 'Complaints / Tickets', icon: LifeBuoy },
                { id: 'applications', label: 'Application Requests', icon: ClipboardList },
                { id: 'equipment', label: 'Installed Analyzers', icon: Wrench },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeProfileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-[#0E1035] text-[#0E1035] bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isProfileLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0E1035]" />
                  <span>Loading full 360 customer profile...</span>
                </div>
              ) : (
                <>
                  {/* General Laboratory Information */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500 font-semibold">Contact Person</div>
                      <div className="font-bold text-slate-900 mt-0.5">{customerProfile?.contactPersonName}</div>
                      <div className="text-slate-600 font-mono text-[11px]">{customerProfile?.contactNumber}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">Email Address</div>
                      <div className="font-bold text-slate-900 mt-0.5">{customerProfile?.email}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">GST &amp; PAN</div>
                      <div className="font-mono text-slate-900 mt-0.5">{customerProfile?.gstNumber || '27AABCM8921N1ZM'}</div>
                      <div className="font-mono text-[11px] text-slate-600">PAN: {customerProfile?.panNumber || 'AABCM8921N'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">Address</div>
                      <div className="text-slate-800 mt-0.5 line-clamp-2">{customerProfile?.address}</div>
                    </div>
                  </div>

                  {/* TAB 1: FINANCIAL PROFILE & CREDIT (Section 3) */}
                  {activeProfileTab === 'financials' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#0E1035] uppercase tracking-wider flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#2B3D5B]" />
                          <span>Account &amp; Payment Status (14 Key Financial Metrics)</span>
                        </h3>
                        <span className="text-[11px] text-slate-500 font-mono">Format: Indian INR</span>
                      </div>

                      {/* 14 Financial Metrics Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        {/* 1. Credit Limit */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">1. Credit Limit</div>
                          <div className="text-lg font-black text-[#0E1035] font-mono mt-1">
                            ₹{formatINR(customerProfile?.financials?.creditLimit ?? 500000)}
                          </div>
                        </div>

                        {/* 2. Outstanding Amount */}
                        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
                          <div className="text-[11px] font-semibold text-amber-700">2. Outstanding Amount</div>
                          <div className="text-lg font-black text-amber-800 font-mono mt-1">
                            ₹{formatINR(customerProfile?.financials?.outstandingAmount ?? 125000)}
                          </div>
                        </div>

                        {/* 3. Overdue Amount */}
                        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                          <div className="text-[11px] font-semibold text-rose-700">3. Overdue Amount</div>
                          <div className="text-lg font-black text-rose-700 font-mono mt-1">
                            ₹{formatINR(customerProfile?.financials?.overdueAmount ?? 35000)}
                          </div>
                        </div>

                        {/* 4. Due Soon Amount */}
                        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
                          <div className="text-[11px] font-semibold text-blue-700">4. Due Soon Amount</div>
                          <div className="text-lg font-black text-blue-800 font-mono mt-1">
                            ₹{formatINR(customerProfile?.financials?.dueSoonAmount ?? 40000)}
                          </div>
                        </div>

                        {/* 5. Available Credit */}
                        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                          <div className="text-[11px] font-semibold text-emerald-700">5. Available Credit</div>
                          <div className="text-lg font-black text-emerald-700 font-mono mt-1">
                            ₹{formatINR(customerProfile?.financials?.availableCredit ?? 250000)}
                          </div>
                        </div>

                        {/* 6. Payment Terms */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">6. Payment Terms</div>
                          <div className="text-xs font-bold text-slate-800 mt-1">
                            {customerProfile?.financials?.paymentTerms || '30 Days Credit Line'}
                          </div>
                        </div>

                        {/* 7. Next Due Date */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">7. Next Due Date</div>
                          <div className="text-xs font-bold text-slate-800 mt-1 font-mono">
                            {customerProfile?.financials?.nextDueDate || '15 Oct 2026'}
                          </div>
                        </div>

                        {/* 8. Days Overdue */}
                        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-rose-700">8. Days Overdue</div>
                          <div className="text-lg font-black text-rose-700 font-mono mt-1">
                            {customerProfile?.financials?.daysOverdue ?? 14} Days
                          </div>
                        </div>

                        {/* 9. Payment Reliability */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">9. Payment Reliability</div>
                          <div className="text-xs font-bold text-emerald-700 mt-1">
                            {customerProfile?.financials?.paymentReliability || 'EXCELLENT'}
                          </div>
                        </div>

                        {/* 10. Wallet Points */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">10. Loyalty Wallet</div>
                          <div className="text-lg font-black text-[#0E1035] font-mono mt-1">
                            {customerProfile?.financials?.walletPoints ?? 450} pts
                          </div>
                        </div>

                        {/* 11. Business Rating */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">11. Business Rating</div>
                          <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>{customerProfile?.financials?.businessRating ?? 4.8} / 5.0</span>
                          </div>
                        </div>

                        {/* Payment Status Summary */}
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="text-[11px] font-semibold text-slate-500">Account Standing</div>
                          <div className="text-xs font-bold text-rose-700 mt-1">
                            {customerProfile?.financials?.paymentStatus || 'PAYMENT_OVERDUE'}
                          </div>
                        </div>
                      </div>

                      {/* 12. Payment History */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B] mb-3">
                          12. Recent Payment History
                        </h4>
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[#7C8594] font-semibold">
                              <th className="pb-2">Date</th>
                              <th className="pb-2">Reference #</th>
                              <th className="pb-2">Method</th>
                              <th className="pb-2 text-right">Amount</th>
                              <th className="pb-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(customerProfile?.financials?.paymentHistory || [
                              { date: '2026-09-28', ref: 'PAY-RTGS-8910', method: 'NEFT / RTGS', amount: 95000, status: 'CLEARED' },
                              { date: '2026-08-30', ref: 'PAY-NEFT-6421', method: 'Direct Bank Transfer', amount: 140000, status: 'CLEARED' },
                            ]).map((pay: any, idx: number) => (
                              <tr key={idx}>
                                <td className="py-2 text-slate-600 font-mono">{pay.date}</td>
                                <td className="py-2 font-mono font-bold text-[#0E1035]">{pay.ref}</td>
                                <td className="py-2 text-slate-700">{pay.method}</td>
                                <td className="py-2 text-right font-mono font-bold text-slate-900">₹{formatINR(pay.amount)}</td>
                                <td className="py-2 text-center">
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {pay.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 13. Payment Extensions & 14. Payment Promises */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 13. Payment Extensions */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B] mb-2">
                            13. Grace Payment Extensions
                          </h4>
                          <div className="space-y-2">
                            {(customerProfile?.financials?.paymentExtensions || []).map((ext: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                                <div className="flex justify-between font-bold">
                                  <span className="text-[#0E1035]">+{ext.extensionDays} Days Grace</span>
                                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[10px]">{ext.status}</span>
                                </div>
                                <div className="text-slate-600 mt-1">{ext.reason}</div>
                              </div>
                            ))}
                            {(!customerProfile?.financials?.paymentExtensions || customerProfile?.financials?.paymentExtensions.length === 0) && (
                              <div className="text-xs text-slate-400 py-3 text-center">No extension requests on record.</div>
                            )}
                          </div>
                        </div>

                        {/* 14. Payment Promises */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B] mb-2">
                            14. Payment Promises &amp; Commitments
                          </h4>
                          <div className="space-y-2">
                            {(customerProfile?.financials?.paymentPromises || [
                              { promiseDate: '2026-10-18', amount: 35000, note: 'Confirmed settlement via RTGS post batch audit', status: 'PENDING' }
                            ]).map((prom: any, idx: number) => (
                              <div key={idx} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                                <div className="flex justify-between font-bold">
                                  <span className="font-mono text-slate-800">Promise: {prom.promiseDate}</span>
                                  <span className="font-mono text-emerald-700">₹{formatINR(prom.amount)}</span>
                                </div>
                                <div className="text-slate-600 mt-1">{prom.note}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CONTACTS & USERS */}
                  {activeProfileTab === 'users' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                          Authorized Laboratory Users &amp; Roles
                        </h4>
                        <span className="text-xs text-slate-500">Security: Passwords never exposed</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[#7C8594] font-semibold">
                              <th className="py-2.5 px-3">Name</th>
                              <th className="py-2.5 px-3">Email</th>
                              <th className="py-2.5 px-3">Role</th>
                              <th className="py-2.5 px-3">Phone</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(customerProfile?.teamUsers || []).map((u: any) => (
                              <tr key={u.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold text-slate-800">{u.name}</td>
                                <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                                <td className="py-2.5 px-3 font-semibold text-[#0E1035]">{u.role}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{u.phoneNumber}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {u.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ORDERS */}
                  {activeProfileTab === 'orders' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                        Recent Orders Placed by Laboratory
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[#7C8594] font-semibold">
                              <th className="py-2.5 px-3">Order Number</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3">Payment Method</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(customerProfile?.recentOrders || []).map((ord: any) => (
                              <tr key={ord.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#0E1035]">{ord.orderNumber}</td>
                                <td className="py-2.5 px-3 text-slate-600">{ord.createdAt?.split('T')[0]}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{formatINR(ord.totalAmount)}</td>
                                <td className="py-2.5 px-3 text-slate-700">{ord.paymentMethod || 'Credit Line'}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    {ord.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: COMPLAINTS */}
                  {activeProfileTab === 'complaints' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                        Support &amp; Reagent Complaints
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[#7C8594] font-semibold">
                              <th className="py-2.5 px-3">Ticket #</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-center">Priority</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(customerProfile?.serviceTickets || []).map((t: any) => (
                              <tr key={t.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#0E1035]">{t.ticketNumber}</td>
                                <td className="py-2.5 px-3 text-slate-800 font-medium">{t.category}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                    {t.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!customerProfile?.serviceTickets || customerProfile?.serviceTickets.length === 0) && (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-slate-400">No support tickets recorded for this laboratory.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: APPLICATION REQUESTS */}
                  {activeProfileTab === 'applications' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                        Protocol Validation &amp; Application Requests
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[#7C8594] font-semibold">
                              <th className="py-2.5 px-3">Request Type</th>
                              <th className="py-2.5 px-3">Analyzer</th>
                              <th className="py-2.5 px-3">Reagent</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(customerProfile?.applicationRequests || []).map((req: any) => (
                              <tr key={req.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold text-[#0E1035]">{req.requestType}</td>
                                <td className="py-2.5 px-3 text-slate-700">{req.analyzerModel}</td>
                                <td className="py-2.5 px-3 text-slate-600">{req.productName}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                    {req.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!customerProfile?.applicationRequests || customerProfile?.applicationRequests.length === 0) && (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-slate-400">No application requests recorded.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 6: INSTALLED EQUIPMENT */}
                  {activeProfileTab === 'equipment' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                        Installed Diagnostic Analyzers
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {(customerProfile?.installedEquipment || [
                          { model: 'Cobas e411', brand: 'Roche Diagnostics', serialNumber: 'RO-E411-98214', status: 'OPERATIONAL' },
                          { model: 'Architect c4000', brand: 'Abbott Diagnostics', serialNumber: 'AB-C4K-44120', status: 'OPERATIONAL' },
                        ]).map((eq: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span>{eq.model}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                                {eq.status}
                              </span>
                            </div>
                            <div className="text-xs text-[#7C8594] mt-1">{eq.brand}</div>
                            <div className="text-xs text-slate-600 font-mono mt-0.5">SN: {eq.serialNumber}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD CUSTOMER MODAL (Section 2 - Mandatory Fields, Zero Password Exposure) */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2B3D5B]" />
                <h3 className="text-base font-bold text-[#0E1035]">Register New Laboratory / Hospital</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Lab Name * */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lab / Hospital Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    placeholder="e.g. Sterling Clinical Reference Laboratory"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>

                {/* 2. Contact Person * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Deshmukh"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>

                {/* 3. Email * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. director@sterlinglab.com"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>

                {/* 4. Contact Number * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newContactNumber}
                    onChange={(e) => setNewContactNumber(e.target.value)}
                    placeholder="e.g. +91 98201 44552"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>

                {/* 5. Laboratory Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Laboratory Type
                  </label>
                  <select
                    value={newLabType}
                    onChange={(e) => setNewLabType(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  >
                    <option value="Hospital Lab">Hospital Lab</option>
                    <option value="Standalone Diagnostic Center">Standalone Diagnostic Center</option>
                    <option value="Pathology Reference Lab">Pathology Reference Lab</option>
                    <option value="Research Institute">Research Institute</option>
                  </select>
                </div>

                {/* 6. Address * */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Physical Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. Unit 4, Sunrise Medical Park, Andheri East, Mumbai - 400069"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>

                {/* 7. Registration Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Registration / Drug License #
                  </label>
                  <input
                    type="text"
                    value={newRegNumber}
                    onChange={(e) => setNewRegNumber(e.target.value)}
                    placeholder="e.g. MH-TZ2-99882"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                {/* 8. GST Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={newGstNumber}
                    onChange={(e) => setNewGstNumber(e.target.value)}
                    placeholder="e.g. 27AABCS1234F1Z5"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                {/* 9. PAN Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={newPanNumber}
                    onChange={(e) => setNewPanNumber(e.target.value)}
                    placeholder="e.g. AABCS1234F"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                {/* 10. Established Year */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Established Year
                  </label>
                  <input
                    type="number"
                    value={newEstablishedYear}
                    onChange={(e) => setNewEstablishedYear(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                {/* 11. Ownership */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ownership Structure
                  </label>
                  <select
                    value={newOwnership}
                    onChange={(e) => setNewOwnership(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Trust / Foundation">Trust / Foundation</option>
                  </select>
                </div>

                {/* 12. Number of Analyzers */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Number of Analyzers
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newAnalyzers}
                    onChange={(e) => setNewAnalyzers(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                {/* Initial Credit Line */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Approved Initial Credit Limit (INR)
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Customer credentials and initial activation keys will be auto-generated securely without exposing passwords.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Register Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
