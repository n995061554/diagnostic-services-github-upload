// ============================================================================
// A2Z DIAGNOSTICS MOBILE APP (FLUTTER / DART)
// Clean Architecture - Phase 2 Catalog Domain Models
// File: /mobile/lib/features/catalog/domain/models/catalog_models.dart
// ============================================================================

enum ProductTypeEnum {
  EQUIPMENT,
  REAGENT,
  RAPID_KIT,
  PLASTIC_CONSUMABLE,
  MICROBIOLOGY,
  FINE_CHEMICAL,
  BLOOD_COLLECTION_TUBE,
  URINE_STRIP,
  CONTROL_CALIBRATOR,
}

enum DocumentTypeEnum {
  MSDS,
  IFU_PACK_INSERT,
  CERTIFICATE_CE_FDA,
  BROCHURE,
  USER_MANUAL,
  QUALITY_ASSURANCE,
}

enum StockStatusEnum {
  IN_STOCK,
  LOW_STOCK,
  OUT_OF_STOCK,
  ON_ORDER,
}

class CompanyModel {
  final String id;
  final String code;
  final String name;
  final String? legalName;
  final String? logoUrl;
  final String? website;
  final String country;
  final String? description;
  final String? contactEmail;
  final String? contactPhone;
  final bool isActive;
  final int sortOrder;
  final int productsCount;

  CompanyModel({
    required this.id,
    required this.code,
    required this.name,
    this.legalName,
    this.logoUrl,
    this.website,
    required this.country,
    this.description,
    this.contactEmail,
    this.contactPhone,
    required this.isActive,
    required this.sortOrder,
    this.productsCount = 0,
  });

