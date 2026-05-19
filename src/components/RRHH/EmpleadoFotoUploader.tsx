import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography, CircularProgress, Alert } from '@mui/material';
import { PhotoCamera as PhotoCameraIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { documentoEmpleadoApi } from '../../api/services/documentoEmpleadoApi';
import EmpleadoFotoAvatar, { clearEmpleadoFotoCache } from './EmpleadoFotoAvatar';

interface Props {
  empleadoId: number;
  nombre: string;
  apellido: string;
}

/**
 * Subida y previsualización de la foto del empleado (categoría FOTO).
 * Usa el endpoint genérico de documentos: la "foto" no tiene tabla aparte,
 * es un DocumentoEmpleado más cuya categoría es FOTO. Se considera "la foto
 * actual" al documento más reciente con esa categoría.
 *
 * Solo disponible en modo edit (necesita empleadoId real).
 */
const EmpleadoFotoUploader: React.FC<Props> = ({ empleadoId, nombre, apellido }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasFoto, setHasFoto] = useState<boolean | null>(null);

  useEffect(() => {
    documentoEmpleadoApi.getByEmpleadoIdAndCategoria(empleadoId, 'FOTO')
      .then(docs => setHasFoto(docs.length > 0))
      .catch(() => setHasFoto(false));
  }, [empleadoId, refreshKey]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen excede los 5 MB.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await documentoEmpleadoApi.upload(empleadoId, file, 'FOTO', 'Foto de perfil 4x4');
      clearEmpleadoFotoCache(empleadoId);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al subir la foto');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!hasFoto) return;
    setUploading(true);
    setError(null);
    try {
      const docs = await documentoEmpleadoApi.getByEmpleadoIdAndCategoria(empleadoId, 'FOTO');
      // Eliminamos todas las FOTOs para reset clean — operativamente RRHH solo
      // tiene una vigente; las históricas se borran si pidieron "quitar foto".
      await Promise.all(docs.map(d => documentoEmpleadoApi.delete(empleadoId, d.id)));
      clearEmpleadoFotoCache(empleadoId);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al eliminar la foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <EmpleadoFotoAvatar
        key={refreshKey}
        empleadoId={empleadoId}
        nombre={nombre}
        apellido={apellido}
        size={80}
      />
      <Box>
        <Typography variant="caption" color="textSecondary" display="block" mb={1}>
          Foto del empleado (4×4) — máximo 5 MB
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            component="label"
            startIcon={uploading ? <CircularProgress size={14} /> : <PhotoCameraIcon />}
            disabled={uploading}
          >
            {hasFoto ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/*" hidden onChange={handleFile} />
          </Button>
          {hasFoto && (
            <IconButton size="small" color="error" onClick={handleDelete} disabled={uploading}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </Box>
    </Stack>
  );
};

export default EmpleadoFotoUploader;
