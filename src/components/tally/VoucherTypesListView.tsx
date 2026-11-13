import React, { useState, useEffect } from 'react';
import { TallyVoucherType } from './tallyTypes';

interface VoucherTypesListViewProps {
  voucherTypes: TallyVoucherType[];
  onCreateType: () => void;
  onBack: () => void;
}

export const VoucherTypesListView: React.FC<VoucherTypesListViewProps> = ({
  voucherTypes,
  onCreateType,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (voucherTypes.length ? (prev + 1) % voucherTypes.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (voucherTypes.length ? (prev - 1 + voucherTypes.length) % voucherTypes.length : 0));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onCreateType();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, voucherTypes]);

  return (
    <div className="tally-form-card" style={{ maxWidth: '880px' }}>
      <div className="tally-form-header">
        <span>List of Voucher Types ({voucherTypes.length})</span>
        <span style={{ fontSize: '11px', color: '#ffff00' }}>[Alt+C: Create | Esc: Back]</span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#ebdcb2' }}>
        <button className="tally-btn-primary" onClick={onCreateType}>
          + Create Voucher Type [Alt+C]
        </button>
        <button className="tally-btn-secondary" onClick={onBack}>
          Back [Esc]
        </button>
      </div>

      <div style={{ padding: '12px' }}>
        <div className="tally-table-container">
          <table className="tally-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Voucher Type Name</th>
                <th style={{ width: '130px' }}>Type of Voucher</th>
                <th style={{ width: '130px' }}>Method of Numbering</th>
                <th style={{ width: '110px' }}>Prefix</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Next No.</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Default</th>
              </tr>
            </thead>
            <tbody>
              {voucherTypes.map((vt, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <tr key={vt.id} className={isSelected ? 'selected-row' : ''}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{vt.name}</strong>
                    </td>
                    <td>{vt.baseType}</td>
                    <td>{vt.numberingMethod}</td>
                    <td>{vt.prefix || '-'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{vt.currentNumber}</td>
                    <td style={{ textAlign: 'center' }}>{vt.isDefault ? 'Standard' : 'User'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
