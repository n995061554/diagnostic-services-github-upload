import React, { useState, useEffect } from 'react';
import { TallyAccountGroup } from './tallyTypes';

interface GroupsListViewProps {
  groups: TallyAccountGroup[];
  onCreateGroup: () => void;
  onBack: () => void;
}

export const GroupsListView: React.FC<GroupsListViewProps> = ({
  groups,
  onCreateGroup,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.nature.toLowerCase().includes(search.toLowerCase()) ||
      (g.parentGroupName && g.parentGroupName.toLowerCase().includes(search.toLowerCase()))
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
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onCreateGroup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filtered]);

  return (
    <div className="tally-form-card" style={{ maxWidth: '880px' }}>
      <div className="tally-form-header">
        <span>List of Account Groups ({groups.length})</span>
        <span style={{ fontSize: '11px', color: '#ffff00' }}>[Alt+C: Create Group | Esc: Back]</span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#ebdcb2' }}>
        <input
          className="tally-input"
          style={{ width: '300px' }}
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="tally-btn-primary" onClick={onCreateGroup}>
            + Create Group [Alt+C]
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
                <th>Group Name</th>
                <th style={{ width: '200px' }}>Sub-Group of (Parent)</th>
                <th style={{ width: '120px' }}>Nature</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Affects Gross Profit</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Default</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <tr key={g.id} className={isSelected ? 'selected-row' : ''}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{g.name}</strong>
                    </td>
                    <td>{g.parentGroupName || 'Primary'}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            g.nature === 'Asset'
                              ? '#004726'
                              : g.nature === 'Liability'
                              ? '#003366'
                              : g.nature === 'Income'
                              ? '#006600'
                              : '#880000',
                        }}
                      >
                        {g.nature}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{g.affectsGrossProfit ? 'Yes' : 'No'}</td>
                    <td style={{ textAlign: 'center' }}>{g.isDefault ? 'Standard' : 'Custom'}</td>
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
