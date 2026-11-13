import React, { useState, useEffect, useRef } from 'react';
import { TallyCompany } from './tallyTypes';

interface CompanyCreateAlterModalProps {
  company: TallyCompany | null; // null if Create, company object if Alter
  onSave: (data: Partial<TallyCompany>) => Promise<void>;
  onClose: () => void;
}

export const CompanyCreateAlterModal: React.FC<CompanyCreateAlterModalProps> = ({
  company,
  onSave,
  onClose,
}) => {
  const isAlter = !!company;

  const [formData, setFormData] = useState({
    name: company?.name || '',
    mailingName: company?.mailingName || company?.name || '',
    address: company?.address || '',
    state: company?.state || 'Maharashtra',
    stateCode: company?.stateCode || '27',
    country: company?.country || 'India',
    pincode: company?.pincode || '',
    telephone: company?.telephone || '',
    mobile: company?.mobile || '',
    email: company?.email || '',
    currencySymbol: company?.currencySymbol || '₹',
    formalName: company?.formalName || 'INR',
    financialYearStart: company?.financialYearStart || '2026-04-01',
    booksBeginningDate: company?.booksBeginningDate || '2026-04-01',
    gstin: company?.gstin || '',
    pan: company?.pan || '',
    cin: company?.cin || '',
    enableInventory: company?.features?.enableInventory ?? true,
    enableGst: company?.features?.enableGst ?? true,
    enableBillByBill: company?.features?.enableBillByBill ?? true,
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Focus the first input on open
  useEffect(() => {
    const firstInput = formRef.current?.querySelector('input') as HTMLInputElement;
    if (firstInput) firstInput.focus();
  }, []);

  // Keyboard navigation & Ctrl+A to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        // Move to next input field
        const inputs = Array.from(
          formRef.current?.querySelectorAll('input, select, textarea') || []
        ) as HTMLElement[];
        const currentIndex = inputs.indexOf(e.target);
        if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
          e.preventDefault();
          inputs[currentIndex + 1].focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Company Name is mandatory');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave({
        name: formData.name.trim(),
        mailingName: formData.mailingName.trim() || formData.name.trim(),
        address: formData.address.trim(),
        state: formData.state,
        stateCode: formData.stateCode,
        country: formData.country,
        pincode: formData.pincode.trim(),
        telephone: formData.telephone.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        currencySymbol: formData.currencySymbol,
        formalName: formData.formalName,
        financialYearStart: formData.financialYearStart,
        booksBeginningDate: formData.booksBeginningDate,
        gstin: formData.gstin.trim(),
        pan: formData.pan.trim(),
        cin: formData.cin.trim(),
        features: {
          enableInventory: formData.enableInventory,
          enableGst: formData.enableGst,
          enableBillByBill: formData.enableBillByBill,
          enableCostCentres: false,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save company details');
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
      <div className="tally-form-card" ref={formRef}>
        <div className="tally-form-header">
          <span>{isAlter ? 'Company Alteration' : 'Company Creation'}</span>
          <span style={{ fontSize: '11px', color: '#ffff00' }}>[Ctrl+A: Accept | Esc: Quit]</span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#ffdddd',
              color: '#990000',
              padding: '6px 16px',
              fontSize: '12px',
              borderBottom: '1px solid #ff9999',
              fontWeight: 'bold',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div className="tally-form-grid">
          {/* Left Column: Basic & Mailing Info */}
          <div>
            <div className="tally-field-group">
              <label className="tally-field-label">Directory</label>
              <input
                className="tally-input"
                value="D:\diagnostic-services\data\tally"
                disabled
                style={{ backgroundColor: '#eeeeee', color: '#666' }}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Name *</label>
              <input
                className="tally-input"
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name: val,
                    mailingName: prev.mailingName === prev.name ? val : prev.mailingName,
                  }));
                }}
                placeholder="e.g. A2Z Diagnostic Services Pvt Ltd"
                autoFocus
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Mailing Name</label>
              <input
                className="tally-input"
                value={formData.mailingName}
                onChange={(e) => setFormData({ ...formData, mailingName: e.target.value })}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Address</label>
              <input
                className="tally-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot/Street, Industrial Area, City"
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">State & Code</label>
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
                <option value="Rajasthan|08">Rajasthan (08)</option>
              </select>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Pincode</label>
              <input
                className="tally-input"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                maxLength={6}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Telephone / Mobile</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  className="tally-input"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="Tel (022-...)"
                />
                <input
                  className="tally-input"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="Mobile"
                />
              </div>
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">E-mail</label>
              <input
                className="tally-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="accounts@example.com"
              />
            </div>
          </div>

          {/* Right Column: Financial Year & Statutory Details */}
          <div>
            <div className="tally-field-group">
              <label className="tally-field-label">Financial Year Begins From</label>
              <input
                className="tally-input"
                type="date"
                value={formData.financialYearStart}
                onChange={(e) => setFormData({ ...formData, financialYearStart: e.target.value })}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Books Beginning From</label>
              <input
                className="tally-input"
                type="date"
                value={formData.booksBeginningDate}
                onChange={(e) => setFormData({ ...formData, booksBeginningDate: e.target.value })}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">GSTIN / UIN</label>
              <input
                className="tally-input"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="27AABCU9603R1ZM"
                maxLength={15}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Permanent Account Number (PAN)</label>
              <input
                className="tally-input"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                placeholder="AABCU9603R"
                maxLength={10}
              />
            </div>

            <div className="tally-field-group">
              <label className="tally-field-label">Base Currency Symbol & Formal Name</label>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                <input
                  className="tally-input"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                />
                <input
                  className="tally-input"
                  value={formData.formalName}
                  onChange={(e) => setFormData({ ...formData, formalName: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px', borderTop: '1px solid #d4c7a5', paddingTop: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#004726', marginBottom: '8px' }}>
                Company Features (F11 Defaults)
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.enableInventory}
                  onChange={(e) => setFormData({ ...formData, enableInventory: e.target.checked })}
                />
                Maintain Accounts with Inventory
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.enableGst}
                  onChange={(e) => setFormData({ ...formData, enableGst: e.target.checked })}
                />
                Enable Goods and Services Tax (GST)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.enableBillByBill}
                  onChange={(e) => setFormData({ ...formData, enableBillByBill: e.target.checked })}
                />
                Enable Bill-by-bill (for Debtors / Creditors)
              </label>
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
