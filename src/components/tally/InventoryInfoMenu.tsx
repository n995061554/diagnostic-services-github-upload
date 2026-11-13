import React, { useState, useEffect } from 'react';
import { TallyView } from './tallyTypes';

interface MenuItem {
  id: string;
  label: string;
  hotkey: string;
  hotkeyIndex: number;
  view?: TallyView;
}

interface InventoryInfoMenuProps {
  onNavigate: (view: TallyView) => void;
  onBack: () => void;
}

export const InventoryInfoMenu: React.FC<InventoryInfoMenuProps> = ({ onNavigate, onBack }) => {
  const items: MenuItem[] = [
    { id: 'stock_groups', label: 'Stock Groups', hotkey: 'G', hotkeyIndex: 6, view: 'STOCK_GROUPS_LIST' },
    { id: 'stock_items', label: 'Stock Items', hotkey: 'I', hotkeyIndex: 6, view: 'STOCK_ITEMS_LIST' },
    { id: 'units', label: 'Units of Measure', hotkey: 'U', hotkeyIndex: 0, view: 'UNITS_LIST' },
    { id: 'godowns', label: 'Godowns / Locations', hotkey: 'O', hotkeyIndex: 1, view: 'GODOWNS_LIST' },
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
      <div className="tally-menu-header">Inventory Info.</div>
      <div className="tally-menu-subheader">Stock & Warehousing Masters</div>
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
