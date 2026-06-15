// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface VeVerwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    ve_nummer?: string;
    ausstellungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    ablaufdatum?: string; // Format: YYYY-MM-DD oder ISO String
    erinnerungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    ve_status?: LookupValue;
    behoerde?: string;
    ansprechpartner_vorname?: string;
    ansprechpartner_nachname?: string;
    ansprechpartner_telefon?: string;
    dokumente?: string;
    ve_notizen?: string;
  };
}

export interface Fotodokumentation {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    fotokategorie?: LookupValue;
    aufnahmedatum?: string; // Format: YYYY-MM-DD oder ISO String
    foto?: string;
    gps_koordinaten?: GeoLocation; // { lat, long, info }
    foto_beschreibung?: string;
  };
}

export interface Kommunikation {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    kontakt_vorname?: string;
    kontakt_nachname?: string;
    kontakt_adresse_strasse?: string;
    kontakt_adresse_hausnummer?: string;
    kontakt_adresse_plz?: string;
    kontakt_telefon?: string;
    kontakt_email?: string;
    gespraechsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    kontaktart?: LookupValue;
    gespraechsnotiz?: string;
    besonderheiten?: string;
    kontakt_adresse_ort?: string;
  };
}

export interface Tagesberichte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    berichtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    verfasser_vorname?: string;
    verfasser_nachname?: string;
    wetterbedingungen?: LookupValue;
    mitarbeiter_anzahl?: number;
    durchgefuehrte_arbeiten?: string;
    besonderheiten_tag?: string;
    naechste_schritte?: string;
    freigabe_vorgesetzter?: boolean;
    freigabe_bemerkung?: string;
  };
}

export interface Baustellen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    beschreibung?: string;
    status?: LookupValue;
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    enddatum?: string; // Format: YYYY-MM-DD oder ISO String
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    standort?: GeoLocation; // { lat, long, info }
    zustaendige_person?: string;
    auftraggeber?: string;
    notizen?: string;
  };
}

export interface VorOrtCheckliste {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    pruefzeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    pruefer?: string;
    absperrungen_korrekt?: boolean;
    parkverbote_eingerichtet?: boolean;
    anwohner_informiert?: boolean;
    grabengroesse_korrekt?: boolean;
    bemerkungen?: string;
  };
}

export interface Leitungsauskunft {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    hausanschluss_info?: string;
    hausanschluss_typ?: LookupValue;
    spannungsebene?: LookupValue;
    muffentyp?: string;
    material?: string;
    leitungsfuehrung?: string;
    leitungsplaene?: string;
  };
}

export interface Maengelerfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baustelle?: string; // applookup -> URL zu 'Baustellen' Record
    mangeltyp?: LookupValue;
    mangel_beschreibung?: string;
    prioritaet?: LookupValue;
    meldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    mangel_status?: LookupValue;
    firma_name?: string;
    firma_ansprechpartner_vorname?: string;
    firma_ansprechpartner_nachname?: string;
    firma_telefon?: string;
    mangel_foto?: string;
    mangel_bemerkungen?: string;
  };
}

