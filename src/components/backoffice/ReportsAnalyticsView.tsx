import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  LifeBuoy,
  Package,
  Award,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface ReportsAnalyticsViewProps {
  token?: string | null;
  currentRole: UserRoleType;
  currentUser?: User | null;
  onNavigateTab: (tabId: string) => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  token,
  currentRole,
  currentUser,
  onNavigateTab,
}) => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<string>('MONTH_TO_DATE');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/backoffice/reports?range=${dateRange}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setReportData(json.data);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const handleExportCsv = (reportName: string) => {
    const csvContent = "Report,Period,TotalRevenue,Outstanding,Overdue,SLACompliance\nDiagnostic Services Analytics,MTD Oct 2026,582400,125000,35000,94.2%";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${reportName} exported successfully.`);
  };

  const salesTrend = reportData?.salesTrend || [
    { month: 'May 2026', sales: 420000, orders: 14 },
    { month: 'Jun 2026', sales: 485000, orders: 16 },
    { month: 'Jul 2026', sales: 512000, orders: 17 },
    { month: 'Aug 2026', sales: 540000, orders: 18 },
    { month: 'Sep 2026', sales: 565000, orders: 19 },
    { month: 'Oct 2026 (MTD)', sales: 582400, orders: 20 },
  ];

  const agingBuckets = reportData?.agingBuckets || [
    { bucket: 'Current / Not Due', amount: 50000, percentage: 40 },
    { bucket: 'Due Soon (1-7 Days)', amount: 40000, percentage: 32 },
    { bucket: 'Overdue (8-30 Days)', amount: 25000, percentage: 20 },
    { bucket: 'Overdue (> 30 Days)', amount: 10000, percentage: 8 },
  ];

  const topProducts = reportData?.topProducts || [
    { name: 'Elecsys TSH (100 Tests)', sku: 'RO-E411-TSH-100', unitsSold: 142, revenue: 596400 },
    { name: 'Architect Creatinine Enzymatic', sku: 'AB-C4K-CREAT-200', unitsSold: 98, revenue: 372400 },
    { name: 'Elecsys Troponin T hs', sku: 'RO-E411-TROP-100', unitsSold: 86, revenue: 584800 },
    { name: 'Sysmex Cellpack DCL (20L)', sku: 'SY-XN-DCL-20L', unitsSold: 74, revenue: 266400 },
    { name: 'Dimension HbA1c Enzymatic', sku: 'SI-EXL-A1C-100', unitsSold: 62, revenue: 322400 },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E1035] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#2B3D5B] flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0E1035] text-white rounded-2xl p-6 shadow-md border border-[#15253F] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#2B3D5B] text-[#D0DEE5]">
              Business Intelligence &amp; Analytics
            </span>
            <span className="text-xs text-[#7C8594]">● Multi-Dimensional BI</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Reports &amp; Executive Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#D0DEE5] mt-0.5">
            Monitor sales velocity, credit risk aging buckets, customer payment performance, and service SLA compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExportCsv('Executive_Operations_Report')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#0E1035] hover:bg-slate-100 text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#0E1035]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Period:</span>
          {['TODAY', 'THIS_WEEK', 'MONTH_TO_DATE', 'LAST_QUARTER', 'YEAR_TO_DATE'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateRange === range
                  ? 'bg-[#0E1035] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {range.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={() => fetchReports()}
          disabled={isLoading}
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 4 Report Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales MTD</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#0E1035] font-mono">₹5,82,400</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">↑ +8.4% vs Previous Month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outstanding</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">₹1,25,000</div>
          <div className="text-xs text-slate-500 mt-1">Overdue: <strong className="text-rose-700 font-mono">₹35,000</strong></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono">94.2%</div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Target &ge; 90% Achieved</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Rating</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#0E1035] font-mono">4.8 / 5.0</div>
          <div className="text-xs text-purple-700 font-semibold mt-1">98% Reorder Retention</div>
        </div>
      </div>

      {/* Grid of Report Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Monthly Sales & Invoicing Velocity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0E1035]">1. Monthly Revenue &amp; Orders Trend</h3>
            <span className="text-[11px] font-mono text-slate-500">Trailing 6 Months</span>
          </div>
          <div className="space-y-3">
            {salesTrend.map((m: any, idx: number) => {
              const max = 650000;
              const pct = Math.round((m.sales / max) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-700">{m.month}</span>
                    <span className="font-mono text-[#0E1035]">₹{formatINR(m.sales)} ({m.orders} orders)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#2B3D5B] to-[#0E1035] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Customer Debt Aging Buckets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0E1035]">2. Outstanding Aging Buckets</h3>
            <span className="text-[11px] font-mono text-slate-500">Total: ₹1,25,000</span>
          </div>
          <div className="space-y-3">
            {agingBuckets.map((b: any, idx: number) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">{b.bucket}</span>
                  <span className="font-mono text-[#0E1035]">₹{formatINR(b.amount)} ({b.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      idx === 0 ? 'bg-emerald-600' :
                      idx === 1 ? 'bg-blue-600' :
                      idx === 2 ? 'bg-amber-500' :
                      'bg-rose-600'
                    }`}
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Top Products by Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#0E1035]">3. Top Revenue Generating Diagnostic Kits</h3>
            <span className="text-[11px] font-mono text-slate-500">MTD Cumulative</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[#7C8594] font-semibold">
                  <th className="pb-2">Diagnostic Kit / Reagent</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2 text-right">Units Dispatched</th>
                  <th className="pb-2 text-right">Gross Invoiced Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((tp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-800">{tp.name}</td>
                    <td className="py-2.5 font-mono text-slate-500">{tp.sku}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#0E1035]">{tp.unitsSold} units</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-700">₹{formatINR(tp.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
