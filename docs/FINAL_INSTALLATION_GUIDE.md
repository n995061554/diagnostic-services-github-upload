# Diagnostic Services — Final Installation, Deployment & Operations Guide

**System:** Diagnostic Services Enterprise Platform  
**Target Environment:** Staging & Production Deployment  
**Document Version:** 1.0.0 (Release Candidate)  
**Date:** October 16, 2026  

---

## 1. System Architecture Overview

Diagnostic Services is a specialized healthcare diagnostics enterprise platform comprising:
1. **Authoritative Node.js/Express Backend** with transactional dual-persistence (PostgreSQL authoritative tier via Prisma ORM + resilient disk state fallback).
2. **React 19 Single Page Application (SPA)** client portal for laboratory ordering, financial ledger review, product discovery, and bulk catalog management.
3. **Flutter / Android Mobile Application** for biomedical equipment health telemetry, field service ticketing, and customer laboratory orders.

---

## 2. Infrastructure & System Prerequisites

### 2.1 Server Host Hardware
* **CPU:** Minimum 2 vCPUs (4+ recommended for production).
* **RAM:** Minimum 4 GB (8+ GB recommended for concurrent catalog queries and bulk imports).
* **Disk:** Minimum 20 GB SSD storage with automated snapshot backups.
* **Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) or Windows Server 2022.

### 2.2 Software Runtimes
* **Node.js:** `v20.x` LTS or `v22.x` LTS (validated up to `v24.x`).
* **npm:** `v10.x` or higher.
* **PostgreSQL:** `v14.x`, `v15.x`, or `v16.x` (AWS RDS, Google Cloud SQL, Supabase, or self-hosted).
* **Flutter SDK (for Mobile):** `v3.24.x` or higher with Android SDK Platform 34.

---

## 3. Environment Configuration & Secret Management

### 3.1 Setup Environment File
Copy the provided `.env.example` template to `.env`:
```bash
cp .env.example .env
chmod 600 .env
```

### 3.2 Mandatory Environment Variables

| Variable | Staging / Development | Production | Security Requirement |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` / `staging` | `production` | Enables strict secret checks, disables debug OTPs and test endpoints. |
| `PORT` | `3000` | `3000` (or reverse-proxy upstream) | Port for Node.js HTTP listener. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://10.0.2.2:3000` | `https://app.diagnosticservices.com,https://admin.diagnosticservices.com` | Strict allowlist; wildcards (`*`) and unknown browser origins are rejected. |
| `JWT_SECRET` | 32+ characters | 64+ random hex characters | Minimum 32 chars. Repository defaults strictly rejected in production. |
| `JWT_REFRESH_SECRET` | 32+ characters | 64+ random hex characters | Must be distinct from `JWT_SECRET`. |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | `15m` | Short-lived access tokens. |
| `JWT_REFRESH_EXPIRES_IN`| `7d` | `7d` | Refresh session window. |
| `ALLOW_SIMULATED_OTP` | `true` (dev only) | `false` | Must be `false` in production. Completely suppresses `debugOtp` generation. |
| `DATABASE_URL` | Staging PostgreSQL connection string | Production PostgreSQL connection string | Format: `postgresql://user:pass@host:5432/db?schema=public&sslmode=prefer` |
| `PRISMA_STRICT_MODE` | `false` | `true` | When `true`, server halts with exit code 1 if PostgreSQL is unreachable at startup. |
| `PAYMENT_PROVIDER_SECRET`| Test gateway key | Live gateway secret (Razorpay/Stripe) | Server-side only; min 16 characters. |
| `PAYMENT_WEBHOOK_SECRET` | Test webhook secret | Live webhook signing secret | Verifies incoming payment webhooks. |
| `NOTIFICATION_SERVICE_SECRET`| Test SMS key | Live SMS gateway key (MSG91/Twilio) | Dispatches verified SMS OTPs. |
| `STORAGE_SERVICE_SECRET` | Test storage key | Live S3/GCS service account key | Cloud document storage. |

> [!IMPORTANT]
> In production (`NODE_ENV=production`), the application automatically runs startup secret validation. If any secret is missing, shorter than the required minimum length, or matches a known repository default, startup will immediately abort with exit code `1`.

---

## 4. Database Provisioning & Schema Migration

### 4.1 PostgreSQL Database Preparation
Create a dedicated database and user with appropriate permissions:
```sql
CREATE USER diagnostic_app WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
CREATE DATABASE diagnostic_services OWNER diagnostic_app;
GRANT ALL PRIVILEGES ON DATABASE diagnostic_services TO diagnostic_app;
```

### 4.2 Canonical Schema Migration
Deploy the canonical database schema using Prisma:
```bash
# Verify schema syntax without connecting
npx prisma validate --schema=prisma/canonical_schema.prisma

# Push or migrate canonical schema to PostgreSQL
npx prisma db push --schema=prisma/canonical_schema.prisma

# Generate Prisma Client
npx prisma generate --schema=prisma/canonical_schema.prisma
```

