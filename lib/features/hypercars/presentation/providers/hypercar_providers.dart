import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/app_database.dart';
import '../../data/hypercar_repository_impl.dart';
import '../../domain/hypercar.dart';
import '../../domain/hypercar_repository.dart';
import '../../domain/hypercar_status.dart';

// ── Repository ─────────────────────────────────────────────────────────────────
final hypercarRepositoryProvider = Provider<HypercarRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return HypercarRepositoryImpl(db);
});

// ── Active filter (searched, sorted, filtered) ───────────────────────────
class HypercarFilterNotifier extends StateNotifier<HypercarFilter> {
  HypercarFilterNotifier() : super(const HypercarFilter());

  void setQuery(String query) {
    if (query.isEmpty) {
      state = state.copyWith(clearQuery: true);
    } else {
      state = state.copyWith(query: query);
    }
  }

  void setStatus(HypercarStatus? status) {
    if (status == null) {
      state = state.copyWith(clearStatus: true);
    } else {
      state = state.copyWith(status: status);
    }
  }

  void setFavoritesOnly(bool value) {
    state = state.copyWith(favoritesOnly: value);
  }

  void setSortField(SortField field) {
    if (state.sortField == field) {
      state = state.copyWith(sortAscending: !state.sortAscending);
    } else {
      state = state.copyWith(sortField: field, sortAscending: false);
    }
  }

  void reset() {
    state = const HypercarFilter();
  }
}

final hypercarFilterProvider =
    StateNotifierProvider<HypercarFilterNotifier, HypercarFilter>(
  (ref) => HypercarFilterNotifier(),
);

// ── Car list stream ───────────────────────────────────────────────────────────
final hypercarListProvider = StreamProvider<List<Hypercar>>((ref) {
  final repo = ref.watch(hypercarRepositoryProvider);
  final filter = ref.watch(hypercarFilterProvider);
  return repo.watchAll(filter);
});

// ── Single car by id ────────────────────────────────────────────────────────
final hypercarByIdProvider =
    FutureProvider.family<Hypercar?, int>((ref, id) async {
  final repo = ref.watch(hypercarRepositoryProvider);
  return repo.getById(id);
});

// ── Stats ───────────────────────────────────────────────────────────────────
final hypercarStatsProvider =
    FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(hypercarRepositoryProvider);
  // Invalidate whenever the list changes to keep stats fresh
  ref.watch(hypercarListProvider);
  return repo.getStats();
});
