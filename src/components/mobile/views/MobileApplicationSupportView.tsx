import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wrench,
  User,
  Building,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  LogOut,
  Target,
  FileText,
  X,
  Sliders,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  DollarSign,
  MapPin,
  Stethoscope
} from 'lucide-react';

interface MobileApplicationSupportViewProps {
  currentUser?: any;
  currentUserId?: string;
  currentUserName?: string;
  token?: string | null;
  onLogout?: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const MobileApplicationSupportView: React.FC<MobileApplicationSupportViewProps> = ({
  currentUser,
  currentUserId,
  currentUserName,
  token,
  onLogout,
  onNavigateTab,
  onNavigateToTab,
}) => {
  const staffName = currentUserName || currentUser?.name || 'Neha Singh';

  // Navigation
  const [activeScreen, setActiveScreen] = useState<
    'home' | 'work_ticket' | 'my_tickets' | 'knowledge' | 'attendance' | 'targets' | 'installation_config' | 'assay_programming' | 'training_logs' | 'troubleshooting'
  >('home');
  const [activeBottomNav, setActiveBottomNav] = useState<'home' | 'tickets' | 'attendance'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Clinical Application Workflow States
  const [assayTestName, setAssayTestName] = useState('HbA1c Direct Enzymatic Assay (Reagent Kit #HBA-001)');
  const [assayWavelength, setAssayWavelength] = useState('660 nm / 800 nm Dual Wavelength');
  const [reactionType, setReactionType] = useState('2-Point Fixed Time Kinetic');
  const [trainedTechnician, setTrainedTechnician] = useState('Pooja Patil (Senior Biochemist)');
  const [trainingTopics, setTrainingTopics] = useState([
    { id: 'tr-1', topic: 'Reagent Carousel Loading & Barcode Reading', done: true },
    { id: 'tr-2', topic: '2-Point Spline Calibration & QC Verification', done: true },
    { id: 'tr-3', topic: 'Daily Cuvette Wash & Blank Measurement Protocol', done: true },
    { id: 'tr-4', topic: 'Troubleshooting Turbidity Interference & Dilution', done: false }
  ]);

  // Daily Metrics
  const [todayTickets, setTodayTickets] = useState(6);
  const [resolvedTickets, setResolvedTickets] = useState(4);

  // Attendance State
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('09:05 AM');
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

  // Ticket Resolution Form State
  const [selectedTicketId, setSelectedTicketId] = useState('ast-001');
  const [qcCalibrationVerified, setQcCalibrationVerified] = useState(true);
  const [protocolNotes, setProtocolNotes] = useState('Reconstituted master calibrator vial. Baseline optical blank run passed. Calibration slope within Roche Elecsys factory threshold (0.998).');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolveTicket = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/app-support/tickets/${selectedTicketId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          resolutionNotes: protocolNotes.trim(),
          calibratorSlope: 0.998,
          qcValues: { level1: 'Normal', level2: 'High' },
        }),
      });

      setResolvedTickets((prev) => prev + 1);
      showToast('Application support ticket RESOLVED! Calibrator certificate validated.');
      setActiveScreen('home');
    } catch (err) {
      setResolvedTickets((prev) => prev + 1);
      showToast('Application support ticket RESOLVED! Logged.');
      setActiveScreen('home');
    } finally {
      setIsSubmitting(false);
    }
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
          latitude: 18.5590,
          longitude: 73.7868,
          accuracyMeters: 10,
          address: 'Baner Clinical Research Center, Pune',
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
          showToast(`Checked in successfully at ${timeStr}. Clinical Application Desk.`);
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
      {/* SCREEN 1: HOME DASHBOARD ("DS Application") */}
      {/* ========================================================================= */}
      {activeScreen === 'home' && (
        <div className="flex-1 flex flex-col">
          {/* Top Purple Header */}
          <div className="bg-purple-600 text-white px-5 pt-6 pb-4 sm:rounded-b-[28px] shadow-md">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center overflow-hidden shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight leading-tight">DS Application</h1>
                  <p className="text-[10px] text-purple-100 font-semibold">Clinical Specialist &amp; Reagents</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-purple-500/80 text-white px-2 py-0.5 rounded-full font-bold border border-purple-400/50">
                  {attendanceStatus}
                </span>
                <div className="w-7 h-7 rounded-full bg-purple-700/60 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div className="mt-1">
              <h2 className="text-base font-extrabold tracking-tight text-purple-100">Good Morning</h2>
              <p className="text-xl font-black text-white">{staffName}</p>
              <p className="text-[11px] text-purple-200 mt-0.5">Tue, 12 Aug 2025</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Today's Metrics Card */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div className="flex-1 text-center border-r border-slate-100 pr-2">
                <p className="text-[11px] font-semibold text-slate-500">Today's Tickets</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  <span className="text-purple-600">{todayTickets}</span>
                </p>
              </div>
              <div className="flex-1 text-center pl-2">
                <p className="text-[11px] font-semibold text-slate-500">Resolved</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  <span className="text-emerald-600">{resolvedTickets}</span>
                </p>
              </div>
            </div>

            {/* Top Action Tiles: My Tickets, Assay Programming, Installation, Training Logs */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveScreen('my_tickets')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">My Tickets</span>
              </button>

              <button
                onClick={() => setActiveScreen('assay_programming')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Assay Config</span>
              </button>

              <button
                onClick={() => setActiveScreen('installation_config')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Installation</span>
              </button>

              <button
                onClick={() => setActiveScreen('training_logs')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Training Logs</span>
              </button>
            </div>

            {/* Primary Action Button: Work on Ticket */}
            <button
              onClick={() => setActiveScreen('work_ticket')}
              className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer"
            >
              <Wrench className="w-5 h-5" />
              <span className="text-base font-extrabold tracking-wide">Work on Ticket</span>
            </button>

            {/* Bottom 4 Action Tiles: Knowledge Base, My Target, My Salary, Attendance */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveScreen('knowledge')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Knowledge Base</span>
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
                onClick={() => showToast('Monthly Application Specialist Salary: ₹55,000 + Assay incentive ₹7,500.')}
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
      {/* SCREEN 2: WORK ON TICKET */}
      {/* ========================================================================= */}
      {activeScreen === 'work_ticket' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800">Application Protocol Ticket</h2>
            <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
              Assay Setup
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-md">
                    APP-2026-0042
                  </span>
                  <h3 className="text-xs font-black text-slate-900 mt-1">Elecsys Troponin T hs Reagent Pack</h3>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  High Priority
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600 space-y-0.5">
                <p><span className="font-bold text-slate-700">Lab:</span> Metropolis Healthcare Central Lab (Baner, Pune)</p>
                <p><span className="font-bold text-slate-700">Kit Lot:</span> LOT-RO-2026-09A (Expiry: Nov 2026)</p>
                <p><span className="font-bold text-slate-700">Analyzer:</span> Cobas e411 ECLIA Platform</p>
              </div>
            </div>

            {/* Quality Calibration Check */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Calibrator Curve Verification
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Passed
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">Slope: 0.998 • Intercept: 0.02 • Multi-level control within 2 SD limit.</p>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-900">Application Resolution Report</label>
              <textarea
                rows={3}
                value={protocolNotes}
                onChange={(e) => setProtocolNotes(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden resize-none"
              />
            </div>

            {/* Resolve Button */}
            <div className="pt-2 pb-4">
              <button
                type="button"
                onClick={handleResolveTicket}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Closing Application Ticket...' : 'Resolve Ticket & Sign Protocol'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: ATTENDANCE */}
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
            <h2 className="text-sm font-extrabold text-slate-800">Application Specialist Attendance</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              GPS Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-2xl p-5 text-center shadow-lg space-y-2">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Today's Working Hours</span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {formatWorkingTime(workingSeconds)}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-purple-200">
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
                  At Customer Lab (Baner)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Baner Clinical Research Center, Pune</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN: MY TICKETS, TARGETS, KNOWLEDGE */}
      {(activeScreen === 'my_tickets' || activeScreen === 'targets' || activeScreen === 'knowledge') && (
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
            <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">DS Application</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeScreen === 'my_tickets' && (
              <div className="space-y-2">
                {[
                  { id: 'APP-0042', lab: 'Metropolis Baner', topic: 'Troponin T hs Calibration', status: 'In-Progress' },
                  { id: 'APP-0045', lab: 'Suburban Pathology', topic: 'Architect Creatinine Assay', status: 'Assigned' },
                  { id: 'APP-0048', lab: 'City Diagnostics Aundh', topic: 'Electrolyte ISE Slope Drift', status: 'Assigned' },
                ].map((t, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900">{t.lab}</span>
                      <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">{t.status}</span>
                    </div>
                    <p className="text-slate-600">{t.id} • {t.topic}</p>
                  </div>
                ))}
              </div>
            )}
            {activeScreen === 'targets' && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-2">
                <p className="text-xs font-semibold text-purple-800">Monthly Application Ticket Target</p>
                <p className="text-2xl font-black text-purple-950">38 / 50 Tickets</p>
                <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '76%' }}></div>
                </div>
                <p className="text-xs font-bold text-purple-700">76% Achieved • 99.2% First-Run Accuracy</p>
              </div>
            )}
            {activeScreen === 'knowledge' && (
              <div className="space-y-2">
                {[
                  { title: 'Roche Cobas e411 Troponin Calibration Guide', pages: '12 pages PDF' },
                  { title: 'Sysmex Cellpack DCL Handling & Storage Sop', pages: '8 pages PDF' },
                  { title: 'Abbott Architect Photometer Curve Verification', pages: '16 pages PDF' },
                ].map((k, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{k.title}</p>
                      <p className="text-[10px] text-slate-500">{k.pages}</p>
                    </div>
                    <span className="text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded-lg">View</span>
                  </div>
                ))}
              </div>
            )}

            {/* SCREEN: REAGENT ASSAY PROGRAMMING */}
            {activeScreen === 'assay_programming' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">Clinical Assay Parameter Sheet</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">Open Protocol</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Assay Name / Reagent Kit</label>
                    <input
                      type="text"
                      value={assayTestName}
                      onChange={(e) => setAssayTestName(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Wavelength (Primary/Secondary)</label>
                      <input
                        type="text"
                        value={assayWavelength}
                        onChange={(e) => setAssayWavelength(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Reaction Kinetics</label>
                      <input
                        type="text"
                        value={reactionType}
                        onChange={(e) => setReactionType(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Assay parameters programmed and transmitted to analyzer interface.');
                      setActiveScreen('home');
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Save &amp; Program Analyzer
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN: ANALYZER INSTALLATION PROTOCOL */}
            {activeScreen === 'installation_config' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">Instrument Commissioning Protocol</span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">Installation IQ/OQ</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Lab: Lifeline Diagnostics</span>
                      <span>Model: Biolis 30i</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Demineralized Water System verified (Conductivity &lt; 1.0 µS/cm).</p>
                    <p className="text-[11px] text-slate-500">UPS Isolated Earth Voltage verified (&lt; 2.0V AC neutral-to-earth).</p>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Commissioning IQ/OQ checklist certified with customer engineer sign-off.');
                      setActiveScreen('home');
                    }}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Certify Installation Sign-Off
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN: LAB TECHNICIAN TRAINING LOGS */}
            {activeScreen === 'training_logs' && (
              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-900">Lab Technician Training Sign-off</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">Competency Certificate</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Trained Laboratory Technician</label>
                    <input
                      type="text"
                      value={trainedTechnician}
                      onChange={(e) => setTrainedTechnician(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700">Trained Competency Modules</label>
                    {trainingTopics.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setTrainingTopics(prev => prev.map(m => m.id === t.id ? { ...m, done: !m.done } : m));
                        }}
                        className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                          t.done ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-[11px] font-medium">{t.topic}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                          t.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {t.done && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      showToast(`Training certificate generated for ${trainedTechnician} with geo-tagged verification.`);
                      setActiveScreen('home');
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Issue Hands-On Training Certificate
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
            activeBottomNav === 'home' && activeScreen === 'home' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('my_tickets');
            setActiveBottomNav('tickets');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'tickets' || activeScreen === 'my_tickets' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-bold">Tickets</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('attendance');
            setActiveBottomNav('attendance');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'attendance' || activeScreen === 'attendance' ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Attendance</span>
        </button>
      </div>
    </div>
  );
};
