import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  Add as AddIcon,
  Gavel as GavelIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { AlertTitle } from '@mui/material';
import dayjs from 'dayjs';
import type { DocumentoLegajo, DocumentoCliente } from '../../types';
import ConfirmDialog from '../common/ConfirmDialog';

type Documento = DocumentoLegajo | DocumentoCliente | {
  id: number;
  nombreArchivo: string;
  tipoArchivo: string;
  tamanioBytes: number;
  descripcion?: string;
  categoria: string;
  fechaSubida: string;
  subidoPor: string;
};

interface DocumentManagerProps {
  entityId: number;
  categorias: string[];
  /**
   * Categorías marcadas como obligatorias por ley/regla del negocio.
   * Se muestran con badge "OBLIGATORIO" y, si no hay documentos de esa
   * categoría, dispara un banner "Documentación legal faltante".
   */
  categoriasObligatorias?: string[];
  onUpload: (file: File, categoria: string, descripcion?: string) => Promise<void>;
  onDownload: (id: number, fileName: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onLoad: (entityId: number) => Promise<Documento[]>;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({
  entityId,
  categorias,
  categoriasObligatorias = [],
  onUpload,
  onDownload,
  onDelete,
  onLoad,
}) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload dialog state
  const [openUpload, setOpenUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [docIdToDelete, setDocIdToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadDocumentos();
  }, [entityId]);

  const loadDocumentos = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await onLoad(entityId);
      setDocumentos(docs);
    } catch (err: any) {
      setError(err.message || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !categoria) {
      setError('Por favor seleccione un archivo y una categoría');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await onUpload(selectedFile, categoria, descripcion);
      setSuccess('Documento subido exitosamente');
      setOpenUpload(false);
      resetUploadForm();
      await loadDocumentos();
    } catch (err: any) {
      setError(err.message || 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    setDocIdToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (docIdToDelete == null) return;
    setDeleteLoading(true);
    try {
      setError(null);
      await onDelete(docIdToDelete);
      setSuccess('Documento eliminado exitosamente');
      await loadDocumentos();
      setDocIdToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar documento');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      setError(null);
      await onDownload(id, fileName);
    } catch (err: any) {
      setError(err.message || 'Error al descargar documento');
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setCategoria('');
    setDescripcion('');
  };

  // Categorías obligatorias que todavía no tienen ningún documento subido.
  const obligatoriasFaltantes = categoriasObligatorias.filter(cat =>
    !documentos.some(d => d.categoria === cat)
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            <FileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Documentos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenUpload(true)}
          >
            Subir Documento
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {obligatoriasFaltantes.length > 0 && (
          <Alert severity="warning" icon={<GavelIcon />} sx={{ mb: 2 }}>
            <AlertTitle>Documentación legal faltante</AlertTitle>
            Falta(n) {obligatoriasFaltantes.length} documento(s) obligatorio(s) por ley:
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
              {obligatoriasFaltantes.map(c => <li key={c}>{c}</li>)}
            </Box>
          </Alert>
        )}

        {loading && !uploading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Archivo</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Subido por</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay documentos
                    </TableCell>
                  </TableRow>
                ) : (
                  documentos.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.nombreArchivo}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Chip label={doc.categoria} size="small" color="primary" variant="outlined" />
                          {categoriasObligatorias.includes(doc.categoria) && (
                            <Chip label="LEY" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{doc.descripcion || '-'}</TableCell>
                      <TableCell>{formatFileSize(doc.tamanioBytes)}</TableCell>
                      <TableCell>{dayjs(doc.fechaSubida).format('DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell>{doc.subidoPor}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownload(doc.id, doc.nombreArchivo)}
                          title="Descargar"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(doc.id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Documento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {selectedFile ? selectedFile.name : 'Seleccionar Archivo'}
              <input type="file" hidden onChange={handleFileChange} />
            </Button>

            <TextField
              select
              label="Categoría"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              fullWidth
              required
            >
              {categorias.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    {cat}
                    {categoriasObligatorias.includes(cat) && (
                      <Chip label="OBLIGATORIO" size="small" color="warning"
                        sx={{ ml: 'auto', height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Cancelar</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !categoria || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Subir'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={docIdToDelete != null}
        onClose={() => setDocIdToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar documento?"
        severity="error"
        warning="Esta acción no se puede deshacer."
        description="Está a punto de eliminar este documento. No vas a poder recuperarlo desde la aplicación."
        confirmLabel="Eliminar"
        loadingLabel="Eliminando…"
        loading={deleteLoading}
      />
    </Card>
  );
};

export default DocumentManager;
