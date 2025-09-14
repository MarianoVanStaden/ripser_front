import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import OpcionesFinanciamientoManager from './OpcionesFinanciamientoManager';

type OpcionFinanciamiento = {
  id?: number;
  nombre: string;
  metodoPago: string;
  cantidadCuotas: number;
  tasaInteres: number;
  montoTotal?: number;
  montoCuota?: number;
  descripcion?: string;
  ordenPresentacion?: number;
};

const OpcionesFinanciamientoPage: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [montoBase] = useState<number>(100000);
  const [opciones, setOpciones] = useState<OpcionFinanciamiento[]>([]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Opciones de Financiamiento
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Esta herramienta permite configurar y simular opciones de financiamiento basadas en un monto base.
          </Typography>
          <Box display="flex" gap={2} mt={1}>
            <Button variant="contained" onClick={() => setOpen(true)}>
              Abrir gestor de opciones
            </Button>
          </Box>
        </CardContent>
      </Card>

      <OpcionesFinanciamientoManager
        open={open}
        onClose={() => setOpen(false)}
        montoBase={montoBase}
        opciones={opciones}
        onSave={(nuevas) => {
          setOpciones(nuevas);
          setOpen(false);
        }}
      />
    </Box>
  );
};

export default OpcionesFinanciamientoPage;
