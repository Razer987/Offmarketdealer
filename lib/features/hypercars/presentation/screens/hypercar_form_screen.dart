import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../shared/widgets/app_text_field.dart';
import '../../../../shared/widgets/luxury_button.dart';
import '../../domain/hypercar.dart';
import '../../domain/hypercar_status.dart';
import '../providers/hypercar_providers.dart';

class HypercarFormScreen extends ConsumerStatefulWidget {
  const HypercarFormScreen({super.key, this.editId});

  final int? editId;

  @override
  ConsumerState<HypercarFormScreen> createState() => _HypercarFormScreenState();
}

class _HypercarFormScreenState extends ConsumerState<HypercarFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _loadingData = false;

  late final TextEditingController _brandCtrl;
  late final TextEditingController _modelCtrl;
  late final TextEditingController _yearCtrl;
  late final TextEditingController _extColorCtrl;
  late final TextEditingController _intColorCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _currencyCtrl;
  late final TextEditingController _powerCtrl;
  late final TextEditingController _zeroCtrl;
  late final TextEditingController _topSpeedCtrl;
  late final TextEditingController _limitCtrl;
  late final TextEditingController _notesCtrl;

  HypercarStatus _status = HypercarStatus.dream;
  bool _isFavorite = false;
  List<String> _photoPaths = [];

  bool get _isEdit => widget.editId != null;

  @override
  void initState() {
    super.initState();
    _brandCtrl = TextEditingController();
    _modelCtrl = TextEditingController();
    _yearCtrl = TextEditingController();
    _extColorCtrl = TextEditingController();
    _intColorCtrl = TextEditingController();
    _priceCtrl = TextEditingController();
    _currencyCtrl = TextEditingController(text: 'EUR');
    _powerCtrl = TextEditingController();
    _zeroCtrl = TextEditingController();
    _topSpeedCtrl = TextEditingController();
    _limitCtrl = TextEditingController();
    _notesCtrl = TextEditingController();

    if (_isEdit) _loadExisting();
  }

  Future<void> _loadExisting() async {
    setState(() => _loadingData = true);
    final car =
        await ref.read(hypercarRepositoryProvider).getById(widget.editId!);
    if (car == null || !mounted) return;
    _populate(car);
    setState(() => _loadingData = false);
  }

  void _populate(Hypercar car) {
    _brandCtrl.text = car.brand;
    _modelCtrl.text = car.model;
    _yearCtrl.text = car.year?.toString() ?? '';
    _extColorCtrl.text = car.exteriorColor ?? '';
    _intColorCtrl.text = car.interiorColor ?? '';
    _priceCtrl.text = car.priceEstimate?.toString() ?? '';
    _currencyCtrl.text = car.currency;
    _powerCtrl.text = car.powerHp?.toString() ?? '';
    _zeroCtrl.text = car.zeroToHundred?.toString() ?? '';
    _topSpeedCtrl.text = car.topSpeedKmh?.toString() ?? '';
    _limitCtrl.text = car.productionLimit ?? '';
    _notesCtrl.text = car.notes ?? '';
    _status = car.status;
    _isFavorite = car.isFavorite;
    _photoPaths = List.from(car.photoPaths);
  }

  @override
  void dispose() {
    for (final c in [
      _brandCtrl, _modelCtrl, _yearCtrl, _extColorCtrl,
      _intColorCtrl, _priceCtrl, _currencyCtrl, _powerCtrl,
      _zeroCtrl, _topSpeedCtrl, _limitCtrl, _notesCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await _showImageSourceSheet();
    if (source == null) return;

    final xFile = await picker.pickImage(
      source: source,
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 85,
    );
    if (xFile == null) return;

    final appDir = await getApplicationDocumentsDirectory();
    final fileName = 'car_${DateTime.now().millisecondsSinceEpoch}${p.extension(xFile.path)}';
    final dest = File(p.join(appDir.path, 'photos', fileName));
    await Directory(p.join(appDir.path, 'photos')).create(recursive: true);
    await File(xFile.path).copy(dest.path);

    setState(() => _photoPaths.add(dest.path));
  }

  Future<ImageSource?> _showImageSourceSheet() {
    return showModalBottomSheet<ImageSource>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Galerie'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined),
              title: const Text('Kamera'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    final repo = ref.read(hypercarRepositoryProvider);

    try {
      if (_isEdit) {
        final existing =
            await repo.getById(widget.editId!);
        if (existing == null) return;
        await repo.update(existing.copyWith(
          brand: _brandCtrl.text.trim(),
          model: _modelCtrl.text.trim(),
          year: _yearCtrl.text.isEmpty ? null : int.tryParse(_yearCtrl.text),
          status: _status,
          exteriorColor: _extColorCtrl.text.isEmpty ? null : _extColorCtrl.text.trim(),
          interiorColor: _intColorCtrl.text.isEmpty ? null : _intColorCtrl.text.trim(),
          priceEstimate: _priceCtrl.text.isEmpty ? null : double.tryParse(_priceCtrl.text.replaceAll(',', '.')),
          currency: _currencyCtrl.text.trim().isEmpty ? 'EUR' : _currencyCtrl.text.trim(),
          powerHp: _powerCtrl.text.isEmpty ? null : int.tryParse(_powerCtrl.text),
          zeroToHundred: _zeroCtrl.text.isEmpty ? null : double.tryParse(_zeroCtrl.text.replaceAll(',', '.')),
          topSpeedKmh: _topSpeedCtrl.text.isEmpty ? null : int.tryParse(_topSpeedCtrl.text),
          productionLimit: _limitCtrl.text.isEmpty ? null : _limitCtrl.text.trim(),
          notes: _notesCtrl.text.isEmpty ? null : _notesCtrl.text.trim(),
          isFavorite: _isFavorite,
          photoPaths: _photoPaths,
          updatedAt: DateTime.now(),
        ));
      } else {
        await repo.add(
          brand: _brandCtrl.text.trim(),
          model: _modelCtrl.text.trim(),
          year: _yearCtrl.text.isEmpty ? null : int.tryParse(_yearCtrl.text),
          status: _status,
          exteriorColor: _extColorCtrl.text.isEmpty ? null : _extColorCtrl.text.trim(),
          interiorColor: _intColorCtrl.text.isEmpty ? null : _intColorCtrl.text.trim(),
          priceEstimate: _priceCtrl.text.isEmpty ? null : double.tryParse(_priceCtrl.text.replaceAll(',', '.')),
          currency: _currencyCtrl.text.trim().isEmpty ? 'EUR' : _currencyCtrl.text.trim(),
          powerHp: _powerCtrl.text.isEmpty ? null : int.tryParse(_powerCtrl.text),
          zeroToHundred: _zeroCtrl.text.isEmpty ? null : double.tryParse(_zeroCtrl.text.replaceAll(',', '.')),
          topSpeedKmh: _topSpeedCtrl.text.isEmpty ? null : int.tryParse(_topSpeedCtrl.text),
          productionLimit: _limitCtrl.text.isEmpty ? null : _limitCtrl.text.trim(),
          notes: _notesCtrl.text.isEmpty ? null : _notesCtrl.text.trim(),
          isFavorite: _isFavorite,
          photoPaths: _photoPaths,
        );
      }

      if (mounted) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  _isEdit ? 'Gespeichert.' : 'Fahrzeug hinzugefügt.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingData) {
      return const Scaffold(
        body: Center(
            child: CircularProgressIndicator(color: AppColors.accentGold)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isEdit ? 'Bearbeiten' : 'Neues Fahrzeug'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Photos
            _PhotoPicker(
              paths: _photoPaths,
              onAdd: _pickImage,
              onRemove: (i) => setState(() => _photoPaths.removeAt(i)),
            ),
            const SizedBox(height: 24),

            // ── Required
            Text('FAHRZEUG', style: AppTypography.labelMedium),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Marke *',
              controller: _brandCtrl,
              hint: 'z.B. Bugatti',
              autofocus: !_isEdit,
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Bitte Marke eingeben' : null,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Modell *',
              controller: _modelCtrl,
              hint: 'z.B. Chiron',
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Bitte Modell eingeben' : null,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Baujahr',
              controller: _yearCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            const SizedBox(height: 24),

            // ── Status
            Text('STATUS', style: AppTypography.labelMedium),
            const SizedBox(height: 12),
            _StatusSelector(
              current: _status,
              onChange: (s) => setState(() => _status = s),
            ),
            const SizedBox(height: 24),

            // ── Preis
            Text('PREIS', style: AppTypography.labelMedium),
            const SizedBox(height: 12),
            Row(
              children: [
                SizedBox(
                  width: 90,
                  child: AppTextField(
                    label: 'Währung',
                    controller: _currencyCtrl,
                    textCapitalization: TextCapitalization.characters,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppTextField(
                    label: 'Geschätzter Preis',
                    controller: _priceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ── Performance
            Text('PERFORMANCE', style: AppTypography.labelMedium),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Leistung (PS)',
              controller: _powerCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AppTextField(
                    label: '0-100 (Sek.)',
                    controller: _zeroCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppTextField(
                    label: 'V-max (km/h)',
                    controller: _topSpeedCtrl,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // ── Details
            Text('DETAILS', style: AppTypography.labelMedium),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Farbe außen',
              controller: _extColorCtrl,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Farbe innen',
              controller: _intColorCtrl,
            ),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Limitierung / Stückzahl',
              controller: _limitCtrl,
            ),
            const SizedBox(height: 24),

            // ── Notes
            Text('NOTIZEN', style: AppTypography.labelMedium),
            const SizedBox(height: 12),
            AppTextField(
              label: 'Notizen',
              controller: _notesCtrl,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
            ),
            const SizedBox(height: 20),

            // ── Favorite toggle
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Als Favorit markieren',
                  style: AppTypography.bodyLarge),
              value: _isFavorite,
              onChanged: (v) => setState(() => _isFavorite = v),
              activeColor: AppColors.accentGold,
            ),
            const SizedBox(height: 28),

            SizedBox(
              width: double.infinity,
              child: LuxuryButton(
                label: _isEdit ? 'Speichern' : 'Hinzufügen',
                onPressed: _save,
                isLoading: _loading,
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _StatusSelector extends StatelessWidget {
  const _StatusSelector({
    required this.current,
    required this.onChange,
  });
  final HypercarStatus current;
  final ValueChanged<HypercarStatus> onChange;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: HypercarStatus.values.map((s) {
        final selected = s == current;
        return GestureDetector(
          onTap: () => onChange(s),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color:
                  selected ? AppColors.accentGold : AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: selected
                    ? AppColors.accentGold
                    : AppColors.divider,
              ),
            ),
            child: Text(
              s.label,
              style: AppTypography.labelLarge.copyWith(
                color: selected
                    ? AppColors.background
                    : AppColors.textSecondary,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _PhotoPicker extends StatelessWidget {
  const _PhotoPicker({
    required this.paths,
    required this.onAdd,
    required this.onRemove,
  });
  final List<String> paths;
  final VoidCallback onAdd;
  final void Function(int) onRemove;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('FOTOS', style: AppTypography.labelMedium),
        const SizedBox(height: 12),
        SizedBox(
          height: 110,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ...paths.asMap().entries.map((e) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Image.file(
                            File(e.value),
                            width: 140,
                            height: 110,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () => onRemove(e.key),
                            child: Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close,
                                  size: 14,
                                  color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )),
              GestureDetector(
                onTap: onAdd,
                child: Container(
                  width: 100,
                  height: 110,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: AppColors.divider,
                        style: BorderStyle.solid),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add_photo_alternate_outlined,
                          color: AppColors.textSecondary, size: 28),
                      const SizedBox(height: 6),
                      Text('Foto',
                          style: AppTypography.caption),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
