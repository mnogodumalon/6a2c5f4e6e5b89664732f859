import { useState } from 'react';
import type { Fotodokumentation, Baustellen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText, IconChevronDown } from '@tabler/icons-react';
import { GeoMapPicker } from '@/components/GeoMapPicker';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface FotodokumentationViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Fotodokumentation | null;
  onEdit: (record: Fotodokumentation) => void;
  baustellenList: Baustellen[];
}

export function FotodokumentationViewDialog({ open, onClose, record, onEdit, baustellenList }: FotodokumentationViewDialogProps) {
  const [showCoords, setShowCoords] = useState(false);

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
          <DialogTitle>Fotodokumentation anzeigen</DialogTitle>
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
            <Label className="text-xs text-muted-foreground">Fotokategorie</Label>
            <Badge variant="secondary">{record.fields.fotokategorie?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aufnahmedatum und -uhrzeit</Label>
            <p className="text-sm">{formatDate(record.fields.aufnahmedatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foto</Label>
            {record.fields.foto ? (
              <MediaThumbnail src={record.fields.foto} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">GPS-Koordinaten</Label>
            {record.fields.gps_koordinaten?.info && (
              <p className="text-sm text-muted-foreground break-words whitespace-normal">{record.fields.gps_koordinaten.info}</p>
            )}
            {record.fields.gps_koordinaten?.lat != null && record.fields.gps_koordinaten?.long != null && (
              <GeoMapPicker
                lat={record.fields.gps_koordinaten.lat}
                lng={record.fields.gps_koordinaten.long}
                readOnly
              />
            )}
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors" onClick={() => setShowCoords(v => !v)}>
              {showCoords ? 'Koordinaten verbergen' : 'Koordinaten anzeigen'}
              <IconChevronDown className={`h-3 w-3 transition-transform ${showCoords ? "rotate-180" : ""}`} />
            </button>
            {showCoords && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-xs text-muted-foreground">Breitengrad:</span> {record.fields.gps_koordinaten?.lat?.toFixed(6) ?? '—'}</div>
                <div><span className="text-xs text-muted-foreground">Längengrad:</span> {record.fields.gps_koordinaten?.long?.toFixed(6) ?? '—'}</div>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.foto_beschreibung ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.FOTODOKUMENTATION} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}