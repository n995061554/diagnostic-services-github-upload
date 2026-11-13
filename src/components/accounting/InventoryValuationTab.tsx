import React, { useState, useEffect } from 'react';
import {
  Package,
  Scale,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Building2,
  Download
} from 'lucide-react';

interface InventoryValuationTabProps {
  token?: string | null;
}

export const InventoryValuationTab: React.FC<InventoryValuationTabProps> = ({ token }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [inventoryLedgerBalance, setInventoryLedgerBalance] = useState<number>(3200000);
  const [loading, setLoading] = useState<boolean>(false);

  // Sample Lot-Level Diagnostic Reagents Inventory Valuation Rows
  const inventoryLots = [
    {
      sku: 'RO-E411-TSH-100',
      productName: 'Elecsys TSH (100 Tests)',
      company: 'Roche Diagnostics',
      batchNumber: 'LOT-RO-9912',
      expiryDate: '2027-08-31',
      quantity: 116,
      unitCost: 8500,
      totalValuation: 986000,
      isColdChain: true,
      storageLocation: 'Cold Room #1 (2-8°C)'
    },
    {
      sku: 'SY-XN-DCL-20L',
      productName: 'Sysmex Cellpack DCL (20L Diluent)',
      company: 'Sysmex India',
      batchNumber: 'LOT-SY-3310',
      expiryDate: '2028-02-28',
      quantity: 94,
      unitCost: 7200,
      totalValuation: 676800,
      isColdChain: false,
      storageLocation: 'Warehouse Bay 3A'
    },
    {
      sku: 'AB-CREAT-ENZ-200',
      productName: 'Architect Creatinine Enzymatic (200 Tests)',
      company: 'Abbott Healthcare',
      batchNumber: 'LOT-AB-7740',
      expiryDate: '2027-11-30',
      quantity: 75,
      unitCost: 11200,
      totalValuation: 840000,
      isColdChain: true,
      storageLocation: 'Cold Room #2 (2-8°C)'
    },
    {
      sku: 'RO-HBA1C-GEN3-200',
      productName: 'Cobas HbA1c Gen.3 Reagent Kit',
      company: 'Roche Diagnostics',
      batchNumber: 'LOT-RO-8824',
      expiryDate: '2027-06-30',
      quantity: 50,
      unitCost: 13944,
      totalValuation: 697200,
      isColdChain: true,
      storageLocation: 'Cold Room #1 (2-8°C)'
    }
  ];

  const totalLotValuation = inventoryLots.reduce((sum, item) => sum + item.totalValuation, 0);
  const discrepancy = Math.abs(totalLotValuation - inventoryLedgerBalance);
  const isReconciled = discrepancy < 100;

  const formatInr = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const filteredLots = inventoryLots.filter(l =>
    l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            Stock Inventory Valuation & Reconciliation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical batch lots reconciled against General Ledger account Stock-in-Hand (`led-stock-inventory`).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isReconciled ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Physical = Ledger Reconciled
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" /> Discrepancy: {formatInr(discrepancy)}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Total Stock Lot Valuation</span>
          <span className="text-2xl font-bold text-white tracking-tight font-mono">{formatInr(totalLotValuation)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Calculated via Batch FIFO Valuation</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">General Ledger Asset Balance</span>
          <span className="text-2xl font-bold text-blue-400 tracking-tight font-mono">{formatInr(inventoryLedgerBalance)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Authoritative Stock-in-Hand Balance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Cold-Chain Reagents Share</span>
          <span className="text-2xl font-bold text-cyan-400 tracking-tight font-mono">
            {formatInr(inventoryLots.filter(l => l.isColdChain).reduce((s, l) => s + l.totalValuation, 0))}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Stored at 2-8°C with IoT Telemetry</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by product, SKU, lot number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Inventory Lots Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name & OEM</th>
                <th className="py-3 px-4">Batch Lot Number</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Cold-Chain</th>
                <th className="py-3 px-4 text-right">Available Qty</th>
                <th className="py-3 px-4 text-right">Unit Cost (₹)</th>
                <th className="py-3 px-4 text-right">Total Valuation (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLots.map((lot, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-emerald-400">{lot.sku}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{lot.productName}</span>
                    <span className="text-[10px] text-slate-400">{lot.company}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-300">{lot.batchNumber}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{lot.expiryDate}</td>
                  <td className="py-3 px-4 text-center">
                    {lot.isColdChain ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                        2-8°C Cold Room
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-800">
                        Ambient
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">{lot.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">{formatInr(lot.unitCost)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatInr(lot.totalValuation)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950 font-mono font-bold text-xs text-white border-t border-slate-800">
              <tr>
                <td colSpan={7} className="py-3 px-4">Closing Stock Inventory Valuation</td>
                <td className="py-3 px-4 text-right text-emerald-400">{formatInr(totalLotValuation)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
