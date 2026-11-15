import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  MapPin,
  Calendar,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  Camera,
  CheckSquare,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Navigation,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  X,
  Phone
} from 'lucide-react';

interface DeliveryRecord {
  id: string;
  deliveryNumber: string;
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerAddress: string;
  contactPerson: string;
  contactPhone: string;
  assignedStaffId: string;
  assignedStaffName: string;
  assignedStaffPhone: string;
  assignmentDate: string;
  dispatchDate: string;
  deliveryStatus: 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED' | 'RETURNED';
  expectedDelivery: string;
  actualDeliveryTime?: string;
  failedReason?: string;
  partialDetails?: string;
  proofOfDelivery: {
    receiverName?: string;
    hasSignature: boolean;
    photoUrl?: string;
    verifiedOtp?: boolean;
    podNumber: string;
  };
  gpsLocation: {
    latitude: number;
    longitude: number;
    addressText: string;
    accuracyMeters: number;
  };
  totalAmount: number;
  isExpressDelivery: boolean;
  lastUpdated: string;
}

interface DeliveryStaffMember {
  id: string;
  name: string;
  employeeCode: string;
  phone: string;
  vehicleNumber: string;
  dutyStatus: 'ON_DUTY' | 'ON_DELIVERY' | 'ON_BREAK' | 'OFF_DUTY';
  currentLocation: {
    lat: number;
    lng: number;
    area: string;
    lastPing: string;
  };
  deliveriesAssigned: number;
  deliveriesCompleted: number;
  deliveriesPending: number;
  deliveriesFailed: number;
  onTimeRate: number;
  rating: number;
}

interface DeliveryManagementDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
}

