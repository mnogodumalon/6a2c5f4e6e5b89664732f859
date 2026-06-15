import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichVeVerwaltung, enrichFotodokumentation, enrichKommunikation, enrichTagesberichte, enrichVorOrtCheckliste, enrichLeitungsauskunft, enrichMaengelerfassung } from '@/lib/enrich';
import type { Baustellen } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { lookupKey } from '@/lib/formatters';
import { useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconAlertCircle,
  IconTool,
  IconRefresh,
  IconCheck,
  IconBuildingWarehouse,
  IconAlertTriangle,
  IconCamera,
  IconPhone,
  IconClipboardList,
  IconFileText,
  IconBolt,
  IconBug,
  IconPlus,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatCard, StatCardRow } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget, KanbanSkeleton, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import {
  RecordOverlay,
  RecordHeader,
  RecordKeyFacts,
  RecordSection,
  RecordField,
  RecordAttachments,
  useRecordOverlayStack,
} from '@/components/widgets/RecordView';
import { SatelliteSection } from '@/components/SatelliteSection';
import { useClock, gruss, namen, ENTRANCE, entranceDelay, undoToast } from '@/lib/polish';
import { BaustellenDialog } from '@/components/dialogs/BaustellenDialog';
import { VeVerwaltungDialog } from '@/components/dialogs/VeVerwaltungDialog';
import { FotodokumentationDialog } from '@/components/dialogs/FotodokumentationDialog';
import { KommunikationDialog } from '@/components/dialogs/KommunikationDialog';
import { TagesberichteDialog } from '@/components/dialogs/TagesberichteDialog';
import { VorOrtChecklisteDialog } from '@/components/dialogs/VorOrtChecklisteDialog';
import { LeitungsauskunftDialog } from '@/components/dialogs/LeitungsauskunftDialog';
import { MaengelerfassungDialog } from '@/components/dialogs/MaengelerfassungDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';

const CARD_PREFIX = 'baustelle';
function baustelleIdOf(card: KanbanCard): string {
  return card.id.split(':')[1] ?? '';
}

const BAUSTELLEN_COLUMNS: KanbanColumn[] = (LOOKUP_OPTIONS['baustellen']?.['status'] ?? []).map(o => ({
  key: o.key,
  label: o.label,
}));

function toneForStatus(status: string | undefined): KanbanTone {
  if (status === 'abgeschlossen') return 'success';
  if (status === 'in_arbeit') return 'primary';
  return 'warning'; // geplant
}

type OverlayItem =
  | { type: 'baustelle'; record: Baustellen }
  | { type: 've_verwaltung'; id: string }
  | { type: 'fotodokumentation'; id: string }
  | { type: 'kommunikation'; id: string }
  | { type: 'tagesberichte'; id: string }
  | { type: 'vor_ort_checkliste'; id: string }
  | { type: 'leitungsauskunft'; id: string }
  | { type: 'maengelerfassung'; id: string };

