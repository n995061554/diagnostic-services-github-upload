-- ============================================================================
-- UNREVIEWED AND NOT EXECUTED - REVISED PROPOSED SCHEMA MIGRATION V2
-- A2Z DIAGNOSTICS ENTERPRISE PLATFORM - POSTGRESQL 16 SCHEMA HARMONIZATION
-- 
-- DESCRIPTION:
-- Converts primary and foreign key columns from UUID to VARCHAR(100) across
-- all Phase 1 and Phase 2 tables to natively support semantic string IDs
-- (e.g., 'u-admin-01', 'u-cust-01', 'prod-001', 'comp-roche', 'st-101', 'ORD-2026-8842').
--
-- SAFETY & COMPLIANCE NOTICE:
-- 1. THIS SCRIPT IS GENERATED FOR ARCHITECTURAL REVIEW ONLY. DO NOT EXECUTE ON PRODUCTION.
-- 2. No session_replication_role bypass is used (managed cloud databases like Neon/RDS/Supabase
--    forbid session_replication_role without superuser privileges, and PostgreSQL DDL ignores it).
-- 3. Explicit 3-phase execution: Drop FK constraints -> Alter column types with USING -> Recreate FKs.
-- 4. Entire migration is wrapped in an atomic transaction (BEGIN ... COMMIT).
-- 
-- CRITICAL LIMITATION & PRE-REQUISITE:
-- Existing foreign key constraint names may vary depending on how previous Prisma migrations 
-- were generated. Prior to running on an isolated staging database, verify constraint names with:
--   SELECT conname, conrelid::regclass AS table_name FROM pg_constraint WHERE contype = 'f';
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PHASE 1: EXPLICITLY DROP DEPENDENT FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    -- User & RBAC Relations
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_userId_fkey') THEN
        ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_userId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_roleId_fkey') THEN
        ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_roleId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_roleId_fkey') THEN
        ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_roleId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permissionId_fkey') THEN
        ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_sessions_userId_fkey') THEN
        ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_userId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_userId_fkey') THEN
        ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_userId_fkey') THEN
        ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_profiles_userId_fkey') THEN
        ALTER TABLE "customer_profiles" DROP CONSTRAINT "customer_profiles_userId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profiles_userId_fkey') THEN
        ALTER TABLE "employee_profiles" DROP CONSTRAINT "employee_profiles_userId_fkey";
    END IF;

    -- Catalog, Company & Product Relations
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_parentId_fkey') THEN
        ALTER TABLE "categories" DROP CONSTRAINT "categories_parentId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_companyId_fkey') THEN
        ALTER TABLE "products" DROP CONSTRAINT "products_companyId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_categoryId_fkey') THEN
        ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_images_productId_fkey') THEN
        ALTER TABLE "product_images" DROP CONSTRAINT "product_images_productId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_documents_productId_fkey') THEN
        ALTER TABLE "product_documents" DROP CONSTRAINT "product_documents_productId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_pack_options_productId_fkey') THEN
        ALTER TABLE "product_pack_options" DROP CONSTRAINT "product_pack_options_productId_fkey";
    END IF;

    -- Biomedical Equipment & Service Tickets Relations
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_equipments_customerId_fkey') THEN
        ALTER TABLE "customer_equipments" DROP CONSTRAINT "customer_equipments_customerId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_tickets_customerId_fkey') THEN
        ALTER TABLE "service_tickets" DROP CONSTRAINT "service_tickets_customerId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_tickets_equipmentId_fkey') THEN
        ALTER TABLE "service_tickets" DROP CONSTRAINT "service_tickets_equipmentId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_tickets_assignedEngineerId_fkey') THEN
        ALTER TABLE "service_tickets" DROP CONSTRAINT "service_tickets_assignedEngineerId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_check_ins_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_check_ins" DROP CONSTRAINT "service_ticket_check_ins_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_check_outs_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_check_outs" DROP CONSTRAINT "service_ticket_check_outs_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_notes_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_notes" DROP CONSTRAINT "service_ticket_notes_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_notes_authorId_fkey') THEN
        ALTER TABLE "service_ticket_notes" DROP CONSTRAINT "service_ticket_notes_authorId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_attachments_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_attachments" DROP CONSTRAINT "service_ticket_attachments_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_attachments_uploadedById_fkey') THEN
        ALTER TABLE "service_ticket_attachments" DROP CONSTRAINT "service_ticket_attachments_uploadedById_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_parts_used_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_parts_used" DROP CONSTRAINT "service_ticket_parts_used_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_resolutions_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_resolutions" DROP CONSTRAINT "service_ticket_resolutions_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_feedback_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_feedback" DROP CONSTRAINT "service_ticket_feedback_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_back_office_reviews_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_back_office_reviews" DROP CONSTRAINT "service_ticket_back_office_reviews_ticketId_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_ticket_disputes_ticketId_fkey') THEN
        ALTER TABLE "service_ticket_disputes" DROP CONSTRAINT "service_ticket_disputes_ticketId_fkey";
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PHASE 2: ALTER COLUMN TYPES WITH EXPLICIT TYPE CASTS (USING col::VARCHAR(100))
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    -- 1. Users & RBAC Tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE "users" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" VARCHAR(100);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dataScope" VARCHAR(50) DEFAULT 'OWN';
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branch" VARCHAR(100);
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "region" VARCHAR(50);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
        ALTER TABLE "roles" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        ALTER TABLE "permissions" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        ALTER TABLE "user_roles" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "user_roles" ALTER COLUMN "userId" TYPE VARCHAR(100) USING "userId"::VARCHAR(100);
        ALTER TABLE "user_roles" ALTER COLUMN "roleId" TYPE VARCHAR(100) USING "roleId"::VARCHAR(100);
        ALTER TABLE "user_roles" ALTER COLUMN "assignedBy" TYPE VARCHAR(100) USING "assignedBy"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_permissions') THEN
        ALTER TABLE "role_permissions" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "role_permissions" ALTER COLUMN "roleId" TYPE VARCHAR(100) USING "roleId"::VARCHAR(100);
        ALTER TABLE "role_permissions" ALTER COLUMN "permissionId" TYPE VARCHAR(100) USING "permissionId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        ALTER TABLE "user_sessions" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "user_sessions" ALTER COLUMN "userId" TYPE VARCHAR(100) USING "userId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refresh_tokens') THEN
        ALTER TABLE "refresh_tokens" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "refresh_tokens" ALTER COLUMN "userId" TYPE VARCHAR(100) USING "userId"::VARCHAR(100);
        ALTER TABLE "refresh_tokens" ALTER COLUMN "family" TYPE VARCHAR(100) USING "family"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE "audit_logs" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "audit_logs" ALTER COLUMN "userId" TYPE VARCHAR(100) USING "userId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_profiles') THEN
        ALTER TABLE "customer_profiles" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "customer_profiles" ALTER COLUMN "userId" TYPE VARCHAR(100) USING "userId"::VARCHAR(100);
        ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "customerCode" VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employee_profiles') THEN
        ALTER TABLE "employee_profiles" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "employee_profiles" ALTER COLUMN "userId" TYPE VARCHAR(100) USING "userId"::VARCHAR(100);
        ALTER TABLE "employee_profiles" ALTER COLUMN "reportingManagerId" TYPE VARCHAR(100) USING "reportingManagerId"::VARCHAR(100);
    END IF;

    -- 2. Companies, Categories & Products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        ALTER TABLE "companies" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE "categories" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "categories" ALTER COLUMN "parentId" TYPE VARCHAR(100) USING "parentId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE "products" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "products" ALTER COLUMN "companyId" TYPE VARCHAR(100) USING "companyId"::VARCHAR(100);
        ALTER TABLE "products" ALTER COLUMN "categoryId" TYPE VARCHAR(100) USING "categoryId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        ALTER TABLE "product_images" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "product_images" ALTER COLUMN "productId" TYPE VARCHAR(100) USING "productId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_documents') THEN
        ALTER TABLE "product_documents" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "product_documents" ALTER COLUMN "productId" TYPE VARCHAR(100) USING "productId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_pack_options') THEN
        ALTER TABLE "product_pack_options" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "product_pack_options" ALTER COLUMN "productId" TYPE VARCHAR(100) USING "productId"::VARCHAR(100);
    END IF;

    -- 3. Biomedical Equipment & Service Tickets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_equipments') THEN
        ALTER TABLE "customer_equipments" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "customer_equipments" ALTER COLUMN "customerId" TYPE VARCHAR(100) USING "customerId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_tickets') THEN
        ALTER TABLE "service_tickets" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "customerId" TYPE VARCHAR(100) USING "customerId"::VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "equipmentId" TYPE VARCHAR(100) USING "equipmentId"::VARCHAR(100);
        ALTER TABLE "service_tickets" ALTER COLUMN "assignedEngineerId" TYPE VARCHAR(100) USING "assignedEngineerId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_check_ins') THEN
        ALTER TABLE "service_ticket_check_ins" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_check_ins" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_check_outs') THEN
        ALTER TABLE "service_ticket_check_outs" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_check_outs" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_notes') THEN
        ALTER TABLE "service_ticket_notes" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_notes" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
        ALTER TABLE "service_ticket_notes" ALTER COLUMN "authorId" TYPE VARCHAR(100) USING "authorId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_attachments') THEN
        ALTER TABLE "service_ticket_attachments" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_attachments" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
        ALTER TABLE "service_ticket_attachments" ALTER COLUMN "uploadedById" TYPE VARCHAR(100) USING "uploadedById"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_parts_used') THEN
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
        ALTER TABLE "service_ticket_parts_used" ALTER COLUMN "partCatalogId" TYPE VARCHAR(100) USING "partCatalogId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_resolutions') THEN
        ALTER TABLE "service_ticket_resolutions" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_resolutions" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_communications') THEN
        ALTER TABLE "service_ticket_communications" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_communications" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_feedbacks') THEN
        ALTER TABLE "service_ticket_feedbacks" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_feedbacks" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_back_office_reviews') THEN
        ALTER TABLE "service_ticket_back_office_reviews" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_back_office_reviews" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
        ALTER TABLE "service_ticket_back_office_reviews" ALTER COLUMN "reviewedById" TYPE VARCHAR(100) USING "reviewedById"::VARCHAR(100);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_ticket_disputes') THEN
        ALTER TABLE "service_ticket_disputes" ALTER COLUMN "id" TYPE VARCHAR(100) USING id::VARCHAR(100);
        ALTER TABLE "service_ticket_disputes" ALTER COLUMN "ticketId" TYPE VARCHAR(100) USING "ticketId"::VARCHAR(100);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- PHASE 3: RE-ESTABLISH FOREIGN KEY CONSTRAINTS WITH REFERENTIAL INTEGRITY
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    -- User & RBAC
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE;
    ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE;
    ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE;
    ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
    ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

    -- Catalog & Products
    ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL;
    ALTER TABLE "products" ADD CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT;
    ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT;
    ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;
    ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;
    ALTER TABLE "product_pack_options" ADD CONSTRAINT "product_pack_options_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE;

    -- Biomedical Equipment & Service Tickets
    ALTER TABLE "customer_equipments" ADD CONSTRAINT "customer_equipments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "customer_equipments"("id") ON DELETE SET NULL;
    ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_assignedEngineerId_fkey" FOREIGN KEY ("assignedEngineerId") REFERENCES "users"("id") ON DELETE SET NULL;
    ALTER TABLE "service_ticket_check_ins" ADD CONSTRAINT "service_ticket_check_ins_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_check_outs" ADD CONSTRAINT "service_ticket_check_outs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_notes" ADD CONSTRAINT "service_ticket_notes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_notes" ADD CONSTRAINT "service_ticket_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_attachments" ADD CONSTRAINT "service_ticket_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_attachments" ADD CONSTRAINT "service_ticket_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_parts_used" ADD CONSTRAINT "service_ticket_parts_used_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_resolutions" ADD CONSTRAINT "service_ticket_resolutions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_communications" ADD CONSTRAINT "service_ticket_communications_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_feedbacks" ADD CONSTRAINT "service_ticket_feedbacks_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_back_office_reviews" ADD CONSTRAINT "service_ticket_back_office_reviews_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
    ALTER TABLE "service_ticket_disputes" ADD CONSTRAINT "service_ticket_disputes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "service_tickets"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Foreign key re-creation encountered an exception: %', SQLERRM;
    RAISE;
END $$;

COMMIT;
-- End of proposed harmonized migration V2
