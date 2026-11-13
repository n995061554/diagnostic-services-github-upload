// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP (FLUTTER)
// Collapsible Navigation Drawer with 7 Submenu Groups & Role Authorization
// File: /mobile/lib/core/navigation/diagnostic_nav_drawer.dart
// ============================================================================

import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DiagnosticNavDrawer extends StatefulWidget {
  final String activePage;
  final String userRole; // 'OWNER', 'ADMIN', 'VIEWER'
  final String userName;
  final String labName;
  final Function(String group, String item) onSelectItem;
  final VoidCallback onSignOut;

  const DiagnosticNavDrawer({
    super.key,
    required this.activePage,
    this.userRole = 'OWNER',
    this.userName = 'Dr. Arvind Kulkarni',
    this.labName = 'Apex Clinical Laboratories',
    required this.onSelectItem,
    required this.onSignOut,
  });

  @override
  State<DiagnosticNavDrawer> createState() => _DiagnosticNavDrawerState();
}

class _DiagnosticNavDrawerState extends State<DiagnosticNavDrawer> {
  late Map<String, bool> _expandedGroups;

  @override
  void initState() {
    super.initState();
    // Keep submenu groups collapsed by default unless active page belongs to that group
    _expandedGroups = {
      'Home': _isItemInGroup('Home', widget.activePage),
      'Products': _isItemInGroup('Products', widget.activePage),
      'Orders': _isItemInGroup('Orders', widget.activePage),
      'Payments & Credit': _isItemInGroup('Payments & Credit', widget.activePage),
      'Equipment & Service': _isItemInGroup('Equipment & Service', widget.activePage),
      'Support': _isItemInGroup('Support', widget.activePage),
      'Account': _isItemInGroup('Account', widget.activePage),
    };
  }

  bool _isItemInGroup(String group, String item) {
    final lowerItem = item.toLowerCase();
    switch (group) {
      case 'Home':
        return lowerItem.contains('dashboard') || lowerItem.contains('alert');
      case 'Products':
        return lowerItem.contains('product') ||
            lowerItem.contains('company') ||
            lowerItem.contains('categor') ||
            lowerItem.contains('price');
      case 'Orders':
        return lowerItem.contains('order') || lowerItem.contains('reorder');
      case 'Payments & Credit':
        return lowerItem.contains('payment') ||
            lowerItem.contains('credit') ||
            lowerItem.contains('balance');
      case 'Equipment & Service':
        return lowerItem.contains('equipment') ||
            lowerItem.contains('maintenance') ||
            lowerItem.contains('service') ||
            lowerItem.contains('warranty');
      case 'Support':
        return lowerItem.contains('complaint') ||
            lowerItem.contains('support') ||
            lowerItem.contains('faq') ||
            lowerItem.contains('chat');
      case 'Account':
        return lowerItem.contains('profile') ||
            lowerItem.contains('lab') ||
            lowerItem.contains('user') ||
            lowerItem.contains('password');
      default:
        return false;
    }
  }

