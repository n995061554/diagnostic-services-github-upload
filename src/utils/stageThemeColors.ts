// ============================================================================
// A2Z MEDIFLOW PRO - STAGE THEME & COLOR PALETTE SYSTEM
// Cohesive medical diagnostics enterprise color theme built around:
// - Brand Foundation:
//   * Ivory: #F9FAF6
//   * Soft Ivory: #F5F6F0
//   * Light Pista: #D2E7C4
//   * Soft Pista: #E4F1DC
//   * Forest: #22381E
// With harmonized semantic stage colors for orders, payments, service, and cold chain.
// ============================================================================

export interface StageColorDefinition {
  stageKey: string;
  stageName: string;
  category: 'ORDER' | 'PAYMENT' | 'COLD_CHAIN' | 'SERVICE' | 'MAINTENANCE' | 'SYNC';
  stepNumber?: number;
  description: string;
  badge: {
    bgHex: string;
    textHex: string;
    borderHex: string;
    dotHex: string;
    tailwindClass: string;
  };
  cardAccent: {
    bgLight: string;
    borderLight: string;
    indicatorHex: string;
  };
  recommendedIcon: string;
}

export const BRAND_PALETTE = {
  dominant: {
    name: 'Ivory Canvas',
    hex: '#F9FAF6',
    rgb: '249, 250, 246',
    role: '--color-ivory / --app-background: Main viewport and screen canvases',
    contrastWithForest: '13.2:1 (AAA High Contrast)',
  },
  surface: {
    name: 'Soft Ivory',
    hex: '#F5F6F0',
    rgb: '245, 246, 240',
    role: '--color-soft-ivory / --card-background / --header-background: Card surfaces, toolbars, and header rows',
    contrastWithForest: '12.6:1 (AAA High Contrast)',
  },
  secondary: {
    name: 'Light Pista',
    hex: '#D2E7C4',
    rgb: '210, 231, 196',
    role: '--color-light-pista / --button-secondary / --border-default: Active badges, pills, secondary buttons',
    contrastWithForest: '9.8:1 (AAA Contrast)',
  },
  softPista: {
    name: 'Soft Pista',
    hex: '#E4F1DC',
    rgb: '228, 241, 220',
    role: '--color-soft-pista / --sidebar-background / --border-soft: Light navigation sidebar background, subtle borders, hover card fills, table highlights',
    contrastWithForest: '11.4:1 (AAA Contrast)',
  },
  forest: {
    name: 'Forest',
    hex: '#22381E',
    rgb: '34, 56, 30',
    role: '--color-forest / --text-primary / --button-primary / --focus-ring: Primary buttons, dark body text, and key branding',
    contrastWithIvory: '13.2:1 (AAA Contrast)',
  },
};

// ============================================================================
// UPDATED SEMANTIC UI COLOR SYSTEM (Soft, Nature-Inspired Enterprise Palette)
// ============================================================================
export interface SemanticColorToken {
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' | 'NEUTRAL';
  label: string;
  bgHex: string;
  textHex: string;
  indicatorHex: string;
  borderHex: string;
  tailwindClass: string;
  example: string;
  usage: string;
}

export const SEMANTIC_PALETTE: Record<'success' | 'warning' | 'error' | 'info' | 'neutral', SemanticColorToken> = {
  success: {
    status: 'SUCCESS',
    label: 'Success',
    bgHex: '#D2E7C4',
    textHex: '#22381E',
    indicatorHex: '#5F8F4D',
    borderHex: '#5F8F4D',
    tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]/40',
    example: '✓ Order Confirmed',
    usage: 'Confirmed orders, completed payments, successful operations.',
  },
  warning: {
    status: 'WARNING',
    label: 'Warning',
    bgHex: '#F4DFA3',
    textHex: '#6B4B12',
    indicatorHex: '#C58A16',
    borderHex: '#C58A16',
    tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]/40',
    example: '⚠ Payment Pending',
    usage: 'Pending payments, approaching temperature limits, pending approvals.',
  },
  error: {
    status: 'ERROR',
    label: 'Error',
    bgHex: '#F3C7C2',
    textHex: '#8F2D25',
    indicatorHex: '#B94A40',
    borderHex: '#B94A40',
    tailwindClass: 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]/40',
    example: '✕ Payment Failed',
    usage: 'Payment failures, critical alerts, temperature excursions, service failures.',
  },
  info: {
    status: 'INFO',
    label: 'Info',
    bgHex: '#C9DDE0',
    textHex: '#245B63',
    indicatorHex: '#4C8994',
    borderHex: '#4C8994',
    tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]/40',
    example: 'ⓘ New Shipment Update',
    usage: 'Shipment updates, informational notifications, newly created records.',
  },
  neutral: {
    status: 'NEUTRAL',
    label: 'Neutral',
    bgHex: '#E4E8DF',
    textHex: '#4B5A48',
    indicatorHex: '#82917C',
    borderHex: '#82917C',
    tailwindClass: 'bg-[#E4E8DF] text-[#4B5A48] border-[#82917C]/40',
    example: '— Device Inactive',
    usage: 'Inactive devices, disabled elements, archived records, neutral states.',
  },
};