> [!NOTE]
> The staging bulk-import tables defined in `prisma/staging_draft_schema.prisma` are reviewable staging drafts. They must be reviewed and merged into the canonical schema before deploying automated background staging tables. The canonical tables (`User`, `CustomerOrder`, `CustomerEquipment`, `ServiceTicket`, `CustomerPriceRule`, etc.) are completely self-sufficient for authoritative operations.

---

## 5. Backend Server Build & Execution

### 5.1 Installation & Typecheck
```bash
# Install exact production dependencies
npm ci

# Verify TypeScript type safety
npm run lint
```

### 5.2 Build Production Bundle
```bash
# Builds frontend assets and bundles server to dist/server.cjs
npm run build
```

The build produces:
* `dist/index.html` & `dist/assets/*` — Optimized React 19 frontend bundle.
* `dist/server.cjs` — Self-contained bundled Node.js backend.

### 5.3 Process Management (PM2 Example)
Create an `ecosystem.config.cjs` file for production process supervision:
```javascript
module.exports = {
  apps: [{
    name: "diagnostic-backend",
    script: "dist/server.cjs",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    kill_timeout: 10000,
    listen_timeout: 10000
  }]
};
```

Start the service:
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 5.4 Docker Container Deployment (Alternative)
A standard multi-stage Docker build:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/data ./data
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## 6. Reverse Proxy Configuration (Nginx)

Place Nginx in front of Node.js for SSL termination, compression, and request routing:
```nginx
server {
    listen 80;
    server_name app.diagnosticservices.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.diagnosticservices.com;

    ssl_certificate /etc/letsencrypt/live/app.diagnosticservices.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.diagnosticservices.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 25M;
    }
}
```

---

## 7. Mobile Application Build & Signing (Flutter / Android)

### 7.1 Keystore Preparation
Generate an upload signing key for the Android release:
```bash
keytool -genkey -v -keystore mobile/android/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias diagnostic_services_release
```

### 7.2 Configure `key.properties`
Copy `mobile/android/key.properties.example` to `mobile/android/key.properties`:
```properties
keyAlias=diagnostic_services_release
keyPassword=YOUR_KEY_PASSWORD
storeFile=upload-keystore.jks
storePassword=YOUR_STORE_PASSWORD
```

### 7.3 Build Release APK & App Bundle
```bash
cd mobile

# Install dependencies
flutter pub get

# Build production Android App Bundle (AAB) for Google Play
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://app.diagnosticservices.com

# Build standalone release APK for staging testing
flutter build apk --release \
  --dart-define=API_BASE_URL=https://app.diagnosticservices.com
```

> [!IMPORTANT]
> The mobile application enforces HTTPS in release mode (`AppConfig.dart`) and prohibits cleartext traffic (`android:usesCleartextTraffic="false"`). Release builds cannot connect to insecure `http://` endpoints.

---

## 8. Post-Deployment Smoke Verification Checklist

After deployment, perform these mandatory verification checks:

1. **System Health & Persistence Check:**
   ```bash
   curl -i https://app.diagnosticservices.com/api/v1/health
   # Must return HTTP 200 with persistenceMode and database connection status
   ```

2. **Unauthenticated Access Guard:**
   ```bash
   curl -i https://app.diagnosticservices.com/api/v1/customer/orders
   # Must return HTTP 401 UNAUTHORIZED
   curl -i https://app.diagnosticservices.com/api/v1/service/tickets
   # Must return HTTP 401 UNAUTHORIZED
   ```

3. **Public Catalog Pricing Isolation:**
   ```bash
   curl -i https://app.diagnosticservices.com/api/v1/customer/products
   # Must return HTTP 200 with standard MRP/base pricing; customerIdUsed must be empty
   curl -i "https://app.diagnosticservices.com/api/v1/customer/products?customerId=u-cust-01"
   # Must NOT return customer contract discounts without valid JWT authentication
   ```

4. **Production Test Endpoint Guard:**
   ```bash
   curl -i -X POST https://app.diagnosticservices.com/api/v1/customer/test/reset-seed-financials
   # Must return HTTP 404 NOT_FOUND in production
   ```

5. **Graceful Shutdown Test:**
   ```bash
   # Send SIGTERM to the application process
   kill -15 <PID>
   # Verify server logs report:
   # "[Server] SIGTERM received. Closing HTTP server instance..."
   # "[PrismaClient] Disconnecting Prisma Client connection..."
   # "[Server] Graceful shutdown completed. Exiting cleanly."
   ```

---

## 9. Rollback & Disaster Recovery Procedures

### 9.1 Immediate Service Rollback
In the event of an unresolvable staging or production regression:
1. Revert web server to previous release directory:
   ```bash
   pm2 restart diagnostic-backend-previous
   ```
2. If database schema was pushed and must be restored, restore from the pre-deployment database snapshot:
   ```bash
   pg_restore -U diagnostic_app -d diagnostic_services /backups/pre_deployment_snapshot.dump
   ```
