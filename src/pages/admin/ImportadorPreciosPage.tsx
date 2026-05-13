import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Stack, Alert,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Paper,
  Chip, Select, MenuItem, FormControl, LinearProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { productApi } from '../../api/services/productApi';
import { recetaFabricacionApi } from '../../api/services/recetaFabricacionApi';
import { findCandidates } from '../../utils/fuzzyMatch';
import type { Producto, RecetaFabricacionListDTO } from '../../types';

// Entrada del listado externo. Aceptamos varios sinónimos de "precio" porque
// los listados que circulan no son uniformes.
interface ListadoItem {
  codigo?: string | number;
  modelo?: string;
  nombre?: string;
  precio?: number;
  precio_estandar?: number;
  precio_mayo?: number;
  precio_oferta?: number;
}

type Target = 'PRODUCTO' | 'RECETA';

interface MatchRow {
  index: number;             // posición en el JSON
  query: string;             // texto contra el que matcheamos
  precioNuevo: number;
  // Selección actual
  target: Target | null;
  selectedId: number | null;
  // Para mostrar
  precioActual: number | null;
  candidatos: Array<{
    target: Target;
    id: number;
    label: string;
    score: number;
    precioActual: number;
  }>;
  skip: boolean;             // marcado para no aplicar
  applied?: 'OK' | 'ERROR';
  errorMsg?: string;
}

const SAMPLE_JSON = `[
  {"modelo":"Heladera CUBE 1.20","precio_estandar":7220000},
  {"modelo":"Cortadora Systel 330","precio_estandar":2242000}
]`;

