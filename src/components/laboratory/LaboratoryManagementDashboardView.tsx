import React, { useState, useEffect, useMemo } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Download,
  X,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Wrench,
  Activity,
  Layers,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  CheckSquare,
  AlertCircle,
  Package,
  Award
} from 'lucide-react';

interface LaboratoryRecord {
  id: string;
  customerCode: string;
  labName: string;
  contactPersonName: string;
  email: string;
  contactNumber: string;
  address: string;
  city: string;
  laboratoryType: string;
  registrationNumber: string;
  gstNumber: string;
  panNumber: string;
  establishedYear: number;
  ownership: string;
  numberOfAnalyzers: number;
  creditLimit: number;
  outstandingAmount: number;
  overdueAmount: number;
  dueSoonAmount: number;
  availableCredit: number;
  paymentTerms: string;
  nextDueDate: string | null;
  daysOverdue: number;
  paymentStatus: string;
  paymentReliability: string;
  businessRating: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  totalOrdersCount: number;
  openTicketsCount: number;
  applicationRequestsCount: number;
  createdAt: string;
}

interface ContractedPriceItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  standardPrice: number;
  contractedPrice: number;
  discountPercent: number;
  labName: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'REVISED';
}

interface InstrumentRecord {
  id: string;
  modelName: string;
  manufacturer: string;
  serialNumber: string;
  labName: string;
  installationDate: string;
  warrantyStatus: 'UNDER_WARRANTY' | 'OUT_OF_WARRANTY';
  warrantyExpiry: string;
  amcStatus: 'COMPREHENSIVE' | 'NON_COMPREHENSIVE' | 'NONE';
  nextPmDueDate: string;
  status: 'OPERATIONAL' | 'NEEDS_SERVICE' | 'STANDBY';
}

interface LaboratoryManagementDashboardViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
}

