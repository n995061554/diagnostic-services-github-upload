import React, { useState, useEffect } from 'react';
import { TallyCompany } from './tallyTypes';

interface CompanySelectModalProps {
  companies: TallyCompany[];
  selectedCompanyId: string | null;
  onSelect: (companyId: string) => void;
  onClose: () => void;
}

export const CompanySelectModal: React.FC<CompanySelectModalProps> = ({
  companies,
  selectedCompanyId,
  onSelect,
  onClose,
}) => {
  const [highlightedIndex, setHighlightedIndex] = useState<number>(() => {
    const idx = companies.findIndex((c) => c.id === selectedCompanyId);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % companies.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + companies.length) % companies.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (companies[highlightedIndex]) {
          onSelect(companies[highlightedIndex].id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlightedIndex, companies]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div className="tally-form-card" style={{ maxWidth: '680px' }}>
        <div className="tally-form-header">
          <span>Select Company</span>
          <span style={{ fontSize: '11px', color: '#ffff00' }}>[Enter: Select | Esc: Cancel]</span>
        </div>

        <div style={{ padding: '12px' }}>
          <div className="tally-table-container">
            <table className="tally-table">
              <thead>
                <tr>
                  <th style={{ width: '45px' }}>No.</th>
                  <th>Company Name</th>
                  <th style={{ width: '130px' }}>Financial Year</th>
                  <th style={{ width: '110px' }}>State</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Active</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const isActive = c.id === selectedCompanyId;
                  const fyStart = parseInt(c.financialYearStart.slice(0, 4)) || 2026;
                  return (
                    <tr
                      key={c.id}
                      className={isHighlighted ? 'selected-row' : ''}
                      onClick={() => {
                        setHighlightedIndex(idx);
                        onSelect(c.id);
                        onClose();
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{10001 + idx}</td>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>
                        {fyStart} to {fyStart + 1}
                      </td>
                      <td>{c.state}</td>
                      <td style={{ textAlign: 'center' }}>
                        {isActive ? (
                          <span style={{ color: '#006600', fontWeight: 'bold' }}>● Yes</span>
                        ) : (
                          <span style={{ color: '#888' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="tally-form-actions">
          <button className="tally-btn-secondary" onClick={onClose}>
            Close [Esc]
          </button>
          <button
            className="tally-btn-primary"
            onClick={() => {
              if (companies[highlightedIndex]) {
                onSelect(companies[highlightedIndex].id);
                onClose();
              }
            }}
          >
            Select Company [Enter]
          </button>
        </div>
      </div>
    </div>
  );
};