export const ORDER_LIFECYCLE_STAGES: StageColorDefinition[] = [
  {
    stageKey: 'DRAFT_CART',
    stageName: 'Draft / Requisition Cart',
    category: 'ORDER',
    stepNumber: 1,
    description: 'Items added to customer cart with contract prices and volume pack multiplier calculated.',
    badge: {
      bgHex: '#E4E8DF',
      textHex: '#4B5A48',
      borderHex: '#82917C',
      dotHex: '#82917C',
      tailwindClass: 'bg-[#E4E8DF] text-[#4B5A48] border-[#82917C]',
    },
    cardAccent: {
      bgLight: '#F5F6F0',
      borderLight: '#E4E8DF',
      indicatorHex: '#82917C',
    },
    recommendedIcon: 'ShoppingCart',
  },
  {
    stageKey: 'PENDING_PAYMENT',
    stageName: 'Pending Payment / PO Approval',
    category: 'ORDER',
    stepNumber: 2,
    description: 'Order placed; waiting for online payment authorization, 2% advance discount lock, or PO slip verification.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: {
      bgLight: '#FFFDF5',
      borderLight: '#F4DFA3',
      indicatorHex: '#C58A16',
    },
    recommendedIcon: 'Clock',
  },
  {
    stageKey: 'CONFIRMED',
    stageName: 'Confirmed / Payment Verified',
    category: 'ORDER',
    stepNumber: 3,
    description: 'Payment signature verified or Credit terms approved. Cryptographic Immutable Price Snapshot sealed.',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: {
      bgLight: '#F5F6F0',
      borderLight: '#D2E7C4',
      indicatorHex: '#5F8F4D',
    },
    recommendedIcon: 'CheckCircle2',
  },
  {
    stageKey: 'PROCESSING',
    stageName: 'Processing & Batch Allocation',
    category: 'ORDER',
    stepNumber: 4,
    description: 'Warehouse picks reagents, verifies FEFO expiry dates, and allocates ice-gel packs for cold chain.',
    badge: {
      bgHex: '#C9DDE0',
      textHex: '#245B63',
      borderHex: '#4C8994',
      dotHex: '#4C8994',
      tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]',
    },
    cardAccent: {
      bgLight: '#F4F9FA',
      borderLight: '#C9DDE0',
      indicatorHex: '#4C8994',
    },
    recommendedIcon: 'Package',
  },
  {
    stageKey: 'DISPATCHED',
    stageName: 'Dispatched / In Transit',
    category: 'ORDER',
    stepNumber: 5,
    description: 'Courier picked up cargo with active Bluetooth/IoT data logger monitoring 2°C - 8°C temperature.',
    badge: {
      bgHex: '#C9DDE0',
      textHex: '#245B63',
      borderHex: '#4C8994',
      dotHex: '#4C8994',
      tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]',
    },
    cardAccent: {
      bgLight: '#F4F9FA',
      borderLight: '#C9DDE0',
      indicatorHex: '#4C8994',
    },
    recommendedIcon: 'Truck',
  },
  {
    stageKey: 'OUT_FOR_DELIVERY',
    stageName: 'Out for Delivery (Final Mile)',
    category: 'ORDER',
    stepNumber: 6,
    description: 'Delivery agent en route to the pathology laboratory. Lab technician alert dispatched via SMS/App.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: {
      bgLight: '#FFFDF5',
      borderLight: '#F4DFA3',
      indicatorHex: '#C58A16',
    },
    recommendedIcon: 'MapPin',
  },
  {
    stageKey: 'DELIVERED',
    stageName: 'Delivered & Temp Verified',
    category: 'ORDER',
    stepNumber: 7,
    description: 'Reagents handed over with digital signature, temperature curve confirmed intact without excursions.',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: {
      bgLight: '#F9FAF6',
      borderLight: '#D2E7C4',
      indicatorHex: '#5F8F4D',
    },
    recommendedIcon: 'BadgeCheck',
  },
  {
    stageKey: 'CANCELLED',
    stageName: 'Cancelled / Rejected',
    category: 'ORDER',
    stepNumber: 8,
    description: 'Order voided or cancelled. Credit limit restored or refund queued.',
    badge: {
      bgHex: '#F3C7C2',
      textHex: '#8F2D25',
      borderHex: '#B94A40',
      dotHex: '#B94A40',
      tailwindClass: 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]',
    },
    cardAccent: {
      bgLight: '#FCF3F2',
      borderLight: '#F3C7C2',
      indicatorHex: '#B94A40',
    },
    recommendedIcon: 'XCircle',
  },
];

