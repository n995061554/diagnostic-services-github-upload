// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP (FLUTTER)
// Application Entry Point with Inter Typography & MainShell
// File: /mobile/lib/main.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/api/auth_api_service.dart';
import 'core/config/app_config.dart';
import 'core/theme/app_theme.dart';
import 'features/home/presentation/screens/main_shell_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Restore existing session if present
  final existingSession = await authApiService.restoreSession();

  debugPrint('Diagnostic Services Mobile App started.');
  debugPrint('Active API Base URL: ${AppConfig.apiBaseUrl}');
  if (existingSession != null) {
    debugPrint('Restored active session for: ${existingSession.email} (${existingSession.role})');
  }

  runApp(
    ProviderScope(
      child: DiagnosticServicesApp(
        initialAuthenticated: existingSession != null,
      ),
    ),
  );
}

class DiagnosticServicesApp extends StatefulWidget {
  final Widget? home;
  final bool initialAuthenticated;

  const DiagnosticServicesApp({
    super.key,
    this.home,
    this.initialAuthenticated = true,
  });

  @override
  State<DiagnosticServicesApp> createState() => _DiagnosticServicesAppState();
}

class _DiagnosticServicesAppState extends State<DiagnosticServicesApp> {
  late bool _isAuthenticated;
  String _userRole = 'OWNER';
  String _userName = 'Dr. Arvind Kulkarni';
  String _labName = 'Apex Clinical & Pathology Laboratories';

  @override
  void initState() {
    super.initState();
    _isAuthenticated = widget.initialAuthenticated;

    final session = authApiService.currentSession;
    if (session != null) {
      _userRole = session.role;
      _userName = session.displayName;
      _labName = session.labName;
    }
  }

  void _handleLoginSuccess(String role, String name, String labName) {
    setState(() {
      _isAuthenticated = true;
      _userRole = role;
      _userName = name;
      _labName = labName;
    });
  }

  void _handleSignOut() async {
    await authApiService.logout();
    setState(() {
      _isAuthenticated = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Diagnostic Services',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: widget.home ??
          (_isAuthenticated
              ? MainShellScreen(
                  userRole: _userRole,
                  userName: _userName,
                  labName: _labName,
                  onSignOut: _handleSignOut,
                )
              : LoginScreen(
                  onLoginSuccess: _handleLoginSuccess,
                )),
    );
  }
}
