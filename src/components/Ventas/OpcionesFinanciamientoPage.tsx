import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, Typography, TextField, Stack } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
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
  const [montoBase, setMontoBase] = useState<number>(100000);
  const [opciones, setOpciones] = useState<OpcionFinanciamiento[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [documentoIdInput, setDocumentoIdInput] = useState<string>('');
  const documentoId = documentoIdInput ? parseInt(documentoIdInput) : undefined;

  // Initialize from ?documentoId= query if present
  useEffect(() => {
    const q = searchParams.get('documentoId');
    if (q && /^\d+$/.test(q)) {
      setDocumentoIdInput(q);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1} alignItems="flex-start">
            <TextField
              label="Documento ID"
              value={documentoIdInput}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^\d*$/.test(v)) setDocumentoIdInput(v);
              }}
              placeholder="Ej: 123"
              size="small"
              sx={{ width: 160 }}
              helperText={documentoId ? 'Usado para cargar/guardar opciones' : 'Ingrese un ID válido'}
            />
            <TextField
              label="Monto Base"
              type="number"
              value={montoBase}
              onChange={(e) => setMontoBase(parseFloat(e.target.value) || 0)}
              size="small"
              sx={{ width: 180 }}
              inputProps={{ min: 0 }}
            />
            <Button
              variant="outlined"
              disabled={!documentoId}
              onClick={() => {
                if (documentoId) {
                  searchParams.set('documentoId', documentoId.toString());
                  setSearchParams(searchParams, { replace: true });
                  setOpen(true);
                }
              }}
            >
              Abrir gestor de opciones
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <OpcionesFinanciamientoManager
        open={open}
        onClose={() => setOpen(false)}
        montoBase={montoBase}
        documentoId={documentoId}
        onSave={(nuevas) => {
          setOpciones(nuevas);
          setOpen(false);
        }}
      />
    </Box>
  );
};

export default OpcionesFinanciamientoPage;
