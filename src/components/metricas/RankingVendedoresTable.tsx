import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import type { MetricaPorVendedorDTO } from '../../api/services/leadMetricasApi';

interface RankingVendedoresTableProps {
  data: MetricaPorVendedorDTO[];
  ocultarMontos?: boolean;
}

export const RankingVendedoresTable = ({ data, ocultarMontos = false }: RankingVendedoresTableProps) => {
  // Ordenar por tasa de conversión descendente
  const sortedData = [...data].sort((a, b) => b.tasaConversion - a.tasaConversion);

  const getMedalIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrophyIcon color="warning" />
          Ranking de Vendedores
        </Typography>
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Pos.</strong></TableCell>
                <TableCell><strong>Vendedor</strong></TableCell>
                <TableCell align="right"><strong>Total Leads</strong></TableCell>
                <TableCell align="right"><strong>Convertidos</strong></TableCell>
                <TableCell align="right"><strong>Tasa Conv.</strong></TableCell>
                {!ocultarMontos && <TableCell align="right"><strong>Valor Estimado</strong></TableCell>}
                {!ocultarMontos && <TableCell align="right"><strong>Valor Realizado</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((vendedor, index) => (
                <TableRow
                  key={vendedor.vendedorId}
                  hover
                  sx={{
                    backgroundColor: index < 3 ? 'status.warning.bg' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box sx={{ fontSize: '1.2rem' }}>
                      {getMedalIcon(index)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={index < 3 ? 'bold' : 'normal'}>
                      {vendedor.vendedorNombre}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={vendedor.totalLeads} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{vendedor.leadsConvertidos}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${vendedor.tasaConversion?.toFixed(1) ?? '0.0'}%`}
                      size="small"
                      color={(vendedor.tasaConversion ?? 0) >= 40 ? 'success' : (vendedor.tasaConversion ?? 0) >= 25 ? 'warning' : 'default'}
                      icon={(vendedor.tasaConversion ?? 0) >= 40 ? <TrendingUpIcon /> : undefined}
                    />
                  </TableCell>
                  {!ocultarMontos && (
                    <TableCell align="right">
                      ${(vendedor.valorEstimadoTotal ?? 0).toLocaleString()}
                    </TableCell>
                  )}
                  {!ocultarMontos && (
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={(vendedor.valorRealizado ?? 0) >= (vendedor.valorEstimadoTotal ?? 0) ? 'success.main' : 'text.primary'}
                        fontWeight="medium"
                      >
                        ${(vendedor.valorRealizado ?? 0).toLocaleString()}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={ocultarMontos ? 5 : 7} align="center">
                    No hay datos de vendedores
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
