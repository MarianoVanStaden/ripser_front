import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import BuildIcon from '@mui/icons-material/Build';
import StorefrontIcon from '@mui/icons-material/Storefront';
import type { DesgloseStockDTO } from '../../../../types';

interface Props {
  data: DesgloseStockDTO;
  formatPesos: (n: number) => string;
}

export default function DesgloseStock({ data, formatPesos }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 2 }}>
        Desglose de stock
      </Typography>

      <Grid container spacing={2}>
        {/* Materiales */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <InventoryIcon fontSize="small" color="action" />
              <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1 }}>Materiales</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>${formatPesos(data.materialesPesos)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Intl.NumberFormat('es-AR').format(data.materialesTotalUnidades)} unidades
            </Typography>
          </Paper>
        </Grid>

        {/* Fabricación */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BuildIcon fontSize="small" color="action" />
              <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1 }}>En fabricación</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>${formatPesos(data.fabricacionPesos)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {data.fabricacionTotalEquipos} {data.fabricacionTotalEquipos === 1 ? 'equipo' : 'equipos'} en proceso
            </Typography>
          </Paper>
        </Grid>

        {/* Comercialización */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <StorefrontIcon fontSize="small" color="action" />
              <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1 }}>Comercialización</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700}>
              ${formatPesos(data.comercializacionProductosTerminadosPesos + data.comercializacionEquiposDisponiblesPesos)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.comercializacionTotalEquipos} {data.comercializacionTotalEquipos === 1 ? 'equipo' : 'equipos'} disponibles
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Productos terminados: ${formatPesos(data.comercializacionProductosTerminadosPesos)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Equipos disponibles: ${formatPesos(data.comercializacionEquiposDisponiblesPesos)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