export const PAYMENT_STAGES: StageColorDefinition[] = [
  {
    stageKey: 'PENDING',
    stageName: 'Payment Pending',
    category: 'PAYMENT',
    description: 'Invoice issued; awaiting bank wire, UPI transaction, or credit ledger debit.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: { bgLight: '#FFFDF5', borderLight: '#F4DFA3', indicatorHex: '#C58A16' },
    recommendedIcon: 'Clock',
  },
  {
    stageKey: 'AUTHORIZED',
    stageName: 'Hold Authorized',
    category: 'PAYMENT',
    description: 'Funds or credit facility pre-authorized pending cold-chain stock confirmation.',
    badge: {
      bgHex: '#C9DDE0',
      textHex: '#245B63',
      borderHex: '#4C8994',
      dotHex: '#4C8994',
      tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]',
    },
    cardAccent: { bgLight: '#F4F9FA', borderLight: '#C9DDE0', indicatorHex: '#4C8994' },
    recommendedIcon: 'ShieldAlert',
  },
  {
    stageKey: 'PAID',
    stageName: 'Paid & Captured',
    category: 'PAYMENT',
    description: 'Instant settlement verified via Razorpay/Cashfree webhook or bank slip reconciliation.',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: { bgLight: '#F5F6F0', borderLight: '#D2E7C4', indicatorHex: '#5F8F4D' },
    recommendedIcon: 'CheckCircle2',
  },
  {
    stageKey: 'FAILED',
    stageName: 'Payment Declined',
    category: 'PAYMENT',
    description: 'Gateway failure, card expired, or insufficient sanctioned credit ceiling.',
    badge: {
      bgHex: '#F3C7C2',
      textHex: '#8F2D25',
      borderHex: '#B94A40',
      dotHex: '#B94A40',
      tailwindClass: 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]',
    },
    cardAccent: { bgLight: '#FCF3F2', borderLight: '#F3C7C2', indicatorHex: '#B94A40' },
    recommendedIcon: 'AlertTriangle',
  },
  {
    stageKey: 'REFUNDED',
    stageName: 'Refund Settled',
    category: 'PAYMENT',
    description: 'Funds returned to source laboratory account or credit ledger credited.',
    badge: {
      bgHex: '#E4E8DF',
      textHex: '#4B5A48',
      borderHex: '#82917C',
      dotHex: '#82917C',
      tailwindClass: 'bg-[#E4E8DF] text-[#4B5A48] border-[#82917C]',
    },
    cardAccent: { bgLight: '#F5F6F0', borderLight: '#E4E8DF', indicatorHex: '#82917C' },
    recommendedIcon: 'RotateCcw',
  },
];

