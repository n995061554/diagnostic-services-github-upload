import React, { useState, useEffect } from 'react';
import { TallyStockItem, TallyStockGroup, TallyUnit, TallyGodown } from './tallyTypes';

// ==========================================
// 1. STOCK ITEMS LIST & CREATE/ALTER
// ==========================================
interface StockItemsViewProps {
  stockItems: TallyStockItem[];
  stockGroups: TallyStockGroup[];
  units: TallyUnit[];
  godowns: TallyGodown[];
  onSaveItem: (data: Partial<TallyStockItem>, id?: string) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onBack: () => void;
}

export const StockItemsView: React.FC<StockItemsViewProps> = ({
  stockItems,
  stockGroups,
  units,
  godowns,
  onSaveItem,
  onDeleteItem,
  onBack,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TallyStockItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = stockItems.filter(
    (si) =>
      si.name.toLowerCase().includes(search.toLowerCase()) ||
      si.stockGroupName.toLowerCase().includes(search.toLowerCase()) ||
      (si.partNumber && si.partNumber.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen || e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          setEditingItem(filtered[selectedIndex]);
          setIsModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setEditingItem(null);
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filtered, isModalOpen]);

  return (
    <div className="tally-form-card" style={{ maxWidth: '980px' }}>
      <div className="tally-form-header">
        <span>Stock Items ({stockItems.length})</span>
        <span style={{ fontSize: '11px', color: '#ffff00' }}>[Enter: Alter | Alt+C: Create | Esc: Back]</span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#ebdcb2' }}>
        <input
          className="tally-input"
          style={{ width: '320px' }}
          placeholder="Filter stock items..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedIndex(0);
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="tally-btn-primary"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
          >
            + Create Item [Alt+C]
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
                <th>Item Description / Name</th>
                <th style={{ width: '120px' }}>Part No / SKU</th>
                <th style={{ width: '150px' }}>Stock Group</th>
                <th style={{ width: '70px', textAlign: 'center' }}>UOM</th>
                <th style={{ width: '80px', textAlign: 'center' }}>GST %</th>
                <th style={{ width: '90px', textAlign: 'right' }}>Opening Qty</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Rate (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <tr
                    key={item.id}
                    className={isSelected ? 'selected-row' : ''}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{idx + 1}</td>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.partNumber || '-'}</td>
                    <td>{item.stockGroupName}</td>
                    <td style={{ textAlign: 'center' }}>{item.unitSymbol}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.gstRate}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.openingQty}</td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{(item.openingRatePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No stock items found. Press Alt+C to create.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <StockItemModal
          item={editingItem}
          stockGroups={stockGroups}
          units={units}
          godowns={godowns}
          onSave={async (data) => {
            await onSaveItem(data, editingItem?.id);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

// Stock Item Creation/Alteration Modal
const StockItemModal: React.FC<{
  item: TallyStockItem | null;
  stockGroups: TallyStockGroup[];
  units: TallyUnit[];
  godowns: TallyGodown[];
  onSave: (data: Partial<TallyStockItem>) => Promise<void>;
  onClose: () => void;
}> = ({ item, stockGroups, units, godowns, onSave, onClose }) => {
  const isAlter = !!item;
  const [formData, setFormData] = useState({
    name: item?.name || '',
    partNumber: item?.partNumber || '',
    stockGroupId: item?.stockGroupId || stockGroups[0]?.id || '',
    unitId: item?.unitId || units[0]?.id || '',
    hsnSac: item?.hsnSac || '38220090',
    gstRate: item?.gstRate ?? 12,
    valuationMethod: item?.valuationMethod || 'FIFO',
    openingQty: item?.openingQty || 0,
    openingRateRupees: item ? (item.openingRatePaise / 100).toString() : '0',
    standardSellingPriceRupees: item ? (item.standardSellingPricePaise / 100).toString() : '0',
    godownId: item?.godownId || godowns[0]?.id || '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Item Name is mandatory');
      return;
    }
    if (!formData.unitId) {
      setError('Unit of Measure is mandatory');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const openingRatePaise = Math.round((parseFloat(formData.openingRateRupees) || 0) * 100);
      const sellingPricePaise = Math.round((parseFloat(formData.standardSellingPriceRupees) || 0) * 100);
      const qty = Number(formData.openingQty) || 0;

      await onSave({
        name: formData.name.trim(),
        partNumber: formData.partNumber.trim(),
        stockGroupId: formData.stockGroupId,
        unitId: formData.unitId,
        hsnSac: formData.hsnSac.trim(),
        gstRate: Number(formData.gstRate),
        valuationMethod: formData.valuationMethod as any,
        openingQty: qty,
        openingRatePaise,
        openingValuePaise: qty * openingRatePaise,
        standardSellingPricePaise: sellingPricePaise,
        godownId: formData.godownId,
      });
    } catch (err: any) {
      setError(err.message || 'Error saving item');
      setSubmitting(false);
    }
  };

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
      <div className="tally-form-card" style={{ maxWidth: '780px' }}>
        <div className="tally-form-header">
          <span>{isAlter ? `Stock Item Alteration: ${item?.name}` : 'Stock Item Creation'}</span>
          <span style={{ fontSize: '11px', color: '#ffff00' }}>[Ctrl+A: Accept | Esc: Quit]</span>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ffdddd', color: '#900', padding: '6px 14px', fontWeight: 'bold' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="tally-form-grid">
          <div>
            <div className="tally-field-group">
              <label className="tally-field-label">Name *</label>
              <input
                className="tally-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Accu-Chek Glucose Test Strips 500T"
                autoFocus
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Part No / SKU</label>
              <input
                className="tally-input"
                value={formData.partNumber}
                onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                placeholder="RCH-GLUC-500T"
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Under (Stock Group) *</label>
              <select
                className="tally-select"
                value={formData.stockGroupId}
                onChange={(e) => setFormData({ ...formData, stockGroupId: e.target.value })}
              >
                {stockGroups.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Units of Measure *</label>
              <select
                className="tally-select"
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol} - {u.formalName}
                  </option>
                ))}
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Costing / Valuation Method</label>
              <select
                className="tally-select"
                value={formData.valuationMethod}
                onChange={(e) => setFormData({ ...formData, valuationMethod: e.target.value })}
              >
                <option value="FIFO">FIFO (First In, First Out)</option>
                <option value="Weighted Average">Weighted Average</option>
                <option value="Last Purchase Price">Last Purchase Price</option>
              </select>
            </div>
          </div>

          <div>
            <div className="tally-field-group">
              <label className="tally-field-label">HSN / SAC Code</label>
              <input
                className="tally-input"
                value={formData.hsnSac}
                onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Integrated GST Rate (%)</label>
              <select
                className="tally-select"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Godown / Location</label>
              <select
                className="tally-select"
                value={formData.godownId}
                onChange={(e) => setFormData({ ...formData, godownId: e.target.value })}
              >
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="tally-field-group">
                <label className="tally-field-label">Opening Qty</label>
                <input
                  className="tally-input"
                  type="number"
                  value={formData.openingQty}
                  onChange={(e) => setFormData({ ...formData, openingQty: Number(e.target.value) })}
                />
              </div>

              <div className="tally-field-group">
                <label className="tally-field-label">Opening Rate (₹)</label>
                <input
                  className="tally-input"
                  type="number"
                  step="0.01"
                  value={formData.openingRateRupees}
                  onChange={(e) => setFormData({ ...formData, openingRateRupees: e.target.value })}
                />
              </div>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Standard Selling Price (₹)</label>
              <input
                className="tally-input"
                type="number"
                step="0.01"
                value={formData.standardSellingPriceRupees}
                onChange={(e) => setFormData({ ...formData, standardSellingPriceRupees: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="tally-form-actions">
          <button className="tally-btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel [Esc]
          </button>
          <button className="tally-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : 'Accept [Ctrl+A]'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. UNITS OF MEASURE LIST & CREATE
// ==========================================
export const UnitsView: React.FC<{
  units: TallyUnit[];
  onSaveUnit: (data: Partial<TallyUnit>) => Promise<void>;
  onBack: () => void;
}> = ({ units, onSaveUnit, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [formalName, setFormalName] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState(0);

  const handleCreate = async () => {
    if (!symbol.trim()) return;
    await onSaveUnit({ symbol: symbol.trim(), formalName: formalName.trim() || symbol.trim(), decimalPlaces });
    setIsModalOpen(false);
    setSymbol('');
    setFormalName('');
  };

  return (
    <div className="tally-form-card" style={{ maxWidth: '780px' }}>
      <div className="tally-form-header">
        <span>Units of Measure ({units.length})</span>
        <span style={{ fontSize: '11px', color: '#ffff00' }}>[Alt+C: Create Unit | Esc: Back]</span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#ebdcb2' }}>
        <button className="tally-btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create Unit [Alt+C]
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
                <th style={{ width: '120px' }}>Symbol</th>
                <th>Formal Name</th>
                <th style={{ width: '150px' }}>UQC Code</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Decimal Places</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, idx) => (
                <tr key={u.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{u.symbol}</strong>
                  </td>
                  <td>{u.formalName}</td>
                  <td>{u.uqc}</td>
                  <td style={{ textAlign: 'center' }}>{u.decimalPlaces}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="tally-form-card" style={{ maxWidth: '440px' }}>
            <div className="tally-form-header">
              <span>Unit Creation</span>
              <span style={{ fontSize: '11px' }}>[Ctrl+A: Accept]</span>
            </div>
            <div style={{ padding: '16px' }}>
              <div className="tally-field-group">
                <label className="tally-field-label">Symbol * (e.g. PCS, NOS, BOX)</label>
                <input className="tally-input" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} autoFocus />
              </div>
              <div className="tally-field-group">
                <label className="tally-field-label">Formal Name (e.g. Pieces, Numbers)</label>
                <input className="tally-input" value={formalName} onChange={(e) => setFormalName(e.target.value)} />
              </div>
              <div className="tally-field-group">
                <label className="tally-field-label">Decimal Places</label>
                <input className="tally-input" type="number" value={decimalPlaces} onChange={(e) => setDecimalPlaces(Number(e.target.value))} />
              </div>
            </div>
            <div className="tally-form-actions">
              <button className="tally-btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel [Esc]
              </button>
              <button className="tally-btn-primary" onClick={handleCreate}>
                Accept [Ctrl+A]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. GODOWNS / LOCATIONS LIST & CREATE
// ==========================================
export const GodownsView: React.FC<{
  godowns: TallyGodown[];
  onSaveGodown: (data: Partial<TallyGodown>) => Promise<void>;
  onBack: () => void;
}> = ({ godowns, onSaveGodown, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isColdChain, setIsColdChain] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onSaveGodown({ name: name.trim(), address: address.trim(), isColdChain });
    setIsModalOpen(false);
    setName('');
    setAddress('');
  };

  return (
    <div className="tally-form-card" style={{ maxWidth: '780px' }}>
      <div className="tally-form-header">
        <span>Godowns / Storage Locations ({godowns.length})</span>
        <span style={{ fontSize: '11px', color: '#ffff00' }}>[Alt+C: Create | Esc: Back]</span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end', gap: '8px', backgroundColor: '#ebdcb2' }}>
        <button className="tally-btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create Godown [Alt+C]
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
                <th>Location / Godown Name</th>
                <th>Address</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Cold Chain</th>
              </tr>
            </thead>
            <tbody>
              {godowns.map((g, idx) => (
                <tr key={g.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{g.name}</strong>
                  </td>
                  <td>{g.address || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{g.isColdChain ? '❄️ 2-8°C' : 'Standard'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="tally-form-card" style={{ maxWidth: '440px' }}>
            <div className="tally-form-header">
              <span>Godown Creation</span>
              <span style={{ fontSize: '11px' }}>[Ctrl+A: Accept]</span>
            </div>
            <div style={{ padding: '16px' }}>
              <div className="tally-field-group">
                <label className="tally-field-label">Godown Name *</label>
                <input className="tally-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cold Room #2" autoFocus />
              </div>
              <div className="tally-field-group">
                <label className="tally-field-label">Address / Premises</label>
                <input className="tally-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Warehouse Wing B" />
              </div>
              <div className="tally-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isColdChain} onChange={(e) => setIsColdChain(e.target.checked)} />
                  Cold Chain Facility (2°C - 8°C Temperature Controlled)
                </label>
              </div>
            </div>
            <div className="tally-form-actions">
              <button className="tally-btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel [Esc]
              </button>
              <button className="tally-btn-primary" onClick={handleCreate}>
                Accept [Ctrl+A]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
