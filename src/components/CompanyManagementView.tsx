import React, { useState, useEffect, useCallback } from 'react';
import { Company, UserRoleType } from '../types';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Globe, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Package,
  Layers,
  AlertTriangle,
  X
} from 'lucide-react';

interface CompanyManagementViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
}

export function CompanyManagementView({ accessToken, currentRole }: CompanyManagementViewProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    legalName: '',
    logoUrl: '',
    website: '',
    country: 'India',
    description: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
    sortOrder: 0
  });

  const canManage = currentRole === UserRoleType.SUPER_ADMIN || currentRole === UserRoleType.OFFICE_ADMIN;

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/v1/companies?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (statusFilter !== 'ALL') url += `isActive=${statusFilter === 'ACTIVE'}&`;
      if (countryFilter !== 'ALL') url += `country=${encodeURIComponent(countryFilter)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch companies', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, countryFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleOpenAdd = () => {
    setFormData({
      code: '',
      name: '',
      legalName: '',
      logoUrl: '',
      website: '',
      country: 'India',
      description: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
      sortOrder: companies.length + 1
    });
    setFormError(null);
    setEditingCompany(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (comp: Company) => {
    setFormData({
      code: comp.code,
      name: comp.name,
      legalName: comp.legalName || '',
      logoUrl: comp.logoUrl || '',
      website: comp.website || '',
      country: comp.country || 'India',
      description: comp.description || '',
      contactEmail: comp.contactEmail || '',
      contactPhone: comp.contactPhone || '',
      isActive: comp.isActive,
      sortOrder: comp.sortOrder || 0
    });
    setFormError(null);
    setEditingCompany(comp);
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = async (comp: Company) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/v1/companies/${comp.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`
        }
      });
      if (res.ok) {
        fetchCompanies();
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!formData.name.trim() || (!editingCompany && !formData.code.trim())) {
      setFormError('Company Code and Name are mandatory');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editingCompany ? `/api/v1/companies/${editingCompany.id}` : '/api/v1/companies';
      const method = editingCompany ? 'PUT' : 'POST';

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
        setIsAddModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/v1/companies/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken || ''}`
        }
      });
      const json = await res.json();
      if (res.ok) {
        setDeleteTarget(null);
        fetchCompanies();
      } else {
        alert(json.message || 'Failed to delete company');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const countries = Array.from(new Set(companies.map(c => c.country).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22381E] uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Enterprise Master Data</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Diagnostic Equipment & Reagent Companies
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Manage authorized in-vitro diagnostic manufacturers, global reagent suppliers, and instrument OEMs. Control company code prefixes, active distribution contracts, and product catalogs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCompanies}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company by name, code (e.g., ROCHE, SYSMEX, ABBOTT)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#22381E] focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Country:</span>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Countries ({companies.length})</option>
              {countries.map(ct => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies Grid & Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {companies.map((comp) => (
          <div 
            key={comp.id}
            className={`bg-white rounded-xl border transition-all duration-150 p-5 flex flex-col justify-between ${
              comp.isActive ? 'border-slate-200 hover:border-[#D2E7C4] shadow-xs' : 'border-slate-200 bg-slate-50/70 opacity-80'
            }`}
          >
            <div>
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {comp.logoUrl ? (
                      <img 
                        src={comp.logoUrl} 
                        alt={comp.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }} 
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                        {comp.code}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        comp.isActive ? 'bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/30' : 'bg-[#E4E8DF] text-[#4B5A48]'
                      }`}>
                        {comp.isActive ? <CheckCircle className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        {comp.isActive ? 'Active Vendor' : 'Deactivated'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1 line-clamp-1">
                      {comp.name}
                    </h3>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  #{comp.sortOrder}
                </span>
              </div>

              {/* Legal & Country */}
              {comp.legalName && (
                <div className="text-xs text-slate-500 mb-2 font-medium line-clamp-1">
                  {comp.legalName}
                </div>
              )}

              <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                {comp.description || 'Authorized diagnostic supplier and IVD equipment manufacturer.'}
              </p>

              {/* Specs & Contacts */}
              <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Headquarters:</span>
                  <span className="font-medium text-slate-800">{comp.country}</span>
                </div>
                {comp.contactEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Support:</span>
                    <a href={`mailto:${comp.contactEmail}`} className="text-[#22381E] hover:underline truncate max-w-[180px]">
                      {comp.contactEmail}
                    </a>
                  </div>
                )}
                {comp.contactPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-medium text-slate-800">{comp.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Meta & Action Controls */}
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Package className="w-3.5 h-3.5 text-[#22381E]" />
                <span>{comp.productsCount || 0} Products</span>
              </div>

              <div className="flex items-center gap-1">
                {comp.website && (
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Visit Official Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {canManage && (
                  <>
                    <button
                      onClick={() => handleToggleStatus(comp)}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                        comp.isActive 
                          ? 'text-[#6B4B12] hover:bg-[#F4DFA3]/50' 
                          : 'text-[#1E331B] hover:bg-[#D2E7C4]/50'
                      }`}
                    >
                      {comp.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="p-1.5 text-slate-600 hover:text-[#1E331B] hover:bg-[#E4F1DC] rounded-md transition-colors cursor-pointer"
                      title="Edit Company"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(comp)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      title="Delete Company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && !isLoading && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Companies Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a new manufacturer.</p>
        </div>
      )}

      {/* ADD / EDIT COMPANY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCompany ? `Edit Company: ${editingCompany.name}` : 'Add Diagnostic Company'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCompany}
                    placeholder="e.g. ROCHE"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#22381E] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roche Diagnostics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal / Registered Entity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Roche Diagnostics India Pvt Ltd"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Switzerland"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sort Order Index
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="support@company.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91-22-66974900"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  placeholder="https://diagnostics.roche.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer Overview & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of clinical assays, analyzer lines and technical capabilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="compIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#22381E] rounded"
                />
                <label htmlFor="compIsActive" className="text-xs font-medium text-slate-700">
                  Active Distributor Vendor (Available in Mobile Catalog & Ordering)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingCompany ? 'Update Company' : 'Save Company'}
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
              Delete Manufacturer {deleteTarget.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800">{deleteTarget.name} ({deleteTarget.code})</strong>? This operation cannot be undone. Any products linked to this company will prevent deletion.
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
    </div>
  );
}