3. In local or disconnected environments, the persistent disk store (`server/persistence/stateStore.json` or `data/persistence_store.json`) can be restored from the pre-deployment backups created in `backups/backup_20261016_final_launch/`.

---

## 10. Exact Owner Actions Needed for Staging & Production

To progress the application from its current verified status (**READY FOR CONTROLLED STAGING**) to **LIVE PRODUCTION**, the platform owner must execute the following actions in order:

### 10.1 PostgreSQL Database Provisioning & Migration
1. **Provision Staging Database:** Deploy a managed PostgreSQL 14+ instance (AWS RDS, Google Cloud SQL, Supabase, or dedicated VPS).
2. **Apply Canonical Schema:**
   ```bash
   # Run the unified baseline SQL migration
   psql -U diagnostic_app -d diagnostic_services -f prisma/canonical_baseline_migration.sql

   # Point runtime client to the canonical schema
   npx prisma generate --schema=prisma/canonical_schema.prisma
   ```
3. **Execute Live DB Verification:** Set `DATABASE_URL` in `.env` and execute `node scratch/test_phase4h_real_postgres.cjs` to confirm transactional rollbacks and dual-persistence consistency.

### 10.2 HTTPS Hosting & Reverse Proxy
1. **Provision Linux Web Host:** Ubuntu 22.04 LTS or Debian 12 with Nginx / Caddy.
2. **Issue SSL/TLS Certificates:** Use Let's Encrypt / Certbot for automated TLS 1.3 certificates.
3. **Configure Nginx Reverse Proxy:**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name app.diagnosticservices.com api.diagnosticservices.com;

       ssl_certificate /etc/letsencrypt/live/diagnosticservices.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/diagnosticservices.com/privkey.pem;

       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-Frame-Options "SAMEORIGIN" always;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto https;
       }
   }
   ```

### 10.3 SMS & Payment Gateway Setup
1. **SMS Provider Setup:** Obtain an API key from an authorized enterprise gateway (e.g. MSG91, Twilio). Populate `NOTIFICATION_SERVICE_SECRET` in `.env`.
2. **Payment Gateway Setup:** Obtain live API keys and webhook signing secret from Razorpay or Stripe.
   - Populate `PAYMENT_PROVIDER_SECRET` and `PAYMENT_WEBHOOK_SECRET` in `.env`.
   - In the provider dashboard, configure the webhook endpoint: `https://api.diagnosticservices.com/api/v1/payments/webhook`.

### 10.4 DNS & Domain Configuration
1. Configure authoritative DNS records at your registrar / Cloudflare:
   - `A app.diagnosticservices.com` -> `<Web Server Public IP>`
   - `A api.diagnosticservices.com` -> `<Web Server Public IP>`
2. Configure `.env`:
   ```bash
   CORS_ALLOWED_ORIGINS=https://app.diagnosticservices.com,https://api.diagnosticservices.com
   ```

### 10.5 Backup Restoration Dry-Run Test
Before sending live customer traffic:
1. Generate an initial state dump:
   ```bash
   pg_dump -Fc -U diagnostic_app -d diagnostic_services > backups/initial_staging_backup.dump
   ```
2. Restore to an isolated test database to verify 100% recovery without data loss:
   ```bash
   createdb -U diagnostic_app diagnostic_services_restore_test
   pg_restore -U diagnostic_app -d diagnostic_services_restore_test backups/initial_staging_backup.dump
   ```

### 10.6 Android Keystore & Physical Device Verification
1. **Verified Toolchain on Host:** Flutter 3.47.6 is available at `D:\flutter_windows_3.47.6-stable\flutter\bin\flutter.bat` and Android SDK at `C:\Users\Lenovo\AppData\Local\Android\Sdk`. Debug compilation has already been validated, producing `mobile/build/app/outputs/flutter-apk/app-debug.apk` (158 MB).
2. **Generate Production Keystore (When Ready for Launch):**
   ```bash
   keytool -genkey -v -keystore mobile/android/app/upload-keystore.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias diagnostic_services_release
   ```
3. **Configure Keystore Secrets:** Copy `mobile/android/key.properties.example` to `mobile/android/key.properties` and populate credentials. Ensure this file is never committed to Git.
4. **Compile Production Artifacts:**
   ```bash
   cd mobile
   flutter analyze
   flutter test
   flutter build appbundle --release
   flutter build apk --release
   ```
   *(Note for Windows hosts with pub cache on C: and workspace on D:, ensure `kotlin.incremental=false` is set in `mobile/android/gradle.properties`)*.
5. **Physical Device Verification:** Install the APK on a physical Android 13/14 device. Verify:
   - Camera barcode scanner on reagents and blood collection tubes.
   - Offline ticket drafting and automatic sync when network reconnects.
   - Biometric login and session termination.
   - HTTPS API calls strictly routed to `https://api.diagnosticservices.com`.


