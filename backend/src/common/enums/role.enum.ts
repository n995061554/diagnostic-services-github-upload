// ============================================================================
// A2Z DIAGNOSTICS ENTERPRISE PLATFORM - NESTJS BACKEND
// Common Enums and Role Definitions
// File: /backend/src/common/enums/role.enum.ts
// ============================================================================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  OFFICE_STAFF = 'OFFICE_STAFF',
  SALES_PERSON = 'SALES_PERSON',
  MARKETING_STAFF = 'MARKETING_STAFF',
  SERVICE_ENGINEER = 'SERVICE_ENGINEER',
  SERVICE_MANAGER = 'SERVICE_MANAGER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  roles?: UserRole[];
  permissions?: string[];
  sessionId?: string;
  iat?: number;
  exp?: number;
}
