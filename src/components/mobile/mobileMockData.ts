// ============================================================================
// MOBILE HEALTHCARE PROCUREMENT MOCK DATA & SCHEMAS
// Designed for Clinical Diagnostics, Reagents, Consumables & Medical Equipment
// ============================================================================

export interface CompanyBrand {
  id: string;
  name: string;
  code: string;
  tagline: string;
  logoUrl: string;
  logoBg: string;
  brandColor: string;
  country: string;
  reagentCategoryIds: string[];
  equipmentCategoryIds: string[];
}

export interface ReagentCategory {
  id: string;
  name: string;
  shortDesc: string;
  iconName: string;
  imageUrl: string;
  itemCount: number;
}

export interface EquipmentCategory {
  id: string;
  name: string;
  shortDesc: string;
  iconName: string;
  imageUrl: string;
  itemCount: number;
}

export interface ReagentProduct {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  categoryId: string;
  categoryName: string;
  productCode: string;
  packSize: string;
  storageTemp: string; // e.g., '2°C to 8°C', '-20°C Deep Freeze', '15°C to 25°C'
  mrp: number;
  customerNetPrice: number;
  discountPercent: number;
  imageUrl: string;
  description: string;
  throughputTests?: string;
  sampleType?: string;
  inStock: boolean;
  salesRankScore: number;
  salesIndicator?: 'Best Seller' | 'Most Ordered' | 'Trending' | 'High Demand';
  orderCount?: number;
  lastOrderedDate?: string;
  compatibleAnalyzers?: string[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  modelNumber: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  keySpecs: string;
  throughput: string;
  sampleCapacity: string;
  technologyMethod: string;
  applications: string;
  warrantyService: string;
  brochureUrl: string;
  brochureSize: string;
  compatibleReagentIds: string[];
  installationDate?: string;
  serialNumber?: string;
  status?: 'Active' | 'Under Maintenance' | 'Calibration Due';
  department?: string;
  lastServiceDate?: string;
  nextPmDueDate?: string;
}

export interface PromotionalBanner {
  id: string;
  companyName: string;
  companyLogo: string;
  productName: string;
  headline: string;
  tagline: string;
  offerTag: string;
  ctaText: string;
  imageUrl: string;
  accentColor: string;
  badgeBg: string;
  targetProductId?: string;
}

export interface OutstandingInvoice {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  orderDate: string;
  dueDate: string;
  amount: number;
  status: 'OVERDUE' | 'DUE_SOON' | 'CURRENT';
  overdueDays?: number;
  productSummary: string;
}

// ============================================================================
// 1. RECOGNIZED DIAGNOSTIC COMPANIES / BRANDS (7 Brands)
// ============================================================================
export const COMPANY_BRANDS: CompanyBrand[] = [
  {
    id: 'roche',
    name: 'Roche',
    code: 'ROCHE',
    tagline: 'Leading Innovator in In-Vitro Diagnostics & Tissue Pathology',
    logoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&auto=format&fit=crop&q=80',
    logoBg: '#EBF4FF',
    brandColor: '#0066CC',
    country: 'Switzerland',
    reagentCategoryIds: ['cat-biochem-fully', 'cat-immunology', 'cat-blood-gas', 'cat-controls'],
    equipmentCategoryIds: ['eq-biochem', 'eq-immunoassay', 'eq-blood-gas']
  },
  {
    id: 'abbott',
    name: 'Abbott',
    code: 'ABT',
    tagline: 'Global Leader in Point-of-Care & Clinical Chemistry Diagnostics',
    logoUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=120&auto=format&fit=crop&q=80',
    logoBg: '#F0FDF4',
    brandColor: '#00965E',
    country: 'United States',
    reagentCategoryIds: ['cat-biochem-fully', 'cat-biochem-semi', 'cat-immunology', 'cat-rapid-kits', 'cat-diabetes-hospital', 'cat-diabetes-home'],
    equipmentCategoryIds: ['eq-biochem', 'eq-immunoassay', 'eq-other']
  },
  {
    id: 'sysmex',
    name: 'Sysmex',
    code: 'SYSMEX',
    tagline: 'Global Benchmark in Automated Hematology & Coagulation',
    logoUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=120&auto=format&fit=crop&q=80',
    logoBg: '#EFF6FF',
    brandColor: '#0070BA',
    country: 'Japan',
    reagentCategoryIds: ['cat-hematology', 'cat-coagulation', 'cat-urine', 'cat-controls'],
    equipmentCategoryIds: ['eq-hematology', 'eq-coagulation']
  },
  {
    id: 'biorad',
    name: 'Bio-Rad',
    code: 'BIORAD',
    tagline: 'Gold Standard in Quality Controls, HPLC & Immunohematology',
    logoUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=120&auto=format&fit=crop&q=80',
    logoBg: '#FDF2F8',
    brandColor: '#C026D3',
    country: 'United States',
    reagentCategoryIds: ['cat-controls', 'cat-hplc', 'cat-immunology', 'cat-consumables'],
    equipmentCategoryIds: ['eq-hplc', 'eq-molecular', 'eq-other']
  },
  {
    id: 'beckman',
    name: 'Beckman Coulter',
    code: 'BECKMAN',
    tagline: 'Pioneering Biomedical Automation & High-Volume Solutions',
    logoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=120&auto=format&fit=crop&q=80',
    logoBg: '#F8FAFC',
    brandColor: '#0F172A',
    country: 'United States',
    reagentCategoryIds: ['cat-hematology', 'cat-biochem-fully', 'cat-immunology', 'cat-tubes'],
    equipmentCategoryIds: ['eq-hematology', 'eq-biochem', 'eq-immunoassay', 'eq-centrifuges']
  },
  {
    id: 'siemens',
    name: 'Siemens',
    code: 'SIEMENS',
    tagline: 'Transforming Care Delivery Through Digital Healthcare & IVD',
    logoUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=120&auto=format&fit=crop&q=80',
    logoBg: '#F0FDFA',
    brandColor: '#0D9488',
    country: 'Germany',
    reagentCategoryIds: ['cat-biochem-fully', 'cat-immunology', 'cat-blood-gas', 'cat-urine'],
    equipmentCategoryIds: ['eq-biochem', 'eq-immunoassay', 'eq-blood-gas']
  },
  {
    id: 'bd',
    name: 'BD',
    code: 'BD',
    tagline: 'Advancing the World of Health — Vacutainer & Diagnostics Leader',
    logoUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=120&auto=format&fit=crop&q=80',
    logoBg: '#FFF7ED',
    brandColor: '#EA580C',
    country: 'United States',
    reagentCategoryIds: ['cat-tubes', 'cat-rapid-kits', 'cat-controls', 'cat-consumables'],
    equipmentCategoryIds: ['eq-hematology', 'eq-centrifuges', 'eq-other']
  }
];

// ============================================================================
// 2. THE 15 EXACT REAGENT CATEGORIES
// ============================================================================
export const REAGENT_CATEGORIES: ReagentCategory[] = [
  {
    id: 'cat-hematology',
    name: 'Hematology',
    shortDesc: 'Diluents, Lysing Reagents, Reticulocyte & WBC Stain Kits',
    iconName: 'Droplets',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
    itemCount: 42
  },
  {
    id: 'cat-biochem-semi',
    name: 'Semi Auto Biochemistry',
    shortDesc: 'Single-reagent photometer assays, Liquid stable enzymes',
    iconName: 'FlaskConical',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    itemCount: 38
  },
  {
    id: 'cat-biochem-fully',
    name: 'Fully Auto Biochemistry',
    shortDesc: 'System-pack cartridges, Substrates, Lipids & Renal panels',
    iconName: 'Activity',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&auto=format&fit=crop&q=80',
    itemCount: 65
  },
  {
    id: 'cat-electrolyte',
    name: 'Electrolyte',
    shortDesc: 'Na+/K+/Cl-/iCa2+ Electrodes, Calibration standards, Flush',
    iconName: 'Zap',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80',
    itemCount: 24
  },
  {
    id: 'cat-coagulation',
    name: 'Coagulation',
    shortDesc: 'PT / INR Thromboplastin, APTT, Fibrinogen & D-Dimer',
    iconName: 'HeartPulse',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&auto=format&fit=crop&q=80',
    itemCount: 19
  },
  {
    id: 'cat-hplc',
    name: 'HPLC',
    shortDesc: 'HbA1c Columns, Elution buffers, Hemolysate reagents',
    iconName: 'Sliders',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&auto=format&fit=crop&q=80',
    itemCount: 16
  },
  {
    id: 'cat-immunology',
    name: 'Immunology',
    shortDesc: 'CLIA / ECLIA Assays, Cardiac Troponin, Thyroid, Viral markers',
    iconName: 'ShieldCheck',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80',
    itemCount: 52
  },
  {
    id: 'cat-blood-gas',
    name: 'Blood Gas',
    shortDesc: 'pCO2, pO2, pH Sensor cassettes, QC ampoules, Rinse',
    iconName: 'Stethoscope',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
    itemCount: 14
  },
  {
    id: 'cat-controls',
    name: 'Controls & Calibrators',
    shortDesc: 'Lyphochek multi-level sera, Primary standards, EQA matrix',
    iconName: 'BadgeCheck',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=300&auto=format&fit=crop&q=80',
    itemCount: 46
  },
  {
    id: 'cat-rapid-kits',
    name: 'Rapid Kits',
    shortDesc: 'Malaria, Dengue NS1/IgM, Troponin I, Pregnancy, Typhoid',
    iconName: 'CheckSquare',
    imageUrl: 'https://images.unsplash.com/photo-1583912267670-6575ad332b72?w=300&auto=format&fit=crop&q=80',
    itemCount: 31
  },
  {
    id: 'cat-consumables',
    name: 'Consumables & Plastic Items',
    shortDesc: 'Sample cups, Cuvettes, Pipette filter tips, Wash solutions',
    iconName: 'Package',
    imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=300&auto=format&fit=crop&q=80',
    itemCount: 58
  },
  {
    id: 'cat-tubes',
    name: 'Blood Collection Tubes',
    shortDesc: 'Vacuum K2/K3 EDTA, Clot activator, Gel & Clot, Sodium Citrate',
    iconName: 'Boxes',
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=300&auto=format&fit=crop&q=80',
    itemCount: 34
  },
  {
    id: 'cat-urine',
    name: 'Urine Strip',
    shortDesc: '10-Parameter automated reader test strips, SG, Protein, Ketones',
    iconName: 'Percent',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80',
    itemCount: 18
  },
  {
    id: 'cat-diabetes-hospital',
    name: 'Diabetes Strip — Hospital Use',
    shortDesc: 'Professional point-of-care capillary glucose strips, Auto-code',
    iconName: 'Activity',
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=300&auto=format&fit=crop&q=80',
    itemCount: 22
  },
  {
    id: 'cat-diabetes-home',
    name: 'Diabetes Strip — Home Use',
    shortDesc: 'OTC Blood glucose test strips, Lancets, Glucometer monitoring',
    iconName: 'HeartPulse',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80',
    itemCount: 15
  }
];

// ============================================================================
// 3. THE 11 EXACT EQUIPMENT CATEGORIES (NO PRICES!)
// ============================================================================
export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    id: 'eq-hematology',
    name: 'Hematology Analyzers',
    shortDesc: '3-Part & 5-Part Differential Automated Cell Counters',
    iconName: 'Cpu',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
    itemCount: 12
  },
  {
    id: 'eq-biochem',
    name: 'Biochemistry Analyzers',
    shortDesc: 'Discrete Floor & Benchtop Photometric Clinical Chemistry Systems',
    iconName: 'FlaskConical',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&auto=format&fit=crop&q=80',
    itemCount: 16
  },
  {
    id: 'eq-immunoassay',
    name: 'Immunoassay Analyzers',
    shortDesc: 'Chemiluminescence (CLIA / ECLIA) High-Throughput Analyzers',
    iconName: 'Activity',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    itemCount: 14
  },
  {
    id: 'eq-electrolyte',
    name: 'Electrolyte Analyzers',
    shortDesc: 'Automated Direct Ion-Selective Electrode (ISE) Analyzers',
    iconName: 'Zap',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&auto=format&fit=crop&q=80',
    itemCount: 8
  },
  {
    id: 'eq-coagulation',
    name: 'Coagulation Analyzers',
    shortDesc: 'Optical & Mechanical Clotting Detection Systems',
    iconName: 'HeartPulse',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=300&auto=format&fit=crop&q=80',
    itemCount: 7
  },
  {
    id: 'eq-hplc',
    name: 'HPLC Systems',
    shortDesc: 'High-Performance Liquid Chromatography for Diabetes & Hemoglobin',
    iconName: 'Sliders',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&auto=format&fit=crop&q=80',
    itemCount: 6
  },
  {
    id: 'eq-blood-gas',
    name: 'Blood Gas Analyzers',
    shortDesc: 'Critical Care POCT Electrolyte & Acid-Base Instrumentation',
    iconName: 'Stethoscope',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
    itemCount: 9
  },
  {
    id: 'eq-molecular',
    name: 'Molecular Diagnostics',
    shortDesc: 'Real-Time PCR Thermal Cyclers & Automated Nucleic Acid Extractors',
    iconName: 'ShieldCheck',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=300&auto=format&fit=crop&q=80',
    itemCount: 11
  },
  {
    id: 'eq-microscopes',
    name: 'Microscopes',
    shortDesc: 'Binocular, Trinocular & Digital Pathology Imaging Microscopes',
    iconName: 'Eye',
    imageUrl: 'https://images.unsplash.com/photo-1583912267670-6575ad332b72?w=300&auto=format&fit=crop&q=80',
    itemCount: 15
  },
  {
    id: 'eq-centrifuges',
    name: 'Centrifuges',
    shortDesc: 'High-Speed Refrigerated Clinical Serum & Platelet Centrifuges',
    iconName: 'RotateCcw',
    imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=300&auto=format&fit=crop&q=80',
    itemCount: 14
  },
  {
    id: 'eq-other',
    name: 'Other Laboratory Equipment',
    shortDesc: 'Incubators, Shakers, Microplate Readers, Autoclaves & Water Baths',
    iconName: 'Wrench',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80',
    itemCount: 20
  }
];

