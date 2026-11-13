import React from 'react';

/**
 * DECOMMISSIONED: Built-in Double-Entry Voucher Creation interface has been permanently removed.
 * Commercial External Tally ERP 9 / TallyPrime is the primary accounting authority.
 * Manual double-entry vouchers (Contra, Payment, Receipt, Journal, Sales, Purchase, Credit/Debit notes)
 * are managed directly in external commercial Tally ERP.
 */
export interface VoucherEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoucherPosted?: (voucher: any) => void;
  token?: string | null;
  initialVoucherType?: any;
}

export const VoucherEntryModal: React.FC<VoucherEntryModalProps> = () => {
  return null;
};
