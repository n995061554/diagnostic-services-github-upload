// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Orders & Reorders Screen
// File: /mobile/lib/features/orders/presentation/screens/orders_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/orders_provider.dart';
import '../../domain/models/order_model.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Purchase Orders & Reorders'),
        elevation: 0,
        backgroundColor: const Color(0xFF22381E),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFFF5F6F0),
            child: Row(
              children: [
                _buildFilterChip(context, ref, 'ALL', 'All Orders'),
                const SizedBox(width: 8),
                _buildFilterChip(context, ref, 'PROCESSING', 'In Transit'),
                const SizedBox(width: 8),
                _buildFilterChip(context, ref, 'DELIVERED', 'Delivered'),
              ],
            ),
          ),

          // Orders List
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.filteredOrders.isEmpty
                    ? _buildEmptyState(context)
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.filteredOrders.length,
                        itemBuilder: (context, index) {
                          final order = state.filteredOrders[index];
                          return _buildOrderCard(context, order);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, WidgetRef ref, String key, String label) {
    final current = ref.watch(ordersProvider).activeFilter;
    final isSelected = current == key;

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: const Color(0xFF22381E),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFFD2E7C4) : const Color(0xFF415439),
        fontWeight: FontWeight.bold,
        fontSize: 12,
      ),
      onSelected: (_) => ref.read(ordersProvider.notifier).setFilter(key),
    );
  }

  Widget _buildOrderCard(BuildContext context, CustomerOrderModel order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFD2E7C4)),
      ),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Order #${order.orderNumber}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE4F1DC),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    order.status,
                    style: const TextStyle(
                      color: Color(0xFF22381E),
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${order.items.length} items • ₹${order.totalAmount.toStringAsFixed(0)}',
              style: const TextStyle(color: Color(0xFF415439), fontSize: 12),
            ),
            if (order.coldChainMonitoring?.required == true) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.ac_unit, size: 14, color: Color(0xFF1E331B)),
                  const SizedBox(width: 4),
                  Text(
                    'Cold-Chain Active (${order.coldChainMonitoring?.currentTemp})',
                    style: const TextStyle(
                      color: Color(0xFF1E331B),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFF6B7F6A)),
          SizedBox(height: 12),
          Text(
            'No purchase orders found',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          SizedBox(height: 4),
          Text(
            'Place reagents in cart to create an institutional order',
            style: TextStyle(color: Color(0xFF6B7F6A), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
