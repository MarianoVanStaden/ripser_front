import React, { useState } from "react";
import { Box, Paper, TextField, Typography, Button, Alert } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(usernameOrEmail.trim(), password.trim());
      navigate("/dashboard");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.usernameOrEmail ||
        error.response?.data?.password ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Credenciales inválidas";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        // 🔒 Ocupa TODA la pantalla por encima del layout padre
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 4, md: 0 },
        overflow: "hidden",
        zIndex: 0,
        background:
          "linear-gradient(135deg, rgba(25,118,210,0.08), rgba(123,31,162,0.08))",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 700px at 70% 20%, rgba(25,118,210,0.22), transparent 60%), radial-gradient(800px 600px at 30% 80%, rgba(123,31,162,0.22), transparent 60%)",
          pointerEvents: "none",
        },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: { xs: 2, sm: 3 },
          backdropFilter: "blur(6px)",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Iniciar sesión
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ingresa tus credenciales para continuar
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Usuario o Correo"
            fullWidth
            margin="normal"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
            autoFocus
            autoComplete="username"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={submitting || !usernameOrEmail || !password}
            sx={{
              mt: 3,
              py: 1.2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              background: "linear-gradient(135deg, #1976D2, #7B1FA2)",
            }}
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;

