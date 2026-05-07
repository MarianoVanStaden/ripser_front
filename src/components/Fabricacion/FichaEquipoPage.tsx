import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Download, Print, Search } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { QRCodeCanvas } from 'qrcode.react';
import {
  especificacionTecnicaApi,
  type FichaTecnicaEquipoDTO,
} from '../../api/services/especificacionTecnicaApi';
import LoadingOverlay from '../common/LoadingOverlay';

/**
 * Genera el payload JSON que se embebe en el QR. Incluye toda la ficha
 * (datos del equipo + specs del modelo) para que un técnico pueda
 * consultarlo escaneando con cualquier lector estándar, sin necesidad
 * de internet ni acceso al sistema. Se omiten campos null/vacíos para
 * minimizar densidad del QR.
 *
 * Se prefieren claves cortas (n, mod, fab, ...) sobre las completas:
 * un payload de ~400-600 bytes entra holgado en QR Versión ~14-17 con
 * corrección M y módulos legibles desde 30 cm con cámara de celular.
 */
const buildQrPayload = (
  data: FichaTecnicaEquipoDTO,
  fabricacion: Dayjs | null,
  entrega: Dayjs | null,
): string => {
  const equipo = data.equipo;
  const spec = data.especificacion;

  const payload: Record<string, unknown> = {
    n: equipo.numeroHeladera,
    tipo: equipo.tipo,
    modelo: equipo.modelo,
  };
  if (equipo.medida?.nombre) payload.medida = equipo.medida.nombre;
  if (equipo.color?.nombre) payload.color = equipo.color.nombre;
  if (equipo.clienteNombre) payload.cliente = equipo.clienteNombre;
  if (fabricacion) payload.fab = fabricacion.format('YYYY-MM-DD');
  if (entrega) payload.ent = entrega.format('YYYY-MM-DD');

  if (spec) {
    if (spec.motor) payload.motor = spec.motor;
    if (spec.gas) payload.gas = spec.gas;
    if (spec.humedad) payload.humedad = spec.humedad;
    if (spec.sistema) payload.sistema = spec.sistema;
    if (spec.estructura) payload.estructura = spec.estructura;
    if (spec.gabinete) payload.gabinete = spec.gabinete;
    if (spec.iluminacion) payload.iluminacion = spec.iluminacion;
    if (spec.transformador) payload.transformador = spec.transformador;
    if (spec.leds) payload.leds = spec.leds;
    if (spec.vidrios) payload.vidrios = spec.vidrios;
    if (spec.paneles) payload.paneles = spec.paneles;
    if (spec.puertas) payload.puertas = spec.puertas;
    if (spec.revestimiento) payload.revestimiento = spec.revestimiento;
    if (spec.estanteriasCantidad != null) payload.estanterias = spec.estanteriasCantidad;
    if (spec.estanteriasFormato) payload.formato = spec.estanteriasFormato;
    if (spec.alto != null) payload.alto = spec.alto;
    if (spec.profundidad != null) payload.profundidad = spec.profundidad;
    if (spec.ancho != null) payload.ancho = spec.ancho;
  }

  return JSON.stringify(payload);
};

interface PreviewRowProps {
  label: string;
  value?: string | number | null;
}

