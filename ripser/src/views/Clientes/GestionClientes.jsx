import { useState } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const roles = ['ADMIN', 'VENTAS', 'TALLER'];

const initialClientes = [
  { id: 1, nombre: 'Juan', apellido: 'Pérez', direccion: 'Calle 123', email: 'juan@mail.com', rol: 'ADMIN' },
  { id: 2, nombre: 'Ana', apellido: 'García', direccion: 'Av. 456', email: 'ana@mail.com', rol: 'VENTAS' },
];

export default function GestionClientes() {
  const [clientes, setClientes] = useState(initialClientes);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre: '', apellido: '', direccion: '', email: '', rol: roles[0] });

  // Abrir modal para agregar o editar
  const handleOpen = (cliente = null) => {
    if (cliente) {
      setEditId(cliente.id);
      setForm(cliente);
    } else {
      setEditId(null);
      setForm({ nombre: '', apellido: '', direccion: '', email: '', rol: roles[0] });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Guardar (alta o edición)
  const handleSave = () => {
    if (!form.nombre || !form.apellido || !form.email) return;
    if (editId) {
      setClientes(clientes.map(c => c.id === editId ? { ...form, id: editId } : c));
    } else {
      setClientes([...clientes, { ...form, id: Date.now() }]);
    }
    setOpen(false);
  };

  // Eliminar
  const handleDelete = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este cliente?')) {
      setClientes(clientes.filter(c => c.id !== id));
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <>
      <Typography variant="h5" gutterBottom>Gestión de Clientes</Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mb: 2 }}>
        Agregar Cliente
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.map(cliente => (
              <TableRow key={cliente.id}>
                <TableCell>{cliente.nombre}</TableCell>
                <TableCell>{cliente.apellido}</TableCell>
                <TableCell>{cliente.direccion}</TableCell>
                <TableCell>{cliente.email}</TableCell>
                <TableCell>{cliente.rol}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(cliente)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(cliente.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {clientes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay clientes registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para Alta/Edición */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar Cliente' : 'Agregar Cliente'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            autoFocus
          />
          <TextField
            label="Apellido"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            required
          />
          <TextField
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Select
            label="Rol"
            name="rol"
            value={form.rol}
            onChange={handleChange}
          >
            {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editId ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}