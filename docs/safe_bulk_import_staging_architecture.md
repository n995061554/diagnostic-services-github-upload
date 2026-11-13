# Safe Bulk Import Staging Architecture Design Specification

**Phase:** Phase 4E  
**Target Services:** A2Z Diagnostics Enterprise Platform  
**Target Routes (7 Guarded Operations):**
1. `POST /api/v1/products/import/execute`
2. `POST /api/v1/products/import/approve`
3. `POST /api/v1/customers/import/execute`
4. `POST /api/v1/special-pricing/import/execute`
5. `POST /api/v1/equipment/import/execute`
6. `POST /api/v1/ledgers/import/execute`
7. `POST /api/v1/sales-targets/import/execute`

---

## 1. Architectural Principles & Invariants

1. **Two-Stage Ingestion Lifecycle:**
   Every bulk import follows an asynchronous or synchronous two-stage pattern:
   - **Stage 1 (Validate & Stage):** Raw workbook or JSON rows are validated against business rules, active database references, and data integrity constraints. A staging batch and staging row records are created with status `READY_FOR_REVIEW` or `VALIDATION_FAILED`. No canonical operational records are touched.
   - **Stage 2 (Approve & Commit):** Authorized personnel review the staged batch, inspect row-level diffs and warnings, and submit approval. The commit runs within isolated Prisma transactions.
2. **Dual-Control Maker-Checker Governance:**
   For high-risk operational and financial domains (Opening Ledgers and Special Pricing contracts), the creator/uploader (`makerId`) cannot approve or execute the import (`makerId !== checkerId`). An independent authorized checker must authorize the batch.
3. **Replay & Concurrency Protection:**
   Staging batches transition through an explicit state machine. Batches in `COMPLETED`, `APPROVED`, `IMPORTING`, or `CANCELLED` states reject subsequent execution requests with HTTP 409 (`BATCH_ALREADY_PROCESSED`).
4. **Idempotency & Duplicate Prevention:**
   All import types enforce domain-level unique constraints (SKU for products, Customer Code / GSTIN for customers, Serial Number for equipment, Document Number for ledgers, and (customerId, productId) for pricing contracts).
5. **Safe Batch Bounds & Transactional Chunking:**
   - Maximum batch ceiling: 1,000 rows (`maxBatchSize`).
   - Transactional chunking: Commits are processed in chunks of 100 to 250 rows to avoid transaction timeouts, buffer bloat, and connection pool starvation.
   - Partial failure isolation: Batches can be configured for `ALL_OR_NOTHING` (atomic rollback of entire batch on any row error) or `PARTIAL_COMMIT` (valid rows committed, invalid rows flagged as `FAILED`).
6. **Guard Continuity:**
   All 7 existing PostgreSQL mutation guards (`checkPostgresMutationGuard(res, ...)`) remain active in PostgreSQL mode until database staging tables and Prisma migrations are formally deployed.

---

## 2. Proposed Staging Prisma Schema Models

