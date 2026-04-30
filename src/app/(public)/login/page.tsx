'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Anmeldung fehlgeschlagen');
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Mitglieder
          </p>
          <h1 className="font-display text-4xl text-brand-cream">Anmelden</h1>
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

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
              Anmelden
            </Button>
          </form>

          <div className="gold-divider my-6" />

          <div className="flex flex-col gap-3 text-center text-xs font-body text-brand-silver">
            <Link href="/forgot-password" className="hover:text-brand-gold transition-colors">
              Passwort vergessen?
            </Link>
            <p>
              Noch kein Konto?{' '}
              <Link href="/invite/register" className="text-brand-gold hover:text-brand-gold-light transition-colors">
                Mit Einladungscode registrieren
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
