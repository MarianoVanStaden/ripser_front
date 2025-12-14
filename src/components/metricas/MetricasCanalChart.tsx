import { Card, CardContent, Typography, Box } from '@mui/material';
import type { MetricaPorCanalDTO } from '../../api/services/leadMetricasApi';

interface MetricasCanalChartProps {
  data: MetricaPorCanalDTO[];
}

export const MetricasCanalChart = ({ data }: MetricasCanalChartProps) => {
  // Ordenar por total de leads descendente
  const sortedData = [...data].sort((a, b) => b.totalLeads - a.totalLeads);

  const maxLeads = Math.max(...sortedData.map(d => d.totalLeads));

  const canalLabels: Record<string, string> = {
    'WEB': '🌐 Web',
    'TELEFONO': '📞 Teléfono',
    'EMAIL': '✉️ Email',
    'REDES_SOCIALES': '📱 Redes Sociales',
    'REFERIDO': '👥 Referido',
    'EVENTO': '🎪 Evento',
    'OTRO': '📋 Otro'
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📈 Métricas por Canal
        </Typography>
        <Box sx={{ mt: 3 }}>
          {sortedData.map((canal) => {
            const width = (canal.totalLeads / maxLeads) * 100;
            
            return (
              <Box key={canal.canal} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {canalLabels[canal.canal] || canal.canal}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {canal.totalLeads} leads
                  </Typography>
                </Box>
                
                <Box
                  sx={{
                    width: '100%',
                    height: 30,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    mb: 0.5
                  }}
                >
                  <Box
                    sx={{
                      width: `${width}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2196f3 0%, #1976d2 100%)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                  <span>Convertidos: {canal.leadsConvertidos}</span>
                  <span>Tasa: {canal.tasaConversion.toFixed(1)}%</span>
                  <span>Tiempo Prom: {canal.promedioTiempoConversion.toFixed(0)} días</span>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