```prisma
// ============================================================================
// STAGING BATCHES & ROW-LEVEL INGESTION MODELS (PHASE 4E DESIGN)
// ============================================================================

enum ImportBatchStatus {
  UPLOADED
  VALIDATING
  VALIDATION_FAILED
  READY_FOR_REVIEW
  PENDING_APPROVAL
  APPROVED
  REJECTED
  IMPORTING
  COMPLETED
  PARTIALLY_FAILED
  FAILED
  CANCELLED
}

enum ImportRowAction {
  CREATE
  UPDATE
  SKIP
  ERROR
}

enum ImportRowStatus {
  PENDING
  IMPORTED
  FAILED
  SKIPPED
}

// ----------------------------------------------------------------------------
// 1. Product Master Staging Models
// ----------------------------------------------------------------------------
model StagingProductBatch {
  id                  String             @id @db.VarChar(100)
  batchNumber         String             @unique @db.VarChar(100)
  fileName            String             @db.VarChar(255)
  fileSizeBytes       Int                @default(0)
  uploadedByUserId    String             @db.VarChar(100)
  uploadedByUserName  String             @db.VarChar(255)
  uploadedByUserEmail String             @db.VarChar(255)
  uploadedByUserRole  String             @db.VarChar(100)
  importMode          String             @default("CREATE_ONLY") @db.VarChar(50)
  status              ImportBatchStatus  @default(READY_FOR_REVIEW)
  totalRows           Int                @default(0)
  validRows           Int                @default(0)
  errorRows           Int                @default(0)
  warningRows         Int                @default(0)
  newProductsCount    Int                @default(0)
  updatedProductsCount Int               @default(0)
  skippedRowsCount    Int                @default(0)
  requiresApproval    Boolean            @default(false)
  approvedByUserId    String?            @db.VarChar(100)
  approvedByUserName  String?            @db.VarChar(255)
  approvedAt          DateTime?
  approvalNotes       String?            @db.Text
  rejectedByUserId    String?            @db.VarChar(100)
  rejectedAt          DateTime?
  rejectionNotes      String?            @db.Text
  completedAt         DateTime?
  errorMessage        String?            @db.Text
  issuesSummary       Json?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  rows                StagingProductRow[]

  @@index([status])
  @@index([uploadedByUserId])
  @@map("staging_product_batches")
}

model StagingProductRow {
  id                  String          @id @db.VarChar(100)
  batchId             String          @db.VarChar(100)
  rowNumber           Int
  sku                 String          @db.VarChar(100)
  name                String          @db.VarChar(255)
  companyId           String?         @db.VarChar(100)
  categoryId          String?         @db.VarChar(100)
  productType         String          @default("REAGENT") @db.VarChar(50)
  hsnCode             String?         @db.VarChar(50)
  basePrice           Decimal         @default(0.00) @db.Decimal(12, 2)
  mrp                 Decimal         @default(0.00) @db.Decimal(12, 2)
  gstRate             Decimal         @default(12.00) @db.Decimal(5, 2)
  minOrderQuantity    Int             @default(1)
  isColdChain         Boolean         @default(false)
  storageCondition    String?         @db.VarChar(100)
  shelfLifeMonths     Int?
  packSize            String?         @db.VarChar(100)
  stockQuantity       Int             @default(0)
  stockStatus         String          @default("IN_STOCK") @db.VarChar(50)
  productStatus       String          @default("ACTIVE") @db.VarChar(50)
  brand               String?         @db.VarChar(150)
  resolvedImageUrl    String?         @db.Text
  action              ImportRowAction @default(CREATE)
  isExisting          Boolean         @default(false)
  existingProductId   String?         @db.VarChar(100)
  isValid             Boolean         @default(true)
  validationIssues    Json?
  importStatus        ImportRowStatus @default(PENDING)
  errorMessage        String?         @db.Text
  targetProductId     String?         @db.VarChar(100)
  createdAt           DateTime        @default(now())

  batch               StagingProductBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@index([batchId, rowNumber])
  @@index([sku])
  @@map("staging_product_rows")
}

// ----------------------------------------------------------------------------
// 2. Customer Master Staging Models
// ----------------------------------------------------------------------------
model StagingCustomerBatch {
  id                  String             @id @db.VarChar(100)
  batchNumber         String             @unique @db.VarChar(100)
  fileName            String             @db.VarChar(255)
  fileSizeBytes       Int                @default(0)
  uploadedByUserId    String             @db.VarChar(100)
  uploadedByUserName  String             @db.VarChar(255)
  uploadedByUserEmail String             @db.VarChar(255)
  importMode          String             @default("CREATE_ONLY") @db.VarChar(50)
  status              ImportBatchStatus  @default(READY_FOR_REVIEW)
  totalRows           Int                @default(0)
  validRows           Int                @default(0)
  errorRows           Int                @default(0)
  newCustomersCount   Int                @default(0)
  updatedCustomersCount Int              @default(0)
  approvedByUserId    String?            @db.VarChar(100)
  approvedAt          DateTime?
  completedAt         DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  rows                StagingCustomerRow[]

  @@index([status])
  @@map("staging_customer_batches")
}

model StagingCustomerRow {
  id                  String          @id @db.VarChar(100)
  batchId             String          @db.VarChar(100)
  rowNumber           Int
  customerCode        String          @db.VarChar(100)
  labName             String          @db.VarChar(255)
  customerType        String          @default("CLINICAL_LABORATORY") @db.VarChar(100)
  contactPerson       String          @db.VarChar(255)
  designation         String?         @db.VarChar(100)
  phone               String          @db.VarChar(50)
  email               String          @db.VarChar(255)
  gstin               String?         @db.VarChar(50)
  panNumber           String?         @db.VarChar(50)
  drugLicenseNo       String?         @db.VarChar(100)
  creditLimit         Decimal         @default(100000.00) @db.Decimal(12, 2)
  creditDays          Int             @default(30)
  billingAddress      String?         @db.Text
  city                String?         @db.VarChar(100)
  state               String?         @db.VarChar(100)
  pincode             String?         @db.VarChar(20)
  action              ImportRowAction @default(CREATE)
  isExisting          Boolean         @default(false)
  existingUserId      String?         @db.VarChar(100)
  isValid             Boolean         @default(true)
  validationIssues    Json?
  importStatus        ImportRowStatus @default(PENDING)
  errorMessage        String?         @db.Text
  targetUserId        String?         @db.VarChar(100)
  createdAt           DateTime        @default(now())

  batch               StagingCustomerBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@index([batchId, rowNumber])
  @@index([customerCode])
  @@map("staging_customer_rows")
}

// ----------------------------------------------------------------------------
// 3. Opening Ledger Staging Models (High Financial Governance)
// ----------------------------------------------------------------------------
model StagingLedgerBatch {
  id                  String             @id @db.VarChar(100)
  batchNumber         String             @unique @db.VarChar(100)
  fileName            String             @db.VarChar(255)
  uploadedByUserId    String             @db.VarChar(100)
  uploadedByUserName  String             @db.VarChar(255)
  importMode          String             @default("CREATE_ONLY") @db.VarChar(50)
  status              ImportBatchStatus  @default(READY_FOR_REVIEW)
  totalRows           Int                @default(0)
  validRows           Int                @default(0)
  errorRows           Int                @default(0)
  totalOpeningDebit   Decimal            @default(0.00) @db.Decimal(14, 2)
  totalOpeningCredit  Decimal            @default(0.00) @db.Decimal(14, 2)
  makerId             String             @db.VarChar(100)
  checkerId           String?            @db.VarChar(100)
  approvedAt          DateTime?
  approvalNotes       String?            @db.Text
  completedAt         DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  rows                StagingLedgerRow[]

  @@index([status])
  @@map("staging_ledger_batches")
}

model StagingLedgerRow {
  id                  String          @id @db.VarChar(100)
  batchId             String          @db.VarChar(100)
  rowNumber           Int
  customerId          String          @db.VarChar(100)
  customerCode        String          @db.VarChar(100)
  customerLabName     String          @db.VarChar(255)
  balanceType         String          @db.VarChar(20) // DEBIT | CREDIT
  documentNumber      String          @db.VarChar(100)
  invoiceDate         DateTime
  dueDate             DateTime
  originalAmount      Decimal         @db.Decimal(12, 2)
  paidAmount          Decimal         @default(0.00) @db.Decimal(12, 2)
  balanceAmount       Decimal         @db.Decimal(12, 2)
  agingBracket        String          @default("CURRENT") @db.VarChar(50)
  paymentTerms        String?         @db.VarChar(100)
  remarks             String?         @db.Text
  action              ImportRowAction @default(CREATE)
  isValid             Boolean         @default(true)
  validationIssues    Json?
  importStatus        ImportRowStatus @default(PENDING)
  createdAt           DateTime        @default(now())

  batch               StagingLedgerBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@index([batchId, rowNumber])
  @@index([documentNumber])
  @@map("staging_ledger_rows")
}
```

