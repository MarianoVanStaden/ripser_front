import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {
  asistenciaTerminalApi,
  type EnNoNoAsignado,
  type ImportResumen,
  type ResumenAsistenciaEmpleado,
} from '../../api/services/asistenciaTerminalApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { Empleado } from '../../types';

/**
 * Carga del archivo .txt del terminal de huella y revisión de la asistencia
 * resultante para liquidación. Solo ADMIN y COORDINADORA_LOGISTICA.
 */
const AsistenciaTerminalPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumenImport, setResumenImport] = useState<ImportResumen | null>(null);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [noAsignadas, setNoAsignadas] = useState<EnNoNoAsignado[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, number | ''>>({});
  const [asignando, setAsignando] = useState<string | null>(null);

  const [desde, setDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [hasta, setHasta] = useState(dayjs().format('YYYY-MM-DD'));
  const [resumen, setResumen] = useState<ResumenAsistenciaEmpleado[]>([]);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const nombreEmpleado = (e: Empleado) =>
    `${e.apellido ?? ''}, ${e.nombre ?? ''}`.trim();

  const cargarNoAsignadas = useCallback(async () => {
    try {
      setNoAsignadas(await asistenciaTerminalApi.getNoAsignadas());
    } catch {
      /* silencioso: el panel simplemente queda vacío */
    }
  }, []);

  const cargarResumen = useCallback(async () => {
    setLoadingResumen(true);
    try {
      setResumen(await asistenciaTerminalApi.getResumen(desde, hasta));
    } catch (e: any) {
      setError(e?.response?.data ?? 'Error al cargar el resumen');
    } finally {
      setLoadingResumen(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    employeeApi.getAllList().then(setEmpleados).catch(() => setEmpleados([]));
    cargarNoAsignadas();
  }, [cargarNoAsignadas]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResumenImport(null);
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('El archivo debe ser un .txt exportado del terminal de huella.');
      return;
    }
    setUploading(true);
    try {
      const res = await asistenciaTerminalApi.importar(file);
      setResumenImport(res);
      await cargarNoAsignadas();
      await cargarResumen();
    } catch (err: any) {
      setError(err?.response?.data ?? 'Error al importar el archivo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAsignar = async (enNo: string) => {
    const empleadoId = seleccion[enNo];
    if (!empleadoId) return;
    setAsignando(enNo);
    setError(null);
    try {
      await asistenciaTerminalApi.asignar(empleadoId, enNo);
      await cargarNoAsignadas();
      await cargarResumen();
    } catch (err: any) {
      setError(err?.response?.data ?? 'Error al asignar el código.');
    } finally {
      setAsignando(null);
    }
  };

  const empleadosOrdenados = useMemo(
    () => [...empleados].sort((a, b) => nombreEmpleado(a).localeCompare(nombreEmpleado(b))),
    [empleados],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Fichadas / Asistencia (terminal de huella)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Subí el archivo <code>.txt</code> que exporta el terminal táctil de ingreso. El sistema
        registra las fichadas, calcula horas trabajadas y horas extra por día, y arma la
        asistencia para la liquidación de sueldos.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {typeof error === 'string' ? error : 'Ocurrió un error.'}
        </Alert>
      )}

      {/* ── Carga de archivo ── */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          hidden
          onChange={handleFile}
        />
        <Button
          variant="contained"
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Importando…' : 'Subir archivo del terminal'}
        </Button>

        {resumenImport && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip color="success" label={`${resumenImport.fichadasNuevas} fichadas nuevas`} />
              <Chip label={`${resumenImport.fichadasDuplicadas} duplicadas (ignoradas)`} />
              {resumenImport.lineasInvalidas > 0 && (
                <Chip color="warning" label={`${resumenImport.lineasInvalidas} líneas inválidas`} />
              )}
              {resumenImport.fechaDesde && (
                <Chip variant="outlined" label={`${resumenImport.fechaDesde} → ${resumenImport.fechaHasta}`} />
              )}
              <Chip
                variant="outlined"
                label={`${resumenImport.empleadosProcesados} empleados · ${resumenImport.registrosAsistenciaGenerados} registros`}
              />
            </Stack>
          </Box>
        )}
      </Paper>

      {/* ── Códigos sin asignar ── */}
      {noAsignadas.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Legajos de huella sin asignar ({noAsignadas.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Asigná cada código del terminal a un empleado del sistema para que sus fichadas se
            computen en la asistencia.
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={1}>
            {noAsignadas.map((n) => (
              <Stack
                key={n.enNo}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
              >
                <Chip label={`EnNo ${n.enNo}`} />
                <Typography variant="body2" sx={{ minWidth: 160 }}>
                  {n.nombreTerminal ? `"${n.nombreTerminal}"` : <em>(sin nombre)</em>}{' '}
                  · {n.cantidadMarcas} marcas
                </Typography>
                <Select
                  size="small"
                  displayEmpty
                  value={seleccion[n.enNo] ?? ''}
                  onChange={(e) =>
                    setSeleccion((prev) => ({ ...prev, [n.enNo]: e.target.value as number }))
                  }
                  sx={{ minWidth: 240 }}
                >
                  <MenuItem value="">
                    <em>Elegir empleado…</em>
                  </MenuItem>
                  {empleadosOrdenados.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {nombreEmpleado(e)}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!seleccion[n.enNo] || asignando === n.enNo}
                  onClick={() => handleAsignar(n.enNo)}
                >
                  {asignando === n.enNo ? 'Asignando…' : 'Asignar'}
                </Button>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── Resumen por empleado ── */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            Resumen de asistencia
          </Typography>
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarResumen}
            disabled={loadingResumen}
          >
            Actualizar
          </Button>
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Empleado</TableCell>
                <TableCell align="center">Código</TableCell>
                <TableCell align="right">Días</TableCell>
                <TableCell align="right">Horas totales</TableCell>
                <TableCell align="right">Horas extra</TableCell>
                <TableCell align="right">Días incompletos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingResumen ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={22} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : resumen.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Sin asistencia en el período seleccionado.
                  </TableCell>
                </TableRow>
              ) : (
                resumen.map((r) => (
                  <TableRow key={r.empleadoId} hover>
                    <TableCell>{r.nombreCompleto}</TableCell>
                    <TableCell align="center">{r.codigoTerminal ?? '—'}</TableCell>
                    <TableCell align="right">{r.diasTrabajados}</TableCell>
                    <TableCell align="right">{r.horasTotales}</TableCell>
                    <TableCell align="right">
                      {r.horasExtra > 0 ? <strong>{r.horasExtra}</strong> : 0}
                    </TableCell>
                    <TableCell align="right">
                      {r.diasIncompletos > 0 ? (
                        <Chip size="small" color="warning" label={r.diasIncompletos} />
                      ) : (
                        0
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default AsistenciaTerminalPage;
