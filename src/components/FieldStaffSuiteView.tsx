import React, { useState } from 'react';
import {
  Smartphone,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Sparkles,
  Users,
  Wrench,
  Truck,
  Stethoscope,
  Clock,
  ArrowRight,
  Maximize2,
  Minimize2,
  Download,
  Eye,
  Info,
  Building2,
  ShoppingCart,
  ChevronRight,
  ShieldCheck,
  Activity,
  FileCheck2,
  BookOpen
} from 'lucide-react';
import { CustomerMobileApp } from './mobile/CustomerMobileApp';
import { MobileSalesPersonView } from './mobile/views/MobileSalesPersonView';
import { MobileServiceEngineerView } from './mobile/views/MobileServiceEngineerView';
import { MobileDeliveryStaffView } from './mobile/views/MobileDeliveryStaffView';
import { MobileApplicationSupportView } from './mobile/views/MobileApplicationSupportView';
import { LiveStaffTrackingAndReportsView } from './backoffice/LiveStaffTrackingAndReportsView';

interface FieldStaffSuiteViewProps {
  currentUser?: any;
  token?: string | null;
  onNavigateTab?: (tab: string) => void;
}

export const FieldStaffSuiteView: React.FC<FieldStaffSuiteViewProps> = ({
  currentUser,
  token,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'laboratory' | 'sales' | 'service' | 'delivery' | 'application' | 'backoffice'>('overview');

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Top Suite Header & Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Diagnostic Services Ecosystem</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Enterprise Mobile Applications Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            All 5 Independent Mobile Applications • Laboratory Institutional Portal • Sales • Service • Delivery • Clinical Applications
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 5 Apps Hub
          </button>
          <button
            onClick={() => setActiveTab('laboratory')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'laboratory'
                ? 'bg-[#1E331B] text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>1. Laboratory App</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'sales'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-sky-700 hover:bg-sky-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>2. Sales App</span>
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'service'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>3. Service App</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'delivery'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-orange-700 hover:bg-orange-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span>4. Delivery App</span>
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'application'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-700 hover:bg-teal-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>5. Application App</span>
          </button>
          <button
            onClick={() => setActiveTab('backoffice')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'backoffice'
                ? 'bg-[#0E1035] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>Duty GPS Tracking</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL 5 APPS OVERVIEW (Enterprise High-Density Hub) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* App 1: Laboratory App */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Institutional
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">1. Laboratory App</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hospital &amp; clinical laboratory portal for direct reagent ordering, invoice statements, and analyzer service requests.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p>• Catalogue &amp; 1-Click Quick Reorder</p>
                  <p>• Live Dispatch &amp; Delivery Tracking</p>
                  <p>• Credit Ledger &amp; Aging Invoices</p>
                  <p>• Equipment Service Tickets</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('laboratory')}
                className="w-full py-2 bg-[#1E331B] hover:bg-[#15253F] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>Launch Lab App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* App 2: Sales App */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-sky-300 transition-all space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                    Field Sales
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">2. Sales Staff App</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Territory field sales execution: daily beat plan, mandatory lab visit selfies, on-field order booking, and quotations.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p>• Geofenced Punch &amp; Shift Attendance</p>
                  <p>• Mandatory Visit Selfie &amp; GPS Proof</p>
                  <p>• Order Booking &amp; Quotation Drafting</p>
                  <p>• Discount Requests &amp; Target Tracking</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('sales')}
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>Launch Sales App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* App 3: Service App */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Biomedical
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">3. Service Staff App</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Biomedical engineering maintenance: breakdown tickets, PM protocols, equipment history, and spare parts consumption.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p>• Assigned Breakdown Ticket Queue</p>
                  <p>• NABL PM Inspection Checklist</p>
                  <p>• Spare Parts Inventory Deductions</p>
                  <p>• Digital Service Report Signatures</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('service')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>Launch Service App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* App 4: Delivery App */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                    Logistics
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">4. Delivery Staff App</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Diagnostic delivery runs: route navigation, OTP verification, recipient digital signature, partial and failed deliveries.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p>• Route Stops &amp; Turn-by-Turn Guidance</p>
                  <p>• Secure OTP &amp; Signature Verification</p>
                  <p>• Partial Delivery &amp; Back-Order Tagging</p>
                  <p>• Failed Delivery Exception Logging</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('delivery')}
                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>Launch Delivery App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* App 5: Application App */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    Clinical Apps
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">5. Application Staff App</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clinical reagent applications desk: analyzer commissioning, assay parameter programming, technician training, and QC curves.
                </p>
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <p>• Analyzer Commissioning &amp; IQ/OQ</p>
                  <p>• Reagent Assay Parameter Sheets</p>
                  <p>• Lab Technician Training Certificates</p>
                  <p>• Protocol Troubleshooting &amp; Sign-off</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('application')}
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>Launch Application App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Operating Invariants Notice */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Diagnostic Services Architectural Invariants Enforced Across All 5 Applications:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-800">1. Mandatory Selfie for Sales</p>
                <p className="text-[11px] text-slate-500">Every customer laboratory visit must upload a photo capturing the salesperson and the lab name board.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-800">2. Reconciled GPS Privacy</p>
                <p className="text-[11px] text-slate-500">Continuous live tracking is active for Sales &amp; Delivery during duty hours only. Service and Application staff log event-based GPS only.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <p className="font-bold text-slate-800">3. Full Standalone Experience</p>
                <p className="text-[11px] text-slate-500">Each application operates as an independent, fully functional platform without restrictive phone frame mockups.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LABORATORY APP (Responsive Full Screen) */}
      {/* ========================================================================= */}
      {activeTab === 'laboratory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Laboratory Institutional Purchasing &amp; Service Portal</span>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕ Close App View
            </button>
          </div>
          <CustomerMobileApp deviceType="responsive" onNavigateToEnterprise={() => setActiveTab('overview')} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALES STAFF APP */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (
        <div className="max-w-2xl mx-auto py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800">Sales Staff Field Operations Console</span>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕ Back to Suite
            </button>
          </div>
          <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-xl overflow-hidden">
            <MobileSalesPersonView currentUser={currentUser} token={token} onNavigateToTab={onNavigateTab} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SERVICE STAFF APP */}
      {/* ========================================================================= */}
      {activeTab === 'service' && (
        <div className="max-w-2xl mx-auto py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">Biomedical Engineering Service &amp; AMC Console</span>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕ Back to Suite
            </button>
          </div>
          <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-xl overflow-hidden">
            <MobileServiceEngineerView currentUser={currentUser} token={token} onNavigateToTab={onNavigateTab} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DELIVERY STAFF APP */}
      {/* ========================================================================= */}
      {activeTab === 'delivery' && (
        <div className="max-w-2xl mx-auto py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800">Diagnostic Delivery Logistics Console</span>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕ Back to Suite
            </button>
          </div>
          <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-xl overflow-hidden">
            <MobileDeliveryStaffView currentUser={currentUser} token={token} onNavigateToTab={onNavigateTab} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: APPLICATION STAFF APP */}
      {/* ========================================================================= */}
      {activeTab === 'application' && (
        <div className="max-w-2xl mx-auto py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800">Clinical Applications &amp; Protocol Specialist Console</span>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕ Back to Suite
            </button>
          </div>
          <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-xl overflow-hidden">
            <MobileApplicationSupportView currentUser={currentUser} token={token} onNavigateToTab={onNavigateTab} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DUTY GPS TRACKING CONSOLE */}
      {/* ========================================================================= */}
      {activeTab === 'backoffice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Back Office &amp; Super Admin Real-Time Territory Tracking</span>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕ Back to Suite
            </button>
          </div>
          <LiveStaffTrackingAndReportsView token={token} onNavigateTab={onNavigateTab} />
        </div>
      )}
    </div>
  );
};
