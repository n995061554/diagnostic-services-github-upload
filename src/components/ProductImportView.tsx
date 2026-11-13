import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  UserRoleType,
  ProductImportMode,
  ProductImportBatch,
  ValidatedProductRow,
  RowValidationIssue,
  ImportConfigSettings,
} from '../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileCheck,
  Boxes,
  HelpCircle,
  Tag,
  ArrowRight,
  Info,
  ThermometerSnowflake,
  Image as ImageIcon,
  ShieldAlert,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface ProductImportViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
  onImportComplete?: () => void;
  onNavigateToCatalog?: () => void;
}

export function ProductImportView({
  accessToken,
  currentRole,
  onImportComplete,
  onNavigateToCatalog,
}: ProductImportViewProps) {
  // Navigation & Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'history' | 'governance'>('import');

  // Wizard Step (1: Upload & Configure, 2: Server Validation & Issue Report, 3: Preview & Confirm, 4: Results)
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Upload & File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeBytes: number; rowCount: number } | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [rawParsedRows, setRawParsedRows] = useState<any[]>([]);
  const [imageFilesMap, setImageFilesMap] = useState<Record<string, string>>({}); // filename -> base64 data url

  // Import Options
  const [importMode, setImportMode] = useState<ProductImportMode>(ProductImportMode.CREATE_ONLY);
  const [submissionNotes, setSubmissionNotes] = useState<string>('');

  // Server Validation Response State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentBatchNumber, setCurrentBatchNumber] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<{
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    newProductsCount: number;
    updatedProductsCount: number;
    skippedRowsCount: number;
    requiresApproval: boolean;
  } | null>(null);
  const [validationIssues, setValidationIssues] = useState<RowValidationIssue[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedProductRow[]>([]);
  const [issueFilter, setIssueFilter] = useState<'ALL' | 'ERRORS' | 'WARNINGS'>('ALL');
  const [selectedRowDetail, setSelectedRowDetail] = useState<ValidatedProductRow | null>(null);

  // Execution & Submission State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    createdCount?: number;
    updatedCount?: number;
    requiresApproval?: boolean;
    status?: string;
  } | null>(null);

  // History & Batches State
  const [batchesList, setBatchesList] = useState<ProductImportBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [inspectingBatch, setInspectingBatch] = useState<ProductImportBatch | null>(null);

  // Governance Settings
  const [governanceConfig, setGovernanceConfig] = useState<ImportConfigSettings>({
    requireApprovalForProductImport: false,
    maxBatchSize: 1000,
    allowAutoCreateMissingCategories: false,
    enforceColdChainStorageRule: true,
  });
  const [isUpdatingConfig, setIsUpdatingConfig] = useState<boolean>(false);

  // Reference Data for Autocomplete / Information
  const [referenceData, setReferenceData] = useState<{
    companies: any[];
    categories: any[];
    productTypes: string[];
    standardGstRates: number[];
    storageConditions: string[];
    sampleProducts: any[];
  } | null>(null);

  const isSuperAdminOrOfficeAdmin =
    currentRole === UserRoleType.SUPER_ADMIN || currentRole === UserRoleType.OFFICE_ADMIN;

  // 1. Fetch Reference Data & Governance Config
  const loadInitialData = useCallback(async () => {
    try {
      const [refRes, cfgRes] = await Promise.all([
        fetch('/api/v1/products/import/reference-data'),
        fetch('/api/v1/products/import/config', {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }),
      ]);

      if (refRes.ok) {
        const refJson = await refRes.json();
        setReferenceData(refJson.data);
      }
      if (cfgRes.ok) {
        const cfgJson = await cfgRes.json();
        setGovernanceConfig(cfgJson.data);
      }
    } catch (err) {
      console.error('Failed to load import reference data', err);
    }
  }, [accessToken]);

  // 2. Fetch Import Batches History
  const fetchBatches = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingBatches(true);
    try {
      const res = await fetch('/api/v1/products/import/batches', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBatchesList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setIsLoadingBatches(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (activeSubTab === 'history') {
      fetchBatches();
    }
  }, [activeSubTab, fetchBatches]);

  // 3. Download Excel Template
  const handleDownloadTemplate = (format: 'xlsx' | 'csv' = 'xlsx') => {
    window.location.href = `/api/v1/products/import/template?format=${format}`;
  };

  // 4. Load Sample Dataset for 1-Click Verification
  const handleLoadDemoDataset = () => {
    if (!referenceData?.sampleProducts) return;
    setRawParsedRows(referenceData.sampleProducts);
    setFileDetails({
      name: 'Diagnostic_Master_Demo_Dataset.xlsx',
      sizeBytes: 42500,
      rowCount: referenceData.sampleProducts.length,
    });
    setSelectedFile(null);
    setWizardStep(2);
    // Auto trigger validation
    runServerValidation(referenceData.sampleProducts, importMode, imageFilesMap, 'Diagnostic_Master_Demo_Dataset.xlsx', 42500);
  };

  // 5. Handle File Upload & Client Excel Parsing
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsingFile(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      // Pick first sheet (or sheet named Product_Master_Import)
      const sheetName = workbook.SheetNames.includes('Product_Master_Import')
        ? 'Product_Master_Import'
        : workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];
      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonRows.length === 0) {
        alert('Uploaded file contains no rows in the primary sheet.');
        setIsParsingFile(false);
        return;
      }

      setRawParsedRows(jsonRows);
      setFileDetails({
        name: file.name,
        sizeBytes: file.size,
        rowCount: jsonRows.length,
      });

      // Advance to validation step & auto-validate
      setWizardStep(2);
      runServerValidation(jsonRows, importMode, imageFilesMap, file.name, file.size);
    } catch (err: any) {
      console.error('Error parsing Excel file', err);
      alert(`Failed to parse Excel file: ${err.message}`);
    } finally {
      setIsParsingFile(false);
    }
  };

  // 6. Handle Bulk Image Files Upload (Multi-Select)
  const handleImageFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMap: Record<string, string> = { ...imageFilesMap };
    Array.from(files).forEach((f: File) => {
      const reader = new FileReader();
      reader.onload = (readEvent) => {
        const result = readEvent.target?.result as string;
        if (result) {
          newMap[f.name] = result;
          newMap[f.name.toLowerCase()] = result;
          setImageFilesMap({ ...newMap });
        }
      };
      reader.readAsDataURL(f);
    });
  };

  // 7. Run Server-Side Validation
  const runServerValidation = async (
    rows: any[],
    mode: ProductImportMode,
    images: Record<string, string>,
    fileName?: string,
    fileSizeBytes?: number
  ) => {
    if (!accessToken) return;
    setIsValidating(true);
    setValidationIssues([]);
    try {
      const res = await fetch('/api/v1/products/import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          rows,
          mode,
          imageMap: images,
          fileName: fileName || fileDetails?.name || 'Uploaded_Products.xlsx',
          fileSizeBytes: fileSizeBytes || fileDetails?.sizeBytes || 0,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setValidationSummary(json.data.summary);
        setValidationIssues(json.data.issues || []);
        setValidatedRows(json.data.parsedRows || []);
        setCurrentBatchId(json.data.batchId);
        setCurrentBatchNumber(json.data.batchNumber);
      } else {
        alert(`Validation failed: ${json.message}`);
      }
    } catch (err: any) {
      console.error('Server validation error', err);
      alert(`Server validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  // 8. Re-validate when Mode changes
  const handleModeChange = (newMode: ProductImportMode) => {
    setImportMode(newMode);
    if (rawParsedRows.length > 0) {
      runServerValidation(rawParsedRows, newMode, imageFilesMap);
    }
  };

  // 9. Execute Import Transaction / Submit for Approval
  const handleExecuteImport = async () => {
    if (!accessToken) return;
    setIsExecuting(true);
    try {
      const res = await fetch('/api/v1/products/import/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          batchId: currentBatchId,
          rows: rawParsedRows,
          mode: importMode,
          notes: submissionNotes,
          imageMap: imageFilesMap,
        }),
      });

      const json = await res.json();
      if (res.ok || res.status === 202) {
        setExecutionResult({
          success: true,
          message: json.message,
          createdCount: json.data?.createdCount,
          updatedCount: json.data?.updatedCount,
          requiresApproval: json.requiresApproval,
          status: json.data?.status,
        });
        setWizardStep(4);
        if (onImportComplete) onImportComplete();
      } else {
        setExecutionResult({
          success: false,
          message: json.message || 'Execution failed.',
        });
      }
    } catch (err: any) {
      console.error('Import execution error', err);
      setExecutionResult({
        success: false,
        message: `System transaction error: ${err.message}`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // 10. Super Admin Approve Batch
  const handleApproveBatch = async (batchId: string) => {
    if (!accessToken) return;
    const notes = prompt('Enter optional approval verification notes:');
    try {
      const res = await fetch('/api/v1/products/import/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ batchId, notes }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        fetchBatches();
        if (onImportComplete) onImportComplete();
      } else {
        alert(`Approval error: ${json.message}`);
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    }
  };

  // 11. Super Admin Reject Batch
  const handleRejectBatch = async (batchId: string) => {
    if (!accessToken) return;
    const reason = prompt('Enter reason for batch rejection:');
    if (!reason) return;
    try {
      const res = await fetch('/api/v1/products/import/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ batchId, reason }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        fetchBatches();
      } else {
        alert(`Rejection error: ${json.message}`);
      }
    } catch (err: any) {
      alert(`Rejection error: ${err.message}`);
    }
  };

  // 12. Update Governance Config
  const handleSaveGovernanceConfig = async () => {
    if (!accessToken) return;
    setIsUpdatingConfig(true);
    try {
      const res = await fetch('/api/v1/products/import/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(governanceConfig),
      });
      const json = await res.json();
      if (res.ok) {
        alert('Product Import Governance settings updated successfully.');
      } else {
        alert(`Update failed: ${json.message}`);
      }
    } catch (err: any) {
      alert(`Error updating settings: ${err.message}`);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Filtered Issues for Step 2
  const filteredIssues = useMemo(() => {
    if (issueFilter === 'ERRORS') return validationIssues.filter((i) => i.severity === 'ERROR');
    if (issueFilter === 'WARNINGS') return validationIssues.filter((i) => i.severity === 'WARNING');
    return validationIssues;
  }, [validationIssues, issueFilter]);

  // Filtered Batches for History Sub-Tab
  const filteredBatches = useMemo(() => {
    return batchesList.filter((b) => {
      const matchesSearch =
        b.batchNumber.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        b.fileName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        b.uploadedByUserName.toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchesStatus = historyStatusFilter === 'ALL' || b.status === historyStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [batchesList, historySearchQuery, historyStatusFilter]);

  return (
    <div id="product-import-module" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#F5F6F0] rounded-xl border border-[#D2E7C4] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#22381E] border border-[#1E331B] flex items-center justify-center text-[#D2E7C4] shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1E331B] tracking-tight">
                  Product Master Excel Import
                </h1>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">
                  MASTER CATALOG
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5F8F4D]" /> Server-Authoritative
                </span>
              </div>
              <p className="text-sm text-[#415439] mt-0.5">
                Bulk upload, server-side row validation, diagnostic specs verification, and audit-logged batch execution.
              </p>
            </div>
          </div>

          {/* Action Tabs & Switchers */}
          <div className="flex items-center gap-2">
            <button
              id="subtab-import-btn"
              onClick={() => setActiveSubTab('import')}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'import'
                  ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs'
                  : 'bg-[#E4E8DF] text-[#1E331B] hover:bg-[#D2E7C4]'
              }`}
            >
              <Upload className="w-4 h-4" />
              Import Wizard
            </button>
            <button
              id="subtab-history-btn"
              onClick={() => setActiveSubTab('history')}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs'
                  : 'bg-[#E4E8DF] text-[#1E331B] hover:bg-[#D2E7C4]'
              }`}
            >
              <Clock className="w-4 h-4" />
              Batch History ({batchesList.length})
            </button>
            {isSuperAdminOrOfficeAdmin && (
              <button
                id="subtab-governance-btn"
                onClick={() => setActiveSubTab('governance')}
                className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === 'governance'
                    ? 'bg-[#22381E] text-[#F9FAF6] shadow-xs'
                    : 'bg-[#E4E8DF] text-[#1E331B] hover:bg-[#D2E7C4]'
                }`}
              >
                <Settings className="w-4 h-4" />
                Approval Rules
              </button>
            )}
          </div>
        </div>

        {/* Wizard Step Progression Bar (Visible in Import Tab) */}
        {activeSubTab === 'import' && (
          <div className="mt-6 pt-5 border-t border-[#D2E7C4]">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: '1. Template & File', desc: 'Download / Upload XLSX' },
                { step: 2, label: '2. Server Validation', desc: 'Row-by-Row Checks' },
                { step: 3, label: '3. Data Preview & Mode', desc: 'Create / Update / Upsert' },
                { step: 4, label: '4. Batch Execution', desc: 'Database Transaction' },
              ].map((s) => {
                const isActive = wizardStep === s.step;
                const isPassed = wizardStep > s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => {
                      if (rawParsedRows.length > 0 && s.step <= 3) setWizardStep(s.step);
                    }}
                    className={`cursor-pointer rounded-lg p-2.5 transition-all border ${
                      isActive
                        ? 'bg-[#E4F1DC] border-[#22381E] ring-2 ring-[#D2E7C4]'
                        : isPassed
                        ? 'bg-[#D2E7C4]/40 border-[#5F8F4D]/40'
                        : 'bg-[#F9FAF6] border-[#D2E7C4] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-[#22381E] text-[#F9FAF6]'
                            : isPassed
                            ? 'bg-[#5F8F4D] text-[#F9FAF6]'
                            : 'bg-[#E4E8DF] text-[#4B5A48]'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.step}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1E331B]">{s.label}</div>
                        <div className="text-[11px] text-[#415439]">{s.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: IMPORT WIZARD */}
      {/* ========================================================================= */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* STEP 1: DOWNLOAD TEMPLATE & UPLOAD FILE */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: File Upload & Drag & Drop */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upload Card */}
                <div className="bg-white rounded-xl border border-[#D2E7C4] p-6 shadow-xs">
                  <h2 className="text-base font-bold text-[#1E331B] mb-1">
                    Upload Product Master Excel (.xlsx / .csv)
                  </h2>
                  <p className="text-xs text-[#415439] mb-5">
                    Select or drag-and-drop your completed Excel workbook. Server will validate columns, OEM codes, and categories automatically.
                  </p>

                  <div className="border-2 border-dashed border-[#D2E7C4] hover:border-[#22381E] rounded-xl p-8 text-center transition-colors bg-[#F9FAF6]">
                    <input
                      id="excel-file-input"
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="excel-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#D2E7C4] text-[#1E331B] flex items-center justify-center">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div className="text-sm font-bold text-[#1E331B]">
                        Click to browse or drag & drop Excel workbook here
                      </div>
                      <div className="text-xs text-[#6B7F6A]">
                        Supports .xlsx, .xls, .csv (Max 1,000 products per batch)
                      </div>
                    </label>
                  </div>

                  {isParsingFile && (
                    <div className="mt-4 p-3 bg-[#E4F1DC] border border-[#D2E7C4] rounded-lg flex items-center gap-3 text-[#1E331B] text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#5F8F4D]" />
                      Parsing Excel workbook structure and extracting product sheets...
                    </div>
                  )}

                  {/* Fast Action Demo Load */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Need a sample file to test immediately?
                    </span>
                    <button
                      id="load-demo-data-btn"
                      onClick={handleLoadDemoDataset}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Load Diagnostic Test Dataset (5 Real OEM Products)
                    </button>
                  </div>
                </div>

                {/* Optional Image Upload Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#22381E]" />
                        Attach Product Images (Optional)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Attach local JPG/PNG photos matching the <code className="bg-slate-100 px-1 py-0.5 rounded text-[#22381E]">Image File Name</code> column in your Excel.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#D2E7C4] text-[#1E331B] border border-[#5F8F4D]/40">
                      {Object.keys(imageFilesMap).length / 2 || 0} Images Staged
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <input
                      id="image-bulk-input"
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageFilesUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-bulk-input"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Select Local Image Files
                    </label>
                    <span className="text-xs text-slate-400">
                      Or specify web URLs directly in the <code className="bg-slate-100 px-1 rounded">Image URL</code> column.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Col: Download Official Templates & Guidelines */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Download Official Excel Templates
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    The official template includes embedded reference sheets for OEM brands, category codes, product types, and storage guidelines.
                  </p>

                  <div className="space-y-2.5">
                    <button
                      id="download-template-xlsx-btn"
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="w-full py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel Template (.xlsx with Reference Sheets)
                      </span>
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id="download-template-csv-btn"
                      onClick={() => handleDownloadTemplate('csv')}
                      className="w-full py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        Plain CSV Format (.csv)
                      </span>
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rules & Validation Checklist Card */}
                <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Server Validation Guardrails
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22381E] mt-1.5 shrink-0" />
                      <span><strong>Product Code / SKU:</strong> Required and unique in CREATE mode.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22381E] mt-1.5 shrink-0" />
                      <span><strong>Company / OEM:</strong> Must match registered brands (Agappe, Sysmex, Erba, Roche, etc.).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22381E] mt-1.5 shrink-0" />
                      <span><strong>Category Hierarchy:</strong> Verified against Category Master tree.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22381E] mt-1.5 shrink-0" />
                      <span><strong>Pricing & MRP:</strong> Numeric values ≥ 0; MRP must exceed List Price.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22381E] mt-1.5 shrink-0" />
                      <span><strong>Contract Pricing:</strong> Hospital-specific contract rates stay in the dedicated Contract Pricing engine.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SERVER-SIDE VALIDATION & ROW-BY-ROW ERROR/WARNING REPORT */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">Total Rows</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {validationSummary?.totalRows || 0}
                  </div>
                  <div className="text-[11px] text-slate-400">Read from Excel</div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
                  <div className="text-xs font-semibold text-emerald-700">Valid Rows</div>
                  <div className="text-xl font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    {validationSummary?.validRows || 0}
                  </div>
                  <div className="text-[11px] text-emerald-600">Passed all checks</div>
                </div>

                <div className={`p-4 rounded-xl border shadow-xs ${
                  (validationSummary?.errorRows || 0) > 0
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-xs font-semibold ${
                    (validationSummary?.errorRows || 0) > 0 ? 'text-rose-700' : 'text-slate-500'
                  }`}>
                    Error Rows
                  </div>
                  <div className={`text-xl font-bold mt-1 flex items-center gap-1.5 ${
                    (validationSummary?.errorRows || 0) > 0 ? 'text-rose-800' : 'text-slate-900'
                  }`}>
                    {(validationSummary?.errorRows || 0) > 0 && <XCircle className="w-5 h-5 text-rose-600" />}
                    {validationSummary?.errorRows || 0}
                  </div>
                  <div className={`text-[11px] ${
                    (validationSummary?.errorRows || 0) > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    {(validationSummary?.errorRows || 0) > 0 ? 'Blocks batch import' : 'No blocking errors'}
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs">
                  <div className="text-xs font-semibold text-amber-700">Warnings</div>
                  <div className="text-xl font-bold text-amber-800 mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    {validationSummary?.warningRows || 0}
                  </div>
                  <div className="text-[11px] text-amber-600">Non-fatal notices</div>
                </div>

                <div className="bg-[#E4F1DC] p-4 rounded-xl border border-[#D2E7C4] shadow-xs">
                  <div className="text-xs font-semibold text-[#1E331B]">New Products</div>
                  <div className="text-xl font-bold text-[#1E331B] mt-1">
                    {validationSummary?.newProductsCount || 0}
                  </div>
                  <div className="text-[11px] text-[#22381E]">To be inserted</div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-xs">
                  <div className="text-xs font-semibold text-purple-700">Updates</div>
                  <div className="text-xl font-bold text-purple-800 mt-1">
                    {validationSummary?.updatedProductsCount || 0}
                  </div>
                  <div className="text-[11px] text-purple-600">Existing SKUs</div>
                </div>
              </div>

              {/* Import Mode Selector Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Select Product Import Mode
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">
                    How should the server handle existing vs new product SKUs?
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="mode-create-only-btn"
                    onClick={() => handleModeChange(ProductImportMode.CREATE_ONLY)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      importMode === ProductImportMode.CREATE_ONLY
                        ? 'bg-[#22381E] text-[#D2E7C4] border-[#22381E] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    1. Create Only (Reject existing)
                  </button>
                  <button
                    id="mode-update-only-btn"
                    onClick={() => handleModeChange(ProductImportMode.UPDATE_ONLY)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      importMode === ProductImportMode.UPDATE_ONLY
                        ? 'bg-[#22381E] text-[#D2E7C4] border-[#22381E] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    2. Update Only (Modify existing)
                  </button>
                  <button
                    id="mode-upsert-btn"
                    onClick={() => handleModeChange(ProductImportMode.CREATE_AND_UPDATE)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      importMode === ProductImportMode.CREATE_AND_UPDATE
                        ? 'bg-[#22381E] text-[#D2E7C4] border-[#22381E] shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    3. Create & Update (Upsert All)
                  </button>
                </div>
              </div>

              {/* Row-by-Row Issue Report Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Row-by-Row Validation Report
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detailed diagnostic log of all detected schema, duplicate, and reference issues.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIssueFilter('ALL')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                        issueFilter === 'ALL'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Issues ({validationIssues.length})
                    </button>
                    <button
                      onClick={() => setIssueFilter('ERRORS')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                        issueFilter === 'ERRORS'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      Errors Only ({validationIssues.filter((i) => i.severity === 'ERROR').length})
                    </button>
                    <button
                      onClick={() => setIssueFilter('WARNINGS')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                        issueFilter === 'WARNINGS'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      Warnings Only ({validationIssues.filter((i) => i.severity === 'WARNING').length})
                    </button>
                  </div>
                </div>

                {isValidating ? (
                  <div className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#22381E] mb-2" />
                    <p className="text-sm font-medium">Validating rows on server...</p>
                  </div>
                ) : validationIssues.length === 0 ? (
                  <div className="py-8 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-emerald-900">
                      Perfect Validation Score!
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      All {validationSummary?.validRows || 0} product rows passed schema constraints and reference verification.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200">Row #</th>
                          <th className="p-2.5 border-b border-slate-200">Severity</th>
                          <th className="p-2.5 border-b border-slate-200">Column / Field</th>
                          <th className="p-2.5 border-b border-slate-200">Offending Value</th>
                          <th className="p-2.5 border-b border-slate-200">Diagnostic Message & Correction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredIssues.map((issue, idx) => (
                          <tr
                            key={idx}
                            className={issue.severity === 'ERROR' ? 'bg-rose-50/40 hover:bg-rose-50' : 'bg-amber-50/30 hover:bg-amber-50'}
                          >
                            <td className="p-2.5 font-bold text-slate-800">
                              Row {issue.rowNumber}
                            </td>
                            <td className="p-2.5">
                              {issue.severity === 'ERROR' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3" /> ERROR
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3" /> WARNING
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-700">
                              {issue.column}
                            </td>
                            <td className="p-2.5 font-mono text-slate-600 max-w-[150px] truncate">
                              {issue.value !== undefined ? String(issue.value) : '—'}
                            </td>
                            <td className="p-2.5 text-slate-700">
                              {issue.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    ← Back to File Upload
                  </button>

                  <button
                    id="proceed-to-preview-btn"
                    onClick={() => setWizardStep(3)}
                    disabled={(validationSummary?.validRows || 0) === 0}
                    className="px-5 py-2.5 bg-[#22381E] hover:bg-[#1E331B] disabled:opacity-50 text-[#D2E7C4] text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
                  >
                    Proceed to Data Preview & Confirm ({validationSummary?.validRows || 0} Valid Rows) →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW VALID DATA & CONFIRM IMPORT */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              {/* Top Banner with Confirmation Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[#22381E]" />
                      Preview Validated Products ({validatedRows.filter((r) => r.isValid).length} ready for commit)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Batch: <span className="font-mono font-semibold text-slate-700">{currentBatchNumber}</span> • Mode: <span className="font-semibold text-[#22381E]">{importMode}</span>
                    </p>
                  </div>

                  {governanceConfig.requireApprovalForProductImport && !isSuperAdminOrOfficeAdmin && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Governance rule active: Import will be staged for Super Admin sign-off.</span>
                    </div>
                  )}
                </div>

                {/* Staging Notes Input */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Audit Verification Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="e.g. Verified with Agappe official Q3 price list v2.4"
                    className="w-full px-3 py-2 text-xs border border-[#D2E7C4] rounded-lg bg-white focus:bg-white focus:ring-1 focus:ring-[#22381E]"
                  />
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Product Master Staging Grid
                  </span>
                  <span className="text-xs text-slate-500">
                    Showing {validatedRows.length} parsed rows
                  </span>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5 border-b border-slate-200">Action</th>
                        <th className="p-2.5 border-b border-slate-200">SKU / Code</th>
                        <th className="p-2.5 border-b border-slate-200">Product Name</th>
                        <th className="p-2.5 border-b border-slate-200">Brand / OEM</th>
                        <th className="p-2.5 border-b border-slate-200">Category</th>
                        <th className="p-2.5 border-b border-slate-200">Type</th>
                        <th className="p-2.5 border-b border-slate-200 text-right">List Price</th>
                        <th className="p-2.5 border-b border-slate-200 text-right">MRP</th>
                        <th className="p-2.5 border-b border-slate-200">Tax/GST</th>
                        <th className="p-2.5 border-b border-slate-200">Cold Chain</th>
                        <th className="p-2.5 border-b border-slate-200">Stock</th>
                        <th className="p-2.5 border-b border-slate-200 text-center">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validatedRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={!row.isValid ? 'bg-rose-50/30' : 'hover:bg-slate-50'}
                        >
                          <td className="p-2.5">
                            {row.action === 'CREATE' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D2E7C4] text-[#1E331B] border border-[#D2E7C4]">
                                CREATE
                              </span>
                            ) : row.action === 'UPDATE' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                UPDATE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                ERROR
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">
                            {row.sku}
                          </td>
                          <td className="p-2.5 font-medium text-slate-800 max-w-[220px] truncate">
                            {row.name}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {row.companyNameOrCode}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {row.categoryNameOrCode}
                          </td>
                          <td className="p-2.5 text-slate-600">
                            {row.productType}
                          </td>
                          <td className="p-2.5 text-right font-semibold text-slate-900">
                            ₹{row.basePrice.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">
                            ₹{row.mrp.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-slate-600 font-mono">
                            {row.gstRate}%
                          </td>
                          <td className="p-2.5">
                            {row.isColdChain ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#22381E] font-semibold">
                                <ThermometerSnowflake className="w-3.5 h-3.5" /> Cold
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Ambient</span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {row.stockQuantity} {row.unit}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setSelectedRowDetail(row)}
                              className="p-1 text-slate-500 hover:text-[#22381E] rounded hover:bg-slate-100"
                              title="Inspect full row specifications"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    ← Back to Validation Report
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      id="execute-import-btn"
                      onClick={handleExecuteImport}
                      disabled={isExecuting || (validationSummary?.validRows || 0) === 0}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Executing Atomic Batch Transaction...
                        </>
                      ) : governanceConfig.requireApprovalForProductImport && !isSuperAdminOrOfficeAdmin ? (
                        <>
                          <ShieldAlert className="w-4 h-4" />
                          Submit Staged Batch for Super Admin Approval
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm & Commit Import to Product Master
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: EXECUTION CONFIRMATION & AUDIT LOG */}
          {wizardStep === 4 && executionResult && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center max-w-2xl mx-auto space-y-6">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  executionResult.success
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {executionResult.success ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {executionResult.success
                    ? executionResult.requiresApproval
                      ? 'Batch Staged for Super Admin Approval'
                      : 'Product Import Executed Successfully!'
                    : 'Import Transaction Failed'}
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  {executionResult.message}
                </p>
              </div>

              {executionResult.success && !executionResult.requiresApproval && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">New Products Created</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">
                      {executionResult.createdCount || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500">Products Updated</div>
                    <div className="text-2xl font-bold text-purple-600 mt-1">
                      {executionResult.updatedCount || 0}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                {onNavigateToCatalog && (
                  <button
                    onClick={onNavigateToCatalog}
                    className="px-5 py-2.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    View in Product Master Catalog →
                  </button>
                )}
                <button
                  onClick={() => {
                    setWizardStep(1);
                    setRawParsedRows([]);
                    setValidatedRows([]);
                    setValidationIssues([]);
                    setSelectedFile(null);
                    setExecutionResult(null);
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Import Another Batch
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: BATCH HISTORY & AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search by batch # or file name..."
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-64 bg-slate-50 focus:bg-white"
                  />
                </div>

                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="READY_FOR_REVIEW">Ready for Review</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="VALIDATION_FAILED">Validation Failed</option>
                </select>
              </div>

              <button
                onClick={fetchBatches}
                disabled={isLoadingBatches}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatches ? 'animate-spin' : ''}`} />
                Refresh Batches
              </button>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Uploaded File</th>
                    <th className="p-3">Uploaded By</th>
                    <th className="p-3">Import Mode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Total Rows</th>
                    <th className="p-3 text-center">New / Updated</th>
                    <th className="p-3">Approver / Notes</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No import batches found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {batch.batchNumber}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#22381E]" />
                            {batch.fileName}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(batch.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">
                            {batch.uploadedByUserName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {batch.uploadedByUserRole}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">
                          {batch.importMode}
                        </td>
                        <td className="p-3">
                          {batch.status === 'COMPLETED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> COMPLETED
                            </span>
                          ) : batch.status === 'PENDING_APPROVAL' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> PENDING APPROVAL
                            </span>
                          ) : batch.status === 'REJECTED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {batch.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          {batch.totalRows}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-emerald-700 font-bold">+{batch.newProductsCount}</span> /{' '}
                          <span className="text-purple-700 font-bold">~{batch.updatedProductsCount}</span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[160px] truncate">
                          {batch.approvedByUserName ? (
                            <div>
                              <span className="font-medium text-slate-800">
                                {batch.approvedByUserName}
                              </span>
                              <div className="text-[10px] text-slate-400 truncate">
                                {batch.approvalNotes || 'Approved'}
                              </div>
                            </div>
                          ) : batch.rejectionNotes ? (
                            <span className="text-rose-600">{batch.rejectionNotes}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isSuperAdminOrOfficeAdmin && batch.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleApproveBatch(batch.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded shadow-xs"
                                  title="Approve batch import"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectBatch(batch.id)}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold rounded"
                                  title="Reject batch"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setInspectingBatch(batch)}
                              className="p-1 text-slate-500 hover:text-[#22381E] rounded hover:bg-slate-100"
                              title="View Batch Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* ========================================================================= */}
      {/* SUB-TAB 3: GOVERNANCE & APPROVAL RULES (SUPER ADMIN) */}
      {/* ========================================================================= */}
      {activeSubTab === 'governance' && isSuperAdminOrOfficeAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E4F1DC] border border-[#D2E7C4] flex items-center justify-center text-[#22381E]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Product Master Import Governance & Approval Policies
              </h3>
              <p className="text-xs text-slate-500">
                Configure whether Office Staff imports require Super Admin verification before catalog injection.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            {/* Rule 1: Mandatory Super Admin Approval */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  Mandatory Super Admin Approval for Product Imports
                </div>
                <div className="text-xs text-slate-500 max-w-lg">
                  When enabled, imports executed by Office Staff will be held in <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">PENDING_APPROVAL</code> status until reviewed and approved by a Super Admin or Office Admin.
                </div>
              </div>
              <input
                id="approval-policy-toggle"
                type="checkbox"
                checked={governanceConfig.requireApprovalForProductImport}
                onChange={(e) =>
                  setGovernanceConfig({
                    ...governanceConfig,
                    requireApprovalForProductImport: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#22381E] rounded border-[#D2E7C4] focus:ring-[#22381E] mt-1 cursor-pointer"
              />
            </div>

            {/* Rule 2: Max Batch Size */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Maximum Products per Batch
                </div>
                <div className="text-xs text-slate-500">
                  Upper ceiling of rows processed in a single synchronous upload batch.
                </div>
              </div>
              <input
                type="number"
                min="50"
                max="5000"
                step="50"
                value={governanceConfig.maxBatchSize}
                onChange={(e) =>
                  setGovernanceConfig({
                    ...governanceConfig,
                    maxBatchSize: Number(e.target.value),
                  })
                }
                className="w-24 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
              />
            </div>

            {/* Rule 3: Enforce Cold Chain Flag Rule */}
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">
                  Automatic Cold Chain Flag Detection
                </div>
                <div className="text-xs text-slate-500 max-w-lg">
                  Automatically set the Cold Chain boolean flag to true whenever storage temperature specifies &quot;2°C to 8°C&quot; or frozen storage.
                </div>
              </div>
              <input
                type="checkbox"
                checked={governanceConfig.enforceColdChainStorageRule}
                onChange={(e) =>
                  setGovernanceConfig({
                    ...governanceConfig,
                    enforceColdChainStorageRule: e.target.checked,
                  })
                }
                className="w-4 h-4 text-[#22381E] rounded border-[#D2E7C4] focus:ring-[#22381E] mt-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              id="save-governance-config-btn"
              onClick={handleSaveGovernanceConfig}
              disabled={isUpdatingConfig}
              className="px-5 py-2.5 bg-[#22381E] hover:bg-[#1E331B] text-[#D2E7C4] text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              {isUpdatingConfig ? 'Saving Settings...' : 'Save Governance Policies'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW DETAIL MODAL (INSPECT ROW SPECS) */}
      {/* ========================================================================= */}
      {selectedRowDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Product Row Inspector (Row #{selectedRowDetail.rowNumber})
                </h3>
                <span className="font-mono text-xs text-[#22381E] font-semibold">
                  SKU: {selectedRowDetail.sku}
                </span>
              </div>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Product Name</span>
                <span className="font-bold text-slate-800">{selectedRowDetail.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Company / Brand</span>
                <span className="font-bold text-slate-800">{selectedRowDetail.companyNameOrCode} ({selectedRowDetail.brand || '—'})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Category</span>
                <span className="font-bold text-slate-800">{selectedRowDetail.categoryNameOrCode}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Product Type</span>
                <span className="font-bold text-slate-800">{selectedRowDetail.productType}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Pricing</span>
                <span className="font-bold text-slate-800">
                  List: ₹{selectedRowDetail.basePrice} • MRP: ₹{selectedRowDetail.mrp} (GST: {selectedRowDetail.gstRate}%)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Storage & Cold Chain</span>
                <span className="font-bold text-slate-800">
                  {selectedRowDetail.storageCondition} {selectedRowDetail.isColdChain && '(Cold Chain Required)'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Pack Size & Units</span>
                <span className="font-bold text-slate-800">{selectedRowDetail.packSize} ({selectedRowDetail.unit})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Compatible Equipment</span>
                <span className="font-bold text-slate-800">{selectedRowDetail.compatibleEquipment || 'Universal / None'}</span>
              </div>
            </div>

            {selectedRowDetail.resolvedImageUrl && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Attached Image</span>
                <img
                  src={selectedRowDetail.resolvedImageUrl}
                  alt={selectedRowDetail.name}
                  className="h-28 object-contain rounded border border-slate-200 bg-white"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH DETAIL MODAL */}
      {/* ========================================================================= */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Import Batch Details: {inspectingBatch.batchNumber}
                </h3>
                <span className="text-xs text-slate-500">
                  File: {inspectingBatch.fileName}
                </span>
              </div>
              <button
                onClick={() => setInspectingBatch(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Uploaded By</span>
                <span className="font-bold text-slate-800">
                  {inspectingBatch.uploadedByUserName} ({inspectingBatch.uploadedByUserRole})
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Status</span>
                <span className="font-bold text-[#22381E]">{inspectingBatch.status}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Metrics</span>
                <span className="font-bold text-slate-800">
                  Total: {inspectingBatch.totalRows} • Valid: {inspectingBatch.validRows} • Errors: {inspectingBatch.errorRows}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Results</span>
                <span className="font-bold text-emerald-700">
                  Created: {inspectingBatch.newProductsCount} • Updated: {inspectingBatch.updatedProductsCount}
                </span>
              </div>
            </div>

            {inspectingBatch.issues && inspectingBatch.issues.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Validation Issues ({inspectingBatch.issues.length})
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {inspectingBatch.issues.map((iss, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-50 text-[11px] text-slate-700 border border-slate-200"
                    >
                      <span className="font-bold">Row {iss.rowNumber} [{iss.column}]:</span> {iss.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingBatch(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
