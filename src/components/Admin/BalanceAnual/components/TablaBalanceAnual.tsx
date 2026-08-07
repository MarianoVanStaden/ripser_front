import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
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

  const cell = (value: number | undefined | null, separador = false) => (
    <TableCell align="right" sx={separador ? bloquePatrimonial : undefined}>{fmt(value)}</TableCell>
  );

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
      <TableContainer component={Paper} variant="outlined">
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
              {colHeader('Saldo Total')}
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MESES.map((nombre, idx) => {
              const mesNum = idx + 1;
              const m = mesMap.get(mesNum);
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
                  {cell(m?.valorDolar)}
                  {cell(m ? (m as any)[`totalCobrado${suffix}`] : null)}
                  {cell(m ? (m as any)[`totalGastos${suffix}`] : null)}
                  {cell(m ? (m as any)[`saldoParcial${suffix}`] : null)}
                  {cell(m ? (m as any)[`cuentasXPagar${suffix}`] : null, true)}
                  {cell(m ? (m as any)[`stockMateriales${suffix}`] : null)}
                  {cell(m ? (m as any)[`stockFabricacion${suffix}`] : null)}
                  {cell(m ? (m as any)[`stockComercializacion${suffix}`] : null)}
                  {cell(m ? (m as any)[`saldoTotal${suffix}`] : null)}
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
              {/* stocks/CxP son fotos punto-en-tiempo: no tiene sentido sumarlas entre meses */}
              <TableCell align="right" sx={bloquePatrimonial}>—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell align="right">—</TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
