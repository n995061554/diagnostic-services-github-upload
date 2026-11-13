// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Cart State Notifier & Provider
// File: /mobile/lib/features/cart/presentation/providers/cart_provider.dart
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../catalog/domain/models/catalog_models.dart';
import '../../domain/models/cart_model.dart';

class CartNotifier extends StateNotifier<CartModel> {
  CartNotifier() : super(CartModel());

  void addItem(ProductModel product, {ProductPackOptionModel? packOption, int quantity = 1}) {
    final existingIndex = state.items.indexWhere(
      (item) => item.product.id == product.id && item.selectedPackOption?.id == packOption?.id,
    );

    if (existingIndex >= 0) {
      final updatedList = List<CartItemModel>.from(state.items);
      final current = updatedList[existingIndex];
      updatedList[existingIndex] = current.copyWith(
        product: product, // Ensure freshest product price is used
        quantity: current.quantity + quantity,
      );
      state = CartModel(items: updatedList);
    } else {
      state = CartModel(
        items: [
          ...state.items,
          CartItemModel(
            product: product,
            selectedPackOption: packOption,
            quantity: quantity,
          ),
        ],
      );
    }
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    final updated = state.items.map((item) {
      if (item.product.id == productId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();

    state = CartModel(items: updated);
  }

  void removeItem(String productId) {
    state = CartModel(
      items: state.items.where((i) => i.product.id != productId).toList(),
    );
  }

  /// Automatically updates all cart items with fresh backend prices
  void syncPricesWithUpdatedProducts(List<ProductModel> liveProducts) {
    final updated = state.items.map((item) {
      final fresh = liveProducts.firstWhere(
        (p) => p.id == item.product.id,
        orElse: () => item.product,
      );
      return item.copyWith(product: fresh);
    }).toList();

    state = CartModel(items: updated);
  }

  void clearCart() {
    state = CartModel(items: const []);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartModel>((ref) {
  return CartNotifier();
});
