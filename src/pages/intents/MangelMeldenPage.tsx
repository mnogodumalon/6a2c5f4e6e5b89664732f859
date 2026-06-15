import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IntentWizardShell } from '@/components/IntentWizardShell';
import { EntitySelectStep } from '@/components/EntitySelectStep';
import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Baustellen } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  IconHelmet,
  IconAlertTriangle,
  IconCheck,
  IconPlus,
  IconBuilding,
  IconPhone,
  IconUser,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
} from '@tabler/icons-react';
import { format } from 'date-fns';

// ---- Lookup data ----
const mangelTypOptions = LOOKUP_OPTIONS['maengelerfassung']?.['mangeltyp'] ?? [];
const prioritaetOptions = LOOKUP_OPTIONS['maengelerfassung']?.['prioritaet'] ?? [];
const mangelStatusOptions = LOOKUP_OPTIONS['maengelerfassung']?.['mangel_status'] ?? [];
const kontaktartOptions = LOOKUP_OPTIONS['kommunikation']?.['kontaktart'] ?? [];

// Priority color mapping (index-based: first=green, middle=yellow, last=red)
function getPrioritaetColor(key: string): string {
  const idx = prioritaetOptions.findIndex(o => o.key === key);
  const total = prioritaetOptions.length;
  if (total === 0) return 'bg-muted text-muted-foreground';
  if (idx === 0) return 'bg-green-100 text-green-700 border-green-300';
  if (idx === total - 1) return 'bg-red-100 text-red-700 border-red-300';
  if (idx === Math.floor(total / 2)) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  if (idx < total / 2) return 'bg-yellow-50 text-yellow-600 border-yellow-200';
  return 'bg-orange-100 text-orange-700 border-orange-300';
}

function getPrioritaetBadgeColor(key: string): string {
  const idx = prioritaetOptions.findIndex(o => o.key === key);
  const total = prioritaetOptions.length;
  if (total === 0) return 'bg-muted text-muted-foreground';
  if (idx === 0) return 'bg-green-100 text-green-700';
  if (idx === total - 1) return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
}

