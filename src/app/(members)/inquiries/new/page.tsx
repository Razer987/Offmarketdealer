'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createInquirySchema, type CreateInquiryInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function NewInquiryPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInquiryInput>({
    resolver: zodResolver(createInquirySchema),
    defaultValues: { type: 'GENERAL', preferredContact: 'EMAIL' },
  });

  const type = watch('type');

  async function onSubmit(data: CreateInquiryInput) {
    setError(null);
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Fehler');
      return;
    }

    router.push('/inquiries');
    router.refresh();
  }

  return (
    <div className="px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Anfrage
          </p>
          <h1 className="font-display text-4xl text-brand-cream">Neue Anfrage</h1>
        </div>

        <div className="card-premium p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Art der Anfrage
              </label>
              <select
                {...register('type')}
                className="input-premium w-full rounded-none px-4 py-3 text-sm font-body"
              >
                <option value="GENERAL">Allgemeine Anfrage</option>
                <option value="ASSESSMENT_REQUEST">Gutachten-Auftrag</option>
              </select>
            </div>

            {type === 'ASSESSMENT_REQUEST' && (
              <div className="grid grid-cols-2 gap-4">
                <Input {...register('vehicleBrand')} label="Marke" error={errors.vehicleBrand?.message} />
                <Input {...register('vehicleModel')} label="Modell" error={errors.vehicleModel?.message} />
                <Input
                  {...register('vehicleYear', { valueAsNumber: true })}
                  label="Baujahr"
                  type="number"
                  error={errors.vehicleYear?.message}
                />
                <Input
                  {...register('vehicleMileage', { valueAsNumber: true })}
                  label="Kilometerstand"
                  type="number"
                  error={errors.vehicleMileage?.message}
                />
                <Input {...register('vehicleVin')} label="FIN (optional)" error={errors.vehicleVin?.message} />
                <Input {...register('vehicleLocation')} label="Standort" error={errors.vehicleLocation?.message} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Ihre Nachricht
              </label>
              <textarea
                {...register('message')}
                rows={5}
                className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none"
              />
              {errors.message && <p className="text-xs text-red-400">{errors.message.message}</p>}
            </div>

            <Input
              {...register('contactPhone')}
              label="Telefon (optional)"
              type="tel"
              placeholder="+49 ..."
              error={errors.contactPhone?.message}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
                Bevorzugter Kontaktweg
              </label>
              <select
                {...register('preferredContact')}
                className="input-premium w-full rounded-none px-4 py-3 text-sm font-body"
              >
                <option value="EMAIL">E-Mail</option>
                <option value="PHONE">Telefon</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" loading={isSubmitting} size="lg">
              Anfrage absenden
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