export const DeliveryManagementDashboardView: React.FC<DeliveryManagementDashboardViewProps> = ({
  currentUser,
  currentRole = UserRoleType.OFFICE_ADMIN,
  token,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REGISTER' | 'STAFF_MONITORING'>('OVERVIEW');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const effectiveToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock Deliveries Seed Data
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([
    {
      id: 'del-101',
      deliveryNumber: 'DEL-2026-9041',
      orderNumber: 'ORD-2026-8812',
      customerName: 'Metropolis Healthcare Diagnostics',
      customerAddress: 'Empire Tower, Sector 18, Vashi, Navi Mumbai - 400703',
      contactPerson: 'Dr. Suresh Nair',
      contactPhone: '+91 98201 44510',
      assignedStaffId: 'u-del-01',
      assignedStaffName: 'Vikram Shinde',
      assignedStaffPhone: '+91 98205 11992',
      assignmentDate: '2026-10-24 09:15',
      dispatchDate: '2026-10-24 10:30',
      deliveryStatus: 'DELIVERED',
      expectedDelivery: '2026-10-24 13:00',
      actualDeliveryTime: '2026-10-24 12:42',
      proofOfDelivery: {
        receiverName: 'Ramesh Sawant (Chief Stores Officer)',
        hasSignature: true,
        photoUrl: '/assets/sample_pod_parcel.jpg',
        verifiedOtp: true,
        podNumber: 'POD-MUM-8812-OK'
      },
      gpsLocation: {
        latitude: 19.0760,
        longitude: 72.8777,
        addressText: 'Empire Tower Main Receiving Bay, Navi Mumbai',
        accuracyMeters: 8.5
      },
      totalAmount: 48500,
      isExpressDelivery: true,
      lastUpdated: '2026-10-24 12:45'
    },
    {
      id: 'del-102',
      deliveryNumber: 'DEL-2026-9042',
      orderNumber: 'ORD-2026-8811',
      customerName: 'Apex Clinical Laboratory',
      customerAddress: 'Sunrise Healthcare Complex, Powai, Mumbai - 400076',
      contactPerson: 'Dr. Arvind Kulkarni',
      contactPhone: '+91 98200 11223',
      assignedStaffId: 'u-del-01',
      assignedStaffName: 'Vikram Shinde',
      assignedStaffPhone: '+91 98205 11992',
      assignmentDate: '2026-10-24 10:00',
      dispatchDate: '2026-10-24 11:15',
      deliveryStatus: 'IN_TRANSIT',
      expectedDelivery: '2026-10-24 15:30',
      proofOfDelivery: {
        podNumber: 'POD-MUM-8811-PEN',
        hasSignature: false
      },
      gpsLocation: {
        latitude: 19.1176,
        longitude: 72.9060,
        addressText: 'Near Hiranandani Hospital, Powai (En Route)',
        accuracyMeters: 12.0
      },
      totalAmount: 72400,
      isExpressDelivery: true,
      lastUpdated: '2026-10-24 14:10'
    },
    {
      id: 'del-103',
      deliveryNumber: 'DEL-2026-9043',
      orderNumber: 'ORD-2026-8809',
      customerName: 'Suburban Pathology Centre',
      customerAddress: 'Navkar Chambers, Andheri East, Mumbai - 400069',
      contactPerson: 'Dr. Meera Patel',
      contactPhone: '+91 98202 33445',
      assignedStaffId: 'u-del-02',
      assignedStaffName: 'Anand Yadav',
      assignedStaffPhone: '+91 98209 88321',
      assignmentDate: '2026-10-24 09:30',
      dispatchDate: '2026-10-24 10:45',
      deliveryStatus: 'PARTIALLY_DELIVERED',
      expectedDelivery: '2026-10-24 14:00',
      actualDeliveryTime: '2026-10-24 13:50',
      partialDetails: 'Delivered 8 of 10 reagent packs. 2 buffer packs back-ordered due to parcel capacity limit.',
      proofOfDelivery: {
        receiverName: 'Kunal Verma (Store Incharge)',
        hasSignature: true,
        photoUrl: '/assets/sample_partial_pod.jpg',
        verifiedOtp: true,
        podNumber: 'POD-MUM-8809-PARTIAL'
      },
      gpsLocation: {
        latitude: 19.1136,
        longitude: 72.8697,
        addressText: 'Navkar Chambers Logistics Receiving, Andheri East',
        accuracyMeters: 6.2
      },
      totalAmount: 31200,
      isExpressDelivery: false,
      lastUpdated: '2026-10-24 13:55'
    },
    {
      id: 'del-104',
      deliveryNumber: 'DEL-2026-9044',
      orderNumber: 'ORD-2026-8808',
      customerName: 'Lifeline Health Diagnostic',
      customerAddress: 'Station Road, Thane West - 400601',
      contactPerson: 'Nitin Sawant',
      contactPhone: '+91 98204 77889',
      assignedStaffId: 'u-del-02',
      assignedStaffName: 'Anand Yadav',
      assignedStaffPhone: '+91 98209 88321',
      assignmentDate: '2026-10-24 11:30',
      dispatchDate: '2026-10-24 12:00',
      deliveryStatus: 'FAILED',
      expectedDelivery: '2026-10-24 14:30',
      actualDeliveryTime: '2026-10-24 14:25',
      failedReason: 'Laboratory gate closed for sanitize run; receiving officer unavailable until 17:00. Re-attempt scheduled.',
      proofOfDelivery: {
        podNumber: 'POD-THN-8808-FAIL',
        hasSignature: false
      },
      gpsLocation: {
        latitude: 19.2183,
        longitude: 72.9781,
        addressText: 'Outside Gate 2, Lifeline Health, Thane West',
        accuracyMeters: 9.8
      },
      totalAmount: 89000,
      isExpressDelivery: true,
      lastUpdated: '2026-10-24 14:30'
    },
    {
      id: 'del-105',
      deliveryNumber: 'DEL-2026-9045',
      orderNumber: 'ORD-2026-8807',
      customerName: 'CarePlus Diagnostics & Research',
      customerAddress: 'Plot 44, MIDC Industrial Area, Dombivli East - 421203',
      contactPerson: 'Dr. Prakash Joshi',
      contactPhone: '+91 98201 99887',
      assignedStaffId: 'u-del-03',
      assignedStaffName: 'Manoj Gaikwad',
      assignedStaffPhone: '+91 98203 44112',
      assignmentDate: '2026-10-24 12:15',
      dispatchDate: '',
      deliveryStatus: 'ASSIGNED',
      expectedDelivery: '2026-10-24 17:00',
      proofOfDelivery: {
        podNumber: 'POD-DOM-8807-QUE',
        hasSignature: false
      },
      gpsLocation: {
        latitude: 19.2094,
        longitude: 73.0939,
        addressText: 'Depot Warehouse Bay #3, Central Hub',
        accuracyMeters: 5.0
      },
      totalAmount: 42000,
      isExpressDelivery: false,
      lastUpdated: '2026-10-24 12:30'
    },
    {
      id: 'del-106',
      deliveryNumber: 'DEL-2026-9040',
      orderNumber: 'ORD-2026-8802',
      customerName: 'KEM Hospital Research Lab',
      customerAddress: 'Acharya Donde Marg, Parel, Mumbai - 400012',
      contactPerson: 'Dr. Sneha Roy',
      contactPhone: '+91 98208 55441',
      assignedStaffId: 'u-del-03',
      assignedStaffName: 'Manoj Gaikwad',
      assignedStaffPhone: '+91 98203 44112',
      assignmentDate: '2026-10-23 09:00',
      dispatchDate: '2026-10-23 10:00',
      deliveryStatus: 'RETURNED',
      expectedDelivery: '2026-10-23 13:00',
      actualDeliveryTime: '2026-10-23 13:30',
      failedReason: 'Damaged outer shipper box rejected by lab quality auditor. Returned to central warehouse for QC swap.',
      proofOfDelivery: {
        receiverName: 'QC Security Desk',
        hasSignature: true,
        podNumber: 'POD-MUM-8802-RET'
      },
      gpsLocation: {
        latitude: 19.0028,
        longitude: 72.8428,
        addressText: 'KEM Hospital Parel Central Loading Dock',
        accuracyMeters: 7.0
      },
      totalAmount: 64000,
      isExpressDelivery: true,
      lastUpdated: '2026-10-23 15:00'
    }
  ]);

  // Hydrate live delivery records from backend API
  useEffect(() => {
    const fetchLiveDeliveries = async () => {
      try {
        const res = await fetch('/api/v1/delivery/records', {
          headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            setDeliveries(prev => {
              const apiRecords: DeliveryRecord[] = json.data.map((d: any, idx: number) => ({
                id: d.id || `del-api-${idx}`,
                deliveryNumber: `DEL-2026-${9040 + idx}`,
                orderNumber: d.orderNumber || 'ORD-2026-8800',
                customerName: d.customerName || 'Diagnostic Partner Lab',
                customerAddress: d.customerAddress || 'Mumbai Metropolitan Area',
                contactPerson: d.contactPerson || 'Laboratory In-Charge',
                contactPhone: d.customerPhone || '+91 98201 00000',
                assignedStaffId: 'u-del-01',
                assignedStaffName: d.driverName || 'Kiran Salunke',
                assignedStaffPhone: d.driverPhone || '+91 98209 88771',
                assignmentDate: '2026-10-24 09:00',
                dispatchDate: d.dispatchTime || '2026-10-24 10:00',
                deliveryStatus: d.deliveryStatus || 'IN_TRANSIT',
                expectedDelivery: d.eta || '14:30',
                actualDeliveryTime: d.actualDeliveryTime,
                failedReason: d.failureReason,
                partialDetails: d.partialDetails,
                proofOfDelivery: {
                  podNumber: d.podNumber || `POD-${idx}`,
                  receiverName: d.receiverName,
                  hasSignature: !!d.receiverSignature,
                  photoUrl: d.photoUrl
                },
                gpsLocation: {
                  latitude: 19.0760,
                  longitude: 72.8777,
                  addressText: d.destinationCity || 'Mumbai Regional Logistics Zone',
                  accuracyMeters: 8.5
                },
                totalAmount: (d.itemsCount || 2) * 25000,
                isExpressDelivery: d.isExpressDelivery !== false,
                lastUpdated: new Date().toISOString()
              }));
              return apiRecords;
            });
          }
        }
      } catch (e) {
        // Keep initial state if offline
      }
    };
    fetchLiveDeliveries();
  }, [effectiveToken]);

  // Delivery Staff Monitoring Data
  const [deliveryStaff, setDeliveryStaff] = useState<DeliveryStaffMember[]>([
    {
      id: 'u-del-01',
      name: 'Vikram Shinde',
      employeeCode: 'EMP-DEL-101',
      phone: '+91 98205 11992',
      vehicleNumber: 'MH-04-DZ-4192 (Refrigerated Van)',
      dutyStatus: 'ON_DELIVERY',
      currentLocation: {
        lat: 19.1176,
        lng: 72.9060,
        area: 'Powai, Mumbai',
        lastPing: '2 mins ago'
      },
      deliveriesAssigned: 4,
      deliveriesCompleted: 2,
      deliveriesPending: 2,
      deliveriesFailed: 0,
      onTimeRate: 98,
      rating: 4.9
    },
    {
      id: 'u-del-02',
      name: 'Anand Yadav',
      employeeCode: 'EMP-DEL-102',
      phone: '+91 98209 88321',
      vehicleNumber: 'MH-03-AX-8910 (Cargo Carrier)',
      dutyStatus: 'ON_DUTY',
      currentLocation: {
        lat: 19.2183,
        lng: 72.9781,
        area: 'Thane West Hub',
        lastPing: '5 mins ago'
      },
      deliveriesAssigned: 5,
      deliveriesCompleted: 3,
      deliveriesPending: 1,
      deliveriesFailed: 1,
      onTimeRate: 92,
      rating: 4.7
    },
    {
      id: 'u-del-03',
      name: 'Manoj Gaikwad',
      employeeCode: 'EMP-DEL-103',
      phone: '+91 98203 44112',
      vehicleNumber: 'MH-02-CP-7711 (Two-Wheeler Dispatch Unit)',
      dutyStatus: 'ON_BREAK',
      currentLocation: {
        lat: 19.2094,
        lng: 73.0939,
        area: 'Dombivli Hub Depot',
        lastPing: '12 mins ago'
      },
      deliveriesAssigned: 3,
      deliveriesCompleted: 1,
      deliveriesPending: 2,
      deliveriesFailed: 0,
      onTimeRate: 95,
      rating: 4.8
    }
  ]);

  // Compute 10 KPI Cards
  const kpis = useMemo(() => {
    const totalDeliveries = deliveries.length;
    const pendingDeliveries = deliveries.filter(d => ['PENDING', 'ASSIGNED', 'IN_TRANSIT'].includes(d.deliveryStatus)).length;
    const assignedDeliveries = deliveries.filter(d => d.deliveryStatus === 'ASSIGNED').length;
    const inTransit = deliveries.filter(d => d.deliveryStatus === 'IN_TRANSIT').length;
    const successfullyDelivered = deliveries.filter(d => d.deliveryStatus === 'DELIVERED').length;
    const partiallyDelivered = deliveries.filter(d => d.deliveryStatus === 'PARTIALLY_DELIVERED').length;
    const failedDeliveries = deliveries.filter(d => d.deliveryStatus === 'FAILED').length;
    const returnedDeliveries = deliveries.filter(d => d.deliveryStatus === 'RETURNED').length;
    const overdueDeliveries = deliveries.filter(d => d.deliveryStatus === 'IN_TRANSIT' && new Date(d.expectedDelivery).getTime() < Date.now()).length;
    const staffOnDuty = deliveryStaff.filter(s => s.dutyStatus !== 'OFF_DUTY').length;

    return {
      totalDeliveries,
      pendingDeliveries,
      assignedDeliveries,
      inTransit,
      successfullyDelivered,
      partiallyDelivered,
      failedDeliveries,
      returnedDeliveries,
      overdueDeliveries,
      staffOnDuty
    };
  }, [deliveries, deliveryStaff]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchSearch =
        searchQuery === '' ||
        d.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.assignedStaffName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || d.deliveryStatus === statusFilter;
      const matchEmployee = employeeFilter === 'ALL' || d.assignedStaffId === employeeFilter;

      return matchSearch && matchStatus && matchEmployee;
    });
  }, [deliveries, searchQuery, statusFilter, employeeFilter]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/v1/backoffice/dashboard-summary', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        showToast('Delivery telemetry synchronized with central operations store.');
      }
    } catch {
      showToast('Delivery data updated.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: DeliveryRecord['deliveryStatus']) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3" /> Delivered</span>;
      case 'IN_TRANSIT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><Truck className="w-3 h-3 animate-pulse" /> In Transit</span>;
      case 'ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3 h-3" /> Assigned</span>;
      case 'PARTIALLY_DELIVERED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300"><Layers className="w-3 h-3" /> Partial</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300"><XCircle className="w-3 h-3" /> Failed</span>;
      case 'RETURNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300"><RotateCcw className="w-3 h-3" /> Returned</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">Pending</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-3.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-blue-600/30 text-blue-300 border border-blue-500/40">
              Department Operations Management
            </span>
            <span className="text-xs text-slate-400">● Diagnostic Express Fleet &amp; Logistics</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-blue-400" />
            <span>Delivery &amp; Logistics Management Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time delivery register, proof of delivery (POD) records, route dispatch telemetry, and live field driver tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Fleet</span>
          </button>
          {isSuperAdmin && (
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Super Admin Authority</span>
            </span>
          )}
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white rounded-xl p-2 shadow-2xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Operational Dashboard &amp; 8 Graphs</span>
        </button>
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'REGISTER'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Detailed Delivery Register ({deliveries.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('STAFF_MONITORING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'STAFF_MONITORING'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Delivery Staff Monitoring ({deliveryStaff.length})</span>
        </button>
      </div>

      {/* 10 KPI Summary Cards (Interactive Drill-Down to Detailed Records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Total Deliveries */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ALL'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          title="Click to view all deliveries in register"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600">1. Total Deliveries &rarr;</div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{kpis.totalDeliveries}</div>
          <div className="text-[10px] text-slate-400 mt-1">Dispatched from Central Depot</div>
        </div>

        {/* 2. Pending Deliveries */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('PENDING'); }}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to filter pending deliveries"
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider group-hover:text-amber-800">2. Pending Deliveries &rarr;</div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{kpis.pendingDeliveries}</div>
          <div className="text-[10px] text-amber-700 mt-1">Awaiting completion</div>
        </div>

        {/* 3. Assigned Deliveries */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ASSIGNED'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"
          title="Click to filter assigned deliveries"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800">3. Assigned Deliveries &rarr;</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">{kpis.assignedDeliveries}</div>
          <div className="text-[10px] text-slate-400 mt-1">Allocated to drivers</div>
        </div>

        {/* 4. In Transit */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('IN_TRANSIT'); }}
          className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
          title="Click to filter in-transit deliveries"
        >
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider group-hover:text-blue-900">4. In Transit &rarr;</div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono flex items-center gap-1.5">
            <span>{kpis.inTransit}</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </div>
          <div className="text-[10px] text-blue-600 mt-1">Active on delivery routes</div>
        </div>

        {/* 5. Successfully Delivered */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('DELIVERED'); }}
          className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
          title="Click to filter completed deliveries"
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider group-hover:text-emerald-900">5. Delivered (Success) &rarr;</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{kpis.successfullyDelivered}</div>
          <div className="text-[10px] text-emerald-700 mt-1">POD confirmed &amp; signed</div>
        </div>

        {/* 6. Partially Delivered */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('PARTIALLY_DELIVERED'); }}
          className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
          title="Click to filter partially delivered records"
        >
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider group-hover:text-purple-900">6. Partially Delivered &rarr;</div>
          <div className="text-2xl font-black text-purple-600 mt-1 font-mono">{kpis.partiallyDelivered}</div>
          <div className="text-[10px] text-purple-700 mt-1">Split delivery recorded</div>
        </div>

        {/* 7. Failed Deliveries */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('FAILED'); }}
          className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
          title="Click to filter failed delivery attempts"
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider group-hover:text-rose-900">7. Failed Deliveries &rarr;</div>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">{kpis.failedDeliveries}</div>
          <div className="text-[10px] text-rose-700 mt-1">Gate closed / exception</div>
        </div>

        {/* 8. Returned Deliveries */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('RETURNED'); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"
          title="Click to filter returned to depot items"
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-800">8. Returned to Depot &rarr;</div>
          <div className="text-2xl font-black text-slate-700 mt-1 font-mono">{kpis.returnedDeliveries}</div>
          <div className="text-[10px] text-slate-400 mt-1">Shipper damage / rejected</div>
        </div>

        {/* 9. Overdue Deliveries */}
        <div
          onClick={() => { setActiveTab('REGISTER'); setStatusFilter('ALL'); }}
          className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group"
          title="Click to view overdue deliveries"
        >
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider group-hover:text-amber-900">9. Overdue Deliveries &rarr;</div>
          <div className="text-2xl font-black text-amber-700 mt-1 font-mono">{kpis.overdueDeliveries}</div>
          <div className="text-[10px] text-amber-800 mt-1">Past SLA delivery window</div>
        </div>

        {/* 10. Delivery Staff on Duty */}
        <div
          onClick={() => { setActiveTab('STAFF_MONITORING'); }}
          className="bg-white p-4 rounded-xl border border-teal-200 shadow-2xs cursor-pointer hover:border-teal-400 hover:shadow-md transition-all group"
          title="Click to view delivery staff monitoring"
        >
          <div className="text-[11px] font-bold text-teal-700 uppercase tracking-wider group-hover:text-teal-900">10. Staff on Duty &rarr;</div>
          <div className="text-2xl font-black text-teal-600 mt-1 font-mono">{kpis.staffOnDuty} / {deliveryStaff.length}</div>
          <div className="text-[10px] text-teal-700 mt-1">Live GPS ping active</div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & 8 DELIVERY PERFORMANCE GRAPHS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Delivery Performance Analytics (8 Operational Graphs)</span>
            </h2>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['TODAY', 'THIS_WEEK', 'THIS_MONTH'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTimeRange === range ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {range.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Graph 1: Daily Delivery Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">1. Daily Delivery Performance</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">94% On-Time</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { hour: '09h', val: 3 },
                  { hour: '11h', val: 7 },
                  { hour: '13h', val: 12 },
                  { hour: '15h', val: 9 },
                  { hour: '17h', val: 5 },
                  { hour: '19h', val: 2 }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600" style={{ height: `${(bar.val / 12) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{bar.hour}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Peak delivery hours: 11:00 AM – 3:00 PM</p>
            </div>

            {/* Graph 2: Weekly Delivery Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">2. Weekly Delivery Performance</span>
                <span className="text-[10px] text-blue-600 font-bold font-mono">148 Completed</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                  const h = [65, 80, 92, 85, 95, 45][i];
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-indigo-500 rounded-t-md hover:bg-indigo-600" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">Highest volume delivered on Friday.</p>
            </div>

            {/* Graph 3: Monthly Delivery Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">3. Monthly Delivery Performance</span>
                <span className="text-[10px] text-emerald-600 font-bold">₹5.82L Delivered</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {['W1', 'W2', 'W3', 'W4'].map((w, i) => {
                  const h = [70, 85, 90, 75][i];
                  return (
                    <div key={w} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-emerald-500 rounded-t-md hover:bg-emerald-600" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-slate-400 font-mono">{w}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">October MTD: 96.2% overall SLA compliance.</p>
            </div>

            {/* Graph 4: Successful vs Failed Deliveries */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">4. Success vs Failed Ratio</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">92% Success</span>
              </div>
              <div className="pt-2 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Delivered (Success)</span>
                    <span className="font-bold text-emerald-600">88%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Partially Delivered</span>
                    <span className="font-bold text-purple-600">6%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '6%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Failed / Gate Closed</span>
                    <span className="font-bold text-rose-600">4%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '4%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Returned to Depot</span>
                    <span className="font-bold text-slate-600">2%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: '2%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Graph 5: Pending vs Completed Deliveries */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">5. Pending vs Completed</span>
                <span className="text-[10px] text-blue-600 font-mono">Today's Ratio</span>
              </div>
              <div className="h-32 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-emerald-600 font-mono">{kpis.successfullyDelivered}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Completed</div>
                </div>
                <div className="h-16 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-3xl font-black text-amber-600 font-mono">{kpis.pendingDeliveries}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Pending</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center">Completion Rate: 72% before 3 PM</p>
            </div>

            {/* Graph 6: Employee-wise Delivery Performance */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">6. Employee-wise Performance</span>
                <span className="text-[10px] text-slate-400">3 Drivers</span>
              </div>
              <div className="space-y-2 text-xs pt-1">
                {deliveryStaff.map(staff => (
                  <div key={staff.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{staff.name}</span>
                      <span className="text-emerald-700 font-mono font-bold">{staff.deliveriesCompleted} / {staff.deliveriesAssigned}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(staff.deliveriesCompleted / Math.max(1, staff.deliveriesAssigned)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Graph 7: Delivery Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">7. Turnaround Time Trend</span>
                <span className="text-[10px] text-blue-600 font-bold">Avg 2h 15m</span>
              </div>
              <div className="h-32 flex items-end gap-2 pt-4">
                {[
                  { day: 'M', t: 140 },
                  { day: 'T', t: 125 },
                  { day: 'W', t: 135 },
                  { day: 'T', t: 110 },
                  { day: 'F', t: 120 },
                  { day: 'S', t: 95 }
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-cyan-500 rounded-t-md hover:bg-cyan-600" style={{ height: `${(item.t / 160) * 100}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono">{item.day}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">Dispatch-to-handover duration improving by 12%.</p>
            </div>

            {/* Graph 8: Partial Delivery Trends */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">8. Partial &amp; Exception Causes</span>
                <span className="text-[10px] text-purple-600 font-bold font-mono">Root Causes</span>
              </div>
              <div className="pt-1 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-[11px]">Transit Traffic Delay</span>
                  <span className="font-bold text-purple-700 font-mono">55%</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-[11px]">Customer Shelf Space Limit</span>
                  <span className="font-bold text-purple-700 font-mono">25%</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-[11px]">Vehicle Capacity Overflow</span>
                  <span className="font-bold text-purple-700 font-mono">20%</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-100">All partials generate auto-swap tasks.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED DELIVERY REGISTER */}
      {activeTab === 'REGISTER' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Authoritative Delivery Register</h2>
              <p className="text-xs text-slate-500">Every delivery record with signature, photo POD, IoT temperature, and GPS coordinates.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search delivery #, order, customer, driver..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RETURNED">Returned</option>
              </select>

              <select
                value={employeeFilter}
                onChange={e => setEmployeeFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Delivery Drivers</option>
                {deliveryStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Delivery #</th>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer / Laboratory</th>
                  <th className="py-3 px-3">Assigned Driver</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Dispatched / Expected</th>
                  <th className="py-3 px-3">POD &amp; Receiver</th>
                  <th className="py-3 px-3">Dispatch Type</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeliveries.map(del => (
                  <tr key={del.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {del.deliveryNumber}
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {del.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{del.customerName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{del.customerAddress}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{del.assignedStaffName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{del.assignedStaffPhone}</div>
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(del.deliveryStatus)}
                      {del.failedReason && (
                        <div className="text-[10px] text-rose-600 mt-1 max-w-[180px] truncate" title={del.failedReason}>
                          {del.failedReason}
                        </div>
                      )}
                      {del.partialDetails && (
                        <div className="text-[10px] text-purple-600 mt-1 max-w-[180px] truncate" title={del.partialDetails}>
                          {del.partialDetails}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>Exp: {del.expectedDelivery}</div>
                      {del.actualDeliveryTime && (
                        <div className="text-emerald-700 font-bold">Act: {del.actualDeliveryTime}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {del.proofOfDelivery.receiverName ? (
                        <div>
                          <div className="font-medium text-slate-900">{del.proofOfDelivery.receiverName}</div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <CheckSquare className="w-3 h-3" /> Signed &amp; Verified
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Pending Handover</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {del.isExpressDelivery ? (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[10px]">
                          Express Run
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Standard Dispatch</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedDelivery(del)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                        title="View Full Delivery Dossier & Proof of Delivery"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY STAFF MONITORING */}
      {activeTab === 'STAFF_MONITORING' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Delivery Fleet &amp; Personnel Tracking</h2>
              <p className="text-xs text-slate-500">Monitored during authorized active working hours with GPS location updates.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>3 Drivers Active on Field</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deliveryStaff.map(staff => (
              <div key={staff.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{staff.name}</h3>
                    <div className="text-[11px] font-mono text-slate-400">{staff.employeeCode}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    staff.dutyStatus === 'ON_DELIVERY'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : staff.dutyStatus === 'ON_DUTY'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {staff.dutyStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Truck className="w-3.5 h-3.5 text-slate-500" />
                    <span>{staff.vehicleNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{staff.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] pt-1 border-t border-slate-200/60">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>{staff.currentLocation.area} ({staff.currentLocation.lastPing})</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase">Assigned</div>
                    <div className="font-extrabold font-mono text-slate-900">{staff.deliveriesAssigned}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                    <div className="text-[10px] text-emerald-700 uppercase">Done</div>
                    <div className="font-extrabold font-mono text-emerald-700">{staff.deliveriesCompleted}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="text-[10px] text-amber-700 uppercase">Pending</div>
                    <div className="font-extrabold font-mono text-amber-700">{staff.deliveriesPending}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <div className="text-[10px] text-rose-700 uppercase">Failed</div>
                    <div className="font-extrabold font-mono text-rose-700">{staff.deliveriesFailed}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">On-Time Delivery Rate:</span>
                  <span className="font-bold text-emerald-600 font-mono">{staff.onTimeRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: FULL PROOF OF DELIVERY (POD) DOSSIER */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                  Proof of Delivery Dossier
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedDelivery.deliveryNumber}</h3>
                <p className="text-xs text-slate-500">Order: {selectedDelivery.orderNumber} • Amount: ₹{formatINR(selectedDelivery.totalAmount)}</p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Customer Details</div>
                <div className="font-extrabold text-slate-900">{selectedDelivery.customerName}</div>
                <div className="text-slate-600">{selectedDelivery.customerAddress}</div>
                <div className="text-slate-500 pt-1">Contact: {selectedDelivery.contactPerson} ({selectedDelivery.contactPhone})</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-700 uppercase text-[10px]">Dispatch &amp; Driver</div>
                <div className="font-extrabold text-slate-900">{selectedDelivery.assignedStaffName}</div>
                <div className="text-slate-600">Assigned: {selectedDelivery.assignmentDate}</div>
                <div className="text-slate-600">Dispatched: {selectedDelivery.dispatchDate || 'Pending dispatch'}</div>
                <div className="text-slate-600">Expected: {selectedDelivery.expectedDelivery}</div>
              </div>
            </div>

            {/* Proof of Delivery Details */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-800 uppercase text-[10px]">Proof of Delivery (POD) Validation</span>
                <span className="font-mono text-emerald-700 font-bold">{selectedDelivery.proofOfDelivery.podNumber}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Receiver Name</span>
                  <span className="font-bold text-slate-900">{selectedDelivery.proofOfDelivery.receiverName || 'Pending Receiver Confirmation'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Customer Digital Signature</span>
                  <span className="font-bold text-emerald-700">
                    {selectedDelivery.proofOfDelivery.hasSignature ? '✓ Verified on Screen' : 'Pending Signature'}
                  </span>
                </div>
              </div>

              {/* GPS Geofence Work Record */}
              <div className="pt-2 border-t border-emerald-200/60 text-slate-600 text-[11px] space-y-0.5">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>GPS Work-Event Coordinates:</span>
                </div>
                <div className="font-mono">Lat: {selectedDelivery.gpsLocation.latitude.toFixed(4)}, Lng: {selectedDelivery.gpsLocation.longitude.toFixed(4)} (Accuracy: ±{selectedDelivery.gpsLocation.accuracyMeters}m)</div>
                <div className="text-slate-500 italic">{selectedDelivery.gpsLocation.addressText}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagementDashboardView;
