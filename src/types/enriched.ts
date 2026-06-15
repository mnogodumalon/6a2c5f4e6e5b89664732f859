import type { Fotodokumentation, Kommunikation, Leitungsauskunft, Maengelerfassung, Tagesberichte, VeVerwaltung, VorOrtCheckliste } from './app';

export type EnrichedVeVerwaltung = VeVerwaltung & {
  baustelleName: string;
};

export type EnrichedFotodokumentation = Fotodokumentation & {
  baustelleName: string;
};

export type EnrichedKommunikation = Kommunikation & {
  baustelleName: string;
};

export type EnrichedTagesberichte = Tagesberichte & {
  baustelleName: string;
};

export type EnrichedVorOrtCheckliste = VorOrtCheckliste & {
  baustelleName: string;
};

export type EnrichedLeitungsauskunft = Leitungsauskunft & {
  baustelleName: string;
};

export type EnrichedMaengelerfassung = Maengelerfassung & {
  baustelleName: string;
};
