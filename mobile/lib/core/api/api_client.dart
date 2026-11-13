// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Core API Client with Token Interception & Cache-Busting
// File: /mobile/lib/core/api/api_client.dart
// ============================================================================

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiClient {
  final http.Client _client;
  String? _authToken;

  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  void setAuthToken(String? token) {
    _authToken = token;
  }

  String? get authToken => _authToken;

  Map<String, String> _buildHeaders([Map<String, String>? extraHeaders]) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Requirement 10: Ensure no stale caching of product prices
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };

    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }

    return headers;
  }

  Future<dynamic> get(String endpoint, {Map<String, String>? queryParams}) async {
    final base = AppConfig.apiBaseUrl;
    final path = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final uri = Uri.parse('$base$path').replace(queryParameters: queryParams);

    final response = await _client.get(uri, headers: _buildHeaders());

    return _processResponse(response);
  }

  Future<dynamic> post(
    String endpoint, {
    dynamic body,
    Map<String, String>? extraHeaders,
  }) async {
    final base = AppConfig.apiBaseUrl;
    final path = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    final uri = Uri.parse('$base$path');

    final response = await _client.post(
      uri,
      headers: _buildHeaders(extraHeaders),
      body: body != null ? jsonEncode(body) : null,
    );

    return _processResponse(response);
  }

  dynamic _processResponse(http.Response response) {
    final statusCode = response.statusCode;
    final bodyString = response.body;

    dynamic parsed;
    try {
      parsed = jsonDecode(bodyString);
    } catch (_) {
      parsed = bodyString;
    }

    if (statusCode >= 200 && statusCode < 300) {
      return parsed;
    } else {
      final msg = parsed is Map && parsed['message'] != null
          ? parsed['message']
          : 'HTTP Error $statusCode: ${response.reasonPhrase}';
      throw ApiException(statusCode, msg.toString());
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException ($statusCode): $message';
}

final defaultApiClient = ApiClient();
