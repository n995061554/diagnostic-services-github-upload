import React, { useState } from 'react';
import { UserRoleType } from '../types';
import { ProductImportView } from './ProductImportView';
import { CustomerImportView } from './CustomerImportView';
import { SpecialPricingImportView } from './SpecialPricingImportView';
import { EquipmentImportView } from './EquipmentImportView';
import { OpeningLedgerImportView } from './OpeningLedgerImportView';
import { SalesTargetImportView } from './SalesTargetImportView';
import {
  FileSpreadsheet,
  Boxes,
  Users,
  DollarSign,
  Wrench,
  Receipt,
  Target,
  ShieldCheck,
  DownloadCloud,
  Layers,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

interface EnterpriseImportHubViewProps {
  accessToken: string | null;
  currentRole: UserRoleType;
  onNavigateToCatalog?: () => void;
  onNavigateToUsers?: () => void;
}

export function EnterpriseImportHubView({
  accessToken,
  currentRole,
  onNavigateToCatalog,
  onNavigateToUsers,
}: EnterpriseImportHubViewProps) {
  const [selectedPhase, setSelectedPhase] = useState<
    'product' | 'customer' | 'pricing' | 'equipment' | 'ledger' | 'target'
  >('product');

  const modules = [
    {
      id: 'product' as const,
      categoryTag: 'Products',
      title: 'Product Master Import',
      subtitle: 'SKUs, OEM Brands, Categories, MRP, Cold Chain Specs',
      icon: Boxes,
      badgeColor: 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40',
      activeColor: 'bg-[#22381E] text-[#D2E7C4]',
      hoverBorder: 'hover:border-[#22381E]',
    },
    {
      id: 'customer' as const,
      categoryTag: 'Customers',
      title: 'Customer Master Import',
      subtitle: 'Diagnostic Labs, Hospitals, GSTIN, Addresses, Credit Limits',
      icon: Users,
      badgeColor: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40',
      activeColor: 'bg-[#22381E] text-[#D2E7C4]',
      hoverBorder: 'hover:border-[#22381E]',
    },
    {
      id: 'pricing' as const,
      categoryTag: 'Contracts',
      title: 'Special Price Contracts',
      subtitle: 'Customer Net Rates, Institutional Discounts, Effective Dates',
      icon: DollarSign,
      badgeColor: 'bg-[#D2E7C4] text-[#1E331B] border-[#5F8F4D]/40',
      activeColor: 'bg-[#22381E] text-[#D2E7C4]',
      hoverBorder: 'hover:border-[#22381E]',
    },
    {
      id: 'equipment' as const,
      categoryTag: 'Equipment',
      title: 'Installed Equipment Import',
      subtitle: 'Analyzers, Serial Numbers, Lab Mapping, Warranty/PM Dates',
      icon: Wrench,
      badgeColor: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40',
      activeColor: 'bg-[#22381E] text-[#D2E7C4]',
      hoverBorder: 'hover:border-[#22381E]',
    },
    {
      id: 'ledger' as const,
      categoryTag: 'Ledgers',
      title: 'Opening Ledger Import',
      subtitle: 'ERP Opening Balances, Invoice Aging, Overdue Receivables',
      icon: Receipt,
      badgeColor: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]/40',
      activeColor: 'bg-[#22381E] text-[#D2E7C4]',
      hoverBorder: 'hover:border-[#22381E]',
    },
    {
      id: 'target' as const,
      categoryTag: 'Targets',
      title: 'Sales Target Quotas',
      subtitle: 'Sales Rep Quotas, Monthly Milestones, Focus Brand Goals',
      icon: Target,
      badgeColor: 'bg-[#E4F1DC] text-[#1E331B] border-[#D2E7C4]',
      activeColor: 'bg-[#22381E] text-[#D2E7C4]',
      hoverBorder: 'hover:border-[#22381E]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Enterprise Suite Header */}
      <div className="bg-gradient-to-r from-[#1E331B] via-[#22381E] to-[#2E4B29] text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#2E4B29] relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D2E7C4]/20 border border-[#D2E7C4]/30 text-[#D2E7C4] text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#D2E7C4]" />
            Enterprise Data Migration & Controlled Excel Import Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F9FAF6]">
            Enterprise Master Data & Excel Import Engines
          </h1>
          <p className="text-sm text-[#E4F1DC]/90 leading-relaxed max-w-3xl">
            Controlled, multi-stage spreadsheet validation framework with transactional schema parsing,
            pre-import validation diagnostics, mathematical integrity enforcement, and immutable audit trails across all core entities.
          </p>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#D2E7C4]/10 to-transparent pointer-events-none" />
      </div>

      {/* Module Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {modules.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPhase === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#F5F6F0] border-[#22381E] ring-2 ring-[#D2E7C4] shadow-xs'
                  : 'bg-white border-[#D2E7C4] hover:border-[#22381E] hover:bg-[#E4F1DC]/20 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? p.activeColor : 'bg-[#E4E8DF] text-[#1E331B]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}
                  >
                    {p.categoryTag}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#1E331B] leading-tight truncate">{p.title}</div>
              </div>
              <div className="text-[10px] text-[#415439] line-clamp-2 mt-1.5 leading-snug">
                {p.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Module Component Stage */}
      <div>
        {selectedPhase === 'product' && (
          <ProductImportView
            accessToken={accessToken}
            currentRole={currentRole}
            onNavigateToCatalog={onNavigateToCatalog}
          />
        )}
        {selectedPhase === 'customer' && (
          <CustomerImportView
            accessToken={accessToken}
            currentRole={currentRole}
            onNavigateToUsers={onNavigateToUsers}
          />
        )}
        {selectedPhase === 'pricing' && (
          <SpecialPricingImportView
            accessToken={accessToken}
            currentRole={currentRole}
          />
        )}
        {selectedPhase === 'equipment' && (
          <EquipmentImportView
            accessToken={accessToken}
            currentRole={currentRole}
          />
        )}
        {selectedPhase === 'ledger' && (
          <OpeningLedgerImportView
            accessToken={accessToken}
            currentRole={currentRole}
          />
        )}
        {selectedPhase === 'target' && (
          <SalesTargetImportView
            accessToken={accessToken}
            currentRole={currentRole}
          />
        )}
      </div>
    </div>
  );
}
