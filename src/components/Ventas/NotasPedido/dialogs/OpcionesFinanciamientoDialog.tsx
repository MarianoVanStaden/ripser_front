// FRONT-003: extracted from NotasPedidoPage.tsx — picker for the financing
// option attached to a nota de pedido.  The orchestrator owns option
// loading, caching and persistence; this component just renders + relays
// the user's choice.
import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
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
  loading: boolean;
  nota: DocumentoComercial | null;
  opciones: OpcionFinanciamientoDTO[];
  selectedOpcionId: number | null;
  onSelectOpcion: (id: number) => void;
}

const OpcionesFinanciamientoDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  loading,
  nota,
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
        {nota && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Nota de Pedido: {nota.numeroDocumento}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {nota.clienteNombre ? 'Cliente:' : 'Lead:'}{' '}
                {nota.clienteNombre || nota.leadNombre}
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Subtotal: $
              {nota.subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
        )}
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Cargando opciones de financiamiento…
            </Typography>
          </Box>
        ) : opciones.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No hay opciones de financiamiento disponibles para este documento.
          </Typography>
        ) : (
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
                        baseImporte={nota?.subtotal ?? 0}
                      />
                    }
                  />
                </Box>
              );
            })}
          </RadioGroup>
        )}
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
