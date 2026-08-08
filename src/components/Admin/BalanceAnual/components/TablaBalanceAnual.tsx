import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import { StickyScrollTable } from '../../../common/StickyScrollTable';
import CalculateIcon from '@mui/icons-material/Calculate';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import type { BalanceAnualResponseDTO, BalanceMensualDTO, TotalesAnuales } from '../../../../types';
import EstadoBalanceBadge from './EstadoBalanceBadge';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function fmt(n: number | undefined | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * Variación % vs el mes anterior: verde si subió, gris si igual, rojo si bajó.
 * `invertir` da vuelta los colores para métricas donde subir es malo (gastos, deuda).
 */
function Variacion({ actual, anterior, invertir }: { actual: number | undefined | null; anterior: number | undefined | null; invertir?: boolean }) {
  if (actual == null || anterior == null || anterior === 0) return null;
  const pct = ((actual - anterior) / Math.abs(anterior)) * 100;
  const igual = Math.abs(pct) < 0.05; // se mostraría como 0.0%
  const subioColor = invertir ? 'error.main' : 'success.main';
  const bajoColor = invertir ? 'success.main' : 'error.main';
  const color = igual ? 'text.secondary' : pct > 0 ? subioColor : bajoColor;
  const flecha = igual ? '=' : pct > 0 ? '▲' : '▼';
  return (
    <Typography variant="caption" display="block" sx={{ color, lineHeight: 1.2 }}>
      {flecha} {igual ? '0%' : `${Math.abs(pct).toFixed(1)}%`}
    </Typography>
  );
}

interface Props {
  data: BalanceAnualResponseDTO;
  anio: number;
  moneda: 'pesos' | 'dolares';
  onMonedaChange: (v: 'pesos' | 'dolares') => void;
  onCalcular: (mes: number) => void;
  onCerrar: (mes: number) => void;
}

export default function TablaBalanceAnual({ data, anio, moneda, onMonedaChange, onCalcular: _onCalcular, onCerrar }: Props) {
  const navigate = useNavigate();
  const suffix = moneda === 'pesos' ? 'Pesos' : 'Dolares';
  const simbolo = moneda === 'pesos' ? '$' : 'USD';

  const mesMap = new Map<number, BalanceMensualDTO>();
  data.meses.forEach((m) => mesMap.set(m.mes, m));

  const totales: TotalesAnuales = data.totalesAnuales;

  // borde izquierdo = separador visual entre bloque flujo de dinero y bloque patrimonial
  const bloquePatrimonial = { borderLeft: '2px solid', borderLeftColor: 'grey.300' };

  const colHeader = (label: string, separador = false) => (
    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap', ...(separador ? bloquePatrimonial : {}) }}>
      {label} ({simbolo})
    </TableCell>
  );

  const cell = (value: number | undefined | null, separador = false, anterior?: number | undefined | null, invertir = false) => (
    <TableCell align="right" sx={separador ? bloquePatrimonial : undefined}>
      {fmt(value)}
      <Variacion actual={value} anterior={anterior} invertir={invertir} />
    </TableCell>
  );

  // Acceso dinámico según el switch pesos/dólares
  const v = (m: BalanceMensualDTO | undefined, base: string): number | null =>
    m ? ((m as any)[`${base}${suffix}`] ?? null) : null;

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <FormControlLabel
          control={
            <Switch
              checked={moneda === 'dolares'}
              onChange={(e) => onMonedaChange(e.target.checked ? 'dolares' : 'pesos')}
            />
          }
          label="Ver en dólares"
        />
      </Box>
      <StickyScrollTable minWidth={1900} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>Mes</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Dólar</TableCell>
              {colHeader('Cobrado')}
              {colHeader('Gastos')}
              {colHeader('Saldo Parcial')}
              {colHeader('Cuentas x Pagar', true)}
              {colHeader('Stock materiales')}
              {colHeader('Stock Fabricación')}
              {colHeader('Stock comercialización')}
              {colHeader('Créditos a cobrar')}
              {colHeader('Cajas')}
              {/* Cajas USD siempre en dólares nativos, no la afecta el switch */}
              <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Cajas (USD)</TableCell>
              {colHeader('Financiamiento')}
              {colHeader('Saldo Total')}
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MESES.map((nombre, idx) => {
              const mesNum = idx + 1;
              const m = mesMap.get(mesNum);
              const prev = mesMap.get(mesNum - 1);
              const esCerrado = m?.estado === 'CERRADO' || m?.estado === 'AUDITADO';

              return (
                <TableRow
                  key={mesNum}
                  hover
                  sx={{
                    bgcolor: esCerrado ? 'grey.50' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/admin/balance/${anio}/${mesNum}`)}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{nombre}</TableCell>
                  {cell(m?.valorDolar, false, prev?.valorDolar)}
                  {cell(v(m, 'totalCobrado'), false, v(prev, 'totalCobrado'))}
                  {cell(v(m, 'totalGastos'), false, v(prev, 'totalGastos'), true)}
                  {cell(v(m, 'saldoParcial'), false, v(prev, 'saldoParcial'))}
                  {cell(v(m, 'cuentasXPagar'), true, v(prev, 'cuentasXPagar'), true)}
                  {cell(v(m, 'stockMateriales'), false, v(prev, 'stockMateriales'))}
                  {cell(v(m, 'stockFabricacion'), false, v(prev, 'stockFabricacion'))}
                  {cell(v(m, 'stockComercializacion'), false, v(prev, 'stockComercializacion'))}
                  {cell(v(m, 'creditosACobrar'), false, v(prev, 'creditosACobrar'))}
                  {cell(v(m, 'disponibilidades'), false, v(prev, 'disponibilidades'))}
                  {cell(m?.cajasUsdDolares, false, prev?.cajasUsdDolares)}
                  {cell(v(m, 'financiamiento'), false, v(prev, 'financiamiento'))}
                  {cell(v(m, 'saldoTotal'), false, v(prev, 'saldoTotal'))}
                  <TableCell>
                    {m ? <EstadoBalanceBadge estado={m.estado} /> : <Typography variant="caption" color="text.secondary">Sin datos</Typography>}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Box display="flex" gap={0.5}>
                      {(!m || m.estado === 'BORRADOR') && (
                        <Tooltip title="Calcular desde flujo de caja">
                          <IconButton size="small" onClick={() => navigate(`/admin/balance/${anio}/${mesNum}`)}>
                            <CalculateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {m?.estado === 'BORRADOR' && (
                        <Tooltip title="Cerrar mes">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => onCerrar(mesNum)}
                          >
                            <LockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Totales row */}
            <TableRow sx={{ bgcolor: 'primary.50', fontWeight: 700 }}>
              <TableCell sx={{ fontWeight: 700 }}>TOTAL ANUAL</TableCell>
              <TableCell align="right">—</TableCell>
              {cell((totales as any)[`totalCobrado${suffix}`])}
              {cell((totales as any)[`totalGastos${suffix}`])}
              {cell(((totales as any)[`totalCobrado${suffix}`] ?? 0) - ((totales as any)[`totalGastos${suffix}`] ?? 0))}
              {/* rubros patrimoniales son fotos punto-en-tiempo: no tiene sentido sumarlos entre meses */}
              <TableCell align="right" sx={bloquePatrimonial}>—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </StickyScrollTable>
    </Box>
  );
}
