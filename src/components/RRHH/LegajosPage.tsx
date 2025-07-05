import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack } from '@mui/material';

// Mock data for legajos
const mockLegajos = [
  { id: 1, empleado: 'Juan Pérez', ingreso: '2021-03-15', puesto: 'Técnico', legajo: 'A123', estado: 'Activo' },
  { id: 2, empleado: 'Ana Gómez', ingreso: '2022-01-10', puesto: 'Administrativo', legajo: 'B456', estado: 'Activo' },
];

const LegajosPage: React.FC = () => {
  const [selected, setSelected] = React.useState<any | null>(null);
  const [open, setOpen] = React.useState(false);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Legajos</Typography>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Legajo</TableCell>
                  <TableCell>Puesto</TableCell>
                  <TableCell>Ingreso</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockLegajos.map(l => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.empleado}</TableCell>
                    <TableCell>{l.legajo}</TableCell>
                    <TableCell>{l.puesto}</TableCell>
                    <TableCell>{l.ingreso}</TableCell>
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
            <Typography variant="h6" mb={2}>Detalle de Legajo</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Empleado:</b> {selected.empleado}</Typography>
              <Typography><b>Legajo:</b> {selected.legajo}</Typography>
              <Typography><b>Puesto:</b> {selected.puesto}</Typography>
              <Typography><b>Ingreso:</b> {selected.ingreso}</Typography>
              <Typography><b>Estado:</b> {selected.estado}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default LegajosPage;
