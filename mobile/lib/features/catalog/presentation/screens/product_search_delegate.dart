// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Screen 4: Product Search Delegate (Full-Text Diagnostic Search)
// File: /mobile/lib/features/catalog/presentation/screens/product_search_delegate.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/catalog_provider.dart';
import 'product_detail_screen.dart';

class ProductSearchDelegate extends SearchDelegate<String> {
  final WidgetRef ref;

  ProductSearchDelegate(this.ref)
      : super(
          searchFieldLabel: 'Search reagents, kits, SKU or catalog #...',
          searchFieldStyle: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
        );

  final List<String> recentSearches = [
    'Glucose reagent Roche',
    'Sysmex CELLPACK DCL',
    'Troponin I Abbott',
    'EDTA Blood Tubes 3mL',
    'Erba Chem 7 Transasia',
    'Bio-Rad Liquichek QC',
  ];

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear, color: Color(0xFF64748B)),
          onPressed: () {
            query = '';
            showSuggestions(context);
          },
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
      onPressed: () => close(context, ''),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    ref.read(catalogFilterProvider.notifier).setSearchQuery(query);
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.saved_search, size: 64, color: Color(0xFF2563EB)),
          const SizedBox(height: 12),
          Text(
            'Showing matching diagnostic items for "$query"',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ProductDetailScreen(productId: 'prod-search-01'),
                ),
              );
            },
            child: const Text('Open First Result', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    final suggestions = query.isEmpty
        ? recentSearches
        : recentSearches
            .where((s) => s.toLowerCase().contains(query.toLowerCase()))
            .toList();

    return ListView.builder(
      itemCount: suggestions.length,
      itemBuilder: (context, index) {
        final suggestion = suggestions[index];
        return ListTile(
          leading: const Icon(Icons.history, color: Color(0xFF94A3B8)),
          title: Text(
            suggestion,
            style: const TextStyle(fontSize: 13, color: Color(0xFF334155)),
          ),
          trailing: const Icon(Icons.north_west, size: 14, color: Color(0xFFCBD5E1)),
          onTap: () {
            query = suggestion;
            showResults(context);
          },
        );
      },
    );
  }
}
