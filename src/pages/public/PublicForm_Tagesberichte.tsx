import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/DatePicker';
import { lookupKey } from '@/lib/formatters';

// Empty PROXY_BASE → relative URLs (dashboard and form-proxy share the domain).
const PROXY_BASE = '';
const APP_ID = '6a2c5f1b22f933a50d29cc67';
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

export default function PublicFormTagesberichte() {
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
          <h1 className="text-2xl font-bold text-foreground">Tagesberichte — Formular</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border border-border p-6 shadow-md">
          <div className="space-y-2">
            <Label htmlFor="berichtsdatum">Berichtsdatum</Label>
            <DatePicker
              id="berichtsdatum"
              placeholder=""
              mode="date"
              value={fields.berichtsdatum ?? null}
              onChange={v => setFields(f => ({ ...f, berichtsdatum: v ?? undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verfasser_vorname">Vorname Verfasser</Label>
            <Input
              id="verfasser_vorname"
              placeholder=""
              value={fields.verfasser_vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, verfasser_vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verfasser_nachname">Nachname Verfasser</Label>
            <Input
              id="verfasser_nachname"
              placeholder=""
              value={fields.verfasser_nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, verfasser_nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wetterbedingungen">Wetterbedingungen</Label>
            <Select
              value={lookupKey(fields.wetterbedingungen) ?? ''}
              onValueChange={v => setFields(f => ({ ...f, wetterbedingungen: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="wetterbedingungen"><SelectValue placeholder="" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="sonnig">Sonnig</SelectItem>
                <SelectItem value="bewoelkt">Bewölkt</SelectItem>
                <SelectItem value="regnerisch">Regnerisch</SelectItem>
                <SelectItem value="windig">Windig</SelectItem>
                <SelectItem value="schnee">Schnee</SelectItem>
                <SelectItem value="frost">Frost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mitarbeiter_anzahl">Anzahl Mitarbeiter vor Ort</Label>
            <Input
              id="mitarbeiter_anzahl"
              type="number"
              step="any"
              min={0}
              placeholder=""
              value={fields.mitarbeiter_anzahl ?? ''}
              onChange={e => { const n = e.target.value ? Math.max(0, Number(e.target.value)) : undefined; setFields(f => ({ ...f, mitarbeiter_anzahl: n })); }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durchgefuehrte_arbeiten">Durchgeführte Arbeiten</Label>
            <Textarea
              id="durchgefuehrte_arbeiten"
              placeholder=""
              value={fields.durchgefuehrte_arbeiten ?? ''}
              onChange={e => setFields(f => ({ ...f, durchgefuehrte_arbeiten: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="besonderheiten_tag">Besonderheiten des Tages</Label>
            <Textarea
              id="besonderheiten_tag"
              placeholder=""
              value={fields.besonderheiten_tag ?? ''}
              onChange={e => setFields(f => ({ ...f, besonderheiten_tag: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="naechste_schritte">Nächste geplante Schritte</Label>
            <Textarea
              id="naechste_schritte"
              placeholder=""
              value={fields.naechste_schritte ?? ''}
              onChange={e => setFields(f => ({ ...f, naechste_schritte: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freigabe_vorgesetzter">Freigabe durch Vorgesetzten erteilt</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="freigabe_vorgesetzter"
                checked={!!fields.freigabe_vorgesetzter}
                onCheckedChange={(v) => setFields(f => ({ ...f, freigabe_vorgesetzter: !!v }))}
              />
              <Label htmlFor="freigabe_vorgesetzter" className="font-normal">Freigabe durch Vorgesetzten erteilt</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="freigabe_bemerkung">Bemerkung zur Freigabe</Label>
            <Textarea
              id="freigabe_bemerkung"
              placeholder=""
              value={fields.freigabe_bemerkung ?? ''}
              onChange={e => setFields(f => ({ ...f, freigabe_bemerkung: e.target.value }))}
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
