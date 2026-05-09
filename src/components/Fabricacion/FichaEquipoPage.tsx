import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
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
import { clienteApi } from '../../api/services/clienteApi';
import { generarFichaTecnicaPDF } from '../../services/pdfService';
import type { Cliente } from '../../types';
import LoadingOverlay from '../common/LoadingOverlay';

/**
 * Resolución del host base para el QR:
 *  1. VITE_QR_BASE_URL (override de prod cuando se imprime desde otro entorno)
 *  2. window.location.origin (default para dev/staging)
 */
const resolveQrBase = (): string => {
  const envBase = (import.meta.env.VITE_QR_BASE_URL as string | undefined)?.trim();
  const base = envBase && envBase !== '' ? envBase : window.location.origin;
  return base.replace(/\/$/, '');
};

const buildQrUrl = (numeroHeladera: string): string =>
  `${resolveQrBase()}/fabricacion/equipos/${numeroHeladera}/ficha`;

/**
 * Contenido del QR — híbrido URL + texto plano:
 *
 *   1ra línea: URL absoluta a la ficha online (lo que detectan los scanners
 *              de cámara de iPhone/Android para auto-ofrecer "abrir").
 *   resto:     resumen legible de la ficha (cliente, fechas, motor, gas...)
 *              para que un técnico en campo SIN internet pueda leer la
 *              info directamente del QR como texto.
 *
 * Trade-off: el QR se vuelve más denso (~600-900 chars vs. los 50 de sólo
 * la URL), pero entra holgado en QR versión ~17-20 con corrección M y los
 * módulos siguen siendo legibles a 56mm de lado desde 30cm.
 */
const buildQrContent = (
  data: FichaTecnicaEquipoDTO,
  cliente: Cliente | null,
  fabricacion: Dayjs | null,
  entrega: Dayjs | null,
): string => {
  const url = buildQrUrl(data.equipo.numeroHeladera);
  const e = data.equipo;
  const s = data.especificacion;

  const lines: string[] = [url, ''];
  lines.push(`N° ${e.numeroHeladera}`);
  lines.push(`${e.tipo} ${e.modelo}`);
  if (e.medida?.nombre) lines.push(`Medida: ${e.medida.nombre}`);
  if (e.color?.nombre) lines.push(`Color: ${e.color.nombre}`);
  if (e.clienteNombre) lines.push(`Cliente: ${e.clienteNombre}`);
  if (cliente?.provincia) lines.push(`Provincia: ${cliente.provincia}`);
  if (cliente?.ciudad) lines.push(`Localidad: ${cliente.ciudad}`);
  if (fabricacion) lines.push(`Fabricación: ${fabricacion.format('DD/MM/YYYY')}`);
  if (entrega) lines.push(`Entrega: ${entrega.format('DD/MM/YYYY')}`);

  if (s) {
    lines.push('');
    if (s.motor) lines.push(`Motor: ${s.motor}`);
    if (s.gas) lines.push(`Gas: ${s.gas}`);
    if (s.humedad) lines.push(`Humedad: ${s.humedad}`);
    if (s.sistema) lines.push(`Sistema: ${s.sistema}`);
    if (s.estructura) lines.push(`Estructura: ${s.estructura}`);
    if (s.gabinete) lines.push(`Gabinete: ${s.gabinete}`);
    if (s.iluminacion) lines.push(`Iluminación: ${s.iluminacion}`);
    if (s.transformador) lines.push(`Transf.: ${s.transformador}`);
    if (s.leds) lines.push(`Leds: ${s.leds}`);
    if (s.vidrios) lines.push(`Vidrios: ${s.vidrios}`);
    if (s.paneles) lines.push(`Paneles: ${s.paneles}`);
    if (s.puertas) lines.push(`Puertas: ${s.puertas}`);
    if (s.revestimiento) lines.push(`Revest.: ${s.revestimiento}`);
    if (s.estanteriasCantidad != null) lines.push(`Estant.: ${s.estanteriasCantidad}`);
    if (s.estanteriasFormato) lines.push(`Formato: ${s.estanteriasFormato}`);
    if (s.alto != null) lines.push(`Alto: ${s.alto}`);
    if (s.profundidad != null) lines.push(`Prof.: ${s.profundidad}`);
    if (s.ancho != null) lines.push(`Ancho: ${s.ancho}`);
  }

  return lines.join('\n');
};

// Paleta corporativa (espejo de la usada en pdfService).
const COLORS = {
  darkBlue: '#144272',
  lightBlue: '#CDE2EF',
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
} as const;

