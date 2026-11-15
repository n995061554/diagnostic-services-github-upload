/**
 * Diagnostic Services — Secure Initial Administrator Bootstrap Script
 *
 * Requirements & Invariants:
 * 1. Requires TARGET_ENVIRONMENT=staging; refuses production-looking database hosts or names.
 * 2. Strictly refuses localhost / loopback URLs to protect the local customer database.
 * 3. Connects to PostgreSQL using Prisma Client with transaction-level advisory locking.
 * 4. Serializes first-admin bootstrap attempts via `pg_advisory_xact_lock`.
 * 5. Enforces that no SUPER_ADMIN already exists (atomic transaction).
 * 6. Requires DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD at runtime.
 * 7. Validates high-entropy password policy (min 14 chars, upper, lower, digit, special char).
 * 8. Hashes password using project-standard bcryptjs (work factor 10).
 * 9. Sets mustChangePassword: true (strictly enforced by authenticateJwt in server.ts).
 * 10. Sanitizes all error messages to ensure credentials and connection URLs are never exposed.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

/**
 * Sanitizes error strings to prevent leaking database credentials or connection strings.
 */
function sanitizeError(error) {
  if (!error) return 'Unknown error occurred.';
  const rawMessage = typeof error === 'string' ? error : (error.message || String(error));
  let sanitized = rawMessage.replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, '$1***:***@');
  sanitized = sanitized.replace(/(password=)[^&\s]+/gi, '$1***');
  sanitized = sanitized.replace(/(pwd=)[^&\s]+/gi, '$1***');
  return sanitized;
}

// 1. Validate TARGET_ENVIRONMENT is explicitly set to 'staging'
const targetEnv = (process.env.TARGET_ENVIRONMENT || '').trim().toLowerCase();
if (targetEnv !== 'staging') {
  console.error('[SECURITY ERROR] Script requires TARGET_ENVIRONMENT=staging to run.');
  console.error('Refusing execution to protect unintended or production environments.');
  process.exit(1);
}

// 2. Validate DATABASE_URL presence and strictly reject localhost / loopback targets
const databaseUrl = (process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('[BOOTSTRAP ERROR] Missing mandatory environment variable: DATABASE_URL.');
  console.error('Provide the remote staging PostgreSQL connection string in the environment.');
  process.exit(1);
}

const lowerDbUrl = databaseUrl.toLowerCase();
if (
  lowerDbUrl.includes('localhost') ||
  lowerDbUrl.includes('127.0.0.1') ||
  lowerDbUrl.includes('::1') ||
  lowerDbUrl.includes('.local')
) {
  console.error('[SECURITY INVARIANT VIOLATION] DATABASE_URL targets localhost or a loopback address.');
  console.error('This script is strictly forbidden from executing against local databases to protect customer data.');
  console.error('Execution halted.');
  process.exit(1);
}

// 3. Reject production-looking hosts or database names
const prodKeywords = ['prod', 'production'];
try {
  const parsedUrl = new URL(databaseUrl);
  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();

  const isProdHost = prodKeywords.some((kw) => hostname.includes(kw));
  const isProdDb = prodKeywords.some((kw) => pathname.includes(kw));

  if (isProdHost || isProdDb) {
    console.error('[SECURITY ERROR] DATABASE_URL targets a production database host or database name.');
    console.error('Execution halted to protect production environments.');
    process.exit(1);
  }
} catch {
  const lowerUrl = databaseUrl.toLowerCase().replace(/:\/\/[^@]+@/, '://');
  if (prodKeywords.some((kw) => lowerUrl.includes(kw))) {
    console.error('[SECURITY ERROR] DATABASE_URL targets a production database host or database name.');
    console.error('Execution halted to protect production environments.');
    process.exit(1);
  }
}

// 4. Validate BOOTSTRAP_ADMIN_EMAIL
const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
if (!email) {
  console.error('[BOOTSTRAP ERROR] Missing mandatory environment variable: BOOTSTRAP_ADMIN_EMAIL.');
  process.exit(1);
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('[BOOTSTRAP ERROR] BOOTSTRAP_ADMIN_EMAIL is not a valid email address.');
  process.exit(1);
}

