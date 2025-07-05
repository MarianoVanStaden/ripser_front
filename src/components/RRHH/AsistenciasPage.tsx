import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack, TextField, MenuItem } from '@mui/material';
import { mockRegistroAsistencia, mockEmpleados } from '../../api/services/mockData';

const AsistenciasPage: React.FC = () => {
  const [asistencias, setAsistencias] = useState<any[]>(mockRegistroAsistencia);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ empleadoId: '', fecha: '', horaEntrada: '', horaSalida: '', horasTrabajadas: '', horasExtras: '', observaciones: '' });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = () => {
    const empleado = mockEmpleados.find(e => e.id === Number(form.empleadoId));
    const nuevo = {
      id: asistencias.length + 1,
      empleado,
      fecha: form.fecha,
      horaEntrada: form.horaEntrada,
      horaSalida: form.horaSalida,
      horasTrabajadas: Number(form.horasTrabajadas),
      horasExtras: Number(form.horasExtras),
      observaciones: form.observaciones,
    };
    setAsistencias([...asistencias, nuevo]);
    setFormOpen(false);
    setForm({ empleadoId: '', fecha: '', horaEntrada: '', horaSalida: '', horasTrabajadas: '', horasExtras: '', observaciones: '' });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Registro de Asistencias</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setFormOpen(true)}>Registrar Asistencia</Button>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Entrada</TableCell>
                  <TableCell>Salida</TableCell>
                  <TableCell>Horas Trabajadas</TableCell>
                  <TableCell>Horas Extras</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asistencias.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>{a.empleado?.nombre} {a.empleado?.apellido}</TableCell>
                    <TableCell>{a.fecha}</TableCell>
                    <TableCell>{a.horaEntrada}</TableCell>
                    <TableCell>{a.horaSalida}</TableCell>
                    <TableCell>{a.horasTrabajadas}</TableCell>
                    <TableCell>{a.horasExtras}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(a); setOpen(true); }}>Ver Detalle</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        {selected && (
          <Box p={3}>
            <Typography variant="h6" mb={2}>Detalle de Asistencia</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Empleado:</b> {selected.empleado?.nombre} {selected.empleado?.apellido}</Typography>
              <Typography><b>Fecha:</b> {selected.fecha}</Typography>
              <Typography><b>Entrada:</b> {selected.horaEntrada}</Typography>
              <Typography><b>Salida:</b> {selected.horaSalida}</Typography>
              <Typography><b>Horas Trabajadas:</b> {selected.horasTrabajadas}</Typography>
              <Typography><b>Horas Extras:</b> {selected.horasExtras}</Typography>
              <Typography><b>Observaciones:</b> {selected.observaciones}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <Box p={3} component="form" onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
          <Typography variant="h6" mb={2}>Registrar Asistencia</Typography>
          <Stack spacing={2} mb={2}>
            <TextField select label="Empleado" name="empleadoId" value={form.empleadoId} onChange={handleFormChange} required>
              {mockEmpleados.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</MenuItem>
              ))}
            </TextField>
            <TextField label="Fecha" name="fecha" type="date" value={form.fecha} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Hora Entrada" name="horaEntrada" type="time" value={form.horaEntrada} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Hora Salida" name="horaSalida" type="time" value={form.horaSalida} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Horas Trabajadas" name="horasTrabajadas" type="number" value={form.horasTrabajadas} onChange={handleFormChange} required />
            <TextField label="Horas Extras" name="horasExtras" type="number" value={form.horasExtras} onChange={handleFormChange} />
            <TextField label="Observaciones" name="observaciones" value={form.observaciones} onChange={handleFormChange} multiline minRows={2} />
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

export default AsistenciasPage;
