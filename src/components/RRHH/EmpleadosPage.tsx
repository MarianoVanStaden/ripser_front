import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack, TextField, MenuItem } from '@mui/material';
import { mockEmpleados, mockPuestos } from '../../api/services/mockData';

const EmpleadosPage: React.FC = () => {
  const [empleados, setEmpleados] = useState<any[]>(mockEmpleados);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    fechaIngreso: '',
    estado: 'ACTIVO',
    puestoId: '',
    salario: '',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = () => {
    const puesto = mockPuestos.find(p => p.id === Number(form.puestoId));
    const nuevo = {
      ...form,
      id: empleados.length + 1,
      puesto,
      salario: Number(form.salario),
      estado: form.estado,
    };
    setEmpleados([...empleados, nuevo]);
    setFormOpen(false);
    setForm({ nombre: '', apellido: '', dni: '', email: '', telefono: '', direccion: '', fechaNacimiento: '', fechaIngreso: '', estado: 'ACTIVO', puestoId: '', salario: '' });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Empleados</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setFormOpen(true)}>Agregar Empleado</Button>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellido</TableCell>
                  <TableCell>DNI</TableCell>
                  <TableCell>Puesto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.map(emp => (
                  <TableRow key={emp.id} hover>
                    <TableCell>{emp.nombre}</TableCell>
                    <TableCell>{emp.apellido}</TableCell>
                    <TableCell>{emp.dni}</TableCell>
                    <TableCell>{emp.puesto?.nombre || '-'}</TableCell>
                    <TableCell>{emp.estado}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(emp); setOpen(true); }}>Ver Detalle</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        {selected && (
          <Box p={3}>
            <Typography variant="h6" mb={2}>Detalle del Empleado</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Nombre:</b> {selected.nombre} {selected.apellido}</Typography>
              <Typography><b>DNI:</b> {selected.dni}</Typography>
              <Typography><b>Email:</b> {selected.email}</Typography>
              <Typography><b>Teléfono:</b> {selected.telefono}</Typography>
              <Typography><b>Dirección:</b> {selected.direccion}</Typography>
              <Typography><b>Fecha Nacimiento:</b> {selected.fechaNacimiento}</Typography>
              <Typography><b>Fecha Ingreso:</b> {selected.fechaIngreso}</Typography>
              <Typography><b>Puesto:</b> {selected.puesto?.nombre || '-'}</Typography>
              <Typography><b>Salario:</b> ${selected.salario}</Typography>
              <Typography><b>Estado:</b> {selected.estado}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <Box p={3} component="form" onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
          <Typography variant="h6" mb={2}>Agregar Empleado</Typography>
          <Stack spacing={2} mb={2}>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleFormChange} required />
            <TextField label="Apellido" name="apellido" value={form.apellido} onChange={handleFormChange} required />
            <TextField label="DNI" name="dni" value={form.dni} onChange={handleFormChange} required />
            <TextField label="Email" name="email" value={form.email} onChange={handleFormChange} />
            <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleFormChange} />
            <TextField label="Dirección" name="direccion" value={form.direccion} onChange={handleFormChange} />
            <TextField label="Fecha Nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
            <TextField label="Fecha Ingreso" name="fechaIngreso" type="date" value={form.fechaIngreso} onChange={handleFormChange} InputLabelProps={{ shrink: true }} />
            <TextField select label="Puesto" name="puestoId" value={form.puestoId} onChange={handleFormChange} required>
              {mockPuestos.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
              ))}
            </TextField>
            <TextField label="Salario" name="salario" type="number" value={form.salario} onChange={handleFormChange} required />
            <TextField select label="Estado" name="estado" value={form.estado} onChange={handleFormChange} required>
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
              <MenuItem value="LICENCIA">LICENCIA</MenuItem>
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => setFormOpen(false)} variant="outlined">Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default EmpleadosPage;
