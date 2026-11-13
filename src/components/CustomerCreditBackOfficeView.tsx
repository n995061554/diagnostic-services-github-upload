import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Award,
  Star,
  Coins,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Check,
  Building2,
  Calendar,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Layers,
  MessageSquare
} from 'lucide-react';
import { formatINR } from './mobile/mobileMockData';

interface CreditProfile {
  customerId: string;
  customerName: string;
  companyName: string;
  creditLimit: number;
  availableCredit: number;
  currentOutstanding: number;
  creditPeriodDays: number;
  dueDate: string;
  daysOverdue: number;
  paymentStatus: 'GOOD_STANDING' | 'PAYMENT_OVERDUE' | 'EXTENSION_REQUESTED' | 'CREDIT_HOLD';
  hasApprovedExtension: boolean;
  approvedExtensionUntil: string | null;
  walletPoints: number;
  starRating: number;
  paymentPromises: Array<{
    id: string;
    originalDueDate: string;
    requestedExtensionDays: number;
    promisedPaymentDate: string;
    approvedExtensionDays?: number;
    missed: boolean;
  }>;
}

interface ExtensionRequest {
  id: string;
  customerId: string;
  customerName: string;
  companyName: string;
  siteName: string;
  invoiceOrOrderId: string;
  outstandingAmount: number;
  originalDueDate: string;
  requestedDays: number;
  reason: string;
  explanation: string;
  promisedPaymentDate: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  approvedDays?: number;
  approvedUntil?: string;
  internalNotes?: string;
  createdAt: string;
}

interface PolicyConfig {
  standardCreditDays: number;
  gracePeriodDays: number;
  standardLatePenaltyPointsPerDay: number;
  approvedGracePenaltyPointsPerDay: number;
  maxExtensionDays: number;
  isPenaltyBearing: boolean;
  ratingConfig: {
    baseRating: number;
    onTimePaymentBonus: number;
    latePaymentDeductionPerDay: number;
    missedPromiseDeduction: number;
    minRating: number;
    maxRating: number;
  };
}

interface Testimonial {
  id: string;
  customerName: string;
  companyName: string;
  laboratory: string;
  testimonial: string;
  rating: number;
  isActive: boolean;
  displayOrder: number;
  avatarUrl: string;
}

interface RelatedProduct {
  id: string;
  primaryProductId: string;
  analyte: string;
  productName: string;
  companyName: string;
  packSize: string;
  customerNetPrice: number;
  mrp: number;
  compatibilitySpecs: string;
  analyzerCompatibility: string;
  inStock: boolean;
}

