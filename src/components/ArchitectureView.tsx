import React, { useState } from 'react';
import { 
  Server, 
  Smartphone, 
  Database, 
  Shield, 
  Lock, 
  FolderTree, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Code,
  FileText,
  Key,
  Globe,
  Check
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeSubSection, setActiveSubSection] = useState<'diagram' | 'monorepo' | 'auth_flow' | 'security' | 'plan' | 'pipeline'>('diagram');

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#22381E] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#22381E] rounded flex items-center justify-center text-xs font-bold">01</span>
              <span>Architecture & Monorepo Topology</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Enterprise System Architecture & Monorepo Blueprint
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Diagnostic Products, Reagents, Equipment & Consumables Multi-Platform Distribution Architecture.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSubSection('diagram')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSubSection === 'diagram' ? 'bg-white text-[#22381E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Topology Diagram
            </button>
            <button
              onClick={() => setActiveSubSection('monorepo')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSubSection === 'monorepo' ? 'bg-white text-[#22381E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Monorepo Structure
            </button>
            <button
              onClick={() => setActiveSubSection('auth_flow')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSubSection === 'auth_flow' ? 'bg-white text-[#22381E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Auth Flow & JWT
            </button>
            <button
              onClick={() => setActiveSubSection('security')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSubSection === 'security' ? 'bg-white text-[#22381E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. API Security Strategy
            </button>
            <button
              onClick={() => setActiveSubSection('plan')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSubSection === 'plan' ? 'bg-white text-[#22381E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5. Enterprise System Roadmap
            </button>
            <button
              onClick={() => setActiveSubSection('pipeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSubSection === 'pipeline' ? 'bg-white text-[#22381E] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6. 7-Stage Zero-Trust Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Sub Section 1: Topology Diagram */}
      {activeSubSection === 'diagram' && (
        <div className="space-y-6">
          {/* 3 Tier System Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mobile & Client Layer */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-[#C9DDE0]/50 border border-[#4C8994]/40 text-[#245B63]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CLIENT TIER</div>
                    <h3 className="font-bold text-slate-900 text-base">Frontend & Mobile Apps</h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-[#245B63] font-semibold">Flutter Mobile App</span>
                      <span className="text-[10px] bg-[#C9DDE0] text-[#245B63] px-1.5 py-0.5 rounded font-mono font-bold">Dart 3.x</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Android & iOS app for Laboratory Customers, Sales Reps & Biomedical Engineers with Riverpod State Machine.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-purple-700">Next.js 14 Dashboard</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono font-bold">React 19 / TS</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Responsive Back Office for Office Admins, Service Managers, and Super Admin governance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-lg bg-[#C9DDE0]/40 border border-[#4C8994]/30 text-[#245B63] text-[11px]">
                🔒 <strong>Token Storage:</strong> Flutter Secure Storage (Keychain / EncryptedSharedPreferences) + HTTP-Only Cookies.
              </div>
            </div>

            {/* Backend API Gateway & Modular Monolith */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-[#E4F1DC] border border-[#D2E7C4] text-[#22381E]">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">BACKEND TIER</div>
                    <h3 className="font-bold text-slate-900 text-base">NestJS Enterprise API</h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-[#22381E] font-semibold">API Gateway & Security Layer</span>
                      <span className="text-[10px] bg-[#D2E7C4] text-[#22381E] px-1.5 py-0.5 rounded font-mono font-bold">/api/v1/*</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Rate Limiter, Helmet, CORS, JWT Guard, RolesGuard, and Permission Reflection Interceptors.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 mb-1.5">Core Domain Services</div>
                    <div className="flex flex-wrap gap-1">
                      {['Auth & RBAC', 'Catalog & Pricing', 'Orders & Payment', 'QR Loyalty', 'SLA & Tickets', 'Audit Logs'].map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-white text-[10px] text-slate-700 border border-slate-200 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-lg bg-[#E4F1DC] border border-[#D2E7C4] text-[#22381E] text-[11px]">
                🛡️ <strong>Zero Client Trust:</strong> 100% Server-Side Price & Wallet Evaluation — client amounts are rejected.
              </div>
            </div>

            {/* Persistence & Data Layer */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">STORAGE TIER</div>
                    <h3 className="font-bold text-slate-900 text-base">PostgreSQL 16 & S3</h3>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-emerald-700">PostgreSQL 16 + Prisma ORM</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">ACID 3NF</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Normalized tables, row-level locks on wallet/loyalty ledgers, soft deletes, and foreign key integrity.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span className="text-amber-700">Secure Object Storage</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">S3 Signed</span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Private storage for complaint photos, invoices, and service documents with short-lived pre-signed URLs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-800 text-[11px]">
                📜 <strong>Compliance:</strong> Immutable audit logs with client IP, User-Agent, and detailed JSON diff snapshots.
              </div>
            </div>
          </div>

          {/* Multi-Step Pipeline Flow */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#22381E] rounded flex items-center justify-center text-xs font-bold">02</span>
              <span>End-to-End Multi-Platform Communication Flow</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#245B63] font-bold bg-[#C9DDE0] px-1.5 py-0.5 rounded">STEP 1</span>
                  <div className="font-bold text-slate-900 mt-2">Client Request</div>
                  <p className="text-slate-600 text-[11px] mt-1">Mobile / Web sends HTTPS request with Bearer JWT header.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-2 self-end hidden md:block" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#22381E] font-bold bg-[#D2E7C4] px-1.5 py-0.5 rounded">STEP 2</span>
                  <div className="font-bold text-slate-900 mt-2">Security Filters</div>
                  <p className="text-slate-600 text-[11px] mt-1">Rate limiter checks IP limit; Helmet & CORS validate origin.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-2 self-end hidden md:block" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-700 font-bold bg-cyan-100 px-1.5 py-0.5 rounded">STEP 3</span>
                  <div className="font-bold text-slate-900 mt-2">JWT Verification</div>
                  <p className="text-slate-600 text-[11px] mt-1">JwtAuthGuard verifies signature and extracts user ID + Role.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-2 self-end hidden md:block" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-100 px-1.5 py-0.5 rounded">STEP 4</span>
                  <div className="font-bold text-slate-900 mt-2">RBAC Enforcement</div>
                  <p className="text-slate-600 text-[11px] mt-1">RolesGuard & PermissionsGuard check authorization before execution.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 mt-2 self-end hidden md:block" />
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">STEP 5</span>
                  <div className="font-bold text-slate-900 mt-2">Audit & Response</div>
                  <p className="text-slate-600 text-[11px] mt-1">AuditLogService records action; serialized JSON returned to client.</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-2 self-end hidden md:block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Section 2: Monorepo Structure */}
      {activeSubSection === 'monorepo' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FolderTree className="w-5 h-5 text-[#22381E]" />
              <span>Enterprise Monorepo Directory Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Turborepo monorepo structure with shared TypeScript definitions across Flutter, Next.js, and NestJS.
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto shadow-inner">
            <pre>{`a2z-diagnostics-enterprise/
├── apps/
│   ├── mobile_flutter/             # Flutter Mobile (iOS & Android)
│   │   ├── lib/
│   │   │   ├── core/               # Network, Storage, Interceptors, Theme
│   │   │   │   ├── network/        # Dio client, AuthInterceptor (401 auto-refresh)
│   │   │   │   ├── storage/        # FlutterSecureStorage wrapper
│   │   │   │   └── theme/          # Healthcare Blue / Slate B2B Design system
│   │   │   ├── features/
│   │   │   │   ├── auth/           # Identity: Login, OTP, Role StateNotifier
│   │   │   │   ├── catalog/        # Catalog: Diagnostic Companies, Reagents, Equipment
│   │   │   │   ├── customer_home/  # Customer Experience: Banners, Offers, Quick Reorders
│   │   │   │   ├── orders/         # Commerce: Cart, Payment calculation, Tracking
│   │   │   │   ├── wallet/         # Loyalty: QR Loyalty Scanner, Points ledger
│   │   │   │   ├── service/        # Service Operations: Engineer Work Orders, SLA, PM
│   │   │   │   └── sales/          # Field Sales: Field check-in, Expenses, Targets
│   │   │   └── main.dart
│   │   └── pubspec.yaml
│   │
│   ├── admin_portal_next/          # Next.js 14+ Admin Dashboard
│   │   ├── src/
│   │   │   ├── app/                # App Router (RBAC guarded routes)
│   │   │   ├── components/         # Reusable B2B UI components & Charts
│   │   │   └── lib/                # API client with automatic token rotation
│   │   └── package.json
│   │
│   └── backend_nestjs/             # NestJS Enterprise API Backend
│       ├── src/
│       │   ├── common/             # Guards, Decorators, Filters, Interceptors
│       │   │   ├── guards/         # JwtAuthGuard, RolesGuard, PermissionsGuard
│       │   │   ├── decorators/     # @Roles(), @RequirePermissions(), @CurrentUser()
│       │   │   └── filters/        # GlobalExceptionFilter (Standard JSON errors)
│       │   ├── modules/
│       │   │   ├── auth/           # Identity: Login, Refresh, OTP, Password hash
│       │   │   ├── users/          # Users: User profiles & status lifecycle
│       │   │   ├── roles/          # Access Control: 9-Role RBAC & permissions mapping
│       │   │   ├── audit/          # Security Audit: Immutable security audit logger
│       │   │   ├── catalog/        # Catalog Engine: Diagnostic Companies & Products
│       │   │   ├── pricing/        # Pricing Engine: Customer-specific pricing contracts
│       │   │   ├── orders/         # Order Operations: Order checkout & advance discounts
│       │   │   ├── wallet/         # Loyalty System: QR loyalty code validation
│       │   │   ├── service/        # Service Desk: Tickets, engineer check-in & dispatch
│       │   │   ├── sla/            # SLA Tracking: SLA timers & pause calculators
│       │   │   ├── maintenance/    # Maintenance Engine: Preventive maintenance schedules
│       │   │   └── reports/        # Analytics: Financial, sales & service analytics
│       │   └── app.module.ts
│       └── package.json
│
├── packages/
│   ├── database/                   # Shared Prisma Schema & Migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Complete PostgreSQL entities
│   │   │   └── migrations/         # Version-controlled SQL migrations
│   │   └── index.ts
│   └── shared-types/               # Shared TypeScript interfaces & DTOs
└── package.json`}</pre>
          </div>
        </div>
      )}

      {/* Sub Section 3: Auth Flow */}
      {activeSubSection === 'auth_flow' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Key className="w-5 h-5 text-[#22381E]" />
              <span>Authentication & JWT Token Rotation Lifecycle</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dual-token architecture with Refresh Token Family Replay Detection & Device Fingerprinting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-[#22381E] flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5F8F4D]"></span>
                <span>1. Access Token (Short-Lived)</span>
              </div>
              <p className="text-slate-600 text-xs">
                Valid for <strong className="text-slate-900">15 minutes</strong>. Signed with HMAC-SHA256. Carries user ID, email, role, and permission array in payload for instant zero-database RBAC evaluations in middleware.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-cyan-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                <span>2. Refresh Token (Long-Lived)</span>
              </div>
              <p className="text-slate-600 text-xs">
                Valid for <strong className="text-slate-900">7 days</strong>. Stored hashed in PostgreSQL with a unique token <strong className="text-slate-900">family UUID</strong>. Rotates on every use; replaying an old token instantly invalidates the entire family.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-emerald-700 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>3. Session Invalidation</span>
              </div>
              <p className="text-slate-600 text-xs">
                Admins can instantly revoke active sessions or change account status to <strong className="text-slate-900">SUSPENDED</strong>. JwtAuthGuard checks account status on every privileged route.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub Section 4: Security Strategy */}
      {activeSubSection === 'security' && (
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg space-y-6">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Enterprise Security
            </div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#D2E7C4]" />
              <span>Zero-Trust Enterprise Security Strategy</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Defense-in-depth principles implemented across all diagnostic data endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <div className="w-5 h-5 bg-[#D2E7C4]/20 text-[#D2E7C4] rounded flex items-center justify-center text-[10px] font-bold">✓</div>
                <span>Zero Client-Side Financial Trust</span>
              </div>
              <p className="text-slate-400 text-xs">
                Every product price, discount tier, advance payment credit (e.g. 2%), and loyalty QR point is computed exclusively on the NestJS backend. Client-submitted prices are rejected.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <div className="w-5 h-5 bg-[#D2E7C4]/20 text-[#D2E7C4] rounded flex items-center justify-center text-[10px] font-bold">✓</div>
                <span>Role & Resource-Level Authorization</span>
              </div>
              <p className="text-slate-400 text-xs">
                Service Engineers cannot view invoices or unassigned tickets. Distributors cannot view retail laboratory pricing. Customers cannot access internal engineering metrics.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <div className="w-5 h-5 bg-[#D2E7C4]/20 text-[#D2E7C4] rounded flex items-center justify-center text-[10px] font-bold">✓</div>
                <span>Password & Secret Cryptography</span>
              </div>
              <p className="text-slate-400 text-xs">
                All passwords hashed with bcrypt (salt rounds: 10). Production secrets, payment gateway tokens, and JWT private keys are stored exclusively in environment variables.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="font-semibold text-white flex items-center space-x-2">
                <div className="w-5 h-5 bg-[#D2E7C4]/20 text-[#D2E7C4] rounded flex items-center justify-center text-[10px] font-bold">✓</div>
                <span>Immutable Security Audit Trails</span>
              </div>
              <p className="text-slate-400 text-xs">
                All administrative actions, failed logins, role promotions, credit limit modifications, and price overrides are logged with client IP, user agent, and timestamp.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub Section 5: Plan */}
      {activeSubSection === 'plan' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Full Enterprise System Module Roadmap</h3>
            <span className="text-xs bg-[#E4F1DC] text-[#22381E] border border-[#D2E7C4] px-2.5 py-1 rounded-full font-semibold">
              All Modules Active
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { num: 'CORE MODULE 1', title: 'Architecture, DB & RBAC Auth', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 2', title: 'Companies, Catalog & Products', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 3', title: 'Customer App & Pricing Engine', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 4', title: 'Cart, Orders & Payments', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 5', title: 'Wallet, QR Points & Ledger', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 6', title: 'Complaints & Service App', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 7', title: 'SLA, Feedback & Repeat Alerts', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 8', title: 'Preventive Maintenance', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 9', title: 'Sales, Marketing & Attendance', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 10', title: 'Admin Reports & Analytics', status: 'ACTIVE IN PRODUCTION', done: true },
              { num: 'CORE MODULE 11', title: 'Security & Production Deploy', status: 'ACTIVE IN PRODUCTION', done: true },
            ].map((p) => (
              <div
                key={p.num}
                className={`p-3.5 rounded-lg border transition-all ${
                  p.done ? 'bg-[#E4F1DC]/70 border-[#D2E7C4] text-[#22381E]' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs">{p.num}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    p.done ? 'bg-[#22381E] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-800 mt-1.5">{p.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Section 6: 7-Stage Zero-Trust Pipeline */}
      {activeSubSection === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-semibold text-[#22381E] uppercase tracking-wider mb-1">
                  Ingress & Authorization Model
                </div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#22381E]" />
                  <span>The 7-Stage Zero-Trust Authentication & Scope Evaluation Sequence</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Every request entering the diagnostic enterprise gateway undergoes seven deterministic evaluation steps before accessing data or compiling dynamic dashboard widgets.
                </p>
              </div>
            </div>

            {/* Sequence Diagram Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
              {[
                { step: 1, name: 'UNIQUE USER', tag: 'Stage 1', title: 'Identity Disambiguation', desc: 'Ensures single distinct user account; no shared logins. Verified email & phone binding.' },
                { step: 2, name: 'SECURE LOGIN', tag: 'Stage 2', title: 'Bcrypt & 2FA Tokens', desc: 'Bcrypt salt 10, TOTP RFC-6238 check, 15m HMAC-SHA256 JWT & 7d refresh token family.' },
                { step: 3, name: 'STATUS CHECK', tag: 'Stage 3', title: 'Lifecycle State Machine', desc: 'Enforces USER_CREATED → ACTIVE → SUSPENDED → DEACTIVATED. Blocks locked accounts (≥5 fails).' },
                { step: 4, name: 'ROLE CHECK', tag: 'Stage 4', title: 'Canonical Persona Guard', desc: 'Hierarchical evaluation (Super Admin, Office Admin, Sales, Service, Customer, Distributor).' },
                { step: 5, name: 'PERMISSION CHECK', tag: 'Stage 5', title: 'Granular Matrix Guard', desc: 'Direct claim payload evaluation for 43+ capabilities without database lookups.' },
                { step: 6, name: 'DATA-SCOPE CHECK', tag: 'Stage 6', title: 'Row-Level Security (RLS)', desc: 'Isolates rows by ALL, REGION, BRANCH, ASSIGNED, or OWN laboratory scope.' },
                { step: 7, name: 'PERSONALIZED DASHBOARD', tag: 'Stage 7', title: 'Dynamic Workspace', desc: 'Compiles persona-specific widgets, operational quick actions, and permitted tabs.' },
              ].map((s, idx) => (
                <div key={s.step} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-[#D2E7C4] hover:shadow-xs transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold bg-[#E4F1DC] text-[#22381E] px-1.5 py-0.5 rounded">{s.tag}</span>
                      <span className="w-5 h-5 bg-white border border-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700">{s.step}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs tracking-tight">{s.name}</div>
                    <div className="text-[11px] font-semibold text-[#22381E] mt-0.5">{s.title}</div>
                    <p className="text-slate-600 text-[11px] mt-2 leading-relaxed">{s.desc}</p>
                  </div>
                  {idx < 6 && (
                    <div className="text-center pt-2 text-slate-400 font-bold text-xs hidden md:block">
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-lg">
            <h4 className="text-sm font-bold text-[#D2E7C4] uppercase tracking-wider mb-2">
              Enterprise Ingress & Middleware Implementation
            </h4>
            <div className="font-mono text-xs text-slate-300 space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
              <p className="text-emerald-400">{'// 7-Stage Zero-Trust Evaluation Pipeline in Express / NestJS'}</p>
              <p className="text-[#C3E2B8]">{'1. UniqueUserValidationFilter: req.user = findUniqueByEmail(email);'}</p>
              <p className="text-[#C3E2B8]">{'2. BcryptAuthGuard: bcrypt.compareSync(pass, user.passwordHash) && verifyTotp(user);'}</p>
              <p className="text-[#C3E2B8]">{'3. AccountStatusGuard: if (user.status !== "ACTIVE" || user.failedAttempts >= 5) throw Forbidden();'}</p>
              <p className="text-[#C3E2B8]">{'4. RolesGuard: matchRouteRoleAnnotations(user.roleType, endpoint.roles);'}</p>
              <p className="text-[#C3E2B8]">{'5. PermissionsGuard: verifyJwtClaims(token.claims, endpoint.requiredPermissions);'}</p>
              <p className="text-[#C3E2B8]">{'6. RowLevelDataScopeInterceptor: applyQueryScope(user.dataScope, user.region, user.branch);'}</p>
              <p className="text-emerald-300">{'7. PersonalizedDashboardCompiler: return compileDynamicWorkspaceConfig(user);'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

