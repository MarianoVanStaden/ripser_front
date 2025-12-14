import { Card, CardContent, Typography, Box } from '@mui/material';
import type { MetricaPorPrioridadDTO } from '../../api/services/leadMetricasApi';

interface MetricasPrioridadChartProps {
  data: MetricaPorPrioridadDTO[];
}

export const MetricasPrioridadChart = ({ data }: MetricasPrioridadChartProps) => {
  // Debug: Ver qué datos están llegando
  console.log('🎯 MetricasPrioridadChart - Datos recibidos:', data);
  console.log('🎯 Tipo de data:', Array.isArray(data) ? 'array' : typeof data);
  console.log('🎯 Cantidad de items:', data?.length);

  const prioridadLabels: Record<string, string> = {
    'ALTA': '🔴 Alta',
    'MEDIA': '🟡 Media',
    'BAJA': '🟢 Baja',
    'HOT': '🔥 Hot',
    'WARM': '🟡 Warm',
    'COLD': '❄️ Cold'
  };

  const prioridadColors: Record<string, string> = {
    'ALTA': '#f44336',
    'MEDIA': '#ff9800',
    'BAJA': '#4caf50',
    'HOT': '#f44336',
    'WARM': '#ff9800',
    'COLD': '#2196f3'
  };

  const total = data.reduce((sum, item) => sum + item.cantidad, 0);
  console.log('🎯 Total de leads calculado:', total);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🎯 Distribución por Prioridad
        </Typography>

        {/* Gráfico circular simple */}
        {total > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <Box sx={{ position: 'relative', width: 200, height: 200 }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {data.map((item, index) => {
                const percentage = (item.cantidad / total) * 100;
                const previousPercentages = data
                  .slice(0, index)
                  .reduce((sum, prev) => sum + (prev.cantidad / total) * 100, 0);
                
                const startAngle = (previousPercentages / 100) * 360;
                const endAngle = ((previousPercentages + percentage) / 100) * 360;
                
                const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                
                const largeArcFlag = percentage > 50 ? 1 : 0;
                
                return (
                  <path
                    key={item.prioridad}
                    d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={prioridadColors[item.prioridad]}
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
              </svg>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3, minHeight: 200 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              📊 No hay datos para mostrar<br />
              <Typography variant="caption" component="span">
                Agrega leads con diferentes prioridades para ver la distribución
              </Typography>
            </Typography>
          </Box>
        )}

        {/* Leyenda */}
        <Box sx={{ mt: 2 }}>
          {data.map((item) => {
            const percentage = item.porcentaje || ((item.cantidad / total) * 100);
            
            return (
              <Box key={item.prioridad} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: prioridadColors[item.prioridad],
                      borderRadius: '50%',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2" fontWeight="medium" sx={{ flex: 1 }}>
                    {prioridadLabels[item.prioridad] || item.prioridad}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.cantidad} ({(total > 0 && !isNaN(percentage)) ? percentage.toFixed(1) : '0.0'}%)
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                  Convertidos: {item.convertidos ?? 0} •
                  Tasa: {(item.tasaConversion && !isNaN(item.tasaConversion)) ? item.tasaConversion.toFixed(1) : '0.0'}% •
                  Valor prom: ${(item.promedioValorEstimado && !isNaN(item.promedioValorEstimado)) ? item.promedioValorEstimado.toFixed(0) : '0'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
