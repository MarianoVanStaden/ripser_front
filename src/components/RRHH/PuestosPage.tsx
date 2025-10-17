import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack, TextField } from '@mui/material';
import { mockPuestos } from '../../api/services/mockData';

const PuestosPage: React.FC = () => {
  const [puestos, setPuestos] = useState<any[]>(mockPuestos);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({ nombre: '', descripcion: '', departamento: '', salarioBase: '' });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = () => {
    const nuevo = { ...form, id: puestos.length + 1, salarioBase: Number(form.salarioBase) };
    setPuestos([...puestos, nuevo]);
    setFormOpen(false);
    setForm({ nombre: '', descripcion: '', departamento: '', salarioBase: '' });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Puestos</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setFormOpen(true)}>Agregar Puesto</Button>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Salario Base</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {puestos.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.departamento}</TableCell>
                    <TableCell>${p.salarioBase}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(p); setOpen(true); }}>Ver Detalle</Button>
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
            <Typography variant="h6" mb={2}>Detalle del Puesto</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Nombre:</b> {selected.nombre}</Typography>
              <Typography><b>Departamento:</b> {selected.departamento}</Typography>
              <Typography><b>Descripción:</b> {selected.descripcion}</Typography>
              <Typography><b>Salario Base:</b> ${selected.salarioBase}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <Box p={3} component="form" onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
          <Typography variant="h6" mb={2}>Agregar Puesto</Typography>
          <Stack spacing={2} mb={2}>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleFormChange} required />
            <TextField label="Departamento" name="departamento" value={form.departamento} onChange={handleFormChange} />
            <TextField label="Descripción" name="descripcion" value={form.descripcion} onChange={handleFormChange} />
            <TextField label="Salario Base" name="salarioBase" type="number" value={form.salarioBase} onChange={handleFormChange} required />
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

export default PuestosPage;
