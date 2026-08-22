
import {
  Box, Button, Card, CardContent, CircularProgress, IconButton,
  ListItem, ListItemText, Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

interface EntregaDocumentosCardProps {
  documentos: any[];
  loading: boolean;
  adding: boolean;
  thumbnails: Record<number, string>;
  onAddClick: () => void;
  onViewImage: (doc: any) => void;
  onDownload: (doc: any) => void;
  onDelete: (doc: any) => void;
  /** true = variante mobile del BottomSheet (thumbs chicos, 3 columnas). */
  compact?: boolean;
}

/**
 * Card de Imágenes/Documentos de una entrega (Etapa 6.4: antes duplicada
 * entre las ramas mobile y desktop de DeliveryDetailsPanel).
 */
export default function EntregaDocumentosCard({
  documentos, loading, adding, thumbnails,
  onAddClick, onViewImage, onDownload, onDelete, compact = false,
}: EntregaDocumentosCardProps) {
  const imagenes = documentos.filter((d) => d.mimeType?.startsWith('image/'));
  const otros = documentos.filter((d) => !d.mimeType?.startsWith('image/'));

  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={compact ? 1 : 1.5}>
          <Box display="flex" alignItems="center" gap={compact ? 0.5 : 1}>
            <PhotoCameraIcon sx={{ fontSize: compact ? 16 : 18, color: 'text.secondary' }} />
            {compact ? (
              <Typography variant="caption" color="text.secondary">Imágenes / Documentos</Typography>
            ) : (
              <Typography variant="subtitle2">Imágenes / Documentos</Typography>
            )}
          </Box>
          <Button
            size="small"
            startIcon={adding ? <CircularProgress size={compact ? 12 : 14} /> : <PhotoCameraIcon />}
            onClick={onAddClick}
            disabled={adding}
          >
            {adding ? 'Subiendo...' : 'Agregar fotos'}
          </Button>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={compact ? 1 : 2}>
            <CircularProgress size={compact ? 20 : 24} />
          </Box>
        ) : (
          <>
            {imagenes.length > 0 && (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: compact ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
                gap: compact ? 0.75 : 1,
                mb: compact ? 1 : 1.5,
              }}>
                {imagenes.map((doc) => (
                  <Box
                    key={doc.id}
                    onClick={() => onViewImage(doc)}
                    sx={{
                      position: 'relative', borderRadius: 1, overflow: 'hidden',
                      border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                      ...(compact ? {} : { '&:hover': { opacity: 0.85 } }),
                    }}
                  >
                    <Box sx={{ height: compact ? 64 : 80, overflow: 'hidden', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {thumbnails[doc.id] ? (
                        <img src={thumbnails[doc.id]} alt={doc.originalName ?? doc.fileName} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <PhotoCameraIcon color="action" fontSize={compact ? 'small' : 'medium'} />
                      )}
                    </Box>
                    <Typography variant="caption" noWrap sx={{ display: 'block', px: 0.5, pb: compact ? 0.25 : 0.5, ...(compact ? { fontSize: 10 } : {}) }}>
                      {doc.originalName ?? doc.fileName}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                      sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.45)', color: 'white', p: '2px' }}
                    >
                      <CloseIcon sx={{ fontSize: compact ? 12 : 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            {otros.map((doc) => (
              <ListItem
                key={doc.id}
                disableGutters={compact}
                secondaryAction={
                  <Box display="flex">
                    <IconButton size="small" onClick={() => onDownload(doc)}><DownloadIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => onDelete(doc)}><CloseIcon fontSize="small" /></IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={doc.descripcion || doc.originalName || doc.fileName}
                  secondary={doc.fechaCreacion ? new Date(doc.fechaCreacion).toLocaleString() : undefined}
                  primaryTypographyProps={compact ? { variant: 'body2' } : undefined}
                  secondaryTypographyProps={compact ? { variant: 'caption' } : undefined}
                />
              </ListItem>
            ))}
            {documentos.length === 0 && (
              <Typography variant="body2" color="text.secondary">Sin documentos adjuntos.</Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
