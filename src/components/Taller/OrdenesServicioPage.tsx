import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, Stack } from '@mui/material';
import { mockOrdenesServicio, mockClientes } from '../../api/services/mockData';


const getClientName = (id: number) => {
  const c = mockClientes.find(c => c.id === id);
  return c ? (c.nombre + (c.apellido ? ' ' + c.apellido : c.razonSocial ? ' ' + c.razonSocial : '')) : `Cliente #${id}`;
};

const OrdenesServicioPage: React.FC = () => {
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Órdenes de Servicio</Typography>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Orden</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockOrdenesServicio.map(os => (
                  <TableRow key={os.id} hover>
                    <TableCell>{os.numero}</TableCell>
                    <TableCell>{getClientName(os.clienteId)}</TableCell>
                    <TableCell>{os.fechaCreacion}</TableCell>
                    <TableCell>
                      <Chip label={os.estado} color={os.estado === 'CERRADA' ? 'success' : os.estado === 'EN_PROCESO' ? 'warning' : 'default'} />
                    </TableCell>
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        {selected && (
          <Box p={3}>
            <Typography variant="h6" mb={2}>Detalle de la Orden de Servicio</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>N° Orden:</b> {selected.numero}</Typography>
              <Typography><b>Cliente:</b> {getClientName(selected.clienteId)}</Typography>
              <Typography><b>Fecha:</b> {selected.fechaCreacion}</Typography>
              <Typography><b>Estado:</b> {selected.estado}</Typography>
              <Typography><b>Descripción:</b> {selected.descripcion}</Typography>
              <Typography><b>Observaciones:</b> {selected.observaciones || '-'}</Typography>
            </Stack>
            <Typography variant="subtitle2">Materiales Utilizados</Typography>
            <ul>
              {selected.materiales.map((m: any) => (
                <li key={m.id}>ID Producto: {m.productoTerminadoId} - Cantidad: {m.cantidad} - Subtotal: ${m.subtotal}</li>
              ))}
            </ul>
            <Typography variant="subtitle2">Tareas</Typography>
            <ul>
              {selected.tareas.map((t: any) => (
                <li key={t.id}>{t.descripcion} ({t.estado})</li>
              ))}
            </ul>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default OrdenesServicioPage;
