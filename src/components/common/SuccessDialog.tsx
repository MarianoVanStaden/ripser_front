import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

export interface SuccessDialogAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

export interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  details?: Array<{ label: string; value: string | number }>;
  actions?: SuccessDialogAction[];
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  open,
  onClose,
  title,
  message,
  details,
  actions = [],
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'visible',
        },
      }}
    >
      <DialogContent sx={{ pt: 4, pb: 3 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
        >
          {/* Success Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.success.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              animation: 'scaleIn 0.3s ease-out',
              '@keyframes scaleIn': {
                '0%': {
                  transform: 'scale(0)',
                  opacity: 0,
                },
                '50%': {
                  transform: 'scale(1.1)',
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 50,
                color: 'success.main',
              }}
            />
          </Box>

          {/* Title */}
          <Typography variant="h5" fontWeight="600" gutterBottom>
            {title}
          </Typography>

          {/* Message */}
          {message && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
          )}

          {/* Details */}
          {details && details.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                width: '100%',
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                borderColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              {details.map((detail, index) => (
                <React.Fragment key={index}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    py={0.75}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {detail.label}:
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                      {detail.value}
                    </Typography>
                  </Box>
                  {index < details.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Paper>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Box
          display="flex"
          gap={1}
          width="100%"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
        >
          <Button onClick={onClose} color="inherit">
            Cerrar
          </Button>
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              variant={action.variant || 'contained'}
              color={action.color || 'primary'}
              startIcon={action.icon}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default SuccessDialog;
