import './CarpetaCliente.css';
import { Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const datosCliente = {
  nombre: 'Juan Pérez',
  direccion: 'Calle 123',
  email: 'juan@mail.com',
  telefono: '11-1234-5678',
};

const historialCompras = [
  { id: 1, producto: 'Heladera No Frost', fecha: '2024-05-20', monto: 120000 },
  { id: 2, producto: 'Freezer Horizontal', fecha: '2023-11-10', monto: 90000 },
];

export default function CarpetaCliente() {
  return (
    <>
      <Typography variant="h5" gutterBottom>Carpeta del Cliente</Typography>
      <Typography variant="body1" gutterBottom>
        Información general y compras realizadas por el cliente.
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="Nombre" secondary={datosCliente.nombre} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Dirección" secondary={datosCliente.direccion} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Email" secondary={datosCliente.email} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Teléfono" secondary={datosCliente.telefono} />
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>Historial de Compras</Typography>
      <List>
        {historialCompras.map(compra => (
          <ListItem key={compra.id}>
            <ListItemText
              primary={compra.producto}
              secondary={`Fecha: ${compra.fecha} - Monto: $${compra.monto.toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}