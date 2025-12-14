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
  Chip
} from '@mui/material';
import type { MetricaGeograficaDTO } from '../../api/services/leadMetricasApi';

interface DistribucionGeograficaTableProps {
  data: MetricaGeograficaDTO[];
}

export const DistribucionGeograficaTable = ({ data }: DistribucionGeograficaTableProps) => {
  // Ordenar por total de leads descendente
  const sortedData = [...data].sort((a, b) => b.totalLeads - a.totalLeads);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🗺️ Distribución Geográfica
        </Typography>
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Provincia</strong></TableCell>
                <TableCell align="right"><strong>Total Leads</strong></TableCell>
                <TableCell align="right"><strong>Convertidos</strong></TableCell>
                <TableCell align="right"><strong>Tasa Conv.</strong></TableCell>
                <TableCell align="right"><strong>Valor Estimado</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.provincia} hover>
                  <TableCell>{row.provincia}</TableCell>
                  <TableCell align="right">
                    <Chip label={row.totalLeads} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">{row.leadsConvertidos}</TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${row.tasaConversion.toFixed(1)}%`}
                      size="small"
                      color={row.tasaConversion >= 30 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${row.valorEstimadoTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay datos disponibles
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
