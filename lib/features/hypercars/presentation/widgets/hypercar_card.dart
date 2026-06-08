import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../domain/hypercar.dart';
import '../../domain/hypercar_repository.dart';
import '../providers/hypercar_providers.dart';
import 'status_chip.dart';

class HypercarCard extends ConsumerWidget {
  const HypercarCard({
    super.key,
    required this.car,
    required this.onTap,
  });

  final Hypercar car;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder, width: 1),
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _CarImage(car: car),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              car.brand.toUpperCase(),
                              style: AppTypography.accentGold,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              car.model,
                              style: AppTypography.headlineMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      _FavoriteButton(car: car),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      StatusChip(status: car.status, compact: true),
                      if (car.year != null) ...
                        [
                          const SizedBox(width: 8),
                          Text(
                            '${car.year}',
                            style: AppTypography.bodySmall,
                          ),
                        ],
                      const Spacer(),
                      if (car.priceEstimate != null)
                        Text(
                          _formatPrice(car.priceEstimate!, car.currency),
                          style: AppTypography.titleMedium.copyWith(
                            color: AppColors.accentGold,
                          ),
                        ),
                    ],
                  ),
                  if (car.powerHp != null || car.topSpeedKmh != null) ...
                    [
                      const SizedBox(height: 10),
                      const Divider(height: 1),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          if (car.powerHp != null)
                            _Spec(label: 'PS', value: '${car.powerHp}'),
                          if (car.powerHp != null && car.topSpeedKmh != null)
                            const _SpecDivider(),
                          if (car.topSpeedKmh != null)
                            _Spec(
                                label: 'V-MAX',
                                value: '${car.topSpeedKmh} km/h'),
                          if (car.zeroToHundred != null) ...
                            [
                              const _SpecDivider(),
                              _Spec(
                                  label: '0-100',
                                  value: '${car.zeroToHundred}s'),
                            ],
                        ],
                      ),
                    ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatPrice(double price, String currency) {
    if (price >= 1000000) {
      return '${currency} ${(price / 1000000).toStringAsFixed(1)}M';
    } else if (price >= 1000) {
      return '${currency} ${(price / 1000).toStringAsFixed(0)}K';
    }
    return '${currency} ${price.toStringAsFixed(0)}';
  }
}

class _CarImage extends StatelessWidget {
  const _CarImage({required this.car});
  final Hypercar car;

  @override
  Widget build(BuildContext context) {
    if (car.photoPaths.isEmpty) {
      return Container(
        height: 180,
        color: AppColors.surface,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.directions_car_outlined,
                  size: 48, color: AppColors.textSecondary.withOpacity(0.4)),
              const SizedBox(height: 8),
              Text('Kein Foto', style: AppTypography.caption),
            ],
          ),
        ),
      );
    }

    return Stack(
      children: [
        SizedBox(
          height: 200,
          width: double.infinity,
          child: Image.file(
            File(car.photoPaths.first),
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(
              color: AppColors.surface,
              child: const Icon(Icons.broken_image_outlined,
                  color: AppColors.textSecondary),
            ),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 80,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  AppColors.card.withOpacity(0.95),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FavoriteButton extends ConsumerWidget {
  const _FavoriteButton({required this.car});
  final Hypercar car;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: () {
        ref
            .read(hypercarRepositoryProvider)
            .toggleFavorite(car.id);
      },
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: Icon(
          car.isFavorite ? Icons.star_rounded : Icons.star_outline_rounded,
          key: ValueKey(car.isFavorite),
          color: car.isFavorite
              ? AppColors.accentGold
              : AppColors.textSecondary,
          size: 28,
        ),
      ),
    );
  }
}

class _Spec extends StatelessWidget {
  const _Spec({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption),
        Text(value,
            style: AppTypography.bodySmall.copyWith(
                color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _SpecDivider extends StatelessWidget {
  const _SpecDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 28,
      width: 1,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      color: AppColors.divider,
    );
  }
}
