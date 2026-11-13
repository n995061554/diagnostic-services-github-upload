// ============================================================================
// A2Z MEDIFLOW PRO - HARMONIZED STAGE & WORKFLOW COLOR THEME SYSTEM
// Multi-theme preset engine, shade generator, WCAG contrast analyzer,
// and dynamic :root CSS variable synchronizer.
// ============================================================================

import {
  ORDER_LIFECYCLE_STAGES,
  PAYMENT_STAGES,
  COLD_CHAIN_STAGES,
  SERVICE_ENGINEER_STAGES,
  PREVENTIVE_MAINTENANCE_STAGES,
  StageColorDefinition,
} from './stageThemeColors';

export interface SemanticToken {
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'NEUTRAL';
  label: string;
  bgHex: string;
  textHex: string;
  indicatorHex: string;
  borderHex: string;
  usage: string;
}

export interface BrandFoundation {
  dominant: string;    // Canvas / Main Viewport (--color-ivory / --app-background)
  surface: string;     // Cards / Toolbars (--color-soft-ivory / --card-background)
  lightPista: string;  // Active Pill / Badges / Secondary (--color-light-pista / --button-secondary)
  softPista: string;   // Sidebar / Soft Borders (--color-soft-pista / --sidebar-background)
  forest: string;      // Primary Button / High Contrast Text (--color-forest / --text-primary)
  primaryNavy?: string;    // #0E1035
  deepNavy?: string;       // #15253F
  secondaryNavy?: string;  // #2B3D5B
  slateGrey?: string;      // #7C8594
  mediumGrey?: string;     // #C3C3C3
  lightBlueGrey?: string;  // #D0DEE5
  white?: string;          // #FFFFFF
}

export const GLOBAL_THEME_BASE_COLORS = {
  primaryNavy: '#0E1035',
  deepNavy: '#15253F',
  secondaryNavy: '#2B3D5B',
  slateGrey: '#7C8594',
  mediumGrey: '#C3C3C3',
  lightBlueGrey: '#D0DEE5',
  white: '#FFFFFF',
} as const;

export interface TypographyColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;
  textLink: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  tagline: string;
  category: 'MEDICAL_HERBAL' | 'CLINICAL_BLUE' | 'BIOTECH' | 'APOTHECARY' | 'HEMATOLOGY' | 'MINIMAL_DARK' | 'ENTERPRISE_NAVY' | 'CUSTOM';
  isDefault?: boolean;
  isCustom?: boolean;
  brand: BrandFoundation;
  typography: TypographyColors;
  semantic: {
    success: SemanticToken;
    warning: SemanticToken;
    error: SemanticToken;
    info: SemanticToken;
    neutral: SemanticToken;
  };
}

export interface ShadeStep {
  step: 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  hex: string;
  isLight: boolean;
}

// ----------------------------------------------------------------------------
// Color Math & Utilities
// ----------------------------------------------------------------------------

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Calculate relative luminance for WCAG contrast
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// WCAG Contrast Ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch {
    return 1;
  }
}

// Generate full 10-shade ladder (50 - 900)
export function generateShadeLadder(baseHex: string): ShadeStep[] {
  const rgb = hexToRgb(baseHex);
  const steps: (50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900)[] = [
    50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  ];

  // Base lum
  const baseLum = getLuminance(rgb.r, rgb.g, rgb.b);

  return steps.map(step => {
    let factor: number;
    let targetR: number;
    let targetG: number;
    let targetB: number;

    if (step < 500) {
      // Lighten towards white
      const t = (500 - step) / 500;
      targetR = rgb.r + (255 - rgb.r) * t * 0.95;
      targetG = rgb.g + (255 - rgb.g) * t * 0.95;
      targetB = rgb.b + (255 - rgb.b) * t * 0.95;
    } else if (step === 500) {
      targetR = rgb.r;
      targetG = rgb.g;
      targetB = rgb.b;
    } else {
      // Darken towards black
      const t = (step - 500) / 400;
      targetR = rgb.r * (1 - t * 0.78);
      targetG = rgb.g * (1 - t * 0.78);
      targetB = rgb.b * (1 - t * 0.78);
    }

    const hex = rgbToHex(targetR, targetG, targetB);
    const lum = getLuminance(targetR, targetG, targetB);
    return {
      step,
      hex,
      isLight: lum > 0.45,
    };
  });
}

// ----------------------------------------------------------------------------
// Curated Theme Presets
// ----------------------------------------------------------------------------

