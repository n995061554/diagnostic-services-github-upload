// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP (FLUTTER)
// Screen: Home Dashboard with Restrained Pastel Action Cards & Live Data
// File: /mobile/lib/features/home/presentation/screens/home_dashboard_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../catalog/presentation/screens/product_list_screen.dart';
import '../../../cart/presentation/screens/cart_screen.dart';
import '../../../orders/presentation/screens/orders_screen.dart';
import '../../../traceability/presentation/screens/traceability_screen.dart';
import '../../../service/presentation/screens/service_ticket_screen.dart';
import '../../../documents/presentation/screens/documents_screen.dart';

class HomeDashboardScreen extends StatelessWidget {
  final VoidCallback onOpenDrawer;

  const HomeDashboardScreen({
    super.key,
    required this.onOpenDrawer,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final greeting = now.hour < 12 ? 'morning' : now.hour < 17 ? 'afternoon' : 'evening';

    return Scaffold(
      backgroundColor: AppColors.surfaceBackground,
      appBar: AppBar(
        backgroundColor: AppColors.primaryNavy,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: AppColors.white),
          onPressed: onOpenDrawer,
          tooltip: 'Open Menu',
        ),
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.all(2),
              child: const Icon(
                Icons.biotech_rounded,
                color: AppColors.primaryNavy,
                size: 20,
              ),
            ),
            const SizedBox(width: 8),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Apex Clinical Laboratories',
                    style: TextStyle(
                      color: AppColors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Worli, Mumbai • Lab ID: APEX-9921',
                    style: TextStyle(
                      color: AppColors.lightBlueGrey,
                      fontSize: 9,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.lightBlueGrey, size: 20),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductListScreen()));
            },
            tooltip: 'Search Catalog',
          ),
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.lightBlueGrey, size: 20),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
            },
            tooltip: 'Cart',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Personalized Greeting
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Good $greeting, Dr. Arvind',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryNavy,
                      ),
                    ),
                    const Text(
                      'Apex Clinical Laboratories',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.slateGrey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Text(
                    'Institutional Portal',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.slateGrey,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // 2. Account & Payment Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primaryNavy, AppColors.deepNavy, AppColors.secondaryBlue],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryNavy.withOpacity(0.15),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.credit_card, color: AppColors.lightBlueGrey, size: 18),
                          SizedBox(width: 6),
                          Text(
                            'Account & Payment Status',
                            style: TextStyle(
                              color: AppColors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF34D399), width: 0.5),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle, color: Color(0xFF34D399), size: 10),
                            SizedBox(width: 4),
                            Text(
                              'Good Standing',
                              style: TextStyle(
                                color: Color(0xFF6EE7B7),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'OUTSTANDING',
                                style: TextStyle(
                                  color: AppColors.lightBlueGrey,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                '₹1,85,000',
                                style: TextStyle(
                                  color: AppColors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.4)),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'WALLET POINTS',
                                    style: TextStyle(
                                      color: Color(0xFFFDE68A),
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  SizedBox(width: 3),
                                  Text('🪙', style: TextStyle(fontSize: 8)),
                                ],
                              ),
                              SizedBox(height: 2),
                              Text(
                                '1,250 PTS',
                                style: TextStyle(
                                  color: Color(0xFFFDE68A),
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.25),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'AVAILABLE CREDIT',
                                style: TextStyle(
                                  color: AppColors.lightBlueGrey,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                '₹3,15,000',
                                style: TextStyle(
                                  color: Color(0xFF6EE7B7),
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. Restrained Pastel Action Cards Grid
            const Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryNavy,
              ),
            ),
            const SizedBox(height: 8),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.5,
              children: [
                // 1. Shop Products (Light Blue)
                _PastelActionCard(
                  title: 'Shop Products',
                  subtitle: 'Reagents & kits',
                  icon: Icons.inventory_2_outlined,
                  bgColor: AppColors.pastelBlueBg,
                  borderColor: AppColors.pastelBlueBorder,
                  iconColor: AppColors.pastelBlueIcon,
                  textColor: AppColors.pastelBlueText,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductListScreen()));
                  },
                ),

                // 2. Place Order (Light Indigo)
                _PastelActionCard(
                  title: 'Place Order',
                  subtitle: 'Direct requisition',
                  icon: Icons.add_shopping_cart_outlined,
                  bgColor: AppColors.pastelIndigoBg,
                  borderColor: AppColors.pastelIndigoBorder,
                  iconColor: AppColors.pastelIndigoIcon,
                  textColor: AppColors.pastelIndigoText,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                  },
                ),

                // 3. My Orders (Light Green)
                _PastelActionCard(
                  title: 'My Orders',
                  subtitle: 'Status & reorders',
                  icon: Icons.history_outlined,
                  bgColor: AppColors.pastelGreenBg,
                  borderColor: AppColors.pastelGreenBorder,
                  iconColor: AppColors.pastelGreenIcon,
                  textColor: AppColors.pastelGreenText,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()));
                  },
                ),

                // 4. Track Delivery (Light Violet)
                _PastelActionCard(
                  title: 'Track Delivery',
                  subtitle: 'Cold-chain IoT',
                  icon: Icons.local_shipping_outlined,
                  bgColor: AppColors.pastelVioletBg,
                  borderColor: AppColors.pastelVioletBorder,
                  iconColor: AppColors.pastelVioletIcon,
                  textColor: AppColors.pastelVioletText,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const TraceabilityScreen()));
                  },
                ),

                // 5. Payments & Credit (Light Pink)
                _PastelActionCard(
                  title: 'Payments & Credit',
                  subtitle: 'Ledger & limits',
                  icon: Icons.credit_card_outlined,
                  bgColor: AppColors.pastelPinkBg,
                  borderColor: AppColors.pastelPinkBorder,
                  iconColor: AppColors.pastelPinkIcon,
                  textColor: AppColors.pastelPinkText,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const DocumentsScreen()));
                  },
                ),

                // 6. Support & Help (Light Cyan)
                _PastelActionCard(
                  title: 'Support & Help',
                  subtitle: 'Biomedical SLA',
                  icon: Icons.support_agent_outlined,
                  bgColor: AppColors.pastelCyanBg,
                  borderColor: AppColors.pastelCyanBorder,
                  iconColor: AppColors.pastelCyanIcon,
                  textColor: AppColors.pastelCyanText,
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const ServiceTicketScreen()));
                  },
                ),
              ],
            ),
            const SizedBox(height: 18),

            // 4. Important Alerts
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '2 Reagent Lots Expiring (< 30 Days)',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF92400E),
                          ),
                        ),
                        Text(
                          'Bio-Rad HbA1c & cobas Creatinine need replenishment',
                          style: TextStyle(fontSize: 10, color: Color(0xFFB45309)),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Color(0xFF92400E), size: 18),
                ],
              ),
            ),
            // 4.5. Diagnostic Catalog Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Diagnostic Catalog',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryNavy,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductListScreen()));
                  },
                  child: const Text('Browse All', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // 5. Recent Orders with Status Pill
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Orders',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryNavy,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()));
                  },
                  child: const Text('View All', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            _RecentOrderTile(
              orderNumber: 'PO-2026-9912',
              itemsSummary: 'Roche cobas ISE Buffer + Bio-Rad Controls',
              amount: '₹48,200',
              status: 'IN TRANSIT',
              statusColor: const Color(0xFF2563EB),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const TraceabilityScreen()));
              },
            ),
            const SizedBox(height: 8),
            _RecentOrderTile(
              orderNumber: 'PO-2026-9844',
              itemsSummary: 'Sysmex Cellpack DCL 20L (4 Packs)',
              amount: '₹34,500',
              status: 'DELIVERED',
              statusColor: const Color(0xFF059669),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()));
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _PastelActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color bgColor;
  final Color borderColor;
  final Color iconColor;
  final Color textColor;
  final VoidCallback onTap;

  const _PastelActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.bgColor,
    required this.borderColor,
    required this.iconColor,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 16, color: iconColor),
            ),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryNavy,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: textColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecentOrderTile extends StatelessWidget {
  final String orderNumber;
  final String itemsSummary;
  final String amount;
  final String status;
  final Color statusColor;
  final VoidCallback onTap;

  const _RecentOrderTile({
    required this.orderNumber,
    required this.itemsSummary,
    required this.amount,
    required this.status,
    required this.statusColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        orderNumber,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryNavy,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: statusColor.withOpacity(0.3), width: 0.5),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    itemsSummary,
                    style: const TextStyle(fontSize: 11, color: AppColors.slateGrey),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              amount,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryNavy,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
