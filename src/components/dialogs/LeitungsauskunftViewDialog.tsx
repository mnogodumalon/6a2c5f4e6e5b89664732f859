import type { Leitungsauskunft, Baustellen } from '@/types/app';
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
import { IconPencil, IconFileText } from '@tabler/icons-react';

interface LeitungsauskunftViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Leitungsauskunft | null;
  onEdit: (record: Leitungsauskunft) => void;
  baustellenList: Baustellen[];
}

export function LeitungsauskunftViewDialog({ open, onClose, record, onEdit, baustellenList }: LeitungsauskunftViewDialogProps) {
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
          <DialogTitle>Leitungsauskunft anzeigen</DialogTitle>
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
            <Label className="text-xs text-muted-foreground">Hausanschluss-Informationen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.hausanschluss_info ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hausanschluss-Typ</Label>
            <Badge variant="secondary">{record.fields.hausanschluss_typ?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Spannungsebene</Label>
            <Badge variant="secondary">{record.fields.spannungsebene?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Muffentyp</Label>
            <p className="text-sm">{record.fields.muffentyp ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Material</Label>
            <p className="text-sm">{record.fields.material ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Leitungsführung und Notizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.leitungsfuehrung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Leitungspläne und Unterlagen</Label>
            {record.fields.leitungsplaene ? (
              <MediaThumbnail src={record.fields.leitungsplaene} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.LEITUNGSAUSKUNFT} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}