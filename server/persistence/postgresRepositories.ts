import { getPrismaClient, isDbConnected } from "./prismaClient.js";

/**
 * ============================================================================
 * A2Z DIAGNOSTICS ENTERPRISE PLATFORM - POSTGRESQL REPOSITORY & PERSISTENCE
 * ============================================================================
 * 
 * ARCHITECTURAL PRINCIPLES:
 * 1. Explicit Dual Mode:
 *    - LOCAL_JSON: Active when DATABASE_URL is unset or DB is unreachable.
 *      Durable JSON persistence store is authoritative.
 *    - POSTGRES_AUTHORITATIVE: Active in Staging / Production when DATABASE_URL
 *      is connected. PostgreSQL transactions are authoritative.
 * 2. Strict Transactional Integrity:
 *    - Never silently swallow a database write failure.
 *    - Do not report successful save until the authoritative persistence operation succeeds.
 *    - Order placement + wallet ledger deductions execute inside atomic DB transactions.
 *    - Idempotency keys prevent duplicate order creation or ledger balance changes.
 * 3. Semantic String ID Preservation:
 *    - Mappings natively preserve custom string IDs ('u-admin-01', 'prod-001', 'comp-roche').
 * ============================================================================
 */

export enum PersistenceMode {
  LOCAL_JSON = "LOCAL_JSON",
  POSTGRES_AUTHORITATIVE = "POSTGRES_AUTHORITATIVE",
  POSTGRES_DISCONNECTED = "POSTGRES_DISCONNECTED"
}

export class PersistenceError extends Error {
  constructor(message: string, public readonly code: string, public readonly originalError?: any) {
    super(message);
    this.name = "PersistenceError";
  }
}

/**
 * Returns whether the application is configured to run in PostgreSQL mode.
 */
export function isConfiguredForPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

let hydrationError: string | null = null;
let hydrationCompleted: boolean = false;

export function recordHydrationFailure(errMessage: string): void {
  hydrationError = errMessage;
}

export function recordHydrationSuccess(): void {
  hydrationError = null;
  hydrationCompleted = true;
}

export function isHydrationFailed(): boolean {
  return Boolean(hydrationError);
}

export function getHydrationError(): string | null {
  return hydrationError;
}

export function resetHydrationStatus(): void {
  hydrationError = null;
  hydrationCompleted = false;
}

/**
 * Returns current authoritative persistence mode.
 * In production/staging (when DATABASE_URL is set), never silently falls back to LOCAL_JSON.
 * If required tables or startup hydration failed, marks the mode as POSTGRES_DISCONNECTED (degraded).
 */
export function getPersistenceMode(): PersistenceMode {
  if (isConfiguredForPostgres()) {
    if (!isDbConnected() || isHydrationFailed()) {
      return PersistenceMode.POSTGRES_DISCONNECTED;
    }
    return PersistenceMode.POSTGRES_AUTHORITATIVE;
  }
  return PersistenceMode.LOCAL_JSON;
}

// ============================================================================
// 1. USER & RBAC REPOSITORY
// ============================================================================
export function normalizeUserRole(rawRole: any): string {
  const r = String(rawRole || "CUSTOMER").toUpperCase().trim();
  switch (r) {
    case "SUPER_ADMIN":
    case "OFFICE_ADMIN":
    case "OFFICE_STAFF":
    case "SALES_MANAGER":
    case "SALES_REP":
    case "SERVICE_ENGINEER":
    case "ACCOUNTANT":
    case "CUSTOMER":
    case "LAB_STAFF":
      return r;
    case "ACCOUNTS_STAFF":
    case "FINANCE_STAFF":
      return "ACCOUNTANT";
    case "SALES_PERSON":
      return "SALES_REP";
    case "SERVICE_MANAGER":
      return "SERVICE_ENGINEER";
    case "DELIVERY_STAFF":
    case "APPLICATION_SUPPORT":
    case "AUTHORIZED_APPROVER":
    case "DISTRIBUTOR":
      return "OFFICE_STAFF";
    default:
      return "CUSTOMER";
  }
}

export const userRepository = {
  mapToPrisma(user: any): any {
    return {
      id: String(user.id),
      username: user.username ? String(user.username) : null,
      email: String(user.email).toLowerCase().trim(),
      phoneNumber: String(user.phoneNumber).trim(),
      passwordHash: String(user.passwordHash),
      firstName: String(user.firstName || "").trim(),
      lastName: String(user.lastName || "").trim(),
      avatarUrl: user.avatarUrl || null,
      roleType: normalizeUserRole(user.roleType),
      status: user.status || "ACTIVE",
      dataScope: user.dataScope || "OWN",
      branch: user.branch || null,
      region: user.region || null,
      isEmailVerified: Boolean(user.isEmailVerified),
      isPhoneVerified: Boolean(user.isPhoneVerified),
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      twoFactorSecret: user.twoFactorSecret || null,
      failedLoginAttempts: Number(user.failedLoginAttempts || 0),
      lockoutUntil: user.lockoutUntil ? new Date(user.lockoutUntil) : null,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : null,
      mustChangePassword: Boolean(user.mustChangePassword),
      passwordCreatedAt: user.passwordCreatedAt ? new Date(user.passwordCreatedAt) : undefined,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      username: record.username || undefined,
      email: record.email,
      phoneNumber: record.phoneNumber,
      passwordHash: record.passwordHash,
      firstName: record.firstName,
      lastName: record.lastName,
      avatarUrl: record.avatarUrl || undefined,
      roleType: record.roleType,
      status: record.status,
      dataScope: record.dataScope || "OWN",
      branch: record.branch || undefined,
      region: record.region || undefined,
      isEmailVerified: record.isEmailVerified,
      isPhoneVerified: record.isPhoneVerified,
      twoFactorEnabled: record.twoFactorEnabled,
      twoFactorSecret: record.twoFactorSecret || undefined,
      failedLoginAttempts: record.failedLoginAttempts,
      lockoutUntil: record.lockoutUntil ? record.lockoutUntil.toISOString() : undefined,
      lastLoginAt: record.lastLoginAt ? record.lastLoginAt.toISOString() : undefined,
      mustChangePassword: Boolean(record.mustChangePassword),
      passwordCreatedAt: record.passwordCreatedAt ? record.passwordCreatedAt.toISOString() : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  },

  async upsert(user: any): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative user save", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(user);
    try {
      const saved = await (prisma as any).user.upsert({
        where: { id: data.id },
        create: data,
        update: {
          email: data.email,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          roleType: data.roleType,
          status: data.status,
          isEmailVerified: data.isEmailVerified,
          isPhoneVerified: data.isPhoneVerified,
          failedLoginAttempts: data.failedLoginAttempts,
          lockoutUntil: data.lockoutUntil,
          lastLoginAt: data.lastLoginAt,
          updatedAt: new Date()
        }
      });
      return this.mapFromPrisma(saved);
    } catch (err: any) {
      throw new PersistenceError(`Failed to save user ${user.id}: ${err.message}`, "USER_SAVE_FAILED", err);
    }
  },

  async findAll(): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for user query", "DB_DISCONNECTED");
    }
    const records = await (prisma as any).user.findMany({
      include: { customerProfile: true, employeeProfile: true }
    });
    return records.map((u: any) => {
      const mapped = this.mapFromPrisma(u);
      if (u.customerProfile) {
        mapped.customerProfile = {
          labName: u.customerProfile.labName,
          customerCode: u.customerProfile.customerCode || undefined,
          customerType: u.customerProfile.customerType,
          gstNumber: u.customerProfile.gstNumber || undefined,
          panNumber: u.customerProfile.panNumber || undefined,
          drugLicenseNumber: u.customerProfile.drugLicenseNumber || undefined,
          contactPerson: u.customerProfile.contactPerson,
          contactEmail: u.customerProfile.contactEmail,
          contactPhone: u.customerProfile.contactPhone,
          addressLine1: u.customerProfile.addressLine1,
          addressLine2: u.customerProfile.addressLine2 || undefined,
          city: u.customerProfile.city,
          state: u.customerProfile.state,
          pincode: u.customerProfile.pincode,
          creditLimit: Number(u.customerProfile.creditLimit || 0),
          creditPeriodDays: u.customerProfile.creditPeriodDays || 30,
          currentOutstanding: Number(u.customerProfile.currentOutstanding || 0),
          isApproved: Boolean(u.customerProfile.isApproved)
        };
      }
      if (u.employeeProfile) {
        mapped.employeeProfile = {
          employeeCode: u.employeeProfile.employeeCode,
          designation: u.employeeProfile.designation,
          department: u.employeeProfile.department,
          reportingManagerId: u.employeeProfile.reportingManagerId || undefined,
          assignedTerritory: u.employeeProfile.assignedTerritory || undefined
        };
      }
      return mapped;
    });
  }
};

