import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
  Avatar,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { supplierApiWithFallback as supplierApi } from '../../api/services/apiWithFallback';
import { contactoApi } from '../../api/services/contactoApi';
import type { ProveedorDTO, ContactoProveedorDTO } from '../../types';

dayjs.locale('es');

const ContactosCondicionesPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<ProveedorDTO[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState<ProveedorDTO | null>(null);
  const [contactos, setContactos] = useState<ContactoProveedorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openContactoDialog, setOpenContactoDialog] = useState(false);
  const [editingContacto, setEditingContacto] = useState<ContactoProveedorDTO | null>(null);

  const [newContacto, setNewContacto] = useState<ContactoProveedorDTO>({
    proveedorId: 0,
    fechaContacto: '',
    tipoContacto: '',
    descripcion: '',
    resultado: '',
    proximoContacto: '',
    usuarioId: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const proveedoresData = await supplierApi.getAll();
      setProveedores(proveedoresData as ProveedorDTO[]);

      const contactosData = await contactoApi.getAll();
      setContactos(contactosData);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProveedor = (proveedor: ProveedorDTO) => {
    setSelectedProveedor(proveedor);
  };

 const handleSaveContacto = async () => {
  if (!selectedProveedor || !selectedProveedor.id) {
    setError('No se ha seleccionado un proveedor válido.');
    return;
  }
  try {
    const contactoData: ContactoProveedorDTO = {
      ...newContacto,
      proveedorId: selectedProveedor.id,
    };

    // Log the data being sent for debugging
    console.log('Saving contacto with data:', contactoData);

    let savedContacto: ContactoProveedorDTO;
    if (editingContacto && editingContacto.id) {
      savedContacto = await contactoApi.update(editingContacto.id, contactoData);
      setContactos(contactos.map(c => c.id === editingContacto.id ? savedContacto : c));
    } else {
      savedContacto = await contactoApi.create(contactoData);
      setContactos([...contactos, savedContacto]);
    }

    setOpenContactoDialog(false);
    setEditingContacto(null);
    setNewContacto({
      proveedorId: selectedProveedor.id, // Keep the current proveedorId
      fechaContacto: '',
      tipoContacto: '',
      descripcion: '',
      resultado: '',
      proximoContacto: '',
      usuarioId: undefined,
    });
  } catch (err) {
    setError('Error al guardar el contacto');
    console.error('Error saving contact:', err);
  }
};

  const handleEditContacto = (contacto: ContactoProveedorDTO) => {
    setEditingContacto(contacto);
    setNewContacto({
      proveedorId: contacto.proveedorId,
      fechaContacto: contacto.fechaContacto || '',
      tipoContacto: contacto.tipoContacto || '',
      descripcion: contacto.descripcion || '',
      resultado: contacto.resultado || '',
      proximoContacto: contacto.proximoContacto || '',
      usuarioId: contacto.usuarioId,
    });
    setOpenContactoDialog(true);
  };

  const handleDeleteContacto = async (id: number) => {
    try {
      await contactoApi.delete(id);
      setContactos(contactos.filter(c => c.id !== id));
    } catch (err) {
      setError('Error al eliminar el contacto');
    }
  };

  const filteredProveedores = proveedores.filter(prov =>
    ((prov as any).nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (prov.razonSocial?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const contactosProveedor = selectedProveedor
    ? contactos.filter(c => c.proveedorId === selectedProveedor.id)
    : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={{ xs: 1.5, sm: 2, md: 3 }}>
        {/* Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3 
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
            }}
          >
            <BusinessIcon sx={{ mr: 1.5, fontSize: { xs: 28, md: 35 } }} />
            Contactos de Proveedores
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          {/* Proveedores List */}
          <Paper elevation={2} sx={{ width: { xs: '100%', md: 350 }, minWidth: { md: 300 }, flexShrink: 0, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Proveedores
            </Typography>
            <TextField
              fullWidth
              label="Buscar proveedor"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
              {filteredProveedores.map((prov) => (
                <ListItemButton
                  key={prov.id}
                  selected={selectedProveedor?.id === prov.id}
                  onClick={() => handleSelectProveedor(prov)}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={(prov as any).nombre}
                    secondary={prov.razonSocial}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label={prov.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                      color={prov.estado === 'ACTIVO' ? 'success' : 'default'}
                    />
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))}
            </List>
          </Paper>

          {/* Contactos Panel */}
          <Box sx={{ flex: 1 }}>
            {selectedProveedor ? (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">
                    Contactos - {(selectedProveedor as any).nombre}
                  </Typography>
                  <Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => {
    if (!selectedProveedor) {
      setError('Por favor, seleccione un proveedor antes de agregar un contacto.');
      return;
    }
    setEditingContacto(null);
    setNewContacto({
      proveedorId: selectedProveedor.id, // Use the valid ID directly
      fechaContacto: '',
      tipoContacto: '',
      descripcion: '',
      resultado: '',
      proximoContacto: '',
      usuarioId: undefined,
    });
    setOpenContactoDialog(true);
  }}
>
  Nuevo Contacto
</Button>
                </Box>

                {contactosProveedor.map((contacto) => (
                  <Card key={contacto.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" component="h3">
                            {contacto.tipoContacto} {contacto.fechaContacto ? `- ${dayjs(contacto.fechaContacto).format('DD/MM/YYYY')}` : ''}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {contacto.descripcion}
                          </Typography>
                          {contacto.resultado && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Resultado:</strong> {contacto.resultado}
                            </Typography>
                          )}
                          {contacto.proximoContacto && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Próximo contacto:</strong> {dayjs(contacto.proximoContacto).format('DD/MM/YYYY')}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEditContacto(contacto)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteContacto(contacto.id!)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                {contactosProveedor.length === 0 && (
                  <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                    No hay contactos registrados para este proveedor
                  </Typography>
                )}
              </Paper>
            ) : (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Seleccione un proveedor para ver sus contactos
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

        {/* New/Edit Contact Dialog */}
        <Dialog open={openContactoDialog} onClose={() => setOpenContactoDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingContacto ? 'Editar Contacto' : 'Nuevo Contacto'}
          </DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <TextField
                fullWidth
                label="Tipo de Contacto"
                select
                value={newContacto.tipoContacto}
                onChange={(e) => setNewContacto({ ...newContacto, tipoContacto: e.target.value })}
                margin="normal"
              >
                <MenuItem value="VISITA">Visita</MenuItem>
                <MenuItem value="LLAMADA">Llamada</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Fecha de Contacto"
                type="date"
                value={newContacto.fechaContacto ? dayjs(newContacto.fechaContacto).format('YYYY-MM-DD') : ''}
                onChange={(e) => setNewContacto({ ...newContacto, fechaContacto: dayjs(e.target.value).toISOString() })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Descripción"
                value={newContacto.descripcion}
                onChange={(e) => setNewContacto({ ...newContacto, descripcion: e.target.value })}
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Resultado"
                value={newContacto.resultado}
                onChange={(e) => setNewContacto({ ...newContacto, resultado: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Próximo Contacto"
                type="date"
                value={newContacto.proximoContacto ? dayjs(newContacto.proximoContacto).format('YYYY-MM-DD') : ''}
                onChange={(e) => setNewContacto({ ...newContacto, proximoContacto: dayjs(e.target.value).toISOString() })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenContactoDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveContacto}
              disabled={!newContacto.tipoContacto || !newContacto.fechaContacto || !newContacto.descripcion}
            >
              {editingContacto ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ContactosCondicionesPage;
