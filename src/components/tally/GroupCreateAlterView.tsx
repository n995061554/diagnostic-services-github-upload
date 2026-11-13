import React, { useState, useEffect, useRef } from 'react';
import { TallyAccountGroup } from './tallyTypes';

interface GroupCreateAlterViewProps {
  groups: TallyAccountGroup[];
  onSave: (data: { name: string; parentGroupName?: string | null; nature?: any; affectsGrossProfit?: boolean }) => Promise<void>;
  onClose: () => void;
}

export const GroupCreateAlterView: React.FC<GroupCreateAlterViewProps> = ({
  groups,
  onSave,
  onClose,
}) => {
  const formRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState('');
  const [parentGroupName, setParentGroupName] = useState(groups[0]?.name || '');
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
  }, [name, parentGroupName]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Group name is mandatory');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        name: name.trim(),
        parentGroupName: parentGroupName || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating group');
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
      <div className="tally-form-card" ref={formRef} style={{ maxWidth: '520px' }}>
        <div className="tally-form-header">
          <span>Group Creation</span>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South Region Distributors"
              autoFocus
            />
          </div>

          <div className="tally-field-group">
            <label className="tally-field-label">Under (Parent Group) *</label>
            <select
              className="tally-select"
              value={parentGroupName}
              onChange={(e) => setParentGroupName(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name} ({g.nature})
                </option>
              ))}
            </select>
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
