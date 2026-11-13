/**
 * Diagnostic Services — Dealer Configuration & White-label Abstraction
 * 
 * Supports independent single-tenant deployments per distributor/dealer.
 * Allows custom branding, logo, support desk contacts, and metadata
 * via environment variables without code modification.
 */

export interface DealerConfig {
  dealerId: string;
  appName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  supportPhone: string;
  supportEmail: string;
  currencySymbol: string;
  currencyCode: string;
  headquartersCity: string;
  timezone: string;
}

export const getDealerConfig = (): DealerConfig => {
  const env = (import.meta as any).env || {};
  return {
    dealerId: env.VITE_DEALER_ID || 'dealer-default',
    appName: env.VITE_DEALER_APP_NAME || 'A2Z Diagnostic Services',
    shortName: env.VITE_DEALER_SHORT_NAME || 'A2Z Diagnostics',
    tagline: env.VITE_DEALER_TAGLINE || 'Enterprise Clinical Diagnostic & Biomedical Distribution Portal',
    logoUrl: env.VITE_DEALER_LOGO_URL || '/assets/logo.jpeg',
    supportPhone: env.VITE_DEALER_SUPPORT_PHONE || '+91 98450 11992',
    supportEmail: env.VITE_DEALER_SUPPORT_EMAIL || 'support@a2zdiagnostic.com',
    currencySymbol: '₹',
    currencyCode: 'INR',
    headquartersCity: env.VITE_DEALER_CITY || 'Mumbai',
    timezone: env.VITE_DEALER_TIMEZONE || 'Asia/Kolkata',
  };
};

export const currentDealerConfig = getDealerConfig();
