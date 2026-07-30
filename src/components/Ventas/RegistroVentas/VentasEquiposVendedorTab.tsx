import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { documentoApi } from '../../../api/services';
import { useTenant } from '../../../context/TenantContext';
import { useParametroSistema, parseIntOr, parseTramos } from '../../../hooks/useParametroSistema';
import DetalleVentasVendedorDialog from './DetalleVentasVendedorDialog';

interface CeldaMes {
  heladerasVendidas: number;
  coolboxesVendidas: number;
  heladerasAnuladasNc: number;
  coolboxesAnuladasNc: number;
  heladerasAnuladasRechazo: number;
  coolboxesAnuladasRechazo: number;
  heladerasNeto: number;
  coolboxesNeto: number;
  totalNeto: number;
}

interface FilaVendedor {
  usuarioId: number | null;
  vendedorNombre: string;
  vendedorActivo: boolean;
  porMes: Map<string, CeldaMes>; // clave 'YYYY-MM'
  totalHeladeras: number;
  totalCoolboxes: number;
  totalNeto: number;
  primerMesVenta: string | null; // 'YYYY-MM' de la primera venta histórica
}

/** Premio individual alcanzado por una celda vendedor+mes, o null si ninguno. */
interface PremioIndividual {
  label: string;
  color: 'success' | 'warning';
  icon: string;
}

const SIN_VENDEDOR = 'Sin vendedor';

/** Neto con signo explícito; en rojo si es negativo. */
const NetoTexto: React.FC<{ valor: number; anuladas: number }> = ({ valor, anuladas }) => (
  <Typography
    component="span"
    variant="body2"
    sx={{ color: valor < 0 ? 'error.main' : 'text.primary', fontWeight: anuladas > 0 ? 600 : 400 }}
  >
    {valor < 0 ? `−${Math.abs(valor)}` : valor}
    {anuladas > 0 && (
      <Typography component="span" variant="caption" sx={{ color: 'error.main', ml: 0.5 }}>
        (−{anuladas})
      </Typography>
    )}
  </Typography>
);

interface DetalleSeleccionado {
  usuarioId: number;
  vendedorNombre: string;
  mes: string; // 'YYYY-MM'
}

