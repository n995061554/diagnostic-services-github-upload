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
  X
} from 'lucide-react';

interface AccountingSyncManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string | null;
}

export const AccountingSyncManagementModal: React.FC<AccountingSyncManagementModalProps> = ({
  isOpen,
  onClose,
  token
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'BATCHES' | 'TALLYPRIME' | 'TRANSFERS' | 'AUDIT'>('BATCHES');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tallyConfig, setTallyConfig] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/accounting/integration/batches', { headers: authHeaders });
      const data = await res.json();
      if (data.statusCode === 200 && data.batches) {
        setBatches(data.batches);
        if (data.batches.length > 0 && !selectedBatch) {
          setSelectedBatch(data.batches[0]);
        }
      }
    } catch (_err) {
      // offline/mock safe fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/payments', { headers: authHeaders });
      const data = await res.json();
      if (data.statusCode === 200 && data.payments) {
        setPayments(data.payments);
      }
    } catch (_err) {}
  };

  const fetchTallyConfig = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/tallyprime/config', { headers: authHeaders });
      const data = await res.json();
      if (data.statusCode === 200 && data.config) {
        setTallyConfig(data.config);
      }
    } catch (_err) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/accounting/integration/audit-logs', { headers: authHeaders });
      const data = await res.json();
      if (data.statusCode === 200 && data.auditLogs) {
        setAuditLogs(data.auditLogs);
      }
    } catch (_err) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchBatches();
      fetchPayments();
      fetchTallyConfig();
      fetchAuditLogs();
    }
  }, [isOpen]);

  const handleProposeBatch = async (source: 'BUILTIN_TALLY' | 'COMMERCIAL_TALLYPRIME') => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await fetch('/api/v1/accounting/integration/batches', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ source })
      });
      const data = await res.json();
      if (data.statusCode === 201) {
        setActionMessage({ type: 'success', text: `Sync batch proposed successfully from ${source}.` });
        await fetchBatches();
        if (data.batch) setSelectedBatch(data.batch);
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Failed to propose sync batch.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDecideBatch = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedBatch) return;
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await fetch(`/api/v1/accounting/integration/batches/${selectedBatch.id}/decision`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ decision, reasonNotes: decisionNotes })
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        setActionMessage({ type: 'success', text: `Batch ${selectedBatch.id} marked as ${decision}.` });
        setDecisionNotes('');
        await fetchBatches();
        setSelectedBatch(data.batch);
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Decision failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBatch = async () => {
    if (!selectedBatch) return;
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await fetch(`/api/v1/accounting/integration/batches/${selectedBatch.id}/apply`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        setActionMessage({ type: 'success', text: `Prices applied successfully to ${data.appliedCount} products!` });
        await fetchBatches();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Apply failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBankTransfer = async (paymentId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      setLoading(true);
      setActionMessage(null);
      const res = await fetch(`/api/v1/accounting/integration/payments/bank-transfer/${paymentId}/verify`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ decision, reasonNotes: 'Verified via Back Office control panel' })
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        setActionMessage({ type: 'success', text: `Bank transfer ${paymentId} ${decision === 'APPROVE' ? 'verified & posted to accounting ledger' : 'rejected'}.` });
        await fetchPayments();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'Verification failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTallyPrime = async (enabled: boolean) => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/accounting/integration/tallyprime/toggle', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.statusCode === 200) {
        setTallyConfig(data.config);
        setActionMessage({ type: 'success', text: `TallyPrime adapter set to ${enabled ? 'ENABLED' : 'DISABLED'}.` });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Toggle failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Accounting & Customer Lab Integration
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Dual-Control Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Synchronize approved product pricing, reconciled balances, and verified payments without modifying mobile client contracts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('BATCHES')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'BATCHES'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Price Sync Batches ({batches.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TRANSFERS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'TRANSFERS'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Bank Transfer Verifications ({payments.filter(p => p.paymentMethod === 'BANK_TRANSFER').length})
          </button>
          <button
            onClick={() => setActiveSubTab('TALLYPRIME')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'TALLYPRIME'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Commercial TallyPrime Adapter
          </button>
          <button
            onClick={() => setActiveSubTab('AUDIT')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'AUDIT'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Action feedback toast */}
        {actionMessage && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSubTab === 'BATCHES' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Batches List Sidebar */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Sync Batches</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleProposeBatch('BUILTIN_TALLY')}
                      disabled={loading}
                      className="px-2 py-1 text-[11px] rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition cursor-pointer flex items-center gap-1"
                      title="Propose from Built-in Tally"
                    >
                      + Built-in
                    </button>
                  </div>
                </div>

                {batches.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No sync batches created yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {batches.map(b => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBatch(b)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          selectedBatch?.id === b.id
                            ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                          <span>{b.id}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              b.status === 'APPLIED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : b.status === 'APPROVED'
                                ? 'bg-blue-500/20 text-blue-400'
                                : b.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                        <div className="mt-1 font-semibold text-slate-200">{b.source}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex justify-between">
                          <span>{b.recordCount} products</span>
                          <span>{new Date(b.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Batch Details */}
              <div className="md:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                {selectedBatch ? (
                  <>
                    <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white font-mono">{selectedBatch.id}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                            {selectedBatch.source}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Submitted by <span className="text-white font-medium">{selectedBatch.submittedBy?.name}</span> ({selectedBatch.submittedBy?.role}) at {new Date(selectedBatch.submittedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedBatch.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleDecideBatch('APPROVED')}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleDecideBatch('REJECTED')}
                              disabled={loading}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {selectedBatch.status === 'APPROVED' && (
                          <button
                            onClick={handleApplyBatch}
                            disabled={loading}
                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Apply Prices (Non-Retroactive)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dual Control Note */}
                    {selectedBatch.status === 'PENDING_APPROVAL' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-300 flex items-center gap-2">
                        <Lock className="w-4 h-4 flex-shrink-0" />
                        <span>
                          <strong>Dual-Control Requirement:</strong> Submitter cannot approve their own batch. An independent back-office reviewer must confirm price changes before catalog application.
                        </span>
                      </div>
                    )}

                    {/* Items Price Diff Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Proposed Price Diffs ({selectedBatch.items?.length || 0} items)
                      </h4>
                      <div className="border border-slate-800 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                            <tr>
                              <th className="p-2">Product Name</th>
                              <th className="p-2">SKU</th>
                              <th className="p-2 text-right">Current Base</th>
                              <th className="p-2 text-right text-emerald-400">Proposed Base</th>
                              <th className="p-2 text-right">Proposed MRP</th>
                              <th className="p-2 text-center">Diff</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {selectedBatch.items?.map((it: any, idx: number) => {
                              const diff = Number(it.proposedBasePrice) - Number(it.currentBasePrice);
                              return (
                                <tr key={idx} className="hover:bg-slate-800/30">
                                  <td className="p-2 font-sans font-medium text-slate-200">{it.sourceProductName}</td>
                                  <td className="p-2 text-slate-400">{it.distributorSku}</td>
                                  <td className="p-2 text-right text-slate-400">₹{it.currentBasePrice?.toLocaleString()}</td>
                                  <td className="p-2 text-right font-bold text-emerald-400">₹{it.proposedBasePrice?.toLocaleString()}</td>
                                  <td className="p-2 text-right text-slate-300">₹{it.proposedMrp?.toLocaleString()}</td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        diff > 0
                                          ? 'bg-emerald-500/10 text-emerald-400'
                                          : diff < 0
                                          ? 'bg-rose-500/10 text-rose-400'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : '0'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fingerprint & Safe Policy Notice */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 text-slate-400 font-mono text-[11px] space-y-1">
                      <div>Content Fingerprint (SHA-256): <span className="text-slate-300">{selectedBatch.contentFingerprint?.substring(0, 32)}...</span></div>
                      <div className="text-[10px] text-slate-500">
                        * Non-retroactive pricing policy guarantees confirmed orders and posted sales invoices remain strictly untouched.
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 py-12 text-center">Select a batch to inspect details and approvals.</p>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'TRANSFERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Bank Transfer Reconciliation Queue</h3>
                  <p className="text-xs text-slate-400">
                    Verify customer UTR reference numbers against bank statements before posting authoritative double-entry receipt vouchers.
                  </p>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Customer / Lab</th>
                      <th className="p-3">UTR Reference</th>
                      <th className="p-3">Bank Name</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.filter(p => p.paymentMethod === 'BANK_TRANSFER').length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No pending bank transfers in verification queue.
                        </td>
                      </tr>
                    ) : (
                      payments
                        .filter(p => p.paymentMethod === 'BANK_TRANSFER')
                        .map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="p-3 font-medium text-slate-200">
                              <div>{p.customerName}</div>
                              <div className="text-[10px] font-mono text-slate-400">{p.customerId}</div>
                            </td>
                            <td className="p-3 font-mono font-bold text-indigo-400">{p.bankReferenceNumber}</td>
                            <td className="p-3 text-slate-300">{p.bankName}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">₹{p.amount?.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.status === 'POSTED_TO_ACCOUNTING'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : p.status === 'REJECTED'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              {p.status === 'PENDING_VERIFICATION' && (
                                <>
                                  <button
                                    onClick={() => handleVerifyBankTransfer(p.id, 'APPROVE')}
                                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] cursor-pointer"
                                  >
                                    Verify & Post Receipt
                                  </button>
                                  <button
                                    onClick={() => handleVerifyBankTransfer(p.id, 'REJECT')}
                                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {p.status === 'POSTED_TO_ACCOUNTING' && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Voucher: {p.accountingVoucherNumber || 'Posted'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'TALLYPRIME' && (
            <div className="space-y-4 max-w-2xl bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Commercial TallyPrime Adapter Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Isolated adapter for commercial TallyPrime software. Non-negotiable safety guard: disabled by default.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Adapter Status:</span>
                  <button
                    onClick={() => handleToggleTallyPrime(!tallyConfig?.enabled)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                      tallyConfig?.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {tallyConfig?.enabled ? 'ENABLED (Local Mock Mode)' : 'DISABLED BY POLICY'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Company Context</div>
                  <div className="text-white font-bold mt-1">{tallyConfig?.companyName || 'A2Z Diagnostics Commercial Ltd'}</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px] uppercase">Integration Transport Format</div>
                  <div className="text-emerald-400 font-bold mt-1">{tallyConfig?.exportFormat || 'XML-over-HTTP'} & TallyPrime 7.0 JSON</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleProposeBatch('COMMERCIAL_TALLYPRIME')}
                  disabled={!tallyConfig?.enabled || loading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow"
                >
                  <RefreshCw className="w-4 h-4" /> Run Synthetic TallyPrime Offline Import
                </button>
                {!tallyConfig?.enabled && (
                  <p className="text-[11px] text-amber-400 mt-2">
                    * Enable the adapter above to run local synthetic import tests using mocked XML fixtures.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeSubTab === 'AUDIT' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Integration Audit Trail ({auditLogs.length} events, sensitive data redacted)
                </h3>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Actor</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Entity</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {auditLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/30">
                        <td className="p-2.5 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                        <td className="p-2.5 font-sans font-medium text-slate-200">
                          {l.actorName} <span className="text-[10px] text-slate-400">({l.actorRole})</span>
                        </td>
                        <td className="p-2.5 font-bold text-indigo-400">{l.action}</td>
                        <td className="p-2.5 text-slate-300">{l.entityType} ({l.entityId})</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              l.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : l.status === 'REJECTED'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans text-slate-300 truncate max-w-xs">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/60 text-xs text-slate-400">
          <span>DS Distributor &bull; Commercial Accounting Bridge</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