// ============================================================================
// 4. TOP ROTATING PROMOTIONAL CAROUSEL BANNERS (3 Banners)
// ============================================================================
export const HOME_PROMO_BANNERS_TOP: PromotionalBanner[] = [
  {
    id: 'banner-top-1',
    companyName: 'Roche',
    companyLogo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&auto=format&fit=crop&q=80',
    productName: 'cobas Troponin T Reagent Kit',
    headline: 'cobas Troponin T Reagent Kit',
    tagline: 'High Sensitivity. Accurate Results. Better Patient Care.',
    offerTag: '15% Off Contract Rate',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    accentColor: '#0066CC',
    badgeBg: 'bg-[#D0DEE5] text-[#0E1035] border-[#2B3D5B]/30',
    targetProductId: 'prod-trop-t'
  },
  {
    id: 'banner-top-2',
    companyName: 'Abbott',
    companyLogo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&auto=format&fit=crop&q=80',
    productName: 'ALT Reagent Kit',
    headline: 'Architect ALT Reagent Kit',
    tagline: 'Reliable Clinical Chemistry Results',
    offerTag: 'Special Batch Offer - 20% Off',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
    accentColor: '#00965E',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    targetProductId: 'prod-alt'
  },
  {
    id: 'banner-top-3',
    companyName: 'Sysmex',
    companyLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=80&auto=format&fit=crop&q=80',
    productName: 'XN-Series Hematology Reagent Pack',
    headline: 'XN-Series Hematology Reagent Pack',
    tagline: 'High-throughput hematology performance',
    offerTag: 'Priority Logistics & Cold-Chain',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
    accentColor: '#0070BA',
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    targetProductId: 'prod-xn-pack'
  }
];

// ============================================================================
// 5. SECOND PROMOTIONAL CAROUSEL BANNERS (3 Banners after Order Your Reagent)
// ============================================================================
export const HOME_PROMO_BANNERS_SECOND: PromotionalBanner[] = [
  {
    id: 'banner-sec-1',
    companyName: 'Abbott',
    companyLogo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&auto=format&fit=crop&q=80',
    productName: 'Abbott ALT Reagent Kit',
    headline: 'Abbott ALT Reagent Kit',
    tagline: 'Precision liver function enzyme kinetics with liquid stable buffer',
    offerTag: '20% OFF',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
    accentColor: '#00965E',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    targetProductId: 'prod-alt'
  },
  {
    id: 'banner-sec-2',
    companyName: 'Sysmex',
    companyLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=80&auto=format&fit=crop&q=80',
    productName: 'Sysmex Hematology Reagent Pack',
    headline: 'Sysmex Hematology Reagent Pack',
    tagline: 'Cellpack DCL + Fluorocell WDF complete CBC analytical package',
    offerTag: 'Special Contract Price',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
    accentColor: '#0070BA',
    badgeBg: 'bg-[#D0DEE5] text-[#0E1035] border-[#2B3D5B]/30',
    targetProductId: 'prod-xn-pack'
  },
  {
    id: 'banner-sec-3',
    companyName: 'Bio-Rad',
    companyLogo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=80&auto=format&fit=crop&q=80',
    productName: 'Bio-Rad Controls & Calibrators',
    headline: 'Bio-Rad Controls & Calibrators',
    tagline: 'Lyphochek Assayed Chemistry Control Trilevel comprehensive kit',
    offerTag: 'Special Offer',
    ctaText: 'Order Now',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    accentColor: '#C026D3',
    badgeBg: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    targetProductId: 'prod-lyphochek'
  }
];

