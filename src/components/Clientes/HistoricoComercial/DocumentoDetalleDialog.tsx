import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountTree as ChainIcon,
} from '@mui/icons-material';
import type {
  DocumentoComercial,
  DetalleDocumento,
} from '../../../types';
import { documentoApi } from '../../../api/documentoApi';
import {
  formatARS,
  formatFechaLarga,
  formatMetodoPago,
  getEstadoChipProps,
  getTipoChipProps,
} from './utils';
import CadenaDocumentosStepper from './CadenaDocumentosStepper';

interface DocumentoDetalleDialogProps {
  open: boolean;
  documento: DocumentoComercial | null;
  onClose: () => void;
}

/**
 * Construye la descripción legible para una línea de detalle.
 */
function buildDescripcion(d: DetalleDocumento): string {
  if (d.tipoItem === 'PRODUCTO') {
    return d.productoNombre || d.descripcion || 'Producto';
  }
  // EQUIPO
  const partes = [
    d.recetaNombre,
    d.recetaModelo,
    d.medida,
    d.color,
  ].filter(Boolean);
  if (partes.length > 0) return partes.join(' · ');
  return d.descripcionEquipo || d.descripcion || 'Equipo';
}

/**
 * Drill-down de un documento comercial: cabecera, líneas de detalle, totales,
 * y stepper con la cadena Presupuesto -> Nota Pedido -> Factura.
 */
const DocumentoDetalleDialog: React.FC<DocumentoDetalleDialogProps> = ({
  open,
  documento,
  onClose,
}) => {
  const [docActual, setDocActual] = useState<DocumentoComercial | null>(null);
  const [cadena, setCadena] = useState<DocumentoComercial[]>([]);
  const [loadingCadena, setLoadingCadena] = useState(false);
  const [errorCadena, setErrorCadena] = useState<string | null>(null);
  const [mostrarCadena, setMostrarCadena] = useState(false);

  useEffect(() => {
    if (open && documento) {
      setDocActual(documento);
      setMostrarCadena(false);
      setCadena([]);
      setErrorCadena(null);
    }
  }, [open, documento]);

  const cargarCadena = async (docId: number) => {
    try {
      setLoadingCadena(true);
      setErrorCadena(null);
      const data = await documentoApi.getCadena(docId);
      setCadena(data);
      setMostrarCadena(true);
    } catch (err) {
      console.error(err);
      setErrorCadena('No se pudo cargar la cadena de documentos');
    } finally {
      setLoadingCadena(false);
    }
  };

  const handleSelectFromCadena = (doc: DocumentoComercial) => {
    setDocActual(doc);
  };

  const detalles: DetalleDocumento[] = useMemo(
    () => docActual?.detalles ?? [],
    [docActual],
  );

  const tienePosibleCadena =
    !!docActual?.documentoOrigenId || !!docActual?.documentoSiguienteId;

  if (!docActual) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  const tipoProps = getTipoChipProps(docActual.tipoDocumento);
  const estadoProps = getEstadoChipProps(docActual.estado);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            label={tipoProps.label}
            color={tipoProps.color === 'default' ? undefined : tipoProps.color}
            size="small"
          />
          <Typography variant="h6" component="span">
            {docActual.numeroDocumento}
          </Typography>
          <Chip
            label={estadoProps.label}
            color={estadoProps.color === 'default' ? undefined : estadoProps.color}
            size="small"
            variant="outlined"
          />
        </Stack>
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Cabecera con metadata */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Fecha de emisión
            </Typography>
            <Typography variant="body2">
              {formatFechaLarga(docActual.fechaEmision)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Vencimiento
            </Typography>
            <Typography variant="body2">
              {formatFechaLarga(docActual.fechaVencimiento)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Método de pago
            </Typography>
            <Typography variant="body2">
              {formatMetodoPago(docActual.metodoPago)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Cliente
            </Typography>
            <Typography variant="body2">
              {docActual.clienteNombre || '-'}
            </Typography>
          </Box>
          {docActual.usuarioCreadorPresupuestoNombre && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Creado por
              </Typography>
              <Typography variant="body2">
                {docActual.usuarioCreadorPresupuestoNombre}
              </Typography>
            </Box>
          )}
          {docActual.usuarioFacturadorNombre && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Facturado por
              </Typography>
              <Typography variant="body2">
                {docActual.usuarioFacturadorNombre}
              </Typography>
            </Box>
          )}
        </Box>

        {docActual.observaciones && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {docActual.observaciones}
          </Alert>
        )}

        {/* Cadena */}
        {tienePosibleCadena && (
          <Box sx={{ mb: 2 }}>
            {!mostrarCadena ? (
              <Button
                variant="outlined"
                startIcon={<ChainIcon />}
                onClick={() => cargarCadena(docActual.id)}
                disabled={loadingCadena}
              >
                {loadingCadena ? 'Cargando cadena...' : 'Ver cadena completa'}
              </Button>
            ) : (
              <CadenaDocumentosStepper
                cadena={cadena}
                currentId={docActual.id}
                onSelect={handleSelectFromCadena}
              />
            )}
            {errorCadena && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errorCadena}
              </Alert>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Detalles */}
        <Typography variant="subtitle1" gutterBottom>
          Ítems ({detalles.length})
        </Typography>

        {detalles.length === 0 ? (
          <Alert severity="info">Este documento no tiene ítems cargados.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Precio unit.</TableCell>
                  <TableCell align="right">Descuento</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalles.map((d) => {
                  const heladeras =
                    docActual.tipoDocumento === 'FACTURA' &&
                    d.equiposNumerosHeladera &&
                    d.equiposNumerosHeladera.length > 0
                      ? d.equiposNumerosHeladera
                      : null;
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Chip
                          label={d.tipoItem === 'EQUIPO' ? 'Equipo' : 'Producto'}
                          size="small"
                          color={d.tipoItem === 'EQUIPO' ? 'secondary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {buildDescripcion(d)}
                          </Typography>
                          {heladeras && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Nº heladera: {heladeras.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{d.cantidad}</TableCell>
                      <TableCell align="right">
                        {formatARS(d.precioUnitario)}
                      </TableCell>
                      <TableCell align="right">
                        {d.descuento ? formatARS(d.descuento) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {formatARS(d.subtotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Totales */}
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Box sx={{ minWidth: 280 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2">{formatARS(docActual.subtotal)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                IVA
              </Typography>
              <Typography variant="body2">{formatARS(docActual.iva)}</Typography>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="subtitle1" fontWeight={700}>
                {formatARS(docActual.total)}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentoDetalleDialog;
