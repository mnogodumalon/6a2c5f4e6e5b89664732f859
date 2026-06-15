import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Leitungsauskunft, Baustellen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { LeitungsauskunftDialog } from '@/components/dialogs/LeitungsauskunftDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Leitungsauskunft';
import { evalComputed } from '@/config/form-enhancements/types';

export default function LeitungsauskunftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Leitungsauskunft | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [baustellenList, setBaustellenList] = useState<Baustellen[]>([]);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, baustellenData] = await Promise.all([
        LivingAppsService.getLeitungsauskunft(),
        LivingAppsService.getBaustellen(),
      ]);
      setBaustellenList(baustellenData);
      setRecord(mainData.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Leitungsauskunft['fields']) {
    if (!record) return;
    await LivingAppsService.updateLeitungsauskunftEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteLeitungsauskunftEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/leitungsauskunft');
  }

  function getBaustellenDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return baustellenList.find(r => r.record_id === refId)?.fields.name ?? '—';
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title="Eintrag nicht gefunden"
        action={
          <Button variant="ghost" onClick={() => navigate('/leitungsauskunft')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            Zurück
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/leitungsauskunft')}
      onEdit={() => setEditing(true)}
      backLabel="Zurück"
      editLabel="Bearbeiten"
    >
      <RecordHeader title={record.fields.muffentyp ?? 'Leitungsauskunft'} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          baustelle: baustellenList,
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
        const computedFacts = Object.entries(formEnhancements.computed)
          .map(([key, formula]) => {
            const v = evalComputed(formula, record!.fields as Record<string, unknown>, { lookupLists });
            return v != null
              ? { label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), value: fmtComputed(key, v) }
              : null;
          })
          .filter((f): f is { label: string; value: string } => f !== null);
        return computedFacts.length > 0 ? <RecordKeyFacts items={computedFacts} /> : null;
      })()}

      <RecordSection title="Details" cols={2}>
        <RecordField label="Baustelle" value={getBaustellenDisplayName(record.fields.baustelle)} format="text" />
        <RecordField label="Hausanschluss-Informationen" value={record.fields.hausanschluss_info} format="longtext" className="md:col-span-2" />
        <RecordField label="Hausanschluss-Typ" value={record.fields.hausanschluss_typ} format="pill" />
        <RecordField label="Spannungsebene" value={record.fields.spannungsebene} format="pill" />
        <RecordField label="Muffentyp" value={record.fields.muffentyp} format="text" />
        <RecordField label="Material" value={record.fields.material} format="text" />
        <RecordField label="Leitungsführung und Notizen" value={record.fields.leitungsfuehrung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.LEITUNGSAUSKUNFT} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          Löschen
        </Button>
      </div>

      <LeitungsauskunftDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        baustellenList={baustellenList}
        enablePhotoScan={AI_PHOTO_SCAN['Leitungsauskunft']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Leitungsauskunft']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Leitungsauskunft löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </RecordView>
  );
}
