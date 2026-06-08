import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../domain/hypercar_repository.dart';
import '../../domain/hypercar_status.dart';
import '../providers/hypercar_providers.dart';
import '../widgets/empty_state.dart';
import '../widgets/hypercar_card.dart';
import '../widgets/stats_header.dart';

class HypercarListScreen extends ConsumerStatefulWidget {
  const HypercarListScreen({super.key});

  @override
  ConsumerState<HypercarListScreen> createState() => _HypercarListScreenState();
}

class _HypercarListScreenState extends ConsumerState<HypercarListScreen> {
  final _searchController = TextEditingController();
  bool _searchVisible = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final carsAsync = ref.watch(hypercarListProvider);
    final filter = ref.watch(hypercarFilterProvider);
    final filterNotifier = ref.read(hypercarFilterProvider.notifier);

    final hasActiveFilter = filter.status != null ||
        filter.favoritesOnly ||
        (filter.query != null && filter.query!.isNotEmpty);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            pinned: true,
            floating: true,
            expandedHeight: 80,
            backgroundColor: AppColors.background,
            title: Text('Apex Garage',
                style: AppTypography.displayMedium
                    .copyWith(fontSize: 26)),
            actions: [
              IconButton(
                icon: Icon(
                  _searchVisible ? Icons.search_off : Icons.search,
                  color: _searchVisible
                      ? AppColors.accentGold
                      : AppColors.textPrimary,
                ),
                onPressed: () {
                  setState(() => _searchVisible = !_searchVisible);
                  if (!_searchVisible) {
                    _searchController.clear();
                    filterNotifier.setQuery('');
                  }
                },
              ),
              IconButton(
                icon: Icon(
                  Icons.tune_rounded,
                  color: hasActiveFilter
                      ? AppColors.accentGold
                      : AppColors.textPrimary,
                ),
                onPressed: () => _showFilterSheet(context),
              ),
              const SizedBox(width: 4),
            ],
          ),
          if (_searchVisible)
            SliverToBoxAdapter(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  style: AppTypography.bodyLarge,
                  onChanged: filterNotifier.setQuery,
                  decoration: InputDecoration(
                    hintText: 'Marke oder Modell suchen…',
                    prefixIcon: const Icon(Icons.search,
                        color: AppColors.textSecondary),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear,
                                color: AppColors.textSecondary, size: 20),
                            onPressed: () {
                              _searchController.clear();
                              filterNotifier.setQuery('');
                            },
                          )
                        : null,
                  ),
                ),
              ),
            ),
          const SliverToBoxAdapter(child: StatsHeader()),
          SliverToBoxAdapter(
            child: _SortBar(filter: filter, onSort: filterNotifier.setSortField),
          ),
          carsAsync.when(
            data: (cars) {
              if (cars.isEmpty) {
                return SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(isFiltered: hasActiveFilter),
                );
              }
              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: HypercarCard(
                        car: cars[index],
                        onTap: () => context.pushNamed(
                          'detail',
                          pathParameters: {'id': '${cars[index].id}'},
                        ),
                      ),
                    ),
                    childCount: cars.length,
                  ),
                ),
              );
            },
            loading: () => const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: AppColors.accentGold),
              ),
            ),
            error: (e, _) => SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                  child: Text('Fehler: $e',
                      style: AppTypography.bodyMedium)),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('add'),
        backgroundColor: AppColors.accentGold,
        foregroundColor: AppColors.background,
        icon: const Icon(Icons.add_rounded),
        label: Text('Hinzufügen', style: AppTypography.labelLarge.copyWith(
          color: AppColors.background,
        )),
        elevation: 0,
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FilterSheet(),
    );
  }
}

class _SortBar extends StatelessWidget {
  const _SortBar({required this.filter, required this.onSort});
  final HypercarFilter filter;
  final void Function(SortField) onSort;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      child: Row(
        children: [
          _SortChip(
            label: 'Datum',
            field: SortField.date,
            current: filter.sortField,
            ascending: filter.sortAscending,
            onTap: onSort,
          ),
          const SizedBox(width: 8),
          _SortChip(
            label: 'Name',
            field: SortField.name,
            current: filter.sortField,
            ascending: filter.sortAscending,
            onTap: onSort,
          ),
          const SizedBox(width: 8),
          _SortChip(
            label: 'Preis',
            field: SortField.price,
            current: filter.sortField,
            ascending: filter.sortAscending,
            onTap: onSort,
          ),
        ],
      ),
    );
  }
}

class _SortChip extends StatelessWidget {
  const _SortChip({
    required this.label,
    required this.field,
    required this.current,
    required this.ascending,
    required this.onTap,
  });
  final String label;
  final SortField field;
  final SortField current;
  final bool ascending;
  final void Function(SortField) onTap;

  @override
  Widget build(BuildContext context) {
    final selected = field == current;
    return GestureDetector(
      onTap: () => onTap(field),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.accentGold : AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.accentGold : AppColors.divider,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTypography.labelMedium.copyWith(
                color: selected ? AppColors.background : AppColors.textSecondary,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
            if (selected) ...
              [
                const SizedBox(width: 4),
                Icon(
                  ascending ? Icons.arrow_upward : Icons.arrow_downward,
                  size: 12,
                  color: AppColors.background,
                ),
              ],
          ],
        ),
      ),
    );
  }
}

class _FilterSheet extends ConsumerWidget {
  const _FilterSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(hypercarFilterProvider);
    final notifier = ref.read(hypercarFilterProvider.notifier);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Filter', style: AppTypography.headlineMedium),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    notifier.reset();
                    Navigator.pop(context);
                  },
                  child: const Text('Zurücksetzen'),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Status', style: AppTypography.labelMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _StatusFilterChip(
                  label: 'Alle',
                  selected: filter.status == null,
                  onTap: () => notifier.setStatus(null),
                ),
                ...HypercarStatus.values.map((s) => _StatusFilterChip(
                      label: s.label,
                      selected: filter.status == s,
                      onTap: () => notifier.setStatus(s),
                    )),
              ],
            ),
            const SizedBox(height: 20),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Nur Favoriten', style: AppTypography.bodyLarge),
              value: filter.favoritesOnly,
              onChanged: notifier.setFavoritesOnly,
              activeColor: AppColors.accentGold,
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Anwenden'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusFilterChip extends StatelessWidget {
  const _StatusFilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.accentGold : AppColors.card,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppColors.accentGold : AppColors.divider,
          ),
        ),
        child: Text(
          label,
          style: AppTypography.labelMedium.copyWith(
            color: selected ? AppColors.background : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
