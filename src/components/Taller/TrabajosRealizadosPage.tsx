
import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack } from '@mui/material';
import { mockOrdenesServicio, mockClientes, mockEmployees } from '../../api/services/mockData';


// Only show closed/completed jobs
const trabajosRealizados = mockOrdenesServicio.filter(os => os.estado === 'CERRADA');

const getClientName = (id: number) => {
  const c = mockClientes.find(c => c.id === id);
  return c ? (c.nombre + (c.apellido ? ' ' + c.apellido : c.razonSocial ? ' ' + c.razonSocial : '')) : `Cliente #${id}`;
};

import { TextField, MenuItem } from '@mui/material';
import dayjs from 'dayjs';

const mockOpenOrders = mockOrdenesServicio.filter(os => os.estado !== 'CERRADA');

const TrabajosRealizadosPage: React.FC = () => {
  const [trabajos, setTrabajos] = useState<any[]>(trabajosRealizados);
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({
    ordenId: '',
    descripcion: '',
    observaciones: '',
    fecha: dayjs().format('YYYY-MM-DD'),
    horas: '',
    estado: 'CERRADA',
    tareas: [],
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = () => {
    const orden = mockOrdenesServicio.find(os => os.id === Number(form.ordenId));
    if (!orden) return;
    // Use form.tareas if set, else default to orden.tareas
    const tareas = (form.tareas && form.tareas.length > 0 ? form.tareas : orden.tareas).map((t: any, idx: number) => ({
      ...t,
      horasReales: form.horas,
      empleadoId: t.empleadoId || '',
    }));
    const nuevoTrabajo = {
      ...orden,
      descripcion: form.descripcion,
      observaciones: form.observaciones,
      fechaCreacion: form.fecha,
      estado: form.estado,
      tareas,
    };
    setTrabajos([...trabajos, nuevoTrabajo]);
    setFormOpen(false);
    setForm({ ordenId: '', descripcion: '', observaciones: '', fecha: dayjs().format('YYYY-MM-DD'), horas: '', estado: 'CERRADA', tareas: [] });
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Trabajos Realizados</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setFormOpen(true)}>Registrar Trabajo</Button>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Orden</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trabajos.map(os => (
                  <TableRow key={os.id} hover>
                    <TableCell>{os.numero}</TableCell>
                    <TableCell>{getClientName(os.clienteId)}</TableCell>
                    <TableCell>{os.fechaCreacion}</TableCell>
                    <TableCell>{os.descripcion}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(os); setOpen(true); }}>Ver Detalle</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      {/* Detalle Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        {selected && (
          <Box p={3}>
            <Typography variant="h6" mb={2}>Detalle del Trabajo Realizado</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>N° Orden:</b> {selected.numero}</Typography>
              <Typography><b>Cliente:</b> {getClientName(selected.clienteId)}</Typography>
              <Typography><b>Fecha:</b> {selected.fechaCreacion}</Typography>
              <Typography><b>Descripción:</b> {selected.descripcion}</Typography>
              <Typography><b>Observaciones:</b> {selected.observaciones || '-'}</Typography>
            </Stack>
            <Typography variant="subtitle2">Materiales Utilizados</Typography>
            <ul>
              {selected.materiales.map((m: any) => (
                <li key={m.id}>ID Producto: {m.productoTerminadoId} - Cantidad: {m.cantidad} - Subtotal: ${m.subtotal}</li>
              ))}
            </ul>
            <Typography variant="subtitle2">Tareas Realizadas</Typography>
            <ul>
              {selected.tareas.map((t: any) => (
                <li key={t.id}>{t.descripcion} ({t.estado}) - Horas: {t.horasReales}</li>
              ))}
            </ul>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <Box p={3} component="form" onSubmit={e => { e.preventDefault(); handleFormSubmit(); }}>
          <Typography variant="h6" mb={2}>Registrar Trabajo Realizado</Typography>
          <Stack spacing={2} mb={2}>
            <TextField
              select
              label="Orden de Servicio"
              name="ordenId"
              value={form.ordenId}
              onChange={handleFormChange}
              required
            >
              {mockOpenOrders.map(os => (
                <MenuItem key={os.id} value={os.id}>{os.numero} - {getClientName(os.clienteId)}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Descripción"
              name="descripcion"
              value={form.descripcion}
              onChange={handleFormChange}
              required
            />
            <TextField
              label="Observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={handleFormChange}
              multiline
              minRows={2}
            />
            <TextField
              label="Fecha"
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              label="Horas Trabajadas"
              name="horas"
              type="number"
              value={form.horas}
              onChange={handleFormChange}
              required
            />
            <TextField
              select
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={handleFormChange}
              required
            >
              <MenuItem value="CERRADA">CERRADA</MenuItem>
              <MenuItem value="EN_PROCESO">EN_PROCESO</MenuItem>
            </TextField>
            {/* Tareas y asignación de empleados */}
            {form.ordenId && (
              <>
                <Typography variant="subtitle2">Tareas y Asignación</Typography>
                {mockOrdenesServicio.find(os => os.id === Number(form.ordenId))?.tareas.map((t: any, idx: number) => (
                  <Stack key={t.id} direction="row" spacing={2} alignItems="center" mb={1}>
                    <TextField
                      label={`Tarea: ${t.descripcion}`}
                      value={form.tareas[idx]?.descripcion || t.descripcion}
                      name={`tarea-desc-${idx}`}
                      disabled
                      sx={{ flex: 2 }}
                    />
                    <TextField
                      select
                      label="Empleado"
                      value={form.tareas[idx]?.empleadoId || t.empleadoId || ''}
                      onChange={e => {
                        const tareas = [...(form.tareas.length ? form.tareas : mockOrdenesServicio.find(os => os.id === Number(form.ordenId))?.tareas || [])];
                        tareas[idx] = { ...t, ...tareas[idx], empleadoId: Number(e.target.value) };
                        setForm({ ...form, tareas });
                      }}
                      sx={{ flex: 1 }}
                      required
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {mockEmployees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                ))}
              </>
            )}
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

export default TrabajosRealizadosPage;
