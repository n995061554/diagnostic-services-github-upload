// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Screen 3: Product List Screen with Filters & Search (Live Backend Integration)
// File: /mobile/lib/features/catalog/presentation/screens/product_list_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/catalog_models.dart';
import '../providers/catalog_provider.dart';
import '../../../cart/presentation/providers/cart_provider.dart';
import '../../../cart/presentation/screens/cart_screen.dart';
import 'product_detail_screen.dart';
import 'product_search_delegate.dart';

class ProductListScreen extends ConsumerWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filterState = ref.watch(catalogFilterProvider);
    final asyncProducts = ref.watch(productsListProvider);
    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: AppColors.primaryNavy,
        foregroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          'Diagnostic Catalog',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontSize: 17,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.lightBlueGrey),
            onPressed: () {
              showSearch(
                context: context,
                delegate: ProductSearchDelegate(ref),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list, color: AppColors.lightBlueGrey),
            onPressed: () => _showFilterBottomSheet(context, ref),
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.lightBlueGrey),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CartScreen()),
                  );
                },
              ),
              if (cart.totalItemCount > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFF2563EB),
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${cart.totalItemCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Horizontal Scroll
          Container(
            height: 48,
            color: Colors.white,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                _buildFilterChip(
                  label: 'All Items',
                  isSelected: filterState.selectedProductType == null &&
                      filterState.isColdChain == null,
                  onTap: () =>
                      ref.read(catalogFilterProvider.notifier).resetFilters(),
                ),
                _buildFilterChip(
                  label: '❄️ Cold Chain (2-8°C)',
                  isSelected: filterState.isColdChain == true,
                  onTap: () => ref
                      .read(catalogFilterProvider.notifier)
                      .toggleColdChainOnly(filterState.isColdChain != true),
                ),
                _buildFilterChip(
                  label: 'Reagents',
                  isSelected: filterState.selectedProductType == 'REAGENT',
                  onTap: () => ref
                      .read(catalogFilterProvider.notifier)
                      .selectProductType(filterState.selectedProductType == 'REAGENT'
                          ? null
                          : 'REAGENT'),
                ),
                _buildFilterChip(
                  label: 'Equipment',
                  isSelected: filterState.selectedProductType == 'EQUIPMENT',
                  onTap: () => ref
                      .read(catalogFilterProvider.notifier)
                      .selectProductType(
                          filterState.selectedProductType == 'EQUIPMENT'
                              ? null
                              : 'EQUIPMENT'),
                ),
                _buildFilterChip(
                  label: 'Rapid Cards',
                  isSelected: filterState.selectedProductType == 'RAPID_KIT',
                  onTap: () => ref
                      .read(catalogFilterProvider.notifier)
                      .selectProductType(
                          filterState.selectedProductType == 'RAPID_KIT'
                              ? null
                              : 'RAPID_KIT'),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Product List View - Live Backend Integration
          Expanded(
            child: asyncProducts.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: Color(0xFF2563EB)),
              ),
              error: (err, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.wifi_off, size: 48, color: Color(0xFF94A3B8)),
                      const SizedBox(height: 12),
                      Text(
                        'Failed to load products: $err',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
                        onPressed: () => ref.refresh(productsListProvider),
                        child: const Text('Retry', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ),
              data: (products) {
                if (products.isEmpty) {
                  return const Center(
                    child: Text(
                      'No products found matching filters',
                      style: TextStyle(color: Color(0xFF64748B)),
                    ),
                  );
                }

                return RefreshIndicator(
                  color: const Color(0xFF2563EB),
                  onRefresh: () async {
                    // Refresh ensures fresh prices fetched from backend (Requirement 10)
                    ref.invalidate(productsListProvider);
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: products.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return _ProductCard(
                        product: product,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ProductDetailScreen(
                                productId: product.id,
                                initialProduct: product,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: const Color(0xFF2563EB),
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : const Color(0xFF334155),
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          fontSize: 12,
        ),
        backgroundColor: const Color(0xFFF1F5F9),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      ),
    );
  }

  void _showFilterBottomSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filter Diagnostic Products',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      ref.read(catalogFilterProvider.notifier).resetFilters();
                      Navigator.pop(context);
                    },
                    child: const Text('Reset All'),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Stock Availability',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('All Items'),
                    selected: true,
                    onSelected: (_) {},
                  ),
                  ChoiceChip(
                    label: const Text('In Stock Only'),
                    selected: false,
                    onSelected: (_) {},
                  ),
                  ChoiceChip(
                    label: const Text('Cold Chain Ready'),
                    selected: false,
                    onSelected: (_) {},
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Apply Filters',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProductCard extends StatelessWidget {
  final ProductModel product;
  final VoidCallback onTap;

  const _ProductCard({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final companyName = product.company?.name ?? 'Diagnostic Supplies';
    final isColdChain = product.isColdChain;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail / Icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      product.productType == 'EQUIPMENT'
                          ? Icons.precision_manufacturing
                          : Icons.science,
                      color: const Color(0xFF2563EB),
                      size: 32,
                    ),
                  ),
                  if (isColdChain)
                    Positioned(
                      top: 4,
                      left: 4,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(
                          Icons.ac_unit,
                          color: Colors.white,
                          size: 10,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          companyName,
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF2563EB),
                            letterSpacing: 0.5,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          product.sku,
                          style: const TextStyle(
                            fontSize: 9,
                            fontFamily: 'monospace',
                            color: Color(0xFF475569),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Pack: ${product.packSize}',
                          style: const TextStyle(
                            fontSize: 10,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                      if (isColdChain) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0F9FF),
                            border: Border.all(color: const Color(0xFFBAE6FD)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '❄️ ${product.storageTemperature}',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0369A1),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            '₹${product.basePrice.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          if (product.mrp > product.basePrice) ...[
                            const SizedBox(width: 6),
                            Text(
                              'MRP ₹${product.mrp.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF94A3B8),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const Text(
                        'Details →',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
