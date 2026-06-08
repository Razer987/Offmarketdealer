# Apex Garage

Eine edle, hochwertig gestaltete Flutter-App zur Verwaltung deiner Hypercar-Wunschgarage.

## Voraussetzungen

- Flutter SDK (stabile Version) – [flutter.dev](https://flutter.dev)
- Android Studio + Android SDK
- USB-Debugging auf deinem Android-Handy aktiviert

## Setup

```bash
# 1. Abhängigkeiten installieren
flutter pub get

# 2. Drift-Code generieren (einmalig, nach Datenbankänderungen wiederholen)
dart run build_runner build --delete-conflicting-outputs

# 3. App auf angeschlossenem Handy starten
flutter run

# 4. Tests ausführen
flutter test

# 5. Release-APK bauen
flutter build apk --release
```

## Projektstruktur

```
lib/
  main.dart                     # Einstiegspunkt
  app/
    app.dart                    # Root-Widget
    theme/                      # Farben, Typografie, Theme
    router/                     # go_router Navigation
  features/
    hypercars/
      domain/                   # Entität, Enum, Repository-Interface
      data/                     # Drift DB, DAO, Repository-Implementierung
      presentation/
        providers/              # Riverpod Provider
        screens/                # List, Detail, Form
        widgets/                # Karten, Stats, Empty State
  shared/
    widgets/                    # Wiederverwendbare UI-Komponenten
test/
  hypercar_repository_test.dart # Unit-Tests
  hypercar_list_screen_test.dart # Widget-Tests
```

## Design-System

| Token | Wert |
|---|---|
| Hintergrund | `#0A0A0B` |
| Oberfläche | `#141416` |
| Karte | `#1C1C1F` |
| Akzent Gold | `#C9A86A` |
| Text primär | `#F5F5F2` |
| Text sekundär | `#9A9A9A` |
| Überschrift | Playfair Display |
| Fließtext | Inter |

## Features

- Hypercar hinzufügen / bearbeiten / löschen
- Fotos aus Galerie oder Kamera
- Suche, Filter (Status, Favoriten), Sortierung
- Statistik-Kachel (Anzahl + Gesamtwert)
- Vollständig offline (SQLite via Drift)
- Edle, dunkle Optik mit Gold-Akzenten
