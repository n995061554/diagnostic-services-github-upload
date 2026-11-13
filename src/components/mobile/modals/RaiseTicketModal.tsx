import React, { useState } from 'react';
import {
  X,
  Wrench,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Zap,
  ShieldCheck,
  Building2,
  Phone,
  User
} from 'lucide-react';
import { EquipmentItem } from '../mobileMockData';
import {
  ServiceTicketCategory,
  ServiceTicketPriority,
  ServiceSlaConfig
} from '../customerAppTypes';
import { customerApiService } from '../customerApiService';
import { ThemePalette } from '../../../utils/themeSystem';

interface RaiseTicketModalProps {
  installedEquipment: EquipmentItem[];
  siteName: string;
  theme: ThemePalette;
  onClose: () => void;
  onSubmitSuccess: (ticketData: any) => void;
}

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  installedEquipment,
  siteName,
  theme,
  onClose,
  onSubmitSuccess
}) => {
  const [selectedEqId, setSelectedEqId] = useState<string>(installedEquipment[0]?.id || 'other');
  const [category, setCategory] = useState<ServiceTicketCategory>('EQUIPMENT_BREAKDOWN');
  const [priority, setPriority] = useState<ServiceTicketPriority>('HIGH');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const [contactName, setContactName] = useState<string>('Dr. Rajesh Sharma');
  const [contactPhone, setContactPhone] = useState<string>('+91 98200 44122');
  const [hasPhoto, setHasPhoto] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [slaConfig, setSlaConfig] = useState<ServiceSlaConfig>({
    criticalResponseHours: 4,
    highResponseHours: 8,
    mediumResponseHours: 24,
    lowResponseHours: 48,
    serviceTierName: 'Contracted Service Level Agreement',
    dispatchDescription: 'Emergency biomedical field engineer dispatch per contracted response SLA',
    disclaimer: 'Response times subject to active AMC/CMC service agreement terms and regional technical centre proximity.'
  });

  React.useEffect(() => {
    customerApiService.getServiceSlaConfig().then(cfg => {
      if (cfg) setSlaConfig(cfg);
    });
  }, []);

  const selectedEq = installedEquipment.find(e => e.id === selectedEqId);

  const currentPriorityHours = priority === 'CRITICAL'
    ? slaConfig.criticalResponseHours
    : priority === 'HIGH'
    ? slaConfig.highResponseHours
    : priority === 'MEDIUM'
    ? slaConfig.mediumResponseHours
    : slaConfig.lowResponseHours;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      equipmentId: selectedEq?.id || 'eq-custom',
      equipmentName: selectedEq?.name || 'General Laboratory Analyzer',
      equipmentModel: selectedEq?.modelNumber || 'MOD-GEN-01',
      serialNumber: selectedEq?.serialNumber || 'SN-UNKNOWN',
      category: category,
      priority: priority,
      title: title || 'Biomedical Service Intervention Request',
      description: description || 'Routine breakdown investigation requested.',
      errorCode: errorCode || undefined,
      contactPerson: contactName,
      contactPhone: contactPhone,
      hasAttachedImage: hasPhoto,
      slaTargetHours: currentPriorityHours
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitSuccess(payload);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5] transition-all"
      >
        {/* Header */}
        <div 
          className="p-4 text-white flex items-center justify-between shadow-md bg-[#0E1035]"
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white/10 text-[#D0DEE5]"
            >
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Field Biomedical Service</div>
              <h3 className="text-sm font-extrabold text-white">Raise Service Ticket</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SLA Banner */}
        <div className="bg-[#D0DEE5]/30 border-b border-[#D0DEE5] px-4 py-2 flex items-center justify-between text-xs text-[#0E1035]">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-[#0E1035]" />
            <span>{slaConfig.serviceTierName}</span>
          </div>
          <span className="font-extrabold text-[10px] bg-[#0E1035] text-white px-2 py-0.5 rounded-full">
            &le; {currentPriorityHours}h Response SLA
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3.5 text-xs text-[#0E1035] bg-slate-50">
          {/* Equipment Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">
              Select Instrument / Equipment
            </label>
            <select
              value={selectedEqId}
              onChange={e => setSelectedEqId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-[#D0DEE5] font-bold text-xs text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
            >
              {installedEquipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.modelNumber} - {eq.serialNumber})
                </option>
              ))}
              <option value="other">Other Laboratory Instrument / General</option>
            </select>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">
              Issue Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'EQUIPMENT_BREAKDOWN', label: 'Equipment Breakdown' },
                { id: 'PREVENTIVE_MAINTENANCE', label: 'Preventive Maint (PM)' },
                { id: 'CALIBRATION_REQUEST', label: 'Calibration Request' },
                { id: 'REAGENT_QUALITY_ISSUE', label: 'Reagent Quality Issue' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setCategory(opt.id as any)}
                  className={`p-2 rounded-xl text-left font-bold transition text-xs border cursor-pointer ${
                    category === opt.id 
                      ? 'bg-[#0E1035] text-white border-[#0E1035] shadow-xs' 
                      : 'bg-white border-[#D0DEE5] text-[#7C8594] hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency / Priority */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-[#7C8594] uppercase tracking-wider">
                Urgency / Priority Level
              </label>
              <span className="text-[9px] text-[#7C8594] font-medium">Configured SLA</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[
                { id: 'LOW', label: `Low (${slaConfig.lowResponseHours}h)`, color: 'text-slate-700 bg-slate-100' },
                { id: 'MEDIUM', label: `Med (${slaConfig.mediumResponseHours}h)`, color: 'text-blue-700 bg-blue-50' },
                { id: 'HIGH', label: `High (${slaConfig.highResponseHours}h)`, color: 'text-amber-800 bg-amber-100' },
                { id: 'CRITICAL', label: `STAT (${slaConfig.criticalResponseHours}h)`, color: 'text-rose-800 bg-rose-100 font-black' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as any)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-extrabold border cursor-pointer transition ${
                    priority === p.id 
                      ? 'ring-2 ring-[#0E1035] border-[#0E1035] shadow-xs' 
                      : 'opacity-70 border-transparent hover:opacity-100'
                  } ${p.color}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-[#7C8594] italic mt-1">{slaConfig.disclaimer}</p>
          </div>

          {/* Title & Error Code */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">
                Issue Summary
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs font-bold text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
                placeholder="e.g., Cuvette Rinse Error"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">
                Error Code
              </label>
              <input
                type="text"
                value={errorCode}
                onChange={e => setErrorCode(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs font-mono font-bold text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
                placeholder="E-104"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">
              Clinical & Symptom Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-xl bg-white border border-[#D0DEE5] text-xs text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
              placeholder="Describe instrument alarm, failing tests, or reagent lot issues..."
              required
            />
          </div>

          {/* Photo Simulator Attachment */}
          <div className="p-2.5 bg-white border border-[#D0DEE5] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#0E1035]" />
              <div>
                <div className="font-bold text-[11px] text-[#0E1035]">Analyzer Screen / Alarm Photo</div>
                <div className="text-[9px] text-[#7C8594]">
                  {hasPhoto ? 'cuvette_error_screenshot.jpg attached' : 'No image attached'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHasPhoto(!hasPhoto)}
              className="px-2.5 py-1 text-[10px] font-bold bg-[#D0DEE5]/50 hover:bg-[#D0DEE5] text-[#0E1035] rounded-lg cursor-pointer transition"
            >
              {hasPhoto ? 'Remove' : '+ Attach'}
            </button>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">On-Site Contact</label>
              <input
                type="text"
                value={contactName}
                onChange={e => setContactName(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs text-[#0E1035]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#7C8594] uppercase tracking-wider mb-1">Direct Mobile</label>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full p-2 rounded-xl bg-white border border-[#D0DEE5] text-xs text-[#0E1035]"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#0E1035] hover:bg-[#15253F] text-white font-black rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Dispatching Field Engineer...
              </span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#D0DEE5]" />
                Confirm & Dispatch Engineer
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
