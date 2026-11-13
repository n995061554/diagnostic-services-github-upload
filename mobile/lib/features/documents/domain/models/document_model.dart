// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Digital Document Center Domain Models
// File: /mobile/lib/features/documents/domain/models/document_model.dart
// ============================================================================

enum DigitalDocumentCategoryEnum {
  TAX_INVOICE,
  SERVICE_REPORT,
  CALIBRATION_CERT,
  COA_QUALITY,
  MSDS_IFU,
}

class DigitalDocumentRecordModel {
  final String id;
  final String category;
  final String title;
  final String referenceNumber;
  final String date;
  final String fileSize;
  final String downloadUrl;
  final String siteId;
  final String? relatedEquipmentName;
  final String? relatedOrderNumber;
  final String? batchNumber;
  final String? expiryDate;
  final String issuedBy;
  final String status;

  DigitalDocumentRecordModel({
    required this.id,
    required this.category,
    required this.title,
    required this.referenceNumber,
    required this.date,
    required this.fileSize,
    required this.downloadUrl,
    required this.siteId,
    this.relatedEquipmentName,
    this.relatedOrderNumber,
    this.batchNumber,
    this.expiryDate,
    required this.issuedBy,
    this.status = 'ACTIVE',
  });

  factory DigitalDocumentRecordModel.fromJson(Map<String, dynamic> json) {
    return DigitalDocumentRecordModel(
      id: json['id'] as String,
      category: json['category'] as String,
      title: json['title'] as String,
      referenceNumber: json['referenceNumber'] as String,
      date: json['date'] as String,
      fileSize: json['fileSize'] as String,
      downloadUrl: json['downloadUrl'] as String,
      siteId: json['siteId'] as String,
      relatedEquipmentName: json['relatedEquipmentName'] as String?,
      relatedOrderNumber: json['relatedOrderNumber'] as String?,
      batchNumber: json['batchNumber'] as String?,
      expiryDate: json['expiryDate'] as String?,
      issuedBy: json['issuedBy'] as String? ?? 'A2Z Diagnostic Services',
      status: json['status'] as String? ?? 'ACTIVE',
    );
  }
}