const VentasEquiposVendedorTab: React.FC = () => {
  const { empresaId } = useTenant();
  const [desde, setDesde] = useState(dayjs().subtract(11, 'month').format('YYYY-MM'));
  const [hasta, setHasta] = useState(dayjs().format('YYYY-MM'));
  const [detalle, setDetalle] = useState<DetalleSeleccionado | null>(null);

  // 0 / vacío o inexistente = sin meta configurada → no se muestra cumplimiento.
  const { value: metaBase } = useParametroSistema(
    'META_MENSUAL_UNIDADES_REFRIGERADAS_VENDEDOR',
    0,
    parseIntOr(0)
  );
  const { value: metaPrimerMes } = useParametroSistema(
    'META_MENSUAL_UNIDADES_REFRIGERADAS_VENDEDOR_PRIMER_MES',
    0,
    parseIntOr(0)
  );
  const { value: metaSuperadora } = useParametroSistema(
    'META_MENSUAL_UNIDADES_REFRIGERADAS_VENDEDOR_SUPERADORA',
    0,
    parseIntOr(0)
  );
  const { value: tramosGrupales } = useParametroSistema(
    'META_MENSUAL_UNIDADES_REFRIGERADAS_TRAMOS',
    [],
    parseTramos
  );

  /** Meta individual del mes: la de primer mes si es el primer mes de venta del vendedor. */
  const metaDelMes = (fila: FilaVendedor, mes: string): number =>
    fila.primerMesVenta === mes && metaPrimerMes > 0 ? metaPrimerMes : metaBase;

  /** Premio individual alcanzado por la celda: superadora > meta (base o primer mes) > ninguno. */
  const premioDeCelda = (fila: FilaVendedor, mes: string, celda: CeldaMes): PremioIndividual | null => {
    const neto = celda.totalNeto;
    if (metaSuperadora > 0 && neto >= metaSuperadora) {
      return { label: 'Superadora', color: 'warning', icon: '🏆' };
    }
    const esPrimer = fila.primerMesVenta === mes && metaPrimerMes > 0;
    const meta = esPrimer ? metaPrimerMes : metaBase;
    if (meta > 0 && neto >= meta) {
      return { label: esPrimer ? 'Meta 1er mes' : 'Meta', color: 'success', icon: '✓' };
    }
    return null;
  };

  /** Tramo grupal alcanzado por un neto mensual: índice en tramosGrupales, -1 si no llega. */
  const tramoAlcanzado = (neto: number): number => {
    let alcanzado = -1;
    tramosGrupales.forEach((t, i) => {
      if (neto >= t.min) alcanzado = i;
    });
    return alcanzado;
  };

  const rangoValido =
    dayjs(desde, 'YYYY-MM').isValid() &&
    dayjs(hasta, 'YYYY-MM').isValid() &&
    !dayjs(desde).isAfter(dayjs(hasta));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ventas-equipos-vendedores', { empresaId, desde, hasta }],
    queryFn: () => documentoApi.getVentasEquiposPorVendedor(desde, hasta),
    enabled: rangoValido,
  });

  // Columnas: todos los meses del rango, aunque no tengan datos.
  const meses = useMemo(() => {
    if (!rangoValido) return [];
    const out: string[] = [];
    let cursor = dayjs(desde);
    const fin = dayjs(hasta);
    while (!cursor.isAfter(fin) && out.length < 36) {
      out.push(cursor.format('YYYY-MM'));
      cursor = cursor.add(1, 'month');
    }
    return out;
  }, [desde, hasta, rangoValido]);

  const { filas, totalPorMes } = useMemo(() => {
    const porVendedor = new Map<string, FilaVendedor>();
    const totales = new Map<string, CeldaMes>();

    for (const item of data ?? []) {
      const claveVendedor = item.usuarioId === null ? 'sin' : String(item.usuarioId);
      const claveMes = `${item.anio}-${String(item.mes).padStart(2, '0')}`;
      let fila = porVendedor.get(claveVendedor);
      if (!fila) {
        fila = {
          usuarioId: item.usuarioId,
          vendedorNombre: item.vendedorNombre ?? SIN_VENDEDOR,
          vendedorActivo: item.vendedorActivo ?? true,
          porMes: new Map(),
          totalHeladeras: 0,
          totalCoolboxes: 0,
          totalNeto: 0,
          primerMesVenta: item.primerMesVenta ?? null,
        };
        porVendedor.set(claveVendedor, fila);
      }
      fila.porMes.set(claveMes, item);
      fila.totalHeladeras += item.heladerasNeto;
      fila.totalCoolboxes += item.coolboxesNeto;
      fila.totalNeto += item.totalNeto;

      const total = totales.get(claveMes) ?? {
        heladerasVendidas: 0,
        coolboxesVendidas: 0,
        heladerasAnuladasNc: 0,
        coolboxesAnuladasNc: 0,
        heladerasAnuladasRechazo: 0,
        coolboxesAnuladasRechazo: 0,
        heladerasNeto: 0,
        coolboxesNeto: 0,
        totalNeto: 0,
      };
      total.heladerasVendidas += item.heladerasVendidas;
      total.coolboxesVendidas += item.coolboxesVendidas;
      total.heladerasAnuladasNc += item.heladerasAnuladasNc;
      total.coolboxesAnuladasNc += item.coolboxesAnuladasNc;
      total.heladerasAnuladasRechazo += item.heladerasAnuladasRechazo;
      total.coolboxesAnuladasRechazo += item.coolboxesAnuladasRechazo;
      total.heladerasNeto += item.heladerasNeto;
      total.coolboxesNeto += item.coolboxesNeto;
      total.totalNeto += item.totalNeto;
      totales.set(claveMes, total);
    }

    const ordenadas = [...porVendedor.values()].sort((a, b) => {
      if (a.usuarioId === null) return 1; // "Sin vendedor" al final
      if (b.usuarioId === null) return -1;
      return b.totalNeto - a.totalNeto;
    });
    return { filas: ordenadas, totalPorMes: totales };
  }, [data]);

  const renderCelda = (
    celda: CeldaMes | undefined,
    meta?: number,
    onClick?: () => void,
    premio?: PremioIndividual | null
  ) => {
    if (!celda) {
      return (
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      );
    }
    const anuladasH = celda.heladerasAnuladasNc + celda.heladerasAnuladasRechazo;
    const anuladasC = celda.coolboxesAnuladasNc + celda.coolboxesAnuladasRechazo;
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="caption" display="block">
              Heladeras: {celda.heladerasVendidas} vendidas, −{celda.heladerasAnuladasNc} por NC,
              −{celda.heladerasAnuladasRechazo} por rechazo
            </Typography>
            <Typography variant="caption" display="block">
              Coolboxes: {celda.coolboxesVendidas} vendidas, −{celda.coolboxesAnuladasNc} por NC,
              −{celda.coolboxesAnuladasRechazo} por rechazo
            </Typography>
            {!!meta && meta > 0 && (
              <Typography variant="caption" display="block">
                Meta: {meta} — cumplimiento {Math.round((celda.totalNeto / meta) * 100)}%
              </Typography>
            )}
            {metaSuperadora > 0 && celda.totalNeto >= metaSuperadora && (
              <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                🏆 Meta superadora ({metaSuperadora}) alcanzada
              </Typography>
            )}
            {onClick && (
              <Typography variant="caption" display="block" sx={{ fontStyle: 'italic' }}>
                Click para ver el detalle
              </Typography>
            )}
          </Box>
        }
      >
        <Box sx={{ whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
          <Typography variant="body2" component="div">
            H: <NetoTexto valor={celda.heladerasNeto} anuladas={anuladasH} />
          </Typography>
          <Typography variant="body2" component="div">
            C: <NetoTexto valor={celda.coolboxesNeto} anuladas={anuladasC} />
          </Typography>
          {premio && (
            <Chip
              size="small"
              label={`${premio.icon} ${premio.label}`}
              color={premio.color}
              variant={premio.color === 'warning' ? 'filled' : 'outlined'}
              sx={{ mt: 0.5, height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.65rem' } }}
            />
          )}
        </Box>
      </Tooltip>
    );
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
          <Typography variant="h6">Unidades por Vendedor (Heladeras y Coolboxes)</Typography>
          <Box display="flex" gap={2} ml="auto">
            <TextField
              label="Desde"
              type="month"
              size="small"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hasta"
              type="month"
              size="small"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        {!rangoValido && <Alert severity="warning">Rango de meses inválido.</Alert>}
        {isError && <Alert severity="error">Error al cargar el desglose de ventas.</Alert>}
        {isLoading && rangoValido && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && rangoValido && !isError && (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        bgcolor: 'background.paper',
                        fontWeight: 600,
                      }}
                    >
                      Vendedor
                    </TableCell>
                    {meses.map((m) => (
                      <TableCell key={m} align="center" sx={{ fontWeight: 600 }}>
                        {dayjs(m).format('MMM YY')}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      Total período
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={meses.length + 2}>
                        <Typography variant="body2" color="text.secondary" align="center" py={2}>
                          Sin ventas de heladeras/coolboxes en el rango seleccionado.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {filas.map((fila) => (
                    <TableRow key={fila.usuarioId ?? 'sin'} hover>
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          zIndex: 1,
                          bgcolor: 'background.paper',
                          fontStyle: fila.usuarioId === null ? 'italic' : 'normal',
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.75} sx={{ whiteSpace: 'nowrap' }}>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{
                              color:
                                fila.usuarioId !== null && !fila.vendedorActivo
                                  ? 'text.secondary'
                                  : 'text.primary',
                            }}
                          >
                            {fila.vendedorNombre}
                          </Typography>
                          {fila.usuarioId !== null && !fila.vendedorActivo && (
                            <Tooltip title="Vendedor dado de baja (inactivo). Se muestra por su historial de ventas.">
                              <Chip size="small" label="Inactivo" variant="outlined" color="default" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      {meses.map((m) => (
                        <TableCell key={m} align="center">
                          {renderCelda(
                            fila.porMes.get(m),
                            fila.usuarioId !== null ? metaDelMes(fila, m) : 0,
                            fila.usuarioId !== null && fila.porMes.get(m)
                              ? () =>
                                  setDetalle({
                                    usuarioId: fila.usuarioId as number,
                                    vendedorNombre: fila.vendedorNombre,
                                    mes: m,
                                  })
                              : undefined,
                            fila.usuarioId !== null && fila.porMes.get(m)
                              ? premioDeCelda(fila, m, fila.porMes.get(m) as CeldaMes)
                              : null
                          )}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" component="div">
                          H: <NetoTexto valor={fila.totalHeladeras} anuladas={0} />
                        </Typography>
                        <Typography variant="body2" component="div">
                          C: <NetoTexto valor={fila.totalCoolboxes} anuladas={0} />
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ fontWeight: 600 }}>
                          = <NetoTexto valor={fila.totalNeto} anuladas={0} />
                        </Typography>
                        {/* Sin "% de meta" acumulado: la meta es mensual (ver chips por celda),
                            no hay meta de período/año. El total solo suma unidades. */}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filas.length > 0 && (
                    <TableRow sx={{ '& td': { fontWeight: 600, borderTop: 2, borderColor: 'divider' } }}>
                      <TableCell
                        sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper' }}
                      >
                        Total
                      </TableCell>
                      {meses.map((m) => (
                        <TableCell key={m} align="center">
                          {renderCelda(totalPorMes.get(m))}
                        </TableCell>
                      ))}
                      <TableCell align="center">
                        <NetoTexto
                          valor={filas.reduce((acc, f) => acc + f.totalNeto, 0)}
                          anuladas={0}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                  {filas.length > 0 && tramosGrupales.length > 0 && (
                    <TableRow>
                      <TableCell
                        sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: 'background.paper' }}
                      >
                        <Tooltip
                          title={
                            <Box>
                              {tramosGrupales.map((t, i) => (
                                <Typography key={t.min} variant="caption" display="block">
                                  Meta {i + 1}: {t.min}–{t.max} equipos
                                </Typography>
                              ))}
                            </Box>
                          }
                        >
                          <Typography variant="body2" color="text.secondary">
                            Meta grupal
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      {meses.map((m) => {
                        const neto = totalPorMes.get(m)?.totalNeto;
                        if (neto === undefined) {
                          return (
                            <TableCell key={m} align="center">
                              <Typography variant="body2" color="text.disabled">
                                —
                              </Typography>
                            </TableCell>
                          );
                        }
                        const idx = tramoAlcanzado(neto);
                        return (
                          <TableCell key={m} align="center">
                            {idx < 0 ? (
                              <Tooltip
                                title={`Faltan ${tramosGrupales[0].min - neto} para Meta 1 (${tramosGrupales[0].min}–${tramosGrupales[0].max})`}
                              >
                                <Typography variant="body2" color="text.secondary">
                                  &lt; Meta 1
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Tooltip
                                title={`${neto} equipos — tramo ${tramosGrupales[idx].min}–${tramosGrupales[idx].max}`}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: 'success.main', fontWeight: 600 }}
                                >
                                  Meta {idx + 1}
                                  {neto > tramosGrupales[tramosGrupales.length - 1].max ? '+' : ''}
                                </Typography>
                              </Tooltip>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center">
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {(metaBase > 0 || metaPrimerMes > 0 || metaSuperadora > 0) && (
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" mt={1.5}>
                <Typography variant="caption" color="text.secondary">
                  Referencias:
                </Typography>
                {metaBase > 0 && (
                  <Chip
                    size="small"
                    label="✓ Meta"
                    color="success"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                )}
                {metaSuperadora > 0 && (
                  <Chip size="small" label="🏆 Superadora" color="warning" sx={{ height: 20 }} />
                )}
                <Chip size="small" label="Inactivo" variant="outlined" sx={{ height: 20 }} />
                <Typography variant="caption" color="text.secondary">
                  El premio de cada celda es el mayor alcanzado ese mes (meta base, de primer mes o
                  superadora). El neto en rojo con (−n) indica anulaciones.
                </Typography>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              La venta cuenta en el mes de aprobación de la Nota de Pedido. Las anulaciones (Nota de
              Crédito o rechazo de una NP aprobada) restan en el mes en que ocurren, por lo que un mes
              puede quedar en negativo. Las NC sobre facturas sin nota de pedido no se atribuyen a
              ningún vendedor.
            </Typography>
          </>
        )}

        <DetalleVentasVendedorDialog
          open={detalle !== null}
          onClose={() => setDetalle(null)}
          usuarioId={detalle?.usuarioId ?? null}
          vendedorNombre={detalle?.vendedorNombre ?? ''}
          mes={detalle?.mes ?? dayjs().format('YYYY-MM')}
        />
      </CardContent>
    </Card>
  );
};

export default VentasEquiposVendedorTab;
