import React, { useState, useEffect } from 'react';
import { TallyLedger } from './tallyTypes';

interface LedgersListViewProps {
  ledgers: TallyLedger[];
  onSelectLedger: (ledger: TallyLedger) => void;
  onCreateLedger: () => void;
  onDeleteLedger: (ledgerId: string) => Promise<void>;
  onBack: () => void;
}

export const LedgersListView: React.FC<LedgersListViewProps> = ({
  ledgers,
  onSelectLedger,
  onCreateLedger,
  onDeleteLedger,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  const filtered = ledgers.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.groupName.toLowerCase().includes(search.toLowerCase()) ||
      (l.alias && l.alias.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) onSelectLedger(filtered[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onCreateLedger();
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const current = filtered[selectedIndex];
        if (current && !current.isDefault) {
          if (confirm(`Delete ledger "${current.name}"?`)) {
            onDeleteLedger(current.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filtered]);

  const formatCurrency = (paise: number) => {
    return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  return (
    <div className="tally-form-card" style={{ maxWidth: '960px' }}>
      <div className="tally-form-header">
        <span>List of Ledgers ({ledgers.length})</span>
        <span style={{ fontSize: '11px', color: '#ffff00' }}>
          [Enter: Alter | Alt+C: Create | Alt+D: Delete | Esc: Back]
        </span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ebdcb2' }}>
        <input
          className="tally-input"
          style={{ width: '320px' }}
          placeholder="Filter ledgers by name, alias or group..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(0);
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="tally-btn-primary" onClick={onCreateLedger}>
            + Create Ledger [Alt+C]
          </button>
          <button className="tally-btn-secondary" onClick={onBack}>
            Back [Esc]
          </button>
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        <div className="tally-table-container">
          <table className="tally-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Ledger Name</th>
                <th style={{ width: '130px' }}>Alias</th>
                <th style={{ width: '180px' }}>Parent Group</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Opening Balance</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Type</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Default</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <tr
                    key={l.id}
                    className={isSelected ? 'selected-row' : ''}
                    onClick={() => {
                      setSelectedIndex(idx);
                      onSelectLedger(l);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{l.name}</strong>
                    </td>
                    <td>{l.alias || '-'}</td>
                    <td>{l.groupName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(l.openingBalancePaise)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: l.openingBalanceType === 'Dr' ? '#004726' : '#990000' }}>
                      {l.openingBalanceType}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {l.isDefault ? (
                        <span style={{ fontSize: '10px', backgroundColor: '#e2e2e2', padding: '1px 5px', border: '1px solid #aaa' }}>
                          System
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No ledgers found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
