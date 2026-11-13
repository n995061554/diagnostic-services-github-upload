// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Digital Document Center Screen
// File: /mobile/lib/features/documents/presentation/screens/documents_screen.dart
// ============================================================================

import 'package:flutter/material.dart';

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Digital Document Vault'),
        backgroundColor: const Color(0xFF22381E),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildDocCategoryHeader('Invoices & Commercial'),
          _buildDocumentTile(
            context,
            'Tax Invoice #INV-2026-8841',
            'GST E-Invoice with IRN • 1.2 MB',
            Icons.receipt_long,
          ),
          const SizedBox(height: 16),
          _buildDocCategoryHeader('Field Service & Quality'),
          _buildDocumentTile(
            context,
            'Field Service Report #FSR-9902',
            'Photometer Calibration • 840 KB',
            Icons.build,
          ),
          _buildDocumentTile(
            context,
            'NABL Calibration Certificate #CAL-771',
            'Valid through Oct 2027 • 650 KB',
            Icons.verified,
          ),
          _buildDocumentTile(
            context,
            'Certificate of Analysis (COA) Lot #99018',
            'Troponin T hs Kit Batch QC • 410 KB',
            Icons.biotech,
          ),
        ],
      ),
    );
  }

  Widget _buildDocCategoryHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: Color(0xFF6B7F6A),
          fontWeight: FontWeight.bold,
          fontSize: 11,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildDocumentTile(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFD2E7C4)),
      ),
      elevation: 0,
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFE4F1DC),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: const Color(0xFF22381E), size: 20),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(color: Color(0xFF415439), fontSize: 11),
        ),
        trailing: const Icon(Icons.download, color: Color(0xFF22381E), size: 20),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Downloading $title PDF...')),
          );
        },
      ),
    );
  }
}
