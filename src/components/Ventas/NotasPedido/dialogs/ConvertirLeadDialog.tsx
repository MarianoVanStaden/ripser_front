// FRONT-003: extracted from NotasPedidoPage.tsx — informational dialog
// shown when a presupuesto is tied to a Lead instead of a Cliente.  The
// nota de pedido cannot be created until the lead is converted to a real
// cliente; the parent owns the navigation handler.
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { DocumentoComercial } from '../../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onConvertir: () => void;
  lead: DocumentoComercial | null;
}

const ConvertirLeadDialog: React.FC<Props> = ({ open, onClose, onConvertir, lead }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>⚠️ Conversión de Lead a Cliente Requerida</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este presupuesto está asociado a un <strong>Lead</strong> y no puede convertirse a Nota de Pedido directamente.
          </Alert>

          <Box sx={{ my: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Lead a convertir:
            </Typography>
            <Typography variant="body1">
              <strong>{lead?.leadNombre}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {lead?.leadId}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para continuar con la creación de la Nota de Pedido, primero debe convertir este lead a cliente
            completando toda su información (datos fiscales, dirección, etc.).
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>📋 Pasos a seguir:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ol style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                <li>Haga clic en "Ir a Leads" para abrir la página de gestión de leads</li>
                <li>Complete todos los datos del cliente (CUIT, dirección, condición fiscal, etc.)</li>
                <li>Confirme la conversión del lead a cliente</li>
                <li>Regrese a esta página y los presupuestos se actualizarán automáticamente</li>
              </ol>
            </Typography>
          </Alert>

          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>✅ Después de la conversión:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ marginTop: 4, marginBottom: 0 }}>
                <li>El lead se convertirá en un cliente completo</li>
                <li>Todos los presupuestos asociados al lead se vincularán automáticamente al nuevo cliente</li>
                <li>Podrá crear notas de pedido y facturas normalmente</li>
              </ul>
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" color="primary" onClick={onConvertir}>
          Convertir Lead a Cliente
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConvertirLeadDialog;
