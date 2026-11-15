import React, { useState } from 'react';
import {
  Users,
  User,
  MapPin,
  Clock,
  Calendar,
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  Eye,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  PhoneCall,
  Wrench,
  Truck,
  Stethoscope,
  ShieldCheck,
  X
} from 'lucide-react';

interface LiveStaffTrackingAndReportsViewProps {
  token?: string | null;
  onNavigateTab?: (tab: string) => void;
}

interface StaffLocation {
  id: string;
  name: string;
  role: 'Sales' | 'Service' | 'Delivery' | 'Application';
  trackingMode: 'LIVE_CONTINUOUS' | 'WORK_EVENT_GEO_TAG';
  status: 'At Visit' | 'On Service' | 'On Delivery' | 'At Customer' | 'Traveling' | 'On Route';
  lastUpdate: string;
  location: string;
  coords: { x: number; y: number }; // Percentage on Pune SVG map
  avatar?: string;
  photoUrl?: string;
}

const INITIAL_STAFF_LOCATIONS: StaffLocation[] = [
  {
    id: 'st-01',
    name: 'Rohit Sharma',
    role: 'Sales',
    trackingMode: 'LIVE_CONTINUOUS',
    status: 'At Visit',
    lastUpdate: '10:32 AM',
    location: 'Aundh, Pune',
    coords: { x: 38, y: 35 },
    avatar: '/assets/rohit_sharma.jpg',
    photoUrl: '/assets/lab_visit_selfie.jpg',
  },
  {
    id: 'st-02',
    name: 'Amit Kumar',
    role: 'Service',
    trackingMode: 'WORK_EVENT_GEO_TAG',
    status: 'On Service',
    lastUpdate: '10:28 AM (On-site event logged)',
    location: 'Kothrud, Pune (At Customer Analyzer)',
    coords: { x: 32, y: 72 },
  },
  {
    id: 'st-03',
    name: 'Suresh Yadav',
    role: 'Delivery',
    trackingMode: 'LIVE_CONTINUOUS',
    status: 'On Delivery',
    lastUpdate: '10:25 AM',
    location: 'Hadapsar, Pune',
    coords: { x: 74, y: 68 },
  },
  {
    id: 'st-04',
    name: 'Neha Singh',
    role: 'Application',
    trackingMode: 'WORK_EVENT_GEO_TAG',
    status: 'At Customer',
    lastUpdate: '10:20 AM (Training session geo-tagged)',
    location: 'Baner, Pune (Lab Training Room)',
    coords: { x: 26, y: 28 },
  },
  {
    id: 'st-05',
    name: 'Vikram Patel',
    role: 'Sales',
    trackingMode: 'LIVE_CONTINUOUS',
    status: 'Traveling',
    lastUpdate: '10:15 AM',
    location: 'Hinjawadi, Pune',
    coords: { x: 16, y: 22 },
  },
  {
    id: 'st-06',
    name: 'Priya Mehta',
    role: 'Service',
    trackingMode: 'WORK_EVENT_GEO_TAG',
    status: 'On Route',
    lastUpdate: '10:12 AM (PM Arrival event)',
    location: 'Kharadi, Pune (Customer Clinic)',
    coords: { x: 78, y: 38 },
  },
];