/** Una fila label/valor del PDF. Reutilizada en ambas tablas. */
const Cell: React.FC<{ children?: React.ReactNode; bg?: string; bold?: boolean; width?: string | number }> = ({
  children, bg = COLORS.white, bold = false, width,
}) => (
  <Box
    sx={{
      flex: width ? `0 0 ${typeof width === 'number' ? `${width}mm` : width}` : 1,
      bgcolor: bg,
      borderRight: `0.3mm solid ${COLORS.black}`,
      borderBottom: `0.3mm solid ${COLORS.black}`,
      p: '1.5mm 2mm',
      fontSize: '9pt',
      fontWeight: bold ? 700 : 400,
      minHeight: '6mm',
      display: 'flex',
      alignItems: 'center',
      '&:last-child': { borderRight: `0.3mm solid ${COLORS.black}` },
    }}
  >
    {children}
  </Box>
);

const FichaRow: React.FC<{
  rows: Array<{ label: string; value: string; bold?: boolean }>;
  labelWidth?: number;
  valueWidth?: number;
}> = ({ rows, labelWidth = 32, valueWidth = 60 }) => (
  <Box sx={{ display: 'flex', borderTop: `0.3mm solid ${COLORS.black}`, borderLeft: `0.3mm solid ${COLORS.black}` }}>
    {rows.map((r, i) => (
      <React.Fragment key={i}>
        <Cell bg={COLORS.lightBlue} bold width={labelWidth}>{r.label}</Cell>
        <Cell bold={r.bold} width={i === rows.length - 1 ? undefined : valueWidth}>{r.value}</Cell>
      </React.Fragment>
    ))}
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
  const [cliente, setCliente] = useState<Cliente | null>(null);
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
    setCliente(null);
    try {
      const result = await especificacionTecnicaApi.getFichaTecnica(numero.trim());
      setData(result);
      setFechaFabricacion(
        result.equipo.fechaCreacion ? dayjs(result.equipo.fechaCreacion) : null,
      );
      setFechaEntrega(
        result.equipo.fechaEntrega ? dayjs(result.equipo.fechaEntrega) : null,
      );

      // Provincia/localidad no vienen en el DTO de la ficha; se cargan
      // del cliente. Falla silenciosa: si no se puede traer, el PDF
      // muestra esos campos en blanco.
      if (result.equipo.clienteId) {
        try {
          const c = await clienteApi.getById(result.equipo.clienteId);
          setCliente(c);
        } catch (cliErr) {
          console.warn('No se pudo cargar el cliente para la ficha:', cliErr);
        }
      }
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

  // URL "limpia" para mostrar en el toolbar/preview (escaneable a ojo).
  const qrUrl = useMemo(
    () => (data ? buildQrUrl(data.equipo.numeroHeladera) : ''),
    [data],
  );

  // Contenido completo del QR: URL primera línea + resumen legible offline.
  const qrContent = useMemo(
    () => (data ? buildQrContent(data, cliente, fechaFabricacion, fechaEntrega) : ''),
    [data, cliente, fechaFabricacion, fechaEntrega],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && searchInput.trim() !== paramNumero) {
      navigate(`/fabricacion/equipos/${searchInput.trim()}/ficha`);
    } else if (searchInput.trim()) {
      void loadFicha(searchInput.trim());
    }
  };

  /**
   * Construye la ficha técnica en PDF (formato corporativo Ripser, A4).
   * Toma el QR del canvas que ya se renderiza en pantalla y lo embebe
   * pequeño en la esquina superior derecha del header.
   */
  const buildFichaPdf = () => {
    if (!data) return null;
    const qrCanvas = document.querySelector<HTMLCanvasElement>(
      '#sticker-print canvas',
    );
    const qrDataUrl = qrCanvas?.toDataURL('image/png');
    return generarFichaTecnicaPDF({
      ficha: data,
      cliente: cliente ?? undefined,
      fechaFabricacion: fechaFabricacion?.toISOString() ?? null,
      fechaEntrega: fechaEntrega?.toISOString() ?? null,
      qrDataUrl,
    });
  };

  const handleDownload = () => {
    const doc = buildFichaPdf();
    if (!doc || !data) return;
    doc.save(`Ficha_${data.equipo.numeroHeladera}.pdf`);
  };

  /**
   * Descarga el sticker autoadhesivo 60×80mm como PNG a 300dpi.
   * El QR codifica la URL pública de esta misma página, así que escanear
   * el sticker abre el browser con la ficha rendereada en formato PDF.
   */
  const handleDownloadSticker = () => {
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
    ctx.drawImage(qrCanvas, qrX, mmToPx(2), qrSize, qrSize);

    // Auto-shrink del código para que entre en cualquier largo.
    const text = data.equipo.numeroHeladera;
    const maxTextWidth = W - mmToPx(4);
    let fontPx = mmToPx(7);
    const minPx = mmToPx(2.5);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontPx}px monospace`;
    while (ctx.measureText(text).width > maxTextWidth && fontPx > minPx) {
      fontPx -= 2;
      ctx.font = `bold ${fontPx}px monospace`;
    }
    ctx.fillText(text, W / 2, mmToPx(70));

    const dataUrl = out.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${data.equipo.numeroHeladera}_sticker.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Imprimir = abrir el PDF en una pestaña nueva con autoPrint disparado.
   * Más confiable que usar @media print sobre el DOM (el sidebar y demás
   * chrome del Layout interfieren) y produce exactamente el mismo PDF que
   * se descarga.
   */
  const handlePrint = () => {
    const doc = buildFichaPdf();
    if (!doc) return;
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
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
                  Descargar PDF
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

        {/*
          === FICHA HTML — replica visual del PDF descargable ===
          Lo que ve el operador en pantalla y lo que ve el técnico al
          escanear el QR. Los colores, tablas y espaciados son los
          mismos que `generarFichaTecnicaPDF` en pdfService.ts —
          cualquier cambio acá hay que reflejarlo allá.
        */}
        {data && (
          <Paper
            sx={{
              maxWidth: '21cm',
              mx: 'auto',
              mb: 3,
              p: 0,
              overflow: 'hidden',
              boxShadow: 3,
              fontFamily: 'Arial, sans-serif',
              color: COLORS.black,
            }}
          >
            {/* Header azul corporativo */}
            <Box
              sx={{
                bgcolor: COLORS.darkBlue,
                color: COLORS.white,
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Times New Roman, serif',
                    fontStyle: 'italic',
                    fontSize: '24pt',
                    lineHeight: 1,
                  }}
                >
                  Ripser
                </Typography>
                <Typography sx={{ fontSize: '7pt', letterSpacing: 1, mt: 0.5 }}>
                  INSTALACIONES
                </Typography>
                <Typography sx={{ fontSize: '7pt', letterSpacing: 1 }}>
                  COMERCIALES
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', fontSize: '7pt', lineHeight: 1.6 }}>
                <Typography sx={{ fontSize: '7pt' }}>📷 @RipserInstalacionesComerciales</Typography>
                <Typography sx={{ fontSize: '7pt' }}>www.ripser.com.ar</Typography>
                <Typography sx={{ fontSize: '7pt' }}>+54 2235332796</Typography>
              </Box>
            </Box>

            {/* Título */}
            <Box
              sx={{
                bgcolor: COLORS.white,
                p: 1,
                textAlign: 'center',
                borderBottom: `1px solid ${COLORS.gray}`,
              }}
            >
              <Typography
                sx={{ color: COLORS.darkBlue, fontWeight: 700, fontSize: '14pt' }}
              >
                ESPECIFICACIONES TECNICAS
              </Typography>
            </Box>

            {/* Cuerpo con fondo light blue */}
            <Box sx={{ bgcolor: COLORS.lightBlue, p: 3 }}>
              {/* Tabla 1: identificación */}
              <Box sx={{ bgcolor: COLORS.white, mb: 2 }}>
                <FichaRow rows={[
                  { label: 'N° CODIGO', value: data.equipo.numeroHeladera ?? '', bold: true },
                  { label: 'EQUIPO', value: data.equipo.tipo ?? '' },
                ]} />
                <FichaRow rows={[
                  { label: 'CLIENTE', value: data.equipo.clienteNombre ?? '' },
                  { label: 'MODELO', value: data.equipo.modelo ?? '' },
                ]} />
                <FichaRow rows={[
                  { label: 'PROVINCIA', value: cliente?.provincia ?? '' },
                  { label: 'MEDIDA', value: data.equipo.medida?.nombre ?? '' },
                ]} />
                <FichaRow rows={[
                  { label: 'LOCALIDAD', value: cliente?.ciudad ?? '' },
                  { label: 'COLOR', value: data.equipo.color?.nombre ?? '' },
                ]} />
                <FichaRow rows={[
                  { label: 'ENTREGA', value: fechaEntrega ? fechaEntrega.format('DD/MM/YYYY') : '', bold: true },
                  { label: 'FECHA', value: fechaFabricacion ? fechaFabricacion.format('D/M/YYYY') : '' },
                ]} />
              </Box>

              {/* Tabla 2: componentes + dimensiones */}
              {data.especificacion ? (
                <Box sx={{ bgcolor: COLORS.white }}>
                  {[
                    ['MOTOR', data.especificacion.motor ?? '', 'ESTANTERIAS', data.especificacion.estanteriasCantidad?.toString() ?? ''],
                    ['GAS', data.especificacion.gas ?? '', 'FORMATO ESTANTERIAS', data.especificacion.estanteriasFormato ?? ''],
                    ['HUMEDAD', data.especificacion.humedad ?? '', 'ALTO', data.especificacion.alto != null ? data.especificacion.alto.toString().replace('.', ',') : ''],
                    ['SISTEMA', data.especificacion.sistema ?? '', 'PROFUNDIDAD', data.especificacion.profundidad != null ? data.especificacion.profundidad.toString().replace('.', ',') : ''],
                    ['ESTRUCTURA', data.especificacion.estructura ?? '', 'ANCHO', data.especificacion.ancho != null ? data.especificacion.ancho.toString().replace('.', ',') : ''],
                    ['GABINETE', data.especificacion.gabinete ?? '', '', ''],
                    ['ILUMINACION', data.especificacion.iluminacion ?? '', '', ''],
                    ['TRANSFORMADOR', data.especificacion.transformador ?? '', '', ''],
                    ['TIPO', data.especificacion.leds ?? '', '', ''],
                    ['VIDRIO', data.especificacion.vidrios ?? '', '', ''],
                    ['PANELES', data.especificacion.paneles ?? '', '', ''],
                    ['PUERTAS', data.especificacion.puertas ?? '', '', ''],
                    ['REVESTIMIENTO', data.especificacion.revestimiento ?? '', '', ''],
                  ].map(([l1, v1, l2, v2], idx) => (
                    <Box key={idx} sx={{ display: 'flex', borderTop: idx === 0 ? `0.3mm solid ${COLORS.black}` : 'none', borderLeft: `0.3mm solid ${COLORS.black}` }}>
                      <Cell bg={COLORS.lightBlue} bold width={38}>{l1}</Cell>
                      <Cell width={60}>{v1}</Cell>
                      <Cell bg={l2 ? COLORS.lightBlue : COLORS.white} bold={!!l2} width={42}>{l2}</Cell>
                      <Cell>{v2}</Cell>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No hay ficha técnica cargada para{' '}
                  <strong>{data.equipo.tipo} / {data.equipo.modelo}</strong>.
                </Alert>
              )}
            </Box>

            {/* Footer azul */}
            <Box
              sx={{
                bgcolor: COLORS.darkBlue,
                color: COLORS.white,
                p: 1,
                textAlign: 'center',
                fontSize: '7pt',
              }}
            >
              <Typography sx={{ fontSize: '7pt' }}>
                Ripser Instalaciones Comerciales
              </Typography>
            </Box>
          </Paper>
        )}

        {/*
          === STICKER AUTOADHESIVO 60×80mm ===
          Lo que se imprime en una etiqueta 6×8cm para pegar al equipo.
          El QR codifica la URL de esta misma página, así que escanear
          → ver la ficha completa rendereada arriba (idéntica al PDF).
          El canvas también se reusa al generar el PDF descargable.
        */}
        {data && (
          <Paper
            sx={{
              maxWidth: '21cm',
              mx: 'auto',
              p: 2,
              mb: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Box
              id="sticker-print"
              sx={{
                width: '60mm',
                height: '80mm',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                color: '#000',
                backgroundColor: '#fff',
                border: `0.3mm solid ${COLORS.gray}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                p: '2mm',
                flexShrink: 0,
              }}
            >
              <QRCodeCanvas
                value={qrContent}
                size={600}
                level="M"
                includeMargin={false}
                style={{ width: '56mm', height: '56mm' }}
              />
              {(() => {
                const num = data.equipo.numeroHeladera;
                const maxMm = 56 - 2;
                const fontMm = Math.min(5, maxMm / Math.max(num.length, 1) / 0.62);
                const fontPt = (fontMm * 2.83).toFixed(1);
                return (
                  <Typography
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      fontSize: `${fontPt}pt`,
                      lineHeight: 1.1,
                      mt: '3mm',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {num}
                  </Typography>
                );
              })()}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Sticker 6×8cm para pegar al equipo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                <strong>Online</strong> — el celular detecta la URL de la primera
                línea y al tocarla abre la misma ficha que ves arriba.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Offline</strong> — debajo de la URL, el QR contiene un
                resumen en texto plano (cliente, fechas, motor, gas, sistema...)
                que cualquier scanner muestra como notas. Sirve cuando el técnico
                de garantía no tiene internet en el lugar.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                URL: {qrUrl}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadSticker}
              >
                Descargar sticker (PNG)
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default FichaEquipoPage;
