// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Screen 5: Product Detail Screen (Pack Selector, MSDS/IFU Docs, Specs)
// Live Backend Product & Price Integration
// File: /mobile/lib/features/catalog/presentation/screens/product_detail_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/models/catalog_models.dart';
import '../providers/catalog_provider.dart';
import '../../../cart/presentation/providers/cart_provider.dart';
import '../../../cart/presentation/screens/cart_screen.dart';

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String productId;
  final ProductModel? initialProduct;

  const ProductDetailScreen({
    super.key,
    required this.productId,
    this.initialProduct,
  });

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedPackIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final liveProductAsync = ref.watch(productDetailProvider(widget.productId));

    return liveProductAsync.when(
      data: (product) => _buildContent(context, product),
      loading: () => widget.initialProduct != null
          ? _buildContent(context, widget.initialProduct!)
          : Scaffold(
              appBar: AppBar(backgroundColor: Colors.white, elevation: 0.5),
              body: const Center(
                child: CircularProgressIndicator(color: Color(0xFF2563EB)),
              ),
            ),
      error: (err, _) => widget.initialProduct != null
          ? _buildContent(context, widget.initialProduct!)
          : Scaffold(
              appBar: AppBar(backgroundColor: Colors.white, elevation: 0.5),
              body: Center(
                child: Text('Error loading product: $err'),
              ),
            ),
    );
  }

  Widget _buildContent(BuildContext context, ProductModel product) {
    // Generate active pack options from live product
    final List<ProductPackOptionModel> packOptions = product.packOptions.isNotEmpty
        ? product.packOptions
        : [
            ProductPackOptionModel(
              id: 'default-pack',
              productId: product.id,
              packName: product.packSize.isNotEmpty ? product.packSize : '1 Standard Unit',
              multiplier: 1.0,
              price: product.basePrice,
              isDefault: true,
            ),
          ];

    final safePackIndex = _selectedPackIndex < packOptions.length ? _selectedPackIndex : 0;
    final selectedPack = packOptions[safePackIndex];
    final currentUnitPrice = selectedPack.price;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: AppColors.primaryNavy,
        foregroundColor: AppColors.white,
        elevation: 0,
        title: const Text(
          'Product Specification',
          style: TextStyle(
            color: AppColors.white,
            fontWeight: FontWeight.w700,
            fontSize: 16,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: AppColors.lightBlueGrey),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.bookmark_border, color: AppColors.lightBlueGrey),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.lightBlueGrey),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CartScreen()),
              );
            },
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              offset: const Offset(0, -2),
              blurRadius: 10,
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Unit Price (excl. GST)',
                    style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                  ),
                  Text(
                    '₹${currentUnitPrice.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 18),
                  label: const Text(
                    'Add to Purchase Order',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () {
                    ref.read(cartProvider.notifier).addItem(
                          product,
                          packOption: selectedPack,
                          quantity: 1,
                        );

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Added "${product.name}" to Cart'),
                        backgroundColor: const Color(0xFF059669),
                        action: SnackBarAction(
                          label: 'VIEW CART',
                          textColor: Colors.white,
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const CartScreen()),
                            );
                          },
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Gallery & Carousel
            Container(
              height: 240,
              width: double.infinity,
              color: Colors.white,
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      product.productType == 'EQUIPMENT'
                          ? Icons.precision_manufacturing
                          : Icons.science,
                      size: 96,
                      color: const Color(0xFF2563EB).withValues(alpha: 0.8),
                    ),
                  ),
                  Positioned(
                    bottom: 12,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Verified Catalog Item',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Cold Chain Temperature Warning Banner
            if (product.isColdChain)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: const Color(0xFFE0F2FE),
                child: Row(
                  children: [
                    const Icon(Icons.ac_unit, color: Color(0xFF0284C7), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Mandatory Cold Chain: Store at ${product.storageTemperature}. Dispatched with calibrated gel ice packs.',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0369A1),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Title & Primary Meta
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          product.company?.name ?? 'Diagnostic Supplies',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                      ),
                      Text(
                        'SKU: ${product.sku}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.shortDescription ?? product.description ?? '',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
                  ),
                  const SizedBox(height: 16),

                  // Pack Size Options Switcher - Live Backend Prices
                  const Text(
                    'Select Pack Size Configuration',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(packOptions.length, (index) {
                      final isSelected = safePackIndex == index;
                      final pack = packOptions[index];
                      return Expanded(
                        child: InkWell(
                          onTap: () => setState(() => _selectedPackIndex = index),
                          child: Container(
                            margin: EdgeInsets.only(right: index < packOptions.length - 1 ? 8 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  pack.packName,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected ? const Color(0xFF1D4ED8) : const Color(0xFF334155),
                                  ),
                                  maxLines: 2,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '₹${pack.price.toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? const Color(0xFF1D4ED8) : const Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Tabs for Specs, Documents (MSDS / IFU), and Regulatory Info
            Container(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                indicatorColor: const Color(0xFF2563EB),
                labelColor: const Color(0xFF2563EB),
                unselectedLabelColor: const Color(0xFF64748B),
                labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                tabs: const [
                  Tab(text: 'Technical Specs'),
                  Tab(text: 'Documents (MSDS/IFU)'),
                  Tab(text: 'Regulatory / GST'),
                ],
              ),
            ),

            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                height: 220,
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    // Specs Tab
                    ListView(
                      children: [
                        _SpecRow(label: 'Product Type', value: product.productType),
                        _SpecRow(label: 'Storage Temp', value: product.storageTemperature),
                        _SpecRow(label: 'Pack Size', value: product.packSize),
                        _SpecRow(label: 'Stock Status', value: product.stockStatus),
                        _SpecRow(label: 'Stock Quantity', value: '${product.stockQuantity} Available'),
                        _SpecRow(label: 'Lead Time', value: '${product.leadTimeDays} Business Days'),
                        if (product.shelfLifeMonths != null)
                          _SpecRow(label: 'Shelf Life', value: '${product.shelfLifeMonths} Months'),
                      ],
                    ),

                    // Documents Tab (MSDS, IFU Pack Insert, CE Certificate)
                    ListView(
                      children: [
                        _DocumentTile(
                          title: 'Material Safety Data Sheet (MSDS)',
                          type: 'MSDS (PDF)',
                          size: '1.2 MB',
                          onDownload: () {},
                        ),
                        _DocumentTile(
                          title: 'Instructions for Use (IFU / Pack Insert)',
                          type: 'IFU (PDF)',
                          size: '2.8 MB',
                          onDownload: () {},
                        ),
                        _DocumentTile(
                          title: 'CE Declaration of Conformity',
                          type: 'CERTIFICATE (PDF)',
                          size: '640 KB',
                          onDownload: () {},
                        ),
                      ],
                    ),

                    // Regulatory / Tax Tab
                    ListView(
                      children: [
                        _SpecRow(label: 'HSN Code', value: '${product.hsnCode} (Diagnostic Supplies)'),
                        _SpecRow(label: 'GST Tax Rate', value: '${product.gstRate.toStringAsFixed(1)}% Standard Slab'),
                        const _SpecRow(label: 'Drug License Reg.', value: 'Form 20B/21B Required'),
                        const _SpecRow(label: 'Manufacturer Cert.', value: 'ISO 13485:2016 Certified'),
                        _SpecRow(label: 'Min Order Qty', value: '${product.minOrderQuantity} Pack'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _SpecRow extends StatelessWidget {
  final String label;
  final String value;

  const _SpecRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  final String title;
  final String type;
  final String size;
  final VoidCallback onDownload;

  const _DocumentTile({
    required this.title,
    required this.type,
    required this.size,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.picture_as_pdf, color: Color(0xFFDC2626), size: 28),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                Text(
                  '$type • $size',
                  style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.download_rounded, color: Color(0xFF2563EB)),
            onPressed: onDownload,
          ),
        ],
      ),
    );
  }
}
