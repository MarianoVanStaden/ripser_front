import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Instagram,
  Language,
  Phone,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

// Colores corporativos de Ripser (del pdfService)
const RIPSER_COLORS = {
  darkBlue: "#144272",
  lightBlue: "#CDE2EF",
  white: "#FFFFFF",
  darkGray: "#404040",
};

const LoginPage: React.FC = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        overflow: "hidden",
      }}
    >
      {/* Panel izquierdo con branding */}
      <Box
        sx={{
          flex: 1,
          background: `linear-gradient(135deg, ${RIPSER_COLORS.darkBlue} 0%, #0d2d4d 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
          position: "relative",
          overflow: "hidden",
          minHeight: isMobile ? "200px" : "100vh",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(205, 226, 239, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(205, 226, 239, 0.08) 0%, transparent 40%)
            `,
            pointerEvents: "none",
          },
        }}
      >
        {/* Logo Ripser */}
        <Box sx={{ textAlign: "center", zIndex: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Times New Roman", Times, serif',
              fontStyle: "italic",
              fontSize: { xs: "3rem", md: "4.5rem" },
              fontWeight: 400,
              color: RIPSER_COLORS.white,
              letterSpacing: "0.02em",
              textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              mb: 0.5,
            }}
          >
            Ripser
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: { xs: "0.7rem", md: "0.85rem" },
              fontWeight: 400,
              color: RIPSER_COLORS.lightBlue,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            Instalaciones Comerciales
          </Typography>
        </Box>

        {/* Línea decorativa */}
        <Box
          sx={{
            width: "60px",
            height: "3px",
            background: RIPSER_COLORS.lightBlue,
            borderRadius: "2px",
            my: 4,
            opacity: 0.7,
          }}
        />

        {/* Información de contacto - Solo en desktop */}
        {!isMobile && (
          <Box
            sx={{
              mt: 4,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Instagram sx={{ color: RIPSER_COLORS.lightBlue, fontSize: 18 }} />
              <Typography
                sx={{
                  color: RIPSER_COLORS.lightBlue,
                  fontSize: "0.85rem",
                  opacity: 0.9,
                }}
              >
                @RipserInstalacionesComerciales
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Language sx={{ color: RIPSER_COLORS.lightBlue, fontSize: 18 }} />
              <Typography
                sx={{
                  color: RIPSER_COLORS.lightBlue,
                  fontSize: "0.85rem",
                  opacity: 0.9,
                }}
              >
                www.ripser.com.ar
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Phone sx={{ color: RIPSER_COLORS.lightBlue, fontSize: 18 }} />
              <Typography
                sx={{
                  color: RIPSER_COLORS.lightBlue,
                  fontSize: "0.85rem",
                  opacity: 0.9,
                }}
              >
                +54 223 533 2796
              </Typography>
            </Box>
          </Box>
        )}

        {/* Decoración geométrica */}
        <Box
          sx={{
            position: "absolute",
            bottom: -50,
            right: -50,
            width: 200,
            height: 200,
            border: `2px solid ${RIPSER_COLORS.lightBlue}`,
            borderRadius: "50%",
            opacity: 0.1,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: -30,
            left: -30,
            width: 150,
            height: 150,
            border: `2px solid ${RIPSER_COLORS.lightBlue}`,
            borderRadius: "50%",
            opacity: 0.1,
          }}
        />
      </Box>

      {/* Panel derecho con formulario */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, sm: 4, md: 6 },
          background: "#fafbfc",
          minHeight: isMobile ? "auto" : "100vh",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 400,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: RIPSER_COLORS.white,
            boxShadow: "0 4px 24px rgba(20, 66, 114, 0.08)",
            border: "1px solid rgba(20, 66, 114, 0.06)",
          }}
        >
          {/* Header del formulario */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            {/* Logo pequeño para mobile */}
            {isMobile && (
              <Typography
                sx={{
                  fontFamily: '"Times New Roman", Times, serif',
                  fontStyle: "italic",
                  fontSize: "1.8rem",
                  color: RIPSER_COLORS.darkBlue,
                  mb: 0.5,
                }}
              >
                Ripser
              </Typography>
            )}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: RIPSER_COLORS.darkBlue,
                mb: 1,
              }}
            >
              Bienvenido
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: RIPSER_COLORS.darkGray,
                opacity: 0.7,
              }}
            >
              Ingresa tus credenciales para continuar
            </Typography>
          </Box>

          {/* Alert de error */}
          {error && (
            <Alert
              severity="error"
              data-testid="login-error-alert"
              sx={{
                mb: 3,
                borderRadius: 2,
                "& .MuiAlert-icon": {
                  alignItems: "center",
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Usuario o Correo"
              fullWidth
              margin="normal"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              autoComplete="username"
              inputProps={{ 'data-testid': 'login-username-input' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: RIPSER_COLORS.darkBlue, opacity: 0.5 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": {
                    borderColor: RIPSER_COLORS.darkBlue,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: RIPSER_COLORS.darkBlue,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: RIPSER_COLORS.darkBlue,
                },
              }}
            />

            <TextField
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              inputProps={{ 'data-testid': 'login-password-input' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: RIPSER_COLORS.darkBlue, opacity: 0.5 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      data-testid="login-toggle-password"
                      sx={{ color: RIPSER_COLORS.darkBlue, opacity: 0.5 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&:hover fieldset": {
                    borderColor: RIPSER_COLORS.darkBlue,
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: RIPSER_COLORS.darkBlue,
                  },
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: RIPSER_COLORS.darkBlue,
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              data-testid="login-submit-button"
              disabled={submitting || !usernameOrEmail || !password}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "1rem",
                background: RIPSER_COLORS.darkBlue,
                boxShadow: "0 4px 12px rgba(20, 66, 114, 0.3)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  background: "#0d2d4d",
                  boxShadow: "0 6px 16px rgba(20, 66, 114, 0.4)",
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  background: "rgba(20, 66, 114, 0.4)",
                },
              }}
            >
              {submitting ? "Ingresando..." : "Ingresar"}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Divider sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: RIPSER_COLORS.darkGray, opacity: 0.5, px: 1 }}
              >
                Sistema de Gestión
              </Typography>
            </Divider>
            <Typography
              variant="caption"
              sx={{
                color: RIPSER_COLORS.darkGray,
                opacity: 0.5,
                display: "block",
              }}
            >
              © {new Date().getFullYear()} Ripser Instalaciones Comerciales
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default LoginPage;
