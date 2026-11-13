// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Service Tickets Screen
// File: /mobile/lib/features/service/presentation/screens/service_ticket_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/service_provider.dart';
import '../../domain/models/service_ticket_model.dart';

class ServiceTicketScreen extends ConsumerWidget {
  const ServiceTicketScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(serviceTicketsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Biomedical Service Support'),
        backgroundColor: const Color(0xFF22381E),
        foregroundColor: Colors.white,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Open raise ticket modal/screen
        },
        backgroundColor: const Color(0xFF22381E),
        foregroundColor: const Color(0xFFD2E7C4),
        icon: const Icon(Icons.add),
        label: const Text('Raise Ticket', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          // SLA Banner
          Container(
            padding: const EdgeInsets.all(12),
            color: const Color(0xFFE4F1DC),
            child: const Row(
              children: [
                Icon(Icons.shield_outlined, size: 20, color: Color(0xFF22381E)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'NABL Partner Active SLA: 4-Hour Response Guarantee',
                    style: TextStyle(
                      color: Color(0xFF22381E),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Tickets List
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.filteredTickets.isEmpty
                    ? _buildEmptyState(context)
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.filteredTickets.length,
                        itemBuilder: (context, index) {
                          final ticket = state.filteredTickets[index];
                          return _buildTicketCard(context, ticket);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketCard(BuildContext context, CustomerServiceTicketModel ticket) {
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
                  '#${ticket.ticketNumber}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22381E),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    ticket.status,
                    style: const TextStyle(
                      color: Color(0xFFD2E7C4),
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              ticket.title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Text(
              ticket.description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF415439), fontSize: 12),
            ),
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
          Icon(Icons.build_circle_outlined, size: 48, color: Color(0xFF6B7F6A)),
          SizedBox(height: 12),
          Text(
            'No active service tickets',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          SizedBox(height: 4),
          Text(
            'Tap "Raise Ticket" if an analyzer requires engineer assistance',
            style: TextStyle(color: Color(0xFF6B7F6A), fontSize: 12),
          ),
        ],
      ),
    );
  }
}
