import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import type { PosicionPatrimonialDTO } from '../../../../types';

interface Props {
  data: PosicionPatrimonialDTO;
  formatPesos: (n: number) => string;
}

interface FilaProps {
  label: string;
  valor: number;
  total: number;
  formatPesos: (n: number) => string;
  bold?: boolean;
}

function FilaActivo({ label, valor, total, formatPesos, bold }: FilaProps) {
  const pct = total > 0 ? ((valor / total) * 100).toFixed(1) : '—';
  return (
    <Box display="flex" justifyContent="space-between" alignItems="baseline" py={0.5}>
      <Typography variant="body2" fontWeight={bold ? 700 : 400}>{label}</Typography>
      <Box textAlign="right">
        <Typography variant="body2" fontWeight={bold ? 700 : 400}>
          ${formatPesos(valor)}
        </Typography>
        {!bold && (
          <Typography variant="caption" color="text.secondary" display="block">
            {pct}%
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function ResumenPatrimonial({ data, formatPesos }: Props) {
  const pnColor =
    data.patrimonioNetoPesos > 0 ? 'success.main' :
    data.patrimonioNetoPesos < 0 ? 'error.main' :
    'text.secondary';

  return (
    <Grid container spacing={2}>
      {/* Columna ACTIVOS */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
          <Typography variant="overline" sx={{ display: 'block', color: 'primary.main', fontWeight: 700, mb: 1 }}>
            Activos
          </Typography>
          <FilaActivo label="Stock materiales" valor={data.stockMaterialesPesos} total={data.totalActivosPesos} formatPesos={formatPesos} />
          <FilaActivo label="Stock fabricación" valor={data.stockFabricacionPesos} total={data.totalActivosPesos} formatPesos={formatPesos} />
          <FilaActivo label="Stock comercialización" valor={data.stockComercializacionPesos} total={data.totalActivosPesos} formatPesos={formatPesos} />
          <FilaActivo label="Cuentas x cobrar" valor={data.cuentasXCobrarPesos} total={data.totalActivosPesos} formatPesos={formatPesos} />
          <FilaActivo label="Patrimonio fijo" valor={data.patrimonioFijoPesos} total={data.totalActivosPesos} formatPesos={formatPesos} />
          <Divider sx={{ my: 1 }} />
          <FilaActivo label="TOTAL ACTIVOS" valor={data.totalActivosPesos} total={data.totalActivosPesos} formatPesos={formatPesos} bold />
        </Paper>
      </Grid>

      {/* Columna PASIVOS + PATRIMONIO NETO */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
          <Typography variant="overline" sx={{ display: 'block', color: 'warning.dark', fontWeight: 700, mb: 1 }}>
            Pasivos
          </Typography>
          <FilaActivo label="Cuentas x pagar" valor={data.cuentasXPagarPesos} total={data.totalActivosPesos} formatPesos={formatPesos} />
          <Divider sx={{ my: 1 }} />
          <FilaActivo label="TOTAL PASIVOS" valor={data.totalPasivosPesos} total={data.totalActivosPesos} formatPesos={formatPesos} bold />

          <Box mt={3} p={1.5} sx={{ bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
              Patrimonio neto
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: pnColor }}>
              ${formatPesos(data.patrimonioNetoPesos)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Activos − Pasivos
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