// ============================================================================
// 6. COMPLETE REAGENTS CATALOG
// ============================================================================
export const REAGENTS_DATABASE: ReagentProduct[] = [
  {
    id: 'prod-trop-t',
    name: 'cobas Elecsys Troponin T hs Reagent Kit',
    companyId: 'roche',
    companyName: 'Roche',
    companyLogo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-immunology',
    categoryName: 'Immunology',
    productCode: 'ROC-08492',
    packSize: '100 Tests / Kit',
    storageTemp: '2°C to 8°C (Refrigerated)',
    mrp: 23000,
    customerNetPrice: 19500,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    description: 'High-sensitivity cardiac Troponin T assay for ECLIA analyzers. Critical stat assay for acute myocardial infarction diagnosis.',
    throughputTests: '100 Tests',
    sampleType: 'Serum / Lithium Heparin Plasma',
    inStock: true,
    salesRankScore: 98,
    salesIndicator: 'Best Seller',
    orderCount: 18,
    lastOrderedDate: '3 days ago',
    compatibleAnalyzers: ['cobas 6000', 'cobas e411', 'cobas pro']
  },
  {
    id: 'prod-alt',
    name: 'Architect Clinical Chemistry ALT / GPT Reagent Kit',
    companyId: 'abbott',
    companyName: 'Abbott',
    companyLogo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-biochem-fully',
    categoryName: 'Fully Auto Biochemistry',
    productCode: 'ABT-ALT-400',
    packSize: '4 x 100 mL (1,600 Tests)',
    storageTemp: '2°C to 8°C (Refrigerated)',
    mrp: 6800,
    customerNetPrice: 5440,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80',
    description: 'Liquid stable kinetic UV assay without pyridoxal phosphate for diagnostic measurement of Alanine Aminotransferase in human serum.',
    throughputTests: '1,600 Tests',
    sampleType: 'Serum / Plasma',
    inStock: true,
    salesRankScore: 94,
    salesIndicator: 'Most Ordered',
    orderCount: 15,
    lastOrderedDate: '5 days ago',
    compatibleAnalyzers: ['Architect c4000', 'Architect c8000', 'Alinity c']
  },
  {
    id: 'prod-xn-pack',
    name: 'Sysmex Cellpack DCL Diluent & Lysing Fluid',
    companyId: 'sysmex',
    companyName: 'Sysmex',
    companyLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-hematology',
    categoryName: 'Hematology',
    productCode: 'SYS-CP-20L',
    packSize: '20 Liters Cube',
    storageTemp: '15°C to 25°C (Controlled Room Temp)',
    mrp: 5200,
    customerNetPrice: 4264,
    discountPercent: 18,
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&auto=format&fit=crop&q=80',
    description: 'System diluent for automated whole blood cell counting, impedance volume analysis, and sheath flow measurement on Sysmex XN-series.',
    throughputTests: 'Approx. 850 CBC Tests',
    sampleType: 'Whole Blood',
    inStock: true,
    salesRankScore: 92,
    salesIndicator: 'High Demand',
    orderCount: 12,
    lastOrderedDate: '1 week ago',
    compatibleAnalyzers: ['Sysmex XN-1000', 'Sysmex XN-550', 'Sysmex XN-350']
  },
  {
    id: 'prod-lyphochek',
    name: 'Bio-Rad Lyphochek Assayed Chemistry Control Trilevel',
    companyId: 'biorad',
    companyName: 'Bio-Rad',
    companyLogo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-controls',
    categoryName: 'Controls & Calibrators',
    productCode: 'BR-QC-1200',
    packSize: '12 x 5 mL (Trilevel 4 ea)',
    storageTemp: '-20°C Deep Freeze (Lyophilized)',
    mrp: 14500,
    customerNetPrice: 12325,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&auto=format&fit=crop&q=80',
    description: 'Comprehensive multi-analyte human serum control covering over 80 clinical chemistry analytes with verified international peer group data.',
    throughputTests: 'Over 80 Analytes',
    sampleType: 'Human Serum Matrix',
    inStock: true,
    salesRankScore: 89,
    salesIndicator: 'Trending',
    orderCount: 9,
    lastOrderedDate: '2 weeks ago',
    compatibleAnalyzers: ['All Automated Chemistry Analyzers']
  },
  {
    id: 'prod-hba1c-hplc',
    name: 'Bio-Rad D-10 Dual Program HbA1c Reagent Pack',
    companyId: 'biorad',
    companyName: 'Bio-Rad',
    companyLogo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-hplc',
    categoryName: 'HPLC',
    productCode: 'BR-D10-400',
    packSize: '400 Tests / Kit',
    storageTemp: '2°C to 8°C (Refrigerated)',
    mrp: 32000,
    customerNetPrice: 27200,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80',
    description: 'Ion-exchange high performance liquid chromatography reagent kit for precise HbA1c & HbA2/F variant detection. NGSP certified.',
    throughputTests: '400 Tests',
    sampleType: 'Whole Blood with EDTA',
    inStock: true,
    salesRankScore: 87,
    salesIndicator: 'High Demand',
    orderCount: 6,
    lastOrderedDate: '3 weeks ago',
    compatibleAnalyzers: ['Bio-Rad D-10 HPLC']
  },
  {
    id: 'prod-roche-crea',
    name: 'cobas c Creatinine Jaffe Gen.2 Reagent Kit',
    companyId: 'roche',
    companyName: 'Roche',
    companyLogo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-biochem-fully',
    categoryName: 'Fully Auto Biochemistry',
    productCode: 'ROC-04810',
    packSize: '700 Tests / Cassette',
    storageTemp: '15°C to 25°C',
    mrp: 4900,
    customerNetPrice: 4165,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop&q=80',
    description: 'Colorimetric kinetic method with rate blanking for quantitative measurement of creatinine in serum, plasma, and urine on cobas c platforms.',
    throughputTests: '700 Tests',
    sampleType: 'Serum / Urine',
    inStock: true,
    salesRankScore: 85,
    salesIndicator: 'Trending',
    orderCount: 11,
    lastOrderedDate: '4 days ago',
    compatibleAnalyzers: ['cobas 6000', 'cobas c311', 'cobas pro']
  },
  {
    id: 'prod-sysmex-fluorocell',
    name: 'Sysmex Fluorocell WDF Dye Reagent Pack',
    companyId: 'sysmex',
    companyName: 'Sysmex',
    companyLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-hematology',
    categoryName: 'Hematology',
    productCode: 'SYS-WDF-42',
    packSize: '2 x 42 mL Cartridge',
    storageTemp: '2°C to 8°C (Refrigerated & Light Protected)',
    mrp: 18500,
    customerNetPrice: 15170,
    discountPercent: 18,
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&auto=format&fit=crop&q=80',
    description: 'Polymethine fluorescent nucleic acid dye for leukocyte classification and differential analysis on Sysmex XN-Series flow cytometer optics.',
    throughputTests: 'Approx. 1,000 WDF Channels',
    sampleType: 'Lysed Whole Blood',
    inStock: true,
    salesRankScore: 82,
    salesIndicator: 'Best Seller',
    orderCount: 8,
    lastOrderedDate: '10 days ago',
    compatibleAnalyzers: ['Sysmex XN-1000', 'Sysmex XN-2000']
  },
  {
    id: 'prod-mindray-ise',
    name: 'Mindray BS-Series Electrolyte Reagent Buffer Pack',
    companyId: 'mindray',
    companyName: 'Mindray',
    companyLogo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-electrolyte',
    categoryName: 'Electrolyte',
    productCode: 'MIN-ISE-100',
    packSize: '3 x 500 mL Pack',
    storageTemp: '15°C to 25°C',
    mrp: 7200,
    customerNetPrice: 6120,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80',
    description: 'Calibration solution and electrode conditioning buffer for BS-430 / BS-800 direct ISE modules.',
    throughputTests: '1,500 Injections',
    sampleType: 'Serum / Urine',
    inStock: true,
    salesRankScore: 78,
    salesIndicator: 'Most Ordered',
    orderCount: 7,
    lastOrderedDate: '2 weeks ago',
    compatibleAnalyzers: ['Mindray BS-430', 'Mindray BS-800M']
  },
  {
    id: 'prod-beckman-d-dimer',
    name: 'Beckman Coulter D-Dimer Innovance Assay Kit',
    companyId: 'beckman',
    companyName: 'Beckman Coulter',
    companyLogo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-coagulation',
    categoryName: 'Coagulation',
    productCode: 'BECK-DD-200',
    packSize: '200 Tests / Kit',
    storageTemp: '2°C to 8°C (Refrigerated)',
    mrp: 19800,
    customerNetPrice: 16830,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&auto=format&fit=crop&q=80',
    description: 'Particle-enhanced immunoturbidimetric assay for quantitative determination of cross-linked fibrin degradation products (D-Dimer).',
    throughputTests: '200 Tests',
    sampleType: 'Citrated Plasma',
    inStock: true,
    salesRankScore: 75,
    salesIndicator: 'Trending',
    orderCount: 5,
    lastOrderedDate: '3 weeks ago',
    compatibleAnalyzers: ['ACL TOP 550', 'Access 2']
  },
  {
    id: 'prod-rapid-dengue',
    name: 'Abbott Panbio Dengue Duo IgG/IgM & NS1 Combo Rapid Kit',
    companyId: 'abbott',
    companyName: 'Abbott',
    companyLogo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-rapid-kits',
    categoryName: 'Rapid Kits',
    productCode: 'ABT-DENG-25',
    packSize: '25 Test Cassettes / Box',
    storageTemp: '2°C to 30°C',
    mrp: 5800,
    customerNetPrice: 4640,
    discountPercent: 20,
    imageUrl: 'https://images.unsplash.com/photo-1583912267670-6575ad332b72?w=400&auto=format&fit=crop&q=80',
    description: 'Rapid immunochromatographic assay for simultaneous differential detection of Dengue NS1 antigen and IgG/IgM antibodies.',
    throughputTests: '25 Individual Tests',
    sampleType: 'Serum / Plasma / Whole Blood',
    inStock: true,
    salesRankScore: 91,
    salesIndicator: 'High Demand',
    orderCount: 14,
    lastOrderedDate: '2 days ago'
  },
  {
    id: 'prod-vacutainer-edta',
    name: 'BD Vacutainer Plus K2 EDTA Blood Collection Tubes (2.0 mL)',
    companyId: 'beckman',
    companyName: 'Beckman Coulter',
    companyLogo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-tubes',
    categoryName: 'Blood Collection Tubes',
    productCode: 'BD-EDTA-100',
    packSize: 'Box of 100 Tubes (Rack Pack)',
    storageTemp: '4°C to 25°C',
    mrp: 1400,
    customerNetPrice: 1190,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&auto=format&fit=crop&q=80',
    description: 'Evacuated spray-coated K2 EDTA sterile tubes for routine hematology determinations and whole blood immunohematology testing.',
    throughputTests: '100 Vacuum Draws',
    sampleType: 'Venous Blood',
    inStock: true,
    salesRankScore: 84,
    salesIndicator: 'Best Seller',
    orderCount: 20,
    lastOrderedDate: 'Yesterday'
  },
  {
    id: 'prod-siemens-urine',
    name: 'Siemens Multistix 10 SG Automated Urine Test Strips',
    companyId: 'siemens',
    companyName: 'Siemens Healthineers',
    companyLogo: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=80&auto=format&fit=crop&q=80',
    categoryId: 'cat-urine',
    categoryName: 'Urine Strip',
    productCode: 'SIE-UR-100',
    packSize: 'Bottle of 100 Strips',
    storageTemp: '15°C to 30°C (Dry Desiccant Vial)',
    mrp: 2600,
    customerNetPrice: 2210,
    discountPercent: 15,
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80',
    description: '10-parameter urinalysis strips for glucose, bilirubin, ketone, specific gravity, blood, pH, protein, urobilinogen, nitrite, and leukocytes.',
    throughputTests: '100 Tests',
    sampleType: 'Fresh Urine',
    inStock: true,
    salesRankScore: 81,
    salesIndicator: 'Most Ordered',
    orderCount: 13,
    lastOrderedDate: '6 days ago',
    compatibleAnalyzers: ['Clinitek Status+']
  }
];

