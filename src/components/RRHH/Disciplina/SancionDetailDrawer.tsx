import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Gavel as GavelIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  PersonOutline as PersonOutlineIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import DocumentManager from '../../shared/DocumentManager';
import { sancionApi } from '../../../api/services/sancionApi';
import {
  CATEGORIAS_DOC_SANCION,
  ESTADO_SANCION_COLOR,
  ESTADO_SANCION_LABEL,
  TIPO_SANCION_COLOR,
  TIPO_SANCION_LABEL,
  type SancionDTO,
} from '../../../types/sancion.types';

interface SancionDetailDrawerProps {
  open: boolean;
  sancion: SancionDTO | null;
  onClose: () => void;
  onEdit?: (s: SancionDTO) => void;
  onDelete?: (s: SancionDTO) => void;
  onNavigateToEmpleado?: (empleadoId: number) => void;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{ color: 'text.secondary', mt: 0.3 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Typography>
      <Box>{children}</Box>
    </Box>
  </Stack>
);

const SancionDetailDrawer: React.FC<SancionDetailDrawerProps> = ({
  open, sancion, onClose, onEdit, onDelete, onNavigateToEmpleado,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!sancion) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: isMobile ? '100vw' : 480, p: 3 }} />
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: isMobile ? '100vw' : 520 } }}
    >
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <GavelIcon />
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Sanción #{sancion.id}</Typography>
              <Typography variant="h6" fontWeight={700}>
                {TIPO_SANCION_LABEL[sancion.tipo]}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1} mt={1.5}>
          <Chip
            label={ESTADO_SANCION_LABEL[sancion.estado]}
            color={ESTADO_SANCION_COLOR[sancion.estado]}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 600 }}
          />
          {sancion.dias > 0 && (
            <Chip
              label={`${sancion.dias} día${sancion.dias === 1 ? '' : 's'}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 600 }}
            />
          )}
        </Stack>
      </Box>

      <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
        <Stack spacing={2.5}>
          {/* Empleado */}
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
              bgcolor: 'grey.50', borderRadius: 2, cursor: onNavigateToEmpleado ? 'pointer' : 'default',
              '&:hover': onNavigateToEmpleado ? { bgcolor: 'grey.100' } : undefined,
            }}
            onClick={() => onNavigateToEmpleado?.(sancion.empleadoId)}
          >
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {sancion.empleadoNombre[0]}{sancion.empleadoApellido[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {sancion.empleadoApellido}, {sancion.empleadoNombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                DNI {sancion.empleadoDni}
                {sancion.puesto ? ` · ${sancion.puesto}` : ''}
              </Typography>
            </Box>
          </Box>

          {/* Datos */}
          <Stack spacing={2}>
            <InfoRow icon={<CalendarIcon fontSize="small" />} label="Fecha">
              <Typography fontWeight={600}>{dayjs(sancion.fecha).format('DD/MM/YYYY')}</Typography>
            </InfoRow>
            <InfoRow icon={<GavelIcon fontSize="small" />} label="Tipo">
              <Chip
                size="small"
                label={TIPO_SANCION_LABEL[sancion.tipo]}
                color={TIPO_SANCION_COLOR[sancion.tipo]}
              />
            </InfoRow>
            {(sancion.departamento || sancion.sector) && (
              <InfoRow icon={<DescriptionIcon fontSize="small" />} label="Ubicación organizacional">
                <Typography variant="body2">
                  {sancion.departamento ?? '—'}
                  {sancion.sector ? ` / ${sancion.sector}` : ''}
                </Typography>
              </InfoRow>
            )}
            <InfoRow icon={<DescriptionIcon fontSize="small" />} label="Motivo del hecho">
              <Typography variant="body2">{sancion.motivo}</Typography>
            </InfoRow>
            {sancion.motivoAcumulado && (
              <InfoRow icon={<DescriptionIcon fontSize="small" />} label="Motivo acumulado">
                <Chip size="small" variant="outlined" label={sancion.motivoAcumulado} />
              </InfoRow>
            )}
            {sancion.pedidaPor && (
              <InfoRow icon={<PersonIcon fontSize="small" />} label="Solicitada por">
                <Typography variant="body2">{sancion.pedidaPor}</Typography>
              </InfoRow>
            )}
            {sancion.observaciones && (
              <InfoRow icon={<DescriptionIcon fontSize="small" />} label="Observaciones RRHH">
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {sancion.observaciones}
                </Typography>
              </InfoRow>
            )}
            {sancion.creadoPor && (
              <InfoRow icon={<PersonOutlineIcon fontSize="small" />} label="Registrado por">
                <Typography variant="caption" color="text.secondary">
                  {sancion.creadoPor}
                  {sancion.fechaCreacion ? ` · ${dayjs(sancion.fechaCreacion).format('DD/MM/YYYY HH:mm')}` : ''}
                </Typography>
              </InfoRow>
            )}
          </Stack>

          <Divider />

          {/* Documentos */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="primary">
              ARCHIVOS ADJUNTOS
            </Typography>
            <DocumentManager
              entityId={sancion.id}
              categorias={CATEGORIAS_DOC_SANCION}
              onUpload={async (file, categoria, descripcion) => {
                await sancionApi.uploadDocumento(sancion.id, file, categoria, descripcion);
              }}
              onDownload={async (id, fileName) => {
                await sancionApi.downloadAndSave(sancion.id, id, fileName);
              }}
              onDelete={async (id) => {
                await sancionApi.deleteDocumento(sancion.id, id);
              }}
              onLoad={async () => {
                const docs = await sancionApi.getDocumentos(sancion.id);
                return docs.map(d => ({
                  id: d.id,
                  nombreArchivo: d.nombreOriginal,
                  tipoArchivo: d.mimeType ?? '',
                  tamanioBytes: d.sizeBytes,
                  descripcion: d.descripcion,
                  categoria: d.categoria,
                  fechaSubida: d.fechaSubida,
                  subidoPor: d.subidoPor ?? '',
                }));
              }}
            />
          </Box>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onDelete && (
            <Tooltip title="Eliminar sanción">
              <Button
                color="error" variant="outlined" startIcon={<DeleteIcon />}
                onClick={() => onDelete(sancion)}
              >
                Eliminar
              </Button>
            </Tooltip>
          )}
          {onEdit && (
            <Button
              variant="contained" startIcon={<EditIcon />}
              onClick={() => onEdit(sancion)}
            >
              Editar
            </Button>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};

export default SancionDetailDrawer;