export const THEME_PRESETS: ThemePalette[] = [
  {
    id: 'navy_light_grey',
    name: 'Navy Blue & Light Grey (Default Enterprise)',
    tagline: 'Standard enterprise diagnostic theme with Primary Navy, Deep Navy, Slate Grey, and Light Blue-Grey accents',
    category: 'ENTERPRISE_NAVY',
    isDefault: true,
    brand: {
      dominant: '#F4F7F9',
      surface: '#FFFFFF',
      lightPista: '#D0DEE5', // Light Blue-Grey: Active pill, secondary button, subtle chips
      softPista: '#E4ECF0',  // Soft Grey-Blue: borders, background accents
      forest: '#0E1035',     // Primary Navy: Headers, high contrast text, primary buttons
      primaryNavy: '#0E1035',
      deepNavy: '#15253F',
      secondaryNavy: '#2B3D5B',
      slateGrey: '#7C8594',
      mediumGrey: '#C3C3C3',
      lightBlueGrey: '#D0DEE5',
      white: '#FFFFFF',
    },
    typography: {
      textPrimary: '#0E1035',
      textSecondary: '#2B3D5B',
      textMuted: '#7C8594',
      textDisabled: '#C3C3C3',
      textInverse: '#FFFFFF',
      textLink: '#15253F',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#E2F3EB',
        textHex: '#0D5334',
        indicatorHex: '#1E8E5A',
        borderHex: '#1E8E5A',
        usage: 'Confirmed orders, certified calibrations, verified lots',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3D6',
        textHex: '#7A4D05',
        indicatorHex: '#C58A16',
        borderHex: '#C58A16',
        usage: 'Pending payments, approaching expiry, buffer warning',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FDE4E4',
        textHex: '#9B1C1C',
        indicatorHex: '#E02424',
        borderHex: '#E02424',
        usage: 'Cold-chain excursions, overdue maintenance, failed transactions',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#D0DEE5',
        textHex: '#15253F',
        indicatorHex: '#2B3D5B',
        borderHex: '#2B3D5B',
        usage: 'Telemetry sync, courier tracking, batch updates',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#F0F3F6',
        textHex: '#475569',
        indicatorHex: '#7C8594',
        borderHex: '#C3C3C3',
        usage: 'Standby analyzers, archived drafts, neutral metrics',
      },
    },
  },
  {
    id: 'pista_forest',
    name: 'Pista & Forest (Herbal Clinical)',
    tagline: 'Clinical green with organic herbal pista accents and high-contrast forest text',
    category: 'MEDICAL_HERBAL',
    brand: {
      dominant: '#F9FAF6',
      surface: '#F5F6F0',
      lightPista: '#D2E7C4',
      softPista: '#E4F1DC',
      forest: '#22381E',
    },
    typography: {
      textPrimary: '#22381E',
      textSecondary: '#415439',
      textMuted: '#6B7F6A',
      textDisabled: '#A3B39E',
      textInverse: '#F9FAF6',
      textLink: '#22381E',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#D2E7C4',
        textHex: '#22381E',
        indicatorHex: '#5F8F4D',
        borderHex: '#5F8F4D',
        usage: 'Confirmed orders, certified calibrations, verified lots',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#F4DFA3',
        textHex: '#6B4B12',
        indicatorHex: '#C58A16',
        borderHex: '#C58A16',
        usage: 'Pending payments, approaching expiry, buffer warning',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#F3C7C2',
        textHex: '#8F2D25',
        indicatorHex: '#B94A40',
        borderHex: '#B94A40',
        usage: 'Cold-chain excursions, overdue maintenance, failed transactions',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#C9DDE0',
        textHex: '#245B63',
        indicatorHex: '#4C8994',
        borderHex: '#4C8994',
        usage: 'Telemetry sync, courier tracking, batch updates',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E4E8DF',
        textHex: '#4B5A48',
        indicatorHex: '#82917C',
        borderHex: '#82917C',
        usage: 'Standby analyzers, archived drafts, neutral metrics',
      },
    },
  },

  {
    id: 'clinical_sapphire',
    name: 'Clinical Sapphire & Azure',
    tagline: 'Modern acute care hospital aesthetic with sterile ocean blues and crisp high-contrast navy',
    category: 'CLINICAL_BLUE',
    brand: {
      dominant: '#F8FAFC',
      surface: '#F0F6FF',
      lightPista: '#BAE6FD',
      softPista: '#E0F2FE',
      forest: '#0369A1',
    },
    typography: {
      textPrimary: '#0C4A6E',
      textSecondary: '#0369A1',
      textMuted: '#64748B',
      textDisabled: '#94A3B8',
      textInverse: '#F8FAFC',
      textLink: '#0284C7',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#BAF3D7',
        textHex: '#064E3B',
        indicatorHex: '#059669',
        borderHex: '#059669',
        usage: 'Automated test validated, reagent released',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF08A',
        textHex: '#713F12',
        indicatorHex: '#CA8A04',
        borderHex: '#CA8A04',
        usage: 'Calibration pending in 48 hours',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FECDD3',
        textHex: '#881337',
        indicatorHex: '#E11D48',
        borderHex: '#E11D48',
        usage: 'Analyzer offline or sample rejection',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#BAE6FD',
        textHex: '#075985',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'LIS integration packet transmitted',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E2E8F0',
        textHex: '#334155',
        indicatorHex: '#64748B',
        borderHex: '#64748B',
        usage: 'Idle specimen rack slot',
      },
    },
  },

  {
    id: 'nordic_teal',
    name: 'Nordic Teal & Eucalyptus',
    tagline: 'Precision bio-analytical laboratory palette with calming sea-spray teal and pine accents',
    category: 'MEDICAL_HERBAL',
    brand: {
      dominant: '#F7FAF9',
      surface: '#EDF7F5',
      lightPista: '#A7F3D0',
      softPista: '#D1FAE5',
      forest: '#065F46',
    },
    typography: {
      textPrimary: '#064E3B',
      textSecondary: '#047857',
      textMuted: '#6B7280',
      textDisabled: '#9CA3AF',
      textInverse: '#F7FAF9',
      textLink: '#059669',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#A7F3D0',
        textHex: '#064E3B',
        indicatorHex: '#059669',
        borderHex: '#059669',
        usage: 'Biochemistry run passed QC standards',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FDE68A',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Diluent container low level',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FECDD3',
        textHex: '#881337',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Thermal cycling deviation outside range',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#99F6E4',
        textHex: '#115E59',
        indicatorHex: '#0D9488',
        borderHex: '#0D9488',
        usage: 'IoT logger handshake acknowledged',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E5E7EB',
        textHex: '#374151',
        indicatorHex: '#6B7280',
        borderHex: '#6B7280',
        usage: 'Incubator standby status',
      },
    },
  },

  {
    id: 'biotech_amethyst',
    name: 'Biotech Amethyst & Indigo',
    tagline: 'Molecular genetics & automated immunochemistry visual identity with rich violet hues',
    category: 'BIOTECH',
    brand: {
      dominant: '#FAF8FF',
      surface: '#F5F3FF',
      lightPista: '#DDD6FE',
      softPista: '#EDE9FE',
      forest: '#4C1D95',
    },
    typography: {
      textPrimary: '#31106A',
      textSecondary: '#5B21B6',
      textMuted: '#6B7280',
      textDisabled: '#9CA3AF',
      textInverse: '#FAF8FF',
      textLink: '#6D28D9',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#C7D2FE',
        textHex: '#1E1B4B',
        indicatorHex: '#4338CA',
        borderHex: '#4338CA',
        usage: 'PCR Amplification Curve Verified',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FDE68A',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Primer batch approaching expiration',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FBCFE8',
        textHex: '#831843',
        indicatorHex: '#BE185D',
        borderHex: '#BE185D',
        usage: 'Cross-contamination alert in lane 4',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0E7FF',
        textHex: '#312E81',
        indicatorHex: '#4F46E5',
        borderHex: '#4F46E5',
        usage: 'Genomic sequencer run #482 running',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#EDE9FE',
        textHex: '#4C1D95',
        indicatorHex: '#7C3AED',
        borderHex: '#7C3AED',
        usage: 'Centrifuge lid locked idle',
      },
    },
  },

  {
    id: 'apothecary_amber',
    name: 'Apothecary Amber & Espresso',
    tagline: 'Warm pharmaceutical dispensary theme with soothing cream, honey gold, and dark roast brown',
    category: 'APOTHECARY',
    brand: {
      dominant: '#FCFAF7',
      surface: '#F7F2EA',
      lightPista: '#FED7AA',
      softPista: '#FFEDD5',
      forest: '#431407',
    },
    typography: {
      textPrimary: '#431407',
      textSecondary: '#7C2D12',
      textMuted: '#78716C',
      textDisabled: '#A8A29E',
      textInverse: '#FCFAF7',
      textLink: '#9A3412',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#D9F99D',
        textHex: '#14532D',
        indicatorHex: '#16A34A',
        borderHex: '#16A34A',
        usage: 'Stock dispatch approved by pharmacist',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FED7AA',
        textHex: '#7C2D12',
        indicatorHex: '#EA580C',
        borderHex: '#EA580C',
        usage: 'Reorder buffer trigger reached',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FECDD3',
        textHex: '#881337',
        indicatorHex: '#E11D48',
        borderHex: '#E11D48',
        usage: 'Schedule X compound verification mismatch',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0F2FE',
        textHex: '#075985',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'Humidity sensor online at 45% RH',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E7E5E4',
        textHex: '#44403C',
        indicatorHex: '#78716C',
        borderHex: '#78716C',
        usage: 'Cabinet door sensor closed',
      },
    },
  },

  {
    id: 'hematology_ruby',
    name: 'Hematology Ruby & Rose Quartz',
    tagline: 'Specialized blood banking & hematology theme featuring rich carmine accents and blush surfaces',
    category: 'HEMATOLOGY',
    brand: {
      dominant: '#FFF9FA',
      surface: '#FFF1F3',
      lightPista: '#FECDD3',
      softPista: '#FFE4E6',
      forest: '#881337',
    },
    typography: {
      textPrimary: '#4C0519',
      textSecondary: '#881337',
      textMuted: '#71717A',
      textDisabled: '#A1A1AA',
      textInverse: '#FFF9FA',
      textLink: '#BE123C',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#BBF7D0',
        textHex: '#14532D',
        indicatorHex: '#15803D',
        borderHex: '#15803D',
        usage: 'Crossmatch negative & unit released',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF08A',
        textHex: '#713F12',
        indicatorHex: '#CA8A04',
        borderHex: '#CA8A04',
        usage: 'Platelet bag agitating window 6h remaining',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FECDD3',
        textHex: '#881337',
        indicatorHex: '#E11D48',
        borderHex: '#E11D48',
        usage: 'Centrifuge imbalance sensor tripped',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0E7FF',
        textHex: '#312E81',
        indicatorHex: '#4F46E5',
        borderHex: '#4F46E5',
        usage: 'CBC Diff laser optics self-test passed',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#F1F5F9',
        textHex: '#334155',
        indicatorHex: '#64748B',
        borderHex: '#64748B',
        usage: 'Barcode scanner sleep mode',
      },
    },
  },

  {
    id: 'minimal_slate',
    name: 'Minimal Slate & Clinical Steel',
    tagline: 'Ultra-clean, modern monochrome diagnostic aesthetic with neutral stone grays and deep onyx',
    category: 'MINIMAL_DARK',
    brand: {
      dominant: '#FAFAFA',
      surface: '#F4F4F5',
      lightPista: '#E4E4E7',
      softPista: '#E4E4E7',
      forest: '#18181B',
    },
    typography: {
      textPrimary: '#09090B',
      textSecondary: '#27272A',
      textMuted: '#71717A',
      textDisabled: '#A1A1AA',
      textInverse: '#FAFAFA',
      textLink: '#18181B',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#D1FAE5',
        textHex: '#064E3B',
        indicatorHex: '#059669',
        borderHex: '#059669',
        usage: 'Workflow execution successful',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3C7',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Maintenance approaching due date',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FEE2E2',
        textHex: '#7F1D1D',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Immediate operator intervention required',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#DBEAFE',
        textHex: '#1E3A8A',
        indicatorHex: '#2563EB',
        borderHex: '#2563EB',
        usage: 'Firmware check scheduled at 02:00',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E5E7EB',
        textHex: '#374151',
        indicatorHex: '#6B7280',
        borderHex: '#6B7280',
        usage: 'Offline terminal channel',
      },
    },
  },

  {
    id: 'executive_navy',
    name: 'Executive Midnight Navy & Platinum Steel',
    tagline: 'Authoritative hospital administration & enterprise executive suite with deep midnight navy & polished platinum steel',
    category: 'ENTERPRISE_NAVY',
    brand: {
      dominant: '#F8FAFC',
      surface: '#F1F5F9',
      lightPista: '#CBD5E1',
      softPista: '#E2E8F0',
      forest: '#0F172A',
    },
    typography: {
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      textDisabled: '#94A3B8',
      textInverse: '#F8FAFC',
      textLink: '#2563EB',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#DCFCE7',
        textHex: '#14532D',
        indicatorHex: '#16A34A',
        borderHex: '#16A34A',
        usage: 'Enterprise audit verified & certified',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3C7',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Executive approval quota approaching threshold',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FEE2E2',
        textHex: '#7F1D1D',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Urgent contract discrepancy or credit lock',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0F2FE',
        textHex: '#0369A1',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'ERP ledger sync & GL posting active',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E2E8F0',
        textHex: '#334155',
        indicatorHex: '#64748B',
        borderHex: '#64748B',
        usage: 'Archived contract record',
      },
    },
  },

  {
    id: 'mayo_cobalt',
    name: 'Mayo Clinic Cobalt & Sterling Azure',
    tagline: 'World-class academic medical center standard with trusted clinical cobalt blue and crystalline surfaces',
    category: 'CLINICAL_BLUE',
    brand: {
      dominant: '#F8FBFF',
      surface: '#EEF5FF',
      lightPista: '#BFDBFE',
      softPista: '#DBEAFE',
      forest: '#1D4ED8',
    },
    typography: {
      textPrimary: '#1E3A8A',
      textSecondary: '#2563EB',
      textMuted: '#64748B',
      textDisabled: '#94A3B8',
      textInverse: '#FFFFFF',
      textLink: '#1D4ED8',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#DBEAFE',
        textHex: '#1E3A8A',
        indicatorHex: '#2563EB',
        borderHex: '#2563EB',
        usage: 'CLIA reference range verified',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3C7',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Assay calibration delta alert',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FEE2E2',
        textHex: '#7F1D1D',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Critical stat test alert flagged',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0F2FE',
        textHex: '#0369A1',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'Pathology tele-consultation stream open',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#F1F5F9',
        textHex: '#475569',
        indicatorHex: '#94A3B8',
        borderHex: '#94A3B8',
        usage: 'Centrifuge idle standby',
      },
    },
  },

  {
    id: 'swiss_sage',
    name: 'Swiss Bio-Pharma Sage & Alpine Spruce',
    tagline: 'Precision Swiss bio-pharmaceutical visual standard with restrained alpine sage and deep spruce green',
    category: 'MEDICAL_HERBAL',
    brand: {
      dominant: '#F9FAF9',
      surface: '#F2F6F3',
      lightPista: '#CBDAD0',
      softPista: '#E2EAE4',
      forest: '#1B3828',
    },
    typography: {
      textPrimary: '#11261B',
      textSecondary: '#274B36',
      textMuted: '#5F7A6A',
      textDisabled: '#9BB1A4',
      textInverse: '#F9FAF9',
      textLink: '#1B3828',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#D1FAE5',
        textHex: '#064E3B',
        indicatorHex: '#059669',
        borderHex: '#059669',
        usage: 'cGMP batch record signed off',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3C7',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Stability testing cycle day 180 approaching',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FEE2E2',
        textHex: '#7F1D1D',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Cold chain sterile seal breach',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0F2FE',
        textHex: '#0369A1',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'Chromatography column telemetry synchronized',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#ECEFEA',
        textHex: '#4A5B4F',
        indicatorHex: '#7B8D80',
        borderHex: '#7B8D80',
        usage: 'Cleanroom airlock cycle resting',
      },
    },
  },

  {
    id: 'carbon_cyan',
    name: 'Genomics Cyan & Carbon Slate',
    tagline: 'Automated next-gen sequencing (NGS) & molecular robotics identity with carbon slate and luminous cyan',
    category: 'BIOTECH',
    brand: {
      dominant: '#F8FAFB',
      surface: '#EFF6F8',
      lightPista: '#A5F3FC',
      softPista: '#CFFAFE',
      forest: '#0E7490',
    },
    typography: {
      textPrimary: '#164E63',
      textSecondary: '#0891B2',
      textMuted: '#64748B',
      textDisabled: '#94A3B8',
      textInverse: '#FFFFFF',
      textLink: '#0E7490',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#A5F3FC',
        textHex: '#164E63',
        indicatorHex: '#0891B2',
        borderHex: '#0891B2',
        usage: 'Sequencing base call Q-Score > 38 verified',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3C7',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Flow cell temperature drift +0.3°C',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FEE2E2',
        textHex: '#7F1D1D',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Fluidics line blockage detected in lane 2',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0F2FE',
        textHex: '#0369A1',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'Paired-end sequencing run #928 progress: 74%',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#E2E8F0',
        textHex: '#334155',
        indicatorHex: '#64748B',
        borderHex: '#64748B',
        usage: 'Reagent cartridge RFID scanned and loaded',
      },
    },
  },

  {
    id: 'oxford_burgundy',
    name: 'Oxford Pathology Burgundy & Champagne',
    tagline: 'Distinguished academic clinical pathology standard with deep royal wine and vintage laboratory parchment',
    category: 'HEMATOLOGY',
    brand: {
      dominant: '#FAF8F8',
      surface: '#F6F0F1',
      lightPista: '#FECDD3',
      softPista: '#FFE4E6',
      forest: '#651A2B',
    },
    typography: {
      textPrimary: '#4C0519',
      textSecondary: '#881337',
      textMuted: '#71717A',
      textDisabled: '#A1A1AA',
      textInverse: '#FFFFFF',
      textLink: '#9F1239',
    },
    semantic: {
      success: {
        status: 'SUCCESS',
        label: 'Success / Confirmed',
        bgHex: '#DCFCE7',
        textHex: '#14532D',
        indicatorHex: '#16A34A',
        borderHex: '#16A34A',
        usage: 'Histopathology tissue stain confirmed clear',
      },
      warning: {
        status: 'WARNING',
        label: 'Warning / Attention',
        bgHex: '#FEF3C7',
        textHex: '#78350F',
        indicatorHex: '#D97706',
        borderHex: '#D97706',
        usage: 'Fixative formalin pH approaching upper limit',
      },
      error: {
        status: 'ERROR',
        label: 'Critical / Action Needed',
        bgHex: '#FEE2E2',
        textHex: '#7F1D1D',
        indicatorHex: '#DC2626',
        borderHex: '#DC2626',
        usage: 'Urgent frozen section biopsy notification',
      },
      info: {
        status: 'INFO',
        label: 'Info / Telemetry',
        bgHex: '#E0F2FE',
        textHex: '#0369A1',
        indicatorHex: '#0284C7',
        borderHex: '#0284C7',
        usage: 'Whole slide digital scanner transmission active',
      },
      neutral: {
        status: 'NEUTRAL',
        label: 'Neutral / Inactive',
        bgHex: '#F4EDED',
        textHex: '#523E42',
        indicatorHex: '#8C7478',
        borderHex: '#8C7478',
        usage: 'Microscope illumination standby',
      },
    },
  },
];

