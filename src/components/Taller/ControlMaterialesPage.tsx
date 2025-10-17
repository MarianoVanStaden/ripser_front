import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack } from '@mui/material';
import { mockMaterialesUtilizados, mockProductosTerminados } from '../../api/services/mockData';


const getProductName = (id: number) => {
  const p = mockProductosTerminados.find(p => p.id === id);
  return p ? p.nombre : `Producto #${id}`;
};


const ControlMaterialesPage: React.FC = () => {
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Control de Materiales Utilizados</Typography>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Precio Unitario</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockMaterialesUtilizados.map(m => (
                  <TableRow key={m.id} hover>
                    <TableCell>{getProductName(m.productoTerminadoId)}</TableCell>
                    <TableCell>{m.cantidad}</TableCell>
                    <TableCell>${m.precioUnitario}</TableCell>
                    <TableCell>${m.subtotal}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(m); setOpen(true); }}>Ver Detalle</Button>
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
            <Typography variant="h6" mb={2}>Detalle del Material Utilizado</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Producto:</b> {getProductName(selected.productoTerminadoId)}</Typography>
              <Typography><b>Cantidad:</b> {selected.cantidad}</Typography>
              <Typography><b>Precio Unitario:</b> ${selected.precioUnitario}</Typography>
              <Typography><b>Subtotal:</b> ${selected.subtotal}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default ControlMaterialesPage;
