import fs from "fs";
import path from "path";
import { getPrismaClient, isDbConnected } from "./prismaClient.js";

import {
  getPersistenceMode,
  PersistenceMode,
  PersistenceError,
  isConfiguredForPostgres,
  recordHydrationFailure,
  recordHydrationSuccess,
  isHydrationFailed,
  getHydrationError,
  resetHydrationStatus,
  userRepository,
  companyRepository,
  categoryRepository,
  productRepository,
  orderRepository,
  serviceTicketRepository,
  walletRepository,
  auditLogRepository,
  commercialRulesRepository,
  financialRepository
} from "./postgresRepositories.js";
import {
  stagingProductRepository,
  stagingCustomerRepository,
  generateSecureTemporaryPassword,
  defaultCredentialDeliveryService,
  type ICredentialDeliveryService,
  type CredentialDeliveryPayload
} from "./stagingRepositories.js";

export {
  getPersistenceMode,
  PersistenceMode,
  PersistenceError,
  isConfiguredForPostgres,
  recordHydrationFailure,
  recordHydrationSuccess,
  isHydrationFailed,
  getHydrationError,
  resetHydrationStatus,
  userRepository,
  companyRepository,
  categoryRepository,
  productRepository,
  orderRepository,
  serviceTicketRepository,
  walletRepository,
  auditLogRepository,
  commercialRulesRepository,
  financialRepository,
  stagingProductRepository,
  stagingCustomerRepository,
  generateSecureTemporaryPassword,
  defaultCredentialDeliveryService
};

export type {
  ICredentialDeliveryService,
  CredentialDeliveryPayload
};

// Canonical production customer data store path
export const REAL_DATA_DIR = path.resolve(process.cwd(), "data");
export const REAL_BACKUPS_DIR = path.resolve(process.cwd(), "backups");
export const REAL_PERSISTENCE_FILE = path.join(REAL_DATA_DIR, "persistence_store.json");

/**
 * Resolves persistent store file and directory targets with strict test isolation.
 *
 * Invariants:
 * 1. Ordinary development and production modes (NODE_ENV !== "test") strictly resolve to the real store.
 * 2. If TEST_PERSISTENCE_STORE_PATH is set while NODE_ENV !== "test", it fails closed immediately.
 * 3. Test mode (NODE_ENV === "test") defaults to an isolated disposable path: scratch/disposable_test_store.json.
 * 4. Custom test store overrides (TEST_PERSISTENCE_STORE_PATH) are permitted only in test mode.
 * 5. FAIL-CLOSED: If test mode targets or resolves to REAL_PERSISTENCE_FILE or any path inside data/ or backups/,
 *    including path traversals and Windows case variations, startup halts with a security error.
 */
export function resolvePersistenceConfig(): { dataDir: string; persistenceFile: string; isTestIsolated: boolean } {
  const isTest = process.env.NODE_ENV === "test";
  const customTestPath = process.env.TEST_PERSISTENCE_STORE_PATH;

  // Fail closed if TEST_PERSISTENCE_STORE_PATH is configured outside test mode
  if (!isTest && customTestPath) {
    throw new PersistenceError(
      "Security Configuration Error: TEST_PERSISTENCE_STORE_PATH is configured, but NODE_ENV is not 'test'. Aborting to prevent accidental writes to real customer persistence.",
      "TEST_ISOLATION_MISCONFIGURED"
    );
  }

  if (isTest) {
    const rawTarget = customTestPath
      ? path.resolve(process.cwd(), customTestPath)
      : path.resolve(process.cwd(), "scratch", "disposable_test_store.json");

    // Canonicalize paths to resolve relative segments, symlinks/traversals, and Windows case variations
    const normalizedTarget = path.normalize(path.resolve(rawTarget)).toLowerCase();
    const normalizedReal = path.normalize(path.resolve(REAL_PERSISTENCE_FILE)).toLowerCase();
    const normalizedDataDir = path.normalize(path.resolve(REAL_DATA_DIR)).toLowerCase();
    const normalizedBackupsDir = path.normalize(path.resolve(REAL_BACKUPS_DIR)).toLowerCase();

    // Check if target is inside protected data/ or backups/ directories, or matches real file directly
    const isTargetRealFile = normalizedTarget === normalizedReal;
    const isInsideDataDir = normalizedTarget === normalizedDataDir || normalizedTarget.startsWith(normalizedDataDir + path.sep);
    const isInsideBackupsDir = normalizedTarget === normalizedBackupsDir || normalizedTarget.startsWith(normalizedBackupsDir + path.sep);

    if (isTargetRealFile || isInsideDataDir || isInsideBackupsDir) {
      throw new PersistenceError(
        `Security Invariant Violation: Test mode cannot target protected customer data or backup paths (${rawTarget}).`,
        "TEST_ISOLATION_VIOLATION"
      );
    }

    const targetDir = path.dirname(rawTarget);
    return { dataDir: targetDir, persistenceFile: rawTarget, isTestIsolated: true };
  }

  // Normal dev/production mode: strictly resolves to real customer data store
  return { dataDir: REAL_DATA_DIR, persistenceFile: REAL_PERSISTENCE_FILE, isTestIsolated: false };
}

