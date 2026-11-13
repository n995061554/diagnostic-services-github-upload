// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Cart & Order Review Domain Models
// File: /mobile/lib/features/cart/domain/models/cart_model.dart
// ============================================================================

import '../../../catalog/domain/models/catalog_models.dart';

class CartItemModel {
  final ProductModel product;
  final ProductPackOptionModel? selectedPackOption;
  final int quantity;

  CartItemModel({
    required this.product,
    this.selectedPackOption,
    required this.quantity,
  });

  /// Live unit price derived directly from the backend product / pack option
  double get unitPrice =>
      selectedPackOption != null ? selectedPackOption!.price : product.basePrice;

  /// Line total price
  double get totalPrice => unitPrice * quantity;

  CartItemModel copyWith({
    ProductModel? product,
    ProductPackOptionModel? selectedPackOption,
    int? quantity,
  }) {
    return CartItemModel(
      product: product ?? this.product,
      selectedPackOption: selectedPackOption ?? this.selectedPackOption,
      quantity: quantity ?? this.quantity,
    );
  }
}

class CartModel {
  final List<CartItemModel> items;

  CartModel({this.items = const []});

  int get totalItemCount => items.fold(0, (sum, item) => sum + item.quantity);

  /// Subtotal computed using live backend prices
  double get subtotal =>
      items.fold(0.0, (sum, item) => sum + item.totalPrice);

  /// GST calculated dynamically per product rate
  double get totalGst => items.fold(
      0.0,
      (sum, item) =>
          sum + (item.totalPrice * (item.product.gstRate / 100.0)));

  /// Grand total for checkout / order review
  double get grandTotal => subtotal + totalGst;

  bool get isEmpty => items.isEmpty;
}
