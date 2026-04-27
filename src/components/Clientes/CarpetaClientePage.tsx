import React, { useState, useEffect, useMemo } from 'react';
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
  TablePagination,
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
import { documentoClienteApi } from '../../api/services/documentoClienteApi';
import LoadingOverlay from '../common/LoadingOverlay';
import type { Cliente, DocumentoCliente } from '../../types';
import { HistoricoComercialTab } from './HistoricoComercial';

// Categorías de documentos para clientes
const CATEGORIAS_CLIENTE = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CUIT', label: 'CUIT/CUIL' },
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'FACTURA', label: 'Factura' },
  { value: 'REMITO', label: 'Remito' },
  { value: 'COMPROBANTE', label: 'Comprobante' },
  { value: 'PRESUPUESTO', label: 'Presupuesto' },
  { value: 'ORDEN_COMPRA', label: 'Orden de Compra' },
  { value: 'CERTIFICADO', label: 'Certificado' },
  { value: 'OTROS', label: 'Otros' },
];

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

  // Estados para upload de documentos
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategoria, setUploadCategoria] = useState('');
  const [uploadDescripcion, setUploadDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Paginación para documentos
  const [pageDocumentos, setPageDocumentos] = useState(0);
  const [rowsPerPageDocumentos, setRowsPerPageDocumentos] = useState(6);
  
  // Paginación para notas
  const [pageNotas, setPageNotas] = useState(0);
  const [rowsPerPageNotas, setRowsPerPageNotas] = useState(5);

  // Mock data for notes (documentos ahora se cargan desde la API)
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
    loadDocumentos();
    setNotas(mockNotas);
  }, [id]);

  const loadDocumentos = async () => {
    if (!id) return;

    try {
      setLoadingDocumentos(true);
      const docs = await documentoClienteApi.getByClienteId(parseInt(id));
      setDocumentos(docs);
    } catch (err) {
      console.error('Error loading documentos:', err);
      setDocumentos([]);
    } finally {
      setLoadingDocumentos(false);
    }
  };

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

  const handleUploadDocument = async () => {
    if (!id || !selectedFile || !uploadCategoria) {
      return;
    }

    try {
      setUploading(true);
      await documentoClienteApi.upload(
        parseInt(id),
        selectedFile,
        uploadCategoria,
        uploadDescripcion || undefined
      );
      setSuccessMessage('Documento subido exitosamente');
      setOpenUploadDialog(false);
      resetUploadForm();
      await loadDocumentos();
    } catch (err) {
      console.error('Error uploading documento:', err);
      setError('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadCategoria('');
    setUploadDescripcion('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleDownloadDocument = async (doc: DocumentoCliente) => {
    try {
      await documentoClienteApi.downloadAndSave(doc.id, doc.nombreArchivo);
    } catch (err) {
      console.error('Error downloading documento:', err);
      setError('Error al descargar el documento');
    }
  };

  const handleDeleteDocument = async (doc: DocumentoCliente) => {
    if (!window.confirm(`¿Está seguro que desea eliminar el documento "${doc.nombreArchivo}"?`)) {
      return;
    }

    try {
      await documentoClienteApi.delete(doc.id);
      setSuccessMessage('Documento eliminado exitosamente');
      await loadDocumentos();
    } catch (err) {
      console.error('Error deleting documento:', err);
      setError('Error al eliminar el documento');
    }
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

  // Ordenar documentos alfabéticamente por nombre
  const sortedDocumentos = useMemo(() => {
    return [...documentos].sort((a, b) => {
      const nombreA = a.nombreArchivo?.toLowerCase() || '';
      const nombreB = b.nombreArchivo?.toLowerCase() || '';
      return nombreA.localeCompare(nombreB);
    });
  }, [documentos]);

  // Paginación de documentos
  const paginatedDocumentos = useMemo(() => {
    const startIndex = pageDocumentos * rowsPerPageDocumentos;
    return sortedDocumentos.slice(startIndex, startIndex + rowsPerPageDocumentos);
  }, [sortedDocumentos, pageDocumentos, rowsPerPageDocumentos]);

  const handleChangePageDocumentos = (_event: unknown, newPage: number) => {
    setPageDocumentos(newPage);
  };

  const handleChangeRowsPerPageDocumentos = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageDocumentos(parseInt(event.target.value, 10));
    setPageDocumentos(0);
  };

  // Ordenar notas alfabéticamente por título
  const sortedNotas = useMemo(() => {
    return [...notas].sort((a, b) => {
      const tituloA = a.titulo?.toLowerCase() || '';
      const tituloB = b.titulo?.toLowerCase() || '';
      return tituloA.localeCompare(tituloB);
    });
  }, [notas]);

  // Paginación de notas
  const paginatedNotas = useMemo(() => {
    const startIndex = pageNotas * rowsPerPageNotas;
    return sortedNotas.slice(startIndex, startIndex + rowsPerPageNotas);
  }, [sortedNotas, pageNotas, rowsPerPageNotas]);

  const handleChangePageNotas = (_event: unknown, newPage: number) => {
    setPageNotas(newPage);
  };

  const handleChangeRowsPerPageNotas = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageNotas(parseInt(event.target.value, 10));
    setPageNotas(0);
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

  if (error || !cliente) {
    return (
      <Box p={3}>
        <LoadingOverlay open={loading} message="Cargando cliente..." />
        <Alert severity="error">{error || 'Cliente no encontrado'}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <LoadingOverlay open={loading} message="Cargando cliente..." />
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
          <Tab label="Histórico Comercial" />
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
                        secondary={`$${(cliente.limiteCredito ?? 0).toLocaleString()}`}
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
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage(null)} sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Documentos del Cliente ({sortedDocumentos.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setOpenUploadDialog(true)}
            >
              Subir Documento
            </Button>
          </Box>

          {loadingDocumentos ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : paginatedDocumentos.length === 0 ? (
            <Alert severity="info">
              No hay documentos cargados para este cliente
            </Alert>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, mb: 2 }}>
              {paginatedDocumentos.map((doc) => (
                <Card key={doc.id}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {getDocumentIcon(doc.categoria)}
                      <Box ml={1}>
                        <Typography variant="subtitle2" noWrap>
                          {doc.nombreArchivo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {doc.categoria} • {formatFileSize(doc.tamanioBytes)}
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
                      {doc.subidoPor && ` por ${doc.subidoPor}`}
                    </Typography>

                    <Box display="flex" justifyContent="space-between">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleDownloadDocument(doc)}
                        title="Descargar"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDocument(doc)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <TablePagination
            component="div"
            count={sortedDocumentos.length}
            page={pageDocumentos}
            onPageChange={handleChangePageDocumentos}
            rowsPerPage={rowsPerPageDocumentos}
            onRowsPerPageChange={handleChangeRowsPerPageDocumentos}
            rowsPerPageOptions={[3, 6, 12, 24]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TabPanel>

        {/* Tab 3: Notes */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Notas y Observaciones ({sortedNotas.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<DocumentIcon />}
              onClick={() => setOpenNotaDialog(true)}
            >
              Nueva Nota
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            {paginatedNotas.map((nota) => (
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

          <TablePagination
            component="div"
            count={sortedNotas.length}
            page={pageNotas}
            onPageChange={handleChangePageNotas}
            rowsPerPage={rowsPerPageNotas}
            onRowsPerPageChange={handleChangeRowsPerPageNotas}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        </TabPanel>

        {/* Tab 4: Histórico Comercial */}
        <TabPanel value={tabValue} index={3}>
          {tabValue === 3 && <HistoricoComercialTab clienteId={cliente.id} />}
        </TabPanel>
      </Paper>

      {/* Upload Document Dialog */}
      <Dialog
        open={openUploadDialog}
        onClose={() => {
          setOpenUploadDialog(false);
          resetUploadForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Box pt={2}>
            <TextField
              fullWidth
              select
              label="Categoría de Documento"
              value={uploadCategoria}
              onChange={(e) => setUploadCategoria(e.target.value)}
              margin="normal"
              required
            >
              {CATEGORIAS_CLIENTE.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={uploadDescripcion}
              onChange={(e) => setUploadDescripcion(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            <Box
              border="2px dashed"
              borderColor={selectedFile ? 'primary.main' : 'grey.300'}
              borderRadius={1}
              p={3}
              textAlign="center"
              mt={2}
              sx={{
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
              component="label"
            >
              <input
                type="file"
                hidden
                onChange={handleFileChange}
              />
              <AttachFileIcon sx={{ fontSize: 48, color: selectedFile ? 'primary.main' : 'grey.400' }} />
              <Typography variant="body2" color={selectedFile ? 'primary.main' : 'text.secondary'}>
                {selectedFile
                  ? selectedFile.name
                  : 'Haz clic para seleccionar un archivo'}
              </Typography>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(selectedFile.size)}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenUploadDialog(false);
              resetUploadForm();
            }}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadDocument}
            disabled={!selectedFile || !uploadCategoria || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Subir'}
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
