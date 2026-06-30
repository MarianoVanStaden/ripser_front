// T1 — Importación masiva de facturas históricas (anteriores al sistema) para
// poder asignarlas a viajes. Permite validar (preview) antes de confirmar.
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  FactCheck as FactCheckIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { documentoApi } from '../../api/services';
import type { ImportarFacturasResult } from '../../api/services/documentoApi';

const ImportarFacturasHistoricasPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportarFacturasResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await documentoApi.importarFacturasHistoricas(file, dryRun);
      setResult(res);
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((e as any)?.response?.data?.message || 'No se pudo procesar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Typography variant="h4" display="flex" alignItems="center" gap={1} mb={3}
        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        <CloudUploadIcon /> Importar facturas históricas
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Subí un CSV (delimitado por <strong>;</strong>) con las facturas previas al sistema. Columnas:
            <code> cuit;nombreCliente;numeroFactura;fecha(yyyy-MM-dd);total;metodoPago;direccionEntrega;ciudad</code>.
            La primera fila es de encabezados. El cliente se busca por CUIT y, si no, por nombre exacto.
            Cada factura genera una entrega <strong>pendiente</strong> lista para asignar a un viaje.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
              Elegir archivo CSV
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
              />
            </Button>
            {file && <Chip label={file.name} onDelete={() => { setFile(null); setResult(null); }} />}
          </Stack>

          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="outlined"
              startIcon={<FactCheckIcon />}
              disabled={!file || loading}
              onClick={() => run(true)}
            >
              Validar (preview)
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!file || loading || !result || result.validas === 0}
              onClick={() => run(false)}
            >
              Importar
            </Button>
            {loading && <CircularProgress size={24} />}
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={1}>
              {result.dryRun ? 'Resultado de la validación' : 'Resultado de la importación'}
            </Typography>
            <Stack direction="row" spacing={3} mb={2} flexWrap="wrap">
              <Chip label={`Filas: ${result.totalFilas}`} />
              <Chip color="success" label={`Válidas: ${result.validas}`} />
              {!result.dryRun && <Chip color="primary" label={`Creadas: ${result.creadas}`} />}
              <Chip color={result.errores.length ? 'error' : 'default'} label={`Errores: ${result.errores.length}`} />
            </Stack>

            {result.dryRun && result.validas > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {result.validas} factura(s) listas para importar. Presioná <strong>Importar</strong> para confirmar.
              </Alert>
            )}
            {!result.dryRun && result.creadas > 0 && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Se importaron {result.creadas} factura(s). Ya aparecen como entregas disponibles para asignar a un viaje.
              </Alert>
            )}

            {result.errores.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>Filas con error</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 100 }}>Fila</TableCell>
                      <TableCell>Motivo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.errores.map((er, i) => (
                      <TableRow key={i}>
                        <TableCell>{er.fila}</TableCell>
                        <TableCell>{er.mensaje}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ImportarFacturasHistoricasPage;
