import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../providers/hypercar_providers.dart';

class StatsHeader extends ConsumerWidget {
  const StatsHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(hypercarStatsProvider);

    return statsAsync.when(
      data: (stats) {
        final count = stats['count'] as int? ?? 0;
        final value = stats['totalValue'] as double? ?? 0.0;
        return _StatsCard(count: count, totalValue: value);
      },
      loading: () => const SizedBox(height: 72),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _StatsCard extends StatelessWidget {
  const _StatsCard({required this.count, required this.totalValue});
  final int count;
  final double totalValue;

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat.compactCurrency(
      locale: 'de_DE',
      symbol: 'EUR ',
      decimalDigits: 1,
    );

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          _StatItem(
            label: 'Fahrzeuge',
            value: '$count',
          ),
          Container(
            width: 1,
            height: 36,
            margin: const EdgeInsets.symmetric(horizontal: 20),
            color: AppColors.divider,
          ),
          _StatItem(
            label: 'Gesamtwert',
            value: totalValue > 0 ? formatter.format(totalValue) : '–',
          ),
          const Spacer(),
          Icon(
            Icons.garage_outlined,
            color: AppColors.accentGold.withOpacity(0.6),
            size: 28,
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.caption),
        const SizedBox(height: 2),
        Text(value, style: AppTypography.titleLarge),
      ],
    );
  }
}