export const COLD_CHAIN_STAGES: StageColorDefinition[] = [
  {
    stageKey: 'OPTIMAL',
    stageName: '2°C - 8°C (Compliant Nominal)',
    category: 'COLD_CHAIN',
    description: 'Temperature is within certified diagnostic reagent preservation range.',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: { bgLight: '#F5F6F0', borderLight: '#D2E7C4', indicatorHex: '#5F8F4D' },
    recommendedIcon: 'ThermometerSnowflake',
  },
  {
    stageKey: 'WARNING',
    stageName: 'Pre-Excursion Alert (1°C or 7.5°C)',
    category: 'COLD_CHAIN',
    description: 'Temperature trend nearing safe limit threshold. Carrier contacted for replenishment.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: { bgLight: '#FFFDF5', borderLight: '#F4DFA3', indicatorHex: '#C58A16' },
    recommendedIcon: 'AlertTriangle',
  },
  {
    stageKey: 'EXCURSION',
    stageName: 'Excursion Breached (>8.5°C or <0°C)',
    category: 'COLD_CHAIN',
    description: 'Reagents breached stability curve. Automatic lab warning & RMA ticket initiated.',
    badge: {
      bgHex: '#F3C7C2',
      textHex: '#8F2D25',
      borderHex: '#B94A40',
      dotHex: '#B94A40',
      tailwindClass: 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]',
    },
    cardAccent: { bgLight: '#FCF3F2', borderLight: '#F3C7C2', indicatorHex: '#B94A40' },
    recommendedIcon: 'Flame',
  },
];

export const SERVICE_ENGINEER_STAGES: StageColorDefinition[] = [
  {
    stageKey: 'NEW',
    stageName: 'New Breakdown Ticket',
    category: 'SERVICE',
    description: 'Laboratory reported equipment stoppage or calibration anomaly.',
    badge: {
      bgHex: '#C9DDE0',
      textHex: '#245B63',
      borderHex: '#4C8994',
      dotHex: '#4C8994',
      tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]',
    },
    cardAccent: { bgLight: '#F4F9FA', borderLight: '#C9DDE0', indicatorHex: '#4C8994' },
    recommendedIcon: 'AlertCircle',
  },
  {
    stageKey: 'ASSIGNED',
    stageName: 'Engineer Dispatched',
    category: 'SERVICE',
    description: 'Field Service Engineer assigned with required diagnostic toolkits and spare parts.',
    badge: {
      bgHex: '#C9DDE0',
      textHex: '#245B63',
      borderHex: '#4C8994',
      dotHex: '#4C8994',
      tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]',
    },
    cardAccent: { bgLight: '#F4F9FA', borderLight: '#C9DDE0', indicatorHex: '#4C8994' },
    recommendedIcon: 'UserCheck',
  },
  {
    stageKey: 'IN_PROGRESS',
    stageName: 'On-Site Diagnostics & Repair',
    category: 'SERVICE',
    description: 'Engineer checked in via GPS at customer lab; active laser optics or fluidics repair.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: { bgLight: '#FFFDF5', borderLight: '#F4DFA3', indicatorHex: '#C58A16' },
    recommendedIcon: 'Wrench',
  },
  {
    stageKey: 'WAITING_FOR_PARTS',
    stageName: 'OEM Spares Pending',
    category: 'SERVICE',
    description: 'Specialized optical sensor or peristaltic pump shipped from central warehouse.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: { bgLight: '#FFFDF5', borderLight: '#F4DFA3', indicatorHex: '#C58A16' },
    recommendedIcon: 'Layers',
  },
  {
    stageKey: 'RESOLVED',
    stageName: 'Resolved & Quality Tested',
    category: 'SERVICE',
    description: 'Quality controls verified within standard standard deviations (SD). Signed FSR uploaded.',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: { bgLight: '#F5F6F0', borderLight: '#D2E7C4', indicatorHex: '#5F8F4D' },
    recommendedIcon: 'CheckSquare',
  },
  {
    stageKey: 'CLOSED',
    stageName: 'Closed & Archival Complete',
    category: 'SERVICE',
    description: 'Lab director rated 5/5; SLA metrics recorded for uptime guarantee compliance.',
    badge: {
      bgHex: '#E4E8DF',
      textHex: '#4B5A48',
      borderHex: '#82917C',
      dotHex: '#82917C',
      tailwindClass: 'bg-[#E4E8DF] text-[#4B5A48] border-[#82917C]',
    },
    cardAccent: { bgLight: '#F5F6F0', borderLight: '#E4E8DF', indicatorHex: '#82917C' },
    recommendedIcon: 'Archive',
  },
];

