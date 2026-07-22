import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
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
  type DiferenciaFichaje,
  type EnNoNoAsignado,
  type ImportResumen,
  type ResumenAsistenciaEmpleado,
  type TipoDiferenciaFichaje,
} from '../../api/services/asistenciaTerminalApi';
import { employeeApi } from '../../api/services/employeeApi';
import type { Empleado } from '../../types';

/**
 * Carga del archivo .txt del terminal de huella y revisión de la asistencia
 * resultante para liquidación. Solo ADMIN y COORDINADORA_LOGISTICA.
 */
type OrigenTerminal = 'Taller' | 'Oficina';

const DIF_CHIP: Record<TipoDiferenciaFichaje, { label: string; color: 'warning' | 'error' | 'info' }> = {
  TARDE: { label: 'Tarde', color: 'warning' },
  AUSENTE: { label: 'Ausente', color: 'error' },
  INCOMPLETA: { label: 'Incompleta', color: 'warning' },
  SALIDA_ANTICIPADA: { label: 'Salida anticipada', color: 'info' },
};

const fmtHora = (h: string | null) => (h ? h.slice(0, 5) : '—');

const AsistenciaTerminalPage: React.FC = () => {
  const tallerInputRef = useRef<HTMLInputElement>(null);
  const oficinaInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState<OrigenTerminal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumenImport, setResumenImport] = useState<ImportResumen | null>(null);
  const [origenImport, setOrigenImport] = useState<OrigenTerminal | null>(null);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [noAsignadas, setNoAsignadas] = useState<EnNoNoAsignado[]>([]);
  const [seleccion, setSeleccion] = useState<Record<string, number | ''>>({});
  const [asignando, setAsignando] = useState<string | null>(null);

  const [desde, setDesde] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [hasta, setHasta] = useState(dayjs().format('YYYY-MM-DD'));
  const [resumen, setResumen] = useState<ResumenAsistenciaEmpleado[]>([]);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const [diferencias, setDiferencias] = useState<DiferenciaFichaje[]>([]);
  const [loadingDiferencias, setLoadingDiferencias] = useState(false);

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

  const cargarDiferencias = useCallback(async () => {
    setLoadingDiferencias(true);
    try {
      setDiferencias(await asistenciaTerminalApi.getDiferencias(desde, hasta));
    } catch (e: any) {
      setError(e?.response?.data ?? 'Error al cargar las diferencias de fichaje');
    } finally {
      setLoadingDiferencias(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  useEffect(() => {
    cargarDiferencias();
  }, [cargarDiferencias]);

  const handleFile = async (origen: OrigenTerminal, e: React.ChangeEvent<HTMLInputElement>) => {
    const inputRef = origen === 'Taller' ? tallerInputRef : oficinaInputRef;
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResumenImport(null);
    setOrigenImport(null);
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setError('El archivo debe ser un .txt exportado del terminal de huella.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setUploading(origen);
    try {
      const res = await asistenciaTerminalApi.importar(file);
      setResumenImport(res);
      setOrigenImport(origen);
      await cargarNoAsignadas();
      await cargarResumen();
    } catch (err: any) {
      setError(err?.response?.data ?? 'Error al importar el archivo.');
    } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = '';
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

  const conteoDif = useMemo(
    () => ({
      TARDE: diferencias.filter((d) => d.tipo === 'TARDE').length,
      AUSENTE: diferencias.filter((d) => d.tipo === 'AUSENTE').length,
      INCOMPLETA: diferencias.filter((d) => d.tipo === 'INCOMPLETA').length,
      SALIDA_ANTICIPADA: diferencias.filter((d) => d.tipo === 'SALIDA_ANTICIPADA').length,
    }),
    [diferencias],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Fichadas / Asistencia (terminal de huella)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Subí el archivo <code>.txt</code> que exporta cada terminal táctil de ingreso — uno para el
        Taller y otro para las Oficinas. El sistema registra las fichadas, calcula horas trabajadas
        y horas extra por día, y arma la asistencia para la liquidación de sueldos.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {typeof error === 'string' ? error : 'Ocurrió un error.'}
        </Alert>
      )}

      {/* ── Carga de archivo ── */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <input
          ref={tallerInputRef}
          type="file"
          accept=".txt"
          hidden
          onChange={(e) => handleFile('Taller', e)}
        />
        <input
          ref={oficinaInputRef}
          type="file"
          accept=".txt"
          hidden
          onChange={(e) => handleFile('Oficina', e)}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="contained"
            startIcon={uploading === 'Taller' ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploading !== null}
            onClick={() => tallerInputRef.current?.click()}
          >
            {uploading === 'Taller' ? 'Importando…' : 'Subir fichadas del Taller'}
          </Button>
          <Button
            variant="contained"
            startIcon={uploading === 'Oficina' ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
            disabled={uploading !== null}
            onClick={() => oficinaInputRef.current?.click()}
          >
            {uploading === 'Oficina' ? 'Importando…' : 'Subir fichadas de Oficina'}
          </Button>
        </Stack>

        {resumenImport && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {origenImport && <Chip color="primary" label={`Terminal: ${origenImport}`} />}
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
                <Autocomplete
                  size="small"
                  options={empleadosOrdenados}
                  getOptionLabel={(e) => nombreEmpleado(e)}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  value={empleadosOrdenados.find((e) => e.id === seleccion[n.enNo]) ?? null}
                  onChange={(_e, empleado) =>
                    setSeleccion((prev) => ({ ...prev, [n.enNo]: empleado ? empleado.id! : '' }))
                  }
                  filterOptions={(opts, state) => {
                    const q = state.inputValue.trim().toLowerCase();
                    if (!q) return opts;
                    return opts.filter(
                      (e) =>
                        (e.nombre ?? '').toLowerCase().includes(q) ||
                        (e.apellido ?? '').toLowerCase().includes(q),
                    );
                  }}
                  sx={{ minWidth: 260 }}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Escribí nombre o apellido…" />
                  )}
                />
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

      {/* ── Diferencias de fichaje ── */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            Diferencias de fichaje
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarDiferencias}
            disabled={loadingDiferencias}
          >
            Actualizar
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cotejo de las fichadas del sensor de huella contra el horario esperado de cada empleado
          (usa el mismo rango de fechas de arriba). Solo se listan los días con diferencia.
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Chip color="warning" label={`${conteoDif.TARDE} tardanzas`} />
          <Chip color="error" label={`${conteoDif.AUSENTE} ausencias`} />
          <Chip color="warning" variant="outlined" label={`${conteoDif.INCOMPLETA} incompletas`} />
          <Chip color="info" label={`${conteoDif.SALIDA_ANTICIPADA} salidas anticipadas`} />
        </Stack>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Empleado</TableCell>
                <TableCell align="center">Fecha</TableCell>
                <TableCell align="center">Tipo</TableCell>
                <TableCell align="center">Esperado</TableCell>
                <TableCell align="center">Real</TableCell>
                <TableCell>Detalle</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingDiferencias ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={22} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : diferencias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Sin diferencias en el período (o sin horario configurado para cotejar).
                  </TableCell>
                </TableRow>
              ) : (
                diferencias.map((d, i) => (
                  <TableRow key={`${d.empleadoId}-${d.fecha}-${d.tipo}-${i}`} hover>
                    <TableCell>{d.nombreCompleto}</TableCell>
                    <TableCell align="center">{dayjs(d.fecha).format('DD/MM/YYYY')}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" color={DIF_CHIP[d.tipo].color} label={DIF_CHIP[d.tipo].label} />
                    </TableCell>
                    <TableCell align="center">
                      {fmtHora(d.horaEsperadaEntrada)} – {fmtHora(d.horaEsperadaSalida)}
                    </TableCell>
                    <TableCell align="center">
                      {fmtHora(d.horaRealEntrada)} – {fmtHora(d.horaRealSalida)}
                    </TableCell>
                    <TableCell>{d.detalle}</TableCell>
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
