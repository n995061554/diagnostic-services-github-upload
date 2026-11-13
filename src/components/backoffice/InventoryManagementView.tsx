import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  History,
  CheckCircle2,
  Boxes,
  Plus,
  Minus,
  RefreshCw,
  Building2,
  Calendar,
  X,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface InventoryManagementViewProps {
  token?: string | null;
  currentRole: UserRoleType;
  currentUser?: User | null;
  onNavigateTab: (tabId: string) => void;
}

export const InventoryManagementView: React.FC<InventoryManagementViewProps> = ({
  token,
  currentRole,
  currentUser,
  onNavigateTab,
}) => {
  const [activeTab, setActiveTab] = useState<'current' | 'low' | 'out' | 'expiring' | 'movements'>('current');
  const [inventoryData, setInventoryData] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Stock Adjustment Modal
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<any | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(10);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('OEM direct shipment receipt');
  const [batchNumber, setBatchNumber] = useState<string>('LOT-2026-X99');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const [ovRes, mvRes, prodRes] = await Promise.all([
        fetch('/api/v1/inventory/overview', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch('/api/v1/inventory/movements', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch('/api/v1/products', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ]);
      let prods: any[] = [];
      if (prodRes.ok) {
        const pJson = await prodRes.json();
        prods = Array.isArray(pJson.data) ? pJson.data : (Array.isArray(pJson) ? pJson : []);
      }
      if (ovRes.ok) {
        const json = await ovRes.json();
        setInventoryData({
          ...json.data,
          currentStock: json.data?.currentStock || prods,
        });
      } else if (prods.length > 0) {
        setInventoryData({ currentStock: prods });
      }
      if (mvRes.ok) {
        const json = await mvRes.json();
        setMovements(Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []));
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;
    if (adjustmentQuantity <= 0) {
      alert('Adjustment quantity must be greater than 0');
      return;
    }

    setIsAdjusting(true);
    try {
        const delta = adjustmentType === 'SUBTRACT' ? -Math.abs(adjustmentQuantity) : Math.abs(adjustmentQuantity);
        const res = await fetch('/api/v1/inventory/adjust', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            productId: selectedProductForAdjust.id,
            quantityChange: delta,
            type: adjustmentType === 'SUBTRACT' ? 'ADJUSTMENT_SUBTRACT' : 'ADJUSTMENT_ADD',
            adjustmentType,
            quantity: adjustmentQuantity,
            reason: adjustmentReason,
            batchNumber,
          }),
        });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || 'Failed to adjust stock');
        return;
      }

      showToast(`Stock for ${selectedProductForAdjust.name} adjusted by ${adjustmentType === 'ADD' ? '+' : '-'}${adjustmentQuantity} with audit log.`);
      setSelectedProductForAdjust(null);
      fetchInventory();
    } catch (err) {
      alert('Network error while adjusting stock');
    } finally {
      setIsAdjusting(false);
    }
  };

  const currentProducts = Array.isArray(inventoryData?.currentStock) ? inventoryData.currentStock : [];
  const lowStock = Array.isArray(inventoryData?.lowStock)
    ? inventoryData.lowStock
    : (Array.isArray(inventoryData?.lowStockItems) ? inventoryData.lowStockItems : []);
  const outOfStock = Array.isArray(inventoryData?.outOfStock)
    ? inventoryData.outOfStock
    : (Array.isArray(inventoryData?.outOfStockItems) ? inventoryData.outOfStockItems : []);
  const expiring = Array.isArray(inventoryData?.expiringProducts)
    ? inventoryData.expiringProducts
    : (Array.isArray(inventoryData?.expiringSoonItems) ? inventoryData.expiringSoonItems : []);

  const getListForTab = () => {
    switch (activeTab) {
      case 'low': return lowStock;
      case 'out': return outOfStock;
      case 'expiring': return expiring;
      default: return currentProducts;
    }
  };

  const displayedList = getListForTab().filter((p: any) =>
    !searchQuery ||
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              Reagents &amp; Consumables
            </span>
            <span className="text-xs text-[#7C8594]">● Immutable Inventory Audit Trail</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Inventory &amp; Cold-Chain Stock Management
          </h1>
          <p className="text-xs sm:text-sm text-[#D0DEE5] mt-0.5">
            Track current stock levels, low-stock thresholds, expiring lots, and record verified stock adjustments with mandatory audit reasons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchInventory()}
            disabled={isLoading}
            className="p-2.5 bg-[#15253F] hover:bg-[#2B3D5B] text-white rounded-xl border border-[#2B3D5B] transition cursor-pointer"
            title="Refresh inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Tabs (Section 12) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'current', label: `Current Stock (${currentProducts.length})` },
          { id: 'low', label: `Low Stock (${lowStock.length})` },
          { id: 'out', label: `Out of Stock (${outOfStock.length})` },
          { id: 'expiring', label: `Expiring Products (${expiring.length})` },
          { id: 'movements', label: `Stock Movement History (${movements.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0E1035] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab !== 'movements' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reagent product name, SKU, brand..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#0E1035] focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[#2B3D5B] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product Name &amp; SKU</th>
                    <th className="py-3 px-3">Brand / OEM</th>
                    <th className="py-3 px-3">Storage Temp</th>
                    <th className="py-3 px-3 text-center">In Stock</th>
                    <th className="py-3 px-3 text-center">Min Threshold</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0E1035] text-sm">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.sku}</div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-700">{p.companyName || 'Roche'}</td>

                      <td className="py-3 px-3 font-mono text-slate-600">{p.storageCondition || '2°C to 8°C'}</td>

                      <td className="py-3 px-3 text-center font-mono font-black text-sm">
                        <span className={p.stock <= 20 ? (p.stock === 0 ? 'text-rose-700' : 'text-amber-700') : 'text-slate-900'}>
                          {p.stock}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-500">{p.minStock || 20}</td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{formatINR(p.basePrice || p.mrp || 4200)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stock === 0 ? 'bg-rose-100 text-rose-800' :
                          p.stock <= 20 ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.stock === 0 ? 'OUT OF STOCK' : p.stock <= 20 ? 'LOW STOCK' : 'ADEQUATE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductForAdjust(p);
                            setAdjustmentQuantity(10);
                            setAdjustmentType('ADD');
                            setAdjustmentReason('OEM direct shipment receipt');
                          }}
                          className="px-3 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white text-[11px] font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {displayedList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No products match this stock filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* TAB: STOCK MOVEMENT HISTORY AUDIT TRAIL (Section 12) */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#2B3D5B]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                Immutable Stock Movement &amp; Adjustment Audit Trail
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Total Movements: {movements.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#7C8594] font-semibold">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-3">Product SKU &amp; Name</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-center">Balance</th>
                  <th className="py-3 px-3">Operator</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {m.timestamp?.split('T')[0]} {m.timestamp?.split('T')[1]?.slice(0, 5)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#0E1035]">{m.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{m.sku} • Lot: {m.batchNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.movementType === 'RECEIPT' || m.movementType === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-800' :
                        m.movementType === 'DISPATCH' || m.movementType === 'STOCK_OUT' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${
                      m.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {m.balanceAfter}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{m.performedBy}</td>
                    <td className="py-3 px-4 text-slate-600">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal (Never silently modify stock) */}
      {selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2B3D5B]" />
                <h3 className="text-base font-bold text-[#0E1035]">Record Stock Adjustment</h3>
              </div>
              <button 
                onClick={() => setSelectedProductForAdjust(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 pt-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">{selectedProductForAdjust.name}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  SKU: {selectedProductForAdjust.sku} • Current Stock: <strong className="text-[#0E1035]">{selectedProductForAdjust.stock} units</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-bold"
                  >
                    <option value="ADD">+ Inward / Add Stock</option>
                    <option value="DEDUCT">- Outward / Deduct Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">Batch / Lot Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold uppercase mb-1">
                  Reason for Adjustment <span className="text-rose-500">*</span>
                </label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                >
                  <option value="OEM direct shipment receipt">OEM Direct Shipment Receipt</option>
                  <option value="Customer return / undamaged">Customer Return (Undamaged)</option>
                  <option value="Cold-chain temperature deviation scrap">Cold-Chain Temperature Deviation Scrap</option>
                  <option value="Physical audit count discrepancy">Physical Audit Count Discrepancy</option>
                  <option value="Expired batch disposal">Expired Batch Disposal</option>
                  <option value="Internal QA sampling">Internal QA Sampling</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProductForAdjust(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 bg-[#0E1035] hover:bg-[#15253F] text-white font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAdjusting ? 'Recording Audit...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
