import 'package:apex_garage/app/app.dart';
import 'package:apex_garage/features/hypercars/data/app_database.dart';
import 'package:apex_garage/features/hypercars/data/hypercar_repository_impl.dart';
import 'package:apex_garage/features/hypercars/domain/hypercar_status.dart';
import 'package:drift/native_database.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late AppDatabase db;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
  });

  tearDown(() => db.close());

  Widget buildApp() {
    return ProviderScope(
      overrides: [appDatabaseProvider.overrideWithValue(db)],
      child: const ApexGarageApp(),
    );
  }

  testWidgets('shows app title on list screen', (tester) async {
    await tester.pumpWidget(buildApp());
    await tester.pumpAndSettle();
    expect(find.text('Apex Garage'), findsOneWidget);
  });

  testWidgets('shows empty state when no cars', (tester) async {
    await tester.pumpWidget(buildApp());
    await tester.pumpAndSettle();
    expect(find.text('Deine Garage ist leer'), findsOneWidget);
  });

  testWidgets('shows car after adding it', (tester) async {
    final repo = HypercarRepositoryImpl(db);
    await repo.add(
      brand: 'Bugatti',
      model: 'Chiron',
      status: HypercarStatus.dream,
    );

    await tester.pumpWidget(buildApp());
    await tester.pumpAndSettle();

    expect(find.text('Chiron'), findsOneWidget);
    expect(find.textContaining('BUGATTI'), findsOneWidget);
  });

  testWidgets('FAB navigates to add screen', (tester) async {
    await tester.pumpWidget(buildApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Hinzufügen'));
    await tester.pumpAndSettle();

    expect(find.text('Neues Fahrzeug'), findsOneWidget);
  });

  testWidgets('form validates required fields', (tester) async {
    await tester.pumpWidget(buildApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Hinzufügen'));
    await tester.pumpAndSettle();

    // Tap save without filling required fields
    await tester.tap(find.text('Hinzufügen').last);
    await tester.pumpAndSettle();

    expect(find.text('Bitte Marke eingeben'), findsOneWidget);
    expect(find.text('Bitte Modell eingeben'), findsOneWidget);
  });
}
