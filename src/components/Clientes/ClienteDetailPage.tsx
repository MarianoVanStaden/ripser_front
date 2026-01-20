import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Rating,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import type { Cliente, EstadoCliente } from '../../types';
import { PROVINCIA_LABELS } from '../../types/shared.enums';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import { documentoClienteApi } from '../../api/services/documentoClienteApi';
import { ContactosTab, CuentaCorrienteTab } from './index';
import DocumentManager from '../shared/DocumentManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`cliente-tabpanel-${index}`}
      aria-labelledby={`cliente-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `cliente-tab-${index}`,
    'aria-controls': `cliente-tabpanel-${index}`,
  };
}

const ClienteDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      loadCliente(Number(id));
    }
  }, [id]);

  const loadCliente = async (clienteId: number) => {
    try {
      setLoading(true);
      const data = await clienteApi.getById(clienteId);
      setCliente(data);
    } catch (err) {
      setError('Error al cargar el cliente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getEstadoColor = (estado: EstadoCliente) => {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'default';
      case 'SUSPENDIDO':
        return 'warning';
      case 'MOROSO':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'PERSONA_FISICA' ? <PersonIcon /> : <BusinessIcon />;
  };

  const handleEdit = () => {
    navigate(`/clientes/editar/${id}`);
  };

  const handleBack = () => {
    navigate('/clientes/gestion');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Volver a Clientes
        </Button>
      </Box>
    );
  }

  if (!cliente) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Cliente no encontrado
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Volver a Clientes
        </Button>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? '' : 'Volver'}
          </Button>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {!isMobile && getTipoIcon(cliente.tipo)}
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
              {cliente.nombre}
            </Typography>
            <Chip
              label={cliente.estado}
              color={getEstadoColor(cliente.estado)}
              size="small"
            />
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
          fullWidth={isMobile}
        >
          Editar
        </Button>
      </Box>

      {/* Client Info Summary */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={{ xs: 2, sm: 4 }}>
          <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
            <Typography variant="h6" gutterBottom>
              Información General
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography>
                <strong>Tipo:</strong> {cliente.tipo === 'PERSONA_FISICA' ? 'Persona Física' : 'Persona Jurídica'}
              </Typography>
              {cliente.cuit && (
                <Typography>
                  <strong>{cliente.tipo === 'PERSONA_FISICA' ? 'DNI/CUIL:' : 'CUIT:'}</strong> {cliente.cuit}
                </Typography>
              )}
              {cliente.razonSocial && (
                <Typography>
                  <strong>Razón Social:</strong> {cliente.razonSocial}
                </Typography>
              )}
              <Typography>
                <strong>Estado:</strong> {cliente.estado}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">Calificación</Typography>
                <Rating
                  name="read-only-rating"
                  value={cliente.calificacion ?? 0}
                  precision={0.5}
                  readOnly
                />
            </Box>
          </Box>

          <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
            <Typography variant="h6" gutterBottom>
              Contacto
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {cliente.email && (
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography>{cliente.email}</Typography>
                </Box>
              )}
              {cliente.telefono && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography>{cliente.telefono}</Typography>
                </Box>
              )}
              {cliente.direccion && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography>
                    {cliente.direccion}
                    {cliente.ciudad && `, ${cliente.ciudad}`}
                    {cliente.provincia && `, ${PROVINCIA_LABELS[cliente.provincia]}`}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
            <Typography variant="h6" gutterBottom>
              Información Comercial
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography>
                <strong>Límite de Crédito:</strong> ${cliente.limiteCredito?.toLocaleString() || 'N/A'}
              </Typography>
              <Typography>
                <strong>Saldo Actual:</strong> ${cliente.saldoActual?.toLocaleString() || '0'}
              </Typography>
              <Typography>
                <strong>Fecha de Alta:</strong> {new Date(cliente.fechaAlta).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="client tabs"
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab label={isMobile ? 'Info' : 'Información Básica'} {...a11yProps(0)} />
            <Tab label={isMobile ? 'Contactos' : 'Historial de Contactos'} {...a11yProps(1)} />
            <Tab label={isMobile ? 'Cta. Cte.' : 'Cuenta Corriente'} {...a11yProps(2)} />
            <Tab label="Documentos" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Datos Personales/Empresariales
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={4}>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography><strong>Nombre:</strong> {cliente.nombre}</Typography>
                  {cliente.apellido && (
                    <Typography><strong>Apellido:</strong> {cliente.apellido}</Typography>
                  )}
                  {cliente.razonSocial && (
                    <Typography><strong>Razón Social:</strong> {cliente.razonSocial}</Typography>
                  )}
                  {cliente.cuit && (
                    <Typography>
                      <strong>{cliente.tipo === 'PERSONA_FISICA' ? 'DNI/CUIL:' : 'CUIT:'}</strong> {cliente.cuit}
                    </Typography>
                  )}
                </Box>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography><strong>Tipo:</strong> {cliente.tipo === 'PERSONA_FISICA' ? 'Persona Física' : 'Persona Jurídica'}</Typography>
                  <Typography><strong>Estado:</strong> {cliente.estado}</Typography>
                  <Typography><strong>Fecha de Alta:</strong> {new Date(cliente.fechaAlta).toLocaleDateString()}</Typography>
                  <Typography><strong>Última Actualización:</strong> {new Date(cliente.fechaActualizacion).toLocaleDateString()}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Información de Contacto
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={4}>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography><strong>Email:</strong> {cliente.email || 'No especificado'}</Typography>
                  <Typography><strong>Teléfono:</strong> {cliente.telefono || 'No especificado'}</Typography>
                </Box>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography><strong>Dirección:</strong> {cliente.direccion || 'No especificada'}</Typography>
                  <Typography><strong>Ciudad:</strong> {cliente.ciudad || 'No especificada'}</Typography>
                  <Typography><strong>Provincia:</strong> {cliente.provincia ? PROVINCIA_LABELS[cliente.provincia] : 'No especificada'}</Typography>
                  <Typography><strong>Código Postal:</strong> {cliente.codigoPostal || 'No especificado'}</Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Información Comercial
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={4}>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography><strong>Límite de Crédito:</strong> ${cliente.limiteCredito?.toLocaleString() || 'N/A'}</Typography>
                  <Typography><strong>Saldo Actual:</strong> ${cliente.saldoActual?.toLocaleString() || '0'}</Typography>
                </Box>
                <Box flex="1" minWidth={{ xs: '100%', sm: 250 }}>
                  <Typography><strong>Disponible:</strong> ${((cliente.limiteCredito || 0) - (cliente.saldoActual || 0)).toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ContactosTab clienteId={Number(id)} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CuentaCorrienteTab clienteId={Number(id)} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {cliente && (
            <DocumentManager
              entityId={cliente.id}
              entityType="cliente"
              categorias={['Contrato', 'DNI', 'CUIT', 'Factura', 'Presupuesto', 'Garantia', 'Otros']}
              onUpload={async (file, categoria, descripcion) => {
                await documentoClienteApi.upload(cliente.id, file, categoria, descripcion);
              }}
              onDownload={async (id, fileName) => {
                await documentoClienteApi.downloadAndSave(id, fileName);
              }}
              onDelete={async (id) => {
                await documentoClienteApi.delete(id);
              }}
              onLoad={async (clienteId) => {
                return await documentoClienteApi.getByClienteId(clienteId);
              }}
            />
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ClienteDetailPage;
