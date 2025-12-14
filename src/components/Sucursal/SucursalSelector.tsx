import React from 'react';
import { Box, FormControl, Select, MenuItem, Typography, Chip } from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import type { Sucursal } from '../../types';

interface SucursalSelectorProps {
  sucursales: Sucursal[];
  sucursalActual: number | null;
  sucursalDefecto: number | null;
  onChange: (sucursalId: number | null) => void;
  disabled?: boolean;
}

const SucursalSelector: React.FC<SucursalSelectorProps> = ({
  sucursales,
  sucursalActual,
  sucursalDefecto,
  onChange,
  disabled = false,
}) => {
  // No mostrar si no hay sucursales
  if (sucursales.length === 0) return null;

  // No mostrar si solo hay una sucursal y no está deshabilitado
  if (sucursales.length === 1 && !disabled) return null;

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
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
          displayEmpty
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
