import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import HandymanIcon from '@mui/icons-material/Handyman';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useStockObjetivo } from './hooks/useStockObjetivo';
import { StockObjetivoTable } from './components/StockObjetivoTable';
import { StockObjetivoForm } from './components/StockObjetivoForm';
import { GenerarOrdenDialog } from './components/GenerarOrdenDialog';
import type { CreateStockObjetivoDTO, EvaluacionStockDTO } from '../../../types';

export const StockPlanificacionPage: React.FC = () => {
  const {
    evaluacion,
    loading,
    error,
    // Form
    formOpen,
    editing,
    saving,
    handleCreate,
    handleUpdate,
    openCreate,
    openEdit,
    closeForm,
    // Generar orden
    generarOrdenOpen,
    generarOrdenTarget,
    generandoOrden,
    openGenerarOrden,
    closeGenerarOrden,
    handleGenerarOrden,
  } = useStockObjetivo();

  const summary = useMemo(
    () =>
      evaluacion.reduce(
        (acc, row) => {
          acc[row.accionSugerida] = (acc[row.accionSugerida] ?? 0) + 1;
          return acc;
        },
        { FABRICAR: 0, TERMINAR_BASE: 0, OK: 0 } as Record<string, number>,
      ),
    [evaluacion],
  );

  const totalAFabricar = useMemo(
    () => evaluacion.reduce((sum, r) => sum + r.cantidadAFabricar, 0),
    [evaluacion],
  );

  const handleSave = async (dto: CreateStockObjetivoDTO) => {
    if (editing) {
      await handleUpdate(editing.id, dto);
    } else {
      await handleCreate(dto);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Planificación de Stock Preventivo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configurá objetivos de stock por variante y monitoreá el estado en tiempo real.
            {!loading && totalAFabricar > 0 && (
              <Typography
                component="span"
                variant="body2"
                color="error.main"
                fontWeight={600}
                sx={{ ml: 1 }}
              >
                · {totalAFabricar} unidades a fabricar en total
              </Typography>
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={loading}
        >
          Nuevo objetivo
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Summary chips */}
      {!loading && evaluacion.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap">
          <Chip
            icon={<BuildIcon />}
            label={`${summary.FABRICAR} ${summary.FABRICAR === 1 ? 'objetivo' : 'objetivos'} por fabricar`}
            color={summary.FABRICAR > 0 ? 'error' : 'default'}
            variant={summary.FABRICAR > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<HandymanIcon />}
            label={`${summary.TERMINAR_BASE} ${summary.TERMINAR_BASE === 1 ? 'base' : 'bases'} a terminar`}
            sx={
              summary.TERMINAR_BASE > 0
                ? {
                    backgroundColor: '#e65100',
                    color: '#fff',
                    '& .MuiChip-icon': { color: '#fff' },
                  }
                : undefined
            }
            variant={summary.TERMINAR_BASE > 0 ? 'filled' : 'outlined'}
          />
          <Chip
            icon={<CheckCircleIcon />}
            label={`${summary.OK} con stock OK`}
            color={summary.OK > 0 ? 'success' : 'default'}
            variant={summary.OK > 0 ? 'filled' : 'outlined'}
          />
        </Stack>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <StockObjetivoTable
        rows={evaluacion}
        loading={loading}
        onEdit={(row: EvaluacionStockDTO) => openEdit(row)}
        onGenerarOrden={(row: EvaluacionStockDTO) => openGenerarOrden(row)}
      />

      {/* Form dialog (create / edit objetivo) */}
      <StockObjetivoForm
        open={formOpen}
        editing={editing}
        saving={saving}
        onClose={closeForm}
        onSave={handleSave}
      />

      {/* Generar orden preventiva dialog */}
      <GenerarOrdenDialog
        open={generarOrdenOpen}
        target={generarOrdenTarget}
        saving={generandoOrden}
        onClose={closeGenerarOrden}
        onConfirm={handleGenerarOrden}
      />
    </Box>
  );
};