export const APP_IDS = {
  VE_VERWALTUNG: '6a2c5f128320e49fee0782df',
  FOTODOKUMENTATION: '6a2c5f156476392f056b1b6d',
  KOMMUNIKATION: '6a2c5f1737b1758cae8c5e36',
  TAGESBERICHTE: '6a2c5f1b22f933a50d29cc67',
  BAUSTELLEN: '6a2c5f0c38e206d8f43b2a0b',
  VOR_ORT_CHECKLISTE: '6a2c5f14742c88e340e1e58a',
  LEITUNGSAUSKUNFT: '6a2c5f169a7902a433caa841',
  MAENGELERFASSUNG: '6a2c5f19fe95c4a9b239f807',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  've_verwaltung': {
    ve_status: [{ key: "beantragt", label: "Beantragt" }, { key: "genehmigt", label: "Genehmigt" }, { key: "abgelaufen", label: "Abgelaufen" }, { key: "widerrufen", label: "Widerrufen" }],
  },
  'fotodokumentation': {
    fotokategorie: [{ key: "vor_beginn", label: "Vor Beginn der Arbeiten" }, { key: "waehrend_arbeiten", label: "Während der Arbeiten" }, { key: "nach_fertigstellung", label: "Nach Fertigstellung" }],
  },
  'kommunikation': {
    kontaktart: [{ key: "information", label: "Information" }, { key: "beschwerde", label: "Beschwerde" }, { key: "rueckfrage", label: "Rückfrage" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  'tagesberichte': {
    wetterbedingungen: [{ key: "sonnig", label: "Sonnig" }, { key: "bewoelkt", label: "Bewölkt" }, { key: "regnerisch", label: "Regnerisch" }, { key: "windig", label: "Windig" }, { key: "schnee", label: "Schnee" }, { key: "frost", label: "Frost" }],
  },
  'baustellen': {
    status: [{ key: "geplant", label: "Geplant" }, { key: "in_arbeit", label: "In Arbeit" }, { key: "abgeschlossen", label: "Abgeschlossen" }],
  },
  'leitungsauskunft': {
    hausanschluss_typ: [{ key: "strom", label: "Strom" }, { key: "gas", label: "Gas" }, { key: "wasser", label: "Wasser" }, { key: "telekommunikation", label: "Telekommunikation" }, { key: "fernwaerme", label: "Fernwärme" }],
    spannungsebene: [{ key: "niederspannung", label: "Niederspannung" }, { key: "mittelspannung", label: "Mittelspannung" }, { key: "hochspannung", label: "Hochspannung" }],
  },
  'maengelerfassung': {
    mangeltyp: [{ key: "falsche_absperrung", label: "Falsche Absperrung" }, { key: "nacharbeit", label: "Nacharbeit erforderlich" }, { key: "sicherheitsmangel", label: "Sicherheitsmangel" }, { key: "qualitaetsmangel", label: "Qualitätsmangel" }, { key: "sonstiges", label: "Sonstiges" }],
    prioritaet: [{ key: "niedrig", label: "Niedrig" }, { key: "mittel", label: "Mittel" }, { key: "hoch", label: "Hoch" }, { key: "kritisch", label: "Kritisch" }],
    mangel_status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "behoben", label: "Behoben" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  've_verwaltung': {
    'baustelle': 'applookup/select',
    've_nummer': 'string/text',
    'ausstellungsdatum': 'date/date',
    'ablaufdatum': 'date/date',
    'erinnerungsdatum': 'date/date',
    've_status': 'lookup/select',
    'behoerde': 'string/text',
    'ansprechpartner_vorname': 'string/text',
    'ansprechpartner_nachname': 'string/text',
    'ansprechpartner_telefon': 'string/tel',
    'dokumente': 'file',
    've_notizen': 'string/textarea',
  },
  'fotodokumentation': {
    'baustelle': 'applookup/select',
    'fotokategorie': 'lookup/radio',
    'aufnahmedatum': 'date/datetimeminute',
    'foto': 'file',
    'gps_koordinaten': 'geo',
    'foto_beschreibung': 'string/textarea',
  },
  'kommunikation': {
    'baustelle': 'applookup/select',
    'kontakt_vorname': 'string/text',
    'kontakt_nachname': 'string/text',
    'kontakt_adresse_strasse': 'string/text',
    'kontakt_adresse_hausnummer': 'string/text',
    'kontakt_adresse_plz': 'string/text',
    'kontakt_telefon': 'string/tel',
    'kontakt_email': 'string/email',
    'gespraechsdatum': 'date/datetimeminute',
    'kontaktart': 'lookup/radio',
    'gespraechsnotiz': 'string/textarea',
    'besonderheiten': 'string/textarea',
    'kontakt_adresse_ort': 'string/text',
  },
  'tagesberichte': {
    'baustelle': 'applookup/select',
    'berichtsdatum': 'date/date',
    'verfasser_vorname': 'string/text',
    'verfasser_nachname': 'string/text',
    'wetterbedingungen': 'lookup/select',
    'mitarbeiter_anzahl': 'number',
    'durchgefuehrte_arbeiten': 'string/textarea',
    'besonderheiten_tag': 'string/textarea',
    'naechste_schritte': 'string/textarea',
    'freigabe_vorgesetzter': 'bool',
    'freigabe_bemerkung': 'string/textarea',
  },
  'baustellen': {
    'name': 'string/text',
    'beschreibung': 'string/textarea',
    'status': 'lookup/radio',
    'startdatum': 'date/date',
    'enddatum': 'date/date',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'standort': 'geo',
    'zustaendige_person': 'string/text',
    'auftraggeber': 'string/text',
    'notizen': 'string/textarea',
  },
  'vor_ort_checkliste': {
    'baustelle': 'applookup/select',
    'pruefzeitpunkt': 'date/datetimeminute',
    'pruefer': 'string/text',
    'absperrungen_korrekt': 'bool',
    'parkverbote_eingerichtet': 'bool',
    'anwohner_informiert': 'bool',
    'grabengroesse_korrekt': 'bool',
    'bemerkungen': 'string/textarea',
  },
  'leitungsauskunft': {
    'baustelle': 'applookup/select',
    'hausanschluss_info': 'string/textarea',
    'hausanschluss_typ': 'lookup/select',
    'spannungsebene': 'lookup/radio',
    'muffentyp': 'string/text',
    'material': 'string/text',
    'leitungsfuehrung': 'string/textarea',
    'leitungsplaene': 'file',
  },
  'maengelerfassung': {
    'baustelle': 'applookup/select',
    'mangeltyp': 'lookup/select',
    'mangel_beschreibung': 'string/textarea',
    'prioritaet': 'lookup/radio',
    'meldedatum': 'date/datetimeminute',
    'mangel_status': 'lookup/select',
    'firma_name': 'string/text',
    'firma_ansprechpartner_vorname': 'string/text',
    'firma_ansprechpartner_nachname': 'string/text',
    'firma_telefon': 'string/tel',
    'mangel_foto': 'file',
    'mangel_bemerkungen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'baustellen': [
    { field: 'baustelle', entity: 've_verwaltung' },
    { field: 'baustelle', entity: 'fotodokumentation' },
    { field: 'baustelle', entity: 'kommunikation' },
    { field: 'baustelle', entity: 'tagesberichte' },
    { field: 'baustelle', entity: 'vor_ort_checkliste' },
    { field: 'baustelle', entity: 'leitungsauskunft' },
    { field: 'baustelle', entity: 'maengelerfassung' },
  ],
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateVeVerwaltung = StripLookup<VeVerwaltung['fields']>;
export type CreateFotodokumentation = StripLookup<Fotodokumentation['fields']>;
export type CreateKommunikation = StripLookup<Kommunikation['fields']>;
export type CreateTagesberichte = StripLookup<Tagesberichte['fields']>;
export type CreateBaustellen = StripLookup<Baustellen['fields']>;
export type CreateVorOrtCheckliste = StripLookup<VorOrtCheckliste['fields']>;
export type CreateLeitungsauskunft = StripLookup<Leitungsauskunft['fields']>;
export type CreateMaengelerfassung = StripLookup<Maengelerfassung['fields']>;