// ============================================================================
// 7. COMPLETE EQUIPMENT CATALOG (CRITICAL: ZERO PRICES! INQUIRY & BROCHURE ONLY)
// ============================================================================
export const EQUIPMENT_DATABASE: EquipmentItem[] = [
  {
    id: 'eq-cobas-6000',
    name: 'cobas 6000 Analyzer Series',
    modelNumber: 'c501 / e601 Core Module',
    companyId: 'roche',
    companyName: 'Roche',
    companyLogo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-biochem',
    categoryName: 'Biochemistry Analyzers',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'Modular consolidation of clinical chemistry (c501) and electrochemiluminescence (e601) immunoassay on a single platform.',
    throughput: 'Up to 1,000 tests/hour photometric + 170 tests/hour ECLIA',
    sampleCapacity: '150 samples on-board rack loader with STAT port',
    technologyMethod: 'Photometric absorbance, Direct ISE, ECLIA (Electrochemiluminescence)',
    applications: 'Comprehensive routine chemistry, Cardiac troponin, Thyroid, Fertility, Bone markers, Tumor markers',
    warrantyService: '3-Year Comprehensive AMC Coverage with 24/7 Field Engineer Dispatch',
    brochureUrl: '/docs/brochure_roche_cobas_6000.pdf',
    brochureSize: '4.8 MB PDF',
    compatibleReagentIds: ['prod-trop-t', 'prod-roche-crea'],
    installationDate: '14 Jan 2022',
    serialNumber: 'ROC-6000-88412',
    status: 'Active',
    department: 'Central Core Biochemistry Lab',
    lastServiceDate: '12 Aug 2024',
    nextPmDueDate: '15 Nov 2024'
  },
  {
    id: 'eq-architect-c4000',
    name: 'Architect c4000 Clinical Chemistry System',
    modelNumber: 'c4000 Benchtop Integrated',
    companyId: 'abbott',
    companyName: 'Abbott',
    companyLogo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-biochem',
    categoryName: 'Biochemistry Analyzers',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'Seamless workload consolidation with high reagent onboard capacity and SmartWash technology preventing carryover.',
    throughput: 'Up to 800 tests/hour (500 photometric + 300 ISE)',
    sampleCapacity: '100 samples continuous loading with universal sample rack',
    technologyMethod: 'Integrated Chip Technology (ICT) ISE and FlexRate photometric kinetics',
    applications: 'Liver panel, Renal panel, Lipid profiles, Therapeutic drug monitoring (TDM)',
    warrantyService: 'Standard OEM 2-Year Full Comprehensive Warranty + Preventive Maintenance',
    brochureUrl: '/docs/brochure_abbott_architect_c4000.pdf',
    brochureSize: '3.9 MB PDF',
    compatibleReagentIds: ['prod-alt'],
    installationDate: '08 Mar 2022',
    serialNumber: 'ABT-C4K-19401',
    status: 'Active',
    department: 'Clinical Chemistry Section',
    lastServiceDate: '04 Jul 2024',
    nextPmDueDate: '20 Oct 2024'
  },
  {
    id: 'eq-sysmex-xn1000',
    name: 'Sysmex XN-1000 Automated Hematology Analyzer',
    modelNumber: 'XN-1000 with Autoloader',
    companyId: 'sysmex',
    companyName: 'Sysmex',
    companyLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-hematology',
    categoryName: 'Hematology Analyzers',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'Flagship 5-part differential hematology analyzer with fluorescent flow cytometry and dedicated nucleated RBC (NRBC) channel.',
    throughput: '100 samples/hour in whole blood CBC+DIFF mode',
    sampleCapacity: 'Sampler unit holds 5 racks of 10 tubes (50 tubes continuous)',
    technologyMethod: 'Fluorescent Flow Cytometry (Semiconductor laser diode) & Hydrodynamic focusing',
    applications: 'Complete Blood Count (CBC), Leukocyte 5-part differential, Immature Granulocytes, NRBC, Body fluid analysis',
    warrantyService: '3-Year Sysmex Authorized CMC with Quarterly Reagent Flow Validation',
    brochureUrl: '/docs/brochure_sysmex_xn1000.pdf',
    brochureSize: '5.2 MB PDF',
    compatibleReagentIds: ['prod-xn-pack', 'prod-sysmex-fluorocell'],
    installationDate: '22 Jun 2021',
    serialNumber: 'SYS-XN-99120',
    status: 'Active',
    department: 'Hematology & Clinical Pathology',
    lastServiceDate: '18 Sep 2024',
    nextPmDueDate: '18 Dec 2024'
  },
  {
    id: 'eq-biorad-d10',
    name: 'Bio-Rad D-10 Hemoglobin Testing System',
    modelNumber: 'D-10 Dual HPLC',
    companyId: 'biorad',
    companyName: 'Bio-Rad',
    companyLogo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-hplc',
    categoryName: 'HPLC Systems',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'Fully automated cation-exchange HPLC system for gold standard HbA1c determination and high-resolution hemoglobin variant screening.',
    throughput: '3 minutes per HbA1c test / 6.5 minutes Dual Program',
    sampleCapacity: 'Primary tube sampling with 10-tube rack loader',
    technologyMethod: 'Cation-Exchange High Performance Liquid Chromatography (HPLC)',
    applications: 'Diabetes monitoring, HbA1c diagnosis, Beta-thalassemia screening, Variant hemoglobin detection (HbS, HbC, HbD, HbE)',
    warrantyService: 'Bio-Rad Gold Care Package with Column Performance Monitoring',
    brochureUrl: '/docs/brochure_biorad_d10.pdf',
    brochureSize: '3.4 MB PDF',
    compatibleReagentIds: ['prod-hba1c-hplc'],
    installationDate: '10 Nov 2022',
    serialNumber: 'BR-D10-4402',
    status: 'Active',
    department: 'Special Chemistry & Chromatography',
    lastServiceDate: '01 Aug 2024',
    nextPmDueDate: '01 Nov 2024'
  },
  {
    id: 'eq-beckman-access2',
    name: 'Beckman Coulter Access 2 Immunoassay System',
    modelNumber: 'Access 2 Benchtop',
    companyId: 'beckman',
    companyName: 'Beckman Coulter',
    companyLogo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-immunoassay',
    categoryName: 'Immunoassay Analyzers',
    imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'Compact benchtop chemiluminescence immunoassay analyzer featuring magnetic particle separation with dioxetane chemiluminescent detection.',
    throughput: 'Up to 100 tests/hour',
    sampleCapacity: '60 sample positions on carousel with continuous loading',
    technologyMethod: 'Paramagnetic particle chemiluminescent immunoassay (CLIA)',
    applications: 'Cardiac markers, Anemia, Reproductive hormones, Thyroid, Infectious diseases',
    warrantyService: '2-Year Comprehensive OEM Warranty',
    brochureUrl: '/docs/brochure_beckman_access2.pdf',
    brochureSize: '4.1 MB PDF',
    compatibleReagentIds: ['prod-beckman-d-dimer']
  },
  {
    id: 'eq-siemens-atellica',
    name: 'Siemens Atellica Solution Clinical Chemistry & Immunoassay',
    modelNumber: 'Atellica CH 930 + IM 1600',
    companyId: 'siemens',
    companyName: 'Siemens Healthineers',
    companyLogo: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-biochem',
    categoryName: 'Biochemistry Analyzers',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'Flexible, scalable automation platform featuring magnetic sample transport that is 10 times faster than conventional conveyors.',
    throughput: 'Up to 1,800 tests/hour (1,400 chemistry + 440 immunoassay)',
    sampleCapacity: 'Continuous loading sample handler with intelligent vision cameras',
    technologyMethod: 'Acrodinium Ester Chemiluminescence and Multi-wavelength Photometry',
    applications: 'High-volume central reference laboratory consolidation',
    warrantyService: '3-Year Enterprise Care with Remote Proactive Diagnostics',
    brochureUrl: '/docs/brochure_siemens_atellica.pdf',
    brochureSize: '6.5 MB PDF',
    compatibleReagentIds: []
  },
  {
    id: 'eq-mindray-bc6800',
    name: 'Mindray BC-6800 Plus Auto Hematology Analyzer',
    modelNumber: 'BC-6800 Plus',
    companyId: 'mindray',
    companyName: 'Mindray',
    companyLogo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=80&auto=format&fit=crop&q=80',
    categoryId: 'eq-hematology',
    categoryName: 'Hematology Analyzers',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&auto=format&fit=crop&q=80',
    keySpecs: 'High-volume 5-part differential analyzer with 3D SF Cube analysis technology for abnormal cell flagging.',
    throughput: 'Up to 125 samples/hour (CBC+DIFF) and 90 samples/hour with Reticulocyte',
    sampleCapacity: '100 sample tubes continuous loading rack',
    technologyMethod: 'SF Cube 3D optical scatter + impedance volume analysis',
    applications: 'Hospital routine CBC, Reticulocytes, NRBC, Body fluid testing',
    warrantyService: '2-Year Standard Warranty + Annual Calibration Kit',
    brochureUrl: '/docs/brochure_mindray_bc6800.pdf',
    brochureSize: '3.8 MB PDF',
    compatibleReagentIds: []
  }
];

