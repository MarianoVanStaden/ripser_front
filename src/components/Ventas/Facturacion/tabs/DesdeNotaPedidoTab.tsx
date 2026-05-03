import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { DocumentoComercial, OpcionFinanciamientoDTO } from '../../../../types';
import { ESTADO_OPTIONS } from '../constants';
import AuditoriaFlujo from '../../../common/AuditoriaFlujo';

interface Props {
  searchTerm: string;
  onChangeSearchTerm: (next: string) => void;
  notasShownCount: number;
  totalNotas: number;
  isLoading: boolean;
  sortedNotas: DocumentoComercial[];
  paginatedNotas: DocumentoComercial[];
  page: number;
  rowsPerPage: number;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: React.ChangeEventHandler<HTMLInputElement>;
  notaOpcionesFinanciamiento: Record<number, OpcionFinanciamientoDTO[]>;
  onConvert: (nota: DocumentoComercial) => void;
  onCambiarEstado: (nota: DocumentoComercial) => void;
}

const DesdeNotaPedidoTab: React.FC<Props> = ({
  searchTerm, onChangeSearchTerm,
  notasShownCount, totalNotas, isLoading, sortedNotas, paginatedNotas,
  page, rowsPerPage, onChangePage, onChangeRowsPerPage,
  notaOpcionesFinanciamiento, onConvert, onCambiarEstado,
}) => (
  <Box sx={{ width: '100%', maxWidth: '100%' }}>
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar por número de nota, cliente, lead o total..."
        value={searchTerm}
        onChange={(e) => onChangeSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
          ),
        }}
        helperText={`Mostrando ${notasShownCount} de ${totalNotas} notas de pedido`}
      />
    </Box>

    {sortedNotas.length === 0 && !isLoading ? (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No hay Notas de Pedido disponibles
        </Typography>
        <Typography color="text.secondary">
          Las notas de pedido deben estar en estado APROBADO para poder facturarse. Las notas en PENDIENTE pueden aprobarse desde esta misma pantalla.
        </Typography>
      </Paper>
    ) : (
      <>
        <Grid container spacing={3} sx={{ mb: 2 }}>
          {paginatedNotas.map((nota) => {
            const estadoCfg = ESTADO_OPTIONS[nota.estado] ?? { label: nota.estado, color: 'default' as const };
            const opciones = notaOpcionesFinanciamiento[nota.id] ?? [];
            return (
              <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={nota.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6">Nota #{nota.numeroDocumento}</Typography>
                      <Chip label={estadoCfg.label} color={estadoCfg.color} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Cliente: {nota.clienteNombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fecha: {dayjs(nota.fecha).format('DD/MM/YYYY')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Items: {nota.detalles?.length || 0}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" color="primary">
                      Total: ${nota.total?.toFixed(2) || '0.00'}
                    </Typography>
                    <Box mt={1}>
                      <AuditoriaFlujo documento={nota} />
                    </Box>
                    {opciones.length > 0 && (
                      <Box mt={1}>
                        <Chip
                          icon={<CreditCardIcon />}
                          label={`${opciones.length} opciones de financiamiento`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Box>
                    )}
                    <Box mt={2} display="flex" gap={1}>
                      <Tooltip title={nota.estado === 'APROBADO' ? '' : 'La nota debe estar APROBADA para facturarse'}>
                        <span style={{ flex: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            startIcon={<CheckCircleIcon />}
                            onClick={() => onConvert(nota)}
                            disabled={nota.estado !== 'APROBADO'}
                          >
                            Facturar
                          </Button>
                        </span>
                      </Tooltip>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onCambiarEstado(nota)}
                        title="Cambiar estado"
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Box display="flex" justifyContent="center" mt={2}>
          <Paper>
            <TablePagination
              component="div"
              count={totalNotas}
              page={page}
              onPageChange={onChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={onChangeRowsPerPage}
              rowsPerPageOptions={[6, 12, 24, 48]}
              labelRowsPerPage="Notas por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          </Paper>
        </Box>
      </>
    )}
  </Box>
);

export default DesdeNotaPedidoTab;
