// ============================================================================
// A2Z DIAGNOSTICS ENTERPRISE PLATFORM - NESTJS BACKEND
// Auth DTOs
// ============================================================================

export interface LoginDto {
  email?: string;
  phoneNumber?: string;
  password?: string;
  otpCode?: string;
  deviceType?: 'IOS' | 'ANDROID' | 'WEB' | 'DESKTOP';
  deviceName?: string;
}

export interface RegisterCustomerDto {
  email: string;
  phoneNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  labName: string;
  customerType: string;
  gstNumber?: string;
  drugLicenseNumber?: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // in seconds
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    roleType: string;
    status: string;
    avatarUrl?: string | null;
    customerProfile?: {
      labName: string;
      customerCode: string;
      customerType: string;
      creditLimit: number;
      currentOutstanding: number;
      isApproved: boolean;
    } | null;
    employeeProfile?: {
      employeeCode: string;
      department: string;
      designation: string;
    } | null;
  };
  permissions: string[];
}