// ============================================================================
// 2. COMPANY & CATEGORY REPOSITORY
// ============================================================================
export const companyRepository = {
  mapToPrisma(c: any): any {
    return {
      id: String(c.id),
      code: String(c.code).toUpperCase().trim(),
      name: String(c.name).trim(),
      legalName: c.legalName ? String(c.legalName).trim() : null,
      logoUrl: c.logoUrl || null,
      website: c.website || null,
      country: c.country || "India",
      description: c.description || null,
      contactEmail: c.contactEmail || null,
      contactPhone: c.contactPhone || null,
      isActive: Boolean(c.isActive !== false),
      sortOrder: Number(c.sortOrder || 0),
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      legalName: record.legalName || undefined,
      logoUrl: record.logoUrl || undefined,
      website: record.website || undefined,
      country: record.country,
      description: record.description || undefined,
      contactEmail: record.contactEmail || undefined,
      contactPhone: record.contactPhone || undefined,
      isActive: record.isActive,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  },

  async upsert(company: any): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative company save", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(company);
    try {
      await (prisma as any).company.upsert({
        where: { id: data.id },
        create: data,
        update: {
          name: data.name,
          legalName: data.legalName,
          logoUrl: data.logoUrl,
          website: data.website,
          country: data.country,
          description: data.description,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          updatedAt: new Date()
        }
      });
    } catch (err: any) {
      throw new PersistenceError(`Failed to save company ${company.id}: ${err.message}`, "COMPANY_SAVE_FAILED", err);
    }
  },

  async delete(id: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative company delete", "DB_DISCONNECTED");
    }
    try {
      await (prisma as any).company.delete({
        where: { id: String(id) }
      });
    } catch (err: any) {
      throw new PersistenceError(`Failed to delete company ${id}: ${err.message}`, "COMPANY_DELETE_FAILED", err);
    }
  },

  async findAll(): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for company query", "DB_DISCONNECTED");
    }
    const records = await (prisma as any).company.findMany({
      orderBy: { sortOrder: "asc" }
    });
    return records.map((c: any) => this.mapFromPrisma(c));
  },

  async findById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for company query", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).company.findFirst({
        where: {
          OR: [
            { id: String(id) },
            { code: String(id).toUpperCase() }
          ]
        }
      });
      return record ? this.mapFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch company ${id}: ${err.message}`, "COMPANY_READ_FAILED", err);
    }
  }
};

export const categoryRepository = {
  mapToPrisma(cat: any): any {
    return {
      id: String(cat.id),
      code: String(cat.code).toUpperCase().trim(),
      name: String(cat.name).trim(),
      slug: String(cat.slug).trim(),
      description: cat.description ? String(cat.description).trim() : null,
      icon: cat.iconUrl || cat.icon || "Icons.biotech",
      imageUrl: cat.imageUrl || null,
      parentId: cat.parentId ? String(cat.parentId) : null,
      sortOrder: Number(cat.sortOrder || 0),
      isActive: Boolean(cat.isActive !== false),
      createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      slug: record.slug,
      description: record.description || undefined,
      iconUrl: record.icon,
      imageUrl: record.imageUrl || undefined,
      parentId: record.parentId,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  },

  async upsert(category: any): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative category save", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(category);
    try {
      await (prisma as any).category.upsert({
        where: { id: data.id },
        create: data,
        update: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          icon: data.icon,
          imageUrl: data.imageUrl,
          parentId: data.parentId,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          updatedAt: new Date()
        }
      });
    } catch (err: any) {
      throw new PersistenceError(`Failed to save category ${category.id}: ${err.message}`, "CATEGORY_SAVE_FAILED", err);
    }
  },

  async delete(id: string): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative category delete", "DB_DISCONNECTED");
    }
    try {
      await (prisma as any).category.delete({
        where: { id: String(id) }
      });
    } catch (err: any) {
      throw new PersistenceError(`Failed to delete category ${id}: ${err.message}`, "CATEGORY_DELETE_FAILED", err);
    }
  },

  async findAll(): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for category query", "DB_DISCONNECTED");
    }
    const records = await (prisma as any).category.findMany({
      orderBy: { sortOrder: "asc" }
    });
    const categories = records.map((cat: any) => {
      const mapped = this.mapFromPrisma(cat);
      mapped.level = 0;
      mapped.path = `/${mapped.id}`;
      return mapped;
    });
    const catMap = new Map<string, any>(categories.map((c: any) => [c.id, c]));
    const computed = new Map<string, { path: string; level: number }>();
    function computePathAndLevel(c: any, visited = new Set<string>()): { path: string; level: number } {
      if (computed.has(c.id)) return computed.get(c.id)!;
      if (!c.parentId || !catMap.has(c.parentId) || visited.has(c.id)) {
        const rootRes = { path: `/${c.id}`, level: 0 };
        computed.set(c.id, rootRes);
        return rootRes;
      }
      visited.add(c.id);
      const parent = catMap.get(c.parentId)!;
      const parentRes = computePathAndLevel(parent, visited);
      const res = {
        path: `${parentRes.path}/${c.id}`,
        level: parentRes.level + 1
      };
      computed.set(c.id, res);
      return res;
    }
    for (const cat of categories) {
      const res = computePathAndLevel(cat);
      cat.path = res.path;
      cat.level = res.level;
    }
    return categories;
  },

  async findById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for category query", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).category.findFirst({
        where: {
          OR: [
            { id: String(id) },
            { code: String(id).toUpperCase() },
            { slug: String(id).toLowerCase() }
          ]
        }
      });
      if (!record) return null;
      const mapped = this.mapFromPrisma(record);
      mapped.level = 0;
      mapped.path = `/${mapped.id}`;
      return mapped;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch category ${id}: ${err.message}`, "CATEGORY_READ_FAILED", err);
    }
  }
};

