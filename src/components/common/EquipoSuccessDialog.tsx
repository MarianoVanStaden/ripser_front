import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Build as BuildIcon,
} from '@mui/icons-material';

export interface EquipoCreado {
  numeroHeladera: string;
  tipo?: string;
  modelo?: string;
}

export interface EquipoSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  equiposCreados: EquipoCreado[];
  onNuevoEquipo?: () => void;
  onVerEquipos?: () => void;
}

const EquipoSuccessDialog: React.FC<EquipoSuccessDialogProps> = ({
  open,
  onClose,
  equiposCreados,
  onNuevoEquipo,
  onVerEquipos,
}) => {
  const cantidad = equiposCreados.length;
  const primerEquipo = equiposCreados[0];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <CheckIcon
            sx={{
              fontSize: 48,
              color: 'success.main',
              animation: 'scaleIn 0.5s ease-out',
              '@keyframes scaleIn': {
                '0%': { transform: 'scale(0)', opacity: 0 },
                '50%': { transform: 'scale(1.2)' },
                '100%': { transform: 'scale(1)', opacity: 1 },
              }
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight="600" color="success.main">
              {cantidad === 1 ? '¡Equipo Creado!' : `¡${cantidad} Equipos Creados!`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cantidad === 1
                ? 'El equipo ha sido fabricado exitosamente'
                : 'Los equipos han sido fabricados exitosamente'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {primerEquipo && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              bgcolor: 'success.lighter',
              borderColor: 'success.main',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BuildIcon sx={{ color: 'success.dark' }} />
              <Typography variant="subtitle2" fontWeight="600" color="success.dark">
                Información del Equipo
              </Typography>
            </Box>
            <Box display="flex" flexDirection="column" gap={0.5}>
              {primerEquipo.tipo && (
                <Typography variant="body2">
                  <strong>Tipo:</strong> {primerEquipo.tipo}
                </Typography>
              )}
              {primerEquipo.modelo && (
                <Typography variant="body2">
                  <strong>Modelo:</strong> {primerEquipo.modelo}
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        <Box mb={1}>
          <Typography variant="subtitle2" fontWeight="600" color="text.primary" gutterBottom>
            {cantidad === 1 ? 'Número Asignado:' : 'Números Asignados:'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {cantidad === 1
              ? 'El equipo fue registrado con el siguiente número único'
              : 'Cada equipo fue registrado con un número único'}
          </Typography>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            maxHeight: cantidad > 5 ? 300 : 'auto',
            overflow: 'auto',
            bgcolor: 'background.default',
          }}
        >
          <List dense>
            {equiposCreados.map((equipo, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      color="primary"
                      sx={{ minWidth: 45 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="600" color="primary">
                        {equipo.numeroHeladera}
                      </Typography>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {cantidad > 1 && (
          <Box mt={2} display="flex" justifyContent="center">
            <Chip
              label={`Total: ${cantidad} ${cantidad === 1 ? 'equipo' : 'equipos'}`}
              color="success"
              icon={<CheckIcon />}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {onNuevoEquipo && (
          <Button
            onClick={() => {
              onClose();
              onNuevoEquipo();
            }}
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ flex: 1 }}
          >
            Crear Otro
          </Button>
        )}
        {onVerEquipos && (
          <Button
            onClick={() => {
              onClose();
              onVerEquipos();
            }}
            variant="contained"
            startIcon={<ViewIcon />}
            sx={{ flex: 1 }}
          >
            Ver Equipos
          </Button>
        )}
        {!onNuevoEquipo && !onVerEquipos && (
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
            fullWidth
          >
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EquipoSuccessDialog;
