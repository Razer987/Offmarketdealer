import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../providers/hypercar_providers.dart';
import '../widgets/status_chip.dart';

class HypercarDetailScreen extends ConsumerWidget {
  const HypercarDetailScreen({super.key, required this.carId});

  final int carId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final carAsync = ref.watch(hypercarByIdProvider(carId));

    return carAsync.when(
      data: (car) {
        if (car == null) {
          return const Scaffold(
            body: Center(child: Text('Fahrzeug nicht gefunden.')),
          );
        }

        return Scaffold(
          backgroundColor: AppColors.background,
          body: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: car.photoPaths.isNotEmpty ? 280 : 0,
                pinned: true,
                backgroundColor: AppColors.background,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded),
                  onPressed: () => context.pop(),
                ),
                actions: [
                  IconButton(
                    icon: Icon(
                      car.isFavorite
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                      color: car.isFavorite
                          ? AppColors.accentGold
                          : AppColors.textPrimary,
                    ),
                    onPressed: () {
                      ref
                          .read(hypercarRepositoryProvider)
                          .toggleFavorite(car.id);
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () => context.pushNamed(
                      'edit',
                      pathParameters: {'id': '$carId'},
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline_rounded,
                        color: AppColors.error),
                    onPressed: () => _confirmDelete(context, ref),
                  ),
                ],
                flexibleSpace: car.photoPaths.isNotEmpty
                    ? FlexibleSpaceBar(
                        background: Stack(
                          fit: StackFit.expand,
                          children: [
                            Image.file(
                              File(car.photoPaths.first),
                              fit: BoxFit.cover,
                            ),
                            const DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.transparent,
                                    AppColors.background,
                                  ],
                                  stops: [0.5, 1.0],
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    : null,
              ),
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Text(
                      car.brand.toUpperCase(),
                      style: AppTypography.accentGold.copyWith(fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Text(car.model, style: AppTypography.displayMedium),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        StatusChip(status: car.status),
                        if (car.year != null) ...
                          [
                            const SizedBox(width: 10),
                            Text(
                              '${car.year}',
                              style: AppTypography.bodyMedium
                                  .copyWith(color: AppColors.textSecondary),
                            ),
                          ],
                      ],
                    ),
                    if (car.priceEstimate != null) ...
                      [
                        const SizedBox(height: 20),
                        _DetailSection(
                          title: 'Preis (geschätzt)',
                          child: Text(
                            _formatPrice(car.priceEstimate!, car.currency),
                            style: AppTypography.headlineLarge
                                .copyWith(color: AppColors.accentGold),
                          ),
                        ),
                      ],
                    if (car.powerHp != null ||
                        car.zeroToHundred != null ||
                        car.topSpeedKmh != null) ...
                      [
                        const SizedBox(height: 20),
                        _DetailSection(
                          title: 'Leistung & Performance',
                          child: _SpecsGrid(car: car),
                        ),
                      ],
                    if (car.exteriorColor != null ||
                        car.interiorColor != null ||
                        car.productionLimit != null) ...
                      [
                        const SizedBox(height: 20),
                        _DetailSection(
                          title: 'Details',
                          child: Column(
                            children: [
                              if (car.exteriorColor != null)
                                _InfoRow(
                                    label: 'Farbe außen',
                                    value: car.exteriorColor!),
                              if (car.interiorColor != null)
                                _InfoRow(
                                    label: 'Farbe innen',
                                    value: car.interiorColor!),
                              if (car.productionLimit != null)
                                _InfoRow(
                                    label: 'Limitierung',
                                    value: car.productionLimit!),
                            ],
                          ),
                        ),
                      ],
                    if (car.notes != null && car.notes!.isNotEmpty) ...
                      [
                        const SizedBox(height: 20),
                        _DetailSection(
                          title: 'Notizen',
                          child: Text(
                            car.notes!,
                            style: AppTypography.bodyMedium
                                .copyWith(color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    if (car.photoPaths.length > 1) ...
                      [
                        const SizedBox(height: 20),
                        _DetailSection(
                          title: 'Fotos (${car.photoPaths.length})',
                          child: _PhotoGallery(paths: car.photoPaths),
                        ),
                      ],
                    const SizedBox(height: 40),
                    Text(
                      'Hinzugefügt am ${DateFormat('dd. MMMM yyyy', 'de_DE').format(car.createdAt)}',
                      style: AppTypography.caption,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 40),
                  ]),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const Scaffold(
        body: Center(
            child: CircularProgressIndicator(color: AppColors.accentGold)),
      ),
      error: (e, _) => Scaffold(
        body: Center(child: Text('Fehler: $e')),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Fahrzeug löschen'),
        content: const Text(
            'Möchtest du dieses Fahrzeug wirklich aus deiner Garage entfernen?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Abbrechen'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Löschen'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await ref.read(hypercarRepositoryProvider).delete(carId);
      if (context.mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Fahrzeug entfernt.')),
        );
      }
    }
  }

  String _formatPrice(double price, String currency) {
    final fmt = NumberFormat.currency(
      locale: 'de_DE',
      symbol: '$currency ',
      decimalDigits: 0,
    );
    return fmt.format(price);
  }
}

class _DetailSection extends StatelessWidget {
  const _DetailSection({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.toUpperCase(), style: AppTypography.labelMedium),
        const SizedBox(height: 10),
        child,
      ],
    );
  }
}

class _SpecsGrid extends StatelessWidget {
  const _SpecsGrid({required this.car});
  final car;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (car.powerHp != null)
          _SpecTile(label: 'Leistung', value: '${car.powerHp} PS'),
        if (car.powerHp != null &&
            (car.zeroToHundred != null || car.topSpeedKmh != null))
          const SizedBox(width: 12),
        if (car.zeroToHundred != null)
          _SpecTile(
              label: '0 – 100 km/h', value: '${car.zeroToHundred} Sek.'),
        if (car.zeroToHundred != null && car.topSpeedKmh != null)
          const SizedBox(width: 12),
        if (car.topSpeedKmh != null)
          _SpecTile(label: 'V-max', value: '${car.topSpeedKmh} km/h'),
      ],
    );
  }
}

class _SpecTile extends StatelessWidget {
  const _SpecTile({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.caption),
            const SizedBox(height: 4),
            Text(value,
                style: AppTypography.titleMedium.copyWith(
                    color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Text(label,
              style: AppTypography.bodyMedium
                  .copyWith(color: AppColors.textSecondary)),
          const Spacer(),
          Text(value, style: AppTypography.bodyMedium),
        ],
      ),
    );
  }
}

class _PhotoGallery extends StatelessWidget {
  const _PhotoGallery({required this.paths});
  final List<String> paths;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: paths.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Image.file(
            File(paths[i]),
            width: 140,
            height: 100,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }
}
