import 'package:drift/drift.dart';

class Hypercars extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get brand => text()();
  TextColumn get model => text()();
  IntColumn get year => integer().nullable()();
  TextColumn get status => text().withDefault(const Constant('dream'))();
  TextColumn get exteriorColor => text().nullable()();
  TextColumn get interiorColor => text().nullable()();
  RealColumn get priceEstimate => real().nullable()();
  TextColumn get currency => text().withDefault(const Constant('EUR'))();
  IntColumn get powerHp => integer().nullable()();
  RealColumn get zeroToHundred => real().nullable()();
  IntColumn get topSpeedKmh => integer().nullable()();
  TextColumn get productionLimit => text().nullable()();
  TextColumn get notes => text().nullable()();
  BoolColumn get isFavorite => boolean().withDefault(const Constant(false))();
  // Stored as JSON array string, e.g. '["path1","path2"]'
  TextColumn get photoPaths => text().withDefault(const Constant('[]'))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
}
