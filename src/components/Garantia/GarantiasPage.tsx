import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Dialog,
  Stack,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
// Usaremos la API real con fallback
import { garantiaApiWithFallback } from "../../api/services/apiWithFallback";
import type { Garantia, Warranty, WarrantyClaim } from "../../types"; // Importamos Garantia y Warranty/Claim para referencia
// Mantenemos los mocks solo para los Helpers, aunque idealmente deberías cargarlos de la API
import { mockClientes, mockProductos } from "../../api/services/mockData";
import GarantiaFormDialog from "./GarantiaFormDialog";
import GarantiaDetailPage from "./GarantiaDetailPage";

// Declaración de tipado más precisa para la lista de garantías (usando 'Garantia' redefinida)
type GarantiaList = Garantia[];

// Helper to get client/product name from id (Ajustar si usas la API para esto)
const getClientName = (clientId: number) => {
  const c = mockClientes.find((c) => c.id === clientId);
  return c
    ? c.nombre + (c.razonSocial ? " " + c.razonSocial : "")
    : `Cliente #${clientId}`;
};
const getProductName = (productId: number) => {
  const p = mockProductos.find((p) => p.id === productId);
  return p ? p.name : `Producto #${productId}`;
};

// Helper to format date
const formatDate = (date: string) => {
  if (!date) return "-";
  const d = new Date(date);
  return !isNaN(d.getTime()) ? d.toLocaleDateString() : date;
};

// Improved status color mapping for legacy and DTO data
const getStatusColor = (g: any) => {
  // Busca 'status' (inglés) o 'estado' (español)
  const status = (g.status || g.estado || "").toLowerCase();
  if (["active", "vigente", "abierta"].includes(status)) return "success";
  if (["expired", "vencida", "cerrado", "anulada"].includes(status))
    return "error";
  return "warning";
};

