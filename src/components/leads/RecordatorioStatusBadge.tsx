import { Box, Chip, Tooltip, Typography } from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import type { RecordatorioLeadDTO } from '../../types/lead.types';

interface RecordatorioStatusBadgeProps {
  recordatorios?: RecordatorioLeadDTO[];
}

const TIPO_ICONS: Record<string, React.ReactElement> = {
  EMAIL: <EmailIcon fontSize="inherit" />,
  SMS: <SmsIcon fontSize="inherit" />,
  TAREA: <TaskIcon fontSize="inherit" />,
  NOTIFICACION: <NotificationsIcon fontSize="inherit" />
};

export const RecordatorioStatusBadge = ({ recordatorios }: RecordatorioStatusBadgeProps) => {
  if (!recordatorios || recordatorios.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 40 }}>
        <Chip 
          icon={<AccessTimeIcon />}
          label="Sin recordatorios"
          size="small"
          sx={{ 
            bgcolor: 'grey.100',
            color: 'text.secondary',
            fontSize: '0.75rem'
          }}
        />
      </Box>
    );
  }

  // Filtrar pendientes y ordenar por fecha
  const pendientes = recordatorios
    .filter(r => !r.enviado)
    .sort((a, b) => new Date(a.fechaRecordatorio).getTime() - new Date(b.fechaRecordatorio).getTime());

  const enviados = recordatorios.filter(r => r.enviado);
  
  const proximo = pendientes[0];

  // Parsear fecha en formato YYYY-MM-DD como fecha local (no UTC)
  const parseFechaLocal = (fecha: string): Date => {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const calcularDiasRestantes = (fecha: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaRecordatorio = parseFechaLocal(fecha);
    fechaRecordatorio.setHours(0, 0, 0, 0);
    return Math.ceil((fechaRecordatorio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getColorEstado = (diasRestantes: number) => {
    if (diasRestantes < 0) return { bgcolor: '#ef5350', color: 'white', borderColor: '#c62828' }; // Vencido
    if (diasRestantes === 0) return { bgcolor: '#ff9800', color: 'white', borderColor: '#e65100' }; // Hoy
    if (diasRestantes === 1) return { bgcolor: '#fdd835', color: '#000', borderColor: '#f57f17' }; // Mañana
    if (diasRestantes <= 3) return { bgcolor: '#c0ca33', color: 'white', borderColor: '#827717' }; // 2-3 días
    if (diasRestantes <= 7) return { bgcolor: '#7cb342', color: 'white', borderColor: '#558b2f' }; // 4-7 días
    return { bgcolor: '#66bb6a', color: 'white', borderColor: '#2e7d32' }; // 7+ días
  };

  const formatearFechaCorta = (fecha: string): string => {
    const fechaObj = parseFechaLocal(fecha);
    return fechaObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  const getTextoProximidad = (diasRestantes: number): string => {
    if (diasRestantes < 0) return `Vencido`;
    if (diasRestantes === 0) return 'HOY';
    if (diasRestantes === 1) return 'Mañana';
    return `${diasRestantes}d`;
  };

  // Si hay próximo pendiente
  if (proximo) {
    const diasRestantes = calcularDiasRestantes(proximo.fechaRecordatorio);
    const colores = getColorEstado(diasRestantes);
    const tipoIcon = TIPO_ICONS[proximo.tipo] || TIPO_ICONS.NOTIFICACION;

    const tooltipContent = (
      <Box>
        <Typography variant="body2" fontWeight="bold">
          Próximo: {proximo.tipo?.replace(/_/g, ' ')}
        </Typography>
        <Typography variant="caption" display="block">
          Fecha: {parseFechaLocal(proximo.fechaRecordatorio).toLocaleDateString('es-ES', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })}
        </Typography>
        {proximo.mensaje && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            {proximo.mensaje}
          </Typography>
        )}
        {pendientes.length > 1 && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'warning.light' }}>
            +{pendientes.length - 1} pendiente(s) más
          </Typography>
        )}
        {enviados.length > 0 && (
          <Typography variant="caption" display="block" sx={{ color: 'success.light' }}>
            ✓ {enviados.length} enviado(s)
          </Typography>
        )}
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
          <Chip
            icon={diasRestantes < 0 ? <WarningIcon /> : tipoIcon}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontWeight="bold">
                  {getTextoProximidad(diasRestantes)}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {formatearFechaCorta(proximo.fechaRecordatorio)}
                </Typography>
              </Box>
            }
            size="small"
            sx={{
              bgcolor: colores.bgcolor,
              color: colores.color,
              fontWeight: 'bold',
              border: 1,
              borderColor: colores.borderColor,
              '& .MuiChip-icon': {
                color: colores.color
              }
            }}
          />
          {(pendientes.length > 1 || enviados.length > 0) && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {pendientes.length > 1 && (
                <Chip 
                  label={`+${pendientes.length - 1}`}
                  size="small"
                  sx={{ 
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: 'warning.light',
                    color: 'white'
                  }}
                />
              )}
              {enviados.length > 0 && (
                <Chip 
                  icon={<CheckCircleIcon fontSize="inherit" />}
                  label={enviados.length}
                  size="small"
                  sx={{ 
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: 'success.light',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white',
                      fontSize: '0.7rem'
                    }
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Solo hay recordatorios enviados
  if (enviados.length > 0) {
    const ultimo = enviados.sort((a, b) => 
      new Date(b.fechaEnvio || b.fechaRecordatorio).getTime() - 
      new Date(a.fechaEnvio || a.fechaRecordatorio).getTime()
    )[0];

    const tooltipContent = (
      <Box>
        <Typography variant="body2" fontWeight="bold">
          Último enviado: {ultimo.tipo?.replace(/_/g, ' ')}
        </Typography>
        {ultimo.fechaEnvio && (
          <Typography variant="caption" display="block">
            {new Date(ultimo.fechaEnvio).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        )}
        {enviados.length > 1 && (
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            Total: {enviados.length} enviado(s)
          </Typography>
        )}
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} arrow placement="top">
        <Chip
          icon={<CheckCircleIcon />}
          label={`${enviados.length} Enviado${enviados.length > 1 ? 's' : ''}`}
          size="small"
          sx={{
            bgcolor: 'success.light',
            color: 'white',
            '& .MuiChip-icon': {
              color: 'white'
            }
          }}
        />
      </Tooltip>
    );
  }

  return null;
};