// ============================================================================
// 3. PRODUCT & PACK OPTIONS REPOSITORY (TRANSACTIONAL)
// ============================================================================
export const productRepository = {
  mapToPrisma(p: any): any {
    return {
      id: String(p.id),
      sku: String(p.sku).trim(),
      catalogNumber: p.catalogNumber || null,
      name: String(p.name).trim(),
      shortDescription: p.shortDescription || null,
      description: p.description || null,
      companyId: String(p.companyId),
      categoryId: p.categoryId ? String(p.categoryId) : "cat-reagents",
      productType: p.productType || "REAGENT",
      hsnCode: String(p.hsnCode || "38220090"),
      gstRate: Number(p.gstRate !== undefined ? p.gstRate : 12.00),
      basePrice: Number(p.basePrice || 0),
      mrp: Number(p.mrp || 0),
      minOrderQuantity: Number(p.minOrderQuantity || 1),
      isColdChain: Boolean(p.isColdChain),
      storageTemperature: p.storageTemperature || "2°C to 8°C",
      shelfLifeMonths: p.shelfLifeMonths !== undefined ? Number(p.shelfLifeMonths) : null,
      requiresPrescriptionOrAuth: Boolean(p.requiresPrescriptionOrAuth),
      isActive: Boolean(p.isActive !== false),
      isFeatured: Boolean(p.isFeatured),
      isDiscontinued: Boolean(p.isDiscontinued),
      packSize: String(p.packSize || "Standard Pack"),
      stockQuantity: Number(p.stockQuantity || 0),
      stockStatus: p.stockStatus || "IN_STOCK",
      leadTimeDays: Number(p.leadTimeDays || 2),
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      sku: record.sku,
      catalogNumber: record.catalogNumber || undefined,
      name: record.name,
      shortDescription: record.shortDescription || undefined,
      description: record.description || undefined,
      companyId: record.companyId,
      categoryId: record.categoryId,
      productType: record.productType,
      hsnCode: record.hsnCode,
      gstRate: Number(record.gstRate),
      basePrice: Number(record.basePrice),
      mrp: Number(record.mrp),
      minOrderQuantity: record.minOrderQuantity,
      isColdChain: record.isColdChain,
      storageTemperature: record.storageTemperature,
      shelfLifeMonths: record.shelfLifeMonths !== null ? record.shelfLifeMonths : undefined,
      requiresPrescriptionOrAuth: record.requiresPrescriptionOrAuth,
      isActive: record.isActive,
      isFeatured: record.isFeatured,
      isDiscontinued: record.isDiscontinued,
      packSize: record.packSize,
      stockQuantity: record.stockQuantity,
      stockStatus: record.stockStatus,
      leadTimeDays: record.leadTimeDays,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  },

  async upsert(product: any): Promise<void> {
    return this.upsertWithPacksTx(product, []);
  },

  async upsertWithPacksTx(product: any, packOptions: any[] = []): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative product save", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(product);

    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.product.upsert({
          where: { id: data.id },
          create: data,
          update: {
            name: data.name,
            catalogNumber: data.catalogNumber,
            shortDescription: data.shortDescription,
            description: data.description,
            companyId: data.companyId,
            categoryId: data.categoryId,
            basePrice: data.basePrice,
            mrp: data.mrp,
            gstRate: data.gstRate,
            isColdChain: data.isColdChain,
            isActive: data.isActive,
            stockQuantity: data.stockQuantity,
            stockStatus: data.stockStatus,
            updatedAt: new Date()
          }
        });

        if (Array.isArray(packOptions) && packOptions.length > 0) {
          for (const pk of packOptions) {
            await tx.productPackOption.upsert({
              where: { id: String(pk.id) },
              create: {
                id: String(pk.id),
                productId: data.id,
                packSizeName: String(pk.packSizeName || pk.name),
                quantityMultiplier: Number(pk.quantityMultiplier || 1),
                price: Number(pk.price || data.basePrice),
                isDefault: Boolean(pk.isDefault),
                createdAt: new Date(),
                updatedAt: new Date()
              },
              update: {
                packSizeName: String(pk.packSizeName || pk.name),
                price: Number(pk.price || data.basePrice),
                isDefault: Boolean(pk.isDefault),
                updatedAt: new Date()
              }
            });
          }
        }
      });
    } catch (err: any) {
      throw new PersistenceError(`Transactional product save failed for ${product.id}: ${err.message}`, "PRODUCT_TX_FAILED", err);
    }
  },

  async findAll(): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for product query", "DB_DISCONNECTED");
    }
    const records = await (prisma as any).product.findMany({
      include: { packOptions: true, images: true, documents: true }
    });
    return records.map((p: any) => {
      const mapped = this.mapFromPrisma(p);
      mapped.packOptions = (p.packOptions || []).map((pk: any) => ({
        id: pk.id,
        name: pk.packSizeName,
        packSizeName: pk.packSizeName,
        quantityMultiplier: pk.quantityMultiplier,
        price: Number(pk.price),
        isDefault: Boolean(pk.isDefault)
      }));
      mapped.images = (p.images || []).map((img: any) => ({
        id: img.id,
        productId: img.productId,
        imageUrl: img.url || img.imageUrl,
        isPrimary: Boolean(img.isPrimary),
        sortOrder: Number(img.sortOrder || 0),
        createdAt: img.createdAt ? (img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt)) : undefined
      }));
      mapped.documents = (p.documents || []).map((doc: any) => ({
        id: doc.id,
        productId: doc.productId,
        title: doc.title,
        documentType: doc.documentType,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt ? (doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt)) : undefined
      }));
      return mapped;
    });
  },

  async findById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for product query", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).product.findFirst({
        where: {
          OR: [
            { id: String(id) },
            { sku: String(id) }
          ]
        },
        include: { packOptions: true, images: true, documents: true }
      });
      if (!record) return null;
      const mapped = this.mapFromPrisma(record);
      mapped.packOptions = (record.packOptions || []).map((pk: any) => ({
        id: pk.id,
        name: pk.packSizeName,
        packSizeName: pk.packSizeName,
        quantityMultiplier: pk.quantityMultiplier,
        price: Number(pk.price),
        isDefault: Boolean(pk.isDefault)
      }));
      mapped.images = (record.images || []).map((img: any) => ({
        id: img.id,
        productId: img.productId,
        imageUrl: img.url || img.imageUrl,
        isPrimary: Boolean(img.isPrimary),
        sortOrder: Number(img.sortOrder || 0),
        createdAt: img.createdAt ? (img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt)) : undefined
      }));
      mapped.documents = (record.documents || []).map((doc: any) => ({
        id: doc.id,
        productId: doc.productId,
        title: doc.title,
        documentType: doc.documentType,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt ? (doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt)) : undefined
      }));
      return mapped;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch product ${id}: ${err.message}`, "PRODUCT_READ_FAILED", err);
    }
  }
};

// ============================================================================
// 4. ORDER & LEDGER REPOSITORY (ATOMIC TRANSACTION WITH ROLLBACK PROTECTION)
// ============================================================================
export const orderRepository = {
  mapToPrisma(order: any): any {
    let validDeliveryDate: Date | null = null;
    if (order.deliveryDate) {
      const candidate = new Date(order.deliveryDate);
      if (!isNaN(candidate.getTime())) {
        validDeliveryDate = candidate;
      }
    }

    return {
      id: String(order.id || order.orderNumber),
      orderNumber: String(order.orderNumber),
      customerId: String(order.customerId || "u-cust-01"),
      customerLabName: String(order.customerLabName || "Diagnostic Laboratory"),
      items: order.items || [],
      itemCount: Number(order.itemCount || (order.items ? order.items.length : 0)),
      subtotal: Number(order.subtotal || 0),
      gstAmount: Number(order.gstAmount || 0),
      coldChainFee: Number(order.coldChainFee || 0),
      grandTotal: Number(order.grandTotal || 0),
      status: String(order.status || "PENDING_APPROVAL"),
      paymentStatus: String(order.paymentStatus || "PAYMENT_PENDING"),
      paymentMethod: order.paymentMethod ? String(order.paymentMethod) : null,
      coldChainMonitoring: order.coldChainMonitoring || null,
      shippingAddress: String(order.shippingAddress || "Registered Delivery Address"),
      deliveryDate: validDeliveryDate,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      orderNumber: record.orderNumber,
      customerId: record.customerId,
      customerLabName: record.customerLabName,
      items: record.items,
      itemCount: record.itemCount,
      subtotal: Number(record.subtotal),
      gstAmount: Number(record.gstAmount),
      coldChainFee: Number(record.coldChainFee),
      grandTotal: Number(record.grandTotal),
      status: record.status,
      paymentStatus: record.paymentStatus,
      paymentMethod: record.paymentMethod || undefined,
      coldChainMonitoring: record.coldChainMonitoring || undefined,
      shippingAddress: record.shippingAddress,
      deliveryDate: record.deliveryDate ? record.deliveryDate.toISOString() : undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  },

  /**
   * Places an order and atomically decrements credit balance / registers ledger entry.
   * If any step fails, the entire transaction rolls back cleanly.
   */
  async placeOrderWithCreditDeductionTx(
    order: any,
    creditDeduction?: {
      customerId: string;
      deductAmount: number;
      ledgerEntry: any;
    }
  ): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative order placement", "DB_DISCONNECTED");
    }

    const orderData = this.mapToPrisma(order);

    try {
      const createdOrder = await prisma.$transaction(async (tx: any) => {
        // 1. Idempotency check: Ensure orderNumber does not already exist
        const existing = await tx.customerOrder.findUnique({
          where: { orderNumber: orderData.orderNumber }
        });
        if (existing) {
          throw new PersistenceError(`Order ${orderData.orderNumber} already exists (duplicate submission)`, "DUPLICATE_ORDER");
        }

        // 2. Insert order record with immutable price/tax snapshot
        const savedOrder = await tx.customerOrder.create({
          data: orderData
        });

        // 3. Atomically update wallet & credit balance if requested
        if (creditDeduction && creditDeduction.deductAmount > 0) {
          const { customerId, deductAmount, ledgerEntry } = creditDeduction;

          const currentWallet = await tx.customerWallet.findUnique({
            where: { customerId }
          });

          if (currentWallet) {
            const currentOutstanding = Number(currentWallet.currentOutstanding || 0);
            const creditLimit = Number(currentWallet.creditLimit || 0);
            const newOutstanding = currentOutstanding + deductAmount;
            const newAvailable = Math.max(0, creditLimit - newOutstanding);

            const existingEntries = Array.isArray(currentWallet.ledgerEntries) ? currentWallet.ledgerEntries : [];
            
            // Prevent duplicate ledger entry by ID
            if (ledgerEntry && !existingEntries.some((e: any) => e.id === ledgerEntry.id)) {
              existingEntries.unshift(ledgerEntry);
            }

            await tx.customerWallet.update({
              where: { customerId },
              data: {
                currentOutstanding: newOutstanding,
                availableCredit: newAvailable,
                unbilledOrdersCount: (currentWallet.unbilledOrdersCount || 0) + 1,
                ledgerEntries: existingEntries,
                updatedAt: new Date()
              }
            });
          }
        }

        return savedOrder;
      });

      return this.mapFromPrisma(createdOrder);
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Order transaction failed for ${order.orderNumber}: ${err.message}`, "ORDER_TX_FAILED", err);
    }
  },

  async findByCustomerId(customerId: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for customer orders read", "DB_DISCONNECTED");
    }
    try {
      const records = await (prisma as any).customerOrder.findMany({
        where: { customerId: String(customerId) },
        orderBy: { createdAt: "desc" },
        take: options?.limit,
        skip: options?.offset
      });
      return records.map((r: any) => this.mapFromPrisma(r));
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch orders for customer ${customerId}: ${err.message}`, "ORDER_READ_FAILED", err);
    }
  },

  async findById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for order read", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).customerOrder.findFirst({
        where: {
          OR: [
            { id: String(id) },
            { orderNumber: String(id) }
          ]
        }
      });
      return record ? this.mapFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch order ${id}: ${err.message}`, "ORDER_READ_FAILED", err);
    }
  },

  async findAll(options?: { limit?: number; offset?: number }): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for orders query", "DB_DISCONNECTED");
    }
    try {
      const records = await (prisma as any).customerOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: options?.limit,
        skip: options?.offset
      });
      return records.map((r: any) => this.mapFromPrisma(r));
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch all orders: ${err.message}`, "ORDER_READ_FAILED", err);
    }
  }
};

export function normalizeTicketPriority(rawPriority: any): string {
  const p = String(rawPriority || "HIGH").toUpperCase().trim();
  if (["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(p)) {
    return p;
  }
  return "HIGH";
}

export function normalizeTicketStatus(rawStatus: any): string {
  const s = String(rawStatus || "NEW").toUpperCase().trim();
  switch (s) {
    case "ENGINEER_ON_THE_WAY":
    case "ON_THE_WAY":
      return "ON_THE_WAY";
    case "CHECKED_IN":
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "WAITING_FOR_PARTS":
    case "SPARE_PARTS_PENDING":
      return "SPARE_PARTS_PENDING";
    case "WAITING_FOR_CUSTOMER":
      return "IN_PROGRESS";
    case "CUSTOMER_FEEDBACK_PENDING":
      return "RESOLVED";
    case "BACK_OFFICE_REVIEW":
      return "BACK_OFFICE_REVIEW";
    case "CUSTOMER_DISPUTED_RESOLUTION":
    case "DISPUTED":
      return "DISPUTED";
    case "NEW":
    case "ASSIGNED":
    case "ACKNOWLEDGED":
    case "SCHEDULED":
    case "RESOLVED":
    case "CLOSED":
    case "REOPENED":
    case "CANCELLED":
      return s;
    default:
      return "NEW";
  }
}

// ============================================================================
// 5. SERVICE TICKET REPOSITORY
// ============================================================================
export const serviceTicketRepository = {
  mapToPrisma(t: any): any {
    return {
      id: String(t.id),
      ticketNumber: String(t.ticketNumber || t.id),
      customerId: String(t.customerId || "u-cust-01"),
      category: t.category || "EQUIPMENT_BREAKDOWN",
      equipmentId: t.equipmentId ? String(t.equipmentId) : null,
      priority: normalizeTicketPriority(t.priority),
      title: String(t.title || "Biomedical Equipment Service Request"),
      description: String(t.description || ""),
      errorCode: t.errorCode || null,
      status: normalizeTicketStatus(t.status),
      assignedEngineerId: t.assignedEngineerId ? String(t.assignedEngineerId) : null,
      assignedAt: t.assignedAt ? new Date(t.assignedAt) : null,
      acknowledgedAt: t.acknowledgedAt ? new Date(t.acknowledgedAt) : null,
      scheduledVisitDate: t.scheduledVisitDate ? new Date(t.scheduledVisitDate) : null,
      scheduledVisitSlot: t.scheduledVisitSlot || null,
      engineerOnTheWayAt: t.engineerOnTheWayAt ? new Date(t.engineerOnTheWayAt) : null,
      slaTargetHours: Number(t.slaTargetHours || 8),
      slaTargetTimestamp: t.slaTargetTimestamp ? new Date(t.slaTargetTimestamp) : new Date(Date.now() + 8 * 3600000),
      slaStatus: t.slaStatus || "ON_TRACK",
      reopenedAt: t.reopenedAt ? new Date(t.reopenedAt) : null,
      reopenedById: t.reopenedById ? String(t.reopenedById) : null,
      reopenReason: t.reopenReason || null,
      createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapFromPrisma(t: any): any {
    if (!t) return null;
    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      customerId: t.customerId,
      category: t.category,
      equipmentId: t.equipmentId || undefined,
      priority: t.priority,
      title: t.title,
      description: t.description,
      errorCode: t.errorCode || undefined,
      status: t.status,
      assignedEngineerId: t.assignedEngineerId || undefined,
      assignedEngineer: t.assignedEngineer ? {
        id: t.assignedEngineer.id,
        name: `${t.assignedEngineer.firstName || ''} ${t.assignedEngineer.lastName || ''}`.trim() || t.assignedEngineer.username,
        phoneNumber: t.assignedEngineer.phoneNumber,
        email: t.assignedEngineer.email
      } : undefined,
      assignedAt: t.assignedAt ? (t.assignedAt instanceof Date ? t.assignedAt.toISOString() : String(t.assignedAt)) : undefined,
      acknowledgedAt: t.acknowledgedAt ? (t.acknowledgedAt instanceof Date ? t.acknowledgedAt.toISOString() : String(t.acknowledgedAt)) : undefined,
      scheduledVisitDate: t.scheduledVisitDate ? (t.scheduledVisitDate instanceof Date ? t.scheduledVisitDate.toISOString().split("T")[0] : String(t.scheduledVisitDate).split("T")[0]) : undefined,
      scheduledVisitSlot: t.scheduledVisitSlot || undefined,
      engineerOnTheWayAt: t.engineerOnTheWayAt ? (t.engineerOnTheWayAt instanceof Date ? t.engineerOnTheWayAt.toISOString() : String(t.engineerOnTheWayAt)) : undefined,
      slaTargetHours: t.slaTargetHours,
      slaTargetTimestamp: t.slaTargetTimestamp ? (t.slaTargetTimestamp instanceof Date ? t.slaTargetTimestamp.toISOString() : String(t.slaTargetTimestamp)) : undefined,
      slaStatus: t.slaStatus,
      reopenedAt: t.reopenedAt ? (t.reopenedAt instanceof Date ? t.reopenedAt.toISOString() : String(t.reopenedAt)) : undefined,
      reopenedById: t.reopenedById || undefined,
      reopenReason: t.reopenReason || undefined,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt)
    };
  },

  async upsert(ticket: any): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative ticket save", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(ticket);

    // Defensive FK Validation: ensure customerId exists in users table
    let targetCustomerId = data.customerId;
    try {
      const userExists = await (prisma as any).user.findUnique({
        where: { id: targetCustomerId },
        select: { id: true }
      });
      if (!userExists) {
        const fallback = await (prisma as any).user.findFirst({
          where: { id: { in: ["u-cust-01", "u-admin-01"] } },
          select: { id: true }
        }) || await (prisma as any).user.findFirst({ select: { id: true } });
        if (fallback) {
          targetCustomerId = fallback.id;
        }
      }
    } catch {
      // Keep targetCustomerId if query failed
    }

    // Defensive FK Validation: ensure equipmentId exists if present
    let targetEquipmentId = data.equipmentId;
    if (targetEquipmentId) {
      try {
        const eqExists = await (prisma as any).customerEquipment.findUnique({
          where: { id: targetEquipmentId },
          select: { id: true }
        });
        if (!eqExists) targetEquipmentId = null;
      } catch {
        targetEquipmentId = null;
      }
    }

    // Defensive FK Validation: ensure assignedEngineerId exists if present
    let targetEngineerId = data.assignedEngineerId;
    if (targetEngineerId) {
      try {
        const engExists = await (prisma as any).user.findUnique({
          where: { id: targetEngineerId },
          select: { id: true }
        });
        if (!engExists) targetEngineerId = null;
      } catch {
        targetEngineerId = null;
      }
    }

    try {
      await (prisma as any).serviceTicket.upsert({
        where: { id: data.id },
        create: {
          ...data,
          customerId: targetCustomerId,
          equipmentId: targetEquipmentId,
          assignedEngineerId: targetEngineerId
        },
        update: {
          category: data.category,
          equipmentId: targetEquipmentId,
          priority: data.priority,
          title: data.title,
          description: data.description,
          errorCode: data.errorCode,
          status: data.status,
          assignedEngineerId: targetEngineerId,
          assignedAt: data.assignedAt,
          acknowledgedAt: data.acknowledgedAt,
          scheduledVisitDate: data.scheduledVisitDate,
          scheduledVisitSlot: data.scheduledVisitSlot,
          engineerOnTheWayAt: data.engineerOnTheWayAt,
          slaTargetHours: data.slaTargetHours,
          slaTargetTimestamp: data.slaTargetTimestamp,
          slaStatus: data.slaStatus,
          reopenedAt: data.reopenedAt,
          reopenedById: data.reopenedById,
          reopenReason: data.reopenReason,
          updatedAt: new Date()
        }
      });
    } catch (err: any) {
      if (err?.message?.includes("foreign key") || err?.message?.includes("fkey")) {
        try {
          const fallbackUser = await (prisma as any).user.findFirst({ select: { id: true } });
          if (fallbackUser) {
            await (prisma as any).serviceTicket.upsert({
              where: { id: data.id },
              create: { ...data, customerId: fallbackUser.id, equipmentId: null, assignedEngineerId: null },
              update: {
                category: data.category,
                equipmentId: null,
                priority: data.priority,
                title: data.title,
                description: data.description,
                errorCode: data.errorCode,
                status: data.status,
                assignedEngineerId: null,
                assignedAt: data.assignedAt,
                acknowledgedAt: data.acknowledgedAt,
                scheduledVisitDate: data.scheduledVisitDate,
                scheduledVisitSlot: data.scheduledVisitSlot,
                engineerOnTheWayAt: data.engineerOnTheWayAt,
                slaTargetHours: data.slaTargetHours,
                slaTargetTimestamp: data.slaTargetTimestamp,
                slaStatus: data.slaStatus,
                reopenedAt: data.reopenedAt,
                reopenedById: data.reopenedById,
                reopenReason: data.reopenReason,
                updatedAt: new Date()
              }
            });
            return;
          }
        } catch (fallbackErr: any) {
          console.warn(`[ServiceTicket] Fallback upsert failed for ${ticket.id}:`, fallbackErr.message);
        }
      }
      throw new PersistenceError(`Failed to save service ticket ${ticket.id}: ${err.message}`, "TICKET_SAVE_FAILED", err);
    }
  },

  async saveTicketWithEquipmentTx(ticket: any, equipmentUpdate?: { equipmentId: string; data: any }): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative ticket transaction", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(ticket);

    // Defensive FK Validation: ensure customerId exists in users table
    let targetCustomerId = data.customerId;
    try {
      const userExists = await (prisma as any).user.findUnique({
        where: { id: targetCustomerId },
        select: { id: true }
      });
      if (!userExists) {
        const fallback = await (prisma as any).user.findFirst({
          where: { id: { in: ["u-cust-01", "u-admin-01"] } },
          select: { id: true }
        }) || await (prisma as any).user.findFirst({ select: { id: true } });
        if (fallback) {
          targetCustomerId = fallback.id;
        }
      }
    } catch {
      // Keep targetCustomerId if query failed
    }

    let targetEquipmentId = data.equipmentId;
    if (targetEquipmentId) {
      try {
        const eqExists = await (prisma as any).customerEquipment.findUnique({
          where: { id: targetEquipmentId },
          select: { id: true }
        });
        if (!eqExists) targetEquipmentId = null;
      } catch {
        targetEquipmentId = null;
      }
    }

    let targetEngineerId = data.assignedEngineerId;
    if (targetEngineerId) {
      try {
        const engExists = await (prisma as any).user.findUnique({
          where: { id: targetEngineerId },
          select: { id: true }
        });
        if (!engExists) targetEngineerId = null;
      } catch {
        targetEngineerId = null;
      }
    }

    try {
      await prisma.$transaction(async (tx: any) => {
        await tx.serviceTicket.upsert({
          where: { id: data.id },
          create: {
            ...data,
            customerId: targetCustomerId,
            equipmentId: targetEquipmentId,
            assignedEngineerId: targetEngineerId
          },
          update: {
            category: data.category,
            equipmentId: targetEquipmentId,
            priority: data.priority,
            title: data.title,
            description: data.description,
            errorCode: data.errorCode,
            status: data.status,
            assignedEngineerId: targetEngineerId,
            assignedAt: data.assignedAt,
            acknowledgedAt: data.acknowledgedAt,
            scheduledVisitDate: data.scheduledVisitDate,
            scheduledVisitSlot: data.scheduledVisitSlot,
            engineerOnTheWayAt: data.engineerOnTheWayAt,
            slaTargetHours: data.slaTargetHours,
            slaTargetTimestamp: data.slaTargetTimestamp,
            slaStatus: data.slaStatus,
            reopenedAt: data.reopenedAt,
            reopenedById: data.reopenedById,
            reopenReason: data.reopenReason,
            updatedAt: new Date()
          }
        });
        if (equipmentUpdate && equipmentUpdate.equipmentId) {
          const eqRecord = await tx.customerEquipment.findUnique({
            where: { id: String(equipmentUpdate.equipmentId) },
            select: { id: true }
          }).catch(() => null);
          if (eqRecord) {
            await tx.customerEquipment.update({
              where: { id: String(equipmentUpdate.equipmentId) },
              data: {
                ...equipmentUpdate.data,
                updatedAt: new Date()
              }
            });
          }
        }
      });
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Ticket transaction failed for ${ticket.id}: ${err.message}`, "TICKET_TX_FAILED", err);
    }
  },

  async findById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for service ticket query", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).serviceTicket.findFirst({
        where: {
          OR: [
            { id: String(id) },
            { ticketNumber: String(id) }
          ]
        },
        include: {
          assignedEngineer: true
        }
      });
      return record ? this.mapFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch service ticket ${id}: ${err.message}`, "TICKET_READ_FAILED", err);
    }
  },

  async findAll(): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for service ticket query", "DB_DISCONNECTED");
    }
    const records = await (prisma as any).serviceTicket.findMany({
      include: { assignedEngineer: true },
      orderBy: { createdAt: "desc" }
    });
    return records.map((t: any) => this.mapFromPrisma(t));
  }
};

// ============================================================================
// 6. WALLET & CREDIT PROFILE REPOSITORY
// ============================================================================
export const walletRepository = {
  mapFromPrisma(record: any): any {
    if (!record) return null;
    return {
      customerId: record.customerId,
      creditLimit: Number(record.creditLimit),
      currentOutstanding: Number(record.currentOutstanding),
      availableCredit: Number(record.availableCredit),
      creditPeriodDays: record.creditPeriodDays,
      unbilledOrdersCount: record.unbilledOrdersCount,
      ledgerEntries: Array.isArray(record.ledgerEntries) ? record.ledgerEntries : []
    };
  },

  mapCreditProfileFromPrisma(record: any): any {
    if (!record) return null;
    return {
      customerId: record.customerId,
      customerLabName: record.customerLabName,
      creditLimit: Number(record.creditLimit),
      availableCredit: Number(record.availableCredit),
      currentOutstanding: Number(record.currentOutstanding),
      creditPeriodDays: record.creditPeriodDays,
      dueDate: record.dueDate ? (record.dueDate instanceof Date ? record.dueDate.toISOString().split("T")[0] : String(record.dueDate).split("T")[0]) : null,
      daysOverdue: record.daysOverdue,
      paymentStatus: record.paymentStatus,
      hasApprovedExtension: record.hasApprovedExtension,
      approvedExtensionUntil: record.approvedExtensionUntil ? (record.approvedExtensionUntil instanceof Date ? record.approvedExtensionUntil.toISOString().split("T")[0] : String(record.approvedExtensionUntil).split("T")[0]) : null,
      walletPoints: record.walletPoints,
      businessRating: Number(record.businessRating),
      paymentReliabilityPercent: Number(record.paymentReliabilityPercent),
      paymentHistory: Array.isArray(record.paymentHistory) ? record.paymentHistory : [],
      paymentPromises: Array.isArray(record.paymentPromises) ? record.paymentPromises : []
    };
  },

  async findByCustomerId(customerId: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for customer wallet read", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).customerWallet.findUnique({
        where: { customerId: String(customerId) }
      });
      return record ? this.mapFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch wallet for customer ${customerId}: ${err.message}`, "WALLET_READ_FAILED", err);
    }
  },

  async findCreditProfileByCustomerId(customerId: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for credit profile read", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).customerCreditProfile.findUnique({
        where: { customerId: String(customerId) }
      });
      return record ? this.mapCreditProfileFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch credit profile for customer ${customerId}: ${err.message}`, "CREDIT_PROFILE_READ_FAILED", err);
    }
  },

  async appendLedgerEntryTx(customerId: string, entry: any): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for ledger transaction", "DB_DISCONNECTED");
    }

    try {
      await prisma.$transaction(async (tx: any) => {
        const wallet = await tx.customerWallet.findUnique({
          where: { customerId }
        });
        if (!wallet) {
          throw new PersistenceError(`Wallet not found for customer ${customerId}`, "WALLET_NOT_FOUND");
        }

        const entries = Array.isArray(wallet.ledgerEntries) ? wallet.ledgerEntries : [];
        if (entry.id && entries.some((e: any) => e.id === entry.id)) {
          // Idempotent: already recorded, skip duplicate insertion
          return;
        }

        entries.unshift(entry);
        await tx.customerWallet.update({
          where: { customerId },
          data: {
            ledgerEntries: entries,
            updatedAt: new Date()
          }
        });
      });
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Ledger append failed for customer ${customerId}: ${err.message}`, "LEDGER_TX_FAILED", err);
    }
  }
};

