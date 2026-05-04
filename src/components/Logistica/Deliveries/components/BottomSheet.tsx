// FRONT-003: extracted from DeliveriesPage.tsx — bottom sheet mobile-only
// con grip handle, header sticky y actions footer sticky.  Devuelve null
// fuera de mobile para que el padre pueda condicionar el render.
import React from 'react';
import { Box, IconButton, SwipeableDrawer, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useResponsive } from '../useResponsive';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  onOpen,
  title,
  children,
  actions,
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={onOpen || (() => {})}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: '95vh',
          minHeight: '50vh',
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 4,
          bgcolor: 'grey.300',
          borderRadius: 2,
          mx: 'auto',
          mt: 1.5,
          mb: 1,
        }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>{children}</Box>

      {actions && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            bottom: 0,
          }}
        >
          {actions}
        </Box>
      )}
    </SwipeableDrawer>
  );
};

export default BottomSheet;