// ============================================================================
// 8. CUSTOMER FINANCIALS & OUTSTANDING INVOICES (Apollo Diagnostic default)
// ============================================================================
export const CUSTOMER_FINANCIALS_DEFAULT = {
  customerName: 'Apex Clinical & Pathology Laboratories',
  partnerLevel: 'Diamond Partner',
  availableCredit: 250000,
  creditLimit: 500000,
  totalOutstanding: 125000,
  overdueAmount: 35000,
  dueSoonAmount: 40000,
  dueIn30Days: 40000,
  dueIn60PlusDays: 0,
  creditPeriodDays: 30,
  walletPoints: 1250
};

export const OUTSTANDING_INVOICES_DEFAULT: OutstandingInvoice[] = [
  {
    id: 'inv-8841',
    orderNumber: 'ORD-2024-8841',
    invoiceNumber: 'INV-MH-8841',
    orderDate: '10 Aug 2024',
    dueDate: '09 Sep 2024',
    amount: 45000,
    status: 'OVERDUE',
    overdueDays: 22,
    productSummary: 'cobas Troponin T hs Reagent Kit (2x)'
  },
  {
    id: 'inv-8902',
    orderNumber: 'ORD-2024-8902',
    invoiceNumber: 'INV-MH-8902',
    orderDate: '18 Aug 2024',
    dueDate: '17 Sep 2024',
    amount: 30000,
    status: 'OVERDUE',
    overdueDays: 14,
    productSummary: 'Architect ALT Reagent Kit (4x), Buffer Wash'
  },
  {
    id: 'inv-9120',
    orderNumber: 'ORD-2024-9120',
    invoiceNumber: 'INV-MH-9120',
    orderDate: '15 Sep 2024',
    dueDate: '15 Oct 2024',
    amount: 60000,
    status: 'DUE_SOON',
    productSummary: 'Sysmex Cellpack DCL (8x), Fluorocell WDF (2x)'
  },
  {
    id: 'inv-9255',
    orderNumber: 'ORD-2024-9255',
    invoiceNumber: 'INV-MH-9255',
    orderDate: '26 Sep 2024',
    dueDate: '26 Nov 2024',
    amount: 40000,
    status: 'CURRENT',
    productSummary: 'Bio-Rad Lyphochek Controls Trilevel (3x)'
  }
];

// Helper to format Indian Rupees
export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

import {
  CustomerSite,
  CustomerOrderDetailed,
  CustomerServiceTicket,
  DigitalDocument,
  ReagentExpiryItem,
  TraceabilityRecord,
  MobileNotification
} from './customerAppTypes';

// ============================================================================
// 9. MULTI-SITE / LOCATION DATABASE
// ============================================================================
export const CUSTOMER_SITES: CustomerSite[] = [
  {
    id: 'site-powai',
    name: 'Apex Reference Diagnostic Hub (Powai Main)',
    code: 'SITE-MUM-01',
    address: 'Apex Lab Building, Plot 14, MIDC Central Road, Powai',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    isPrimary: true,
    activeEquipmentCount: 4,
    contactPerson: 'Dr. Rajesh Verma (Lab Director)',
    contactPhone: '+91 98201 44892',
    operatingHours: '24/7 Core Operations',
    licenseNumber: 'NABL-MC-2849 / DL-MH-88219'
  },
  {
    id: 'site-andheri',
    name: 'Apex Satellite Pathology Center',
    code: 'SITE-MUM-02',
    address: 'Unit 302, Crystal Plaza, New Link Road, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    isPrimary: false,
    activeEquipmentCount: 2,
    contactPerson: 'Dr. Sneha Kulkarni (Chief Pathologist)',
    contactPhone: '+91 98190 33211',
    operatingHours: '07:00 AM - 09:00 PM',
    licenseNumber: 'DL-MH-89410'
  },
  {
    id: 'site-thane',
    name: 'Apex Clinical & Screening Lab',
    code: 'SITE-THA-01',
    address: 'Ground Floor, Orion Business Park, Ghodbunder Road',
    city: 'Thane',
    state: 'Maharashtra',
    pincode: '400607',
    isPrimary: false,
    activeEquipmentCount: 1,
    contactPerson: 'Mr. Anand Shinde (Lab Manager)',
    contactPhone: '+91 97690 11200',
    operatingHours: '08:00 AM - 08:00 PM',
    licenseNumber: 'DL-MH-91244'
  },
  {
    id: 'site-pune',
    name: 'Apex Regional Research Diagnostic Center',
    code: 'SITE-PUN-01',
    address: 'Bio-Informatics Park, Phase 1, Hinjawadi',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411057',
    isPrimary: false,
    activeEquipmentCount: 3,
    contactPerson: 'Dr. Amit Deshmukh (Biochemistry Head)',
    contactPhone: '+91 98230 55198',
    operatingHours: '24/7 Emergency & STAT Testing',
    licenseNumber: 'NABL-MC-3012'
  }
];