// ----------------------------------------------------------------------------
// Active Theme State & CSS Root Synchronizer
// ----------------------------------------------------------------------------

const STORAGE_KEY_THEME = 'a2z_mediflow_active_theme_v2';
const STORAGE_KEY_CUSTOM_THEMES = 'a2z_mediflow_custom_themes_v2';
const STORAGE_KEY_DELETED_THEMES = 'a2z_mediflow_deleted_theme_ids_v2';

// Get deleted theme IDs (both custom and hidden preset templates)
export function getDeletedThemeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_THEMES);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

// Delete any theme template (custom or preset)
export function deleteTheme(themeId: string): void {
  // Never allow deleting the primary system default
  if (themeId === THEME_PRESETS[0].id) {
    return;
  }

  // 1. Remove from custom themes
  deleteCustomTheme(themeId);

  // 2. Add to deleted theme IDs
  try {
    const deleted = getDeletedThemeIds();
    if (!deleted.includes(themeId)) {
      deleted.push(themeId);
      localStorage.setItem(STORAGE_KEY_DELETED_THEMES, JSON.stringify(deleted));
    }
  } catch (e) {
    console.warn('Could not record deleted theme', e);
  }

  // 3. If currently active theme is this deleted theme, fallback to default
  const active = getActiveTheme();
  if (active.id === themeId) {
    setActiveTheme(THEME_PRESETS[0]);
  }
}

