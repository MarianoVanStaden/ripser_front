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
            bgcolor: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '0.875rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(255,255,255,0.2)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00B8A9',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00B8A9',
            },
            '& .MuiSvgIcon-root': {
              color: 'rgba(255,255,255,0.7)',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#2C3E50',
                '& .MuiMenuItem-root': {
                  color: '#fff',
                  fontSize: '0.875rem',
                  '&:hover': {
                    bgcolor: 'rgba(0,184,169,0.15)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0,184,169,0.25)',
                    '&:hover': {
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
                        bgcolor: '#00B8A9',
                        color: '#fff'
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
