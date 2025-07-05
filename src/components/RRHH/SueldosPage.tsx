import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, Stack } from '@mui/material';

// Mock data for sueldos
const mockSueldos = [
  { id: 1, empleado: 'Juan Pérez', periodo: '2025-06', bruto: 350000, descuentos: 50000, neto: 300000 },
  { id: 2, empleado: 'Ana Gómez', periodo: '2025-06', bruto: 400000, descuentos: 60000, neto: 340000 },
];

const SueldosPage: React.FC = () => {
  const [selected, setSelected] = React.useState<any | null>(null);
  const [open, setOpen] = React.useState(false);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Sueldos</Typography>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell>Bruto</TableCell>
                  <TableCell>Descuentos</TableCell>
                  <TableCell>Neto</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockSueldos.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.empleado}</TableCell>
                    <TableCell>{s.periodo}</TableCell>
                    <TableCell>${s.bruto.toLocaleString()}</TableCell>
                    <TableCell>${s.descuentos.toLocaleString()}</TableCell>
                    <TableCell>${s.neto.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(s); setOpen(true); }}>Ver Detalle</Button>
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
            <Typography variant="h6" mb={2}>Detalle de Sueldo</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Empleado:</b> {selected.empleado}</Typography>
              <Typography><b>Período:</b> {selected.periodo}</Typography>
              <Typography><b>Bruto:</b> ${selected.bruto.toLocaleString()}</Typography>
              <Typography><b>Descuentos:</b> ${selected.descuentos.toLocaleString()}</Typography>
              <Typography><b>Neto:</b> ${selected.neto.toLocaleString()}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default SueldosPage;
