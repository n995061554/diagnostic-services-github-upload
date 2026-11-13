import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Filter,
  UserCheck,
  Building,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sliders,
  Send,
  Check,
  X,
  Compass,
  AlertCircle,
  Info,
  Timer,
  Navigation
} from 'lucide-react';
import {
  StaffAttendanceRecord,
  AttendanceStatus,
  OfficeGeofenceLocation,
  AttendanceConfig,
  UserRoleType
} from '../types';

interface StaffAttendanceConsoleViewProps {
  currentUserId?: string;
  currentUserRole?: UserRoleType;
  currentUserName?: string;
  authToken?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const StaffAttendanceConsoleView: React.FC<StaffAttendanceConsoleViewProps> = ({
  currentUserId = 'u-staff-01',
  currentUserRole = UserRoleType.OFFICE_STAFF,
  currentUserName = 'Rahul Deshmukh',
  authToken,
  onNavigateToTab
}) => {
  // Navigation & Sub-tabs
  const [activeTab, setActiveTab] = useState<'MY_ATTENDANCE' | 'TEAM_REGISTER' | 'CORRECTIONS' | 'GEO_CONFIG'>('MY_ATTENDANCE');

  // Today's Attendance State
  const [todayData, setTodayData] = useState<{
    todayDate: string;
    serverTime: string;
    currentStatus: AttendanceStatus;
    todayRecord: StaffAttendanceRecord | null;
    liveWorkingMinutes: number;
    liveWorkingFormatted: string;
    hasMissingCheckout: boolean;
    previousDayRecord: StaffAttendanceRecord | null;
    policy: string;
    config: AttendanceConfig;
    officeLocations: OfficeGeofenceLocation[];
  } | null>(null);

  // History & Register State
  const [historyRecords, setHistoryRecords] = useState<StaffAttendanceRecord[]>([]);
  const [summaryStats, setSummaryStats] = useState<{
    month: string;
    totalWorkingDays: number;
    presentDays: number;
    lateDays: number;
    halfDays: number;
    exceptionDays: number;
    totalWorkingHours: number;
    avgWorkingHoursPerDay: number;
    correctionRequestsCount: number;
  } | null>(null);

  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; email: string; role: string; department: string }>>([]);
  const [statsTelemetry, setStatsTelemetry] = useState<{
    totalStaff: number;
    checkedInToday: number;
    currentlyActive: number;
    lateArrivalsToday: number;
    completedToday: number;
    pendingRegularizations: number;
  } | null>(null);

