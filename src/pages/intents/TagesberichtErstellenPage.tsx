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
import { format } from 'date-fns';
import {
  IconBuilding,
  IconClipboardCheck,
  IconCheck,
  IconRefresh,
} from '@tabler/icons-react';

const WIZARD_STEPS = [
  { label: 'Baustelle' },
  { label: 'Checkliste' },
  { label: 'Tagesbericht' },
  { label: 'Zusammenfassung' },
];

const WETTER_OPTIONS = LOOKUP_OPTIONS['tagesberichte']?.['wetterbedingungen'] ?? [];

function getNowFormatted(): string {
  const now = new Date();
  return format(now, "yyyy-MM-dd'T'HH:mm");
}

function getTodayFormatted(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export default function TagesberichtErstellenPage() {
  const [searchParams] = useSearchParams();
  const { baustellen, loading, error, fetchAll } = useDashboardData();

  // Step state — initialize from URL
  const urlStep = parseInt(searchParams.get('step') ?? '1', 10);
  const [step, setStep] = useState<number>(isNaN(urlStep) || urlStep < 1 || urlStep > 4 ? 1 : urlStep);

  // Step 1: selected Baustelle
  const [selectedBaustelle, setSelectedBaustelle] = useState<Baustellen | null>(null);

  // Step 2: Checkliste form state
  const [pruefzeitpunkt, setPruefzeitpunkt] = useState<string>(getNowFormatted());
  const [pruefer, setPruefer] = useState<string>('');
  const [absperrungenKorrekt, setAbsperrungenKorrekt] = useState<boolean>(false);
  const [parkverboteEingerichtet, setParkverboteEingerichtet] = useState<boolean>(false);
  const [anwohnerInformiert, setAnwohnerInformiert] = useState<boolean>(false);
  const [grabengroesseKorrekt, setGrabengroesseKorrekt] = useState<boolean>(false);
  const [checklisteBemerkungen, setChecklisteBemerkungen] = useState<string>('');
  const [checklisteSubmitting, setChecklisteSubmitting] = useState<boolean>(false);
  const [checklisteError, setChecklisteError] = useState<string | null>(null);

  // Track checked count for live feedback
  const checkedCount = [absperrungenKorrekt, parkverboteEingerichtet, anwohnerInformiert, grabengroesseKorrekt].filter(Boolean).length;

  // Step 3: Tagesbericht form state
  const [berichtsdatum, setBerichtsdatum] = useState<string>(getTodayFormatted());
  const [verfasserVorname, setVerfasserVorname] = useState<string>('');
  const [verfasserNachname, setVerfasserNachname] = useState<string>('');
  const [wetterbedingungen, setWetterbedingungen] = useState<string>('');
  const [mitarbeiterAnzahl, setMitarbeiterAnzahl] = useState<number>(1);
  const [durchgefuehrteArbeiten, setDurchgefuehrteArbeiten] = useState<string>('');
  const [besonderheitenTag, setBesonderheitenTag] = useState<string>('');
  const [naechsteSchritte, setNaechsteSchritte] = useState<string>('');
  const [freigabeVorgesetzter, setFreigabeVorgesetzter] = useState<boolean>(false);
  const [freigabeBemerkung, setFreigabeBemerkung] = useState<string>('');
  const [berichtSubmitting, setBerichtSubmitting] = useState<boolean>(false);
  const [berichtError, setBerichtError] = useState<string | null>(null);

  // Summary state
  const [summaryCheckedCount, setSummaryCheckedCount] = useState<number>(0);
  const [summaryBerichtsdatum, setSummaryBerichtsdatum] = useState<string>('');

  // Deep-linking: if baustelleId in URL, auto-select and jump to step 2
  useEffect(() => {
    const baustelleId = searchParams.get('baustelleId');
    if (baustelleId && baustellen.length > 0 && !selectedBaustelle) {
      const found = baustellen.find(b => b.record_id === baustelleId);
      if (found) {
        setSelectedBaustelle(found);
        setStep(2);
      }
    }
  }, [baustellen, searchParams, selectedBaustelle]);

  const handleBaustelleSelect = (id: string) => {
    const found = baustellen.find(b => b.record_id === id) ?? null;
    setSelectedBaustelle(found);
    setStep(2);
  };

  const handleChecklisteSubmit = async () => {
    if (!selectedBaustelle) return;
    if (!pruefer.trim()) {
      setChecklisteError('Bitte gib den Namen des Prüfers an.');
      return;
    }
    setChecklisteSubmitting(true);
    setChecklisteError(null);
    try {
      await LivingAppsService.createVorOrtChecklisteEntry({
        baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, selectedBaustelle.record_id),
        pruefzeitpunkt,
        pruefer: pruefer.trim(),
        absperrungen_korrekt: absperrungenKorrekt,
        parkverbote_eingerichtet: parkverboteEingerichtet,
        anwohner_informiert: anwohnerInformiert,
        grabengroesse_korrekt: grabengroesseKorrekt,
        bemerkungen: checklisteBemerkungen.trim() || undefined,
      });
      setSummaryCheckedCount(checkedCount);
      await fetchAll();
      setStep(3);
    } catch (err) {
      setChecklisteError(err instanceof Error ? err.message : 'Fehler beim Speichern der Checkliste.');
    } finally {
      setChecklisteSubmitting(false);
    }
  };

  const handleBerichtSubmit = async () => {
    if (!selectedBaustelle) return;
    if (!durchgefuehrteArbeiten.trim()) {
      setBerichtError('Bitte beschreibe die durchgeführten Arbeiten.');
      return;
    }
    setBerichtSubmitting(true);
    setBerichtError(null);
    try {
      await LivingAppsService.createTagesberichteEntry({
        baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, selectedBaustelle.record_id),
        berichtsdatum,
        verfasser_vorname: verfasserVorname.trim() || undefined,
        verfasser_nachname: verfasserNachname.trim() || undefined,
        wetterbedingungen: wetterbedingungen || undefined,
        mitarbeiter_anzahl: mitarbeiterAnzahl,
        durchgefuehrte_arbeiten: durchgefuehrteArbeiten.trim(),
        besonderheiten_tag: besonderheitenTag.trim() || undefined,
        naechste_schritte: naechsteSchritte.trim() || undefined,
        freigabe_vorgesetzter: freigabeVorgesetzter,
        freigabe_bemerkung: freigabeVorgesetzter && freigabeBemerkung.trim() ? freigabeBemerkung.trim() : undefined,
      });
      setSummaryBerichtsdatum(berichtsdatum);
      await fetchAll();
      setStep(4);
    } catch (err) {
      setBerichtError(err instanceof Error ? err.message : 'Fehler beim Speichern des Tagesberichts.');
    } finally {
      setBerichtSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedBaustelle(null);
    setPruefzeitpunkt(getNowFormatted());
    setPruefer('');
    setAbsperrungenKorrekt(false);
    setParkverboteEingerichtet(false);
    setAnwohnerInformiert(false);
    setGrabengroesseKorrekt(false);
    setChecklisteBemerkungen('');
    setChecklisteError(null);
    setBerichtsdatum(getTodayFormatted());
    setVerfasserVorname('');
    setVerfasserNachname('');
    setWetterbedingungen('');
    setMitarbeiterAnzahl(1);
    setDurchgefuehrteArbeiten('');
    setBesonderheitenTag('');
    setNaechsteSchritte('');
    setFreigabeVorgesetzter(false);
    setFreigabeBemerkung('');
    setBerichtError(null);
    setSummaryCheckedCount(0);
    setSummaryBerichtsdatum('');
    setStep(1);
  };

  return (
    <IntentWizardShell
      title="Tagesbericht erstellen"
      subtitle="Vor-Ort-Checkliste ausfüllen und Tagesbericht erfassen"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      loading={loading}
      error={error}
      onRetry={fetchAll}
    >
      {/* Step 1: Baustelle auswählen */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Baustelle auswählen</h2>
            <p className="text-sm text-muted-foreground mt-1">Wähle die Baustelle aus, für die du heute einen Bericht erstellen möchtest.</p>
          </div>
          <EntitySelectStep
            items={baustellen.map(b => ({
              id: b.record_id,
              title: b.fields.name ?? '(Ohne Name)',
              subtitle: [b.fields.status?.label, b.fields.ort].filter(Boolean).join(' · '),
              status: b.fields.status ? { key: b.fields.status.key, label: b.fields.status.label } : undefined,
              stats: b.fields.startdatum ? [{ label: 'Start', value: b.fields.startdatum }] : [],
              icon: <IconBuilding size={20} className="text-primary" />,
            }))}
            onSelect={handleBaustelleSelect}
            searchPlaceholder="Baustelle suchen..."
            emptyIcon={<IconBuilding size={32} />}
            emptyText="Keine Baustellen gefunden."
          />
        </div>
      )}

      {/* Step 2: Vor-Ort-Checkliste */}
      {step === 2 && selectedBaustelle && (
        <div className="space-y-6">
          {/* Context header */}
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconBuilding size={20} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Baustelle</p>
              <p className="font-semibold text-foreground truncate">{selectedBaustelle.fields.name ?? '(Ohne Name)'}</p>
              {selectedBaustelle.fields.status && (
                <StatusBadge statusKey={selectedBaustelle.fields.status.key} label={selectedBaustelle.fields.status.label} />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Vor-Ort-Checkliste</h2>
            <p className="text-sm text-muted-foreground mt-1">Überprüfe die Situation vor Ort und halte das Ergebnis fest.</p>
          </div>

          <div className="space-y-4">
            {/* Pruefzeitpunkt */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Prüfzeitpunkt</label>
              <Input
                type="datetime-local"
                value={pruefzeitpunkt}
                onChange={e => setPruefzeitpunkt(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Pruefer */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Prüfer <span className="text-destructive">*</span></label>
              <Input
                type="text"
                placeholder="Name des Prüfers"
                value={pruefer}
                onChange={e => setPruefer(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Boolean checkboxes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prüfpunkte</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Absperrungen korrekt', value: absperrungenKorrekt, onChange: setAbsperrungenKorrekt },
                  { label: 'Parkverbote eingerichtet', value: parkverboteEingerichtet, onChange: setParkverboteEingerichtet },
                  { label: 'Anwohner informiert', value: anwohnerInformiert, onChange: setAnwohnerInformiert },
                  { label: 'Grabengröße korrekt', value: grabengroesseKorrekt, onChange: setGrabengroesseKorrekt },
                ].map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.onChange(!item.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      item.value
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-card border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                      item.value ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}>
                      {item.value && <IconCheck size={12} stroke={3} className="text-primary-foreground" />}
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live feedback card */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              checkedCount === 4
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                : checkedCount >= 2
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
                : 'bg-muted border-border'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                checkedCount === 4 ? 'bg-green-100 dark:bg-green-900/40' : 'bg-muted'
              }`}>
                <IconClipboardCheck size={18} className={checkedCount === 4 ? 'text-green-600' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Checkliste-Status</p>
                <p className={`text-sm font-semibold ${
                  checkedCount === 4
                    ? 'text-green-700 dark:text-green-400'
                    : checkedCount >= 2
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-foreground'
                }`}>
                  {checkedCount} / 4 Punkte OK
                </p>
              </div>
            </div>

            {/* Bemerkungen */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Bemerkungen <span className="text-muted-foreground">(optional)</span></label>
              <textarea
                placeholder="Weitere Beobachtungen oder Hinweise..."
                value={checklisteBemerkungen}
                onChange={e => setChecklisteBemerkungen(e.target.value)}
                rows={3}
                className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {checklisteError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{checklisteError}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="sm:w-auto"
              >
                Zurück
              </Button>
              <Button
                onClick={handleChecklisteSubmit}
                disabled={checklisteSubmitting}
                className="flex-1 sm:flex-none"
              >
                {checklisteSubmitting ? 'Wird gespeichert...' : 'Checkliste speichern & weiter'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Tagesbericht erfassen */}
      {step === 3 && selectedBaustelle && (
        <div className="space-y-6">
          {/* Context header */}
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <IconBuilding size={20} className="text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Baustelle</p>
              <p className="font-semibold text-foreground truncate">{selectedBaustelle.fields.name ?? '(Ohne Name)'}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Tagesbericht erfassen</h2>
            <p className="text-sm text-muted-foreground mt-1">Dokumentiere die heutigen Arbeiten und Ereignisse auf der Baustelle.</p>
          </div>

          <div className="space-y-4">
            {/* Berichtsdatum */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Berichtsdatum</label>
              <Input
                type="date"
                value={berichtsdatum}
                onChange={e => setBerichtsdatum(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Verfasser */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Verfasser</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="text"
                  placeholder="Vorname"
                  value={verfasserVorname}
                  onChange={e => setVerfasserVorname(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Nachname"
                  value={verfasserNachname}
                  onChange={e => setVerfasserNachname(e.target.value)}
                />
              </div>
            </div>

            {/* Wetterbedingungen tile selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Wetterbedingungen</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WETTER_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setWetterbedingungen(wetterbedingungen === opt.key ? '' : opt.key)}
                    className={`p-3 rounded-xl border text-sm font-medium text-center transition-colors ${
                      wetterbedingungen === opt.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mitarbeiter Anzahl */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Anzahl Mitarbeiter</label>
              <Input
                type="number"
                min={0}
                value={mitarbeiterAnzahl}
                onChange={e => setMitarbeiterAnzahl(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full max-w-xs"
              />
            </div>

            {/* Durchgeführte Arbeiten */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Durchgeführte Arbeiten <span className="text-destructive">*</span></label>
              <textarea
                placeholder="Beschreibe die heute ausgeführten Arbeiten..."
                value={durchgefuehrteArbeiten}
                onChange={e => setDurchgefuehrteArbeiten(e.target.value)}
                rows={4}
                className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Besonderheiten */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Besonderheiten des Tages <span className="text-muted-foreground">(optional)</span></label>
              <textarea
                placeholder="Besondere Vorkommnisse, Probleme oder Hinweise..."
                value={besonderheitenTag}
                onChange={e => setBesonderheitenTag(e.target.value)}
                rows={3}
                className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Nächste Schritte */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nächste Schritte <span className="text-muted-foreground">(optional)</span></label>
              <textarea
                placeholder="Was ist als nächstes geplant?"
                value={naechsteSchritte}
                onChange={e => setNaechsteSchritte(e.target.value)}
                rows={3}
                className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            {/* Freigabe */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFreigabeVorgesetzter(!freigabeVorgesetzter)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left w-full transition-colors ${
                  freigabeVorgesetzter
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'bg-card border-border text-foreground hover:bg-accent'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                  freigabeVorgesetzter ? 'bg-primary border-primary' : 'border-muted-foreground'
                }`}>
                  {freigabeVorgesetzter && <IconCheck size={12} stroke={3} className="text-primary-foreground" />}
                </div>
                <span className="text-sm font-medium">Freigabe durch Vorgesetzten erteilt</span>
              </button>

              {freigabeVorgesetzter && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Freigabe-Bemerkung <span className="text-muted-foreground">(optional)</span></label>
                  <textarea
                    placeholder="Bemerkung zur Freigabe..."
                    value={freigabeBemerkung}
                    onChange={e => setFreigabeBemerkung(e.target.value)}
                    rows={2}
                    className="w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>
              )}
            </div>

            {berichtError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{berichtError}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="sm:w-auto"
              >
                Zurück
              </Button>
              <Button
                onClick={handleBerichtSubmit}
                disabled={berichtSubmitting}
                className="flex-1 sm:flex-none"
              >
                {berichtSubmitting ? 'Wird gespeichert...' : 'Bericht speichern'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Zusammenfassung */}
      {step === 4 && selectedBaustelle && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Fertig!</h2>
            <p className="text-sm text-muted-foreground mt-1">Checkliste und Tagesbericht wurden erfolgreich gespeichert.</p>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
            <div className="p-5 border-b bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconBuilding size={20} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Baustelle</p>
                  <p className="font-semibold text-foreground truncate">{selectedBaustelle.fields.name ?? '(Ohne Name)'}</p>
                  {selectedBaustelle.fields.ort && (
                    <p className="text-xs text-muted-foreground">{selectedBaustelle.fields.ort}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="divide-y">
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <IconClipboardCheck size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Vor-Ort-Checkliste</p>
                  <p className="text-xs text-muted-foreground">{summaryCheckedCount} / 4 Punkte OK</p>
                </div>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0">Erstellt</span>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <IconCheck size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Tagesbericht</p>
                  <p className="text-xs text-muted-foreground">Datum: {summaryBerichtsdatum}</p>
                </div>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 shrink-0">Erstellt</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <IconRefresh size={16} />
              Neuen Bericht erstellen
            </Button>
            <a href="#/" className="flex-1 sm:flex-none">
              <Button variant="default" className="w-full">
                Zurück zum Dashboard
              </Button>
            </a>
          </div>
        </div>
      )}
    </IntentWizardShell>
  );
}
