// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Order Creation & Customer Orders API Service
// File: /mobile/lib/core/api/order_api_service.dart
// ============================================================================

import 'api_client.dart';
import '../../features/orders/domain/models/order_model.dart';

class OrderApiService {
  final ApiClient _apiClient;

  OrderApiService({ApiClient? apiClient})
      : _apiClient = apiClient ?? defaultApiClient;

  /// Places a customer diagnostic purchase order with authoritative server pricing
  Future<CustomerOrderDetailedModel> placeOrder({
    required String customerId,
    required List<Map<String, dynamic>> items,
    String paymentMethod = 'CREDIT_ORDER',
    String? deliveryAddressId,
    String? customShippingAddress,
    String? orderNotes,
    String? idempotencyKey,
  }) async {
    final payload = <String, dynamic>{
      'customerId': customerId,
      'items': items,
      'paymentMethod': paymentMethod,
      if (deliveryAddressId != null) 'deliveryAddressId': deliveryAddressId,
      if (customShippingAddress != null) 'customShippingAddress': customShippingAddress,
      if (orderNotes != null) 'orderNotes': orderNotes,
    };

    final headers = <String, String>{};
    if (idempotencyKey != null && idempotencyKey.isNotEmpty) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    final res = await _apiClient.post(
      '/api/v1/customer/orders/place',
      body: payload,
      extraHeaders: headers.isNotEmpty ? headers : null,
    );

    Map<String, dynamic> orderData;
    if (res is Map<String, dynamic>) {
      if (res['data'] is Map<String, dynamic>) {
        orderData = res['data'] as Map<String, dynamic>;
      } else {
        orderData = res;
      }
    } else {
      throw ApiException(500, 'Unexpected response format from order placement');
    }

    return CustomerOrderDetailedModel.fromJson(orderData);
  }

  /// Fetches orders list for the current customer account with tenant isolation
  Future<List<CustomerOrderDetailedModel>> fetchCustomerOrders({
    String? customerId,
  }) async {
    final queryParams = <String, String>{};
    if (customerId != null && customerId.isNotEmpty) {
      queryParams['customerId'] = customerId;
    }

    final res = await _apiClient.get(
      '/api/v1/customer/orders',
      queryParams: queryParams.isNotEmpty ? queryParams : null,
    );

    List<dynamic> list = [];
    if (res is Map<String, dynamic>) {
      if (res['data'] is List) {
        list = res['data'] as List<dynamic>;
      } else if (res['orders'] is List) {
        list = res['orders'] as List<dynamic>;
      }
    } else if (res is List) {
      list = res;
    }

    return list
        .map((it) => CustomerOrderDetailedModel.fromJson(it as Map<String, dynamic>))
        .toList();
  }
}

final orderApiService = OrderApiService();