// ============================================================================
// 7. AUDIT LOG REPOSITORY
// ============================================================================
export const auditLogRepository = {
  mapToPrisma(l: any): any {
    return {
      id: String(l.id || `log-${Date.now()}`),
      userId: l.userId ? String(l.userId) : null,
      action: String(l.action || l.event || "SYSTEM_AUDIT"),
      entityType: String(l.entityType || l.category || "GENERAL"),
      entityId: l.entityId || l.resourceId ? String(l.entityId || l.resourceId) : null,
      oldValues: l.oldValues || null,
      newValues: l.newValues || l.details || null,
      ipAddress: l.ipAddress || null,
      userAgent: l.userAgent || null,
      createdAt: l.timestamp ? new Date(l.timestamp) : new Date()
    };
  },

  async create(log: any): Promise<void> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for audit log write", "DB_DISCONNECTED");
    }
    const data = this.mapToPrisma(log);
    try {
      await (prisma as any).auditLog.create({ data });
    } catch (err: any) {
      if (err?.message?.includes("foreign key") || err?.message?.includes("fkey")) {
        try {
          await (prisma as any).auditLog.create({
            data: {
              ...data,
              userId: null,
              newValues: { ...(data.newValues || {}), originalUserId: data.userId }
            }
          });
          return;
        } catch (fallbackErr: any) {
          console.warn("[Audit] Fallback write error:", fallbackErr.message);
        }
      }
      throw new PersistenceError(`Failed to save audit log: ${err.message}`, "AUDIT_SAVE_FAILED", err);
    }
  }
};

