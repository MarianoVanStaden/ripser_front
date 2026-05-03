// FRONT-003: extracted from AsistenciasPage.tsx — Tab "Configurar Horarios".
// Shows the empleados table with their per-día configuration status, plus
// shortcuts to open the ConfigHorariosDialog or seed a horario estándar.
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoAwesome as AutoAwesomeIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import type { Empleado } from '../../../../types';
import { DIAS_SEMANA } from '../constants';
import { getEmpleadoNombre } from '../utils';

interface Props {
  empleados: Empleado[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuraciones: any[];
  onOpenConfigDialog: (empleado?: Empleado | null) => void;
  onCrearHorarioEstandar: (empleadoId: number) => void;
}

const DIA_LABELS: Record<(typeof DIAS_SEMANA)[number], string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

const ConfigurarHorariosTab: React.FC<Props> = ({
  empleados,
  configuraciones,
  onOpenConfigDialog,
  onCrearHorarioEstandar,
}) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Configuración de Horarios por Empleado</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => onOpenConfigDialog()}>
            Nuevo Horario
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empleado</TableCell>
                <TableCell>Estado</TableCell>
                {DIAS_SEMANA.map((dia) => (
                  <TableCell key={dia} align="center">
                    {DIA_LABELS[dia]}
                  </TableCell>
                ))}
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.map((empleado) => {
                const config = Array.isArray(configuraciones)
                  ? configuraciones.find((c) => c.empleadoId === empleado.id)
                  : null;
                return (
                  <TableRow key={empleado.id}>
                    <TableCell>{getEmpleadoNombre(empleado)}</TableCell>
                    <TableCell>
                      {config ? (
                        <Chip
                          label={config.activo ? 'Activo' : 'Inactivo'}
                          color={config.activo ? 'success' : 'default'}
                          size="small"
                        />
                      ) : (
                        <Chip label="Sin configurar" color="warning" size="small" />
                      )}
                    </TableCell>
                    {DIAS_SEMANA.map((dia) => (
                      <TableCell key={dia} align="center">
                        {config && config[dia] && config[dia].trabaja ? (
                          <Tooltip title={`${config[dia].horaEntrada} - ${config[dia].horaSalida}`}>
                            <CheckCircleIcon color="success" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <CancelIcon color="disabled" fontSize="small" />
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {config ? (
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onOpenConfigDialog(empleado)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Crear Horario Estándar (L-V 8:00-17:00)">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onCrearHorarioEstandar(empleado.id)}
                            >
                              <AutoAwesomeIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ConfigurarHorariosTab;
