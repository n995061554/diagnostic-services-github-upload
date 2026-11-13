import React, { useState } from 'react';
import {
  Building2,
  Cpu,
  FileText,
  AlertTriangle,
  CreditCard,
  User,
  ShieldCheck,
  ChevronRight,
  Download,
  Calendar,
  Wrench,
  Package,
  Plus,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  LogOut,
  Star,
  Award,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import {
  CustomerSite,
  DigitalDocument,
  ReagentExpiryItem,
  DocumentCategoryType,
  CustomerCreditProfile,
  PaymentExtensionRequest,
  CustomerRole
} from '../customerAppTypes';
import {
  EquipmentItem,
  OutstandingInvoice,
  formatINR,
  CUSTOMER_FINANCIALS_DEFAULT
} from '../mobileMockData';
import { ThemePalette } from '../../../utils/themeSystem';

interface MoreTabProps {
  theme: ThemePalette;
  activeSite: CustomerSite;
  sites: CustomerSite[];
  installedEquipment: EquipmentItem[];
  documents: DigitalDocument[];
  expiries: ReagentExpiryItem[];
  invoices: OutstandingInvoice[];
  financials: typeof CUSTOMER_FINANCIALS_DEFAULT;
  creditProfile?: CustomerCreditProfile;
  extensionRequests?: PaymentExtensionRequest[];
  userRole?: CustomerRole;
  onOpenUsersManagement?: () => void;
  onOpenSiteSwitcher: () => void;
  onSelectEquipment: (eq: EquipmentItem) => void;
  onSelectDocument: (doc: DigitalDocument) => void;
  onReplenishExpiryItem: (item: ReagentExpiryItem) => void;
  onOpenPaymentModal: () => void;
  onRequestExtension?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
}

export const MoreTab: React.FC<MoreTabProps> = ({
  theme,
  activeSite,
  sites,
  installedEquipment,
  documents,
  expiries,
  invoices,
  financials,
  creditProfile,
  extensionRequests = [],
  userRole = 'OWNER',
  onOpenUsersManagement,
  onOpenSiteSwitcher,
  onSelectEquipment,
  onSelectDocument,
  onReplenishExpiryItem,
  onOpenPaymentModal,
  onRequestExtension,
  onOpenProfile,
  onLogout
}) => {
  const [activeSection, setActiveSection] = useState<'hub' | 'business' | 'equipment' | 'documents' | 'expiries' | 'ledger'>('hub');
  const [docCategoryFilter, setDocCategoryFilter] = useState<'ALL' | DocumentCategoryType>('ALL');

  const filteredDocuments = documents.filter(doc => {
    if (docCategoryFilter === 'ALL') return true;
    return doc.category === docCategoryFilter;
  });

  const criticalExpiries = expiries.filter(e => e.urgencyLevel === 'CRITICAL');

  const displayCreditLimit = creditProfile?.creditLimit ?? financials.creditLimit;
  const displayAvailableCredit = creditProfile?.availableCredit ?? financials.availableCredit;
  const displayOutstanding = creditProfile?.outstandingAmount ?? (creditProfile as any)?.currentOutstanding ?? financials.totalOutstanding;
  const displayWalletPoints = creditProfile?.walletPoints ?? 1250;
  const displayBusinessRating = creditProfile?.businessRating ?? 4.8;
  const displayReliability = creditProfile?.paymentReliability ?? 'EXCELLENT';
  const displayDaysOverdue = creditProfile?.daysOverdue ?? 0;
  const isOverdue = (creditProfile?.paymentStatus === 'PAYMENT_OVERDUE') || (displayDaysOverdue > 0);

  return (
    <div className="p-4 space-y-4 pb-6 animate-in fade-in text-xs">
      {/* ------------------------------------------------------------------ */}
      {/* 1. ACTIVE SITE SELECTOR CARD */}
      {/* ------------------------------------------------------------------ */}
      <div 
        onClick={onOpenSiteSwitcher}
        className="p-3 bg-white border border-[#D0DEE5] rounded-2xl flex items-center justify-between cursor-pointer shadow-xs hover:border-[#0E1035] transition group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D0DEE5]/30 text-[#0E1035] flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] text-[#7C8594] font-bold uppercase tracking-wider">Active Lab Branch / Location</div>
            <div className="font-extrabold text-xs text-[#0E1035] group-hover:text-[#2B3D5B] transition">
              {activeSite.name}
            </div>
            <div className="text-[10px] text-[#7C8594]">{activeSite.address}, {activeSite.city}</div>
          </div>
        </div>
        <span className="text-[10px] font-black text-[#0E1035] bg-[#D0DEE5]/30 px-2.5 py-1 rounded-lg border border-[#D0DEE5] group-hover:bg-[#D0DEE5]/50">
          Switch &rarr;
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SUB-SECTION BUTTON PILLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none font-bold text-xs">
        {[
          { id: 'hub', label: 'Overview' },
          { id: 'business', label: 'Business Account' },
          { id: 'equipment', label: `Equipment (${installedEquipment.length})` },
          { id: 'documents', label: `Documents (${documents.length})` },
          { id: 'expiries', label: `Expiry Alerts (${expiries.length})` },
          { id: 'ledger', label: 'Financial Ledger' }
        ].map(pill => (
          <button
            key={pill.id}
            onClick={() => setActiveSection(pill.id as any)}
            className={`px-3 py-1.5 rounded-xl shrink-0 transition border cursor-pointer ${
              activeSection === pill.id
                ? 'bg-[#0E1035] text-white border-[#0E1035] shadow-xs font-extrabold'
                : 'bg-white text-[#7C8594] border-[#D0DEE5] hover:bg-slate-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: OVERVIEW HUB */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'hub' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Customer Profile & Partner Tier */}
          <div 
            onClick={onOpenProfile}
            className="p-4 bg-[#0E1035] text-white rounded-3xl space-y-2.5 shadow-md border border-[#15253F] cursor-pointer hover:border-[#D0DEE5] transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D0DEE5] text-[#0E1035] flex items-center justify-center font-black text-sm group-hover:scale-105 transition">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-white truncate">{financials.customerName}</h3>
                  <Sparkles className="w-3.5 h-3.5 text-[#D0DEE5] shrink-0" />
                </div>
                <div className="text-[10px] text-[#D0DEE5]">{financials.partnerLevel} &bull; Revolving Credit Active</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white transition" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/25 p-2 rounded-xl border border-white/10">
              <div>
                <span className="text-white/70 block">GSTIN Number:</span>
                <span className="font-mono font-bold text-white">27AABCA1234F1Z9</span>
              </div>
              <div>
                <span className="text-white/70 block">Drug License:</span>
                <span className="font-mono font-bold text-white">DL-MH-88219</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#D0DEE5] pt-1">
              <span>NABL ISO 15189:2022 Verified</span>
              <span className="font-bold underline underline-offset-2">View Regulatory Profile &rarr;</span>
            </div>
          </div>

          {/* Owner-Only: Users & Permissions Management (Requirement 8) */}
          {userRole === 'OWNER' && onOpenUsersManagement && (
            <div 
              onClick={onOpenUsersManagement}
              className="p-3.5 bg-gradient-to-r from-[#0E1035] via-[#15253F] to-[#2B3D5B] text-white rounded-2xl border border-white/20 shadow-md cursor-pointer hover:border-[#D0DEE5] transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#D0DEE5]">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-white group-hover:text-[#D0DEE5] transition">
                      Users &amp; Permissions
                    </div>
                    <div className="text-[10px] text-white/70">
                      Add Admins, Staff &amp; Viewers &bull; Role-based controls
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Owner
                </span>
              </div>
            </div>
          )}

          {/* Quick Hub Grid Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setActiveSection('business')}
              className="p-3 bg-white rounded-2xl border border-[#D0DEE5] text-left shadow-xs hover:border-[#0E1035] transition space-y-1.5 cursor-pointer"
            >
              <Award className="w-5 h-5 text-[#2B3D5B]" />
              <div className="font-extrabold text-xs text-[#0E1035]">Business Account</div>
              <div className="text-[10px] text-[#7C8594]">{displayWalletPoints} Pts &bull; Rating {displayBusinessRating}★</div>
            </button>

            <button
              onClick={() => setActiveSection('equipment')}
              className="p-3 bg-white rounded-2xl border border-[#D0DEE5] text-left shadow-xs hover:border-[#0E1035] transition space-y-1.5 cursor-pointer"
            >
              <Cpu className="w-5 h-5 text-[#2B3D5B]" />
              <div className="font-extrabold text-xs text-[#0E1035]">Installed Equipment</div>
              <div className="text-[10px] text-[#7C8594]">{installedEquipment.length} Analyzers Registered</div>
            </button>

            <button
              onClick={() => setActiveSection('documents')}
              className="p-3 bg-white rounded-2xl border border-[#D0DEE5] text-left shadow-xs hover:border-[#0E1035] transition space-y-1.5 cursor-pointer"
            >
              <FileText className="w-5 h-5 text-[#0E1035]" />
              <div className="font-extrabold text-xs text-[#0E1035]">Document Vault</div>
              <div className="text-[10px] text-[#7C8594]">{documents.length} Official Records</div>
            </button>

            <button
              onClick={() => setActiveSection('expiries')}
              className="p-3 bg-white rounded-2xl border border-[#D0DEE5] text-left shadow-xs hover:border-[#0E1035] transition space-y-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div className="font-extrabold text-xs text-[#0E1035]">Expiry Alerts</div>
              <div className="text-[10px] text-amber-700 font-bold">{criticalExpiries.length} Lots Need Reorder</div>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: CUSTOMER BUSINESS ACCOUNT (Requirement 20) */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'business' && (
        <div className="space-y-3.5 animate-in fade-in">
          {/* Header Card */}
          <div className="p-4 bg-gradient-to-br from-[#0E1035] via-[#15253F] to-[#2B3D5B] text-white rounded-3xl space-y-3 shadow-md border border-[#15253F]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#D0DEE5] uppercase font-bold tracking-wider">
                  Corporate Credit & Reliability Standing
                </span>
                <h3 className="font-black text-sm text-white">Commercial Business Account</h3>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isOverdue ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}>
                {isOverdue ? 'Overdue' : 'Good Standing'}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-2xl border border-white/10 text-center">
              <div>
                <div className="text-[9px] text-[#D0DEE5]">Credit Limit</div>
                <div className="text-xs font-black font-mono text-white mt-0.5">₹{formatINR(displayCreditLimit)}</div>
              </div>
              <div>
                <div className="text-[9px] text-[#D0DEE5]">Available</div>
                <div className="text-xs font-black font-mono text-[#D0DEE5] mt-0.5">₹{formatINR(displayAvailableCredit)}</div>
              </div>
              <div>
                <div className="text-[9px] text-[#D0DEE5]">Outstanding</div>
                <div className="text-xs font-black font-mono text-amber-300 mt-0.5">₹{formatINR(displayOutstanding)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-white/70 block text-[9px]">Credit Terms</span>
                <strong className="text-white">{creditProfile?.creditDays ?? (creditProfile as any)?.creditPeriodDays ?? 30} Days Net</strong>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-white/70 block text-[9px]">Wallet Points</span>
                <strong className="text-[#D0DEE5]">{displayWalletPoints} pts</strong>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <span className="text-white/70 block text-[9px]">Business Rating</span>
                <strong className="text-amber-300 flex items-center justify-center gap-0.5">
                  <Star className="w-3 h-3 fill-current text-amber-300" />
                  {displayBusinessRating} / 5.0
                </strong>
              </div>
            </div>
          </div>

          {/* Extension Request Action */}
          <div className="p-3.5 bg-white border border-[#D0DEE5] rounded-2xl space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-xs text-[#0E1035]">Payment Extension & Grace Period</h4>
                <p className="text-[10px] text-[#7C8594]">Need additional days for cheque clearance or doctor sign-off?</p>
              </div>
              {onRequestExtension && (
                <button
                  onClick={onRequestExtension}
                  className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Clock className="w-3 h-3" />
                  Request
                </button>
              )}
            </div>

            {/* Extension Requests History */}
            {extensionRequests.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[9px] font-black uppercase text-[#7C8594]">Extension Request History</span>
                {extensionRequests.map(req => (
                  <div key={req.id} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[10px]">
                    <div>
                      <div className="font-bold text-[#0E1035]">{req.requestedDays} Days Requested &bull; {req.reason}</div>
                      <div className="text-[9px] text-[#7C8594]">{req.explanation}</div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Late-Payment Wallet Penalty Policy (Requirement 16) */}
          <div className="p-3 bg-slate-50 border border-[#D0DEE5] rounded-2xl space-y-1 text-[10px] text-[#7C8594]">
            <div className="flex items-center gap-1.5 font-black text-[#0E1035]">
              <HelpCircle className="w-3.5 h-3.5 text-[#2B3D5B]" />
              Wallet Point Late Payment Policy
            </div>
            <p>
              Standard credit period is 30 days. Payments beyond 30 days incur <strong>1.0 pt/day</strong> penalty. Approved grace extensions are charged at only <strong>0.50 pt/day</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: INSTALLED EQUIPMENT & WARRANTY */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'equipment' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0E1035]" />
              MY INSTALLED INSTRUMENTS ({installedEquipment.length})
            </h3>
            <span className="text-[10px] text-[#7C8594]">Strictly Zero Prices</span>
          </div>

          <div className="space-y-2.5">
            {installedEquipment.map(eq => (
              <div
                key={eq.id}
                onClick={() => onSelectEquipment(eq)}
                className="bg-white rounded-2xl border border-[#D0DEE5] p-3 shadow-xs hover:border-[#0E1035] transition cursor-pointer group space-y-2"
              >
                <div className="flex gap-3">
                  <img
                    src={eq.imageUrl}
                    alt={eq.name}
                    className="w-16 h-16 rounded-xl object-contain bg-slate-50 p-1 border border-[#D0DEE5] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-[#2B3D5B] uppercase">{eq.companyName}</span>
                      <span className="text-[8px] font-black bg-[#D0DEE5]/60 text-[#0E1035] px-1.5 py-0.2 rounded-full">
                        {eq.status || 'Active'}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs text-[#0E1035] truncate mt-0.5 group-hover:text-[#2B3D5B] transition">
                      {eq.name}
                    </h4>
                    <div className="text-[10px] text-[#7C8594] mt-0.5">Model: {eq.modelNumber}</div>
                    <div className="text-[9px] text-[#7C8594]">Serial: {eq.serialNumber || 'SN-ROC-88912'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-[#7C8594]">
                  <span>Next PM: <strong className="text-[#0E1035]">{eq.nextPmDueDate || '15 Nov 2026'}</strong></span>
                  <span className="font-bold text-[#0E1035] group-hover:underline">Service History & Brochure &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: DIGITAL DOCUMENTS VAULT */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'documents' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0E1035]" />
              DIGITAL DOCUMENT CENTER ({filteredDocuments.length})
            </h3>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
            {['ALL', 'TAX_INVOICE', 'SERVICE_REPORT', 'CALIBRATION_CERT', 'COA_QUALITY', 'MSDS_IFU'].map(cat => (
              <button
                key={cat}
                onClick={() => setDocCategoryFilter(cat as any)}
                className={`px-2.5 py-1 rounded-lg border font-bold shrink-0 cursor-pointer ${
                  docCategoryFilter === cat ? 'bg-[#0E1035] text-white border-[#0E1035]' : 'bg-white text-[#7C8594] border-[#D0DEE5]'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="p-3 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 shadow-xs hover:border-[#0E1035] transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#D0DEE5]/30 text-[#0E1035] flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase text-[#2B3D5B] bg-[#D0DEE5]/50 px-1.5 py-0.2 rounded">
                        {doc.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[9px] text-[#7C8594] font-mono">{doc.referenceNumber}</span>
                    </div>
                    <h4 className="font-extrabold text-xs text-[#0E1035] truncate mt-0.5 group-hover:text-[#2B3D5B]">
                      {doc.title}
                    </h4>
                    <div className="text-[9px] text-[#7C8594]">{doc.date} &bull; {doc.fileSize}</div>
                  </div>
                </div>

                <Download className="w-4 h-4 text-[#7C8594] group-hover:text-[#0E1035] shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: REAGENT EXPIRIES & REPLENISHMENT */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'expiries' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              REAGENT EXPIRY TRACKER ({expiries.length})
            </h3>
          </div>

          <div className="space-y-2">
            {expiries.map(item => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase text-[#7C8594]">{item.companyName}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                      item.urgencyLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.daysRemaining}d Left
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-[#0E1035] mt-0.5">{item.productName}</h4>
                  <div className="text-[9px] text-[#7C8594]">Lot: {item.lotNumber} &bull; Exp: {item.expiryDate}</div>
                </div>

                <button
                  onClick={() => onReplenishExpiryItem(item)}
                  className="px-2.5 py-1 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  Replenish
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION: FINANCIAL LEDGER & INVOICE SETTLEMENT */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'ledger' && (
        <div className="space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#0E1035]" />
              INSTITUTIONAL FINANCIAL LEDGER
            </h3>
            <button
              onClick={onOpenPaymentModal}
              className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
            >
              Settle Invoices Now
            </button>
          </div>

          {/* Aging Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-[#0E1035] text-white rounded-2xl shadow-xs border border-[#15253F]">
              <div className="text-[9px] text-[#D0DEE5] uppercase font-bold">Total Outstanding</div>
              <div className="text-base font-black text-white font-mono mt-0.5">
                ₹{formatINR(displayOutstanding)}
              </div>
              <div className="text-[9px] text-[#D0DEE5] mt-1">{invoices.length} Unsettled Invoices</div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl">
              <div className="text-[9px] uppercase font-bold">Overdue Amount</div>
              <div className="text-base font-black font-mono mt-0.5 text-rose-700">
                ₹{formatINR(financials.overdueAmount)}
              </div>
              <div className="text-[9px] mt-1 text-rose-800">Requires immediate clearing</div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-2">
            {invoices.map(inv => (
              <div
                key={inv.id}
                className="p-3 bg-white rounded-2xl border border-[#D0DEE5] flex items-center justify-between gap-2 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold font-mono text-xs text-[#0E1035]">{inv.invoiceNumber}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${
                      inv.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {inv.status === 'OVERDUE' ? `${inv.overdueDays}d Overdue` : 'Current'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7C8594] mt-0.5">{inv.productSummary}</div>
                  <div className="text-[9px] text-[#7C8594]">Due: {inv.dueDate}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-xs text-[#0E1035]">
                    ₹{formatINR(inv.amount)}
                  </div>
                  <button
                    onClick={onOpenPaymentModal}
                    className="text-[10px] text-[#0E1035] font-bold hover:underline"
                  >
                    Settle &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. CLEAN LOGOUT OPTION (Requirement 22) */}
      {/* ------------------------------------------------------------------ */}
      <div className="pt-2 border-t border-[#D0DEE5]/60 flex justify-center">
        <button
          onClick={onLogout}
          className="px-4 py-2 text-[#7C8594] hover:text-rose-600 rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          title="Sign out of Diagnostic Customer Portal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
