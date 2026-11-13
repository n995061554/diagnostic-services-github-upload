import React from 'react';

interface TallyRightPanelProps {
  onF1: () => void;
  onF2: () => void;
  onF3: () => void;
  onF4?: () => void;
  onF5?: () => void;
  onF6?: () => void;
  onF7?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onF10?: () => void;
  onF11: () => void;
  onF12: () => void;
}

export const TallyRightPanel: React.FC<TallyRightPanelProps> = ({
  onF1,
  onF2,
  onF3,
  onF4,
  onF5,
  onF6,
  onF7,
  onF8,
  onF9,
  onF10,
  onF11,
  onF12,
}) => {
  return (
    <aside className="tally-right-panel">
      <button className="tally-fkey-btn" onClick={onF1}>
        <span className="tally-fkey-badge">F1:</span> Select Cmp
      </button>
      <button className="tally-fkey-btn" onClick={onF2}>
        <span className="tally-fkey-badge">F2:</span> Period
      </button>
      <button className="tally-fkey-btn" onClick={onF3}>
        <span className="tally-fkey-badge">F3:</span> Cmp Info
      </button>
      <button className="tally-fkey-btn" onClick={onF4} disabled={!onF4}>
        <span className="tally-fkey-badge">F4:</span> Contra
      </button>
      <button className="tally-fkey-btn" onClick={onF5} disabled={!onF5}>
        <span className="tally-fkey-badge">F5:</span> Payment
      </button>
      <button className="tally-fkey-btn" onClick={onF6} disabled={!onF6}>
        <span className="tally-fkey-badge">F6:</span> Receipt
      </button>
      <button className="tally-fkey-btn" onClick={onF7} disabled={!onF7}>
        <span className="tally-fkey-badge">F7:</span> Journal
      </button>
      <button className="tally-fkey-btn" onClick={onF8} disabled={!onF8}>
        <span className="tally-fkey-badge">F8:</span> Sales
      </button>
      <button className="tally-fkey-btn" onClick={onF9} disabled={!onF9}>
        <span className="tally-fkey-badge">F9:</span> Purchase
      </button>
      <button className="tally-fkey-btn" onClick={onF10} disabled={!onF10}>
        <span className="tally-fkey-badge">F10:</span> Other Vch
      </button>
      <button className="tally-fkey-btn" onClick={onF11}>
        <span className="tally-fkey-badge">F11:</span> Features
      </button>
      <button className="tally-fkey-btn" onClick={onF12}>
        <span className="tally-fkey-badge">F12:</span> Configure
      </button>
    </aside>
  );
};
