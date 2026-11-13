// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Traceability & Cold-Chain IoT Screen
// File: /mobile/lib/features/traceability/presentation/screens/traceability_screen.dart
// ============================================================================

import 'package:flutter/material.dart';

class TraceabilityScreen extends StatelessWidget {
  const TraceabilityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Material Traceability & Cold-Chain'),
        backgroundColor: const Color(0xFF22381E),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cold Chain Live Telemetry Card
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: Color(0xFFD2E7C4)),
              ),
              color: const Color(0xFF22381E),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'ACTIVE IOT SENSOR #IOT-COLD-8821',
                          style: TextStyle(
                            color: Color(0xFFD2E7C4),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Icon(Icons.wifi, color: Color(0xFFD2E7C4), size: 16),
                      ],
                    ),
                    SizedBox(height: 12),
                    Text(
                      '3.8°C',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Optimal Range: 2.0°C - 8.0°C (Active Cooling Validated)',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Scan Barcode Trigger Button
            ElevatedButton.icon(
              onPressed: () {
                // Open barcode scanner
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE4F1DC),
                foregroundColor: const Color(0xFF22381E),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text(
                'Scan Reagent Vial / Equipment QR Tag',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
