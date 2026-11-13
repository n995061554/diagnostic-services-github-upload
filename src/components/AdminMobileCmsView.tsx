import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  CheckCircle2, 
  Percent, 
  Tag, 
  Sparkles, 
  ShieldCheck, 
  Smartphone,
  Layers,
  ArrowUpDown,
  Building2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { MobileBanner, FeaturedOffer, MobileHomeConfig, CustomerPriceRule, Company, Product, Category } from '../types';

export function AdminMobileCmsView() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CMS State
  const [banners, setBanners] = useState<MobileBanner[]>([]);
  const [featuredOffers, setFeaturedOffers] = useState<FeaturedOffer[]>([]);
  const [bestSellingProductIds, setBestSellingProductIds] = useState<string[]>([]);
  const [bestSellingEquipmentIds, setBestSellingEquipmentIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<MobileHomeConfig['visibility']>({
    showBanners: true,
    showFeaturedOffers: true,
    showCompanySelection: true,
    showBestSellingProducts: true,
    showBestSellingEquipment: true,
    showRecentlyOrdered: true,
    showProductComparisonShortcut: true,
    showWalletSummary: true,
    showQuickCategories: true,
  });

  // Reference Data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pricingRules, setPricingRules] = useState<CustomerPriceRule[]>([]);

  // Modals & New Entries
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Partial<MobileBanner> | null>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [newPricingRule, setNewPricingRule] = useState<{
    customerId: string;
    customerLabName: string;
    companyId?: string;
    productId?: string;
    discountPercent?: number;
    customFixedPrice?: number;
  }>({
    customerId: 'u-cust-02',
    customerLabName: 'Apollo Diagnostic & Research Hub',
    discountPercent: 15
  });

  const loadCmsData = async () => {
    setLoading(true);
    try {
      const [cmsRes, compRes, prodRes, catRes, priceRes] = await Promise.all([
        fetch('/api/v1/admin/mobile-cms'),
        fetch('/api/v1/companies'),
        fetch('/api/v1/products?limit=100'),
        fetch('/api/v1/categories'),
        fetch('/api/v1/admin/customer-pricing')
      ]);

      if (cmsRes.ok) {
        const cmsData = await cmsRes.json();
        setBanners(cmsData.data.banners || []);
        setFeaturedOffers(cmsData.data.featuredOffers || []);
        setBestSellingProductIds(cmsData.data.bestSellingProductIds || []);
        setBestSellingEquipmentIds(cmsData.data.bestSellingEquipmentIds || []);
        if (cmsData.data.visibility) {
          setVisibility(cmsData.data.visibility);
        }
      }

      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData.data || []);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.data || []);
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.data || []);
      }

      if (priceRes.ok) {
        const priceData = await priceRes.json();
        setPricingRules(priceData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch CMS settings', err);
      setErrorMessage('Failed to load Mobile CMS settings from API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/admin/mobile-cms/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visibility,
          bestSellingProductIds,
          bestSellingEquipmentIds,
          banners,
          featuredOffers
        })
      });

      if (res.ok) {
        setSuccessMessage('Mobile App Dynamic Home configuration published successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage('Failed to save CMS configuration');
      }
    } catch (err) {
      setErrorMessage('Network error while saving CMS config');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = (key: keyof MobileHomeConfig['visibility']) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/mobile-cms/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete banner', err);
    }
  };

  const handleSaveBannerModal = async () => {
    if (!editingBanner?.title || !editingBanner?.imageUrl) return;
    try {
      const res = await fetch('/api/v1/admin/mobile-cms/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner)
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(prev => [...prev, data.data]);
        setIsBannerModalOpen(false);
        setEditingBanner(null);
      }
    } catch (err) {
      console.error('Failed to create banner', err);
    }
  };

  const handleAddPricingRule = async () => {
    try {
      const res = await fetch('/api/v1/admin/customer-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPricingRule)
      });
      if (res.ok) {
        const data = await res.json();
        setPricingRules(prev => [...prev, data.data]);
        setIsPricingModalOpen(false);
        setSuccessMessage(`Contract price rule saved for ${data.data.customerLabName}`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to add pricing rule', err);
    }
  };

  const handleDeletePricingRule = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/customer-pricing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPricingRules(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete pricing rule', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22381E] uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4 text-[#22381E]" />
            <span>Office Admin Mobile CMS & Pricing Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-[#22381E] tracking-tight">
            Customer Mobile App CMS & Contract Pricing Master
          </h1>
          <p className="text-sm text-[#415439] mt-1 max-w-2xl">
            Control the dynamic customer mobile experience in real time. Manage promotional banners, four featured offers, product ordering, section visibility, and customer-specific contract prices without code redeployment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCmsData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 border border-[#D2E7C4] bg-white rounded-lg text-xs font-medium text-[#22381E] hover:bg-[#E4F1DC] transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#22381E] hover:bg-[#2E4B29] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#D2E7C4]" />
            {saving ? 'Publishing...' : 'Publish Mobile Config'}
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 bg-[#D2E7C4] border border-[#5F8F4D]/40 rounded-xl flex items-center gap-3 text-[#22381E] text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#5F8F4D] flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-[#F3C7C2] border border-[#B94A40]/40 rounded-xl flex items-center gap-3 text-[#8F2D25] text-sm">
          <AlertCircle className="w-5 h-5 text-[#B94A40] flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SECTION 1: VISIBILITY TOGGLES */}
        <div className="bg-white rounded-xl border border-[#D2E7C4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F6F0] pb-3">
            <h2 className="font-bold text-[#22381E] text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#22381E]" />
              Dynamic Home Visibility Toggles
            </h2>
            <span className="text-[10px] font-bold bg-[#D2E7C4] text-[#22381E] px-2 py-0.5 rounded-full uppercase border border-[#5F8F4D]/40">
              Live App Control
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Toggle on/off individual mobile home page widgets dynamically. Changes take effect on the next client refresh.
          </p>

          <div className="space-y-2.5">
            {[
              { key: 'showBanners', label: 'Rotating Promotional Banners', desc: 'Top dynamic carousel with deep links' },
              { key: 'showFeaturedOffers', label: 'Four Featured Offers', desc: '2x2 grid of discount and lease campaigns' },
              { key: 'showCompanySelection', label: 'Authorized Brands Carousel', desc: 'Manufacturer logos & quick navigation' },
              { key: 'showBestSellingProducts', label: 'Best-Selling Products', desc: 'Popular diagnostic reagents & consumables' },
              { key: 'showBestSellingEquipment', label: 'Best-Selling Equipment', desc: 'Laboratory analyzers & lease schemes' },
              { key: 'showRecentlyOrdered', label: 'Recently Ordered (1-Click Reorder)', desc: 'Fast reordering widget for labs' },
              { key: 'showWalletSummary', label: 'Lab Credit Wallet Card', desc: 'Credit limit & available balance snapshot' },
              { key: 'showProductComparisonShortcut', label: 'Product Compare Bar', desc: 'Side-by-side spec comparison tool' },
              { key: 'showQuickCategories', label: 'Quick Category Browser', desc: 'Reagent, Instrument, and Consumable chips' }
            ].map(item => {
              const isVisible = visibility[item.key as keyof MobileHomeConfig['visibility']];
              return (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition"
                >
                  <div className="pr-2">
                    <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(item.key as keyof MobileHomeConfig['visibility'])}
                    className={`p-1.5 rounded-md cursor-pointer transition ${
                      isVisible 
                        ? 'bg-[#22381E] text-[#D2E7C4] hover:bg-[#22381E]' 
                        : 'bg-[#E4E8DF] text-[#4B5A48] hover:bg-[#D2E7C4]/50'
                    }`}
                  >
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: ROTATING PROMOTIONAL BANNERS */}
        <div className="bg-white rounded-xl border border-[#D2E7C4] p-5 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#F5F6F0] pb-3">
            <h2 className="font-bold text-[#22381E] text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C58A16]" />
              Rotating Promotional Banners (Home Carousel)
            </h2>
            <button
              onClick={() => {
                setEditingBanner({
                  title: 'New Diagnostic Promo',
                  subtitle: 'Special limited time pricing',
                  badgeText: 'HOT DEAL',
                  imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
                  deepLinkType: 'CATEGORY',
                  deepLinkId: 'cat-chem-01',
                  backgroundColor: '#1e3a8a',
                  sortOrder: banners.length + 1,
                  isActive: true
                });
                setIsBannerModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {banners.map((banner, index) => (
              <div 
                key={banner.id} 
                className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs group"
                style={{ backgroundColor: banner.backgroundColor || '#1e3a8a' }}
              >
                <div className="h-28 w-full relative overflow-hidden">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title} 
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  
                  <div className="absolute top-2 left-3">
                    {banner.badgeText && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-amber-400 text-slate-950">
                        {banner.badgeText}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                      onClick={() => {
                        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
                      }}
                      className={`p-1 rounded text-xs ${banner.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-200'}`}
                      title={banner.isActive ? 'Active' : 'Inactive'}
                    >
                      {banner.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-3 right-3 text-white">
                    <div className="text-xs font-bold truncate">{banner.title}</div>
                    <div className="text-[10px] text-slate-200 truncate">{banner.subtitle}</div>
                  </div>
                </div>

                <div className="bg-white p-2.5 border-t border-[#F5F6F0] flex items-center justify-between text-[11px] text-[#415439]">
                  <span className="font-mono">Sort #{banner.sortOrder || index + 1}</span>
                  <span className="font-semibold text-[#22381E]">
                    Link: {banner.deepLinkType} ({banner.deepLinkId || 'General'})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 4 FEATURED OFFERS EDITOR */}
          <div className="mt-6 border-t border-[#D2E7C4] pt-4">
            <h3 className="font-bold text-[#22381E] text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#22381E]" />
              Four Featured Mobile Offers (2x2 Grid)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {featuredOffers.map((offer, idx) => (
                <div key={offer.id} className="p-3 bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#22381E] text-[#D2E7C4] rounded">
                      {offer.discountTag}
                    </span>
                    <input
                      type="checkbox"
                      checked={offer.isActive}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFeaturedOffers(prev => prev.map(o => o.id === offer.id ? { ...o, isActive: val } : o));
                      }}
                      className="rounded text-[#22381E] focus:ring-[#22381E]"
                    />
                  </div>

                  <div className="text-xs font-bold text-[#22381E] truncate">{offer.title}</div>
                  <div className="text-[10px] text-[#415439] truncate">{offer.subtitle}</div>
                  
                  {offer.couponCode && (
                    <div className="text-[10px] font-mono text-[#22381E] bg-[#D2E7C4] px-1.5 py-0.5 rounded border border-[#5F8F4D]/40">
                      Code: {offer.couponCode}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CUSTOMER-SPECIFIC CONTRACT PRICING ENGINE */}
      <div className="bg-white rounded-xl border border-[#D2E7C4] p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#F5F6F0] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#22381E] uppercase tracking-wider mb-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Leakage Customer Pricing Rules</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Customer-Specific Contract Pricing Master
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict isolation engine. Prices configured here are only visible to the designated authenticated lab. Competitors and other customers cannot view another lab's negotiated rates.
            </p>
          </div>

          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Contract Price Rule
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Customer / Laboratory</th>
                <th className="py-2.5 px-3">Rule Scope</th>
                <th className="py-2.5 px-3">Target Product / Brand</th>
                <th className="py-2.5 px-3">Applied Benefit</th>
                <th className="py-2.5 px-3">Validity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pricingRules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <div>{rule.customerLabName || rule.customerId}</div>
                    <div className="text-[10px] font-mono text-slate-400">ID: {rule.customerId}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {rule.productId ? 'SKU Specific' : rule.companyId ? 'Brand Tier' : 'Category'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {rule.productName || rule.companyName || rule.categoryName || 'Universal Contract'}
                  </td>
                  <td className="py-3 px-3">
                    {rule.customFixedPrice ? (
                      <span className="font-bold text-[#22381E] bg-[#D2E7C4] px-2 py-0.5 rounded border border-[#5F8F4D]/40">
                        Fixed ₹{(rule.customFixedPrice ?? 0).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="font-bold text-[#245B63] bg-[#C9DDE0] px-2 py-0.5 rounded border border-[#4C8994]/40">
                        {rule.discountPercent}% Off Base Price
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {rule.validUntil ? new Date(rule.validUntil).toLocaleDateString() : 'Dec 2027'}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D2E7C4] text-[#22381E] border border-[#5F8F4D]/40">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDeletePricingRule(rule.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Contract Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRICING RULE MODAL */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">New Customer Contract Price Rule</h3>
              <button 
                onClick={() => setIsPricingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Customer Laboratory</label>
                <select
                  value={newPricingRule.customerId}
                  onChange={(e) => {
                    const labMap: Record<string, string> = {
                      'u-cust-01': 'Apex Clinical & Pathology Laboratories',
                      'u-cust-02': 'Apollo Diagnostic & Research Hub',
                      'u-cust-03': 'Suburban Pathology & Genetics Institute'
                    };
                    setNewPricingRule(prev => ({
                      ...prev,
                      customerId: e.target.value,
                      customerLabName: labMap[e.target.value] || 'Customer Lab'
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="u-cust-02">Apollo Diagnostic & Research Hub (u-cust-02)</option>
                  <option value="u-cust-01">Apex Clinical & Pathology Laboratories (u-cust-01)</option>
                  <option value="u-cust-03">Suburban Pathology & Genetics Institute (u-cust-03)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Manufacturer Brand (Optional)</label>
                <select
                  value={newPricingRule.companyId || ''}
                  onChange={(e) => setNewPricingRule(prev => ({ ...prev, companyId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="">-- Apply to Specific Product Instead --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Product SKU (Optional)</label>
                <select
                  value={newPricingRule.productId || ''}
                  onChange={(e) => setNewPricingRule(prev => ({ ...prev, productId: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="">-- All Products in Selected Brand/Category --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={newPricingRule.discountPercent || ''}
                    onChange={(e) => setNewPricingRule(prev => ({ ...prev, discountPercent: Number(e.target.value), customFixedPrice: undefined }))}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">OR Fixed Price (₹)</label>
                  <input
                    type="number"
                    value={newPricingRule.customFixedPrice || ''}
                    onChange={(e) => setNewPricingRule(prev => ({ ...prev, customFixedPrice: Number(e.target.value), discountPercent: undefined }))}
                    placeholder="e.g. 19500"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPricingRule}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save Contract Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE BANNER MODAL */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Dynamic Promotional Banner</h3>
              <button 
                onClick={() => setIsBannerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Banner Title</label>
                <input
                  type="text"
                  value={editingBanner.title || ''}
                  onChange={(e) => setEditingBanner(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="e.g. Immunoassay Calibration Bonanza"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Subtitle / Deal Summary</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  placeholder="e.g. Flat 20% off all Roche Troponin assays"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingBanner.badgeText || ''}
                    onChange={(e) => setEditingBanner(prev => ({ ...prev, badgeText: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                    placeholder="e.g. HOT DEAL"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Background Color</label>
                  <input
                    type="color"
                    value={editingBanner.backgroundColor || '#1e3a8a'}
                    onChange={(e) => setEditingBanner(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-9 p-1 border border-slate-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Banner Image URL</label>
                <input
                  type="text"
                  value={editingBanner.imageUrl || ''}
                  onChange={(e) => setEditingBanner(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deep Link Target</label>
                <select
                  value={editingBanner.deepLinkId || ''}
                  onChange={(e) => setEditingBanner(prev => ({ ...prev, deepLinkId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="cat-chem-01">Category: Clinical Chemistry Reagents</option>
                  <option value="prod-002">Product: Sysmex XN-330 Hematology</option>
                  <option value="comp-roche">Company: Roche Diagnostics</option>
                  <option value="comp-bd">Company: Becton Dickinson (BD)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D2E7C4]">
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBannerModal}
                className="px-4 py-2 bg-[#22381E] hover:bg-[#2E4B29] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save & Deploy Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
