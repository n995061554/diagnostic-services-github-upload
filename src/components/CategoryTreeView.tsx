import React, { useState, useEffect, useCallback } from 'react';
import { Category, CategoryTreeNode, UserRoleType } from '../types';
import { 
  Layers, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Search, 
  GitFork,
  AlertTriangle,
  X,
  CornerDownRight,
  Package
} from 'lucide-react';

interface CategoryTreeViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
}

export function CategoryTreeView({ accessToken, currentRole }: CategoryTreeViewProps) {
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cat-biochem': true,
    'cat-biochem-reagents': true,
    'cat-hematology': true,
    'cat-rapid': true
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentForNewSubcat, setParentForNewSubcat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form data
  const [formData, setFormData] = useState({
    parentId: '',
    name: '',
    code: '',
    slug: '',
    description: '',
    iconUrl: 'Icons.biotech',
    sortOrder: 0,
    isActive: true
  });

  const canManage = currentRole === UserRoleType.SUPER_ADMIN || currentRole === UserRoleType.OFFICE_ADMIN;

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        fetch('/api/v1/categories?tree=true'),
        fetch('/api/v1/categories')
      ]);

      if (treeRes.ok && flatRes.ok) {
        const treeData = await treeRes.json();
        const flatData = await flatRes.json();
        setCategoryTree(treeData.data || []);
        setFlatCategories(flatData.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleExpand = (catId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    flatCategories.forEach(c => {
      all[c.id] = true;
    });
    setExpandedNodes(all);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  const handleOpenAddRoot = () => {
    setParentForNewSubcat(null);
    setEditingCategory(null);
    setFormData({
      parentId: '',
      name: '',
      code: '',
      slug: '',
      description: '',
      iconUrl: 'Icons.biotech',
      sortOrder: flatCategories.filter(c => !c.parentId).length + 1,
      isActive: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenAddSubcategory = (parent: Category) => {
    setParentForNewSubcat(parent);
    setEditingCategory(null);
    setFormData({
      parentId: parent.id,
      name: '',
      code: `${parent.code}_SUB`,
      slug: '',
      description: '',
      iconUrl: 'Icons.science',
      sortOrder: 1,
      isActive: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setParentForNewSubcat(null);
    setFormData({
      parentId: cat.parentId || '',
      name: cat.name,
      code: cat.code,
      slug: cat.slug,
      description: cat.description || '',
      iconUrl: cat.iconUrl || 'Icons.biotech',
      sortOrder: cat.sortOrder || 0,
      isActive: cat.isActive
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (cat: Category) => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/v1/categories/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || ''}`
        },
        body: JSON.stringify({ isActive: !cat.isActive })
      });
      if (res.ok) fetchCategories();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!formData.name.trim() || (!editingCategory && !formData.code.trim())) {
      setFormError('Category Code and Name are required');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editingCategory ? `/api/v1/categories/${editingCategory.id}` : '/api/v1/categories';
      const method = editingCategory ? 'PUT' : 'POST';

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
        setIsModalOpen(false);
        fetchCategories();
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
      const res = await fetch(`/api/v1/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken || ''}`
        }
      });
      const json = await res.json();
      if (res.ok) {
        setDeleteTarget(null);
        fetchCategories();
      } else {
        alert(json.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  // Render tree node recursively
  const renderTreeNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isMatch = searchQuery ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) || node.code.toLowerCase().includes(searchQuery.toLowerCase()) : true;

    return (
      <div key={node.id} className="relative group">
        {/* Node Bar */}
        <div 
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all my-1 ${
            isMatch ? 'bg-white' : 'opacity-40 bg-slate-50'
          } ${
            node.isActive ? 'border-slate-200 hover:border-[#D2E7C4] shadow-2xs' : 'border-slate-200 bg-slate-50/70'
          }`}
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Expand / Collapse Icon */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(node.id)}
                className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center text-slate-300">
                <CornerDownRight className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Folder / Icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              node.level === 0 ? 'bg-[#D2E7C4] text-[#1E331B]' : node.level === 1 ? 'bg-[#E4F1DC] text-[#22381E]' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {hasChildren ? (
                isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
            </div>

            {/* Node Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-xs truncate">
                  {node.name}
                </span>
                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded border border-slate-200">
                  {node.code}
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  Level {node.level} • {node.path}
                </span>
              </div>
              {node.description && (
                <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                  {node.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Products Badge */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              <Package className="w-3 h-3 text-[#22381E]" />
              <span>{node.productsCount || 0}</span>
            </div>

            {/* Status Pill */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              node.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {node.isActive ? 'Active' : 'Inactive'}
            </span>

            {canManage && (
              <div className="flex items-center gap-1">
                {/* Add Subcategory under this node */}
                <button
                  onClick={() => handleOpenAddSubcategory(node)}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-[#E4F1DC] text-[#1E331B] hover:text-[#22381E] rounded flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  title="Add Subcategory under this node"
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden md:inline">Add Child</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(node)}
                  className="p-1.5 text-slate-500 hover:text-[#1E331B] hover:bg-[#E4F1DC] rounded-md transition-colors cursor-pointer"
                  title="Edit Category"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(node)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Render Children if expanded */}
        {hasChildren && isExpanded && (
          <div className="relative pl-2 border-l border-slate-200/80 ml-4">
            {node.children!.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#22381E] uppercase tracking-wider mb-1">
            <GitFork className="w-4 h-4" />
            <span>Enterprise Unlimited Hierarchy</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Diagnostic Category Tree & Subcategories
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Infinite self-referencing category hierarchy using materialized path indexing. Supports recursive subtree filtering for Clinical Chemistry, Hematology, Immunology, Rapid POC Kits, and Consumables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {canManage && (
            <button
              onClick={handleOpenAddRoot}
              className="px-4 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Root Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories across all levels (e.g. Clinical Chemistry, LFT, 5-Part)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-[#F9FAF6] border border-[#D2E7C4] rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-[#22381E] focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Collapse All
          </button>
          <span className="text-xs text-slate-500 ml-2 font-medium">
            Total: {flatCategories.length} nodes
          </span>
        </div>
      </div>

      {/* Interactive Category Tree Display */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        {categoryTree.length > 0 ? (
          <div className="space-y-1">
            {categoryTree.map(rootNode => renderTreeNode(rootNode))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Categories Found</h4>
            <p className="text-xs text-slate-500 mt-1">Create your first root category to start organizing catalog items.</p>
          </div>
        )}
      </div>

      {/* ADD / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : parentForNewSubcat ? `Add Subcategory under ${parentForNewSubcat.name}` : 'Add Root Diagnostic Category'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Hierarchy Node
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs bg-[#F9FAF6] focus:bg-white focus:ring-2 focus:ring-[#22381E]"
                >
                  <option value="">(Root Level Category - No Parent)</option>
                  {flatCategories
                    .filter(c => editingCategory ? c.id !== editingCategory.id : true)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {'- '.repeat(c.level)} {c.name} ({c.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCategory}
                    placeholder="e.g. BIOCHEM_LFT"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs font-mono uppercase bg-[#F9FAF6] focus:bg-white focus:ring-2 focus:ring-[#22381E] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liver Function Tests (LFT)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug (Auto-generated if empty)
                </label>
                <input
                  type="text"
                  placeholder="e.g. liver-function-tests"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Clinical Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. SGOT, SGPT, Total/Direct Bilirubin, Alkaline Phosphatase enzymatic kits."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flutter Icon Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Icons.biotech"
                    value={formData.iconUrl}
                    onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-[#D2E7C4] rounded-lg text-xs focus:ring-2 focus:ring-[#22381E]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#22381E] rounded"
                />
                <label htmlFor="catIsActive" className="text-xs font-medium text-slate-700">
                  Category is Active & Visible in Product Filter
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Delete Category {deleteTarget.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{deleteTarget.name}</strong>? Any child categories or products directly assigned to this node must be reassigned first.
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