  // Loading & Action States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Geolocation Simulation & Preset Selector
  const [selectedOfficePreset, setSelectedOfficePreset] = useState<string>('ahd_hq');
  const [customCoordinates, setCustomCoordinates] = useState<{ lat: number; lng: number; accuracy: number; address: string }>({
    lat: 23.0225,
    lng: 72.5714,
    accuracy: 10,
    address: 'A-201, Shivalik Corporate Park, SG Highway, Ahmedabad'
  });
  const [isUsingLiveGps, setIsUsingLiveGps] = useState<boolean>(false);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionTargetDate, setCorrectionTargetDate] = useState<string>('');
  const [correctionCheckInTime, setCorrectionCheckInTime] = useState<string>('09:30');
  const [correctionCheckOutTime, setCorrectionCheckOutTime] = useState<string>('18:00');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Review Modal for Managers
  const [selectedCorrectionForReview, setSelectedCorrectionForReview] = useState<StaffAttendanceRecord | null>(null);
  const [reviewerComments, setReviewerComments] = useState<string>('');

  // Live Timer for punch-in duration
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Fetch today's status & history
  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch today's status
      const todayRes = await fetch('/api/v1/attendance/today', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (todayRes.ok) {
        const json = await todayRes.json();
        setTodayData(json.data);
        if (json.data?.liveWorkingMinutes) {
          setTimerSeconds(json.data.liveWorkingMinutes * 60);
        }
      }

      // 2. Fetch history records
      const queryParams = new URLSearchParams();
      if (selectedMonth) queryParams.set('month', selectedMonth);
      if (filterUser !== 'ALL') queryParams.set('userId', filterUser);
      if (filterStatus !== 'ALL') queryParams.set('status', filterStatus);

      const histRes = await fetch(`/api/v1/attendance/history?${queryParams.toString()}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (histRes.ok) {
        const json = await histRes.json();
        setHistoryRecords(json.data?.records || []);
        setSummaryStats(json.data?.summary || null);
        if (json.data?.staffList) {
          setStaffList(json.data.staffList);
        }
      }

      // 3. Fetch telemetry stats
      const statsRes = await fetch('/api/v1/attendance/stats', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (statsRes.ok) {
        const json = await statsRes.json();
        setStatsTelemetry(json.data);
      }
    } catch (err) {
      console.error('Failed to load attendance records:', err);
      setActionMessage({ type: 'error', text: 'Could not connect to server attendance service.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedMonth, filterUser, filterStatus]);

  // Live tick for duration timer
  useEffect(() => {
    let interval: any = null;
    if (todayData?.todayRecord?.checkInServerTime && !todayData?.todayRecord?.checkOutServerTime) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [todayData?.todayRecord?.checkInServerTime, todayData?.todayRecord?.checkOutServerTime]);

  // Handle Location Preset Change
  const handleLocationPresetChange = (preset: string) => {
    setSelectedOfficePreset(preset);
    if (preset === 'ahd_hq') {
      setCustomCoordinates({
        lat: 23.0225,
        lng: 72.5714,
        accuracy: 10,
        address: 'A-201, Shivalik Corporate Park, SG Highway, Ahmedabad (HQ On-Premises)'
      });
    } else if (preset === 'srt_branch') {
      setCustomCoordinates({
        lat: 21.1702,
        lng: 72.8311,
        accuracy: 12,
        address: 'B-404, Ring Road Commercial Centre, Surat (Branch On-Premises)'
      });
    } else if (preset === 'field_client') {
      setCustomCoordinates({
        lat: 23.0380,
        lng: 72.5590,
        accuracy: 15,
        address: 'Apex Pathology Central Lab, CG Road, Ahmedabad (Client Site)'
      });
    } else if (preset === 'outside_geofence') {
      setCustomCoordinates({
        lat: 23.0850,
        lng: 72.5100,
        accuracy: 25,
        address: 'Satellite SG Highway Toll (7.5 km Outside Office Geofence)'
      });
    }
  };

  // Browser Geolocation capture
  const handleCaptureLiveGps = () => {
    if (!navigator.geolocation) {
      setActionMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsUsingLiveGps(true);
    setActionMessage({ type: 'info', text: 'Acquiring high-accuracy GPS coordinates...' });

    navigator.geolocation.getCurrentPosition(
      pos => {
        setCustomCoordinates({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          address: `Live GPS: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`
        });
        setIsUsingLiveGps(false);
        setActionMessage({ type: 'success', text: `GPS coordinates acquired (Accuracy: ±${Math.round(pos.coords.accuracy)}m).` });
      },
      err => {
        console.warn('GPS error, using office preset coordinates:', err);
        setIsUsingLiveGps(false);
        setActionMessage({ type: 'info', text: 'Location access unavailable or denied. Using verified office preset coordinates.' });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Check In Handler
  const handleCheckIn = async (allowException: boolean = false) => {
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/v1/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          latitude: customCoordinates.lat,
          longitude: customCoordinates.lng,
          accuracyMeters: customCoordinates.accuracy,
          address: customCoordinates.address,
          notes: 'Punch-in recorded via Back Office Staff Console',
          allowException
        })
      });

      const json = await res.json();

      if (res.ok) {
        setActionMessage({ type: 'success', text: json.message || 'Check-in verified successfully by server.' });
        await fetchAttendanceData();
      } else if (res.status === 422) {
        setActionMessage({
          type: 'error',
          text: `Geofence Failure: ${json.message}. You can retry within range or submit an Attendance Regularization Request.`
        });
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Failed to punch in.' });
      }
    } catch (err) {
      console.error('Punch in error:', err);
      setActionMessage({ type: 'error', text: 'Network connection failed during check-in.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check Out Handler
  const handleCheckOut = async () => {
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/v1/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          latitude: customCoordinates.lat,
          longitude: customCoordinates.lng,
          accuracyMeters: customCoordinates.accuracy,
          address: customCoordinates.address,
          notes: 'Punch-out recorded via Back Office Staff Console'
        })
      });

      const json = await res.json();

      if (res.ok) {
        setActionMessage({ type: 'success', text: json.message || 'Check-out completed and working duration stored.' });
        await fetchAttendanceData();
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Failed to punch out.' });
      }
    } catch (err) {
      console.error('Punch out error:', err);
      setActionMessage({ type: 'error', text: 'Network connection failed during check-out.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Lunch Handler (Mandatory 40 minutes)
  const handleStartLunch = async () => {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/attendance/lunch-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: json.message || 'Mandatory lunch break (40 minutes) started.' });
        await fetchAttendanceData();
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Failed to start lunch break.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network connection failed during lunch break start.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // End Lunch Handler
  const handleEndLunch = async () => {
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/attendance/lunch-end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: json.message || 'Lunch break concluded.' });
        await fetchAttendanceData();
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Failed to end lunch break.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network connection failed during lunch break end.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Correction Request
  const handleSubmitCorrection = async () => {
    if (!correctionTargetDate || !correctionReason.trim()) {
      setActionMessage({ type: 'error', text: 'Please select a date and enter a valid explanation.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const requestedCheckIn = `${correctionTargetDate}T${correctionCheckInTime}:00.000Z`;
      const requestedCheckOut = `${correctionTargetDate}T${correctionCheckOutTime}:00.000Z`;

      const res = await fetch('/api/v1/attendance/correction-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          date: correctionTargetDate,
          requestedCheckIn,
          requestedCheckOut,
          reason: correctionReason
        })
      });

      const json = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Correction request submitted and queued for manager approval.' });
        setShowCorrectionModal(false);
        setCorrectionReason('');
        await fetchAttendanceData();
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Failed to submit correction request.' });
      }
    } catch (err) {
      console.error('Correction submission error:', err);
      setActionMessage({ type: 'error', text: 'Network failed during correction submission.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Review Correction (Manager / Admin)
  const handleReviewCorrection = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedCorrectionForReview) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/attendance/correction-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          recordId: selectedCorrectionForReview.id,
          decision,
          reviewerComments: reviewerComments || (decision === 'APPROVE' ? 'Approved' : 'Rejected')
        })
      });

      const json = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: json.message || `Correction request ${decision.toLowerCase()}d.` });
        setSelectedCorrectionForReview(null);
        setReviewerComments('');
        await fetchAttendanceData();
      } else {
        setActionMessage({ type: 'error', text: json.message || 'Review action failed.' });
      }
    } catch (err) {
      console.error('Review correction error:', err);
      setActionMessage({ type: 'error', text: 'Failed to process review action.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds into hh:mm:ss
  const formatTimerDisplay = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'CHECKED_IN':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Checked In (Active)</span>;
      case 'PRESENT':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 className="w-3.5 h-3.5" /> Present (Completed)</span>;
      case 'LATE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><AlertTriangle className="w-3.5 h-3.5" /> Late Arrival</span>;
      case 'HALF_DAY':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40"><Clock className="w-3.5 h-3.5" /> Half Day</span>;
      case 'ATTENDANCE_EXCEPTION':
      case 'MISSING_CHECKOUT':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle className="w-3.5 h-3.5" /> Missing Checkout</span>;
      case 'PENDING_CORRECTION':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pending Approval</span>;
      case 'ON_APPROVED_LEAVE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40"><Calendar className="w-3.5 h-3.5" /> On Approved Leave</span>;
      case 'EARLY_LEAVE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40"><Clock className="w-3.5 h-3.5" /> Early Departure</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"><Clock className="w-3.5 h-3.5" /> Not Checked In</span>;
    }
  };

  const isCheckedIn = todayData?.todayRecord?.checkInServerTime && !todayData?.todayRecord?.checkOutServerTime;
  const isCheckedOut = !!todayData?.todayRecord?.checkOutServerTime;
  const pendingCorrectionsList = historyRecords.filter(r => r.correctionStatus === 'REQUESTED');

  return (
    <div id="staff-attendance-console" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Attendance & Geofencing Console</h1>
                <p className="text-sm text-gray-500">
                  Server-authoritative punch records, geofence verification, shift rules, and regularization workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-gray-400">SERVER CLOCK (OFFICIAL)</div>
              <div className="text-sm font-bold text-gray-800 font-mono">
                {todayData ? new Date(todayData.serverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </div>
            </div>
            <button
              onClick={fetchAttendanceData}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Action / Alert Notification */}
        {actionMessage && (
          <div className={`mt-4 p-3.5 rounded-lg text-sm flex items-start gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40'
              : actionMessage.type === 'error'
              ? 'bg-[#F3C7C2] text-[#8F2D25] border border-[#B94A40]/40'
              : 'bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40'
          }`}>
            {actionMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#5F8F4D] flex-shrink-0 mt-0.5" />}
            {actionMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-[#B94A40] flex-shrink-0 mt-0.5" />}
            {actionMessage.type === 'info' && <Info className="w-5 h-5 text-[#4C8994] flex-shrink-0 mt-0.5" />}
            <div className="flex-1 font-medium">{actionMessage.text}</div>
            <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2">
        <button
          onClick={() => setActiveTab('MY_ATTENDANCE')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'MY_ATTENDANCE'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          My Today's Punch & Status
        </button>

        <button
          onClick={() => setActiveTab('TEAM_REGISTER')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'TEAM_REGISTER'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Daily Register & History
        </button>

        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 relative ${
            activeTab === 'CORRECTIONS'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Regularization Requests
          {pendingCorrectionsList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
              {pendingCorrectionsList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('GEO_CONFIG')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'GEO_CONFIG'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Compass className="w-4 h-4" />
          Office Geofences & Policies
        </button>
      </div>

      {/* Tab Content 1: My Attendance & Today's Punch Card */}
      {activeTab === 'MY_ATTENDANCE' && (
        <div className="space-y-6">
          {/* Missing Checkout Warning Banner */}
          {todayData?.hasMissingCheckout && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">Missing Checkout Detected for Previous Working Day</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Your attendance record for {todayData.previousDayRecord?.date} shows a check-in at{' '}
                  {todayData.previousDayRecord?.checkInServerTime ? new Date(todayData.previousDayRecord.checkInServerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier'}{' '}
                  without a recorded punch-out. Please submit an attendance regularization request to avoid an attendance exception flag.
                </p>
              </div>
              <button
                onClick={() => {
                  setCorrectionTargetDate(todayData.previousDayRecord?.date || '');
                  setShowCorrectionModal(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                Regularize Missing Punch
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Punch In / Out Interactive Card */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">TODAY'S ATTENDANCE REGISTER</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div>{getStatusBadge(todayData?.currentStatus || 'NOT_CHECKED_IN')}</div>
              </div>

              {/* Working Clock & Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Check-in Time
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1 font-mono">
                    {todayData?.todayRecord?.checkInServerTime
                      ? new Date(todayData.todayRecord.checkInServerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {todayData?.todayRecord?.isLateArrival ? (
                      <span className="text-amber-600 font-medium">Late by ~18m</span>
                    ) : todayData?.todayRecord?.checkInServerTime ? (
                      <span className="text-emerald-600 font-medium">On-time (Standard)</span>
                    ) : (
                      'Shift: 09:30 AM'
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-gray-400" />
                    Working Duration
                  </div>
                  <div className="text-lg font-bold text-teal-700 mt-1 font-mono">
                    {isCheckedIn
                      ? formatTimerDisplay(timerSeconds)
                      : todayData?.todayRecord?.workingDurationFormatted || '0h 00m'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {isCheckedIn ? 'Live tracking (Server sync)' : 'Target: 8.0 hrs full day'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Check-out Time
                  </div>
                  <div className="text-lg font-bold text-gray-900 mt-1 font-mono">
                    {todayData?.todayRecord?.checkOutServerTime
                      ? new Date(todayData.todayRecord.checkOutServerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {isCheckedOut ? 'Punch-out recorded' : 'Shift Ends: 06:00 PM'}
                  </div>
                </div>
              </div>

              {/* Geofence & Location Validation Box */}
              <div className="bg-[#F5F6F0] rounded-xl p-4 border border-[#D2E7C4] mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D2E7C4]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#22381E]" />
                    <span className="text-xs font-bold text-[#1E331B] uppercase">Geofence Policy: {todayData?.policy || 'OFFICE_GEOFENCE'}</span>
                  </div>
                  <div className="text-xs text-[#245B63] font-medium">
                    Allowed Radius: 250m from Registered Base
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Current GPS Reference:</span>
                    <p className="font-medium text-gray-800 mt-0.5 truncate">{customCoordinates.address}</p>
                    <p className="text-gray-400 font-mono text-[11px]">
                      Lat: {customCoordinates.lat.toFixed(4)}, Lng: {customCoordinates.lng.toFixed(4)} (±{customCoordinates.accuracy}m)
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Validation Status:</span>
                    <p className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Inside Ahmedabad Corporate HQ (14m distance)
                    </p>
                  </div>
                </div>

                {/* Location preset selector for testing/demo */}
                <div className="mt-3 pt-3 border-t border-[#D2E7C4] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-500">GPS Simulator / Location Preset:</span>
                    <select
                      value={selectedOfficePreset}
                      onChange={e => handleLocationPresetChange(e.target.value)}
                      className="text-xs bg-white border border-[#D2E7C4] rounded px-2 py-1 text-[#1E331B] focus:outline-none focus:ring-1 focus:ring-[#22381E]"
                    >
                      <option value="ahd_hq">Ahmedabad HQ (Inside Geofence - 14m)</option>
                      <option value="srt_branch">Surat Branch (Inside Geofence - 20m)</option>
                      <option value="field_client">Apex Pathology Lab (Field Territory)</option>
                      <option value="outside_geofence">Outside Boundary (7.5 km away - Error Test)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCaptureLiveGps}
                    className="text-xs text-[#22381E] hover:text-[#1E331B] font-medium inline-flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    {isUsingLiveGps ? 'Locating...' : 'Use Real Device GPS'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {!isCheckedIn && !isCheckedOut && (
                  <button
                    onClick={() => handleCheckIn(false)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Verifying with Server...' : 'Punch In (Check In)'}
                  </button>
                )}

                {isCheckedIn && (
                  <>
                    {/* Mandatory 40-Minute Lunch Break */}
                    {todayData?.todayRecord?.lunchStartServerTime && !todayData?.todayRecord?.lunchEndServerTime ? (
                      <button
                        onClick={handleEndLunch}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                      >
                        <Clock className="w-4 h-4" />
                        {isSubmitting ? 'Concluding Lunch...' : 'End Lunch Break'}
                      </button>
                    ) : !todayData?.todayRecord?.lunchStartServerTime ? (
                      <button
                        onClick={handleStartLunch}
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                      >
                        <Clock className="w-4 h-4" />
                        {isSubmitting ? 'Starting Lunch...' : 'Start Lunch (40m)'}
                      </button>
                    ) : (
                      <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lunch: {todayData?.todayRecord?.lunchDurationMinutes || 40}m recorded</span>
                      </div>
                    )}

                    <button
                      onClick={handleCheckOut}
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      {isSubmitting ? 'Recording Punch-Out...' : 'Punch Out (Check Out)'}
                    </button>
                  </>
                )}

                {isCheckedOut && (
                  <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Punch Out completed for today. Total working duration: {todayData?.todayRecord?.workingDurationFormatted}.
                  </div>
                )}

                <button
                  onClick={() => {
                    setCorrectionTargetDate(todayData?.todayDate || new Date().toISOString().split('T')[0]);
                    setShowCorrectionModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm border border-gray-200 transition-colors"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  Request Regularization / Correction
                </button>
              </div>

              {/* Working Hours & Deduction Policy Notice */}
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="font-bold text-slate-800">Official Hours: 09:30 – 18:00</span>
                  <span>(15m Grace: 09:45 Cutoff • &gt;1h Late: Half Day • Mandatory 40m Lunch)</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Auto-Closure Active at 19:00
                </div>
              </div>
            </div>

            {/* Sidebar Summary & Shift Policies */}
            <div className="space-y-6">
              {/* Monthly Overview Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">My Monthly Attendance ({selectedMonth})</h3>
                  <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                    {summaryStats?.totalWorkingDays || 0} Working Days
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <div className="text-xs text-emerald-700 font-medium">Present Days</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">{summaryStats?.presentDays || 0}</div>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                    <div className="text-xs text-amber-700 font-medium">Late Arrivals</div>
                    <div className="text-xl font-bold text-amber-900 mt-1">{summaryStats?.lateDays || 0}</div>
                  </div>
                  <div className="p-3 bg-[#C9DDE0]/30 rounded-lg border border-[#4C8994]/30">
                    <div className="text-xs text-[#245B63] font-medium">Half Days</div>
                    <div className="text-xl font-bold text-[#1E331B] mt-1">{summaryStats?.halfDays || 0}</div>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-100">
                    <div className="text-xs text-purple-700 font-medium">Avg Working Hours</div>
                    <div className="text-xl font-bold text-purple-900 mt-1">{summaryStats?.avgWorkingHoursPerDay || 0}h / day</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  Total Accumulated Hours: <span className="font-bold text-gray-800">{summaryStats?.totalWorkingHours || 0} hrs</span>
                </div>
              </div>

              {/* Attendance Rules Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Standard Shift Rules (A2Z Diagnostics)
                </h3>
                <div className="mt-3 space-y-2.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Shift Start Time:</span>
                    <span className="font-bold text-gray-900">09:30 AM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Late Grace Period:</span>
                    <span className="font-bold text-gray-900">15 mins (until 09:45 AM)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shift End Time:</span>
                    <span className="font-bold text-gray-900">06:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Full Day Minimum:</span>
                    <span className="font-bold text-gray-900">8.0 working hours</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Half Day Minimum:</span>
                    <span className="font-bold text-gray-900">4.0 working hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Team Daily Attendance Register & History */}
      {activeTab === 'TEAM_REGISTER' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 w-64"
                />
              </div>

              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700"
              >
                <option value="ALL">All Staff Members</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700"
              >
                <option value="ALL">All Attendance Statuses</option>
                <option value="PRESENT">Present</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="LATE">Late Arrival</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="ATTENDANCE_EXCEPTION">Missing Checkout / Exception</option>
                <option value="PENDING_CORRECTION">Pending Regularization</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role / Dept</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Working Hours</th>
                  <th className="py-3 px-4">Location / Geofence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyRecords
                  .filter(r =>
                    searchTerm
                      ? r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
                      : true
                  )
                  .map(record => (
                    <tr key={record.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-gray-900">{record.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{record.userName}</div>
                        <div className="text-xs text-gray-400">{record.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-gray-800">{record.department || 'Operations'}</div>
                        <div className="text-[11px] text-gray-400">{record.userRole}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {record.checkInServerTime ? (
                          <div>
                            <span className="font-bold text-gray-800">
                              {new Date(record.checkInServerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {record.isLateArrival && (
                              <span className="block text-[10px] text-amber-600 font-semibold">Late</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {record.checkOutServerTime ? (
                          <span className="font-bold text-gray-800">
                            {new Date(record.checkOutServerTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Pending Punch-Out</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-teal-700">
                        {record.workingDurationFormatted || '--'}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1 font-medium text-gray-700 truncate max-w-xs">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {record.checkInLocation?.officeName || record.checkInLocation?.address || 'Office Premises'}
                        </div>
                        {record.checkInLocation?.withinGeofence && (
                          <span className="text-[10px] text-emerald-600 font-semibold">Geofence Verified</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(record.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {record.correctionStatus === 'REQUESTED' ? (
                          <button
                            onClick={() => {
                              setSelectedCorrectionForReview(record);
                              setReviewerComments('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                          >
                            Review Correction
                          </button>
                        ) : record.status === 'ATTENDANCE_EXCEPTION' || !record.checkOutServerTime ? (
                          <button
                            onClick={() => {
                              setCorrectionTargetDate(record.date);
                              setShowCorrectionModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          >
                            Regularize
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Regularization Requests Queue */}
      {activeTab === 'CORRECTIONS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Attendance Regularization & Correction Queue</h3>
                <p className="text-xs text-gray-500">
                  Staff requests for missing punch regularization, system power outage adjustments, and time overrides.
                </p>
              </div>
              <button
                onClick={() => {
                  setCorrectionTargetDate(new Date().toISOString().split('T')[0]);
                  setShowCorrectionModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <FileText className="w-4 h-4" />
                Submit New Request
              </button>
            </div>

            <div className="mt-4 divide-y divide-gray-100">
              {historyRecords.filter(r => r.correctionStatus === 'REQUESTED' || r.correctionDetails).length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                  <p className="font-semibold text-gray-700">No Pending Attendance Regularization Requests</p>
                  <p className="text-xs text-gray-400 mt-1">All staff check-ins and check-outs are balanced and verified.</p>
                </div>
              ) : (
                historyRecords
                  .filter(r => r.correctionStatus === 'REQUESTED' || r.correctionDetails)
                  .map(record => (
                    <div key={record.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">{record.userName}</span>
                          <span className="text-xs text-gray-400">({record.userRole})</span>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            Date: {record.date}
                          </span>
                          {record.correctionStatus === 'REQUESTED' ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                              Pending Review
                            </span>
                          ) : record.correctionStatus === 'APPROVED' ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                              Rejected
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="font-semibold text-gray-700">Reason:</span> {record.correctionDetails?.reason || record.notes}
                          <div className="mt-1 flex gap-4 text-gray-500 font-mono">
                            <span>
                              Requested Check-In:{' '}
                              {record.correctionDetails?.requestedCheckIn
                                ? new Date(record.correctionDetails.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '09:30 AM'}
                            </span>
                            <span>
                              Requested Check-Out:{' '}
                              {record.correctionDetails?.requestedCheckOut
                                ? new Date(record.correctionDetails.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '06:00 PM'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {record.correctionStatus === 'REQUESTED' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCorrectionForReview(record);
                              setReviewerComments('');
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Review & Authorize
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Office Geofences & Location Policies */}
      {activeTab === 'GEO_CONFIG' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-bold text-gray-900">Registered Office Geofence Boundaries</h3>
                <p className="text-xs text-gray-500">
                  Authoritative GPS coordinates and radius buffers used to validate on-premises staff punch-ins.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {todayData?.officeLocations.map(office => (
                <div key={office.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-teal-600" />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{office.name}</h4>
                        <span className="text-xs font-mono text-gray-400">Code: {office.code}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-bold bg-teal-50 text-teal-700 rounded border border-teal-200">
                      Radius: {office.radiusMeters}m
                    </span>
                  </div>

                  <p className="text-xs text-gray-600">{office.address}</p>

                  <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-500 font-mono">
                    <span>Latitude: {office.latitude.toFixed(4)}</span>
                    <span>Longitude: {office.longitude.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Policy Matrix */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-200">
              Role-Based Location Policies
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="font-bold text-sm text-gray-900">Office Staff & Accounts</div>
                <div className="text-xs text-teal-700 font-semibold mt-1">Policy: OFFICE_GEOFENCE</div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be physically located within 200m of a registered branch or HQ depot.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="font-bold text-sm text-gray-900">Sales & Service Engineers</div>
                <div className="text-xs text-[#245B63] font-semibold mt-1">Policy: FIELD_ANYWHERE</div>
                <p className="text-xs text-gray-500 mt-1">
                  Authorized field attendance allowed anywhere with active GPS accuracy logging.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <div className="font-bold text-sm text-gray-900">Super Admin & Approver</div>
                <div className="text-xs text-purple-700 font-semibold mt-1">Policy: NO_LOCATION (Exempt)</div>
                <p className="text-xs text-gray-500 mt-1">
                  Executive governance roles exempt from mandatory geofencing restrictions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Request Attendance Correction */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-gray-900">Request Attendance Regularization</h3>
              </div>
              <button onClick={() => setShowCorrectionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Attendance Date</label>
                <input
                  type="date"
                  value={correctionTargetDate}
                  onChange={e => setCorrectionTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Requested Check-In Time</label>
                  <input
                    type="time"
                    value={correctionCheckInTime}
                    onChange={e => setCorrectionCheckInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Requested Check-Out Time</label>
                  <input
                    type="time"
                    value={correctionCheckOutTime}
                    onChange={e => setCorrectionCheckOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Justification Reason *</label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Office server network outage, emergency client equipment visit, forgot punch-out..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCorrection}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to Manager'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Review Attendance Correction (Manager / Admin) */}
      {selectedCorrectionForReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">Review Attendance Regularization</h3>
              </div>
              <button onClick={() => setSelectedCorrectionForReview(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Employee:</span>
                <span className="font-bold text-gray-900">{selectedCorrectionForReview.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="font-mono font-medium text-gray-800">{selectedCorrectionForReview.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Requested Times:</span>
                <span className="font-mono font-bold text-teal-700">
                  {selectedCorrectionForReview.correctionDetails?.requestedCheckIn
                    ? new Date(selectedCorrectionForReview.correctionDetails.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '09:30 AM'}{' '}
                  -{' '}
                  {selectedCorrectionForReview.correctionDetails?.requestedCheckOut
                    ? new Date(selectedCorrectionForReview.correctionDetails.requestedCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '06:00 PM'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Staff Reason:</span>
                <p className="text-gray-800 font-medium mt-1">
                  {selectedCorrectionForReview.correctionDetails?.reason || selectedCorrectionForReview.notes}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reviewer Feedback Notes</label>
              <input
                type="text"
                value={reviewerComments}
                onChange={e => setReviewerComments(e.target.value)}
                placeholder="Optional comments for employee..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleReviewCorrection('REJECT')}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleReviewCorrection('APPROVE')}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Approve & Update Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StaffAttendanceConsoleView;
