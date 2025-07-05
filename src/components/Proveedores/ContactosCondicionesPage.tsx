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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ContactMail as ContactMailIcon,
  Assignment as AssignmentIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/es';
import { supplierApiWithFallback as supplierApi } from '../../api/services/apiWithFallback';
import type { Supplier } from '../../types';

dayjs.locale('es');

interface ContactoProveedor {
  id: number;
  supplierId: number;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  esPrincipal: boolean;
  observaciones?: string;
}

interface CondicionComercial {
  id: number;
  supplierId: number;
  tipoPago: 'CONTADO' | 'CREDITO' | 'TRANSFERENCIA' | 'CHEQUE';
  diasPago: number;
  descuentoProntoPago?: number;
  limitCredito?: number;
  monedaOperacion: 'ARS' | 'USD' | 'EUR';
  entregaDomicilio: boolean;
  costoEnvio?: number;
  tiempoEntrega: number; // días
  observaciones?: string;
  fechaVigencia: string;
  vigente: boolean;
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
      id={`contactos-tabpanel-${index}`}
      aria-labelledby={`contactos-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ContactosCondicionesPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [contactos, setContactos] = useState<ContactoProveedor[]>([]);
  const [condiciones, setCondiciones] = useState<CondicionComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openContactoDialog, setOpenContactoDialog] = useState(false);
  const [openCondicionDialog, setOpenCondicionDialog] = useState(false);
  const [editingContacto, setEditingContacto] = useState<ContactoProveedor | null>(null);
  const [editingCondicion, setEditingCondicion] = useState<CondicionComercial | null>(null);

  // Mock data
  const mockContactos: ContactoProveedor[] = [
    {
      id: 1,
      supplierId: 1,
      nombre: 'Carlos Rodríguez',
      cargo: 'Gerente Comercial',
      telefono: '+54 11 4567-8901',
      email: 'carlos@tecnoproveedores.com',
      esPrincipal: true,
      observaciones: 'Contacto principal para órdenes de compra'
    },
    {
      id: 2,
      supplierId: 1,
      nombre: 'María Fernández',
      cargo: 'Administrativa',
      telefono: '+54 11 4567-8902',
      email: 'maria@tecnoproveedores.com',
      esPrincipal: false,
      observaciones: 'Maneja facturación y cobranzas'
    },
    {
      id: 3,
      supplierId: 2,
      nombre: 'Ana Martinez',
      cargo: 'Directora',
      telefono: '+54 11 9876-5432',
      email: 'ana@materialesdelsur.com',
      esPrincipal: true
    },
    {
      id: 4,
      supplierId: 3,
      nombre: 'Roberto Silva',
      cargo: 'Jefe de Ventas',
      telefono: '+54 341 123-4567',
      email: 'ventas@insumosindustriales.com',
      esPrincipal: true
    }
  ];

  const mockCondiciones: CondicionComercial[] = [
    {
      id: 1,
      supplierId: 1,
      tipoPago: 'CREDITO',
      diasPago: 30,
      descuentoProntoPago: 5,
      limitCredito: 500000,
      monedaOperacion: 'ARS',
      entregaDomicilio: true,
      costoEnvio: 5000,
      tiempoEntrega: 7,
      fechaVigencia: '2024-12-31',
      vigente: true,
      observaciones: 'Condiciones especiales por volumen de compra'
    },
    {
      id: 2,
      supplierId: 2,
      tipoPago: 'CREDITO',
      diasPago: 60,
      limitCredito: 300000,
      monedaOperacion: 'ARS',
      entregaDomicilio: true,
      costoEnvio: 8000,
      tiempoEntrega: 10,
      fechaVigencia: '2024-12-31',
      vigente: true
    },
    {
      id: 3,
      supplierId: 4,
      tipoPago: 'TRANSFERENCIA',
      diasPago: 15,
      descuentoProntoPago: 3,
      limitCredito: 1000000,
      monedaOperacion: 'USD',
      entregaDomicilio: true,
      tiempoEntrega: 5,
      fechaVigencia: '2024-12-31',
      vigente: true,
      observaciones: 'Proveedor premium con condiciones preferenciales'
    }
  ];

  const [newContacto, setNewContacto] = useState({
    nombre: '',
    cargo: '',
    telefono: '',
    email: '',
    esPrincipal: false,
    observaciones: ''
  });

  const [newCondicion, setNewCondicion] = useState({
    tipoPago: 'CREDITO' as const,
    diasPago: 30,
    descuentoProntoPago: 0,
    limitCredito: 0,
    monedaOperacion: 'ARS' as const,
    entregaDomicilio: true,
    costoEnvio: 0,
    tiempoEntrega: 7,
    fechaVigencia: dayjs().add(1, 'year'),
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const suppliersData = await supplierApi.getAll();
      setSuppliers(suppliersData);
      setContactos(mockContactos);
      setCondiciones(mockCondiciones);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleSaveContacto = () => {
    if (!selectedSupplier) return;

    try {
      const contactoData: ContactoProveedor = {
        id: editingContacto?.id || Date.now(),
        supplierId: selectedSupplier.id,
        ...newContacto
      };

      if (editingContacto) {
        setContactos(contactos.map(c => c.id === editingContacto.id ? contactoData : c));
      } else {
        setContactos([...contactos, contactoData]);
      }

      setOpenContactoDialog(false);
      setEditingContacto(null);
      setNewContacto({
        nombre: '',
        cargo: '',
        telefono: '',
        email: '',
        esPrincipal: false,
        observaciones: ''
      });
    } catch (err) {
      setError('Error al guardar el contacto');
      console.error('Error saving contact:', err);
    }
  };

  const handleSaveCondicion = () => {
    if (!selectedSupplier) return;

    try {
      const condicionData: CondicionComercial = {
        id: editingCondicion?.id || Date.now(),
        supplierId: selectedSupplier.id,
        ...newCondicion,
        fechaVigencia: newCondicion.fechaVigencia.format('YYYY-MM-DD'),
        vigente: true
      };

      if (editingCondicion) {
        setCondiciones(condiciones.map(c => c.id === editingCondicion.id ? condicionData : c));
      } else {
        setCondiciones([...condiciones, condicionData]);
      }

      setOpenCondicionDialog(false);
      setEditingCondicion(null);
      setNewCondicion({
        tipoPago: 'CREDITO',
        diasPago: 30,
        descuentoProntoPago: 0,
        limitCredito: 0,
        monedaOperacion: 'ARS',
        entregaDomicilio: true,
        costoEnvio: 0,
        tiempoEntrega: 7,
        fechaVigencia: dayjs().add(1, 'year'),
        observaciones: ''
      });
    } catch (err) {
      setError('Error al guardar la condición');
      console.error('Error saving condition:', err);
    }
  };

  const handleEditContacto = (contacto: ContactoProveedor) => {
    setEditingContacto(contacto);
    setNewContacto({
      nombre: contacto.nombre,
      cargo: contacto.cargo,
      telefono: contacto.telefono,
      email: contacto.email,
      esPrincipal: contacto.esPrincipal,
      observaciones: contacto.observaciones || ''
    });
    setOpenContactoDialog(true);
  };

  const handleEditCondicion = (condicion: CondicionComercial) => {
    setEditingCondicion(condicion);
    setNewCondicion({
      tipoPago: condicion.tipoPago,
      diasPago: condicion.diasPago,
      descuentoProntoPago: condicion.descuentoProntoPago || 0,
      limitCredito: condicion.limitCredito || 0,
      monedaOperacion: condicion.monedaOperacion,
      entregaDomicilio: condicion.entregaDomicilio,
      costoEnvio: condicion.costoEnvio || 0,
      tiempoEntrega: condicion.tiempoEntrega,
      fechaVigencia: dayjs(condicion.fechaVigencia),
      observaciones: condicion.observaciones || ''
    });
    setOpenCondicionDialog(true);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const supplierContactos = contactos.filter(c => c.supplierId === selectedSupplier?.id);
  const supplierCondiciones = condiciones.filter(c => c.supplierId === selectedSupplier?.id);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box p={3}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" display="flex" alignItems="center">
            <ContactMailIcon sx={{ mr: 2 }} />
            Contactos y Condiciones
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Suppliers List */}
          <Paper elevation={2} sx={{ width: 350, p: 2 }}>
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
              {filteredSuppliers.map((supplier) => (
                <ListItem
                  key={supplier.id}
                  button
                  selected={selectedSupplier?.id === supplier.id}
                  onClick={() => handleSelectSupplier(supplier)}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={supplier.name}
                    secondary={supplier.contactPerson}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      size="small"
                      label={supplier.isActive ? 'Activo' : 'Inactivo'}
                      color={supplier.isActive ? 'success' : 'default'}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Details Panel */}
          <Box sx={{ flex: 1 }}>
            {selectedSupplier ? (
              <Paper elevation={2}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Contactos" />
                    <Tab label="Condiciones Comerciales" />
                  </Tabs>
                </Box>

                {/* Contacts Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                      Contactos - {selectedSupplier.name}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingContacto(null);
                        setOpenContactoDialog(true);
                      }}
                    >
                      Nuevo Contacto
                    </Button>
                  </Box>

                  {supplierContactos.map((contacto) => (
                    <Card key={contacto.id} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box sx={{ flex: 1 }}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <Typography variant="h6" component="h3">
                                {contacto.nombre}
                              </Typography>
                              {contacto.esPrincipal && (
                                <Chip
                                  label="Principal"
                                  color="primary"
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {contacto.cargo}
                            </Typography>
                            <Box display="flex" alignItems="center" mb={1}>
                              <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                              <Typography variant="body2">{contacto.telefono}</Typography>
                            </Box>
                            <Box display="flex" alignItems="center" mb={1}>
                              <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
                              <Typography variant="body2">{contacto.email}</Typography>
                            </Box>
                            {contacto.observaciones && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {contacto.observaciones}
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
                              onClick={() => {
                                setContactos(contactos.filter(c => c.id !== contacto.id));
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {supplierContactos.length === 0 && (
                    <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                      No hay contactos registrados para este proveedor
                    </Typography>
                  )}
                </TabPanel>

                {/* Commercial Conditions Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                      Condiciones Comerciales - {selectedSupplier.name}
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setEditingCondicion(null);
                        setOpenCondicionDialog(true);
                      }}
                    >
                      Nueva Condición
                    </Button>
                  </Box>

                  {supplierCondiciones.map((condicion) => (
                    <Accordion key={condicion.id}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" width="100%">
                          <Typography variant="subtitle1" sx={{ flex: 1 }}>
                            {condicion.tipoPago} - {condicion.diasPago} días
                          </Typography>
                          <Chip
                            label={condicion.vigente ? 'Vigente' : 'Vencida'}
                            color={condicion.vigente ? 'success' : 'error'}
                            size="small"
                            sx={{ mr: 2 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Tipo de Pago</Typography>
                            <Typography variant="body1">{condicion.tipoPago}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Días de Pago</Typography>
                            <Typography variant="body1">{condicion.diasPago} días</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Moneda</Typography>
                            <Typography variant="body1">{condicion.monedaOperacion}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Tiempo de Entrega</Typography>
                            <Typography variant="body1">{condicion.tiempoEntrega} días</Typography>
                          </Box>
                          {condicion.limitCredito && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Límite de Crédito</Typography>
                              <Typography variant="body1">${condicion.limitCredito.toLocaleString()}</Typography>
                            </Box>
                          )}
                          {condicion.descuentoProntoPago && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Descuento Pronto Pago</Typography>
                              <Typography variant="body1">{condicion.descuentoProntoPago}%</Typography>
                            </Box>
                          )}
                          <Box>
                            <Typography variant="body2" color="text.secondary">Entrega a Domicilio</Typography>
                            <Typography variant="body1">{condicion.entregaDomicilio ? 'Sí' : 'No'}</Typography>
                          </Box>
                          {condicion.costoEnvio && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Costo de Envío</Typography>
                              <Typography variant="body1">${condicion.costoEnvio.toLocaleString()}</Typography>
                            </Box>
                          )}
                        </Box>
                        
                        {condicion.observaciones && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Observaciones</Typography>
                            <Typography variant="body1">{condicion.observaciones}</Typography>
                          </Box>
                        )}
                        
                        <Divider sx={{ my: 2 }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">
                            Vigente hasta: {new Date(condicion.fechaVigencia).toLocaleDateString()}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleEditCondicion(condicion)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setCondiciones(condiciones.filter(c => c.id !== condicion.id));
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ))}

                  {supplierCondiciones.length === 0 && (
                    <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
                      No hay condiciones comerciales registradas para este proveedor
                    </Typography>
                  )}
                </TabPanel>
              </Paper>
            ) : (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Seleccione un proveedor para ver sus contactos y condiciones
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
                label="Nombre"
                value={newContacto.nombre}
                onChange={(e) => setNewContacto({ ...newContacto, nombre: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Cargo"
                value={newContacto.cargo}
                onChange={(e) => setNewContacto({ ...newContacto, cargo: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Teléfono"
                value={newContacto.telefono}
                onChange={(e) => setNewContacto({ ...newContacto, telefono: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newContacto.email}
                onChange={(e) => setNewContacto({ ...newContacto, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Observaciones"
                value={newContacto.observaciones}
                onChange={(e) => setNewContacto({ ...newContacto, observaciones: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  variant={newContacto.esPrincipal ? "contained" : "outlined"}
                  onClick={() => setNewContacto({ ...newContacto, esPrincipal: !newContacto.esPrincipal })}
                >
                  {newContacto.esPrincipal ? 'Contacto Principal' : 'Marcar como Principal'}
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenContactoDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveContacto}
              disabled={!newContacto.nombre || !newContacto.email}
            >
              {editingContacto ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New/Edit Commercial Condition Dialog */}
        <Dialog open={openCondicionDialog} onClose={() => setOpenCondicionDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingCondicion ? 'Editar Condición Comercial' : 'Nueva Condición Comercial'}
          </DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  select
                  label="Tipo de Pago"
                  value={newCondicion.tipoPago}
                  onChange={(e) => setNewCondicion({ ...newCondicion, tipoPago: e.target.value as any })}
                  fullWidth
                >
                  <MenuItem value="CONTADO">Contado</MenuItem>
                  <MenuItem value="CREDITO">Crédito</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  <MenuItem value="CHEQUE">Cheque</MenuItem>
                </TextField>

                <TextField
                  label="Días de Pago"
                  type="number"
                  value={newCondicion.diasPago}
                  onChange={(e) => setNewCondicion({ ...newCondicion, diasPago: parseInt(e.target.value) || 0 })}
                  fullWidth
                />

                <TextField
                  select
                  label="Moneda"
                  value={newCondicion.monedaOperacion}
                  onChange={(e) => setNewCondicion({ ...newCondicion, monedaOperacion: e.target.value as any })}
                  fullWidth
                >
                  <MenuItem value="ARS">Pesos Argentinos (ARS)</MenuItem>
                  <MenuItem value="USD">Dólares (USD)</MenuItem>
                  <MenuItem value="EUR">Euros (EUR)</MenuItem>
                </TextField>

                <TextField
                  label="Tiempo de Entrega (días)"
                  type="number"
                  value={newCondicion.tiempoEntrega}
                  onChange={(e) => setNewCondicion({ ...newCondicion, tiempoEntrega: parseInt(e.target.value) || 0 })}
                  fullWidth
                />

                <TextField
                  label="Límite de Crédito"
                  type="number"
                  value={newCondicion.limitCredito}
                  onChange={(e) => setNewCondicion({ ...newCondicion, limitCredito: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  fullWidth
                />

                <TextField
                  label="Descuento Pronto Pago (%)"
                  type="number"
                  value={newCondicion.descuentoProntoPago}
                  onChange={(e) => setNewCondicion({ ...newCondicion, descuentoProntoPago: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  fullWidth
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant={newCondicion.entregaDomicilio ? "contained" : "outlined"}
                  onClick={() => setNewCondicion({ ...newCondicion, entregaDomicilio: !newCondicion.entregaDomicilio })}
                >
                  Entrega a Domicilio
                </Button>
                
                {newCondicion.entregaDomicilio && (
                  <TextField
                    label="Costo de Envío"
                    type="number"
                    value={newCondicion.costoEnvio}
                    onChange={(e) => setNewCondicion({ ...newCondicion, costoEnvio: parseFloat(e.target.value) || 0 })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ width: 200 }}
                  />
                )}
              </Box>

              <DatePicker
                label="Fecha de Vigencia"
                value={newCondicion.fechaVigencia}
                onChange={(date) => setNewCondicion({ ...newCondicion, fechaVigencia: date || dayjs() })}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />

              <TextField
                fullWidth
                label="Observaciones"
                value={newCondicion.observaciones}
                onChange={(e) => setNewCondicion({ ...newCondicion, observaciones: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCondicionDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSaveCondicion}
              disabled={!newCondicion.tipoPago}
            >
              {editingCondicion ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ContactosCondicionesPage;
