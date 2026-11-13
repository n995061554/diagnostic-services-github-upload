// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Service & Field Engineering Domain Models
// File: /mobile/lib/features/service/domain/models/service_ticket_model.dart
// ============================================================================

enum ServicePriorityEnum {
  LOW,
  MEDIUM,
  HIGH,
  CRITICAL,
}

enum ServiceStatusEnum {
  NEW,
  ASSIGNED,
  ENGINEER_ON_THE_WAY,
  IN_PROGRESS,
  WAITING_FOR_PARTS,
  RESOLVED,
  CLOSED,
}

class AssignedEngineerModel {
  final String name;
  final String phone;
  final String designation;
  final String? eta;
  final String? currentLocation;

  AssignedEngineerModel({
    required this.name,
    required this.phone,
    required this.designation,
    this.eta,
    this.currentLocation,
  });

  factory AssignedEngineerModel.fromJson(Map<String, dynamic> json) {
    return AssignedEngineerModel(
      name: json['name'] as String,
      phone: json['phone'] as String,
      designation: json['designation'] as String? ?? 'Biomedical Field Engineer',
      eta: json['eta'] as String?,
      currentLocation: json['currentLocation'] as String?,
    );
  }
}

class ServiceTicketModel {
  final String id;
  final String ticketNumber;
  final String siteId;
  final String siteName;
  final String? equipmentId;
  final String? equipmentName;
  final String? serialNumber;
  final String category;
  final String priority;
  final String status;
  final String title;
  final String description;
  final String? errorCode;
  final AssignedEngineerModel? assignedEngineer;
  final int slaHours;
  final String slaDeadline;
  final String createdAt;
  final String? resolvedAt;

  ServiceTicketModel({
    required this.id,
    required this.ticketNumber,
    required this.siteId,
    required this.siteName,
    this.equipmentId,
    this.equipmentName,
    this.serialNumber,
    required this.category,
    required this.priority,
    required this.status,
    required this.title,
    required this.description,
    this.errorCode,
    this.assignedEngineer,
    required this.slaHours,
    required this.slaDeadline,
    required this.createdAt,
    this.resolvedAt,
  });

  factory ServiceTicketModel.fromJson(Map<String, dynamic> json) {
    return ServiceTicketModel(
      id: json['id'] as String,
      ticketNumber: json['ticketNumber'] as String,
      siteId: json['siteId'] as String,
      siteName: json['siteName'] as String,
      equipmentId: json['equipmentId'] as String?,
      equipmentName: json['equipmentName'] as String?,
      serialNumber: json['serialNumber'] as String?,
      category: json['category'] as String,
      priority: json['priority'] as String,
      status: json['status'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      errorCode: json['errorCode'] as String?,
      assignedEngineer: json['assignedEngineer'] != null
          ? AssignedEngineerModel.fromJson(json['assignedEngineer'] as Map<String, dynamic>)
          : null,
      slaHours: json['slaHours'] as int? ?? 4,
      slaDeadline: json['slaDeadline'] as String? ?? 'Within 4 Hours',
      createdAt: json['createdAt'] as String,
      resolvedAt: json['resolvedAt'] as String?,
    );
  }
}

typedef CustomerServiceTicketModel = ServiceTicketModel;
