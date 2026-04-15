import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { DesgloseFijoDTO, TipoActivoAmortizable } from '../../../../types';

const TIPO_LABEL: Record<TipoActivoAmortizable, string> = {
  VEHICULO: 'Vehículo',
  HERRAMIENTAS: 'Herramientas',
  INFRAESTRUCTURA: 'Infraestructura',
  MATERIA_PRIMA: 'Materia prima',
  AGUINALDOS: 'Aguinaldos',
  DESEMPLEO: 'Desempleo',
  MAQUINARIA: 'Maquinaria',
  OTRO: 'Otro',
};

interface Props {
  data: DesgloseFijoDTO;
  formatPesos: (n: number) => string;
}

export default function DesgloseFijo({ data, formatPesos }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, mb: 1 }}>
        Activos fijos
      </Typography>

      <Box display="flex" gap={3} mb={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">Valor bruto</Typography>
          <Typography variant="subtitle2" fontWeight={700}>${formatPesos(data.valorBrutoPesos)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Amortizado</Typography>
          <Typography variant="subtitle2" fontWeight={700} color="warning.dark">${formatPesos(data.amortizacionAcumuladaPesos)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Valor neto</Typography>
          <Typography variant="subtitle2" fontWeight={700} color="primary.main">${formatPesos(data.valorNetoPesos)}</Typography>
        </Box>
      </Box>

      {data.porTipo.length === 0 ? (
        <Typography variant="body2" color="text.secondary" py={2}>
          Sin activos registrados
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Valor bruto</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Amortizado</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Valor neto</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Depreciación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.porTipo.map((item) => {
                const pctAmort = item.valorBrutoPesos > 0
                  ? ((item.amortizacionAcumuladaPesos / item.valorBrutoPesos) * 100)
                  : 0;
                const pctNeto = item.valorBrutoPesos > 0
                  ? ((item.valorNetoPesos / item.valorBrutoPesos) * 100)
                  : 0;
                return (
                  <TableRow key={item.tipo} hover>
                    <TableCell>{TIPO_LABEL[item.tipo]}</TableCell>
                    <TableCell align="right">${formatPesos(item.valorBrutoPesos)}</TableCell>
                    <TableCell align="right" sx={{ color: 'warning.dark' }}>${formatPesos(item.amortizacionAcumuladaPesos)}</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>${formatPesos(item.valorNetoPesos)}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            flexGrow: 1,
                            height: 8,
                            borderRadius: 1,
                            bgcolor: 'grey.200',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${pctNeto}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                              borderRadius: 1,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {pctAmort.toFixed(0)}% dep.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
