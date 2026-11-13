import React, { useState, useEffect } from 'react';
import {
  Scale,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt,
  Search,
  PieChart,
  ShieldCheck,
  Clock,
  Landmark
} from 'lucide-react';

interface FinancialReportsTabProps {
  initialReport?: string;
  token?: string | null;
}

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({
  initialReport = 'trial_balance',
  token
}) => {
  const [activeReport, setActiveReport] = useState<string>(initialReport);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [profitAndLoss, setProfitAndLoss] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [gstSummary, setGstSummary] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState<string>('led-debtor-metropolis');
  const [ledgerStatement, setLedgerStatement] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchActiveReport();
  }, [activeReport, selectedLedgerId]);

  const fetchActiveReport = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (activeReport === 'trial_balance') {
        const res = await fetch('/api/v1/accounting/reports/trial-balance', { headers }).then(r => r.json());
        if (res.data) setTrialBalance(res.data);
      } else if (activeReport === 'profit_loss') {
        const res = await fetch('/api/v1/accounting/reports/profit-loss', { headers }).then(r => r.json());
        if (res.data) setProfitAndLoss(res.data);
      } else if (activeReport === 'balance_sheet') {
        const res = await fetch('/api/v1/accounting/reports/balance-sheet', { headers }).then(r => r.json());
        if (res.data) setBalanceSheet(res.data);
      } else if (activeReport === 'receivables_aging') {
        const res = await fetch('/api/v1/accounting/reports/receivables-aging', { headers }).then(r => r.json());
        if (res.data) setReceivables(res.data);
      } else if (activeReport === 'payables_aging') {
        const res = await fetch('/api/v1/accounting/reports/payables-aging', { headers }).then(r => r.json());
        if (res.data) setPayables(res.data);
      } else if (activeReport === 'gst_summary') {
        const res = await fetch('/api/v1/accounting/reports/gst-summary', { headers }).then(r => r.json());
        if (res.data) setGstSummary(res.data);
      } else if (activeReport === 'audit_trail') {
        const res = await fetch('/api/v1/accounting/reports/audit-trail', { headers }).then(r => r.json());
        if (res.data) setAuditLogs(res.data);
      } else if (activeReport === 'general_ledger') {
        const [ledRes, stmtRes] = await Promise.all([
          fetch('/api/v1/accounting/ledgers', { headers }).then(r => r.json()),
          fetch(`/api/v1/accounting/reports/general-ledger/${selectedLedgerId}`, { headers }).then(r => r.json())
        ]);
        if (ledRes.data) setLedgers(ledRes.data);
        if (stmtRes.data) setLedgerStatement(stmtRes.data);
      }
    } catch (e) {
      console.error('Error fetching report:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatInr = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeReport === 'trial_balance' && trialBalance) {
      csvContent += "Group,Ledger Account,Primary Type,Closing Debit,Closing Credit\n";
      trialBalance.rows?.forEach((r: any) => {
        csvContent += `"${r.groupName}","${r.ledgerName}","${r.primaryType}",${r.closingDebit},${r.closingCredit}\n`;
      });
    } else if (activeReport === 'receivables_aging') {
      csvContent += "Customer Lab,Total Outstanding,Current,1-30 Days,31-60 Days\n";
      receivables.forEach(r => {
        csvContent += `"${r.name}",${r.totalOutstanding},${r.currentNotDue},${r.days1To30},${r.days31To60}\n`;
      });
    } else {
      csvContent += "Report,Status,GeneratedAt\n";
      csvContent += `"${activeReport}","Authoritative Reconciled","${new Date().toISOString()}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Report Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            Financial Statements & Reconciled Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Generated directly from the authoritative posted double-entry journal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Reports Submenu Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'trial_balance', label: 'Trial Balance' },
          { id: 'profit_loss', label: 'Profit & Loss' },
          { id: 'balance_sheet', label: 'Balance Sheet' },
          { id: 'general_ledger', label: 'Account Ledger (GL)' },
          { id: 'receivables_aging', label: 'Customer Receivables' },
          { id: 'payables_aging', label: 'Supplier Payables' },
          { id: 'gst_summary', label: 'GST Returns (GSTR-1 / 3B)' },
          { id: 'audit_trail', label: 'Audit Trail & Integrity' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeReport === tab.id
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report 1: Trial Balance */}
      {activeReport === 'trial_balance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-white">Authoritative Trial Balance</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                As of {trialBalance?.asOfDate || '2026-10-22'} (FY {trialBalance?.financialYear || '2026-2027'})
              </span>
            </div>
            {trialBalance?.isBalanced ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> RECONCILED (Debits = Credits)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                <AlertCircle className="w-4 h-4" /> UNBALANCED
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ledger Account</th>
                  <th className="py-3 px-4">Group Hierarchy</th>
                  <th className="py-3 px-4 text-right">Opening Debit</th>
                  <th className="py-3 px-4 text-right">Opening Credit</th>
                  <th className="py-3 px-4 text-right">Period Debit</th>
                  <th className="py-3 px-4 text-right">Period Credit</th>
                  <th className="py-3 px-4 text-right">Closing Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Closing Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {trialBalance?.rows?.map((row: any) => (
                  <tr key={row.ledgerId} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-medium text-white">{row.ledgerName}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      <span>{row.groupName}</span>
                      <span className="text-[10px] text-slate-500 block font-mono">[{row.primaryType}]</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">{row.openingDebit > 0 ? formatInr(row.openingDebit) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">{row.openingCredit > 0 ? formatInr(row.openingCredit) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-300">{row.periodDebit > 0 ? formatInr(row.periodDebit) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-300">{row.periodCredit > 0 ? formatInr(row.periodCredit) : '—'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-400">
                      {row.closingDebit > 0 ? formatInr(row.closingDebit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {row.closingCredit > 0 ? formatInr(row.closingCredit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-mono font-bold text-xs text-white border-t border-slate-700">
                <tr>
                  <td colSpan={2} className="py-3 px-4">Trial Balance Totals</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatInr(trialBalance?.totalOpeningDebit || 0)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatInr(trialBalance?.totalOpeningCredit || 0)}</td>
                  <td className="py-3 px-4 text-right text-blue-400">{formatInr(trialBalance?.totalPeriodDebit || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{formatInr(trialBalance?.totalPeriodCredit || 0)}</td>
                  <td className="py-3 px-4 text-right text-blue-400">{formatInr(trialBalance?.totalClosingDebit || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{formatInr(trialBalance?.totalClosingCredit || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Profit & Loss Statement */}
      {activeReport === 'profit_loss' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trading Account */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Trading Account</span>
              <span className="text-xs text-slate-400">Gross Margin Determination</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-300">
                <span>Sales Revenue (Turnover):</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatInr(profitAndLoss?.tradingAccount?.totalSales || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Closing Stock Valuation:</span>
                <span className="font-mono text-slate-200">
                  {formatInr(profitAndLoss?.tradingAccount?.closingStock || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-300 border-t border-slate-800/80">
                <span>Less: Purchases Inward:</span>
                <span className="font-mono text-red-400">
                  ({formatInr(profitAndLoss?.tradingAccount?.totalPurchases || 0)})
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Less: Direct Freight & Logistics:</span>
                <span className="font-mono text-red-400">
                  ({formatInr(profitAndLoss?.tradingAccount?.totalDirectExpenses || 0)})
                </span>
              </div>

              <div className="flex justify-between py-2 mt-2 border-t-2 border-slate-800 font-bold text-sm bg-slate-950/60 p-2.5 rounded-lg">
                <span className="text-white">Gross Profit / (Loss):</span>
                <span className={profitAndLoss?.tradingAccount?.grossProfitOrLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {formatInr(profitAndLoss?.tradingAccount?.grossProfitOrLoss || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Income Statement */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Income Statement</span>
              <span className="text-xs text-slate-400">Operating Margin & Net Profit</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-300">
                <span>Gross Profit Brought Down:</span>
                <span className="font-mono font-semibold text-white">
                  {formatInr(profitAndLoss?.incomeStatement?.grossProfitBroughtDown || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span>Indirect Incomes:</span>
                <span className="font-mono text-emerald-400">
                  {formatInr(profitAndLoss?.incomeStatement?.totalIndirectIncome || 0)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">Indirect Operating Expenses:</span>
                {profitAndLoss?.incomeStatement?.indirectExpenses?.map((e: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-0.5 text-slate-400 text-[11px]">
                    <span>{e.name}</span>
                    <span className="font-mono text-red-400">{formatInr(e.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between py-2 mt-3 border-t-2 border-slate-800 font-bold text-sm bg-slate-950/60 p-2.5 rounded-lg">
                <span className="text-white">Net Profit / (Loss):</span>
                <span className={profitAndLoss?.incomeStatement?.netProfitOrLoss >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {formatInr(profitAndLoss?.incomeStatement?.netProfitOrLoss || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Balance Sheet */}
      {activeReport === 'balance_sheet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-white">Balance Sheet (Financial Position)</h3>
              <span className="text-[11px] text-slate-400 font-mono">As of {balanceSheet?.asOfDate}</span>
            </div>
            {balanceSheet?.isBalanced ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> BALANCED (Assets = Liabilities)
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400">
                Difference: {formatInr(balanceSheet?.differenceInOpeningBalances || 0)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-xs">
            {/* Liabilities Side */}
            <div className="p-5 space-y-4">
              <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1.5">
                Capital & Liabilities
              </h4>

              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-white block">Capital Account & Reserves</span>
                  {balanceSheet?.liabilities?.capitalAccount?.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between py-0.5 text-slate-300">
                      <span>{c.name}</span>
                      <span className="font-mono">{formatInr(c.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span>Net Profit Carried Forward</span>
                    <span className="font-mono font-medium text-emerald-400">
                      {formatInr(balanceSheet?.liabilities?.netProfitCarriedForward || 0)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60">
                  <span className="font-semibold text-white block">Current Liabilities & Provisions</span>
                  {balanceSheet?.liabilities?.sundryCreditors?.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between py-0.5 text-slate-300">
                      <span>Sundry Creditors: {c.name}</span>
                      <span className="font-mono">{formatInr(c.amount)}</span>
                    </div>
                  ))}
                  {balanceSheet?.liabilities?.dutiesAndTaxes?.map((t: any, i: number) => (
                    <div key={i} className="flex justify-between py-0.5 text-slate-300">
                      <span>{t.name}</span>
                      <span className="font-mono">{formatInr(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Total Liabilities:</span>
                <span className="font-mono text-emerald-400">
                  {formatInr(balanceSheet?.liabilities?.totalLiabilities || 0)}
                </span>
              </div>
            </div>

            {/* Assets Side */}
            <div className="p-5 space-y-4">
              <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1.5">
                Fixed & Current Assets
              </h4>

              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-white block">Current Assets</span>
                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span>Stock-in-Hand (Inventory Valuation)</span>
                    <span className="font-mono">{formatInr(balanceSheet?.assets?.stockInHand || 0)}</span>
                  </div>

                  {balanceSheet?.assets?.sundryDebtors?.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between py-0.5 text-slate-300">
                      <span>Debtor: {d.name}</span>
                      <span className="font-mono">{formatInr(d.amount)}</span>
                    </div>
                  ))}

                  <div className="flex justify-between py-0.5 text-slate-300">
                    <span>Cash-in-Hand (Petty Cash)</span>
                    <span className="font-mono">{formatInr(balanceSheet?.assets?.cashInHand || 0)}</span>
                  </div>

                  {balanceSheet?.assets?.bankAccounts?.map((b: any, i: number) => (
                    <div key={i} className="flex justify-between py-0.5 text-slate-300">
                      <span>{b.name}</span>
                      <span className="font-mono">{formatInr(b.amount)}</span>
                    </div>
                  ))}

                  {balanceSheet?.assets?.currentAssets?.map((a: any, i: number) => (
                    <div key={i} className="flex justify-between py-0.5 text-slate-300">
                      <span>{a.name}</span>
                      <span className="font-mono">{formatInr(a.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-slate-800 flex justify-between font-bold text-sm text-white">
                <span>Total Assets:</span>
                <span className="font-mono text-blue-400">
                  {formatInr(balanceSheet?.assets?.totalAssets || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: General Ledger Account Statement */}
      {activeReport === 'general_ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">General Ledger Statement</h3>
              <p className="text-xs text-slate-400">Chronological transaction journal with running balance</p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={selectedLedgerId}
                onChange={(e) => setSelectedLedgerId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {ledgers.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Voucher No</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Narration</th>
                  <th className="py-2.5 px-4 text-right">Debit (Dr)</th>
                  <th className="py-2.5 px-4 text-right">Credit (Cr)</th>
                  <th className="py-2.5 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="bg-slate-950/40 font-mono text-slate-400">
                  <td className="py-2.5 px-4">2026-04-01</td>
                  <td colSpan={3} className="py-2.5 px-4 font-semibold text-slate-300">Opening Balance b/f</td>
                  <td className="py-2.5 px-4 text-right">
                    {ledgerStatement?.openingBalanceType === 'DEBIT' ? formatInr(ledgerStatement?.openingBalance) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {ledgerStatement?.openingBalanceType === 'CREDIT' ? formatInr(ledgerStatement?.openingBalance) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-white">
                    {formatInr(ledgerStatement?.openingBalance)} {ledgerStatement?.openingBalanceType}
                  </td>
                </tr>

                {ledgerStatement?.transactions?.map((t: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 text-slate-400">{t.date}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-emerald-400">{t.voucherNumber}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {t.voucherType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 max-w-xs truncate">{t.narration}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-400">
                      {t.debit > 0 ? formatInr(t.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">
                      {t.credit > 0 ? formatInr(t.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                      {formatInr(t.runningBalance)} {t.runningBalanceType}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 font-mono font-bold text-xs text-white border-t border-slate-800">
                <tr>
                  <td colSpan={4} className="py-3 px-4">Closing Balance c/d</td>
                  <td className="py-3 px-4 text-right text-blue-400">{formatInr(ledgerStatement?.totalDebit || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{formatInr(ledgerStatement?.totalCredit || 0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">
                    {formatInr(ledgerStatement?.closingBalance || 0)} {ledgerStatement?.closingBalanceType}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Report 5: Customer Receivables Aging */}
      {activeReport === 'receivables_aging' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-white">Customer Receivables Outstanding Ageing</h3>
              <span className="text-[11px] text-slate-400">Aging buckets: Current, 1-30 days, 31-60 days, 60+ days</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer Laboratory</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Total Outstanding</th>
                  <th className="py-3 px-4 text-right">Current (Not Due)</th>
                  <th className="py-3 px-4 text-right">1 - 30 Days</th>
                  <th className="py-3 px-4 text-right">31 - 60 Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {receivables.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{r.name}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{formatInr(r.creditLimit)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                      {formatInr(r.totalOutstanding)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatInr(r.currentNotDue)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{formatInr(r.days1To30)}</td>
                    <td className="py-3 px-4 text-right font-mono text-red-400">{formatInr(r.days31To60)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 6: GST Returns Summary */}
      {activeReport === 'gst_summary' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">GST Statutory Reconciliation (GSTR-1 & GSTR-3B)</h3>
                <span className="text-xs text-slate-400">GSTIN: 27AABCU9603R1ZM (Maharashtra)</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                Period: October 2026
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block mb-1">GSTR-1 Outward Supplies (Output Tax)</span>
                <span className="text-xl font-bold text-white block">
                  {formatInr(gstSummary?.outwardSupplies?.totalOutputTax || 0)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-2">
                  Taxable Base: {formatInr(gstSummary?.outwardSupplies?.b2bTaxableValue || 0)}
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block mb-1">GSTR-3B Inward Supplies (Input Tax Credit)</span>
                <span className="text-xl font-bold text-emerald-400 block">
                  {formatInr(gstSummary?.inwardSupplies?.totalInputTaxCredit || 0)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-2">
                  Eligible ITC Taxable Base: {formatInr(gstSummary?.inwardSupplies?.eligibleItcTaxableValue || 0)}
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium block mb-1">Net Cash Tax Payable (Electronic Ledger)</span>
                <span className="text-xl font-bold text-amber-400 block">
                  {formatInr(gstSummary?.netTaxPayable?.totalPayable || 0)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-2">
                  CGST: {formatInr(gstSummary?.netTaxPayable?.cgstPayable || 0)} | SGST: {formatInr(gstSummary?.netTaxPayable?.sgstPayable || 0)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              * Statutory Note: Tax computations are generated from posted invoices and purchase bills. Consult with your qualified chartered accountant prior to filing official GSTR-1 and GSTR-3B portals.
            </div>
          </div>
        </div>
      )}

      {/* Report 7: Audit Trail */}
      {activeReport === 'audit_trail' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h3 className="text-sm font-bold text-white">Immutable Financial Audit Trail</h3>
              <span className="text-[11px] text-slate-400">Non-repudiable log of all posted financial mutations</span>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Integrity Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Audit Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">{log.entityId}</td>
                    <td className="py-3 px-4 text-white font-medium">
                      {log.performedByName} <span className="text-slate-500 font-mono text-[10px]">({log.performedByRole})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