// ============================================================================
// 10. DETAILED ORDERS WITH DELIVERY TIMELINE & BATCH TRACEABILITY
// ============================================================================
export const CUSTOMER_ORDERS_DETAILED: CustomerOrderDetailed[] = [
  {
    id: 'ord-2024-9982',
    orderNumber: 'ORD-2024-9982',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    status: 'IN_TRANSIT',
    orderDate: '04 Oct 2026, 09:30 AM',
    estimatedDelivery: 'Today, by 3:30 PM',
    subtotal: 39000,
    taxAmount: 4680,
    coldChainFee: 0,
    totalAmount: 43680,
    paymentStatus: 'CREDIT_ACCOUNT',
    paymentMethod: 'Revolving Credit (30D)',
    carrier: {
      name: 'MediLogistics Direct Cold-Express',
      awbNumber: 'ML-COLD-882910',
      driverName: 'Sanjay Jadhav',
      driverPhone: '+91 98765 43210',
      vehicleNumber: 'MH-02-EE-4192 (Refrigerated Van)'
    },
    coldChainMonitoring: {
      required: true,
      sensorId: 'IOT-SENS-7892',
      currentTemp: '4.2°C',
      targetTemp: '2.0°C - 8.0°C',
      status: 'OPTIMAL',
      lastLogged: '4 mins ago',
      tempHistory: [
        { time: '09:45', temp: 3.8 },
        { time: '10:30', temp: 4.1 },
        { time: '11:15', temp: 4.0 },
        { time: '12:00', temp: 4.3 },
        { time: '12:45', temp: 4.2 }
      ]
    },
    items: [
      {
        productId: 'prod-trop-t',
        productName: 'cobas Elecsys Troponin T hs STAT Reagent Kit',
        productSku: 'ROC-TROP-T-100',
        productImageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&auto=format&fit=crop&q=80',
        companyName: 'Roche',
        packSize: '100 Tests / Cassette',
        quantity: 2,
        unitPrice: 19500,
        totalPrice: 39000,
        isColdChain: true,
        batchNumber: 'ROC-TRP-9021',
        lotNumber: 'LOT-6771',
        mfgDate: '15 Aug 2026',
        expiryDate: '15 Aug 2027',
        storageTemp: '2°C to 8°C (Refrigerate, Do Not Freeze)',
        qcReleaseStatus: 'RELEASED'
      }
    ],
    timeline: [
      {
        stepId: 'step-1',
        title: 'Order Placed & Contract Verified',
        description: 'Electronic PO #PO-APEX-8821 verified against institutional contract pricing',
        timestamp: '04 Oct 2026, 09:30 AM',
        status: 'COMPLETED',
        location: 'Central Procurement Portal',
        verifiedBy: 'System Auto-Approval (Revolving Credit)'
      },
      {
        stepId: 'step-2',
        title: 'Cold-Chain Warehouse Pick & Pack',
        description: 'Validated insulated box packed with dry-temperature phase change gel packs',
        timestamp: '04 Oct 2026, 10:15 AM',
        status: 'COMPLETED',
        location: 'A2Z Central Cold-Storage Vault, Bhiwandi',
        temperature: '3.8°C Verified',
        verifiedBy: 'Warehouse QA: Nilesh Patil'
      },
      {
        stepId: 'step-3',
        title: 'Active Sensor Affixed & Dispatched',
        description: 'IoT Bluetooth/Cellular Temp Logger #IOT-SENS-7892 activated and locked inside pack',
        timestamp: '04 Oct 2026, 11:00 AM',
        status: 'COMPLETED',
        location: 'Bhiwandi Logistics Hub',
        temperature: '4.0°C Active',
        verifiedBy: 'Dispatcher: Rakesh Rane'
      },
      {
        stepId: 'step-4',
        title: 'In-Transit to Customer Laboratory',
        description: 'Refrigerated van en-route via Eastern Express Highway',
        timestamp: '04 Oct 2026, 12:45 PM',
        status: 'IN_PROGRESS',
        location: 'Vikhroli Expressway (ETA: 45 mins)',
        temperature: '4.2°C (Optimal)',
        sensorReading: 'Live BLE Reading: 4.2°C &bull; Target: 2.0°C - 8.0°C'
      },
      {
        stepId: 'step-5',
        title: 'Out for Laboratory Delivery',
        description: 'Final drop-off delivery to Central Receiving & Sample Receiving Dock',
        timestamp: 'Estimated: 03:00 PM',
        status: 'PENDING',
        location: 'Apex Diagnostic Hub, Powai'
      },
      {
        stepId: 'step-6',
        title: 'Cold-Chain Sign-off & Handover',
        description: 'Laboratory technician digital sign-off and temperature integrity receipt verification',
        timestamp: 'Estimated: 03:30 PM',
        status: 'PENDING'
      }
    ],
    invoiceId: 'inv-8841',
    invoiceNumber: 'INV-MH-9982',
    invoiceUrl: '/invoices/INV-MH-9982.pdf'
  },
  {
    id: 'ord-2024-9840',
    orderNumber: 'ORD-2024-9840',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    status: 'DELIVERED',
    orderDate: '26 Sep 2026, 11:20 AM',
    estimatedDelivery: '28 Sep 2026, 02:00 PM',
    deliveredDate: '28 Sep 2026, 01:45 PM',
    subtotal: 32200,
    taxAmount: 3864,
    coldChainFee: 0,
    totalAmount: 36064,
    paymentStatus: 'PAID',
    paymentMethod: 'Credit Facility Settled',
    carrier: {
      name: 'MediLogistics Direct Cold-Express',
      awbNumber: 'ML-COLD-879901',
      driverName: 'Kishore Mhatre'
    },
    coldChainMonitoring: {
      required: true,
      sensorId: 'IOT-SENS-7104',
      currentTemp: '4.5°C',
      targetTemp: '2.0°C - 8.0°C',
      status: 'OPTIMAL',
      lastLogged: '28 Sep 2026, 01:45 PM',
      tempHistory: [
        { time: '10:00', temp: 3.5 },
        { time: '11:00', temp: 3.9 },
        { time: '12:00', temp: 4.2 },
        { time: '13:00', temp: 4.4 },
        { time: '13:45', temp: 4.5 }
      ]
    },
    items: [
      {
        productId: 'prod-alt',
        productName: 'Architect Alanine Aminotransferase (ALT/SGPT) Kit',
        productSku: 'ABT-ALT-800',
        productImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=80',
        companyName: 'Abbott',
        packSize: '800 Tests / Kit',
        quantity: 3,
        unitPrice: 8200,
        totalPrice: 24600,
        isColdChain: true,
        batchNumber: 'ABT-ALT-5520',
        lotNumber: 'LOT-9011',
        mfgDate: '10 Jul 2026',
        expiryDate: '10 Jul 2027',
        storageTemp: '2°C to 8°C',
        qcReleaseStatus: 'RELEASED'
      },
      {
        productId: 'prod-diluent',
        productName: 'Sysmex Cellpack DCL Diluent Automated Reagent',
        productSku: 'SYS-DCL-20L',
        productImageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&auto=format&fit=crop&q=80',
        companyName: 'Sysmex',
        packSize: '20 Liter Cubitainer',
        quantity: 2,
        unitPrice: 3800,
        totalPrice: 7600,
        isColdChain: false,
        batchNumber: 'SYS-DCL-8801',
        lotNumber: 'LOT-3329',
        mfgDate: '01 Aug 2026',
        expiryDate: '01 Feb 2028',
        storageTemp: '15°C to 30°C',
        qcReleaseStatus: 'RELEASED'
      }
    ],
    timeline: [
      {
        stepId: 'step-1',
        title: 'Order Placed & Confirmed',
        description: 'Purchase Order generated and verified against credit limits',
        timestamp: '26 Sep 2026, 11:20 AM',
        status: 'COMPLETED'
      },
      {
        stepId: 'step-2',
        title: 'Cold-Chain Warehouse Pack',
        description: 'Batch verification & QA inspection completed',
        timestamp: '27 Sep 2026, 09:00 AM',
        status: 'COMPLETED'
      },
      {
        stepId: 'step-3',
        title: 'Dispatched with Telemetry Sensor',
        description: 'Logger #IOT-SENS-7104 assigned',
        timestamp: '27 Sep 2026, 02:30 PM',
        status: 'COMPLETED'
      },
      {
        stepId: 'step-4',
        title: 'Delivered & Temperature Signed Off',
        description: 'Handed over in optimal condition (4.5°C). Signed by Dr. Rajesh Verma.',
        timestamp: '28 Sep 2026, 01:45 PM',
        status: 'COMPLETED',
        verifiedBy: 'Dr. Rajesh Verma (Lab Director)'
      }
    ],
    invoiceId: 'inv-9840',
    invoiceNumber: 'INV-MH-9840',
    invoiceUrl: '/invoices/INV-MH-9840.pdf'
  },
  {
    id: 'ord-2024-9710',
    orderNumber: 'ORD-2024-9710',
    siteId: 'site-andheri',
    siteName: 'Apex Satellite Pathology Center (Andheri West)',
    status: 'DELIVERED',
    orderDate: '12 Sep 2026, 04:15 PM',
    estimatedDelivery: '14 Sep 2026, 12:00 PM',
    deliveredDate: '14 Sep 2026, 11:30 AM',
    subtotal: 13500,
    taxAmount: 1620,
    coldChainFee: 0,
    totalAmount: 15120,
    paymentStatus: 'PAID',
    paymentMethod: 'Credit Facility Settled',
    carrier: {
      name: 'MediLogistics Direct',
      awbNumber: 'ML-EXP-440192'
    },
    items: [
      {
        productId: 'prod-lyphochek',
        productName: 'Bio-Rad Lyphochek Assayed Chemistry Control (Level 1 & 2)',
        productSku: 'BR-LYPHO-CC',
        productImageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&auto=format&fit=crop&q=80',
        companyName: 'Bio-Rad',
        packSize: '12 x 5 mL Vials',
        quantity: 1,
        unitPrice: 13500,
        totalPrice: 13500,
        isColdChain: true,
        batchNumber: 'BR-QC-4019',
        lotNumber: 'LOT-5501',
        mfgDate: '01 Jun 2026',
        expiryDate: '01 Jun 2027',
        storageTemp: '2°C to 8°C (Lyophilized)',
        qcReleaseStatus: 'RELEASED'
      }
    ],
    timeline: [
      {
        stepId: 'step-1',
        title: 'Order Placed',
        description: 'Standard branch replenishment order',
        timestamp: '12 Sep 2026, 04:15 PM',
        status: 'COMPLETED'
      },
      {
        stepId: 'step-2',
        title: 'Delivered & Received',
        description: 'Delivered to Andheri Satellite Lab. Received by Dr. Sneha Kulkarni.',
        timestamp: '14 Sep 2026, 11:30 AM',
        status: 'COMPLETED'
      }
    ],
    coldChainMonitoring: {
      required: true,
      sensorId: 'IOT-SENS-6612',
      currentTemp: '3.9°C',
      targetTemp: '2.0°C - 8.0°C',
      status: 'OPTIMAL',
      lastLogged: '14 Sep 2026, 11:30 AM',
      tempHistory: []
    },
    invoiceId: 'inv-9710',
    invoiceNumber: 'INV-MH-9710',
    invoiceUrl: '/invoices/INV-MH-9710.pdf'
  }
];

