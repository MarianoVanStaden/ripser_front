import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Task as TaskIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import type { RecordatorioLeadDTO } from '../../types/lead.types';
import { leadApi } from '../../api/services/leadApi';

interface ProximoRecordatorioProps {
  leadId: number;
  recordatorio: RecordatorioLeadDTO | null;
  onRecordatorioEnviado?: () => void;
}

// Íconos por tipo sobre la card de escala ordinal (fondo pastel FIJO en ambos
// esquemas), por eso los colores quedan fijos y no van a tokens de paleta.
const TIPO_RECORDATORIO_CONFIG: Record<string, { icon: React.ReactElement; label: string; color: string }> = {
  // eslint-disable-next-line ripser/no-literal-colors -- ícono sobre card de escala ordinal fija, revisar en dark
  EMAIL: { icon: <EmailIcon />, label: 'Email', color: '#1976d2' },
  // eslint-disable-next-line ripser/no-literal-colors -- ícono sobre card de escala ordinal fija, revisar en dark
  SMS: { icon: <SmsIcon />, label: 'SMS', color: '#9c27b0' },
  // eslint-disable-next-line ripser/no-literal-colors -- ícono sobre card de escala ordinal fija, revisar en dark
  TAREA: { icon: <TaskIcon />, label: 'Tarea', color: '#f57c00' },
  // eslint-disable-next-line ripser/no-literal-colors -- ícono sobre card de escala ordinal fija, revisar en dark
  NOTIFICACION: { icon: <NotificationsIcon />, label: 'Notificación', color: '#0288d1' }
};

export const ProximoRecordatorio = ({ leadId, recordatorio, onRecordatorioEnviado }: ProximoRecordatorioProps) => {
  const [marcandoEnviado, setMarcandoEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!recordatorio) {
    return (
      <Card sx={{ bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon color="disabled" />
            <Typography variant="body2" color="text.secondary">
              No hay recordatorios pendientes
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

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

  const getColorPorProximidad = (diasRestantes: number) => {
    // Escala ordinal de urgencia (6 niveles) — más granular que los 6 roles de
    // status. Fondos pastel FIJOS en ambos esquemas; el texto sobre ellos usa
    // colores fijos legibles (ver sx de la card abajo).
    // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal propia, revisar en dark
    if (diasRestantes < 0) return { bgcolor: '#ffebee', borderColor: '#ef5350', color: '#c62828' }; // Vencido - rojo
    // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal propia, revisar en dark
    if (diasRestantes === 0) return { bgcolor: '#fff3e0', borderColor: '#ff9800', color: '#e65100' }; // Hoy - naranja
    // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal propia, revisar en dark
    if (diasRestantes === 1) return { bgcolor: '#fffde7', borderColor: '#fdd835', color: '#f57f17' }; // Mañana - amarillo
    // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal propia, revisar en dark
    if (diasRestantes <= 3) return { bgcolor: '#f9fbe7', borderColor: '#c0ca33', color: '#827717' }; // 2-3 días - amarillo-verde
    // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal propia, revisar en dark
    if (diasRestantes <= 7) return { bgcolor: '#f1f8e9', borderColor: '#7cb342', color: '#558b2f' }; // 4-7 días - verde claro
    // eslint-disable-next-line ripser/no-literal-colors -- escala ordinal propia, revisar en dark
    return { bgcolor: '#e8f5e9', borderColor: '#66bb6a', color: '#2e7d32' }; // 7+ días - verde
  };

  const formatearFecha = (fecha: string): string => {
    const fechaObj = parseFechaLocal(fecha);
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return fechaObj.toLocaleDateString('es-ES', opciones);
  };

  const getTextoProximidad = (diasRestantes: number): string => {
    if (diasRestantes < 0) return `Vencido hace ${Math.abs(diasRestantes)} día(s)`;
    if (diasRestantes === 0) return 'HOY';
    if (diasRestantes === 1) return 'MAÑANA';
    return `En ${diasRestantes} días`;
  };

  const handleMarcarEnviado = async () => {
    if (!recordatorio.id) return;

    try {
      setMarcandoEnviado(true);
      setError(null);
      await leadApi.marcarRecordatorioEnviado(leadId, recordatorio.id);
      if (onRecordatorioEnviado) {
        onRecordatorioEnviado();
      }
    } catch (err: any) {
      console.error('Error al marcar recordatorio como enviado:', err);
      setError(err.response?.data?.message || 'Error al marcar como enviado');
    } finally {
      setMarcandoEnviado(false);
    }
  };

  const diasRestantes = calcularDiasRestantes(recordatorio.fechaRecordatorio);
  const colores = getColorPorProximidad(diasRestantes);
  const tipoConfig = TIPO_RECORDATORIO_CONFIG[recordatorio.tipo] || TIPO_RECORDATORIO_CONFIG.NOTIFICACION;

  return (
    <Card 
      sx={{ 
        bgcolor: colores.bgcolor,
        border: '2px solid',
        borderColor: colores.borderColor,
        boxShadow: 2
      }}
    >
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: tipoConfig.color }}>
              {tipoConfig.icon}
            </Box>
            <Typography variant="h6" color={colores.color} fontWeight="bold">
              Próximo Recordatorio
            </Typography>
          </Box>
          
          <Chip 
            label={getTextoProximidad(diasRestantes)}
            size="small"
            sx={{
              bgcolor: colores.borderColor,
              color: 'common.white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          {/* La card usa el fondo pastel fijo de la escala ordinal: en dark el
              texto vuelve a colores oscuros fijos para seguir legible; en light
              queda idéntico (text.secondary / text.primary). */}
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            // eslint-disable-next-line ripser/no-literal-colors -- texto fijo sobre card de escala ordinal fija (solo dark)
            sx={(theme) => theme.applyStyles('dark', { color: 'rgba(0,0,0,0.6)' })}
          >
            <strong>Tipo:</strong> {tipoConfig.label}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            // eslint-disable-next-line ripser/no-literal-colors -- texto fijo sobre card de escala ordinal fija (solo dark)
            sx={(theme) => theme.applyStyles('dark', { color: 'rgba(0,0,0,0.6)' })}
          >
            <strong>Fecha:</strong> {formatearFecha(recordatorio.fechaRecordatorio)}
          </Typography>

          {recordatorio.mensaje && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'common.white', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
              <Typography
                variant="body2"
                color="text.primary"
                // eslint-disable-next-line ripser/no-literal-colors -- texto fijo sobre fondo blanco fijo de la card ordinal (solo dark)
                sx={(theme) => theme.applyStyles('dark', { color: 'rgba(0,0,0,0.87)' })}
              >
                {recordatorio.mensaje}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={marcandoEnviado ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
            onClick={handleMarcarEnviado}
            disabled={marcandoEnviado}
          >
            {marcandoEnviado ? 'Marcando...' : 'Marcar como Enviado'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
