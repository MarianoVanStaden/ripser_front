import React, { useState } from 'react';
import { Box, FormControl, Select, MenuItem, Typography, Chip, CircularProgress } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import type { Sucursal } from '../../types';

interface SucursalSelectorProps {
  sucursales: Sucursal[];
  sucursalActual: number | null;
  sucursalDefecto: number | null;
  onChange: (sucursalId: number | null) => void;
  onChangeBackend?: (sucursalId: number | null) => Promise<void>;
  disabled?: boolean;
}

const SucursalSelector: React.FC<SucursalSelectorProps> = ({
  sucursales,
  sucursalActual,
  sucursalDefecto,
  onChange,
  onChangeBackend,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  // No mostrar si no hay sucursales
  if (sucursales.length === 0) return null;

  const handleChange = async (sucursalId: number | null) => {
    // Si hay un callback de backend, usarlo
    if (onChangeBackend) {
      setLoading(true);
      try {
        await onChangeBackend(sucursalId);
        // El backend ya actualiza el estado
      } catch (error) {
        console.error('Error al cambiar sucursal en backend:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Solo actualización local
      onChange(sucursalId);
    }
  };

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          // eslint-disable-next-line ripser/no-literal-colors -- blanco atenuado sobre navy fijo del sidebar
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
          fontSize: '0.7rem',
          mb: 1,
          display: 'block'
        }}
      >
        FILTRAR POR SUCURSAL
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          value={sucursalActual ?? ''}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled || loading}
          displayEmpty
          startAdornment={loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : undefined}
          sx={{
            // eslint-disable-next-line ripser/no-literal-colors -- velo blanco sobre navy fijo del sidebar
            bgcolor: 'rgba(255,255,255,0.05)',
            color: 'common.white',
            fontSize: '0.875rem',
            '& .MuiOutlinedInput-notchedOutline': {
              // eslint-disable-next-line ripser/no-literal-colors -- borde blanco atenuado sobre navy fijo
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              // eslint-disable-next-line ripser/no-literal-colors -- teal de identidad del sidebar navy fijo
              borderColor: '#00B8A9',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              // eslint-disable-next-line ripser/no-literal-colors -- teal de identidad del sidebar navy fijo
              borderColor: '#00B8A9',
            },
            '& .MuiSvgIcon-root': {
              // eslint-disable-next-line ripser/no-literal-colors -- blanco atenuado sobre navy fijo del sidebar
              color: 'rgba(255,255,255,0.7)',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                // eslint-disable-next-line ripser/no-literal-colors -- menú oscuro de identidad del sidebar navy fijo
                bgcolor: '#2C3E50',
                '& .MuiMenuItem-root': {
                  color: 'common.white',
                  fontSize: '0.875rem',
                  '&:hover': {
                    // eslint-disable-next-line ripser/no-literal-colors -- velo teal de hover sobre menú oscuro fijo
                    bgcolor: 'rgba(0,184,169,0.15)',
                  },
                  '&.Mui-selected': {
                    // eslint-disable-next-line ripser/no-literal-colors -- velo teal de seleccionado sobre menú oscuro fijo
                    bgcolor: 'rgba(0,184,169,0.25)',
                    '&:hover': {
                      // eslint-disable-next-line ripser/no-literal-colors -- velo teal de hover sobre menú oscuro fijo
                      bgcolor: 'rgba(0,184,169,0.35)',
                    },
                  },
                },
              },
            },
          }}
        >
          <MenuItem value="">
            <Box display="flex" alignItems="center" gap={1}>
              <BusinessIcon fontSize="small" />
              <em>Todas las sucursales</em>
            </Box>
          </MenuItem>
          {sucursales.map((sucursal) => (
            <MenuItem key={sucursal.id} value={sucursal.id}>
              <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                <Box display="flex" alignItems="center" gap={1}>
                  <BusinessIcon fontSize="small" />
                  <Typography variant="body2">{sucursal.nombre}</Typography>
                </Box>
                <Box display="flex" gap={0.5}>
                  {sucursal.id === sucursalDefecto && (
                    <Chip
                      label="Defecto"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        // eslint-disable-next-line ripser/no-literal-colors -- teal de identidad del sidebar navy fijo
                        bgcolor: '#00B8A9',
                        color: 'common.white'
                      }}
                    />
                  )}
                  {sucursal.esPrincipal && (
                    <span style={{ fontSize: '1rem' }}>⭐</span>
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SucursalSelector;
