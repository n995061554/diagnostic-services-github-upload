// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Authentication & Registration API Service with OTP Verification
// File: /mobile/lib/core/api/auth_api_service.dart
// ============================================================================

import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthUserSession {
  final String userId;
  final String email;
  final String phoneNumber;
  final String firstName;
  final String lastName;
  final String role;
  final String labId;
  final String labName;
  final String labAddress;
  final String accessToken;
  final String? refreshToken;

  AuthUserSession({
    required this.userId,
    required this.email,
    required this.phoneNumber,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.labId,
    required this.labName,
    required this.labAddress,
    required this.accessToken,
    this.refreshToken,
  });

  String get displayName {
    final full = '$firstName $lastName'.trim();
    return full.isNotEmpty ? full : email;
  }
}

class AuthApiService {
  final ApiClient _apiClient;
  AuthUserSession? _currentSession;

  AuthApiService({ApiClient? apiClient})
      : _apiClient = apiClient ?? defaultApiClient;

  AuthUserSession? get currentSession => _currentSession;

  bool get isAuthenticated => _currentSession != null;

  /// Authenticate user against live backend.
  /// First queries /api/v1/auth/customer/login. If unrecognized or office role,
  /// falls back to enterprise /api/v1/auth/login.
  Future<AuthUserSession> login({
    required String identifier,
    required String password,
  }) async {
    final cleanId = identifier.trim();
    dynamic res;

    try {
      res = await _apiClient.post('/api/v1/auth/customer/login', body: {
        'identifier': cleanId,
        'password': password,
      });
    } on ApiException catch (e) {
      // If customer endpoint fails with 401 or 404, check enterprise office auth endpoint
      if (e.statusCode == 401 || e.statusCode == 404) {
        try {
          res = await _apiClient.post('/api/v1/auth/login', body: {
            'identifier': cleanId,
            'password': password,
          });
        } catch (_) {
          // Re-throw original customer auth exception for accurate message
          rethrow;
        }
      } else {
        rethrow;
      }
    }

    final session = _parseAndStoreSession(res);
    await _persistSession(session);
    return session;
  }

  /// Initiate customer registration and dispatch 6-digit OTP
  Future<Map<String, dynamic>> registerCustomer({
    required String labName,
    required String contactPersonName,
    required String labAddress,
    required String email,
    required String contactNumber,
    required String password,
    required String confirmPassword,
  }) async {
    final res = await _apiClient.post('/api/v1/auth/customer/register', body: {
      'labName': labName.trim(),
      'contactPersonName': contactPersonName.trim(),
      'labAddress': labAddress.trim(),
      'email': email.trim().toLowerCase(),
      'contactNumber': contactNumber.trim(),
      'password': password,
      'confirmPassword': confirmPassword,
    });

    if (res is Map<String, dynamic>) {
      return res;
    }
    return {'message': 'Registration initiated. OTP dispatched.'};
  }

  /// Verify 6-digit OTP code to complete account activation
  Future<AuthUserSession> verifyRegistrationOtp({
    required String otpToken,
    required String otp,
    required String identifier,
  }) async {
    final res = await _apiClient.post(
      '/api/v1/auth/customer/verify-registration-otp',
      body: {
        'otpToken': otpToken,
        'otp': otp.trim(),
        'identifier': identifier.trim(),
      },
    );

    final session = _parseAndStoreSession(res);
    await _persistSession(session);
    return session;
  }

  /// Resend registration verification OTP with rate limiting
  Future<Map<String, dynamic>> resendOtp({
    required String otpToken,
    required String identifier,
  }) async {
    final res = await _apiClient.post(
      '/api/v1/auth/customer/resend-otp',
      body: {
        'otpToken': otpToken,
        'identifier': identifier.trim(),
        'email': identifier.trim(),
      },
    );

    if (res is Map<String, dynamic>) {
      return res;
    }
    return {'message': 'New OTP dispatched.'};
  }

  /// Restores saved session from persistent storage on app launch
  Future<AuthUserSession?> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_access_token');
    final userId = prefs.getString('auth_user_id');

