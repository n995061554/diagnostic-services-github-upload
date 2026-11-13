// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER)
// Clean Architecture - Auth & RBAC State Machine (Riverpod)
// File: /mobile/lib/features/auth/presentation/providers/auth_provider.dart
// ============================================================================

/*
  Architecture Note:
  This Riverpod StateNotifier coordinates:
  1. Login with Email / Phone + Password or OTP
  2. Encrypted biometric & secure storage for Access / Refresh Tokens
  3. Automatic JWT refresh handling on 401 via Dio Interceptor
  4. Role & Permission gates for UI routing (Customer vs Sales vs Engineer)
*/

// Domain Models
class UserModel {
  final String id;
  final String email;
  final String phoneNumber;
  final String firstName;
  final String lastName;
  final String roleType;
  final String status;
  final String? avatarUrl;
  final CustomerProfileModel? customerProfile;
  final EmployeeProfileModel? employeeProfile;
  final List<String> permissions;

  UserModel({
    required this.id,
    required this.email,
    required this.phoneNumber,
    required this.firstName,
    required this.lastName,
    required this.roleType,
    required this.status,
    this.avatarUrl,
    this.customerProfile,
    this.employeeProfile,
    required this.permissions,
  });

  String get fullName => '$firstName $lastName';
  bool hasPermission(String perm) => permissions.contains(perm) || roleType == 'SUPER_ADMIN';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      phoneNumber: json['phoneNumber'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      roleType: json['roleType'] as String,
      status: json['status'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      customerProfile: json['customerProfile'] != null 
          ? CustomerProfileModel.fromJson(json['customerProfile'] as Map<String, dynamic>) 
          : null,
      employeeProfile: json['employeeProfile'] != null 
          ? EmployeeProfileModel.fromJson(json['employeeProfile'] as Map<String, dynamic>) 
          : null,
      permissions: List<String>.from(json['permissions'] ?? []),
    );
  }
}

class CustomerProfileModel {
  final String labName;
  final String customerCode;
  final String customerType;
  final double creditLimit;
  final double currentOutstanding;
  final bool isApproved;

  CustomerProfileModel({
    required this.labName,
    required this.customerCode,
    required this.customerType,
    required this.creditLimit,
    required this.currentOutstanding,
    required this.isApproved,
  });

  factory CustomerProfileModel.fromJson(Map<String, dynamic> json) {
    return CustomerProfileModel(
      labName: json['labName'] as String,
      customerCode: json['customerCode'] as String,
      customerType: json['customerType'] as String,
      creditLimit: (json['creditLimit'] as num).toDouble(),
      currentOutstanding: (json['currentOutstanding'] as num).toDouble(),
      isApproved: json['isApproved'] as bool,
    );
  }
}

class EmployeeProfileModel {
  final String employeeCode;
  final String department;
  final String designation;

  EmployeeProfileModel({
    required this.employeeCode,
    required this.department,
    required this.designation,
  });

  factory EmployeeProfileModel.fromJson(Map<String, dynamic> json) {
    return EmployeeProfileModel(
      employeeCode: json['employeeCode'] as String,
      department: json['department'] as String,
      designation: json['designation'] as String,
    );
  }
}

class AuthTokensModel {
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int expiresIn;

  AuthTokensModel({
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.expiresIn,
  });

  factory AuthTokensModel.fromJson(Map<String, dynamic> json) {
    return AuthTokensModel(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      expiresIn: json['expiresIn'] as int? ?? 900,
    );
  }
}
