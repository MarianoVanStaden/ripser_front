import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Skeleton,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Download,
  Print,
  PhoneInTalk,
  VerifiedUser,
  Info,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { usePublicEquipo } from '../../hooks/usePublicEquipo';
import { generarFichaTecnicaPDF } from '../../services/pdfService';

/**
 * Página PÚBLICA de ficha técnica de equipo.
 *
 * Acceso:
 * - URL: /public/equipos/{numeroHeladera}/ficha
 * - SIN autenticación requerida
 * - Optimizada para móviles (QR scanning)
 * - CORS habilitado
 *
 * FLUJO:
 * 1. Usuario escanea QR en equipo
 * 2. Abre navegador → /public/equipos/COOL-0042/ficha
 * 3. Esta página carga datos públicos del backend
 * 4. Renderiza ficha responsiva mobile-first
 * 5. Permite descargar PDF / imprimir
 *
 * CARACTERÍSTICAS:
 * - ✅ Mobile-first responsive
 * - ✅ Loading skeleton
 * - ✅ Error handling (404, rate limit, etc)
 * - ✅ PDF download
 * - ✅ Print ready
 * - ✅ Corporativo branding
 * - ✅ Accesibilidad (WCAG 2.1 AA)
 */
const PublicFichaEquipoPage: React.FC = () => {
  const navigate = useNavigate();
  const { numeroHeladera: paramNumero } = useParams<{ numeroHeladera?: string }>();
  const { ficha, status, error, cargar, reintentar } = usePublicEquipo();

  // Cargar equipo al montar componente
  useEffect(() => {
    if (paramNumero) {
      cargar(paramNumero);
    }
  }, [paramNumero, cargar]);

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═════════════════════════════════════════════════════════════════════════

  const handleDescargarPDF = async () => {
    if (!ficha) return;

    try {
      // Mapear FichaEquipoPublicDTO a FichaTecnicaEquipoDTO para compatibilidad con pdfService
      const doc = await generarFichaTecnicaPDF({
        ficha: {
          equipo: {
            numeroHeladera: ficha.numeroHeladera,
            clienteNombre: ficha.clienteNombre,
            tipo: ficha.tipo,
            modelo: ficha.modelo,
            medida: { id: 0, nombre: ficha.medida, activo: true },
            color: { id: 0, nombre: ficha.color, activo: true },
          } as any,
          especificacion: {
            modelo: ficha.modelo,
            motor: ficha.motor,
            gas: ficha.gas,
            sistema: ficha.sistema,
            alto: ficha.alto,
            ancho: ficha.ancho,
            profundidad: ficha.profundidad,
            estanteriasCantidad: undefined,
            estanteriasFormato: undefined,
          } as any,
        },
        cliente: ficha.provincia || ficha.localidad ? {
          provincia: ficha.provincia || '',
          ciudad: ficha.localidad || '',
        } as any : undefined,
        fechaFabricacion: ficha.fechaFabricacion,
        fechaEntrega: ficha.fechaEntrega,
      });
      doc.save(`ficha-equipo-${ficha.numeroHeladera}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al descargar PDF. Intenta de nuevo.');
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═════════════════════════════════════════════════════════════════════════

  if (status === 'loading') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton variant="text" width={100} height={40} />
            <Skeleton variant="circular" width={40} height={40} />
          </Box>

          {/* Skeleton de contenido */}
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: ERROR - NO ENCONTRADO (404)
  // ═════════════════════════════════════════════════════════════════════════

  if (status === 'not-found') {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ textAlign: 'center' }}>
            <VerifiedUser sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Equipo no encontrado
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              No se encontró ningún equipo con el número <strong>{paramNumero}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Verifica el número en el QR o intenta de nuevo con otro equipo.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              fullWidth
            >
              Volver
            </Button>
          </Stack>

          <Alert severity="info" sx={{ width: '100%' }}>
            Si crees que esto es un error, contacta con nuestro soporte técnico.
          </Alert>
        </Stack>
      </Container>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: ERROR - RATE LIMITED (429)
  // ═════════════════════════════════════════════════════════════════════════

  if (status === 'rate-limited') {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Alert severity="warning">
            <Typography variant="h6" gutterBottom>
              Demasiadas solicitudes
            </Typography>
            <Typography variant="body2">
              Has alcanzado el límite de solicitudes. Intenta de nuevo en{' '}
              <strong>{error?.retryAfter || 60} segundos</strong>.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            onClick={() => reintentar(paramNumero || '', (error?.retryAfter || 60) * 1000)}
            fullWidth
          >
            Reintentar
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            fullWidth
          >
            Volver
          </Button>
        </Stack>
      </Container>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: ERROR GENÉRICO
  // ═════════════════════════════════════════════════════════════════════════

  if (status === 'error' && error) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Error al cargar ficha técnica
            </Typography>
            <Typography variant="body2">{error.message}</Typography>
          </Alert>

          <Button
            variant="contained"
            onClick={() => cargar(paramNumero || '', true)}
            fullWidth
          >
            Reintentar
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            fullWidth
          >
            Volver
          </Button>
        </Stack>
      </Container>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: SUCCESS - MOSTRAR FICHA
  // ═════════════════════════════════════════════════════════════════════════

  if (!ficha) return null;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Ficha Técnica
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Equipo {ficha.numeroHeladera}
          </Typography>
        </Box>
        <Tooltip title="Volver">
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Box>

      {/* INFORMACIÓN PRINCIPAL */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Columna 1: Identificación */}
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" color="text.secondary" display="block">
                Número de Equipo
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {ficha.numeroHeladera}
              </Typography>

              <Typography variant="overline" color="text.secondary" display="block">
                Modelo
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {ficha.modelo}
              </Typography>

              <Typography variant="overline" color="text.secondary" display="block">
                Tipo de Equipo
              </Typography>
              <Chip
                label={ficha.tipo}
                color="primary"
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Columna 2: Medidas y Color */}
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" color="text.secondary" display="block">
                Medida
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {ficha.medida}
              </Typography>

              <Typography variant="overline" color="text.secondary" display="block">
                Color
              </Typography>
              <Chip label={ficha.color} sx={{ mb: 2 }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ESPECIFICACIONES TÉCNICAS */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          Especificaciones Técnicas
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Motor
                </Typography>
                <Typography variant="body2">{ficha.motor || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Gas Refrigerante
                </Typography>
                <Typography variant="body2">{ficha.gas || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Sistema
                </Typography>
                <Typography variant="body2">{ficha.sistema || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Humedad
                </Typography>
                <Typography variant="body2">{ficha.humedad || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Estructura
                </Typography>
                <Typography variant="body2">{ficha.estructura || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Gabinete
                </Typography>
                <Typography variant="body2">{ficha.gabinete || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Iluminación
                </Typography>
                <Typography variant="body2">{ficha.iluminacion || '-'}</Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Transformador
                </Typography>
                <Typography variant="body2">{ficha.transformador || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  LEDs
                </Typography>
                <Typography variant="body2">{ficha.leds || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Vidrios
                </Typography>
                <Typography variant="body2">{ficha.vidrios || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Paneles
                </Typography>
                <Typography variant="body2">{ficha.paneles || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Puertas
                </Typography>
                <Typography variant="body2">{ficha.puertas || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" display="block">
                  Revestimiento
                </Typography>
                <Typography variant="body2">{ficha.revestimiento || '-'}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* DIMENSIONES Y ESTANTERÍAS */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Dimensiones (mm)
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Alto:</strong> {ficha.alto || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Ancho:</strong> {ficha.ancho || '-'}
                </Typography>
                <Typography variant="body2">
                  <strong>Profundidad:</strong> {ficha.profundidad || '-'}
                </Typography>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            {(ficha.estanteriasCantidad || ficha.estanteriasFormato) && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Estanterías
                </Typography>
                <Stack spacing={1}>
                  {ficha.estanteriasCantidad && (
                    <Typography variant="body2">
                      <strong>Cantidad:</strong> {ficha.estanteriasCantidad}
                    </Typography>
                  )}
                  {ficha.estanteriasFormato && (
                    <Typography variant="body2">
                      <strong>Formato:</strong> {ficha.estanteriasFormato}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* INFORMACIÓN DEL CLIENTE (si existe) */}
      {ficha.clienteNombre && (
        <Paper sx={{ mb: 3, p: 3, bgcolor: 'info.50' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Información de Localidad
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {ficha.clienteNombre && (
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary" display="block">
                  Cliente / Negocio
                </Typography>
                <Typography variant="body1">{ficha.clienteNombre}</Typography>
              </Grid>
            )}

            {ficha.localidad && (
              <Grid item xs={12} sm={6}>
                <Typography variant="overline" color="text.secondary" display="block">
                  Localidad
                </Typography>
                <Typography variant="body1">{ficha.localidad}</Typography>
              </Grid>
            )}

            {ficha.provincia && (
              <Grid item xs={12} sm={6}>
                <Typography variant="overline" color="text.secondary" display="block">
                  Provincia
                </Typography>
                <Typography variant="body1">{ficha.provincia}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* FECHAS IMPORTANTES */}
      <Paper sx={{ mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          Fechas
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {ficha.fechaFabricacion && (
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" color="text.secondary" display="block">
                Fecha de Fabricación
              </Typography>
              <Typography variant="body1">
                {dayjs(ficha.fechaFabricacion).format('DD/MM/YYYY')}
              </Typography>
            </Grid>
          )}

          {ficha.fechaEntrega && (
            <Grid item xs={12} sm={6}>
              <Typography variant="overline" color="text.secondary" display="block">
                Fecha de Entrega
              </Typography>
              <Typography variant="body1">
                {dayjs(ficha.fechaEntrega).format('DD/MM/YYYY')}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ACCIONES */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, '> button': { flex: 1 } }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<Download />}
          onClick={handleDescargarPDF}
          size="large"
        >
          Descargar PDF
        </Button>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<Print />}
          onClick={handleImprimir}
          size="large"
        >
          Imprimir
        </Button>
      </Stack>

      {/* FOOTER - INFO DE CONTACTO */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            ¿Preguntas sobre este equipo?
          </Typography>
          <Button
            variant="text"
            startIcon={<PhoneInTalk />}
            href="tel:+541234567890"
            sx={{ justifyContent: 'center' }}
          >
            Contactar Soporte
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            Ficha recuperada el {dayjs(ficha.recuperadoEn).format('DD/MM/YYYY HH:mm')}
          </Typography>
        </Stack>
      </Paper>

      {/* NOTA DE ACCESIBILIDAD */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Info sx={{ color: 'success.main', mt: 0.5, flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary">
            Esta ficha es información pública del equipo. Para consultas técnicas o servicio de mantenimiento,
            por favor contacta directamente con nuestro equipo.
          </Typography>
        </Stack>
      </Box>
    </Container>
  );
};

export default PublicFichaEquipoPage;