// Restore all factory preset themes
export function restoreDefaultThemes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DELETED_THEMES);
  } catch {
    // Ignore
  }
  const active = getActiveTheme();
  applyThemeToDocument(active);
  notifyListeners(active);
}

// Get all themes (custom + presets combined, excluding deleted ones)
export function getAllThemes(): ThemePalette[] {
  const deletedIds = new Set(getDeletedThemeIds());
  const custom = getCustomThemes().filter(t => !deletedIds.has(t.id));
  const presets = THEME_PRESETS.filter(t => !deletedIds.has(t.id));
  // Guarantee factory default is always present
  if (!presets.some(p => p.id === THEME_PRESETS[0].id)) {
    presets.unshift(THEME_PRESETS[0]);
  }
  return [...custom, ...presets];
}

// Listeners for multi-component reactive sync
type ThemeChangeListener = (theme: ThemePalette) => void;
const listeners: Set<ThemeChangeListener> = new Set();

export function onThemeChange(listener: ThemeChangeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(theme: ThemePalette) {
  listeners.forEach(cb => {
    try {
      cb(theme);
    } catch (err) {
      console.error('Error notifying theme listener', err);
    }
  });
}

// Apply theme to document element CSS variables
export function applyThemeToDocument(theme: ThemePalette): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Brand Foundation
  root.style.setProperty('--color-ivory', theme.brand.dominant);
  root.style.setProperty('--color-soft-ivory', theme.brand.surface);
  root.style.setProperty('--color-light-pista', theme.brand.lightPista);
  root.style.setProperty('--color-soft-pista', theme.brand.softPista);
  root.style.setProperty('--color-forest', theme.brand.forest);

  // Exact Global Theme Base Tokens: Navy Blue + Light Grey
  root.style.setProperty('--theme-primary-navy', theme.brand.primaryNavy || '#0E1035');
  root.style.setProperty('--theme-deep-navy', theme.brand.deepNavy || '#15253F');
  root.style.setProperty('--theme-secondary-navy', theme.brand.secondaryNavy || '#2B3D5B');
  root.style.setProperty('--theme-slate-grey', theme.brand.slateGrey || '#7C8594');
  root.style.setProperty('--theme-medium-grey', theme.brand.mediumGrey || '#C3C3C3');
  root.style.setProperty('--theme-light-blue-grey', theme.brand.lightBlueGrey || '#D0DEE5');
  root.style.setProperty('--theme-white', theme.brand.white || '#FFFFFF');

  // 2. Typography
  root.style.setProperty('--text-primary', theme.typography.textPrimary);
  root.style.setProperty('--text-secondary', theme.typography.textSecondary);
  root.style.setProperty('--text-muted', theme.typography.textMuted);
  root.style.setProperty('--text-disabled', theme.typography.textDisabled);
  root.style.setProperty('--text-inverse', theme.typography.textInverse);
  root.style.setProperty('--text-link', theme.typography.textLink);

  // 3. Semantic UI Colors
  root.style.setProperty('--status-success-bg', theme.semantic.success.bgHex);
  root.style.setProperty('--status-success-text', theme.semantic.success.textHex);
  root.style.setProperty('--status-success-indicator', theme.semantic.success.indicatorHex);

  root.style.setProperty('--status-warning-bg', theme.semantic.warning.bgHex);
  root.style.setProperty('--status-warning-text', theme.semantic.warning.textHex);
  root.style.setProperty('--status-warning-indicator', theme.semantic.warning.indicatorHex);

  root.style.setProperty('--status-error-bg', theme.semantic.error.bgHex);
  root.style.setProperty('--status-error-text', theme.semantic.error.textHex);
  root.style.setProperty('--status-error-indicator', theme.semantic.error.indicatorHex);

  root.style.setProperty('--status-info-bg', theme.semantic.info.bgHex);
  root.style.setProperty('--status-info-text', theme.semantic.info.textHex);
  root.style.setProperty('--status-info-indicator', theme.semantic.info.indicatorHex);

  root.style.setProperty('--status-neutral-bg', theme.semantic.neutral.bgHex);
  root.style.setProperty('--status-neutral-text', theme.semantic.neutral.textHex);
  root.style.setProperty('--status-neutral-indicator', theme.semantic.neutral.indicatorHex);

  // 4. UI Components & Layout
  root.style.setProperty('--button-primary', theme.brand.forest);
  root.style.setProperty('--button-secondary', theme.brand.lightPista);
  root.style.setProperty('--button-text', theme.typography.textInverse);
  root.style.setProperty('--border-default', theme.brand.lightPista);
  root.style.setProperty('--border-soft', theme.brand.softPista);
  root.style.setProperty('--focus-ring', theme.brand.forest);

  root.style.setProperty('--app-background', theme.brand.dominant);
  root.style.setProperty('--card-background', theme.brand.surface);
  root.style.setProperty('--sidebar-background', theme.brand.softPista);
  root.style.setProperty('--sidebar-text', theme.typography.textPrimary);
  root.style.setProperty('--header-background', theme.brand.surface);

  // Generate and set harmonic step variables so all shaded elements respond
  try {
    const forestLadder = generateShadeLadder(theme.brand.forest);
    forestLadder.forEach(step => {
      root.style.setProperty(`--color-forest-${step.step}`, step.hex);
    });
    const pistaLadder = generateShadeLadder(theme.brand.lightPista);
    pistaLadder.forEach(step => {
      root.style.setProperty(`--color-pista-${step.step}`, step.hex);
    });
  } catch {
    // Ignore shade ladder error
  }

  // Also store active theme ID in body attribute for custom styling hooks
  document.body.setAttribute('data-theme', theme.id);
}

