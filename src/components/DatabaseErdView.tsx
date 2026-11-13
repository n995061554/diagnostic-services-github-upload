import React, { useState } from 'react';
import { Database, Key, Table, Code, Copy, Check, Sparkles, Layers } from 'lucide-react';

export const DatabaseErdView: React.FC = () => {
  const [activeSchemaTab, setActiveSchemaTab] = useState<'tables' | 'prisma' | 'sql'>('tables');
  const [copiedCode, setCopiedCode] = useState(false);

  const tables = [
    {
      name: 'users',
      description: 'Core identity table supporting all 9 diagnostic personas',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'Unique user identifier' },
        { name: 'email', type: 'VARCHAR(255)', key: 'UQ', desc: 'Unique work/contact email' },
        { name: 'phoneNumber', type: 'VARCHAR(30)', key: 'UQ', desc: 'E.164 verified mobile phone' },
        { name: 'passwordHash', type: 'VARCHAR(255)', key: '', desc: 'bcrypt hashed password' },
        { name: 'firstName', type: 'VARCHAR(100)', key: '', desc: 'Given name' },
        { name: 'lastName', type: 'VARCHAR(100)', key: '', desc: 'Family / surname' },
        { name: 'roleType', type: 'UserRoleType', key: 'IDX', desc: 'Enum: CUSTOMER, SALES, etc.' },
        { name: 'status', type: 'UserStatus', key: 'IDX', desc: 'ACTIVE, INACTIVE, SUSPENDED' },
        { name: 'twoFactorEnabled', type: 'BOOLEAN', key: '', desc: 'TOTP / SMS 2FA flag' },
        { name: 'lockoutUntil', type: 'TIMESTAMPTZ', key: '', desc: 'Rate-limit brute-force protection' },
      ]
    },
    {
      name: 'customer_profiles',
      description: 'Laboratory & hospital specific commercial attributes',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'Profile identifier' },
        { name: 'userId', type: 'UUID', key: 'FK/UQ', desc: 'References users(id)' },
        { name: 'labName', type: 'VARCHAR(255)', key: 'IDX', desc: 'Clinical pathology lab name' },
        { name: 'customerCode', type: 'VARCHAR(50)', key: 'UQ', desc: 'ERP / B2B account code' },
        { name: 'customerType', type: 'CustomerType', key: '', desc: 'HOSPITAL_LAB, CLINICAL_LAB, etc.' },
        { name: 'creditLimit', type: 'NUMERIC(12,2)', key: '', desc: 'Authorized credit boundary' },
        { name: 'currentOutstanding', type: 'NUMERIC(12,2)', key: '', desc: 'Live unpaid invoice sum' },
        { name: 'isApproved', type: 'BOOLEAN', key: '', desc: 'Admin KYC verification status' },
      ]
    },
    {
      name: 'employee_profiles',
      description: 'Field sales reps, biomedical engineers & office staff details',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'Profile identifier' },
        { name: 'userId', type: 'UUID', key: 'FK/UQ', desc: 'References users(id)' },
        { name: 'employeeCode', type: 'VARCHAR(50)', key: 'UQ', desc: 'Internal HR employee code' },
        { name: 'department', type: 'VARCHAR(100)', key: 'IDX', desc: 'SALES, SERVICE, COMMERCIAL' },
        { name: 'designation', type: 'VARCHAR(100)', key: '', desc: 'Job role title' },
        { name: 'currentLat', type: 'NUMERIC(10,8)', key: '', desc: 'Latest GPS latitude' },
        { name: 'currentLng', type: 'NUMERIC(11,8)', key: '', desc: 'Latest GPS longitude' },
      ]
    },
    {
      name: 'refresh_tokens',
      description: 'Cryptographic refresh token rotation & family tracking',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'Token record ID' },
        { name: 'userId', type: 'UUID', key: 'FK', desc: 'References users(id)' },
        { name: 'tokenHash', type: 'VARCHAR(255)', key: 'UQ', desc: 'bcrypt hash of refresh token' },
        { name: 'family', type: 'UUID', key: 'IDX', desc: 'Rotation family for replay detection' },
        { name: 'isRevoked', type: 'BOOLEAN', key: '', desc: 'Revocation flag' },
        { name: 'expiresAt', type: 'TIMESTAMPTZ', key: '', desc: '7-day expiry deadline' },
      ]
    },
    {
      name: 'audit_logs',
      description: 'Append-only immutable record of all security & business operations',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK', desc: 'Log identifier' },
        { name: 'userId', type: 'UUID', key: 'FK', desc: 'Actor user ID' },
        { name: 'action', type: 'VARCHAR(100)', key: 'IDX', desc: 'AUTH_LOGIN, PRICE_OVERRIDE, etc.' },
        { name: 'module', type: 'VARCHAR(50)', key: 'IDX', desc: 'AUTH, PRICING, ORDERS, SERVICE' },
        { name: 'ipAddress', type: 'VARCHAR(45)', key: '', desc: 'Client IPv4/IPv6' },
        { name: 'status', type: 'VARCHAR(20)', key: '', desc: 'SUCCESS, FAILURE, WARNING' },
        { name: 'details', type: 'JSONB', key: '', desc: 'Structured payload & change diff' },
        { name: 'timestamp', type: 'TIMESTAMPTZ', key: 'IDX', desc: 'Audit creation timestamp' },
      ]
    }
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const prismaSchemaCode = `// Prisma ORM Schema - A2Z Diagnostics Enterprise
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String       @id @default(uuid()) @db.Uuid
  email             String       @unique @db.VarChar(255)
  phoneNumber       String       @unique @db.VarChar(30)
  passwordHash      String       @db.VarChar(255)
  firstName         String       @db.VarChar(100)
  lastName          String       @db.VarChar(100)
  roleType          UserRoleType @default(CUSTOMER)
  status            UserStatus   @default(ACTIVE)
  twoFactorEnabled  Boolean      @default(false)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  customerProfile   CustomerProfile?
  employeeProfile   EmployeeProfile?
  sessions          UserSession[]
  refreshTokens     RefreshToken[]
  auditLogs         AuditLog[]

  @@map("users")
}`;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-[#22381E] text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-5 h-5 bg-[#D2E7C4] text-[#1E331B] rounded flex items-center justify-center text-xs font-bold">02</span>
              <span>PostgreSQL Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              PostgreSQL Schema & Normalized Entity Models
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Strict 3NF normalization with indexes, UUID primary keys, and foreign key cascades.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveSchemaTab('tables')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSchemaTab === 'tables' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entity Dictionary
            </button>
            <button
              onClick={() => setActiveSchemaTab('prisma')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSchemaTab === 'prisma' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prisma Schema
            </button>
            <button
              onClick={() => setActiveSchemaTab('sql')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeSchemaTab === 'sql' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SQL DDL
            </button>
          </div>
        </div>
      </div>

      {/* View: Entity Tables */}
      {activeSchemaTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((table) => (
            <div key={table.name} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4 text-[#22381E]" />
                  <span className="font-mono font-bold text-sm text-slate-900">{table.name}</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E4F1DC] text-[#1E331B] border border-[#D2E7C4]">
                  PostgreSQL Table
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{table.description}</p>

              <div className="space-y-1.5">
                {table.fields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      {field.key ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          field.key.includes('PK') ? 'bg-[#F4DFA3] text-[#6B4B12] border border-[#C58A16]/40' :
                          field.key.includes('FK') ? 'bg-[#C9DDE0] text-[#245B63] border border-[#4C8994]/40' :
                          'bg-[#E4E8DF] text-[#4B5A48] border border-[#82917C]/40'
                        }`}>
                          {field.key}
                        </span>
                      ) : (
                        <span className="w-5"></span>
                      )}
                      <span className="font-mono font-semibold text-slate-800">{field.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-right">
                      <span className="font-mono text-[11px] text-slate-500">{field.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Prisma */}
      {activeSchemaTab === 'prisma' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-slate-500">/prisma/schema.prisma</span>
            <button
              onClick={() => handleCopy(prismaSchemaCode)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition-colors border border-slate-200"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Prisma Schema'}</span>
            </button>
          </div>
          <pre className="bg-slate-900 p-4 rounded-lg text-xs text-emerald-400 font-mono overflow-x-auto shadow-inner">
            {prismaSchemaCode}
          </pre>
        </div>
      )}

      {/* View: SQL */}
      {activeSchemaTab === 'sql' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-slate-500">/prisma/migrations/001_initial_auth_rbac.sql</span>
          </div>
          <pre className="bg-slate-900 p-4 rounded-lg text-xs text-[#D2E7C4] font-mono overflow-x-auto shadow-inner">
{`CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "phoneNumber" VARCHAR(30) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "roleType" "UserRoleType" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_roleType" ON "users"("roleType");`}
          </pre>
        </div>
      )}
    </div>
  );
};

