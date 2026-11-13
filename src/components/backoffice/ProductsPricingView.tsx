import React, { useState, useEffect } from 'react';
import { UserRoleType, User } from '../../types';
import { formatINR } from '../mobile/mobileMockData';
import {
  Boxes,
  Search,
  Filter,
  Plus,
  Tag,
  DollarSign,
  Package,
  Layers,
  Building2,
  Cpu,
  FileSpreadsheet,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  X,
  Edit,
  History,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface ProductsPricingViewProps {
  token?: string | null;
  currentRole: UserRoleType;
  currentUser?: User | null;
  onNavigateTab: (tabId: string) => void;
}

export const ProductsPricingView: React.FC<ProductsPricingViewProps> = ({
  token,
  currentRole,
  currentUser,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('all_products');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');

  // Single Price Update Workflow State (Section 6)
  const [selectedProductForPrice, setSelectedProductForPrice] = useState<any | null>(null);
  const [priceStep, setPriceStep] = useState<'EDIT' | 'REVIEW'>('EDIT');
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [newMrp, setNewMrp] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState<string>('Periodic vendor tariff review');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [priceHistoryList, setPriceHistoryList] = useState<any[]>([]);
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState<boolean>(false);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState<boolean>(false);

  // Bulk Price Update Workflow State (Section 7)
  const [bulkCsvText, setBulkCsvText] = useState<string>('');
  const [bulkValidationResult, setBulkValidationResult] = useState<any | null>(null);
  const [isBulkValidating, setIsBulkValidating] = useState<boolean>(false);
  const [isBulkApplying, setIsBulkApplying] = useState<boolean>(false);

  // Product Edit / Add Drawer State (Section 5)
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/products?limit=1000', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data || json || []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.analyte?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.catalogNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const catName = (typeof p.category === 'object' ? p.category?.name : p.category) || '';
    const catCode = (typeof p.category === 'object' ? p.category?.code : '') || '';
    const matchesCat =
      categoryFilter === 'ALL' ||
      catName.toUpperCase().includes(categoryFilter.toUpperCase()) ||
      catCode.toUpperCase().includes(categoryFilter.toUpperCase()) ||
      p.productType?.toUpperCase() === categoryFilter.toUpperCase();

    const compName = (typeof p.company === 'object' ? p.company?.name : p.companyName) || '';
    const compCode = (typeof p.company === 'object' ? p.company?.code : '') || '';
    const matchesComp =
      companyFilter === 'ALL' ||
      compName.toLowerCase().includes(companyFilter.toLowerCase()) ||
      compCode.toLowerCase().includes(companyFilter.toLowerCase()) ||
      p.companyId === companyFilter;

    return matchesSearch && matchesCat && matchesComp;
  });

  // Price Update Workflow Handlers
  const handleStartPriceUpdate = (prod: any) => {
    setSelectedProductForPrice(prod);
    setNewSellingPrice(prod.basePrice || prod.mrp || 4000);
    setNewMrp(prod.mrp || (prod.basePrice ? Math.round(prod.basePrice * 1.15) : 5000));
    setPriceStep('EDIT');
    setPriceChangeReason('Standard price review');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
  };

  const handleReviewPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSellingPrice <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    setPriceStep('REVIEW');
  };

  const handleSavePriceUpdate = async () => {
    if (!selectedProductForPrice) return;
    try {
      const res = await fetch(`/api/v1/products/${selectedProductForPrice.id}/price-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          newPrice: newSellingPrice,
          mrp: newMrp,
          reason: priceChangeReason,
          effectiveDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to update price');
        return;
      }

      showToast(`Price for "${selectedProductForPrice.name}" updated to ₹${formatINR(newSellingPrice)} with audit trail.`);
      setSelectedProductForPrice(null);
      fetchProducts();
    } catch (err) {
      alert('Network error while saving price');
    }
  };

  const handleViewPriceHistory = async (prod: any) => {
    setSelectedProductForPrice(prod);
    setIsPriceHistoryLoading(true);
    setIsPriceHistoryModalOpen(true);
    try {
      const res = await fetch(`/api/v1/products/${prod.id}/price-history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setPriceHistoryList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load price history', err);
    } finally {
      setIsPriceHistoryLoading(false);
    }
  };

  // Bulk Price Update Handlers
  const handleDownloadBulkTemplate = () => {
    const header = 'SKU,ProductName,CurrentPrice,NewPrice,MRP,EffectiveDate\n';
    const rows = products.slice(0, 10).map(p => 
      `"${p.sku}","${p.name.replace(/"/g, '""')}",${p.basePrice || p.mrp || 4000},${p.basePrice || p.mrp || 4000},${p.mrp || 5000},${new Date().toISOString().split('T')[0]}`
    ).join('\n');
    
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Products_Price_Template_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Price update template exported.');
  };

  const handleValidateBulkPrices = async () => {
    if (!bulkCsvText.trim()) {
      alert('Please paste or upload CSV records first.');
      return;
    }

    setIsBulkValidating(true);
    try {
      const lines = bulkCsvText.trim().split('\n');
      const headerLine = lines[0];
      const dataRows = lines.slice(1);

      const items = dataRows.map((line) => {
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return {
          sku: parts[0],
          productName: parts[1],
          currentPrice: Number(parts[2]) || 0,
          newPrice: Number(parts[3]) || 0,
          mrp: Number(parts[4]) || 0,
          effectiveDate: parts[5] || new Date().toISOString().split('T')[0],
        };
      }).filter(i => i.sku);

      const res = await fetch('/api/v1/products/bulk-price-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || 'Validation failed');
        return;
      }
      setBulkValidationResult(json.data);
    } catch (err) {
      alert('Error during bulk validation');
    } finally {
      setIsBulkValidating(false);
    }
  };

  const handleConfirmBulkPriceUpdate = async () => {
    if (!bulkValidationResult || !bulkValidationResult.validatedItems) return;
    setIsBulkApplying(true);
    try {
      const res = await fetch('/api/v1/products/bulk-price-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items: bulkValidationResult.validatedItems }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.message || 'Atomic bulk apply failed');
        return;
      }

      showToast(`Successfully updated prices for ${json.data.updatedCount} products atomically.`);
      setBulkValidationResult(null);
      setBulkCsvText('');
      setActiveSubTab('all_products');
      fetchProducts();
    } catch (err) {
      alert('Network error while applying bulk update');
    } finally {
      setIsBulkApplying(false);
    }
  };

  // Product Edit Handlers
  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setEditForm({
      name: prod.name || '',
      sku: prod.sku || '',
      companyName: prod.companyName || 'Roche Diagnostics',
      category: prod.category || 'IMMUNOLOGY',
      analyte: prod.analyte || '',
      productType: prod.productType || 'Reagent Kit',
      packSize: prod.packSize || '100 Tests',
      unit: prod.unit || 'Kit',
      sellingPrice: prod.basePrice || prod.mrp || 4200,
      mrp: prod.mrp || 4800,
      gst: prod.taxRate || 12,
      stock: prod.stock || 25,
      minStock: prod.minStock || 15,
      storageTemp: prod.storageCondition || '2°C to 8°C',
      compatibleAnalyzers: prod.compatibility ? prod.compatibility.join(', ') : 'Cobas e411, Cobas 6000',
      isActive: prod.isActive !== false,
      relatedProducts: prod.relatedProductIds ? prod.relatedProductIds.join(', ') : 'prod-002, prod-003',
    });
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    // Update local state and mock persist
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: editForm.name,
              sku: editForm.sku,
              basePrice: Number(editForm.sellingPrice),
              mrp: Number(editForm.mrp),
              taxRate: Number(editForm.gst),
              stock: Number(editForm.stock),
              analyte: editForm.analyte,
              category: editForm.category,
              storageCondition: editForm.storageTemp,
              isActive: editForm.isActive,
            }
          : p
      )
    );
    showToast(`Product "${editForm.name}" updated successfully.`);
    setEditingProduct(null);
  };

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
              Diagnostic Catalog &amp; Tariffs
            </span>
            <span className="text-xs text-[#7C8594]">● Multi-OEM Compatibility</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Products &amp; Pricing Module
          </h1>
          <p className="text-xs sm:text-sm text-[#D0DEE5] mt-0.5">
            Audit-safe catalog management, price modifications with difference verification, and bulk Excel tariff updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts()}
            disabled={isLoading}
            className="p-2.5 bg-[#15253F] hover:bg-[#2B3D5B] text-white rounded-xl border border-[#2B3D5B] transition-colors cursor-pointer"
            title="Refresh catalog"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setActiveSubTab('price_update');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
          >
            <Tag className="w-4 h-4" />
            <span>Price Update Workflow</span>
          </button>
        </div>
      </div>

      {/* 8-Tab Navigation (Section 4) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'all_products', label: 'All Products', icon: Boxes },
          { id: 'price_update', label: 'Price Update', icon: Tag },
          { id: 'bulk_pricing', label: 'Import / Export Tariffs', icon: FileSpreadsheet },
          { id: 'stock', label: 'Stock & Inventory', icon: Package },
          { id: 'categories', label: 'Categories', icon: Layers },
          { id: 'companies', label: 'Companies / OEM', icon: Building2 },
          { id: 'analyzers', label: 'Analyzers', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'categories') onNavigateTab('categories');
                else if (tab.id === 'companies') onNavigateTab('companies');
                else if (tab.id === 'stock') onNavigateTab('inventory_management');
                else setActiveSubTab(tab.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#0E1035] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL PRODUCTS TABLE (Section 4) */}
      {/* ========================================================================= */}
      {activeSubTab === 'all_products' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product name, SKU, analyte..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:border-[#0E1035] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:border-[#0E1035] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="IMMUNOLOGY">Immunology</option>
                <option value="BIOCHEMISTRY">Biochemistry</option>
                <option value="HEMATOLOGY">Hematology</option>
                <option value="COAGULATION">Coagulation</option>
              </select>

              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-white focus:border-[#0E1035] focus:outline-none"
              >
                <option value="ALL">All Brands / OEMs</option>
                <option value="Roche Diagnostics">Roche Diagnostics</option>
                <option value="Abbott Diagnostics">Abbott Diagnostics</option>
                <option value="Siemens Healthineers">Siemens Healthineers</option>
                <option value="Sysmex">Sysmex</option>
                <option value="Bio-Rad">Bio-Rad</option>
              </select>
            </div>
          </div>

          {/* Products Table (14 Columns Required by Section 4) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[#2B3D5B] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-2">SKU</th>
                    <th className="py-3 px-2">Company / OEM</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Analyte</th>
                    <th className="py-3 px-2">Pack Size</th>
                    <th className="py-3 px-2 text-right">Current Price</th>
                    <th className="py-3 px-2 text-right">MRP</th>
                    <th className="py-3 px-2 text-center">GST</th>
                    <th className="py-3 px-2 text-center">Stock</th>
                    <th className="py-3 px-2 text-center">Min Stock</th>
                    <th className="py-3 px-2 text-center">Status</th>
                    <th className="py-3 px-2">Last Updated</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading && (
                    <tr>
                      <td colSpan={14} className="py-8 text-center text-slate-500 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                          <span>Loading product catalog...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={14} className="py-8 text-center text-slate-400 font-medium">
                        No products found matching your search or filter criteria.
                      </td>
                    </tr>
                  )}
                  {!isLoading && filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0E1035] max-w-[160px] truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.storageCondition || '2°C to 8°C'}</div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-2 font-mono font-bold text-slate-700">{p.sku}</td>

                      {/* Company / OEM */}
                      <td className="py-3 px-2 font-medium text-slate-800 truncate max-w-[110px]">{p.company?.name || p.companyName || 'Roche'}</td>

                      {/* Category */}
                      <td className="py-3 px-2 font-semibold text-slate-600">{p.category?.name || p.category || 'Reagents'}</td>

                      {/* Analyte */}
                      <td className="py-3 px-2 font-medium text-slate-700">{p.analyte || 'Cardiac / Thyroid'}</td>

                      {/* Pack Size */}
                      <td className="py-3 px-2 text-slate-600">{p.packSize || '100 T'}</td>

                      {/* Current Price */}
                      <td className="py-3 px-2 text-right font-mono font-bold text-[#0E1035]">
                        ₹{formatINR(p.basePrice || p.mrp || 4200)}
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-2 text-right font-mono text-slate-500">
                        ₹{formatINR(p.mrp || 4800)}
                      </td>

                      {/* GST */}
                      <td className="py-3 px-2 text-center font-mono text-slate-600">{p.taxRate || 12}%</td>

                      {/* Stock */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                        <span className={p.stock <= 20 ? 'text-amber-700' : 'text-slate-900'}>{p.stock || 25}</span>
                      </td>

                      {/* Minimum Stock */}
                      <td className="py-3 px-2 text-center font-mono text-slate-500">{p.minStock || 15}</td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {p.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 px-2 text-slate-500 text-[10px] font-mono">
                        {p.updatedAt?.split('T')[0] || '2026-10-01'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartPriceUpdate(p)}
                            title="Update price workflow"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition cursor-pointer"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleViewPriceHistory(p)}
                            title="View price history audit log"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            title="Edit full product specifications"
                            className="p-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-lg transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRICE UPDATE WORKFLOW (Section 6) */}
      {/* ========================================================================= */}
      {activeSubTab === 'price_update' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-[#0E1035] flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <span>Diagnostic Product Price Update Workflow</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select Product &rarr; Edit Price &rarr; Review Difference &amp; % Change &rarr; Save to Immutable Audit Trail
            </p>
          </div>

          {!selectedProductForPrice ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Step 1: Select Diagnostic Product to Update
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleStartPriceUpdate(prod)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#0E1035] hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-[#0E1035]">{prod.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{prod.sku} • {prod.companyName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-[#0E1035]">₹{formatINR(prod.basePrice || prod.mrp || 4000)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Select &rarr;</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : priceStep === 'EDIT' ? (
            <form onSubmit={handleReviewPrice} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Selected Product</span>
                  <div className="text-sm font-bold text-[#0E1035] mt-0.5">{selectedProductForPrice.name}</div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">{selectedProductForPrice.sku} • {selectedProductForPrice.companyName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductForPrice(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Change Product
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Previous Price (INR)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`₹${formatINR(selectedProductForPrice.basePrice || selectedProductForPrice.mrp || 4000)}`}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-100 font-mono font-bold text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    New Selling Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={10}
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    New Maximum Retail Price (MRP)
                  </label>
                  <input
                    type="number"
                    step={10}
                    value={newMrp}
                    onChange={(e) => setNewMrp(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reason for Price Change <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={priceChangeReason}
                    onChange={(e) => setPriceChangeReason(e.target.value)}
                    placeholder="e.g. Annual OEM tariff adjustment, raw material import costs"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedProductForPrice(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Review Price Difference</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: REVIEW DIFF & PERCENTAGE (Section 6) */
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs">
                <span className="font-bold text-emerald-800">Verification Required</span>
                <p className="text-emerald-700 mt-0.5">
                  Carefully review the price delta and effective date before committing to the immutable price history ledger.
                </p>
              </div>

              {(() => {
                const prev = Number(selectedProductForPrice.basePrice) || Number(selectedProductForPrice.mrp) || 4000;
                const diff = newSellingPrice - prev;
                const pct = Math.round((diff / prev) * 1000) / 10;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <div className="text-slate-500 font-semibold">Previous Price</div>
                      <div className="text-base font-black text-slate-800 font-mono mt-0.5">₹{formatINR(prev)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">New Price</div>
                      <div className="text-base font-black text-emerald-800 font-mono mt-0.5">₹{formatINR(newSellingPrice)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">Difference</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {diff >= 0 ? `+₹${formatINR(diff)}` : `-₹${formatINR(Math.abs(diff))}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">Percentage Change</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {pct >= 0 ? `+${pct}%` : `${pct}%`}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">Effective Date</div>
                      <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">{effectiveDate}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-semibold">Updated By</div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">{currentUser?.username || 'Super Admin'}</div>
                    </div>
                    <div className="sm:col-span-3 pt-2 border-t border-slate-200">
                      <div className="text-slate-500 font-semibold">Reason for Modification</div>
                      <div className="text-xs text-slate-800 mt-0.5">{priceChangeReason}</div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPriceStep('EDIT')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  &larr; Back to Edit
                </button>
                <button
                  type="button"
                  onClick={handleSavePriceUpdate}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Save Price</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BULK PRICE UPDATE (Section 7) */}
      {/* ========================================================================= */}
      {activeSubTab === 'bulk_pricing' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0E1035] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Bulk Diagnostic Price Update (Excel / CSV)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Export Products &rarr; Edit Prices &rarr; Upload &rarr; Validate &rarr; Preview Changes &rarr; Confirm Atomic Apply
              </p>
            </div>
            <button
              onClick={handleDownloadBulkTemplate}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Template</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Paste CSV or Tariff Data (SKU, ProductName, CurrentPrice, NewPrice, MRP, EffectiveDate)
              </label>
              <textarea
                rows={6}
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder={'SKU,ProductName,CurrentPrice,NewPrice,MRP,EffectiveDate\nRO-E411-TSH-100,Elecsys TSH Assay,4200,4450,4900,2026-10-15\nAB-C4K-CREAT-200,Architect Creatinine Enzymatic,3800,3950,4400,2026-10-15'}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
              />
            </div>

            <button
              onClick={handleValidateBulkPrices}
              disabled={isBulkValidating || !bulkCsvText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isBulkValidating ? 'animate-spin' : ''}`} />
              <span>Validate Uploaded Prices</span>
            </button>
          </div>

          {/* Bulk Preview Table */}
          {bulkValidationResult && (
            <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#2B3D5B]">
                    Validation Preview ({bulkValidationResult.validatedItems?.length} Products Validated)
                  </h4>
                  <div className="text-[11px] text-slate-500">All SKUs and price numbers verified. No partial failures will be applied.</div>
                </div>
                <button
                  onClick={handleConfirmBulkPriceUpdate}
                  disabled={isBulkApplying}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBulkApplying ? 'Applying Atomic Update...' : 'Confirm & Apply All Changes'}</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[#7C8594] font-semibold">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Old Price</th>
                      <th className="py-2.5 px-3 text-right">New Price</th>
                      <th className="py-2.5 px-3 text-right">Difference</th>
                      <th className="py-2.5 px-3 text-center">% Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bulkValidationResult.validatedItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#0E1035]">{item.sku}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.productName}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{formatINR(item.oldPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">₹{formatINR(item.newPrice)}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${item.diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.diff >= 0 ? `+₹${formatINR(item.diff)}` : `-₹${formatINR(Math.abs(item.diff))}`}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {item.pctChange}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRICE HISTORY AUDIT MODAL (Section 6) */}
      {/* ========================================================================= */}
      {isPriceHistoryModalOpen && selectedProductForPrice && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#2B3D5B]" />
                <h3 className="text-base font-bold text-[#0E1035]">Price History Audit Ledger</h3>
              </div>
              <button 
                onClick={() => setIsPriceHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="py-4">
              <div className="text-xs font-bold text-slate-800">{selectedProductForPrice.name}</div>
              <div className="text-[11px] text-slate-500 font-mono">{selectedProductForPrice.sku}</div>

              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                {isPriceHistoryLoading ? (
                  <div className="p-8 text-center text-slate-400">Loading audit history...</div>
                ) : priceHistoryList.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[#7C8594] font-semibold">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Old Price</th>
                        <th className="py-2 px-3 text-right">New Price</th>
                        <th className="py-2 px-3">Changed By</th>
                        <th className="py-2 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {priceHistoryList.map((hist: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-600">{hist.changedAt?.split('T')[0] || hist.effectiveDate}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">₹{formatINR(hist.previousPrice)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">₹{formatINR(hist.newPrice)}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{hist.changedBy}</td>
                          <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">{hist.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No historical modifications recorded for this product yet.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPriceHistoryModalOpen(false)}
                className="px-4 py-2 bg-[#0E1035] text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRODUCT EDIT DRAWER (Section 5) */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-[#0E1035]/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-left overflow-hidden">
            <div className="bg-[#0E1035] text-white p-6 border-b border-[#15253F] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    Edit Diagnostic Product
                  </h2>
                  <div className="text-xs text-[#D0DEE5] font-mono mt-0.5">
                    SKU: {editingProduct.sku}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 text-[#D0DEE5] hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Product Code / SKU</label>
                  <input
                    type="text"
                    value={editForm.sku}
                    onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Company / OEM</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  >
                    <option value="IMMUNOLOGY">Immunology</option>
                    <option value="BIOCHEMISTRY">Biochemistry</option>
                    <option value="HEMATOLOGY">Hematology</option>
                    <option value="COAGULATION">Coagulation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Analyte</label>
                  <input
                    type="text"
                    value={editForm.analyte}
                    onChange={(e) => setEditForm({ ...editForm, analyte: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Selling Price (INR)</label>
                  <input
                    type="number"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">MRP (INR)</label>
                  <input
                    type="number"
                    value={editForm.mrp}
                    onChange={(e) => setEditForm({ ...editForm, mrp: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={editForm.gst}
                    onChange={(e) => setEditForm({ ...editForm, gst: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Current Stock Level</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Minimum Stock Alert Level</label>
                  <input
                    type="number"
                    value={editForm.minStock}
                    onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold uppercase mb-1">Storage Temperature</label>
                  <input
                    type="text"
                    value={editForm.storageTemp}
                    onChange={(e) => setEditForm({ ...editForm, storageTemp: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase mb-1">Compatible Analyzers</label>
                  <input
                    type="text"
                    value={editForm.compatibleAnalyzers}
                    onChange={(e) => setEditForm({ ...editForm, compatibleAnalyzers: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold uppercase mb-1">Related Products (Cross-OEM Alternatives preserved)</label>
                  <input
                    type="text"
                    value={editForm.relatedProducts}
                    onChange={(e) => setEditForm({ ...editForm, relatedProducts: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:border-[#0E1035] focus:outline-none font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">Preserves similar kit comparisons inside the mobile customer ordering flow.</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0E1035] hover:bg-[#15253F] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
