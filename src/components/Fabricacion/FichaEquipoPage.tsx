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
import { ArrowBack, Print, Search } from '@mui/icons-material';
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
 * Build the URL the QR encodes. Resolution order:
 *  1. VITE_QR_BASE_URL env var (production override — points QR at the prod
 *     host even if the page is being printed from localhost).
 *  2. window.location.origin (sane default for dev).
 */
const buildQrUrl = (numeroHeladera: string): string => {
  const envBase = (import.meta.env.VITE_QR_BASE_URL as string | undefined)?.trim();
  const base = envBase && envBase !== '' ? envBase : window.location.origin;
  const cleaned = base.replace(/\/$/, '');
  return `${cleaned}/fabricacion/equipos/${numeroHeladera}`;
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
 * Renderiza una fila compacta del sticker (label : value) en 2 mm de alto
 * aprox., diseñada para entrar en 60×80mm con el QR ocupando ~32mm.
 */
const StickerRow: React.FC<PreviewRowProps> = ({ label, value }) => (
  <Box
    sx={{
      display: 'flex',
      fontSize: '6.5pt',
      lineHeight: 1.15,
      borderBottom: '0.3mm solid #000',
    }}
  >
    <Box sx={{ width: '14mm', fontWeight: 700, pr: '0.5mm' }}>{label}</Box>
    <Box sx={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
      {value ?? ''}
    </Box>
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

  const qrUrl = useMemo(
    () => (data ? buildQrUrl(data.equipo.numeroHeladera) : ''),
    [data],
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
                Las fechas se usan únicamente para la impresión. No modifican el equipo.
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
                  <QRCodeCanvas value={qrUrl} size={160} level="M" includeMargin={false} />
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
              border: '0.3mm solid #000',
              p: '1.5mm',
              boxSizing: 'border-box',
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: '1mm',
              mx: 'auto',
              my: 2,
            }}
          >
            <Box sx={{ textAlign: 'center', borderBottom: '0.3mm solid #000', pb: '0.5mm' }}>
              <Typography sx={{ fontSize: '9pt', fontWeight: 800, lineHeight: 1.1 }}>
                {data.equipo.tipo} {data.equipo.modelo}
              </Typography>
              <Typography sx={{ fontSize: '7pt', fontFamily: 'monospace', lineHeight: 1.1 }}>
                {data.equipo.numeroHeladera}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: '1.5mm', alignItems: 'flex-start' }}>
              <Box sx={{ flexShrink: 0 }}>
                <QRCodeCanvas value={qrUrl} size={110} level="M" includeMargin={false} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <StickerRow label="Cliente" value={data.equipo.clienteNombre ?? ''} />
                <StickerRow label="Medida" value={data.equipo.medida?.nombre ?? ''} />
                <StickerRow label="Color" value={data.equipo.color?.nombre ?? ''} />
                {data.especificacion?.motor && (
                  <StickerRow label="Motor" value={data.especificacion.motor} />
                )}
                {data.especificacion?.gas && (
                  <StickerRow label="Gas" value={data.especificacion.gas} />
                )}
                {data.especificacion?.sistema && (
                  <StickerRow label="Sistema" value={data.especificacion.sistema} />
                )}
                <StickerRow
                  label="Fab."
                  value={fechaFabricacion ? fechaFabricacion.format('D/M/YY') : ''}
                />
                <StickerRow
                  label="Entr."
                  value={fechaEntrega ? fechaEntrega.format('D/M/YY') : ''}
                />
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: '5.5pt',
                textAlign: 'center',
                mt: 'auto',
                color: '#444',
              }}
            >
              Escanear para historial / garantía
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
