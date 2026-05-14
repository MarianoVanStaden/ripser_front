import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LocationOn as LocationOnIcon,
  Inventory2 as Inventory2Icon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { equipoFabricadoApi } from '../../../api/services';
import { usePermisos } from '../../../hooks/usePermisos';
import type { DesgloseModeloDTO, DesgloseModeloVendidosDTO, TipoEquipo } from '../../../types';

const TIPO_LABEL: Record<string, string> = {
  HELADERA: 'HELADERAS',
  COOLBOX: 'COOLBOX',
  EXHIBIDOR: 'EXHIBIDORES',
  OTRO: 'OTROS',
};
const TIPO_ORDER: TipoEquipo[] = ['HELADERA', 'COOLBOX', 'EXHIBIDOR', 'OTRO'];

type TabValue = 'stock' | 'vendidos';

const UbicacionEquiposPage: React.FC = () => {
  const { tienePermiso } = usePermisos();

  const [tab, setTab] = useState<TabValue>('stock');
  const [desgloseStock, setDesgloseStock] = useState<DesgloseModeloDTO[]>([]);
  const [desgloseVendidos, setDesgloseVendidos] = useState<DesgloseModeloVendidosDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ambos breakdowns se cargan en paralelo al entrar — los tabs cambian solo
  // la vista, no disparan refetch. Cantidad de filas es chica (modelos por
  // empresa), así que el overhead es mínimo y evita un spinner al cambiar tab.
  useEffect(() => {
    if (!tienePermiso('LOGISTICA')) return;
    (async () => {
      try {
        setLoading(true);
        const [stockData, vendidosData] = await Promise.all([
          equipoFabricadoApi.getDesgloseModelo(),
          equipoFabricadoApi.getDesgloseModeloVendidos(),
        ]);
        setDesgloseStock(stockData);
        setDesgloseVendidos(vendidosData);
      } catch {
        setError('Error al cargar el desglose por modelo');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stockAgrupado = useMemo(() => {
    return TIPO_ORDER
      .filter((tipo) => desgloseStock.some((d) => d.tipo === tipo))
      .map((tipo) => {
        const modelos = desgloseStock.filter((d) => d.tipo === tipo);
        return {
          tipo,
          label: TIPO_LABEL[tipo] || tipo,
          modelos,
          totalTipo: {
            total:       modelos.reduce((s, m) => s + m.total, 0),
            asignados:   modelos.reduce((s, m) => s + m.asignados, 0),
            enService:   modelos.reduce((s, m) => s + m.enService, 0),
            disponibles: modelos.reduce((s, m) => s + m.disponibles, 0),
          },
        };
      });
  }, [desgloseStock]);

  const vendidosAgrupado = useMemo(() => {
    return TIPO_ORDER
      .filter((tipo) => desgloseVendidos.some((d) => d.tipo === tipo))
      .map((tipo) => {
        const modelos = desgloseVendidos.filter((d) => d.tipo === tipo);
        return {
          tipo,
          label: TIPO_LABEL[tipo] || tipo,
          modelos,
          totalTipo: {
            total:      modelos.reduce((s, m) => s + m.total, 0),
            enTransito: modelos.reduce((s, m) => s + m.enTransito, 0),
            entregados: modelos.reduce((s, m) => s + m.entregados, 0),
          },
        };
      });
  }, [desgloseVendidos]);

  if (!tienePermiso('LOGISTICA')) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <LocationOnIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'primary.main' }} />
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
        >
          Desglose por Modelo
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as TabValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab
          value="stock"
          label="En stock / pendiente de entrega"
          icon={<Inventory2Icon />}
          iconPosition="start"
        />
        <Tab
          value="vendidos"
          label="Vendidos / en tránsito"
          icon={<LocalShippingIcon />}
          iconPosition="start"
        />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : tab === 'stock' ? (
        stockAgrupado.length === 0 ? (
          <Alert severity="info">No hay equipos en stock</Alert>
        ) : (
          stockAgrupado.map(({ tipo, label, modelos, totalTipo }) => (
            <Box key={tipo} sx={{ mb: 4 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.dark' }}>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold', width: '28%' }}>
                        EQUIPOS
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT TOTAL
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT ASIGNADOS
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT EN SERVICE
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        CANT DISPONIBLE
                      </TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>
                        NUMEROS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {modelos.map((row) => (
                      <TableRow key={row.modelo} hover>
                        <TableCell>{row.modelo}</TableCell>
                        <TableCell align="right">{row.total}</TableCell>
                        <TableCell align="right">{row.asignados}</TableCell>
                        <TableCell align="right">{row.enService}</TableCell>
                        <TableCell align="right">{row.disponibles}</TableCell>
                        <TableCell sx={{ typography: 'caption', maxWidth: 300, wordBreak: 'break-word' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ color: 'text.secondary' }}>
                              {row.numerosDisponibles.join(', ') || '—'}
                            </Box>
                            {row.numerosEnService && row.numerosEnService.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'wrap' }}>
                                <Chip
                                  label="En Service"
                                  size="small"
                                  sx={{
                                    bgcolor: 'warning.main',
                                    color: 'common.white',
                                    fontWeight: 'bold',
                                    height: 20,
                                  }}
                                />
                                <Box sx={{ color: 'warning.dark', fontWeight: 500 }}>
                                  {row.numerosEnService.join(', ')}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        TOTAL {label}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.total}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.asignados}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.enService}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                        {totalTipo.disponibles}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))
        )
      ) : vendidosAgrupado.length === 0 ? (
        <Alert severity="info">No hay equipos vendidos ni en tránsito</Alert>
      ) : (
        vendidosAgrupado.map(({ tipo, label, modelos, totalTipo }) => (
          <Box key={tipo} sx={{ mb: 4 }}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.dark' }}>
                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold', width: '28%' }}>
                      EQUIPOS
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                      CANT TOTAL
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                      CANT EN TRÁNSITO
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'common.white', fontWeight: 'bold' }}>
                      CANT ENTREGADOS
                    </TableCell>
                    <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>
                      NUMEROS
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelos.map((row) => (
                    <TableRow key={row.modelo} hover>
                      <TableCell>{row.modelo}</TableCell>
                      <TableCell align="right">{row.total}</TableCell>
                      <TableCell align="right">{row.enTransito}</TableCell>
                      <TableCell align="right">{row.entregados}</TableCell>
                      <TableCell sx={{ typography: 'caption', maxWidth: 320, wordBreak: 'break-word' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {row.numerosEnTransito.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label="En Tránsito"
                                size="small"
                                sx={{
                                  bgcolor: 'info.main',
                                  color: 'common.white',
                                  fontWeight: 'bold',
                                  height: 20,
                                }}
                              />
                              <Box sx={{ color: 'info.dark', fontWeight: 500 }}>
                                {row.numerosEnTransito.join(', ')}
                              </Box>
                            </Box>
                          )}
                          {row.numerosEntregados.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip
                                label="Entregados"
                                size="small"
                                sx={{
                                  bgcolor: 'success.main',
                                  color: 'common.white',
                                  fontWeight: 'bold',
                                  height: 20,
                                }}
                              />
                              <Box sx={{ color: 'success.dark', fontWeight: 500 }}>
                                {row.numerosEntregados.join(', ')}
                              </Box>
                            </Box>
                          )}
                          {row.numerosEnTransito.length === 0 && row.numerosEntregados.length === 0 && (
                            <Box sx={{ color: 'text.secondary' }}>—</Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'common.white' }}>
                      TOTAL {label}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                      {totalTipo.total}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                      {totalTipo.enTransito}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'common.white' }}>
                      {totalTipo.entregados}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))
      )}
    </Box>
  );
};

export default UbicacionEquiposPage;
