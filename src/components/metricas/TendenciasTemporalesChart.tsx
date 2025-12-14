import { Card, CardContent, Typography, Box } from '@mui/material';
import type { TendenciasTemporalesDTO } from '../../api/services/leadMetricasApi';

interface TendenciasTemporalesChartProps {
  data: TendenciasTemporalesDTO;
}

export const TendenciasTemporalesChart = ({ data }: TendenciasTemporalesChartProps) => {
  console.log('📈 TendenciasTemporalesChart - Datos recibidos:', {
    leadsPorMes: data.leadsPorMes,
    conversionesPorMes: data.conversionesPorMes
  });
  
  const maxLeads = Math.max(...data.leadsPorMes.map(d => d.cantidad), 1);
  const maxConversiones = Math.max(...data.conversionesPorMes.map(d => d.cantidad), 1);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📈 Tendencias Temporales
        </Typography>

        {/* Gráfico de Leads por Mes */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Leads por Mes
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 150 }}>
            {data.leadsPorMes.map((item, index) => {
              const height = (item.cantidad / maxLeads) * 100;
              
              return (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ minHeight: 20 }}>
                    {item.cantidad}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: `${height}%`,
                      minHeight: item.cantidad > 0 ? 10 : 0,
                      backgroundColor: '#2196f3',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#1976d2',
                        cursor: 'pointer'
                      }
                    }}
                    title={`${item.mesNombre || item.mes}: ${item.cantidad} leads`}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      textAlign: 'center',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.mesNombre ? item.mesNombre.split(' ')[0]?.slice(0, 3) : item.mes}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.55rem',
                      textAlign: 'center',
                      color: 'text.disabled',
                      fontWeight: 'bold',
                      mt: 0.5
                    }}
                  >
                    {item.mesNombre ? item.mesNombre.split(' ')[1] : ''}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Gráfico de Conversiones por Mes */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle2" gutterBottom>
            Conversiones por Mes
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 150 }}>
            {data.conversionesPorMes.map((item, index) => {
              const height = (item.cantidad / maxConversiones) * 100;
              
              return (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ minHeight: 20 }}>
                    {item.cantidad}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: `${height}%`,
                      minHeight: item.cantidad > 0 ? 10 : 0,
                      backgroundColor: '#4caf50',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#388e3c',
                        cursor: 'pointer'
                      }
                    }}
                    title={`${item.mesNombre || item.mes}: ${item.cantidad} conversiones`}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      textAlign: 'center',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.mesNombre ? item.mesNombre.split(' ')[0]?.slice(0, 3) : item.mes}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.55rem',
                      textAlign: 'center',
                      color: 'text.disabled',
                      fontWeight: 'bold',
                      mt: 0.5
                    }}
                  >
                    {item.mesNombre ? item.mesNombre.split(' ')[1] : ''}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
