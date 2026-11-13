import React from 'react';
import { TallyCompany } from './tallyTypes';

interface TallyLeftPanelProps {
  company: TallyCompany | null;
  onOpenSelectCompany: () => void;
  onOpenCreateCompany: () => void;
  onOpenAlterCompany: () => void;
}

export const TallyLeftPanel: React.FC<TallyLeftPanelProps> = ({
  company,
  onOpenSelectCompany,
  onOpenCreateCompany,
  onOpenAlterCompany,
}) => {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const fyYear = company ? parseInt(company.financialYearStart.slice(0, 4)) : 2026;
  const currentPeriod = `1-Apr-${fyYear} to 31-Mar-${fyYear + 1}`;

  return (
    <aside className="tally-left-panel">
      <div className="tally-info-box">
        <div className="tally-info-title">Current Period</div>
        <div className="tally-info-val" style={{ color: '#004726', textAlign: 'left' }}>
          {currentPeriod}
        </div>
      </div>

      <div className="tally-info-box">
        <div className="tally-info-title">Current Date</div>
        <div className="tally-info-val" style={{ color: '#004726', textAlign: 'left' }}>
          {dateFormatted}
        </div>
      </div>

      <div className="tally-info-box" style={{ flex: 1 }}>
        <div className="tally-info-title">List of Selected Companies</div>
        {company ? (
          <div>
            <div style={{ fontWeight: 900, color: '#000000', fontSize: '13px', marginBottom: '6px' }}>
              {company.name}
            </div>
            <div style={{ fontSize: '11px', color: '#444444', marginBottom: '4px' }}>
              GSTIN: <strong>{company.gstin || 'Unregistered'}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#444444', marginBottom: '4px' }}>
              State: <strong>{company.state} ({company.stateCode})</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#444444', marginTop: '10px', borderTop: '1px dashed #aaa', paddingTop: '6px' }}>
              Date of Last Entry: <span style={{ color: '#004726', fontWeight: 'bold' }}>24-Oct-2026</span>
            </div>
          </div>
        ) : (
          <div style={{ color: '#990000', fontStyle: 'italic', padding: '10px 0' }}>
            No Company Selected
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          className="tally-btn-secondary"
          onClick={onOpenSelectCompany}
          style={{ width: '100%', fontSize: '11px' }}
        >
          [F1] Select Company
        </button>
        <button
          className="tally-btn-secondary"
          onClick={onOpenCreateCompany}
          style={{ width: '100%', fontSize: '11px' }}
        >
          [Alt+F3] Create Company
        </button>
        {company && (
          <button
            className="tally-btn-secondary"
            onClick={onOpenAlterCompany}
            style={{ width: '100%', fontSize: '11px' }}
          >
            Alter Company Details
          </button>
        )}
      </div>
    </aside>
  );
};
