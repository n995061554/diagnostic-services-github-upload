// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP
// Checkout & Order Review Screen
// File: /mobile/lib/features/cart/presentation/screens/checkout_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/auth_api_service.dart';
import '../../../../core/api/order_api_service.dart';
import '../../../orders/presentation/providers/orders_provider.dart';
import '../providers/cart_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  bool _isSubmitting = false;
  String? _errorMessage;

  void _placeOrder() async {
    final cart = ref.read(cartProvider);
    if (cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot place an order with an empty cart.')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final session = authApiService.currentSession;
      final customerId = session?.userId ?? 'u-cust-01';

      final itemsPayload = cart.items.map((it) {
        return <String, dynamic>{
          'productId': it.product.id,
          if (it.selectedPackOption != null)
            'packOptionId': it.selectedPackOption!.id,
          'quantity': it.quantity,
        };
      }).toList();

      final idempotencyKey =
          'mob-ord-${DateTime.now().millisecondsSinceEpoch}-${itemsPayload.length}';

      final createdOrder = await orderApiService.placeOrder(
        customerId: customerId,
        items: itemsPayload,
        paymentMethod: 'CREDIT_ORDER',
        customShippingAddress: session?.labAddress ??
            'Ground Floor, Sunrise Healthcare Complex, LBS Marg, Powai, Mumbai - 400076',
        idempotencyKey: idempotencyKey,
      );

      if (!mounted) return;

      // Successful order: persist, clear cart, refresh orders list
      ref.read(cartProvider.notifier).clearCart();
      ref.read(ordersProvider.notifier).loadOrders();

      setState(() => _isSubmitting = false);

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: Color(0xFF059669), size: 28),
              SizedBox(width: 8),
              Text('Order Confirmed', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(
            'Order #${createdOrder.orderNumber} for ₹${createdOrder.totalAmount.toStringAsFixed(0)} has been placed and verified by Diagnostic Services warehouse dispatch.',
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                Navigator.pop(ctx); // Close dialog
                Navigator.pop(context); // Close checkout
                Navigator.pop(context); // Close cart
              },
              child: const Text('Back to Catalog', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _errorMessage = e is ApiException ? e.message : e.toString();
      });

      // Crucial: Cart is NOT cleared and success dialog is NOT shown
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 28),
              SizedBox(width: 8),
              Text('Order Failed', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(
            'Could not complete purchase order submission:\n\n${_errorMessage ?? "Unknown error"}\n\nYour cart items have been preserved.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Review Cart & Retry'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Order Review & Checkout',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Lab Delivery Details Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.local_hospital_outlined, color: Color(0xFF2563EB), size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Institutional Delivery Site',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Metropolis Core Clinical Diagnostic Laboratory',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Plot 44, Worli Sea Face, Mumbai 400018',
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Order Review Items
            const Text(
              'Items Summary',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: cart.items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              Text(
                                '${item.quantity} x ₹${item.unitPrice.toStringAsFixed(0)} (${item.selectedPackOption?.packName ?? item.product.packSize})',
                                style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹${item.totalPrice.toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // Pricing Breakdown Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Price Breakdown',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Items Subtotal (excl. GST)', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                      Text('₹${cart.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Applicable GST', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                      Text('₹${cart.totalGst.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Payable',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                      ),
                      Text(
                        '₹${cart.grandTotal.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isSubmitting ? null : _placeOrder,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text(
                        'Confirm Purchase Order',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
