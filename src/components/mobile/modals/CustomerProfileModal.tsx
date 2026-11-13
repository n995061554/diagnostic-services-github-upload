import React, { useState } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Bell,
  Lock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  FileCheck2,
  Smartphone
} from 'lucide-react';
import { ThemePalette } from '../../../utils/themeSystem';
import { CustomerSite, CustomerRole } from '../customerAppTypes';
import { formatINR } from '../mobileMockData';

interface CustomerProfileModalProps {
  theme: ThemePalette;
  activeSite: CustomerSite;
  sites: CustomerSite[];
  financials: {
    customerName: string;
    partnerLevel: string;
    creditLimit: number;
    availableCredit: number;
    totalOutstanding: number;
  };
  userRole?: CustomerRole;
  userName?: string;
  userEmail?: string;
  onClose: () => void;
  onOpenSiteSwitcher: () => void;
  onShowToast: (msg: string) => void;
  onOpenUsersManagement?: () => void;
  onLogout?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  theme,
  activeSite,
  sites,
  financials,
  userRole = 'OWNER',
  userName,
  userEmail,
  onClose,
  onOpenSiteSwitcher,
  onShowToast,
  onOpenUsersManagement,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'accreditations' | 'commercial' | 'security'>('profile');
  const [whatsappAlerts, setWhatsappAlerts] = useState<boolean>(true);
  const [coldChainAlerts, setColdChainAlerts] = useState<boolean>(true);
  const [biometricLogin, setBiometricLogin] = useState<boolean>(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div 
        className="w-full max-w-md bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-[#D0DEE5] overflow-hidden text-[#0E1035]"
      >
        {/* Header */}
        <div 
          className="px-4 py-3.5 flex items-center justify-between text-white bg-[#0E1035]"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D0DEE5]" />
            <div>
              <h2 className="text-xs font-black tracking-wide uppercase">Institutional Customer Profile</h2>
              <span className="text-[10px] text-white/70">NABL & Clinical Regulatory Profile</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lab Overview Banner */}
        <div className="p-4 bg-white border-b border-[#D0DEE5] flex items-center gap-3">
          <div 
            className="w-13 h-13 rounded-2xl flex items-center justify-center font-black text-base shadow-sm shrink-0 bg-[#D0DEE5] text-[#0E1035]"
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-[#0E1035] truncate">{financials.customerName}</h3>
              <Sparkles className="w-3.5 h-3.5 text-[#2B3D5B] shrink-0" />
            </div>
            <div className="text-[11px] text-[#7C8594] truncate">{activeSite.name} &bull; {activeSite.city}</div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                userRole === 'OWNER'
                  ? 'bg-amber-500/20 text-amber-800 border-amber-300'
                  : userRole === 'ADMIN'
                  ? 'bg-blue-500/20 text-blue-800 border-blue-300'
                  : 'bg-slate-500/20 text-slate-800 border-slate-300'
              }`}>
                Role: {userRole}
              </span>
              <span className="text-[9px] font-bold text-[#0E1035] flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 text-[#0E1035]" />
                NABL Accredited
              </span>
              {userName && (
                <span className="text-[9px] text-[#7C8594] truncate">
                  &bull; {userName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#D0DEE5] bg-slate-100 p-1 gap-1 text-[11px] font-bold">
          {[
            { id: 'profile', label: 'Facility Info' },
            { id: 'accreditations', label: 'NABL & Certs' },
            { id: 'commercial', label: 'Credit & PO' },
            { id: 'security', label: 'Preferences' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-[#0E1035] shadow-xs font-extrabold border border-[#D0DEE5]'
                  : 'text-[#7C8594] hover:text-[#0E1035]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* TAB 1: FACILITY INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] space-y-2 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider block">
                  Active Clinical Branch
                </span>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0E1035]">{activeSite.name}</h4>
                    <p className="text-[10px] text-[#7C8594] mt-0.5">{activeSite.address}, {activeSite.city}</p>
                    <span className="text-[10px] text-[#0E1035] font-medium block mt-1">
                      Operating Hours: 24/7 Central Trauma & Diagnostic Coverage
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSiteSwitcher();
                    }}
                    className="px-2.5 py-1 bg-[#D0DEE5]/40 hover:bg-[#D0DEE5] text-[#0E1035] font-bold rounded-lg text-[10px] transition cursor-pointer"
                  >
                    Switch Site
                  </button>
                </div>
              </div>

              {/* Lab Leadership */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] space-y-2.5 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider block">
                  Clinical & Technical Leadership
                </span>
                
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <div className="font-extrabold text-[#0E1035]">Dr. Arvind Kulkarni</div>
                      <div className="text-[9px] text-[#7C8594]">Lab Director & Chief Pathologist (MD)</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#0E1035] font-bold">MCI-48291</span>
                  </div>

                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <div className="font-extrabold text-[#0E1035]">Dr. Sunita Rao</div>
                      <div className="text-[9px] text-[#7C8594]">Quality Assurance Manager (PhD)</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#0E1035] font-bold">NABL-QA-09</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#0E1035]">Mr. Rajesh Deshmukh</div>
                      <div className="text-[9px] text-[#7C8594]">Chief Biomedical Equipment Incharge</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#0E1035] font-bold">+91 98765 43212</span>
                  </div>
                </div>
              </div>

              {/* Direct Support Account Manager */}
              <div className="bg-[#D0DEE5]/25 rounded-2xl p-3.5 border border-[#D0DEE5] space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0E1035]" />
                  <span className="font-black text-xs text-[#0E1035]">Dedicated Institutional Account Manager</span>
                </div>
                <div className="text-[11px] text-[#0E1035] space-y-0.5">
                  <div className="font-bold">Vikram Sethi &bull; Senior Biomedical Specialist</div>
                  <div className="text-[#7C8594]">Direct Mobile: +91 98450 11992 (24/7 Line)</div>
                  <div className="text-[#7C8594]">Email: vikram.sethi@a2zdiagnostics.com</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCREDITATIONS & REGULATORY CERTS */}
          {activeTab === 'accreditations' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] space-y-3 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider block">
                  Regulatory & Compliance Identifiers
                </span>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-[#D0DEE5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#0E1035]" />
                      <div>
                        <div className="font-bold text-[#0E1035]">NABL ISO 15189:2022</div>
                        <div className="text-[9px] text-[#7C8594]">Valid through: 31 Dec 2027</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-[#0E1035]">MC-2849</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-[#D0DEE5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-[#2B3D5B]" />
                      <div>
                        <div className="font-bold text-[#0E1035]">GSTIN Registration</div>
                        <div className="text-[9px] text-[#7C8594]">Maharashtra State GST Code 27</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-[#0E1035]">27AABCA1234F1Z9</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-[#D0DEE5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0E1035]" />
                      <div>
                        <div className="font-bold text-[#0E1035]">Drug License (Form 20B/21B)</div>
                        <div className="text-[9px] text-[#7C8594]">FDA Maharashtra Diagnostic Grade</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-[#0E1035]">MH-TZ4-DL-88219</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-[#D0DEE5] text-[10px] text-[#7C8594] space-y-1">
                <span className="font-extrabold text-[#0E1035] block">Periodic Audit Status:</span>
                <p>
                  All cold-chain lots dispatched to this institutional account undergo secondary verification under NABL Clause 5.3 standards with calibrated PT100 temperature loggers.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: COMMERCIAL CREDIT & PURCHASING POWER */}
          {activeTab === 'commercial' && (
            <div className="space-y-3 animate-in fade-in">
              <div 
                className="p-4 rounded-3xl text-white shadow-md space-y-3 bg-[#0E1035]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#D0DEE5] font-black uppercase tracking-wider">
                    Institutional Revolving Credit
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    Net 30 Days Term
                  </span>
                </div>

                <div>
                  <div className="text-xl font-mono font-black">₹{formatINR(financials.availableCredit)}</div>
                  <div className="text-[10px] text-white/70">Available Purchasing Power</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-[10px]">
                  <div>
                    <span className="text-white/70 block">Total Credit Line:</span>
                    <span className="font-mono font-bold">₹{formatINR(financials.creditLimit)}</span>
                  </div>
                  <div>
                    <span className="text-white/70 block">Current Outstanding:</span>
                    <span className="font-mono font-bold text-amber-300">₹{formatINR(financials.totalOutstanding)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] space-y-2 text-[11px] shadow-xs">
                <span className="font-extrabold text-[#0E1035] block">Billing & PO Preferences</span>
                <div className="space-y-1.5 text-[#7C8594]">
                  <div className="flex justify-between">
                    <span>Tax Invoice Mode:</span>
                    <span className="font-bold text-[#0E1035]">GST E-Invoice (IRN Embedded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold text-[#0E1035]">Direct Corporate NEFT / RTGS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Dock Instructions:</span>
                    <span className="font-bold text-[#0E1035]">Cold Receipt Dock #3 (Ground Fl.)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREFERENCES & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-white rounded-2xl p-3.5 border border-[#D0DEE5] space-y-3 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-[#7C8594] tracking-wider block">
                  Automated Diagnostic Notifications
                </span>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#0E1035]">Cold-Chain Excursion Alerts</div>
                      <div className="text-[10px] text-[#7C8594]">Instant ping if lot temperature &lt; 2°C or &gt; 8°C</div>
                    </div>
                    <button
                      onClick={() => setColdChainAlerts(!coldChainAlerts)}
                      className={`w-10 h-6 rounded-full p-0.5 transition cursor-pointer ${
                        coldChainAlerts ? 'bg-[#0E1035]' : 'bg-[#D0DEE5]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition ${
                        coldChainAlerts ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#0E1035]">WhatsApp Critical Desk Updates</div>
                      <div className="text-[10px] text-[#7C8594]">Dispatch alerts & engineer ETA via WhatsApp</div>
                    </div>
                    <button
                      onClick={() => setWhatsappAlerts(!whatsappAlerts)}
                      className={`w-10 h-6 rounded-full p-0.5 transition cursor-pointer ${
                        whatsappAlerts ? 'bg-[#0E1035]' : 'bg-[#D0DEE5]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition ${
                        whatsappAlerts ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-[#0E1035]">Biometric Quick Access</div>
                      <div className="text-[10px] text-[#7C8594]">FaceID / Fingerprint unlock for rapid ordering</div>
                    </div>
                    <button
                      onClick={() => setBiometricLogin(!biometricLogin)}
                      className={`w-10 h-6 rounded-full p-0.5 transition cursor-pointer ${
                        biometricLogin ? 'bg-[#0E1035]' : 'bg-[#D0DEE5]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition ${
                        biometricLogin ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onShowToast('Profile preferences updated successfully.');
                  onClose();
                }}
                className="w-full py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
              >
                Save Preferences
              </button>

              {userRole === 'OWNER' && onOpenUsersManagement && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUsersManagement();
                  }}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-[#D0DEE5] text-[#0E1035] rounded-xl text-xs font-bold shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4 text-[#2B3D5B]" />
                  <span>Manage Laboratory Users &amp; Permissions</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out of Account</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
