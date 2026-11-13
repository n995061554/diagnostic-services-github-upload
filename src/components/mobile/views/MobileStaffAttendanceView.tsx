import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Building,
  Timer,
  Navigation,
  Check,
  X,
  Sliders,
  LogOut,
  Target,
  DollarSign,
  TrendingUp,
  Award,
  Send,
  Calendar,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { CustomerAuthSession, CustomerRole } from '../customerAppTypes';

interface MobileStaffAttendanceViewProps {
  session: CustomerAuthSession;
  isSalesPerson?: boolean;
  onLogout: () => void;
  onSwitchRole: (role: CustomerRole) => void;
}

interface PunchRecord {
  id: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  locationName: string;
  distanceMeters: number;
  isGeofenceVerified: boolean;
}

export const MobileStaffAttendanceView: React.FC<MobileStaffAttendanceViewProps> = ({
  session,
  isSalesPerson = false,
  onLogout,
  onSwitchRole
}) => {
  const [activeTab, setActiveTab] = useState<'punch' | 'regularization' | 'sales_quotas'>('punch');
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [activeLocationIndex, setActiveLocationIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Live timer for shift duration
  const [secondsElapsed, setSecondsElapsed] = useState(15740); // 4h 22m 20s

  useEffect(() => {
    if (!isCheckedIn) return;
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const formatElapsedTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const LOCATIONS = [
    { name: 'Mumbai Central Operations Hub', distanceMeters: 45, withinFence: true },
    { name: 'Andheri Diagnostics Satellite Lab', distanceMeters: 1420, withinFence: false },
    { name: 'Pune Regional Biomedical Center', distanceMeters: 145000, withinFence: false }
  ];

  const currentLocation = LOCATIONS[activeLocationIndex];

  const [punchHistory, setPunchHistory] = useState<PunchRecord[]>([
    {
      id: 'p-1',
      type: 'CHECK_IN',
      timestamp: 'Today, 09:18 AM',
      locationName: 'Mumbai Central Operations Hub',
      distanceMeters: 42,
      isGeofenceVerified: true
    }
  ]);

  // Regularization Form State
  const [regDate, setRegDate] = useState('2026-10-09');
  const [regReason, setRegReason] = useState('CLIENT_VISIT');
  const [regNotes, setRegNotes] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTogglePunch = () => {
    const newStatus = !isCheckedIn;
    setIsCheckedIn(newStatus);

    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newRec: PunchRecord = {
      id: `p-${Date.now()}`,
      type: newStatus ? 'CHECK_IN' : 'CHECK_OUT',
      timestamp: timeStr,
      locationName: currentLocation.name,
      distanceMeters: currentLocation.distanceMeters,
      isGeofenceVerified: currentLocation.withinFence
    };

    setPunchHistory(prev => [newRec, ...prev]);
    showToast(
      newStatus
        ? `Checked In at ${currentLocation.name}! Geofence verified.`
        : `Checked Out successfully! Working session ended.`
    );
  };

  const handleRegularizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReg(true);
    setTimeout(() => {
      setIsSubmittingReg(false);
      setRegNotes('');
      showToast('Attendance regularization submitted for manager approval!');
      setActiveTab('punch');
    }, 500);
  };

  const isSales = isSalesPerson || session.role === 'SALES_PERSON';

  return (
    <div className="relative w-full h-full flex flex-col font-sans select-none overflow-hidden bg-[#0A0D1F] text-white">
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-14 left-4 right-4 z-50 p-3 bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="flex-1 truncate">{toastMessage}</span>
        </div>
      )}

      {/* Role Switcher Modal */}
      {isRoleModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#15253F] border border-[#2B3D5B] rounded-3xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D0DEE5]" />
                Switch Mobile Role
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 rounded-full text-[#D0DEE5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('OWNER');
                }}
                className="w-full p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold text-left hover:bg-amber-500/30 transition flex items-center gap-2"
              >
                <span>👑</span>
                <div>
                  <div>Apex Owner (Customer Lab)</div>
                  <div className="text-[10px] text-amber-200/70 font-normal">Reagents catalog & orders</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('SERVICE_ENGINEER');
                }}
                className="w-full p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold text-left hover:bg-blue-500/30 transition flex items-center gap-2"
              >
                <span>🔧</span>
                <div>
                  <div>Field Service Engineer</div>
                  <div className="text-[10px] text-blue-200/70 font-normal">PM schedules & breakdown tickets</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('SALES_PERSON');
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 ${
                  isSales
                    ? 'bg-emerald-600/30 border-emerald-400 text-white'
                    : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/30'
                }`}
              >
                <span>💼</span>
                <div>
                  <div>Field Sales Representative</div>
                  <div className="text-[10px] text-emerald-200 font-normal">Sales quotas & customer visits</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsRoleModalOpen(false);
                  onSwitchRole('OFFICE_ADMIN');
                }}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left flex items-center gap-2 ${
                  !isSales
                    ? 'bg-purple-600/30 border-purple-400 text-white'
                    : 'bg-purple-500/20 border-purple-400/30 text-purple-200 hover:bg-purple-500/30'
                }`}
              >
                <span>⏱️</span>
                <div>
                  <div>Staff Attendance Console</div>
                  <div className="text-[10px] text-purple-200 font-normal">Geofence punch & shift rules</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. TOP HEADER */}
      {/* ------------------------------------------------------------------ */}
      <header className="px-4 pt-7 pb-3 flex items-center justify-between border-b border-[#1B254B] bg-[#0E1538]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300 font-black text-xs shadow-md">
            {isSales ? '💼' : '⏱️'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs text-white">
                {isSales ? 'Vikram Rathore' : 'Priya Verma'}
              </h1>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-[#A3B3D6] font-medium flex items-center gap-1">
              <span>{isSales ? 'Field Sales Specialist' : 'Commercial Operations'}</span>
              <span>&bull;</span>
              <span className={isCheckedIn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {isCheckedIn ? 'Checked In' : 'Checked Out'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="p-1.5 rounded-xl bg-[#1B254B] hover:bg-[#253265] text-[#D0DEE5] text-[11px] font-bold flex items-center gap-1 px-2.5 transition border border-[#2B3D5B]"
            title="Switch Persona"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Role</span>
          </button>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 transition"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEGMENTED TABS */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-2.5 flex items-center gap-1.5 border-b border-[#1B254B] bg-[#0A0D1F] text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('punch')}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'punch'
              ? 'bg-purple-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Geofence Punch</span>
        </button>
        <button
          onClick={() => setActiveTab('regularization')}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'regularization'
              ? 'bg-purple-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Regularization</span>
        </button>
        <button
          onClick={() => setActiveTab('sales_quotas')}
          className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'sales_quotas'
              ? 'bg-purple-600 text-white font-extrabold shadow-md'
              : 'bg-[#152042] text-[#A3B3D6] hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Sales Quotas</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MAIN TAB CONTENT */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 pb-16">
        {/* TAB 1: GEOFENCE PUNCH & LIVE SHIFT */}
        {activeTab === 'punch' && (
          <div className="space-y-3.5">
            {/* GEOFENCE RADAR CARD */}
            <div className="p-4 rounded-3xl bg-linear-to-b from-[#131D42] to-[#0D1432] border border-[#202E5C] text-center space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-300">
                  {currentLocation.withinFence ? 'Verified Within Office Geofence' : 'Outside Office Geofence'}
                </span>
              </div>

              {/* LIVE STOPWATCH */}
              <div className="py-2">
                <div className="text-2xl font-black tracking-tight text-white font-mono">
                  {formatElapsedTime(secondsElapsed)}
                </div>
                <div className="text-[10px] text-[#A3B3D6] mt-0.5">
                  Shift: Standard 9:30 AM – 6:30 PM &bull; Grace Period: 45 min
                </div>
              </div>

              {/* BIG PUNCH BUTTON */}
              <button
                onClick={handleTogglePunch}
                className={`w-36 h-36 mx-auto rounded-full flex flex-col items-center justify-center gap-1 font-black shadow-2xl transition transform active:scale-95 cursor-pointer border-4 ${
                  isCheckedIn
                    ? 'bg-linear-to-br from-red-500 to-rose-700 border-red-300/60 text-white'
                    : 'bg-linear-to-br from-emerald-500 to-teal-700 border-emerald-300/60 text-white'
                }`}
              >
                <Clock className="w-8 h-8" />
                <span className="text-sm font-extrabold tracking-wide uppercase">
                  {isCheckedIn ? 'PUNCH OUT' : 'PUNCH IN'}
                </span>
                <span className="text-[9px] font-mono opacity-80">GPS Timestamped</span>
              </button>

              {/* LOCATION PICKER & DISTANCE */}
              <div className="pt-2">
                <div className="text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                  Active Geofence Node
                </div>
                <select
                  value={activeLocationIndex}
                  onChange={e => setActiveLocationIndex(Number(e.target.value))}
                  className="w-full bg-[#0A0D1F] border border-[#202E5C] rounded-xl p-2 text-xs text-white outline-none"
                >
                  {LOCATIONS.map((loc, idx) => (
                    <option key={idx} value={idx}>
                      {loc.name} ({loc.distanceMeters}m away)
                    </option>
                  ))}
                </select>
                <div className="text-[10px] text-emerald-300 font-semibold mt-1">
                  Accuracy: ±6 meters &bull; Server Latency: 22ms
                </div>
              </div>
            </div>

            {/* PUNCH AUDIT HISTORY */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#A3B3D6] uppercase tracking-wider px-1">
                Today's Punch Audit Trail
              </span>
              {punchHistory.map(rec => (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-[#121A3A] border border-[#1E2B58] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[10px] ${
                        rec.type === 'CHECK_IN'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {rec.type === 'CHECK_IN' ? 'IN' : 'OUT'}
                    </div>
                    <div>
                      <div className="font-bold text-white leading-tight">
                        {rec.type === 'CHECK_IN' ? 'Punch In Recorded' : 'Punch Out Recorded'}
                      </div>
                      <div className="text-[10px] text-[#A3B3D6] leading-tight">
                        {rec.locationName} &bull; {rec.timestamp}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ✓ Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE REGULARIZATION */}
        {activeTab === 'regularization' && (
          <form
            onSubmit={handleRegularizeSubmit}
            className="p-4 rounded-2xl bg-[#121A3A] border border-[#1E2B58] space-y-3"
          >
            <div className="border-b border-[#1E2B58] pb-2">
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                Shift Regularization Request
              </h3>
              <p className="text-[10px] text-[#A3B3D6] mt-0.5">
                Submit missed punch or client on-site visit regularization for manager sign-off.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                Missed Date *
              </label>
              <input
                type="date"
                required
                value={regDate}
                onChange={e => setRegDate(e.target.value)}
                className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                Regularization Reason *
              </label>
              <select
                value={regReason}
                onChange={e => setRegReason(e.target.value)}
                className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none"
              >
                <option value="CLIENT_VISIT">Hospital / Laboratory Client On-Site Visit</option>
                <option value="TRAFFIC_TRANSIT">Transit Delay / Public Transport Breakdown</option>
                <option value="DEVICE_MALFUNCTION">GPS Device Battery Exhaustion</option>
                <option value="FIELD_EMERGENCY">Emergency Biomedical Dispatch</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3B3D6] uppercase mb-1">
                Explanation & Visit Reference *
              </label>
              <textarea
                rows={3}
                required
                value={regNotes}
                onChange={e => setRegNotes(e.target.value)}
                placeholder="Mention visited hospital name, diagnostic center contact, or route..."
                className="w-full bg-[#0A0D1F] border border-[#1E2B58] rounded-xl p-2.5 text-xs text-white outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReg}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingReg ? 'Submitting...' : 'Submit for Manager Approval'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: SALES TARGETS & QUOTAS */}
        {activeTab === 'sales_quotas' && (
          <div className="space-y-3">
            {/* QUOTA CARD */}
            <div className="p-4 rounded-3xl bg-linear-to-b from-[#16274D] to-[#0F1B38] border border-[#203768] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Q4 Monthly Quota
                  </span>
                  <h3 className="text-sm font-black text-white mt-1">
                    Western Territory Commercial Target
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-400 font-mono">73.6%</div>
                  <div className="text-[9px] text-[#A3B3D6]">MTD Achieved</div>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-[#0A0D1F] rounded-full overflow-hidden p-0.5 border border-[#203768]">
                  <div className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full w-[73.6%]" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#A3B3D6]">
                  <span>Booked: <strong className="text-white">₹18,40,000</strong></span>
                  <span>Target: <strong className="text-white">₹25,00,000</strong></span>
                </div>
              </div>

              {/* INCENTIVE MILESTONES */}
              <div className="p-2.5 rounded-xl bg-[#0A0D1F] text-[10px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-300 font-bold">
                    <Award className="w-3.5 h-3.5" />
                    Tier 1 Incentive (100%)
                  </span>
                  <span className="text-[#A3B3D6]">Needs ₹6,60,000 to unlock</span>
                </div>
                <p className="text-[9px] text-[#8C9BBF]">
                  Eligible for 3.5% commission on reagent volume contracts above threshold.
                </p>
              </div>
            </div>

            {/* FIELD CUSTOMER VISITS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[#A3B3D6] uppercase tracking-wider">
                  Assigned Lab Accounts
                </span>
                <button
                  onClick={() => showToast('GPS Check-in recorded at Apex Diagnostics!')}
                  className="p-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Check-In Visit</span>
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#121A3A] border border-[#1E2B58] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Apex Diagnostics &amp; Research</span>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold">Primary Lab</span>
                </div>
                <div className="text-[10px] text-[#A3B3D6] flex items-center justify-between">
                  <span>Contact: Dr. Arvind Kulkarni</span>
                  <span className="text-slate-400">Powai, Mumbai</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#121A3A] border border-[#1E2B58] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Metropolis Center</span>
                  <span className="text-[10px] text-blue-300 font-mono font-bold">Key Account</span>
                </div>
                <div className="text-[10px] text-[#A3B3D6] flex items-center justify-between">
                  <span>Contact: Dr. Sunita Rao</span>
                  <span className="text-slate-400">Andheri West, Mumbai</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
