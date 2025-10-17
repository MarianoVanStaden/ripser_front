import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Stack, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { ReclamoGarantia } from '../../types';

const mockReclamos: ReclamoGarantia[] = [
  { id: '1', garantiaId: '1', fecha: '2024-06-01', motivo: 'Falla en el producto', estado: 'Abierto', observaciones: 'Cliente reporta mal funcionamiento.' },
  { id: '2', garantiaId: '2', fecha: '2024-06-10', motivo: 'No enciende', estado: 'Cerrado', observaciones: 'Producto reemplazado.' },
];

const ReclamosGarantiaPage: React.FC = () => {
  const [reclamos, setReclamos] = useState<ReclamoGarantia[]>(mockReclamos);
  const [search, setSearch] = useState('');

  const filtered = reclamos.filter(r =>
    r.motivo.toLowerCase().includes(search.toLowerCase()) ||
    r.estado.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Reclamos de Garantía</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Buscar por motivo o estado"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" startIcon={<AddIcon />}>Nuevo Reclamo</Button>
          </Stack>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Observaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id} hover>
                <TableCell>{r.fecha}</TableCell>
                <TableCell>{r.motivo}</TableCell>
                <TableCell>
                  <Chip label={r.estado} color={r.estado === 'Cerrado' ? 'success' : 'warning'} />
                </TableCell>
                <TableCell>{r.observaciones}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReclamosGarantiaPage;
