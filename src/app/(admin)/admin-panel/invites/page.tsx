'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/format';

interface InviteCode {
  id: string;
  codePrefix: string;
  label?: string | null;
  used: boolean;
  usedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  user?: { username: string; email: string } | null;
}

export default function AdminInvitesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [label, setLabel] = useState('');

  async function fetchCodes() {
    const res = await fetch('/api/admin/invites');
    const json = await res.json();
    setCodes((json as { codes: InviteCode[] }).codes ?? []);
    setLoading(false);
  }

  useEffect(() => { void fetchCodes(); }, []);

  async function createCode() {
    setCreating(true);
    setNewCode(null);
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label || undefined }),
    });
    const json = await res.json();
    setNewCode((json as { rawCode?: string }).rawCode ?? null);
    setLabel('');
    await fetchCodes();
    setCreating(false);
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' });
    await fetchCodes();
  }

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-3xl text-brand-cream">Einladungscodes</h1>
      </div>

      {/* Create new code */}
      <div className="card-premium p-6 mb-8">
        <h2 className="font-display text-xl text-brand-cream mb-4">Neuer Code</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-body uppercase tracking-widest text-brand-silver mb-1.5 block">
              Bezeichnung (optional)
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z.B. VIP-Käufer Müller"
              className="input-premium w-full rounded-none px-4 py-3 text-sm font-body"
            />
          </div>
          <Button onClick={createCode} loading={creating}>
            Code generieren
          </Button>
        </div>

        {newCode && (
          <div className="mt-4 p-4 border border-brand-gold/50 bg-brand-gold/5">
            <p className="text-xs font-body uppercase tracking-widest text-brand-silver mb-1">
              Einmaliger Code — jetzt kopieren!
            </p>
            <p className="font-display text-3xl text-brand-gold tracking-[0.4em]">{newCode}</p>
            <p className="text-xs text-brand-silver font-body mt-2">
              Dieser Code wird nur einmal angezeigt und kann nicht wiederhergestellt werden.
            </p>
          </div>
        )}
      </div>

      {/* Codes list */}
      {loading ? (
        <p className="text-brand-silver font-body">Laden...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Bezeichnung</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Präfix</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Status</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Verwendet von</th>
                <th className="pb-3 text-xs uppercase tracking-widest text-brand-silver font-normal pr-6">Erstellt</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-brand-charcoal/30">
                  <td className="py-4 pr-6 text-brand-cream">{code.label ?? '—'}</td>
                  <td className="py-4 pr-6 text-brand-silver font-mono tracking-widest">{code.codePrefix}****</td>
                  <td className="py-4 pr-6">
                    <Badge variant={code.used ? 'silver' : 'green'}>
                      {code.used ? 'Verwendet' : 'Aktiv'}
                    </Badge>
                  </td>
                  <td className="py-4 pr-6 text-brand-silver">
                    {code.user?.username ?? '—'}
                  </td>
                  <td className="py-4 pr-6 text-brand-silver">{formatDate(code.createdAt)}</td>
                  <td className="py-4 text-right">
                    {!code.used && (
                      <button
                        onClick={() => deactivate(code.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Deaktivieren
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
