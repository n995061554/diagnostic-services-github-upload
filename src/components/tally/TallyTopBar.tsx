import React from 'react';
import { TallyCompany } from './tallyTypes';

interface TallyTopBarProps {
  company: TallyCompany | null;
  breadcrumb: string;
  onExit: () => void;
}

export const TallyTopBar: React.FC<TallyTopBarProps> = ({ company, breadcrumb, onExit }) => {
  return (
    <header className="tally-topbar">
      <div className="tally-topbar-brand">
        <span className="tally-logo-badge">Tally.ERP 9</span>
        <span>Gateway of Tally</span>
        <span className="tally-topbar-breadcrumb">» {breadcrumb}</span>
      </div>

      <div className="tally-topbar-actions">
        {company && (
          <span style={{ fontSize: '12px', color: '#e3ffe3', marginRight: '8px' }}>
            🏢 <strong>{company.name}</strong> (FY: {company.financialYearStart.slice(0, 4)}-
            {parseInt(company.financialYearStart.slice(0, 4)) + 1})
          </span>
        )}
        <button
          className="tally-btn-exit"
          onClick={onExit}
          title="Exit Tally Suite and return to Diagnostic Back Office"
        >
          ✕ Back Office
        </button>
      </div>
    </header>
  );
};
