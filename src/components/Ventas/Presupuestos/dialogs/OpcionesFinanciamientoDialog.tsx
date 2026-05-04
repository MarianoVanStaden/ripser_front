// FRONT-003: extracted from PresupuestosPage.tsx — picker para seleccionar
// la opción de financiamiento del presupuesto.  Espejo del componente con
// el mismo nombre en NotasPedido (no consolidado: el shape del documento
// difiere y los chips de cliente/lead son específicos del flujo).
import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import type { DocumentoComercial, OpcionFinanciamientoDTO } from '../../../../types';
import OpcionFinanciamientoLabel from '../../OpcionFinanciamientoLabel';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  presupuesto: DocumentoComercial | null;
  opciones: OpcionFinanciamientoDTO[];
  selectedOpcionId: number | null;
  onSelectOpcion: (id: number) => void;
}

const OpcionesFinanciamientoDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  presupuesto,
  opciones,
  selectedOpcionId,
  onSelectOpcion,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{ '& .MuiDialog-paper': { maxHeight: { xs: '100%', sm: '90vh' }, m: { xs: 0, sm: 2 } } }}
    >
      <DialogTitle>
        Opciones de Financiamiento
        <Typography variant="body2" color="text.secondary">
          Seleccione la opción de pago preferida
        </Typography>
      </DialogTitle>
      <DialogContent>
        {presupuesto && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Presupuesto: {presupuesto.numeroDocumento}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {presupuesto.clienteNombre ? 'Cliente:' : 'Lead:'}{' '}
                {presupuesto.clienteNombre || presupuesto.leadNombre}
              </Typography>
              {presupuesto.clienteNombre && (
                <Chip
                  label="Cliente"
                  size="small"
                  color="primary"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
              {presupuesto.leadNombre && (
                <Chip
                  label="Lead"
                  size="small"
                  color="warning"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Subtotal: $
              {presupuesto.subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        )}
        <Divider sx={{ mb: 2 }} />
        <RadioGroup
          value={selectedOpcionId ?? ''}
          onChange={(e) => onSelectOpcion(Number(e.target.value))}
        >
          {opciones.map((opcion) => {
            const isSelected = selectedOpcionId === opcion.id;
            return (
              <Box
                key={opcion.id}
                onClick={() => opcion.id != null && onSelectOpcion(opcion.id)}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  mb: 1.5,
                  cursor: 'pointer',
                  transition: 'border-color 120ms, background-color 120ms',
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              >
                <FormControlLabel
                  value={opcion.id}
                  control={<Radio />}
                  sx={{
                    width: '100%',
                    alignItems: 'flex-start',
                    m: 0,
                    '& .MuiFormControlLabel-label': { width: '100%' },
                  }}
                  label={
                    <OpcionFinanciamientoLabel
                      opcion={opcion}
                      baseImporte={presupuesto?.subtotal ?? 0}
                    />
                  }
                />
              </Box>
            );
          })}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" disabled={!selectedOpcionId}>
          Confirmar selección
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OpcionesFinanciamientoDialog;
