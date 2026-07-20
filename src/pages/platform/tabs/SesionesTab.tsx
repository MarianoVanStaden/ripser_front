import { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Divider, Paper, Stack, TextField, Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import usuarioAdminApi, { type UsuarioDTO } from '../../../api/services/usuarioAdminApi';
import { platformApi } from '../../../api/services/platformApi';
import { startImpersonation } from '../../../utils/impersonation';

interface Props {
  onError: (msg: string) => void;
  onOk: (msg: string) => void;
}

const labelUsuario = (u: UsuarioDTO) =>
  `${u.username}${u.nombre ? ` — ${u.nombre}${u.apellido ? ' ' + u.apellido : ''}` : ''} (#${u.id})`;

/**
 * Herramientas de sesión del owner: force-logout global / por usuario e
 * impersonación con token corto (15 min, banner rojo, auditada en el backend).
 */
export default function SesionesTab({ onError, onOk }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioDTO[]>([]);
  const [busy, setBusy] = useState(false);

  const [logoutTarget, setLogoutTarget] = useState<UsuarioDTO | null>(null);
  const [confirmGlobal, setConfirmGlobal] = useState(false);
  const [confirmUsuario, setConfirmUsuario] = useState(false);

  const [impersonateTarget, setImpersonateTarget] = useState<UsuarioDTO | null>(null);
  const [confirmImpersonate, setConfirmImpersonate] = useState(false);

  useEffect(() => {
    usuarioAdminApi.getAll(0, 500)
      .then((page) => setUsuarios(page.content.filter((u) => u.enabled)))
      .catch(() => { /* los pickers quedan vacíos; se informa al intentar usar */ });
  }, []);

  const run = async (fn: () => Promise<void>, done?: () => void) => {
    setBusy(true);
    try {
      await fn();
      done?.();
    } catch (e: any) {
      onError(e?.response?.data?.message || e?.response?.data?.error || e.message || 'Error');
    } finally {
      setBusy(false);
    }
  };

  const forceLogoutGlobal = () => run(async () => {
    const res = await platformApi.forceLogout();
    onOk(`Sesiones cerradas (${res.alcance}) — op #${res.opLogId}. Todos los usuarios deberán re-loguearse.`);
  }, () => setConfirmGlobal(false));

  const forceLogoutUsuario = () => run(async () => {
    if (!logoutTarget) return;
    const res = await platformApi.forceLogout(logoutTarget.id);
    onOk(`Sesión de ${logoutTarget.username} cerrada — op #${res.opLogId}`);
    setLogoutTarget(null);
  }, () => setConfirmUsuario(false));

  const impersonate = () => run(async () => {
    if (!impersonateTarget) return;
    const res = await platformApi.impersonate(impersonateTarget.id);
    // Redirige y recarga la app entera como el usuario objetivo.
    startImpersonation(res);
  });

  return (
    <Box>
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Cerrar sesiones</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Invalida los tokens emitidos hasta ahora. Útil después de un incidente de seguridad
          o al rotar credenciales.
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Button variant="outlined" color="error" startIcon={<LogoutIcon />}
            disabled={busy} onClick={() => setConfirmGlobal(true)}>
            Cerrar TODAS las sesiones
          </Button>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Autocomplete
            options={usuarios}
            value={logoutTarget}
            onChange={(_, v) => setLogoutTarget(v)}
            getOptionLabel={labelUsuario}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            sx={{ minWidth: 320, flex: 1 }}
            renderInput={(p) => <TextField {...p} label="Usuario puntual" size="small" />}
          />
          <Button variant="outlined" color="warning" disabled={busy || !logoutTarget}
            onClick={() => setConfirmUsuario(true)}>
            Cerrar su sesión
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Impersonar usuario</Typography>
        <Alert severity="warning" sx={{ my: 1.5 }}>
          Vas a operar la aplicación <b>como ese usuario</b>, con sus permisos y su empresa,
          durante <b>15 minutos</b> (sin renovación). Queda auditado en el historial de operaciones
          y verás un banner rojo permanente hasta salir.
        </Alert>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Autocomplete
            options={usuarios}
            value={impersonateTarget}
            onChange={(_, v) => setImpersonateTarget(v)}
            getOptionLabel={labelUsuario}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            sx={{ minWidth: 360, flex: 1 }}
            renderInput={(p) => <TextField {...p} label="Usuario a impersonar" />}
          />
          <Button variant="contained" color="error" startIcon={<PersonSearchIcon />}
            disabled={busy || !impersonateTarget} onClick={() => setConfirmImpersonate(true)}>
            Impersonar
          </Button>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={confirmGlobal}
        onClose={() => setConfirmGlobal(false)}
        onConfirm={forceLogoutGlobal}
        title="Cerrar TODAS las sesiones"
        severity="error"
        loading={busy}
        confirmLabel="Cerrar todas"
        warning="Todos los usuarios del sistema (incluido vos) van a tener que volver a loguearse."
        description="Se invalida cualquier token emitido hasta este momento. La operación queda registrada y no es reversible."
      />
      <ConfirmDialog
        open={confirmUsuario}
        onClose={() => setConfirmUsuario(false)}
        onConfirm={forceLogoutUsuario}
        title="Cerrar la sesión del usuario"
        severity="warning"
        loading={busy}
        confirmLabel="Cerrar sesión"
        description={logoutTarget ? `Se invalidan los tokens de ${labelUsuario(logoutTarget)}. Tendrá que volver a loguearse.` : ''}
      />
      <ConfirmDialog
        open={confirmImpersonate}
        onClose={() => setConfirmImpersonate(false)}
        onConfirm={impersonate}
        title="Impersonar usuario"
        severity="error"
        loading={busy}
        confirmLabel="Impersonar"
        warning="Acción sensible: queda auditada con tu usuario como responsable."
        description={impersonateTarget
          ? `Vas a entrar como ${labelUsuario(impersonateTarget)} durante 15 minutos. Tu sesión de owner se restaura al salir o al expirar.`
          : ''}
      />
    </Box>
  );
}
