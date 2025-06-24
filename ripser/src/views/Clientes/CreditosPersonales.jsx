import { Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const creditos = [
  { id: 1, cliente: 'Juan Pérez', monto: 50000, estado: 'Activo' },
  { id: 2, cliente: 'Ana García', monto: 30000, estado: 'Cancelado' },
];

export default function CreditosPersonales() {
  return (
    <>
      <Typography variant="h5" gutterBottom>Créditos Personales</Typography>
      <Typography variant="body1" gutterBottom>
        Visualiza y administra los créditos personales otorgados a tus clientes.
      </Typography>
      <Button variant="contained" color="primary" sx={{ mb: 2 }}>
        Nuevo Crédito
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {creditos.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.cliente}</TableCell>
                <TableCell>${c.monto.toLocaleString()}</TableCell>
                <TableCell>{c.estado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}