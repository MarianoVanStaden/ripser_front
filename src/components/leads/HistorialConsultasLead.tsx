import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  List,
  ListItemButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  RequestQuote as RequestQuoteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { DocumentoComercial, DetalleDocumento } from '../../types';
import { documentoApi } from '../../api/services/documentoApi';
import { EstadoLeadEnum } from '../../types/lead.types';
import DocumentoDetalleDialog from '../Clientes/HistoricoComercial/DocumentoDetalleDialog';
import {
  formatARS,
  formatFechaCorta,
  getEstadoChipProps,
  getTipoChipProps,
} from '../Clientes/HistoricoComercial/utils';

interface HistorialConsultasLeadProps {
  leadId: number;
  estadoLead?: EstadoLeadEnum;
  clienteIdConvertido?: number;
}

const VISIBLES_INICIAL = 5;

/**
 * Etiqueta legible del ítem de detalle: modelo del equipo si existe,
 * si no el nombre de receta/producto o la descripción snapshot.
 */
function etiquetaDetalle(d: DetalleDocumento): string {
  return (
    d.recetaModelo ||
    d.recetaNombre ||
    d.productoNombre ||
    d.descripcionEquipo ||
    d.descripcion ||
    'Otro'
  );
}

function esItemPresupuestable(d: DetalleDocumento): boolean {
  return d.tipoItem === 'EQUIPO' || d.tipoItem === 'PRODUCTO';
}

interface EquipoConsultado {
  etiqueta: string;
  cantidad: number;
}

/**
 * Agrega los detalles de todos los presupuestos por etiqueta (modelo),
 * sumando cantidades. Responde "qué equipos se le presupuestaron y cuántos".
 */
function agregarEquiposConsultados(docs: DocumentoComercial[]): EquipoConsultado[] {
  const porEtiqueta = new Map<string, number>();
  for (const doc of docs) {
    for (const d of doc.detalles ?? []) {
      if (!esItemPresupuestable(d)) continue;
      const etiqueta = etiquetaDetalle(d);
      porEtiqueta.set(etiqueta, (porEtiqueta.get(etiqueta) ?? 0) + (d.cantidad ?? 0));
    }
  }
  return [...porEtiqueta.entries()]
    .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

function resumenItems(doc: DocumentoComercial): string {
  return (doc.detalles ?? [])
    .filter(esItemPresupuestable)
    .map((d) => `${d.cantidad}× ${etiquetaDetalle(d)}`)
    .join(', ');
}

/**
 * Historial de consultas del lead: presupuestos que se le hicieron (con fecha,
 * estado, total y conversión) y equipos consultados agregados por modelo.
 * Autocontenido: fetchea sus propios datos, un error acá no rompe la página.
 */
export const HistorialConsultasLead = ({
  leadId,
  estadoLead,
  clienteIdConvertido,
}: HistorialConsultasLeadProps) => {
  const navigate = useNavigate();
  const [presupuestos, setPresupuestos] = useState<DocumentoComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentoSeleccionado, setDocumentoSeleccionado] =
    useState<DocumentoComercial | null>(null);
  const [verTodos, setVerTodos] = useState(false);

  const esConvertido = estadoLead === EstadoLeadEnum.CONVERTIDO;

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await documentoApi.getByLead(leadId);
      const soloPresupuestos = docs
        .filter((d) => d.tipoDocumento === 'PRESUPUESTO')
        .sort(
          (a, b) =>
            new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime()
        );
      setPresupuestos(soloPresupuestos);
    } catch (err) {
      console.error('Error al cargar historial de consultas del lead:', err);
      setError('No se pudo cargar el historial de consultas');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const equiposConsultados = useMemo(
    () => agregarEquiposConsultados(presupuestos),
    [presupuestos]
  );

  const totalPresupuestado = useMemo(
    () => presupuestos.reduce((sum, p) => sum + (p.total ?? 0), 0),
    [presupuestos]
  );

  const ultimaConsulta = presupuestos[0]?.fechaEmision;
  const visibles = verTodos ? presupuestos : presupuestos.slice(0, VISIBLES_INICIAL);

  const handleCrearPresupuesto = () => {
    navigate(`/ventas/presupuestos?leadId=${leadId}`);
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RequestQuoteIcon color="primary" />
            <Typography variant="h6">Historial de Consultas</Typography>
            {!loading && !error && (
              <Chip label={presupuestos.length} size="small" color="primary" />
            )}
          </Box>
          {!esConvertido && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCrearPresupuesto}
            >
              Presupuesto
            </Button>
          )}
        </Box>
        <Divider sx={{ my: 2 }} />

        {loading && (
          <Box>
            <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={48} />
          </Box>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={cargar}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!loading && !error && presupuestos.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {esConvertido ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Los presupuestos se migraron a la ficha del cliente.
                </Typography>
                {clienteIdConvertido && (
                  <Link
                    component="button"
                    variant="body2"
                    sx={{ mt: 1 }}
                    onClick={() =>
                      navigate(`/clientes/detalle/${clienteIdConvertido}`)
                    }
                  >
                    Ver ficha del cliente
                  </Link>
                )}
              </>
            ) : (
              <>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Sin presupuestos todavía
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Creá el primer presupuesto para este lead
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCrearPresupuesto}
                >
                  Crear presupuesto
                </Button>
              </>
            )}
          </Box>
        )}

        {!loading && !error && presupuestos.length > 0 && (
          <>
            <Stack
              direction="row"
              divider={<Divider orientation="vertical" flexItem />}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Presupuestos
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {presupuestos.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total presupuestado
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatARS(totalPresupuestado)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Última consulta
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatFechaCorta(ultimaConsulta)}
                </Typography>
              </Box>
            </Stack>

            {equiposConsultados.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Equipos consultados
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {equiposConsultados.map((eq) => (
                    <Chip
                      key={eq.etiqueta}
                      label={`${eq.etiqueta} × ${eq.cantidad}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}

            <List disablePadding>
              {visibles.map((doc) => {
                const estadoChip = getEstadoChipProps(doc.estado);
                const items = resumenItems(doc);
                return (
                  <ListItemButton
                    key={doc.id}
                    onClick={() => setDocumentoSeleccionado(doc)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      border: 1,
                      borderColor: 'divider',
                      display: 'block',
                      px: 1.5,
                      py: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="bold" noWrap>
                          {doc.numeroDocumento}
                        </Typography>
                        <Chip
                          label={estadoChip.label}
                          color={estadoChip.color}
                          size="small"
                        />
                        {doc.documentoSiguienteTipo && (
                          <Chip
                            label={`→ ${getTipoChipProps(doc.documentoSiguienteTipo).label}`}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ flexShrink: 0 }}>
                        {formatARS(doc.total)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {formatFechaCorta(doc.fechaEmision)}
                      {items ? ` · ${items}` : ''}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </List>

            {presupuestos.length > VISIBLES_INICIAL && (
              <Button
                size="small"
                onClick={() => setVerTodos((v) => !v)}
                sx={{ mt: 0.5 }}
              >
                {verTodos ? 'Ver menos' : `Ver todos (${presupuestos.length})`}
              </Button>
            )}
          </>
        )}

        <DocumentoDetalleDialog
          open={documentoSeleccionado !== null}
          documento={documentoSeleccionado}
          onClose={() => setDocumentoSeleccionado(null)}
        />
      </CardContent>
    </Card>
  );
};