export const CustomerCreditBackOfficeView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'extensions' | 'credit_profiles' | 'wallet_policy' | 'testimonials' | 'related_products' | 'sla_config'>('extensions');
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [extensions, setExtensions] = useState<ExtensionRequest[]>([]);
  const [creditProfiles, setCreditProfiles] = useState<CreditProfile[]>([]);
  const [policy, setPolicy] = useState<PolicyConfig | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);

  // Service Response SLA Config State
  const [slaConfig, setSlaConfig] = useState<{
    criticalResponseHours: number;
    highResponseHours: number;
    mediumResponseHours: number;
    lowResponseHours: number;
    serviceTierName: string;
    dispatchDescription: string;
    disclaimer: string;
  }>({
    criticalResponseHours: 4,
    highResponseHours: 8,
    mediumResponseHours: 24,
    lowResponseHours: 48,
    serviceTierName: 'Contracted Service Level Agreement',
    dispatchDescription: 'Emergency biomedical field engineer dispatch per contracted response SLA',
    disclaimer: 'Response times subject to active AMC/CMC service agreement terms and regional technical centre proximity.'
  });
  const [isSavingSla, setIsSavingSla] = useState<boolean>(false);

  // Extension Review Modal
  const [selectedExtension, setSelectedExtension] = useState<ExtensionRequest | null>(null);
  const [approvedDaysInput, setApprovedDaysInput] = useState<number>(10);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Credit Edit Modal
  const [selectedCreditUser, setSelectedCreditUser] = useState<CreditProfile | null>(null);
  const [editCreditLimit, setEditCreditLimit] = useState<number>(0);
  const [editCreditDays, setEditCreditDays] = useState<number>(30);
  const [editOutstanding, setEditOutstanding] = useState<number>(0);

  // Interactive Penalty Formula Tester
  const [testCreditDays, setTestCreditDays] = useState<number>(30);
  const [testActualPaidDay, setTestActualPaidDay] = useState<number>(90);
  const [testGraceDays, setTestGraceDays] = useState<number>(30);
  const [testPenaltyResult, setTestPenaltyResult] = useState<any>(null);

  // Testimonial Form State
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newLabName, setNewLabName] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newTestimonialText, setNewTestimonialText] = useState<string>('');
  const [newRating, setNewRating] = useState<number>(5);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [extRes, credRes, polRes, testRes, relRes, slaRes] = await Promise.all([
        fetch('/api/v1/admin/credit/extension-requests'),
        fetch('/api/v1/admin/credit/customers'),
        fetch('/api/v1/admin/credit/policy'),
        fetch('/api/v1/admin/testimonials'),
        fetch('/api/v1/customer/related-products'),
        fetch('/api/v1/service/sla-config')
      ]);

      if (extRes.ok) {
        const d = await extRes.json();
        setExtensions(d.data || []);
      }
      if (credRes.ok) {
        const d = await credRes.json();
        setCreditProfiles(d.data || []);
      }
      if (polRes.ok) {
        const d = await polRes.json();
        setPolicy(d.data);
      }
      if (testRes.ok) {
        const d = await testRes.json();
        setTestimonials(d.data || []);
      }
      if (slaRes.ok) {
        const d = await slaRes.json();
        if (d.data) setSlaConfig(d.data);
      }
      if (relRes.ok) {
        const d = await relRes.json();
        setRelatedProducts(d.data || []);
      }
    } catch (err) {
      console.error('Failed to load credit back-office data', err);
      showNotification('error', 'Failed to synchronize back-office records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Extension Review (Approve / Reject)
  const handleReviewExtension = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedExtension) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/v1/admin/credit/extension-requests/${selectedExtension.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          approvedDays: approvedDaysInput,
          internalNotes: reviewNotes,
          reviewerName: 'Lead Credit Officer'
        })
      });

      if (res.ok) {
        const resData = await res.json();
        showNotification('success', resData.message || `Extension request #${selectedExtension.id} resolved.`);
        setSelectedExtension(null);
        setReviewNotes('');
        fetchData();
      } else {
        const errData = await res.json();
        showNotification('error', errData.message || 'Operation failed.');
      }
    } catch (err) {
      showNotification('error', 'Network error while resolving extension.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Update Customer Credit Limit
  const handleUpdateCreditProfile = async () => {
    if (!selectedCreditUser) return;
    try {
      const res = await fetch(`/api/v1/admin/credit/customers/${selectedCreditUser.customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditLimit: editCreditLimit,
          creditPeriodDays: editCreditDays,
          currentOutstanding: editOutstanding
        })
      });

      if (res.ok) {
        showNotification('success', `Credit terms updated for ${selectedCreditUser.customerName}.`);
        setSelectedCreditUser(null);
        fetchData();
      } else {
        showNotification('error', 'Failed to update credit terms.');
      }
    } catch (err) {
      showNotification('error', 'Network error updating credit.');
    }
  };

  // Run Test Calculation of Wallet Penalty Formula
  const handleCalculateTestPenalty = async () => {
    try {
      const res = await fetch('/api/v1/admin/credit/calculate-penalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditPeriodDays: testCreditDays,
          actualPaidDay: testActualPaidDay,
          approvedGraceDays: testGraceDays
        })
      });
      if (res.ok) {
        const d = await res.json();
        setTestPenaltyResult(d);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Testimonial
  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newTestimonialText) return;

    try {
      const res = await fetch('/api/v1/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newCustomerName,
          companyName: newCompanyName || 'Apex Diagnostic Network',
          laboratory: newLabName || 'Clinical Biochemistry Lab',
          testimonial: newTestimonialText,
          rating: newRating,
          displayOrder: testimonials.length + 1
        })
      });
      if (res.ok) {
        showNotification('success', 'Customer testimonial registered successfully.');
        setNewCustomerName('');
        setNewLabName('');
        setNewCompanyName('');
        setNewTestimonialText('');
        fetchData();
      }
    } catch (err) {
      showNotification('error', 'Failed to add testimonial.');
    }
  };

  // Toggle Testimonial Active
  const handleToggleTestimonial = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      showNotification('error', 'Failed to toggle testimonial state.');
    }
  };

  const handleSaveSlaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSla(true);
    try {
      const res = await fetch('/api/v1/admin/service/sla-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slaConfig)
      });
      if (res.ok) {
        showNotification('success', 'Service response SLA policies successfully saved to backend.');
      } else {
        showNotification('error', 'Failed to save service SLA configuration.');
      }
    } catch {
      showNotification('error', 'Network error saving service SLA configuration.');
    } finally {
      setIsSavingSla(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Toast Notification Banner */}
      {notification && (
        <div 
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg border transition-all animate-in slide-in-from-top ${
            notification.type === 'success' 
              ? 'bg-[#E2F3EB] text-[#0D5334] border-[#1E8E5A]/30' 
              : 'bg-[#FDE4E4] text-[#9B1C1C] border-[#E02424]/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#1E8E5A]" /> : <AlertTriangle className="w-4 h-4 text-[#E02424]" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header Banner - Navy Blue Foundation */}
      <div className="bg-[#0E1035] text-white p-6 rounded-3xl shadow-xl border border-[#15253F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2B3D5B] text-[#D0DEE5]">
              Executive Back-Office Operations
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Customer Credit, Grace Extensions & Brand Matrix</h1>
          <p className="text-xs text-[#D0DEE5] mt-0.5">
            Backend-enforced credit terms, overdue order restrictions, wallet late-payment penalties, customer ratings, and cross-brand comparisons.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl bg-[#15253F] hover:bg-[#2B3D5B] text-[#D0DEE5] text-xs font-bold flex items-center gap-1.5 transition border border-[#2B3D5B] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Records
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'extensions', label: `Payment Extension Requests (${extensions.filter(e => e.status === 'PENDING_REVIEW').length} Pending)`, icon: Clock },
          { id: 'credit_profiles', label: `Customer Credit Profiles (${creditProfiles.length})`, icon: CreditCard },
          { id: 'wallet_policy', label: 'Wallet Penalties & Star Ratings', icon: Coins },
          { id: 'sla_config', label: `Service Response SLAs (${slaConfig.criticalResponseHours}h STAT)`, icon: ShieldCheck },
          { id: 'testimonials', label: `Testimonials CMS (${testimonials.length})`, icon: MessageSquare },
          { id: 'related_products', label: `Related Product Matrix (${relatedProducts.length})`, icon: Layers }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap shadow-2xs border ${
                isActive 
                  ? 'bg-[#0E1035] text-white border-[#0E1035] shadow-xs' 
                  : 'bg-white text-[#7C8594] border-[#D0DEE5] hover:bg-slate-50 hover:text-[#0E1035]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: PAYMENT EXTENSION WORKFLOW */}
      {activeSection === 'extensions' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#0E1035]">Payment Extension Requests</h3>
                <p className="text-xs text-[#7C8594]">Review customer grace period requests. Approved extensions unblock ordering rights without penalty.</p>
              </div>
            </div>

            {extensions.length === 0 ? (
              <div className="p-8 text-center text-[#7C8594] text-xs">No payment extension requests registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D0DEE5] text-[10px] font-black uppercase text-[#7C8594] bg-slate-50/70">
                      <th className="p-3">Request ID & Date</th>
                      <th className="p-3">Customer & Site</th>
                      <th className="p-3">Outstanding</th>
                      <th className="p-3">Requested Days</th>
                      <th className="p-3">Customer Reason</th>
                      <th className="p-3">Promised Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extensions.map(req => {
                      const isPending = req.status === 'PENDING_REVIEW';
                      const isApproved = req.status === 'APPROVED';
                      return (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-mono font-bold text-[#0E1035]">
                            <div>#{req.id}</div>
                            <div className="text-[10px] text-[#7C8594] font-normal">{new Date(req.createdAt).toLocaleDateString()}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-extrabold text-[#0E1035]">{req.customerName}</div>
                            <div className="text-[10px] text-[#7C8594]">{req.companyName} &bull; {req.siteName}</div>
                          </td>
                          <td className="p-3 font-mono font-black text-rose-600">
                            ₹{formatINR(req.outstandingAmount)}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-[#D0DEE5]/60 text-[#0E1035] font-bold text-[11px]">
                              +{req.requestedDays} Days
                            </span>
                          </td>
                          <td className="p-3 max-w-[200px]">
                            <div className="font-bold text-[#0E1035] truncate">{req.reason}</div>
                            <div className="text-[10px] text-[#7C8594] truncate">{req.explanation}</div>
                          </td>
                          <td className="p-3 font-mono text-[#2B3D5B] font-semibold">
                            {req.promisedPaymentDate}
                          </td>
                          <td className="p-3">
                            {isPending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                                UNDER REVIEW
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                APPROVED (+{req.approvedDays}d)
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                REJECTED
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isPending ? (
                              <button
                                onClick={() => {
                                  setSelectedExtension(req);
                                  setApprovedDaysInput(req.requestedDays);
                                }}
                                className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                              >
                                Review Request &rarr;
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#7C8594] italic">
                                {req.internalNotes || 'Resolved'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: CUSTOMER CREDIT PROFILES */}
      {activeSection === 'credit_profiles' && (
        <div className="bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#0E1035]">Customer Credit & Ledger Limits</h3>
              <p className="text-xs text-[#7C8594]">Manage credit limits, payment cycles, outstanding ledger balance, and unblock overdue accounts.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creditProfiles.map(profile => {
              const isOverdue = profile.daysOverdue > 0 && !profile.hasApprovedExtension;
              return (
                <div 
                  key={profile.customerId}
                  className={`p-4 rounded-2xl border transition shadow-2xs flex flex-col justify-between ${
                    isOverdue 
                      ? 'bg-rose-50/40 border-rose-200' 
                      : 'bg-white border-[#D0DEE5]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#7C8594] font-bold">ID: {profile.customerId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {profile.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-xs text-[#0E1035]">{profile.customerName}</h4>
                      <p className="text-[10px] text-[#7C8594]">{profile.companyName}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#7C8594]">Credit Limit:</span>
                        <span className="font-mono font-bold text-[#0E1035]">₹{formatINR(profile.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7C8594]">Outstanding:</span>
                        <span className="font-mono font-black text-rose-600">₹{formatINR(profile.currentOutstanding)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7C8594]">Available:</span>
                        <span className="font-mono font-bold text-emerald-700">₹{formatINR(profile.availableCredit)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1">
                        <span className="text-[#7C8594]">Credit Days:</span>
                        <span className="font-bold text-[#0E1035]">{profile.creditPeriodDays} Days</span>
                      </div>
                      {isOverdue && (
                        <div className="flex justify-between text-rose-700 font-bold">
                          <span>Overdue By:</span>
                          <span>{profile.daysOverdue} Days (Orders Blocked)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1 text-amber-700 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{profile.starRating} / 5.0 Rating</span>
                      </div>
                      <div className="flex items-center gap-1 text-indigo-700 font-mono font-bold">
                        <Coins className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{profile.walletPoints} pts</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCreditUser(profile);
                      setEditCreditLimit(profile.creditLimit);
                      setEditCreditDays(profile.creditPeriodDays);
                      setEditOutstanding(profile.currentOutstanding);
                    }}
                    className="mt-3 w-full py-2 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] rounded-xl text-xs font-bold transition cursor-pointer text-center"
                  >
                    Adjust Credit & Terms
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: WALLET POLICY & FORMULA CALCULATOR */}
      {activeSection === 'wallet_policy' && policy && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configured Policy Display */}
            <div className="bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#0E1035]">Configured Late-Payment Policy Formula</h3>
                <p className="text-xs text-[#7C8594]">Server-enforced penalty point deduction rules per Requirement 16.</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-[#7C8594]">Standard Credit Period:</span>
                  <span className="font-bold text-[#0E1035]">{policy.standardCreditDays} Days</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-[#7C8594]">Standard Late Penalty Rate:</span>
                  <span className="font-black text-[#0E1035]">{policy.standardLatePenaltyPointsPerDay} Point / Day</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-[#7C8594]">Approved Grace Extension Penalty Rate:</span>
                  <span className="font-black text-indigo-700">{policy.approvedGracePenaltyPointsPerDay} Point / Day</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-[#7C8594]">Maximum Allowed Extension:</span>
                  <span className="font-bold text-[#0E1035]">{policy.maxExtensionDays} Days</span>
                </div>
              </div>

              <div className="p-4 bg-[#D0DEE5]/30 rounded-2xl border border-[#D0DEE5] text-xs space-y-1">
                <div className="font-bold text-[#0E1035]">Formal Specification Formula (Req 16):</div>
                <p className="text-[#2B3D5B] text-[11px] leading-relaxed">
                  When a customer with 30-day credit pays on Day 90 (60 days late) with 30 days of approved grace:
                  <br />
                  &bull; First 30 late days &times; 1 pt/day = <strong>30 points</strong>
                  <br />
                  &bull; Additional 30 grace-related days &times; 0.50 pt/day = <strong>15 points</strong>
                  <br />
                  &bull; Total deduction = 30 + 15 = <strong>45 points</strong>.
                </p>
              </div>
            </div>

            {/* Live Interactive Verification Calculator */}
            <div className="bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#0E1035]">Interactive Penalty Verification Engine</h3>
                  <p className="text-xs text-[#7C8594]">Test backend formula against actual payment dates.</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-mono text-[10px] font-bold">
                  POST /api/v1/admin/credit/calculate-penalty
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Credit Days</label>
                  <input
                    type="number"
                    value={testCreditDays}
                    onChange={e => setTestCreditDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Actual Paid Day</label>
                  <input
                    type="number"
                    value={testActualPaidDay}
                    onChange={e => setTestActualPaidDay(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Approved Grace Days</label>
                  <input
                    type="number"
                    value={testGraceDays}
                    onChange={e => setTestGraceDays(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateTestPenalty}
                className="w-full py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-black rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                Execute Formula Verification
              </button>

              {testPenaltyResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-900">Total Deduction Result:</span>
                    <span className="text-xl font-black font-mono text-emerald-800">
                      -{testPenaltyResult.data.totalDeduction} Points
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-900 leading-relaxed">
                    {testPenaltyResult.formulaExplanation}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: TESTIMONIALS CMS */}
      {activeSection === 'testimonials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Testimonial Form */}
            <div className="bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-[#0E1035]">Add Diagnostic Testimonial</h3>
              <p className="text-xs text-[#7C8594]">Add verified clinical laboratory testimonials that automatically rotate on the customer mobile home screen.</p>
              
              <form onSubmit={handleAddTestimonial} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Customer / Doctor Name</label>
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Dr. Priya Swaminathan"
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Laboratory / Clinic</label>
                  <input
                    type="text"
                    value={newLabName}
                    onChange={e => setNewLabName(e.target.value)}
                    placeholder="e.g. Metro Diagnostic Centre"
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Organization / Hospital</label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Apex Health Systems"
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Star Rating</label>
                  <select
                    value={newRating}
                    onChange={e => setNewRating(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Satisfactory)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase">Testimonial Quote</label>
                  <textarea
                    rows={3}
                    value={newTestimonialText}
                    onChange={e => setNewTestimonialText(e.target.value)}
                    placeholder="Share feedback on cold-chain stability, reagent turnaround time, or biomedical support..."
                    className="w-full p-2 bg-slate-50 border border-[#D0DEE5] rounded-xl text-xs text-[#0E1035]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-black rounded-xl text-xs transition cursor-pointer shadow-xs"
                >
                  Publish Testimonial
                </button>
              </form>
            </div>

            {/* Testimonials List & Reorder */}
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-3">
              <h3 className="font-extrabold text-sm text-[#0E1035]">Active Customer Testimonials ({testimonials.length})</h3>
              <div className="space-y-3">
                {testimonials.map(t => (
                  <div key={t.id} className="p-3.5 rounded-2xl bg-slate-50 border border-[#D0DEE5] flex items-start justify-between gap-3 shadow-2xs">
                    <img src={t.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-[#D0DEE5] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-[#0E1035]">{t.customerName}</span>
                        <div className="flex text-amber-500">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#7C8594] font-medium">{t.laboratory} &bull; {t.companyName}</div>
                      <p className="text-xs text-[#2B3D5B] mt-1 italic">"{t.testimonial}"</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleTestimonial(t.id, t.isActive)}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black cursor-pointer ${
                          t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {t.isActive ? 'Active' : 'Disabled'}
                      </button>
                      <span className="text-[10px] text-[#7C8594] font-mono">Order: #{t.displayOrder}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: RELATED PRODUCTS MATRIX */}
      {activeSection === 'related_products' && (
        <div className="bg-white p-5 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#0E1035]">Cross-Brand Analyte & Related Product Matrix</h3>
              <p className="text-xs text-[#7C8594]">Enforces genuine clinical analyte comparison (SGPT, Troponin, etc.) across Roche, Abbott, Siemens, Bio-Rad, etc.</p>
            </div>
            <span className="px-2.5 py-1 bg-[#D0DEE5]/50 text-[#0E1035] rounded-full text-[10px] font-bold">
              Analyte-Compatible Kits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {relatedProducts.map(prod => (
              <div key={prod.id} className="p-3.5 rounded-2xl border border-[#D0DEE5] bg-slate-50/50 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#0E1035] bg-[#D0DEE5]/60 px-2 py-0.5 rounded-full">
                      {prod.companyName}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">
                      {prod.inStock ? '✓ Available' : 'On Order'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0E1035] leading-tight">{prod.productName}</h4>
                  <div className="text-[10px] text-[#7C8594]">Analyte: <strong className="text-[#0E1035]">{prod.analyte}</strong></div>
                  <div className="text-[10px] text-[#7C8594]">Pack: {prod.packSize}</div>
                  <div className="text-[10px] text-[#2B3D5B] bg-white p-2 rounded-xl border border-slate-200">
                    <div className="font-bold text-[9px] uppercase text-[#7C8594]">Analyzer Tie-Up:</div>
                    <div className="truncate">{prod.analyzerCompatibility}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 mt-2 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-[#7C8594] line-through">₹{formatINR(prod.mrp)}</span>
                    <div className="font-mono font-black text-xs text-[#0E1035]">₹{formatINR(prod.customerNetPrice)}</div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                    Cross-Brand
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: SERVICE RESPONSE SLA POLICIES */}
      {activeSection === 'sla_config' && (
        <div className="space-y-4">
          <form onSubmit={handleSaveSlaConfig} className="bg-white p-6 rounded-3xl border border-[#D0DEE5] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#D0DEE5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0E1035]" />
                  <h3 className="font-extrabold text-sm text-[#0E1035]">Contractual Service Response SLA Configuration</h3>
                </div>
                <p className="text-xs text-[#7C8594] mt-0.5">
                  Configure biomedical engineering on-site response times and service tier terms. Only verified, active SLA policies are displayed in customer apps.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSavingSla}
                className="px-5 py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-black rounded-xl text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingSla ? 'Saving...' : 'Save Configured SLA Policies'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Response Hours by Priority */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-[#D0DEE5]">
                <h4 className="text-xs font-black text-[#0E1035] uppercase tracking-wider">
                  Response SLA Hours by Priority Tier
                </h4>
                
                <div>
                  <label className="text-[10px] font-bold text-rose-800 uppercase block">
                    Critical / STAT Breakdown SLA (Hours)
                  </label>
                  <p className="text-[10px] text-[#7C8594] mb-1">Emergency analyzer halt or acute failure</p>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={slaConfig.criticalResponseHours}
                    onChange={e => setSlaConfig(prev => ({ ...prev, criticalResponseHours: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-amber-800 uppercase block">
                    High Priority SLA (Hours)
                  </label>
                  <p className="text-[10px] text-[#7C8594] mb-1">Calibration drift, partial degradation, warning flags</p>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={slaConfig.highResponseHours}
                    onChange={e => setSlaConfig(prev => ({ ...prev, highResponseHours: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-blue-800 uppercase block">
                    Medium Priority SLA (Hours)
                  </label>
                  <p className="text-[10px] text-[#7C8594] mb-1">Standard servicing, scheduled component check</p>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={slaConfig.mediumResponseHours}
                    onChange={e => setSlaConfig(prev => ({ ...prev, mediumResponseHours: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-800 uppercase block">
                    Low Priority / Routine PM SLA (Hours)
                  </label>
                  <p className="text-[10px] text-[#7C8594] mb-1">Routine quarterly maintenance, general inquiry</p>
                  <input
                    type="number"
                    min={1}
                    max={336}
                    value={slaConfig.lowResponseHours}
                    onChange={e => setSlaConfig(prev => ({ ...prev, lowResponseHours: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    required
                  />
                </div>
              </div>

              {/* Service Tier Nomenclature & Disclaimers */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-[#D0DEE5]">
                <h4 className="text-xs font-black text-[#0E1035] uppercase tracking-wider">
                  Service Tier Terms & Disclaimers
                </h4>

                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase block mb-1">
                    Service Tier Display Name
                  </label>
                  <input
                    type="text"
                    value={slaConfig.serviceTierName}
                    onChange={e => setSlaConfig(prev => ({ ...prev, serviceTierName: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    placeholder="e.g. Contracted Service Level Agreement"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase block mb-1">
                    Dispatch Policy Description
                  </label>
                  <input
                    type="text"
                    value={slaConfig.dispatchDescription}
                    onChange={e => setSlaConfig(prev => ({ ...prev, dispatchDescription: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035]"
                    placeholder="e.g. Emergency biomedical field engineer dispatch per contracted response SLA"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7C8594] uppercase block mb-1">
                    Contractual Disclaimer & Geographic Terms
                  </label>
                  <textarea
                    rows={4}
                    value={slaConfig.disclaimer}
                    onChange={e => setSlaConfig(prev => ({ ...prev, disclaimer: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-[#D0DEE5] rounded-xl text-xs text-[#0E1035]"
                    placeholder="e.g. Response times subject to active AMC/CMC service agreement terms and regional technical centre proximity."
                    required
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#D0DEE5] space-y-1">
                  <div className="text-[10px] font-black text-[#0E1035] uppercase">Customer App Display Preview:</div>
                  <div className="flex items-center gap-1.5 text-xs text-[#0E1035] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0E1035]" />
                    <span>{slaConfig.serviceTierName}</span>
                    <span className="text-[9px] bg-[#0E1035] text-white px-2 py-0.5 rounded-full font-mono ml-auto">
                      &le; {slaConfig.criticalResponseHours}h STAT
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7C8594] italic mt-1">
                    {slaConfig.disclaimer}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* EXTENSION REVIEW MODAL */}
      {selectedExtension && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#D0DEE5]">
            <div className="p-4 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D0DEE5]" />
                <h3 className="text-sm font-bold">Review Grace Extension #{selectedExtension.id}</h3>
              </div>
              <button onClick={() => setSelectedExtension(null)} className="p-1 rounded-full hover:bg-white/10">✕</button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-[#0E1035] bg-slate-50/50">
              <div className="p-3 bg-white border border-[#D0DEE5] rounded-xl space-y-1">
                <div className="font-extrabold text-xs">{selectedExtension.customerName} ({selectedExtension.companyName})</div>
                <div className="flex justify-between text-[#7C8594]">
                  <span>Outstanding:</span>
                  <span className="font-mono font-black text-rose-600">₹{formatINR(selectedExtension.outstandingAmount)}</span>
                </div>
                <div className="flex justify-between text-[#7C8594]">
                  <span>Original Due Date:</span>
                  <span className="font-mono text-[#0E1035]">{selectedExtension.originalDueDate}</span>
                </div>
                <div className="flex justify-between text-[#7C8594]">
                  <span>Promised Payment Date:</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedExtension.promisedPaymentDate}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C8594] uppercase">Customer Reason & Explanation</label>
                <div className="p-2.5 bg-white border border-[#D0DEE5] rounded-xl mt-1 text-slate-700">
                  <div className="font-bold text-[#0E1035]">{selectedExtension.reason}</div>
                  <div className="text-[11px] text-[#7C8594] mt-0.5">{selectedExtension.explanation}</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C8594] uppercase">Approved Grace Days</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[5, 10, 15, 30].map(days => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => setApprovedDaysInput(days)}
                      className={`p-2 rounded-xl text-center font-bold text-xs border transition cursor-pointer ${
                        approvedDaysInput === days
                          ? 'bg-[#0E1035] text-white border-[#0E1035]'
                          : 'bg-white text-[#7C8594] border-[#D0DEE5] hover:bg-slate-100'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C8594] uppercase">Internal Credit Officer Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="e.g. Approved per hospital accounts director promise..."
                  className="w-full p-2 bg-white border border-[#D0DEE5] rounded-xl text-xs text-[#0E1035] mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D0DEE5]">
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewExtension('REJECT')}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold transition cursor-pointer"
                >
                  Decline Request
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleReviewExtension('APPROVE')}
                  className="px-5 py-2 rounded-xl bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-black transition cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve +{approvedDaysInput} Days
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST CREDIT TERMS MODAL */}
      {selectedCreditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#D0DEE5]">
            <div className="p-4 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#D0DEE5]" />
                <h3 className="text-sm font-bold">Edit Credit Terms: {selectedCreditUser.customerName}</h3>
              </div>
              <button onClick={() => setSelectedCreditUser(null)} className="p-1 rounded-full hover:bg-white/10">✕</button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-[#0E1035] bg-slate-50/50">
              <div>
                <label className="text-[10px] font-bold text-[#7C8594] uppercase">Sanctioned Credit Limit (₹ INR)</label>
                <input
                  type="number"
                  value={editCreditLimit}
                  onChange={e => setEditCreditLimit(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035] mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C8594] uppercase">Credit Period Cycle (Days)</label>
                <input
                  type="number"
                  value={editCreditDays}
                  onChange={e => setEditCreditDays(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035] mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7C8594] uppercase">Current Outstanding Balance (₹ INR)</label>
                <input
                  type="number"
                  value={editOutstanding}
                  onChange={e => setEditOutstanding(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-[#D0DEE5] rounded-xl text-xs font-bold text-[#0E1035] mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D0DEE5]">
                <button
                  type="button"
                  onClick={() => setSelectedCreditUser(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-[#D0DEE5] text-[#0E1035] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateCreditProfile}
                  className="px-5 py-2 rounded-xl bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-black transition cursor-pointer shadow-xs"
                >
                  Save Credit Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
