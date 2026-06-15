import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { lookupKey } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '6a2c5f169a7902a433caa841';
const SUBMIT_PATH = `/rest/apps/${APP_ID}/records`;
const ALTCHA_SCRIPT_SRC = 'https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js';

async function submitPublicForm(fields: Record<string, unknown>, captchaToken: string) {
  const res = await fetch(`${PROXY_BASE}/api${SUBMIT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Token': captchaToken,
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Submission failed');
  }
  return res.json();
}


function cleanFields(fields: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (typeof value === 'object' && !Array.isArray(value) && 'key' in (value as any)) {
      cleaned[key] = (value as any).key;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item =>
        typeof item === 'object' && item !== null && 'key' in item ? item.key : item
      );
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export default function PublicFormLeitungsauskunft() {
  const [fields, setFields] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<HTMLElement | null>(null);

  // Load the ALTCHA web component script once per page.
  useEffect(() => {
    if (document.querySelector(`script[src="${ALTCHA_SCRIPT_SRC}"]`)) return;
    const s = document.createElement('script');
    s.src = ALTCHA_SCRIPT_SRC;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return;
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const prefill: Record<string, any> = {};
    params.forEach((value, key) => { prefill[key] = value; });
    if (Object.keys(prefill).length) setFields(prev => ({ ...prefill, ...prev }));
  }, []);

  function readCaptchaToken(): string | null {
    const el = captchaRef.current as any;
    if (!el) return null;
    return el.value || el.getAttribute('value') || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = readCaptchaToken();
    if (!token) {
      setError('Bitte warte auf die Spam-Prüfung und versuche es erneut.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(cleanFields(fields), token);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Vielen Dank!</h2>
          <p className="text-muted-foreground">Deine Eingabe wurde erfolgreich übermittelt.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setSubmitted(false); setFields({}); }}>
            Weitere Eingabe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Leitungsauskunft — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="hausanschluss_info">Hausanschluss-Informationen</Label>
            <Textarea
              id="hausanschluss_info"
              placeholder=""
              value={fields.hausanschluss_info ?? ''}
              onChange={e => setFields(f => ({ ...f, hausanschluss_info: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hausanschluss_typ">Hausanschluss-Typ</Label>
            <div role="radiogroup" className="flex flex-wrap gap-1.5">
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.hausanschluss_typ) === 'strom'}
                onClick={() => setFields(f => ({ ...f, hausanschluss_typ: (lookupKey(f.hausanschluss_typ) === 'strom' ? undefined : 'strom') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.hausanschluss_typ) === 'strom'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Strom
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.hausanschluss_typ) === 'gas'}
                onClick={() => setFields(f => ({ ...f, hausanschluss_typ: (lookupKey(f.hausanschluss_typ) === 'gas' ? undefined : 'gas') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.hausanschluss_typ) === 'gas'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Gas
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.hausanschluss_typ) === 'wasser'}
                onClick={() => setFields(f => ({ ...f, hausanschluss_typ: (lookupKey(f.hausanschluss_typ) === 'wasser' ? undefined : 'wasser') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.hausanschluss_typ) === 'wasser'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Wasser
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.hausanschluss_typ) === 'telekommunikation'}
                onClick={() => setFields(f => ({ ...f, hausanschluss_typ: (lookupKey(f.hausanschluss_typ) === 'telekommunikation' ? undefined : 'telekommunikation') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.hausanschluss_typ) === 'telekommunikation'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Telekommunikation
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.hausanschluss_typ) === 'fernwaerme'}
                onClick={() => setFields(f => ({ ...f, hausanschluss_typ: (lookupKey(f.hausanschluss_typ) === 'fernwaerme' ? undefined : 'fernwaerme') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.hausanschluss_typ) === 'fernwaerme'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Fernwärme
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spannungsebene">Spannungsebene</Label>
            <div role="radiogroup" className="flex flex-wrap gap-1.5">
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.spannungsebene) === 'niederspannung'}
                onClick={() => setFields(f => ({ ...f, spannungsebene: (lookupKey(f.spannungsebene) === 'niederspannung' ? undefined : 'niederspannung') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.spannungsebene) === 'niederspannung'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Niederspannung
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.spannungsebene) === 'mittelspannung'}
                onClick={() => setFields(f => ({ ...f, spannungsebene: (lookupKey(f.spannungsebene) === 'mittelspannung' ? undefined : 'mittelspannung') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.spannungsebene) === 'mittelspannung'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Mittelspannung
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.spannungsebene) === 'hochspannung'}
                onClick={() => setFields(f => ({ ...f, spannungsebene: (lookupKey(f.spannungsebene) === 'hochspannung' ? undefined : 'hochspannung') as any }))}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.spannungsebene) === 'hochspannung'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Hochspannung
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="muffentyp">Muffentyp</Label>
            <Input
              id="muffentyp"
              placeholder=""
              value={fields.muffentyp ?? ''}
              onChange={e => setFields(f => ({ ...f, muffentyp: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              placeholder=""
              value={fields.material ?? ''}
              onChange={e => setFields(f => ({ ...f, material: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leitungsfuehrung">Leitungsführung und Notizen</Label>
            <Textarea
              id="leitungsfuehrung"
              placeholder=""
              value={fields.leitungsfuehrung ?? ''}
              onChange={e => setFields(f => ({ ...f, leitungsfuehrung: e.target.value }))}
              rows={3}
            />
          </div>

          <altcha-widget
            ref={captchaRef as any}
            challengeurl={`${PROXY_BASE}/api/_challenge?path=${encodeURIComponent(SUBMIT_PATH)}`}
            auto="onsubmit"
            hidefooter
          />

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Wird gesendet...' : 'Absenden'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Powered by Klar
        </p>
      </div>
    </div>
  );
}