// ============================================================================
// 11. SERVICE TICKETS & FIELD BIOMEDICAL DISPATCH
// ============================================================================
export const CUSTOMER_SERVICE_TICKETS: CustomerServiceTicket[] = [
  {
    id: 'tkt-2024-104',
    ticketNumber: 'TKT-2026-104',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    equipmentId: 'eq-cobas-6000',
    equipmentName: 'cobas 6000 Analyzer Series',
    equipmentModel: 'c501 / e601 Core Module',
    serialNumber: 'ROC-6000-88412',
    category: 'EQUIPMENT_BREAKDOWN',
    priority: 'HIGH',
    status: 'ENGINEER_ON_THE_WAY',
    title: 'Photometer Cuvette Wheel Carryover Error (Error Code: E-104)',
    description: 'Analyzer stopped mid-run during cardiac troponin batch testing with optical transmission error on channel 4. STAT sample queue backed up.',
    errorCode: 'ERR-C501-104-OPTICAL',
    assignedEngineer: {
      name: 'Eng. Vikram Sethi',
      phone: '+91 98450 11992',
      designation: 'Senior Biomedical Field Specialist (Roche Certified)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      eta: '25 mins (Live En-Route)',
      currentLocation: 'Saki Naka Junction (1.8 km away)'
    },
    slaHours: 4,
    slaDeadline: 'Today, 04:30 PM (Guaranteed Diamond SLA)',
    createdAt: '04 Oct 2026, 12:30 PM',
    messages: [
      {
        id: 'msg-1',
        sender: 'CUSTOMER',
        senderName: 'Dr. Rajesh Verma',
        text: 'Cuvette washer probe 2 appears to have intermittent suction blockage during saline rinse cycle.',
        timestamp: '12:32 PM'
      },
      {
        id: 'msg-2',
        sender: 'AI_BOT',
        senderName: 'MediBot Pro Diagnostics',
        text: 'Automated triage: Please run a manual cell wash wash-cycle (Wash Solution 1) from the Maintenance Menu while engineer is en route.',
        timestamp: '12:33 PM'
      },
      {
        id: 'msg-3',
        sender: 'ENGINEER',
        senderName: 'Eng. Vikram Sethi',
        text: 'Hello Dr. Verma, I have dispatched immediately with a replacement optical module and cuvette rinse manifold. ETA 25 minutes.',
        timestamp: '12:45 PM'
      }
    ]
  },
  {
    id: 'tkt-2024-098',
    ticketNumber: 'TKT-2026-098',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    equipmentId: 'eq-sysmex-xn1000',
    equipmentName: 'Sysmex XN-1000 Automated Hematology Analyzer',
    equipmentModel: 'XN-1000 with Autoloader',
    serialNumber: 'SYS-XN-99120',
    category: 'CALIBRATION_REQUEST',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    title: 'Quarterly Optical Flow Cytometry & Diluent Pressure Calibration',
    description: 'Routine quarterly preventive calibration and laser diode alignment per NABL ISO 15189 compliance guidelines.',
    errorCode: 'PM-CAL-Q3',
    assignedEngineer: {
      name: 'Eng. Priya Nair',
      phone: '+91 98200 44911',
      designation: 'Clinical Automation Engineer',
      eta: 'On-Site in Lab'
    },
    slaHours: 24,
    slaDeadline: '05 Oct 2026, 10:00 AM',
    createdAt: '03 Oct 2026, 10:00 AM',
    messages: [
      {
        id: 'msg-101',
        sender: 'ENGINEER',
        senderName: 'Eng. Priya Nair',
        text: 'Optical calibration runs 1, 2, and 3 completed with CBC control beads. Accuracy variance is within 0.4% (excellent). Generating certificate.',
        timestamp: '11:15 AM'
      }
    ]
  },
  {
    id: 'tkt-2024-082',
    ticketNumber: 'TKT-2026-082',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    equipmentId: 'eq-biorad-d10',
    equipmentName: 'Bio-Rad D-10 Hemoglobin Testing System',
    equipmentModel: 'D-10 Dual HPLC',
    serialNumber: 'BR-D10-4402',
    category: 'PREVENTIVE_MAINTENANCE',
    priority: 'LOW',
    status: 'RESOLVED',
    title: 'Quarterly Reagent Column Filter Replacement & Baseline Test',
    description: 'Scheduled column replacement and HbA1c calibration verification.',
    assignedEngineer: {
      name: 'Eng. Vikram Sethi',
      phone: '+91 98450 11992',
      designation: 'Senior Biomedical Field Specialist'
    },
    slaHours: 48,
    slaDeadline: '20 Sep 2026',
    createdAt: '18 Sep 2026, 09:00 AM',
    resolvedAt: '18 Sep 2026, 02:30 PM',
    customerRating: 5,
    customerFeedback: 'Quick turnaround, chromatography baseline is now perfectly sharp. Calibration certificate received.',
    messages: []
  }
];

// ============================================================================
// 12. DIGITAL DOCUMENT CENTER (Invoices, Reports, Calibration, Quality, MSDS)
// ============================================================================
export const DIGITAL_DOCUMENTS_DATABASE: DigitalDocument[] = [
  {
    id: 'doc-inv-9982',
    category: 'TAX_INVOICE',
    title: 'Tax Invoice #INV-MH-9982 (cobas Troponin T hs Kit)',
    referenceNumber: 'INV-MH-9982',
    date: '04 Oct 2026',
    fileSize: '245 KB PDF',
    downloadUrl: '/docs/invoices/INV-MH-9982.pdf',
    siteId: 'site-powai',
    relatedOrderNumber: 'ORD-2024-9982',
    issuedBy: 'A2Z Diagnostic Services India Pvt Ltd (GSTIN: 27AABCA1234F1Z9)',
    status: 'ACTIVE'
  },
  {
    id: 'doc-inv-9840',
    category: 'TAX_INVOICE',
    title: 'Tax Invoice #INV-MH-9840 (Architect ALT & Sysmex Diluent)',
    referenceNumber: 'INV-MH-9840',
    date: '28 Sep 2026',
    fileSize: '280 KB PDF',
    downloadUrl: '/docs/invoices/INV-MH-9840.pdf',
    siteId: 'site-powai',
    relatedOrderNumber: 'ORD-2024-9840',
    issuedBy: 'A2Z Diagnostic Services India Pvt Ltd',
    status: 'ACTIVE'
  },
  {
    id: 'doc-fsr-104',
    category: 'SERVICE_REPORT',
    title: 'Field Service Report (FSR #FSR-2026-8812) - cobas 6000 Optical Manifold',
    referenceNumber: 'FSR-2026-8812',
    date: '04 Oct 2026',
    fileSize: '410 KB PDF',
    downloadUrl: '/docs/service/FSR-2026-8812.pdf',
    siteId: 'site-powai',
    relatedEquipmentId: 'eq-cobas-6000',
    relatedEquipmentName: 'cobas 6000 Analyzer Series',
    issuedBy: 'Eng. Vikram Sethi (Bio-Services Field Dept)',
    status: 'ACTIVE'
  },
  {
    id: 'doc-cal-99120',
    category: 'CALIBRATION_CERT',
    title: 'NABL ISO 17025 Traceable Calibration Certificate - Sysmex XN-1000',
    referenceNumber: 'CERT-CAL-SYS-2026-Q3',
    date: '03 Oct 2026',
    fileSize: '520 KB PDF',
    downloadUrl: '/docs/calibration/CERT-CAL-SYS-2026-Q3.pdf',
    siteId: 'site-powai',
    relatedEquipmentId: 'eq-sysmex-xn1000',
    relatedEquipmentName: 'Sysmex XN-1000 Automated Hematology Analyzer',
    expiryDate: '03 Oct 2027',
    issuedBy: 'A2Z Certified Metrology & Calibration Laboratory (NABL Accredited)',
    status: 'ACTIVE'
  },
  {
    id: 'doc-cal-4402',
    category: 'CALIBRATION_CERT',
    title: 'HPLC Column Verification & Calibration Certificate - Bio-Rad D-10',
    referenceNumber: 'CERT-CAL-BR-2026-08',
    date: '18 Sep 2026',
    fileSize: '390 KB PDF',
    downloadUrl: '/docs/calibration/CERT-CAL-BR-2026-08.pdf',
    siteId: 'site-powai',
    relatedEquipmentId: 'eq-biorad-d10',
    relatedEquipmentName: 'Bio-Rad D-10 Hemoglobin Testing System',
    expiryDate: '18 Mar 2027',
    issuedBy: 'Bio-Rad Authorized Metrology Services',
    status: 'ACTIVE'
  },
  {
    id: 'doc-coa-trp-9021',
    category: 'COA_QUALITY',
    title: 'Certificate of Analysis (COA) - cobas Troponin T hs (Lot #6771)',
    referenceNumber: 'COA-ROC-TRP-9021',
    date: '15 Aug 2026',
    fileSize: '180 KB PDF',
    downloadUrl: '/docs/coa/COA-ROC-TRP-9021.pdf',
    siteId: 'site-powai',
    batchNumber: 'ROC-TRP-9021',
    expiryDate: '15 Aug 2027',
    issuedBy: 'Roche Diagnostics Global Quality Control (Penzberg, Germany)',
    status: 'ACTIVE'
  },
  {
    id: 'doc-msds-alt',
    category: 'MSDS_IFU',
    title: 'Safety Data Sheet (MSDS) & Instructions for Use (IFU) - Architect ALT',
    referenceNumber: 'IFU-ABT-ALT-800-V4',
    date: '10 Jul 2026',
    fileSize: '650 KB PDF',
    downloadUrl: '/docs/ifu/IFU-ABT-ALT-800-V4.pdf',
    siteId: 'site-powai',
    issuedBy: 'Abbott Diagnostics Regulatory Compliance',
    status: 'ACTIVE'
  }
];

