import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Send, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Wrench, 
  Cpu, 
  Check, 
  Copy, 
  ExternalLink,
  CreditCard,
  Building2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { EquipmentItem, ReagentProduct, OutstandingInvoice, formatINR } from './mobileMockData';

// ----------------------------------------------------------------------
// 1. EQUIPMENT DETAILS MODAL (STRICTLY NO PRICES!)
// ----------------------------------------------------------------------
interface EquipmentDetailsModalProps {
  equipment: EquipmentItem | null;
  onClose: () => void;
  onOpenInquiry: (eq: EquipmentItem) => void;
  onDownloadBrochure: (eq: EquipmentItem) => void;
  onRaiseServiceRequest: (eq: EquipmentItem) => void;
  onAddToCartReagent?: (reagent: ReagentProduct) => void;
  allReagents: ReagentProduct[];
}

export const EquipmentDetailsModal: React.FC<EquipmentDetailsModalProps> = ({
  equipment,
  onClose,
  onOpenInquiry,
  onDownloadBrochure,
  onRaiseServiceRequest,
  onAddToCartReagent,
  allReagents
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'reagents' | 'service'>('specs');
  if (!equipment) return null;

  const compatibleReagents = allReagents.filter(r => 
    equipment.compatibleReagentIds.includes(r.id) || 
    (r.compatibleAnalyzers && r.compatibleAnalyzers.some(a => a.toLowerCase().includes(equipment.name.toLowerCase()) || equipment.name.toLowerCase().includes(a.toLowerCase())))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5]">
        
        {/* Header Bar - Navy Blue Theme */}
        <div className="p-4 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D0DEE5]/20 border border-[#D0DEE5]/30 flex items-center justify-center text-[#D0DEE5] font-bold text-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-[#D0DEE5] font-bold uppercase tracking-wider">{equipment.companyName}</div>
              <h3 className="text-sm font-extrabold text-white truncate max-w-[260px]">{equipment.name}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#15253F] hover:bg-[#2B3D5B] text-[#D0DEE5] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-[#0E1035] text-xs bg-slate-50/60">
          {/* Hero Image & Model */}
          <div className="bg-white rounded-2xl p-4 border border-[#D0DEE5] flex flex-col items-center text-center relative overflow-hidden shadow-2xs">
            <img 
              src={equipment.imageUrl} 
              alt={equipment.name} 
              className="w-48 h-36 object-contain rounded-xl drop-shadow-md mb-2"
            />
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0E1035] bg-[#D0DEE5]/50 px-2.5 py-0.5 rounded-full border border-[#D0DEE5] mb-1">
              Model: {equipment.modelNumber}
            </div>
            <p className="text-[11px] text-[#7C8594] max-w-sm mt-1 leading-relaxed">
              {equipment.keySpecs}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-[#7C8594] border border-[#D0DEE5]">
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'specs' ? 'bg-white text-[#0E1035] shadow-2xs font-extrabold border border-[#D0DEE5]' : 'hover:text-[#0E1035]'
              }`}
            >
              Technical Specs
            </button>
            <button
              onClick={() => setActiveTab('reagents')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'reagents' ? 'bg-white text-[#0E1035] shadow-2xs font-extrabold border border-[#D0DEE5]' : 'hover:text-[#0E1035]'
              }`}
            >
              Compatible Reagents ({compatibleReagents.length})
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'service' ? 'bg-white text-[#0E1035] shadow-2xs font-extrabold border border-[#D0DEE5]' : 'hover:text-[#0E1035]'
              }`}
            >
              Service & Warranty
            </button>
          </div>

          {/* TAB 1: SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-[#D0DEE5]">
                  <div className="text-[10px] text-[#7C8594] font-bold uppercase">Throughput</div>
                  <div className="font-extrabold text-[#0E1035] mt-0.5">{equipment.throughput}</div>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#D0DEE5]">
                  <div className="text-[10px] text-[#7C8594] font-bold uppercase">Sample Capacity</div>
                  <div className="font-extrabold text-[#0E1035] mt-0.5">{equipment.sampleCapacity}</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D0DEE5] space-y-1">
                <div className="text-[10px] text-[#7C8594] font-bold uppercase">Technology / Methodology</div>
                <div className="font-bold text-[#0E1035]">{equipment.technologyMethod}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D0DEE5] space-y-1">
                <div className="text-[10px] text-[#7C8594] font-bold uppercase">Clinical Applications</div>
                <div className="font-medium text-[#2B3D5B]">{equipment.applications}</div>
              </div>

              {/* Strict Rule: NO PRICE INFORMATION */}
              <div className="p-3 bg-[#D0DEE5]/40 border border-[#D0DEE5] rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0E1035] flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#0E1035]">
                  <span className="font-bold">Institutional Capital Procurement:</span> This analyzer is provided on direct purchase, reagent rental lease, or placement contract. Request a customized institutional proposal below.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPATIBLE REAGENTS */}
          {activeTab === 'reagents' && (
            <div className="space-y-2">
              <div className="text-[11px] text-[#7C8594] flex justify-between items-center">
                <span>Validated Reagents for {equipment.modelNumber}:</span>
                <span className="text-[10px] font-bold text-[#0E1035]">{compatibleReagents.length} Found</span>
              </div>
              {compatibleReagents.length === 0 ? (
                <div className="p-4 bg-white rounded-xl border border-[#D0DEE5] text-center text-[#7C8594]">
                  No direct SKU matches in current filter. All OEM {equipment.companyName} cartridges are fully compatible.
                </div>
              ) : (
                compatibleReagents.map(reagent => (
                  <div 
                    key={reagent.id}
                    className="p-3 bg-white rounded-xl border border-[#D0DEE5] flex items-center justify-between gap-3 shadow-2xs hover:border-[#0E1035] transition"
                  >
                    <img src={reagent.imageUrl} alt="" className="w-10 h-10 object-contain rounded bg-slate-50 p-1 border border-[#D0DEE5]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#0E1035] truncate">{reagent.name}</div>
                      <div className="text-[10px] text-[#7C8594]">Pack: {reagent.packSize} &bull; {reagent.storageTemp}</div>
                      <div className="font-mono font-bold text-[#0E1035] text-xs mt-0.5">
                        ₹{formatINR(reagent.customerNetPrice)} <span className="text-[9px] text-[#7C8594] line-through">₹{formatINR(reagent.mrp)}</span>
                      </div>
                    </div>
                    {onAddToCartReagent && (
                      <button
                        onClick={() => onAddToCartReagent(reagent)}
                        className="px-2.5 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Package className="w-3 h-3" />
                        Add
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: SERVICE & WARRANTY */}
          {activeTab === 'service' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#D0DEE5]/40 border border-[#D0DEE5] rounded-xl space-y-1">
                <div className="text-[10px] text-[#7C8594] font-bold uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0E1035]" />
                  Warranty & Contract Status
                </div>
                <div className="font-bold text-[#0E1035] text-xs">{equipment.warrantyService}</div>
              </div>

              {equipment.serialNumber && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-[#D0DEE5]">
                    <div className="text-[10px] text-[#7C8594] font-bold uppercase">Serial Number</div>
                    <div className="font-mono font-bold text-[#0E1035] mt-0.5">{equipment.serialNumber}</div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#D0DEE5]">
                    <div className="text-[10px] text-[#7C8594] font-bold uppercase">Installation Date</div>
                    <div className="font-bold text-[#0E1035] mt-0.5">{equipment.installationDate || 'Verified'}</div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-white rounded-xl border border-[#D0DEE5] space-y-2">
                <div className="text-[11px] font-bold text-[#0E1035] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#2B3D5B]" />
                  Preventive Maintenance (PM) Schedule
                </div>
                <div className="text-[10px] text-[#7C8594] flex items-center justify-between">
                  <span>Last Service Visit:</span>
                  <span className="font-semibold text-[#0E1035]">{equipment.lastServiceDate || '12 Aug 2024'}</span>
                </div>
                <div className="text-[10px] text-[#7C8594] flex items-center justify-between">
                  <span>Next Calibration Due:</span>
                  <span className="font-semibold text-[#15253F] bg-[#D0DEE5] px-1.5 py-0.5 rounded">{equipment.nextPmDueDate || '15 Nov 2024'}</span>
                </div>
              </div>

              <button
                onClick={() => onRaiseServiceRequest(equipment)}
                className="w-full py-2 bg-[#2B3D5B] hover:bg-[#15253F] text-white border border-[#15253F] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                Raise Service or Calibration Request
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions (Inquiry & Download Brochure) */}
        <div className="p-4 bg-white border-t border-[#D0DEE5] flex items-center gap-2.5">
          <button
            onClick={() => onDownloadBrochure(equipment)}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-[#D0DEE5] text-[#0E1035] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#0E1035]" />
            Download Brochure
          </button>
          <button
            onClick={() => onOpenInquiry(equipment)}
            className="flex-1 py-2.5 px-3 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
            Inquiry
          </button>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. EQUIPMENT INQUIRY MODAL
// ----------------------------------------------------------------------
interface EquipmentInquiryModalProps {
  equipment: EquipmentItem | null;
  customerName: string;
  onClose: () => void;
  onSubmitSuccess: (msg: string) => void;
}

export const EquipmentInquiryModal: React.FC<EquipmentInquiryModalProps> = ({
  equipment,
  customerName,
  onClose,
  onSubmitSuccess
}) => {
  const [inquiryType, setInquiryType] = useState<'BUY' | 'RENTAL' | 'REAGENT_RENTAL' | 'AMC'>('BUY');
  const [contactPerson, setContactPerson] = useState<string>('Dr. Rajesh Verma (Lab Director)');
  const [phone, setPhone] = useState<string>('+91 98201 44892');
  const [notes, setNotes] = useState<string>('Please provide institutional pricing, reagent tie-up terms, and delivery lead time.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!equipment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess(`Inquiry for ${equipment.name} submitted successfully! Our diagnostic instrument specialist will contact you shortly.`);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#D0DEE5]">
        <div className="p-4 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F]">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[#D0DEE5]" />
            <h3 className="text-sm font-bold text-white">Equipment Procurement Inquiry</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#15253F] text-[#D0DEE5] hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-[#0E1035] bg-slate-50/60">
          <div className="p-3 bg-white border border-[#D0DEE5] rounded-xl flex items-center gap-3 shadow-2xs">
            <img src={equipment.imageUrl} alt="" className="w-12 h-12 object-contain rounded-lg bg-slate-50 p-1 border border-[#D0DEE5]" />
            <div>
              <div className="text-[10px] text-[#0E1035] font-bold uppercase">{equipment.companyName}</div>
              <div className="font-extrabold text-[#0E1035] text-xs">{equipment.name}</div>
              <div className="text-[10px] text-[#7C8594]">Model: {equipment.modelNumber}</div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">
              Procurement Model
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'BUY', label: 'Outright Purchase' },
                { id: 'REAGENT_RENTAL', label: 'Reagent Rental (CPR)' },
                { id: 'RENTAL', label: 'Equipment Lease' },
                { id: 'AMC', label: 'Annual Maintenance (CMC)' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setInquiryType(opt.id as any)}
                  className={`p-2 rounded-xl text-left font-bold transition text-xs border cursor-pointer ${
                    inquiryType === opt.id 
                      ? 'bg-[#D0DEE5]/60 border-[#0E1035] text-[#0E1035] shadow-2xs' 
                      : 'bg-white border-[#D0DEE5] text-[#7C8594] hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">Contact Person</label>
              <input 
                type="text" 
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs text-[#0E1035] focus:outline-hidden focus:ring-1 focus:ring-[#0E1035]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">Contact Phone</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs text-[#0E1035] focus:outline-hidden focus:ring-1 focus:ring-[#0E1035]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">Specific Requirements / Test Volume</label>
            <textarea 
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs text-[#0E1035] focus:outline-hidden focus:ring-1 focus:ring-[#0E1035]"
            />
          </div>

          <div className="p-3 bg-[#D0DEE5]/40 border border-[#D0DEE5] rounded-xl text-[10px] text-[#0E1035] flex items-center justify-between">
            <span className="font-semibold">Requesting Lab:</span>
            <span className="font-bold">{customerName}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D0DEE5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-[#D0DEE5] text-[#0E1035] font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. PAYMENT FOR OLD ORDERS MODAL
// ----------------------------------------------------------------------
interface PaymentModalProps {
  invoices: OutstandingInvoice[];
  onClose: () => void;
  onPaymentSuccess: (invoiceIds: string[], amount: number, method: string) => void;
}

export const PaymentForOldOrdersModal: React.FC<PaymentModalProps> = ({
  invoices,
  onClose,
  onPaymentSuccess
}) => {
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(invoices.map(i => i.id));
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'GATEWAY' | 'ADVANCE' | 'CARD'>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const totalSelectedAmount = invoices
    .filter(i => selectedInvoiceIds.includes(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePayNow = () => {
    if (selectedInvoiceIds.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsConfirmed(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5]">
        
        {/* Header - Navy Blue Theme */}
        <div className="p-4 bg-[#0E1035] text-white flex items-center justify-between border-b border-[#15253F]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D0DEE5]" />
            <h3 className="text-sm font-bold text-white">Settlement for Historical Orders</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#15253F] text-[#D0DEE5] hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isConfirmed ? (
          /* Confirmation Receipt */
          <div className="p-6 text-center space-y-4 bg-slate-50">
            <div className="w-16 h-16 bg-[#D0DEE5] text-[#0E1035] rounded-full flex items-center justify-center mx-auto shadow-inner border border-[#2B3D5B]/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#0E1035]">Payment Completed!</h2>
              <p className="text-xs text-[#7C8594] mt-1">
                Transaction ID: TXN-{Math.floor(100000 + Math.random() * 900000)}
              </p>
            </div>
            <div className="p-4 bg-white border border-[#D0DEE5] rounded-2xl text-left text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between">
                <span className="text-[#7C8594]">Amount Paid:</span>
                <span className="font-mono font-black text-[#0E1035] text-sm">₹{formatINR(totalSelectedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8594]">Settled Invoices:</span>
                <span className="font-bold text-[#0E1035]">{selectedInvoiceIds.length} Invoices</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8594]">Method:</span>
                <span className="font-bold text-[#0E1035]">{paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7C8594]">Status:</span>
                <span className="text-[#0E1035] font-bold bg-[#D0DEE5] px-1.5 py-0.5 rounded">Ledger Reconciled</span>
              </div>
            </div>
            <button
              onClick={() => {
                onPaymentSuccess(selectedInvoiceIds, totalSelectedAmount, paymentMethod);
                onClose();
              }}
              className="w-full py-2.5 bg-[#0E1035] hover:bg-[#15253F] text-[#D0DEE5] rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Done & Update Ledger
            </button>
          </div>
        ) : (
          /* Selection & Payment Screen */
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-[#0E1035] bg-slate-50/60">
            {/* Summary Banner */}
            <div className="p-3.5 bg-[#D0DEE5]/50 border border-[#D0DEE5] rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#0E1035] font-bold uppercase">Total Payable Selected</div>
                <div className="text-xl font-black text-[#0E1035] font-mono">₹{formatINR(totalSelectedAmount)}</div>
              </div>
              <span className="text-[10px] bg-white border border-[#D0DEE5] text-[#0E1035] font-bold px-2 py-0.5 rounded-full">
                {selectedInvoiceIds.length} of {invoices.length} Selected
              </span>
            </div>

            {/* Selectable Invoices List */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase text-[#7C8594]">Select Invoices to Clear:</div>
              {invoices.map(inv => {
                const isSelected = selectedInvoiceIds.includes(inv.id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => toggleInvoice(inv.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-white border-[#0E1035] shadow-2xs' : 'bg-white border-[#D0DEE5] hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[#0E1035] border-[#0E1035] text-[#D0DEE5]' : 'border-[#D0DEE5] bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <div className="font-bold text-[#0E1035] text-xs flex items-center gap-2">
                          <span>{inv.invoiceNumber}</span>
                          {inv.status === 'OVERDUE' && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-bold rounded">
                              {inv.overdueDays}d Overdue
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#7C8594] line-clamp-1">{inv.productSummary}</div>
                        <div className="text-[10px] text-[#7C8594]">Due: {inv.dueDate}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-[#0E1035] text-xs">₹{formatINR(inv.amount)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-[#7C8594]">Select Payment Method:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'UPI', label: 'UPI (GPay / PhonePe)' },
                  { id: 'NET_BANKING', label: 'Net Banking (NEFT/RTGS)' },
                  { id: 'GATEWAY', label: 'Payment Gateway' },
                  { id: 'ADVANCE', label: 'Adjust Advance Credit' }
                ].map(m => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-2 rounded-xl text-left text-xs font-bold border transition cursor-pointer ${
                      paymentMethod === m.id ? 'bg-[#D0DEE5]/60 border-[#0E1035] text-[#0E1035]' : 'bg-white border-[#D0DEE5] text-[#7C8594] hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-[#D0DEE5]/40 border border-[#D0DEE5] rounded-xl text-[10px] text-[#0E1035]">
              <span className="font-bold">Enterprise Settlement Note:</span> Payment receipt and tax credit invoice adjustments will be reflected immediately in your opening balance ledger.
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#D0DEE5]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-[#D0DEE5] text-[#0E1035] font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isProcessing || selectedInvoiceIds.length === 0}
                onClick={handlePayNow}
                className="px-6 py-2.5 rounded-xl bg-[#0E1035] hover:bg-[#15253F] disabled:opacity-50 text-[#D0DEE5] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isProcessing ? 'Processing Transaction...' : `Pay ₹${formatINR(totalSelectedAmount)}`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
