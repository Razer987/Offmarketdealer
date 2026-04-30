'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const schema = z.object({
  message: z.string().min(20, 'Mindestens 20 Zeichen').max(5000),
  contactPhone: z.string().optional(),
  preferredContact: z.enum(['EMAIL', 'PHONE', 'WHATSAPP']),
});

type FormData = z.infer<typeof schema>;

interface InquiryFormProps {
  listingId: string;
  onSuccess?: () => void;
}

export function InquiryForm({ listingId, onSuccess }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferredContact: 'EMAIL' },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const res = await fetch(`/api/listings/${listingId}/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Fehler beim Senden');
      return;
    }

    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    return (
      <div className="p-6 border border-brand-gold/30 bg-brand-gold/5 text-center">
        <p className="font-display text-xl text-brand-gold mb-2">Anfrage eingegangen</p>
        <p className="text-sm text-brand-silver font-body">
          Wir melden uns schnellstmöglich bei Ihnen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-body uppercase tracking-widest text-brand-silver">
          Ihre Nachricht
        </label>
        <textarea
          {...register('message')}
          rows={5}
          className="input-premium w-full rounded-none px-4 py-3 text-sm font-body resize-none"
          placeholder="Beschreiben Sie Ihr Interesse..."
        />
        {errors.message && (
          <p className="text-xs text-red-400">{errors.message.message}</p>
        )}
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
  );
}
