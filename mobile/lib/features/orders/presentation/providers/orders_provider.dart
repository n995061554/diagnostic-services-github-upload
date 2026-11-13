// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Riverpod Orders State Management
// File: /mobile/lib/features/orders/presentation/providers/orders_provider.dart
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/order_api_service.dart';
import '../../../../core/api/auth_api_service.dart';
import '../../domain/models/order_model.dart';

class OrdersState {
  final List<CustomerOrderModel> orders;
  final bool isLoading;
  final String? errorMessage;
  final String activeFilter; // 'ALL', 'PROCESSING', 'DISPATCHED', 'DELIVERED'

  OrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.errorMessage,
    this.activeFilter = 'ALL',
  });

  OrdersState copyWith({
    List<CustomerOrderModel>? orders,
    bool? isLoading,
    String? errorMessage,
    String? activeFilter,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
      activeFilter: activeFilter ?? this.activeFilter,
    );
  }

  List<CustomerOrderModel> get filteredOrders {
    if (activeFilter == 'ALL') return orders;
    return orders.where((o) => o.status.toUpperCase() == activeFilter).toList();
  }
}

class OrdersNotifier extends StateNotifier<OrdersState> {
  OrdersNotifier() : super(OrdersState()) {
    loadOrders();
  }

  Future<void> loadOrders() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final customerId = authApiService.currentSession?.userId;
      final liveOrders = await orderApiService.fetchCustomerOrders(
        customerId: customerId,
      );
      state = state.copyWith(
        isLoading: false,
        orders: liveOrders,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  void setFilter(String filter) {
    state = state.copyWith(activeFilter: filter);
  }
}

final ordersProvider = StateNotifierProvider<OrdersNotifier, OrdersState>((ref) {
  return OrdersNotifier();
});