function nowAsDatetimeMinute(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

const WIZARD_STEPS = [
  { label: 'Baustelle' },
  { label: 'Mangel' },
  { label: 'Kommunikation' },
  { label: 'Abschluss' },
];

export default function MangelMeldenPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { baustellen, loading, error, fetchAll } = useDashboardData();

  // Step state — initialize from URL
  const urlStep = parseInt(searchParams.get('step') ?? '1', 10);
  const [step, setStep] = useState<number>(
    urlStep >= 1 && urlStep <= 4 ? urlStep : 1
  );

  // Step 1: selected baustelle
  const urlBaustelleId = searchParams.get('baustelleId') ?? '';
  const [selectedBaustelle, setSelectedBaustelle] = useState<Baustellen | null>(null);

  // Step 2: mangel form
  const [mangeltyp, setMangeltyp] = useState<string>('');
  const [mangelBeschreibung, setMangelBeschreibung] = useState<string>('');
  const [prioritaet, setPrioritaet] = useState<string>('');
  const [meldedatum, setMeldedatum] = useState<string>(nowAsDatetimeMinute());
  const [mangelStatus, setMangelStatus] = useState<string>(mangelStatusOptions[0]?.key ?? '');
  const [mangelBemerkungen, setMangelBemerkungen] = useState<string>('');
  const [firmaName, setFirmaName] = useState<string>('');
  const [firmaVorname, setFirmaVorname] = useState<string>('');
  const [firmaNachname, setFirmaNachname] = useState<string>('');
  const [firmaTelefon, setFirmaTelefon] = useState<string>('');
  const [firmaOpen, setFirmaOpen] = useState<boolean>(true);
  const [step2Submitting, setStep2Submitting] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [createdMangeltyp, setCreatedMangeltyp] = useState<string>('');
  const [createdPrioritaet, setCreatedPrioritaet] = useState<string>('');
  const [createdFirmaName, setCreatedFirmaName] = useState<string>('');

  // Step 3: kommunikation
  const [dokumentieren, setDokumentieren] = useState<boolean>(false);
  const [kommVorname, setKommVorname] = useState<string>('');
  const [kommNachname, setKommNachname] = useState<string>('');
  const [kommTelefon, setKommTelefon] = useState<string>('');
  const [kommEmail, setKommEmail] = useState<string>('');
  const [gespraechsdatum, setGespraechsdatum] = useState<string>(nowAsDatetimeMinute());
  const [kontaktart, setKontaktart] = useState<string>(kontaktartOptions[0]?.key ?? '');
  const [gespraechsnotiz, setGespraechsnotiz] = useState<string>('');
  const [besonderheiten, setBesonderheiten] = useState<string>('');
  const [step3Submitting, setStep3Submitting] = useState(false);
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [kommunikationCreated, setKommunikationCreated] = useState(false);

  // Deep-link: if baustelleId in URL, auto-select and skip to step 2
  useEffect(() => {
    if (urlBaustelleId && baustellen.length > 0 && !selectedBaustelle) {
      const found = baustellen.find(b => b.record_id === urlBaustelleId);
      if (found) {
        setSelectedBaustelle(found);
        if (step === 1) setStep(2);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baustellen, urlBaustelleId]);

  // Sync baustelleId to URL when selected
  useEffect(() => {
    if (selectedBaustelle) {
      const params = new URLSearchParams(searchParams);
      params.set('baustelleId', selectedBaustelle.record_id);
      setSearchParams(params, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBaustelle]);

  // Pre-fill kommunikation fields from firma values when entering step 3
  useEffect(() => {
    if (step === 3) {
      setKommVorname(firmaVorname);
      setKommNachname(firmaNachname);
      setKommTelefon(firmaTelefon);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // --- Step 1: select baustelle ---
  function handleSelectBaustelle(id: string) {
    const found = baustellen.find(b => b.record_id === id) ?? null;
    setSelectedBaustelle(found);
    setStep(2);
  }

  // --- Step 2: submit mangel ---
  async function handleSubmitMangel() {
    if (!selectedBaustelle) return;
    if (!mangelBeschreibung.trim()) {
      setStep2Error('Bitte gib eine Mangelbeschreibung ein.');
      return;
    }
    setStep2Error(null);
    setStep2Submitting(true);
    try {
      await LivingAppsService.createMaengelerfassungEntry({
        baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, selectedBaustelle.record_id),
        mangeltyp: mangeltyp || undefined,
        mangel_beschreibung: mangelBeschreibung,
        prioritaet: prioritaet || undefined,
        meldedatum: meldedatum,
        mangel_status: mangelStatus || undefined,
        firma_name: firmaName || undefined,
        firma_ansprechpartner_vorname: firmaVorname || undefined,
        firma_ansprechpartner_nachname: firmaNachname || undefined,
        firma_telefon: firmaTelefon || undefined,
        mangel_bemerkungen: mangelBemerkungen || undefined,
      });
      await fetchAll();
      // Save summary values
      setCreatedMangeltyp(mangeltyp);
      setCreatedPrioritaet(prioritaet);
      setCreatedFirmaName(firmaName);
      setStep(3);
    } catch (err) {
      setStep2Error(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setStep2Submitting(false);
    }
  }

  // --- Step 3: submit kommunikation ---
  async function handleSubmitKommunikation() {
    if (!selectedBaustelle) return;
    setStep3Error(null);
    setStep3Submitting(true);
    try {
      await LivingAppsService.createKommunikationEntry({
        baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, selectedBaustelle.record_id),
        kontakt_vorname: kommVorname || undefined,
        kontakt_nachname: kommNachname || undefined,
        kontakt_telefon: kommTelefon || undefined,
        kontakt_email: kommEmail || undefined,
        gespraechsdatum: gespraechsdatum,
        kontaktart: kontaktart || undefined,
        gespraechsnotiz: gespraechsnotiz || undefined,
        besonderheiten: besonderheiten || undefined,
      });
      await fetchAll();
      setKommunikationCreated(true);
      setStep(4);
    } catch (err) {
      setStep3Error(err instanceof Error ? err.message : 'Fehler beim Speichern.');
    } finally {
      setStep3Submitting(false);
    }
  }

  function handleSkipKommunikation() {
    setKommunikationCreated(false);
    setStep(4);
  }

  // --- Reset helpers ---
  function resetToStep2() {
    // Keep selected baustelle, reset mangel form
    setMangeltyp('');
    setMangelBeschreibung('');
    setPrioritaet('');
    setMeldedatum(nowAsDatetimeMinute());
    setMangelStatus(mangelStatusOptions[0]?.key ?? '');
    setMangelBemerkungen('');
    setFirmaName('');
    setFirmaVorname('');
    setFirmaNachname('');
    setFirmaTelefon('');
    setDokumentieren(false);
    setKommVorname('');
    setKommNachname('');
    setKommTelefon('');
    setKommEmail('');
    setGespraechsdatum(nowAsDatetimeMinute());
    setKontaktart(kontaktartOptions[0]?.key ?? '');
    setGespraechsnotiz('');
    setBesonderheiten('');
    setKommunikationCreated(false);
    setStep2Error(null);
    setStep3Error(null);
    setCreatedMangeltyp('');
    setCreatedPrioritaet('');
    setCreatedFirmaName('');
    setStep(2);
  }

  function resetFull() {
    setSelectedBaustelle(null);
    const params = new URLSearchParams(searchParams);
    params.delete('baustelleId');
    setSearchParams(params, { replace: true });
    resetToStep2();
    setStep(1);
  }

  // Derived labels
  const mangelTypLabel = mangelTypOptions.find(o => o.key === createdMangeltyp)?.label ?? createdMangeltyp;
  const prioritaetLabel = prioritaetOptions.find(o => o.key === createdPrioritaet)?.label ?? createdPrioritaet;

  const selectedMangelTypLabel = mangelTypOptions.find(o => o.key === mangeltyp)?.label ?? '';
  const selectedPrioritaetLabel = prioritaetOptions.find(o => o.key === prioritaet)?.label ?? '';

  return (
    <IntentWizardShell
      title="Mangel melden"
      subtitle="Erfasse einen Mangel auf der Baustelle und dokumentiere die Kommunikation."
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* ---- STEP 1: Baustelle auswählen ---- */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Baustelle auswählen</h2>
            <p className="text-sm text-muted-foreground">Wähle die Baustelle aus, auf der der Mangel aufgetreten ist.</p>
          </div>
          <EntitySelectStep
            items={baustellen.map(b => ({
              id: b.record_id,
              title: b.fields.name ?? '(Ohne Name)',
              subtitle: [b.fields.strasse, b.fields.hausnummer, b.fields.ort].filter(Boolean).join(' ') || undefined,
              status: b.fields.status ? { key: b.fields.status.key, label: b.fields.status.label } : undefined,
              icon: <IconHelmet size={20} className="text-primary" />,
            }))}
            onSelect={handleSelectBaustelle}
            searchPlaceholder="Baustelle suchen..."
            emptyText="Keine Baustellen gefunden."
            emptyIcon={<IconHelmet size={32} />}
          />
        </div>
      )}

      {/* ---- STEP 2: Mangel erfassen ---- */}
      {step === 2 && selectedBaustelle && (
        <div className="space-y-5">
          {/* Context header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconHelmet size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Baustelle</p>
              <p className="font-semibold truncate">{selectedBaustelle.fields.name ?? '(Ohne Name)'}</p>
              {selectedBaustelle.fields.ort && (
                <p className="text-xs text-muted-foreground truncate">{selectedBaustelle.fields.ort}</p>
              )}
            </div>
            {selectedBaustelle.fields.status && (
              <div className="ml-auto shrink-0">
                <StatusBadge
                  statusKey={selectedBaustelle.fields.status.key}
                  label={selectedBaustelle.fields.status.label}
                />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1">Mangel erfassen</h2>
            <p className="text-sm text-muted-foreground">Beschreibe den festgestellten Mangel.</p>
          </div>

          {/* Live feedback card */}
          {prioritaet && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
              <IconAlertTriangle size={18} className="text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-2 items-center min-w-0">
                <span className="text-sm text-muted-foreground">Priorität:</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getPrioritaetBadgeColor(prioritaet)}`}>
                  {selectedPrioritaetLabel}
                </span>
                {mangeltyp && (
                  <>
                    <span className="text-sm text-muted-foreground">Typ:</span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-foreground">
                      {selectedMangelTypLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mangeltyp tiles */}
          <div>
            <label className="block text-sm font-medium mb-2">Mangeltyp</label>
            <div className="flex flex-wrap gap-2">
              {mangelTypOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMangeltyp(mangeltyp === opt.key ? '' : opt.key)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    mangeltyp === opt.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mangelbeschreibung */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Mangelbeschreibung <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Beschreibe den Mangel so genau wie möglich..."
              value={mangelBeschreibung}
              onChange={e => setMangelBeschreibung(e.target.value)}
              rows={4}
              className="w-full resize-none"
            />
          </div>

          {/* Priorität radio tiles */}
          <div>
            <label className="block text-sm font-medium mb-2">Priorität</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {prioritaetOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPrioritaet(prioritaet === opt.key ? '' : opt.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    prioritaet === opt.key
                      ? `${getPrioritaetColor(opt.key)} border-current`
                      : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:bg-accent'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meldedatum */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Meldedatum</label>
            <Input
              type="datetime-local"
              value={meldedatum}
              onChange={e => setMeldedatum(e.target.value)}
              className="w-full max-w-xs"
            />
          </div>

          {/* Mangel-Status */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              value={mangelStatus}
              onChange={e => setMangelStatus(e.target.value)}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">— Bitte wählen —</option>
              {mangelStatusOptions.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Mangel-Bemerkungen */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Bemerkungen (optional)</label>
            <Textarea
              placeholder="Weitere Anmerkungen..."
              value={mangelBemerkungen}
              onChange={e => setMangelBemerkungen(e.target.value)}
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Firma-Sektion */}
          <div className="rounded-xl border overflow-hidden">
            <button
              type="button"
              onClick={() => setFirmaOpen(v => !v)}
              className="w-full flex items-center justify-between gap-3 p-4 bg-secondary text-left"
            >
              <div className="flex items-center gap-2">
                <IconBuilding size={17} className="text-muted-foreground" />
                <span className="text-sm font-semibold">Zuständige Firma</span>
              </div>
              {firmaOpen ? <IconChevronUp size={16} className="text-muted-foreground" /> : <IconChevronDown size={16} className="text-muted-foreground" />}
            </button>
            {firmaOpen && (
              <div className="p-4 space-y-3 bg-card">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Firmenname</label>
                  <Input
                    type="text"
                    placeholder="z. B. Muster GmbH"
                    value={firmaName}
                    onChange={e => setFirmaName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      <IconUser size={13} className="inline mr-1" />Vorname
                    </label>
                    <Input
                      type="text"
                      placeholder="Vorname"
                      value={firmaVorname}
                      onChange={e => setFirmaVorname(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nachname</label>
                    <Input
                      type="text"
                      placeholder="Nachname"
                      value={firmaNachname}
                      onChange={e => setFirmaNachname(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    <IconPhone size={13} className="inline mr-1" />Telefon
                  </label>
                  <Input
                    type="tel"
                    placeholder="+49 ..."
                    value={firmaTelefon}
                    onChange={e => setFirmaTelefon(e.target.value)}
                    className="w-full max-w-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {step2Error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {step2Error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="sm:w-auto w-full"
            >
              Zurück
            </Button>
            <Button
              onClick={handleSubmitMangel}
              disabled={step2Submitting || !mangelBeschreibung.trim()}
              className="sm:w-auto w-full"
            >
              {step2Submitting ? 'Wird gespeichert...' : 'Weiter zu Kommunikation'}
            </Button>
          </div>
        </div>
      )}

      {/* ---- STEP 3: Kommunikation anlegen ---- */}
      {step === 3 && selectedBaustelle && (
        <div className="space-y-5">
          {/* Context header */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconHelmet size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Baustelle</p>
              <p className="font-semibold truncate">{selectedBaustelle.fields.name ?? '(Ohne Name)'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-1">Kommunikation dokumentieren</h2>
            <p className="text-sm text-muted-foreground">
              Wurde die Firma bereits kontaktiert? Dokumentiere das Gespräch.
            </p>
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-3 p-4 rounded-xl border bg-card cursor-pointer select-none">
            <div
              onClick={() => setDokumentieren(v => !v)}
              className={`w-10 h-6 rounded-full flex items-center transition-colors shrink-0 ${dokumentieren ? 'bg-primary' : 'bg-muted'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${dokumentieren ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium">Gespräch dokumentieren</span>
          </label>

          {dokumentieren && (
            <div className="space-y-4 rounded-xl border bg-card p-4">
              {/* Kontakt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Vorname</label>
                  <Input
                    type="text"
                    placeholder="Vorname"
                    value={kommVorname}
                    onChange={e => setKommVorname(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nachname</label>
                  <Input
                    type="text"
                    placeholder="Nachname"
                    value={kommNachname}
                    onChange={e => setKommNachname(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Telefon</label>
                  <Input
                    type="tel"
                    placeholder="+49 ..."
                    value={kommTelefon}
                    onChange={e => setKommTelefon(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">E-Mail</label>
                  <Input
                    type="email"
                    placeholder="mail@example.de"
                    value={kommEmail}
                    onChange={e => setKommEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Gesprächsdatum */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Gesprächsdatum</label>
                <Input
                  type="datetime-local"
                  value={gespraechsdatum}
                  onChange={e => setGespraechsdatum(e.target.value)}
                  className="w-full max-w-xs"
                />
              </div>

              {/* Kontaktart pills */}
              <div>
                <label className="block text-sm font-medium mb-2">Kontaktart</label>
                <div className="flex flex-wrap gap-2">
                  {kontaktartOptions.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setKontaktart(opt.key)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                        kontaktart === opt.key
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:border-primary/40 hover:bg-accent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gesprächsnotiz */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Gesprächsnotiz / Vereinbartes</label>
                <Textarea
                  placeholder="Was wurde besprochen, was wurde vereinbart?"
                  value={gespraechsnotiz}
                  onChange={e => setGespraechsnotiz(e.target.value)}
                  rows={4}
                  className="w-full resize-none"
                />
              </div>

              {/* Besonderheiten */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Besonderheiten (optional)</label>
                <Textarea
                  placeholder="Besonderheiten oder Auffälligkeiten..."
                  value={besonderheiten}
                  onChange={e => setBesonderheiten(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>
            </div>
          )}

          {step3Error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {step3Error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {dokumentieren ? (
              <Button
                onClick={handleSubmitKommunikation}
                disabled={step3Submitting}
                className="sm:w-auto w-full"
              >
                {step3Submitting ? 'Wird gespeichert...' : 'Kommunikation speichern & Abschließen'}
              </Button>
            ) : (
              <Button
                onClick={handleSkipKommunikation}
                className="sm:w-auto w-full"
              >
                Überspringen & Abschließen
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ---- STEP 4: Zusammenfassung ---- */}
      {step === 4 && selectedBaustelle && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold mb-1">Mangel erfolgreich gemeldet</h2>
            <p className="text-sm text-muted-foreground">Dein Mangel wurde erfasst und gespeichert.</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baustelle */}
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-card overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <IconHelmet size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Baustelle</p>
                <p className="font-semibold text-sm truncate">{selectedBaustelle.fields.name ?? '(Ohne Name)'}</p>
                {selectedBaustelle.fields.ort && (
                  <p className="text-xs text-muted-foreground">{selectedBaustelle.fields.ort}</p>
                )}
              </div>
            </div>

            {/* Mangel */}
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-card overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                <IconAlertTriangle size={18} className="text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Mangel erfasst</p>
                {mangelTypLabel && (
                  <p className="font-semibold text-sm">{mangelTypLabel}</p>
                )}
                {createdPrioritaet && (
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${getPrioritaetBadgeColor(createdPrioritaet)}`}>
                    {prioritaetLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Firma */}
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-card overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <IconBuilding size={18} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Firma</p>
                <p className="font-semibold text-sm truncate">
                  {createdFirmaName || 'Keine Firma angegeben'}
                </p>
              </div>
            </div>

            {/* Kommunikation */}
            <div className={`flex items-start gap-3 p-4 rounded-xl border overflow-hidden ${kommunikationCreated ? 'bg-green-50 border-green-200' : 'bg-card'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${kommunikationCreated ? 'bg-green-100' : 'bg-muted'}`}>
                {kommunikationCreated
                  ? <IconCheck size={18} className="text-green-600" />
                  : <IconUser size={18} className="text-muted-foreground" />
                }
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Kommunikation</p>
                <p className={`font-semibold text-sm ${kommunikationCreated ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {kommunikationCreated ? 'Dokumentiert' : 'Nicht dokumentiert'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={resetToStep2}
              className="sm:w-auto w-full gap-2"
            >
              <IconPlus size={16} />
              Weiteren Mangel melden
            </Button>
            <Button
              variant="outline"
              onClick={resetFull}
              className="sm:w-auto w-full gap-2"
            >
              <IconRefresh size={16} />
              Neue Baustelle
            </Button>
            <a href="#/" className="sm:w-auto w-full">
              <Button variant="ghost" className="w-full">
                Zurück zum Dashboard
              </Button>
            </a>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
