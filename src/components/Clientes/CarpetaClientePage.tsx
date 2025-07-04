import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  AttachFile as AttachFileIcon,
  Description as DocumentIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { clienteApiWithFallback as clienteApi } from '../../api/services/apiWithFallback';
import type { Cliente } from '../../types';

interface DocumentoCliente {
  id: number;
  nombre: string;
  tipo: 'DNI' | 'CUIL' | 'CUIT' | 'LICENCIA' | 'COMPROBANTE' | 'CONTRATO' | 'OTRO';
  url: string;
  fechaSubida: string;
  tamano: number;
  descripcion?: string;
}

interface NotaCliente {
  id: number;
  titulo: string;
  contenido: string;
  fechaCreacion: string;
  importante: boolean;
  autor: string;
}

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
      id={`carpeta-tabpanel-${index}`}
      aria-labelledby={`carpeta-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CarpetaClientePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([]);
  const [notas, setNotas] = useState<NotaCliente[]>([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openNotaDialog, setOpenNotaDialog] = useState(false);
  const [newNota, setNewNota] = useState({ titulo: '', contenido: '', importante: false });

  // Mock data for documents and notes
  const mockDocumentos: DocumentoCliente[] = [
    {
      id: 1,
      nombre: 'DNI_Juan_Perez.pdf',
      tipo: 'DNI',
      url: '/documents/dni_juan_perez.pdf',
      fechaSubida: '2024-01-15',
      tamano: 2048000,
      descripcion: 'DNI del cliente'
    },
    {
      id: 2,
      nombre: 'Contrato_Servicio_2024.pdf',
      tipo: 'CONTRATO',
      url: '/documents/contrato_juan_2024.pdf',
      fechaSubida: '2024-01-20',
      tamano: 5120000,
      descripcion: 'Contrato de servicio anual'
    },
    {
      id: 3,
      nombre: 'Comprobante_Domicilio.pdf',
      tipo: 'COMPROBANTE',
      url: '/documents/comprobante_domicilio.pdf',
      fechaSubida: '2024-02-01',
      tamano: 1024000,
      descripcion: 'Comprobante de domicilio actualizado'
    }
  ];

  const mockNotas: NotaCliente[] = [
    {
      id: 1,
      titulo: 'Primera reunión con el cliente',
      contenido: 'El cliente mostró interés en nuestros servicios de mantenimiento. Requiere cotización para 5 equipos.',
      fechaCreacion: '2024-01-10',
      importante: true,
      autor: 'María González'
    },
    {
      id: 2,
      titulo: 'Seguimiento post-venta',
      contenido: 'Cliente satisfecho con el servicio. Solicitó ampliación del contrato para incluir equipos adicionales.',
      fechaCreacion: '2024-02-15',
      importante: false,
      autor: 'Carlos López'
    },
    {
      id: 3,
      titulo: 'Actualización de datos',
      contenido: 'Se actualizaron los datos de contacto del cliente. Nueva dirección de facturación proporcionada.',
      fechaCreacion: '2024-02-20',
      importante: false,
      autor: 'Ana Rodríguez'
    }
  ];

  useEffect(() => {
    loadCliente();
    setDocumentos(mockDocumentos);
    setNotas(mockNotas);
  }, [id]);

  const loadCliente = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await clienteApi.getById(parseInt(id));
      setCliente(data);
    } catch (err) {
      setError('Error al cargar el cliente');
      console.error('Error loading cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUploadDocument = () => {
    // Mock implementation - would integrate with file upload service
    console.log('Upload document');
    setOpenUploadDialog(false);
  };

  const handleSaveNota = () => {
    const nuevaNota: NotaCliente = {
      id: Date.now(),
      titulo: newNota.titulo,
      contenido: newNota.contenido,
      fechaCreacion: new Date().toISOString().split('T')[0],
      importante: newNota.importante,
      autor: 'Usuario Actual'
    };
    
    setNotas([nuevaNota, ...notas]);
    setNewNota({ titulo: '', contenido: '', importante: false });
    setOpenNotaDialog(false);
  };

  const getDocumentIcon = (tipo: string) => {
    switch (tipo) {
      case 'DNI':
      case 'CUIL':
      case 'CUIT':
        return <PersonIcon />;
      case 'CONTRATO':
        return <AssignmentIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !cliente) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'Cliente no encontrado'}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" display="flex" alignItems="center">
          <FolderIcon sx={{ mr: 2 }} />
          Carpeta de Cliente
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/clientes/gestion')}
        >
          Volver a Clientes
        </Button>
      </Box>

      {/* Client Info Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h2">
              {cliente.nombre} {cliente.apellido}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {cliente.razonSocial && `${cliente.razonSocial} - `}
              {cliente.tipo === 'PERSONA_JURIDICA' ? 'Empresa' : 'Particular'}
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Chip
                label={cliente.estado}
                color={cliente.estado === 'ACTIVO' ? 'success' : 'default'}
                size="small"
              />
              <Chip
                label={cliente.tipo}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
            >
              Editar Cliente
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="carpeta cliente tabs">
          <Tab label="Información General" />
          <Tab label="Documentos" />
          <Tab label="Notas y Observaciones" />
        </Tabs>

        {/* Tab 1: General Information */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Datos Personales
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Nombre Completo"
                        secondary={`${cliente.nombre} ${cliente.apellido}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><BusinessIcon /></ListItemIcon>
                      <ListItemText 
                        primary="CUIT"
                        secondary={cliente.cuit || 'No especificado'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Email"
                        secondary={cliente.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Teléfono"
                        secondary={cliente.telefono}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: '1 1 400px', minWidth: 0 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información Comercial
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Tipo de Cliente"
                        secondary={cliente.tipo === 'PERSONA_JURIDICA' ? 'Empresa' : 'Particular'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Límite de Crédito"
                        secondary={`$${cliente.limiteCredito.toLocaleString()}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Estado"
                        secondary={cliente.estado}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Fecha de Alta"
                        secondary={new Date(cliente.fechaAlta).toLocaleDateString()}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>

            {cliente.direccion && (
              <Box sx={{ flex: '1 1 100%' }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                      <LocationIcon sx={{ mr: 1 }} />
                      Dirección
                    </Typography>
                    <Typography variant="body1">
                      {cliente.direccion}
                    </Typography>
                    {cliente.ciudad && (
                      <Typography variant="body2" color="text.secondary">
                        {cliente.ciudad}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Tab 2: Documents */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Documentos del Cliente
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadDialog(true)}
            >
              Subir Documento
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
            {documentos.map((doc) => (
              <Card key={doc.id}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getDocumentIcon(doc.tipo)}
                    <Box ml={1}>
                      <Typography variant="subtitle2" noWrap>
                        {doc.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.tipo} • {formatFileSize(doc.tamano)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {doc.descripcion && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {doc.descripcion}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" display="block" mb={2}>
                    Subido el {new Date(doc.fechaSubida).toLocaleDateString()}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between">
                    <IconButton size="small" color="primary">
                      <DownloadIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Tab 3: Notes */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Notas y Observaciones
            </Typography>
            <Button
              variant="contained"
              startIcon={<DocumentIcon />}
              onClick={() => setOpenNotaDialog(true)}
            >
              Nueva Nota
            </Button>
          </Box>

          <Box>
            {notas.map((nota) => (
              <Accordion key={nota.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Typography variant="subtitle1" component="h3" sx={{ flexGrow: 1 }}>
                      {nota.titulo}
                    </Typography>
                    {nota.importante && (
                      <Chip
                        label="Importante"
                        color="warning"
                        size="small"
                        sx={{ mr: 2 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(nota.fechaCreacion).toLocaleDateString()}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    {nota.contenido}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Creado por: {nota.autor}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </TabPanel>
      </Paper>

      {/* Upload Document Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <TextField
              fullWidth
              select
              label="Tipo de Documento"
              margin="normal"
            >
              <MenuItem value="DNI">DNI</MenuItem>
              <MenuItem value="CUIL">CUIL</MenuItem>
              <MenuItem value="CUIT">CUIT</MenuItem>
              <MenuItem value="LICENCIA">Licencia</MenuItem>
              <MenuItem value="COMPROBANTE">Comprobante</MenuItem>
              <MenuItem value="CONTRATO">Contrato</MenuItem>
              <MenuItem value="OTRO">Otro</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Descripción"
              margin="normal"
              multiline
              rows={3}
            />
            <Box
              border="2px dashed"
              borderColor="grey.300"
              borderRadius={1}
              p={3}
              textAlign="center"
              mt={2}
            >
              <AttachFileIcon sx={{ fontSize: 48, color: 'grey.400' }} />
              <Typography variant="body2" color="text.secondary">
                Arrastra y suelta un archivo aquí o haz clic para seleccionar
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleUploadDocument}>
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Note Dialog */}
      <Dialog open={openNotaDialog} onClose={() => setOpenNotaDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Nota</DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <TextField
              fullWidth
              label="Título"
              value={newNota.titulo}
              onChange={(e) => setNewNota({ ...newNota, titulo: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Contenido"
              value={newNota.contenido}
              onChange={(e) => setNewNota({ ...newNota, contenido: e.target.value })}
              margin="normal"
              multiline
              rows={4}
            />
            <Box mt={2}>
              <Button
                variant={newNota.importante ? "contained" : "outlined"}
                color="warning"
                onClick={() => setNewNota({ ...newNota, importante: !newNota.importante })}
              >
                {newNota.importante ? 'Marcar como normal' : 'Marcar como importante'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotaDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveNota}
            disabled={!newNota.titulo || !newNota.contenido}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarpetaClientePage;