// 5. Validate BOOTSTRAP_ADMIN_PASSWORD
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
if (!password) {
  console.error('[BOOTSTRAP ERROR] Missing mandatory environment variable: BOOTSTRAP_ADMIN_PASSWORD.');
  console.error('Supply a high-entropy password (min 14 chars, upper, lower, digit, special character).');
  process.exit(1);
}

function validatePasswordPolicy(pwd) {
  if (pwd.length < 14) return 'Password must be at least 14 characters in length.';
  if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(pwd)) return 'Password must contain at least one numerical digit.';
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must contain at least one special character.';

  const lower = pwd.toLowerCase();
  const forbidden = ['password', 'admin', 'diagnostics', 'a2zsecure', 'changeme', 'default'];
  for (const word of forbidden) {
    if (lower.includes(word)) {
      return `Password must not contain common or predictable dictionary words ("${word}").`;
    }
  }
  return null;
}

const policyError = validatePasswordPolicy(password);
if (policyError) {
  console.error(`[BOOTSTRAP ERROR] Insecure password: ${policyError}`);
  process.exit(1);
}

// Optional metadata overrides
const username = (process.env.BOOTSTRAP_ADMIN_USERNAME || 'superadmin').trim().toLowerCase();
const firstName = (process.env.BOOTSTRAP_ADMIN_FIRST_NAME || 'System').trim();
const lastName = (process.env.BOOTSTRAP_ADMIN_LAST_NAME || 'Administrator').trim();

async function runBootstrap() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  });

  try {
    console.log('[BOOTSTRAP] Connecting to database...');

    // Execute inside an atomic transaction with an advisory lock to serialize concurrent executions
    const createdUser = await prisma.$transaction(async (tx) => {
      // Transaction-scoped advisory lock serializes concurrent bootstrap attempts
      await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock(hashtext('diagnostic_services_bootstrap_lock'));`);

      // Check 1: Refuse if any SUPER_ADMIN already exists
      const existingAdmin = await tx.user.findFirst({
        where: { roleType: 'SUPER_ADMIN' },
        select: { id: true, email: true, createdAt: true }
      });

      if (existingAdmin) {
        throw new Error('A Super Admin already exists in this database. Bootstrap refused to prevent duplicate administration.');
      }

      // Check 2: Refuse if specified email is already in use
      const existingEmail = await tx.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingEmail) {
        throw new Error(`An account with email "${email}" already exists. Bootstrap refused.`);
      }

      // Hash password using project standard bcryptjs (work factor 10)
      const passwordHash = bcrypt.hashSync(password, 10);
      const userId = `u-admin-${Date.now()}`;

      // Insert new Super Admin
      return await tx.user.create({
        data: {
          id: userId,
          username: username,
          email: email,
          passwordHash: passwordHash,
          firstName: firstName,
          lastName: lastName,
          roleType: 'SUPER_ADMIN',
          status: 'ACTIVE',
          dataScope: 'ALL',
          isEmailVerified: true,
          isPhoneVerified: true,
          mustChangePassword: true,
          failedLoginAttempts: 0
        },
        select: {
          id: true,
          email: true,
          username: true,
          roleType: true,
          status: true,
          dataScope: true,
          mustChangePassword: true,
          createdAt: true
        }
      });
    });

    console.log('================================================================');
    console.log('[BOOTSTRAP SUCCESS] First Super Admin provisioned successfully.');
    console.log(`  - User ID:              ${createdUser.id}`);
    console.log(`  - Email:                ${createdUser.email}`);
    console.log(`  - Username:             ${createdUser.username}`);
    console.log(`  - Role:                 ${createdUser.roleType}`);
    console.log(`  - Status:               ${createdUser.status}`);
    console.log(`  - Scope:                ${createdUser.dataScope}`);
    console.log(`  - Must Change Password: ${createdUser.mustChangePassword}`);
    console.log(`  - Created At:           ${createdUser.createdAt.toISOString()}`);
    console.log('================================================================');
    console.log('Password has been securely hashed and stored. No secrets were printed.');
  } catch (err) {
    console.error('================================================================');
    console.error(`[BOOTSTRAP ABORTED] ${sanitizeError(err)}`);
    console.error('================================================================');
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (discErr) {
      console.error(`[BOOTSTRAP WARNING] Disconnect error: ${sanitizeError(discErr)}`);
    }
  }
}

runBootstrap();
