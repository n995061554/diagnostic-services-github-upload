// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Environment Configuration & Staging API URL Manager
// File: /mobile/lib/core/config/app_config.dart
// ============================================================================

import 'package:flutter/foundation.dart';

class AppConfig {
  AppConfig._();

  /// Default API base URL passed via dart-define during build:
  /// flutter build apk --release --dart-define=API_BASE_URL=https://<PRODUCTION-OR-STAGING-DOMAIN>
  static const String _envBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kReleaseMode ? 'https://api.diagnosticservices.com' : 'http://10.0.2.2:3000',
  );

  /// Runtime mutable override for dynamic environment switching in staging tests
  static String? _runtimeOverrideUrl;

  /// Current active API Base URL
  static String get apiBaseUrl {
    String url;
    if (_runtimeOverrideUrl != null && _runtimeOverrideUrl!.isNotEmpty) {
      url = _cleanUrl(_runtimeOverrideUrl!);
    } else if (_envBaseUrl.isNotEmpty) {
      url = _cleanUrl(_envBaseUrl);
    } else {
      url = kReleaseMode
          ? 'https://api.diagnosticservices.com'
          : (defaultTargetPlatform == TargetPlatform.android
              ? 'http://10.0.2.2:3000'
              : 'http://localhost:3000');
    }

    // Enforce HTTPS in release mode to prevent cleartext transmission
    if (kReleaseMode && url.startsWith('http://')) {
      url = url.replaceFirst('http://', 'https://');
    }

    return url;
  }

  /// Override API base URL at runtime (e.g. for custom staging testing)
  static void setBaseUrl(String url) {
    if (kReleaseMode && url.startsWith('http://')) {
      throw UnsupportedError('Cleartext HTTP is not allowed in release mode.');
    }
    _runtimeOverrideUrl = url;
  }

  /// Reset runtime override back to environment define
  static void resetBaseUrl() {
    _runtimeOverrideUrl = null;
  }

  /// Whether current build is targeting a live HTTPS backend
  static bool get isHttps => apiBaseUrl.startsWith('https://');

  static String _cleanUrl(String url) {
    var cleaned = url.trim();
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.substring(0, cleaned.length - 1);
    }
    return cleaned;
  }
}
