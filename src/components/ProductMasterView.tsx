import React, { useState, useEffect, useCallback } from 'react';
import { 
  Product, 
  Company, 
  Category, 
  ProductType, 
  StockStatus, 
  DocumentType,
  UserRoleType 
} from '../types';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  ThermometerSnowflake, 
  Building2, 
  Tag, 
  Layers, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Image as ImageIcon, 
  Boxes, 
  AlertCircle, 
  Download, 
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  X,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { ProductImportView } from './ProductImportView';

interface ProductMasterViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
}

export function ProductMasterView({ accessToken, currentRole }: ProductMasterViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedProductType, setSelectedProductType] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('ALL');
  const [coldChainFilter, setColdChainFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 8;

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Detail Modal / Add/Edit Modal
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [modalTab, setModalTab] = useState<'basic' | 'images' | 'documents' | 'packs'>('basic');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    sku: '',
    catalogNumber: '',
    name: '',
    shortDescription: '',
    description: '',
    companyId: '',
    categoryId: '',
    productType: ProductType.REAGENT,
    hsnCode: '38220090',
    gstRate: 12.00,
    basePrice: 0,
    mrp: 0,
    minOrderQuantity: 1,
    isColdChain: false,
    storageTemperature: '2°C to 8°C',
    shelfLifeMonths: 24,
    requiresPrescriptionOrAuth: false,
    isActive: true,
    isFeatured: false,
    packSize: '1 Kit',
    stockQuantity: 50,
    stockStatus: StockStatus.IN_STOCK,
    leadTimeDays: 2,
    images: [] as Array<{ imageUrl: string; thumbnailUrl: string; altText: string; isPrimary: boolean; sortOrder: number }>,
    documents: [] as Array<{ title: string; documentType: DocumentType; fileUrl: string; fileSizeBytes: number; mimeType: string; version: string; isPublic: boolean }>,
    packOptions: [] as Array<{ packName: string; packSku: string; testsCount?: number; multiplier: number; price: number; isDefault: boolean }>
  });

  // Temporary item adders for Modal tabs
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<DocumentType>(DocumentType.IFU_PACK_INSERT);
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newPackName, setNewPackName] = useState('');
  const [newPackPrice, setNewPackPrice] = useState(0);
  const [newPackTests, setNewPackTests] = useState(100);

  const canManage = currentRole === UserRoleType.SUPER_ADMIN || currentRole === UserRoleType.OFFICE_ADMIN;

  // Fetch Companies & Categories for dropdowns
  useEffect(() => {
    async function loadMeta() {
      try {
        const [compRes, catRes] = await Promise.all([
          fetch('/api/v1/companies?isActive=true'),
          fetch('/api/v1/categories?isActive=true')
        ]);
        if (compRes.ok && catRes.ok) {
          const compData = await compRes.json();
          const catData = await catRes.json();
          setCompanies(compData.data || []);
          setCategories(catData.data || []);
        }
      } catch (err) {
        console.error('Error fetching meta dropdowns', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch Products based on all filters
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('search', searchQuery);
      if (selectedCompanyId !== 'ALL') queryParams.set('companyId', selectedCompanyId);
      if (selectedCategoryId !== 'ALL') queryParams.set('categoryId', selectedCategoryId);
      if (selectedProductType !== 'ALL') queryParams.set('productType', selectedProductType);
      if (availabilityFilter !== 'ALL') queryParams.set('availability', availabilityFilter);
      if (coldChainFilter !== 'ALL') queryParams.set('isColdChain', coldChainFilter === 'YES' ? 'true' : 'false');
      if (statusFilter !== 'ALL') queryParams.set('isActive', statusFilter === 'ACTIVE' ? 'true' : 'false');
      queryParams.set('sortBy', sortBy);
      queryParams.set('page', String(currentPage));
      queryParams.set('limit', String(pageSize));

      const res = await fetch(`/api/v1/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalCount(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    selectedCompanyId,
    selectedCategoryId,
    selectedProductType,
    availabilityFilter,
    coldChainFilter,
    statusFilter,
    sortBy,
    currentPage
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormError(null);
    setModalTab('basic');
    setFormData({
      sku: '',
      catalogNumber: '',
      name: '',
      shortDescription: '',
      description: '',
      companyId: companies[0]?.id || '',
      categoryId: categories[0]?.id || '',
      productType: ProductType.REAGENT,
      hsnCode: '38220090',
      gstRate: 12.00,
      basePrice: 1500,
      mrp: 1800,
      minOrderQuantity: 1,
      isColdChain: false,
      storageTemperature: '2°C to 8°C',
      shelfLifeMonths: 24,
      requiresPrescriptionOrAuth: false,
      isActive: true,
      isFeatured: false,
      packSize: '100 Tests / Kit',
      stockQuantity: 50,
      stockStatus: StockStatus.IN_STOCK,
      leadTimeDays: 2,
      images: [
        {
          imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=150&q=80',
          altText: 'Product Front Packaging',
          isPrimary: true,
          sortOrder: 0
        }
      ],
      documents: [
        {
          title: 'Instructions for Use (IFU Pack Insert)',
          documentType: DocumentType.IFU_PACK_INSERT,
          fileUrl: 'https://www.a2zdiagnostics.com/docs/sample_ifu.pdf',
          fileSizeBytes: 1572864,
          mimeType: 'application/pdf',
          version: 'v1.0',
          isPublic: true
        }
      ],
      packOptions: [
        {
          packName: 'Standard 100 Tests Kit',
          packSku: 'STD-100T',
          testsCount: 100,
          multiplier: 1.0,
          price: 1500,
          isDefault: true
        }
      ]
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormError(null);
    setModalTab('basic');
    setFormData({
      sku: prod.sku,
      catalogNumber: prod.catalogNumber || '',
      name: prod.name,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      companyId: prod.companyId,
      categoryId: prod.categoryId,
      productType: prod.productType,
      hsnCode: prod.hsnCode,
      gstRate: prod.gstRate,
      basePrice: prod.basePrice,
      mrp: prod.mrp,
      minOrderQuantity: prod.minOrderQuantity,
      isColdChain: prod.isColdChain,
      storageTemperature: prod.storageTemperature,
      shelfLifeMonths: prod.shelfLifeMonths || 24,
      requiresPrescriptionOrAuth: prod.requiresPrescriptionOrAuth,
      isActive: prod.isActive,
      isFeatured: prod.isFeatured,
      packSize: prod.packSize,
      stockQuantity: prod.stockQuantity,
      stockStatus: prod.stockStatus,
      leadTimeDays: prod.leadTimeDays,
      images: prod.images ? prod.images.map(i => ({ ...i })) : [],
      documents: prod.documents ? prod.documents.map(d => ({ ...d })) : [],
      packOptions: prod.packOptions ? prod.packOptions.map(p => ({ ...p })) : []
    });
    setIsAddEditModalOpen(true);
  };

  const handleToggleActive = async (prod: Product) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/v1/products/${prod.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`
        },
        body: JSON.stringify({ isActive: !prod.isActive })
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error('Error toggling product status', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!formData.name.trim() || !formData.companyId || !formData.categoryId || (!editingProduct && !formData.sku.trim())) {
      setFormError('Product Name, SKU, Manufacturer, and Category are mandatory.');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editingProduct ? `/api/v1/products/${editingProduct.id}` : '/api/v1/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`
        },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.message || 'Operation failed');
      } else {
        setIsAddEditModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/v1/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken || ''}`
        }
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchProducts();
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Add temp image in modal
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [
        ...prev.images,
        {
          imageUrl: newImageUrl.trim(),
          thumbnailUrl: newImageUrl.trim(),
          altText: newImageAlt.trim() || prev.name,
          isPrimary: prev.images.length === 0,
          sortOrder: prev.images.length
        }
      ]
    }));
    setNewImageUrl('');
    setNewImageAlt('');
  };

  // Add temp document in modal
  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          title: newDocTitle.trim(),
          documentType: newDocType,
          fileUrl: newDocUrl.trim(),
          fileSizeBytes: 2097152,
          mimeType: 'application/pdf',
          version: 'v1.0',
          isPublic: true
        }
      ]
    }));
    setNewDocTitle('');
    setNewDocUrl('');
  };

  // Add temp pack in modal
  const handleAddPack = () => {
    if (!newPackName.trim() || !newPackPrice) return;
    setFormData(prev => ({
      ...prev,
      packOptions: [
        ...prev.packOptions,
        {
          packName: newPackName.trim(),
          packSku: `${prev.sku}-P${prev.packOptions.length + 1}`,
          testsCount: newPackTests,
          multiplier: prev.basePrice > 0 ? +(newPackPrice / prev.basePrice).toFixed(2) : 1,
          price: Number(newPackPrice),
          isDefault: prev.packOptions.length === 0
        }
      ]
    }));
    setNewPackName('');
    setNewPackPrice(0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22381E] uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            <span>Enterprise Master Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Diagnostic Product Master & Technical Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Enterprise in-vitro diagnostic products catalog with cold-chain protocols (2-8°C, -20°C deep freeze), HSN/GST taxation, multi-image galleries, and compliant MSDS / IFU pack inserts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canManage && (
            <>
              <button
                id="product-master-import-btn"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Products</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Multi-Parameter Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product name, SKU, catalog number, or HSN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9.5 pr-4 py-2 bg-[#F9FAF6] border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E] focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Sort and View Mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
              >
                <option value="name">Product Name (A-Z)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="sku">SKU Code</option>
                <option value="created_at">Latest Added</option>
              </select>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#22381E] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#22381E] shadow-2xs' : 'text-slate-500'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          {/* Company Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Manufacturer</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => { setSelectedCompanyId(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Companies</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Category Subtree Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category Subtree</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {'- '.repeat(cat.level)} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Type</label>
            <select
              value={selectedProductType}
              onChange={(e) => { setSelectedProductType(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Types</option>
              {Object.values(ProductType).map(pt => (
                <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Cold Chain Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cold Chain (2-8°C)</label>
            <select
              value={coldChainFilter}
              onChange={(e) => { setColdChainFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Temperatures</option>
              <option value="YES">Cold Chain Only</option>
              <option value="NO">Ambient Only</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Availability</label>
            <select
              value={availabilityFilter}
              onChange={(e) => { setAvailabilityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock Only</option>
              <option value="COLD_CHAIN">Cold Chain Stock</option>
            </select>
          </div>

          {/* Active Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Catalog Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
            >
              <option value="ALL">All (Active & Off)</option>
              <option value="ACTIVE">Active in Mobile</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCT GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((prod) => {
            const primaryImg = prod.images?.find(i => i.isPrimary)?.imageUrl || prod.images?.[0]?.imageUrl;
            return (
              <div 
                key={prod.id}
                className={`bg-white rounded-xl border transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                  prod.isActive ? 'border-slate-200 hover:border-[#D2E7C4] shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-75'
                }`}
              >
                {/* Product Image & Badges */}
                <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                  {primaryImg ? (
                    <img 
                      src={primaryImg} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="w-12 h-12 text-slate-300" />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    {prod.isColdChain && (
                      <span className="inline-flex items-center gap-1 bg-cyan-600/90 text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-xs backdrop-blur-xs">
                        <ThermometerSnowflake className="w-3 h-3" />
                        {prod.storageTemperature}
                      </span>
                    )}
                    <span className="font-mono text-[9px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                      {prod.sku}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs ${
                      prod.stockStatus === StockStatus.IN_STOCK 
                        ? 'bg-emerald-500 text-white' 
                        : prod.stockStatus === StockStatus.LOW_STOCK 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {prod.stockQuantity} In Stock
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span className="text-[#22381E] font-semibold truncate max-w-[120px]">
                        {prod.company?.name || 'Diagnostic Vendor'}
                      </span>
                      <span className="truncate max-w-[110px] text-slate-400">
                        {prod.category?.name}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug" title={prod.name}>
                      {prod.name}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {prod.shortDescription || prod.packSize}
                    </p>
                  </div>

                  {/* Pricing & GST Info */}
                  <div className="pt-3 mt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{(prod.basePrice ?? 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through ml-1.5">
                          ₹{(prod.mrp ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        GST: {prod.gstRate}%
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>Pack: {prod.packSize}</span>
                      <span>HSN: {prod.hsnCode}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {prod.documents && prod.documents.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        <FileText className="w-2.5 h-2.5 text-[#22381E]" />
                        {prod.documents.length} Docs
                      </span>
                    )}
                    {prod.packOptions && prod.packOptions.length > 1 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        <Boxes className="w-2.5 h-2.5 text-emerald-600" />
                        {prod.packOptions.length} Packs
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingProduct(prod)}
                      className="p-1.5 text-slate-500 hover:text-[#22381E] hover:bg-white rounded-md transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleToggleActive(prod)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            prod.isActive ? 'text-amber-600 hover:bg-white' : 'text-emerald-600 hover:bg-white'
                          }`}
                          title={prod.isActive ? 'Deactivate Product' : 'Activate Product'}
                        >
                          {prod.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-slate-500 hover:text-[#22381E] hover:bg-white rounded-md transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(prod)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Storage / Cold Chain</th>
                <th className="py-3 px-4 text-right">Price (₹)</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {prod.images?.[0]?.imageUrl ? (
                          <img src={prod.images[0].imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 mt-0.5">
                          <span>SKU: {prod.sku}</span>
                          <span>•</span>
                          <span>HSN: {prod.hsnCode}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {prod.company?.name || 'Roche / Abbott'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {prod.category?.name || 'Reagents'}
                  </td>
                  <td className="py-3 px-4">
                    {prod.isColdChain ? (
                      <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold text-[10px] px-2 py-0.5 rounded">
                        <ThermometerSnowflake className="w-3 h-3 text-cyan-600" />
                        {prod.storageTemperature}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Ambient (15-25°C)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-slate-900">₹{(prod.basePrice ?? 0).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">MRP ₹{prod.mrp}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-slate-800">{prod.stockQuantity}</span>
                    <div className="text-[10px] text-emerald-600 font-medium">{prod.stockStatus}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      prod.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {prod.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingProduct(prod)}
                        className="p-1.5 text-slate-500 hover:text-[#22381E] hover:bg-slate-100 rounded"
                        title="Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-500 hover:text-[#22381E] hover:bg-slate-100 rounded"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(prod)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Products Matching Criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search query or reset the temperature/company filters.</p>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-600">
        <div>
          Showing <span className="font-bold text-slate-900">{products.length}</span> of <span className="font-bold text-slate-900">{totalCount}</span> catalog items
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PRODUCT QUICK VIEW MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                    {viewingProduct.sku}
                  </span>
                  {viewingProduct.isColdChain && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded">
                      <ThermometerSnowflake className="w-3 h-3" />
                      {viewingProduct.storageTemperature}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{viewingProduct.name}</h2>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  {viewingProduct.company?.name} • {viewingProduct.category?.name}
                </div>
              </div>

              <button
                onClick={() => setViewingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images Gallery */}
            {viewingProduct.images && viewingProduct.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {viewingProduct.images.map((img, i) => (
                  <div key={i} className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={img.imageUrl} alt={img.altText || viewingProduct.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed">
              <strong className="block text-slate-900 font-semibold mb-1">Clinical Specifications:</strong>
              {viewingProduct.description || viewingProduct.shortDescription}
            </div>

            {/* Technical Documents */}
            {viewingProduct.documents && viewingProduct.documents.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Technical Documents & Regulatory Inserts</h4>
                <div className="space-y-2">
                  {viewingProduct.documents.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#22381E]" />
                        <div>
                          <div className="font-semibold text-slate-800">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{doc.documentType} • Version {doc.version}</div>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#D2E7C4] text-[#1E331B] hover:bg-[#C3E2B8] rounded text-xs font-medium flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pack Options */}
            {viewingProduct.packOptions && viewingProduct.packOptions.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Available Pack Configurations</h4>
                <div className="grid grid-cols-2 gap-2">
                  {viewingProduct.packOptions.map((pk, idx) => (
                    <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{pk.packName}</div>
                        <div className="text-[10px] text-slate-400">{pk.testsCount ? `${pk.testsCount} Tests` : 'Standard'}</div>
                      </div>
                      <div className="font-extrabold text-[#22381E]">
                        ₹{(pk.price ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COMPREHENSIVE PRODUCT MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingProduct ? `Edit Diagnostic Product: ${editingProduct.sku}` : 'Create New Diagnostic Product Master'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure pricing, cold chain protocols, multi-image assets and MSDS docs.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setModalTab('basic')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'basic' ? 'border-[#22381E] text-[#1E331B] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Core Specifications & Pricing
              </button>
              <button
                type="button"
                onClick={() => setModalTab('images')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'images' ? 'border-[#22381E] text-[#1E331B] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Product Images ({formData.images.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('documents')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'documents' ? 'border-[#22381E] text-[#1E331B] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. MSDS & IFU Inserts ({formData.documents.length})
              </button>
              <button
                type="button"
                onClick={() => setModalTab('packs')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  modalTab === 'packs' ? 'border-[#22381E] text-[#1E331B] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Pack Configurations ({formData.packOptions.length})
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: BASIC SPECS */}
              {modalTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        SKU Identifier <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!!editingProduct}
                        placeholder="e.g. RCH-GLUC-500T"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs font-mono uppercase bg-[#F9FAF6] focus:bg-white focus:ring-2 focus:ring-[#22381E] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        OEM Catalog / Ref #
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 07224211190"
                        value={formData.catalogNumber}
                        onChange={(e) => setFormData({ ...formData, catalogNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Product Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.productType}
                        onChange={(e) => setFormData({ ...formData, productType: e.target.value as ProductType })}
                        className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs bg-[#F9FAF6] focus:ring-2 focus:ring-[#22381E]"
                      >
                        {Object.values(ProductType).map(pt => (
                          <option key={pt} value={pt}>{pt.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Name & Full Diagnostic Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Accu-Chek Inform II Reagent Glucose Test Strips"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Manufacturer / Company <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.companyId}
                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs bg-[#F9FAF6] focus:ring-2 focus:ring-[#22381E]"
                      >
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.country})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category Node <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs bg-[#F9FAF6] focus:ring-2 focus:ring-[#22381E]"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {'- '.repeat(cat.level)} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing & Tax Matrix */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Base Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        required
                        value={formData.mrp}
                        onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">GST Rate (%)</label>
                      <input
                        type="number"
                        value={formData.gstRate}
                        onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) || 12 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">HSN Code</label>
                      <input
                        type="text"
                        value={formData.hsnCode}
                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Cold Chain & Storage */}
                  <div className="p-4 bg-cyan-50/60 rounded-xl border border-cyan-200 grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 pt-4">
                      <input
                        type="checkbox"
                        id="isColdChain"
                        checked={formData.isColdChain}
                        onChange={(e) => setFormData({ ...formData, isColdChain: e.target.checked })}
                        className="w-4 h-4 text-cyan-600 rounded"
                      />
                      <label htmlFor="isColdChain" className="text-xs font-bold text-cyan-900">
                        Cold Chain Reagent
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-900 mb-1">Storage Temperature</label>
                      <input
                        type="text"
                        value={formData.storageTemperature}
                        onChange={(e) => setFormData({ ...formData, storageTemperature: e.target.value })}
                        placeholder="2°C to 8°C or -20°C"
                        className="w-full px-2.5 py-1.5 bg-white border border-cyan-200 rounded-lg text-xs text-cyan-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-cyan-900 mb-1">Shelf Life (Months)</label>
                      <input
                        type="number"
                        value={formData.shelfLifeMonths}
                        onChange={(e) => setFormData({ ...formData, shelfLifeMonths: parseInt(e.target.value, 10) || 24 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-cyan-200 rounded-lg text-xs text-cyan-900"
                      />
                    </div>
                  </div>

                  {/* Stock & Active Toggles */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size Label</label>
                      <input
                        type="text"
                        placeholder="e.g. 500 Strips / Drum"
                        value={formData.packSize}
                        onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
                      <input
                        type="number"
                        value={formData.leadTimeDays}
                        onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value, 10) || 2 })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="prodActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-[#22381E] rounded"
                      />
                      <label htmlFor="prodActive" className="text-xs font-medium text-slate-700">
                        Product is Active (Visible in Mobile App)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="prodFeatured"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 text-[#22381E] rounded"
                      />
                      <label htmlFor="prodFeatured" className="text-xs font-medium text-slate-700">
                        Featured on Mobile Home Screen
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: IMAGES */}
              {modalTab === 'images' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Attach Product Image URL</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="url"
                        placeholder="Image URL (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-3 py-2 bg-[#22381E] text-[#D2E7C4] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Image</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((img, i) => (
                      <div key={i} className="p-2.5 border border-slate-200 rounded-xl bg-white space-y-2 relative group">
                        <div className="h-28 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                          <img src={img.imageUrl} alt={img.altText} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.map((item, idx) => ({
                                  ...item,
                                  isPrimary: idx === i
                                }))
                              }));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              img.isPrimary ? 'bg-[#22381E] text-[#D2E7C4]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {img.isPrimary ? '★ Primary' : 'Set Primary'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter((_, idx) => idx !== i)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS */}
              {modalTab === 'documents' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Attach Technical / Regulatory Document</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Document Title (e.g. Accu-Chek Inform II MSDS)"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as DocumentType)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {Object.values(DocumentType).map(dt => (
                          <option key={dt} value={dt}>{dt.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="PDF URL"
                          value={newDocUrl}
                          onChange={(e) => setNewDocUrl(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddDocument}
                          className="px-3 py-2 bg-[#22381E] text-[#D2E7C4] rounded-lg text-xs font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formData.documents.map((doc, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between text-xs bg-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#22381E]" />
                          <div>
                            <div className="font-semibold text-slate-800">{doc.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.documentType}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              documents: prev.documents.filter((_, i) => i !== idx)
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PACKS */}
              {modalTab === 'packs' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Add Multi-Pack Configuration</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="text"
                        placeholder="Pack Name (e.g. 500 Tests Bulk Drum)"
                        value={newPackName}
                        onChange={(e) => setNewPackName(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Tests Count (e.g. 500)"
                        value={newPackTests}
                        onChange={(e) => setNewPackTests(parseInt(e.target.value, 10) || 100)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Pack Price (₹)"
                        value={newPackPrice}
                        onChange={(e) => setNewPackPrice(parseFloat(e.target.value) || 0)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddPack}
                        className="px-3 py-2 bg-[#22381E] text-[#D2E7C4] rounded-lg text-xs font-semibold"
                      >
                        Add Pack
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formData.packOptions.map((pk, idx) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between text-xs bg-white">
                        <div>
                          <span className="font-bold text-slate-800">{pk.packName}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">
                            {pk.testsCount ? `${pk.testsCount} Tests` : ''} • SKU: {pk.packSku}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-[#22381E]">₹{pk.price}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                packOptions: prev.packOptions.filter((_, i) => i !== idx)
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product Master' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Delete Product {deleteTarget.sku}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-800">{deleteTarget.name}</strong>? This will remove all associated technical documents, images, and pack configurations.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full-Screen Product Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-[#22381E]" />
                <span className="text-sm font-bold">Product Master Excel Import Engine</span>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  fetchProducts();
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <ProductImportView
                accessToken={accessToken}
                currentRole={currentRole}
                onImportComplete={() => {
                  fetchProducts();
                }}
                onNavigateToCatalog={() => {
                  setIsImportModalOpen(false);
                  fetchProducts();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
