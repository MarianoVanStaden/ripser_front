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
  const sortedData = [...data].sort((a, b) => (b.totalLeads || b.cantidad || 0) - (a.totalLeads || a.cantidad || 0));

  console.log('🗺️ Distribución Geográfica - Datos recibidos:', data.slice(0, 3));
  console.log('🗺️ Ejemplo de dato completo:', JSON.stringify(data[0], null, 2));

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
                    <Typography variant="body2" fontWeight="medium">
                      {row.totalLeads ?? row.cantidad ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {row.leadsConvertidos ?? row.convertidos ?? 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${row.tasaConversion?.toFixed(1) ?? '0.0'}%`}
                      size="small"
                      color={(row.tasaConversion ?? 0) >= 30 ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${(row.valorEstimadoTotal ?? 0).toLocaleString()}
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