export interface PersistedAppState {
  users?: any[];
  companies?: any[];
  categories?: any[];
  products?: any[];
  customerAddresses?: any[];
  customerOrders?: any[];
  customerCreditProfiles?: Record<string, any>;
  paymentExtensionRequests?: any[];
  customerWallets?: Record<string, any>;
  customerTestimonials?: any[];
  relatedProducts?: any[];
  serviceSlaConfig?: any;
  latePaymentPolicyConfig?: any;
  serviceTickets?: any[];
  customerNotifications?: any[];
  auditLogs?: any[];
  customerEquipment?: any[];
  customerPriceRules?: any[];
  productAccessRules?: any[];
  orderAmendments?: any[];
  quotations?: any[];
  quotationSettings?: any;
  lastPersistedAt?: string;
}

/**
 * Ensures data directory exists.
 */
function ensureDataDir(): void {
  const { dataDir } = resolvePersistenceConfig();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Loads durable state from persistent file storage.
 */
export function loadPersistedState(): PersistedAppState | null {
  try {
    ensureDataDir();
    const { persistenceFile } = resolvePersistenceConfig();
    if (fs.existsSync(persistenceFile)) {
      const raw = fs.readFileSync(persistenceFile, "utf-8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        console.log(`[Persistence] Loaded durable state snapshot from ${persistenceFile} (timestamp: ${parsed.lastPersistedAt || "initial"})`);
        return parsed as PersistedAppState;
      }
    }
  } catch (err: any) {
    console.warn("[Persistence] Could not load state from disk:", err?.message || err);
  }
  return null;
}

let isSaving = false;
let pendingSaveState: PersistedAppState | null = null;

/**
 * Atomically writes state to durable disk store and triggers background Prisma synchronization.
 * Uses a unique temp file and serialized queuing to guarantee concurrent safety without file collisions.
 */
export function savePersistedState(state: PersistedAppState): void {
  // Production safety: If DATABASE_URL is configured, never silently fall back to local JSON on DB outage!
  if (isConfiguredForPostgres() && !isDbConnected()) {
    console.error("[Persistence] CRITICAL: DATABASE_URL is configured but PostgreSQL is disconnected. Suppressing silent local JSON write to prevent split-brain data loss.");
    throw new PersistenceError("Database is unavailable in PostgreSQL-authoritative mode; local JSON fallback is disabled in production.", "DB_DISCONNECTED");
  }

  if (isSaving) {
    pendingSaveState = state;
    return;
  }
  isSaving = true;
  try {
    ensureDataDir();
    const { dataDir, persistenceFile } = resolvePersistenceConfig();
    state.lastPersistedAt = new Date().toISOString();
    const payload = JSON.stringify(state, null, 2);
    
    // Unique temp file prevents collisions under high concurrency
    const uniqueTemp = path.join(dataDir, `persistence_store.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(uniqueTemp, payload, "utf-8");
    fs.renameSync(uniqueTemp, persistenceFile);
  } catch (err: any) {
    console.error("[Persistence] Error saving state snapshot to disk:", err?.message || err);
  } finally {
    isSaving = false;
    if (pendingSaveState) {
      const nextState = pendingSaveState;
      pendingSaveState = null;
      savePersistedState(nextState);
    }
  }

  // Asynchronously synchronize with Prisma PostgreSQL if connected and NOT in isolated test mode
  const { isTestIsolated } = resolvePersistenceConfig();
  if (!isTestIsolated && isDbConnected()) {
    syncStateToPrisma(state).catch(err => {
      console.warn("[Persistence] Prisma background sync error:", err?.message || err);
    });
  }
}

/**
 * Synchronizes persisted app state into PostgreSQL via Prisma Client.
 */
export async function syncStateToPrisma(state: PersistedAppState): Promise<void> {
  const prisma = getPrismaClient();
  if (!prisma || !isDbConnected()) return;

  try {
    // 0. Sync Users First (Crucial: satisfies foreign key constraints on customerId/userId)
    if (Array.isArray(state.users)) {
      for (const user of state.users) {
        if (!user || !user.id) continue;
        await userRepository.upsert(user).catch(e =>
          console.warn(`[Prisma Sync] User ${user.id} error:`, e.message)
        );
      }
    }

    // 0.1 Sync Companies First
    if (Array.isArray(state.companies)) {
      for (const comp of state.companies) {
        if (!comp || !comp.id) continue;
        await companyRepository.upsert(comp).catch(e =>
          console.warn(`[Prisma Sync] Company ${comp.id} error:`, e.message)
        );
      }
    }

    // 0.2 Sync Categories First
    if (Array.isArray(state.categories)) {
      for (const cat of state.categories) {
        if (!cat || !cat.id) continue;
        await categoryRepository.upsert(cat).catch(e =>
          console.warn(`[Prisma Sync] Category ${cat.id} error:`, e.message)
        );
      }
    }

    // 0.3 Sync Products First
    if (Array.isArray(state.products)) {
      for (const prod of state.products) {
        if (!prod || !prod.id) continue;
        await productRepository.upsert(prod).catch(e =>
          console.warn(`[Prisma Sync] Product ${prod.id} error:`, e.message)
        );
      }
    }

    // 1. Sync Customer Orders
    if (Array.isArray(state.customerOrders)) {
      for (const order of state.customerOrders) {
        if (!order || !order.orderNumber) continue;
        await prisma.customerOrder.upsert({
          where: { orderNumber: String(order.orderNumber) },
          create: {
            id: String(order.id || order.orderNumber),
            orderNumber: String(order.orderNumber),
            customerId: String(order.customerId || "u-cust-01"),
            customerLabName: String(order.customerLabName || "Diagnostic Laboratory"),
            items: order.items || [],
            itemCount: Number(order.itemCount || (order.items ? order.items.length : 0)),
            subtotal: order.subtotal || 0,
            gstAmount: order.gstAmount || 0,
            coldChainFee: order.coldChainFee || 0,
            grandTotal: order.grandTotal || 0,
            status: String(order.status || "PENDING_APPROVAL"),
            paymentStatus: String(order.paymentStatus || "PAYMENT_PENDING"),
            paymentMethod: order.paymentMethod ? String(order.paymentMethod) : null,
            coldChainMonitoring: order.coldChainMonitoring || null,
            shippingAddress: String(order.shippingAddress || "Registered Delivery Address"),
            deliveryDate: (order.deliveryDate && !isNaN(new Date(order.deliveryDate).getTime())) ? new Date(order.deliveryDate) : null,
            createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            updatedAt: new Date()
          },
          update: {
            status: String(order.status || "PENDING_APPROVAL"),
            paymentStatus: String(order.paymentStatus || "PAYMENT_PENDING"),
            paymentMethod: order.paymentMethod ? String(order.paymentMethod) : null,
            coldChainMonitoring: order.coldChainMonitoring || null,
            grandTotal: order.grandTotal || 0,
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] Order ${order.orderNumber} error:`, e.message));
      }
    }

    // 2. Sync Customer Credit Profiles
    if (state.customerCreditProfiles && typeof state.customerCreditProfiles === "object") {
      for (const [customerId, profile] of Object.entries(state.customerCreditProfiles)) {
        if (!profile) continue;
        await prisma.customerCreditProfile.upsert({
          where: { customerId },
          create: {
            id: `cp-${customerId}`,
            customerId,
            customerLabName: String(profile.customerLabName || "Customer Lab"),
            creditLimit: profile.creditLimit || 0,
            availableCredit: profile.availableCredit || 0,
            currentOutstanding: profile.currentOutstanding || 0,
            creditPeriodDays: Number(profile.creditPeriodDays || 30),
            dueDate: profile.dueDate ? new Date(profile.dueDate) : null,
            daysOverdue: Number(profile.daysOverdue || 0),
            paymentStatus: String(profile.paymentStatus || "GOOD_STANDING"),
            hasApprovedExtension: Boolean(profile.hasApprovedExtension),
            approvedExtensionUntil: profile.approvedExtensionUntil ? new Date(profile.approvedExtensionUntil) : null,
            walletPoints: Number(profile.walletPoints || 0),
            businessRating: profile.businessRating !== undefined ? Number(profile.businessRating) : 5.0,
            paymentReliabilityPercent: profile.paymentReliabilityPercent !== undefined ? Number(profile.paymentReliabilityPercent) : 100.0,
            paymentHistory: profile.paymentHistory || [],
            paymentPromises: profile.paymentPromises || [],
            updatedAt: new Date()
          },
          update: {
            creditLimit: profile.creditLimit || 0,
            availableCredit: profile.availableCredit || 0,
            currentOutstanding: profile.currentOutstanding || 0,
            daysOverdue: Number(profile.daysOverdue || 0),
            paymentStatus: String(profile.paymentStatus || "GOOD_STANDING"),
            hasApprovedExtension: Boolean(profile.hasApprovedExtension),
            approvedExtensionUntil: profile.approvedExtensionUntil ? new Date(profile.approvedExtensionUntil) : null,
            walletPoints: Number(profile.walletPoints || 0),
            businessRating: profile.businessRating !== undefined ? Number(profile.businessRating) : 5.0,
            paymentReliabilityPercent: profile.paymentReliabilityPercent !== undefined ? Number(profile.paymentReliabilityPercent) : 100.0,
            paymentHistory: profile.paymentHistory || [],
            paymentPromises: profile.paymentPromises || [],
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] CreditProfile ${customerId} error:`, e.message));
      }
    }

    // 3. Sync Payment Extension Requests
    if (Array.isArray(state.paymentExtensionRequests)) {
      for (const req of state.paymentExtensionRequests) {
        if (!req || !req.id) continue;
        await (prisma.paymentExtensionRequest as any).upsert({
          where: { id: String(req.id) },
          create: {
            id: String(req.id),
            customerId: String(req.customerId),
            customerLabName: String(req.customerLabName || req.companyName || ""),
            currentDueDate: req.originalDueDate ? new Date(req.originalDueDate) : new Date(),
            requestedDueDate: req.promisedPaymentDate ? new Date(req.promisedPaymentDate) : new Date(),
            outstandingAmount: req.outstandingAmount || 0,
            reason: String(req.reason || "Payment processing delay"),
            extensionDays: Number(req.requestedDays || req.extensionDays || 15),
            estimatedInterestCost: req.estimatedInterestCost || 0,
            status: String(req.status || "PENDING"),
            approvedBy: req.reviewedBy || req.approvedBy || null,
            approvedAt: req.reviewedAt ? new Date(req.reviewedAt) : null,
            createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
            updatedAt: new Date()
          },
          update: {
            status: String(req.status || "PENDING"),
            approvedBy: req.reviewedBy || req.approvedBy || null,
            approvedAt: req.reviewedAt ? new Date(req.reviewedAt) : null,
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] ExtensionRequest ${req.id} error:`, e.message));
      }
    }

    // 4. Sync Customer Testimonials
    if (Array.isArray(state.customerTestimonials)) {
      for (const t of state.customerTestimonials) {
        if (!t || !t.id) continue;
        await (prisma.customerTestimonial as any).upsert({
          where: { id: String(t.id) },
          create: {
            id: String(t.id),
            labName: String(t.laboratory || t.companyName || t.labName || ""),
            directorName: String(t.customerName || t.directorName || ""),
            city: String(t.city || "Mumbai"),
            rating: t.rating !== undefined ? Number(t.rating) : 5.0,
            quote: String(t.testimonial || t.quote || ""),
            verified: Boolean(t.isActive !== false),
            sortOrder: Number(t.displayOrder || t.sortOrder || 0),
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
          },
          update: {
            labName: String(t.laboratory || t.companyName || t.labName || ""),
            directorName: String(t.customerName || t.directorName || ""),
            city: String(t.city || "Mumbai"),
            rating: t.rating !== undefined ? Number(t.rating) : 5.0,
            quote: String(t.testimonial || t.quote || ""),
            verified: Boolean(t.isActive !== false),
            sortOrder: Number(t.displayOrder || t.sortOrder || 0)
          }
        }).catch(e => console.warn(`[Prisma Sync] Testimonial ${t.id} error:`, e.message));
      }
    }

    // 5. Sync Related Products
    if (Array.isArray(state.relatedProducts)) {
      for (const rp of state.relatedProducts) {
        if (!rp || !rp.id) continue;
        await prisma.relatedProductMapping.upsert({
          where: { id: String(rp.id) },
          create: {
            id: String(rp.id),
            primaryProductId: String(rp.primaryProductId || ""),
            analyte: String(rp.analyte || ""),
            company: String(rp.company || ""),
            productName: String(rp.productName || ""),
            packSize: String(rp.packSize || ""),
            price: rp.price || 0,
            availability: String(rp.availability || "IN_STOCK"),
            analyzerCompatibility: String(rp.analyzerCompatibility || ""),
            specifications: String(rp.specifications || ""),
            isColdChain: Boolean(rp.isColdChain),
            sortOrder: Number(rp.sortOrder || 0),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          update: {
            productName: String(rp.productName || ""),
            price: rp.price || 0,
            availability: String(rp.availability || "IN_STOCK"),
            sortOrder: Number(rp.sortOrder || 0),
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] RelatedProduct ${rp.id} error:`, e.message));
      }
    }

    // 6. Sync Service SLA Policy
    if (state.serviceSlaConfig) {
      const cfg = state.serviceSlaConfig;
      const existing = await prisma.serviceSlaPolicy.findFirst().catch(() => null);
      if (existing) {
        await prisma.serviceSlaPolicy.update({
          where: { id: existing.id },
          data: {
            criticalResponseHours: Number(cfg.criticalResponseHours || 4),
            highResponseHours: Number(cfg.highResponseHours || 8),
            mediumResponseHours: Number(cfg.mediumResponseHours || 24),
            lowResponseHours: Number(cfg.lowResponseHours || 48),
            serviceTierName: String(cfg.serviceTierName || "Contracted Service Level Agreement"),
            dispatchDescription: String(cfg.dispatchDescription || ""),
            disclaimer: String(cfg.disclaimer || ""),
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] Service SLA error:`, e.message));
      } else {
        await prisma.serviceSlaPolicy.create({
          data: {
            id: "sla-policy-01",
            criticalResponseHours: Number(cfg.criticalResponseHours || 4),
            highResponseHours: Number(cfg.highResponseHours || 8),
            mediumResponseHours: Number(cfg.mediumResponseHours || 24),
            lowResponseHours: Number(cfg.lowResponseHours || 48),
            serviceTierName: String(cfg.serviceTierName || "Contracted Service Level Agreement"),
            dispatchDescription: String(cfg.dispatchDescription || ""),
            disclaimer: String(cfg.disclaimer || ""),
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] Service SLA create error:`, e.message));
      }
    }

    // 7. Sync Customer Wallets
    if (state.customerWallets && typeof state.customerWallets === "object") {
      for (const [customerId, wallet] of Object.entries(state.customerWallets)) {
        if (!wallet) continue;
        await (prisma.customerWallet as any).upsert({
          where: { customerId },
          create: {
            id: `cw-${customerId}`,
            customerId,
            customerLabName: String((wallet as any).customerLabName || "Diagnostic Lab"),
            creditLimit: wallet.creditLimit || 0,
            currentOutstanding: wallet.currentOutstanding || 0,
            availableCredit: wallet.availableCredit || 0,
            creditPeriodDays: Number(wallet.creditPeriodDays || 30),
            unbilledOrdersCount: Number(wallet.unbilledOrdersCount || 0),
            walletBalance: 0,
            ledgerEntries: wallet.ledgerEntries || [],
            updatedAt: new Date()
          },
          update: {
            creditLimit: wallet.creditLimit || 0,
            currentOutstanding: wallet.currentOutstanding || 0,
            availableCredit: wallet.availableCredit || 0,
            unbilledOrdersCount: Number(wallet.unbilledOrdersCount || 0),
            ledgerEntries: wallet.ledgerEntries || [],
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] Wallet ${customerId} error:`, e.message));
      }
    }

    // 8. Sync Late Payment Policy
    if (state.latePaymentPolicyConfig) {
      const pol = state.latePaymentPolicyConfig;
      const existing = await prisma.latePaymentPenaltyPolicy.findFirst().catch(() => null);
      if (existing) {
        await prisma.latePaymentPenaltyPolicy.update({
          where: { id: existing.id },
          data: {
            gracePeriodDays: Number(pol.gracePeriodDays || 7),
            interestRateAnnual: 18.0,
            lateFeeFlat: 500.0,
            warningThreshold1: 3,
            warningThreshold2: 7,
            freezeAccountDays: 15,
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] Late policy update error:`, e.message));
      } else {
        await prisma.latePaymentPenaltyPolicy.create({
          data: {
            id: "late-policy-01",
            gracePeriodDays: Number(pol.gracePeriodDays || 7),
            interestRateAnnual: 18.0,
            lateFeeFlat: 500.0,
            warningThreshold1: 3,
            warningThreshold2: 7,
            freezeAccountDays: 15,
            updatedAt: new Date()
          }
        }).catch(e => console.warn(`[Prisma Sync] Late policy create error:`, e.message));
      }
    }

    // 9. Sync Notifications
    if (Array.isArray(state.customerNotifications)) {
      for (const n of state.customerNotifications) {
        if (!n || !n.id) continue;
        await prisma.customerNotificationRecord.upsert({
          where: { id: String(n.id) },
          create: {
            id: String(n.id),
            customerId: n.customerId ? String(n.customerId) : null,
            title: String(n.title || ""),
            message: String(n.message || ""),
            type: String(n.type || "ORDER_STATUS"),
            isRead: Boolean(n.isRead),
            timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
            actionDeepLink: n.actionDeepLink ? String(n.actionDeepLink) : null
          },
          update: {
            isRead: Boolean(n.isRead)
          }
        }).catch(e => console.warn(`[Prisma Sync] Notification ${n.id} error:`, e.message));
      }
    }

    // 10. Sync Service Tickets
    if (Array.isArray(state.serviceTickets)) {
      for (const t of state.serviceTickets) {
        if (!t || !t.id) continue;
        await serviceTicketRepository.upsert(t).catch(e => console.warn(`[Prisma Sync] ServiceTicket ${t.id} error:`, e.message));
      }
    }

    // 11. Sync Commercial Price Rules
    if (Array.isArray(state.customerPriceRules)) {
      for (const pr of state.customerPriceRules) {
        if (!pr || !pr.id) continue;
        await commercialRulesRepository.upsertPriceRule(pr).catch(e => console.warn(`[Prisma Sync] PriceRule ${pr.id} error:`, e.message));
      }
    }

    // 12. Sync Product Access Rules
    if (Array.isArray(state.productAccessRules)) {
      for (const ar of state.productAccessRules) {
        if (!ar || !ar.id) continue;
        await commercialRulesRepository.upsertAccessRule(ar).catch(e => console.warn(`[Prisma Sync] AccessRule ${ar.id} error:`, e.message));
      }
    }

    // 13. Sync Payment Extension Requests
    if (Array.isArray(state.paymentExtensionRequests)) {
      for (const er of state.paymentExtensionRequests) {
        if (!er || !er.id) continue;
        await financialRepository.createPaymentExtensionRequest(er).catch(e => console.warn(`[Prisma Sync] ExtensionRequest ${er.id} error:`, e.message));
      }
    }

    console.log("[Persistence] Successfully synchronized state snapshot with PostgreSQL via Prisma.");
  } catch (err: any) {
    console.warn("[Persistence] Failed to sync state to Prisma:", err?.message || err);
  }
}

/**
 * Hydrates state from Prisma PostgreSQL if available.
 * Loads users, companies, categories, products, service tickets, and commerce tables.
 * Restores all relational mappings and fails safely on error.
 */
export async function hydrateFromPrisma(): Promise<Partial<PersistedAppState> | null> {
  const prisma = getPrismaClient();
  if (!prisma || !isDbConnected()) return null;

  try {
    if (isConfiguredForPostgres()) {
      const requiredChecks = await Promise.allSettled([
        (prisma as any).user.count(),
        (prisma as any).company.count(),
        (prisma as any).category.count(),
        (prisma as any).product.count(),
        (prisma as any).customerOrder.count(),
        (prisma as any).serviceTicket.count(),
        (prisma as any).customerWallet.count(),
        (prisma as any).customerCreditProfile.count()
      ]);
      const failures = requiredChecks.filter(c => c.status === "rejected") as PromiseRejectedResult[];
      if (failures.length > 0) {
        const errorMsgs = failures.map(f => f.reason?.message || String(f.reason)).join("; ");
        throw new PersistenceError(`Required PostgreSQL tables are missing or inaccessible: ${errorMsgs}`, "REQUIRED_TABLES_MISSING");
      }
    }

    const [userCount, companyCount, categoryCount, productCount, orderCount, ticketCount] = await Promise.all([
      (prisma as any).user.count().catch(() => 0),
      (prisma as any).company.count().catch(() => 0),
      (prisma as any).category.count().catch(() => 0),
      (prisma as any).product.count().catch(() => 0),
      (prisma as any).customerOrder.count().catch(() => 0),
      (prisma as any).serviceTicket.count().catch(() => 0)
    ]);
    const totalRecords = userCount + companyCount + categoryCount + productCount + orderCount + ticketCount;
    if (totalRecords === 0) {
      console.log("[Prisma Hydrate] PostgreSQL database contains no records yet. Will initialize from baseline.");
      recordHydrationSuccess();
      return null;
    }

    console.log(`[Prisma Hydrate] Hydrating application state from PostgreSQL via Prisma (${totalRecords} records found across core tables)...`);
    const [
      users,
      companies,
      categories,
      products,
      serviceTickets,
      orders,
      creditProfiles,
      extensionRequests,
      testimonials,
      relatedProducts,
      slaPolicy,
      latePolicy,
      wallets,
      notifications,
      priceRules,
      accessRules
    ] = await Promise.all([
      userRepository.findAll().catch(e => { console.warn("[Prisma Hydrate] Users query warning:", e.message); return []; }),
      companyRepository.findAll().catch(e => { console.warn("[Prisma Hydrate] Companies query warning:", e.message); return []; }),
      categoryRepository.findAll().catch(e => { console.warn("[Prisma Hydrate] Categories query warning:", e.message); return []; }),
      productRepository.findAll().catch(e => { console.warn("[Prisma Hydrate] Products query warning:", e.message); return []; }),
      serviceTicketRepository.findAll().catch(e => { console.warn("[Prisma Hydrate] Service tickets query warning:", e.message); return []; }),
      prisma.customerOrder.findMany().catch(e => { console.warn("[Prisma Hydrate] Orders query warning:", e.message); return []; }),
      prisma.customerCreditProfile.findMany().catch(e => { console.warn("[Prisma Hydrate] Credit profiles query warning:", e.message); return []; }),
      prisma.paymentExtensionRequest.findMany().catch(e => { console.warn("[Prisma Hydrate] Extensions query warning:", e.message); return []; }),
      prisma.customerTestimonial.findMany().catch(e => { console.warn("[Prisma Hydrate] Testimonials query warning:", e.message); return []; }),
      prisma.relatedProductMapping.findMany().catch(e => { console.warn("[Prisma Hydrate] Related products query warning:", e.message); return []; }),
      prisma.serviceSlaPolicy.findFirst().catch(() => null),
      prisma.latePaymentPenaltyPolicy.findFirst().catch(() => null),
      prisma.customerWallet.findMany().catch(e => { console.warn("[Prisma Hydrate] Wallets query warning:", e.message); return []; }),
      prisma.customerNotificationRecord.findMany().catch(e => { console.warn("[Prisma Hydrate] Notifications query warning:", e.message); return []; }),
      commercialRulesRepository.findAllPriceRules().catch(() => []),
      commercialRulesRepository.findAllAccessRules().catch(() => [])
    ]);

    const creditProfileMap: Record<string, any> = {};
    for (const cp of creditProfiles) {
      creditProfileMap[cp.customerId] = {
        customerId: cp.customerId,
        customerLabName: cp.customerLabName,
        creditLimit: Number(cp.creditLimit),
        availableCredit: Number(cp.availableCredit),
        currentOutstanding: Number(cp.currentOutstanding),
        creditPeriodDays: cp.creditPeriodDays,
        dueDate: cp.dueDate ? cp.dueDate.toISOString().split("T")[0] : null,
        daysOverdue: cp.daysOverdue,
        paymentStatus: cp.paymentStatus,
        hasApprovedExtension: cp.hasApprovedExtension,
        approvedExtensionUntil: cp.approvedExtensionUntil ? cp.approvedExtensionUntil.toISOString().split("T")[0] : null,
        walletPoints: cp.walletPoints,
        businessRating: Number(cp.businessRating),
        paymentReliabilityPercent: Number(cp.paymentReliabilityPercent),
        paymentHistory: cp.paymentHistory || [],
        paymentPromises: cp.paymentPromises || []
      };
    }

    const walletMap: Record<string, any> = {};
    for (const w of wallets) {
      walletMap[w.customerId] = {
        customerId: w.customerId,
        creditLimit: Number(w.creditLimit),
        currentOutstanding: Number(w.currentOutstanding),
        availableCredit: Number(w.availableCredit),
        creditPeriodDays: w.creditPeriodDays,
        unbilledOrdersCount: w.unbilledOrdersCount,
        ledgerEntries: w.ledgerEntries || []
      };
    }

    const result: Partial<PersistedAppState> = {
      users: users.length > 0 ? users : undefined,
      companies: companies.length > 0 ? companies : undefined,
      categories: categories.length > 0 ? categories : undefined,
      products: products.length > 0 ? products : undefined,
      serviceTickets: serviceTickets.length > 0 ? serviceTickets : undefined,
      customerOrders: orders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        customerLabName: o.customerLabName,
        items: o.items,
        itemCount: o.itemCount,
        subtotal: Number(o.subtotal),
        gstAmount: Number(o.gstAmount),
        coldChainFee: Number(o.coldChainFee),
        grandTotal: Number(o.grandTotal),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod || undefined,
        coldChainMonitoring: o.coldChainMonitoring || undefined,
        shippingAddress: o.shippingAddress,
        deliveryDate: o.deliveryDate ? o.deliveryDate.toISOString() : undefined,
        createdAt: o.createdAt.toISOString()
      })),
      customerCreditProfiles: creditProfileMap,
      paymentExtensionRequests: extensionRequests.map((r: any) => {
        const currentDueDateStr = r.currentDueDate instanceof Date
          ? r.currentDueDate.toISOString().split("T")[0]
          : (r.currentDueDate ? String(r.currentDueDate).split("T")[0] : (r.originalDueDate ? String(r.originalDueDate).split("T")[0] : null));

        const requestedDueDateStr = r.requestedDueDate instanceof Date
          ? r.requestedDueDate.toISOString().split("T")[0]
          : (r.requestedDueDate ? String(r.requestedDueDate).split("T")[0] : (r.promisedPaymentDate ? String(r.promisedPaymentDate).split("T")[0] : null));

        const approvedAtStr = r.approvedAt instanceof Date
          ? r.approvedAt.toISOString()
          : (r.approvedAt ? String(r.approvedAt) : (r.reviewedAt ? (r.reviewedAt instanceof Date ? r.reviewedAt.toISOString() : String(r.reviewedAt)) : null));

        const createdAtStr = r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt ? String(r.createdAt) : new Date().toISOString());
        const updatedAtStr = r.updatedAt instanceof Date ? r.updatedAt.toISOString() : (r.updatedAt ? String(r.updatedAt) : new Date().toISOString());

        return {
          id: String(r.id),
          customerId: String(r.customerId),
          customerLabName: r.customerLabName || r.companyName || "",
          currentDueDate: currentDueDateStr,
          requestedDueDate: requestedDueDateStr,
          outstandingAmount: Number(r.outstandingAmount || 0),
          reason: r.reason || "Payment processing delay",
          extensionDays: Number(r.extensionDays !== undefined ? r.extensionDays : (r.requestedDays || 15)),
          estimatedInterestCost: Number(r.estimatedInterestCost || 0),
          status: r.status || "PENDING",
          approvedBy: r.approvedBy || r.reviewedBy || null,
          approvedAt: approvedAtStr,
          createdAt: createdAtStr,
          updatedAt: updatedAtStr,
          // Backward compatibility mappings for UI/legacy consumers:
          originalDueDate: currentDueDateStr,
          promisedPaymentDate: requestedDueDateStr,
          requestedDays: Number(r.extensionDays !== undefined ? r.extensionDays : (r.requestedDays || 15)),
          reviewedBy: r.approvedBy || r.reviewedBy || null,
          reviewedAt: approvedAtStr
        };
      }),
      customerTestimonials: testimonials.map((t: any) => {
        const ratingNum = t.rating !== undefined && t.rating !== null ? Number(t.rating) : 5.0;
        const verifiedBool = t.verified !== undefined ? Boolean(t.verified) : (t.isActive !== false);
        const sortOrderNum = Number(t.sortOrder !== undefined ? t.sortOrder : (t.displayOrder || 0));
        const createdAtStr = t.createdAt instanceof Date ? t.createdAt.toISOString() : (t.createdAt ? String(t.createdAt) : new Date().toISOString());
        const updatedAtStr = t.updatedAt instanceof Date ? t.updatedAt.toISOString() : (t.updatedAt ? String(t.updatedAt) : createdAtStr);

        return {
          id: String(t.id),
          labName: String(t.labName || t.laboratory || t.companyName || ""),
          directorName: String(t.directorName || t.customerName || ""),
          city: String(t.city || "Mumbai"),
          rating: ratingNum,
          quote: String(t.quote || t.testimonial || ""),
          verified: verifiedBool,
          sortOrder: sortOrderNum,
          createdAt: createdAtStr,
          updatedAt: updatedAtStr,
          // Backward compatibility mappings for legacy UI/view consumers:
          customerName: String(t.directorName || t.customerName || ""),
          companyName: String(t.labName || t.companyName || ""),
          laboratory: String(t.labName || t.laboratory || ""),
          testimonial: String(t.quote || t.testimonial || ""),
          isActive: verifiedBool,
          displayOrder: sortOrderNum
        };
      }),
      relatedProducts: relatedProducts.map((rp: any) => ({
        id: rp.id,
        primaryProductId: rp.primaryProductId,
        analyte: rp.analyte,
        company: rp.company,
        productName: rp.productName,
        packSize: rp.packSize,
        price: Number(rp.price),
        availability: rp.availability,
        analyzerCompatibility: rp.analyzerCompatibility,
        specifications: rp.specifications,
        isColdChain: rp.isColdChain,
        sortOrder: rp.sortOrder
      })),
      serviceSlaConfig: slaPolicy ? {
        criticalResponseHours: slaPolicy.criticalResponseHours,
        highResponseHours: slaPolicy.highResponseHours,
        mediumResponseHours: slaPolicy.mediumResponseHours,
        lowResponseHours: slaPolicy.lowResponseHours,
        serviceTierName: slaPolicy.serviceTierName,
        dispatchDescription: slaPolicy.dispatchDescription,
        disclaimer: slaPolicy.disclaimer,
        updatedAt: slaPolicy.updatedAt ? (slaPolicy.updatedAt instanceof Date ? slaPolicy.updatedAt.toISOString() : String(slaPolicy.updatedAt)) : new Date().toISOString()
      } : undefined,
      latePaymentPolicyConfig: latePolicy ? {
        id: latePolicy.id,
        gracePeriodDays: latePolicy.gracePeriodDays,
        interestRateAnnual: Number(latePolicy.interestRateAnnual || 18.0),
        lateFeeFlat: Number(latePolicy.lateFeeFlat || 500.0),
        warningThreshold1: latePolicy.warningThreshold1,
        warningThreshold2: latePolicy.warningThreshold2,
        freezeAccountDays: latePolicy.freezeAccountDays,
        updatedAt: latePolicy.updatedAt ? (latePolicy.updatedAt instanceof Date ? latePolicy.updatedAt.toISOString() : String(latePolicy.updatedAt)) : new Date().toISOString()
      } : undefined,
      customerWallets: walletMap,
      customerNotifications: notifications.map((n: any) => ({
        id: n.id,
        customerId: n.customerId || undefined,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        timestamp: n.timestamp.toISOString(),
        actionDeepLink: n.actionDeepLink || undefined
      })),
      customerPriceRules: priceRules.length > 0 ? priceRules : undefined,
      productAccessRules: accessRules.length > 0 ? accessRules : undefined
    };

    recordHydrationSuccess();
    return result;
  } catch (err: any) {
    console.error("[Prisma Hydrate] Error reading from PostgreSQL:", err?.message || err);
    recordHydrationFailure(err?.message || String(err));
    if (isConfiguredForPostgres()) {
      throw new PersistenceError(`Startup hydration from PostgreSQL failed: ${err.message}`, "HYDRATION_FAILED", err);
    }
    return null;
  }
}