    if (token == null || token.isEmpty || userId == null || userId.isEmpty) {
      return null;
    }

    final session = AuthUserSession(
      userId: userId,
      email: prefs.getString('auth_email') ?? '',
      phoneNumber: prefs.getString('auth_phone') ?? '',
      firstName: prefs.getString('auth_first_name') ?? '',
      lastName: prefs.getString('auth_last_name') ?? '',
      role: prefs.getString('auth_role') ?? 'OWNER',
      labId: prefs.getString('auth_lab_id') ?? userId,
      labName: prefs.getString('auth_lab_name') ?? 'Diagnostic Partner Lab',
      labAddress: prefs.getString('auth_lab_address') ?? '',
      accessToken: token,
      refreshToken: prefs.getString('auth_refresh_token'),
    );

    _currentSession = session;
    _apiClient.setAuthToken(token);
    return session;
  }

  /// Clear session on sign-out
  Future<void> logout() async {
    _currentSession = null;
    _apiClient.setAuthToken(null);

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_access_token');
    await prefs.remove('auth_refresh_token');
    await prefs.remove('auth_user_id');
    await prefs.remove('auth_email');
    await prefs.remove('auth_phone');
    await prefs.remove('auth_first_name');
    await prefs.remove('auth_last_name');
    await prefs.remove('auth_role');
    await prefs.remove('auth_lab_id');
    await prefs.remove('auth_lab_name');
    await prefs.remove('auth_lab_address');
  }

  AuthUserSession _parseAndStoreSession(dynamic res) {
    final data = res as Map<String, dynamic>;
    final token = (data['accessToken'] ?? data['token'] ?? '') as String;
    final refreshToken = (data['refreshToken'] ?? '') as String?;
    final userMap = (data['user'] as Map<String, dynamic>?) ?? {};

    final userId = (userMap['id'] ?? '') as String;
    final email = (userMap['email'] ?? '') as String;
    final phoneNumber = (userMap['phoneNumber'] ?? '') as String;
    final firstName = (userMap['firstName'] ?? '') as String;
    final lastName = (userMap['lastName'] ?? '') as String;

    // Resolve server-enforced role
    final role = (userMap['customerRole'] ?? userMap['roleType'] ?? 'OWNER') as String;

    // Resolve laboratory identity & address
    final labId = (userMap['labId'] ?? userId) as String;
    final profile = userMap['customerProfile'] as Map<String, dynamic>?;
    final empProfile = userMap['employeeProfile'] as Map<String, dynamic>?;

    String labName = 'Diagnostic Partner Lab';
    if (userMap['labName'] != null && (userMap['labName'] as String).isNotEmpty) {
      labName = userMap['labName'] as String;
    } else if (profile != null && profile['labName'] != null) {
      labName = profile['labName'] as String;
    } else if (empProfile != null) {
      labName = 'Diagnostic Services Central Operations';
    }

    final labAddress = (userMap['labAddress'] ?? '') as String;

    final session = AuthUserSession(
      userId: userId,
      email: email,
      phoneNumber: phoneNumber,
      firstName: firstName,
      lastName: lastName,
      role: role,
      labId: labId,
      labName: labName,
      labAddress: labAddress,
      accessToken: token,
      refreshToken: refreshToken,
    );

    _currentSession = session;
    _apiClient.setAuthToken(token);
    return session;
  }

  Future<void> _persistSession(AuthUserSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_access_token', session.accessToken);
    if (session.refreshToken != null) {
      await prefs.setString('auth_refresh_token', session.refreshToken!);
    }
    await prefs.setString('auth_user_id', session.userId);
    await prefs.setString('auth_email', session.email);
    await prefs.setString('auth_phone', session.phoneNumber);
    await prefs.setString('auth_first_name', session.firstName);
    await prefs.setString('auth_last_name', session.lastName);
    await prefs.setString('auth_role', session.role);
    await prefs.setString('auth_lab_id', session.labId);
    await prefs.setString('auth_lab_name', session.labName);
    await prefs.setString('auth_lab_address', session.labAddress);
  }
}

final authApiService = AuthApiService();
