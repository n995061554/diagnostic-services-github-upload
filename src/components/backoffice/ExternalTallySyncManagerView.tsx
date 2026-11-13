import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  Eye,
  Sliders,
  DollarSign,
  History,
  X,
  Package,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Database,
  ExternalLink,
  Receipt,
  FileText
} from 'lucide-react';
import { User, UserRoleType } from '../../types';
import {
  TallyConnectionStatus,
  ExternalTallyConfig,
  InventoryBatchSyncItem,
  ProductPriceSyncItem,
  CustomerLedgerSyncItem,
  TallyDiscrepancyItem,
  SyncBatch,
  IntegrationAuditLog
} from '../../../server/accounting/integration/integrationTypes';

export interface ExternalTallySyncManagerViewProps {
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
  onNavigateTab?: (tab: string) => void;
}

export const ExternalTallySyncManagerView: React.FC<ExternalTallySyncManagerViewProps> = ({
  currentUser,
  currentRole,
  token,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'PRICES' | 'LEDGERS' | 'PAYMENTS' | 'BATCHES' | 'AUDIT' | 'BRIDGE'>('OVERVIEW');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Connection State
  const [connStatus, setConnStatus] = useState<TallyConnectionStatus | null>(null);
  const [tallyConfig, setTallyConfig] = useState<any | null>(null);

  // Office Tally Bridge State
  const [bridgeDevices, setBridgeDevices] = useState<any[]>([]);
  const [pairingToken, setPairingToken] = useState<any | null>(null);
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const [keyCopied, setKeyCopied] = useState<boolean>(false);

  // Sync Data
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<SyncBatch | null>(null);
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatchSyncItem[]>([]);
  const [customerLedgers, setCustomerLedgers] = useState<CustomerLedgerSyncItem[]>([]);
  const [discrepancies, setDiscrepancies] = useState<TallyDiscrepancyItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<IntegrationAuditLog[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Approval Decision State
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  // Outbound Receipt Export Modal
  const [receiptXmlPreview, setReceiptXmlPreview] = useState<string | null>(null);

  // Configuration Settings Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [editConfigForm, setEditConfigForm] = useState<{
    enabled: boolean;
    environment: 'MOCK_LOCAL' | 'EXTERNAL_TALLY_HTTP' | 'OFFICE_TALLY_BRIDGE';
    tallyVersion: 'TALLY_PRIME' | 'TALLY_ERP_9' | 'TALLY_PRIME_7_PLUS';
    companyName: string;
    host: string;
    port: number;
    timeoutMs: number;
    autoSyncIntervalMinutes: number;
  }>({
    enabled: false,
    environment: 'MOCK_LOCAL',
    tallyVersion: 'TALLY_PRIME',
    companyName: 'A2Z Diagnostic Services India Pvt Ltd',
    host: '127.0.0.1',
    port: 9000,
    timeoutMs: 4000,
    autoSyncIntervalMinutes: 60
  });
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Fetch functions
  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/status', { headers: authHeaders });
      const data = await res.json();
      if (data.status) setConnStatus(data.status);
    } catch (_err) {}
  };

  const fetchTallyConfig = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/config', { headers: authHeaders });
      const data = await res.json();
      if (data.config) setTallyConfig(data.config);
    } catch (_err) {}
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/batches', { headers: authHeaders });
      const data = await res.json();
      if (data.batches) {
        setBatches(data.batches);
        if (data.batches.length > 0 && !selectedBatch) {
          setSelectedBatch(data.batches[0]);
        }
      }
    } catch (_err) {}
  };

  const fetchInventoryBatches = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/inventory-batches', { headers: authHeaders });
      const data = await res.json();
      if (data.batches) setInventoryBatches(data.batches);
    } catch (_err) {}
  };

  const fetchCustomerLedgers = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/customer-ledgers', { headers: authHeaders });
      const data = await res.json();
      if (data.ledgers) setCustomerLedgers(data.ledgers);
    } catch (_err) {}
  };

  const fetchDiscrepancies = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/discrepancies', { headers: authHeaders });
      const data = await res.json();
      if (data.discrepancies) setDiscrepancies(data.discrepancies);
    } catch (_err) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/audit-logs', { headers: authHeaders });
      const data = await res.json();
      if (data.auditLogs) setAuditLogs(data.auditLogs);
    } catch (_err) {}
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/payments', { headers: authHeaders });
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch (_err) {}
  };

  const fetchBridgeDevices = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/bridge/devices', { headers: authHeaders });
      const data = await res.json();
      if (data.devices) setBridgeDevices(data.devices);
    } catch (_err) {}
  };

  const handleGeneratePairingKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/bridge/generate-pairing-key', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPairingToken(data.pairingToken);
        setKeyCopied(false);
        showNotification('success', `Generated 15-minute pairing key: ${data.pairingToken.pairingKey}`);
      } else {
        showNotification('error', data.message || 'Failed to generate pairing key.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!window.confirm(`Are you sure you want to revoke Bridge Device "${deviceId}"? This office computer will be immediately disconnected.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v1/accounting/integration/bridge/devices/${deviceId}/revoke`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.message || `Bridge device ${deviceId} revoked.`);
        await fetchBridgeDevices();
        await fetchConnectionStatus();
      } else {
        showNotification('error', data.message || 'Failed to revoke device.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchConnectionStatus(),
      fetchTallyConfig(),
      fetchBridgeDevices(),
      fetchBatches(),
      fetchInventoryBatches(),
      fetchCustomerLedgers(),
      fetchDiscrepancies(),
      fetchAuditLogs(),
      fetchPayments()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // Sync Trigger Handlers
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/test-connection', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.status) {
        setConnStatus(data.status);
        if (data.status.connected) {
          showNotification('success', data.status.statusMessage);
        } else {
          showNotification('error', data.status.statusMessage);
        }
      }
    } catch (err: any) {
      showNotification('error', `Connection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeInventorySync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/sync-inventory', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Created Inventory Batch Sync: ${data.batch.id} (${data.batch.recordCount} batches). Awaiting dual-control approval.`);
        await fetchBatches();
        await fetchInventoryBatches();
        setActiveTab('BATCHES');
      } else {
        showNotification('error', data.message || 'Failed to create inventory sync batch.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposePriceSync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/batches', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ source: 'COMMERCIAL_TALLYPRIME' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Created Price Sync Batch: ${data.batch.id} (${data.batch.recordCount} products). Awaiting dual-control approval.`);
        await fetchBatches();
        setActiveTab('BATCHES');
      } else {
        showNotification('error', data.message || 'Failed to propose price sync batch.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeLedgerSync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/sync-ledgers', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Created Customer Ledger Sync: ${data.batch.id} (${data.batch.recordCount} ledgers). Awaiting dual-control approval.`);
        await fetchBatches();
        await fetchCustomerLedgers();
        await fetchDiscrepancies();
        setActiveTab('BATCHES');
      } else {
        showNotification('error', data.message || 'Failed to propose customer ledger sync.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeReceiptSync = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/sync-receipts', {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Created Payment Reconciliation: ${data.batch.id} (${data.batch.recordCount} receipts). Awaiting dual-control approval.`);
        await fetchBatches();
        await fetchPayments();
        setActiveTab('BATCHES');
      } else {
        showNotification('error', data.message || 'Failed to propose receipt reconciliation.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDecision = async (batchId: string, decision: 'APPROVED' | 'REJECTED') => {
    setIsSubmittingDecision(true);
    try {
      const res = await fetch(`/api/v1/accounting/integration/batches/${batchId}/decision`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ decision, reasonNotes: decisionNotes })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', `Batch ${batchId} marked as ${decision}.`);
        setDecisionNotes('');
        await fetchBatches();
        if (selectedBatch?.id === batchId) {
          setSelectedBatch(data.batch);
        }
      } else {
        showNotification('error', data.message || `Failed to record decision for batch ${batchId}.`);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleApplyBatch = async (batchId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/accounting/integration/batches/${batchId}/apply`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', data.details || `Batch ${batchId} successfully applied!`);
        await fetchBatches();
        await fetchInventoryBatches();
        await fetchCustomerLedgers();
        await fetchAuditLogs();
      } else {
        showNotification('error', data.message || `Failed to apply batch ${batchId}.`);
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReceiptXml = async (payment: any) => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/export-receipt', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          receiptNumber: payment.accountingVoucherNumber || `RCP-${payment.id.slice(-6)}`,
          receiptDate: payment.createdAt.split('T')[0],
          customerLedgerName: `Sundry Debtors - ${payment.customerName}`,
          bankLedgerName: 'HDFC Bank Ltd (Current A/c #9921)',
          amount: payment.amount,
          narration: `Payment for invoices via ${payment.paymentMethod}. Ref: ${payment.bankReferenceNumber || payment.gatewayTransactionId || payment.id}`,
          transactionReference: payment.bankReferenceNumber || payment.gatewayTransactionId
        })
      });
      const data = await res.json();
      if (data.xmlEnvelope) {
        setReceiptXmlPreview(data.xmlEnvelope);
      }
    } catch (_err) {}
  };

  const handleOpenConfigModal = () => {
    if (tallyConfig) {
      setEditConfigForm({
        enabled: tallyConfig.enabled ?? false,
        environment: tallyConfig.environment || 'MOCK_LOCAL',
        tallyVersion: tallyConfig.tallyVersion || 'TALLY_PRIME',
        companyName: tallyConfig.companyName || 'A2Z Diagnostic Services India Pvt Ltd',
        host: tallyConfig.host || '127.0.0.1',
        port: Number(tallyConfig.port) || 9000,
        timeoutMs: Number(tallyConfig.timeoutMs) || 4000,
        autoSyncIntervalMinutes: Number(tallyConfig.autoSyncIntervalMinutes) || 60
      });
    }
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/v1/accounting/integration/tally/config', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(editConfigForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'External Tally adapter configuration updated successfully!');
        setTallyConfig(data.config);
        setIsConfigModalOpen(false);
        // Automatically ping test connection with the new settings
        await handleTestConnection();
      } else {
        showNotification('error', data.message || 'Failed to update Tally configuration.');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Helper check: Is current user the submitter? (Maker-Checker violation)
  const isSubmitterOfSelected = selectedBatch && currentUser?.id === selectedBatch.submittedBy.id;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-[#0E1035] text-white border-emerald-500/40'
              : 'bg-rose-950 text-white border-rose-500/40'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Top Header Banner */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Primary Accounting Authority: External Tally
            </span>
            <span className="text-xs text-slate-400">● Tally ERP 9 &amp; TallyPrime Integration Adapter</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            External Tally Integration &amp; Sync Manager
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            External Tally is the authoritative source for inventory batches, product prices, customer ledgers, and outstanding balances. All incoming changes require Back Office dual-control review before application.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleTestConnection}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-bold text-slate-200 transition cursor-pointer flex items-center gap-2"
            title="Ping External Tally ERP"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            Test Connection
          </button>

          <button
            onClick={handleProposeInventorySync}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow"
            title="Pull Batch Inventory & Expiries from Tally"
          >
            <Package className="w-3.5 h-3.5" />
            Sync Inventory Batches
          </button>

          <button
            onClick={handleProposeLedgerSync}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow"
            title="Pull Customer Balances from Tally"
          >
            <Building2 className="w-3.5 h-3.5" />
            Sync Customer Ledgers
          </button>

          <button
            onClick={handleProposeReceiptSync}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow"
            title="Pull &amp; Reconcile Tally Receipt Vouchers"
          >
            <Receipt className="w-3.5 h-3.5" />
            Reconcile Receipts
          </button>

          <button
            onClick={handleProposePriceSync}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5 shadow"
            title="Pull Product Prices from Tally"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Sync Prices
          </button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Connection Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Tally ERP Connection</span>
            <span className={`w-2.5 h-2.5 rounded-full ${connStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          </div>
          <div className="mt-2 text-base font-black text-slate-900 truncate">
            {connStatus?.tallyVersion || 'TallyPrime 4.x'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Company: {tallyConfig?.companyName ? tallyConfig.companyName.slice(0, 18) + '...' : 'A2Z Diagnostic'}</span>
            <span className="font-mono text-emerald-600 font-bold">{connStatus?.latencyMs || 18}ms</span>
          </div>
        </div>

        {/* Card 2: Batch Inventory & Expiry Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Batches &amp; Expiries</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{inventoryBatches.length}</span>
            <span className="text-xs font-bold text-slate-500">Tracked Batches</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
            <span className="text-amber-600 font-bold">
              {inventoryBatches.filter(b => b.urgencyLevel === 'CRITICAL' || b.urgencyLevel === 'WARNING').length} Near Expiry
            </span>
            <span>&bull;</span>
            <span className="text-rose-600 font-bold">
              {inventoryBatches.filter(b => b.isExpired).length} Quarantined
            </span>
          </div>
        </div>

        {/* Card 3: Authoritative Customer Ledgers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Customer Ledgers</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{customerLedgers.length}</span>
            <span className="text-xs font-bold text-slate-500">Active Debtors</span>
          </div>
          <div className="mt-1 text-[11px] flex items-center justify-between">
            <span className="text-slate-500">Discrepancies:</span>
            <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${discrepancies.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {discrepancies.length > 0 ? `${discrepancies.length} Require Review` : 'All Balanced'}
            </span>
          </div>
        </div>

        {/* Card 4: Dual-Control Approval Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span className="uppercase tracking-wider">Dual-Control Approval</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {batches.filter(b => b.status === 'PENDING_APPROVAL' || b.status === 'VALIDATED').length}
            </span>
            <span className="text-xs font-bold text-slate-500">Batches Pending</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Approved: {batches.filter(b => b.status === 'APPROVED').length}</span>
            <span>Applied: {batches.filter(b => b.status === 'APPLIED').length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'OVERVIEW', label: '1. Overview & Connectivity', icon: Sliders },
          { id: 'INVENTORY', label: `2. Inventory & Batches (${inventoryBatches.length})`, icon: Package },
          { id: 'PRICES', label: '3. Product & Price Sync', icon: DollarSign },
          { id: 'LEDGERS', label: `4. Customer Ledgers & Balances (${customerLedgers.length})`, icon: Building2 },
          { id: 'PAYMENTS', label: `5. Payments & Receipts (${payments.length})`, icon: Receipt },
          { id: 'BATCHES', label: `6. Approval Queue (${batches.filter(b => b.status === 'PENDING_APPROVAL').length})`, icon: ShieldCheck },
          { id: 'AUDIT', label: `7. Audit Trail (${auditLogs.length})`, icon: History },
          { id: 'BRIDGE', label: `8. Office Bridge & Pairing (${bridgeDevices.length})`, icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-[#0E1035] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW & CONNECTIVITY */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Information & Architecture */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                External Tally ERP Architecture &amp; Data Ownership
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diagnostic Services integrates directly with your external commercial Tally ERP 9 / TallyPrime system. Under this architecture, Tally is the definitive accounting and inventory source of truth:
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Data Domain</th>
                      <th className="py-2.5 px-3">Primary Source of Truth</th>
                      <th className="py-2.5 px-3">Sync Direction &amp; Policy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Inventory &amp; Batches</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">External Tally ERP</td>
                      <td className="py-2.5 px-3 text-slate-600">Inbound into Diagnostic Services (Batch-wise expiry, Quarantined if expired)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Product Prices &amp; MRP</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">External Tally ERP</td>
                      <td className="py-2.5 px-3 text-slate-600">Inbound with Non-Retroactive policy (Preserves confirmed orders &amp; invoices)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Customer Accounting Ledger</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-bold">External Tally ERP</td>
                      <td className="py-2.5 px-3 text-slate-600">Authoritative balance &amp; invoices; displayed in Customer Lab</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Verified Payment Receipts</td>
                      <td className="py-2.5 px-3 text-indigo-700 font-bold">Diagnostic Services Workflow</td>
                      <td className="py-2.5 px-3 text-slate-600">Reconciled and exported as Receipt Vouchers to Tally</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Customer Orders &amp; Auth</td>
                      <td className="py-2.5 px-3 text-slate-900 font-bold">Diagnostic Services</td>
                      <td className="py-2.5 px-3 text-slate-600">Customer lab orders, login credentials, and permission scopes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sync Schedule & Health */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Synchronization Health &amp; Timers
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Last Successful Sync</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {tallyConfig?.lastSuccessfulSync ? new Date(tallyConfig.lastSuccessfulSync).toLocaleString('en-IN') : 'Recently synchronized'}
                  </div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-medium">Next Scheduled Synchronization</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {tallyConfig?.nextScheduledSync ? new Date(tallyConfig.nextScheduledSync).toLocaleString('en-IN') : 'Every 60 minutes (Automatic)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Connection Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                Tally Adapter Configuration
              </h2>
              <button
                onClick={handleOpenConfigModal}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Configure Settings
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Integration Adapter Policy</span>
                  <span className="text-[11px] text-slate-500">
                    {tallyConfig?.enabled ? 'Active & Authorized' : 'Disabled by Policy - Awaiting Authorization'}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${tallyConfig?.enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700 border border-slate-300'}`}>
                  {tallyConfig?.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Operating Environment</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {tallyConfig?.environment === 'MOCK_LOCAL' ? 'Safe Offline Medical Fixtures' : `Live HTTP Bridge (http://${tallyConfig?.host}:${tallyConfig?.port})`}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${tallyConfig?.environment === 'MOCK_LOCAL' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-purple-100 text-purple-800 border border-purple-300'}`}>
                  {tallyConfig?.environment === 'MOCK_LOCAL' ? 'MOCK LOCAL' : 'LIVE TALLY HTTP'}
                </span>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Target Company in Tally</label>
                <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 font-mono text-[11px] font-bold">
                  {tallyConfig?.companyName || 'A2Z Diagnostic Services India Pvt Ltd'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Host &amp; Port</label>
                  <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 font-mono text-[11px]">
                    {tallyConfig?.host || '127.0.0.1'}:{tallyConfig?.port || '9000'}
                  </div>
                </div>
                <div>
                  <label className="text-slate-500 font-semibold block mb-1">Tally Edition</label>
                  <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 font-mono text-[11px]">
                    {tallyConfig?.tallyVersion || 'TALLY_PRIME'}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Security Boundary</label>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                  <strong>Protected Boundary:</strong> Tally ERP runs locally on your private network or server. The HTTP service is accessed via this secure adapter and is never directly exposed to the public internet.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY & BATCH-WISE EXPIRY MANAGEMENT */}
      {activeTab === 'INVENTORY' && (
        <div className="space-y-4">
          {/* Diagnostic Expiry Alert Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-bold shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Batch-Wise Expiry Governance for Clinical Diagnostics
                </h3>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Products are tracked by individual batch number and physical expiry date. Batches nearing expiry (&lt;30 days) generate warnings. Expired batches are automatically quarantined from customer purchase orders.
                </p>
              </div>
            </div>
            <button
              onClick={handleProposeInventorySync}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shrink-0"
            >
              Pull Fresh Batches from Tally
            </button>
          </div>

          {/* Batches Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product Name &amp; SKU</th>
                    <th className="py-3 px-3">Batch / Lot #</th>
                    <th className="py-3 px-3">Mfg Date</th>
                    <th className="py-3 px-3">Expiry Date</th>
                    <th className="py-3 px-3">Days Left</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-right">Available Qty</th>
                    <th className="py-3 px-3">Godown / Location</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryBatches.map((b) => (
                    <tr key={b.guid} className={b.isExpired ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{b.sku} &bull; {b.brand}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">
                        {b.manufacturingDate || '2025-10-01'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={b.isExpired ? 'text-rose-600' : b.urgencyLevel === 'CRITICAL' ? 'text-amber-600' : 'text-slate-800'}>
                          {b.expiryDate}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {b.isExpired ? (
                          <span className="text-rose-700 font-black">EXPIRED</span>
                        ) : (
                          <span className={b.daysRemaining <= 30 ? 'text-amber-700 font-bold' : 'text-slate-700'}>
                            {b.daysRemaining} days
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{b.sellingPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        {b.availableQuantity} {b.uom}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] truncate max-w-[140px]" title={b.godown}>
                        {b.godown}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {b.isExpired ? (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                            Quarantined
                          </span>
                        ) : b.urgencyLevel === 'CRITICAL' ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                            Urgent (&lt;30d)
                          </span>
                        ) : b.urgencyLevel === 'WARNING' ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Near Expiry
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT & PRICE SYNCHRONIZATION */}
      {activeTab === 'PRICES' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-blue-950">Non-Retroactive Price Policy Enforced</h3>
                <p className="text-xs text-blue-800 mt-0.5">
                  Price changes from external Tally apply to new customer orders only. Historical confirmed purchase orders and already posted tax invoices are immutable and strictly retain their original prices.
                </p>
              </div>
            </div>
            <button
              onClick={handleProposePriceSync}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shrink-0"
            >
              Propose Price Sync Batch
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Synchronized Catalogue Prices</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-3 px-4">Product Name &amp; SKU</th>
                    <th className="py-3 px-3 text-right">Current Distributor Base</th>
                    <th className="py-3 px-3 text-right">Tally Selling Rate</th>
                    <th className="py-3 px-3 text-right">MRP</th>
                    <th className="py-3 px-3 text-center">GST %</th>
                    <th className="py-3 px-4 text-center">Policy Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryBatches.slice(0, 5).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">₹{p.sellingPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">₹{p.mrp.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{p.gstRate}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          Protected
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER LEDGERS & BALANCES */}
      {activeTab === 'LEDGERS' && (
        <div className="space-y-4">
          {discrepancies.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-950">
                    {discrepancies.length} Ledger Balance Discrepancy Detected
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Tally ledger balance differs from distributor local ledger records. Discrepancies are flagged for Back Office review and are never silently overwritten.
                  </p>
                </div>
              </div>
              <button
                onClick={handleProposeLedgerSync}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shrink-0"
              >
                Reconcile with Tally
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Customer Name &amp; ID</th>
                    <th className="py-3 px-3">Tally Sundry Debtor Ledger</th>
                    <th className="py-3 px-3">GSTIN</th>
                    <th className="py-3 px-3 text-right">Tally Outstanding</th>
                    <th className="py-3 px-3 text-right">Distributor Record</th>
                    <th className="py-3 px-3 text-right">Overdue</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerLedgers.map((l) => (
                    <tr key={l.tallyLedgerId} className={l.hasDiscrepancy ? 'bg-amber-50/50' : 'hover:bg-slate-50/60'}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{l.distributorCustomerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.distributorCustomerId}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-800 text-[11px]">
                        {l.tallyLedgerName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {l.gstin || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{l.tallyOutstanding.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        ₹{l.distributorOutstanding.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600 font-bold">
                        ₹{l.overdueAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {l.hasDiscrepancy ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                            Discrepancy (₹{l.discrepancyAmount.toLocaleString('en-IN')})
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            Authoritative
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. PAYMENTS & RECEIPTS */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verified Payment Receipts &amp; Tally Vouchers</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Online gateway and bank transfer payments verified by the Back Office can be exported directly into Tally as Receipt Vouchers.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Payment ID &amp; Ref</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Lifecycle Status</th>
                    <th className="py-3 px-4 text-center">Tally Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{p.id}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.bankReferenceNumber || p.gatewayTransactionId || p.idempotencyKey}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{p.customerName}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'VERIFIED' || p.status === 'POSTED_TO_ACCOUNTING' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleExportReceiptXml(p)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-mono font-bold transition cursor-pointer"
                        >
                          View Tally XML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. APPROVAL BATCHES (MAKER-CHECKER) */}
      {activeTab === 'BATCHES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Batches List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Synchronization Batches</span>
              <span className="text-xs text-slate-400 font-normal">{batches.length} total</span>
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {batches.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBatch(b)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedBatch?.id === b.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{b.batchType}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        b.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : b.status === 'APPLIED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : b.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] opacity-80 truncate">{b.id}</div>
                  <div className="mt-1 flex items-center justify-between text-[10px] opacity-60">
                    <span>{b.recordCount} records</span>
                    <span>{new Date(b.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Selected Batch Review & Maker-Checker Decision */}
          <div className="lg:col-span-2 space-y-4">
            {selectedBatch ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                      {selectedBatch.batchType} &bull; {selectedBatch.source}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {selectedBatch.id}
                    </h2>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      selectedBatch.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedBatch.status === 'APPLIED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : selectedBatch.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {selectedBatch.status}
                  </span>
                </div>

                {/* Submitter & Maker-Checker Warning */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Submitted by:</span>{' '}
                    <strong className="text-slate-900">{selectedBatch.submittedBy.name} ({selectedBatch.submittedBy.role})</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(selectedBatch.submittedAt).toLocaleString('en-IN')}
                  </div>
                </div>

                {isSubmitterOfSelected && selectedBatch.status === 'PENDING_APPROVAL' && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Maker-Checker Enforcement Active:</strong> You submitted this batch. To preserve separation of duties, an independent Back Office approver must review and authorize it.
                    </span>
                  </div>
                )}

                {/* Items Preview Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Proposed Changes ({selectedBatch.recordCount} Items)
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Item / Identifier</th>
                          <th className="py-2 px-3">Key Details</th>
                          <th className="py-2 px-3 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {selectedBatch.items.map((it: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {it.sourceProductName || it.productName || it.distributorCustomerName || it.tallyLedgerName}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {it.batchNumber ? `Batch: ${it.batchNumber} (Exp: ${it.expiryDate})` : (it.distributorSku || it.gstin || 'Standard')}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              {it.proposedBasePrice ? `₹${it.proposedBasePrice}` : it.tallyOutstanding ? `₹${it.tallyOutstanding.toLocaleString('en-IN')}` : `${it.availableQuantity || 0} units`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Decision Actions */}
                {selectedBatch.status === 'PENDING_APPROVAL' && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">Review &amp; Decision Notes (Optional)</label>
                    <input
                      type="text"
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Add justification or audit remarks for this decision..."
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-slate-800"
                    />

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleBatchDecision(selectedBatch.id, 'APPROVED')}
                        disabled={isSubmittingDecision || isSubmitterOfSelected}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Batch
                      </button>

                      <button
                        onClick={() => handleBatchDecision(selectedBatch.id, 'REJECTED')}
                        disabled={isSubmittingDecision}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Batch
                      </button>
                    </div>
                  </div>
                )}

                {selectedBatch.status === 'APPROVED' && (
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      Approved by: <strong>{selectedBatch.approvalDecision?.decidedBy.name}</strong> on {selectedBatch.approvalDecision?.decidedAt ? new Date(selectedBatch.approvalDecision.decidedAt).toLocaleString('en-IN') : ''}
                    </div>
                    <button
                      onClick={() => handleApplyBatch(selectedBatch.id)}
                      disabled={loading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow"
                    >
                      <Sparkles className="w-4 h-4" />
                      Apply Changes to Live Records
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                Select a synchronization batch from the left to inspect its diff and record approval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Tamper-Evident Integration Audit Log</h3>
            <span className="text-xs text-slate-400 font-mono">Sensitive Credentials Redacted</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{log.actorName}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-bold">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.entityType}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans text-xs truncate max-w-xs" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. OFFICE TALLY BRIDGE & PAIRING */}
      {activeTab === 'BRIDGE' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">Windows Office Tally Bridge Gateway</h3>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Connects your office Tally ERP 9 / TallyPrime installation (at <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">127.0.0.1:9000</code>) to Render cloud backend via secure outbound HTTPS. Port 9000 is never exposed to the public internet. Commands are cryptographically signed with HMAC-SHA256 and strictly restricted to read-only operations.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleGeneratePairingKey}
                disabled={isGeneratingKey}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingKey ? 'Generating Key...' : 'Generate 15-Minute Pairing Key'}
              </button>
            </div>
          </div>

          {/* Active Pairing Token Card (If Generated) */}
          {pairingToken && !pairingToken.used && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">One-Time Bridge Enrollment Token</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-300">
                  Valid for 15 minutes (Expires: {new Date(pairingToken.expiresAt).toLocaleTimeString('en-IN')})
                </span>
              </div>

              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-emerald-200">
                <span className="font-mono text-2xl font-black text-slate-900 tracking-wider">
                  {pairingToken.pairingKey}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pairingToken.pairingKey);
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 3000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {keyCopied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                On your Windows office computer, run <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">.\setup-bridge.bat</code> and enter this pairing key when prompted.
              </p>
            </div>
          )}

          {/* Registered Office Bridge Devices Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Paired Office Workstations ({bridgeDevices.length})</h4>
                <p className="text-xs text-slate-500">Computers authorized to bridge local Tally ERP 9 with Diagnostic Services</p>
              </div>
              <button
                onClick={fetchBridgeDevices}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                Refresh Devices
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Device Name</th>
                    <th className="py-2.5 px-3">Device ID</th>
                    <th className="py-2.5 px-3">Platform / Version</th>
                    <th className="py-2.5 px-3">Local Tally Endpoint</th>
                    <th className="py-2.5 px-3">Active Company</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bridgeDevices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No Windows Bridge workstations paired yet. Click "Generate 15-Minute Pairing Key" above to pair your office computer.
                      </td>
                    </tr>
                  ) : (
                    bridgeDevices.map((dev) => (
                      <tr key={dev.deviceId} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{dev.deviceName}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">{dev.deviceId}</td>
                        <td className="py-3 px-3 text-slate-700">
                          {dev.osInfo} <span className="text-slate-400 font-mono text-[10px]">({dev.clientVersion})</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 text-[11px]">
                          http://{dev.tallyHost || '127.0.0.1'}:{dev.tallyPort || 9000}/
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-xs" title={dev.lastCompanyReported || 'None'}>
                          {dev.lastCompanyReported || 'None reported'}
                        </td>
                        <td className="py-3 px-3">
                          {dev.status === 'REVOKED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              REVOKED
                            </span>
                          ) : dev.isOnline ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              ONLINE
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              OFFLINE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {dev.status !== 'REVOKED' && (
                            <button
                              onClick={() => handleRevokeDevice(dev.deviceId)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition cursor-pointer border border-rose-200"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Setup & Installation Guide Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-700 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Windows Office Installation &amp; Service Setup Guide
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Step 1: Download &amp; Extract</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Extract the <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">windows-tally-bridge</code> folder to your office workstation (e.g. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">C:\DSDistributorBridge</code>). Ensure Node.js 18+ is installed.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Step 2: Run Setup Wizard</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Run <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">.\setup-bridge.bat</code>. Enter your Render backend URL and the 15-minute pairing key. The wizard verifies local Tally at port 9000.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Step 3: Background Service</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Right-click PowerShell &rarr; Run as Administrator and run:
                  <code className="block mt-1 font-mono text-[10px] bg-slate-900 text-emerald-400 p-2 rounded">
                    powershell -ExecutionPolicy Bypass -File .\install-service.ps1
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outbound Receipt XML Modal */}
      {receiptXmlPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Standard Tally Voucher XML Envelope (Receipt)
              </h3>
              <button onClick={() => setReceiptXmlPreview(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              This XML envelope is generated according to documented Tally ERP 9 / TallyPrime import specifications for verified customer receipts.
            </p>
            <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 select-all">
              {receiptXmlPreview}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setReceiptXmlPreview(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Tally Adapter Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    External Tally ERP Connection Settings
                  </h3>
                  <p className="text-xs text-slate-500">Configure connection parameters for commercial Tally ERP 9 / TallyPrime</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              {/* Integration Enabled Switch */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Enable External Tally Adapter</span>
                  <span className="text-[11px] text-slate-500">
                    {editConfigForm.enabled ? 'Adapter is active and will process synchronization requests' : 'Adapter is disabled by policy; connection requests will be rejected'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editConfigForm.enabled}
                    onChange={(e) => setEditConfigForm({ ...editConfigForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Operating Environment */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Operating Environment</label>
                <select
                  value={editConfigForm.environment}
                  onChange={(e) => setEditConfigForm({ ...editConfigForm, environment: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="MOCK_LOCAL">Safe Local Mock Fixtures (Offline Testing &amp; Simulation)</option>
                  <option value="OFFICE_TALLY_BRIDGE">Windows Office Tally Bridge (Render Outbound Cloud Tunnel to Office PC)</option>
                  <option value="EXTERNAL_TALLY_HTTP">Direct External Tally HTTP Bridge (Localhost / LAN Port 9000)</option>
                </select>
                {editConfigForm.environment === 'OFFICE_TALLY_BRIDGE' ? (
                  <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                    <strong>Office Bridge Mode:</strong> The office workstation establishes outbound HTTPS connections to Render. Port 9000 is never exposed to the internet. Commands are signed with HMAC-SHA256 and strictly read-only.
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {editConfigForm.environment === 'MOCK_LOCAL'
                      ? 'Local simulation mode: Uses medical diagnostic reagent and lab customer fixtures.'
                      : 'In Live HTTP mode, the server connects via loopback/intranet to the commercial Tally ODBC/HTTP listener.'}
                  </p>
                )}
              </div>

              {/* Target Company in Tally */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Company Name in Tally</label>
                <input
                  type="text"
                  required
                  value={editConfigForm.companyName}
                  onChange={(e) => setEditConfigForm({ ...editConfigForm, companyName: e.target.value })}
                  placeholder="e.g. A2Z Diagnostic Services India Pvt Ltd"
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Tally Edition */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tally Edition / Release</label>
                <select
                  value={editConfigForm.tallyVersion}
                  onChange={(e) => setEditConfigForm({ ...editConfigForm, tallyVersion: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="TALLY_PRIME">TallyPrime 4.x / 3.x (Documented XML Export/Import)</option>
                  <option value="TALLY_ERP_9">Tally ERP 9 (XML-over-HTTP port 9000)</option>
                  <option value="TALLY_PRIME_7_PLUS">TallyPrime 7.0+ (Documented REST JSON endpoints)</option>
                </select>
              </div>

              {/* Host & Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Host IP / Name</label>
                  <input
                    type="text"
                    required
                    value={editConfigForm.host}
                    onChange={(e) => setEditConfigForm({ ...editConfigForm, host: e.target.value })}
                    placeholder="127.0.0.1 or 192.168.1.100"
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={editConfigForm.port}
                    onChange={(e) => setEditConfigForm({ ...editConfigForm, port: parseInt(e.target.value, 10) || 9000 })}
                    placeholder="9000"
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Timeout & Auto-Sync Interval */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Request Timeout (ms)</label>
                  <input
                    type="number"
                    value={editConfigForm.timeoutMs}
                    onChange={(e) => setEditConfigForm({ ...editConfigForm, timeoutMs: parseInt(e.target.value, 10) || 4000 })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auto-Sync Interval (min)</label>
                  <input
                    type="number"
                    value={editConfigForm.autoSyncIntervalMinutes}
                    onChange={(e) => setEditConfigForm({ ...editConfigForm, autoSyncIntervalMinutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-slate-800 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Notice:</strong> Modifying connection parameters will not delete or alter historical vouchers, invoices, or customer ledgers.
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save &amp; Test Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
