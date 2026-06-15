import type { Tagesberichte, Baustellen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface TagesberichteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Tagesberichte | null;
  onEdit: (record: Tagesberichte) => void;
  baustellenList: Baustellen[];
}

export function TagesberichteViewDialog({ open, onClose, record, onEdit, baustellenList }: TagesberichteViewDialogProps) {
  function getBaustellenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return baustellenList.find(r => r.record_id === id)?.fields.name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tagesberichte anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Baustelle</Label>
            <p className="text-sm">{getBaustellenDisplayName(record.fields.baustelle)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Berichtsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.berichtsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname Verfasser</Label>
            <p className="text-sm">{record.fields.verfasser_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname Verfasser</Label>
            <p className="text-sm">{record.fields.verfasser_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wetterbedingungen</Label>
            <Badge variant="secondary">{record.fields.wetterbedingungen?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anzahl Mitarbeiter vor Ort</Label>
            <p className="text-sm">{record.fields.mitarbeiter_anzahl ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Durchgeführte Arbeiten</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.durchgefuehrte_arbeiten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besonderheiten des Tages</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.besonderheiten_tag ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächste geplante Schritte</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.naechste_schritte ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Freigabe durch Vorgesetzten erteilt</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.freigabe_vorgesetzter ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.freigabe_vorgesetzter ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkung zur Freigabe</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.freigabe_bemerkung ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.TAGESBERICHTE} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}