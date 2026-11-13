import React, { useState, useEffect, useRef } from 'react';
import { TallyVoucherType } from './tallyTypes';

interface VoucherTypeCreateAlterViewProps {
  onSave: (data: Partial<TallyVoucherType>) => Promise<void>;
  onClose: () => void;
}

export const VoucherTypeCreateAlterView: React.FC<VoucherTypeCreateAlterViewProps> = ({
  onSave,
  onClose,
}) => {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    baseType: 'Sales',
    prefix: 'SINV-26/',
    suffix: '',
    numberingMethod: 'Automatic',
    startingNumber: 1,
    restartPeriod: 'Yearly',
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
      setError('Voucher type name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        name: formData.name.trim(),
        baseType: formData.baseType as any,
        prefix: formData.prefix.trim(),
        suffix: formData.suffix.trim(),
        numberingMethod: formData.numberingMethod as any,
        startingNumber: Number(formData.startingNumber) || 1,
        restartPeriod: formData.restartPeriod as any,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating voucher type');
    } finally {
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
      <div className="tally-form-card" ref={formRef} style={{ maxWidth: '580px' }}>
        <div className="tally-form-header">
          <span>Voucher Type Creation</span>
          <span style={{ fontSize: '11px', color: '#ffff00' }}>[Ctrl+A: Accept | Esc: Quit]</span>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ffdddd', color: '#900', padding: '6px 14px', fontWeight: 'bold' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ padding: '16px' }}>
          <div className="tally-field-group">
            <label className="tally-field-label">Name *</label>
            <input
              className="tally-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Export Sales Invoice"
              autoFocus
            />
          </div>

          <div className="tally-field-group">
            <label className="tally-field-label">Type of Voucher *</label>
            <select
              className="tally-select"
              value={formData.baseType}
              onChange={(e) => setFormData({ ...formData, baseType: e.target.value })}
            >
              <option value="Sales">Sales</option>
              <option value="Purchase">Purchase</option>
              <option value="Payment">Payment</option>
              <option value="Receipt">Receipt</option>
              <option value="Contra">Contra</option>
              <option value="Journal">Journal</option>
              <option value="Credit Note">Credit Note</option>
              <option value="Debit Note">Debit Note</option>
              <option value="Delivery Note">Delivery Note</option>
            </select>
          </div>

          <div className="tally-field-group">
            <label className="tally-field-label">Method of Voucher Numbering</label>
            <select
              className="tally-select"
              value={formData.numberingMethod}
              onChange={(e) => setFormData({ ...formData, numberingMethod: e.target.value })}
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="tally-field-group">
              <label className="tally-field-label">Prefix (e.g. SINV-)</label>
              <input
                className="tally-input"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
              />
            </div>
            <div className="tally-field-group">
              <label className="tally-field-label">Starting Sequence No.</label>
              <input
                className="tally-input"
                type="number"
                value={formData.startingNumber}
                onChange={(e) => setFormData({ ...formData, startingNumber: Number(e.target.value) })}
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
