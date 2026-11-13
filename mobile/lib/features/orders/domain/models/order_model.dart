// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Orders & Cold-Chain Domain Models
// File: /mobile/lib/features/orders/domain/models/order_model.dart
// ============================================================================

enum OrderStatusEnum {
  PENDING,
  CONFIRMED,
  PACKED,
  DISPATCHED,
  IN_TRANSIT,
  DELIVERED,
  CANCELLED,
}

enum ColdChainSensorStatusEnum {
  OPTIMAL,
  WARNING,
  BREACH,
}

class DeliveryTimelineStepModel {
  final String stepId;
  final String title;
  final String description;
  final String timestamp;
  final String status; // 'COMPLETED', 'IN_PROGRESS', 'PENDING'
  final String? location;
  final String? temperature;
  final String? verifiedBy;

  DeliveryTimelineStepModel({
    required this.stepId,
    required this.title,
    required this.description,
    required this.timestamp,
    required this.status,
    this.location,
    this.temperature,
    this.verifiedBy,
  });

  factory DeliveryTimelineStepModel.fromJson(Map<String, dynamic> json) {
    return DeliveryTimelineStepModel(
      stepId: json['stepId'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      timestamp: json['timestamp'] as String,
      status: json['status'] as String? ?? 'PENDING',
      location: json['location'] as String?,
      temperature: json['temperature'] as String?,
      verifiedBy: json['verifiedBy'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'stepId': stepId,
    'title': title,
    'description': description,
    'timestamp': timestamp,
    'status': status,
    'location': location,
    'temperature': temperature,
    'verifiedBy': verifiedBy,
  };
}

class OrderItemModel {
  final String productId;
  final String productName;
  final String productSku;
  final String productImageUrl;
  final String companyName;
  final String packSize;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final bool isColdChain;
  final String batchNumber;
  final String lotNumber;
  final String mfgDate;
  final String expiryDate;
  final String storageTemp;
  final String qcReleaseStatus;

  OrderItemModel({
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.productImageUrl,
    required this.companyName,
    required this.packSize,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    required this.isColdChain,
    required this.batchNumber,
    required this.lotNumber,
    required this.mfgDate,
    required this.expiryDate,
    required this.storageTemp,
    this.qcReleaseStatus = 'RELEASED',
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      productId: (json['productId'] ?? '') as String,
      productName: (json['productName'] ?? 'Diagnostic Kit') as String,
      productSku: (json['productSku'] ?? '') as String,
      productImageUrl: (json['productImageUrl'] ?? '') as String,
      companyName: (json['companyName'] ?? '') as String,
      packSize: (json['packSize'] ?? 'Standard Pack') as String,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0.0,
      isColdChain: json['isColdChain'] as bool? ?? false,
      batchNumber: json['batchNumber'] as String? ?? '',
      lotNumber: json['lotNumber'] as String? ?? '',
      mfgDate: json['mfgDate'] as String? ?? '',
      expiryDate: json['expiryDate'] as String? ?? '',
      storageTemp: json['storageTemp'] as String? ?? json['storageTemperature'] as String? ?? '2°C to 8°C',
      qcReleaseStatus: json['qcReleaseStatus'] as String? ?? 'RELEASED',
    );
  }
}

class CustomerOrderDetailedModel {
  final String id;
  final String orderNumber;
  final String siteId;
  final String siteName;
  final String status;
  final String orderDate;
  final String estimatedDelivery;
  final String? deliveredDate;
  final double subtotal;
  final double taxAmount;
  final double coldChainFee;
  final double totalAmount;
  final String paymentStatus;
  final String paymentMethod;
  final List<OrderItemModel> items;
  final List<DeliveryTimelineStepModel> timeline;
  final String? invoiceId;
  final String? invoiceNumber;
  final ColdChainMonitoringModel? coldChainMonitoring;

  CustomerOrderDetailedModel({
    required this.id,
    required this.orderNumber,
    required this.siteId,
    required this.siteName,
    required this.status,
    required this.orderDate,
    required this.estimatedDelivery,
    this.deliveredDate,
    required this.subtotal,
    required this.taxAmount,
    required this.coldChainFee,
    required this.totalAmount,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.items,
    required this.timeline,
    this.invoiceId,
    this.invoiceNumber,
    this.coldChainMonitoring,
  });

  factory CustomerOrderDetailedModel.fromJson(Map<String, dynamic> json) {
    return CustomerOrderDetailedModel(
      id: (json['id'] ?? '') as String,
      orderNumber: (json['orderNumber'] ?? '') as String,
      siteId: (json['siteId'] ?? json['customerId'] ?? '') as String,
      siteName: (json['siteName'] ?? json['customerLabName'] ?? 'Primary Facility') as String,
      status: (json['status'] ?? 'PROCESSING') as String,
      orderDate: (json['orderDate'] ?? json['createdAt'] ?? '') as String,
      estimatedDelivery: (json['estimatedDelivery'] ?? json['deliveryDate'] ?? 'Tomorrow') as String,
      deliveredDate: json['deliveredDate'] as String?,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      taxAmount: ((json['taxAmount'] ?? json['gstAmount']) as num?)?.toDouble() ?? 0.0,
      coldChainFee: (json['coldChainFee'] as num?)?.toDouble() ?? 0.0,
      totalAmount: ((json['totalAmount'] ?? json['grandTotal']) as num?)?.toDouble() ?? 0.0,
      paymentStatus: json['paymentStatus'] as String? ?? 'CREDIT_ACCOUNT',
      paymentMethod: json['paymentMethod'] as String? ?? 'Revolving Credit',
      items: (json['items'] as List<dynamic>?)
              ?.map((it) => OrderItemModel.fromJson(it as Map<String, dynamic>))
              .toList() ??
          [],
      timeline: (json['timeline'] as List<dynamic>?)
              ?.map((t) => DeliveryTimelineStepModel.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
      invoiceId: json['invoiceId'] as String?,
      invoiceNumber: json['invoiceNumber'] as String?,
      coldChainMonitoring: json['coldChainMonitoring'] != null
          ? ColdChainMonitoringModel.fromJson(json['coldChainMonitoring'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ColdChainMonitoringModel {
  final bool required;
  final String currentTemp;

  ColdChainMonitoringModel({
    required this.required,
    required this.currentTemp,
  });

  factory ColdChainMonitoringModel.fromJson(Map<String, dynamic> json) {
    return ColdChainMonitoringModel(
      required: json['required'] as bool? ?? false,
      currentTemp: json['currentTemp'] as String? ?? '2°C to 8°C',
    );
  }
}

typedef CustomerOrderModel = CustomerOrderDetailedModel;
