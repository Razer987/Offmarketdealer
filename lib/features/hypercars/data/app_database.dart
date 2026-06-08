import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/hypercar.dart';
import '../domain/hypercar_repository.dart';
import '../domain/hypercar_status.dart';
import 'hypercar_table.dart';

part 'app_database.g.dart';

@DriftDatabase(tables: [Hypercars])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  // Used by tests so we can pass an in-memory executor
  AppDatabase.forTesting(QueryExecutor executor) : super(executor);

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return driftDatabase(name: 'apex_garage_db');
  }

  // Watch all with filter
  Stream<List<HypercarData>> watchFiltered(HypercarFilter filter) {
    var query = select(hypercars);

    query.where((t) {
      Expression<bool> condition = const Constant(true);

      if (filter.query != null && filter.query!.isNotEmpty) {
        final q = '%${filter.query!.toLowerCase()}%';
        condition = condition &
            (t.brand.lower().like(q) | t.model.lower().like(q));
      }

      if (filter.status != null) {
        condition = condition & t.status.equals(filter.status!.name);
      }

      if (filter.favoritesOnly) {
        condition = condition & t.isFavorite.equals(true);
      }

      return condition;
    });

    switch (filter.sortField) {
      case SortField.name:
        query.orderBy([
          (t) => OrderingTerm(
                expression: t.brand,
                mode: filter.sortAscending
                    ? OrderingMode.asc
                    : OrderingMode.desc,
              ),
        ]);
      case SortField.price:
        query.orderBy([
          (t) => OrderingTerm(
                expression: t.priceEstimate,
                mode: filter.sortAscending
                    ? OrderingMode.asc
                    : OrderingMode.desc,
                nulls: NullsOrder.last,
              ),
        ]);
      case SortField.date:
        query.orderBy([
          (t) => OrderingTerm(
                expression: t.createdAt,
                mode: filter.sortAscending
                    ? OrderingMode.asc
                    : OrderingMode.desc,
              ),
        ]);
    }

    return query.watch();
  }

  // Stats
  Future<Map<String, dynamic>> getStats() async {
    final count = await (selectOnly(hypercars)
          ..addColumns([hypercars.id.count()]))
        .getSingle()
        .then((r) => r.read(hypercars.id.count()) ?? 0);

    final totalValue = await (selectOnly(hypercars)
          ..addColumns([hypercars.priceEstimate.sum()]))
        .getSingle()
        .then((r) => r.read(hypercars.priceEstimate.sum()) ?? 0.0);

    return {'count': count, 'totalValue': totalValue};
  }
}

final appDatabaseProvider = Provider<AppDatabase>((ref) {
  throw UnimplementedError('Override in ProviderScope');
});

extension HypercarDataMapper on HypercarData {
  Hypercar toDomain() {
    final paths = (jsonDecode(photoPaths) as List).cast<String>();
    return Hypercar(
      id: id,
      brand: brand,
      model: model,
      year: year,
      status: HypercarStatus.fromString(status),
      exteriorColor: exteriorColor,
      interiorColor: interiorColor,
      priceEstimate: priceEstimate,
      currency: currency,
      powerHp: powerHp,
      zeroToHundred: zeroToHundred,
      topSpeedKmh: topSpeedKmh,
      productionLimit: productionLimit,
      notes: notes,
      isFavorite: isFavorite,
      photoPaths: paths,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
