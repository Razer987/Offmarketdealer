import 'package:apex_garage/features/hypercars/data/app_database.dart';
import 'package:apex_garage/features/hypercars/data/hypercar_repository_impl.dart';
import 'package:apex_garage/features/hypercars/domain/hypercar_repository.dart';
import 'package:apex_garage/features/hypercars/domain/hypercar_status.dart';
import 'package:drift/native_database.dart';
import 'package:flutter_test/flutter_test.dart';

AppDatabase _openInMemory() =>
    AppDatabase.forTesting(NativeDatabase.memory());

extension _TestDb on AppDatabase {
  static AppDatabase _make() => _openInMemory();
}

void main() {
  late AppDatabase db;
  late HypercarRepositoryImpl repo;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    repo = HypercarRepositoryImpl(db);
  });

  tearDown(() => db.close());

  test('add and read a car', () async {
    final id = await repo.add(
      brand: 'Bugatti',
      model: 'Chiron',
      status: HypercarStatus.dream,
    );

    final car = await repo.getById(id);
    expect(car, isNotNull);
    expect(car!.brand, 'Bugatti');
    expect(car.model, 'Chiron');
    expect(car.status, HypercarStatus.dream);
  });

  test('watchAll returns added car', () async {
    await repo.add(
      brand: 'Koenigsegg',
      model: 'Jesko',
      status: HypercarStatus.dream,
    );

    const filter = HypercarFilter();
    final list = await repo.watchAll(filter).first;
    expect(list.length, 1);
    expect(list.first.brand, 'Koenigsegg');
  });

  test('update modifies fields', () async {
    final id = await repo.add(
      brand: 'Pagani',
      model: 'Huayra',
      status: HypercarStatus.dream,
    );
    final original = (await repo.getById(id))!;
    await repo.update(original.copyWith(
      status: HypercarStatus.owned,
      priceEstimate: 2500000,
    ));

    final updated = await repo.getById(id);
    expect(updated!.status, HypercarStatus.owned);
    expect(updated.priceEstimate, 2500000);
  });

  test('delete removes the car', () async {
    final id = await repo.add(
      brand: 'Ferrari',
      model: 'SF90',
      status: HypercarStatus.watching,
    );
    await repo.delete(id);
    final car = await repo.getById(id);
    expect(car, isNull);
  });

  test('toggleFavorite flips isFavorite', () async {
    final id = await repo.add(
      brand: 'Lamborghini',
      model: 'Revuelto',
      status: HypercarStatus.dream,
    );
    expect((await repo.getById(id))!.isFavorite, isFalse);
    await repo.toggleFavorite(id);
    expect((await repo.getById(id))!.isFavorite, isTrue);
    await repo.toggleFavorite(id);
    expect((await repo.getById(id))!.isFavorite, isFalse);
  });

  test('filter by status', () async {
    await repo.add(
        brand: 'A', model: 'X', status: HypercarStatus.dream);
    await repo.add(
        brand: 'B', model: 'Y', status: HypercarStatus.owned);

    final dreams = await repo
        .watchAll(
          const HypercarFilter(status: HypercarStatus.dream),
        )
        .first;
    expect(dreams.length, 1);
    expect(dreams.first.brand, 'A');
  });

  test('search by brand', () async {
    await repo.add(brand: 'McLaren', model: 'Senna', status: HypercarStatus.dream);
    await repo.add(brand: 'Aston', model: 'Valkyrie', status: HypercarStatus.dream);

    final result = await repo
        .watchAll(const HypercarFilter(query: 'mcla'))
        .first;
    expect(result.length, 1);
    expect(result.first.brand, 'McLaren');
  });
}
