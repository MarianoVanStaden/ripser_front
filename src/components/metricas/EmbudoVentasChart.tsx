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
    'SEGUNDO_CONTACTO': 'Segundo Contacto',
    'TERCER_CONTACTO': 'Tercer Contacto',
    'MOSTRO_INTERES': 'Mostró Interés',
    'CLIENTE_POTENCIAL': 'Cliente Potencial',
    'CLIENTE_POTENCIAL_CALIFICADO': 'Cliente Calificado',
    'VENTA': 'Venta',
    'CONVERTIDO': 'Convertido',
    'DESCARTADO': 'Descartado'
  };

  // Colores para cada estado — escala ordinal del embudo (9 niveles,
  // azul→verde + gris), más granular que los 6 roles de status y con orden
  // secuencial propio; queda fija en ambos esquemas, con texto blanco fijo.
  const getColor = (estado: string) => {
    const colors: Record<string, string> = {
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'PRIMER_CONTACTO': '#2196f3',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'SEGUNDO_CONTACTO': '#1976d2',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'TERCER_CONTACTO': '#1565c0',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'MOSTRO_INTERES': '#03a9f4',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'CLIENTE_POTENCIAL': '#00bcd4',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'CLIENTE_POTENCIAL_CALIFICADO': '#009688',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'VENTA': '#4caf50',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'CONVERTIDO': '#8bc34a',
      // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal del embudo (9 niveles), revisar en dark
      'DESCARTADO': '#9e9e9e'
    };
    // eslint-disable-next-line ripser/no-literal-colors -- fallback de la escala ordinal fija
    return colors[estado] || '#757575';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 Embudo de Ventas
        </Typography>
        <Box sx={{ mt: 3 }}>
          {sortedData.map((item) => {
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
                    backgroundColor: 'action.hover',
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
                      color: 'common.white',
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
