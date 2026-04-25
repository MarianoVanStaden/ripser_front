 
import React, { useState, useEffect, useCallback, useRef } from 'react';
 
import {
 
  Box,
 
  Card,
 
  CardContent,
 
  Typography,
 
  CircularProgress,
 
  Alert,
 
  Button,
 
  TextField,
 
  Table,
 
  TableBody,
 
  TableCell,
 
  TableContainer,
 
  TableHead,
 
  TableRow,
 
  Paper,
 
  IconButton,
 
  FormControl,
 
  InputLabel,
 
  Select,
 
  MenuItem,
 
  Grid,
 
  InputAdornment,
 
  Tooltip,
 
  Chip,
 
  TablePagination,
 
} from '@mui/material';
 
import {
 
  Add as AddIcon,
 
  Edit as EditIcon,
 
  Visibility as VisibilityIcon,
 
  Search as SearchIcon,
 
  AccountBalance as AccountBalanceIcon,
 
  Warning as WarningIcon,
 
} from '@mui/icons-material';
 
import { chequeApi } from '../../api/services/chequeApi';
 
import { usePermisos } from '../../hooks/usePermisos';
 
import type { Cheque, ChequeResumenDTO } from '../../types';
 
import ChequeFormDialog from './ChequeFormDialog';
 
import ChequeDetailDialog from './ChequeDetailDialog';
 
import ChequeEstadoChip from './ChequeEstadoChip';
 
