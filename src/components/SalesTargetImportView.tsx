import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  UserRoleType,
  SalesTargetImportMode,
  SalesTargetImportBatch,
  ValidatedSalesTargetRow,
  RowValidationIssue
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
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileCheck,
  Target,
  Tag,
  ArrowRight,
  Info,
  Calendar,
  DollarSign,
  TrendingUp,
  Award
} from 'lucide-react';

interface SalesTargetImportViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
  onImportComplete?: () => void;
  onNavigateToTargets?: () => void;
}

export function SalesTargetImportView({
  accessToken,
  currentRole,
  onImportComplete,
  onNavigateToTargets,
}: SalesTargetImportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'history'>('import');
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeBytes: number; rowCount: number } | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [rawParsedRows, setRawParsedRows] = useState<any[]>([]);

  // Mode
  const [importMode, setImportMode] = useState<SalesTargetImportMode>(SalesTargetImportMode.CREATE_AND_UPDATE);
  const [submissionNotes, setSubmissionNotes] = useState<string>('');

  // Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentBatchNumber, setCurrentBatchNumber] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<{
    totalRows: number;
    validRows: number;
    errorRows: number;
    warningRows: number;
    totalTargetRevenue: number;
    totalTargetUnits: number;
    newTargetsCount: number;
    updatedTargetsCount: number;
    skippedRowsCount: number;
  } | null>(null);
  const [validationIssues, setValidationIssues] = useState<RowValidationIssue[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedSalesTargetRow[]>([]);
  const [issueFilter, setIssueFilter] = useState<'ALL' | 'ERRORS' | 'WARNINGS'>('ALL');

  // Execution State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    createdCount?: number;
    updatedCount?: number;
  } | null>(null);

  // History State
  const [batchesList, setBatchesList] = useState<SalesTargetImportBatch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);

  // Load Batch History
  const loadBatchesHistory = useCallback(async () => {
    setIsLoadingBatches(true);
    try {
      const res = await fetch('/api/v1/sales-targets/import/batches', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setBatchesList(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load target import batches', err);
    } finally {
      setIsLoadingBatches(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeSubTab === 'history') {
      loadBatchesHistory();
    }
  }, [activeSubTab, loadBatchesHistory]);

  // Download Template
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/v1/sales-targets/import/template', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.base64Data) {
          const byteCharacters = atob(json.base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = json.fileName || 'Sales_Target_Quota_Import_Template.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          return;
        }
      }
      window.location.href = '/api/v1/sales-targets/import/template';
    } catch (err) {
      console.error('Failed to download template', err);
    }
  };

  // Handle File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setIsParsingFile(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      setRawParsedRows(parsedRows);
      setFileDetails({
        name: file.name,
        sizeBytes: file.size,
        rowCount: parsedRows.length,
      });
    } catch (err: any) {
      console.error('Error parsing sales target Excel', err);
      alert(`Could not parse Excel spreadsheet: ${err.message}`);
    } finally {
      setIsParsingFile(false);
    }
  };

  // Validate on Server
  const handleValidateOnServer = async () => {
    if (rawParsedRows.length === 0) {
      alert('Please select an Excel file with sales target quota rows.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/v1/sales-targets/import/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          rows: rawParsedRows,
          mode: importMode,
          fileName: fileDetails?.name || 'Sales_Targets_Upload.xlsx',
          fileSizeBytes: fileDetails?.sizeBytes || 0,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Sales target validation failed');
      }

      const result = await res.json();
      setCurrentBatchId(result.data.batch.id);
      setCurrentBatchNumber(result.data.batch.batchNumber);
      setValidationSummary(result.data.summary);
      setValidationIssues(result.data.issues || []);
      setValidatedRows(result.data.rows || []);
      setWizardStep(2);
    } catch (err: any) {
      console.error('Sales target validation error:', err);
      alert(`Sales target validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/v1/sales-targets/import/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          batchId: currentBatchId,
          rows: validatedRows,
          mode: importMode,
          notes: submissionNotes,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Sales target import execution failed');
      }

      const result = await res.json();
      setExecutionResult({
        success: true,
        message: result.message,
        createdCount: result.data.createdCount,
        updatedCount: result.data.updatedCount,
      });
      setWizardStep(4);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      console.error('Execution error:', err);
      alert(`Sales target import execution error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setWizardStep(1);
    setSelectedFile(null);
    setFileDetails(null);
    setRawParsedRows([]);
    setValidationSummary(null);
    setValidationIssues([]);
    setValidatedRows([]);
    setCurrentBatchId(null);
    setCurrentBatchNumber(null);
    setExecutionResult(null);
    setSubmissionNotes('');
  };

  const filteredIssues = useMemo(() => {
    if (issueFilter === 'ERRORS') return validationIssues.filter((i) => i.severity === 'ERROR');
    if (issueFilter === 'WARNINGS') return validationIssues.filter((i) => i.severity === 'WARNING');
    return validationIssues;
  }, [validationIssues, issueFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Sales Target & Quota Import Engine
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold uppercase">
                  Sales Quotas
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk assign sales rep quotas, brand focus targets, monthly/quarterly milestones, and incentive thresholds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Download Quota Template
          </button>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setActiveSubTab('import')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeSubTab === 'import' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Import Workspace
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeSubTab === 'history' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Import Batches History
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'import' ? (
        <div className="space-y-6">
          {/* Progress Tracker */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {[
                { num: 1, label: 'Upload & Mode' },
                { num: 2, label: 'Quota Validation' },
                { num: 3, label: 'Targets Preview' },
                { num: 4, label: 'Commit Status' },
              ].map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        wizardStep === step.num
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                          : wizardStep > step.num
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {wizardStep > step.num ? <Check className="w-3.5 h-3.5" /> : step.num}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        wizardStep === step.num ? 'text-rose-600 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 ${
                        wizardStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* STEP 1: UPLOAD & CONFIGURE */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-5">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-rose-600" />
                  1. Select Sales Target Spreadsheet (.xlsx / .csv)
                </h2>

                <label
                  htmlFor="target-excel-upload"
                  className="border-2 border-dashed border-slate-300 hover:border-rose-500 bg-slate-50/60 hover:bg-rose-50/20 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  <FileSpreadsheet className="w-12 h-12 text-rose-500 mb-3" />
                  <span className="text-sm font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to browse or drag & drop sales targets Excel file'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Rep Email/ID, Fiscal Year, Period Type (MONTHLY/QUARTERLY), Target Period, Target Amount, Target Units, OEM Focus
                  </span>
                  <input
                    id="target-excel-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>

                {fileDetails && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{fileDetails.name}</span>
                        <span className="text-[11px] text-slate-500">
                          {(fileDetails.sizeBytes / 1024).toFixed(1)} KB • {fileDetails.rowCount} quota rows detected
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleValidateOnServer}
                      disabled={isValidating || isParsingFile}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Validating Quotas...
                        </>
                      ) : (
                        <>
                          Validate Targets & Fiscal Year
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Mode */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Target Allocation Governance
                </h3>
                <div className="space-y-2.5">
                  {[
                    {
                      mode: SalesTargetImportMode.CREATE_AND_UPDATE,
                      title: 'Create & Update (Upsert)',
                      desc: 'Creates new period targets and updates existing quota allocations.',
                    },
                    {
                      mode: SalesTargetImportMode.CREATE_ONLY,
                      title: 'Create Only',
                      desc: 'Rejects overlapping targets for the same sales rep in the same period.',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.mode}
                      onClick={() => setImportMode(opt.mode)}
                      className={`p-3 rounded-lg border flex flex-col cursor-pointer transition-all ${
                        importMode === opt.mode
                          ? 'border-rose-600 bg-rose-50/40 ring-1 ring-rose-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{opt.title}</span>
                        <input
                          type="radio"
                          name="targetImportMode"
                          checked={importMode === opt.mode}
                          onChange={() => setImportMode(opt.mode)}
                          className="text-rose-600"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">{opt.desc}</span>
                    </label>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Target Integrity Checks
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                    <li>Verification of sales representative ID against active user directory</li>
                    <li>Fiscal year format (e.g. 2025-2026) and period consistency (e.g. 2025-04 or Q1)</li>
                    <li>Validation of optional brand/OEM focus and minimum commission incentive thresholds</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATION REPORT */}
          {wizardStep === 2 && validationSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Rows</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {validationSummary.totalRows}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-emerald-600 uppercase block">Valid Quotas</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">
                    {validationSummary.validRows}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-red-600 uppercase block">Error Rows</span>
                  <span className="text-2xl font-black text-red-700 mt-1 block">
                    {validationSummary.errorRows}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-rose-600 uppercase block">Total Revenue Target</span>
                  <span className="text-xl font-bold text-rose-700 mt-1 block font-mono">
                    ₹{(validationSummary.totalTargetRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#C9DDE0] shadow-xs">
                  <span className="text-[11px] font-semibold text-[#245B63] uppercase block">Target Units</span>
                  <span className="text-xl font-bold text-[#1E331B] mt-1 block font-mono">
                    {(validationSummary.totalTargetUnits || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#D2E7C4] shadow-xs">
                  <span className="text-[11px] font-semibold text-[#1E331B] uppercase block">New Quotas</span>
                  <span className="text-2xl font-black text-[#1E331B] mt-1 block">
                    {validationSummary.newTargetsCount}
                  </span>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Quota Validation Diagnosis ({filteredIssues.length} issues)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIssueFilter('ALL')}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                        issueFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      All ({validationIssues.length})
                    </button>
                    <button
                      onClick={() => setIssueFilter('ERRORS')}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                        issueFilter === 'ERRORS' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      Errors ({validationSummary.errorRows})
                    </button>
                  </div>
                </div>

                {filteredIssues.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">All sales targets passed validation perfectly.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {filteredIssues.map((issue, idx) => (
                      <div key={idx} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-800">
                            Row #{issue.rowNumber} • {issue.columnName}
                          </span>
                          <p className="text-xs text-slate-600 mt-0.5">{issue.message}</p>
                          {issue.remedyHint && (
                            <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
                              Remedy: {issue.remedyHint}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel & Re-Upload
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  disabled={validationSummary.validRows === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Proceed to Targets Preview ({validationSummary.validRows} Valid)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-rose-600" />
                    Preview Sales Target Allocations ({validatedRows.length})
                  </h3>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold sticky top-0">
                      <tr>
                        <th className="p-3 border-b">Row</th>
                        <th className="p-3 border-b">Action</th>
                        <th className="p-3 border-b">Sales Representative</th>
                        <th className="p-3 border-b">Territory</th>
                        <th className="p-3 border-b">Fiscal Year & Period</th>
                        <th className="p-3 border-b">Revenue Target</th>
                        <th className="p-3 border-b">Unit Target</th>
                        <th className="p-3 border-b">Brand Focus</th>
                        <th className="p-3 border-b">Min % for Incentive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {validatedRows.map((row) => (
                        <tr key={row.rowNumber} className={!row.isValid ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                          <td className="p-3 font-mono text-[11px] text-slate-500">#{row.rowNumber}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.action === 'CREATE'
                                  ? 'bg-[#D2E7C4] text-[#1E331B]'
                                  : 'bg-[#C9DDE0] text-[#245B63]'
                              }`}
                            >
                              {row.action}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{row.salesRepName}</div>
                            <div className="text-[10px] text-slate-500">{row.salesRepEmail}</div>
                          </td>
                          <td className="p-3 text-slate-600">{row.territory || 'North Hub'}</td>
                          <td className="p-3">
                            <span className="font-mono text-slate-800 font-semibold">{row.fiscalYear}</span>
                            <span className="text-slate-400 mx-1">•</span>
                            <span className="text-rose-600 font-bold">{row.targetPeriod}</span>
                          </td>
                          <td className="p-3 font-mono font-bold text-rose-700">
                            ₹{(row.targetRevenueAmount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {row.targetUnits ? `${row.targetUnits} units` : '—'}
                          </td>
                          <td className="p-3 text-slate-600">{row.focusBrandOrCompany || 'All Brands'}</td>
                          <td className="p-3 font-bold text-emerald-700">{row.minimumAchievementPct || 85}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex items-center justify-between">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Back to Validation
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isExecuting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Assigning Quotas...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm & Allocate {validationSummary?.validRows} Targets
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {wizardStep === 4 && executionResult && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center max-w-xl mx-auto space-y-5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{executionResult.message}</h2>
              <p className="text-xs text-slate-500">
                Sales targets and incentive benchmarks have been assigned to field representatives and regional managers.
              </p>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Import Another Quota File
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              Sales Target Import Batches
            </h3>
            <button
              onClick={loadBatchesHistory}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatches ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 border-b">Batch Number</th>
                  <th className="p-3 border-b">File Name</th>
                  <th className="p-3 border-b">Uploaded By</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b">Total Quotas</th>
                  <th className="p-3 border-b">Total Revenue Target</th>
                  <th className="p-3 border-b">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {batchesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No sales target batches recorded yet.
                    </td>
                  </tr>
                ) : (
                  batchesList.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{batch.batchNumber}</td>
                      <td className="p-3 font-medium text-slate-800">{batch.fileName}</td>
                      <td className="p-3">
                        <div>{batch.uploadedByUserName}</div>
                        <div className="text-[10px] text-slate-400">{batch.uploadedByUserRole}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {batch.status}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{batch.totalRows}</td>
                      <td className="p-3 font-mono font-bold text-rose-700">
                        ₹{(batch.totalTargetRevenue || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(batch.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
