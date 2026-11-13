import React, { useState } from 'react';
import {
  Receipt,
  LayoutDashboard,
  FolderTree,
  Scale,
  FileSpreadsheet,
  Building2,
  TrendingDown,
  Landmark,
  PieChart,
  ShieldCheck,
  Settings,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { User, UserRoleType } from '../../types';
import { AccountingDashboardTab } from './AccountingDashboardTab';
import { ChartOfAccountsTab } from './ChartOfAccountsTab';
import { VouchersListTab } from './VouchersListTab';
import { FinancialReportsTab } from './FinancialReportsTab';
import { BankReconciliationTab } from './BankReconciliationTab';
import { CashBankBookTab } from './CashBankBookTab';
import { InventoryValuationTab } from './InventoryValuationTab';
import { AuditPeriodClosingTab } from './AuditPeriodClosingTab';
import { AccountingSettingsTab } from './AccountingSettingsTab';
import { SalesInvoicesRegisterTab } from './SalesInvoicesRegisterTab';
import { SalesInvoiceCreateModal } from './SalesInvoiceCreateModal';
import { AccountingSyncManagementModal } from './AccountingSyncManagementModal';

export interface AccountingModuleHubProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  currentUser?: User | null;
  currentRole?: UserRoleType;
  token?: string | null;
}

export const AccountingModuleHub: React.FC<AccountingModuleHubProps> = ({
  currentTab,
  onNavigateTab,
  currentUser,
  currentRole,
  token
}) => {
  const [isSalesInvoiceCreateOpen, setIsSalesInvoiceCreateOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Top Financial Action Header Bar */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Authoritative Financial Accounting & Statements
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FY 2026-2027
              </span>
            </div>
            <p className="text-xs text-slate-400">
              A2Z Diagnostic Services India Pvt Ltd &bull; External Tally ERP 9 / TallyPrime is Primary Accounting Source of Truth
            </p>
          </div>
        </div>

        {/* Quick External Sync & Invoice Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => onNavigateTab('tally_integration')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow font-mono text-[11px]"
            title="External Tally ERP 9 / TallyPrime Integration & Sync Manager"
          >
            <RefreshCw className="w-3.5 h-3.5" /> External Tally Sync Manager
          </button>
          <button
            onClick={() => setIsSalesInvoiceCreateOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer flex items-center gap-1.5 font-mono text-[11px]"
            title="Sales Invoice (Product Billing)"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Create Sales Invoice
          </button>
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow font-mono text-[11px]"
            title="Accounting & Customer Lab Sync Hub"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Customer Sync Hub
          </button>
        </div>
      </div>

      {/* Main View Router */}
      <div>
        {/* 1. Accounting Dashboard */}
        {currentTab === 'acc_dashboard' && (
          <AccountingDashboardTab onNavigateTo={onNavigateTab} token={token} />
        )}

        {/* 2, 3, 4. Chart of Accounts & Ledgers */}
        {(currentTab === 'acc_coa' || currentTab === 'acc_ledger_groups' || currentTab === 'acc_ledger_accounts') && (
          <ChartOfAccountsTab token={token} onNavigateTo={onNavigateTab} />
        )}

        {/* 5, 6, 7, 8, 9, 10, 11, 12. Vouchers Register Views */}
        {currentTab === 'acc_voucher_entry' && (
          <VouchersListTab initialType="ALL" token={token} />
        )}
        {currentTab === 'acc_sales_invoices' && (
          <SalesInvoicesRegisterTab token={token} onNavigateTo={onNavigateTab} />
        )}
        {currentTab === 'acc_purchase_bills' && (
          <VouchersListTab initialType="PURCHASE_BILL" token={token} />
        )}
        {currentTab === 'acc_receipts' && (
          <VouchersListTab initialType="RECEIPT" token={token} />
        )}
        {currentTab === 'acc_payments' && (
          <VouchersListTab initialType="PAYMENT" token={token} />
        )}
        {currentTab === 'acc_journals' && (
          <VouchersListTab initialType="JOURNAL" token={token} />
        )}
        {currentTab === 'acc_contras' && (
          <VouchersListTab initialType="CONTRA" token={token} />
        )}
        {currentTab === 'acc_credit_debit_notes' && (
          <VouchersListTab initialType="CREDIT_NOTE" token={token} />
        )}

        {/* 13, 14. Receivables & Payables Ageing */}
        {currentTab === 'acc_customer_receivables' && (
          <FinancialReportsTab initialReport="receivables_aging" token={token} />
        )}
        {currentTab === 'acc_supplier_payables' && (
          <FinancialReportsTab initialReport="payables_aging" token={token} />
        )}

        {/* 15. Cash Book & Bank Book */}
        {currentTab === 'acc_cash_bank_book' && (
          <CashBankBookTab token={token} />
        )}

        {/* 16. Bank Reconciliation */}
        {currentTab === 'acc_bank_recon' && (
          <BankReconciliationTab token={token} />
        )}

        {/* 17. Inventory Valuation */}
        {currentTab === 'acc_inventory_valuation' && (
          <InventoryValuationTab token={token} />
        )}

        {/* 18. GST & Tax Reports */}
        {currentTab === 'acc_gst_tax_reports' && (
          <FinancialReportsTab initialReport="gst_summary" token={token} />
        )}

        {/* 19. Day Book & General Ledger */}
        {currentTab === 'acc_daybook_gl' && (
          <VouchersListTab initialType="ALL" token={token} />
        )}

        {/* 20. Trial Balance */}
        {currentTab === 'acc_trial_balance' && (
          <FinancialReportsTab initialReport="trial_balance" token={token} />
        )}

        {/* 21. Profit & Loss */}
        {currentTab === 'acc_profit_loss' && (
          <FinancialReportsTab initialReport="profit_loss" token={token} />
        )}

        {/* 22. Balance Sheet */}
        {currentTab === 'acc_balance_sheet' && (
          <FinancialReportsTab initialReport="balance_sheet" token={token} />
        )}

        {/* 23. Cash Flow */}
        {currentTab === 'acc_cash_flow' && (
          <FinancialReportsTab initialReport="profit_loss" token={token} />
        )}

        {/* 24. Audit Trail & Period Closing */}
        {currentTab === 'acc_audit_period_closing' && (
          <AuditPeriodClosingTab token={token} />
        )}

        {/* 25. Accounting Settings */}
        {currentTab === 'acc_settings' && (
          <AccountingSettingsTab token={token} />
        )}
      </div>

      {/* Dedicated Product-Based Sales Invoice Creation Modal (F8) */}
      <SalesInvoiceCreateModal
        isOpen={isSalesInvoiceCreateOpen}
        onClose={() => setIsSalesInvoiceCreateOpen(false)}
        onSuccess={() => {
          onNavigateTab('acc_sales_invoices');
        }}
        token={token}
      />

      {/* Back Office Accounting & Customer Lab Integration Modal */}
      <AccountingSyncManagementModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        token={token}
      />
    </div>
  );
};
