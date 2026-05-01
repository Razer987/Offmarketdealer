'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { updateListingSchema, type UpdateListingInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { STATUS_LABELS, CONDITION_LABELS } from '@/lib/utils/constants';

interface ListingImage {
  id: string;
  filename: string;
  originalName: string;
  sortOrder: number;
}

interface Listing {
  id: string;
  brand: string;
  model: string;
  year: number;
  teaserTitle: string;
  teaserDescription: string;
  teaserImageUrl: string;
  engineDisplacement?: number | null;
  enginePower?: number | null;
  acceleration?: number | null;
  topSpeed?: number | null;
  mileageRange?: string | null;
  conditionRating: string;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  priceCurrency: string;
  generalDescription: string;
  highlights: string[];
  internalNotes?: string | null;
  internalSellerInfo?: string | null;
  status: string;
  images: ListingImage[];
}

const statusBadge: Record<string, 'gold' | 'silver' | 'green' | 'red' | 'yellow'> = {
  DRAFT: 'silver',
  ACTIVE: 'green',
  RESERVED: 'yellow',
  SOLD: 'red',
  WITHDRAWN: 'red',
};

export default function AdminListingEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateListingInput>({ resolver: zodResolver(updateListingSchema) });

  async function fetchListing() {
    const res = await fetch(`/api/admin/listings/${params.id}`);
    if (!res.ok) {
      setError('Inserat nicht gefunden');
      setLoading(false);
      return;
    }
    const { listing: data } = await res.json() as { listing: Listing };
    setListing(data);
    reset({
      teaserTitle: data.teaserTitle,
      teaserDescription: data.teaserDescription,
      teaserImageUrl: data.teaserImageUrl,
      brand: data.brand,
      model: data.model,
      year: data.year,
      engineDisplacement: data.engineDisplacement ?? undefined,
      enginePower: data.enginePower ?? undefined,
      acceleration: data.acceleration ?? undefined,
      topSpeed: data.topSpeed ?? undefined,
      mileageRange: data.mileageRange ?? undefined,
      conditionRating: data.conditionRating as UpdateListingInput['conditionRating'],
      priceRangeMin: data.priceRangeMin ?? undefined,
      priceRangeMax: data.priceRangeMax ?? undefined,
      priceCurrency: data.priceCurrency,
      generalDescription: data.generalDescription,
      highlights: data.highlights,
      internalNotes: data.internalNotes ?? undefined,
      internalSellerInfo: data.internalSellerInfo ?? undefined,
      status: data.status as UpdateListingInput['status'],
    });
    setLoading(false);
  }

  useEffect(() => { void fetchListing(); }, [params.id]);

  async function onSubmit(data: UpdateListingInput) {
    setError(null);
    setSaveSuccess(false);
    const res = await fetch(`/api/admin/listings/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Fehler beim Speichern');
      return;
    }
    setSaveSuccess(true);
    await fetchListing();
  }

  async function deleteListing() {
    if (!confirm('Inserat wirklich löschen?')) return;
    const res = await fetch(`/api/admin/listings/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin-panel/listings');
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/admin/listings/${params.id}/images`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setUploadError((json as { error?: string }).error ?? 'Upload fehlgeschlagen');
    } else {
      await fetchListing();
    }
    setUploading(false);
    e.target.value = '';
  }

  async function deleteImage(imgId: string) {
    await fetch(`/api/admin/listings/${params.id}/images/${imgId}`, { method: 'DELETE' });
    await fetchListing();
  }

  if (loading) return <div className="p-10 text-brand-silver font-body">Laden...</div>;
  if (error && !listing) return <div className="p-10 text-red-400 font-body">{error}</div>;

  return (
    <div className="p-10">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl text-brand-cream">
            {listing!.brand} {listing!.model} ({listing!.year})
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={statusBadge[listing!.status] ?? 'silver'}>
              {STATUS_LABELS[listing!.status] ?? listing!.status}
            </Badge>
            <span className="text-xs font-body text-brand-silver">{params.id}</span>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={deleteListing}>
          Löschen
        </Button>
      </div>

      {/* Image management */}
      <section className="mb-10">
        <h2 className="font-display text-xl text-brand-cream mb-4 pb-3 border-b border-brand-border">
          Bilder (intern — niemals an Mitglieder gesendet)
        </h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {listing!.images.map((img) => (
            <div key={img.id} className="relative group border border-brand-border p-2 bg-brand-charcoal">
              <p className="text-xs text-brand-silver font-body truncate max-w-[120px]">
                {img.originalName}
              </p>
              <button
                onClick={() => deleteImage(img.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-900 text-red-200 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {listing!.images.length === 0 && (
            <p className="text-sm text-brand-silver font-body">Noch keine Bilder hochgeladen.</p>
          )}
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 btn-outline-gold px-4 py-2 text-sm font-body">
          {uploading ? 'Hochladen...' : 'Bild hochladen'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={uploadImage}
            disabled={uploading}
          />
        </label>
        {uploadError && <p className="text-xs text-red-400 mt-2 font-body">{uploadError}</p>}
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl flex flex-col gap-10">
        {/* Public teaser */}
        <section>
          <h2 className="font-display text-xl text-brand-cream mb-6 pb-3 border-b border-brand-border">
            Öffentlicher Teaser
          </h2>
          <div className="flex flex-col gap-5">
            <Input {...register('teaserTitle')} label="Teaser-Titel" error={errors.teaserTitle?.message} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Teaser-Beschreibung</label>
              <textarea {...register('teaserDescription')} rows={3} className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none" />
              {errors.teaserDescription && <p className="text-xs text-red-400">{errors.teaserDescription.message}</p>}
            </div>
            <Input {...register('teaserImageUrl')} label="Teaser-Bild URL (generisch)" error={errors.teaserImageUrl?.message} />
          </div>
        </section>

        {/* Vehicle details */}
        <section>
          <h2 className="font-display text-xl text-brand-cream mb-6 pb-3 border-b border-brand-border">
            Fahrzeugdaten
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <Input {...register('brand')} label="Marke" error={errors.brand?.message} />
            <Input {...register('model')} label="Modell" error={errors.model?.message} />
            <Input {...register('year', { valueAsNumber: true })} label="Baujahr" type="number" error={errors.year?.message} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Zustand</label>
              <select {...register('conditionRating')} className="input-premium w-full rounded-none px-4 py-3 text-sm font-body">
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <Input {...register('engineDisplacement', { valueAsNumber: true })} label="Hubraum (ccm)" type="number" error={errors.engineDisplacement?.message} />
            <Input {...register('enginePower', { valueAsNumber: true })} label="Leistung (PS)" type="number" error={errors.enginePower?.message} />
            <Input {...register('acceleration', { valueAsNumber: true })} label="0-100 km/h (s)" type="number" step="0.1" error={errors.acceleration?.message} />
            <Input {...register('topSpeed', { valueAsNumber: true })} label="Vmax (km/h)" type="number" error={errors.topSpeed?.message} />
            <Input {...register('mileageRange')} label="Laufleistung (Bereich)" error={errors.mileageRange?.message} />
            <Input {...register('priceRangeMin', { valueAsNumber: true })} label="Preis von (EUR)" type="number" error={errors.priceRangeMin?.message} />
            <Input {...register('priceRangeMax', { valueAsNumber: true })} label="Preis bis (EUR)" type="number" error={errors.priceRangeMax?.message} />
          </div>
          <div className="mt-5 flex flex-col gap-1.5">
            <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Beschreibung</label>
            <textarea {...register('generalDescription')} rows={5} className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none" />
            {errors.generalDescription && <p className="text-xs text-red-400">{errors.generalDescription.message}</p>}
          </div>
        </section>

        {/* Internal */}
        <section>
          <h2 className="font-display text-xl text-brand-cream mb-6 pb-3 border-b border-brand-border">
            Interne Daten
          </h2>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Interne Notizen</label>
              <textarea {...register('internalNotes')} rows={3} className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Verkäufer-Informationen</label>
              <textarea {...register('internalSellerInfo')} rows={3} className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none" />
            </div>
          </div>
        </section>

        {/* Status + save */}
        <section>
          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Status</label>
              <select {...register('status')} className="input-premium rounded-none px-4 py-3 text-sm font-body">
                <option value="DRAFT">Entwurf</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="RESERVED">Reserviert</option>
                <option value="SOLD">Verkauft</option>
                <option value="WITHDRAWN">Zurückgezogen</option>
              </select>
            </div>
            <Button type="submit" loading={isSubmitting} size="lg" disabled={!isDirty}>
              Speichern
            </Button>
            {saveSuccess && <p className="text-sm text-green-400 font-body">Gespeichert.</p>}
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </section>
      </form>
    </div>
  );
}
