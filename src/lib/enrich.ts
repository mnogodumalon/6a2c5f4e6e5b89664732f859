import type { EnrichedFotodokumentation, EnrichedKommunikation, EnrichedLeitungsauskunft, EnrichedMaengelerfassung, EnrichedTagesberichte, EnrichedVeVerwaltung, EnrichedVorOrtCheckliste } from '@/types/enriched';
import type { Baustellen, Fotodokumentation, Kommunikation, Leitungsauskunft, Maengelerfassung, Tagesberichte, VeVerwaltung, VorOrtCheckliste } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface VeVerwaltungMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichVeVerwaltung(
  veVerwaltung: VeVerwaltung[],
  maps: VeVerwaltungMaps
): EnrichedVeVerwaltung[] {
  return veVerwaltung.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}

interface FotodokumentationMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichFotodokumentation(
  fotodokumentation: Fotodokumentation[],
  maps: FotodokumentationMaps
): EnrichedFotodokumentation[] {
  return fotodokumentation.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}

interface KommunikationMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichKommunikation(
  kommunikation: Kommunikation[],
  maps: KommunikationMaps
): EnrichedKommunikation[] {
  return kommunikation.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}

interface TagesberichteMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichTagesberichte(
  tagesberichte: Tagesberichte[],
  maps: TagesberichteMaps
): EnrichedTagesberichte[] {
  return tagesberichte.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}

interface VorOrtChecklisteMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichVorOrtCheckliste(
  vorOrtCheckliste: VorOrtCheckliste[],
  maps: VorOrtChecklisteMaps
): EnrichedVorOrtCheckliste[] {
  return vorOrtCheckliste.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}

interface LeitungsauskunftMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichLeitungsauskunft(
  leitungsauskunft: Leitungsauskunft[],
  maps: LeitungsauskunftMaps
): EnrichedLeitungsauskunft[] {
  return leitungsauskunft.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}

interface MaengelerfassungMaps {
  baustellenMap: Map<string, Baustellen>;
}

export function enrichMaengelerfassung(
  maengelerfassung: Maengelerfassung[],
  maps: MaengelerfassungMaps
): EnrichedMaengelerfassung[] {
  return maengelerfassung.map(r => ({
    ...r,
    baustelleName: resolveDisplay(r.fields.baustelle, maps.baustellenMap, 'name'),
  }));
}