// ============================================================================
// 13. MATERIAL & REAGENT EXPIRY ALERTS DATABASE
// ============================================================================
export const REAGENT_EXPIRIES_DATABASE: ReagentExpiryItem[] = [
  {
    id: 'exp-1',
    productId: 'prod-hba1c-hplc',
    productName: 'Bio-Rad D-10 Dual Program HbA1c Reagent Cartridge',
    companyName: 'Bio-Rad',
    companyLogo: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=80&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&auto=format&fit=crop&q=80',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    batchNumber: 'BR-HBA-8812',
    lotNumber: 'LOT-2199',
    packSize: 'Kit for 400 Tests',
    currentStockUnits: 3,
    expiryDate: '18 Oct 2026',
    daysRemaining: 14,
    urgencyLevel: 'CRITICAL',
    storageTemp: '2°C to 8°C',
    unitPrice: 28500
  },
  {
    id: 'exp-2',
    productId: 'prod-roche-crea',
    productName: 'cobas c 501 Creatinine Enzymatic Gen.2 Reagent',
    companyName: 'Roche',
    companyLogo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    batchNumber: 'ROC-CRE-4402',
    lotNumber: 'LOT-8810',
    packSize: 'Cassette for 250 Tests',
    currentStockUnits: 5,
    expiryDate: '02 Nov 2026',
    daysRemaining: 29,
    urgencyLevel: 'CRITICAL',
    storageTemp: '2°C to 8°C',
    unitPrice: 6200
  },
  {
    id: 'exp-3',
    productId: 'prod-sysmex-fluorocell',
    productName: 'Sysmex Fluorocell WDF Staining Reagent Pack',
    companyName: 'Sysmex',
    companyLogo: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=80&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&auto=format&fit=crop&q=80',
    siteId: 'site-powai',
    siteName: 'Apex Reference Diagnostic Hub (Powai Main)',
    batchNumber: 'SYS-WDF-7711',
    lotNumber: 'LOT-5544',
    packSize: '2 x 42 mL Cartridge',
    currentStockUnits: 8,
    expiryDate: '24 Nov 2026',
    daysRemaining: 51,
    urgencyLevel: 'WARNING',
    storageTemp: '2°C to 8°C (Protect from Light)',
    unitPrice: 11400
  },
  {
    id: 'exp-4',
    productId: 'prod-siemens-urine',
    productName: 'Siemens Multistix 10 SG Automated Urine Test Strips',
    companyName: 'Siemens Healthineers',
    companyLogo: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=80&auto=format&fit=crop&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80',
    siteId: 'site-andheri',
    siteName: 'Apex Satellite Pathology Center',
    batchNumber: 'SIE-UR-9910',
    lotNumber: 'LOT-1102',
    packSize: 'Bottle of 100 Strips',
    currentStockUnits: 12,
    expiryDate: '15 Dec 2026',
    daysRemaining: 72,
    urgencyLevel: 'SAFE',
    storageTemp: '15°C to 30°C (Dry Desiccant Vial)',
    unitPrice: 2210
  }
];

// ============================================================================
// 14. TRACEABILITY GENEALOGY & SENSOR LOGS
// ============================================================================
export const TRACEABILITY_RECORDS: TraceabilityRecord[] = [
  {
    id: 'trace-1',
    type: 'REAGENT_BATCH',
    identifier: 'ROC-TRP-9021',
    title: 'cobas Elecsys Troponin T hs STAT Reagent (Batch #ROC-TRP-9021)',
    subtitle: 'Lot: LOT-6771 &bull; Roche Diagnostics Germany',
    siteId: 'site-powai',
    mfgDate: '15 Aug 2026',
    expiryDate: '15 Aug 2027',
    status: 'IN_TRANSIT',
    coldChainCompliant: true,
    temperatureLog: {
      minRecorded: 3.6,
      maxRecorded: 4.8,
      averageTemp: 4.1,
      excursionCount: 0,
      sensorBattery: '98% (BLE Active)',
      telemetryReadings: [
        { time: '09:00', temp: 3.7 },
        { time: '10:00', temp: 3.9 },
        { time: '11:00', temp: 4.2 },
        { time: '12:00', temp: 4.4 },
        { time: '13:00', temp: 4.2 }
      ]
    },
    qualityCertificateNumber: 'COA-ROC-TRP-9021',
    qualityAuditor: 'Dr. Klaus Weber (Global QA Lead, Roche Penzberg)',
    releaseDate: '18 Aug 2026',
    chainOfCustody: [
      {
        timestamp: '18 Aug 2026',
        event: 'Manufacture, Fill & Lyophilization Release',
        operator: 'Roche Manufacturing Unit 4',
        facility: 'Penzberg, Germany'
      },
      {
        timestamp: '25 Aug 2026',
        event: 'Customs Clearance & Cold Storage Transfer (Air Cargo Direct)',
        operator: 'CargoCare Cold Pharma Hub',
        facility: 'Mumbai International Airport'
      },
      {
        timestamp: '04 Oct 2026',
        event: 'Cold-Van Loading & Sensor Dispatch for Order #ORD-2024-9982',
        operator: 'A2Z Logistics Team (Sanjay Jadhav)',
        facility: 'Bhiwandi Central Cold Storage'
      }
    ]
  },
  {
    id: 'trace-2',
    type: 'EQUIPMENT_SERIAL',
    identifier: 'ROC-6000-88412',
    title: 'cobas 6000 Analyzer Series (Serial #ROC-6000-88412)',
    subtitle: 'c501 / e601 Core Module &bull; Central Core Biochemistry Lab',
    siteId: 'site-powai',
    mfgDate: '10 Oct 2021',
    status: 'ACTIVE',
    coldChainCompliant: true,
    temperatureLog: {
      minRecorded: 20.2,
      maxRecorded: 24.1,
      averageTemp: 22.4,
      excursionCount: 0,
      sensorBattery: 'Mains Powered',
      telemetryReadings: [
        { time: '08:00', temp: 22.1 },
        { time: '10:00', temp: 22.4 },
        { time: '12:00', temp: 22.6 }
      ]
    },
    qualityCertificateNumber: 'CERT-ROCHE-6000-ORIGIN',
    qualityAuditor: 'Roche Biomedical Standards Inspection',
    releaseDate: '14 Jan 2022',
    chainOfCustody: [
      {
        timestamp: '14 Jan 2022',
        event: 'OEM Commissioning & IQ/OQ/PQ Validation Completed',
        operator: 'Roche Senior Engineer',
        facility: 'Apex Reference Hub, Powai'
      },
      {
        timestamp: '12 Aug 2026',
        event: 'Preventive Maintenance Cycle 6 Passed',
        operator: 'Eng. Vikram Sethi',
        facility: 'Apex Core Lab'
      }
    ]
  }
];

// ============================================================================
// 15. MOBILE NOTIFICATIONS & ACTIONABLE ALERTS
// ============================================================================
export const CUSTOMER_NOTIFICATIONS: MobileNotification[] = [
  {
    id: 'notif-1',
    type: 'ORDER',
    title: 'Cold-Chain Shipment Dispatched',
    message: 'Order #ORD-2024-9982 (cobas Troponin T hs Kit) is out for delivery. Temperature verified at 4.2°C.',
    timestamp: '15 mins ago',
    isRead: false,
    actionType: 'VIEW_ORDER',
    actionPayload: 'ord-2024-9982'
  },
  {
    id: 'notif-2',
    type: 'SUPPORT',
    title: 'Field Engineer En-Route (ETA 25 mins)',
    message: 'Eng. Vikram Sethi is arriving for Ticket #TKT-2026-104 (cobas 6000 Optical Error E-104).',
    timestamp: '35 mins ago',
    isRead: false,
    actionType: 'VIEW_TICKET',
    actionPayload: 'tkt-2024-104'
  },
  {
    id: 'notif-3',
    type: 'EXPIRY',
    title: 'Urgent: Reagent Expiring in 14 Days',
    message: 'Bio-Rad HbA1c Cartridges (Batch #BR-HBA-8812) expire on 18 Oct 2026. 3 kits remaining in stock.',
    timestamp: '3 hours ago',
    isRead: false,
    actionType: 'VIEW_EXPIRY',
    actionPayload: 'exp-1'
  },
  {
    id: 'notif-4',
    type: 'EQUIPMENT_PM',
    title: 'Sysmex XN-1000 Calibration In-Progress',
    message: 'Eng. Priya Nair has begun optical flow cytometry calibration at Powai Main Lab.',
    timestamp: '5 hours ago',
    isRead: true,
    actionType: 'VIEW_EQUIPMENT',
    actionPayload: 'eq-sysmex-xn1000'
  },
  {
    id: 'notif-5',
    type: 'BILLING',
    title: 'Monthly Statement Generated',
    message: 'September 2026 statement ready. Available Revolving Credit balance is ₹8,25,000.',
    timestamp: '1 day ago',
    isRead: true,
    actionType: 'VIEW_DOCUMENT',
    actionPayload: 'doc-inv-9840'
  }
];
