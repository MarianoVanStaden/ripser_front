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
  onClose: () => void; // Importante: onSave es asíncrono, debería ser Promise<void>
  onSave: (garantia: Garantia) => Promise<void>;
}

const estados = [
  { value: "VIGENTE", label: "Vigente" }, // Usar valores ENUM del backend
  { value: "VENCIDA", label: "Vencida" },
  { value: "EN_PROCESO", label: "En Proceso" }, // Añadí un estado de proceso
];

// Valores por defecto/iniciales para una Garantía nueva
const initialFormState: Garantia = {
  // Campos del formulario
  id: "",
  clienteNombre: "",
  productoNombre: "",
  fechaVenta: "",
  estado: "VIGENTE", // Usamos el valor ENUM del backend
  observaciones: "",

  // Claves foráneas (necesarias para la API)
  clientId: undefined,
  productId: undefined,
  saleId: undefined, // Opcional

  // Otros campos del DTO (necesarios para el tipado Garantia)
  warrantyNumber: "",
  startDate: "",
  endDate: "",
  status: "VIGENTE" as WarrantyStatus,
  type: "MANUFACTURER", // Valor por defecto
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
  const [isSaving, setIsSaving] = useState(false); // Estado para deshabilitar el botón
  const [clienteOptions, setClienteOptions] = useState<Cliente[]>([]);
  const [productoOptions, setProductoOptions] = useState<ProductoListDTO[]>([]); // Usamos ProductoListDTO
  const [clienteInput, setClienteInput] = useState("");
  const [productoInput, setProductoInput] = useState(""); // --- CORRECCIÓN CRÍTICA: Mapeo Defensivo y Completo ---

  const debouncedClienteSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length > 2) {
        try {
          const data = await clienteApi.search(searchTerm);
          setClienteOptions(data);
        } catch (error) {
          console.error("Error buscando clientes:", error);
        }
      } else if (searchTerm.length === 0) {
        setClienteOptions([]);
      }
    }, 500),
    []
  );

  // Búsqueda de Productos
  const debouncedProductoSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length > 2) {
        try {
          // Nota: Asumimos que productApi.search devuelve ProductoListDTO[]
          const data = (await productApi.search(
            searchTerm
          )) as ProductoListDTO[];
          setProductoOptions(data);
        } catch (error) {
          console.error("Error buscando productos:", error);
        }
      } else if (searchTerm.length === 0) {
        setProductoOptions([]);
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

  useEffect(() => {
    // 1. Si estamos en modo edición (hay objeto garantia)
    if (garantia) {
      setForm({
        // Esparce todos los campos existentes
        ...garantia,

        // Mapeo defensivo de los campos que pueden ser null/undefined en la BD
        id: garantia.id || "", // Asegura que el ID sea string si es necesario para el input
        clienteNombre: garantia.clienteNombre || "",
        productoNombre: garantia.productoNombre || "",
        fechaVenta: garantia.fechaVenta || "",
        observaciones: garantia.observaciones || "",

        // Mapeo de ENUMS (asegura el fallback y mayúsculas)
        estado: garantia.estado?.toUpperCase() || "VIGENTE",

        // Asegura que las claves foráneas sean numbers (o 0 si son requeridas y están ausentes)
        clientId: garantia.clientId || undefined,
        productId: garantia.productId || undefined,

        // Asegura que todos los demás campos del DTO tengan un valor por si la BD omite algo
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
      // 2. Modo nueva garantía: restablece al estado inicial
      setForm(initialFormState);
      setClienteInput("");
      setProductoInput("");
    }
    // Dependencia en 'garantia' y 'open' para resetear al cerrar/abrir.
  }, [garantia, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newForm = { ...form, [name]: value };

    // Mapeo DTO: Asegura que los campos en inglés necesarios para el backend se actualicen
    if (name === "fechaVenta") {
      newForm = { ...newForm, startDate: value };
    }
    if (name === "estado") {
      // Asegura que el status del DTO también se actualice con el ENUM
      newForm = { ...newForm, status: value.toUpperCase() as any };
    }
    if (name === "observaciones") {
      newForm = { ...newForm, description: value };
    }

    setForm(newForm);
  };

  const handleSave = async () => {
    // 1. Validación básica (debes implementar más validaciones)
    if (!form.clientId || !form.productId || !form.saleId || !form.fechaVenta) {
      alert(
        "Faltan datos obligatorios: Cliente, Producto, ID de Venta y Fecha de Venta."
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSave(form);
    } catch (e) {
      // El error ya fue manejado en GarantiasPage, aquí solo restauramos el estado
    } finally {
      setIsSaving(false);
    }
  };

    const findClienteById = (id: number | undefined) => clienteOptions.find(c => c.id === id) || null;
    const findProductoById = (id: number | undefined) => productoOptions.find(p => p.id === id) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
           {" "}
      <DialogTitle>
        {form.id ? "Editar Garantía" : "Nueva Garantía"}
      </DialogTitle>
           {" "}
      <DialogContent>
               {" "}
        <Stack spacing={2} mt={1}>
                   {" "}
          {/* En un escenario real, 'Cliente' y 'Producto' serían ComboBox de búsqueda */}
                   {" "}
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
                   {" "}
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
                   {" "}
          <TextField
            label="ID Venta"
            name="saleId"
            type="number"
            value={form.saleId || ""}
            onChange={handleChange}
            fullWidth
            required
            error={!form.saleId && !isSaving}
            helperText={
              !form.saleId ? "Introduzca el ID de la Venta existente" : ""
            }
          />
                   {" "}
          <TextField
            select
            label="Estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
            fullWidth
          >
                       {" "}
            {estados.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
                     {" "}
          </TextField>
                   {" "}
          <TextField
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />
                 {" "}
        </Stack>
             {" "}
      </DialogContent>
           {" "}
      <DialogActions>
               {" "}
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
               {" "}
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
             {" "}
      </DialogActions>
         {" "}
    </Dialog>
  );
};

export default GarantiaFormDialog;
