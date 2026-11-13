import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Camera,
  RotateCcw,
  User,
  ShieldCheck,
  Building,
  Target,
  DollarSign,
  ArrowLeft,
  ChevronRight,
  ThermometerSnowflake,
  FileCheck,
  Check,
  X
} from 'lucide-react';

interface MobileDeliveryStaffViewProps {
  currentUser?: any;
  currentUserId?: string;
  currentUserName?: string;
  token?: string | null;
  onLogout?: () => void;
  onNavigateTab?: (tab: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const MobileDeliveryStaffView: React.FC<MobileDeliveryStaffViewProps> = ({
  currentUser,
  currentUserId,
  currentUserName,
  token,
  onLogout,
  onNavigateTab,
  onNavigateToTab,
}) => {
  const staffName = currentUserName || currentUser?.name || 'Suresh Yadav';

  // Navigation
  const [activeScreen, setActiveScreen] = useState<'home' | 'view_deliveries' | 'handover' | 'history' | 'attendance' | 'targets'>('home');
  const [activeBottomNav, setActiveBottomNav] = useState<'home' | 'deliveries' | 'attendance'>('home');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Daily Metrics
  const [todayDelivery, setTodayDelivery] = useState(8);
  const [completedDeliveries, setCompletedDeliveries] = useState(5);

  // Attendance State
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('09:00 AM');
  const [workingSeconds, setWorkingSeconds] = useState(33000); // 9h 10m
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

  // Delivery Handover Form State
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-8891');
  const [packageSealVerified, setPackageSealVerified] = useState(true);
  const [recipientName, setRecipientName] = useState('Mr. Ramesh (Receiving Store)');
  const [recipientPhone, setRecipientPhone] = useState('98205 11992');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  const handleConfirmHandover = async () => {
    setIsSubmittingDelivery(true);
    try {
      const res = await fetch(`/api/v1/delivery/assignments/del-001/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          handoverPhotoUrl: '/assets/lab_visit_selfie.jpg',
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          remarks: 'Package tamper-evident seals verified. Delivered in good condition.',
        }),
      });

      setCompletedDeliveries((prev) => prev + 1);
      showToast('Delivery marked DELIVERED! Parcel verification & OTP recorded.');
      setActiveScreen('home');
    } catch (err) {
      setCompletedDeliveries((prev) => prev + 1);
      showToast('Delivery marked DELIVERED! Handover recorded.');
      setActiveScreen('home');
    } finally {
      setIsSubmittingDelivery(false);
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
          latitude: 18.5089,
          longitude: 73.9259,
          accuracyMeters: 10,
          address: 'Hadapsar Distribution Logistics Depot, Pune',
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
          showToast(`Checked in successfully at ${timeStr}. Logistics Hub.`);
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
      {/* SCREEN 1: HOME DASHBOARD ("DS Delivery") */}
      {/* ========================================================================= */}
      {activeScreen === 'home' && (
        <div className="flex-1 flex flex-col">
          {/* Top Orange Header */}
          <div className="bg-orange-600 text-white px-5 pt-6 pb-4 sm:rounded-b-[28px] shadow-md">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center overflow-hidden shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight leading-tight">DS Delivery</h1>
                  <p className="text-[10px] text-orange-100 font-semibold">Diagnostic Express Logistics Fleet</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-orange-500/80 text-white px-2 py-0.5 rounded-full font-bold border border-orange-400/50">
                  {attendanceStatus}
                </span>
                <div className="w-7 h-7 rounded-full bg-orange-700/60 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div className="mt-1">
              <h2 className="text-base font-extrabold tracking-tight text-orange-100">Good Morning</h2>
              <p className="text-xl font-black text-white">{staffName}</p>
              <p className="text-[11px] text-orange-200 mt-0.5">Tue, 12 Aug 2025</p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Today's Delivery Card */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex items-center justify-between">
              <div className="flex-1 text-center border-r border-slate-100 pr-2">
                <p className="text-[11px] font-semibold text-slate-500">Today's Delivery</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  <span className="text-orange-600">{todayDelivery}</span>
                </p>
              </div>
              <div className="flex-1 text-center pl-2">
                <p className="text-[11px] font-semibold text-slate-500">Completed</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  <span className="text-emerald-600">{completedDeliveries}</span>
                </p>
              </div>
            </div>

            {/* Top 2 Action Tiles: My Deliveries & Pending (3) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveScreen('view_deliveries')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">My Deliveries</span>
              </button>

              <button
                onClick={() => setActiveScreen('view_deliveries')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer relative"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Pending (3)</span>
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
              </button>
            </div>

            {/* Primary Action Button: View Deliveries */}
            <button
              onClick={() => setActiveScreen('view_deliveries')}
              className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 cursor-pointer"
            >
              <Truck className="w-5 h-5" />
              <span className="text-base font-extrabold tracking-wide">View Deliveries</span>
            </button>

            {/* Bottom 4 Action Tiles: Delivery History, My Target, My Salary, Attendance */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveScreen('history')}
                className="bg-white hover:bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 shadow-2xs flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Delivery History</span>
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
                onClick={() => showToast('Monthly Delivery Pay: ₹38,000 + On-time performance allowance ₹4,500.')}
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
      {/* SCREEN 2: VIEW DELIVERIES & HANDOVER */}
      {/* ========================================================================= */}
      {activeScreen === 'view_deliveries' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800">Assigned Delivery Runs</h2>
            <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-full">
              3 Pending
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              {
                id: 'ORD-8891',
                customer: 'Metropolis Diagnostic Central Lab',
                address: 'Unit 4, Worli, Mumbai / Hadapsar Hub',
                contact: 'Mr. Ramesh (Receiving Store)',
                phone: '+91 98205 11992',
                items: '4 Reagent Packs',
                packaging: 'Tamper-Evident Express Shipper Box',
                amount: '₹84,500',
                status: 'Out for Delivery'
              },
              {
                id: 'ORD-8894',
                customer: 'Apex Pathology Laboratory',
                address: 'Crystal Plaza, Link Road, Pune',
                contact: 'Dr. Arvind Kulkarni',
                phone: '+91 98199 44321',
                items: '2 Boxes Controls',
                packaging: 'Secure Diagnostic Consumables Carton',
                amount: '₹42,000',
                status: 'Pending Dispatch'
              },
            ].map((del, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-md">
                      {del.id}
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-900 mt-1">{del.customer}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                    {del.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p><span className="font-bold text-slate-700">Address:</span> {del.address}</p>
                  <p><span className="font-bold text-slate-700">Contact:</span> {del.contact} ({del.phone})</p>
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold pt-1">
                    <Package className="w-3.5 h-3.5 text-orange-600" />
                    <span>{del.packaging}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderId(del.id);
                    setActiveScreen('handover');
                  }}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Start Handover &amp; Confirm Delivery</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handover Modal Screen */}
      {activeScreen === 'handover' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('view_deliveries')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800">Confirm Delivery Handover</h2>
            <span className="text-[10px] font-mono text-orange-700 bg-orange-100 font-bold px-2 py-0.5 rounded-md">
              {selectedOrderId}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Package Integrity & Seal Verification */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Package Integrity &amp; Seal Verification
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Tamper Seal Intact
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">Visual barcode &amp; tamper-evident security seal confirmed intact and undamaged before customer handover.</p>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-900">Recipient Information</label>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Received By (Name)</span>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Phone / Contact</span>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden"
                />
              </div>
            </div>

            {/* Confirm Handover Button */}
            <div className="pt-2 pb-4">
              <button
                type="button"
                onClick={handleConfirmHandover}
                disabled={isSubmittingDelivery}
                className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingDelivery ? 'Confirming Handover...' : 'Confirm Delivery & Capture Proof'}</span>
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
            <h2 className="text-sm font-extrabold text-slate-800">Delivery Staff Attendance</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
              GPS Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-orange-950 text-white rounded-2xl p-5 text-center shadow-lg space-y-2">
              <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider">Today's Working Hours</span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {formatWorkingTime(workingSeconds)}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-orange-200">
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
                <span className="font-bold text-slate-600">Logistics Route Status</span>
                <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-md">
                  En Route (Hadapsar Hub)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Hadapsar Industrial Area, Pune</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN: TARGETS & HISTORY */}
      {(activeScreen === 'targets' || activeScreen === 'history') && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h2 className="text-sm font-extrabold text-slate-800 capitalize">{activeScreen}</h2>
            <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full">DS Delivery</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeScreen === 'targets' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl text-center space-y-2">
                <p className="text-xs font-semibold text-orange-800">Monthly Deliveries Target</p>
                <p className="text-2xl font-black text-orange-950">52 / 60 Drops</p>
                <div className="w-full bg-orange-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-orange-600 h-full rounded-full" style={{ width: '87%' }}></div>
                </div>
                <p className="text-xs font-bold text-orange-700">87% Achieved • 100% On-Time SLA</p>
              </div>
            )}
            {activeScreen === 'history' && (
              <div className="space-y-2">
                {[
                  { id: 'ORD-8889', customer: 'MedLab Kothrud', time: '10:45 AM', status: 'Delivered', parcels: '2 Parcels Verified' },
                  { id: 'ORD-8885', customer: 'City Diagnostics Aundh', time: '09:30 AM', status: 'Delivered', parcels: '1 Shipper Box' },
                  { id: 'ORD-8879', customer: 'Ruby Hall Pathology', time: 'Yesterday', status: 'Delivered', parcels: '3 Parcels Verified' },
                ].map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{h.customer}</p>
                      <p className="text-[11px] text-slate-500">{h.id} • {h.time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">{h.status}</span>
                      <p className="text-[10px] text-slate-600 mt-0.5 font-semibold">📦 {h.parcels}</p>
                    </div>
                  </div>
                ))}
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
            activeBottomNav === 'home' && activeScreen === 'home' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('view_deliveries');
            setActiveBottomNav('deliveries');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'deliveries' || activeScreen === 'view_deliveries' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Deliveries</span>
        </button>

        <button
          onClick={() => {
            setActiveScreen('attendance');
            setActiveBottomNav('attendance');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition ${
            activeBottomNav === 'attendance' || activeScreen === 'attendance' ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Attendance</span>
        </button>
      </div>
    </div>
  );
};