---

## 3. Workflow & Two-Phase Ingestion Architecture

```
                                  STAGE 1: VALIDATE & PREVIEW
                                  ===========================
   [ Client Upload ]
          │ (Multipart/JSON rows)
          ▼
   [ POST /api/v1/.../import/validate ]
          │
          ├── 1. Schema & Field Validation (Syntax, Enums, Number ranges)
          ├── 2. Reference Resolution (Foreign keys: Companies, Categories, Users)
          ├── 3. Duplicate Detection (Batch-internal & Database existing keys)
          ├── 4. Row Issue Compilation (Severity: ERROR blocks; WARNING permits)
          │
          ▼
   [ Create Staging Batch & Rows ]
          │ Status: READY_FOR_REVIEW (or VALIDATION_FAILED if errors > 0)
          ▼
   [ Response 200 OK ] ──► Returns Batch ID, Issue breakdown, and Paginated Preview


                                  STAGE 2: APPROVE & COMMIT
                                  =========================
   [ Authorized Client Review ]
          │ (POST /api/v1/.../import/execute or approve with batchId)
          ▼
   [ Verify Pre-Execution Invariants ]
          ├── 1. Role Authorization (requireRole SUPER_ADMIN / OFFICE_ADMIN)
          ├── 2. Dual-Control Separation (makerId !== checkerId for Pricing & Ledgers)
          ├── 3. Status Guard: Must be READY_FOR_REVIEW or PENDING_APPROVAL
          │     (Rejects already COMPLETED, APPROVED, or CANCELLED)
          ├── 4. Concurrency Lock: Set status = 'IMPORTING'
          │
          ▼
   [ Transactional Chunk Processor ]
          │ (Chunks of 100-250 records inside Prisma $transaction)
          ├── Commit target records (Product, User, Wallet, PriceRule, Equipment)
          ├── Register AuditLog with actor, before/after counts, and batch reference
          ├── Mark Staging Rows: importStatus = 'IMPORTED'
          │
          ▼ [On Any Unexpected Chunk Failure]
          ├── Rollback active transaction chunk
          ├── Update Staging Batch status = 'PARTIALLY_FAILED' or 'FAILED'
          ├── Retain staging rows with specific failure reason
          │
          ▼ [On Success]
   [ Mark Staging Batch status = 'COMPLETED', completedAt = now() ]
          │
          ▼
   [ Response 200 OK ] ──► Returns summary: createdCount, updatedCount, durationMs
```

