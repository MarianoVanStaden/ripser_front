import './CuentaCorriente.css';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const movimientos = [
  { id: 1, fecha: '2024-06-01', descripcion: 'Compra de heladera', monto: -120000 },
  { id: 2, fecha: '2024-06-10', descripcion: 'Pago', monto: 60000 },
];

export default function CuentaCorriente() {
  const saldo = movimientos.reduce((acc, mov) => acc + mov.monto, 0);

  return (
    <>
      <Typography variant="h5" gutterBottom>Cuenta Corriente</Typography>
      <Typography variant="body1" gutterBottom>
        Consulta los movimientos y el saldo de la cuenta corriente del cliente.
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Saldo actual: <b style={{ color: saldo < 0 ? 'red' : 'green' }}>${saldo.toLocaleString()}</b>
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Monto</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movimientos.map(mov => (
              <TableRow key={mov.id}>
                <TableCell>{mov.fecha}</TableCell>
                <TableCell>{mov.descripcion}</TableCell>
                <TableCell style={{ color: mov.monto < 0 ? 'red' : 'green' }}>
                  {mov.monto < 0 ? '-' : '+'}${Math.abs(mov.monto).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}