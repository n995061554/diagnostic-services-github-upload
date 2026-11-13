// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Screen 2: Category Selection Screen (Hierarchical Nested Categories)
// File: /mobile/lib/features/catalog/presentation/screens/category_selection_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/catalog_provider.dart';
import 'product_list_screen.dart';

class CategorySelectionScreen extends ConsumerStatefulWidget {
  final String? parentCategoryId;
  final String? parentCategoryName;

  const CategorySelectionScreen({
    super.key,
    this.parentCategoryId,
    this.parentCategoryName,
  });

  @override
  ConsumerState<CategorySelectionScreen> createState() =>
      _CategorySelectionScreenState();
}

class _CategorySelectionScreenState
    extends ConsumerState<CategorySelectionScreen> {
  @override
  Widget build(BuildContext context) {
    final title = widget.parentCategoryName ?? 'Diagnostic Categories';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Text(
          title,
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontWeight: FontWeight.w700,
            fontSize: 17,
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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Breadcrumb banner if drilled down
          if (widget.parentCategoryName != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.folder_open, color: Color(0xFF2563EB), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Browsing: ${widget.parentCategoryName}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1D4ED8),
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      ref
                          .read(catalogFilterProvider.notifier)
                          .selectCategory(widget.parentCategoryId);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const ProductListScreen()),
                      );
                    },
                    child: const Text(
                      'View All (Root) →',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2563EB),
                      ),
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          const Text(
            'Explore Pathology & Diagnostic Disciplines',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 12),

          // Categories List
          _buildCategoryTile(
            title: 'Clinical Chemistry',
            code: 'BIOCHEM',
            subCount: '18 Reagents • 4 Controls',
            icon: Icons.biotech,
            hasChildren: true,
            onTap: () {
              ref.read(catalogFilterProvider.notifier).selectCategory('cat-biochem');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
          _buildCategoryTile(
            title: 'Hematology & Coagulation',
            code: 'HEMATOLOGY',
            subCount: '14 Diluents & Lysers',
            icon: Icons.bloodtype,
            hasChildren: true,
            onTap: () {
              ref.read(catalogFilterProvider.notifier).selectCategory('cat-hematology');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
          _buildCategoryTile(
            title: 'Immunology & Serology',
            code: 'IMMUNO',
            subCount: '22 ELISA & CLIA Kits',
            icon: Icons.science,
            hasChildren: true,
            onTap: () {
              ref.read(catalogFilterProvider.notifier).selectCategory('cat-immuno');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
          _buildCategoryTile(
            title: 'Point of Care & Rapid Cards',
            code: 'POC_RAPID',
            subCount: '35 Rapid Immuno-Chromatography Kits',
            icon: Icons.speed,
            hasChildren: true,
            onTap: () {
              ref.read(catalogFilterProvider.notifier).selectCategory('cat-rapid');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
          _buildCategoryTile(
            title: 'Diagnostic Instruments & Analyzers',
            code: 'EQUIPMENT',
            subCount: '12 Semi/Fully Auto Analyzers',
            icon: Icons.precision_manufacturing,
            hasChildren: false,
            onTap: () {
              ref.read(catalogFilterProvider.notifier).selectCategory('cat-equip');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
          _buildCategoryTile(
            title: 'Plastic Labware & Consumables',
            code: 'CONSUMABLES',
            subCount: 'Blood Tubes, Tips, Cuvettes',
            icon: Icons.inventory_2,
            hasChildren: false,
            onTap: () {
              ref.read(catalogFilterProvider.notifier).selectCategory('cat-consumables');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProductListScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTile({
    required String title,
    required String code,
    required String subCount,
    required IconData icon,
    required bool hasChildren,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: const Color(0xFF2563EB)),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              subCount,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF64748B),
              ),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
      ),
    );
  }
}
