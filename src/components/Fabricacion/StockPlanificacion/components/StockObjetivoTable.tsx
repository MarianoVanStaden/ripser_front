import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Box,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import FactoryIcon from '@mui/icons-material/Factory';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import type { EvaluacionStockDTO } from '../../../../types';
import { EvaluacionBadge } from './EvaluacionBadge';

interface StockObjetivoTableProps {
  rows: EvaluacionStockDTO[];
  loading: boolean;
  onEdit: (row: EvaluacionStockDTO) => void;
  onGenerarOrden: (row: EvaluacionStockDTO) => void;
}

function getDiferenciaDisplay(diferencia: number): { label: string; color: string } {
  if (diferencia < 0) {
    return { label: `+${Math.abs(diferencia)} superávit`, color: 'success.main' };
  }
  if (diferencia > 0) {
    return { label: `−${diferencia}`, color: 'error.main' };
  }
  return { label: '0', color: 'text.secondary' };
}

function getColorLabel(color?: string | null): string {
  if (!color) return 'Sin color / Base';
  return color.replace(/_/g, ' ');
}

export const StockObjetivoTable: React.FC<StockObjetivoTableProps> = ({
  rows,
  loading,
  onEdit,
  onGenerarOrden,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">
          No hay objetivos de stock configurados. Creá el primero con el botón "+ Nuevo".
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" sx={{ minWidth: 1100 }}>
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 600, backgroundColor: 'grey.50' } }}>
            <TableCell>Tipo</TableCell>
            <TableCell>Modelo</TableCell>
            <TableCell>Medida</TableCell>
            <TableCell>Color</TableCell>
            <TableCell align="right">Objetivo</TableCell>
            <TableCell align="right">Disponible</TableCell>
            <TableCell align="right">
              <Tooltip title="Bases sin terminar disponibles para revestir">
                <span>Bases disp.</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">En producción</TableCell>
            <TableCell align="right">Diferencia</TableCell>
            <TableCell align="right">
              <Tooltip title="Cantidad neta a fabricar (ya descuenta producción en curso)">
                <span>A fabricar</span>
              </Tooltip>
            </TableCell>
            <TableCell>Acción sugerida</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const dif = getDiferenciaDisplay(row.diferencia);
            return (
              <TableRow key={row.stockObjetivoId} hover>
                <TableCell>{row.tipo}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {row.modelo}
                  </Typography>
                </TableCell>
                <TableCell>{row.medida}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={row.color ? 'text.primary' : 'text.disabled'}
                    fontStyle={row.color ? 'normal' : 'italic'}
                  >
                    {getColorLabel(row.color?.nombre ?? null)}
                  </Typography>
                </TableCell>
                <TableCell align="right">{row.cantidadObjetivo}</TableCell>
                <TableCell align="right">{row.stockDisponible}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    color={row.stockBaseDisponible > 0 ? 'warning.dark' : 'text.secondary'}
                    fontWeight={row.stockBaseDisponible > 0 ? 600 : 400}
                  >
                    {row.stockBaseDisponible}
                  </Typography>
                </TableCell>
                <TableCell align="right">{row.stockEnProduccion}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={600} sx={{ color: dif.color }}>
                    {dif.label}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    fontWeight={row.cantidadAFabricar > 0 ? 600 : 400}
                    color={row.cantidadAFabricar > 0 ? 'error.main' : 'text.secondary'}
                  >
                    {row.cantidadAFabricar > 0 ? row.cantidadAFabricar : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <EvaluacionBadge accionSugerida={row.accionSugerida} />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    {row.accionSugerida === 'FABRICAR' && (
                      <Tooltip title={`Generar orden (${row.cantidadAFabricar} uds)`}>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<FactoryIcon />}
                          onClick={() => onGenerarOrden(row)}
                          sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem', px: 1 }}
                        >
                          Generar orden
                        </Button>
                      </Tooltip>
                    )}
                    {row.accionSugerida === 'TERMINAR_BASE' && (
                      <Tooltip title="Ir a equipos base para aplicar terminación">
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          endIcon={<OpenInNewIcon />}
                          onClick={() => navigate('/fabricacion/equipos')}
                          sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem', px: 1 }}
                        >
                          Ir a terminación
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip title="Editar objetivo">
                      <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
