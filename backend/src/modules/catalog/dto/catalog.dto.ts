// ============================================================================
-- A2Z DIAGNOSTICS ENTERPRISE PLATFORM - NESTJS BACKEND
-- File: /backend/src/modules/catalog/dto/catalog.dto.ts
-- DTOs & Validation Contracts for Phase 2 Catalog, Companies & Categories
-- ============================================================================

export interface CreateCompanyDto {
  code: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  website?: string;
  country?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export interface CreateCategoryDto {
  parentId?: string | null;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CreateProductImageDto {
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface CreateProductDocumentDto {
  title: string;
  documentType: 'MSDS' | 'IFU_PACK_INSERT' | 'CERTIFICATE_CE_FDA' | 'BROCHURE' | 'USER_MANUAL' | 'QUALITY_ASSURANCE';
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  version?: string;
  isPublic?: boolean;
}

export interface CreateProductPackOptionDto {
  packName: string;
  packSku?: string;
  testsCount?: number;
  multiplier?: number;
  price: number;
  isDefault?: boolean;
}

export interface CreateProductDto {
  sku: string;
  catalogNumber?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  companyId: string;
  categoryId: string;
  productType:
    | 'EQUIPMENT'
    | 'REAGENT'
    | 'RAPID_KIT'
    | 'PLASTIC_CONSUMABLE'
    | 'MICROBIOLOGY'
    | 'FINE_CHEMICAL'
    | 'BLOOD_COLLECTION_TUBE'
    | 'URINE_STRIP'
    | 'CONTROL_CALIBRATOR';
  hsnCode: string;
  gstRate?: number;
  basePrice: number;
  mrp: number;
  minOrderQuantity?: number;
  isColdChain?: boolean;
  storageTemperature?: string;
  shelfLifeMonths?: number;
  requiresPrescriptionOrAuth?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  isDiscontinued?: boolean;
  packSize: string;
  stockQuantity?: number;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER';
  leadTimeDays?: number;
  images?: CreateProductImageDto[];
  documents?: CreateProductDocumentDto[];
  packOptions?: CreateProductPackOptionDto[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQueryDto {
  search?: string;
  companyId?: string;
  categoryId?: string;
  productType?: string;
  packSize?: string;
  availability?: 'ALL' | 'IN_STOCK' | 'COLD_CHAIN';
  isColdChain?: boolean | string;
  isActive?: boolean | string;
  sortBy?: 'name' | 'price_asc' | 'price_desc' | 'created_at' | 'sku';
  page?: number;
  limit?: number;
}
