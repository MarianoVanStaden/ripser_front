import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Card,
  CardContent,
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
  porMes: Map<string, CeldaMes>; // clave 'YYYY-MM'
  totalHeladeras: number;
  totalCoolboxes: number;
  totalNeto: number;
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

const VentasEquiposVendedorTab: React.FC = () => {
  const { empresaId } = useTenant();
  const [desde, setDesde] = useState(dayjs().subtract(11, 'month').format('YYYY-MM'));
  const [hasta, setHasta] = useState(dayjs().format('YYYY-MM'));

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
          porMes: new Map(),
          totalHeladeras: 0,
          totalCoolboxes: 0,
          totalNeto: 0,
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

  const renderCelda = (celda: CeldaMes | undefined) => {
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
          </Box>
        }
      >
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2" component="div">
            H: <NetoTexto valor={celda.heladerasNeto} anuladas={anuladasH} />
          </Typography>
          <Typography variant="body2" component="div">
            C: <NetoTexto valor={celda.coolboxesNeto} anuladas={anuladasC} />
          </Typography>
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
                        {fila.vendedorNombre}
                      </TableCell>
                      {meses.map((m) => (
                        <TableCell key={m} align="center">
                          {renderCelda(fila.porMes.get(m))}
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
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              La venta cuenta en el mes de aprobación de la Nota de Pedido. Las anulaciones (Nota de
              Crédito o rechazo de una NP aprobada) restan en el mes en que ocurren, por lo que un mes
              puede quedar en negativo. Las NC sobre facturas sin nota de pedido no se atribuyen a
              ningún vendedor.
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VentasEquiposVendedorTab;
