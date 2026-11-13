// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Catalog API Service - Live Backend Integration
// File: /mobile/lib/core/api/catalog_api_service.dart
// ============================================================================

import 'api_client.dart';
import '../../features/catalog/domain/models/catalog_models.dart';

class CatalogApiService {
  final ApiClient _apiClient;

  CatalogApiService({ApiClient? apiClient})
      : _apiClient = apiClient ?? defaultApiClient;

  /// Fetch list of products directly from live backend
  /// Requirement 10: Product prices are fetched fresh every time
  Future<List<ProductModel>> fetchProducts({
    String? search,
    String? companyId,
    String? categoryId,
    String? productType,
    bool? isColdChain,
    String? availability,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (companyId != null && companyId.isNotEmpty) queryParams['companyId'] = companyId;
    if (categoryId != null && categoryId.isNotEmpty) queryParams['categoryId'] = categoryId;
    if (productType != null && productType.isNotEmpty) queryParams['productType'] = productType;
    if (isColdChain != null) queryParams['isColdChain'] = isColdChain.toString();
    if (availability != null && availability.isNotEmpty) queryParams['availability'] = availability;

    final res = await _apiClient.get('/api/v1/products', queryParams: queryParams);

    List<dynamic> items = [];
    if (res is Map<String, dynamic>) {
      if (res['data'] is List) {
        items = res['data'] as List<dynamic>;
      } else if (res['products'] is List) {
        items = res['products'] as List<dynamic>;
      }
    } else if (res is List) {
      items = res;
    }

    return items
        .map((item) => ProductModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Fetch single product details with live price from backend
  Future<ProductModel> fetchProductDetail(String productId) async {
    final res = await _apiClient.get('/api/v1/products/$productId');
    final Map<String, dynamic> data =
        (res is Map<String, dynamic> && res['data'] != null)
            ? res['data'] as Map<String, dynamic>
            : res as Map<String, dynamic>;

    return ProductModel.fromJson(data);
  }
}

final catalogApiService = CatalogApiService();