export default function DashboardOverview() {
  const {
    veVerwaltung, fotodokumentation, kommunikation, tagesberichte, baustellen, vorOrtCheckliste, leitungsauskunft, maengelerfassung,
    baustellenMap,
    loading, error, fetchAll,
    setMaengelerfassung,
  } = useDashboardData();

  const clock = useClock();

  const enrichedVeVerwaltung = enrichVeVerwaltung(veVerwaltung, { baustellenMap });
  const enrichedFotodokumentation = enrichFotodokumentation(fotodokumentation, { baustellenMap });
  const enrichedKommunikation = enrichKommunikation(kommunikation, { baustellenMap });
  const enrichedTagesberichte = enrichTagesberichte(tagesberichte, { baustellenMap });
  const enrichedVorOrtCheckliste = enrichVorOrtCheckliste(vorOrtCheckliste, { baustellenMap });
  const enrichedLeitungsauskunft = enrichLeitungsauskunft(leitungsauskunft, { baustellenMap });
  const enrichedMaengelerfassung = enrichMaengelerfassung(maengelerfassung, { baustellenMap });

  // Dialog state
  const [baustellenDialogOpen, setBaustellenDialogOpen] = useState(false);
  const [baustellenDialogStatus, setBaustellenDialogStatus] = useState<string | undefined>(undefined);

  const [veDialog, setVeDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });
  const [fotoDialog, setFotoDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });
  const [kommDialog, setKommDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });
  const [tagesDialog, setTagesDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });
  const [checkDialog, setCheckDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });
  const [leitDialog, setLeitDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });
  const [mangelDialog, setMangelDialog] = useState<{ open: boolean; baustelleId?: string }>({ open: false });

  // Overlay
  const overlay = useRecordOverlayStack<OverlayItem>();

  // Computed
  const aktiveStellen = useMemo(() =>
    baustellen.filter(b => lookupKey(b.fields.status) === 'in_arbeit'), [baustellen]);

  const kritischeMaengel = useMemo(() =>
    enrichedMaengelerfassung.filter(m => {
      const prio = lookupKey(m.fields.prioritaet);
      const status = lookupKey(m.fields.mangel_status);
      return (prio === 'kritisch' || prio === 'hoch') && status !== 'behoben';
    }), [enrichedMaengelerfassung]);

  const unfreigegebeneBerichte = useMemo(() =>
    enrichedTagesberichte.filter(t => !t.fields.freigabe_vorgesetzter)
      .sort((a, b) => (b.fields.berichtsdatum ?? '').localeCompare(a.fields.berichtsdatum ?? '')),
    [enrichedTagesberichte]);

  const offeneMaengel = useMemo(() =>
    enrichedMaengelerfassung.filter(m => lookupKey(m.fields.mangel_status) !== 'behoben')
      .sort((a, b) => {
        const prioOrder: Record<string, number> = { kritisch: 0, hoch: 1, mittel: 2, niedrig: 3 };
        return (prioOrder[lookupKey(a.fields.prioritaet) ?? ''] ?? 9) - (prioOrder[lookupKey(b.fields.prioritaet) ?? ''] ?? 9);
      }),
    [enrichedMaengelerfassung]);

  // Context line
  const contextLine = useMemo(() => {
    const aktiveNamen = aktiveStellen.map(b => b.fields.name ?? '').filter(Boolean);
    if (baustellen.length === 0) return 'Noch keine Baustellen erfasst.';
    if (aktiveStellen.length === 0) return `${baustellen.length} Baustelle${baustellen.length !== 1 ? 'n' : ''} — aktuell keine in Arbeit.`;
    return `Aktiv: ${namen(aktiveNamen, 2)} — ${kritischeMaengel.length > 0 ? `${kritischeMaengel.length} kritische${kritischeMaengel.length !== 1 ? ' Mängel' : 'r Mangel'} offen` : 'keine kritischen Mängel'}.`;
  }, [baustellen, aktiveStellen, kritischeMaengel]);

  // Kanban cards
  const kanbanCards = useMemo<KanbanCard[]>(() =>
    baustellen.map(b => {
      const status = lookupKey(b.fields.status) ?? BAUSTELLEN_COLUMNS[0]?.key ?? '';
      const mangelAnz = enrichedMaengelerfassung.filter(m => {
        const bId = extractRecordId(m.fields.baustelle);
        return bId === b.record_id && lookupKey(m.fields.mangel_status) !== 'behoben';
      }).length;
      return {
        id: `${CARD_PREFIX}:${b.record_id}`,
        column: status,
        title: b.fields.name ?? 'Unbenannte Baustelle',
        subtitle: [
          b.fields.ort ?? b.fields.plz,
          mangelAnz > 0 ? `${mangelAnz} Mangel${mangelAnz !== 1 ? 'meldungen' : ''}` : undefined,
        ].filter(Boolean).join(' · '),
        tone: toneForStatus(status),
      };
    }),
    [baustellen, enrichedMaengelerfassung]);

  // Status advance for Mängel (open → in_bearbeitung → behoben)
  const advanceMangel = useCallback(async (id: string, currentStatus: string | undefined) => {
    const next = currentStatus === 'offen' ? 'in_bearbeitung' : currentStatus === 'in_bearbeitung' ? 'behoben' : null;
    if (!next) return;
    const prev = currentStatus;
    setMaengelerfassung(ms => ms.map(m => m.record_id === id
      ? { ...m, fields: { ...m.fields, mangel_status: { key: next, label: next === 'in_bearbeitung' ? 'In Bearbeitung' : 'Behoben' } } }
      : m));
    undoToast(`Mangel als "${next === 'in_bearbeitung' ? 'In Bearbeitung' : 'Behoben'}" markiert`, async () => {
      setMaengelerfassung(ms => ms.map(m => m.record_id === id
        ? { ...m, fields: { ...m.fields, mangel_status: prev ? { key: prev, label: prev } : undefined } }
        : m));
      await LivingAppsService.updateMaengelerfassungEntry(id, { mangel_status: prev ?? '' }).catch(() => fetchAll());
    });
    await LivingAppsService.updateMaengelerfassungEntry(id, { mangel_status: next }).catch(() => fetchAll());
  }, [setMaengelerfassung, fetchAll]);

  // Freigabe for Tagesbericht
  const freigabeBericht = useCallback(async (id: string) => {
    undoToast('Tagesbericht freigegeben');
    await LivingAppsService.updateTagesberichteEntry(id, { freigabe_vorgesetzter: true }).catch(() => fetchAll());
    fetchAll();
  }, [fetchAll]);

  // Kanban card move (Baustellen status change)
  const handleCardMove = useCallback(async (cardId: string, newColumn: string) => {
    const id = cardId.split(':')[1] ?? '';
    const b = baustellen.find(x => x.record_id === id);
    if (!b) return;
    const prevStatus = lookupKey(b.fields.status) ?? '';
    // Optimistic update not possible without setBaustellen — rely on fetchAll after patch
    undoToast(`Baustelle auf "${BAUSTELLEN_COLUMNS.find(c => c.key === newColumn)?.label ?? newColumn}" gesetzt`, async () => {
      await LivingAppsService.updateBaustellenEntry(id, { status: prevStatus }).catch(() => fetchAll());
      fetchAll();
    });
    await LivingAppsService.updateBaustellenEntry(id, { status: newColumn }).catch(() => fetchAll());
    fetchAll();
  }, [baustellen, fetchAll]);

  // Satellite helpers
  const veVonBaustelle = (baustelleId: string) =>
    enrichedVeVerwaltung.filter(v => extractRecordId(v.fields.baustelle) === baustelleId);
  const fotoVonBaustelle = (baustelleId: string) =>
    enrichedFotodokumentation.filter(f => extractRecordId(f.fields.baustelle) === baustelleId);
  const kommVonBaustelle = (baustelleId: string) =>
    enrichedKommunikation.filter(k => extractRecordId(k.fields.baustelle) === baustelleId);
  const tagesVonBaustelle = (baustelleId: string) =>
    enrichedTagesberichte.filter(t => extractRecordId(t.fields.baustelle) === baustelleId);
  const checkVonBaustelle = (baustelleId: string) =>
    enrichedVorOrtCheckliste.filter(c => extractRecordId(c.fields.baustelle) === baustelleId);
  const leitVonBaustelle = (baustelleId: string) =>
    enrichedLeitungsauskunft.filter(l => extractRecordId(l.fields.baustelle) === baustelleId);
  const mangelVonBaustelle = (baustelleId: string) =>
    enrichedMaengelerfassung.filter(m => extractRecordId(m.fields.baustelle) === baustelleId);

  // Overlay content for a Baustelle
  const currentOverlay = overlay.top;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const topKritisch = kritischeMaengel[0];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className={`flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between ${ENTRANCE}`} style={entranceDelay(0)}>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{gruss(clock)} BaustellenManager</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{contextLine}</p>
        </div>
        <Button
          size="sm"
          className="shrink-0 mt-1 sm:mt-0"
          onClick={() => { setBaustellenDialogStatus(undefined); setBaustellenDialogOpen(true); }}
        >
          <IconPlus size={16} className="mr-1 shrink-0" />
          Neue Baustelle
        </Button>
      </div>

      <DashboardGrid
        hero={topKritisch && (
          <HeroBanner
            tone="destructive"
            icon={<IconAlertTriangle size={18} />}
            action={{
              label: 'Als "In Bearbeitung" markieren',
              onClick: () => advanceMangel(topKritisch.record_id, lookupKey(topKritisch.fields.mangel_status)),
            }}
          >
            <b>{kritischeMaengel.length} kritische{kritischeMaengel.length !== 1 ? ' Mängel' : 'r Mangel'}</b> offen —{' '}
            {topKritisch.baustelleName ? <><b>{topKritisch.baustelleName}</b>: </> : ''}
            {topKritisch.fields.mangeltyp?.label ?? 'Unbekannter Mangeltyp'}
            {topKritisch.fields.mangel_beschreibung ? ` · ${topKritisch.fields.mangel_beschreibung.slice(0, 80)}` : ''}.
          </HeroBanner>
        )}
        kpis={
          <StatCardRow>
            <StatCard
              title="Aktive Baustellen"
              value={aktiveStellen.length}
              description={aktiveStellen.length > 0 ? namen(aktiveStellen.map(b => b.fields.name ?? ''), 2) : 'Keine in Arbeit'}
              icon={<IconBuildingWarehouse size={18} className="text-muted-foreground" />}
              tone={aktiveStellen.length > 0 ? 'primary' : 'default'}
            />
            <StatCard
              title="Offene Mängel"
              value={offeneMaengel.length}
              description={offeneMaengel.length > 0 ? `${kritischeMaengel.length} kritisch/hoch` : 'Alles in Ordnung'}
              icon={<IconBug size={18} className="text-muted-foreground" />}
              tone={kritischeMaengel.length > 0 ? 'destructive' : offeneMaengel.length > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Berichte ausstehend"
              value={unfreigegebeneBerichte.length}
              description={unfreigegebeneBerichte.length > 0 ? 'Freigabe erforderlich' : 'Alle freigegeben'}
              icon={<IconClipboardList size={18} className="text-muted-foreground" />}
              tone={unfreigegebeneBerichte.length > 0 ? 'warning' : 'default'}
            />
          </StatCardRow>
        }
        aside={
          <>
            <WorkList
              title="Offene Mängel"
              icon={<IconBug size={14} />}
              items={offeneMaengel.map(m => ({
                id: m.record_id,
                title: m.fields.mangeltyp?.label ?? 'Mangel',
                secondLine: (
                  <>
                    <span className={
                      lookupKey(m.fields.prioritaet) === 'kritisch' ? 'font-medium text-destructive' :
                      lookupKey(m.fields.prioritaet) === 'hoch' ? 'font-medium text-amber-600' :
                      'text-muted-foreground'
                    }>
                      {m.fields.prioritaet?.label ?? ''}
                    </span>
                    {m.baustelleName ? <span className="text-muted-foreground"> · {m.baustelleName}</span> : null}
                  </>
                ),
                action: lookupKey(m.fields.mangel_status) !== 'behoben' ? {
                  label: lookupKey(m.fields.mangel_status) === 'offen' ? '→ Bearbeitung' : '✓ Behoben',
                  onClick: () => advanceMangel(m.record_id, lookupKey(m.fields.mangel_status)),
                } : undefined,
              }))}
              onItemClick={id => {
                const m = maengelerfassung.find(x => x.record_id === id);
                if (m) overlay.push({ type: 'maengelerfassung', id });
              }}
              empty={{
                text: 'Keine offenen Mängel — alle Baustellen in Ordnung.',
                action: {
                  label: <><IconPlus size={14} className="shrink-0" /> Mangel melden</>,
                  onClick: () => setMangelDialog({ open: true }),
                },
              }}
              max={6}
            />
            <WorkList
              title="Berichte ohne Freigabe"
              icon={<IconFileText size={14} />}
              items={unfreigegebeneBerichte.map(t => ({
                id: t.record_id,
                title: [t.fields.verfasser_vorname, t.fields.verfasser_nachname].filter(Boolean).join(' ') || 'Unbekannt',
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">Ausstehend</span>
                    {t.fields.berichtsdatum ? <span className="text-muted-foreground"> · {formatDate(t.fields.berichtsdatum)}</span> : null}
                    {t.baustelleName ? <span className="text-muted-foreground"> · {t.baustelleName}</span> : null}
                  </>
                ),
                action: {
                  label: '✓ Freigeben',
                  onClick: () => freigabeBericht(t.record_id),
                },
              }))}
              onItemClick={id => overlay.push({ type: 'tagesberichte', id })}
              empty={{
                text: 'Alle Tagesberichte sind freigegeben.',
                action: {
                  label: <><IconPlus size={14} className="shrink-0" /> Tagesbericht</>,
                  onClick: () => setTagesDialog({ open: true }),
                },
              }}
              max={5}
            />
          </>
        }
        primary={
          <KanbanWidget
            columns={BAUSTELLEN_COLUMNS}
            cards={kanbanCards}
            defaultCollapsed={['abgeschlossen']}
            onCardClick={card => {
              const b = baustellen.find(x => x.record_id === baustelleIdOf(card));
              if (b) overlay.push({ type: 'baustelle', record: b });
            }}
            onCardMove={handleCardMove}
            onAddCard={col => {
              setBaustellenDialogStatus(col);
              setBaustellenDialogOpen(true);
            }}
          />
        }
      />

      {/* Baustelle Hub Overlay */}
      {currentOverlay?.type === 'baustelle' && (() => {
        const b = currentOverlay.record;
        const bid = b.record_id;
        const ve = veVonBaustelle(bid);
        const fotos = fotoVonBaustelle(bid);
        const komm = kommVonBaustelle(bid);
        const tages = tagesVonBaustelle(bid);
        const checks = checkVonBaustelle(bid);
        const leit = leitVonBaustelle(bid);
        const maengel = mangelVonBaustelle(bid);
        return (
          <RecordOverlay
            open={overlay.open}
            onClose={overlay.close}
            onBack={overlay.canGoBack ? overlay.pop : undefined}
            size="lg"
            onEdit={() => {/* editing via CRUD page */ }}
          >
            <RecordHeader
              title={b.fields.name ?? 'Baustelle'}
              subtitle={[b.fields.strasse, b.fields.hausnummer, b.fields.ort].filter(Boolean).join(' ')}
              badges={
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  lookupKey(b.fields.status) === 'in_arbeit' ? 'bg-primary/10 text-primary' :
                  lookupKey(b.fields.status) === 'abgeschlossen' ? 'bg-green-500/10 text-green-700' :
                  'bg-amber-500/10 text-amber-700'
                }`}>{b.fields.status?.label ?? 'Kein Status'}</span>
              }
            />
            <RecordKeyFacts items={[
              { label: 'Auftraggeber', value: b.fields.auftraggeber },
              { label: 'Zuständig', value: b.fields.zustaendige_person },
              { label: 'Start', value: formatDate(b.fields.startdatum) },
              { label: 'Geplantes Ende', value: formatDate(b.fields.enddatum) },
            ].filter(i => i.value)} />

            <SatelliteSection
              title="Mängel"
              icon={IconBug}
              items={maengel}
              getKey={m => m.record_id}
              map={m => ({
                label: m.fields.prioritaet?.label,
                name: m.fields.mangeltyp?.label ?? 'Mangel',
                meta: m.fields.mangel_beschreibung?.slice(0, 60),
                icon: IconAlertTriangle,
              })}
              onOpen={m => overlay.push({ type: 'maengelerfassung', id: m.record_id })}
              onAdd={() => setMangelDialog({ open: true, baustelleId: bid })}
            />

            <SatelliteSection
              title="Tagesberichte"
              icon={IconFileText}
              items={tages}
              getKey={t => t.record_id}
              map={t => ({
                label: t.fields.berichtsdatum ? formatDate(t.fields.berichtsdatum) : undefined,
                name: [t.fields.verfasser_vorname, t.fields.verfasser_nachname].filter(Boolean).join(' ') || 'Bericht',
                meta: t.fields.freigabe_vorgesetzter ? 'Freigegeben' : 'Ausstehend',
                icon: IconClipboardList,
              })}
              onOpen={t => overlay.push({ type: 'tagesberichte', id: t.record_id })}
              onAdd={() => setTagesDialog({ open: true, baustelleId: bid })}
            />

            <SatelliteSection
              title="VE-Verwaltung"
              icon={IconFileText}
              items={ve}
              getKey={v => v.record_id}
              map={v => ({
                label: v.fields.ve_status?.label,
                name: v.fields.ve_nummer ?? 'VE',
                meta: v.fields.ablaufdatum ? `Ablauf: ${formatDate(v.fields.ablaufdatum)}` : undefined,
              })}
              onOpen={v => overlay.push({ type: 've_verwaltung', id: v.record_id })}
              onAdd={() => setVeDialog({ open: true, baustelleId: bid })}
            />

            <SatelliteSection
              title="Fotodokumentation"
              icon={IconCamera}
              items={fotos}
              getKey={f => f.record_id}
              map={f => ({
                label: f.fields.fotokategorie?.label,
                name: f.fields.foto_beschreibung ?? 'Foto',
                meta: f.fields.aufnahmedatum ? formatDate(f.fields.aufnahmedatum) : undefined,
                icon: IconCamera,
              })}
              onOpen={f => overlay.push({ type: 'fotodokumentation', id: f.record_id })}
              onAdd={() => setFotoDialog({ open: true, baustelleId: bid })}
            />

            <SatelliteSection
              title="Kommunikation"
              icon={IconPhone}
              items={komm}
              getKey={k => k.record_id}
              map={k => ({
                label: k.fields.kontaktart?.label,
                name: [k.fields.kontakt_vorname, k.fields.kontakt_nachname].filter(Boolean).join(' ') || 'Kontakt',
                meta: k.fields.gespraechsdatum ? formatDate(k.fields.gespraechsdatum) : undefined,
                icon: IconPhone,
              })}
              onOpen={k => overlay.push({ type: 'kommunikation', id: k.record_id })}
              onAdd={() => setKommDialog({ open: true, baustelleId: bid })}
            />

            <SatelliteSection
              title="Vor-Ort-Checkliste"
              icon={IconClipboardList}
              items={checks}
              getKey={c => c.record_id}
              map={c => ({
                label: c.fields.pruefer,
                name: c.fields.pruefzeitpunkt ? formatDate(c.fields.pruefzeitpunkt) : 'Prüfung',
                meta: [
                  c.fields.absperrungen_korrekt === false ? 'Absperrung ✗' : null,
                  c.fields.parkverbote_eingerichtet === false ? 'Parkverbot ✗' : null,
                ].filter(Boolean).join(' · ') || undefined,
              })}
              onOpen={c => overlay.push({ type: 'vor_ort_checkliste', id: c.record_id })}
              onAdd={() => setCheckDialog({ open: true, baustelleId: bid })}
            />

            <SatelliteSection
              title="Leitungsauskunft"
              icon={IconBolt}
              items={leit}
              getKey={l => l.record_id}
              map={l => ({
                label: l.fields.hausanschluss_typ?.label,
                name: l.fields.hausanschluss_info?.slice(0, 60) ?? 'Leitung',
                meta: l.fields.muffentyp,
                icon: IconBolt,
              })}
              onOpen={l => overlay.push({ type: 'leitungsauskunft', id: l.record_id })}
              onAdd={() => setLeitDialog({ open: true, baustelleId: bid })}
            />

            <RecordSection title="Notizen">
              <RecordField label="Notizen" value={b.fields.notizen} format="longtext" />
            </RecordSection>

            <RecordAttachments appId={APP_IDS.BAUSTELLEN} recordId={bid} />
          </RecordOverlay>
        );
      })()}

      {/* Satellite detail overlays */}
      {currentOverlay?.type === 'maengelerfassung' && (() => {
        const m = enrichedMaengelerfassung.find(x => x.record_id === currentOverlay.id);
        if (!m) return null;
        return (
          <RecordOverlay
            open={overlay.open}
            onClose={overlay.close}
            onBack={overlay.canGoBack ? overlay.pop : undefined}
            footer={lookupKey(m.fields.mangel_status) !== 'behoben' ? (
              <Button size="sm" onClick={() => advanceMangel(m.record_id, lookupKey(m.fields.mangel_status))}>
                {lookupKey(m.fields.mangel_status) === 'offen' ? '→ In Bearbeitung' : '✓ Als behoben markieren'}
              </Button>
            ) : undefined}
          >
            <RecordHeader
              title={m.fields.mangeltyp?.label ?? 'Mangel'}
              subtitle={m.baustelleName}
              badges={
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  lookupKey(m.fields.mangel_status) === 'behoben' ? 'bg-green-500/10 text-green-700' :
                  lookupKey(m.fields.mangel_status) === 'in_bearbeitung' ? 'bg-primary/10 text-primary' :
                  'bg-destructive/10 text-destructive'
                }`}>{m.fields.mangel_status?.label ?? 'Offen'}</span>
              }
            />
            <RecordKeyFacts items={[
              { label: 'Priorität', value: m.fields.prioritaet?.label },
              { label: 'Meldedatum', value: formatDate(m.fields.meldedatum) },
              { label: 'Verantwortliche Firma', value: m.fields.firma_name },
            ].filter(i => i.value)} />
            <RecordSection>
              <RecordField label="Beschreibung" value={m.fields.mangel_beschreibung} format="longtext" />
              <RecordField label="Weitere Bemerkungen" value={m.fields.mangel_bemerkungen} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.MAENGELERFASSUNG} recordId={m.record_id} />
          </RecordOverlay>
        );
      })()}

      {currentOverlay?.type === 'tagesberichte' && (() => {
        const t = enrichedTagesberichte.find(x => x.record_id === currentOverlay.id);
        if (!t) return null;
        return (
          <RecordOverlay
            open={overlay.open}
            onClose={overlay.close}
            onBack={overlay.canGoBack ? overlay.pop : undefined}
            footer={!t.fields.freigabe_vorgesetzter ? (
              <Button size="sm" onClick={() => freigabeBericht(t.record_id)}>✓ Freigeben</Button>
            ) : undefined}
          >
            <RecordHeader
              title={[t.fields.verfasser_vorname, t.fields.verfasser_nachname].filter(Boolean).join(' ') || 'Tagesbericht'}
              subtitle={t.baustelleName}
            />
            <RecordKeyFacts items={[
              { label: 'Datum', value: formatDate(t.fields.berichtsdatum) },
              { label: 'Wetter', value: t.fields.wetterbedingungen?.label },
              { label: 'Mitarbeiter vor Ort', value: t.fields.mitarbeiter_anzahl?.toString() },
              { label: 'Freigabe', value: t.fields.freigabe_vorgesetzter ? 'Erteilt' : 'Ausstehend' },
            ].filter(i => i.value)} />
            <RecordSection>
              <RecordField label="Durchgeführte Arbeiten" value={t.fields.durchgefuehrte_arbeiten} format="longtext" />
              <RecordField label="Besonderheiten" value={t.fields.besonderheiten_tag} format="longtext" />
              <RecordField label="Nächste Schritte" value={t.fields.naechste_schritte} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.TAGESBERICHTE} recordId={t.record_id} />
          </RecordOverlay>
        );
      })()}

      {currentOverlay?.type === 've_verwaltung' && (() => {
        const v = enrichedVeVerwaltung.find(x => x.record_id === currentOverlay.id);
        if (!v) return null;
        return (
          <RecordOverlay open={overlay.open} onClose={overlay.close} onBack={overlay.canGoBack ? overlay.pop : undefined}>
            <RecordHeader title={v.fields.ve_nummer ?? 'VE'} subtitle={v.baustelleName} />
            <RecordKeyFacts items={[
              { label: 'Status', value: v.fields.ve_status?.label },
              { label: 'Ausstellungsdatum', value: formatDate(v.fields.ausstellungsdatum) },
              { label: 'Ablaufdatum', value: formatDate(v.fields.ablaufdatum) },
              { label: 'Behörde', value: v.fields.behoerde },
            ].filter(i => i.value)} />
            <RecordSection>
              <RecordField label="Notizen" value={v.fields.ve_notizen} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.VE_VERWALTUNG} recordId={v.record_id} />
          </RecordOverlay>
        );
      })()}

      {currentOverlay?.type === 'fotodokumentation' && (() => {
        const f = enrichedFotodokumentation.find(x => x.record_id === currentOverlay.id);
        if (!f) return null;
        return (
          <RecordOverlay open={overlay.open} onClose={overlay.close} onBack={overlay.canGoBack ? overlay.pop : undefined}>
            <RecordHeader title={f.fields.fotokategorie?.label ?? 'Foto'} subtitle={f.baustelleName} />
            <RecordKeyFacts items={[
              { label: 'Aufnahmedatum', value: formatDate(f.fields.aufnahmedatum) },
            ].filter(i => i.value)} />
            <RecordSection>
              <RecordField label="Beschreibung" value={f.fields.foto_beschreibung} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.FOTODOKUMENTATION} recordId={f.record_id} />
          </RecordOverlay>
        );
      })()}

      {currentOverlay?.type === 'kommunikation' && (() => {
        const k = enrichedKommunikation.find(x => x.record_id === currentOverlay.id);
        if (!k) return null;
        return (
          <RecordOverlay open={overlay.open} onClose={overlay.close} onBack={overlay.canGoBack ? overlay.pop : undefined}>
            <RecordHeader
              title={[k.fields.kontakt_vorname, k.fields.kontakt_nachname].filter(Boolean).join(' ') || 'Kontakt'}
              subtitle={k.baustelleName}
            />
            <RecordKeyFacts items={[
              { label: 'Kontaktart', value: k.fields.kontaktart?.label },
              { label: 'Datum', value: formatDate(k.fields.gespraechsdatum) },
              { label: 'Telefon', value: k.fields.kontakt_telefon },
              { label: 'E-Mail', value: k.fields.kontakt_email },
            ].filter(i => i.value)} />
            <RecordSection>
              <RecordField label="Gesprächsnotiz" value={k.fields.gespraechsnotiz} format="longtext" />
              <RecordField label="Besonderheiten" value={k.fields.besonderheiten} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.KOMMUNIKATION} recordId={k.record_id} />
          </RecordOverlay>
        );
      })()}

      {currentOverlay?.type === 'vor_ort_checkliste' && (() => {
        const c = enrichedVorOrtCheckliste.find(x => x.record_id === currentOverlay.id);
        if (!c) return null;
        return (
          <RecordOverlay open={overlay.open} onClose={overlay.close} onBack={overlay.canGoBack ? overlay.pop : undefined}>
            <RecordHeader
              title={c.fields.pruefzeitpunkt ? formatDate(c.fields.pruefzeitpunkt) : 'Checkliste'}
              subtitle={c.baustelleName}
            />
            <RecordKeyFacts items={[
              { label: 'Prüfer', value: c.fields.pruefer },
              { label: 'Absperrungen korrekt', value: c.fields.absperrungen_korrekt === true ? 'Ja' : c.fields.absperrungen_korrekt === false ? 'Nein' : undefined },
              { label: 'Parkverbote eingerichtet', value: c.fields.parkverbote_eingerichtet === true ? 'Ja' : c.fields.parkverbote_eingerichtet === false ? 'Nein' : undefined },
              { label: 'Anwohner informiert', value: c.fields.anwohner_informiert === true ? 'Ja' : c.fields.anwohner_informiert === false ? 'Nein' : undefined },
              { label: 'Grabengröße korrekt', value: c.fields.grabengroesse_korrekt === true ? 'Ja' : c.fields.grabengroesse_korrekt === false ? 'Nein' : undefined },
            ].filter(i => i.value !== undefined)} />
            <RecordSection>
              <RecordField label="Bemerkungen" value={c.fields.bemerkungen} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.VOR_ORT_CHECKLISTE} recordId={c.record_id} />
          </RecordOverlay>
        );
      })()}

      {currentOverlay?.type === 'leitungsauskunft' && (() => {
        const l = enrichedLeitungsauskunft.find(x => x.record_id === currentOverlay.id);
        if (!l) return null;
        return (
          <RecordOverlay open={overlay.open} onClose={overlay.close} onBack={overlay.canGoBack ? overlay.pop : undefined}>
            <RecordHeader title={l.fields.hausanschluss_typ?.label ?? 'Leitung'} subtitle={l.baustelleName} />
            <RecordKeyFacts items={[
              { label: 'Spannungsebene', value: l.fields.spannungsebene?.label },
              { label: 'Muffentyp', value: l.fields.muffentyp },
              { label: 'Material', value: l.fields.material },
            ].filter(i => i.value)} />
            <RecordSection>
              <RecordField label="Hausanschluss-Info" value={l.fields.hausanschluss_info} format="longtext" />
              <RecordField label="Leitungsführung" value={l.fields.leitungsfuehrung} format="longtext" />
            </RecordSection>
            <RecordAttachments appId={APP_IDS.LEITUNGSAUSKUNFT} recordId={l.record_id} />
          </RecordOverlay>
        );
      })()}

      {/* Create/Edit Dialogs */}
      <BaustellenDialog
        open={baustellenDialogOpen}
        onClose={() => setBaustellenDialogOpen(false)}
        onSubmit={async (fields) => {
          await LivingAppsService.createBaustellenEntry(fields);
          fetchAll();
        }}
        defaultValues={baustellenDialogStatus ? { status: baustellenDialogStatus } : undefined}
        enablePhotoScan={AI_PHOTO_SCAN['Baustellen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Baustellen']}
      />

      <VeVerwaltungDialog
        open={veDialog.open}
        onClose={() => setVeDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createVeVerwaltungEntry(fields);
          fetchAll();
        }}
        defaultValues={veDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, veDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['VeVerwaltung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['VeVerwaltung']}
      />

      <FotodokumentationDialog
        open={fotoDialog.open}
        onClose={() => setFotoDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createFotodokumentationEntry(fields);
          fetchAll();
        }}
        defaultValues={fotoDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, fotoDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['Fotodokumentation']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Fotodokumentation']}
      />

      <KommunikationDialog
        open={kommDialog.open}
        onClose={() => setKommDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createKommunikationEntry(fields);
          fetchAll();
        }}
        defaultValues={kommDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, kommDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['Kommunikation']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kommunikation']}
      />

      <TagesberichteDialog
        open={tagesDialog.open}
        onClose={() => setTagesDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createTagesberichteEntry(fields);
          fetchAll();
        }}
        defaultValues={tagesDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, tagesDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['Tagesberichte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Tagesberichte']}
      />

      <VorOrtChecklisteDialog
        open={checkDialog.open}
        onClose={() => setCheckDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createVorOrtChecklisteEntry(fields);
          fetchAll();
        }}
        defaultValues={checkDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, checkDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['VorOrtCheckliste']}
        enablePhotoLocation={AI_PHOTO_LOCATION['VorOrtCheckliste']}
      />

      <LeitungsauskunftDialog
        open={leitDialog.open}
        onClose={() => setLeitDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createLeitungsauskunftEntry(fields);
          fetchAll();
        }}
        defaultValues={leitDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, leitDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['Leitungsauskunft']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Leitungsauskunft']}
      />

      <MaengelerfassungDialog
        open={mangelDialog.open}
        onClose={() => setMangelDialog({ open: false })}
        onSubmit={async (fields) => {
          await LivingAppsService.createMaengelerfassungEntry(fields);
          fetchAll();
        }}
        defaultValues={mangelDialog.baustelleId ? { baustelle: createRecordUrl(APP_IDS.BAUSTELLEN, mangelDialog.baustelleId) } : undefined}
        baustellenList={baustellen}
        enablePhotoScan={AI_PHOTO_SCAN['Maengelerfassung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Maengelerfassung']}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const APPGROUP_ID = '6a2c5f4e6e5b89664732f859';
  const REPAIR_ENDPOINT = '/claude/build/repair';

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktiere den Support.</p>}
    </div>
  );
}
