import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, Stack } from '@mui/material';
import { mockTareasServicio } from '../../api/services/mockData';


const AsignacionTareasPage: React.FC = () => {
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Asignación de Tareas</Typography>
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Horas Estimadas</TableCell>
                  <TableCell>Horas Reales</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Empleado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockTareasServicio.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.descripcion}</TableCell>
                    <TableCell>{t.horasEstimadas}</TableCell>
                    <TableCell>{t.horasReales}</TableCell>
                    <TableCell>
                      <Chip label={t.estado} color={t.estado === 'COMPLETADA' ? 'success' : t.estado === 'EN_PROCESO' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell>{t.empleadoId || '-'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => { setSelected(t); setOpen(true); }}>Ver Detalle</Button>
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
            <Typography variant="h6" mb={2}>Detalle de la Tarea</Typography>
            <Stack spacing={1} mb={2}>
              <Typography><b>Descripción:</b> {selected.descripcion}</Typography>
              <Typography><b>Horas Estimadas:</b> {selected.horasEstimadas}</Typography>
              <Typography><b>Horas Reales:</b> {selected.horasReales}</Typography>
              <Typography><b>Estado:</b> {selected.estado}</Typography>
              <Typography><b>Empleado:</b> {selected.empleadoId || '-'}</Typography>
              <Typography><b>Observaciones:</b> {selected.observaciones || '-'}</Typography>
            </Stack>
            <Button onClick={() => setOpen(false)} variant="outlined">Cerrar</Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default AsignacionTareasPage;
