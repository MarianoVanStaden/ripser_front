import {
  Card,
  CardContent,
  Typography,
  Box,
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

  // Ordenar por cantidad de leads descendente
  const sortedProductos = [...data.productos].sort((a, b) => b.cantidadLeads - a.cantidadLeads).slice(0, 10);
  const sortedEquipos = [...data.equipos].sort((a, b) => b.cantidadLeads - a.cantidadLeads).slice(0, 10);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ⭐ Productos y Equipos de Mayor Interés
        </Typography>
        
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label={`Productos (${data.productos.length})`} />
          <Tab label={`Equipos (${data.equipos.length})`} />
        </Tabs>

        {/* Tab Productos */}
        {tabValue === 0 && (
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
                      <Chip label={producto.cantidadLeads} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{producto.cantidadConvertidos}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${producto.tasaConversion.toFixed(1)}%`}
                        size="small"
                        color={producto.tasaConversion >= 30 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${producto.valorEstimadoTotal.toLocaleString()}
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

        {/* Tab Equipos */}
        {tabValue === 1 && (
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
                      <Chip label={equipo.cantidadLeads} size="small" color="secondary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{equipo.cantidadConvertidos}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${equipo.tasaConversion.toFixed(1)}%`}
                        size="small"
                        color={equipo.tasaConversion >= 30 ? 'success' : 'default'}
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
      </CardContent>
    </Card>
  );
};
