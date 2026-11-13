-- ============================================================================
-- A2Z DIAGNOSTICS ENTERPRISE PLATFORM
-- PostgreSQL Migration: 001_initial_auth_rbac.sql
-- Phase 1: Authentication, RBAC, User Profiles, Sessions, Tokens, Audit Logs
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Custom Types / Enums
DO $$ BEGIN
    CREATE TYPE "UserRoleType" AS ENUM (
        'CUSTOMER',
        'DISTRIBUTOR',
        'OFFICE_ADMIN',
        'OFFICE_STAFF',
        'SALES_PERSON',
        'MARKETING_STAFF',
        'SERVICE_ENGINEER',
        'SERVICE_MANAGER',
        'SUPER_ADMIN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'PENDING_VERIFICATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CustomerType" AS ENUM (
        'HOSPITAL_LAB',
        'INDEPENDENT_DIAGNOSTIC_CENTER',
        'CLINICAL_LABORATORY',
        'RESEARCH_INSTITUTE',
        'BLOOD_BANK',
        'INDIVIDUAL_PRACTITIONER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phoneNumber" VARCHAR(30) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "avatarUrl" VARCHAR(500),
    "roleType" "UserRoleType" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" VARCHAR(255),
    "lastLoginAt" TIMESTAMPTZ,
    "lastLoginIp" VARCHAR(45),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_phoneNumber" ON "users"("phoneNumber");
CREATE INDEX IF NOT EXISTS "idx_users_roleType" ON "users"("roleType");
CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users"("status");

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" "UserRoleType" NOT NULL UNIQUE,
    "displayName" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Permissions Table
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL UNIQUE,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_permissions_module" ON "permissions"("module");

-- 4. User-Roles Mapping Table
CREATE TABLE IF NOT EXISTS "user_roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "roleId" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "assignedBy" UUID,
    CONSTRAINT "uq_user_roles_user_role" UNIQUE ("userId", "roleId")
);

-- 5. Role-Permissions Mapping Table
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "roleId" UUID NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
    "permissionId" UUID NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
    "grantedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "uq_role_permissions_role_perm" UNIQUE ("roleId", "permissionId")
);

-- 6. User Sessions Table
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "sessionToken" VARCHAR(255) NOT NULL UNIQUE,
    "deviceType" VARCHAR(50),
    "deviceName" VARCHAR(150),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_user_sessions_userId" ON "user_sessions"("userId");

-- 7. Refresh Tokens Table (Token Family for Rotation & Replay Protection)
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "tokenHash" VARCHAR(255) NOT NULL UNIQUE,
    "family" UUID NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "revokedAt" TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_userId" ON "refresh_tokens"("userId");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_family" ON "refresh_tokens"("family");

-- 8. Immutable Audit Logs Table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "userEmail" VARCHAR(255),
    "userRole" VARCHAR(50),
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "resourceType" VARCHAR(100),
    "resourceId" VARCHAR(100),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_module" ON "audit_logs"("module");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_timestamp" ON "audit_logs"("timestamp");

-- 9. Customer Profiles Table
CREATE TABLE IF NOT EXISTS "customer_profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "labName" VARCHAR(255) NOT NULL,
    "customerCode" VARCHAR(50) NOT NULL UNIQUE,
    "customerType" "CustomerType" NOT NULL DEFAULT 'CLINICAL_LABORATORY',
    "gstNumber" VARCHAR(50),
    "drugLicenseNumber" VARCHAR(100),
    "creditLimit" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "creditPeriodDays" INTEGER NOT NULL DEFAULT 30,
    "currentOutstanding" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    "assignedSalesPersonId" UUID,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMPTZ,
    "approvedBy" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_customer_profiles_code" ON "customer_profiles"("customerCode");
CREATE INDEX IF NOT EXISTS "idx_customer_profiles_lab" ON "customer_profiles"("labName");

-- 10. Employee Profiles Table
CREATE TABLE IF NOT EXISTS "employee_profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "employeeCode" VARCHAR(50) NOT NULL UNIQUE,
    "department" VARCHAR(100) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "reportingToId" UUID,
    "joiningDate" DATE NOT NULL,
    "emergencyPhone" VARCHAR(30),
    "currentLat" NUMERIC(10, 8),
    "currentLng" NUMERIC(11, 8),
    "lastLocationAt" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_employee_profiles_code" ON "employee_profiles"("employeeCode");
CREATE INDEX IF NOT EXISTS "idx_employee_profiles_dept" ON "employee_profiles"("department");

-- Seed Initial System Roles
INSERT INTO "roles" ("name", "displayName", "description", "isSystem")
VALUES 
    ('SUPER_ADMIN', 'Super Administrator', 'Full unconstrained system authority', true),
    ('OFFICE_ADMIN', 'Office Administrator', 'Full backoffice, catalogue, order, pricing, user and reports management', true),
    ('OFFICE_STAFF', 'Office Staff', 'Operational order processing, catalog view, complaint routing', true),
    ('CUSTOMER', 'Laboratory Customer', 'Access to customer-specific catalog, ordering, tickets, ledger and loyalty wallet', true),
    ('DISTRIBUTOR', 'Wholesale Distributor', 'Distributor catalog browsing and RFQ inquiries without retail pricing', true),
    ('SALES_PERSON', 'Sales Representative', 'Field visits, client check-ins, customer orders and target tracking', true),
    ('MARKETING_STAFF', 'Marketing Staff', 'Campaign management, customer segmentation, offer publishing', true),
    ('SERVICE_ENGINEER', 'Service Engineer', 'Field ticket execution, equipment maintenance, parts logging, check-in', true),
    ('SERVICE_MANAGER', 'Service Manager', 'SLA oversight, engineer assignment, repeat failure alerts review', true)
ON CONFLICT ("name") DO NOTHING;
