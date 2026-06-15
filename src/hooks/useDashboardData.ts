import { useState, useEffect, useMemo, useCallback } from 'react';
import type { VeVerwaltung, Fotodokumentation, Kommunikation, Tagesberichte, Baustellen, VorOrtCheckliste, Leitungsauskunft, Maengelerfassung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
export function useDashboardData() {
  const [veVerwaltung, setVeVerwaltung] = useState<VeVerwaltung[]>([]);
  const [fotodokumentation, setFotodokumentation] = useState<Fotodokumentation[]>([]);
  const [kommunikation, setKommunikation] = useState<Kommunikation[]>([]);
  const [tagesberichte, setTagesberichte] = useState<Tagesberichte[]>([]);
  const [baustellen, setBaustellen] = useState<Baustellen[]>([]);
  const [vorOrtCheckliste, setVorOrtCheckliste] = useState<VorOrtCheckliste[]>([]);
  const [leitungsauskunft, setLeitungsauskunft] = useState<Leitungsauskunft[]>([]);
  const [maengelerfassung, setMaengelerfassung] = useState<Maengelerfassung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [veVerwaltungData, fotodokumentationData, kommunikationData, tagesberichteData, baustellenData, vorOrtChecklisteData, leitungsauskunftData, maengelerfassungData] = await Promise.all([
        LivingAppsService.getVeVerwaltung(),
        LivingAppsService.getFotodokumentation(),
        LivingAppsService.getKommunikation(),
        LivingAppsService.getTagesberichte(),
        LivingAppsService.getBaustellen(),
        LivingAppsService.getVorOrtCheckliste(),
        LivingAppsService.getLeitungsauskunft(),
        LivingAppsService.getMaengelerfassung(),
      ]);
      setVeVerwaltung(veVerwaltungData);
      setFotodokumentation(fotodokumentationData);
      setKommunikation(kommunikationData);
      setTagesberichte(tagesberichteData);
      setBaustellen(baustellenData);
      setVorOrtCheckliste(vorOrtChecklisteData);
      setLeitungsauskunft(leitungsauskunftData);
      setMaengelerfassung(maengelerfassungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [veVerwaltungData, fotodokumentationData, kommunikationData, tagesberichteData, baustellenData, vorOrtChecklisteData, leitungsauskunftData, maengelerfassungData] = await Promise.all([
          LivingAppsService.getVeVerwaltung(),
          LivingAppsService.getFotodokumentation(),
          LivingAppsService.getKommunikation(),
          LivingAppsService.getTagesberichte(),
          LivingAppsService.getBaustellen(),
          LivingAppsService.getVorOrtCheckliste(),
          LivingAppsService.getLeitungsauskunft(),
          LivingAppsService.getMaengelerfassung(),
        ]);
        setVeVerwaltung(veVerwaltungData);
        setFotodokumentation(fotodokumentationData);
        setKommunikation(kommunikationData);
        setTagesberichte(tagesberichteData);
        setBaustellen(baustellenData);
        setVorOrtCheckliste(vorOrtChecklisteData);
        setLeitungsauskunft(leitungsauskunftData);
        setMaengelerfassung(maengelerfassungData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const baustellenMap = useMemo(() => {
    const m = new Map<string, Baustellen>();
    baustellen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [baustellen]);

  return { veVerwaltung, setVeVerwaltung, fotodokumentation, setFotodokumentation, kommunikation, setKommunikation, tagesberichte, setTagesberichte, baustellen, setBaustellen, vorOrtCheckliste, setVorOrtCheckliste, leitungsauskunft, setLeitungsauskunft, maengelerfassung, setMaengelerfassung, loading, error, fetchAll, baustellenMap };
}