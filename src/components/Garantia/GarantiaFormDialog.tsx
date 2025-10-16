import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Autocomplete,
} from "@mui/material";
import type {
  Garantia,
  WarrantyStatus,
  Cliente,
  ProductoListDTO,
} from "../../types";
import { debounce } from "lodash";
import { clienteApi } from "../../api/services/clienteApi";
import { productApi } from "../../api/services/productApi";

interface GarantiaFormDialogProps {
  open: boolean;
  garantia: Garantia | null;
  onClose: () => void;
  onSave: (garantia: Garantia) => Promise<void>;
}

const estados = [
  { value: "VIGENTE", label: "Vigente" },
  { value: "VENCIDA", label: "Vencida" },
  { value: "EN_PROCESO", label: "En Proceso" },
];

// Valores por defecto/iniciales para una Garantía nueva
const initialFormState: Garantia = {
  // Campos del formulario
  id: "",
  clienteNombre: "",
  productoNombre: "",
  fechaVenta: "",
  estado: "VIGENTE",
  observaciones: "",

  // Claves foráneas (saleId eliminado)
  clientId: undefined,
  productId: undefined,

  // Otros campos del DTO
  warrantyNumber: "",
  startDate: "",
  endDate: "",
  status: "VIGENTE" as WarrantyStatus,
  type: "MANUFACTURER",
  description: "",
  claims: [],
  createdAt: "",
  updatedAt: "",
  tipoIva: undefined,
};