export const PREVENTIVE_MAINTENANCE_STAGES: StageColorDefinition[] = [
  {
    stageKey: 'SCHEDULED',
    stageName: 'Scheduled Calendar Event',
    category: 'MAINTENANCE',
    description: 'Quarterly or bi-annual PM auto-scheduled under active AMC/CMC contract.',
    badge: {
      bgHex: '#C9DDE0',
      textHex: '#245B63',
      borderHex: '#4C8994',
      dotHex: '#4C8994',
      tailwindClass: 'bg-[#C9DDE0] text-[#245B63] border-[#4C8994]',
    },
    cardAccent: { bgLight: '#F4F9FA', borderLight: '#C9DDE0', indicatorHex: '#4C8994' },
    recommendedIcon: 'Calendar',
  },
  {
    stageKey: 'IN_PROGRESS',
    stageName: 'PM Service Active',
    category: 'MAINTENANCE',
    description: 'Checklist execution: tube cleaning, lamp calibration, filter replacement.',
    badge: {
      bgHex: '#F4DFA3',
      textHex: '#6B4B12',
      borderHex: '#C58A16',
      dotHex: '#C58A16',
      tailwindClass: 'bg-[#F4DFA3] text-[#6B4B12] border-[#C58A16]',
    },
    cardAccent: { bgLight: '#FFFDF5', borderLight: '#F4DFA3', indicatorHex: '#C58A16' },
    recommendedIcon: 'Cpu',
  },
  {
    stageKey: 'COMPLETED',
    stageName: 'PM Certified (Pass)',
    category: 'MAINTENANCE',
    description: 'Health score refreshed to 100%; calibration sticker affixed to instrument.',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: { bgLight: '#F5F6F0', borderLight: '#D2E7C4', indicatorHex: '#5F8F4D' },
    recommendedIcon: 'CheckCircle',
  },
  {
    stageKey: 'OVERDUE',
    stageName: 'PM Overdue Alert',
    category: 'MAINTENANCE',
    description: 'Instrument surpassed certified operating hours without scheduled service.',
    badge: {
      bgHex: '#F3C7C2',
      textHex: '#8F2D25',
      borderHex: '#B94A40',
      dotHex: '#B94A40',
      tailwindClass: 'bg-[#F3C7C2] text-[#8F2D25] border-[#B94A40]',
    },
    cardAccent: { bgLight: '#FCF3F2', borderLight: '#F3C7C2', indicatorHex: '#B94A40' },
    recommendedIcon: 'AlertOctagon',
  },
];

// Helper to look up any stage styling safely
export function getStageTheme(stageKey: string): StageColorDefinition {
  const allStages = [
    ...ORDER_LIFECYCLE_STAGES,
    ...PAYMENT_STAGES,
    ...COLD_CHAIN_STAGES,
    ...SERVICE_ENGINEER_STAGES,
    ...PREVENTIVE_MAINTENANCE_STAGES,
  ];

  const found = allStages.find(s => s.stageKey.toUpperCase() === stageKey.toUpperCase());
  if (found) return found;

  // Fallback to default semantic success/brand
  return {
    stageKey,
    stageName: stageKey.replace(/_/g, ' '),
    category: 'ORDER',
    description: 'Active diagnostic workflow stage',
    badge: {
      bgHex: '#D2E7C4',
      textHex: '#22381E',
      borderHex: '#5F8F4D',
      dotHex: '#5F8F4D',
      tailwindClass: 'bg-[#D2E7C4] text-[#22381E] border-[#5F8F4D]',
    },
    cardAccent: {
      bgLight: '#F9FAF6',
      borderLight: '#D2E7C4',
      indicatorHex: '#5F8F4D',
    },
    recommendedIcon: 'Tag',
  };
}

// Helper to get semantic color token directly
export function getSemanticTheme(type: 'success' | 'warning' | 'error' | 'info' | 'neutral'): SemanticColorToken {
  return SEMANTIC_PALETTE[type] || SEMANTIC_PALETTE.neutral;
}

