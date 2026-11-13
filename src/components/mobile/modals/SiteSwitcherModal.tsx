import React from 'react';
import {
  X,
  MapPin,
  Check,
  Building2,
  Cpu,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { CustomerSite } from '../customerAppTypes';
import { ThemePalette } from '../../../utils/themeSystem';

interface SiteSwitcherModalProps {
  sites: CustomerSite[];
  activeSiteId: string;
  theme: ThemePalette;
  onClose: () => void;
  onSelectSite: (site: CustomerSite) => void;
}

export const SiteSwitcherModal: React.FC<SiteSwitcherModalProps> = ({
  sites,
  activeSiteId,
  theme,
  onClose,
  onSelectSite
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-[#D0DEE5]"
      >
        {/* Header */}
        <div 
          className="p-4 text-white flex items-center justify-between shadow-md bg-[#0E1035]"
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white/10 text-[#D0DEE5]"
            >
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Multi-Location Network</div>
              <h3 className="text-sm font-black text-white">Select Active Laboratory Site</h3>
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

        {/* Sites List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 text-xs bg-slate-50">
          <p className="text-[11px] text-[#7C8594] leading-snug">
            Orders, installed instruments, calibration schedules, and delivery addresses will automatically 
            filter to the selected laboratory site.
          </p>

          <div className="space-y-2.5">
            {sites.map(site => {
              const isSelected = site.id === activeSiteId;

              return (
                <button
                  key={site.id}
                  onClick={() => {
                    onSelectSite(site);
                    onClose();
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition shadow-xs flex flex-col gap-1.5 cursor-pointer ${
                    isSelected 
                      ? 'bg-white border-[#0E1035] ring-2 ring-[#0E1035]/20 shadow-md' 
                      : 'bg-white border-[#D0DEE5] hover:border-[#0E1035]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#0E1035] ring-2 ring-[#D0DEE5]' : 'bg-slate-300'}`} />
                      <h4 className="font-extrabold text-xs text-[#0E1035]">{site.name}</h4>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-black bg-[#0E1035] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        Active Site
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-[#7C8594] flex items-start gap-1 pl-4">
                    <MapPin className="w-3 h-3 text-[#7C8594] shrink-0 mt-0.5" />
                    <span>{site.address}, {site.city} - {site.pincode}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] pl-4 text-[#7C8594]">
                    <span className="flex items-center gap-1 text-[#0E1035] font-bold">
                      <Cpu className="w-3 h-3 text-[#2B3D5B]" />
                      {site.activeEquipmentCount} Instruments
                    </span>
                    <span>License: {site.licenseNumber}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