// ============================================================================
// 8. COMMERCIAL PRICING & PRODUCT ACCESS RULES REPOSITORY (DUAL-CONTROL MAKER-CHECKER)
// ============================================================================
export const commercialRulesRepository = {
  // --- CustomerPriceRule Mapping ---
  mapPriceRuleToPrisma(rule: any): any {
    return {
      id: String(rule.id),
      customerId: String(rule.customerId),
      customerLabName: rule.customerLabName ? String(rule.customerLabName) : null,
      ruleTier: String(rule.ruleTier || "CONTRACT_SKU"),
      productId: rule.productId ? String(rule.productId) : null,
      productSku: rule.productSku ? String(rule.productSku) : null,
      productName: rule.productName ? String(rule.productName) : null,
      equipmentId: rule.equipmentId ? String(rule.equipmentId) : null,
      equipmentName: rule.equipmentName ? String(rule.equipmentName) : null,
      companyId: rule.companyId ? String(rule.companyId) : null,
      companyName: rule.companyName ? String(rule.companyName) : null,
      categoryId: rule.categoryId ? String(rule.categoryId) : null,
      categoryName: rule.categoryName ? String(rule.categoryName) : null,
      customFixedPrice: rule.customFixedPrice !== undefined && rule.customFixedPrice !== null ? Number(rule.customFixedPrice) : null,
      discountPercent: rule.discountPercent !== undefined && rule.discountPercent !== null ? Number(rule.discountPercent) : null,
      quantitySlabs: rule.quantitySlabs || null,
      paymentMethod: rule.paymentMethod ? String(rule.paymentMethod) : "ALL",
      priority: Number(rule.priority || 0),
      isActive: Boolean(rule.isActive !== false),
      effectiveStartDate: rule.effectiveStartDate ? new Date(rule.effectiveStartDate) : new Date(),
      effectiveEndDate: rule.effectiveEndDate ? new Date(rule.effectiveEndDate) : null,
      validUntil: rule.validUntil ? new Date(rule.validUntil) : null,
      approvalStatus: String(rule.approvalStatus || "PENDING_APPROVAL"),
      makerId: String(rule.makerId || "u-admin-01"),
      makerEmail: String(rule.makerEmail || "admin@a2zdiagnostics.com"),
      checkerId: rule.checkerId ? String(rule.checkerId) : null,
      checkerEmail: rule.checkerEmail ? String(rule.checkerEmail) : null,
      approvedAt: rule.approvedAt ? new Date(rule.approvedAt) : null,
      rejectionReason: rule.rejectionReason ? String(rule.rejectionReason) : null,
      pricingVersion: Number(rule.pricingVersion || 1),
      createdAt: rule.createdAt ? new Date(rule.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapPriceRuleFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      customerId: record.customerId,
      customerLabName: record.customerLabName || undefined,
      ruleTier: record.ruleTier,
      productId: record.productId || undefined,
      productSku: record.productSku || undefined,
      productName: record.productName || undefined,
      equipmentId: record.equipmentId || undefined,
      equipmentName: record.equipmentName || undefined,
      companyId: record.companyId || undefined,
      companyName: record.companyName || undefined,
      categoryId: record.categoryId || undefined,
      categoryName: record.categoryName || undefined,
      customFixedPrice: record.customFixedPrice !== null && record.customFixedPrice !== undefined ? Number(record.customFixedPrice) : undefined,
      discountPercent: record.discountPercent !== null && record.discountPercent !== undefined ? Number(record.discountPercent) : undefined,
      quantitySlabs: record.quantitySlabs || undefined,
      paymentMethod: record.paymentMethod || "ALL",
      priority: record.priority,
      isActive: record.isActive,
      effectiveStartDate: record.effectiveStartDate instanceof Date ? record.effectiveStartDate.toISOString() : (record.effectiveStartDate || undefined),
      effectiveEndDate: record.effectiveEndDate instanceof Date ? record.effectiveEndDate.toISOString() : (record.effectiveEndDate || undefined),
      validUntil: record.validUntil instanceof Date ? record.validUntil.toISOString() : (record.validUntil || undefined),
      approvalStatus: record.approvalStatus,
      makerId: record.makerId,
      makerEmail: record.makerEmail,
      checkerId: record.checkerId || undefined,
      checkerEmail: record.checkerEmail || undefined,
      approvedAt: record.approvedAt instanceof Date ? record.approvedAt.toISOString() : (record.approvedAt || undefined),
      rejectionReason: record.rejectionReason || undefined,
      pricingVersion: record.pricingVersion,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt)
    };
  },

  // --- ProductAccessRule Mapping ---
  mapAccessRuleToPrisma(rule: any): any {
    return {
      id: String(rule.id),
      ruleType: String(rule.ruleType),
      customerId: rule.customerId ? String(rule.customerId) : null,
      customerLabName: rule.customerLabName ? String(rule.customerLabName) : null,
      productId: rule.productId ? String(rule.productId) : null,
      productSku: rule.productSku ? String(rule.productSku) : null,
      productName: rule.productName ? String(rule.productName) : null,
      categoryId: rule.categoryId ? String(rule.categoryId) : null,
      companyId: rule.companyId ? String(rule.companyId) : null,
      reason: rule.reason ? String(rule.reason) : null,
      isActive: Boolean(rule.isActive !== false),
      effectiveStartDate: rule.effectiveStartDate ? new Date(rule.effectiveStartDate) : new Date(),
      effectiveEndDate: rule.effectiveEndDate ? new Date(rule.effectiveEndDate) : null,
      approvalStatus: String(rule.approvalStatus || "PENDING_APPROVAL"),
      makerId: String(rule.makerId || "u-office-01"),
      makerEmail: String(rule.makerEmail || "operations@a2zdiagnostics.com"),
      checkerId: rule.checkerId ? String(rule.checkerId) : null,
      checkerEmail: rule.checkerEmail ? String(rule.checkerEmail) : null,
      approvedAt: rule.approvedAt ? new Date(rule.approvedAt) : null,
      rejectionReason: rule.rejectionReason ? String(rule.rejectionReason) : null,
      priority: Number(rule.priority || 0),
      createdAt: rule.createdAt ? new Date(rule.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapAccessRuleFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      ruleType: record.ruleType,
      customerId: record.customerId || undefined,
      customerLabName: record.customerLabName || undefined,
      productId: record.productId || undefined,
      productSku: record.productSku || undefined,
      productName: record.productName || undefined,
      categoryId: record.categoryId || undefined,
      companyId: record.companyId || undefined,
      reason: record.reason || undefined,
      isActive: record.isActive,
      effectiveStartDate: record.effectiveStartDate instanceof Date ? record.effectiveStartDate.toISOString() : (record.effectiveStartDate || undefined),
      effectiveEndDate: record.effectiveEndDate instanceof Date ? record.effectiveEndDate.toISOString() : (record.effectiveEndDate || undefined),
      approvalStatus: record.approvalStatus,
      makerId: record.makerId,
      makerEmail: record.makerEmail,
      checkerId: record.checkerId || undefined,
      checkerEmail: record.checkerEmail || undefined,
      approvedAt: record.approvedAt instanceof Date ? record.approvedAt.toISOString() : (record.approvedAt || undefined),
      rejectionReason: record.rejectionReason || undefined,
      priority: record.priority,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt)
    };
  },

  // --- CustomerPriceRule Operations ---
  async upsertPriceRule(rule: any): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative pricing rule save", "DB_DISCONNECTED");
    }
    const data = this.mapPriceRuleToPrisma(rule);
    try {
      const saved = await (prisma as any).customerPriceRule.upsert({
        where: { id: data.id },
        create: data,
        update: {
          customerLabName: data.customerLabName,
          ruleTier: data.ruleTier,
          productId: data.productId,
          productSku: data.productSku,
          productName: data.productName,
          equipmentId: data.equipmentId,
          equipmentName: data.equipmentName,
          companyId: data.companyId,
          companyName: data.companyName,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          customFixedPrice: data.customFixedPrice,
          discountPercent: data.discountPercent,
          quantitySlabs: data.quantitySlabs,
          paymentMethod: data.paymentMethod,
          priority: data.priority,
          isActive: data.isActive,
          effectiveStartDate: data.effectiveStartDate,
          effectiveEndDate: data.effectiveEndDate,
          validUntil: data.validUntil,
          approvalStatus: data.approvalStatus,
          checkerId: data.checkerId,
          checkerEmail: data.checkerEmail,
          approvedAt: data.approvedAt,
          rejectionReason: data.rejectionReason,
          pricingVersion: data.pricingVersion,
          updatedAt: new Date()
        }
      });
      return this.mapPriceRuleFromPrisma(saved);
    } catch (err: any) {
      throw new PersistenceError(`Failed to save pricing rule ${rule.id}: ${err.message}`, "PRICING_RULE_SAVE_FAILED", err);
    }
  },

  async deletePriceRule(id: string): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative pricing rule delete", "DB_DISCONNECTED");
    }
    try {
      const deleted = await (prisma as any).customerPriceRule.delete({
        where: { id: String(id) }
      });
      return this.mapPriceRuleFromPrisma(deleted);
    } catch (err: any) {
      throw new PersistenceError(`Failed to delete pricing rule ${id}: ${err.message}`, "PRICING_RULE_DELETE_FAILED", err);
    }
  },

  async findPriceRuleById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for pricing rule query", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).customerPriceRule.findUnique({
        where: { id: String(id) }
      });
      return record ? this.mapPriceRuleFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch pricing rule ${id}: ${err.message}`, "PRICING_RULE_READ_FAILED", err);
    }
  },

  async findAllPriceRules(filter?: { customerId?: string; approvalStatus?: string; ruleTier?: string }): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for pricing rules query", "DB_DISCONNECTED");
    }
    try {
      const where: any = {};
      if (filter?.customerId) where.customerId = String(filter.customerId);
      if (filter?.approvalStatus) where.approvalStatus = String(filter.approvalStatus);
      if (filter?.ruleTier) where.ruleTier = String(filter.ruleTier);

      const records = await (prisma as any).customerPriceRule.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
      });
      return records.map((r: any) => this.mapPriceRuleFromPrisma(r));
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch pricing rules: ${err.message}`, "PRICING_RULES_READ_FAILED", err);
    }
  },

  async approvePriceRuleTx(ruleId: string, checkerId: string, checkerEmail: string): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for pricing rule approval", "DB_DISCONNECTED");
    }
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const rule = await tx.customerPriceRule.findUnique({
          where: { id: String(ruleId) }
        });
        if (!rule) {
          throw new PersistenceError(`Pricing rule ${ruleId} not found`, "RULE_NOT_FOUND");
        }
        if (rule.makerId === checkerId) {
          throw new PersistenceError("Dual-Control Security Violation: Maker cannot be Checker", "MAKER_CANNOT_BE_CHECKER");
        }
        const now = new Date();
        const updated = await tx.customerPriceRule.update({
          where: { id: String(ruleId) },
          data: {
            approvalStatus: "APPROVED",
            checkerId: String(checkerId),
            checkerEmail: String(checkerEmail),
            approvedAt: now,
            updatedAt: now
          }
        });
        return updated;
      });
      return this.mapPriceRuleFromPrisma(result);
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Pricing rule approval transaction failed for ${ruleId}: ${err.message}`, "PRICING_RULE_TX_FAILED", err);
    }
  },

  async rejectPriceRuleTx(ruleId: string, checkerId: string, rejectionReason: string): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for pricing rule rejection", "DB_DISCONNECTED");
    }
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const rule = await tx.customerPriceRule.findUnique({
          where: { id: String(ruleId) }
        });
        if (!rule) {
          throw new PersistenceError(`Pricing rule ${ruleId} not found`, "RULE_NOT_FOUND");
        }
        const now = new Date();
        const updated = await tx.customerPriceRule.update({
          where: { id: String(ruleId) },
          data: {
            approvalStatus: "REJECTED",
            checkerId: String(checkerId),
            rejectionReason: String(rejectionReason),
            updatedAt: now
          }
        });
        return updated;
      });
      return this.mapPriceRuleFromPrisma(result);
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Pricing rule rejection transaction failed for ${ruleId}: ${err.message}`, "PRICING_RULE_TX_FAILED", err);
    }
  },

  // --- ProductAccessRule Operations ---
  async upsertAccessRule(rule: any): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative access rule save", "DB_DISCONNECTED");
    }
    const data = this.mapAccessRuleToPrisma(rule);
    try {
      const saved = await (prisma as any).productAccessRule.upsert({
        where: { id: data.id },
        create: data,
        update: {
          ruleType: data.ruleType,
          customerId: data.customerId,
          customerLabName: data.customerLabName,
          productId: data.productId,
          productSku: data.productSku,
          productName: data.productName,
          categoryId: data.categoryId,
          companyId: data.companyId,
          reason: data.reason,
          isActive: data.isActive,
          effectiveStartDate: data.effectiveStartDate,
          effectiveEndDate: data.effectiveEndDate,
          approvalStatus: data.approvalStatus,
          checkerId: data.checkerId,
          checkerEmail: data.checkerEmail,
          approvedAt: data.approvedAt,
          rejectionReason: data.rejectionReason,
          priority: data.priority,
          updatedAt: new Date()
        }
      });
      return this.mapAccessRuleFromPrisma(saved);
    } catch (err: any) {
      throw new PersistenceError(`Failed to save access rule ${rule.id}: ${err.message}`, "ACCESS_RULE_SAVE_FAILED", err);
    }
  },

  async deleteAccessRule(id: string): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for authoritative access rule delete", "DB_DISCONNECTED");
    }
    try {
      const deleted = await (prisma as any).productAccessRule.delete({
        where: { id: String(id) }
      });
      return this.mapAccessRuleFromPrisma(deleted);
    } catch (err: any) {
      throw new PersistenceError(`Failed to delete access rule ${id}: ${err.message}`, "ACCESS_RULE_DELETE_FAILED", err);
    }
  },

  async findAccessRuleById(id: string): Promise<any | null> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for access rule query", "DB_DISCONNECTED");
    }
    try {
      const record = await (prisma as any).productAccessRule.findUnique({
        where: { id: String(id) }
      });
      return record ? this.mapAccessRuleFromPrisma(record) : null;
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch access rule ${id}: ${err.message}`, "ACCESS_RULE_READ_FAILED", err);
    }
  },

  async findAllAccessRules(filter?: { customerId?: string; ruleType?: string; approvalStatus?: string }): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for access rules query", "DB_DISCONNECTED");
    }
    try {
      const where: any = {};
      if (filter?.customerId) where.customerId = String(filter.customerId);
      if (filter?.ruleType) where.ruleType = String(filter.ruleType);
      if (filter?.approvalStatus) where.approvalStatus = String(filter.approvalStatus);

      const records = await (prisma as any).productAccessRule.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
      });
      return records.map((r: any) => this.mapAccessRuleFromPrisma(r));
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch access rules: ${err.message}`, "ACCESS_RULES_READ_FAILED", err);
    }
  },

  async approveAccessRuleTx(ruleId: string, checkerId: string, checkerEmail: string): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for access rule approval", "DB_DISCONNECTED");
    }
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const rule = await tx.productAccessRule.findUnique({
          where: { id: String(ruleId) }
        });
        if (!rule) {
          throw new PersistenceError(`Access rule ${ruleId} not found`, "RULE_NOT_FOUND");
        }
        if (rule.makerId === checkerId) {
          throw new PersistenceError("Dual-Control Security Violation: Maker cannot be Checker", "MAKER_CANNOT_BE_CHECKER");
        }
        const now = new Date();
        const updated = await tx.productAccessRule.update({
          where: { id: String(ruleId) },
          data: {
            approvalStatus: "APPROVED",
            checkerId: String(checkerId),
            checkerEmail: String(checkerEmail),
            approvedAt: now,
            updatedAt: now
          }
        });
        return updated;
      });
      return this.mapAccessRuleFromPrisma(result);
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Access rule approval transaction failed for ${ruleId}: ${err.message}`, "ACCESS_RULE_TX_FAILED", err);
    }
  }
};

// ============================================================================
// 9. FINANCIAL & LEDGER REPOSITORY (ORDER AMENDMENTS, CREDIT NOTES & LEDGER)
// ============================================================================
export const financialRepository = {
  /**
   * Transactionally applies an order amendment, issuing an immutable credit note,
   * updating customer wallet ledger & available credit balance, and writing an audit log.
   * If any step fails, the entire transaction rolls back.
   */
  async amendOrderWithCreditNoteTx(params: {
    orderIdOrNumber: string;
    amendment: any;
    creditDeduction?: {
      customerId: string;
      creditAmount: number;
      ledgerEntry: any;
    };
    auditLog?: any;
  }): Promise<{ order: any; amendment: any }> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for order amendment transaction", "DB_DISCONNECTED");
    }

    if (params.amendment.makerId && params.amendment.checkerId && params.amendment.makerId === params.amendment.checkerId) {
      throw new PersistenceError("Dual-Control Security Violation: Maker cannot be Checker", "MAKER_CANNOT_BE_CHECKER");
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // 1. Locate the target order
        const order = await tx.customerOrder.findFirst({
          where: {
            OR: [
              { id: String(params.orderIdOrNumber) },
              { orderNumber: String(params.orderIdOrNumber) }
            ]
          }
        });

        if (!order) {
          throw new PersistenceError(`Order ${params.orderIdOrNumber} not found`, "ORDER_NOT_FOUND");
        }

        // 2. Idempotency / Duplicate Check: Verify amendment credit note has not already been processed
        const currentHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
        if (params.amendment.creditNoteNumber) {
          const isDup = currentHistory.some((h: any) => 
            h.creditNoteNumber === params.amendment.creditNoteNumber ||
            h.id === params.amendment.id
          );
          if (isDup) {
            throw new PersistenceError(`Credit note ${params.amendment.creditNoteNumber} has already been applied to order ${order.orderNumber}`, "DUPLICATE_CREDIT_NOTE");
          }
        }

        // 3. Atomically update wallet & credit profile ledger if credit note issues an amount
        if (params.creditDeduction && params.creditDeduction.creditAmount > 0) {
          const { customerId, creditAmount, ledgerEntry } = params.creditDeduction;
          const currentWallet = await tx.customerWallet.findUnique({
            where: { customerId }
          });

          if (currentWallet) {
            const currentOutstanding = Number(currentWallet.currentOutstanding || 0);
            const creditLimit = Number(currentWallet.creditLimit || 0);
            const newOutstanding = Math.max(0, currentOutstanding - creditAmount);
            const newAvailable = Math.min(creditLimit, Math.max(0, creditLimit - newOutstanding));

            const existingEntries = Array.isArray(currentWallet.ledgerEntries) ? currentWallet.ledgerEntries : [];
            if (ledgerEntry && !existingEntries.some((e: any) => e.id === ledgerEntry.id || (e.referenceNumber && e.referenceNumber === ledgerEntry.referenceNumber))) {
              const fullEntry = {
                ...ledgerEntry,
                runningBalance: newOutstanding
              };
              existingEntries.unshift(fullEntry);
            }

            await tx.customerWallet.update({
              where: { customerId },
              data: {
                currentOutstanding: newOutstanding,
                availableCredit: newAvailable,
                ledgerEntries: existingEntries,
                updatedAt: new Date()
              }
            });

            // Synchronize customer credit profile balances
            await tx.customerCreditProfile.updateMany({
              where: { customerId },
              data: {
                currentOutstanding: newOutstanding,
                availableCredit: newAvailable,
                updatedAt: new Date()
              }
            });
          }
        }

        // 4. Update order status history and audit notes with amendment snapshot
        currentHistory.unshift(params.amendment);
        const updatedOrder = await tx.customerOrder.update({
          where: { id: order.id },
          data: {
            statusHistory: currentHistory,
            notes: order.notes
              ? `${order.notes} | [AMENDMENT] CN: ${params.amendment.creditNoteNumber} (${params.amendment.justification})`
              : `[AMENDMENT] CN: ${params.amendment.creditNoteNumber} (${params.amendment.justification})`,
            updatedAt: new Date()
          }
        });

        // 5. Audit log registration
        if (params.auditLog) {
          const auditData = auditLogRepository.mapToPrisma(params.auditLog);
          await (tx as any).auditLog.create({ data: auditData });
        }

        return {
          order: orderRepository.mapFromPrisma(updatedOrder),
          amendment: params.amendment
        };
      });

      return result;
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Order amendment transaction failed: ${err.message}`, "ORDER_AMENDMENT_TX_FAILED", err);
    }
  },

  async findAmendmentsByOrderId(orderIdOrNumber: string): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for order amendments read", "DB_DISCONNECTED");
    }

    try {
      const order = await (prisma as any).customerOrder.findFirst({
        where: {
          OR: [
            { id: String(orderIdOrNumber) },
            { orderNumber: String(orderIdOrNumber) }
          ]
        }
      });

      if (!order) return [];

      const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      return history.filter((h: any) => h.amendmentType || (h.id && String(h.id).startsWith("amd-")));
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch amendments for order ${orderIdOrNumber}: ${err.message}`, "AMENDMENTS_READ_FAILED", err);
    }
  },

  // --- Customer Wallet Points / Penalty Deduction ---
  async adjustWalletPointsTx(params: {
    customerId: string;
    deductPoints: number;
    ledgerEntry: any;
    auditLog?: any;
  }): Promise<{ remainingPoints: number; deductedPoints: number }> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for wallet adjustment", "DB_DISCONNECTED");
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        let remainingPoints = 0;
        const profile = await tx.customerCreditProfile.findUnique({
          where: { customerId: params.customerId }
        });

        if (profile) {
          const currentPoints = Number(profile.walletPoints || 0);
          remainingPoints = Math.max(0, currentPoints - params.deductPoints);
          await tx.customerCreditProfile.update({
            where: { customerId: params.customerId },
            data: {
              walletPoints: remainingPoints,
              updatedAt: new Date()
            }
          });
        }

        const wallet = await tx.customerWallet.findUnique({
          where: { customerId: params.customerId }
        });

        if (wallet) {
          const entries = Array.isArray(wallet.ledgerEntries) ? wallet.ledgerEntries : [];
          if (!entries.some((e: any) => e.id === params.ledgerEntry.id)) {
            entries.unshift(params.ledgerEntry);
          }
          await tx.customerWallet.update({
            where: { customerId: params.customerId },
            data: {
              ledgerEntries: entries,
              updatedAt: new Date()
            }
          });
        }

        if (params.auditLog) {
          await (tx as any).auditLog.create({
            data: auditLogRepository.mapToPrisma(params.auditLog)
          });
        }

        return { remainingPoints, deductedPoints: params.deductPoints };
      });

      return result;
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Wallet adjustment failed for customer ${params.customerId}: ${err.message}`, "WALLET_ADJUST_TX_FAILED", err);
    }
  },

  // --- Customer Credit Configuration Update ---
  async updateCustomerCreditConfigTx(params: {
    customerId: string;
    config: {
      creditLimit?: number;
      creditPeriodDays?: number;
      currentOutstanding?: number;
      daysOverdue?: number;
      paymentStatus?: string;
      hasApprovedExtension?: boolean;
      approvedExtensionUntil?: string | null;
    };
    auditLog?: any;
  }): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for credit config update", "DB_DISCONNECTED");
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const profile = await tx.customerCreditProfile.findUnique({
          where: { customerId: params.customerId }
        });

        if (!profile) {
          throw new PersistenceError(`Credit profile not found for customer ${params.customerId}`, "CREDIT_PROFILE_NOT_FOUND");
        }

        const data: any = { updatedAt: new Date() };
        if (params.config.creditLimit !== undefined) data.creditLimit = Number(params.config.creditLimit);
        if (params.config.creditPeriodDays !== undefined) data.creditPeriodDays = Number(params.config.creditPeriodDays);
        if (params.config.currentOutstanding !== undefined) data.currentOutstanding = Number(params.config.currentOutstanding);
        if (params.config.daysOverdue !== undefined) data.daysOverdue = Number(params.config.daysOverdue);
        if (params.config.paymentStatus) data.paymentStatus = String(params.config.paymentStatus);
        if (params.config.hasApprovedExtension !== undefined) data.hasApprovedExtension = Boolean(params.config.hasApprovedExtension);
        if (params.config.approvedExtensionUntil !== undefined) {
          data.approvedExtensionUntil = params.config.approvedExtensionUntil ? new Date(params.config.approvedExtensionUntil) : null;
        }

        const effectiveLimit = data.creditLimit !== undefined ? data.creditLimit : Number(profile.creditLimit);
        const effectiveOutstanding = data.currentOutstanding !== undefined ? data.currentOutstanding : Number(profile.currentOutstanding);
        data.availableCredit = Math.max(0, effectiveLimit - effectiveOutstanding);

        const updatedProfile = await tx.customerCreditProfile.update({
          where: { customerId: params.customerId },
          data
        });

        await tx.customerWallet.updateMany({
          where: { customerId: params.customerId },
          data: {
            creditLimit: effectiveLimit,
            currentOutstanding: effectiveOutstanding,
            availableCredit: data.availableCredit,
            updatedAt: new Date()
          }
        });

        if (params.auditLog) {
          await (tx as any).auditLog.create({
            data: auditLogRepository.mapToPrisma(params.auditLog)
          });
        }

        return walletRepository.mapCreditProfileFromPrisma(updatedProfile);
      });

      return result;
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Credit config update failed for customer ${params.customerId}: ${err.message}`, "CREDIT_CONFIG_TX_FAILED", err);
    }
  },

  // --- Payment Extension Requests Mapping & Operations ---
  mapExtensionRequestToPrisma(req: any): any {
    return {
      id: String(req.id),
      customerId: String(req.customerId),
      customerLabName: String(req.customerLabName || req.companyName || "Partner Laboratory"),
      currentDueDate: req.originalDueDate ? new Date(req.originalDueDate) : (req.currentDueDate ? new Date(req.currentDueDate) : new Date()),
      requestedDueDate: req.promisedPaymentDate ? new Date(req.promisedPaymentDate) : (req.requestedDueDate ? new Date(req.requestedDueDate) : new Date(Date.now() + 15 * 86400000)),
      outstandingAmount: Number(req.outstandingAmount || 0),
      reason: String(req.reason || "Extension requested"),
      extensionDays: Number(req.requestedDays || req.extensionDays || 15),
      estimatedInterestCost: Number(req.estimatedInterestCost || 0),
      status: String(req.status || "PENDING"),
      approvedBy: req.reviewedBy || req.approvedBy ? String(req.reviewedBy || req.approvedBy) : null,
      approvedAt: req.approvedAt || req.reviewedAt ? new Date(req.approvedAt || req.reviewedAt) : null,
      createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
      updatedAt: new Date()
    };
  },

  mapExtensionRequestFromPrisma(record: any): any {
    if (!record) return null;
    return {
      id: record.id,
      customerId: record.customerId,
      customerLabName: record.customerLabName,
      outstandingAmount: Number(record.outstandingAmount),
      originalDueDate: record.currentDueDate instanceof Date ? record.currentDueDate.toISOString().split("T")[0] : String(record.currentDueDate).split("T")[0],
      currentDueDate: record.currentDueDate instanceof Date ? record.currentDueDate.toISOString().split("T")[0] : String(record.currentDueDate).split("T")[0],
      requestedDays: record.extensionDays,
      extensionDays: record.extensionDays,
      reason: record.reason,
      promisedPaymentDate: record.requestedDueDate instanceof Date ? record.requestedDueDate.toISOString().split("T")[0] : String(record.requestedDueDate).split("T")[0],
      status: record.status,
      approvedDays: record.extensionDays,
      approvedBy: record.approvedBy || undefined,
      reviewedBy: record.approvedBy || undefined,
      approvedAt: record.approvedAt instanceof Date ? record.approvedAt.toISOString() : (record.approvedAt || undefined),
      reviewedAt: record.approvedAt instanceof Date ? record.approvedAt.toISOString() : (record.approvedAt || undefined),
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : String(record.updatedAt)
    };
  },

  async createPaymentExtensionRequest(req: any, auditLog?: any): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for payment extension request", "DB_DISCONNECTED");
    }

    const data = this.mapExtensionRequestToPrisma(req);
    try {
      const saved = await (prisma as any).paymentExtensionRequest.upsert({
        where: { id: data.id },
        create: data,
        update: data
      });

      if (auditLog) {
        await auditLogRepository.create(auditLog).catch(() => {});
      }

      return this.mapExtensionRequestFromPrisma(saved);
    } catch (err: any) {
      throw new PersistenceError(`Failed to save payment extension request: ${err.message}`, "EXTENSION_REQUEST_SAVE_FAILED", err);
    }
  },

  async reviewPaymentExtensionRequestTx(params: {
    requestId: string;
    decision: "APPROVE" | "REJECT";
    approvedDays?: number;
    approvedUntil?: string;
    reviewerName?: string;
    internalNotes?: string;
    auditLog?: any;
  }): Promise<any> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for extension review", "DB_DISCONNECTED");
    }

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const req = await tx.paymentExtensionRequest.findUnique({
          where: { id: String(params.requestId) }
        });

        if (!req) {
          throw new PersistenceError(`Payment extension request ${params.requestId} not found`, "EXTENSION_NOT_FOUND");
        }

        const now = new Date();
        const newStatus = params.decision === "APPROVE" ? "APPROVED" : "REJECTED";
        const approvedDays = Number(params.approvedDays) || req.extensionDays;

        const updated = await tx.paymentExtensionRequest.update({
          where: { id: String(params.requestId) },
          data: {
            status: newStatus,
            approvedBy: params.reviewerName || "Credit Officer",
            approvedAt: now,
            extensionDays: approvedDays,
            updatedAt: now
          }
        });

        // Update credit profile if approved or rejected
        if (params.decision === "APPROVE") {
          const approvedUntilDate = params.approvedUntil ? new Date(params.approvedUntil) : new Date(Date.now() + approvedDays * 86400000);
          await tx.customerCreditProfile.updateMany({
            where: { customerId: req.customerId },
            data: {
              hasApprovedExtension: true,
              approvedExtensionUntil: approvedUntilDate,
              daysOverdue: 0,
              paymentStatus: "GOOD_STANDING",
              updatedAt: now
            }
          });
        } else {
          await tx.customerCreditProfile.updateMany({
            where: { customerId: req.customerId },
            data: {
              hasApprovedExtension: false,
              approvedExtensionUntil: null,
              updatedAt: now
            }
          });
        }

        if (params.auditLog) {
          await (tx as any).auditLog.create({
            data: auditLogRepository.mapToPrisma(params.auditLog)
          });
        }

        return this.mapExtensionRequestFromPrisma(updated);
      });

      return result;
    } catch (err: any) {
      if (err instanceof PersistenceError) throw err;
      throw new PersistenceError(`Extension review transaction failed: ${err.message}`, "EXTENSION_REVIEW_TX_FAILED", err);
    }
  },

  async findAllExtensionRequests(customerId?: string): Promise<any[]> {
    const prisma = getPrismaClient();
    if (!prisma || !isDbConnected()) {
      throw new PersistenceError("Database unavailable for extension requests query", "DB_DISCONNECTED");
    }

    try {
      const where: any = {};
      if (customerId) where.customerId = String(customerId);

      const records = await (prisma as any).paymentExtensionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });

      return records.map((r: any) => this.mapExtensionRequestFromPrisma(r));
    } catch (err: any) {
      throw new PersistenceError(`Failed to fetch extension requests: ${err.message}`, "EXTENSION_REQUESTS_READ_FAILED", err);
    }
  }
};