  void _toggleGroup(String group) {
    setState(() {
      _expandedGroups[group] = !(_expandedGroups[group] ?? false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isOwner = widget.userRole == 'OWNER';
    final isViewer = widget.userRole == 'VIEWER';

    return Drawer(
      backgroundColor: AppColors.white,
      child: Column(
        children: [
          // Navy Drawer Header
          Container(
            color: AppColors.primaryNavy,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              right: 16,
              bottom: 16,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          padding: const EdgeInsets.all(4),
                          child: const Icon(
                            Icons.biotech_rounded,
                            color: AppColors.primaryNavy,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Diagnostic Services',
                              style: TextStyle(
                                color: AppColors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              'Institutional Customer Portal',
                              style: TextStyle(
                                color: AppColors.lightBlueGrey.withOpacity(0.9),
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.lightBlueGrey, size: 20),
                      onPressed: () => Navigator.of(context).pop(),
                      tooltip: 'Close Menu',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.deepNavy,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.secondaryBlue),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.userName,
                              style: const TextStyle(
                                color: AppColors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              widget.labName,
                              style: TextStyle(
                                color: AppColors.lightBlueGrey.withOpacity(0.8),
                                fontSize: 10,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isOwner
                              ? Colors.amber.withOpacity(0.2)
                              : widget.userRole == 'ADMIN'
                                  ? Colors.blue.withOpacity(0.2)
                                  : Colors.grey.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isOwner
                                ? Colors.amber
                                : widget.userRole == 'ADMIN'
                                    ? Colors.blue
                                    : Colors.grey,
                            width: 0.5,
                          ),
                        ),
                        child: Text(
                          isOwner ? '👑 Owner' : widget.userRole == 'ADMIN' ? '🛡️ Admin' : '👁️ Viewer',
                          style: TextStyle(
                            color: isOwner
                                ? Colors.amber[200]
                                : widget.userRole == 'ADMIN'
                                    ? Colors.blue[200]
                                    : Colors.grey[300],
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Collapsible Submenu Groups
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
              children: [
                // 1. Home
                _buildGroup(
                  title: 'Home',
                  icon: Icons.dashboard_outlined,
                  items: [
                    _SubItem('Dashboard', Icons.home_outlined),
                    _SubItem('Alerts', Icons.notifications_none_outlined, badge: 'Live'),
                  ],
                ),

                // 2. Products
                _buildGroup(
                  title: 'Products',
                  icon: Icons.inventory_2_outlined,
                  items: [
                    _SubItem('All Products', Icons.category_outlined),
                    _SubItem('Shop by Company', Icons.business_outlined),
                    _SubItem('Categories', Icons.layers_outlined),
                    _SubItem('Search Products', Icons.search_outlined),
                    _SubItem('Price List', Icons.receipt_long_outlined),
                  ],
                ),

                // 3. Orders
                _buildGroup(
                  title: 'Orders',
                  icon: Icons.shopping_cart_outlined,
                  items: [
                    if (!isViewer) _SubItem('Place Order', Icons.add_shopping_cart_outlined),
                    _SubItem('My Orders', Icons.history_outlined),
                    _SubItem('Order History', Icons.receipt_outlined),
                    if (!isViewer) _SubItem('Reorder', Icons.replay_outlined),
                  ],
                ),

                // 4. Payments & Credit
                _buildGroup(
                  title: 'Payments & Credit',
                  icon: Icons.account_balance_wallet_outlined,
                  items: [
                    _SubItem('Outstanding Balance', Icons.payment_outlined),
                    _SubItem('Payment History', Icons.receipt_long_outlined),
                    _SubItem('Credit Limit', Icons.speed_outlined),
                    if (!isViewer) _SubItem('Payment Extensions', Icons.schedule_outlined),
                  ],
                ),

                // 5. Equipment & Service
                _buildGroup(
                  title: 'Equipment & Service',
                  icon: Icons.precision_manufacturing_outlined,
                  items: [
                    _SubItem('My Equipment', Icons.memory_outlined),
                    _SubItem('Preventive Maintenance', Icons.build_outlined),
                    if (!isViewer) _SubItem('Service Requests', Icons.assignment_outlined),
                    _SubItem('Warranty', Icons.verified_user_outlined),
                  ],
                ),

                // 6. Support
                _buildGroup(
                  title: 'Support',
                  icon: Icons.support_agent_outlined,
                  items: [
                    if (!isViewer) _SubItem('Raise a Complaint', Icons.report_problem_outlined),
                    _SubItem('My Complaints', Icons.assignment_late_outlined),
                    _SubItem('Help & FAQs', Icons.help_outline),
                    _SubItem('Contact Support', Icons.phone_outlined),
                    _SubItem('Chat Support', Icons.chat_bubble_outline, badge: 'AI'),
                  ],
                ),

                // 7. Account
                _buildGroup(
                  title: 'Account',
                  icon: Icons.person_outline,
                  items: [
                    _SubItem('My Profile', Icons.account_circle_outlined),
                    _SubItem('My Laboratory', Icons.location_city_outlined),
                    if (isOwner) _SubItem('Manage Users', Icons.group_outlined, badge: 'Owner'),
                    _SubItem('Change Password', Icons.lock_outline),
                    _SubItem('Sign Out', Icons.logout_outlined, isDestructive: true),
                  ],
                ),
              ],
            ),
          ),

          // Drawer Bottom Quick Sign Out
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.lightBlueGrey.withOpacity(0.5))),
            ),
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                widget.onSignOut();
              },
              icon: const Icon(Icons.logout, size: 16, color: Colors.red),
              label: const Text(
                'Sign Out of Laboratory',
                style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFFECDD3)),
                backgroundColor: const Color(0xFFFFF1F2),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroup({
    required String title,
    required IconData icon,
    required List<_SubItem> items,
  }) {
    final isExpanded = _expandedGroups[title] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isExpanded ? AppColors.primaryNavy.withOpacity(0.04) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => _toggleGroup(title),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: isExpanded ? AppColors.primaryNavy : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      icon,
                      size: 16,
                      color: isExpanded ? AppColors.white : AppColors.primaryNavy,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isExpanded ? AppColors.primaryNavy : const Color(0xFF334155),
                      ),
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.keyboard_arrow_down : Icons.keyboard_arrow_right,
                    size: 18,
                    color: AppColors.slateGrey,
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded)
            Padding(
              padding: const EdgeInsets.only(left: 36, right: 6, bottom: 6),
              child: Column(
                children: items.map((sub) {
                  final isSelected = widget.activePage.toLowerCase() == sub.title.toLowerCase();

                  return InkWell(
                    onTap: () {
                      Navigator.of(context).pop();
                      if (sub.title == 'Sign Out') {
                        widget.onSignOut();
                      } else {
                        widget.onSelectItem(title, sub.title);
                      }
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      margin: const EdgeInsets.only(bottom: 2),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primaryNavy : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            sub.icon,
                            size: 15,
                            color: isSelected
                                ? AppColors.white
                                : sub.isDestructive
                                    ? Colors.red
                                    : AppColors.slateGrey,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              sub.title,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                color: isSelected
                                    ? AppColors.white
                                    : sub.isDestructive
                                        ? Colors.red
                                        : const Color(0xFF475569),
                              ),
                            ),
                          ),
                          if (sub.badge != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: sub.badge == 'Live'
                                    ? const Color(0xFFFFE4E6)
                                    : sub.badge == 'Owner'
                                        ? const Color(0xFFFEF3C7)
                                        : const Color(0xFFE0F2FE),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                sub.badge!,
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  color: sub.badge == 'Live'
                                      ? Colors.red[800]
                                      : sub.badge == 'Owner'
                                          ? Colors.amber[900]
                                          : Colors.blue[900],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }
}

class _SubItem {
  final String title;
  final IconData icon;
  final String? badge;
  final bool isDestructive;

  _SubItem(this.title, this.icon, {this.badge, this.isDestructive = false});
}
