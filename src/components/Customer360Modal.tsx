import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Package,
  Wrench,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Customer360ModalProps {
  customerId: string | null;
  onClose: () => void;
  token?: string | null;
  onNavigateTab?: (tabId: string) => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  customerId,
  onClose,
  token,
  onNavigateTab
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'EQUIPMENT' | 'PRICING' | 'SERVICE' | 'ACTIVITY'>('OVERVIEW');

  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    fetch(`/api/v1/customers/${customerId}/360`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((json) => {
        setData(json.data);
      })
      .catch((err) => console.error('Error fetching Customer 360', err))
      .finally(() => setIsLoading(false));
  }, [customerId, token]);

  if (!customerId) return null;

  const overview = data?.overview;
  const ordersSummary = data?.ordersSummary;
  const equipment = data?.installedEquipment || [];
  const serviceTickets = data?.serviceTickets || [];
  const priceRules = data?.customPricing || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#D2E7C4] text-[#1E331B] rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#D2E7C4] font-semibold uppercase tracking-wider">
                  CUSTOMER 360° PROFILE
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded text-[10px] font-bold">
                  {overview?.status || 'ACTIVE'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {overview?.labName || 'Diagnostic Laboratory'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50 text-xs overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'Overview & Credit', icon: Building2 },
            { id: 'ORDERS', label: 'Orders & Sales', icon: Package },
            { id: 'EQUIPMENT', label: 'Installed Equipment', icon: Activity },
            { id: 'PRICING', label: 'Special Pricing', icon: DollarSign },
            { id: 'SERVICE', label: 'Service & Maintenance', icon: Wrench },
            { id: 'ACTIVITY', label: 'Activity Logs', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#22381E] text-[#1E331B] font-bold bg-[#E4F1DC] rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#22381E]" />
              <span>Fetching 360° diagnostic metrics...</span>
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Financial & Credit Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#F5F6F0] border border-[#D2E7C4] rounded-xl p-4">
                      <div className="text-[11px] font-bold uppercase text-[#1E331B]">Credit Limit</div>
                      <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                        ₹{Number(overview?.creditLimit || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{overview?.creditPeriodDays || 45} Days Term</div>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                      <div className="text-[11px] font-bold uppercase text-amber-700">Current Outstanding</div>
                      <div className="text-xl font-bold text-amber-900 mt-1 font-mono">
                        ₹{Number(overview?.currentOutstanding || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-amber-600 mt-0.5">Overdue Aging: Current</div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                      <div className="text-[11px] font-bold uppercase text-emerald-700">Available Credit</div>
                      <div className="text-xl font-bold text-emerald-900 mt-1 font-mono">
                        ₹{Number(overview?.availableCredit || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">Safe for new dispatches</div>
                    </div>
                  </div>

                  {/* Identification & Regulatory Info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#22381E]" />
                      <span>Regulatory & Account Details</span>
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-slate-600">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Customer Code</span>
                        <span className="font-mono font-bold text-slate-800">{overview?.customerCode || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">GSTIN</span>
                        <span className="font-mono font-bold text-slate-800">{overview?.gstNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Drug License</span>
                        <span className="font-mono font-bold text-slate-800">{overview?.drugLicenseNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Contact Person</span>
                        <span className="font-bold text-slate-800">{overview?.contactPerson || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Phone Number</span>
                        <span className="font-bold text-slate-800">{overview?.phoneNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Email</span>
                        <span className="font-bold text-slate-800">{overview?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ORDERS TAB */}
              {activeTab === 'ORDERS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-[#F5F6F0] p-3 rounded-xl border border-[#D2E7C4]">
                    <div>
                      <span className="font-bold text-slate-800">Total Orders: {ordersSummary?.totalOrders || 0}</span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="font-bold text-emerald-700">
                        Lifetime Value: ₹{Number(ordersSummary?.lifetimeValue || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {(ordersSummary?.ordersList || []).length === 0 ? (
                    <div className="text-center text-slate-400 py-8">No order records found for this customer.</div>
                  ) : (
                    <div className="space-y-2">
                      {(ordersSummary?.ordersList || []).map((o: any) => (
                        <div key={o.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-[#22381E]">#{o.orderNumber || o.id}</span>
                            <span className="text-slate-500 ml-2">{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 font-mono">₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}</span>
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. EQUIPMENT TAB */}
              {activeTab === 'EQUIPMENT' && (
                <div className="space-y-3">
                  {equipment.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">No installed equipment registered for this laboratory.</div>
                  ) : (
                    equipment.map((eq: any) => (
                      <div key={eq.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <h5 className="font-bold text-slate-900">{eq.equipmentName}</h5>
                          <div className="text-slate-500 font-mono text-[11px]">
                            Serial: {eq.serialNumber} • Model: {eq.modelNumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-slate-600">Health: {eq.healthScore}%</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            eq.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {eq.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4. PRICING TAB */}
              {activeTab === 'PRICING' && (
                <div className="space-y-3">
                  {priceRules.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">Standard catalog pricing applies. No special price contracts active.</div>
                  ) : (
                    priceRules.map((rule: any) => (
                      <div key={rule.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{rule.productName || rule.productId}</div>
                          <div className="text-slate-400 text-[11px]">Contract Rule ID: {rule.id}</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-600">
                          ₹{Number(rule.customFixedPrice || rule.specialRate || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 5. SERVICE TAB */}
              {activeTab === 'SERVICE' && (
                <div className="space-y-3">
                  {serviceTickets.length === 0 ? (
                    <div className="text-center text-slate-400 py-8">No service tickets or breakdown logs recorded.</div>
                  ) : (
                    serviceTickets.map((t: any) => (
                      <div key={t.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-mono font-bold text-purple-600">{t.ticketNumber}</div>
                          <div className="font-semibold text-slate-800">{t.title}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold">{t.status}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 6. ACTIVITY TAB */}
              {activeTab === 'ACTIVITY' && (
                <div className="space-y-3">
                  {recentActivity.map((act: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-800">{act.title}</div>
                        <div className="text-[11px] text-slate-400">{new Date(act.timestamp).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Customer 360
          </button>
        </div>
      </div>
    </div>
  );
};
