-- ============================================================================
-- UNREVIEWED AND NOT EXECUTED - PROPOSED SCHEMA MIGRATION FOR REVIEW ONLY
-- A2Z DIAGNOSTICS ENTERPRISE PLATFORM - POSTGRESQL 16 SCHEMA HARMONIZATION
-- Description: Converts primary and foreign key columns from UUID to VARCHAR(100)
--              to natively support semantic string IDs (e.g. 'u-admin-01',
--              'u-cust-01', 'prod-001', 'comp-roche', 'st-101', 'ORD-2026-8842').
-- 
-- SAFETY NOTICE:
-- 1. This file is generated strictly as a proposal for architectural review.
-- 2. DO NOT EXECUTE on production. Verify against an isolated staging DB first.
-- 3. Non-destructive: Uses ALTER TABLE ... TYPE VARCHAR(100) and IF EXISTS guards.
-- ============================================================================

-- Step 1: Temporarily disable foreign key constraints during column type conversion
SET session_replication_role = 'replica';

DO $$ BEGIN
    -- ------------------------------------------------------------------------
    -- 1. AUTHENTICATION, RBAC & USER PROFILE TABLES
    -- ------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE "users" ALTER COLUMN "id" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        ALTER TABLE "roles" ALTER COLUMN "id" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        ALTER TABLE "permissions" ALTER COLUMN "id" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        ALTER TABLE "user_roles" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "user_roles" ALTER COLUMN "userId" TYPE VARCHAR(100);
        ALTER TABLE "user_roles" ALTER COLUMN "roleId" TYPE VARCHAR(100);
        ALTER TABLE "user_roles" ALTER COLUMN "assignedBy" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        ALTER TABLE "role_permissions" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "role_permissions" ALTER COLUMN "roleId" TYPE VARCHAR(100);
        ALTER TABLE "role_permissions" ALTER COLUMN "permissionId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        ALTER TABLE "user_sessions" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "user_sessions" ALTER COLUMN "userId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        ALTER TABLE "refresh_tokens" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "refresh_tokens" ALTER COLUMN "userId" TYPE VARCHAR(100);
        ALTER TABLE "refresh_tokens" ALTER COLUMN "family" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "audit_logs" ALTER COLUMN "userId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_profiles') THEN
        ALTER TABLE "customer_profiles" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "customer_profiles" ALTER COLUMN "userId" TYPE VARCHAR(100);
        ALTER TABLE "customer_profiles" ALTER COLUMN "assignedSalesPersonId" TYPE VARCHAR(100);
        ALTER TABLE "customer_profiles" ALTER COLUMN "approvedBy" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_profiles') THEN
        ALTER TABLE "employee_profiles" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "employee_profiles" ALTER COLUMN "userId" TYPE VARCHAR(100);
        ALTER TABLE "employee_profiles" ALTER COLUMN "reportingToId" TYPE VARCHAR(100);
    END IF;

    -- ------------------------------------------------------------------------
    -- 2. COMPANIES, CATEGORIES & CATALOG PRODUCTS
    -- ------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        ALTER TABLE "companies" ALTER COLUMN "id" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE "categories" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "categories" ALTER COLUMN "parentId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE "products" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "products" ALTER COLUMN "companyId" TYPE VARCHAR(100);
        ALTER TABLE "products" ALTER COLUMN "categoryId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        ALTER TABLE "product_images" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "product_images" ALTER COLUMN "productId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_documents') THEN
        ALTER TABLE "product_documents" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "product_documents" ALTER COLUMN "productId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_pack_options') THEN
        ALTER TABLE "product_pack_options" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "product_pack_options" ALTER COLUMN "productId" TYPE VARCHAR(100);
    END IF;

    -- ------------------------------------------------------------------------
    -- 3. BIOMEDICAL ENGINEERING & SERVICE TICKETS
    -- ------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_equipments') THEN
        ALTER TABLE "customer_equipments" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "customer_equipments" ALTER COLUMN "customerId" TYPE VARCHAR(100);
        ALTER TABLE "customer_equipments" ALTER COLUMN "productId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tickets') THEN
        ALTER TABLE "service_tickets" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "customerId" TYPE VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "equipmentId" TYPE VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "assignedEngineerId" TYPE VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "reopenedById" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_check_ins') THEN
        ALTER TABLE "service_ticket_check_ins" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_check_ins" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_check_outs') THEN
        ALTER TABLE "service_ticket_check_outs" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_check_outs" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_notes') THEN
        ALTER TABLE "service_ticket_notes" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_notes" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_notes" ALTER COLUMN "authorId" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_attachments') THEN
        ALTER TABLE "service_ticket_attachments" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_attachments" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_attachments" ALTER COLUMN "uploadedById" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_parts_used') THEN
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "partId" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "addedById" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_resolutions') THEN
        ALTER TABLE "service_ticket_resolutions" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_resolutions" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_resolutions" ALTER COLUMN "resolvedById" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_feedback') THEN
        ALTER TABLE "service_ticket_feedback" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_feedback" ALTER COLUMN "ticketId" TYPE VARCHAR(100);
        ALTER TABLE "service_ticket_feedback" ALTER COLUMN "customerId" TYPE VARCHAR(100);
    END IF;

    -- ------------------------------------------------------------------------
    -- 4. COMMERCIAL PRICING CONTRACTS & ACCESS MATRIX
    -- ------------------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_matrix_rules') THEN
        ALTER TABLE "price_matrix_rules" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "price_matrix_rules" ALTER COLUMN "companyId" TYPE VARCHAR(100);
        ALTER TABLE "price_matrix_rules" ALTER COLUMN "categoryId" TYPE VARCHAR(100);
        ALTER TABLE "price_matrix_rules" ALTER COLUMN "productId" TYPE VARCHAR(100);
        ALTER TABLE "price_matrix_rules" ALTER COLUMN "createdById" TYPE VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'price_contracts') THEN
        ALTER TABLE "price_contracts" ALTER COLUMN "id" TYPE VARCHAR(100);
        ALTER TABLE "price_contracts" ALTER COLUMN "customerId" TYPE VARCHAR(100);
        ALTER TABLE "price_contracts" ALTER COLUMN "approvedById" TYPE VARCHAR(100);
    END IF;

END $$;

-- Step 2: Restore normal foreign key constraint enforcement
SET session_replication_role = 'origin';

-- End of proposed harmonization script
