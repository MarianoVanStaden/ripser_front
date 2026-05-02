import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { captureException } from '../sentry';

interface State {
  error: Error | null;
}

export class SentryErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    captureException(error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: 2,
          p: 4,
        }}
      >
        <Typography variant="h5">Algo salió mal</Typography>
        <Typography color="text.secondary">
          El error fue reportado automáticamente. Podés reintentar.
        </Typography>
        <Button variant="contained" onClick={this.reset}>
          Reintentar
        </Button>
      </Box>
    );
  }
}

export default SentryErrorBoundary;
