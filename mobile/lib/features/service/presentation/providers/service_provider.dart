// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Riverpod Service Tickets State Management
// File: /mobile/lib/features/service/presentation/providers/service_provider.dart
// ============================================================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/service_ticket_model.dart';

class ServiceTicketsState {
  final List<CustomerServiceTicketModel> tickets;
  final bool isLoading;
  final String? errorMessage;
  final String activeFilter; // 'ALL', 'OPEN', 'RESOLVED'

  ServiceTicketsState({
    this.tickets = const [],
    this.isLoading = false,
    this.errorMessage,
    this.activeFilter = 'ALL',
  });

  ServiceTicketsState copyWith({
    List<CustomerServiceTicketModel>? tickets,
    bool? isLoading,
    String? errorMessage,
    String? activeFilter,
  }) {
    return ServiceTicketsState(
      tickets: tickets ?? this.tickets,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage ?? this.errorMessage,
      activeFilter: activeFilter ?? this.activeFilter,
    );
  }

  List<CustomerServiceTicketModel> get filteredTickets {
    if (activeFilter == 'ALL') return tickets;
    return tickets.where((t) => t.status.toUpperCase() == activeFilter).toList();
  }
}

class ServiceTicketsNotifier extends StateNotifier<ServiceTicketsState> {
  ServiceTicketsNotifier() : super(ServiceTicketsState()) {
    loadTickets();
  }

  Future<void> loadTickets() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      // Connects to /api/v1/service/tickets
      await Future.delayed(const Duration(milliseconds: 300));
      state = state.copyWith(isLoading: false, tickets: []);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void setFilter(String filter) {
    state = state.copyWith(activeFilter: filter);
  }
}

final serviceTicketsProvider = StateNotifierProvider<ServiceTicketsNotifier, ServiceTicketsState>((ref) {
  return ServiceTicketsNotifier();
});
