-- ============================================================================
-- A2Z DIAGNOSTICS ENTERPRISE PLATFORM - POSTGRESQL 16 MIGRATION
-- Migration: 002_phase2_catalog_schema.sql
-- Description: Phase 2 Database Schema for Companies, Hierarchical Categories,
--              Product Master, Images, Documents, and Pack Size Options.
-- ============================================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM (
        'MSDS',
        'IFU_PACK_INSERT',
        'CERTIFICATE_CE_FDA',
        'BROCHURE',
        'USER_MANUAL',
        'QUALITY_ASSURANCE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "StockStatus" AS ENUM (
        'IN_STOCK',
        'LOW_STOCK',
        'OUT_OF_STOCK',
        'ON_ORDER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Companies Table
CREATE TABLE IF NOT EXISTS "companies" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "legalName" VARCHAR(255),
    "logoUrl" VARCHAR(500),
    "website" VARCHAR(255),
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "description" TEXT,
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_companies_code" ON "companies"("code");
CREATE INDEX IF NOT EXISTS "idx_companies_name" ON "companies"("name");
CREATE INDEX IF NOT EXISTS "idx_companies_is_active" ON "companies"("isActive");

-- 3. Categories Table (Unlimited Nested Hierarchy)
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "parentId" UUID REFERENCES "categories"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL UNIQUE,
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT,
    "iconUrl" VARCHAR(500),
    "imageUrl" VARCHAR(500),
    "level" INT NOT NULL DEFAULT 0,
    "path" VARCHAR(500) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_categories_parent_id" ON "categories"("parentId");
CREATE INDEX IF NOT EXISTS "idx_categories_slug" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "idx_categories_path" ON "categories"("path");
CREATE INDEX IF NOT EXISTS "idx_categories_is_active" ON "categories"("isActive");

-- 4. Products Table (Diagnostic Reagents, Equipment & Consumables Master)
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sku" VARCHAR(100) NOT NULL UNIQUE,
    "catalogNumber" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "shortDescription" VARCHAR(500),
    "description" TEXT,
    "companyId" UUID NOT NULL REFERENCES "companies"("id") ON DELETE RESTRICT,
    "categoryId" UUID NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
    "productType" "ProductType" NOT NULL DEFAULT 'REAGENT',
    "hsnCode" VARCHAR(20) NOT NULL,
    "gstRate" DECIMAL(5, 2) NOT NULL DEFAULT 12.00,
    "basePrice" DECIMAL(12, 2) NOT NULL,
    "mrp" DECIMAL(12, 2) NOT NULL,
    "minOrderQuantity" INT NOT NULL DEFAULT 1,
    "isColdChain" BOOLEAN NOT NULL DEFAULT false,
    "storageTemperature" VARCHAR(100) NOT NULL DEFAULT '2°C to 8°C',
    "shelfLifeMonths" INT,
    "requiresPrescriptionOrAuth" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isDiscontinued" BOOLEAN NOT NULL DEFAULT false,
    "packSize" VARCHAR(100) NOT NULL,
    "stockQuantity" INT NOT NULL DEFAULT 0,
    "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "leadTimeDays" INT NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_products_sku" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "idx_products_company_id" ON "products"("companyId");
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_products_product_type" ON "products"("productType");
CREATE INDEX IF NOT EXISTS "idx_products_is_active" ON "products"("isActive");
CREATE INDEX IF NOT EXISTS "idx_products_is_cold_chain" ON "products"("isColdChain");
CREATE INDEX IF NOT EXISTS "idx_products_stock_status" ON "products"("stockStatus");

-- Full text search index on products
CREATE INDEX IF NOT EXISTS "idx_products_search" ON "products" USING GIN (
    to_tsvector('english', coalesce("name", '') || ' ' || coalesce("sku", '') || ' ' || coalesce("catalogNumber", '') || ' ' || coalesce("shortDescription", ''))
);

-- 5. Product Images Table
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "imageUrl" VARCHAR(500) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "altText" VARCHAR(255),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_product_images_product_id" ON "product_images"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_images_is_primary" ON "product_images"("isPrimary");

-- 6. Product Documents Table (MSDS, IFU, CE/FDA, Brochures)
CREATE TABLE IF NOT EXISTS "product_documents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'IFU_PACK_INSERT',
    "fileUrl" VARCHAR(500) NOT NULL,
    "fileSizeBytes" INT,
    "mimeType" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    "version" VARCHAR(50),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_product_documents_product_id" ON "product_documents"("productId");
CREATE INDEX IF NOT EXISTS "idx_product_documents_doc_type" ON "product_documents"("documentType");

-- 7. Product Pack Options Table
CREATE TABLE IF NOT EXISTS "product_pack_options" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "packName" VARCHAR(100) NOT NULL,
    "packSku" VARCHAR(100),
    "testsCount" INT,
    "multiplier" DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    "price" DECIMAL(12, 2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_product_pack_options_product_id" ON "product_pack_options"("productId");
