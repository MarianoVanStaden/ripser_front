import React, { useState, useEffect } from 'react';
import {
  Box,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import type { ContactoCliente, CreateContactoClienteRequest, TipoContacto } from '../../types';
import { contactoClienteApiWithFallback as contactoClienteApi } from '../../api/services/apiWithFallback';

interface ContactosTabProps {
  clienteId: number;
}

const ContactosTab: React.FC<ContactosTabProps> = ({ clienteId }) => {
  const [contactos, setContactos] = useState<ContactoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContacto, setEditingContacto] = useState<ContactoCliente | null>(null);
  const [formData, setFormData] = useState<CreateContactoClienteRequest>({
    clienteId,
    fechaContacto: new Date().toISOString().split('T')[0],
    tipoContacto: 'LLAMADA',
    descripcion: '',
    resultado: '',
    proximoContacto: '',
  });

  useEffect(() => {
    loadContactos();
  }, [clienteId]);

  const loadContactos = async () => {
    try {
      setLoading(true);
      const data = await contactoClienteApi.getByClienteId(clienteId);
      setContactos(data);
    } catch (err) {
      setError('Error al cargar los contactos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (contacto?: ContactoCliente) => {
    if (contacto) {
      setEditingContacto(contacto);
      setFormData({
        clienteId,
        fechaContacto: contacto.fechaContacto.split('T')[0],
        tipoContacto: contacto.tipoContacto,
        descripcion: contacto.descripcion,
        resultado: contacto.resultado || '',
        proximoContacto: contacto.proximoContacto ? contacto.proximoContacto.split('T')[0] : '',
      });
    } else {
      setEditingContacto(null);
      setFormData({
        clienteId,
        fechaContacto: new Date().toISOString().split('T')[0],
        tipoContacto: 'LLAMADA',
        descripcion: '',
        resultado: '',
        proximoContacto: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingContacto(null);
    setError(null);
  };

  const handleInputChange = (field: keyof CreateContactoClienteRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.descripcion.trim()) {
      setError('La descripción es obligatoria');
      return;
    }

    try {
      const requestData = {
        ...formData,
        fechaContacto: formData.fechaContacto + 'T00:00:00',
        proximoContacto: formData.proximoContacto ? formData.proximoContacto + 'T00:00:00' : undefined,
      };

      if (editingContacto) {
        await contactoClienteApi.update(editingContacto.id, requestData);
      } else {
        await contactoClienteApi.create(requestData);
      }
      
      handleCloseDialog();
      loadContactos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el contacto');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este contacto?')) {
      try {
        await contactoClienteApi.delete(id);
        loadContactos();
      } catch (err) {
        setError('Error al eliminar el contacto');
      }
    }
  };

  const getTipoIcon = (tipo: TipoContacto) => {
    switch (tipo) {
      case 'LLAMADA':
        return <PhoneIcon />;
      case 'EMAIL':
        return <EmailIcon />;
      case 'VISITA':
        return <VisibilityIcon />;
      default:
        return <PhoneIcon />;
    }
  };

  const getTipoColor = (tipo: TipoContacto) => {
    switch (tipo) {
      case 'LLAMADA':
        return 'primary';
      case 'EMAIL':
        return 'secondary';
      case 'VISITA':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Historial de Contactos ({contactos.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Contacto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Contactos List */}
      <Box display="flex" flexDirection="column" gap={2}>
        {contactos.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No hay contactos registrados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega el primer contacto haciendo clic en "Nuevo Contacto"
            </Typography>
          </Box>
        ) : (
          contactos.map((contacto) => (
            <Card key={contacto.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box flex="1">
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {getTipoIcon(contacto.tipoContacto)}
                      <Chip
                        label={contacto.tipoContacto}
                        color={getTipoColor(contacto.tipoContacto)}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(contacto.fechaContacto).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" paragraph>
                      {contacto.descripcion}
                    </Typography>
                    
                    {contacto.resultado && (
                      <Box mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Resultado:</strong> {contacto.resultado}
                        </Typography>
                      </Box>
                    )}
                    
                    {contacto.proximoContacto && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Próximo contacto:</strong> {new Date(contacto.proximoContacto).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <IconButton onClick={() => handleOpenDialog(contacto)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(contacto.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingContacto ? 'Editar Contacto' : 'Nuevo Contacto'}
          </DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} pt={1}>
              <Box display="flex" gap={2}>
                <TextField
                  select
                  label="Tipo de Contacto"
                  value={formData.tipoContacto}
                  onChange={handleInputChange('tipoContacto')}
                  required
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="LLAMADA">Llamada</MenuItem>
                  <MenuItem value="EMAIL">Email</MenuItem>
                  <MenuItem value="VISITA">Visita</MenuItem>
                </TextField>
                <TextField
                  type="date"
                  label="Fecha de Contacto"
                  value={formData.fechaContacto}
                  onChange={handleInputChange('fechaContacto')}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              <TextField
                multiline
                rows={4}
                label="Descripción"
                value={formData.descripcion}
                onChange={handleInputChange('descripcion')}
                required
                placeholder="Describa el motivo y detalles del contacto..."
              />
              
              <TextField
                multiline
                rows={2}
                label="Resultado (opcional)"
                value={formData.resultado}
                onChange={handleInputChange('resultado')}
                placeholder="Describa el resultado del contacto..."
              />
              
              <TextField
                type="date"
                label="Próximo Contacto (opcional)"
                value={formData.proximoContacto}
                onChange={handleInputChange('proximoContacto')}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {editingContacto ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ContactosTab;
