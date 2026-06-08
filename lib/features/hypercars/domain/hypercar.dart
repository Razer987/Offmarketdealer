import 'hypercar_status.dart';

class Hypercar {
  const Hypercar({
    required this.id,
    required this.brand,
    required this.model,
    this.year,
    required this.status,
    this.exteriorColor,
    this.interiorColor,
    this.priceEstimate,
    required this.currency,
    this.powerHp,
    this.zeroToHundred,
    this.topSpeedKmh,
    this.productionLimit,
    this.notes,
    required this.isFavorite,
    required this.photoPaths,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String brand;
  final String model;
  final int? year;
  final HypercarStatus status;
  final String? exteriorColor;
  final String? interiorColor;
  final double? priceEstimate;
  final String currency;
  final int? powerHp;
  final double? zeroToHundred;
  final int? topSpeedKmh;
  final String? productionLimit;
  final String? notes;
  final bool isFavorite;
  final List<String> photoPaths;
  final DateTime createdAt;
  final DateTime updatedAt;

  String get displayName => '$brand $model';

  Hypercar copyWith({
    int? id,
    String? brand,
    String? model,
    int? year,
    HypercarStatus? status,
    String? exteriorColor,
    String? interiorColor,
    double? priceEstimate,
    String? currency,
    int? powerHp,
    double? zeroToHundred,
    int? topSpeedKmh,
    String? productionLimit,
    String? notes,
    bool? isFavorite,
    List<String>? photoPaths,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Hypercar(
      id: id ?? this.id,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      year: year ?? this.year,
      status: status ?? this.status,
      exteriorColor: exteriorColor ?? this.exteriorColor,
      interiorColor: interiorColor ?? this.interiorColor,
      priceEstimate: priceEstimate ?? this.priceEstimate,
      currency: currency ?? this.currency,
      powerHp: powerHp ?? this.powerHp,
      zeroToHundred: zeroToHundred ?? this.zeroToHundred,
      topSpeedKmh: topSpeedKmh ?? this.topSpeedKmh,
      productionLimit: productionLimit ?? this.productionLimit,
      notes: notes ?? this.notes,
      isFavorite: isFavorite ?? this.isFavorite,
      photoPaths: photoPaths ?? this.photoPaths,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