const PreviewRow: React.FC<PreviewRowProps> = ({ label, value }) => (
  <Box sx={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
    <Box sx={{ width: 140, p: 0.75, bgcolor: '#f0f0f0', fontWeight: 600, fontSize: 12 }}>
      {label}
    </Box>
    <Box sx={{ flex: 1, p: 0.75, fontSize: 12 }}>{value ?? ''}</Box>
  </Box>
);


/**
 * Ficha técnica + QR imprimible para un equipo fabricado. Carga el equipo
 * por `numeroHeladera`, hace match con la spec del modelo (catálogo) y
 * renderiza el layout que se imprime y se pega al equipo. El QR codifica
 * la URL del detalle del equipo, usado al volver por garantía para
 * recuperar el historial.
 */
const FichaEquipoPage: React.FC = () => {
  const navigate = useNavigate();
  const { numeroHeladera: paramNumero } = useParams<{ numeroHeladera?: string }>();

  const [searchInput, setSearchInput] = useState(paramNumero ?? '');
  const [data, setData] = useState<FichaTecnicaEquipoDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fechas locales para el printout — pueden venir del equipo o ser
  // editadas en la página antes de imprimir. No se persisten desde acá.
  const [fechaFabricacion, setFechaFabricacion] = useState<Dayjs | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState<Dayjs | null>(null);

  const loadFicha = async (numero: string) => {
    if (!numero.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await especificacionTecnicaApi.getFichaTecnica(numero.trim());
      setData(result);
      setFechaFabricacion(
        result.equipo.fechaCreacion ? dayjs(result.equipo.fechaCreacion) : null,
      );
      setFechaEntrega(
        result.equipo.fechaEntrega ? dayjs(result.equipo.fechaEntrega) : null,
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError(
          `No se encontró ningún equipo con número "${numero}". ` +
          'Verificá el formato — los números van con padding de 4 dígitos ' +
          '(ej: COOL-0003, no COOL-3 ni COOL-003). ' +
          'Para evitar tipear, podés entrar desde la lista de equipos con el botón "Ficha + QR".',
        );
      } else {
        setError('Error al cargar la ficha técnica del equipo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paramNumero) {
      void loadFicha(paramNumero);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramNumero]);

  const qrPayload = useMemo(
    () => (data ? buildQrPayload(data, fechaFabricacion, fechaEntrega) : ''),
    [data, fechaFabricacion, fechaEntrega],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && searchInput.trim() !== paramNumero) {
      navigate(`/fabricacion/equipos/${searchInput.trim()}/ficha`);
    } else if (searchInput.trim()) {
      void loadFicha(searchInput.trim());
    }
  };

  const handlePrint = () => window.print();

  /**
   * Renderiza el sticker (QR + código) a un canvas en alta resolución
   * (300dpi para 60×80mm) y dispara la descarga como PNG. No depende del
   * DOM rendereado, así que sale el mismo bitmap independiente del zoom
   * del navegador.
   */
  const handleDownload = () => {
    if (!data) return;
    const qrCanvas = document.querySelector<HTMLCanvasElement>(
      '#sticker-print canvas',
    );
    if (!qrCanvas) return;

    const DPI = 300;
    const mmToPx = (mm: number) => Math.round((mm * DPI) / 25.4);
    const W = mmToPx(60);
    const H = mmToPx(80);

    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ctx = out.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);

    const qrSize = mmToPx(56);
    const qrX = (W - qrSize) / 2;
    const qrY = mmToPx(2);
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${mmToPx(7)}px monospace`;
    ctx.fillText(data.equipo.numeroHeladera, W / 2, mmToPx(70));

    const url = out.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.equipo.numeroHeladera}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Toolbar — oculta al imprimir */}
        <Box className="no-print">
          <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <IconButton onClick={() => navigate(-1)} aria-label="Volver">
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={600}>
              Ficha técnica + QR
            </Typography>
          </Stack>

          <Paper sx={{ p: 2, mb: 2 }}>
            <form onSubmit={handleSearch}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Número de equipo (ej: 042026HCU12842)"
                  size="small"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Search />}
                  disabled={!searchInput.trim() || loading}
                >
                  Cargar ficha
                </Button>
              </Stack>
            </form>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {data && !data.especificacion && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No hay ficha técnica cargada para{' '}
              <strong>
                {data.equipo.tipo} / {data.equipo.modelo}
              </strong>
              . Cargá los datos en{' '}
              <a href="/admin/especificaciones-tecnicas">
                Catálogo de fichas técnicas
              </a>{' '}
              para que aparezcan en la impresión.
            </Alert>
          )}

          {data && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ md: 'center' }}
              >
                <DatePicker
                  label="Fecha de fabricación"
                  value={fechaFabricacion}
                  onChange={setFechaFabricacion}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="Fecha de entrega"
                  value={fechaEntrega}
                  onChange={setFechaEntrega}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownload}
                  disabled={!data}
                >
                  Descargar PNG
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Print />}
                  onClick={handlePrint}
                  disabled={!data}
                >
                  Imprimir
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Las fechas se incluyen en el QR (junto al resto de la ficha). No modifican el equipo.
              </Typography>
            </Paper>
          )}
        </Box>

        {loading && <LoadingOverlay open message="Cargando ficha…" />}

        {/* === PREVIEW EN PANTALLA — vista grande para revisión visual === */}
        {data && (
          <Paper className="no-print" sx={{ p: 3, maxWidth: 800, mx: 'auto', mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Vista previa (no se imprime tal cual)
            </Typography>
            <Box
              sx={{
                bgcolor: '#000',
                color: '#fff',
                p: 1,
                textAlign: 'center',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                ESPECIFICACIONES TÉCNICAS — {data.equipo.numeroHeladera}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <PreviewRow label="Código" value={data.equipo.numeroHeladera} />
                <PreviewRow label="Equipo" value={data.equipo.tipo} />
                <PreviewRow label="Modelo" value={data.equipo.modelo} />
                <PreviewRow label="Cliente" value={data.equipo.clienteNombre ?? '-'} />
                <PreviewRow label="Medida" value={data.equipo.medida?.nombre ?? '-'} />
                <PreviewRow label="Color" value={data.equipo.color?.nombre ?? '-'} />
                <PreviewRow
                  label="Fecha"
                  value={fechaFabricacion ? fechaFabricacion.format('D/M/YYYY') : ''}
                />
                <PreviewRow
                  label="Entrega"
                  value={fechaEntrega ? fechaEntrega.format('D/M/YYYY') : ''}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    border: '1px solid #000',
                    p: 1.5,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <QRCodeCanvas value={qrPayload} size={160} level="M" includeMargin={false} />
                  <Typography variant="caption" sx={{ mt: 1, fontFamily: 'monospace' }}>
                    {data.equipo.numeroHeladera}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {data.especificacion ? (
              <>
                <Divider sx={{ my: 2, borderColor: '#000' }} />
                <Grid container spacing={0}>
                  <Grid item xs={6}>
                    <PreviewRow label="Motor" value={data.especificacion.motor} />
                    <PreviewRow label="Gas" value={data.especificacion.gas} />
                    <PreviewRow label="Humedad" value={data.especificacion.humedad} />
                    <PreviewRow label="Sistema" value={data.especificacion.sistema} />
                    <PreviewRow label="Estructura" value={data.especificacion.estructura} />
                    <PreviewRow label="Gabinete" value={data.especificacion.gabinete} />
                    <PreviewRow label="Iluminación" value={data.especificacion.iluminacion} />
                    <PreviewRow label="Transformador" value={data.especificacion.transformador} />
                    <PreviewRow label="Leds" value={data.especificacion.leds} />
                    <PreviewRow label="Vidrios" value={data.especificacion.vidrios} />
                    <PreviewRow label="Paneles" value={data.especificacion.paneles} />
                    <PreviewRow label="Puertas" value={data.especificacion.puertas} />
                    <PreviewRow label="Revestimiento" value={data.especificacion.revestimiento} />
                  </Grid>
                  <Grid item xs={6}>
                    <PreviewRow label="Estanterías" value={data.especificacion.estanteriasCantidad} />
                    <PreviewRow label="Formato" value={data.especificacion.estanteriasFormato} />
                    <PreviewRow label="Alto" value={data.especificacion.alto} />
                    <PreviewRow label="Profundidad" value={data.especificacion.profundidad} />
                    <PreviewRow label="Ancho" value={data.especificacion.ancho} />
                  </Grid>
                </Grid>
              </>
            ) : null}
          </Paper>
        )}

        {/* === STICKER 60×80mm — lo único que se imprime === */}
        {/*
          La hoja A4 lleva la etiqueta autoadhesiva en la esquina superior
          izquierda; el resto del A4 queda en blanco. Se especifica @page con
          tamaño A4 + márgenes 0 y se posiciona el sticker como bloque fijo
          arriba-izquierda. Si la impresora aplica margen mínimo (típico
          ~5mm) el sticker queda igualmente dentro del área imprimible.
        */}
        {data && (
          <Box
            id="sticker-print"
            sx={{
              width: '60mm',
              height: '80mm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              p: '2mm',
              mx: 'auto',
              my: 2,
            }}
          >
            {/*
              Canvas a 600px (≈300dpi para 56mm) → escalado vía CSS.
              `level="M"` para resistir doblado/manchas mínimas; el JSON
              completo entra cómodo en QR versión ~14-17.
            */}
            <QRCodeCanvas
              value={qrPayload}
              size={600}
              level="M"
              includeMargin={false}
              style={{ width: '56mm', height: '56mm' }}
            />
            <Typography
              sx={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '14pt',
                lineHeight: 1.1,
                mt: '3mm',
                textAlign: 'center',
                letterSpacing: '0.5px',
              }}
            >
              {data.equipo.numeroHeladera}
            </Typography>
          </Box>
        )}

        <style>{`
          @media print {
            @page { size: A4; margin: 0; }
            body { background: #fff !important; margin: 0 !important; }
            .no-print { display: none !important; }
            #sticker-print {
              position: fixed !important;
              top: 5mm !important;
              left: 5mm !important;
              margin: 0 !important;
              page-break-after: avoid !important;
            }
          }
        `}</style>
      </Box>
    </LocalizationProvider>
  );
};

export default FichaEquipoPage;
