import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Chip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { garantiaApiWithFallback } from '../../api/services/apiWithFallback';
import type { Garantia } from '../../types';
import GarantiaFormDialog from './GarantiaFormDialog';
import GarantiaDetailPage from './GarantiaDetailPage';
import { mockGarantias, mockGarantiasBackend, mockClientes, mockProductos } from '../../api/services/mockData';

// Helper to get client/product name from id
const getClientName = (clientId: number) => {
  const c = mockClientes.find(c => c.id === clientId);
  return c ? c.nombre + (c.razonSocial ? ' ' + c.razonSocial : '') : `Cliente #${clientId}`;
};
const getProductName = (productId: number) => {
  const p = mockProductos.find(p => p.id === productId);
  return p ? p.name : `Producto #${productId}`;
};

// Helper to format date
const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return !isNaN(d.getTime()) ? d.toLocaleDateString() : date;
};

// Improved status color mapping for legacy and DTO data
const getStatusColor = (g: any) => {
  const status = (g.status || g.estado || '').toLowerCase();
  if (['active', 'vigente', 'abierto'].includes(status)) return 'success';
  if (['expired', 'vencida', 'cerrado'].includes(status)) return 'error';
  return 'warning';
};

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<any[]>(mockGarantiasBackend);
  const [search, setSearch] = useState('');
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    // Replace with API call
    setGarantias(mockGarantias);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Defensive search for DTO-compliant and legacy mock data
  const filteredGarantias = garantias.filter(g => {
    const cliente = (g.clienteNombre || getClientName?.(g.clientId) || '').toLowerCase();
    const producto = (g.productoNombre || getProductName?.(g.productId) || '').toLowerCase();
    const estado = (g.estado || g.status || '').toLowerCase();
    return (
      cliente.includes(search.toLowerCase()) ||
      producto.includes(search.toLowerCase()) ||
      estado.includes(search.toLowerCase())
    );
  });

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Gestión de Garantías</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Buscar por cliente, producto o estado"
              value={search}
              onChange={handleSearch}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setSelectedGarantia(null); setFormOpen(true); }}
            >
              Nueva Garantía
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Fecha Venta</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGarantias.map(g => (
              <TableRow key={g.id} hover>
                <TableCell>{g.clienteNombre || getClientName?.(g.clientId) || '-'}</TableCell>
                <TableCell>{g.productoNombre || getProductName?.(g.productId) || '-'}</TableCell>
                <TableCell>{formatDate(g.startDate || g.fechaVenta)}</TableCell>
                <TableCell>
                  <Chip label={g.status || g.estado}
                    color={getStatusColor(g)}
                    sx={{ minWidth: 90, fontWeight: 600, fontSize: 15 }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => { setSelectedGarantia(g); setDetailOpen(true); }}>
                    Ver Detalle
                  </Button>
                  <IconButton size="small" onClick={() => { setSelectedGarantia(g); setFormOpen(true); }}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <GarantiaFormDialog
        open={formOpen}
        garantia={selectedGarantia}
        onClose={() => setFormOpen(false)}
        onSave={(garantia) => {
          if (garantia.id) {
            setGarantias(gs => gs.map(g => g.id === garantia.id ? garantia : g));
          } else {
            setGarantias(gs => [...gs, { ...garantia, id: Date.now().toString() }]);
          }
          setFormOpen(false);
        }}
      />
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedGarantia && (
          <GarantiaDetailPage
            garantia={selectedGarantia as any}
            onBack={() => setDetailOpen(false)}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default GarantiasPage;
