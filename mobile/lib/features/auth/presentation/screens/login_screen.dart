// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP (FLUTTER)
// Screen: Secure Authentication & Customer Registration Flow with OTP
// File: /mobile/lib/features/auth/presentation/screens/login_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/auth_api_service.dart';
import '../../../../core/theme/app_theme.dart';

enum LoginFlow { welcome, labSignIn, officeSignIn, register, verifyOtp }

class LoginScreen extends StatefulWidget {
  final Function(String role, String name, String labName) onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  LoginFlow _currentFlow = LoginFlow.welcome;

  // Sign In Controllers
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _errorMessage;

  // Registration Controllers
  final _regLabNameController = TextEditingController();
  final _regDirectorNameController = TextEditingController();
  final _regAddressController = TextEditingController();
  final _regEmailController = TextEditingController();
  final _regPhoneController = TextEditingController();
  final _regPasswordController = TextEditingController();
  final _regConfirmPasswordController = TextEditingController();
  bool _obscureRegPassword = true;

  // OTP Verification
  final _otpController = TextEditingController();
  String? _otpToken;
  String? _debugOtp;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _regLabNameController.dispose();
    _regDirectorNameController.dispose();
    _regAddressController.dispose();
    _regEmailController.dispose();
    _regPhoneController.dispose();
    _regPasswordController.dispose();
    _regConfirmPasswordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _handleLabSignIn() async {
    final input = _identifierController.text.trim();
    final pwd = _passwordController.text;

    if (input.isEmpty) {
      setState(() => _errorMessage = 'Please enter your registered Email or Mobile number.');
      return;
    }
    if (pwd.isEmpty) {
      setState(() => _errorMessage = 'Please enter your account password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await authApiService.login(
        identifier: input,
        password: pwd,
      );
      if (!mounted) return;
      setState(() => _isLoading = false);

      widget.onLoginSuccess(
        session.role,
        session.displayName,
        session.labName,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e is ApiException ? e.message : e.toString();
      });
    }
  }

  void _handleOfficeSignIn() async {
    final input = _identifierController.text.trim();
    final pwd = _passwordController.text;

    if (input.isEmpty) {
      setState(() => _errorMessage = 'Please enter your Office Employee ID or Email.');
      return;
    }
    if (pwd.isEmpty) {
      setState(() => _errorMessage = 'Please enter your account password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await authApiService.login(
        identifier: input,
        password: pwd,
      );
      if (!mounted) return;
      setState(() => _isLoading = false);

      widget.onLoginSuccess(
        session.role,
        session.displayName,
        session.labName,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e is ApiException ? e.message : e.toString();
      });
    }
  }

  void _handleRegisterSubmit() async {
    final labName = _regLabNameController.text.trim();
    final directorName = _regDirectorNameController.text.trim();
    final address = _regAddressController.text.trim();
    final email = _regEmailController.text.trim();
    final phone = _regPhoneController.text.trim();
    final password = _regPasswordController.text;
    final confirmPassword = _regConfirmPasswordController.text;

    if (labName.isEmpty || directorName.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please fill all mandatory registration fields.');
      return;
    }

    if (password != confirmPassword) {
      setState(() => _errorMessage = 'Password confirmation does not match.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await authApiService.registerCustomer(
        labName: labName,
        contactPersonName: directorName,
        labAddress: address.isNotEmpty ? address : 'Laboratory Facility Address',
        email: email,
        contactNumber: phone,
        password: password,
        confirmPassword: confirmPassword,
      );

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _otpToken = res['otpToken'] as String?;
        _debugOtp = res['debugOtp'] as String?;
        _currentFlow = LoginFlow.verifyOtp;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e is ApiException ? e.message : e.toString();
      });
    }
  }

  void _handleVerifyOtpSubmit() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter the complete 6-digit OTP code.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final session = await authApiService.verifyRegistrationOtp(
        otpToken: _otpToken ?? '',
        otp: otp,
        identifier: _regEmailController.text.trim(),
      );

      if (!mounted) return;
      setState(() => _isLoading = false);

      widget.onLoginSuccess(
        session.role,
        session.displayName,
        session.labName,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e is ApiException ? e.message : e.toString();
      });
    }
  }

  void _handleResendOtp() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await authApiService.resendOtp(
        otpToken: _otpToken ?? '',
        identifier: _regEmailController.text.trim(),
      );

      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _otpToken = res['otpToken'] as String? ?? _otpToken;
        _debugOtp = res['debugOtp'] as String? ?? _debugOtp;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message']?.toString() ?? 'New OTP code dispatched.')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e is ApiException ? e.message : e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primaryNavy,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: _buildFlowContent(),
        ),
      ),
    );
  }

  Widget _buildFlowContent() {
    switch (_currentFlow) {
      case LoginFlow.welcome:
        return _buildWelcomeFlow();
      case LoginFlow.labSignIn:
        return _buildSignInForm(isOffice: false);
      case LoginFlow.officeSignIn:
        return _buildSignInForm(isOffice: true);
      case LoginFlow.register:
        return _buildRegisterForm();
      case LoginFlow.verifyOtp:
        return _buildVerifyOtpForm();
    }
  }

  // 1. Welcome Screen
  Widget _buildWelcomeFlow() {
    return Column(
      children: [
        const Spacer(),

        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: const EdgeInsets.all(12),
          child: const Icon(
            Icons.biotech_rounded,
            color: AppColors.primaryNavy,
            size: 48,
          ),
        ),
        const SizedBox(height: 18),

        const Text(
          'Diagnostic Services',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.white,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Institutional Customer Portal',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.lightBlueGrey,
          ),
        ),

        const Spacer(),

        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () {
              setState(() {
                _errorMessage = null;
                _currentFlow = LoginFlow.labSignIn;
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.white,
              foregroundColor: AppColors.primaryNavy,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Sign In to Laboratory Account',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward, size: 16),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton(
            onPressed: () {
              setState(() {
                _errorMessage = null;
                _currentFlow = LoginFlow.register;
              });
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.secondaryBlue, width: 1.5),
              foregroundColor: AppColors.white,
              backgroundColor: AppColors.deepNavy,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text(
              'Create New Account',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
        ),

        const SizedBox(height: 24),

        TextButton.icon(
          onPressed: () {
            setState(() {
              _errorMessage = null;
              _currentFlow = LoginFlow.officeSignIn;
            });
          },
          icon: const Icon(Icons.badge_outlined, size: 16, color: AppColors.lightBlueGrey),
          label: const Text(
            'Office Use Only',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.lightBlueGrey,
            ),
          ),
        ),
        const SizedBox(height: 10),
      ],
    );
  }

  // 2. Sign In Form (Laboratory & Office Staff)
  Widget _buildSignInForm({required bool isOffice}) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () {
              setState(() {
                _errorMessage = null;
                _currentFlow = LoginFlow.welcome;
              });
            },
          ),
          const SizedBox(height: 16),
          Text(
            isOffice ? 'Office Staff Sign In' : 'Sign In to Laboratory Account',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            isOffice
                ? 'Field Sales, Biomedical Service Engineer & Central Operations'
                : 'Lab Owner, Lab Admin, and Lab Viewer access',
            style: const TextStyle(fontSize: 12, color: AppColors.lightBlueGrey),
          ),
          const SizedBox(height: 24),

          if (_errorMessage != null) _buildErrorBanner(_errorMessage!),

          TextField(
            controller: _identifierController,
            style: const TextStyle(color: AppColors.white),
            decoration: InputDecoration(
              labelText: isOffice ? 'Employee ID / Office Email' : 'Email ID / Mobile Number',
              labelStyle: const TextStyle(color: AppColors.lightBlueGrey, fontSize: 12),
              filled: true,
              fillColor: AppColors.deepNavy,
              prefixIcon: Icon(
                isOffice ? Icons.badge_outlined : Icons.person_outline,
                color: AppColors.lightBlueGrey,
                size: 20,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.secondaryBlue),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.secondaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 14),

          TextField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: AppColors.white),
            decoration: InputDecoration(
              labelText: 'Password',
              labelStyle: const TextStyle(color: AppColors.lightBlueGrey, fontSize: 12),
              filled: true,
              fillColor: AppColors.deepNavy,
              prefixIcon: const Icon(Icons.lock_outline, color: AppColors.lightBlueGrey, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: AppColors.lightBlueGrey,
                  size: 20,
                ),
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.secondaryBlue),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.secondaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : (isOffice ? _handleOfficeSignIn : _handleLabSignIn),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.white,
                foregroundColor: AppColors.primaryNavy,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryNavy),
                    )
                  : Text(
                      isOffice ? 'Authenticate Staff' : 'Sign In',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // 3. New Account Registration Form
  Widget _buildRegisterForm() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () {
              setState(() {
                _errorMessage = null;
                _currentFlow = LoginFlow.welcome;
              });
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Create New Account',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.white),
          ),
          const SizedBox(height: 4),
          const Text(
            'Register institutional hospital or clinical laboratory',
            style: TextStyle(fontSize: 12, color: AppColors.lightBlueGrey),
          ),
          const SizedBox(height: 20),

          if (_errorMessage != null) _buildErrorBanner(_errorMessage!),

          _buildCustomField(_regLabNameController, 'Laboratory Name', Icons.location_city_outlined),
          const SizedBox(height: 12),
          _buildCustomField(_regDirectorNameController, 'Director / Pathologist Name', Icons.person_outline),
          const SizedBox(height: 12),
          _buildCustomField(_regAddressController, 'Laboratory Address', Icons.map_outlined),
          const SizedBox(height: 12),
          _buildCustomField(_regEmailController, 'Official Email Address', Icons.email_outlined, keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 12),
          _buildCustomField(_regPhoneController, '10-Digit Mobile Number', Icons.phone_outlined, keyboardType: TextInputType.phone),
          const SizedBox(height: 12),

          TextField(
            controller: _regPasswordController,
            obscureText: _obscureRegPassword,
            style: const TextStyle(color: AppColors.white),
            decoration: InputDecoration(
              labelText: 'Create Password (min. 8 chars, 1 uppercase, 1 special)',
              labelStyle: const TextStyle(color: AppColors.lightBlueGrey, fontSize: 11),
              filled: true,
              fillColor: AppColors.deepNavy,
              prefixIcon: const Icon(Icons.lock_outline, color: AppColors.lightBlueGrey, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscureRegPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: AppColors.lightBlueGrey,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscureRegPassword = !_obscureRegPassword),
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
            ),
          ),
          const SizedBox(height: 12),

          TextField(
            controller: _regConfirmPasswordController,
            obscureText: _obscureRegPassword,
            style: const TextStyle(color: AppColors.white),
            decoration: InputDecoration(
              labelText: 'Confirm Password',
              labelStyle: const TextStyle(color: AppColors.lightBlueGrey, fontSize: 11),
              filled: true,
              fillColor: AppColors.deepNavy,
              prefixIcon: const Icon(Icons.lock_clock_outlined, color: AppColors.lightBlueGrey, size: 20),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleRegisterSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.white,
                foregroundColor: AppColors.primaryNavy,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryNavy),
                    )
                  : const Text('Submit Application & Send OTP', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  // 4. OTP Verification Screen
  Widget _buildVerifyOtpForm() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: AppColors.white),
            onPressed: () {
              setState(() {
                _errorMessage = null;
                _currentFlow = LoginFlow.register;
              });
            },
          ),
          const SizedBox(height: 16),
          const Text(
            'Verify Registration OTP',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.white),
          ),
          const SizedBox(height: 4),
          Text(
            'Enter the 6-digit verification code dispatched to ${_regPhoneController.text.trim()} and ${_regEmailController.text.trim()}',
            style: const TextStyle(fontSize: 12, color: AppColors.lightBlueGrey),
          ),
          const SizedBox(height: 20),

          if (_debugOtp != null && _debugOtp!.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E3A8A).withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF60A5FA)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Color(0xFF93C5FD), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Staging OTP Verification Code: $_debugOtp',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),

          if (_errorMessage != null) _buildErrorBanner(_errorMessage!),

          TextField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.white, fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              labelText: '6-Digit Verification Code',
              labelStyle: const TextStyle(color: AppColors.lightBlueGrey, fontSize: 12, letterSpacing: 0),
              filled: true,
              fillColor: AppColors.deepNavy,
              counterText: '',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleVerifyOtpSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.white,
                foregroundColor: AppColors.primaryNavy,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryNavy),
                    )
                  : const Text('Verify & Activate Account', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 12),

          Center(
            child: TextButton.icon(
              onPressed: _isLoading ? null : _handleResendOtp,
              icon: const Icon(Icons.refresh, size: 16, color: AppColors.lightBlueGrey),
              label: const Text('Resend Verification Code', style: TextStyle(color: AppColors.lightBlueGrey, fontSize: 13)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomField(
    TextEditingController controller,
    String label,
    IconData icon, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: AppColors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: AppColors.lightBlueGrey, fontSize: 12),
        filled: true,
        fillColor: AppColors.deepNavy,
        prefixIcon: Icon(icon, color: AppColors.lightBlueGrey, size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.secondaryBlue)),
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.red.shade900.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade400),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Colors.white, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}
