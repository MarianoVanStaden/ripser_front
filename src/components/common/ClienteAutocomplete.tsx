import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { clienteApi } from '../../api/services/clienteApi';
import type { Cliente, EstadoCliente } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

const ESTADO_COLOR: Record<EstadoCliente, 'success' | 'default' | 'warning' | 'error'> = {
  ACTIVO: 'success',
  INACTIVO: 'default',
  SUSPENDIDO: 'warning',
  MOROSO: 'error',
};

const initials = (cliente: Cliente): string => {
  const base = (cliente.razonSocial || `${cliente.nombre || ''} ${cliente.apellido || ''}`).trim();
  if (!base) return '?';
  const parts = base.split(/\s+/).slice(0, 2);
  return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?';
};

const primaryLabel = (cliente: Cliente): string => {
  const nombreCompleto = cliente.apellido
    ? `${cliente.nombre} ${cliente.apellido}`.trim()
    : (cliente.nombre || '').trim();
  return cliente.razonSocial?.trim() || nombreCompleto || `Cliente #${cliente.id}`;
};

const secondaryParts = (cliente: Cliente): string[] => {
  const parts: string[] = [];
  if (cliente.razonSocial && cliente.nombre) {
    const nombre = cliente.apellido
      ? `${cliente.nombre} ${cliente.apellido}`.trim()
      : cliente.nombre.trim();
    if (nombre) parts.push(nombre);
  }
  if (cliente.cuit) parts.push(`CUIT ${cliente.cuit}`);
  if (cliente.email) parts.push(cliente.email);
  if (cliente.telefono) parts.push(cliente.telefono);
  return parts;
};

export interface ClienteAutocompleteProps {
  value: Cliente | null;
  onChange: (cliente: Cliente | null) => void;
  label?: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  sucursalId?: number | null;
  pageSize?: number;
  /** Show only ACTIVO clients in suggestions */
  onlyActivos?: boolean;
}

const ClienteAutocomplete: React.FC<ClienteAutocompleteProps> = ({
  value,
  onChange,
  label = 'Cliente',
  placeholder = 'Buscar por nombre, razón social o CUIT…',
  size = 'small',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
  margin = 'none',
  sucursalId,
  pageSize = 20,
  onlyActivos = false,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [options, setOptions] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedInput = useDebounce(inputValue, 300);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Keep selected value in the option list so the chip renders correctly
  const mergedOptions = useMemo<Cliente[]>(() => {
    if (!value) return options;
    return options.some(o => o.id === value.id) ? options : [value, ...options];
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    const term = debouncedInput.trim();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const reqId = ++requestIdRef.current;

    setLoading(true);
    const run = async () => {
      try {
        const res = term.length > 0
          ? await clienteApi.searchByQuery(term, pageSize, controller.signal)
          : await clienteApi.getAll(
              { page: 0, size: pageSize, sort: 'fechaActualizacion,desc' },
              {
                ...(sucursalId != null ? { sucursalId } : {}),
                ...(onlyActivos ? { estado: 'ACTIVO' as EstadoCliente } : {}),
              }
            );
        if (reqId !== requestIdRef.current) return;
        let list = Array.isArray(res?.content) ? res.content : [];
        if (onlyActivos) list = list.filter(c => c.estado === 'ACTIVO');
        setOptions(list);
      } catch (err) {
        const e = err as { name?: string; code?: string };
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
        if (reqId === requestIdRef.current) setOptions([]);
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    };
    run();

    return () => controller.abort();
  }, [debouncedInput, open, pageSize, sucursalId, onlyActivos]);

  return (
    <Autocomplete<Cliente, false, false, false>
      fullWidth={fullWidth}
      size={size}
      disabled={disabled}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, v, reason) => {
        if (reason === 'reset') return; // don't overwrite while selecting
        setInputValue(v);
      }}
      options={mergedOptions}
      loading={loading}
      filterOptions={(opts) => opts}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      getOptionLabel={(option) => primaryLabel(option)}
      noOptionsText={
        debouncedInput.trim().length === 0
          ? 'Empezá a escribir para buscar clientes…'
          : loading
            ? 'Buscando…'
            : 'Sin resultados'
      }
      loadingText="Buscando clientes…"
      renderOption={(props, option) => {
        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
        const isJuridica = option.tipo === 'PERSONA_JURIDICA';
        const secondary = secondaryParts(option);
        return (
          <Box
            component="li"
            key={key ?? option.id}
            {...rest}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              py: 1,
              '&[aria-selected="true"]': { backgroundColor: 'action.selected' },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: isJuridica ? 'secondary.light' : 'primary.light',
                color: isJuridica ? 'secondary.contrastText' : 'primary.contrastText',
                fontSize: '0.8rem',
                mt: 0.25,
              }}
            >
              {initials(option) || (isJuridica ? <BusinessIcon fontSize="small" /> : <PersonIcon fontSize="small" />)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, lineHeight: 1.2, mr: 0.5, wordBreak: 'break-word' }}
                >
                  {primaryLabel(option)}
                </Typography>
                {option.estado && option.estado !== 'ACTIVO' && (
                  <Chip
                    label={option.estado}
                    size="small"
                    color={ESTADO_COLOR[option.estado]}
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
                {isJuridica && (
                  <Chip
                    label="Empresa"
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
              {secondary.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {secondary.join(' · ')}
                </Typography>
              )}
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ ml: 1, mt: 0.5 }}>
              #{option.id}
            </Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          margin={margin}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start" sx={{ ml: 0.5 }}>
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default ClienteAutocomplete;
