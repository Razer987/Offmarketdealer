import 'hypercar.dart';
import 'hypercar_status.dart';

enum SortField { name, price, date }

class HypercarFilter {
  const HypercarFilter({
    this.query,
    this.status,
    this.favoritesOnly = false,
    this.sortField = SortField.date,
    this.sortAscending = false,
  });

  final String? query;
  final HypercarStatus? status;
  final bool favoritesOnly;
  final SortField sortField;
  final bool sortAscending;

  HypercarFilter copyWith({
    String? query,
    HypercarStatus? status,
    bool? favoritesOnly,
    SortField? sortField,
    bool? sortAscending,
    bool clearQuery = false,
    bool clearStatus = false,
  }) {
    return HypercarFilter(
      query: clearQuery ? null : (query ?? this.query),
      status: clearStatus ? null : (status ?? this.status),
      favoritesOnly: favoritesOnly ?? this.favoritesOnly,
      sortField: sortField ?? this.sortField,
      sortAscending: sortAscending ?? this.sortAscending,
    );
  }
}

abstract interface class HypercarRepository {
  Stream<List<Hypercar>> watchAll(HypercarFilter filter);
  Future<Hypercar?> getById(int id);
  Future<int> add({
    required String brand,
    required String model,
    int? year,
    required HypercarStatus status,
    String? exteriorColor,
    String? interiorColor,
    double? priceEstimate,
    String currency,
    int? powerHp,
    double? zeroToHundred,
    int? topSpeedKmh,
    String? productionLimit,
    String? notes,
    bool isFavorite,
    List<String> photoPaths,
  });
  Future<void> update(Hypercar car);
  Future<void> delete(int id);
  Future<void> toggleFavorite(int id);
  Future<Map<String, dynamic>> getStats();
}
