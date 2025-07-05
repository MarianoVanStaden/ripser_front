import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack, TextField, MenuItem } from '@mui/material';
import { mockCapacitaciones, mockEmpleados } from '../../api/services/mockData';

const CapacitacionesPage: React.FC = () => {
  const [capacitaciones, setCapacitaciones] = useState<any[]>(mockCapacitaciones);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ empleadoId: '', nombre: '', descripcion: '', institucion: '', fechaInicio: '', fechaFin: '', horas: '', certificado: false, costo: '' });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFormSubmit = () => {
    const empleado = mockEmpleados.find(e => e.id === Number(form.empleadoId));
    const nuevo = {
      id: capacitaciones.length + 1,
      empleado,
      nombre: form.nombre,
      descripcion: form.descripcion,
      institucion: form.institucion,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      horas: Number(form.horas),
      certificado: form.certificado,
      costo: Number(form.costo),
    };
    setCapacitaciones([...capacitaciones, nuevo]);
    setFormOpen(false);
    setForm({ empleadoId: '', nombre: '', descripcion: '', institucion: '', fechaInicio: '', fechaFin: '', horas: '', certificado: false, costo: '' });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Capacitaciones</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setFormOpen(true)}>Registrar Capacitación</Button>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Institución</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Horas</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {capacitaciones.map(c => (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.empleado?.nombre} {c.empleado?.apellido}</TableCell>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{c.institucion}</TableCell>
                    <TableCell>{c.fechaInicio}</TableCell>
                    <TableCell>{c.fechaFin}</TableCell>
                    <TableCell>{c.horas}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(c); setOpen(true); }}>Ver Detalle</Button>
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
            <Typography variant="h6" mb={2}>Detalle de Capacitación</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Empleado:</b> {selected.empleado?.nombre} {selected.empleado?.apellido}</Typography>
              <Typography><b>Nombre:</b> {selected.nombre}</Typography>
              <Typography><b>Institución:</b> {selected.institucion}</Typography>
              <Typography><b>Fecha Inicio:</b> {selected.fechaInicio}</Typography>
              <Typography><b>Fecha Fin:</b> {selected.fechaFin}</Typography>
              <Typography><b>Horas:</b> {selected.horas}</Typography>
              <Typography><b>Certificado:</b> {selected.certificado ? 'Sí' : 'No'}</Typography>
              <Typography><b>Costo:</b> ${selected.costo}</Typography>
              <Typography><b>Descripción:</b> {selected.descripcion}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <Box p={3} component="form" onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
          <Typography variant="h6" mb={2}>Registrar Capacitación</Typography>
          <Stack spacing={2} mb={2}>
            <TextField select label="Empleado" name="empleadoId" value={form.empleadoId} onChange={handleFormChange} required>
              {mockEmpleados.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</MenuItem>
              ))}
            </TextField>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleFormChange} required />
            <TextField label="Institución" name="institucion" value={form.institucion} onChange={handleFormChange} />
            <TextField label="Fecha Inicio" name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Fecha Fin" name="fechaFin" type="date" value={form.fechaFin} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Horas" name="horas" type="number" value={form.horas} onChange={handleFormChange} required />
            <TextField select label="Certificado" name="certificado" value={form.certificado ? 'true' : 'false'} onChange={e => setForm({ ...form, certificado: e.target.value === 'true' })} required>
              <MenuItem value="true">Sí</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
            <TextField label="Costo" name="costo" type="number" value={form.costo} onChange={handleFormChange} />
            <TextField label="Descripción" name="descripcion" value={form.descripcion} onChange={handleFormChange} multiline minRows={2} />
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

export default CapacitacionesPage;
