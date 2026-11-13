// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Riverpod Catalog State Management & Live Backend Sync
// File: /mobile/lib/features/catalog/presentation/providers/catalog_provider.dart
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/catalog_models.dart';
import '../../../../core/api/catalog_api_service.dart';
import '../../../cart/presentation/providers/cart_provider.dart';

// Catalog Filter State
class CatalogFilterState {
  final String? searchQuery;
  final String? selectedCompanyId;
  final String? selectedCategoryId;
  final String? selectedProductType;
  final String? packSize;
  final String availability; // 'ALL', 'IN_STOCK', 'COLD_CHAIN'
  final bool? isColdChain;
  final String sortBy;
  final int page;
  final int limit;

  CatalogFilterState({
    this.searchQuery,
    this.selectedCompanyId,
    this.selectedCategoryId,
    this.selectedProductType,
    this.packSize,
    this.availability = 'ALL',
    this.isColdChain,
    this.sortBy = 'name',
    this.page = 1,
    this.limit = 50,
  });

  CatalogFilterState copyWith({
    String? searchQuery,
    String? selectedCompanyId,
    String? selectedCategoryId,
    String? selectedProductType,
    String? packSize,
    String? availability,
    bool? isColdChain,
    String? sortBy,
    int? page,
    int? limit,
    bool clearCompany = false,
    bool clearCategory = false,
    bool clearType = false,
  }) {
    return CatalogFilterState(
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCompanyId: clearCompany ? null : (selectedCompanyId ?? this.selectedCompanyId),
      selectedCategoryId: clearCategory ? null : (selectedCategoryId ?? this.selectedCategoryId),
      selectedProductType: clearType ? null : (selectedProductType ?? this.selectedProductType),
      packSize: packSize ?? this.packSize,
      availability: availability ?? this.availability,
      isColdChain: isColdChain ?? this.isColdChain,
      sortBy: sortBy ?? this.sortBy,
      page: page ?? this.page,
      limit: limit ?? this.limit,
    );
  }
}

class CatalogFilterNotifier extends StateNotifier<CatalogFilterState> {
  CatalogFilterNotifier() : super(CatalogFilterState());

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query, page: 1);
  }

  void selectCompany(String? companyId) {
    if (companyId == null) {
      state = state.copyWith(clearCompany: true, page: 1);
    } else {
      state = state.copyWith(selectedCompanyId: companyId, page: 1);
    }
  }

  void selectCategory(String? categoryId) {
    if (categoryId == null) {
      state = state.copyWith(clearCategory: true, page: 1);
    } else {
      state = state.copyWith(selectedCategoryId: categoryId, page: 1);
    }
  }

  void selectProductType(String? type) {
    if (type == null) {
      state = state.copyWith(clearType: true, page: 1);
    } else {
      state = state.copyWith(selectedProductType: type, page: 1);
    }
  }

  void setAvailability(String availability) {
    state = state.copyWith(availability: availability, page: 1);
  }

  void toggleColdChainOnly(bool onlyColdChain) {
    state = state.copyWith(isColdChain: onlyColdChain ? true : null, page: 1);
  }

  void resetFilters() {
    state = CatalogFilterState();
  }
}

final catalogFilterProvider =
    StateNotifierProvider<CatalogFilterNotifier, CatalogFilterState>((ref) {
  return CatalogFilterNotifier();
});

/// Live backend products provider
/// Requirement 10: Product prices are fetched fresh every time
final productsListProvider = FutureProvider.autoDispose<List<ProductModel>>((ref) async {
  final filter = ref.watch(catalogFilterProvider);
  final products = await catalogApiService.fetchProducts(
    search: filter.searchQuery,
    companyId: filter.selectedCompanyId,
    categoryId: filter.selectedCategoryId,
    productType: filter.selectedProductType,
    isColdChain: filter.isColdChain,
    availability: filter.availability,
    page: filter.page,
    limit: filter.limit,
  );

  // Sync fresh prices with cart
  ref.read(cartProvider.notifier).syncPricesWithUpdatedProducts(products);

  return products;
});

/// Single product live details provider
final productDetailProvider =
    FutureProvider.autoDispose.family<ProductModel, String>((ref, productId) async {
  return await catalogApiService.fetchProductDetail(productId);
});
