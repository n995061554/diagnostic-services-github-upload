-- CreateEnum
CREATE TYPE "UserRoleType" AS ENUM ('SUPER_ADMIN', 'OFFICE_ADMIN', 'OFFICE_STAFF', 'SALES_MANAGER', 'SALES_REP', 'SERVICE_ENGINEER', 'ACCOUNTANT', 'CUSTOMER', 'LAB_STAFF');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'PENDING_VERIFICATION', 'PENDING_ACTIVATION', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "DataScope" AS ENUM ('ALL', 'TERRITORY', 'REGION', 'BRANCH', 'OWN');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('CLINICAL_LABORATORY', 'HOSPITAL_LAB', 'RESEARCH_INSTITUTE', 'BLOOD_BANK', 'DIAGNOSTIC_CHAIN', 'INDIVIDUAL_PRACTITIONER');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('EXECUTIVE', 'OPERATIONS', 'SALES', 'SERVICE', 'FINANCE', 'IT_ADMIN');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('REAGENT', 'INSTRUMENT', 'CONSUMABLE', 'RAPID_TEST', 'CALIBRATOR_CONTROL', 'EQUIPMENT', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'CALL_FOR_ORDER', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'ASSIGNED', 'ACKNOWLEDGED', 'SCHEDULED', 'ON_THE_WAY', 'IN_PROGRESS', 'SPARE_PARTS_PENDING', 'RESOLVED', 'CLOSED', 'DISPUTED', 'REOPENED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SparePartCriticality" AS ENUM ('CRITICAL', 'HIGH', 'STANDARD', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "SparePartStockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ON_ORDER');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('UPLOADED', 'VALIDATING', 'VALIDATION_FAILED', 'READY_FOR_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IMPORTING', 'COMPLETED', 'PARTIALLY_FAILED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportRowAction" AS ENUM ('CREATE', 'UPDATE', 'SKIP', 'ERROR');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('PENDING', 'IMPORTED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(30),
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "avatar_url" VARCHAR(500),
    "role_type" "UserRoleType" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "data_scope" "DataScope" NOT NULL DEFAULT 'OWN',
    "branch" VARCHAR(100),
    "region" VARCHAR(100),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" VARCHAR(255),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lockout_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "password_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activation_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100),
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100),
    "description" TEXT,
    "module" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,
    "role_id" VARCHAR(100) NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" VARCHAR(100) NOT NULL,
    "role_id" VARCHAR(100) NOT NULL,
    "permission_id" VARCHAR(100) NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,
    "token_hash" VARCHAR(255),
    "session_token" VARCHAR(255),
    "device_type" VARCHAR(50),
    "device_name" VARCHAR(100),
    "browser" VARCHAR(100),
    "ip_address" VARCHAR(45),
    "approx_location" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "family" VARCHAR(100) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100),
    "user_email" VARCHAR(255),
    "user_role" VARCHAR(50),
    "action" VARCHAR(100) NOT NULL,
    "module" VARCHAR(100),
    "resource_type" VARCHAR(100),
    "resource_id" VARCHAR(100),
    "entity_type" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "status" VARCHAR(50),
    "details" JSONB,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,
    "customer_code" VARCHAR(100),
    "lab_name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "customer_type" "CustomerType" NOT NULL DEFAULT 'CLINICAL_LABORATORY',
    "gst_number" VARCHAR(30),
    "pan_number" VARCHAR(20),
    "drug_license_number" VARCHAR(100),
    "contact_person" VARCHAR(100),
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(30),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(20),
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "credit_period_days" INTEGER NOT NULL DEFAULT 30,
    "current_outstanding" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "assigned_sales_person_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "department" "Department" NOT NULL DEFAULT 'SERVICE',
    "assigned_territory" VARCHAR(100) NOT NULL DEFAULT 'NATIONAL',
    "reporting_manager_id" VARCHAR(100),
    "joining_date" TIMESTAMP(3),
    "emergency_phone" VARCHAR(30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "legal_name" VARCHAR(255),
    "logo_url" VARCHAR(500),
    "website" VARCHAR(255),
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "description" TEXT,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "image_url" VARCHAR(500),
    "parent_id" VARCHAR(100),
    "level" INTEGER NOT NULL DEFAULT 0,
    "path" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" VARCHAR(100) NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "catalog_number" VARCHAR(100),
    "name" VARCHAR(255) NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "company_id" VARCHAR(100) NOT NULL,
    "category_id" VARCHAR(100) NOT NULL,
    "product_type" "ProductType" NOT NULL DEFAULT 'REAGENT',
    "hsn_code" VARCHAR(20) NOT NULL,
    "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    "base_price" DECIMAL(12,2) NOT NULL,
    "mrp" DECIMAL(12,2) NOT NULL,
    "min_order_quantity" INTEGER NOT NULL DEFAULT 1,
    "is_cold_chain" BOOLEAN NOT NULL DEFAULT false,
    "storage_temperature" VARCHAR(100) NOT NULL DEFAULT '2°C to 8°C',
    "shelf_life_months" INTEGER,
    "requires_prescription_or_auth" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_discontinued" BOOLEAN NOT NULL DEFAULT false,
    "pack_size" VARCHAR(100) NOT NULL DEFAULT 'Standard Pack',
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "stock_status" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "lead_time_days" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" VARCHAR(100) NOT NULL,
    "product_id" VARCHAR(100) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "alt_text" VARCHAR(255),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_documents" (
    "id" VARCHAR(100) NOT NULL,
    "product_id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size_bytes" INTEGER,
    "mime_type" VARCHAR(100),
    "version" VARCHAR(50),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_pack_options" (
    "id" VARCHAR(100) NOT NULL,
    "product_id" VARCHAR(100) NOT NULL,
    "pack_size_name" VARCHAR(150) NOT NULL,
    "pack_sku" VARCHAR(100),
    "tests_count" INTEGER,
    "quantity_multiplier" DECIMAL(10,2) NOT NULL DEFAULT 1.0,
    "price" DECIMAL(12,2) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pack_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_equipments" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "customer_lab_name" VARCHAR(255),
    "customer_code" VARCHAR(100),
    "product_id" VARCHAR(100),
    "product_sku" VARCHAR(100),
    "equipment_name" VARCHAR(255) NOT NULL,
    "company_id" VARCHAR(100),
    "company_name" VARCHAR(150),
    "model_number" VARCHAR(100) NOT NULL,
    "serial_number" VARCHAR(100) NOT NULL,
    "manufacturer" VARCHAR(100),
    "department" VARCHAR(100),
    "location_department" VARCHAR(100),
    "contact_person" VARCHAR(100),
    "contact_phone" VARCHAR(30),
    "installation_date" TIMESTAMP(3),
    "warranty_status" VARCHAR(50),
    "warranty_expiry_date" TIMESTAMP(3),
    "last_service_date" TIMESTAMP(3),
    "next_pm_due_date" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "health_score" INTEGER,
    "qr_code" VARCHAR(255),
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_spare_parts_catalog" (
    "id" VARCHAR(100) NOT NULL,
    "part_number" VARCHAR(100) NOT NULL,
    "part_name" VARCHAR(255) NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "criticality" "SparePartCriticality" NOT NULL DEFAULT 'STANDARD',
    "stock_status" "SparePartStockStatus" NOT NULL DEFAULT 'IN_STOCK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_spare_parts_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_tickets" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_number" VARCHAR(50) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "equipment_id" VARCHAR(100),
    "priority" "TicketPriority" NOT NULL DEFAULT 'HIGH',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "error_code" VARCHAR(100),
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "assigned_engineer_id" VARCHAR(100),
    "assigned_at" TIMESTAMP(3),
    "acknowledged_at" TIMESTAMP(3),
    "scheduled_visit_date" TIMESTAMP(3),
    "scheduled_visit_slot" VARCHAR(50),
    "engineer_on_the_way_at" TIMESTAMP(3),
    "sla_target_hours" INTEGER NOT NULL DEFAULT 8,
    "sla_target_timestamp" TIMESTAMP(3) NOT NULL,
    "sla_status" VARCHAR(50) NOT NULL DEFAULT 'ON_TRACK',
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reopened_at" TIMESTAMP(3),
    "reopened_by_id" VARCHAR(100),
    "reopen_reason" TEXT,
    "notes" JSONB,
    "attachments" JSONB,
    "parts_used_payload" JSONB,
    "customer_comm_payload" JSONB,
    "dispute_history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_check_ins" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "engineer_id" VARCHAR(100) NOT NULL,
    "check_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "battery_pct" INTEGER,
    "location_name" VARCHAR(255),
    "is_geo_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_check_outs" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "engineer_id" VARCHAR(100) NOT NULL,
    "check_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "work_summary" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_check_outs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_parts_used" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "part_catalog_id" VARCHAR(100),
    "part_number" VARCHAR(100) NOT NULL,
    "part_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "is_under_warranty" BOOLEAN NOT NULL DEFAULT false,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_parts_used_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_resolutions" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "root_cause_category" VARCHAR(100) NOT NULL,
    "action_taken" TEXT NOT NULL,
    "preventive_advice" TEXT,
    "calibration_passed" BOOLEAN NOT NULL DEFAULT true,
    "qc_value_observed" VARCHAR(100),
    "resolved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_communications" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "sender_type" VARCHAR(50) NOT NULL,
    "sender_id" VARCHAR(100),
    "sender_name" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "is_customer_visible" BOOLEAN NOT NULL DEFAULT true,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_feedbacks" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "feedback_notes" TEXT,
    "signatory_name" VARCHAR(100),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_back_office_reviews" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "is_billable" BOOLEAN NOT NULL DEFAULT false,
    "labor_charges" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "parts_charges" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_ticket_back_office_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ticket_disputes" (
    "id" VARCHAR(100) NOT NULL,
    "ticket_id" VARCHAR(100) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    "action_taken" TEXT,
    "raised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "service_ticket_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" VARCHAR(100) NOT NULL,
    "order_number" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "customer_lab_name" VARCHAR(255) NOT NULL,
    "items" JSONB NOT NULL,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "gst_amount" DECIMAL(12,2) NOT NULL,
    "cold_chain_fee" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "tax_percent" DECIMAL(5,2),
    "tax_amount" DECIMAL(12,2),
    "discount_amount" DECIMAL(12,2) DEFAULT 0.00,
    "shipping_charges" DECIMAL(12,2) DEFAULT 0.00,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "payment_status" VARCHAR(50) NOT NULL,
    "payment_method" VARCHAR(50),
    "cold_chain_monitoring" JSONB,
    "shipping_address" TEXT NOT NULL,
    "billing_address" JSONB,
    "order_status" VARCHAR(50),
    "priority" VARCHAR(50),
    "notes" TEXT,
    "status_history" JSONB,
    "delivery_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_profiles" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "customer_lab_name" VARCHAR(255) NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "available_credit" DECIMAL(12,2) NOT NULL,
    "current_outstanding" DECIMAL(12,2) NOT NULL,
    "credit_period_days" INTEGER NOT NULL DEFAULT 30,
    "due_date" TIMESTAMP(3),
    "days_overdue" INTEGER NOT NULL DEFAULT 0,
    "payment_status" VARCHAR(50) NOT NULL,
    "has_approved_extension" BOOLEAN NOT NULL DEFAULT false,
    "approved_extension_until" TIMESTAMP(3),
    "wallet_points" INTEGER NOT NULL DEFAULT 0,
    "business_rating" DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    "payment_reliability_percent" DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    "payment_history" JSONB,
    "payment_promises" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_wallets" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "customer_lab_name" VARCHAR(255) NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "current_outstanding" DECIMAL(12,2) NOT NULL,
    "available_credit" DECIMAL(12,2) NOT NULL,
    "credit_period_days" INTEGER NOT NULL DEFAULT 30,
    "unbilled_orders_count" INTEGER NOT NULL DEFAULT 0,
    "wallet_balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "ledger_entries" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_extension_requests" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "customer_lab_name" VARCHAR(255) NOT NULL,
    "current_due_date" TIMESTAMP(3) NOT NULL,
    "requested_due_date" TIMESTAMP(3) NOT NULL,
    "outstanding_amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "extension_days" INTEGER NOT NULL,
    "estimated_interest_cost" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "approved_by" VARCHAR(100),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_extension_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_testimonials" (
    "id" VARCHAR(100) NOT NULL,
    "lab_name" VARCHAR(255) NOT NULL,
    "director_name" VARCHAR(150) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "quote" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "related_product_mappings" (
    "id" VARCHAR(100) NOT NULL,
    "primary_product_id" VARCHAR(100) NOT NULL,
    "analyte" VARCHAR(150) NOT NULL,
    "company" VARCHAR(150) NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "pack_size" VARCHAR(100) NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "availability" VARCHAR(50) NOT NULL,
    "analyzer_compatibility" JSONB NOT NULL,
    "specifications" JSONB NOT NULL,
    "is_cold_chain" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "related_product_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_sla_policies" (
    "id" VARCHAR(100) NOT NULL,
    "critical_response_hours" INTEGER NOT NULL DEFAULT 2,
    "high_response_hours" INTEGER NOT NULL DEFAULT 4,
    "medium_response_hours" INTEGER NOT NULL DEFAULT 8,
    "low_response_hours" INTEGER NOT NULL DEFAULT 24,
    "service_tier_name" VARCHAR(100) NOT NULL,
    "dispatch_description" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "late_payment_penalty_policies" (
    "id" VARCHAR(100) NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 7,
    "interest_rate_annual" DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    "late_fee_flat" DECIMAL(12,2) NOT NULL DEFAULT 500.00,
    "warning_threshold1" INTEGER NOT NULL DEFAULT 3,
    "warning_threshold2" INTEGER NOT NULL DEFAULT 7,
    "freeze_account_days" INTEGER NOT NULL DEFAULT 15,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "late_payment_penalty_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notifications" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_deep_link" VARCHAR(255),

    CONSTRAINT "customer_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "contact_person" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(30) NOT NULL,
    "address_line1" VARCHAR(255) NOT NULL,
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "gstin" VARCHAR(30),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_access_rules" (
    "id" VARCHAR(100) NOT NULL,
    "rule_type" VARCHAR(50) NOT NULL,
    "customer_id" VARCHAR(100),
    "customer_lab_name" VARCHAR(255),
    "product_id" VARCHAR(100),
    "product_sku" VARCHAR(100),
    "product_name" VARCHAR(255),
    "category_id" VARCHAR(100),
    "company_id" VARCHAR(100),
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_start_date" TIMESTAMP(3),
    "effective_end_date" TIMESTAMP(3),
    "approval_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    "maker_id" VARCHAR(100) NOT NULL,
    "maker_email" VARCHAR(255) NOT NULL,
    "checker_id" VARCHAR(100),
    "checker_email" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_access_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_price_rules" (
    "id" VARCHAR(100) NOT NULL,
    "customer_id" VARCHAR(100) NOT NULL,
    "customer_lab_name" VARCHAR(255),
    "rule_tier" VARCHAR(50) NOT NULL,
    "product_id" VARCHAR(100),
    "product_sku" VARCHAR(100),
    "product_name" VARCHAR(255),
    "equipment_id" VARCHAR(100),
    "equipment_name" VARCHAR(255),
    "company_id" VARCHAR(100),
    "company_name" VARCHAR(150),
    "category_id" VARCHAR(100),
    "category_name" VARCHAR(150),
    "custom_fixed_price" DECIMAL(12,2),
    "discount_percent" DECIMAL(5,2),
    "quantity_slabs" JSONB,
    "payment_method" VARCHAR(50) DEFAULT 'ALL',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_start_date" TIMESTAMP(3),
    "effective_end_date" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "approval_status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    "maker_id" VARCHAR(100) NOT NULL,
    "maker_email" VARCHAR(255) NOT NULL,
    "checker_id" VARCHAR(100),
    "checker_email" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "pricing_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staging_product_batches" (
    "id" VARCHAR(100) NOT NULL,
    "batch_number" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL DEFAULT 0,
    "company_id" VARCHAR(100),
    "uploaded_by_user_id" VARCHAR(100) NOT NULL,
    "uploaded_by_user_name" VARCHAR(255) NOT NULL,
    "uploaded_by_user_email" VARCHAR(255) NOT NULL,
    "uploaded_by_user_role" VARCHAR(100) NOT NULL,
    "import_mode" VARCHAR(50) NOT NULL DEFAULT 'CREATE_ONLY',
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'READY_FOR_REVIEW',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "warning_rows" INTEGER NOT NULL DEFAULT 0,
    "new_products_count" INTEGER NOT NULL DEFAULT 0,
    "updated_products_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows_count" INTEGER NOT NULL DEFAULT 0,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_by_user_id" VARCHAR(100),
    "approved_by_user_name" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "rejected_by_user_id" VARCHAR(100),
    "rejected_by_user_name" VARCHAR(255),
    "rejected_at" TIMESTAMP(3),
    "rejection_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "issues_summary" JSONB,
    "attached_image_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staging_product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staging_product_rows" (
    "id" VARCHAR(100) NOT NULL,
    "batch_id" VARCHAR(100) NOT NULL,
    "row_number" INTEGER NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "company_id" VARCHAR(100),
    "company_name_or_code" VARCHAR(255),
    "category_id" VARCHAR(100),
    "category_name_or_code" VARCHAR(255),
    "subcategory_id" VARCHAR(100),
    "subcategory_name_or_code" VARCHAR(255),
    "product_type" VARCHAR(50) NOT NULL DEFAULT 'REAGENT',
    "description" TEXT,
    "classification" VARCHAR(100),
    "compatible_equipment" VARCHAR(255),
    "compatible_company" VARCHAR(255),
    "test_parameter" VARCHAR(150),
    "method" VARCHAR(150),
    "pack_size" VARCHAR(100),
    "unit" VARCHAR(50),
    "tests_per_pack" INTEGER,
    "storage_condition" VARCHAR(100),
    "is_cold_chain" BOOLEAN NOT NULL DEFAULT false,
    "shelf_life_months" INTEGER,
    "manufacturer_part_number" VARCHAR(100),
    "hsn_code" VARCHAR(50),
    "base_price" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "mrp" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    "min_order_quantity" INTEGER NOT NULL DEFAULT 1,
    "max_order_quantity" INTEGER,
    "allow_online_order" BOOLEAN NOT NULL DEFAULT true,
    "inquiry_only" BOOLEAN NOT NULL DEFAULT false,
    "track_inventory" BOOLEAN NOT NULL DEFAULT true,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "stock_status" VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK',
    "product_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "brand" VARCHAR(150),
    "image_file_name" VARCHAR(255),
    "image_url" TEXT,
    "resolved_image_url" TEXT,
    "action" "ImportRowAction" NOT NULL DEFAULT 'CREATE',
    "is_existing" BOOLEAN NOT NULL DEFAULT false,
    "existing_product_id" VARCHAR(100),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_issues" JSONB,
    "import_status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "target_product_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staging_product_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staging_customer_batches" (
    "id" VARCHAR(100) NOT NULL,
    "batch_number" VARCHAR(100) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size_bytes" INTEGER NOT NULL DEFAULT 0,
    "company_id" VARCHAR(100),
    "uploaded_by_user_id" VARCHAR(100) NOT NULL,
    "uploaded_by_user_name" VARCHAR(255) NOT NULL,
    "uploaded_by_user_email" VARCHAR(255) NOT NULL,
    "uploaded_by_user_role" VARCHAR(100) NOT NULL,
    "import_mode" VARCHAR(50) NOT NULL DEFAULT 'CREATE_ONLY',
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'READY_FOR_REVIEW',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "valid_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "warning_rows" INTEGER NOT NULL DEFAULT 0,
    "new_customers_count" INTEGER NOT NULL DEFAULT 0,
    "updated_customers_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows_count" INTEGER NOT NULL DEFAULT 0,
    "approved_by_user_id" VARCHAR(100),
    "approved_by_user_name" VARCHAR(255),
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "rejected_by_user_id" VARCHAR(100),
    "rejected_by_user_name" VARCHAR(255),
    "rejected_at" TIMESTAMP(3),
    "rejection_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "issues_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staging_customer_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staging_customer_rows" (
    "id" VARCHAR(100) NOT NULL,
    "batch_id" VARCHAR(100) NOT NULL,
    "row_number" INTEGER NOT NULL,
    "customer_code" VARCHAR(100) NOT NULL,
    "lab_name" VARCHAR(255) NOT NULL,
    "customer_type" VARCHAR(100) NOT NULL DEFAULT 'CLINICAL_LABORATORY',
    "contact_person" VARCHAR(255) NOT NULL,
    "designation" VARCHAR(100),
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "gstin" VARCHAR(50),
    "pan_number" VARCHAR(50),
    "drug_license_no" VARCHAR(100),
    "clinical_establishment_no" VARCHAR(100),
    "billing_address_line1" TEXT,
    "billing_address_line2" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "pincode" VARCHAR(20),
    "shipping_address_line1" TEXT,
    "shipping_city" VARCHAR(100),
    "shipping_state" VARCHAR(100),
    "shipping_pincode" VARCHAR(20),
    "territory" VARCHAR(100),
    "assigned_sales_rep" VARCHAR(150),
    "assigned_engineer" VARCHAR(150),
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 100000.00,
    "credit_days" INTEGER NOT NULL DEFAULT 30,
    "discount_tier" VARCHAR(50),
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "action" "ImportRowAction" NOT NULL DEFAULT 'CREATE',
    "is_existing" BOOLEAN NOT NULL DEFAULT false,
    "existing_user_id" VARCHAR(100),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validation_issues" JSONB,
    "import_status" "ImportRowStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "target_user_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staging_customer_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_role_type_idx" ON "users"("role_type");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_user_id_key" ON "customer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_customer_code_key" ON "customer_profiles"("customer_code");

-- CreateIndex
CREATE INDEX "customer_profiles_customer_code_idx" ON "customer_profiles"("customer_code");

-- CreateIndex
CREATE INDEX "customer_profiles_lab_name_idx" ON "customer_profiles"("lab_name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_user_id_key" ON "employee_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_employee_code_key" ON "employee_profiles"("employee_code");

-- CreateIndex
CREATE INDEX "employee_profiles_employee_code_idx" ON "employee_profiles"("employee_code");

-- CreateIndex
CREATE INDEX "employee_profiles_department_idx" ON "employee_profiles"("department");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "companies_code_idx" ON "companies"("code");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_code_idx" ON "categories"("code");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_company_id_idx" ON "products"("company_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_product_type_idx" ON "products"("product_type");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_documents_product_id_idx" ON "product_documents"("product_id");

-- CreateIndex
CREATE INDEX "product_pack_options_product_id_idx" ON "product_pack_options"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_equipments_serial_number_key" ON "customer_equipments"("serial_number");

-- CreateIndex
CREATE INDEX "customer_equipments_customer_id_idx" ON "customer_equipments"("customer_id");

-- CreateIndex
CREATE INDEX "customer_equipments_serial_number_idx" ON "customer_equipments"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "service_spare_parts_catalog_part_number_key" ON "service_spare_parts_catalog"("part_number");

-- CreateIndex
CREATE UNIQUE INDEX "service_tickets_ticket_number_key" ON "service_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "service_tickets_customer_id_idx" ON "service_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "service_tickets_assigned_engineer_id_idx" ON "service_tickets"("assigned_engineer_id");

-- CreateIndex
CREATE INDEX "service_tickets_equipment_id_idx" ON "service_tickets"("equipment_id");

-- CreateIndex
CREATE INDEX "service_tickets_status_idx" ON "service_tickets"("status");

-- CreateIndex
CREATE INDEX "service_tickets_ticket_number_idx" ON "service_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "service_ticket_check_ins_ticket_id_idx" ON "service_ticket_check_ins"("ticket_id");

-- CreateIndex
CREATE INDEX "service_ticket_check_outs_ticket_id_idx" ON "service_ticket_check_outs"("ticket_id");

-- CreateIndex
CREATE INDEX "service_ticket_parts_used_ticket_id_idx" ON "service_ticket_parts_used"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_ticket_resolutions_ticket_id_key" ON "service_ticket_resolutions"("ticket_id");

-- CreateIndex
CREATE INDEX "service_ticket_communications_ticket_id_idx" ON "service_ticket_communications"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_ticket_feedbacks_ticket_id_key" ON "service_ticket_feedbacks"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_ticket_back_office_reviews_ticket_id_key" ON "service_ticket_back_office_reviews"("ticket_id");

-- CreateIndex
CREATE INDEX "service_ticket_disputes_ticket_id_idx" ON "service_ticket_disputes"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_order_number_key" ON "customer_orders"("order_number");

-- CreateIndex
CREATE INDEX "customer_orders_customer_id_idx" ON "customer_orders"("customer_id");

-- CreateIndex
CREATE INDEX "customer_orders_order_number_idx" ON "customer_orders"("order_number");

-- CreateIndex
CREATE INDEX "customer_orders_status_idx" ON "customer_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_profiles_customer_id_key" ON "customer_credit_profiles"("customer_id");

-- CreateIndex
CREATE INDEX "customer_credit_profiles_customer_id_idx" ON "customer_credit_profiles"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_wallets_customer_id_key" ON "customer_wallets"("customer_id");

-- CreateIndex
CREATE INDEX "customer_wallets_customer_id_idx" ON "customer_wallets"("customer_id");

-- CreateIndex
CREATE INDEX "payment_extension_requests_customer_id_idx" ON "payment_extension_requests"("customer_id");

-- CreateIndex
CREATE INDEX "related_product_mappings_primary_product_id_idx" ON "related_product_mappings"("primary_product_id");

-- CreateIndex
CREATE INDEX "customer_notifications_customer_id_idx" ON "customer_notifications"("customer_id");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "product_access_rules_customer_id_idx" ON "product_access_rules"("customer_id");

-- CreateIndex
CREATE INDEX "product_access_rules_product_id_idx" ON "product_access_rules"("product_id");

-- CreateIndex
CREATE INDEX "product_access_rules_rule_type_idx" ON "product_access_rules"("rule_type");

-- CreateIndex
CREATE INDEX "customer_price_rules_customer_id_idx" ON "customer_price_rules"("customer_id");

-- CreateIndex
CREATE INDEX "customer_price_rules_product_id_idx" ON "customer_price_rules"("product_id");

-- CreateIndex
CREATE INDEX "customer_price_rules_rule_tier_idx" ON "customer_price_rules"("rule_tier");

-- CreateIndex
CREATE UNIQUE INDEX "staging_product_batches_batch_number_key" ON "staging_product_batches"("batch_number");

-- CreateIndex
CREATE INDEX "staging_product_batches_status_idx" ON "staging_product_batches"("status");

-- CreateIndex
CREATE INDEX "staging_product_batches_uploaded_by_user_id_idx" ON "staging_product_batches"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "staging_product_batches_company_id_idx" ON "staging_product_batches"("company_id");

-- CreateIndex
CREATE INDEX "staging_product_batches_created_at_idx" ON "staging_product_batches"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "staging_product_rows_batch_id_row_number_key" ON "staging_product_rows"("batch_id", "row_number");

-- CreateIndex
CREATE INDEX "staging_product_rows_batch_id_import_status_idx" ON "staging_product_rows"("batch_id", "import_status");

-- CreateIndex
CREATE INDEX "staging_product_rows_sku_idx" ON "staging_product_rows"("sku");

-- CreateIndex
CREATE INDEX "staging_product_rows_company_id_idx" ON "staging_product_rows"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "staging_customer_batches_batch_number_key" ON "staging_customer_batches"("batch_number");

-- CreateIndex
CREATE INDEX "staging_customer_batches_status_idx" ON "staging_customer_batches"("status");

-- CreateIndex
CREATE INDEX "staging_customer_batches_uploaded_by_user_id_idx" ON "staging_customer_batches"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "staging_customer_batches_company_id_idx" ON "staging_customer_batches"("company_id");

-- CreateIndex
CREATE INDEX "staging_customer_batches_created_at_idx" ON "staging_customer_batches"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "staging_customer_rows_batch_id_row_number_key" ON "staging_customer_rows"("batch_id", "row_number");

-- CreateIndex
CREATE INDEX "staging_customer_rows_batch_id_import_status_idx" ON "staging_customer_rows"("batch_id", "import_status");

-- CreateIndex
CREATE INDEX "staging_customer_rows_customer_code_idx" ON "staging_customer_rows"("customer_code");

-- CreateIndex
CREATE INDEX "staging_customer_rows_email_idx" ON "staging_customer_rows"("email");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_documents" ADD CONSTRAINT "product_documents_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_pack_options" ADD CONSTRAINT "product_pack_options_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_equipments" ADD CONSTRAINT "customer_equipments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_assigned_engineer_id_fkey" FOREIGN KEY ("assigned_engineer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_tickets" ADD CONSTRAINT "service_tickets_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "customer_equipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_check_ins" ADD CONSTRAINT "service_ticket_check_ins_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_check_outs" ADD CONSTRAINT "service_ticket_check_outs_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_parts_used" ADD CONSTRAINT "service_ticket_parts_used_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_parts_used" ADD CONSTRAINT "service_ticket_parts_used_part_catalog_id_fkey" FOREIGN KEY ("part_catalog_id") REFERENCES "service_spare_parts_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_resolutions" ADD CONSTRAINT "service_ticket_resolutions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_communications" ADD CONSTRAINT "service_ticket_communications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_feedbacks" ADD CONSTRAINT "service_ticket_feedbacks_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_back_office_reviews" ADD CONSTRAINT "service_ticket_back_office_reviews_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ticket_disputes" ADD CONSTRAINT "service_ticket_disputes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staging_product_rows" ADD CONSTRAINT "staging_product_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "staging_product_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staging_customer_rows" ADD CONSTRAINT "staging_customer_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "staging_customer_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

