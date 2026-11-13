import React from 'react';

export const TallyBottomBar: React.FC = () => {
  return (
    <footer className="tally-bottombar">
      <div className="tally-bottombar-shortcuts">
        <div className="tally-bottombar-item">
          <span>[Enter]</span> Select / Next
        </div>
        <div className="tally-bottombar-item">
          <span>[Esc]</span> Back / Quit
        </div>
        <div className="tally-bottombar-item">
          <span>[Ctrl+A]</span> Accept
        </div>
        <div className="tally-bottombar-item">
          <span>[Alt+C]</span> Quick Create Master
        </div>
        <div className="tally-bottombar-item">
          <span>[↑ / ↓]</span> Navigate
        </div>
      </div>
      <div style={{ color: '#7ef9ff', fontSize: '11px' }}>
        Tally.ERP 9 Series A Release 6.6.3 | Multi-User Gold Edition
      </div>
    </footer>
  );
};