// --- FUNCIÓN ADAPTADORA CLAVE PARA EDICIÓN Y COMPATIBILIDAD ---
// Convierte el DTO del backend (Warranty) a la estructura que espera el formulario (Garantia)
const adaptGarantiaForForm = (g: any): Garantia => {
  // Esto es crucial para que los datos del backend (g.status) se carguen en el campo del formulario (g.estado)
  // y para que los helpers de nombre (si todavía los usas) funcionen.
  return {
    // Campos de la nueva interfaz Garantia (Español/Flexible ID)
    id: g.id || "",
    clienteNombre: g.clienteNombre || getClientName(g.clientId) || "",
    productoNombre: g.productoNombre || getProductName(g.productId) || "",
    fechaVenta: g.fechaVenta || g.startDate || "",
    estado: g.estado || g.status || "VIGENTE",
    observaciones: g.observaciones || g.description || "",

    // Campos originales del DTO Warranty (Inglés) que también incluimos
    clientId: g.clientId,
    productId: g.productId,
    warrantyNumber: g.warrantyNumber || "",
    startDate: g.startDate || g.fechaVenta || "",
    endDate: g.endDate || "",
    status: g.status || g.estado || "VIGENTE",
    type: g.type || "MANUFACTURER",
    description: g.description || "",
    claims: g.claims || [],
    createdAt: g.createdAt || "",
    updatedAt: g.updatedAt || "",
    tipoIva: g.tipoIva,
    saleId: g.saleId,
  };
};

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<GarantiaList>([]);
  const [isLoading, setIsLoading] = useState(true); // Control de carga
  const [search, setSearch] = useState("");
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // --- 1. CARGA INICIAL DESDE EL BACKEND ---
  useEffect(() => {
    const fetchGarantias = async () => {
      setIsLoading(true);
      try {
        const data = await garantiaApiWithFallback.getAll();
        // Mapeamos los datos del backend usando el adaptador para asegurar
        // que la lista inicial tenga los campos clienteNombre/productoNombre.
        // Si tu backend ya devuelve esos campos, puedes usar solo setGarantias(data).
        setGarantias(data.map(adaptGarantiaForForm));
      } catch (error) {
        console.error("Error al cargar garantías:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGarantias();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }; // Ajuste del filtro para usar los campos en español/adaptados

  const filteredGarantias = useMemo(() => {
    const lowerCaseSearch = search.toLowerCase();
    return garantias.filter((g) => {
      const cliente = (g.clienteNombre || "").toLowerCase();
      const producto = (g.productoNombre || "").toLowerCase();
      const estado = (g.estado || g.status || "").toLowerCase();
      return (
        cliente.includes(lowerCaseSearch) ||
        producto.includes(lowerCaseSearch) ||
        estado.includes(lowerCaseSearch)
      );
    });
  }, [garantias, search]);

  // --- 2. LÓGICA DE GUARDADO CON PERSISTENCIA ---
  const handleSave = async (garantia: Garantia) => {
    try {
      let savedGarantia;
      const isEditing = !!garantia.id;

      // CONVERSIÓN CRUCIAL: Asegura que el ID se envíe como 'number' para el PUT de Java
      const idToCall =
        isEditing && typeof garantia.id === "string"
          ? parseInt(garantia.id, 10)
          : (garantia.id as number);

      if (isEditing) {
        // LLAMADA PUT: Actualización genérica
        savedGarantia = await garantiaApiWithFallback.update(
          idToCall,
          garantia
        );
      } else {
        // LLAMADA POST: Creación
        savedGarantia = await garantiaApiWithFallback.create(garantia);
      }

      // Adaptamos la respuesta del backend para que tenga los campos del formulario
      const adaptedSavedGarantia = adaptGarantiaForForm(savedGarantia);

      // Actualizar el estado local (usando el ID real de la BD)
      setGarantias(
        (gs) =>
          isEditing
            ? gs.map((g) =>
                g.id === adaptedSavedGarantia.id ? adaptedSavedGarantia : g
              )
            : [adaptedSavedGarantia, ...gs] // Añade el nuevo al principio
      );
      setFormOpen(false);
    } catch (error) {
      console.error("Error al guardar garantía:", error);
      alert("Hubo un error al guardar la garantía. Revisa la consola.");
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Gestión de Garantías
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Buscar por cliente, producto o estado"
              value={search}
              onChange={handleSearch}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedGarantia(null);
                setFormOpen(true);
              }}
            >
              Nueva Garantía
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Fecha Venta</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Cargando garantías...
                </TableCell>
              </TableRow>
            ) : filteredGarantias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No se encontraron garantías.
                </TableCell>
              </TableRow>
            ) : (
              filteredGarantias.map((g) => (
                <TableRow key={g.id} hover>
                  <TableCell>{g.clienteNombre || "-"}</TableCell>
                  <TableCell>{g.productoNombre || "-"}</TableCell>
                  <TableCell>{formatDate(g.fechaVenta)}</TableCell>
                  <TableCell>
                    <Chip
                      label={g.estado || g.status}
                      color={getStatusColor(g)}
                      sx={{ minWidth: 90, fontWeight: 600, fontSize: 15 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedGarantia(g);
                        setDetailOpen(true);
                      }}
                    >
                      Ver Detalle
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        // CLAVE: Usamos el adaptador al abrir la edición
                        setSelectedGarantia(adaptGarantiaForForm(g));
                        setFormOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <GarantiaFormDialog
        open={formOpen}
        garantia={selectedGarantia}
        onClose={() => setFormOpen(false)}
        onSave={handleSave} // Usamos la nueva función asíncrona handleSave
      />
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {/* Usamos el adaptador si el detallePage no soporta los nombres en inglés */}
        {selectedGarantia && (
          <GarantiaDetailPage
            garantia={selectedGarantia as any} // Ya fue adaptado al hacer clic en 'Ver Detalle'
            onBack={() => setDetailOpen(false)}
          />
        )}
      </Dialog>
    </Box>
  );
};

export default GarantiasPage;
