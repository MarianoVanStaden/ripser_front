import React from 'react';
import { Box, Typography } from '@mui/material';
import type { DocumentoComercial } from '../../types';

interface Props {
  documento: DocumentoComercial;
}

interface Paso {
  label: string;
  userName: string | null;
}

const AuditoriaFlujo: React.FC<Props> = ({ documento }) => {
  const pasos: Paso[] = [
    {
      label: 'Presupuesto',
      userName: documento.usuarioCreadorPresupuestoNombre,
    },
    {
      label: 'Nota de Pedido',
      userName: documento.usuarioConvertidorNotaPedidoNombre,
    },
    {
      label: 'Factura',
      userName: documento.usuarioFacturadorNombre,
    },
  ];

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
      {pasos.map((paso, i) => (
        <Box key={paso.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {i > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
              →
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" fontWeight={500} color="text.primary">
              {paso.label}
            </Typography>
            {paso.userName ? (
              <Typography variant="caption" color="text.secondary">
                {paso.userName}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                —
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default AuditoriaFlujo;
