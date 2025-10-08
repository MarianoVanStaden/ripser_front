import { Container, Box } from '@mui/material';
import type { ReactNode } from 'react';


interface MainContentProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: MainContentProps) {
  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{
        // Elimina el margin-left si el sidebar es fixed
        px: { xs: 1, sm: 2, md: 4 },
        py: { xs: 2, md: 4 },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1100,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
          p: { xs: 2, md: 4 },
          mx: 'auto',
        }}
      >
        {children}
      </Box>
    </Container>
  );
}