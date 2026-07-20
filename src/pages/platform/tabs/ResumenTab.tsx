import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import EmpresaAutocomplete from '../../../components/common/EmpresaAutocomplete';
import type { Empresa } from '../../../types/tenant.types';
import { platformApi, type PlatformResumenTabla } from '../../../api/services/platformApi';

interface Props {
  onError: (msg: string) => void;
}

const LABELS: Record<string, string> = {
  clientes: 'Clientes',
  documentos_comerciales: 'Documentos comerciales',
  equipos_fabricados: 'Equipos fabricados',
  productos: 'Productos',
  viajes: 'Viajes',
  garantias: 'Garantías',
  prestamos_personales: 'Préstamos personales',
  cheques: 'Cheques',
  usuarios_activos: 'Usuarios activos',
};

/**
 * Resumen por empresa: conteos de las tablas clave del tenant, para dimensionar
 * una empresa antes de tocarla (o antes de impersonar a alguien de ahí).
 */
export default function ResumenTab({ onError }: Props) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [resumen, setResumen] = useState<PlatformResumenTabla[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!empresa) { setResumen(null); return; }
    let cancel = false;
    setLoading(true);
    platformApi.getResumen(empresa.id)
      .then((r) => { if (!cancel) setResumen(r); })
      .catch((e: any) => {
        if (!cancel) onError(e?.response?.data?.message || e.message || 'Error cargando resumen');
      })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [empresa, onError]);

  return (
    <Box>
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <EmpresaAutocomplete value={empresa} onChange={setEmpresa}
            label="Empresa" sx={{ minWidth: 320 }} />
          <Typography variant="body2" color="text.secondary">
            Conteos en vivo de las tablas principales del tenant.
          </Typography>
        </Stack>
      </Paper>

      {loading && (
        <Grid container spacing={2}>
          {Array.from({ length: 9 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rounded" height={92} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && resumen && (
        <Grid container spacing={2}>
          {resumen.map((r) => (
            <Grid item xs={6} sm={4} md={3} key={r.tabla}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {r.count.toLocaleString('es-AR')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {LABELS[r.tabla] ?? r.tabla}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && !resumen && (
        <Typography color="text.secondary">Elegí una empresa para ver su resumen.</Typography>
      )}
    </Box>
  );
}
