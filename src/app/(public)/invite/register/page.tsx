'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [codeValid, setCodeValid] = useState(false);
  const [validatingCode, setValidatingCode] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const code = watch('inviteCode', '');

  async function validateCode() {
    if (code.length !== 6) return;
    setValidatingCode(true);
    setError(null);
    const res = await fetch('/api/invite/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const json = await res.json().catch(() => ({}));
    setCodeValid((json as { valid?: boolean }).valid === true);
    if (!(json as { valid?: boolean }).valid) {
      setError((json as { reason?: string }).reason ?? 'Ungültiger Code');
    }
    setValidatingCode(false);
  }

  async function onSubmit(data: RegisterInput) {
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Registrierung fehlgeschlagen');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs font-body uppercase tracking-[0.4em] text-brand-gold mb-3">
            Registrierung
          </p>
          <h1 className="font-display text-4xl text-brand-cream mb-3">Konto erstellen</h1>
          <p className="text-sm text-brand-silver font-body">
            Sie benötigen einen persönlichen Einladungscode.
          </p>
        </div>

        <div className="card-premium p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <Input
                {...register('inviteCode')}
                label="Einladungscode"
                placeholder="6-stellig"
                maxLength={6}
                className="uppercase"
                error={errors.inviteCode?.message}
              />
              {code.length === 6 && !codeValid && (
                <button
                  type="button"
                  onClick={validateCode}
                  disabled={validatingCode}
                  className="mt-2 text-xs text-brand-gold hover:text-brand-gold-light font-body"
                >
                  {validatingCode ? 'Prüfen...' : 'Code prüfen'}
                </button>
              )}
              {codeValid && (
                <p className="mt-2 text-xs text-green-400 font-body">✓ Code gültig</p>
              )}
            </div>

            <Input
              {...register('email')}
              label="E-Mail-Adresse"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
            />
            <div>
              <Input
                {...register('password')}
                label="Passwort"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
              />
              <p className="mt-1.5 text-xs text-brand-silver font-body">
                Mindestens 12 Zeichen, inkl. Groß-/Kleinbuchstaben, Zahl und Sonderzeichen.
              </p>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full mt-2">
              Konto erstellen
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
