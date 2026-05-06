import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Restore as RestoreIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { leadApi } from '../../api/services/leadApi';
import { ESTADO_LABELS } from '../../types/lead.types';
import { formatDate } from '../../utils/leadValidations';
import { useTenant } from '../../context/TenantContext';
import { usePermisos } from '../../hooks/usePermisos';

const LeadsPapeleraPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { esSuperAdmin } = useTenant();
  const { tieneRol } = usePermisos();
  const canManageDeleted = esSuperAdmin || tieneRol('ADMIN', 'GERENTE_SUCURSAL');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const queryKey = ['leads', 'papelera', page, rowsPerPage];
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => leadApi.getDeleted(page, rowsPerPage),
    // No tiene sentido pegarle al backend si el usuario no tiene permiso —
    // devolvería 403 igual.
    enabled: canManageDeleted,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => leadApi.restore(id),
    onSuccess: (lead) => {
      // Invalidamos también el listado principal para que el lead reaparezca ahí.
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSnackMsg(`Lead "${lead.nombre}" restaurado`);
    },
    onError: (err) => {
      console.error('Error al restaurar:', err);
      setSnackMsg('No se pudo restaurar el lead');
    },
  });

  const leads = data?.content ?? [];
  const total = data?.totalElements ?? 0;

  const formatDeletedAt = (iso?: string) => {
    if (!iso) return '-';
    return `${formatDate(iso)} ${new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (!canManageDeleted) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 'md', mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/leads')}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">Papelera de Leads</Typography>
        </Box>
        <Alert severity="warning">
          No tenés permisos para ver la papelera. Pedile acceso a un usuario con
          rol Administrador o Gerente de Sucursal.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 'lg', mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/leads')}>
          Volver
        </Button>
        <DeleteSweepIcon color="action" />
        <Typography variant="h5" component="h1">
          Papelera de Leads
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {total} lead{total === 1 ? '' : 's'} en papelera
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Estos leads fueron eliminados pero pueden restaurarse. Al restaurar, el lead vuelve al listado principal con su estado original.
      </Alert>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Button size="small" onClick={() => refetch()}>Reintentar</Button>
        }>
          Error al cargar la papelera: {(error as Error)?.message ?? 'desconocido'}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estado al borrar</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Borrado el</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Borrado por</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: 120 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell colSpan={6}><Skeleton variant="rectangular" height={28} /></TableCell>
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      La papelera está vacía.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell>
                      {lead.nombre}{lead.apellido ? ` ${lead.apellido}` : ''}
                    </TableCell>
                    <TableCell>{lead.telefono}</TableCell>
                    <TableCell>{ESTADO_LABELS[lead.estadoLead] ?? lead.estadoLead}</TableCell>
                    <TableCell>{formatDeletedAt(lead.deletedAt)}</TableCell>
                    <TableCell>
                      {lead.deletedByUsername ?? (
                        <Typography component="span" variant="body2" color="text.disabled">
                          (desconocido)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Restaurar lead">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => lead.id && restoreMutation.mutate(lead.id)}
                            disabled={restoreMutation.isPending}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Filas por página"
        />
      </Paper>

      <Snackbar
        open={Boolean(snackMsg)}
        autoHideDuration={3500}
        onClose={() => setSnackMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackMsg ?? ''}
      />
    </Box>
  );
};

export default LeadsPapeleraPage;
