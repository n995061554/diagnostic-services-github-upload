// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Traceability & Cold-Chain Telemetry Domain Models
// File: /mobile/lib/features/traceability/domain/models/traceability_model.dart
// ============================================================================

class TelemetryPointModel {
  final String time;
  final double temp;

  TelemetryPointModel({
    required this.time,
    required this.temp,
  });

  factory TelemetryPointModel.fromJson(Map<String, dynamic> json) {
    return TelemetryPointModel(
      time: json['time'] as String,
      temp: (json['temp'] as num).toDouble(),
    );
  }
}

class ChainOfCustodyEventModel {
  final String timestamp;
  final String event;
  final String operator;
  final String facility;

  ChainOfCustodyEventModel({
    required this.timestamp,
    required this.event,
    required this.operator,
    required this.facility,
  });

  factory ChainOfCustodyEventModel.fromJson(Map<String, dynamic> json) {
    return ChainOfCustodyEventModel(
      timestamp: json['timestamp'] as String,
      event: json['event'] as String,
      operator: json['operator'] as String,
      facility: json['facility'] as String,
    );
  }
}

class TraceabilityRecordModel {
  final String id;
  final String type; // 'REAGENT_BATCH', 'EQUIPMENT_SERIAL', 'ORDER_SHIPMENT'
  final String identifier;
  final String title;
  final String subtitle;
  final String siteId;
  final String mfgDate;
  final String? expiryDate;
  final String status;
  final bool coldChainCompliant;
  final double minRecorded;
  final double maxRecorded;
  final double averageTemp;
  final int excursionCount;
  final String sensorBattery;
  final List<TelemetryPointModel> readings;
  final String qualityCertificateNumber;
  final String qualityAuditor;
  final List<ChainOfCustodyEventModel> chainOfCustody;

  TraceabilityRecordModel({
    required this.id,
    required this.type,
    required this.identifier,
    required this.title,
    required this.subtitle,
    required this.siteId,
    required this.mfgDate,
    this.expiryDate,
    required this.status,
    required this.coldChainCompliant,
    required this.minRecorded,
    required this.maxRecorded,
    required this.averageTemp,
    required this.excursionCount,
    required this.sensorBattery,
    required this.readings,
    required this.qualityCertificateNumber,
    required this.qualityAuditor,
    required this.chainOfCustody,
  });

  factory TraceabilityRecordModel.fromJson(Map<String, dynamic> json) {
    final tempLog = json['temperatureLog'] as Map<String, dynamic>? ?? {};
    return TraceabilityRecordModel(
      id: json['id'] as String,
      type: json['type'] as String,
      identifier: json['identifier'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String,
      siteId: json['siteId'] as String,
      mfgDate: json['mfgDate'] as String,
      expiryDate: json['expiryDate'] as String?,
      status: json['status'] as String,
      coldChainCompliant: json['coldChainCompliant'] as bool? ?? true,
      minRecorded: (tempLog['minRecorded'] as num?)?.toDouble() ?? 2.0,
      maxRecorded: (tempLog['maxRecorded'] as num?)?.toDouble() ?? 8.0,
      averageTemp: (tempLog['averageTemp'] as num?)?.toDouble() ?? 4.0,
      excursionCount: (tempLog['excursionCount'] as int?) ?? 0,
      sensorBattery: tempLog['sensorBattery'] as String? ?? '100%',
      readings: (tempLog['telemetryReadings'] as List<dynamic>?)
              ?.map((t) => TelemetryPointModel.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      qualityCertificateNumber: json['qualityCertificateNumber'] as String? ?? '',
      qualityAuditor: json['qualityAuditor'] as String? ?? '',
      chainOfCustody: (json['chainOfCustody'] as List<dynamic>?)
              ?.map((c) => ChainOfCustodyEventModel.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
