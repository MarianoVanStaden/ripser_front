import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Chip, Stack, Button } from '@mui/material';
import type { Garantia } from '../../types';

interface GarantiaDetailPageProps {
  garantia: Garantia;
  onBack: () => void;
}

const GarantiaDetailPage: React.FC<GarantiaDetailPageProps> = ({ garantia, onBack }) => {
  return (
    <Box p={3}>
      <Button onClick={onBack} sx={{ mb: 2 }}>Volver</Button>
      <Card>
        <CardContent>
          <Typography variant="h5" mb={2}>Detalle de Garantía</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">Cliente</Typography>
              <Typography>{garantia.clienteNombre}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Producto</Typography>
              <Typography>{garantia.productoNombre}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Fecha de Venta</Typography>
              <Typography>{garantia.fechaVenta}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2">Estado</Typography>
              <Chip label={garantia.estado} color={garantia.estado === 'Vigente' ? 'success' : garantia.estado === 'Vencida' ? 'error' : 'warning'} />
            </Box>
            <Box>
              <Typography variant="subtitle2">Observaciones</Typography>
              <Typography>{garantia.observaciones || '-'}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GarantiaDetailPage;
