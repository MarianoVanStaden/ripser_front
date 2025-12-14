import { Card, CardContent, Typography, Box } from '@mui/material';
import type { EmbudoVentasDTO } from '../../api/services/leadMetricasApi';

interface EmbudoVentasChartProps {
  data: EmbudoVentasDTO[];
}

export const EmbudoVentasChart = ({ data }: EmbudoVentasChartProps) => {
  // Ordenar por orden
  const sortedData = [...data].sort((a, b) => a.orden - b.orden);
  
  // Calcular el máximo para escalar
  const maxCantidad = Math.max(...sortedData.map(d => d.cantidad));

  // Mapeo de estados a nombres legibles
  const estadoLabels: Record<string, string> = {
    'PRIMER_CONTACTO': 'Primer Contacto',
    'MOSTRO_INTERES': 'Mostró Interés',
    'CLIENTE_POTENCIAL': 'Cliente Potencial',
    'CLIENTE_POTENCIAL_CALIFICADO': 'Cliente Calificado',
    'VENTA': 'Venta',
    'CONVERTIDO': 'Convertido',
    'DESCARTADO': 'Descartado'
  };

  // Colores para cada estado
  const getColor = (estado: string) => {
    const colors: Record<string, string> = {
      'PRIMER_CONTACTO': '#2196f3',
      'MOSTRO_INTERES': '#03a9f4',
      'CLIENTE_POTENCIAL': '#00bcd4',
      'CLIENTE_POTENCIAL_CALIFICADO': '#009688',
      'VENTA': '#4caf50',
      'CONVERTIDO': '#8bc34a',
      'DESCARTADO': '#9e9e9e'
    };
    return colors[estado] || '#757575';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Embudo de Ventas
        </Typography>
        <Box sx={{ mt: 3 }}>
          {sortedData.map((item, index) => {
            const width = (item.cantidad / maxCantidad) * 100;
            
            return (
              <Box key={item.estadoLead} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {estadoLabels[item.estadoLead] || item.estadoLead}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.cantidad} ({item.porcentaje?.toFixed(1) ?? '0.0'}%)
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 40,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      width: `${width}%`,
                      height: '100%',
                      backgroundColor: getColor(item.estadoLead),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'width 0.3s ease',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.cantidad > 0 && item.cantidad}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