  factory CompanyModel.fromJson(Map<String, dynamic> json) {
    return CompanyModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      legalName: json['legalName'] as String?,
      logoUrl: json['logoUrl'] as String?,
      website: json['website'] as String?,
      country: json['country'] as String? ?? 'India',
      description: json['description'] as String?,
      contactEmail: json['contactEmail'] as String?,
      contactPhone: json['contactPhone'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? 0,
      productsCount: json['productsCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'code': code,
    'name': name,
    'legalName': legalName,
    'logoUrl': logoUrl,
    'website': website,
    'country': country,
    'description': description,
    'contactEmail': contactEmail,
    'contactPhone': contactPhone,
    'isActive': isActive,
    'sortOrder': sortOrder,
    'productsCount': productsCount,
  };
}

class CategoryModel {
  final String id;
  final String? parentId;
  final String name;
  final String slug;
  final String code;
  final String? description;
  final String? iconUrl;
  final String? imageUrl;
  final int level;
  final String path;
  final bool isActive;
  final int sortOrder;
  final int productsCount;
  final List<CategoryModel> children;

  CategoryModel({
    required this.id,
    this.parentId,
    required this.name,
    required this.slug,
    required this.code,
    this.description,
    this.iconUrl,
    this.imageUrl,
    required this.level,
    required this.path,
    required this.isActive,
    required this.sortOrder,
    this.productsCount = 0,
    this.children = const [],
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as String,
      parentId: json['parentId'] as String?,
      name: json['name'] as String,
      slug: json['slug'] as String,
      code: json['code'] as String,
      description: json['description'] as String?,
      iconUrl: json['iconUrl'] as String?,
      imageUrl: json['imageUrl'] as String?,
      level: json['level'] as int? ?? 0,
      path: json['path'] as String? ?? '',
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? 0,
      productsCount: json['productsCount'] as int? ?? 0,
      children: (json['children'] as List<dynamic>?)
              ?.map((c) => CategoryModel.fromJson(c as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}

class ProductImageModel {
  final String id;
  final String productId;
  final String imageUrl;
  final String? thumbnailUrl;
  final String? altText;
  final bool isPrimary;
  final int sortOrder;

  ProductImageModel({
    required this.id,
    required this.productId,
    required this.imageUrl,
    this.thumbnailUrl,
    this.altText,
    required this.isPrimary,
    required this.sortOrder,
  });

  factory ProductImageModel.fromJson(Map<String, dynamic> json) {
    return ProductImageModel(
      id: json['id'] as String,
      productId: json['productId'] as String,
      imageUrl: json['imageUrl'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      altText: json['altText'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }
}

class ProductDocumentModel {
  final String id;
  final String productId;
  final String title;
  final String documentType;
  final String fileUrl;
  final int? fileSizeBytes;
  final String mimeType;
  final String? version;
  final bool isPublic;

  ProductDocumentModel({
    required this.id,
    required this.productId,
    required this.title,
    required this.documentType,
    required this.fileUrl,
    this.fileSizeBytes,
    required this.mimeType,
    this.version,
    required this.isPublic,
  });

  factory ProductDocumentModel.fromJson(Map<String, dynamic> json) {
    return ProductDocumentModel(
      id: json['id'] as String,
      productId: json['productId'] as String,
      title: json['title'] as String,
      documentType: json['documentType'] as String? ?? 'IFU_PACK_INSERT',
      fileUrl: json['fileUrl'] as String,
      fileSizeBytes: json['fileSizeBytes'] as int?,
      mimeType: json['mimeType'] as String? ?? 'application/pdf',
      version: json['version'] as String?,
      isPublic: json['isPublic'] as bool? ?? true,
    );
  }
}

class ProductPackOptionModel {
  final String id;
  final String productId;
  final String packName;
  final String? packSku;
  final int? testsCount;
  final double multiplier;
  final double price;
  final bool isDefault;

  ProductPackOptionModel({
    required this.id,
    required this.productId,
    required this.packName,
    this.packSku,
    this.testsCount,
    required this.multiplier,
    required this.price,
    required this.isDefault,
  });

  factory ProductPackOptionModel.fromJson(Map<String, dynamic> json) {
    return ProductPackOptionModel(
      id: json['id'] as String,
      productId: json['productId'] as String,
      packName: json['packName'] as String,
      packSku: json['packSku'] as String?,
      testsCount: json['testsCount'] as int?,
      multiplier: (json['multiplier'] as num?)?.toDouble() ?? 1.0,
      price: (json['price'] as num).toDouble(),
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }
}

class ProductModel {
  final String id;
  final String sku;
  final String? catalogNumber;
  final String name;
  final String? shortDescription;
  final String? description;
  final String companyId;
  final CompanyModel? company;
  final String categoryId;
  final CategoryModel? category;
  final String productType;
  final String hsnCode;
  final double gstRate;
  final double basePrice;
  final double mrp;
  final int minOrderQuantity;
  final bool isColdChain;
  final String storageTemperature;
  final int? shelfLifeMonths;
  final bool requiresPrescriptionOrAuth;
  final bool isActive;
  final bool isFeatured;
  final bool isDiscontinued;
  final String packSize;
  final int stockQuantity;
  final String stockStatus;
  final int leadTimeDays;
  final List<ProductImageModel> images;
  final List<ProductDocumentModel> documents;
  final List<ProductPackOptionModel> packOptions;

  ProductModel({
    required this.id,
    required this.sku,
    this.catalogNumber,
    required this.name,
    this.shortDescription,
    this.description,
    required this.companyId,
    this.company,
    required this.categoryId,
    this.category,
    required this.productType,
    required this.hsnCode,
    required this.gstRate,
    required this.basePrice,
    required this.mrp,
    required this.minOrderQuantity,
    required this.isColdChain,
    required this.storageTemperature,
    this.shelfLifeMonths,
    required this.requiresPrescriptionOrAuth,
    required this.isActive,
    required this.isFeatured,
    required this.isDiscontinued,
    required this.packSize,
    required this.stockQuantity,
    required this.stockStatus,
    required this.leadTimeDays,
    this.images = const [],
    this.documents = const [],
    this.packOptions = const [],
  });

  String get primaryImageUrl =>
      images.firstWhere((img) => img.isPrimary, orElse: () => images.isNotEmpty ? images.first : ProductImageModel(id: '', productId: '', imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=400&q=80', isPrimary: true, sortOrder: 0)).imageUrl;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] as String,
      sku: json['sku'] as String,
      catalogNumber: json['catalogNumber'] as String?,
      name: json['name'] as String,
      shortDescription: json['shortDescription'] as String?,
      description: json['description'] as String?,
      companyId: json['companyId'] as String,
      company: json['company'] != null
          ? CompanyModel.fromJson(json['company'] as Map<String, dynamic>)
          : null,
      categoryId: json['categoryId'] as String,
      category: json['category'] != null
          ? CategoryModel.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      productType: json['productType'] as String? ?? 'REAGENT',
      hsnCode: json['hsnCode'] as String? ?? '38220090',
      gstRate: (json['gstRate'] as num?)?.toDouble() ?? 12.0,
      basePrice: (json['basePrice'] as num).toDouble(),
      mrp: (json['mrp'] as num).toDouble(),
      minOrderQuantity: json['minOrderQuantity'] as int? ?? 1,
      isColdChain: json['isColdChain'] as bool? ?? false,
      storageTemperature: json['storageTemperature'] as String? ?? '2°C to 8°C',
      shelfLifeMonths: json['shelfLifeMonths'] as int?,
      requiresPrescriptionOrAuth: json['requiresPrescriptionOrAuth'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isDiscontinued: json['isDiscontinued'] as bool? ?? false,
      packSize: json['packSize'] as String? ?? '1 Unit',
      stockQuantity: json['stockQuantity'] as int? ?? 0,
      stockStatus: json['stockStatus'] as String? ?? 'IN_STOCK',
      leadTimeDays: json['leadTimeDays'] as int? ?? 2,
      images: (json['images'] as List<dynamic>?)
              ?.map((i) => ProductImageModel.fromJson(i as Map<String, dynamic>))
              .toList() ??
          const [],
      documents: (json['documents'] as List<dynamic>?)
              ?.map((d) => ProductDocumentModel.fromJson(d as Map<String, dynamic>))
              .toList() ??
          const [],
      packOptions: (json['packOptions'] as List<dynamic>?)
              ?.map((p) => ProductPackOptionModel.fromJson(p as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}
