import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../domain/hypercar_status.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.status,
    this.compact = false,
  });

  final HypercarStatus status;
  final bool compact;

  Color get _color {
    switch (status) {
      case HypercarStatus.dream:
        return AppColors.statusDream;
      case HypercarStatus.watching:
        return AppColors.statusWatching;
      case HypercarStatus.reserved:
        return AppColors.statusReserved;
      case HypercarStatus.ordered:
        return AppColors.statusOrdered;
      case HypercarStatus.owned:
        return AppColors.statusOwned;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: _color.withOpacity(0.4), width: 1),
      ),
      child: Text(
        status.label.toUpperCase(),
        style: AppTypography.caption.copyWith(
          color: _color,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
          fontSize: compact ? 10 : 11,
        ),
      ),
    );
  }
}
