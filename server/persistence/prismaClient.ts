import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;
let isPrismaConnected = false;

/**
 * Returns the singleton PrismaClient instance if DATABASE_URL is configured.
 */
export function getPrismaClient(): PrismaClient | null {
  if (!prisma && process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    try {
      prisma = new PrismaClient({
        log: ["warn", "error"]
      });
    } catch (err) {
      console.warn("[Prisma] Failed to instantiate PrismaClient:", err);
      prisma = null;
    }
  }
  return prisma;
}

/**
 * Tests connection to PostgreSQL via Prisma.
 */
export async function connectPrisma(): Promise<boolean> {
  const client = getPrismaClient();
  if (!client) {
    isPrismaConnected = false;
    return false;
  }
  try {
    await client.$connect();
    // Test basic query to ensure connection is live
    await client.$queryRaw`SELECT 1 as connected`;
    isPrismaConnected = true;
    console.log("[Prisma] Successfully verified PostgreSQL database connection.");
    return true;
  } catch (err: any) {
    isPrismaConnected = false;
    console.warn("[Prisma] PostgreSQL connection not active:", err?.message || err);
    return false;
  }
}

/**
 * Returns whether PostgreSQL is actively connected through Prisma.
 */
export function isDbConnected(): boolean {
  return isPrismaConnected;
}

/**
 * Safely disconnects the PrismaClient instance during server shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    try {
      await prisma.$disconnect();
      isPrismaConnected = false;
      console.log("[Prisma] Database connection closed cleanly.");
    } catch (err: any) {
      console.warn("[Prisma] Error during database disconnection:", err?.message || err);
    }
  }
}

