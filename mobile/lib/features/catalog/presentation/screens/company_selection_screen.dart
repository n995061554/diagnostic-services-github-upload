// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Screen 1: Company Selection Screen (Manufacturer & Brand Grid)
// File: /mobile/lib/features/catalog/presentation/screens/company_selection_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/catalog_provider.dart';
import 'product_list_screen.dart';

class CompanySelectionScreen extends ConsumerWidget {
  const CompanySelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // In a full Flutter build, this would watch a companyListProvider
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: const Text(
          'Diagnostic Principals',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: Color(0xFF475569)),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Select Diagnostic Manufacturer',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Explore OEM reagents, analyzers, controls, and calibration kits directly from certified brands.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.95,
                ),
                itemCount: 8, // Demonstrative count for preview
                itemBuilder: (context, index) {
                  return _CompanyCard(
                    index: index,
                    onTap: (companyId) {
                      ref.read(catalogFilterProvider.notifier).selectCompany(companyId);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ProductListScreen()),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CompanyCard extends StatelessWidget {
  final int index;
  final Function(String) onTap;

  const _CompanyCard({required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final companies = [
      {'id': 'comp-roche', 'name': 'Roche Diagnostics', 'country': 'Switzerland', 'code': 'ROCHE', 'color': 0xFF2563EB},
      {'id': 'comp-abbott', 'name': 'Abbott Diagnostics', 'country': 'USA', 'code': 'ABBOTT', 'color': 0xFF0D9488},
      {'id': 'comp-sysmex', 'name': 'Sysmex Corporation', 'country': 'Japan', 'code': 'SYSMEX', 'color': 0xFFDC2626},
      {'id': 'comp-transasia', 'name': 'Transasia Bio-Medicals', 'country': 'India', 'code': 'TRANSASIA', 'color': 0xFF7C3AED},
      {'id': 'comp-siemens', 'name': 'Siemens Healthineers', 'country': 'Germany', 'code': 'SIEMENS', 'color': 0xFF0284C7},
      {'id': 'comp-biorad', 'name': 'Bio-Rad Laboratories', 'country': 'USA', 'code': 'BIO-RAD', 'color': 0xFFEA580C},
      {'id': 'comp-mindray', 'name': 'Mindray Bio-Medical', 'country': 'China', 'code': 'MINDRAY', 'color': 0xFF059669},
      {'id': 'comp-beckman', 'name': 'Beckman Coulter', 'country': 'USA', 'code': 'BECKMAN', 'color': 0xFF4F46E5},
    ];

    final comp = companies[index % companies.length];

    return InkWell(
      onTap: () => onTap(comp['id'] as String),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Color(comp['color'] as int).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    comp['code'] as String,
                    style: TextStyle(
                      color: Color(comp['color'] as int),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Icon(Icons.arrow_forward_ios, size: 12, color: Color(0xFF94A3B8)),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  comp['name'] as String,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'Origin: ${comp['country']}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'View All Products →',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
