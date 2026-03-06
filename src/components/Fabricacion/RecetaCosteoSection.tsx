import React, { useState, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Calculate as CalculateIcon } from '@mui/icons-material';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import { parametroSistemaApi } from '../../api/services';
import type { CosteoRecetaDTO, ParametroSistema } from '../../types';

const COSTEO_CLAVES = [
  'COSTEO_MANO_OBRA_PCT',
  'COSTEO_VARIOS_PCT',
  'COSTEO_FIJOS_PCT',
  'COSTEO_VENTA_PCT',
  'COSTEO_TRASLADO_PCT',
  'COSTEO_GANANCIA_PCT',
] as const;

const fmt = (value: number) =>
  value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (parametros: ParametroSistema[], clave: string): string => {
  const p = parametros.find((x) => x.clave === clave);
  if (!p) return '';
  const num = parseFloat(p.valor) * 100;
  return `(${num % 1 === 0 ? num.toFixed(0) : num.toFixed(0)}%)`;
};

interface Props {
  recetaId: number;
}

const RecetaCosteoSection: React.FC<Props> = ({ recetaId }) => {
  const [costeo, setCosteo] = useState<CosteoRecetaDTO | null>(null);
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handleVerCosteo = useCallback(async () => {
    if (loaded) {
      setLoaded(false);
      setCosteo(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [costeoData, allParametros] = await Promise.all([
        recetaFabricacionApi.getCosteo(recetaId),
        parametroSistemaApi.getAll(),
      ]);
      setCosteo(costeoData);
      setParametros(allParametros.filter((p) => COSTEO_CLAVES.includes(p.clave as typeof COSTEO_CLAVES[number])));
      setLoaded(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('No tiene permisos para acceder al costeo de esta receta.');
      } else {
        setError('No se pudo cargar el costeo. Verifique que la receta tenga materiales.');
      }
    } finally {
      setLoading(false);
    }
  }, [recetaId, loaded]);

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={loaded ? 2 : 0}>
        <Typography variant="h6">Costeo de Fabricación</Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={18} /> : <CalculateIcon />}
          onClick={handleVerCosteo}
          disabled={loading}
        >
          {loaded ? 'Ocultar Costeo' : 'Ver Costeo'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {loaded && costeo && (
        <TableContainer>
          <Table size="small">
            <TableBody>
              {/* Costo material */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Costo material</TableCell>
                <TableCell align="right" sx={{ fontWeight: 500 }}>
                  ${fmt(costeo.costoMaterial)}
                </TableCell>
              </TableRow>

              {/* Porcentajes */}
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                  Mano de obra &nbsp;
                  <Typography component="span" variant="caption" color="text.disabled">
                    {pct(parametros, 'COSTEO_MANO_OBRA_PCT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">${fmt(costeo.costoManoObra)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                  Varios / materiales &nbsp;
                  <Typography component="span" variant="caption" color="text.disabled">
                    {pct(parametros, 'COSTEO_VARIOS_PCT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">${fmt(costeo.costoVariosMateriales)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                  Costos fijos &nbsp;
                  <Typography component="span" variant="caption" color="text.disabled">
                    {pct(parametros, 'COSTEO_FIJOS_PCT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">${fmt(costeo.costosFijos)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                  Costo de venta &nbsp;
                  <Typography component="span" variant="caption" color="text.disabled">
                    {pct(parametros, 'COSTEO_VENTA_PCT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">${fmt(costeo.costoVenta)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                  Traslado &nbsp;
                  <Typography component="span" variant="caption" color="text.disabled">
                    {pct(parametros, 'COSTEO_TRASLADO_PCT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">${fmt(costeo.costoTraslado)}</TableCell>
              </TableRow>

              {/* Costo total fabricación */}
              <TableRow sx={{ borderTop: '2px solid', borderColor: 'divider' }}>
                <TableCell sx={{ fontWeight: 600 }}>Costo total fabricación</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${fmt(costeo.costoTotalFabricacion)}
                </TableCell>
              </TableRow>

              {/* Ganancia */}
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>
                  Ganancia &nbsp;
                  <Typography component="span" variant="caption" color="text.disabled">
                    {pct(parametros, 'COSTEO_GANANCIA_PCT')}
                  </Typography>
                </TableCell>
                <TableCell align="right">${fmt(costeo.ganancia)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2}>
                  <Divider />
                </TableCell>
              </TableRow>

              {/* Precio sugerido */}
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>PRECIO SUGERIDO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: 'primary.main' }}>
                  ${fmt(costeo.precioSugerido)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default RecetaCosteoSection;
