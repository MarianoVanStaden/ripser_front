// FRONT-003: extracted from AsistenciasPage.tsx — Tab "Excepciones".
// Lists all registered excepciones with delete + entry-point to the
// ExcepcionDialog.
import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
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
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  GroupAdd as GroupAddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { Empleado } from '../../../../types';
import { getEmpleadoNombre } from '../utils';

interface Props {
  empleados: Empleado[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excepciones: any[];
  onOpenExcepcionDialog: () => void;
  onDeleteExcepcion: (excepcionId: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditExcepcion: (excepcion: any) => void;
  /** Opcional: si se provee, muestra el botón de carga masiva de horas extras. */
  onOpenMasivaDialog?: () => void;
}

const tipoChipColor = (tipo: string): 'error' | 'warning' | 'success' | 'default' => {
  if (tipo === 'INASISTENCIA') return 'error';
  if (tipo === 'LLEGADA_TARDE') return 'warning';
  if (tipo === 'HORAS_EXTRAS') return 'success';
  return 'default';
};

const ExcepcionesTab: React.FC<Props> = ({
  empleados,
  excepciones,
  onOpenExcepcionDialog,
  onDeleteExcepcion,
  onEditExcepcion,
  onOpenMasivaDialog,
}) => {
  const hasItems = Array.isArray(excepciones) && excepciones.length > 0;

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">Registro de Excepciones</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {onOpenMasivaDialog && (
              <Button
                variant="outlined"
                startIcon={<GroupAddIcon />}
                onClick={onOpenMasivaDialog}
              >
                Horas Extras en grupo
              </Button>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenExcepcionDialog}>
              Nueva Excepción
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Detalles</TableCell>
                <TableCell>Justificado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!hasItems ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay excepciones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                excepciones.map((excepcion) => {
                  const empleado = empleados.find((e) => e.id === excepcion.empleadoId);
                  return (
                    <TableRow key={excepcion.id}>
                      <TableCell>{dayjs(excepcion.fecha).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{empleado ? getEmpleadoNombre(empleado) : 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={excepcion.tipo}
                          size="small"
                          color={tipoChipColor(excepcion.tipo)}
                        />
                      </TableCell>
                      <TableCell>
                        {excepcion.tipo === 'LLEGADA_TARDE' &&
                          excepcion.minutosTardanza !== undefined &&
                          excepcion.minutosTardanza !== null &&
                          `${excepcion.minutosTardanza} minutos`}
                        {excepcion.tipo === 'HORAS_EXTRAS' &&
                          excepcion.horasExtras !== undefined &&
                          excepcion.horasExtras !== null &&
                          `${excepcion.horasExtras} horas`}
                        {excepcion.tipo === 'INASISTENCIA' && excepcion.motivo}
                        {excepcion.observaciones && ` - ${excepcion.observaciones}`}
                      </TableCell>
                      <TableCell>
                        {excepcion.justificado ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <WarningIcon color="warning" fontSize="small" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEditExcepcion(excepcion)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDeleteExcepcion(excepcion.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ExcepcionesTab;