const GarantiaFormDialog: React.FC<GarantiaFormDialogProps> = ({
  open,
  garantia,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Garantia>(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [clienteOptions, setClienteOptions] = useState<Cliente[]>([]);
  const [productoOptions, setProductoOptions] = useState<ProductoListDTO[]>([]);
  const [clienteInput, setClienteInput] = useState("");
  const [productoInput, setProductoInput] = useState("");

  const debouncedClienteSearch = useCallback(
    debounce(async (searchTerm: string) => {
      // Solo busca si hay más de 2 caracteres o si el campo está limpio
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = await clienteApi.search(searchTerm);
          setClienteOptions(prevOptions => data || []); // Asegura que sea un array
        } catch (error) {
          console.error("Error buscando clientes:", error);
          setClienteOptions([]);
        }
      }
    }, 500),
    []
  );

  const debouncedProductoSearch = useCallback(
    debounce(async (searchTerm: string) => {
      // Solo busca si hay más de 2 caracteres o si el campo está limpio
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = (await productApi.search(
            searchTerm
          )) as ProductoListDTO[];
          // USAR FORMA FUNCIONAL para garantizar la estabilidad del estado
          setProductoOptions(prevOptions => data || []);
        } catch (error) {
          console.error("Error buscando productos:", error);
          setProductoOptions([]);
        }
      }
    }, 500),
    []
  );

  // Disparadores de búsqueda
  useEffect(() => {
    debouncedClienteSearch(clienteInput);
  }, [clienteInput, debouncedClienteSearch]);

  useEffect(() => {
    debouncedProductoSearch(productoInput);
  }, [productoInput, debouncedProductoSearch]);

  // Manejo de Edición/Carga Inicial
  useEffect(() => {
    
    if (garantia) {
      // Si estamos editando, precargar las opciones con los datos del registro actual
      if (garantia.clientId && !clienteOptions.some(c => c.id === garantia.clientId)) {
        clienteApi.getById(garantia.clientId)
          .then(clienteData => setClienteOptions(prev => [...prev.filter(c => c.id !== clienteData.id), clienteData]))
          .catch(e => console.error("No se pudo cargar el cliente para edición", e));
      }
      if (garantia.productId && !productoOptions.some(p => p.id === garantia.productId)) {
        productApi.getById(garantia.productId)
          .then(productoData => {
            // Normalizar el producto a ProductoListDTO (asegurar stockActual presente)
            const normalized = {
              ...productoData,
              stockActual: (productoData as any).stockActual ?? (productoData as any).stock ?? 0,
            } as ProductoListDTO;
            setProductoOptions(prev => [...prev.filter(p => p.id !== normalized.id), normalized]);
          })
          .catch(e => console.error("No se pudo cargar el producto para edición", e));
      }
      
      setForm({
        ...garantia,
        id: garantia.id || "",
        clienteNombre: garantia.clienteNombre || "",
        productoNombre: garantia.productoNombre || "",
        fechaVenta: garantia.fechaVenta || "",
        observaciones: garantia.observaciones || "",
        estado: garantia.estado?.toUpperCase() || "VIGENTE",
        clientId: garantia.clientId || undefined,
        productId: garantia.productId || undefined,
        warrantyNumber: garantia.warrantyNumber || "",
        startDate: garantia.startDate || "",
        endDate: garantia.endDate || "",
        status: (garantia.status?.toUpperCase() as WarrantyStatus) || "VIGENTE",
        type: garantia.type || "MANUFACTURER",
        description: garantia.description || "",
        claims: garantia.claims || [],
        createdAt: garantia.createdAt || "",
        updatedAt: garantia.updatedAt || "",
      });
      setClienteInput(garantia.clienteNombre || "");
      setProductoInput(garantia.productoNombre || "");
    } else {
      setForm(initialFormState);
      setClienteInput("");
      setProductoInput("");
    }
  }, [garantia]); // open eliminado de las dependencias para evitar doble ejecución

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newForm = { ...form, [name]: value };

    // Mapeo DTO
    if (name === "fechaVenta") {
      newForm = { ...newForm, startDate: value };
    }
    if (name === "estado") {
      newForm = { ...newForm, status: value.toUpperCase() as any };
    }
    if (name === "observaciones") {
      newForm = { ...newForm, description: value };
    }

    setForm(newForm);
  };

  const handleSave = async () => {
    // Validación sin saleId
    if (!form.clientId || !form.productId || !form.fechaVenta) {
      alert(
        "Faltan datos obligatorios: Cliente, Producto y Fecha de Venta."
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave(form);
    } catch (e) {
      // Manejo de error
    } finally {
      setIsSaving(false);
    }
  };

  // FUNCIONES DE BÚSQUEDA DEFENSIVAS (CORRECCIÓN CLAVE CONTRA EL ERROR UNDEFINED)
  const findClienteById = (id: number | undefined) => {
    // Si no hay ID o si las opciones no se han cargado (están vacías), devuelve null
    if (!id || clienteOptions.length === 0) return null;
    return clienteOptions.find(c => c.id === id) || null;
  };

  const findProductoById = (id: number | undefined) => {
    // Si no hay ID o si las opciones no se han cargado (están vacías), devuelve null
    if (!id || productoOptions.length === 0) return null;
    return productoOptions.find(p => p.id === id) || null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {form.id ? "Editar Garantía" : "Nueva Garantía"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          
          {/* Autocomplete Cliente */}
          <Autocomplete
            options={clienteOptions}
            getOptionLabel={(cliente) =>
              `${cliente.nombre} ${cliente.apellido || ""} - ${
                cliente.cuit || ""
              }`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={clienteInput}
            onInputChange={(event, newInputValue) => {
              setClienteInput(newInputValue);
            }}
            onChange={(event, selectedCliente) => {
              setForm((prevForm) => ({
                ...prevForm,
                clientId: selectedCliente ? selectedCliente.id : undefined,
                clienteNombre: selectedCliente
                  ? `${selectedCliente.nombre} ${
                      selectedCliente.apellido || ""
                    }`
                  : "",
              }));
            }}
            // Usa las funciones defensivas
            value={findClienteById(form.clientId)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Cliente"
                required
                error={!form.clientId && !isSaving}
                helperText={!form.clientId ? "Seleccione un cliente" : ""}
              />
            )}
          />

          {/* Autocomplete Producto */}
          <Autocomplete
            options={productoOptions}
            getOptionLabel={(producto) =>
              `${producto.nombre} - ${producto.codigo || ""}`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={productoInput}
            onInputChange={(event, newInputValue) => {
              setProductoInput(newInputValue);
            }}
            onChange={(event, selectedProducto) => {
              setForm((prevForm) => ({
                ...prevForm,
                productId: selectedProducto ? selectedProducto.id : undefined,
                productoNombre: selectedProducto ? selectedProducto.nombre : "",
              }));
            }}
            // Usa las funciones defensivas
            value={findProductoById(form.productId)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Producto"
                required
                error={!form.productId && !isSaving}
                helperText={!form.productId ? "Seleccione un producto" : ""}
              />
            )}
          />

          {/* CAMPO FECHA DE VENTA REINTRODUCIDO */}
          <TextField
              label="Fecha de Venta"
              name="fechaVenta"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.fechaVenta || ''}
              onChange={handleChange}
              fullWidth
              required
              error={!form.fechaVenta && !isSaving}
              helperText={!form.fechaVenta ? "Introduzca la fecha de la venta" : ""}
          />
          
          {/* Select de Estado (con chequeo defensivo de mapeo) */}
          <TextField
            select
            label="Estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            fullWidth
          >
            {(estados || []).map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Campo de Observaciones */}
          <TextField
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {form.id ? (isSaving ? "Guardando..." : "Guardar Cambios") : (isSaving ? "Guardando..." : "Crear Garantía")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GarantiaFormDialog;