import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/DatePicker';
import { lookupKey } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '6a2c5f1737b1758cae8c5e36';
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

export default function PublicFormKommunikation() {
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
          <h1 className="text-2xl font-bold text-foreground">Kommunikation — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="kontakt_vorname">Vorname Kontaktperson</Label>
            <Input
              id="kontakt_vorname"
              placeholder=""
              value={fields.kontakt_vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_nachname">Nachname Kontaktperson</Label>
            <Input
              id="kontakt_nachname"
              placeholder=""
              value={fields.kontakt_nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_adresse_strasse">Straße</Label>
            <Input
              id="kontakt_adresse_strasse"
              placeholder=""
              value={fields.kontakt_adresse_strasse ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_adresse_strasse: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_adresse_hausnummer">Hausnummer</Label>
            <Input
              id="kontakt_adresse_hausnummer"
              placeholder=""
              value={fields.kontakt_adresse_hausnummer ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_adresse_hausnummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_adresse_plz">Postleitzahl</Label>
            <Input
              id="kontakt_adresse_plz"
              placeholder=""
              value={fields.kontakt_adresse_plz ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_adresse_plz: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_telefon">Telefon</Label>
            <Input
              id="kontakt_telefon"
              value={fields.kontakt_telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_email">E-Mail</Label>
            <Input
              id="kontakt_email"
              type="email"
              placeholder=""
              value={fields.kontakt_email ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gespraechsdatum">Datum des Gesprächs</Label>
            <DatePicker
              id="gespraechsdatum"
              placeholder=""
              mode="datetime"
              value={fields.gespraechsdatum ?? null}
              onChange={v => setFields(f => ({ ...f, gespraechsdatum: v ?? undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontaktart">Art des Kontakts</Label>
            <div role="radiogroup" className="flex flex-wrap gap-1.5">
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.kontaktart) === 'information'}
                onClick={() => setFields(f => ({ ...f, kontaktart: (lookupKey(f.kontaktart) === 'information' ? undefined : 'information') as any }))}
                className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.kontaktart) === 'information'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Information
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.kontaktart) === 'beschwerde'}
                onClick={() => setFields(f => ({ ...f, kontaktart: (lookupKey(f.kontaktart) === 'beschwerde' ? undefined : 'beschwerde') as any }))}
                className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.kontaktart) === 'beschwerde'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Beschwerde
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.kontaktart) === 'rueckfrage'}
                onClick={() => setFields(f => ({ ...f, kontaktart: (lookupKey(f.kontaktart) === 'rueckfrage' ? undefined : 'rueckfrage') as any }))}
                className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.kontaktart) === 'rueckfrage'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Rückfrage
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={lookupKey(fields.kontaktart) === 'sonstiges'}
                onClick={() => setFields(f => ({ ...f, kontaktart: (lookupKey(f.kontaktart) === 'sonstiges' ? undefined : 'sonstiges') as any }))}
                className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  lookupKey(fields.kontaktart) === 'sonstiges'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                Sonstiges
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gespraechsnotiz">Gesprächsnotiz</Label>
            <Textarea
              id="gespraechsnotiz"
              placeholder=""
              value={fields.gespraechsnotiz ?? ''}
              onChange={e => setFields(f => ({ ...f, gespraechsnotiz: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="besonderheiten">Besonderheiten</Label>
            <Textarea
              id="besonderheiten"
              placeholder=""
              value={fields.besonderheiten ?? ''}
              onChange={e => setFields(f => ({ ...f, besonderheiten: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kontakt_adresse_ort">Ort</Label>
            <Input
              id="kontakt_adresse_ort"
              placeholder=""
              value={fields.kontakt_adresse_ort ?? ''}
              onChange={e => setFields(f => ({ ...f, kontakt_adresse_ort: e.target.value }))}
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
