import React, { useState, useEffect } from 'react';
import { TallyView } from './tallyTypes';

interface MenuItem {
  id: string;
  label: string;
  hotkey: string;
  hotkeyIndex: number;
  view?: TallyView;
}

interface AccountsInfoMenuProps {
  onNavigate: (view: TallyView) => void;
  onBack: () => void;
}

export const AccountsInfoMenu: React.FC<AccountsInfoMenuProps> = ({ onNavigate, onBack }) => {
  const items: MenuItem[] = [
    { id: 'groups', label: 'Groups', hotkey: 'G', hotkeyIndex: 0, view: 'GROUPS_LIST' },
    { id: 'ledgers', label: 'Ledgers', hotkey: 'L', hotkeyIndex: 0, view: 'LEDGERS_LIST' },
    { id: 'vtypes', label: 'Voucher Types', hotkey: 'V', hotkeyIndex: 0, view: 'VOUCHER_TYPES_LIST' },
    { id: 'quit', label: 'Quit', hotkey: 'Q', hotkeyIndex: 0 },
  ];

  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        execute(items[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else {
        const pressed = e.key.toUpperCase();
        const matched = items.find((i) => i.hotkey === pressed);
        if (matched) {
          e.preventDefault();
          execute(matched);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, items]);

  const execute = (item: MenuItem) => {
    if (item.id === 'quit') {
      onBack();
    } else if (item.view) {
      onNavigate(item.view);
    }
  };

  return (
    <div className="tally-menu-card">
      <div className="tally-menu-header">Accounts Info.</div>
      <div className="tally-menu-subheader">Masters Configuration</div>
      {items.map((item, idx) => {
        const isSelected = selectedIndex === idx;
        const chars = item.label.split('');
        return (
          <div
            key={item.id}
            className={`tally-menu-item ${isSelected ? 'selected' : ''}`}
            onClick={() => {
              setSelectedIndex(idx);
              execute(item);
            }}
          >
            <span>
              {chars.map((c, i) =>
                i === item.hotkeyIndex ? (
                  <span key={i} className="tally-hotkey">
                    {c}
                  </span>
                ) : (
                  c
                )
              )}
            </span>
            {isSelected && <span style={{ fontSize: '11px', color: '#004726' }}>►</span>}
          </div>
        );
      })}
    </div>
  );
};
