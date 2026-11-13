import React, { useState, useEffect } from 'react';
import { TallyView } from './tallyTypes';

interface GatewayItem {
  id: string;
  label: string;
  hotkey: string;
  hotkeyIndex: number;
  view?: TallyView;
  action?: () => void;
}

interface GatewaySection {
  title: string;
  items: GatewayItem[];
}

interface GatewayOfTallyProps {
  onNavigate: (view: TallyView) => void;
  onQuit: () => void;
}

export const GatewayOfTally: React.FC<GatewayOfTallyProps> = ({ onNavigate, onQuit }) => {
  const sections: GatewaySection[] = [
    {
      title: 'Masters',
      items: [
        { id: 'acc_info', label: 'Accounts Info.', hotkey: 'A', hotkeyIndex: 0, view: 'ACCOUNTS_INFO' },
        { id: 'inv_info', label: 'Inventory Info.', hotkey: 'I', hotkeyIndex: 0, view: 'INVENTORY_INFO' },
      ],
    },
    {
      title: 'Transactions',
      items: [
        { id: 'acc_vch', label: 'Accounting Vouchers', hotkey: 'V', hotkeyIndex: 11, view: 'GATEWAY' },
        { id: 'inv_vch', label: 'Inventory Vouchers', hotkey: 'T', hotkeyIndex: 5, view: 'GATEWAY' },
        { id: 'billing', label: 'Billing / Invoicing', hotkey: 'L', hotkeyIndex: 2, view: 'GATEWAY' },
      ],
    },
    {
      title: 'Utilities',
      items: [
        { id: 'import', label: 'Import Data', hotkey: 'O', hotkeyIndex: 3, view: 'GATEWAY' },
        { id: 'banking', label: 'Banking', hotkey: 'N', hotkeyIndex: 2, view: 'GATEWAY' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { id: 'balance_sheet', label: 'Balance Sheet', hotkey: 'B', hotkeyIndex: 0, view: 'GATEWAY' },
        { id: 'profit_loss', label: 'Profit & Loss A/c', hotkey: 'P', hotkeyIndex: 0, view: 'GATEWAY' },
        { id: 'stock_summary', label: 'Stock Summary', hotkey: 'S', hotkeyIndex: 0, view: 'GATEWAY' },
        { id: 'ratio_analysis', label: 'Ratio Analysis', hotkey: 'R', hotkeyIndex: 0, view: 'GATEWAY' },
        { id: 'display', label: 'Display More Reports', hotkey: 'D', hotkeyIndex: 0, view: 'GATEWAY' },
      ],
    },
    {
      title: '',
      items: [{ id: 'quit', label: 'Quit', hotkey: 'Q', hotkeyIndex: 0, action: onQuit }],
    },
  ];

  const allItems: GatewayItem[] = sections.flatMap((s) => s.items);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is inside an input or modal
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeItem(allItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onQuit();
      } else {
        // Hotkey selection
        const pressedKey = e.key.toUpperCase();
        const matched = allItems.find((item) => item.hotkey === pressedKey);
        if (matched) {
          e.preventDefault();
          executeItem(matched);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allItems]);

  const executeItem = (item: GatewayItem) => {
    if (item.action) {
      item.action();
    } else if (item.view) {
      onNavigate(item.view);
    }
  };

  let globalIndex = 0;

  return (
    <div className="tally-menu-card">
      <div className="tally-menu-header">Gateway of Tally</div>
      {sections.map((sec, sIdx) => (
        <div key={sIdx}>
          {sec.title && <div className="tally-menu-subheader">{sec.title}</div>}
          {sec.items.map((item) => {
            const thisIndex = globalIndex++;
            const isSelected = selectedIndex === thisIndex;

            // Render label with hotkey highlighted
            const chars = item.label.split('');
            return (
              <div
                key={item.id}
                className={`tally-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedIndex(thisIndex);
                  executeItem(item);
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
      ))}
    </div>
  );
};
