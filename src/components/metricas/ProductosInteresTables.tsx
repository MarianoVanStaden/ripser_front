import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { useState } from 'react';
import type { ProductosInteresDTO } from '../../api/services/leadMetricasApi';

interface ProductosInteresTablesProps {
  data: ProductosInteresDTO;
}

export const ProductosInteresTables = ({ data }: ProductosInteresTablesProps) => {
  const [tabValue, setTabValue] = useState(0);

  console.log('⭐ Productos/Equipos - Datos recibidos:', {
    equipos: data.equipos.slice(0, 3),
    productos: data.productos.slice(0, 3)
  });

  // Ordenar por cantidad de leads descendente
  const sortedProductos = [...data.productos].sort((a, b) => 
    (b.cantidadLeads ?? b.cantidad ?? b.cantidadSolicitudes ?? 0) - (a.cantidadLeads ?? a.cantidad ?? a.cantidadSolicitudes ?? 0)
  ).slice(0, 10);
  const sortedEquipos = [...data.equipos].sort((a, b) => 
    (b.cantidadLeads ?? b.cantidad ?? b.cantidadSolicitudes ?? 0) - (a.cantidadLeads ?? a.cantidad ?? a.cantidadSolicitudes ?? 0)
  ).slice(0, 10);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ⭐ Equipos y Productos de Mayor Interés
        </Typography>
        
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label={`Equipos (${data.equipos.length})`} />
          <Tab label={`Productos (${data.productos.length})`} />
        </Tabs>

        {/* Tab Equipos */}
        {tabValue === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Equipo</strong></TableCell>
                  <TableCell align="right"><strong>Leads</strong></TableCell>
                  <TableCell align="right"><strong>Convertidos</strong></TableCell>
                  <TableCell align="right"><strong>Tasa Conv.</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedEquipos.map((equipo, index) => (
                  <TableRow key={equipo.equipoId} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{equipo.equipoNombre}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="secondary">
                        {equipo.cantidadLeads ?? equipo.cantidad ?? equipo.cantidadSolicitudes ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {equipo.cantidadConvertidos ?? equipo.convertidos ?? equipo.cantidadConvertida ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${equipo.tasaConversion?.toFixed(1) ?? '0.0'}%`}
                        size="small"
                        color={(equipo.tasaConversion ?? 0) >= 30 ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {sortedEquipos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay datos de equipos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab Productos */}
        {tabValue === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Producto</strong></TableCell>
                  <TableCell align="right"><strong>Leads</strong></TableCell>
                  <TableCell align="right"><strong>Convertidos</strong></TableCell>
                  <TableCell align="right"><strong>Tasa Conv.</strong></TableCell>
                  <TableCell align="right"><strong>Valor Estimado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProductos.map((producto, index) => (
                  <TableRow key={producto.productoId} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{producto.productoNombre}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        {producto.cantidadLeads ?? producto.cantidad ?? producto.cantidadSolicitudes ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {producto.cantidadConvertidos ?? producto.convertidos ?? producto.cantidadConvertida ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${producto.tasaConversion?.toFixed(1) ?? '0.0'}%`}
                        size="small"
                        color={(producto.tasaConversion ?? 0) >= 30 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${(producto.valorEstimadoTotal ?? 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {sortedProductos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay datos de productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};