// Get active theme from localStorage or fallback to default
export function getActiveTheme(): ThemePalette {
  if (typeof window === 'undefined') return THEME_PRESETS[0];

  try {
    const raw = localStorage.getItem(STORAGE_KEY_THEME);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy default if previously set to pista_forest
      if (parsed?.id === 'pista_forest') {
        return THEME_PRESETS[0];
      }
      // Verify parsed shape
      if (parsed && parsed.brand && parsed.semantic) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read theme from localStorage', e);
  }

  return THEME_PRESETS[0];
}

// Set active theme and save to localStorage
export function setActiveTheme(theme: ThemePalette): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
  } catch (e) {
    console.warn('Could not save theme to localStorage', e);
  }

  applyThemeToDocument(theme);
  notifyListeners(theme);
}

// Set theme by preset ID
export function setActiveThemeById(id: string): ThemePalette {
  const found = THEME_PRESETS.find(t => t.id === id);
  if (found) {
    setActiveTheme(found);
    return found;
  }
  // Check custom themes
  const customThemes = getCustomThemes();
  const custom = customThemes.find(t => t.id === id);
  if (custom) {
    setActiveTheme(custom);
    return custom;
  }
  setActiveTheme(THEME_PRESETS[0]);
  return THEME_PRESETS[0];
}

