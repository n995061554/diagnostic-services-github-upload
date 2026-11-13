import React from 'react';

/**
 * DECOMMISSIONED: Built-in Tally emulator interface has been permanently removed.
 * External commercial Tally ERP 9 / TallyPrime is the primary source of truth.
 * All synchronization is managed via the External Tally Integration & Sync Manager.
 */
export interface TallyAppProps {
  token?: string | null;
  onExit: () => void;
}

export const TallyApp: React.FC<TallyAppProps> = ({ onExit }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
          <span className="font-mono font-bold text-lg">ERP</span>
        </div>
        <h2 className="text-lg font-bold">Built-in Tally Suite Removed</h2>
        <p className="text-xs text-slate-400">
          Commercial External Tally ERP 9 / TallyPrime is now the primary accounting source of truth.
          Please use the dedicated <strong className="text-emerald-400">External Tally Integration & Sync Manager</strong> in the Back Office navigation to connect and synchronize your commercial Tally data.
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