export const LiveStaffTrackingAndReportsView: React.FC<LiveStaffTrackingAndReportsViewProps> = ({
  token,
  onNavigateTab,
}) => {
  // Map filter states
  const [roleFilters, setRoleFilters] = useState<{ [key: string]: boolean }>({
    Sales: true,
    Service: true,
    Delivery: true,
    Application: true,
  });

  const [selectedStaff, setSelectedStaff] = useState<StaffLocation | null>(INITIAL_STAFF_LOCATIONS[0]);
  const [isPhotoZoomModalOpen, setIsPhotoZoomModalOpen] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>('/assets/lab_visit_selfie.jpg');

  // Table filters
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDate, setSelectedDate] = useState('2025-08-12');

  // Report Generator Checkboxes
  const [selectedReports, setSelectedReports] = useState<{ [key: string]: boolean }>({
    'Sales Visit Ledger (with Photos)': true,
    'Customer Calling Report': false,
    'Lead & Follow Up Report': false,
    'Target vs Achievement Report': false,
    'Service & AMC Report': false,
    'Delivery Report': false,
    'Application Ticket Report': false,
    'All Staff Attendance Report': true,
    'Back Office Work Report': false,
    'Expense Report': false,
    'Salary & Incentive Report': false,
    'Monthly Travel / Geology Report': false,
  });

  const [reportDateFrom, setReportDateFrom] = useState('2025-08-01');
  const [reportDateTo, setReportDateTo] = useState('2025-08-31');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilters((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const toggleReportCheckbox = (rep: string) => {
    setSelectedReports((prev) => ({
      ...prev,
      [rep]: !prev[rep],
    }));
  };

  // Filtered staff list
  const filteredStaff = INITIAL_STAFF_LOCATIONS.filter((s) => {
    if (!roleFilters[s.role]) return false;
    if (departmentFilter !== 'All' && s.role !== departmentFilter) return false;
    if (employeeFilter !== 'All' && s.name !== employeeFilter) return false;
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    return true;
  });

  // Handle Export / Download
  const handleExport = (format: 'Excel' | 'PDF' | 'CSV') => {
    const selectedCount = Object.values(selectedReports).filter(Boolean).length;
    showToast(`Generating ${format} package for ${selectedCount} selected reports (${reportDateFrom} to ${reportDateTo})...`);
    
    // Audit logging of geo-report export
    if (token) {
      fetch('/api/v1/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: `EXPORT_GEO_REPORT_${format.toUpperCase()}`,
          module: 'GPS_TRACKING',
          resourceType: 'STAFF_GEO_REPORT',
          details: {
            format,
            dateFrom: reportDateFrom,
            dateTo: reportDateTo,
            selectedReports: Object.keys(selectedReports).filter((k) => selectedReports[k]),
            timestamp: new Date().toISOString()
          }
        })
      }).catch((err) => console.warn('Audit log write failed', err));
    }

    // Trigger synthetic file download
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,Date,Employee,Role,Check In,Check Out,Status,Working Hours\n" +
        "12-Aug-2025,Rohit Sharma,Sales,09:15,18:05,Present,8h 50m\n" +
        "12-Aug-2025,Amit Kumar,Service,09:20,18:00,Present,8h 40m\n" +
        "12-Aug-2025,Suresh Yadav,Delivery,09:00,18:10,Present,9h 10m\n" +
        "12-Aug-2025,Neha Singh,Application,09:05,17:45,Present,8h 40m\n";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `DS_FieldStaff_Report_${Date.now()}.${format === 'Excel' ? 'csv' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`${format} report generated and downloaded successfully!`);
    }, 600);
  };

  // Helper color tags
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Sales':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Service':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Delivery':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Application':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRolePinColor = (role: string) => {
    switch (role) {
      case 'Sales':
        return '#0284c7'; // Sky 600
      case 'Service':
        return '#16a34a'; // Emerald 600
      case 'Delivery':
        return '#ea580c'; // Orange 600
      case 'Application':
        return '#9333ea'; // Purple 600
      default:
        return '#64748b';
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {isPhotoZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Mandatory Lab Visit Selfie Photo</h3>
                <p className="text-[11px] text-slate-500">Rohit Sharma outside City Diagnostics Pathology</p>
              </div>
              <button onClick={() => setIsPhotoZoomModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[3/4]">
              <img src={activePhotoUrl} alt="Lab Visit Selfie" className="w-full h-full object-cover" />
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Face and lab sign board verified with GPS timestamp (10:32 AM).</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP METRICS STRIP (Total Staff: 25, Sales: 8, Service: 5, Delivery: 6, Application: 4, Back Office: 2) */}
      {/* ========================================================================= */}
      <div className="bg-[#0B3A75] text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-800/80 pb-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
              <span>BACK OFFICE / SUPER ADMIN DASHBOARD (WEB)</span>
            </h1>
            <p className="text-xs text-sky-200 mt-0.5">
              Live Tracking • All Reports • Targets • Attendance • Salary • Approvals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              GPS Live Stream
            </span>
          </div>
        </div>

        {/* 6 Metrics KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-sky-900/60 border border-sky-700/60 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-sky-200">Total Staff</span>
            <p className="text-2xl font-black text-white mt-0.5">25</p>
          </div>
          <div className="bg-sky-600/50 border border-sky-400/50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-sky-200">Sales Staff</span>
            <p className="text-2xl font-black text-white mt-0.5">8</p>
          </div>
          <div className="bg-emerald-600/50 border border-emerald-400/50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-200">Service Staff</span>
            <p className="text-2xl font-black text-white mt-0.5">5</p>
          </div>
          <div className="bg-orange-600/50 border border-orange-400/50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-orange-200">Delivery Staff</span>
            <p className="text-2xl font-black text-white mt-0.5">6</p>
          </div>
          <div className="bg-purple-600/50 border border-purple-400/50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-purple-200">Application Staff</span>
            <p className="text-2xl font-black text-white mt-0.5">4</p>
          </div>
          <div className="bg-rose-600/50 border border-rose-400/50 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-rose-200">Back Office Staff</span>
            <p className="text-2xl font-black text-white mt-0.5">2</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPTION C: LIVE GPS WORKING HOURS & DUTY POLICY (09:30 AM - 06:00 PM IST) */}
      {/* ========================================================================= */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sky-950 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-sky-900 uppercase tracking-wide">
                Live GPS Tracking Policy (Option C)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-800">
                09:30 AM – 06:00 PM IST
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active Duty Window
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-sky-700 mt-0.5">
              Tracking is active strictly during working hours (09:30 AM to 06:00 PM IST) and active duty. Automatically suspended when off-duty, during approved leave, or after 18:00 to protect staff privacy.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-white px-3 py-1.5 rounded-xl border border-sky-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">Live Stream Enabled</span>
          <span className="text-[11px] text-slate-500 font-mono">(09:30 - 18:00)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: LIVE MAP + STAFF LOCATION LIST + DOWNLOAD REPORTS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Columns: Live Staff Location (Back Office Only) Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Live Staff Location (Back Office Only)</h2>
                <p className="text-[11px] text-slate-500">Real-time GPS positions across Pune region</p>
              </div>
            </div>

            <button
              onClick={() => showToast('Staff GPS locations refreshed with live telemetry!')}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Refresh GPS"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Reconciled GPS Policy Notice (Phase 6) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Maps Platform &amp; Role-Specific GPS Policy (Phase 6 Enforced):</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              • <strong>Sales &amp; Delivery:</strong> Continuous live tracking active strictly during duty hours (09:30 – 18:00) when checked in. Automatically suspended after shift.<br />
              • <strong>Service &amp; Application:</strong> Work-event GPS only (check-in, on-site arrival, and resolution sign-offs). Zero continuous background tracking to protect employee privacy.
            </p>
          </div>

          {/* Role Checkbox Toggles */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <label
              onClick={() => toggleRoleFilter('Sales')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer font-bold select-none ${
                roleFilters.Sales ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${roleFilters.Sales ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'}`}>
                {roleFilters.Sales && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>Sales Staff</span>
            </label>

            <label
              onClick={() => toggleRoleFilter('Service')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer font-bold select-none ${
                roleFilters.Service ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${roleFilters.Service ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                {roleFilters.Service && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>Service Staff</span>
            </label>

            <label
              onClick={() => toggleRoleFilter('Delivery')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer font-bold select-none ${
                roleFilters.Delivery ? 'bg-orange-50 border-orange-400 text-orange-800' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${roleFilters.Delivery ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300'}`}>
                {roleFilters.Delivery && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>Delivery Staff</span>
            </label>

            <label
              onClick={() => toggleRoleFilter('Application')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border cursor-pointer font-bold select-none ${
                roleFilters.Application ? 'bg-purple-50 border-purple-400 text-purple-800' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${roleFilters.Application ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'}`}>
                {roleFilters.Application && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>Application Staff</span>
            </label>
          </div>

          {/* Interactive Pune Area Map Canvas */}
          <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-sky-50 border border-slate-200 select-none shadow-inner">
            {/* Map Roads & Suburb Landmarks Vector Graphic */}
            <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
              {/* Roads */}
              <line x1="15%" y1="20%" x2="40%" y2="40%" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="40%" y1="40%" x2="80%" y2="40%" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="40%" y1="40%" x2="35%" y2="75%" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="40%" y1="40%" x2="75%" y2="70%" stroke="#cbd5e1" strokeWidth="4" />
              <line x1="25%" y1="30%" x2="75%" y2="70%" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
              
              {/* Suburb labels */}
              <text x="12%" y="18%" fill="#64748b" fontSize="11" fontWeight="bold">Hinjawadi</text>
              <text x="24%" y="25%" fill="#64748b" fontSize="11" fontWeight="bold">Baner</text>
              <text x="36%" y="30%" fill="#64748b" fontSize="11" fontWeight="bold">Aundh</text>
              <text x="28%" y="78%" fill="#64748b" fontSize="11" fontWeight="bold">Kothrud</text>
              <text x="70%" y="32%" fill="#64748b" fontSize="11" fontWeight="bold">Wagholi</text>
              <text x="76%" y="44%" fill="#64748b" fontSize="11" fontWeight="bold">Kharadi</text>
              <text x="72%" y="76%" fill="#64748b" fontSize="11" fontWeight="bold">Hadapsar</text>
            </svg>

            {/* Live GPS Pins */}
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                style={{ left: `${staff.coords.x}%`, top: `${staff.coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-transform hover:scale-125"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white"
                  style={{ backgroundColor: getRolePinColor(staff.role) }}
                >
                  <MapPin className="w-4 h-4 fill-white text-white" />
                </div>
                <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md opacity-80 group-hover:opacity-100">
                  {staff.name.split(' ')[0]}
                </div>
              </div>
            ))}

            {/* Selected Staff Popup (e.g. Rohit Sharma popup exactly like in screenshot) */}
            {selectedStaff && (
              <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-xl z-20 flex items-start gap-3 animate-in fade-in">
                {selectedStaff.avatar ? (
                  <div
                    onClick={() => {
                      if (selectedStaff.photoUrl) {
                        setActivePhotoUrl(selectedStaff.photoUrl);
                        setIsPhotoZoomModalOpen(true);
                      }
                    }}
                    className="w-14 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 cursor-pointer group relative"
                    title="Click to view lab visit selfie"
                  >
                    <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                )}

                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-slate-900 truncate">
                      {selectedStaff.name} <span className="font-normal text-slate-500">({selectedStaff.role})</span>
                    </p>
                    <button onClick={() => setSelectedStaff(null)} className="p-0.5 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Last Update: 12 Aug 2025, {selectedStaff.lastUpdate}</p>
                  <p className="text-emerald-700 font-bold text-[11px] mt-0.5">Status: {selectedStaff.status}</p>
                  <p className="text-slate-600 text-[11px]">Location: {selectedStaff.location}</p>
                  {selectedStaff.photoUrl && (
                    <button
                      onClick={() => {
                        setActivePhotoUrl(selectedStaff.photoUrl!);
                        setIsPhotoZoomModalOpen(true);
                      }}
                      className="mt-1 text-[10px] font-bold text-sky-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Verified Lab Visit Photo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Download Reports & Location Filters */}
        <div className="lg:col-span-5 space-y-4">
          {/* Download Reports Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-sky-600" />
                <span>Download Reports</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleExport('Excel')}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExport('PDF')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExport('CSV')}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Checkbox List of 12 Reports */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Select Report Type</span>
              {Object.keys(selectedReports).map((rep) => (
                <label
                  key={rep}
                  onClick={() => toggleReportCheckbox(rep)}
                  className={`flex items-center gap-2 p-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition ${
                    selectedReports[rep] ? 'bg-sky-50 text-sky-900' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border ${selectedReports[rep] ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'}`}>
                    {selectedReports[rep] && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className="text-[11px] truncate">{rep}</span>
                </label>
              ))}
            </div>

            {/* Date Range & Generate Button */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">From Date</span>
                  <input
                    type="date"
                    value={reportDateFrom}
                    onChange={(e) => setReportDateFrom(e.target.value)}
                    className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">To Date</span>
                  <input
                    type="date"
                    value={reportDateTo}
                    onChange={(e) => setReportDateTo(e.target.value)}
                    className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-hidden"
                  />
                </div>
              </div>

              <button
                onClick={() => handleExport('PDF')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: STAFF LOCATION LIST (LIVE / LATEST) TABLE & FILTERS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Staff Location List (Live / Latest)</span>
          </h2>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-hidden"
            >
              <option value="All">All Departments</option>
              <option value="Sales">Sales</option>
              <option value="Service">Service</option>
              <option value="Delivery">Delivery</option>
              <option value="Application">Application</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 outline-hidden"
            >
              <option value="All">All Status</option>
              <option value="At Visit">At Visit</option>
              <option value="On Service">On Service</option>
              <option value="On Delivery">On Delivery</option>
              <option value="At Customer">At Customer</option>
            </select>

            <button
              onClick={() => showToast('Filters applied to location table!')}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-2xs cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Update</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{st.name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getRoleBadge(st.role)}`}>
                      {st.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{st.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-medium">{st.lastUpdate}</td>
                  <td className="py-2.5 px-3 text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    <span>{st.location}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedStaff(st)}
                      className="px-2 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
                    >
                      Locate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 DETAILED TABULAR REPORTS (As shown in bottom of screenshot) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Report 1: Sales Visit Ledger (with Photos) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600"></span>
              <span>1. Sales Visit Ledger (Excel / PDF / CSV)</span>
            </h3>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">Mandatory Photo</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">Employee</th>
                  <th className="py-2 px-2.5">Customer</th>
                  <th className="py-2 px-2.5">Photo</th>
                  <th className="py-2 px-2.5">Products</th>
                  <th className="py-2 px-2.5">Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 text-slate-500">10:15 - 11:00</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Rohit Sharma</td>
                  <td className="py-2 px-2.5 text-slate-800">City Diagnostics</td>
                  <td className="py-2 px-2.5">
                    <button
                      onClick={() => {
                        setActivePhotoUrl('/assets/lab_visit_selfie.jpg');
                        setIsPhotoZoomModalOpen(true);
                      }}
                      className="w-7 h-7 rounded-md overflow-hidden border border-slate-300 hover:scale-110 transition cursor-pointer"
                      title="Click to view selfie"
                    >
                      <img src="/assets/lab_visit_selfie.jpg" alt="Selfie" className="w-full h-full object-cover" />
                    </button>
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 font-medium">CBC, LFT</td>
                  <td className="py-2 px-2.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">Interested</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 text-slate-500">12:30 - 01:15</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Vikram Patel</td>
                  <td className="py-2 px-2.5 text-slate-800">MedLab Pune</td>
                  <td className="py-2 px-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 font-medium">Electrolytes</td>
                  <td className="py-2 px-2.5">
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md">Follow Up</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 text-slate-500">02:15 - 03:00</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Priya Mehta</td>
                  <td className="py-2 px-2.5 text-slate-800">Health Care Lab</td>
                  <td className="py-2 px-2.5">
                    <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-slate-700 font-medium">CBC, LFT</td>
                  <td className="py-2 px-2.5">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">Quotation</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Report 2: Customer Calling Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>2. Customer Calling Report</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Tele-Calling</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5">Employee</th>
                  <th className="py-2 px-2.5">Customer</th>
                  <th className="py-2 px-2.5">Call Outcome</th>
                  <th className="py-2 px-2.5">Next Follow Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 text-slate-500">09:30</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Rohit Sharma</td>
                  <td className="py-2 px-2.5 text-slate-800">City Diagnostics</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-bold">Interested</td>
                  <td className="py-2 px-2.5 text-slate-600">25 Aug 2025</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 text-slate-500">11:45</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Vikram Patel</td>
                  <td className="py-2 px-2.5 text-slate-800">MedLab</td>
                  <td className="py-2 px-2.5 text-sky-700 font-bold">Will Consider</td>
                  <td className="py-2 px-2.5 text-slate-600">28 Aug 2025</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 text-slate-500">03:20</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Priya Mehta</td>
                  <td className="py-2 px-2.5 text-slate-800">Apollo Lab</td>
                  <td className="py-2 px-2.5 text-slate-500 font-bold">Not Interested</td>
                  <td className="py-2 px-2.5 text-slate-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Report 3: All Staff Attendance Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>3. All Staff Attendance Report</span>
            </h3>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Shift Records</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Employee</th>
                  <th className="py-2 px-2.5">Role</th>
                  <th className="py-2 px-2.5">Check In</th>
                  <th className="py-2 px-2.5">Check Out</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5">Working Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Rohit Sharma</td>
                  <td className="py-2 px-2.5 text-sky-700 font-bold">Sales</td>
                  <td className="py-2 px-2.5 text-slate-600">09:15</td>
                  <td className="py-2 px-2.5 text-slate-600">18:05</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-bold">Present</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">8h 50m</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Amit Kumar</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-bold">Service</td>
                  <td className="py-2 px-2.5 text-slate-600">09:20</td>
                  <td className="py-2 px-2.5 text-slate-600">18:00</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-bold">Present</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">8h 40m</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Suresh Yadav</td>
                  <td className="py-2 px-2.5 text-orange-700 font-bold">Delivery</td>
                  <td className="py-2 px-2.5 text-slate-600">09:00</td>
                  <td className="py-2 px-2.5 text-slate-600">18:10</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-bold">Present</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">9h 10m</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-medium text-slate-700">12-Aug</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">Neha Singh</td>
                  <td className="py-2 px-2.5 text-purple-700 font-bold">Application</td>
                  <td className="py-2 px-2.5 text-slate-600">09:05</td>
                  <td className="py-2 px-2.5 text-slate-600">17:45</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-bold">Present</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">8h 40m</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Report 4: Target vs Achievement Report */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              <span>4. Target vs Achievement Report</span>
            </h3>
            <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">Monthly Goals</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5">Employee</th>
                  <th className="py-2 px-2.5">Role</th>
                  <th className="py-2 px-2.5">Target</th>
                  <th className="py-2 px-2.5">Achievement</th>
                  <th className="py-2 px-2.5">% Achieved</th>
                  <th className="py-2 px-2.5">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-bold text-slate-900">Rohit Sharma</td>
                  <td className="py-2 px-2.5 text-sky-700 font-semibold">Sales</td>
                  <td className="py-2 px-2.5 font-medium text-slate-600">220</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">186</td>
                  <td className="py-2 px-2.5 font-bold text-emerald-600">85%</td>
                  <td className="py-2 px-2.5 w-24">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-bold text-slate-900">Amit Kumar</td>
                  <td className="py-2 px-2.5 text-emerald-700 font-semibold">Service</td>
                  <td className="py-2 px-2.5 font-medium text-slate-600">40</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">32</td>
                  <td className="py-2 px-2.5 font-bold text-emerald-600">80%</td>
                  <td className="py-2 px-2.5 w-24">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-bold text-slate-900">Suresh Yadav</td>
                  <td className="py-2 px-2.5 text-orange-700 font-semibold">Delivery</td>
                  <td className="py-2 px-2.5 font-medium text-slate-600">60</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">52</td>
                  <td className="py-2 px-2.5 font-bold text-emerald-600">87%</td>
                  <td className="py-2 px-2.5 w-24">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 font-bold text-slate-900">Neha Singh</td>
                  <td className="py-2 px-2.5 text-purple-700 font-semibold">Application</td>
                  <td className="py-2 px-2.5 font-medium text-slate-600">50</td>
                  <td className="py-2 px-2.5 font-bold text-slate-900">38</td>
                  <td className="py-2 px-2.5 font-bold text-emerald-600">76%</td>
                  <td className="py-2 px-2.5 w-24">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