// Get custom user themes
export function getCustomThemes(): ThemePalette[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_THEMES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return [];
}

// Save a custom user theme
export function saveCustomTheme(customTheme: ThemePalette): void {
  try {
    const existing = getCustomThemes();
    const filtered = existing.filter(t => t.id !== customTheme.id);
    filtered.unshift(customTheme);
    localStorage.setItem(STORAGE_KEY_CUSTOM_THEMES, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Could not save custom theme', e);
  }

  setActiveTheme(customTheme);
}

// Directly update and save a specific brand shade on the active theme
export function updateThemeShade(
  foundationKey: keyof BrandFoundation,
  hex: string
): ThemePalette {
  const current = getActiveTheme();
  const custom: ThemePalette = {
    ...current,
    id: current.isCustom ? current.id : `custom_${Date.now()}`,
    name: current.name.includes('(Customized)') ? current.name : `${current.name.split('(')[0].trim()} (Customized)`,
    isCustom: true,
    brand: {
      ...current.brand,
      [foundationKey]: hex,
    },
  };
  saveCustomTheme(custom);
  return custom;
}

// Delete custom theme
export function deleteCustomTheme(themeId: string): void {
  try {
    const existing = getCustomThemes();
    const filtered = existing.filter(t => t.id !== themeId);
    localStorage.setItem(STORAGE_KEY_CUSTOM_THEMES, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Could not delete custom theme', e);
  }
}

// Reset theme back to factory default (Pista & Forest)
export function resetToFactoryTheme(): ThemePalette {
  const defaultTheme = THEME_PRESETS[0];
  setActiveTheme(defaultTheme);
  return defaultTheme;
}

// Generate complete CSS block for export
export function generateThemeCssBlock(theme: ThemePalette): string {
  return `:root {
  /* ========================================================================
     A2Z Stage & Workflow Color System: ${theme.name}
     ${theme.tagline}
     ======================================================================== */

  /* Brand Foundation */
  --color-ivory: ${theme.brand.dominant};
  --color-soft-ivory: ${theme.brand.surface};
  --color-light-pista: ${theme.brand.lightPista};
  --color-soft-pista: ${theme.brand.softPista};
  --color-forest: ${theme.brand.forest};

  /* Typography */
  --text-primary: ${theme.typography.textPrimary};
  --text-secondary: ${theme.typography.textSecondary};
  --text-muted: ${theme.typography.textMuted};
  --text-disabled: ${theme.typography.textDisabled};
  --text-inverse: ${theme.typography.textInverse};
  --text-link: ${theme.typography.textLink};

  /* Semantic Workflow Colors */
  --status-success-bg: ${theme.semantic.success.bgHex};
  --status-success-text: ${theme.semantic.success.textHex};
  --status-success-indicator: ${theme.semantic.success.indicatorHex};

  --status-warning-bg: ${theme.semantic.warning.bgHex};
  --status-warning-text: ${theme.semantic.warning.textHex};
  --status-warning-indicator: ${theme.semantic.warning.indicatorHex};

  --status-error-bg: ${theme.semantic.error.bgHex};
  --status-error-text: ${theme.semantic.error.textHex};
  --status-error-indicator: ${theme.semantic.error.indicatorHex};

  --status-info-bg: ${theme.semantic.info.bgHex};
  --status-info-text: ${theme.semantic.info.textHex};
  --status-info-indicator: ${theme.semantic.info.indicatorHex};

  --status-neutral-bg: ${theme.semantic.neutral.bgHex};
  --status-neutral-text: ${theme.semantic.neutral.textHex};
  --status-neutral-indicator: ${theme.semantic.neutral.indicatorHex};

  /* Layout & Controls */
  --app-background: ${theme.brand.dominant};
  --card-background: ${theme.brand.surface};
  --sidebar-background: ${theme.brand.softPista};
  --header-background: ${theme.brand.surface};
  --button-primary: ${theme.brand.forest};
  --button-secondary: ${theme.brand.lightPista};
  --border-default: ${theme.brand.lightPista};
  --border-soft: ${theme.brand.softPista};
  --focus-ring: ${theme.brand.forest};
}`;
}
