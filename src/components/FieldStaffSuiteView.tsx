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
  Info
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'service' | 'delivery' | 'application' | 'backoffice'>('overview');

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Top Suite Header & Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse"></span>
            <span className="text-xs font-bold text-sky-700 uppercase tracking-widest">DS Field Operations Platform</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Field Staff Suite &amp; Back Office Live Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            4 Specialized Mobile Apps • Attendance &amp; Geo-Punch • Mandatory Lab Selfies • Back Office GPS Control
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
            All 4 Apps Overview
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
            <span>1. Sales App</span>
          </button>
          <button
            onClick={() => setActiveTab('service')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'service'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>2. Service App</span>
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
            <span>3. Delivery App</span>
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'application'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>4. Application App</span>
          </button>
          <button
            onClick={() => setActiveTab('backoffice')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'backoffice'
                ? 'bg-[#0B3A75] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span>Back Office (Live Tracking)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL 4 APPS OVERVIEW (Infographic Layout exactly like reference image) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Half: 4 Mobile Apps Headers + IMPORTANT RULES Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
            {/* App 1: Sales Staff App Column */}
            <div className="space-y-2">
              <div className="bg-sky-600 text-white px-3 py-2 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">1. SALES STAFF APP</span>
                <p className="text-[11px] font-bold text-white truncate">Customer Visit • Mandatory Selfie • Leads</p>
              </div>
              <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-lg">
                <MobileSalesPersonView currentUser={currentUser} token={token} />
              </div>
            </div>

            {/* App 2: Service Staff App Column */}
            <div className="space-y-2">
              <div className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">2. SERVICE STAFF APP</span>
                <p className="text-[11px] font-bold text-white truncate">Service Calls • AMC • Ticket Management</p>
              </div>
              <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-lg">
                <MobileServiceEngineerView currentUser={currentUser} token={token} />
              </div>
            </div>

            {/* App 3: Delivery Staff App Column */}
            <div className="space-y-2">
              <div className="bg-orange-600 text-white px-3 py-2 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-200">3. DELIVERY STAFF APP</span>
                <p className="text-[11px] font-bold text-white truncate">Assigned Deliveries • Confirm Delivery</p>
              </div>
              <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-lg">
                <MobileDeliveryStaffView currentUser={currentUser} token={token} />
              </div>
            </div>

            {/* App 4: Application Staff App Column */}
            <div className="space-y-2">
              <div className="bg-purple-600 text-white px-3 py-2 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-200">4. APPLICATION STAFF APP</span>
                <p className="text-[11px] font-bold text-white truncate">Today's Tickets • Work on Ticket</p>
              </div>
              <div className="border border-slate-300 rounded-3xl p-1 bg-slate-900 shadow-lg">
                <MobileApplicationSupportView currentUser={currentUser} token={token} />
              </div>
            </div>

            {/* Column 5: IMPORTANT RULES CARD (The red card from top right of screenshot) */}
            <div className="md:col-span-2 lg:col-span-4 xl:col-span-1 space-y-3">
              <div className="bg-rose-700 text-white p-4 rounded-2xl shadow-md border border-rose-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-rose-600 pb-2">
                  <ShieldAlert className="w-5 h-5 text-white shrink-0" />
                  <h2 className="text-sm font-black tracking-tight uppercase">IMPORTANT RULES</h2>
                </div>

                {/* Rule 1: Lab Visit Photo Mandatory */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Lab visit photo is mandatory</span>
                  </div>
                  <ul className="text-[11px] text-rose-100 space-y-1 pl-5 list-disc">
                    <li>Selfie with lab name board in the same photo</li>
                    <li>Cannot save visit without photo</li>
                    <li>Photo captured through mobile camera</li>
                    <li>Retake option available</li>
                    <li>Saved with date, time, and visit details</li>
                  </ul>
                </div>

                {/* Rule 2: No Live Location in Employee Apps */}
                <div className="space-y-1.5 pt-2 border-t border-rose-600">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>No live location in employee apps</span>
                  </div>
                  <ul className="text-[11px] text-rose-100 space-y-1 pl-5 list-disc">
                    <li>Sales, Service, Delivery, and Application apps:</li>
                    <li className="list-none pl-2 text-[10px]">• Do not show live tracking map</li>
                    <li className="list-none pl-2 text-[10px]">• Do not show other employees' locations</li>
                    <li className="list-none pl-2 text-[10px]">• Do not show location history</li>
                    <li>Only Back Office / Super Admin can view live tracking</li>
                  </ul>
                </div>

                {/* Rule 3: Back Office Only */}
                <div className="space-y-1.5 pt-2 border-t border-rose-600">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Back Office only</span>
                  </div>
                  <ul className="text-[11px] text-rose-100 space-y-1 pl-5 list-disc">
                    <li>Live GPS tracking of all field staff</li>
                    <li>Location history and travel reports</li>
                    <li>All reports and downloads</li>
                    <li>Target vs achievement reports</li>
                    <li>Attendance reports for all departments</li>
                    <li>Salary and incentive reports</li>
                    <li>Manage rules and approvals</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Half: Back Office / Super Admin Live Staff Tracking & Reports */}
          <div className="pt-4 border-t-2 border-slate-200">
            <LiveStaffTrackingAndReportsView token={token} onNavigateTab={onNavigateTab} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALES STAFF APP ONLY */}
      {/* ========================================================================= */}
      {activeTab === 'sales' && (
        <div className="max-w-md mx-auto py-4">
          <div className="mb-3 text-center">
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Active Persona: Rohit Sharma (Field Sales Executive)
            </span>
          </div>
          <MobileSalesPersonView currentUser={currentUser} token={token} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SERVICE STAFF APP ONLY */}
      {/* ========================================================================= */}
      {activeTab === 'service' && (
        <div className="max-w-md mx-auto py-4">
          <div className="mb-3 text-center">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Active Persona: Amit Kumar (Biomedical Service Engineer)
            </span>
          </div>
          <MobileServiceEngineerView currentUser={currentUser} token={token} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DELIVERY STAFF APP ONLY */}
      {/* ========================================================================= */}
      {activeTab === 'delivery' && (
        <div className="max-w-md mx-auto py-4">
          <div className="mb-3 text-center">
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              Active Persona: Suresh Yadav (Diagnostic Express Delivery Staff)
            </span>
          </div>
          <MobileDeliveryStaffView currentUser={currentUser} token={token} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: APPLICATION STAFF APP ONLY */}
      {/* ========================================================================= */}
      {activeTab === 'application' && (
        <div className="max-w-md mx-auto py-4">
          <div className="mb-3 text-center">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Active Persona: Neha Singh (Clinical Application Specialist)
            </span>
          </div>
          <MobileApplicationSupportView currentUser={currentUser} token={token} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: BACK OFFICE ONLY */}
      {/* ========================================================================= */}
      {activeTab === 'backoffice' && (
        <div className="py-2">
          <LiveStaffTrackingAndReportsView token={token} onNavigateTab={onNavigateTab} />
        </div>
      )}
    </div>
  );
};
