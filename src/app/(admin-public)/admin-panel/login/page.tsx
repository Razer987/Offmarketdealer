'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { adminLoginSchema, type AdminLoginInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [requireTotp, setRequireTotp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema) });

  async function onSubmit(data: AdminLoginInput) {
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => ({}));

    if ((json as { requireTotp?: boolean }).requireTotp) {
      setRequireTotp(true);
      return;
    }

    if (!res.ok) {
      setError((json as { error?: string }).error ?? 'Anmeldung fehlgeschlagen');
      return;
    }

    router.push('/admin-panel/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-brand-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Administration
          </p>
          <h1 className="font-display text-3xl text-brand-cream">Admin-Zugang</h1>
        </div>

        <div className="card-premium p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              {...register('email')}
              label="E-Mail"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
            />
            <Input
              {...register('password')}
              label="Passwort"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
            />

            {requireTotp && (
              <Input
                {...register('totpToken')}
                label="2FA-Code"
                placeholder="6-stellig"
                maxLength={6}
                inputMode="numeric"
                error={errors.totpToken?.message}
              />
            )}

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
              Anmelden
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