import ChequeTipoChip from './ChequeTipoChip';
 

 
const ChequesPage: React.FC = () => {
 
  const { tienePermiso } = usePermisos();
 

 
  // Datos
 
  const [cheques, setCheques] = useState<Cheque[]>([]);
 
  const [resumen, setResumen] = useState<ChequeResumenDTO | null>(null);
 
  const [loading, setLoading] = useState(true);
 
  const [error, setError] = useState<string | null>(null);
 
  const [success, setSuccess] = useState<string | null>(null);
 

 
  // Dialogs
 
  const [formDialogOpen, setFormDialogOpen] = useState(false);
 
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
 
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
 

 
  // Paginación
 
  const [page, setPage] = useState(0);
 
  const [pageSize, setPageSize] = useState(20);
 
  const [totalElements, setTotalElements] = useState(0);
 

 
  // Filtros
 
  const [searchTerm, setSearchTerm] = useState('');
 
  const [tipoFilter, setTipoFilter] = useState<string>('all');
 
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
 
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 

 
   
 
  useEffect(() => {
 
    if (tienePermiso('VENTAS')) {
 
      loadResumen();
 
    }
/* eslint-disable react-hooks/exhaustive-deps */
  }, []);
 

 
   
 
  useEffect(() => {
 
    if (tienePermiso('VENTAS')) {
 
      loadCheques();
 
    }
/* eslint-disable react-hooks/exhaustive-deps */
  }, [page, pageSize, tipoFilter, estadoFilter]);
 

 
  // Debounce del search para no disparar una request por cada tecla
 
   
 
  useEffect(() => {
 
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
 
    searchDebounceRef.current = setTimeout(() => {
 
      setPage(0);
 
      loadCheques();
 
    }, 400);
 
    return () => {
 
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
 
    };
/* eslint-disable react-hooks/exhaustive-deps */
  }, [searchTerm]);
 

 
  const loadResumen = async () => {
 
    try {
 
      const data = await chequeApi.getResumen();
 
      setResumen(data);
 
    } catch (err) {
 
      console.error('Error loading resumen:', err);
 
    }
 
  };
 

 
  const loadCheques = useCallback(async () => {
 
    try {
 
      setLoading(true);
 
      const params: Record<string, string> = {};
 
      if (tipoFilter !== 'all') params.tipo = tipoFilter;
 
      if (estadoFilter !== 'all') params.estado = estadoFilter;
 
      if (searchTerm.trim()) params.search = searchTerm.trim();
 

 
      const response = await chequeApi.buscar(params, page, pageSize, 'fechaAlta,desc');
 
      setCheques(response.content);
 
      setTotalElements(response.totalElements);
 
      setError(null);
/* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
 
      console.error('Error loading cheques:', err);
 
      if (err.response?.status === 403 || err.response?.status === 401) {
 
        setError('No tiene permisos para acceder a esta información');
 
      } else {
 
        setError('Error al cargar los datos');
 
      }
 
    } finally {
 
      setLoading(false);
 
    }
 
  }, [page, pageSize, tipoFilter, estadoFilter, searchTerm]);
 

 
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
 
    (value: string) => {
 
      setter(value);
 
      setPage(0);
 
    };
 

 
  const handleOpenForm = (cheque?: Cheque) => {
 
    setSelectedCheque(cheque || null);
 
    setFormDialogOpen(true);
 
  };
 

 
  const handleCloseForm = () => {
 
    setFormDialogOpen(false);
 
    setSelectedCheque(null);
 
  };
 

 
  const handleSave = async () => {
 
    await Promise.all([loadCheques(), loadResumen()]);
 
    handleCloseForm();
 
    setSuccess('Cheque guardado correctamente');
 
    setTimeout(() => setSuccess(null), 3000);
 
  };
 

 
  const handleOpenDetail = (cheque: Cheque) => {
 
    setSelectedCheque(cheque);
 
    setDetailDialogOpen(true);
 
  };
 

 
  const handleCloseDetail = () => {
 
    setDetailDialogOpen(false);
 
    setSelectedCheque(null);
 
  };
 

 
  const handleDetailUpdate = async () => {
 
    await Promise.all([loadCheques(), loadResumen()]);
 
  };
 

 
  if (!tienePermiso('VENTAS')) {
 
    return (
 
      <Box sx={{ p: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Alert severity="error">No tiene permisos para acceder a este módulo</Alert>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Box>
 
    );
 
  }
 

 
  const enCartera = resumen?.porEstado?.['EN_CARTERA'];
 
  const depositados = resumen?.porEstado?.['DEPOSITADO'];
 
  const cobrados = resumen?.porEstado?.['COBRADO'];
 
  const rechazados = resumen?.porEstado?.['RECHAZADO'];
 

 
  return (
 
    <Box sx={{ p: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Header */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Typography variant="h4" component="h1">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Gestión de Cheques
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          Nuevo Cheque
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Alerts */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {error && (
 
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {error}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Alert>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {success && (
 
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {success}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Alert>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Statistics Cards */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Grid container spacing={2} sx={{ mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid item xs={12} sm={6} md={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography color="textSecondary" gutterBottom variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Total Cheques
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="h4">{resumen?.total ?? '-'}</Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid item xs={12} sm={6} md={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography color="textSecondary" gutterBottom variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                En Cartera
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="h4" color="primary.main">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {enCartera?.cantidad ?? '-'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid item xs={12} sm={6} md={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography color="textSecondary" gutterBottom variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Depositados
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="h4" color="info.main">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {depositados?.cantidad ?? '-'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid item xs={12} sm={6} md={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography color="textSecondary" gutterBottom variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Cobrados
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="h4" color="success.main">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {cobrados?.cantidad ?? '-'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid item xs={12} sm={6} md={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography color="textSecondary" gutterBottom variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Rechazados
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="h4" color="error.main">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {rechazados?.cantidad ?? '-'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <Grid item xs={12} sm={6} md={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography color="textSecondary" gutterBottom variant="body2">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                Monto en Cartera
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <Typography variant="h5">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                ${(enCartera?.monto ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Filters */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <Card sx={{ mb: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <Grid container spacing={2}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Grid item xs={12} md={6}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TextField
 
                fullWidth
 
                label="Buscar"
 
                value={searchTerm}
 
                onChange={(e) => setSearchTerm(e.target.value)}
 
                placeholder="Número, banco, titular, cliente..."
 
                InputProps={{
 
                  startAdornment: (
 
                    <InputAdornment position="start">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <SearchIcon />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </InputAdornment>
 
                  ),
 
                }}
 
              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Grid item xs={12} md={3}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <InputLabel>Tipo</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Select
 
                  value={tipoFilter}
 
                  onChange={(e) => handleFilterChange(setTipoFilter)(e.target.value)}
 
                  label="Tipo"
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="all">Todos</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="PROPIO">Propios</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="TERCEROS">Terceros</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </FormControl>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Grid item xs={12} md={3}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <FormControl fullWidth>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <InputLabel>Estado</InputLabel>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <Select
 
                  value={estadoFilter}
 
                  onChange={(e) => handleFilterChange(setEstadoFilter)(e.target.value)}
 
                  label="Estado"
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="all">Todos</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="EN_CARTERA">En Cartera</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="DEPOSITADO">Depositado</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="COBRADO">Cobrado</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="RECHAZADO">Rechazado</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <MenuItem value="ANULADO">Anulado</MenuItem>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </Select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </FormControl>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </Grid>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </CardContent>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </Card>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Table */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {loading ? (
 
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <CircularProgress />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Box>
 
      ) : (
 
        <Paper>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <TableContainer>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <Table>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TableHead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <TableRow>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell>Tipo</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell>Número</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell>Banco</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell>Titular</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell>Fecha Emisión</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell>Fecha Cobro</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell align="right">Monto</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell align="center">Estado</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <TableCell align="center">Acciones</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </TableRow>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </TableHead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <TableBody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                {cheques.length === 0 ? (
 
                  <TableRow>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <TableCell colSpan={9} align="center">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        No se encontraron cheques
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </TableRow>
 
                ) : (
 
                  cheques.map((cheque) => (
 
                    <TableRow key={cheque.id} hover>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <ChequeTipoChip tipo={cheque.tipo} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            {cheque.numeroCheque}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {cheque.vencido && (
 
                            <Tooltip title="Cheque vencido">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <WarningIcon color="error" fontSize="small" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Tooltip>
 
                          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {cheque.esEcheq && (
 
                            <Chip label="E-Cheq" size="small" variant="outlined" color="info" />
 
                          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {cheque.endosado && (
 
                            <Tooltip title="Ver cadena de endosos">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <Chip
 
                                label="Endosado"
 
                                size="small"
 
                                variant="outlined"
 
                                color="secondary"
 
                                onClick={() => handleOpenDetail(cheque)}
 
                                sx={{ cursor: 'pointer' }}
 
                              />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Tooltip>
 
                          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>{cheque.bancoNombre || '-'}</TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {cheque.titular}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {cheque.clienteNombre && (
 
                          <Typography variant="caption" display="block" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            Cliente: {cheque.clienteNombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
 
                        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {cheque.proveedorNombre && (
 
                          <Typography variant="caption" display="block" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            Proveedor: {cheque.proveedorNombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Typography>
 
                        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {new Date(cheque.fechaEmision).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {new Date(cheque.fechaCobro).toLocaleDateString('es-AR')}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          {cheque.diasParaCobro !== undefined && cheque.diasParaCobro > 0 && (
 
                            <Typography variant="caption" display="block" color="textSecondary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              En {cheque.diasParaCobro} días
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </Typography>
 
                          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Box>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell align="right">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        ${cheque.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell align="center">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <ChequeEstadoChip estado={cheque.estado} />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      <TableCell align="center">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <Tooltip title="Ver detalle">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          <IconButton size="small" onClick={() => handleOpenDetail(cheque)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <VisibilityIcon fontSize="small" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </Tooltip>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {cheque.estado !== 'COBRADO' && cheque.estado !== 'ANULADO' && (
 
                          <Tooltip title="Editar">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            <IconButton size="small" onClick={() => handleOpenForm(cheque)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                              <EditIcon fontSize="small" />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            </IconButton>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </Tooltip>
 
                        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </TableCell>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </TableRow>
 
                  ))
 
                )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </TableBody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </Table>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </TableContainer>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <TablePagination
 
            component="div"
 
            count={totalElements}
 
            page={page}
 
            onPageChange={(_, newPage) => setPage(newPage)}
 
            rowsPerPage={pageSize}
 
            onRowsPerPageChange={(e) => {
 
              setPageSize(parseInt(e.target.value, 10));
 
              setPage(0);
 
            }}
 
            rowsPerPageOptions={[10, 20, 50]}
 
            labelRowsPerPage="Filas por página"
 
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
 
          />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </Paper>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Dialogs */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <ChequeFormDialog
 
        open={formDialogOpen}
 
        cheque={selectedCheque}
 
        onClose={handleCloseForm}
 
        onSave={handleSave}
 
      />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <ChequeDetailDialog
 
        open={detailDialogOpen}
 
        cheque={selectedCheque}
 
        onClose={handleCloseDetail}
 
        onUpdate={handleDetailUpdate}
 
      />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    </Box>
 
  );
 
};
 

 
export default ChequesPage;
