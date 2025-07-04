import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { testConnection } from '../../api/testConnection';

interface BackendSetupDialogProps {
  open: boolean;
  onClose: () => void;
}

const BackendSetupDialog: React.FC<BackendSetupDialogProps> = ({ open, onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  const checkConnection = async () => {
    setTesting(true);
    try {
      const status = await testConnection();
      setConnectionStatus(status);
    } catch (err) {
      setConnectionStatus({
        connected: false,
        message: 'Failed to connect to backend'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Backend Setup Guide
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {testing ? (
              <>
                <CircularProgress size={20} />
                <Typography>Testing connection...</Typography>
              </>
            ) : connectionStatus ? (
              <>
                <Chip
                  icon={connectionStatus.connected ? <CheckCircleIcon /> : <ErrorIcon />}
                  label={connectionStatus.connected ? 'Connected' : 'Disconnected'}
                  color={connectionStatus.connected ? 'success' : 'error'}
                />
                <Typography variant="body2">{connectionStatus.message}</Typography>
              </>
            ) : null}
            <Button size="small" onClick={checkConnection} disabled={testing}>
              Test Again
            </Button>
          </Box>
        </Box>

        {connectionStatus && !connectionStatus.connected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Your Spring Boot backend needs to be running for the frontend to work properly.
            </Typography>
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Setup Instructions
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="1. Start your Spring Boot backend"
              secondary="Navigate to your ripser_backend directory and run: mvn spring-boot:run or ./mvnw spring-boot:run"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="2. Ensure it's running on port 8080"
              secondary="The backend should be accessible at http://localhost:8080"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="3. Check CORS configuration"
              secondary="Make sure your backend allows requests from http://localhost:5173 (frontend port)"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="4. Verify API endpoints"
              secondary="Ensure your controllers expose endpoints at /api/clients, /api/products, etc."
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Expected API Base URL:
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            http://localhost:8080/api
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          onClick={checkConnection}
          disabled={testing}
        >
          Test Connection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackendSetupDialog;
