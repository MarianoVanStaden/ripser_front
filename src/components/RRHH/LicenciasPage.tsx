import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack, TextField, MenuItem } from '@mui/material';
import { mockLicencias, mockEmpleados } from '../../api/services/mockData';

const LicenciasPage: React.FC = () => {
  const [licencias, setLicencias] = useState<any[]>(mockLicencias);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ empleadoId: '', tipo: '', fechaInicio: '', fechaFin: '', dias: '', motivo: '', goceHaber: false, estado: 'SOLICITADA' });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFormSubmit = () => {
    const empleado = mockEmpleados.find(e => e.id === Number(form.empleadoId));
    const nuevo = {
      id: licencias.length + 1,
      empleado,
      tipo: form.tipo,
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
      dias: Number(form.dias),
      motivo: form.motivo,
      goceHaber: form.goceHaber,
      estado: form.estado,
    };
    setLicencias([...licencias, nuevo]);
    setFormOpen(false);
    setForm({ empleadoId: '', tipo: '', fechaInicio: '', fechaFin: '', dias: '', motivo: '', goceHaber: false, estado: 'SOLICITADA' });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Licencias</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setFormOpen(true)}>Registrar Licencia</Button>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Días</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {licencias.map(l => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.empleado?.nombre} {l.empleado?.apellido}</TableCell>
                    <TableCell>{l.tipo}</TableCell>
                    <TableCell>{l.fechaInicio}</TableCell>
                    <TableCell>{l.fechaFin}</TableCell>
                    <TableCell>{l.dias}</TableCell>
                    <TableCell>{l.estado}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(l); setOpen(true); }}>Ver Detalle</Button>
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
            <Typography variant="h6" mb={2}>Detalle de Licencia</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Empleado:</b> {selected.empleado?.nombre} {selected.empleado?.apellido}</Typography>
              <Typography><b>Tipo:</b> {selected.tipo}</Typography>
              <Typography><b>Fecha Inicio:</b> {selected.fechaInicio}</Typography>
              <Typography><b>Fecha Fin:</b> {selected.fechaFin}</Typography>
              <Typography><b>Días:</b> {selected.dias}</Typography>
              <Typography><b>Motivo:</b> {selected.motivo}</Typography>
              <Typography><b>Goce de Haber:</b> {selected.goceHaber ? 'Sí' : 'No'}</Typography>
              <Typography><b>Estado:</b> {selected.estado}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <Box p={3} component="form" onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
          <Typography variant="h6" mb={2}>Registrar Licencia</Typography>
          <Stack spacing={2} mb={2}>
            <TextField select label="Empleado" name="empleadoId" value={form.empleadoId} onChange={handleFormChange} required>
              {mockEmpleados.map(e => (
                <MenuItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Tipo" name="tipo" value={form.tipo} onChange={handleFormChange} required>
              <MenuItem value="VACACIONES">VACACIONES</MenuItem>
              <MenuItem value="ENFERMEDAD">ENFERMEDAD</MenuItem>
              <MenuItem value="PERSONAL">PERSONAL</MenuItem>
              <MenuItem value="MATERNIDAD">MATERNIDAD</MenuItem>
            </TextField>
            <TextField label="Fecha Inicio" name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Fecha Fin" name="fechaFin" type="date" value={form.fechaFin} onChange={handleFormChange} InputLabelProps={{ shrink: true }} required />
            <TextField label="Días" name="dias" type="number" value={form.dias} onChange={handleFormChange} required />
            <TextField label="Motivo" name="motivo" value={form.motivo} onChange={handleFormChange} />
            <TextField select label="Goce de Haber" name="goceHaber" value={form.goceHaber ? 'true' : 'false'} onChange={e => setForm({ ...form, goceHaber: e.target.value === 'true' })} required>
              <MenuItem value="true">Sí</MenuItem>
              <MenuItem value="false">No</MenuItem>
            </TextField>
            <TextField select label="Estado" name="estado" value={form.estado} onChange={handleFormChange} required>
              <MenuItem value="SOLICITADA">SOLICITADA</MenuItem>
              <MenuItem value="APROBADA">APROBADA</MenuItem>
              <MenuItem value="RECHAZADA">RECHAZADA</MenuItem>
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

export default LicenciasPage;
