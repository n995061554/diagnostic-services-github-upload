// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Unit & Integration Tests: Authentication, Pricing, Cart & Orders
// File: /mobile/test/api_services_test.dart
// ============================================================================

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:diagnostic_services/core/api/auth_api_service.dart';
import 'package:diagnostic_services/features/catalog/domain/models/catalog_models.dart';
import 'package:diagnostic_services/features/cart/domain/models/cart_model.dart';
import 'package:diagnostic_services/features/orders/domain/models/order_model.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Cart & Live Pricing Calculations', () {
    final productA = ProductModel(
      id: 'prod-001',
      sku: 'SKU-001',
      name: 'SGPT / ALT Liquid Reagent Kit',
      companyId: 'comp-01',
      categoryId: 'cat-01',
      productType: 'REAGENT',
      hsnCode: '38220090',
      gstRate: 12.0,
      basePrice: 1200.0,
      mrp: 1500.0,
      minOrderQuantity: 1,
      isColdChain: true,
      storageTemperature: '2°C to 8°C',
      requiresPrescriptionOrAuth: false,
      isActive: true,
      isFeatured: true,
      isDiscontinued: false,
      packSize: '2 x 50 mL',
      stockQuantity: 40,
      stockStatus: 'IN_STOCK',
      leadTimeDays: 2,
    );

    final productB = ProductModel(
      id: 'prod-002',
      sku: 'SKU-002',
      name: 'High Precision Pipette Tips',
      companyId: 'comp-02',
      categoryId: 'cat-02',
      productType: 'PLASTIC_CONSUMABLE',
      hsnCode: '39269099',
      gstRate: 18.0,
      basePrice: 500.0,
      mrp: 650.0,
      minOrderQuantity: 2,
      isColdChain: false,
      storageTemperature: 'Ambient',
      requiresPrescriptionOrAuth: false,
      isActive: true,
      isFeatured: false,
      isDiscontinued: false,
      packSize: '1000 Tips',
      stockQuantity: 100,
      stockStatus: 'IN_STOCK',
      leadTimeDays: 1,
    );

    test('Computes unit price, subtotal, per-product GST, and grand total correctly', () {
      final item1 = CartItemModel(product: productA, quantity: 2); // 2 * 1200 = 2400 (GST @ 12% = 288)
      final item2 = CartItemModel(product: productB, quantity: 3); // 3 * 500 = 1500 (GST @ 18% = 270)
      final cart = CartModel(items: [item1, item2]);

      expect(cart.totalItemCount, equals(5));
      expect(cart.subtotal, equals(3900.0));
      expect(cart.totalGst, equals(558.0));
      expect(cart.grandTotal, equals(4458.0));
    });

    test('Applies pack option pricing multipliers accurately', () {
      final packOption = ProductPackOptionModel(
        id: 'pack-bulk',
        productId: 'prod-001',
        packName: 'Bulk Lab Pack (5 x 50 mL)',
        multiplier: 2.5,
        price: 2800.0,
        isDefault: false,
      );

      final item = CartItemModel(
        product: productA,
        selectedPackOption: packOption,
        quantity: 2,
      );

      expect(item.unitPrice, equals(2800.0));
      expect(item.totalPrice, equals(5600.0));
    });
  });

  group('Order Deserialization & Robustness', () {
    test('Parses server-generated order payload with aliases and fallbacks', () {
      final serverOrderJson = {
        'id': 'ord-12345',
        'orderNumber': 'ORD-2026-9912',
        'customerId': 'u-cust-01',
        'customerLabName': 'Apex Clinical Laboratories',
        'status': 'PROCESSING',
        'createdAt': '2026-10-11T20:00:00Z',
        'deliveryDate': 'Tomorrow, by 2:00 PM',
        'subtotal': 5000.0,
        'gstAmount': 600.0,
        'coldChainFee': 450.0,
        'grandTotal': 6050.0,
        'paymentMethod': 'CREDIT_ORDER',
        'paymentStatus': 'CREDIT_ACCOUNT',
        'items': [
          {
            'productId': 'prod-001',
            'productName': 'SGPT Reagent Kit',
            'productSku': 'SKU-001',
            'quantity': 2,
            'unitPrice': 2500.0,
            'totalPrice': 5000.0,
            'isColdChain': true,
          }
        ],
      };

      final order = CustomerOrderDetailedModel.fromJson(serverOrderJson);

      expect(order.id, equals('ord-12345'));
      expect(order.orderNumber, equals('ORD-2026-9912'));
      expect(order.siteName, equals('Apex Clinical Laboratories'));
      expect(order.subtotal, equals(5000.0));
      expect(order.taxAmount, equals(600.0));
      expect(order.coldChainFee, equals(450.0));
      expect(order.totalAmount, equals(6050.0));
      expect(order.items.length, equals(1));
      expect(order.items[0].productName, equals('SGPT Reagent Kit'));
      expect(order.items[0].isColdChain, isTrue);
    });
  });

  group('Session Persistence Lifecycle', () {
    test('Stores and clears authentication credentials safely in SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      final authService = AuthApiService();

      expect(authService.isAuthenticated, isFalse);

      final restored = await authService.restoreSession();
      expect(restored, isNull);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_access_token', 'jwt_test_token_sample');
      await prefs.setString('auth_user_id', 'u-cust-01');
      await prefs.setString('auth_email', 'dr.kulkarni@apexlab.com');
      await prefs.setString('auth_role', 'OWNER');
      await prefs.setString('auth_first_name', 'Dr. Arvind');
      await prefs.setString('auth_last_name', 'Kulkarni');
      await prefs.setString('auth_lab_name', 'Apex Clinical Laboratories');

      final activeSession = await authService.restoreSession();
      expect(activeSession, isNotNull);
      expect(activeSession!.userId, equals('u-cust-01'));
      expect(activeSession.role, equals('OWNER'));
      expect(activeSession.displayName, equals('Dr. Arvind Kulkarni'));

      await authService.logout();
      expect(authService.isAuthenticated, isFalse);

      final afterLogout = await authService.restoreSession();
      expect(afterLogout, isNull);
    });
  });
}
