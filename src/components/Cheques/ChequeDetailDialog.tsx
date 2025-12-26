import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Alert,
  TextField,
  Box,
  Chip,
} from '@mui/material';
import { chequeApi } from '../../api/services/chequeApi';
import type { Cheque, CambioEstadoChequeDTO } from '../../types';
import ChequeEstadoChip from './ChequeEstadoChip';
import ChequeTipoChip from './ChequeTipoChip';

interface Props {
  open: boolean;
  cheque: Cheque | null;
  onClose: () => void;
  onUpdate: () => void;
}

const ChequeDetailDialog: React.FC<Props> = ({ open, cheque, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [showRechazoInput, setShowRechazoInput] = useState(false);
  const [showAnulacionInput, setShowAnulacionInput] = useState(false);

  if (!cheque) return null;

  const handleDepositar = async () => {
    try {
      setLoading(true);
      setError(null);
      await chequeApi.depositar(cheque.id);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error depositando cheque:', err);
      setError(err.response?.data?.message || 'Error al depositar el cheque');
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = async () => {
    try {
      setLoading(true);
      setError(null);
      await chequeApi.cobrar(cheque.id);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error cobrando cheque:', err);
      setError(err.response?.data?.message || 'Error al cobrar el cheque');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!motivoRechazo.trim()) {
      setError('Debe ingresar un motivo de rechazo');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await chequeApi.rechazar(cheque.id, motivoRechazo);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error rechazando cheque:', err);
      setError(err.response?.data?.message || 'Error al rechazar el cheque');
    } finally {
      setLoading(false);
      setShowRechazoInput(false);
      setMotivoRechazo('');
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      setError('Debe ingresar un motivo de anulación');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await chequeApi.anular(cheque.id, motivoAnulacion);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error anulando cheque:', err);
      setError(err.response?.data?.message || 'Error al anular el cheque');
    } finally {
      setLoading(false);
      setShowAnulacionInput(false);
      setMotivoAnulacion('');
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    try {
      setLoading(true);
      setError(null);

      const cambio: CambioEstadoChequeDTO = {
        nuevoEstado: nuevoEstado as any,
      };

      await chequeApi.cambiarEstado(cheque.id, cambio);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error cambiando estado:', err);
      setError(err.response?.data?.message || 'Error al cambiar el estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Detalle del Cheque</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Tipo
            </Typography>
            <ChequeTipoChip tipo={cheque.tipo} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Estado
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChequeEstadoChip estado={cheque.estado} />
              {cheque.vencido && <Chip label="Vencido" color="error" size="small" />}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Número de Cheque
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {cheque.numeroCheque}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Banco
            </Typography>
            <Typography variant="body1">{cheque.bancoNombre || '-'}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Monto
            </Typography>
            <Typography variant="h6" color="primary">
              ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Fecha de Emisión
            </Typography>
            <Typography variant="body1">
              {new Date(cheque.fechaEmision).toLocaleDateString('es-AR')}
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Fecha de Cobro
            </Typography>
            <Typography variant="body1">
              {new Date(cheque.fechaCobro).toLocaleDateString('es-AR')}
              {cheque.diasParaCobro !== undefined && cheque.diasParaCobro > 0 && (
                <Typography variant="caption" display="block" color="textSecondary">
                  (En {cheque.diasParaCobro} días)
                </Typography>
              )}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Titular
            </Typography>
            <Typography variant="body1">{cheque.titular}</Typography>
            {cheque.cuitTitular && (
              <Typography variant="caption" color="textSecondary">
                CUIT: {cheque.cuitTitular}
              </Typography>
            )}
          </Grid>

          {cheque.clienteNombre && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Cliente
              </Typography>
              <Typography variant="body1">{cheque.clienteNombre}</Typography>
            </Grid>
          )}

          {cheque.proveedorNombre && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Proveedor
              </Typography>
              <Typography variant="body1">{cheque.proveedorNombre}</Typography>
            </Grid>
          )}

          {cheque.endosado && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Endosado a
              </Typography>
              <Typography variant="body1">{cheque.endosadoA || 'Sí (sin especificar)'}</Typography>
            </Grid>
          )}

          {cheque.numeroCuenta && (
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Número de Cuenta
              </Typography>
              <Typography variant="body1">{cheque.numeroCuenta}</Typography>
            </Grid>
          )}

          {cheque.cbu && (
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                CBU
              </Typography>
              <Typography variant="body1">{cheque.cbu}</Typography>
            </Grid>
          )}

          {cheque.fechaDeposito && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Fecha de Depósito
              </Typography>
              <Typography variant="body1">
                {new Date(cheque.fechaDeposito).toLocaleDateString('es-AR')}
              </Typography>
            </Grid>
          )}

          {cheque.fechaCobrado && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Fecha de Cobro Efectivo
              </Typography>
              <Typography variant="body1">
                {new Date(cheque.fechaCobrado).toLocaleDateString('es-AR')}
              </Typography>
            </Grid>
          )}

          {cheque.fechaRechazo && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Fecha de Rechazo
              </Typography>
              <Typography variant="body1">
                {new Date(cheque.fechaRechazo).toLocaleDateString('es-AR')}
              </Typography>
            </Grid>
          )}

          {cheque.motivoRechazo && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Motivo de Rechazo
              </Typography>
              <Typography variant="body1" color="error">
                {cheque.motivoRechazo}
              </Typography>
            </Grid>
          )}

          {cheque.observaciones && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Observaciones
              </Typography>
              <Typography variant="body1">{cheque.observaciones}</Typography>
            </Grid>
          )}

          {/* Input para motivo de rechazo */}
          {showRechazoInput && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo del Rechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                multiline
                rows={2}
                required
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleRechazar}
                  variant="contained"
                  color="error"
                  disabled={loading || !motivoRechazo.trim()}
                  size="small"
                >
                  Confirmar Rechazo
                </Button>
                <Button
                  onClick={() => {
                    setShowRechazoInput(false);
                    setMotivoRechazo('');
                  }}
                  size="small"
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          )}

          {/* Input para motivo de anulación */}
          {showAnulacionInput && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo de Anulación"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                multiline
                rows={2}
                required
              />
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleAnular}
                  variant="contained"
                  color="warning"
                  disabled={loading || !motivoAnulacion.trim()}
                  size="small"
                >
                  Confirmar Anulación
                </Button>
                <Button
                  onClick={() => {
                    setShowAnulacionInput(false);
                    setMotivoAnulacion('');
                  }}
                  size="small"
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        {/* Acciones basadas en el estado actual */}
        {cheque.estado === 'EN_CARTERA' && cheque.puedeDepositarse && (
          <Button
            onClick={handleDepositar}
            variant="contained"
            color="info"
            disabled={loading || showRechazoInput || showAnulacionInput}
          >
            Depositar
          </Button>
        )}
        {cheque.estado === 'DEPOSITADO' && cheque.puedeCobrarse && (
          <Button
            onClick={handleCobrar}
            variant="contained"
            color="success"
            disabled={loading || showRechazoInput || showAnulacionInput}
          >
            Marcar como Cobrado
          </Button>
        )}
        {(cheque.estado === 'EN_CARTERA' || cheque.estado === 'DEPOSITADO') && !showRechazoInput && !showAnulacionInput && (
          <Button
            onClick={() => setShowRechazoInput(true)}
            variant="outlined"
            color="error"
            disabled={loading}
          >
            Rechazar
          </Button>
        )}
        {cheque.estado !== 'ANULADO' && cheque.estado !== 'COBRADO' && !showRechazoInput && !showAnulacionInput && (
          <Button
            onClick={() => setShowAnulacionInput(true)}
            variant="outlined"
            color="warning"
            disabled={loading}
          >
            Anular
          </Button>
        )}
        <Button onClick={onClose} disabled={loading}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChequeDetailDialog;
