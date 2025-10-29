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
import { ventaApi } from "../../api/services/ventaApi";
import { mockClientes, mockProductos } from "../../api/services/mockData";
import GarantiaFormDialog from "./GarantiaFormDialog";
import GarantiaDetailPage from "./GarantiaDetailPage";
import dayjs from "dayjs";

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

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<GarantiaList>([]);
  const [isLoading, setIsLoading] = useState(true); // Control de carga
  const [search, setSearch] = useState("");
  const [selectedGarantia, setSelectedGarantia] = useState<Garantia | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // --- FUNCIÓN ADAPTADORA CLAVE PARA EDICIÓN Y COMPATIBILIDAD ---
  // Convierte el DTO del backend (Warranty) a la estructura que espera el formulario (Garantia)
  const adaptGarantiaForForm = (g: any): Garantia => {
    const adapted: any = {
      id: g.id || "",
      clienteNombre: g.clienteNombre || "-",
      clienteApellido: g.clienteApellido || "",
      productoNombre: g.productoNombre || "-",
      fechaVenta: g.fechaVenta || g.fechaCompra || "",
      estado: g.estado || "VIGENTE",
      observaciones: g.observaciones || "",
      productId: g.productoId,
      saleId: g.ventaId,
      warrantyNumber: g.numeroSerie || "",
      startDate: g.fechaCompra,
      endDate: g.fechaVencimiento,
      status: g.estado,
      description: g.observaciones,
      claims: g.reclamos || [],
      createdAt: "",
      updatedAt: "",
    };
    return adapted as Garantia;
  };

  // --- 1. CARGA INICIAL DESDE EL BACKEND ---
  useEffect(() => {
    const fetchGarantias = async () => {
      setIsLoading(true);
      try {
        const data = await garantiaApiWithFallback.getAll();
        // Mapeamos los datos del backend usando el adaptador asíncrono
        const adaptedData = await Promise.all(data.map(adaptGarantiaForForm));
        setGarantias(adaptedData);
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

  const toBackendDto = (g: Garantia) => {
    const fechaCompra = g.fechaVenta || g.startDate || null;

    // Asegurar que fechaVencimiento sea SIEMPRE futura
    let fechaVencimiento: string;

    if (g.endDate) {
      // Si el usuario especificó una fecha de vencimiento
      const vencimiento = dayjs(g.endDate);
      if (vencimiento.isAfter(dayjs(), "day")) {
        // Si es futura, usarla
        fechaVencimiento = g.endDate;
      } else {
        // Si es pasada o hoy, usar mañana
        fechaVencimiento = dayjs().add(1, "day").format("YYYY-MM-DD");
      }
    } else if (fechaCompra) {
      // Calcular 1 año desde la compra
      const vencimientoCalculado = dayjs(fechaCompra).add(1, "year");

      // Verificar si esa fecha calculada es futura
      if (vencimientoCalculado.isAfter(dayjs(), "day")) {
        fechaVencimiento = vencimientoCalculado.format("YYYY-MM-DD");
      } else {
        // Si la compra fue hace más de 1 año, usar 1 año desde HOY
        fechaVencimiento = dayjs().add(1, "year").format("YYYY-MM-DD");
      }
    } else {
      // Si no hay ninguna fecha, usar 1 año desde hoy
      fechaVencimiento = dayjs().add(1, "year").format("YYYY-MM-DD");
    }

    const payload = {
      productoId: g.productId,
      ventaId: g.saleId,
      numeroSerie: g.warrantyNumber || undefined,
      fechaCompra: fechaCompra,
      fechaVencimiento: fechaVencimiento,
      estado: (g.estado || g.status || "VIGENTE").toUpperCase(),
      observaciones: g.observaciones || g.description || undefined,
    };

    // 🔍 DEBUG: Ver qué se está enviando
    console.log("🔍 toBackendDto - Datos originales:", {
      fechaVenta: g.fechaVenta,
      startDate: g.startDate,
      endDate: g.endDate,
      saleId: g.saleId,
    });
    console.log("📤 toBackendDto - Payload generado:", payload);
    console.log("📅 Fecha hoy:", dayjs().format("YYYY-MM-DD"));
    console.log("📅 Fecha vencimiento calculada:", fechaVencimiento);
    console.log(
      "✅ Es futura?",
      dayjs(fechaVencimiento).isAfter(dayjs(), "day")
    );

    return payload;
  };

  // --- 2. LÓGICA DE GUARDADO CON PERSISTENCIA ---
  const handleSave = async (garantia: Garantia) => {
    try {
      let savedGarantia;
      const isEditing = !!garantia.id;

      console.log("💾 handleSave - Garantia recibida:", garantia);

      const payload = toBackendDto(garantia);

      console.log("📦 handleSave - Payload final a enviar:", payload);

      if (isEditing) {
        const idToCall =
          typeof garantia.id === "string"
            ? parseInt(garantia.id, 10)
            : (garantia.id as number);
        savedGarantia = await garantiaApiWithFallback.update(idToCall, payload);
      } else {
        savedGarantia = await garantiaApiWithFallback.create(payload);
      }

      console.log("✅ Garantía guardada exitosamente:", savedGarantia);

      // Adaptar la garantía guardada de forma asíncrona
      const adaptedSavedGarantia = await adaptGarantiaForForm(savedGarantia);

      setGarantias((gs) =>
        isEditing
          ? gs.map((g) =>
              g.id === adaptedSavedGarantia.id ? adaptedSavedGarantia : g
            )
          : [adaptedSavedGarantia, ...gs]
      );
      setFormOpen(false);
    } catch (error) {
      console.error("❌ Error al guardar garantía:", error);
      console.error("❌ Detalles del error:", {
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data,
        message: (error as any)?.message,
      });

      // Mostrar mensaje más detallado si el backend envía validaciones
      const serverMsg =
        (error as any)?.response?.data ||
        (error as any)?.message ||
        "Error desconocido";
      alert(
        `Hubo un error al guardar la garantía: ${JSON.stringify(serverMsg)}`
      );
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
                  <TableCell>
                    {" "}
                    {`${g.clienteNombre || ""} ${
                      g.clienteApellido || ""
                    }`.trim() || "-"}
                  </TableCell>
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
                      onClick={async () => {
                        // CLAVE: Usamos el adaptador async al abrir la edición
                        const adapted = await adaptGarantiaForForm(g);
                        setSelectedGarantia(adapted);
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