---

## 4. Maker-Checker Matrix for Import Operations

| Import Domain | Primary Route | Governance Rule | Required Separation |
|---|---|---|---|
| **Products** | `POST /api/v1/products/import/execute` | Catalog Governance | If `requireApprovalForProductImport` is true, non-admin uploaders transition to `PENDING_APPROVAL`. Approval requires `SUPER_ADMIN` or `OFFICE_ADMIN`. |
| **Products Approval** | `POST /api/v1/products/import/approve` | Dual-Control | Approver cannot be the batch uploader (`uploadedByUserId !== approverId`). |
| **Customers** | `POST /api/v1/customers/import/execute` | KYC & Credit Limit | Restrict to `SUPER_ADMIN`, `OFFICE_ADMIN`. Credit limits > ₹5,00,000 mandate dual-control verification. |
| **Special Pricing** | `POST /api/v1/special-pricing/import/execute` | Commercial Margin Protection | Strict dual-control: `makerId !== checkerId`. Sales staff proposing contract pricing cannot approve their own batch. |
| **Equipment** | `POST /api/v1/equipment/import/execute` | Asset Tracking | Serial numbers uniquely verified; rejects duplicate active serials across customers. |
| **Opening Ledgers** | `POST /api/v1/ledgers/import/execute` | Financial & Balance Integrity | Strict dual-control: `makerId !== checkerId`. Financial adjustments affect AR, credit profile standing, and wallet balances. |
| **Sales Targets** | `POST /api/v1/sales-targets/import/execute` | Quota Governance | Restricted to `SUPER_ADMIN` and `SALES_MANAGER`. Cannot assign quotas to oneself without senior management checker. |

---

## 5. Large Import Processing & Limits

1. **Size Ceilings:**
   - Maximum batch rows: 1,000 records.
   - Maximum file size: 15 MB.
2. **Chunking Strategy:**
   - Execution executes in isolated chunks:
     ```ts
     const CHUNK_SIZE = 200;
     for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
       const chunk = validRows.slice(i, i + CHUNK_SIZE);
       await prisma.$transaction(async (tx) => {
         for (const row of chunk) {
           await processRow(tx, row);
         }
       });
     }
     ```
3. **Timeout & Lock Management:**
   - Set Prisma transaction timeout to 30,000ms per chunk.
   - Release connection locks between chunks to allow concurrent customer API requests.

---

## 6. Business Decisions & Ambiguities Identified

1. **Partial Import vs. Atomic Rollback Policy:**
   - *Question:* In a 500-row batch where 490 rows succeed and 10 rows fail database insertion (e.g. database constraint or concurrent modification), should the system:
     - (A) Roll back the entire 500-row batch (Strict Atomic), or
     - (B) Commit the 490 valid rows and flag the 10 rows in staging with `FAILED` status for corrective re-submission (Quarantine Partial)?
   - *Recommendation:* Special Pricing and Ledgers must follow (A) Strict Atomic to avoid broken financial reconciliation. Products and Customers may allow (B) Quarantine Partial with explicit opt-in flag `allowPartialCommit: true`.
2. **Customer Password Initialization:**
   - *Question:* During customer master import, new users currently receive a default hash (`DEFAULT_PASSWORD_HASH`).
   - *Recommendation:* Imported customer accounts should be created with status `PENDING_ACTIVATION` and an invite activation token generated, rather than active accounts with static passwords.
3. **Opening Ledger Reversals:**
   - *Question:* Does an imported opening ledger overwrite existing unbilled orders or append as separate balance-forward entries?
   - *Current Implementation:* It unshifts new ledger entries and updates balances.
   - *Recommendation:* Preserve current additive ledger behavior with explicit reversal entries rather than overwriting.
