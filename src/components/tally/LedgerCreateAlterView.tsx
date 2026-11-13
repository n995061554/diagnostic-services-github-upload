import React, { useState, useEffect, useRef } from 'react';
import { TallyLedger, TallyAccountGroup } from './tallyTypes';

interface LedgerCreateAlterViewProps {
  ledger: TallyLedger | null; // null if create, object if alter
  groups: TallyAccountGroup[];
  onSave: (data: Partial<TallyLedger>) => Promise<void>;
  onClose: () => void;
  onQuickCreateGroup?: () => void;
}

export const LedgerCreateAlterView: React.FC<LedgerCreateAlterViewProps> = ({
  ledger,
  groups,
  onSave,
  onClose,
  onQuickCreateGroup,
}) => {
  const isAlter = !!ledger;
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: ledger?.name || '',
    alias: ledger?.alias || '',
    groupId: ledger?.groupId || groups[0]?.id || '',
    openingBalanceRupees: ledger ? (ledger.openingBalancePaise / 100).toString() : '0',
    openingBalanceType: ledger?.openingBalanceType || 'Dr',
    billByBillEnabled: ledger?.billByBillEnabled ?? false,
    gstin: ledger?.gstin || '',
    state: ledger?.state || 'Maharashtra',
    stateCode: ledger?.stateCode || '27',
    address: ledger?.address || '',
    contactPerson: ledger?.contactPerson || '',
    phone: ledger?.phone || '',
    email: ledger?.email || '',
    bankAccountNo: ledger?.bankDetails?.accountNo || '',
    bankIfsc: ledger?.bankDetails?.ifsc || '',
    bankName: ledger?.bankDetails?.bankName || '',
    bankBranch: ledger?.bankDetails?.branch || '',
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const firstInput = formRef.current?.querySelector('input') as HTMLInputElement;
    if (firstInput) firstInput.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.altKey && e.key.toLowerCase() === 'c') {
        if (onQuickCreateGroup) {
          e.preventDefault();
          onQuickCreateGroup();
        }
      } else if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        const inputs = Array.from(
          formRef.current?.querySelectorAll('input, select, textarea') || []
        ) as HTMLElement[];
        const idx = inputs.indexOf(e.target);
        if (idx >= 0 && idx < inputs.length - 1) {
          e.preventDefault();
          inputs[idx + 1].focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Ledger Name is required');
      return;
    }
    if (!formData.groupId) {
      setError('Please select parent group');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const rupees = parseFloat(formData.openingBalanceRupees) || 0;
      const openingPaise = Math.round(rupees * 100);

      await onSave({
        name: formData.name.trim(),
        alias: formData.alias.trim(),
        groupId: formData.groupId,
        openingBalancePaise: openingPaise,
        openingBalanceType: formData.openingBalanceType as any,
        billByBillEnabled: formData.billByBillEnabled,
        gstin: formData.gstin.trim(),
        state: formData.state,
        stateCode: formData.stateCode,
        address: formData.address.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        bankDetails: {
          accountNo: formData.bankAccountNo.trim(),
          ifsc: formData.bankIfsc.trim(),
          bankName: formData.bankName.trim(),
          branch: formData.bankBranch.trim(),
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving ledger');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === formData.groupId);
  const isBankGroup = selectedGroup?.name.toLowerCase().includes('bank');

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
      <div className="tally-form-card" ref={formRef} style={{ maxWidth: '820px' }}>
        <div className="tally-form-header">
          <span>{isAlter ? `Ledger Alteration: ${ledger?.name}` : 'Ledger Creation'}</span>
          <span style={{ fontSize: '11px', color: '#ffff00' }}>[Ctrl+A: Accept | Esc: Quit | Alt+C: Create Group]</span>
        </div>

        {error && (
          <div style={{ backgroundColor: '#ffdddd', color: '#900', padding: '6px 16px', fontWeight: 'bold' }}>
            ⚠️ {error}
          </div>
        )}

        <div className="tally-form-grid">
          {/* Left Column: Name & Group Classification */}
          <div>
            <div className="tally-field-group">
              <label className="tally-field-label">Name *</label>
              <input
                className="tally-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Metropolis Diagnostics Lab"
                autoFocus
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Alias (Short Name)</label>
              <input
                className="tally-input"
                value={formData.alias}
                onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                placeholder="e.g. Metro Lab"
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Under (Account Group) *</label>
              <select
                className="tally-select"
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.nature})
                  </option>
                ))}
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Maintain Balances Bill-by-Bill</label>
              <select
                className="tally-select"
                value={formData.billByBillEnabled ? 'Yes' : 'No'}
                onChange={(e) => setFormData({ ...formData, billByBillEnabled: e.target.value === 'Yes' })}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Opening Balance (₹) & Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: '8px' }}>
                <input
                  className="tally-input"
                  type="number"
                  step="0.01"
                  value={formData.openingBalanceRupees}
                  onChange={(e) => setFormData({ ...formData, openingBalanceRupees: e.target.value })}
                />
                <select
                  className="tally-select"
                  value={formData.openingBalanceType}
                  onChange={(e) => setFormData({ ...formData, openingBalanceType: e.target.value as any })}
                >
                  <option value="Dr">Dr</option>
                  <option value="Cr">Cr</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Statutory & Banking Details */}
          <div>
            <div className="tally-field-group">
              <label className="tally-field-label">GSTIN / UIN</label>
              <input
                className="tally-input"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="27AABCM8821Q1Z4"
                maxLength={15}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">State</label>
              <select
                className="tally-select"
                value={`${formData.state}|${formData.stateCode}`}
                onChange={(e) => {
                  const [st, cd] = e.target.value.split('|');
                  setFormData({ ...formData, state: st, stateCode: cd });
                }}
              >
                <option value="Maharashtra|27">Maharashtra (27)</option>
                <option value="Karnataka|29">Karnataka (29)</option>
                <option value="Gujarat|24">Gujarat (24)</option>
                <option value="Delhi|07">Delhi (07)</option>
                <option value="Tamil Nadu|33">Tamil Nadu (33)</option>
                <option value="Telangana|36">Telangana (36)</option>
                <option value="Uttar Pradesh|09">Uttar Pradesh (09)</option>
                <option value="West Bengal|19">West Bengal (19)</option>
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Address</label>
              <input
                className="tally-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Premises, Street, City"
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Contact Person / Phone</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  className="tally-input"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Person"
                />
                <input
                  className="tally-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone"
                />
              </div>
            </div>

            {isBankGroup && (
              <div style={{ border: '1px solid #7F9DB9', padding: '8px', backgroundColor: '#eaf4ff', marginTop: '6px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#003366', marginBottom: '6px' }}>
                  Bank Details Configuration
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <input
                    className="tally-input"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    placeholder="A/C Number"
                  />
                  <input
                    className="tally-input"
                    value={formData.bankIfsc}
                    onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                    placeholder="IFSC Code"
                  />
                  <input
                    className="tally-input"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Bank Name"
                  />
                  <input
                    className="tally-input"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    placeholder="Branch"
                  />
                </div>
              </div>
            )}
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
