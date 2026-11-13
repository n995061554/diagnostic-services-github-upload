import React, { useState } from 'react';
import {
  ThermometerSnowflake,
  Scan,
  Search,
  CheckCircle2,
  Package,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  MapPin,
  Cpu
} from 'lucide-react';
import { TraceabilityRecord } from '../customerAppTypes';
import { TRACEABILITY_RECORDS } from '../mobileMockData';
import { ThemePalette } from '../../../utils/themeSystem';

interface TrackTabProps {
  theme: ThemePalette;
  onOpenScanner: () => void;
  onViewDocument: (refNumber: string) => void;
}

export const TrackTab: React.FC<TrackTabProps> = ({
  theme,
  onOpenScanner,
  onViewDocument
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(TRACEABILITY_RECORDS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeRecord = TRACEABILITY_RECORDS.find(r => r.id === selectedRecordId) || TRACEABILITY_RECORDS[0];

  const filteredRecords = TRACEABILITY_RECORDS.filter(r => 
    r.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 pb-6 animate-in fade-in text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-[#0E1035] uppercase tracking-wider flex items-center gap-2">
            <ThermometerSnowflake className="w-4 h-4 text-[#0E1035]" />
            Material Traceability & Cold Chain
          </h2>
          <p className="text-[10px] text-[#7C8594]">Batch genealogy, serial verification & IoT telemetry</p>
        </div>
        <button
          onClick={onOpenScanner}
          className="px-2.5 py-1.5 bg-[#0E1035] hover:bg-[#15253F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <Scan className="w-3.5 h-3.5" />
          Scan Barcode
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7C8594]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Enter Lot #, Batch #, Serial # (e.g., ROC-TRP-9021)"
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#D0DEE5] text-xs font-bold text-[#0E1035] focus:outline-hidden focus:border-[#0E1035]"
        />
      </div>

      {/* Record Selectors */}
      {filteredRecords.length === 0 ? (
        <div className="p-3 bg-white rounded-xl border border-[#D0DEE5] text-center text-[#7C8594] text-[11px]">
          No lots or serial records matching "{searchQuery}"
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredRecords.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRecordId(r.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition border cursor-pointer ${
                selectedRecordId === r.id
                  ? 'bg-[#0E1035] text-white border-[#0E1035] shadow-xs'
                  : 'bg-white text-[#7C8594] border-[#D0DEE5] hover:bg-slate-50'
              }`}
            >
              {r.identifier}
            </button>
          ))}
        </div>
      )}

      {/* Active Record Detail Card */}
      <div className="bg-white rounded-3xl border border-[#D0DEE5] p-4 shadow-sm space-y-4">
        {/* Title */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#0E1035] bg-[#D0DEE5]/50 px-2 py-0.5 rounded-full">
              {activeRecord.type.replace('_', ' ')}
            </span>
            <h3 className="font-black text-sm text-[#0E1035] mt-1 leading-snug">{activeRecord.title}</h3>
            <p className="text-[10px] text-[#7C8594] mt-0.5">{activeRecord.subtitle}</p>
          </div>
          <span className="font-mono text-xs font-extrabold text-[#0E1035] bg-slate-50 px-2 py-1 rounded-lg border border-[#D0DEE5]">
            {activeRecord.identifier}
          </span>
        </div>

        {/* Cold-Chain IoT Telemetry Box */}
        <div className="bg-gradient-to-br from-[#0E1035] via-[#15253F] to-[#2B3D5B] text-white rounded-2xl p-3.5 space-y-3 shadow-md border border-[#2B3D5B]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ThermometerSnowflake className="w-4 h-4 text-[#D0DEE5]" />
              <span className="font-black text-xs text-[#D0DEE5]">
                IoT Continuous Temperature Logging (2°C - 8°C)
              </span>
            </div>
            <span className="text-[9px] font-black bg-[#D0DEE5] text-[#0E1035] px-2 py-0.5 rounded-full">
              0 EXCURSIONS
            </span>
          </div>

          {/* Simulated Temperature Curve Bar */}
          <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-white/80">
              <span>Avg: <strong>{activeRecord.temperatureLog.averageTemp}°C</strong></span>
              <span>Min: {activeRecord.temperatureLog.minRecorded}°C</span>
              <span>Max: {activeRecord.temperatureLog.maxRecorded}°C</span>
              <span>Sensor Battery: {activeRecord.temperatureLog.sensorBattery}</span>
            </div>

            {/* Reading Timeline Bars */}
            <div className="flex items-end gap-2 h-14 pt-2 px-1">
              {activeRecord.temperatureLog.telemetryReadings.map((reading, idx) => {
                const heightPercent = Math.min(100, Math.max(30, (reading.temp / 8) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[8px] font-mono text-[#D0DEE5]">{reading.temp}°</span>
                    <div className="w-full bg-white/10 rounded-t-xs h-8 flex items-end">
                      <div 
                        className="w-full rounded-t-xs transition-all duration-500 bg-[#D0DEE5]"
                        style={{
                          height: `${heightPercent}%`
                        }}
                      />
                    </div>
                    <span className="text-[8px] text-white/60">{reading.time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-white/70 pt-0.5">
            <span>Validated Cold-Chain Transport Standard</span>
            <span className="font-bold text-[#D0DEE5]">✓ GDP Compliant</span>
          </div>
        </div>

        {/* Chain of Custody Timeline */}
        <div className="space-y-3">
          <h4 className="font-black text-xs text-[#0E1035] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0E1035]" />
            Chain of Custody & Quality Audit Log
          </h4>

          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D0DEE5]">
            {activeRecord.chainOfCustody.map((log, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#0E1035] text-white flex items-center justify-center text-[9px] border-2 border-[#D0DEE5]">
                  ✓
                </span>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-[#0E1035]">{log.event}</span>
                    <span className="text-[9px] text-[#7C8594] font-bold">{log.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-[#7C8594] mt-0.5">
                    {log.facility} &bull; Verified by {log.operator}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Certificate Release */}
        <div className="p-3 bg-slate-50 border border-[#D0DEE5] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0E1035]" />
            <div>
              <div className="font-extrabold text-xs text-[#0E1035]">
                QC Release Certificate ({activeRecord.qualityCertificateNumber})
              </div>
              <div className="text-[10px] text-[#7C8594]">Audited by {activeRecord.qualityAuditor}</div>
            </div>
          </div>
          <button
            onClick={() => onViewDocument(activeRecord.qualityCertificateNumber)}
            className="text-[11px] font-black text-[#0E1035] hover:underline cursor-pointer flex items-center gap-0.5"
          >
            View COA &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
