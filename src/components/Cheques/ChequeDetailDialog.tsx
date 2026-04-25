 
import React, { useState, useEffect } from 'react';
 
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
 
  CircularProgress,
 
} from '@mui/material';
 
import { SwapHoriz as SwapHorizIcon } from '@mui/icons-material';
 
import { chequeApi } from '../../api/services/chequeApi';
 
import type { Cheque, CadenaEndososDTO, HistorialEstadoChequeDTO } from '../../types';
 
import ChequeEstadoChip from './ChequeEstadoChip';
 
import ChequeTipoChip from './ChequeTipoChip';
 
import ChequeEndososChain from './ChequeEndososChain';
 
import EndosarChequeDialog from './EndosarChequeDialog';
 

 
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
 
  const [endososChain, setEndososChain] = useState<CadenaEndososDTO | null>(null);
 
  const [loadingEndosos, setLoadingEndosos] = useState(false);
 
  const [showEndosarDialog, setShowEndosarDialog] = useState(false);
 
  const [historial, setHistorial] = useState<HistorialEstadoChequeDTO[]>([]);
 

 
   
 
  useEffect(() => {
 
    if (open && cheque) {
 
      if (cheque.tipo === 'TERCEROS') loadEndosos();
 
      loadHistorial();
 
    }
 
    if (!open) {
 
      setHistorial([]);
 
      setEndososChain(null);
 
    }
/* eslint-disable react-hooks/exhaustive-deps */
  }, [open, cheque]);
 

 
  const loadEndosos = async () => {
 
    if (!cheque) return;
 
    try {
 
      setLoadingEndosos(true);
 
      const chain = await chequeApi.getCadenaEndosos(cheque.id);
 
      setEndososChain(chain);
 
    } catch (err) {
 
      console.error('Error loading endorsement chain:', err);
 
    } finally {
 
      setLoadingEndosos(false);
 
    }
 
  };
 

 
  const loadHistorial = async () => {
 
    if (!cheque) return;
 
    try {
 
      const data = await chequeApi.getHistorialEstados(cheque.id);
 
      setHistorial(data);
 
    } catch (err) {
 
      console.error('Error loading historial:', err);
 
    }
 
  };
 

 
  const handleEndosarSuccess = async () => {
 
    setShowEndosarDialog(false);
 
    await loadEndosos();
 
    onUpdate();
 
  };
 

 
  if (!cheque) return null;
 

 
  const handleDepositar = async () => {
 
    try {
 
      setLoading(true);
 
      setError(null);
 
      await chequeApi.depositar(cheque.id);
 
      onUpdate();
 
      onClose();
/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      console.error('Error anulando cheque:', err);
 
      setError(err.response?.data?.message || 'Error al anular el cheque');
 
    } finally {
 
      setLoading(false);
 
      setShowAnulacionInput(false);
 
      setMotivoAnulacion('');
 
    }
 
  };
 

 
  return (
 
    <>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <DialogTitle>Detalle del Cheque</DialogTitle>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {error && (
 
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {error}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Alert>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid container spacing={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Tipo
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <ChequeTipoChip tipo={cheque.tipo} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Estado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <ChequeEstadoChip estado={cheque.estado} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {cheque.vencido && <Chip label="Vencido" color="error" size="small" />}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Divider />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Número de Cheque
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {cheque.numeroCheque}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Banco
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.bancoNombre || '-'}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {cheque.esEcheq && (
 
                <Chip label="E-Cheq" size="small" variant="outlined" color="info" />
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Monto
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="h6" color="primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Fecha de Emisión
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {new Date(cheque.fechaEmision).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Fecha de Cobro
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {new Date(cheque.fechaCobro).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {cheque.diasParaCobro !== undefined && cheque.diasParaCobro > 0 && (
 
                <Typography variant="caption" display="block" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  (En {cheque.diasParaCobro} días)
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Typography>
 
              )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              Titular
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Typography variant="body1">{cheque.titular}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            {cheque.cuitTitular && (
 
              <Typography variant="caption" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                CUIT: {cheque.cuitTitular}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
 
            )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.clienteNombre && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Cliente
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.clienteNombre}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.proveedorNombre && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Proveedor
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.proveedorNombre}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.endosado && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Endosado a
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.endosadoA || 'Sí (sin especificar)'}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.numeroCuenta && (
 
            <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Número de Cuenta
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.numeroCuenta}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.cbu && (
 
            <Grid item xs={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                CBU
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.cbu}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.fechaDeposito && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Fecha de Depósito
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {new Date(cheque.fechaDeposito).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.fechaCobrado && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Fecha de Cobro Efectivo
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {new Date(cheque.fechaCobrado).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.fechaRechazo && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Fecha de Rechazo
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {new Date(cheque.fechaRechazo).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.motivoRechazo && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Motivo de Rechazo
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1" color="error">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {cheque.motivoRechazo}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.observaciones && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Observaciones
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="body1">{cheque.observaciones}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {historial.length > 0 && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Divider />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {historial.length > 0 && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="subtitle2" gutterBottom>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Historial
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {historial.map((entry, index) => (
 
                  <Box
 
                    key={entry.id ?? index}
 
                    sx={{
 
                      display: 'flex',
 
                      alignItems: 'flex-start',
 
                      gap: 1,
 
                      py: 0.5,
 
                      borderLeft: '2px solid',
 
                      borderColor: 'divider',
 
                      pl: 1.5,
 
                    }}
 
                  >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <Box sx={{ flex: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <Typography variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {entry.estadoAnterior == null
 
                          ? `Cheque cargado → ${entry.estadoNuevo}`
 
                          : `${entry.estadoAnterior} → ${entry.estadoNuevo}`}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {entry.usuarioNombre && (
 
                          <Typography component="span" variant="body2" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            {' '}por {entry.usuarioNombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
 
                        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {entry.motivo && (
 
                        <Typography variant="caption" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          Motivo: {entry.motivo}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Typography>
 
                      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <Typography variant="caption" color="textSecondary" display="block">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {new Date(entry.fechaCambio).toLocaleString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
 
                ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {/* Sección de endosos - solo para TERCEROS */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {cheque.tipo === 'TERCEROS' && (
 
            <>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Divider />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    Endosos
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {endososChain && endososChain.totalEndosos > 0 && (
 
                      <Chip
 
                        label={`${endososChain.totalEndosos} endoso${endososChain.totalEndosos > 1 ? 's' : ''}`}
 
                        size="small"
 
                        color="primary"
 
                      />
 
                    )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {loadingEndosos ? (
 
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <CircularProgress size={24} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </Box>
 
                ) : (
 
                  <ChequeEndososChain
 
                    cadenaEndosos={endososChain || undefined}
 
                    loading={loadingEndosos}
 
                  />
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {/* Input para motivo de rechazo */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {showRechazoInput && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TextField
 
                fullWidth
 
                label="Motivo del Rechazo"
 
                value={motivoRechazo}
 
                onChange={(e) => setMotivoRechazo(e.target.value)}
 
                multiline
 
                rows={2}
 
                required
 
              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Button
 
                  onClick={handleRechazar}
 
                  variant="contained"
 
                  color="error"
 
                  disabled={loading || !motivoRechazo.trim()}
 
                  size="small"
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Confirmar Rechazo
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Button
 
                  onClick={() => {
 
                    setShowRechazoInput(false);
 
                    setMotivoRechazo('');
 
                  }}
 
                  size="small"
 
                  disabled={loading}
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {/* Input para motivo de anulación */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {showAnulacionInput && (
 
            <Grid item xs={12}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TextField
 
                fullWidth
 
                label="Motivo de Anulación"
 
                value={motivoAnulacion}
 
                onChange={(e) => setMotivoAnulacion(e.target.value)}
 
                multiline
 
                rows={2}
 
                required
 
              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Button
 
                  onClick={handleAnular}
 
                  variant="contained"
 
                  color="warning"
 
                  disabled={loading || !motivoAnulacion.trim()}
 
                  size="small"
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Confirmar Anulación
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Button
 
                  onClick={() => {
 
                    setShowAnulacionInput(false);
 
                    setMotivoAnulacion('');
 
                  }}
 
                  size="small"
 
                  disabled={loading}
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </DialogContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Acciones basadas en el estado actual */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {cheque.estado === 'EN_CARTERA' && cheque.puedeDepositarse && (
 
          <Button
 
            onClick={handleDepositar}
 
            variant="contained"
 
            color="info"
 
            disabled={loading || showRechazoInput || showAnulacionInput}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Depositar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {cheque.estado === 'DEPOSITADO' && cheque.puedeCobrarse && (
 
          <Button
 
            onClick={handleCobrar}
 
            variant="contained"
 
            color="success"
 
            disabled={loading || showRechazoInput || showAnulacionInput}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Marcar como Cobrado
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {(cheque.estado === 'EN_CARTERA' || cheque.estado === 'DEPOSITADO') && !showRechazoInput && !showAnulacionInput && (
 
          <Button
 
            onClick={() => setShowRechazoInput(true)}
 
            variant="outlined"
 
            color="error"
 
            disabled={loading}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Rechazar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {cheque.estado !== 'ANULADO' && cheque.estado !== 'COBRADO' && !showRechazoInput && !showAnulacionInput && (
 
          <Button
 
            onClick={() => setShowAnulacionInput(true)}
 
            variant="outlined"
 
            color="warning"
 
            disabled={loading}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Anular
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {/* Botón de Endosar - solo para TERCEROS en RECIBIDO o EN_CARTERA */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {cheque.tipo === 'TERCEROS' &&
 
         (cheque.estado === 'RECIBIDO' || cheque.estado === 'EN_CARTERA') &&
 
         !showRechazoInput &&
 
         !showAnulacionInput && (
 
          <Button
 
            onClick={() => setShowEndosarDialog(true)}
 
            variant="contained"
 
            color="secondary"
 
            disabled={loading}
 
            startIcon={<SwapHorizIcon />}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Endosar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Button>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Button onClick={onClose} disabled={loading}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          Cerrar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </DialogActions>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    </Dialog>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    {/* Dialog de Endoso */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    <EndosarChequeDialog
 
      open={showEndosarDialog}
 
      cheque={cheque}
 
      onClose={() => setShowEndosarDialog(false)}
 
      onSuccess={handleEndosarSuccess}
 
    />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
  </>
 
  );
 
};
 

 
export default ChequeDetailDialog;
