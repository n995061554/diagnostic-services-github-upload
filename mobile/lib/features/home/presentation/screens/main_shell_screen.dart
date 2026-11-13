// ============================================================================
// DIAGNOSTIC SERVICES MOBILE APP (FLUTTER)
// Screen: Main Shell Screen with Bottom Nav & Expandable DiagnosticNavDrawer
// File: /mobile/lib/features/home/presentation/screens/main_shell_screen.dart
// ============================================================================

import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/navigation/diagnostic_nav_drawer.dart';
import 'home_dashboard_screen.dart';
import '../../../catalog/presentation/screens/product_list_screen.dart';
import '../../../orders/presentation/screens/orders_screen.dart';
import '../../../documents/presentation/screens/documents_screen.dart';
import '../../../service/presentation/screens/service_ticket_screen.dart';
import '../../../traceability/presentation/screens/traceability_screen.dart';
import '../../../catalog/presentation/screens/category_selection_screen.dart';
import '../../../catalog/presentation/screens/company_selection_screen.dart';

class MainShellScreen extends StatefulWidget {
  final String userRole;
  final String userName;
  final String labName;
  final VoidCallback onSignOut;

  const MainShellScreen({
    super.key,
    this.userRole = 'OWNER',
    this.userName = 'Dr. Arvind Kulkarni',
    this.labName = 'Apex Clinical Laboratories',
    required this.onSignOut,
  });

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _currentIndex = 0;
  String _activePage = 'Dashboard';

  void _openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  void _handleSubmenuSelected(String group, String item) {
    setState(() {
      _activePage = item;
    });

    switch (item) {
      case 'Dashboard':
        setState(() => _currentIndex = 0);
        break;
      case 'Alerts':
        setState(() => _currentIndex = 0);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Viewing Live Urgent Alerts (2 Lots Expiring)')),
        );
        break;
      case 'All Products':
        setState(() => _currentIndex = 1);
        break;
      case 'Shop by Company':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const CompanySelectionScreen()));
        break;
      case 'Categories':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const CategorySelectionScreen()));
        break;
      case 'Search Products':
        setState(() => _currentIndex = 1);
        break;
      case 'Price List':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const DocumentsScreen()));
        break;
      case 'Place Order':
      case 'My Orders':
      case 'Order History':
      case 'Reorder':
        setState(() => _currentIndex = 2);
        break;
      case 'Outstanding Balance':
      case 'Payment History':
      case 'Credit Limit':
      case 'Payment Extensions':
        setState(() => _currentIndex = 3);
        break;
      case 'My Equipment':
      case 'Warranty':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const TraceabilityScreen()));
        break;
      case 'Preventive Maintenance':
      case 'Service Requests':
      case 'Raise a Complaint':
      case 'My Complaints':
      case 'Help & FAQs':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const ServiceTicketScreen()));
        break;
      case 'Contact Support':
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Calling Clinical Support Hotline (+91 98450 11992)...')),
        );
        break;
      case 'Chat Support':
        Navigator.push(context, MaterialPageRoute(builder: (_) => const ServiceTicketScreen()));
        break;
      case 'Manage Users':
        if (widget.userRole == 'OWNER') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Opening Owner User Management Console')),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('User Management reserved for Laboratory Owner.')),
          );
        }
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeDashboardScreen(onOpenDrawer: _openDrawer),
      const ProductListScreen(),
      const OrdersScreen(),
      const DocumentsScreen(),
    ];

    return Scaffold(
      key: _scaffoldKey,
      drawer: DiagnosticNavDrawer(
        activePage: _activePage,
        userRole: widget.userRole,
        userName: widget.userName,
        labName: widget.labName,
        onSelectItem: _handleSubmenuSelected,
        onSignOut: widget.onSignOut,
      ),
      body: screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          border: Border(top: BorderSide(color: AppColors.lightBlueGrey.withOpacity(0.4))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            if (index == 4) {
              _openDrawer();
            } else {
              setState(() {
                _currentIndex = index;
                if (index == 0) _activePage = 'Dashboard';
                if (index == 1) _activePage = 'All Products';
                if (index == 2) _activePage = 'My Orders';
                if (index == 3) _activePage = 'Outstanding Balance';
              });
            }
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.white,
          selectedItemColor: AppColors.primaryNavy,
          unselectedItemColor: AppColors.slateGrey,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 10),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined, size: 20),
              activeIcon: Icon(Icons.home, size: 20),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.inventory_2_outlined, size: 20),
              activeIcon: Icon(Icons.inventory_2, size: 20),
              label: 'Products',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.history_outlined, size: 20),
              activeIcon: Icon(Icons.history, size: 20),
              label: 'Orders',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.credit_card_outlined, size: 20),
              activeIcon: Icon(Icons.credit_card, size: 20),
              label: 'Payments',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.menu, size: 20),
              activeIcon: Icon(Icons.menu_open, size: 20),
              label: 'Menu',
            ),
          ],
        ),
      ),
    );
  }
}