// Normaliza el nombre de la columna: minúsculas, sin acentos, sin espacios.
// Tolera variaciones como "Código", "  MODELO ", "Precio Lista", etc.
const normalizeHeader = (s: string): string =>
  s.toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const ImportadorPreciosPage: React.FC = () => {
  const [jsonText, setJsonText] = useState('');
  const [precioPreferido, setPrecioPreferido] = useState<'precio_estandar' | 'precio_mayo' | 'precio'>('precio_estandar');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [recetas, setRecetas] = useState<RecetaFabricacionListDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [excelInfo, setExcelInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar catálogos una vez. Sólo entidades destinadas a venta (no MP).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [prodResp, recResp] = await Promise.all([
          productApi.getAll({ size: 5000 }),
          recetaFabricacionApi.findAll({ size: 5000 }),
        ]);
        if (cancelled) return;
        setProductos(prodResp.content || []);
        setRecetas(recResp.content || []);
      } catch (err) {
        console.error('Error cargando catálogos', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const runMatch = (items: ListadoItem[]) => {
    const newRows: MatchRow[] = items.map((item, idx) => {
      const query = item.modelo || item.nombre || String(item.codigo || `item-${idx}`);
      const precioNuevo =
        item[precioPreferido] ??
        item.precio_estandar ??
        item.precio ??
        item.precio_mayo ??
        0;

      const candProd = findCandidates(query, productos, p => p.nombre || '', 3)
        .map(c => ({
          target: 'PRODUCTO' as Target,
          id: c.item.id!,
          label: `${c.item.codigo || '—'} · ${c.item.nombre}`,
          score: c.score,
          precioActual: Number(c.item.precio ?? 0),
        }));
      const candRec = findCandidates(
        query,
        recetas,
        r => `${r.nombre} ${r.modelo}`,
        3,
      ).map(c => ({
        target: 'RECETA' as Target,
        id: c.item.id!,
        label: `${c.item.codigo || '—'} · ${c.item.nombre}`,
        score: c.score,
        precioActual: Number((c.item as any).precioVenta ?? 0),
      }));

      const candidatos = [...candProd, ...candRec].sort((a, b) => b.score - a.score).slice(0, 5);
      const best = candidatos[0];

      return {
        index: idx,
        query,
        precioNuevo: Number(precioNuevo) || 0,
        target: best?.target ?? null,
        selectedId: best?.id ?? null,
        precioActual: best?.precioActual ?? null,
        candidatos,
        skip: !best,
      };
    });
    setRows(newRows);
  };

  const handleParse = () => {
    setParseError(null);
    setRows([]);
    setResultMsg(null);
    setExcelInfo(null);
    let parsed: ListadoItem[];
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setParseError('JSON inválido: ' + (e as Error).message);
      return;
    }
    if (!Array.isArray(parsed)) {
      setParseError('El JSON debe ser un array de items.');
      return;
    }
    runMatch(parsed);
  };

  const handleUploadExcel = async (file: File) => {
    setParseError(null);
    setRows([]);
    setResultMsg(null);
    setExcelInfo(null);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setParseError('El archivo no contiene hojas.');
        return;
      }

      // Tomar la primera fila como headers
      const headerRow = worksheet.getRow(1);
      const headerMap: Record<number, string> = {};
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const raw = cell.text ?? cell.value;
        if (raw != null && String(raw).trim() !== '') {
          headerMap[colNumber] = normalizeHeader(String(raw));
        }
      });

      const colNumbers = Object.keys(headerMap).map(Number);
      const findCol = (...aliases: string[]): number | undefined =>
        colNumbers.find(n => aliases.includes(headerMap[n]));

      const colCodigo = findCol('codigo', 'cod', 'sku');
      const colModelo = findCol('modelo', 'nombre', 'descripcion', 'producto');
      const colPrecio = findCol(
        'precio',
        'precioestandar',
        'preciolista',
        'preciomayo',
        'preciomayorista',
        'preciooferta',
        'precioventa',
      );

      if (colModelo == null && colCodigo == null) {
        setParseError('No se encontró la columna "modelo" (o "codigo") en la primera fila.');
        return;
      }
      if (colPrecio == null) {
        setParseError('No se encontró la columna "precio" en la primera fila.');
        return;
      }

      const items: ListadoItem[] = [];
      // worksheet.rowCount puede incluir filas vacías al final; iteramos y descartamos.
      for (let r = 2; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        const readCell = (col?: number): string => {
          if (col == null) return '';
          const v = row.getCell(col).value;
          if (v == null) return '';
          if (typeof v === 'object' && 'text' in (v as any)) return String((v as any).text ?? '');
          if (typeof v === 'object' && 'result' in (v as any)) return String((v as any).result ?? '');
          return String(v);
        };
        const codigo = readCell(colCodigo).trim();
        const modelo = readCell(colModelo).trim();
        const precioRaw = readCell(colPrecio).trim();
        if (!codigo && !modelo) continue;
        // Limpiar separadores típicos de Excel argentino: "1.234.567,89" → 1234567.89
        const precioClean = precioRaw
          .replace(/[^\d,.-]/g, '')
          .replace(/\.(?=\d{3}(\D|$))/g, '')
          .replace(',', '.');
        const precio = Number(precioClean);
        items.push({
          codigo: codigo || undefined,
          modelo: modelo || undefined,
          precio: Number.isFinite(precio) ? precio : 0,
        });
      }

      if (items.length === 0) {
        setParseError('El archivo no tiene filas de datos.');
        return;
      }

      setExcelInfo(`${file.name} · ${items.length} filas leídas`);
      runMatch(items);
    } catch (e: any) {
      console.error('Error leyendo Excel', e);
      setParseError('No se pudo leer el Excel: ' + (e.message || 'archivo inválido'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadExcel(file);
    // Permitir volver a subir el mismo archivo
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const matchSummary = useMemo(() => {
    const total = rows.length;
    const matched = rows.filter(r => r.selectedId !== null && !r.skip).length;
    const skipped = rows.filter(r => r.skip).length;
    return { total, matched, skipped };
  }, [rows]);

  const updateRow = (idx: number, patch: Partial<MatchRow>) => {
    setRows(prev => prev.map(r => (r.index === idx ? { ...r, ...patch } : r)));
  };

  const handleCandidateChange = (idx: number, value: string) => {
    if (!value) {
      updateRow(idx, { target: null, selectedId: null, precioActual: null });
      return;
    }
    const [target, id] = value.split(':');
    const row = rows.find(r => r.index === idx);
    const cand = row?.candidatos.find(c => c.target === target && c.id === Number(id));
    updateRow(idx, {
      target: target as Target,
      selectedId: Number(id),
      precioActual: cand?.precioActual ?? null,
    });
  };

  const handleApply = async () => {
    setConfirmOpen(false);
    setApplying(true);
    setResultMsg(null);
    let ok = 0;
    let fail = 0;
    const updated: MatchRow[] = [];
    for (const row of rows) {
      if (row.skip || row.selectedId == null || row.precioNuevo <= 0) {
        updated.push(row);
        continue;
      }
      try {
        if (row.target === 'PRODUCTO') {
          await productApi.update(row.selectedId, { precio: row.precioNuevo });
        } else if (row.target === 'RECETA') {
          await recetaFabricacionApi.update(row.selectedId, { precioVenta: row.precioNuevo } as any);
        }
        updated.push({ ...row, applied: 'OK' });
        ok++;
      } catch (err: any) {
        updated.push({
          ...row,
          applied: 'ERROR',
          errorMsg: err.response?.data?.message || err.message,
        });
        fail++;
      }
    }
    setRows(updated);
    setApplying(false);
    setResultMsg(`Actualizados: ${ok} · Fallidos: ${fail}`);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Importador de Precios
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Subí un Excel (<code>.xlsx</code>) con columnas <code>codigo</code>, <code>modelo</code> y <code>precio</code>,
        o pegá un listado en formato JSON. Hace fuzzy match contra productos y recetas; podés
        ajustar manualmente antes de aplicar.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <Box flex={1} width="100%">
              <TextField
                fullWidth
                multiline
                minRows={6}
                maxRows={14}
                label="JSON del listado"
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={SAMPLE_JSON}
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
            <Stack spacing={1.5} sx={{ minWidth: 240 }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<TableChartIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Cargar Excel (.xlsx)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                hidden
                onChange={handleFileChange}
              />
              <Typography variant="caption" color="text.secondary">
                Columnas esperadas: <b>codigo</b>, <b>modelo</b>, <b>precio</b> (primera fila = encabezados).
              </Typography>

              <Divider flexItem sx={{ my: 0.5 }}>o</Divider>

              <FormControl size="small" fullWidth>
                <Typography variant="caption" color="text.secondary">
                  Campo de precio a usar (JSON)
                </Typography>
                <Select
                  value={precioPreferido}
                  onChange={e => setPrecioPreferido(e.target.value as any)}
                >
                  <MenuItem value="precio_estandar">precio_estandar</MenuItem>
                  <MenuItem value="precio_mayo">precio_mayo</MenuItem>
                  <MenuItem value="precio">precio</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleParse}
                disabled={!jsonText.trim() || loading}
              >
                Analizar JSON
              </Button>
              <Button
                size="small"
                onClick={() => setJsonText(SAMPLE_JSON)}
              >
                Cargar ejemplo JSON
              </Button>
            </Stack>
          </Stack>
          {excelInfo && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setExcelInfo(null)}>
              Excel cargado: {excelInfo}
            </Alert>
          )}
          {parseError && (
            <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h6">
                  Vista previa ({matchSummary.matched}/{matchSummary.total} matcheados,
                  {' '}{matchSummary.skipped} salteados)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Revisá los matches antes de aplicar. Click en el dropdown para cambiar el destino.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                disabled={applying || matchSummary.matched === 0}
                onClick={() => setConfirmOpen(true)}
              >
                Aplicar {matchSummary.matched} updates
              </Button>
            </Stack>

            {applying && <LinearProgress sx={{ mb: 2 }} />}
            {resultMsg && (
              <Alert severity="info" sx={{ mb: 2 }}>{resultMsg}</Alert>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Modelo / Nombre listado</TableCell>
                    <TableCell>Match destino</TableCell>
                    <TableCell align="right">Precio actual</TableCell>
                    <TableCell align="right">Precio nuevo</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell align="center">Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => {
                    const bestScore = row.candidatos[0]?.score ?? 0;
                    const isLowConfidence = !row.skip && bestScore > 0 && bestScore < 0.5;
                    return (
                      <TableRow
                        key={row.index}
                        sx={{
                          opacity: row.skip ? 0.4 : 1,
                          bgcolor: row.applied === 'OK'
                            ? 'success.50'
                            : row.applied === 'ERROR'
                              ? 'error.50'
                              : isLowConfidence ? 'warning.50' : 'inherit',
                        }}
                      >
                        <TableCell>{row.index + 1}</TableCell>
                        <TableCell>{row.query}</TableCell>
                        <TableCell sx={{ minWidth: 280 }}>
                          <FormControl size="small" fullWidth>
                            <Select
                              displayEmpty
                              value={row.selectedId ? `${row.target}:${row.selectedId}` : ''}
                              onChange={e => handleCandidateChange(row.index, e.target.value)}
                            >
                              <MenuItem value="">— sin match —</MenuItem>
                              {row.candidatos.map(c => (
                                <MenuItem key={`${c.target}:${c.id}`} value={`${c.target}:${c.id}`}>
                                  <Chip
                                    label={c.target === 'PRODUCTO' ? 'PROD' : 'EQ'}
                                    size="small"
                                    sx={{ mr: 1 }}
                                    color={c.target === 'PRODUCTO' ? 'info' : 'secondary'}
                                  />
                                  {c.label} ({Math.round(c.score * 100)}%)
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="right">
                          {row.precioActual != null
                            ? `$${row.precioActual.toLocaleString('es-AR')}`
                            : '—'}
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={row.precioNuevo}
                            onChange={e => updateRow(row.index, { precioNuevo: Number(e.target.value) })}
                            sx={{ width: 130 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {bestScore > 0 ? `${Math.round(bestScore * 100)}%` : '—'}
                        </TableCell>
                        <TableCell align="center">
                          {row.applied === 'OK' && (
                            <Chip icon={<CheckCircleIcon />} label="OK" color="success" size="small" />
                          )}
                          {row.applied === 'ERROR' && (
                            <Chip
                              icon={<WarningIcon />}
                              label={row.errorMsg || 'Error'}
                              color="error"
                              size="small"
                            />
                          )}
                          {!row.applied && (
                            <Button
                              size="small"
                              variant={row.skip ? 'outlined' : 'text'}
                              onClick={() => updateRow(row.index, { skip: !row.skip })}
                            >
                              {row.skip ? 'Incluir' : 'Saltear'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Aplicar cambios de precio</DialogTitle>
        <DialogContent>
          <Typography>
            Se van a actualizar <b>{matchSummary.matched}</b> precios en la base.
            Esta acción es inmediata y no es reversible automáticamente — asegurate de tener
            el backup que generaste antes (o uno reciente).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={handleApply}>
            Aplicar ahora
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportadorPreciosPage;
