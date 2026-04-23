import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Category as CategoryIcon,
  Clear as ClearIcon,
  Email as EmailIcon,
  Inventory as InventoryIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { proveedorSearchApi } from '../../api/services/proveedorSearchApi';
import { useDebounce } from '../../hooks/useDebounce';
import type { ProveedorOfertaDTO, SearchSuggestion } from '../../types';

const highlight = (text: string, q: string): React.ReactNode => {
  if (!q || !text) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fff59d', padding: 0 }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
};

const BuscarProveedorPorProductoPage: React.FC = () => {
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const debounced = useDebounce(input, 300);

  const [options, setOptions] = useState<SearchSuggestion[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  const [selected, setSelected] = useState<SearchSuggestion | null>(null);
  const [resultados, setResultados] = useState<ProveedorOfertaDTO[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingOpts(true);
    Promise.all([
      proveedorSearchApi.searchProductos(debounced),
      proveedorSearchApi.searchCategorias(debounced),
    ])
      .then(([prods, cats]) => {
        if (cancelled) return;
        setOptions([...prods, ...cats]);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOpts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    if (!selected) {
      setResultados([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoadingRes(true);
    setError(null);

    const request =
      selected.tipo === 'PRODUCTO'
        ? proveedorSearchApi.proveedoresPorProducto(selected.id)
        : proveedorSearchApi.proveedoresPorCategoria(selected.id).then((res) =>
            Array.isArray(res) ? res : res?.content ?? [],
          );

    request
      .then((data) => {
        if (!cancelled) setResultados(data);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los proveedores');
      })
      .finally(() => {
        if (!cancelled) setLoadingRes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const resumen = useMemo(() => {
    if (!selected || resultados.length === 0) return null;
    const n = resultados.length;
    return `${n} ${n === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}`;
  }, [selected, resultados]);

  const handleClear = () => {
    setSelected(null);
    setInput('');
    setOptions([]);
  };

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: '1.25rem', sm: '2.125rem' } }}>
          <SearchIcon />
          Buscar proveedor por producto
        </Typography>
        <Chip
          label="Volver a proveedores"
          variant="outlined"
          onClick={() => navigate('/proveedores/gestion')}
          clickable
        />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Autocomplete
            options={options}
            value={selected}
            inputValue={input}
            loading={loadingOpts}
            onInputChange={(_, v) => setInput(v)}
            onChange={(_, v) => setSelected(v)}
            groupBy={(o) => (o.tipo === 'PRODUCTO' ? 'Productos' : 'Categorías')}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.id === b.id && a.tipo === b.tipo}
            filterOptions={(x) => x}
            noOptionsText={
              input.trim().length < 2
                ? 'Escribí al menos 2 letras…'
                : loadingOpts
                ? 'Buscando…'
                : 'Sin coincidencias'
            }
            renderOption={(props, option) => (
              <li {...props} key={`${option.tipo}-${option.id}`}>
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  {option.tipo === 'PRODUCTO' ? (
                    <InventoryIcon fontSize="small" color="primary" />
                  ) : (
                    <CategoryIcon fontSize="small" color="secondary" />
                  )}
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" noWrap>
                      {highlight(option.label, input)}
                    </Typography>
                    {option.codigo && (
                      <Typography variant="caption" color="text.secondary">
                        {option.codigo}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Buscar producto o categoría…"
                autoFocus
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: (
                    <>
                      {loadingOpts && <CircularProgress size={18} />}
                      {selected && (
                        <IconButton size="small" onClick={handleClear} title="Limpiar">
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {selected && (
            <Box mt={2} display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip
                icon={selected.tipo === 'PRODUCTO' ? <InventoryIcon /> : <CategoryIcon />}
                label={`${selected.tipo === 'PRODUCTO' ? 'Producto' : 'Categoría'}: ${selected.label}`}
                onDelete={handleClear}
                color="primary"
                variant="outlined"
              />
              {resumen && (
                <Typography variant="body2" color="text.secondary">
                  {resumen}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selected && (
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            {loadingRes ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : resultados.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body1" color="text.secondary">
                  No hay proveedores que ofrezcan "{selected.label}".
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Podés asociar productos a proveedores desde la gestión de proveedores.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: { xs: 700, md: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 180 }}>Proveedor</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Producto</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Precio</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Contacto</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>Ubicación</TableCell>
                      <TableCell sx={{ minWidth: 90 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultados.map((r) => (
                      <TableRow key={`${r.proveedorId}-${r.productoId}`} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {r.razonSocial}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{r.productoNombre}</Typography>
                          {r.productoCodigo && (
                            <Typography variant="caption" color="text.secondary">
                              {r.productoCodigo}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.precioProveedor != null ? (
                            <Typography variant="body2" fontWeight={600}>
                              ${r.precioProveedor.toLocaleString('es-AR')}
                            </Typography>
                          ) : (
                            <Chip size="small" label="Sin precio" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          {r.email && (
                            <Tooltip title={r.email}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <EmailIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption" noWrap>
                                  {r.email}
                                </Typography>
                              </Box>
                            </Tooltip>
                          )}
                          {r.telefono && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <PhoneIcon sx={{ fontSize: 14 }} />
                              <Typography variant="caption">{r.telefono}</Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {[r.ciudad, r.provincia].filter(Boolean).join(', ') || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.activo ? 'Activo' : 'Inactivo'}
                            color={r.activo ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default BuscarProveedorPorProductoPage;
