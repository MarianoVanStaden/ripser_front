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
  // Acepta el list DTO (grilla) o el DTO completo (detalle): solo usa numeroHeladera/tipo/
  // modelo/colorPrevisto, y de todas formas re-resuelve el equipo completo por numeroHeladera.
  equipo: EquipoFabricadoListDTO | EquipoFabricadoDTO | null;
  onClose: () => void;
  onSuccess: (equipoActualizado: EquipoFabricadoDTO) => void;
}

/** Color placeholder que se trata como "sin color" (ver definirColorReal en el backend). */
const esColorIndefinido = (nombre?: string | null): boolean =>
  !nombre || nombre.trim().toUpperCase() === 'A DEFINIR';

/**
 * Doble propósito según el estado del equipo:
 *  - Base sin terminar (WIP/reservada): edita el "color previsto" (anotación; el revestimiento
 *    definitivo se aplica en la terminación, que descuenta material).
 *  - Equipo COMPLETADO sin color real (o con el sentinela "A Definir"): DEFINE el color real
 *    directo (sin descontar material) — destraba migrados/bases completadas sin terminación.
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset de UI al cerrar el dialog; un re-render, sin cascada
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

  // Modo "definir color real": el equipo ya está COMPLETADO sin color usable → la terminación ya
  // no aplica; se setea color_id directo. Si no, es el flujo de "color previsto" de siempre.
  const esDefinir = !!full && full.estado === 'COMPLETADO' && esColorIndefinido(full.color?.nombre);

  const handleGuardar = async () => {
    if (!full?.id) {
      setError('No se pudo determinar el id del equipo');
      return;
    }
    if (esDefinir && !colorId) {
      setError('Elegí un color para definir el revestimiento');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const actualizado = esDefinir
        ? await equipoFabricadoApi.definirColor(full.id, colorId!)
        : await equipoFabricadoApi.updateColorPrevisto(full.id, colorId ?? null);
      onSuccess(actualizado);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'No se pudo guardar el color');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Palette fontSize="small" />
        {esDefinir ? 'Definir color (revestimiento)' : 'Elegir revestimiento (color previsto)'}
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

            {!esDefinir && colorPrevistoActual && (
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

            {esDefinir ? (
              <Alert severity="warning">
                Este equipo ya está <strong>completado</strong> sin color definido. Se va a asignar
                el color <strong>real</strong> directamente. No se descuenta material (ya se consumió
                al fabricarlo).
              </Alert>
            ) : (
              <Alert severity="info">
                El revestimiento definitivo se aplica recién en la terminación (Iniciar → Completar →
                Aplicar Terminación), donde se descuenta el material. Acá solo se registra el color
                elegido para que el taller sepa qué producir.
              </Alert>
            )}

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
          disabled={saving || loadingEquipo || (esDefinir && !colorId)}
          startIcon={saving ? <CircularProgress size={18} /> : undefined}
        >
          {saving ? 'Guardando…' : esDefinir ? 'Definir color' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditarColorPrevistoDialog;
