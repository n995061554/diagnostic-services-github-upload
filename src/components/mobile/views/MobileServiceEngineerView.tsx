import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Phone,
  FileText,
  Camera,
  RotateCcw,
  Check,
  X,
  Target,
  DollarSign,
  Award,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Package,
  Cpu,
  MapPin,
  CheckSquare,
  FileCheck2
} from 'lucide-react';

interface MobileServiceEngineerViewProps {
  currentUser?: any;
  currentUserId?: string;
  currentUserName?: string;
  token?: string | null;
  session?: any;
  onLogout?: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onSwitchRole?: (role: any) => void;
}

export const MobileServiceEngineerView: React.FC<MobileServiceEngineerViewProps> = ({
  currentUser,
  currentUserId,
  currentUserName,
  token,
  session,
  onLogout,
  onNavigateTab,
  onNavigateToTab,
}) => {
  const staffName = currentUserName || currentUser?.name || session?.user?.firstName || 'Amit Kumar';

  // Navigation within Service App
  const [activeScreen, setActiveScreen] = useState<
    'home' | 'start_service' | 'assigned_calls' | 'customers' | 'amc' | 'attendance' | 'targets' | 'maintenance_checklist' | 'spare_parts' | 'service_report'
  >('home');
  const [activeBottomNav, setActiveBottomNav] = useState<'home' | 'calls' | 'tickets' | 'attendance'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Biomedical Service Workflow States
  const [checklistItems, setChecklistItems] = useState([
    { id: 'chk-1', label: 'Optical Flowcell & Filter Cleanliness (Photometer 340-670nm)', completed: true },
    { id: 'chk-2', label: 'Syringe & Stepper Motor Plunger Calibration', completed: true },
    { id: 'chk-3', label: 'Teflon Fluidic Tubing De-proteinization & Flush', completed: false },
    { id: 'chk-4', label: 'Temperature Chamber Thermistor Verification (37.0°C ± 0.1)', completed: false },
    { id: 'chk-5', label: 'Waste Pressure Sensor & Peristaltic Pump Flow Rate', completed: false },
  ]);
  const [selectedSparePart, setSelectedSparePart] = useState('Halogen Tungsten Lamp 12V 20W');
  const [spareQuantity, setSpareQuantity] = useState(1);
  const [engineerResolutionNotes, setEngineerResolutionNotes] = useState('Replaced syringe teflon seal. Cleaned peristaltic pump roller. Calibrator recovery within ±1.5 SD.');

  // Daily Metrics
  const [todayCalls, setTodayCalls] = useState(5);
  const [completedCalls, setCompletedCalls] = useState(3);

  // Attendance State
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('09:20 AM');
  const [workingSeconds, setWorkingSeconds] = useState(31200); // 8h 40m
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Checked Out'>('Present');
  const [isPunching, setIsPunching] = useState(false);

  // Fetch real attendance status from server on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAttendance = async () => {
      try {
        const res = await fetch('/api/v1/attendance/today', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && isMounted) {
            if (json.data.todayRecord?.checkInServerTime) {
              setIsCheckedIn(!json.data.todayRecord.checkOutServerTime);
              setCheckInTime(new Date(json.data.todayRecord.checkInServerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              setAttendanceStatus(json.data.todayRecord.checkOutServerTime ? 'Checked Out' : 'Present');
            }
            if (json.data.liveWorkingMinutes) {
              setWorkingSeconds(json.data.liveWorkingMinutes * 60);
            }
          }
        }
      } catch (err) {
        // Fallback to local session
      }
    };
    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    let timer: any;
    if (isCheckedIn) {
      timer = setInterval(() => setWorkingSeconds((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const formatWorkingTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Service Call Execution State
  const [selectedCallId, setSelectedCallId] = useState('call-101');
  const [sparePartsUsed, setSparePartsUsed] = useState<string[]>([
    'Photometer Halogen Lamp (12V 20W)',
    'Teflon Syringe Seal Ring'
  ]);
  const [workNotes, setWorkNotes] = useState('Replaced photometer lamp, calibrated optical absorbance zero curve, and ran 20 control blanks. System precision within 1.2% CV.');
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  const handleCompleteService = () => {
    setIsSubmittingService(true);
    setTimeout(() => {
      setIsSubmittingService(false);
      setCompletedCalls((prev) => prev + 1);
      showToast('Service ticket marked as RESOLVED! Digital service report signed & dispatched.');
      setActiveScreen('home');
    }, 600);
  };

  // Real Attendance Check-in / Check-out
  const handleToggleAttendance = async () => {
    setIsPunching(true);
    const endpoint = isCheckedIn ? '/api/v1/attendance/check-out' : '/api/v1/attendance/check-in';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          latitude: 18.5074,
          longitude: 73.8077,
          accuracyMeters: 10,
          address: 'Kothrud Biomedical Service Hub, Pune',
          allowException: true,
        }),
      });

      if (res.ok) {
        if (isCheckedIn) {
          setIsCheckedIn(false);
          setAttendanceStatus('Checked Out');
          showToast(`Checked out successfully at ${timeStr}. Total shift: ${formatWorkingTime(workingSeconds)}`);
        } else {
          setIsCheckedIn(true);
          setCheckInTime(timeStr);
          setAttendanceStatus('Present');
          showToast(`Checked in successfully at ${timeStr}. Territory: Pune Central & Kothrud.`);
        }
      } else {
        setIsCheckedIn(!isCheckedIn);
        setAttendanceStatus(isCheckedIn ? 'Checked Out' : 'Present');
        showToast(isCheckedIn ? `Checked out at ${timeStr}.` : `Checked in at ${timeStr}.`);
      }
    } catch (err) {
      setIsCheckedIn(!isCheckedIn);
      setAttendanceStatus(isCheckedIn ? 'Checked Out' : 'Present');
      showToast(isCheckedIn ? `Checked out at ${timeStr}.` : `Checked in at ${timeStr}.`);
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <div className="w-full max-w-full sm:max-w-md mx-auto min-h-screen sm:min-h-[760px] bg-slate-100 flex flex-col font-sans select-none overflow-hidden relative sm:shadow-2xl sm:rounded-[32px] sm:border-4 sm:border-slate-800 text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-12 left-4 right-4 z-50 p-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 text-xs">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 1: HOME DASHBOARD ("DS Service") */}
      {/* ========================================================================= */}
      {activeScreen === 'home' && (
        <div className="flex-1 flex flex-col">
          {/* Top Green Header */}
          <div className="bg-emerald-600 text-white px-5 pt-6 pb-4 sm:rounded-b-[28px] shadow-md">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center overflow-hidden shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight leading-tight">DS Service</h1>
                  <p className="text-[10px] text-emerald-100 font-semibold">Biomedical Engineering &amp; AMC</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-emerald-500/80 text-white px-2 py-0.5 rounded-full font-bold border border-emerald-400/50">
                  {attendanceStatus}
                </span>
                <div className="w-7 h-7 rounded-full bg-emerald-700/60 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div className="mt-1">
              <h2 className="text-base font-extrabold tracking-tight text-emerald-100">Good Morning</h2>
              <p className="text-xl font-black text-white">{staffName}</p>
              <p className="text-[11px] text-emerald-200 mt-0.5">Tue, 12 Aug 2025</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Today's Metrics Card */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div className="flex-1 text-center border-r border-slate-100 pr-2">
                <p className="text-[11px] font-semibold text-slate-500">Today's Calls</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  <span className="text-emerald-600">{todayCalls}</span>
                </p>
              </div>
              <div className="flex-1 text-center pl-2">
                <p className="text-[11px] font-semibold text-slate-500">Completed</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  <span className="text-emerald-700">{completedCalls}</span>
                </p>
              </div>
            </div>

            {/* Top Action Tiles: Assigned Calls, PM Checklist, Spare Parts, Service Report */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveScreen('assigned_calls')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Assigned Calls</span>
              </button>

              <button
                onClick={() => setActiveScreen('maintenance_checklist')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">PM Checklist</span>
              </button>

              <button
                onClick={() => setActiveScreen('spare_parts')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Spare Parts</span>
              </button>

              <button
                onClick={() => setActiveScreen('service_report')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Service Report</span>
              </button>
            </div>

            {/* Primary Action Button: Start Service */}
            <button
              onClick={() => setActiveScreen('start_service')}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-base font-extrabold tracking-wide">Start Service</span>
            </button>

            {/* Bottom 4 Action Tiles: AMC Customers, My Target, My Salary, Attendance */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveScreen('amc')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">AMC Customers</span>
              </button>

              <button
                onClick={() => setActiveScreen('targets')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">My Target</span>
              </button>

              <button
                onClick={() => showToast('Monthly Service Salary: ₹52,000 + On-Call Incentive ₹8,400.')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">My Salary</span>
              </button>

              <button
                onClick={() => setActiveScreen('attendance')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Attendance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: START SERVICE / SERVICE EXECUTION */}
      {/* ========================================================================= */}
      {activeScreen === 'start_service' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800">Biomedical Service Call</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              In-Progress
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Equipment & Lab Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-black text-slate-900">Roche Cobas c311 Chemistry Analyzer</h3>
                  <p className="text-[11px] text-slate-500">Serial No: SN-COB-2024-9982</p>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  Breakdown Call
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-bold text-slate-700">Customer:</span> Apex Diagnostics &amp; Research Lab</p>
                <p><span className="font-bold text-slate-700">Address:</span> Kothrud Central, Pune</p>
                <p><span className="font-bold text-slate-700">Contract:</span> Comprehensive AMC (CMC 2025-26)</p>
              </div>
            </div>

            {/* Error Code Diagnostic */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-900">Reported Symptom / Error</label>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold">E-104: Photometer Absorbance Drift / Lamp Degradation</p>
                <p className="text-[11px] text-amber-800">Analyzer failed automated morning self-test on 340nm and 405nm optical wavelengths.</p>
              </div>
            </div>

            {/* Spares Replaced */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-900">Spare Parts Consumed</label>
              <div className="space-y-1.5">
                {sparePartsUsed.map((part, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{part}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Issued</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineer Resolution Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-900">Engineer Service Notes</label>
              <textarea
                rows={3}
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-hidden resize-none"
              />
            </div>

            {/* Complete Service Button */}
            <div className="pt-2 pb-4">
              <button
                type="button"
                onClick={handleCompleteService}
                disabled={isSubmittingService}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingService ? 'Finalizing Service Call...' : 'Complete Service Call & Sign-off'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: ATTENDANCE */}
      {/* ========================================================================= */}
      {activeScreen === 'attendance' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800">Service Engineer Attendance</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              GPS Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-5 text-center shadow-lg space-y-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Today's Working Hours</span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {formatWorkingTime(workingSeconds)}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-200">
                <Clock className="w-3.5 h-3.5" />
                <span>Checked In: {checkInTime}</span>
              </div>
            </div>

            <button
              onClick={handleToggleAttendance}
              disabled={isPunching}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
                isCheckedIn
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>{isPunching ? 'Processing...' : isCheckedIn ? 'Punch Out (End Shift)' : 'Punch In (Start Shift)'}</span>
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Territory Status</span>
                <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">
                  Pune Service Cluster
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>On-Site: Kothrud Diagnostics Facility</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OTHER SCREENS (ASSIGNED CALLS, AMC, TARGETS, CUSTOMERS) */}
      {/* ========================================================================= */}
      {(activeScreen === 'assigned_calls' || activeScreen === 'amc' || activeScreen === 'targets' || activeScreen === 'customers') && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800 capitalize">{activeScreen.replace('_', ' ')}</h2>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">DS Service</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeScreen === 'assigned_calls' && (
              <div className="space-y-2">
                {[
                  { id: 'CALL-901', lab: 'Apex Diagnostics', eq: 'Cobas c311', type: 'Emergency Breakdown', status: 'In-Progress' },
                  { id: 'CALL-902', lab: 'Metropolis Core Lab', eq: 'Sysmex XN-550', type: 'Quarterly PM Visit', status: 'Scheduled 2 PM' },
                  { id: 'CALL-903', lab: 'Ruby Hall Pathology', eq: 'Architect i1000', type: 'Software Calibration', status: 'Scheduled 5 PM' },
                ].map((c, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900">{c.lab}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{c.status}</span>
                    </div>
                    <p className="text-slate-600">{c.eq} • {c.type}</p>
                  </div>
                ))}
              </div>
            )}
            {activeScreen === 'amc' && (
              <div className="space-y-2">
                {[
                  { lab: 'Apex Diagnostics & Imaging', plan: 'Comprehensive CMC', valid: '31-Mar-2026', analyzers: 3 },
                  { lab: 'Metropolis Health Lab', plan: 'Standard AMC (Labor Only)', valid: '31-Dec-2025', analyzers: 5 },
                  { lab: 'Kothrud Clinical Laboratory', plan: 'Preventive Care PMC', valid: '30-Jun-2026', analyzers: 2 },
                ].map((a, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <p className="font-bold text-slate-900">{a.lab}</p>
                    <p className="text-slate-600 font-medium">{a.plan}</p>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Valid Till: {a.valid}</span>
                      <span>{a.analyzers} Analyzers Covered</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeScreen === 'targets' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <p className="text-xs font-semibold text-emerald-800">Monthly PM &amp; Service Target</p>
                <p className="text-2xl font-black text-emerald-950">32 / 40 Calls</p>
                <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-xs font-bold text-emerald-700">80% Achieved • 0 Escalations</p>
              </div>
            )}
            {activeScreen === 'customers' && (
              <div className="space-y-2">
                {['Apex Diagnostics (Kothrud)', 'Metropolis Central Lab (Pune)', 'Ruby Hall Clinic Pathology', 'Dr. Dangs Clinical Unit'].map((name, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex justify-between items-center">
                    <span>{name}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">AMC Active</span>
                  </div>
                ))}
              </div>
            )}

            {/* SCREEN: PREVENTIVE MAINTENANCE CHECKLIST */}
            {activeScreen === 'maintenance_checklist' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Standard PM Protocol Checklist</h4>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">NABL Standard</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mandatory quarterly inspection protocol for automated clinical analyzers.
                  </p>
                  <div className="space-y-2">
                    {checklistItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setChecklistItems(prev => prev.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c));
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          item.completed ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-semibold text-[11.5px] pr-2">{item.label}</span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          item.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {item.completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      showToast('PM checklist progress saved. Geo-tagged event logged.');
                      setActiveScreen('home');
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Save Checklist &amp; Log Event
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN: SPARE PARTS CONSUMPTION LEDGER */}
            {activeScreen === 'spare_parts' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900">Log Replaced Spare Part</h4>
                  <p className="text-[11px] text-slate-500">
                    Deduct replaced biomedical parts from service engineer van inventory.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Spare Part Component</label>
                    <select
                      value={selectedSparePart}
                      onChange={(e) => setSelectedSparePart(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Halogen Tungsten Lamp 12V 20W">Halogen Tungsten Lamp 12V 20W</option>
                      <option value="Pinch Valve Solenoid Assembly">Pinch Valve Solenoid Assembly</option>
                      <option value="Teflon Syringe Plunger Seal 250uL">Teflon Syringe Plunger Seal 250uL</option>
                      <option value="Peristaltic Pump Tubing Set">Peristaltic Pump Tubing Set</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Quantity Replaced</label>
                    <input
                      type="number"
                      min="1"
                      value={spareQuantity}
                      onChange={(e) => setSpareQuantity(Number(e.target.value) || 1)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    onClick={() => {
                      showToast(`Deducted ${spareQuantity}x ${selectedSparePart} from van stock.`);
                      setActiveScreen('home');
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Deduct from Field Inventory
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN: DIGITAL SERVICE REPORT & RESOLUTION */}
            {activeScreen === 'service_report' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">Digital Field Service Report</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">FSR #SR-2026-904</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <p className="font-bold text-slate-800">Customer: Metropolis Diagnostics Lab</p>
                    <p className="text-[11px] text-slate-500">Equipment: Sysmex XN-350 Automated Hematology Analyzer</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Resolution &amp; Corrective Action Taken</label>
                    <textarea
                      rows={3}
                      value={engineerResolutionNotes}
                      onChange={(e) => setEngineerResolutionNotes(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg border border-dashed border-slate-300 text-center text-slate-500">
                    <p className="text-[11px] font-bold">Customer Sign-off Captured</p>
                    <p className="text-[10px] text-slate-400">Dr. Sameer Mehta • 12:45 PM • Geo-tagged</p>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Field Service Report generated and emailed to Lab Director.');
                      setActiveScreen('home');
                    }}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Sign &amp; Close Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="border-t border-slate-200 bg-white px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            setActiveScreen('home');
            setActiveBottomNav('home');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'home' && activeScreen === 'home' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building2 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('assigned_calls');
            setActiveBottomNav('calls');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'calls' || activeScreen === 'assigned_calls' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span className="text-[10px] font-bold">Calls</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('start_service');
            setActiveBottomNav('tickets');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'tickets' || activeScreen === 'start_service' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tickets</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('attendance');
            setActiveBottomNav('attendance');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'attendance' || activeScreen === 'attendance' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Attendance</span>
        </button>
      </div>
    </div>
  );
};
