import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Alert, CircularProgress, Stack,
} from '@mui/material';
import { Palette } from '@mui/icons-material';
import { equipoFabricadoApi } from '../../api/services/equipoFabricadoApi';
import type { EquipoFabricadoListDTO, EquipoFabricadoDTO } from '../../types';
import ColorPicker from '../common/ColorPicker';
import { useColores } from '../../context/useColores';

interface EditarColorPrevistoDialogProps {
  open: boolean;
  equipo: EquipoFabricadoListDTO | null;
  onClose: () => void;
  onSuccess: (equipoActualizado: EquipoFabricadoDTO) => void;
}

/**
 * Elige/edita el "color previsto" (revestimiento) de un equipo base ya comprometido
 * (reservado/facturado) cuyo botón de edición estructural está bloqueado. Es solo una anotación:
 * NO asigna el color real ni consume stock — el revestimiento definitivo se aplica en la
 * terminación (Iniciar → Completar → Aplicar Terminación).
 */
const EditarColorPrevistoDialog: React.FC<EditarColorPrevistoDialogProps> = ({
  open,
  equipo,
  onClose,
  onSuccess,
}) => {
  const { colores } = useColores();
  // Resolvemos el DTO completo al abrir: el list DTO puede traer id nulo y observaciones parciales.
  const [full, setFull] = useState<EquipoFabricadoDTO | null>(null);
  const [colorId, setColorId] = useState<number | undefined>(undefined);
  const [loadingEquipo, setLoadingEquipo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !equipo?.numeroHeladera) {
      setFull(null);
      setColorId(undefined);
      setError(null);
      return;
    }
    setLoadingEquipo(true);
    setError(null);
    equipoFabricadoApi.findByNumeroHeladera(equipo.numeroHeladera)
      .then((data) => {
        setFull(data);
        // Preseleccionar el color previsto actual (guardado por nombre) matcheando el catálogo.
        const previsto = data.colorPrevisto ?? equipo.colorPrevisto ?? null;
        const matched = previsto
          ? colores.find((c) => c.nombre.toUpperCase() === previsto.toUpperCase())
          : undefined;
        setColorId(matched?.id);
      })
      .catch(() => setError('No se pudo cargar el equipo'))
      .finally(() => setLoadingEquipo(false));
    // colores es estable (catálogo cacheado); no lo incluimos para no re-disparar el fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, equipo?.numeroHeladera]);

  const colorPrevistoActual = full?.colorPrevisto ?? equipo?.colorPrevisto ?? null;

  const handleGuardar = async () => {
    if (!full?.id) {
      setError('No se pudo determinar el id del equipo');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const actualizado = await equipoFabricadoApi.updateColorPrevisto(full.id, colorId ?? null);
      onSuccess(actualizado);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'No se pudo guardar el color previsto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Palette fontSize="small" />
        Elegir revestimiento (color previsto)
      </DialogTitle>
      <DialogContent>
        {loadingEquipo ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {equipo && (
              <Typography variant="body2" color="text.secondary">
                Equipo <strong>{equipo.numeroHeladera}</strong> — {equipo.tipo} {equipo.modelo}
              </Typography>
            )}

            {colorPrevistoActual && (
              <Typography variant="body2">
                Color previsto actual: <strong>{colorPrevistoActual}</strong>
              </Typography>
            )}

            <ColorPicker
              value={colorId}
              onChange={(id) => setColorId(id)}
              label="Color / revestimiento"
              size="medium"
            />

            <Alert severity="info">
              El revestimiento definitivo se aplica recién en la terminación (Iniciar → Completar →
              Aplicar Terminación), donde se descuenta el material. Acá solo se registra el color
              elegido para que el taller sepa qué producir.
            </Alert>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          disabled={saving || loadingEquipo}
          startIcon={saving ? <CircularProgress size={18} /> : undefined}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarColorPrevistoDialog;
