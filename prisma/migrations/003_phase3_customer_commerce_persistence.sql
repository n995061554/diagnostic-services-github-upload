-- ============================================================================
-- A2Z DIAGNOSTICS ENTERPRISE PLATFORM - POSTGRESQL MIGRATION
-- Migration: 003_phase3_customer_commerce_persistence.sql
-- Description: Phase 3 Database Schema for Customer Orders, Credit Profiles,
--              Payment Extensions, Testimonials, Related Products, Service SLAs,
--              Late Payment Penalty Policies, Notifications, and Wallets.
-- Safe, non-destructive migration using IF NOT EXISTS.
-- ============================================================================

-- 1. Customer Orders Table
CREATE TABLE IF NOT EXISTS "customer_orders" (
    "id" VARCHAR(100) PRIMARY KEY,
    "orderNumber" VARCHAR(100) NOT NULL UNIQUE,
    "customerId" VARCHAR(100) NOT NULL,
    "customerLabName" VARCHAR(255) NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "itemCount" INT NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "gstAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "coldChainFee" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "grandTotal" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'PAYMENT_PENDING',
    "paymentMethod" VARCHAR(50),
    "coldChainMonitoring" JSONB,
    "shippingAddress" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_customer_orders_customer_id" ON "customer_orders"("customerId");
CREATE INDEX IF NOT EXISTS "idx_customer_orders_order_number" ON "customer_orders"("orderNumber");
CREATE INDEX IF NOT EXISTS "idx_customer_orders_status" ON "customer_orders"("status");

-- 2. Customer Credit Profiles Table
CREATE TABLE IF NOT EXISTS "customer_credit_profiles" (
    "id" VARCHAR(100) PRIMARY KEY,
    "customerId" VARCHAR(100) NOT NULL UNIQUE,
    "customerLabName" VARCHAR(255) NOT NULL,
    "creditLimit" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "availableCredit" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "currentOutstanding" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "creditPeriodDays" INT NOT NULL DEFAULT 30,
    "dueDate" TIMESTAMP(3),
    "daysOverdue" INT NOT NULL DEFAULT 0,
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'GOOD_STANDING',
    "hasApprovedExtension" BOOLEAN NOT NULL DEFAULT false,
    "approvedExtensionUntil" TIMESTAMP(3),
    "walletPoints" INT NOT NULL DEFAULT 0,
    "businessRating" DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    "paymentReliabilityPercent" DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    "paymentHistory" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "paymentPromises" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_credit_profiles_customer_id" ON "customer_credit_profiles"("customerId");

-- 3. Payment Extension Requests Table
CREATE TABLE IF NOT EXISTS "payment_extension_requests" (
    "id" VARCHAR(100) PRIMARY KEY,
    "customerId" VARCHAR(100) NOT NULL,
    "customerLabName" VARCHAR(255) NOT NULL,
    "customerContactName" VARCHAR(100) NOT NULL,
    "customerEmail" VARCHAR(255) NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "siteName" VARCHAR(255) NOT NULL,
    "invoiceNumber" VARCHAR(100) NOT NULL,
    "orderNumber" VARCHAR(100) NOT NULL,
    "outstandingAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "originalDueDate" TIMESTAMP(3) NOT NULL,
    "requestedDays" INT NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "explanation" TEXT NOT NULL,
    "promisedPaymentDate" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    "approvedDays" INT,
    "approvedUntil" TIMESTAMP(3),
    "internalNotes" TEXT,
    "reviewedBy" VARCHAR(100),
    "reviewedAt" TIMESTAMP(3),
    "previousExtensionsCount" INT NOT NULL DEFAULT 0,
    "previousLatePaymentsCount" INT NOT NULL DEFAULT 0,
    "businessRating" DECIMAL(3, 2) NOT NULL DEFAULT 5.00,
    "walletPoints" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_extension_requests_customer_id" ON "payment_extension_requests"("customerId");
CREATE INDEX IF NOT EXISTS "idx_extension_requests_status" ON "payment_extension_requests"("status");

-- 4. Customer Testimonials Table
CREATE TABLE IF NOT EXISTS "customer_testimonials" (
    "id" VARCHAR(100) PRIMARY KEY,
    "customerName" VARCHAR(120) NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "laboratory" VARCHAR(255) NOT NULL,
    "testimonial" TEXT NOT NULL,
    "rating" INT NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INT NOT NULL DEFAULT 0,
    "assignedCustomerId" VARCHAR(100),
    "avatarUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_testimonials_is_active" ON "customer_testimonials"("isActive");

-- 5. Related Product Mappings Table
CREATE TABLE IF NOT EXISTS "related_product_mappings" (
    "id" VARCHAR(100) PRIMARY KEY,
    "primaryProductId" VARCHAR(100) NOT NULL,
    "analyte" VARCHAR(100) NOT NULL,
    "company" VARCHAR(255) NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "packSize" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "availability" VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK',
    "analyzerCompatibility" VARCHAR(255) NOT NULL,
    "specifications" TEXT NOT NULL,
    "isColdChain" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_related_products_primary" ON "related_product_mappings"("primaryProductId");
CREATE INDEX IF NOT EXISTS "idx_related_products_analyte" ON "related_product_mappings"("analyte");

-- 6. Service SLA Policies Table
CREATE TABLE IF NOT EXISTS "service_sla_policies" (
    "id" VARCHAR(100) PRIMARY KEY,
    "criticalResponseHours" INT NOT NULL DEFAULT 4,
    "highResponseHours" INT NOT NULL DEFAULT 8,
    "mediumResponseHours" INT NOT NULL DEFAULT 24,
    "lowResponseHours" INT NOT NULL DEFAULT 48,
    "serviceTierName" VARCHAR(255) NOT NULL DEFAULT 'Contracted Service Level Agreement',
    "dispatchDescription" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Late Payment Penalty Policies Table
CREATE TABLE IF NOT EXISTS "late_payment_penalty_policies" (
    "id" VARCHAR(100) PRIMARY KEY,
    "standardCreditDays" INT NOT NULL DEFAULT 30,
    "gracePeriodDays" INT NOT NULL DEFAULT 0,
    "standardLatePenaltyPointsPerDay" DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    "approvedGracePenaltyPointsPerDay" DECIMAL(6, 2) NOT NULL DEFAULT 0.50,
    "maxExtensionDays" INT NOT NULL DEFAULT 30,
    "isPenaltyBearing" BOOLEAN NOT NULL DEFAULT true,
    "ratingConfig" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Customer Notifications Table
CREATE TABLE IF NOT EXISTS "customer_notification_records" (
    "id" VARCHAR(100) PRIMARY KEY,
    "customerId" VARCHAR(100),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actionDeepLink" VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS "idx_customer_notifications_cust" ON "customer_notification_records"("customerId");

-- 9. Customer Wallets Table
CREATE TABLE IF NOT EXISTS "customer_wallets" (
    "id" VARCHAR(100) PRIMARY KEY,
    "customerId" VARCHAR(100) NOT NULL UNIQUE,
    "creditLimit" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "currentOutstanding" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "availableCredit" DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    "creditPeriodDays" INT NOT NULL DEFAULT 30,
    "unbilledOrdersCount" INT NOT NULL DEFAULT 0,
    "ledgerEntries" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_customer_wallets_customer_id" ON "customer_wallets"("customerId");