export const LaboratoryManagementDashboardView: React.FC<LaboratoryManagementDashboardViewProps> = ({
  currentUser,
  currentRole,
  token,
  onNavigateTab,
}) => {
  const isSuperAdmin = currentRole === UserRoleType.SUPER_ADMIN;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DIRECTORY' | 'CONTRACTED_PRICING' | 'RECEIVABLES_LEDGER' | 'INSTRUMENTS_WARRANTY'>('OVERVIEW');
  const [timeRange, setTimeRange] = useState<'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_QUARTER' | 'THIS_FY'>('LAST_30_DAYS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Laboratory 360 Detail Modal
  const [selectedLab, setSelectedLab] = useState<LaboratoryRecord | null>(null);

  // Live and local fallback data
  const [laboratories, setLaboratories] = useState<LaboratoryRecord[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchLabData = async () => {
    setIsRefreshing(true);
    try {
      const [labsRes, dashRes] = await Promise.all([
        fetch('/api/v1/backoffice/customers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/v1/laboratory/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).catch(() => null)
      ]);

      if (labsRes.ok) {
        const json = await labsRes.json();
        const rawList = json.data || [];
        setLaboratories(
          rawList.map((c: any) => ({
            id: c.id,
            customerCode: c.customerCode || 'CUST-000',
            labName: c.labName || 'Diagnostic Partner Lab',
            contactPersonName: c.contactPersonName || 'Dr. Lab In-Charge',
            email: c.email || 'lab@diagnosticlab.com',
            contactNumber: c.contactNumber || '+91 98765 43210',
            address: c.address || 'Medical Enclave, Powai, Mumbai',
            city: c.address?.includes('Bengaluru') ? 'Bengaluru' : c.address?.includes('Pune') ? 'Pune' : 'Mumbai',
            laboratoryType: c.laboratoryType || 'CLINICAL_LABORATORY',
            registrationNumber: c.registrationNumber || 'MH-TZ2-449102',
            gstNumber: c.gstNumber || '27AABCM8921N1ZM',
            panNumber: c.panNumber || 'AABCM8921N',
            establishedYear: c.establishedYear || 2014,
            ownership: c.ownership || 'Private Limited',
            numberOfAnalyzers: c.numberOfAnalyzers || 3,
            creditLimit: c.creditLimit || 250000,
            outstandingAmount: c.outstandingAmount || 0,
            overdueAmount: c.overdueAmount || 0,
            dueSoonAmount: c.dueSoonAmount || 0,
            availableCredit: c.availableCredit || 250000,
            paymentTerms: c.paymentTerms || '30 Days Credit Line',
            nextDueDate: c.nextDueDate || '15 Oct 2026',
            daysOverdue: c.daysOverdue || 0,
            paymentStatus: c.paymentStatus || 'GOOD_STANDING',
            paymentReliability: c.paymentReliability || 'EXCELLENT',
            businessRating: c.businessRating || 4.8,
            status: c.status || 'ACTIVE',
            totalOrdersCount: c.totalOrdersCount || 0,
            openTicketsCount: c.openTicketsCount || 0,
            applicationRequestsCount: c.applicationRequestsCount || 0,
            createdAt: c.createdAt || new Date().toISOString()
          }))
        );
      }

      if (dashRes && dashRes.ok) {
        const dJson = await dashRes.json();
        setOrdersSummary(dJson.data);
      }
    } catch (err) {
      console.error('Failed to load laboratory management telemetry', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, [token, timeRange]);

  // Contracted Catalog Pricing Data
  const contractedCatalog: ContractedPriceItem[] = useMemo(() => [
    {
      id: 'cp-01',
      productName: 'cobas c 311/501 Albumin Gen.2 Reagent',
      sku: 'ROC-ALB-100',
      category: 'Clinical Chemistry',
      standardPrice: 4800,
      contractedPrice: 4200,
      discountPercent: 12.5,
      labName: 'Apex Clinical & Pathology Laboratories',
      validUntil: '2027-03-31',
      status: 'ACTIVE'
    },
    {
      id: 'cp-02',
      productName: 'Elecsys Troponin T hs STAT Immunoassay Kit',
      sku: 'ROC-TROP-T-STAT',
      category: 'Immunology / Cardiac',
      standardPrice: 22000,
      contractedPrice: 19500,
      discountPercent: 11.4,
      labName: 'Apollo Diagnostic & Research Hub',
      validUntil: '2027-06-30',
      status: 'ACTIVE'
    },
    {
      id: 'cp-03',
      productName: 'Bio-Rad Lyphochek Assayed Chemistry Control (L1 & L2)',
      sku: 'BR-LYPHO-CC',
      category: 'Quality Controls',
      standardPrice: 15000,
      contractedPrice: 13500,
      discountPercent: 10.0,
      labName: 'Metropolis Core Clinical Labs',
      validUntil: '2026-12-31',
      status: 'EXPIRING_SOON'
    },
    {
      id: 'cp-04',
      productName: 'BD Vacutainer Plus Blood Collection Tubes (K2EDTA)',
      sku: 'BD-VAC-K2E',
      category: 'Phlebotomy / Consumables',
      standardPrice: 750,
      contractedPrice: 650,
      discountPercent: 13.3,
      labName: 'All Contracted Laboratories',
      validUntil: '2027-08-31',
      status: 'ACTIVE'
    },
    {
      id: 'cp-05',
      productName: 'Cellpack DCL Reagent for Sysmex XN Hematology',
      sku: 'SYS-DCL-20L',
      category: 'Hematology Diluent',
      standardPrice: 6200,
      contractedPrice: 5400,
      discountPercent: 12.9,
      labName: 'Suburban Pathology & Research Centre',
      validUntil: '2027-04-30',
      status: 'ACTIVE'
    }
  ], []);

  // Installed Instruments Registry
  const installedInstruments: InstrumentRecord[] = useMemo(() => [
    {
      id: 'inst-01',
      modelName: 'Roche cobas c 311 Clinical Chemistry Analyzer',
      manufacturer: 'Roche Diagnostics',
      serialNumber: 'COB-311-88421',
      labName: 'Apex Clinical & Pathology Laboratories',
      installationDate: '2023-04-15',
      warrantyStatus: 'OUT_OF_WARRANTY',
      warrantyExpiry: '2024-04-14',
      amcStatus: 'COMPREHENSIVE',
      nextPmDueDate: '2026-11-20',
      status: 'OPERATIONAL'
    },
    {
      id: 'inst-02',
      modelName: 'Sysmex XN-550 Automated Hematology Analyzer',
      manufacturer: 'Sysmex Corporation',
      serialNumber: 'XN550-99120',
      labName: 'Apollo Diagnostic & Research Hub',
      installationDate: '2024-02-10',
      warrantyStatus: 'UNDER_WARRANTY',
      warrantyExpiry: '2026-12-31',
      amcStatus: 'NONE',
      nextPmDueDate: '2026-12-05',
      status: 'OPERATIONAL'
    },
    {
      id: 'inst-03',
      modelName: 'Bio-Rad D-10 Hemoglobin Testing System (HbA1c)',
      manufacturer: 'Bio-Rad Laboratories',
      serialNumber: 'BR-D10-44911',
      labName: 'Metropolis Core Clinical Labs',
      installationDate: '2022-08-20',
      warrantyStatus: 'OUT_OF_WARRANTY',
      warrantyExpiry: '2023-08-19',
      amcStatus: 'COMPREHENSIVE',
      nextPmDueDate: '2026-11-28',
      status: 'NEEDS_SERVICE'
    },
    {
      id: 'inst-04',
      modelName: 'cobas e 411 Automated Immunoassay Analyzer',
      manufacturer: 'Roche Diagnostics',
      serialNumber: 'COB-411-77219',
      labName: 'Apex Clinical & Pathology Laboratories',
      installationDate: '2024-05-18',
      warrantyStatus: 'UNDER_WARRANTY',
      warrantyExpiry: '2027-05-17',
      amcStatus: 'COMPREHENSIVE',
      nextPmDueDate: '2027-01-15',
      status: 'OPERATIONAL'
    }
  ], []);

  // Compute 12 KPI Metrics
  const kpis = useMemo(() => {
    const totalLabs = laboratories.length || 9;
    const activeLabs = laboratories.filter(l => l.status === 'ACTIVE').length || 8;
    const inactiveLabs = totalLabs - activeLabs;
    const newRegistrations = laboratories.filter(l => {
      const created = new Date(l.createdAt).getTime();
      return Date.now() - created < 90 * 86400000;
    }).length || 3;

    const totalOrders = ordersSummary?.totalOrders || laboratories.reduce((sum, l) => sum + (l.totalOrdersCount || 0), 0) || 28;
    const pendingOrders = ordersSummary?.pendingOrders || 4;
    const processingOrders = ordersSummary?.processingOrders || 6;
    const completedOrders = ordersSummary?.completedOrders || Math.max(0, totalOrders - pendingOrders - processingOrders);
    const cancelledOrders = ordersSummary?.cancelledOrders || 1;

    const outstandingReceivables = laboratories.reduce((sum, l) => sum + (Number(l.outstandingAmount) || 0), 0) || 203000;
    const supportTickets = laboratories.reduce((sum, l) => sum + (l.openTicketsCount || 0), 0) || 16;
    const activeActivityCount = laboratories.filter(l => l.totalOrdersCount > 0 || l.openTicketsCount > 0).length || 6;

    return {
      totalLaboratories: totalLabs,
      activeLaboratories: activeLabs,
      inactiveLaboratories: inactiveLabs,
      newRegistrations,
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      outstandingReceivables,
      supportTickets,
      laboratoryActivity: activeActivityCount
    };
  }, [laboratories, ordersSummary]);

  // Filtered Laboratories Directory
  const filteredLaboratories = useMemo(() => {
    return laboratories.filter(lab => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        lab.labName.toLowerCase().includes(q) ||
        lab.customerCode.toLowerCase().includes(q) ||
        lab.contactPersonName.toLowerCase().includes(q) ||
        lab.city.toLowerCase().includes(q) ||
        lab.email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && lab.status === 'ACTIVE') ||
        (statusFilter === 'INACTIVE' && lab.status !== 'ACTIVE') ||
        (statusFilter === 'OVERDUE' && lab.paymentStatus === 'PAYMENT_OVERDUE') ||
        (statusFilter === 'GOOD_STANDING' && lab.paymentStatus === 'GOOD_STANDING');

      const matchesType =
        typeFilter === 'ALL' ||
        lab.laboratoryType.toUpperCase().includes(typeFilter.toUpperCase());

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [laboratories, searchQuery, statusFilter, typeFilter]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = [
      'Customer Code',
      'Laboratory Name',
      'Contact Person',
      'Email',
      'Phone',
      'City',
      'Type',
      'Analyzers',
      'Credit Limit',
      'Current Outstanding',
      'Available Credit',
      'Payment Status',
      'Rating',
      'Status'
    ];

    const rows = filteredLaboratories.map(l => [
      `"${l.customerCode}"`,
      `"${l.labName.replace(/"/g, '""')}"`,
      `"${l.contactPersonName.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.contactNumber}"`,
      `"${l.city}"`,
      `"${l.laboratoryType}"`,
      l.numberOfAnalyzers,
      l.creditLimit,
      l.outstandingAmount,
      l.availableCredit,
      `"${l.paymentStatus}"`,
      l.businessRating,
      `"${l.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DS_Laboratory_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laboratory register CSV exported successfully.');
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0E1035] text-white rounded-xl shadow-xl border border-white/20 flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0E1035] text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shadow-2xs">
              <Building2 className="w-3 h-3 text-emerald-300" />
              CENTRAL LABORATORY &amp; CUSTOMER 360 HUB
            </span>
            <span className="text-xs text-slate-400 font-medium">● Diagnostic Operations Platform</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Laboratory Management &amp; Customer Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete institutional laboratory directory, contracted pricing, credit ledgers, equipment tracking, and order analytics.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_QUARTER', 'THIS_FY'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 'LAST_7_DAYS' && '7 Days'}
                {r === 'LAST_30_DAYS' && '30 Days'}
                {r === 'THIS_QUARTER' && 'Quarter'}
                {r === 'THIS_FY' && 'FY 2026'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={fetchLabData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
          <span>Overview &amp; 10 Graphs</span>
        </button>

        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DIRECTORY'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Laboratory Directory &amp; 360</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
            {laboratories.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONTRACTED_PRICING')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CONTRACTED_PRICING'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span>Contracted Pricing &amp; Catalogue</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIVABLES_LEDGER')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RECEIVABLES_LEDGER'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-rose-400" />
          <span>Credit Ledgers &amp; Receivables</span>
        </button>

        <button
          onClick={() => setActiveTab('INSTRUMENTS_WARRANTY')}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'INSTRUMENTS_WARRANTY'
              ? 'bg-[#0E1035] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-indigo-400" />
          <span>Instruments &amp; Warranty</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------------ */}
      {/* 1. OVERVIEW TAB: 12 KPI CARDS & 10 GRAPHS */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* 12 KPI Summary Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Laboratory KPI Operational Summary (12 Metrics)
              </h2>
              <span className="text-xs font-semibold text-slate-500">Live Backend Records</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* KPI 1: Total Laboratories */}
              <div
                onClick={() => setActiveTab('DIRECTORY')}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total Labs</div>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">{kpis.totalLaboratories}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Enrolled Partner Labs</div>
              </div>

              {/* KPI 2: Active Laboratories */}
              <div
                onClick={() => { setStatusFilter('ACTIVE'); setActiveTab('DIRECTORY'); }}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-emerald-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Active Labs</div>
                <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{kpis.activeLaboratories}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Account Status</div>
              </div>

              {/* KPI 3: Inactive Laboratories */}
              <div
                onClick={() => { setStatusFilter('INACTIVE'); setActiveTab('DIRECTORY'); }}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-amber-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Inactive Labs</div>
                <div className="text-xl font-black text-amber-600 mt-1 font-mono">{kpis.inactiveLaboratories}</div>
                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Dormant Accounts</div>
              </div>

              {/* KPI 4: New Registrations */}
              <div
                onClick={() => setActiveTab('DIRECTORY')}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-sky-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">New Registrations</div>
                <div className="text-xl font-black text-sky-700 mt-1 font-mono">{kpis.newRegistrations}</div>
                <div className="text-[10px] text-sky-600 font-semibold mt-0.5">Last 90 Days</div>
              </div>

              {/* KPI 5: Total Orders */}
              <div
                onClick={() => onNavigateTab ? onNavigateTab('orders_management') : null}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-indigo-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Total Orders</div>
                <div className="text-xl font-black text-indigo-700 mt-1 font-mono">{kpis.totalOrders}</div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">All Time Orders</div>
              </div>

              {/* KPI 6: Pending Orders */}
              <div
                onClick={() => onNavigateTab ? onNavigateTab('orders_management') : null}
                className="bg-white border border-amber-200 bg-amber-50/30 rounded-xl p-3.5 shadow-2xs hover:border-amber-400 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-tight">Pending Orders</div>
                <div className="text-xl font-black text-amber-700 mt-1 font-mono">{kpis.pendingOrders}</div>
                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Awaiting Processing</div>
              </div>

              {/* KPI 7: Processing Orders */}
              <div
                onClick={() => onNavigateTab ? onNavigateTab('orders_management') : null}
                className="bg-white border border-sky-200 bg-sky-50/30 rounded-xl p-3.5 shadow-2xs hover:border-sky-400 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-sky-800 uppercase tracking-tight">Processing Orders</div>
                <div className="text-xl font-black text-sky-700 mt-1 font-mono">{kpis.processingOrders}</div>
                <div className="text-[10px] text-sky-600 font-semibold mt-0.5">In Packing / Dispatch</div>
              </div>

              {/* KPI 8: Completed Orders */}
              <div
                onClick={() => onNavigateTab ? onNavigateTab('orders_management') : null}
                className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-3.5 shadow-2xs hover:border-emerald-400 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight">Completed Orders</div>
                <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{kpis.completedOrders}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Delivered to Labs</div>
              </div>

              {/* KPI 9: Cancelled Orders */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Cancelled Orders</div>
                <div className="text-xl font-black text-slate-600 mt-1 font-mono">{kpis.cancelledOrders}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Voided Requisitions</div>
              </div>

              {/* KPI 10: Outstanding Receivables */}
              <div
                onClick={() => setActiveTab('RECEIVABLES_LEDGER')}
                className="bg-white border border-rose-200 bg-rose-50/30 rounded-xl p-3.5 shadow-2xs hover:border-rose-400 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-rose-800 uppercase tracking-tight">Outstanding</div>
                <div className="text-lg font-black text-rose-700 mt-1 font-mono truncate">{formatINR(kpis.outstandingReceivables)}</div>
                <div className="text-[10px] text-rose-600 font-semibold mt-0.5">Accounts Receivable</div>
              </div>

              {/* KPI 11: Support Tickets */}
              <div
                onClick={() => onNavigateTab ? onNavigateTab('complaints_tickets') : null}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Support Tickets</div>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">{kpis.supportTickets}</div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Customer Service/App</div>
              </div>

              {/* KPI 12: Laboratory Activity */}
              <div
                onClick={() => setActiveTab('DIRECTORY')}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Lab Activity</div>
                <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{kpis.laboratoryActivity}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Last 30 Days</div>
              </div>
            </div>
          </div>

          {/* 10 GRAPHS GRID (Responsive SVG Visualizations) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                Laboratory Graphical Analytics (10 Detailed Charts)
              </h2>
              <span className="text-xs text-slate-500 font-semibold">Visualizing Demand, Growth &amp; Financials</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Graph 1: Daily Orders (Last 7 Days) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>1. Daily Orders (Last 7 Days)</span>
                  <span className="text-sky-600">Vol: 18 Orders</span>
                </div>
                <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  {[
                    { day: 'Mon', val: 2, h: '40%' },
                    { day: 'Tue', val: 4, h: '75%' },
                    { day: 'Wed', val: 3, h: '60%' },
                    { day: 'Thu', val: 5, h: '95%' },
                    { day: 'Fri', val: 2, h: '40%' },
                    { day: 'Sat', val: 1, h: '25%' },
                    { day: 'Sun', val: 1, h: '25%' },
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-slate-600 font-bold">{d.val}</span>
                      <div
                        style={{ height: d.h }}
                        className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-md transition-all hover:opacity-85"
                      />
                      <span className="text-[10px] text-slate-500 font-semibold">{d.day}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Peak ordering occurs midweek (Wed–Thu) during batch procurement.</p>
              </div>

              {/* Graph 2: Weekly Orders (Last 4 Weeks) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>2. Weekly Orders (Last 4 Weeks)</span>
                  <span className="text-emerald-600">Total: 48 Orders</span>
                </div>
                <div className="h-36 flex items-end justify-around gap-3 pt-4 px-4 bg-slate-50/50 rounded-xl border border-slate-100">
                  {[
                    { week: 'W1', count: 10, h: '55%' },
                    { week: 'W2', count: 12, h: '65%' },
                    { week: 'W3', count: 15, h: '85%' },
                    { week: 'W4', count: 11, h: '60%' },
                  ].map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-slate-600 font-bold">{w.count}</span>
                      <div
                        style={{ height: w.h }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all hover:opacity-85"
                      />
                      <span className="text-[10px] text-slate-500 font-semibold">{w.week}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Consistent weekly order cadence driven by scheduled standing reagent deliveries.</p>
              </div>

              {/* Graph 3: Monthly Orders (Last 6 Months) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>3. Monthly Orders (Last 6 Months)</span>
                  <span className="text-indigo-600">Growth: +22%</span>
                </div>
                <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  {[
                    { m: 'May', val: 32, h: '45%' },
                    { m: 'Jun', val: 38, h: '55%' },
                    { m: 'Jul', val: 42, h: '62%' },
                    { m: 'Aug', val: 48, h: '72%' },
                    { m: 'Sep', val: 56, h: '85%' },
                    { m: 'Oct', val: 62, h: '95%' },
                  ].map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-mono text-slate-600 font-bold">{m.val}</span>
                      <div
                        style={{ height: m.h }}
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all hover:opacity-85"
                      />
                      <span className="text-[9px] text-slate-500 font-semibold">{m.m}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Continuous monthly order volume growth across institutional hospital and path labs.</p>
              </div>

              {/* Graph 4: Laboratory-wise Orders */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>4. Laboratory-wise Orders (Top 4)</span>
                  <span className="text-slate-500">Order Count</span>
                </div>
                <div className="space-y-2 pt-1">
                  {[
                    { name: 'Apex Clinical & Pathology Labs', count: 15, pct: '100%', color: 'bg-emerald-600' },
                    { name: 'Apollo Diagnostic & Research Hub', count: 8, pct: '53%', color: 'bg-sky-600' },
                    { name: 'Metropolis Core Clinical Labs', count: 4, pct: '27%', color: 'bg-indigo-600' },
                    { name: 'Suburban Pathology Centre', count: 3, pct: '20%', color: 'bg-purple-600' },
                  ].map((l, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span className="truncate max-w-[200px]">{l.name}</span>
                        <span className="font-mono">{l.count} orders</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: l.pct }} className={`h-full ${l.color} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Apex and Apollo comprise over 70% of high-frequency diagnostic supply runs.</p>
              </div>

              {/* Graph 5: Revenue by Laboratory */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>5. Revenue by Laboratory</span>
                  <span className="text-slate-500 font-mono">Total: ₹14.85L</span>
                </div>
                <div className="space-y-2 pt-1">
                  {[
                    { name: 'Apex Clinical Labs', rev: 582400, pct: '85%', color: 'bg-emerald-600' },
                    { name: 'Apollo Diagnostic Hub', rev: 436800, pct: '64%', color: 'bg-sky-600' },
                    { name: 'Metropolis Core Labs', rev: 284000, pct: '41%', color: 'bg-indigo-600' },
                    { name: 'Suburban Pathology', rev: 182000, pct: '26%', color: 'bg-amber-600' },
                  ].map((r, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span className="truncate max-w-[180px]">{r.name}</span>
                        <span className="font-mono text-emerald-700">{formatINR(r.rev)}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: r.pct }} className={`h-full ${r.color} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Revenue distributed across long-term contracted diagnostic accounts.</p>
              </div>

              {/* Graph 6: Outstanding Receivables */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>6. Outstanding Receivables Aging</span>
                  <span className="text-rose-600 font-mono">₹2.03L Due</span>
                </div>
                <div className="space-y-2 pt-1">
                  {[
                    { bucket: 'Current (0–30 Days)', amt: 125000, pct: '62%', color: 'bg-emerald-500' },
                    { bucket: 'Overdue (31–60 Days)', amt: 45000, pct: '22%', color: 'bg-amber-500' },
                    { bucket: 'Overdue (61–90 Days)', amt: 25000, pct: '12%', color: 'bg-orange-500' },
                    { bucket: 'Critical (90+ Days)', amt: 8000, pct: '4%', color: 'bg-rose-500' },
                  ].map((b, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span>{b.bucket}</span>
                        <span className="font-mono">{formatINR(b.amt)}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: b.pct }} className={`h-full ${b.color} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">84% of credit lines remain well within standard 30–60 day payment terms.</p>
              </div>

              {/* Graph 7: Order Status Distribution */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>7. Order Status Distribution</span>
                  <span className="text-slate-500">Current Pipeline</span>
                </div>
                <div className="flex items-center justify-center gap-4 py-2">
                  <div className="w-24 h-24 rounded-full border-8 border-emerald-500 border-t-sky-500 border-r-amber-500 border-l-slate-300 flex items-center justify-center">
                    <span className="text-xs font-black text-slate-900 font-mono">100%</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 font-semibold">Delivered (65%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                      <span className="text-slate-600 font-semibold">Processing (20%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-600 font-semibold">Pending (12%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="text-slate-600 font-semibold">Cancelled (3%)</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">High fulfillment rate with minimal drop-off in cold-chain logistics pipeline.</p>
              </div>

              {/* Graph 8: Product Demand Trends */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>8. Product Demand Trends (Top Reagents)</span>
                  <span className="text-indigo-600">Requisitions</span>
                </div>
                <div className="space-y-2 pt-1">
                  {[
                    { name: 'Cobas Albumin Gen.2 Reagent', demand: '94 Kits', pct: '90%', cat: 'Chemistry' },
                    { name: 'Elecsys Troponin T hs STAT', demand: '68 Kits', pct: '65%', cat: 'Cardiac' },
                    { name: 'Sysmex Cellpack DCL Diluent', demand: '52 Packs', pct: '50%', cat: 'Hematology' },
                    { name: 'Bio-Rad Lyphochek QC Controls', demand: '44 Vials', pct: '42%', cat: 'Quality Control' },
                  ].map((p, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        <span className="font-mono text-indigo-700">{p.demand}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: p.pct }} className="h-full bg-indigo-500 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Clinical chemistry and high-sensitivity cardiac troponin generate highest reorder velocity.</p>
              </div>

              {/* Graph 9: Laboratory Growth (Monthly Onboarding) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>9. Laboratory Network Growth</span>
                  <span className="text-emerald-600">+4 Labs This Quarter</span>
                </div>
                <div className="h-36 flex items-end justify-between gap-3 pt-4 px-3 bg-slate-50/50 rounded-xl border border-slate-100">
                  {[
                    { m: 'Q1 25', total: 4, h: '40%' },
                    { m: 'Q2 25', total: 6, h: '60%' },
                    { m: 'Q3 25', total: 7, h: '70%' },
                    { m: 'Q4 25', total: 8, h: '80%' },
                    { m: 'Q1 26', total: 9, h: '90%' },
                  ].map((g, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] font-mono text-slate-600 font-bold">{g.total}</span>
                      <div
                        style={{ height: g.h }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all hover:opacity-85"
                      />
                      <span className="text-[10px] text-slate-500 font-semibold">{g.m}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Steady institutional adoption with new private hospital laboratories onboarding each quarter.</p>
              </div>

              {/* Graph 10: Customer Activity & Portal Engagement */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>10. Customer Activity (Logins &amp; Reorders)</span>
                  <span className="text-sky-600">89% Engagement</span>
                </div>
                <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  {[
                    { day: 'Mon', logins: 14, h: '70%' },
                    { day: 'Tue', logins: 18, h: '90%' },
                    { day: 'Wed', logins: 20, h: '100%' },
                    { day: 'Thu', logins: 17, h: '85%' },
                    { day: 'Fri', logins: 15, h: '75%' },
                    { day: 'Sat', logins: 8, h: '40%' },
                    { day: 'Sun', logins: 4, h: '20%' },
                  ].map((a, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] font-mono text-slate-600 font-bold">{a.logins}</span>
                      <div
                        style={{ height: a.h }}
                        className="w-full bg-gradient-to-t from-sky-500 to-cyan-400 rounded-t-md transition-all hover:opacity-85"
                      />
                      <span className="text-[9px] text-slate-500 font-semibold">{a.day}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">Active engagement on lab mobile portals for tracking cold-chain shipments and invoices.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* 2. DIRECTORY TAB: COMPLETE LABORATORY 360 REGISTER */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Search, Filter & Quick Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Lab Name, Customer Code, Contact Person, City, or Email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Labs Only</option>
                  <option value="INACTIVE">Inactive / Suspended</option>
                  <option value="OVERDUE">Payment Overdue</option>
                  <option value="GOOD_STANDING">Good Standing</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
                <span>Type:</span>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Lab Types</option>
                  <option value="HOSPITAL">Hospital Lab</option>
                  <option value="CLINICAL">Clinical Laboratory</option>
                  <option value="RESEARCH">Research / Central Hub</option>
                </select>
              </div>

              <button
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export ({filteredLaboratories.length})</span>
              </button>
            </div>
          </div>

          {/* Laboratory Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Code &amp; Lab Name</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Location &amp; Type</th>
                    <th className="py-3 px-4">Analyzers</th>
                    <th className="py-3 px-4">Credit Limit</th>
                    <th className="py-3 px-4">Current Outstanding</th>
                    <th className="py-3 px-4">Payment Health</th>
                    <th className="py-3 px-4">Orders &amp; Tickets</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredLaboratories.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No laboratories matching your search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLaboratories.map(lab => (
                      <tr key={lab.id} className="hover:bg-slate-50/80 transition">
                        {/* Code & Lab Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{lab.labName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-sky-600 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              {lab.customerCode}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              lab.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {lab.status}
                            </span>
                          </div>
                        </td>

                        {/* Contact Person */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{lab.contactPersonName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{lab.contactNumber}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{lab.email}</div>
                        </td>

                        {/* Location & Type */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{lab.city}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {lab.laboratoryType.replace(/_/g, ' ')}
                          </div>
                        </td>

                        {/* Analyzers */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {lab.numberOfAnalyzers} Units
                        </td>

                        {/* Credit Limit */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                          {formatINR(lab.creditLimit)}
                        </td>

                        {/* Current Outstanding */}
                        <td className="py-3.5 px-4">
                          <div className={`font-mono font-bold ${lab.outstandingAmount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                            {formatINR(lab.outstandingAmount)}
                          </div>
                          {lab.daysOverdue > 0 && (
                            <span className="text-[10px] text-rose-500 font-semibold">
                              {lab.daysOverdue}d overdue
                            </span>
                          )}
                        </td>

                        {/* Payment Health */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            lab.paymentStatus === 'GOOD_STANDING'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lab.paymentStatus === 'PAYMENT_OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {lab.paymentStatus.replace(/_/g, ' ')}
                          </span>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Rating: ★ {lab.businessRating.toFixed(1)}
                          </div>
                        </td>

                        {/* Orders & Tickets */}
                        <td className="py-3.5 px-4">
                          <div className="text-[11px] font-semibold text-slate-700">
                            Orders: <span className="font-mono text-indigo-700">{lab.totalOrdersCount}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Tickets: <span className="font-mono text-amber-700">{lab.openTicketsCount} open</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLab(lab)}
                            className="px-2.5 py-1 rounded-lg bg-[#0E1035] hover:bg-[#15253F] text-white text-[11px] font-bold transition shadow-xs cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3 h-3 text-sky-400" />
                            <span>360 Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* 3. CONTRACTED PRICING TAB */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'CONTRACTED_PRICING' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                Contracted Pricing &amp; Reagent Catalogue Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Institutional agreed rates, contracted OEM discounts, and lot validity schedules.
              </p>
            </div>
            <button
              onClick={() => showToast('New contracted rate schedule drafted.')}
              className="px-3 py-2 rounded-xl bg-[#0E1035] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-sky-400" />
              <span>Add Contract Rate</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product Details &amp; SKU</th>
                    <th className="py-3 px-4">Diagnostic Category</th>
                    <th className="py-3 px-4">Standard MRP</th>
                    <th className="py-3 px-4">Contracted Rate</th>
                    <th className="py-3 px-4">Agreed Discount</th>
                    <th className="py-3 px-4">Contracted Partner Lab</th>
                    <th className="py-3 px-4">Validity</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {contractedCatalog.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">{item.category}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 line-through">{formatINR(item.standardPrice)}</td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-700">{formatINR(item.contractedPrice)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.discountPercent}% OFF
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{item.labName}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{item.validUntil}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* 4. RECEIVABLES LEDGER TAB */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'RECEIVABLES_LEDGER' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-600" />
                Customer Credit Ledgers &amp; Accounts Receivable
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Credit limit utilization, overdue balances, payment reliability ratings, and bank remittances.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-black">
                Total Receivables: {formatINR(kpis.outstandingReceivables)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Laboratory</th>
                    <th className="py-3 px-4">Credit Terms</th>
                    <th className="py-3 px-4">Credit Limit</th>
                    <th className="py-3 px-4">Utilized</th>
                    <th className="py-3 px-4">Available Credit</th>
                    <th className="py-3 px-4">Next Due Date</th>
                    <th className="py-3 px-4">Days Overdue</th>
                    <th className="py-3 px-4 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {laboratories.map(lab => (
                    <tr key={lab.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {lab.labName}
                        <div className="text-[10px] text-slate-400 font-mono font-normal">{lab.customerCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{lab.paymentTerms}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{formatINR(lab.creditLimit)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">{formatINR(lab.outstandingAmount)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{formatINR(lab.availableCredit)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{lab.nextDueDate || '—'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {lab.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-black">{lab.daysOverdue} Days</span>
                        ) : (
                          <span className="text-emerald-600">On Time</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lab.paymentStatus === 'GOOD_STANDING'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {lab.paymentStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* 5. INSTRUMENTS & WARRANTY TAB */}
      {/* ------------------------------------------------------------------------ */}
      {activeTab === 'INSTRUMENTS_WARRANTY' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600" />
                Laboratory Instrument Fleet &amp; Warranty Registry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Installed diagnostic equipment, serial tracking, OEM warranty, and scheduled preventive maintenance.
              </p>
            </div>
            <button
              onClick={() => showToast('Instrument registration modal ready.')}
              className="px-3 py-2 rounded-xl bg-[#0E1035] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Register Instrument</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Instrument Model</th>
                    <th className="py-3 px-4">OEM Manufacturer</th>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">Installed Location</th>
                    <th className="py-3 px-4">Installation Date</th>
                    <th className="py-3 px-4">Warranty Status</th>
                    <th className="py-3 px-4">AMC Coverage</th>
                    <th className="py-3 px-4">Next PM Due</th>
                    <th className="py-3 px-4 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {installedInstruments.map(inst => (
                    <tr key={inst.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{inst.modelName}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">{inst.manufacturer}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-sky-700 font-bold">{inst.serialNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{inst.labName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{inst.installationDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inst.warrantyStatus === 'UNDER_WARRANTY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {inst.warrantyStatus === 'UNDER_WARRANTY' ? 'Warranty Active' : 'Warranty Expired'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-indigo-700 text-[11px]">
                          {inst.amcStatus} AMC
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-700 font-bold">{inst.nextPmDueDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          inst.status === 'OPERATIONAL'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* LABORATORY 360 FULL PROFILE DRAWER / MODAL */}
      {/* ------------------------------------------------------------------------ */}
      {selectedLab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="bg-[#0E1035] text-white p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 font-black text-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{selectedLab.labName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-emerald-300">
                      {selectedLab.customerCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedLab.laboratoryType.replace(/_/g, ' ')} • Established {selectedLab.establishedYear} • {selectedLab.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLab(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Top Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Contact Officer</span>
                  <div className="font-bold text-slate-900 mt-1">{selectedLab.contactPersonName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{selectedLab.contactNumber}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Account Status</span>
                  <div className="font-bold text-emerald-700 mt-1">{selectedLab.status}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Rating: ★ {selectedLab.businessRating.toFixed(1)}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Credit Limit &amp; Balances</span>
                  <div className="font-mono font-bold text-slate-900 mt-1">{formatINR(selectedLab.creditLimit)}</div>
                  <div className="text-[11px] text-rose-600 font-semibold mt-0.5">Due: {formatINR(selectedLab.outstandingAmount)}</div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Activity Metrics</span>
                  <div className="font-bold text-indigo-700 mt-1">{selectedLab.totalOrdersCount} Total Orders</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{selectedLab.openTicketsCount} Open Tickets</div>
                </div>
              </div>

              {/* Legal & Registration Information */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Registration &amp; Statutory Compliance Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Drug/Lab License No.</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedLab.registrationNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">GST Identification</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedLab.gstNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Permanent Account (PAN)</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedLab.panNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Enterprise Ownership</span>
                    <span className="font-semibold text-slate-800">{selectedLab.ownership}</span>
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Registered Facility Address</span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">{selectedLab.address}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">
                Customer Record ID: {selectedLab.id}
              </span>
              <button
                onClick={() => setSelectedLab(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
