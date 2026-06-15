import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { VeVerwaltung, Fotodokumentation, Kommunikation, Tagesberichte, Baustellen, VorOrtCheckliste, Leitungsauskunft, Maengelerfassung } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { VeVerwaltungDialog } from '@/components/dialogs/VeVerwaltungDialog';
import { VeVerwaltungViewDialog } from '@/components/dialogs/VeVerwaltungViewDialog';
import { FotodokumentationDialog } from '@/components/dialogs/FotodokumentationDialog';
import { FotodokumentationViewDialog } from '@/components/dialogs/FotodokumentationViewDialog';
import { KommunikationDialog } from '@/components/dialogs/KommunikationDialog';
import { KommunikationViewDialog } from '@/components/dialogs/KommunikationViewDialog';
import { TagesberichteDialog } from '@/components/dialogs/TagesberichteDialog';
import { TagesberichteViewDialog } from '@/components/dialogs/TagesberichteViewDialog';
import { BaustellenDialog } from '@/components/dialogs/BaustellenDialog';
import { BaustellenViewDialog } from '@/components/dialogs/BaustellenViewDialog';
import { VorOrtChecklisteDialog } from '@/components/dialogs/VorOrtChecklisteDialog';
import { VorOrtChecklisteViewDialog } from '@/components/dialogs/VorOrtChecklisteViewDialog';
import { LeitungsauskunftDialog } from '@/components/dialogs/LeitungsauskunftDialog';
import { LeitungsauskunftViewDialog } from '@/components/dialogs/LeitungsauskunftViewDialog';
import { MaengelerfassungDialog } from '@/components/dialogs/MaengelerfassungDialog';
import { MaengelerfassungViewDialog } from '@/components/dialogs/MaengelerfassungViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPencil, IconTrash, IconPlus, IconFilter, IconX, IconArrowsUpDown, IconArrowUp, IconArrowDown, IconSearch, IconCopy, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const VEVERWALTUNG_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 've_nummer', label: 'VE-Nummer', type: 'string/text' },
  { key: 'ausstellungsdatum', label: 'Ausstellungsdatum', type: 'date/date' },
  { key: 'ablaufdatum', label: 'Ablaufdatum', type: 'date/date' },
  { key: 'erinnerungsdatum', label: 'Erinnerungsdatum', type: 'date/date' },
  { key: 've_status', label: 'Status der VE', type: 'lookup/select', options: [{ key: 'beantragt', label: 'Beantragt' }, { key: 'genehmigt', label: 'Genehmigt' }, { key: 'abgelaufen', label: 'Abgelaufen' }, { key: 'widerrufen', label: 'Widerrufen' }] },
  { key: 'behoerde', label: 'Zuständige Behörde', type: 'string/text' },
  { key: 'ansprechpartner_vorname', label: 'Vorname Ansprechpartner', type: 'string/text' },
  { key: 'ansprechpartner_nachname', label: 'Nachname Ansprechpartner', type: 'string/text' },
  { key: 'ansprechpartner_telefon', label: 'Telefon Ansprechpartner', type: 'string/tel' },
  { key: 'dokumente', label: 'Dokumente und Genehmigungen', type: 'file' },
  { key: 've_notizen', label: 'Notizen', type: 'string/textarea' },
];
const FOTODOKUMENTATION_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 'fotokategorie', label: 'Fotokategorie', type: 'lookup/radio', options: [{ key: 'vor_beginn', label: 'Vor Beginn der Arbeiten' }, { key: 'waehrend_arbeiten', label: 'Während der Arbeiten' }, { key: 'nach_fertigstellung', label: 'Nach Fertigstellung' }] },
  { key: 'aufnahmedatum', label: 'Aufnahmedatum und -uhrzeit', type: 'date/datetimeminute' },
  { key: 'foto', label: 'Foto', type: 'file' },
  { key: 'gps_koordinaten', label: 'GPS-Koordinaten', type: 'geo' },
  { key: 'foto_beschreibung', label: 'Beschreibung', type: 'string/textarea' },
];
const KOMMUNIKATION_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 'kontakt_vorname', label: 'Vorname Kontaktperson', type: 'string/text' },
  { key: 'kontakt_nachname', label: 'Nachname Kontaktperson', type: 'string/text' },
  { key: 'kontakt_adresse_strasse', label: 'Straße', type: 'string/text' },
  { key: 'kontakt_adresse_hausnummer', label: 'Hausnummer', type: 'string/text' },
  { key: 'kontakt_adresse_plz', label: 'Postleitzahl', type: 'string/text' },
  { key: 'kontakt_telefon', label: 'Telefon', type: 'string/tel' },
  { key: 'kontakt_email', label: 'E-Mail', type: 'string/email' },
  { key: 'gespraechsdatum', label: 'Datum des Gesprächs', type: 'date/datetimeminute' },
  { key: 'kontaktart', label: 'Art des Kontakts', type: 'lookup/radio', options: [{ key: 'information', label: 'Information' }, { key: 'beschwerde', label: 'Beschwerde' }, { key: 'rueckfrage', label: 'Rückfrage' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'gespraechsnotiz', label: 'Gesprächsnotiz', type: 'string/textarea' },
  { key: 'besonderheiten', label: 'Besonderheiten', type: 'string/textarea' },
  { key: 'kontakt_adresse_ort', label: 'Ort', type: 'string/text' },
];
const TAGESBERICHTE_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 'berichtsdatum', label: 'Berichtsdatum', type: 'date/date' },
  { key: 'verfasser_vorname', label: 'Vorname Verfasser', type: 'string/text' },
  { key: 'verfasser_nachname', label: 'Nachname Verfasser', type: 'string/text' },
  { key: 'wetterbedingungen', label: 'Wetterbedingungen', type: 'lookup/select', options: [{ key: 'sonnig', label: 'Sonnig' }, { key: 'bewoelkt', label: 'Bewölkt' }, { key: 'regnerisch', label: 'Regnerisch' }, { key: 'windig', label: 'Windig' }, { key: 'schnee', label: 'Schnee' }, { key: 'frost', label: 'Frost' }] },
  { key: 'mitarbeiter_anzahl', label: 'Anzahl Mitarbeiter vor Ort', type: 'number' },
  { key: 'durchgefuehrte_arbeiten', label: 'Durchgeführte Arbeiten', type: 'string/textarea' },
  { key: 'besonderheiten_tag', label: 'Besonderheiten des Tages', type: 'string/textarea' },
  { key: 'naechste_schritte', label: 'Nächste geplante Schritte', type: 'string/textarea' },
  { key: 'freigabe_vorgesetzter', label: 'Freigabe durch Vorgesetzten erteilt', type: 'bool' },
  { key: 'freigabe_bemerkung', label: 'Bemerkung zur Freigabe', type: 'string/textarea' },
];
const BAUSTELLEN_FIELDS = [
  { key: 'name', label: 'Baustellenname', type: 'string/text' },
  { key: 'beschreibung', label: 'Beschreibung', type: 'string/textarea' },
  { key: 'status', label: 'Status', type: 'lookup/radio', options: [{ key: 'geplant', label: 'Geplant' }, { key: 'in_arbeit', label: 'In Arbeit' }, { key: 'abgeschlossen', label: 'Abgeschlossen' }] },
  { key: 'startdatum', label: 'Startdatum', type: 'date/date' },
  { key: 'enddatum', label: 'Geplantes Enddatum', type: 'date/date' },
  { key: 'strasse', label: 'Straße', type: 'string/text' },
  { key: 'hausnummer', label: 'Hausnummer', type: 'string/text' },
  { key: 'plz', label: 'Postleitzahl', type: 'string/text' },
  { key: 'ort', label: 'Ort', type: 'string/text' },
  { key: 'standort', label: 'GPS-Standort', type: 'geo' },
  { key: 'zustaendige_person', label: 'Zuständige Person', type: 'string/text' },
  { key: 'auftraggeber', label: 'Auftraggeber', type: 'string/text' },
  { key: 'notizen', label: 'Notizen', type: 'string/textarea' },
];
const VORORTCHECKLISTE_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 'pruefzeitpunkt', label: 'Datum und Uhrzeit der Prüfung', type: 'date/datetimeminute' },
  { key: 'pruefer', label: 'Prüfer', type: 'string/text' },
  { key: 'absperrungen_korrekt', label: 'Sind die Absperrungen korrekt?', type: 'bool' },
  { key: 'parkverbote_eingerichtet', label: 'Sind die Parkverbote eingerichtet?', type: 'bool' },
  { key: 'anwohner_informiert', label: 'Wurden Anwohner informiert?', type: 'bool' },
  { key: 'grabengroesse_korrekt', label: 'Entspricht die Grabengröße dem Plan?', type: 'bool' },
  { key: 'bemerkungen', label: 'Bemerkungen und Abweichungen', type: 'string/textarea' },
];
const LEITUNGSAUSKUNFT_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 'hausanschluss_info', label: 'Hausanschluss-Informationen', type: 'string/textarea' },
  { key: 'hausanschluss_typ', label: 'Hausanschluss-Typ', type: 'lookup/select', options: [{ key: 'strom', label: 'Strom' }, { key: 'gas', label: 'Gas' }, { key: 'wasser', label: 'Wasser' }, { key: 'telekommunikation', label: 'Telekommunikation' }, { key: 'fernwaerme', label: 'Fernwärme' }] },
  { key: 'spannungsebene', label: 'Spannungsebene', type: 'lookup/radio', options: [{ key: 'niederspannung', label: 'Niederspannung' }, { key: 'mittelspannung', label: 'Mittelspannung' }, { key: 'hochspannung', label: 'Hochspannung' }] },
  { key: 'muffentyp', label: 'Muffentyp', type: 'string/text' },
  { key: 'material', label: 'Material', type: 'string/text' },
  { key: 'leitungsfuehrung', label: 'Leitungsführung und Notizen', type: 'string/textarea' },
  { key: 'leitungsplaene', label: 'Leitungspläne und Unterlagen', type: 'file' },
];
const MAENGELERFASSUNG_FIELDS = [
  { key: 'baustelle', label: 'Baustelle', type: 'applookup/select', targetEntity: 'baustellen', targetAppId: 'BAUSTELLEN', displayField: 'name' },
  { key: 'mangeltyp', label: 'Mangeltyp', type: 'lookup/select', options: [{ key: 'falsche_absperrung', label: 'Falsche Absperrung' }, { key: 'nacharbeit', label: 'Nacharbeit erforderlich' }, { key: 'sicherheitsmangel', label: 'Sicherheitsmangel' }, { key: 'qualitaetsmangel', label: 'Qualitätsmangel' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'mangel_beschreibung', label: 'Beschreibung des Mangels', type: 'string/textarea' },
  { key: 'prioritaet', label: 'Priorität', type: 'lookup/radio', options: [{ key: 'niedrig', label: 'Niedrig' }, { key: 'mittel', label: 'Mittel' }, { key: 'hoch', label: 'Hoch' }, { key: 'kritisch', label: 'Kritisch' }] },
  { key: 'meldedatum', label: 'Meldedatum', type: 'date/datetimeminute' },
  { key: 'mangel_status', label: 'Status', type: 'lookup/select', options: [{ key: 'offen', label: 'Offen' }, { key: 'in_bearbeitung', label: 'In Bearbeitung' }, { key: 'behoben', label: 'Behoben' }] },
  { key: 'firma_name', label: 'Verantwortliche Firma', type: 'string/text' },
  { key: 'firma_ansprechpartner_vorname', label: 'Vorname Ansprechpartner Firma', type: 'string/text' },
  { key: 'firma_ansprechpartner_nachname', label: 'Nachname Ansprechpartner Firma', type: 'string/text' },
  { key: 'firma_telefon', label: 'Telefon Firma', type: 'string/tel' },
  { key: 'mangel_foto', label: 'Foto des Mangels', type: 'file' },
  { key: 'mangel_bemerkungen', label: 'Weitere Bemerkungen', type: 'string/textarea' },
];

const ENTITY_TABS = [
  { key: 've_verwaltung', label: 'VE-Verwaltung', pascal: 'VeVerwaltung' },
  { key: 'fotodokumentation', label: 'Fotodokumentation', pascal: 'Fotodokumentation' },
  { key: 'kommunikation', label: 'Kommunikation', pascal: 'Kommunikation' },
  { key: 'tagesberichte', label: 'Tagesberichte', pascal: 'Tagesberichte' },
  { key: 'baustellen', label: 'Baustellen', pascal: 'Baustellen' },
  { key: 'vor_ort_checkliste', label: 'Vor-Ort-Checkliste', pascal: 'VorOrtCheckliste' },
  { key: 'leitungsauskunft', label: 'Leitungsauskunft', pascal: 'Leitungsauskunft' },
  { key: 'maengelerfassung', label: 'Mängelerfassung', pascal: 'Maengelerfassung' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('ve_verwaltung');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    've_verwaltung': new Set(),
    'fotodokumentation': new Set(),
    'kommunikation': new Set(),
    'tagesberichte': new Set(),
    'baustellen': new Set(),
    'vor_ort_checkliste': new Set(),
    'leitungsauskunft': new Set(),
    'maengelerfassung': new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    've_verwaltung': {},
    'fotodokumentation': {},
    'kommunikation': {},
    'tagesberichte': {},
    'baustellen': {},
    'vor_ort_checkliste': {},
    'leitungsauskunft': {},
    'maengelerfassung': {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 've_verwaltung': return (data as any).veVerwaltung as VeVerwaltung[] ?? [];
      case 'fotodokumentation': return (data as any).fotodokumentation as Fotodokumentation[] ?? [];
      case 'kommunikation': return (data as any).kommunikation as Kommunikation[] ?? [];
      case 'tagesberichte': return (data as any).tagesberichte as Tagesberichte[] ?? [];
      case 'baustellen': return (data as any).baustellen as Baustellen[] ?? [];
      case 'vor_ort_checkliste': return (data as any).vorOrtCheckliste as VorOrtCheckliste[] ?? [];
      case 'leitungsauskunft': return (data as any).leitungsauskunft as Leitungsauskunft[] ?? [];
      case 'maengelerfassung': return (data as any).maengelerfassung as Maengelerfassung[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
      case 've_verwaltung':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
      case 'fotodokumentation':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
      case 'kommunikation':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
      case 'tagesberichte':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
      case 'vor_ort_checkliste':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
      case 'leitungsauskunft':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
      case 'maengelerfassung':
        lists.baustellenList = (data as any).baustellen ?? [];
        break;
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    if (entity === 've_verwaltung' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    if (entity === 'fotodokumentation' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    if (entity === 'kommunikation' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    if (entity === 'tagesberichte' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    if (entity === 'vor_ort_checkliste' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    if (entity === 'leitungsauskunft' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    if (entity === 'maengelerfassung' && fieldKey === 'baustelle') {
      const match = (lists.baustellenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.name ?? '—';
    }
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 've_verwaltung': return VEVERWALTUNG_FIELDS;
      case 'fotodokumentation': return FOTODOKUMENTATION_FIELDS;
      case 'kommunikation': return KOMMUNIKATION_FIELDS;
      case 'tagesberichte': return TAGESBERICHTE_FIELDS;
      case 'baustellen': return BAUSTELLEN_FIELDS;
      case 'vor_ort_checkliste': return VORORTCHECKLISTE_FIELDS;
      case 'leitungsauskunft': return LEITUNGSAUSKUNFT_FIELDS;
      case 'maengelerfassung': return MAENGELERFASSUNG_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 've_verwaltung': return {
        create: (fields: any) => LivingAppsService.createVeVerwaltungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateVeVerwaltungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteVeVerwaltungEntry(id),
      };
      case 'fotodokumentation': return {
        create: (fields: any) => LivingAppsService.createFotodokumentationEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateFotodokumentationEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteFotodokumentationEntry(id),
      };
      case 'kommunikation': return {
        create: (fields: any) => LivingAppsService.createKommunikationEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateKommunikationEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteKommunikationEntry(id),
      };
      case 'tagesberichte': return {
        create: (fields: any) => LivingAppsService.createTagesberichteEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateTagesberichteEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteTagesberichteEntry(id),
      };
      case 'baustellen': return {
        create: (fields: any) => LivingAppsService.createBaustellenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateBaustellenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteBaustellenEntry(id),
      };
      case 'vor_ort_checkliste': return {
        create: (fields: any) => LivingAppsService.createVorOrtChecklisteEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateVorOrtChecklisteEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteVorOrtChecklisteEntry(id),
      };
      case 'leitungsauskunft': return {
        create: (fields: any) => LivingAppsService.createLeitungsauskunftEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateLeitungsauskunftEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteLeitungsauskunftEntry(id),
      };
      case 'maengelerfassung': return {
        create: (fields: any) => LivingAppsService.createMaengelerfassungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateMaengelerfassungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteMaengelerfassungEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <IconPlus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <IconFilter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <IconPencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <IconCopy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <IconTrash className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <IconX className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.startsWith('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.startsWith('multipleapplookup')) {
                    return (
                      <TableCell key={fm.key}>
                        {Array.isArray(val) && val.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {val.map((url: any, i: number) => (
                              <span key={i} className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, url)}</span>
                            ))}
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type.startsWith('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 've_verwaltung' || dialogState?.entity === 've_verwaltung') && (
        <VeVerwaltungDialog
          open={createEntity === 've_verwaltung' || dialogState?.entity === 've_verwaltung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 've_verwaltung' ? handleUpdate : (fields: any) => handleCreate('ve_verwaltung', fields)}
          defaultValues={dialogState?.entity === 've_verwaltung' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['VeVerwaltung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['VeVerwaltung']}
        />
      )}
      {(createEntity === 'fotodokumentation' || dialogState?.entity === 'fotodokumentation') && (
        <FotodokumentationDialog
          open={createEntity === 'fotodokumentation' || dialogState?.entity === 'fotodokumentation'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'fotodokumentation' ? handleUpdate : (fields: any) => handleCreate('fotodokumentation', fields)}
          defaultValues={dialogState?.entity === 'fotodokumentation' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Fotodokumentation']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Fotodokumentation']}
        />
      )}
      {(createEntity === 'kommunikation' || dialogState?.entity === 'kommunikation') && (
        <KommunikationDialog
          open={createEntity === 'kommunikation' || dialogState?.entity === 'kommunikation'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'kommunikation' ? handleUpdate : (fields: any) => handleCreate('kommunikation', fields)}
          defaultValues={dialogState?.entity === 'kommunikation' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Kommunikation']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Kommunikation']}
        />
      )}
      {(createEntity === 'tagesberichte' || dialogState?.entity === 'tagesberichte') && (
        <TagesberichteDialog
          open={createEntity === 'tagesberichte' || dialogState?.entity === 'tagesberichte'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'tagesberichte' ? handleUpdate : (fields: any) => handleCreate('tagesberichte', fields)}
          defaultValues={dialogState?.entity === 'tagesberichte' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Tagesberichte']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Tagesberichte']}
        />
      )}
      {(createEntity === 'baustellen' || dialogState?.entity === 'baustellen') && (
        <BaustellenDialog
          open={createEntity === 'baustellen' || dialogState?.entity === 'baustellen'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'baustellen' ? handleUpdate : (fields: any) => handleCreate('baustellen', fields)}
          defaultValues={dialogState?.entity === 'baustellen' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Baustellen']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Baustellen']}
        />
      )}
      {(createEntity === 'vor_ort_checkliste' || dialogState?.entity === 'vor_ort_checkliste') && (
        <VorOrtChecklisteDialog
          open={createEntity === 'vor_ort_checkliste' || dialogState?.entity === 'vor_ort_checkliste'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'vor_ort_checkliste' ? handleUpdate : (fields: any) => handleCreate('vor_ort_checkliste', fields)}
          defaultValues={dialogState?.entity === 'vor_ort_checkliste' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['VorOrtCheckliste']}
          enablePhotoLocation={AI_PHOTO_LOCATION['VorOrtCheckliste']}
        />
      )}
      {(createEntity === 'leitungsauskunft' || dialogState?.entity === 'leitungsauskunft') && (
        <LeitungsauskunftDialog
          open={createEntity === 'leitungsauskunft' || dialogState?.entity === 'leitungsauskunft'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'leitungsauskunft' ? handleUpdate : (fields: any) => handleCreate('leitungsauskunft', fields)}
          defaultValues={dialogState?.entity === 'leitungsauskunft' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Leitungsauskunft']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Leitungsauskunft']}
        />
      )}
      {(createEntity === 'maengelerfassung' || dialogState?.entity === 'maengelerfassung') && (
        <MaengelerfassungDialog
          open={createEntity === 'maengelerfassung' || dialogState?.entity === 'maengelerfassung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'maengelerfassung' ? handleUpdate : (fields: any) => handleCreate('maengelerfassung', fields)}
          defaultValues={dialogState?.entity === 'maengelerfassung' ? dialogState.record?.fields : undefined}
          baustellenList={(data as any).baustellen ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Maengelerfassung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Maengelerfassung']}
        />
      )}
      {viewState?.entity === 've_verwaltung' && (
        <VeVerwaltungViewDialog
          open={viewState?.entity === 've_verwaltung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 've_verwaltung', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}
      {viewState?.entity === 'fotodokumentation' && (
        <FotodokumentationViewDialog
          open={viewState?.entity === 'fotodokumentation'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'fotodokumentation', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}
      {viewState?.entity === 'kommunikation' && (
        <KommunikationViewDialog
          open={viewState?.entity === 'kommunikation'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'kommunikation', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}
      {viewState?.entity === 'tagesberichte' && (
        <TagesberichteViewDialog
          open={viewState?.entity === 'tagesberichte'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'tagesberichte', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}
      {viewState?.entity === 'baustellen' && (
        <BaustellenViewDialog
          open={viewState?.entity === 'baustellen'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'baustellen', record: r }); }}
        />
      )}
      {viewState?.entity === 'vor_ort_checkliste' && (
        <VorOrtChecklisteViewDialog
          open={viewState?.entity === 'vor_ort_checkliste'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'vor_ort_checkliste', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}
      {viewState?.entity === 'leitungsauskunft' && (
        <LeitungsauskunftViewDialog
          open={viewState?.entity === 'leitungsauskunft'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'leitungsauskunft', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}
      {viewState?.entity === 'maengelerfassung' && (
        <MaengelerfassungViewDialog
          open={viewState?.entity === 'maengelerfassung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'maengelerfassung', record: r }); }}
          baustellenList={(data as any).baustellen ?? []}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}