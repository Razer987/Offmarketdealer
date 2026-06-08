enum HypercarStatus {
  dream,
  watching,
  reserved,
  ordered,
  owned;

  String get label {
    switch (this) {
      case HypercarStatus.dream:
        return 'Traum';
      case HypercarStatus.watching:
        return 'Beobachtet';
      case HypercarStatus.reserved:
        return 'Reserviert';
      case HypercarStatus.ordered:
        return 'Bestellt';
      case HypercarStatus.owned:
        return 'Im Besitz';
    }
  }

  static HypercarStatus fromString(String value) {
    return HypercarStatus.values.firstWhere(
      (e) => e.name == value,
      orElse: () => HypercarStatus.dream,
    );
  }
}
