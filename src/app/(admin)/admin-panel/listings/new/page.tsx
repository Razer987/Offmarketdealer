'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createListingSchema, type CreateListingInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewListingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      priceCurrency: 'EUR',
      status: 'DRAFT',
      highlights: [],
      conditionRating: 'EXCELLENT',
    },
  });

  async function onSubmit(data: CreateListingInput) {
    setError(null);
    const res = await fetch('/api/admin/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Fehler beim Speichern');
      return;
    }

    const { listing } = await res.json() as { listing: { id: string } };
    router.push(`/admin-panel/listings/${listing.id}`);
  }

  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="font-display text-3xl text-brand-cream">Neues Inserat</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl flex flex-col gap-10">
        {/* Public teaser */}
        <section>
          <h2 className="font-display text-xl text-brand-cream mb-6 pb-3 border-b border-brand-border">
            Öffentlicher Teaser
          </h2>
          <div className="flex flex-col gap-5">
            <Input {...register('teaserTitle')} label="Teaser-Titel" error={errors.teaserTitle?.message} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Teaser-Beschreibung
              </label>
              <textarea
                {...register('teaserDescription')}
                rows={3}
                className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none"
              />
              {errors.teaserDescription && (
                <p className="text-xs text-red-400">{errors.teaserDescription.message}</p>
              )}
            </div>
            <Input {...register('teaserImageUrl')} label="Teaser-Bild URL (generisch)" error={errors.teaserImageUrl?.message} />
          </div>
        </section>

        {/* Vehicle details */}
        <section>
          <h2 className="font-display text-xl text-brand-cream mb-6 pb-3 border-b border-brand-border">
            Fahrzeugdaten (Mitglieder-sichtbar)
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <Input {...register('brand')} label="Marke" error={errors.brand?.message} />
            <Input {...register('model')} label="Modell" error={errors.model?.message} />
            <Input {...register('year', { valueAsNumber: true })} label="Baujahr" type="number" error={errors.year?.message} />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Zustand</label>
              <select {...register('conditionRating')} className="input-premium w-full rounded-none px-4 py-3 text-sm font-body">
                <option value="CONCOURS">Concours-Zustand</option>
                <option value="EXCELLENT">Ausgezeichnet</option>
                <option value="VERY_GOOD">Sehr gut</option>
                <option value="GOOD">Gut</option>
                <option value="RESTORATION">Restaurationsobjekt</option>
              </select>
            </div>
            <Input {...register('engineDisplacement', { valueAsNumber: true })} label="Hubraum (ccm)" type="number" error={errors.engineDisplacement?.message} />
            <Input {...register('enginePower', { valueAsNumber: true })} label="Leistung (PS)" type="number" error={errors.enginePower?.message} />
            <Input {...register('acceleration', { valueAsNumber: true })} label="0-100 km/h (s)" type="number" step="0.1" error={errors.acceleration?.message} />
            <Input {...register('topSpeed', { valueAsNumber: true })} label="Vmax (km/h)" type="number" error={errors.topSpeed?.message} />
            <Input {...register('mileageRange')} label="Laufleistung (Bereich)" placeholder="z.B. unter 50.000 km" error={errors.mileageRange?.message} />
            <Input {...register('priceRangeMin', { valueAsNumber: true })} label="Preis von (EUR)" type="number" error={errors.priceRangeMin?.message} />
            <Input {...register('priceRangeMax', { valueAsNumber: true })} label="Preis bis (EUR)" type="number" error={errors.priceRangeMax?.message} />
          </div>

          <div className="mt-5 flex flex-col gap-1.5">
            <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
              Beschreibung (für Mitglieder)
            </label>
            <textarea
              {...register('generalDescription')}
              rows={5}
              className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none"
            />
            {errors.generalDescription && (
              <p className="text-xs text-red-400">{errors.generalDescription.message}</p>
            )}
          </div>
        </section>

        {/* Internal */}
        <section>
          <h2 className="font-display text-xl text-brand-cream mb-6 pb-3 border-b border-brand-border">
            Interne Daten (nur Admin)
          </h2>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Interne Notizen
              </label>
              <textarea
                {...register('internalNotes')}
                rows={3}
                className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Verkäufer-Informationen
              </label>
              <textarea
                {...register('internalSellerInfo')}
                rows={3}
                className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none"
              />
            </div>
          </div>
        </section>

        {/* Status */}
        <section>
          <div className="flex items-end gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">Status</label>
              <select {...register('status')} className="input-premium rounded-none px-4 py-3 text-sm font-body">
                <option value="DRAFT">Entwurf</option>
                <option value="ACTIVE">Aktiv</option>
              </select>
            </div>

            <Button type="submit" loading={isSubmitting} size="lg">
              Inserat erstellen
            </Button>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </section>
      </form>
    </div>
  );
}
