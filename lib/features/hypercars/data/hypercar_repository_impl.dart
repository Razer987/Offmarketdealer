import 'dart:convert';
import 'package:drift/drift.dart';
import '../domain/hypercar.dart';
import '../domain/hypercar_repository.dart';
import '../domain/hypercar_status.dart';
import 'app_database.dart';
import 'hypercar_table.dart';

class HypercarRepositoryImpl implements HypercarRepository {
  const HypercarRepositoryImpl(this._db);

  final AppDatabase _db;

  @override
  Stream<List<Hypercar>> watchAll(HypercarFilter filter) {
    return _db.watchFiltered(filter).map(
          (rows) => rows.map((r) => r.toDomain()).toList(),
        );
  }

  @override
  Future<Hypercar?> getById(int id) async {
    final row = await (_db.select(_db.hypercars)
          ..where((t) => t.id.equals(id)))
        .getSingleOrNull();
    return row?.toDomain();
  }

  @override
  Future<int> add({
    required String brand,
    required String model,
    int? year,
    required HypercarStatus status,
    String? exteriorColor,
    String? interiorColor,
    double? priceEstimate,
    String currency = 'EUR',
    int? powerHp,
    double? zeroToHundred,
    int? topSpeedKmh,
    String? productionLimit,
    String? notes,
    bool isFavorite = false,
    List<String> photoPaths = const [],
  }) {
    final now = DateTime.now();
    return _db.into(_db.hypercars).insert(
          HypercarsCompanion.insert(
            brand: brand,
            model: model,
            year: Value(year),
            status: Value(status.name),
            exteriorColor: Value(exteriorColor),
            interiorColor: Value(interiorColor),
            priceEstimate: Value(priceEstimate),
            currency: Value(currency),
            powerHp: Value(powerHp),
            zeroToHundred: Value(zeroToHundred),
            topSpeedKmh: Value(topSpeedKmh),
            productionLimit: Value(productionLimit),
            notes: Value(notes),
            isFavorite: Value(isFavorite),
            photoPaths: Value(jsonEncode(photoPaths)),
            createdAt: Value(now),
            updatedAt: Value(now),
          ),
        );
  }

  @override
  Future<void> update(Hypercar car) {
    return (_db.update(_db.hypercars)
          ..where((t) => t.id.equals(car.id)))
        .write(
      HypercarsCompanion(
        brand: Value(car.brand),
        model: Value(car.model),
        year: Value(car.year),
        status: Value(car.status.name),
        exteriorColor: Value(car.exteriorColor),
        interiorColor: Value(car.interiorColor),
        priceEstimate: Value(car.priceEstimate),
        currency: Value(car.currency),
        powerHp: Value(car.powerHp),
        zeroToHundred: Value(car.zeroToHundred),
        topSpeedKmh: Value(car.topSpeedKmh),
        productionLimit: Value(car.productionLimit),
        notes: Value(car.notes),
        isFavorite: Value(car.isFavorite),
        photoPaths: Value(jsonEncode(car.photoPaths)),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  @override
  Future<void> delete(int id) {
    return (_db.delete(_db.hypercars)..where((t) => t.id.equals(id))).go();
  }

  @override
  Future<void> toggleFavorite(int id) async {
    final row = await getById(id);
    if (row == null) return;
    await (_db.update(_db.hypercars)..where((t) => t.id.equals(id))).write(
      HypercarsCompanion(isFavorite: Value(!row.isFavorite)),
    );
  }

  @override
  Future<Map<String, dynamic>> getStats() => _db.getStats();
}
