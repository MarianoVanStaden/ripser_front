import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Producto,
} from "../../types";
import { debounce } from "lodash";
import { clienteApi } from "../../api/services/clienteApi";
import { productApi } from "../../api/services/productApi";
import { saleApi } from "../../api/services/saleApi"; // agregar import

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
  // Claves foráneas (saleId añadido)
  clientId: undefined,
  productId: undefined,
  saleId: undefined, // <-- nuevo
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
  const [productoOptions, setProductoOptions] = useState<
    (ProductoListDTO | Producto)[]
  >([]);
  const [ventaOptions, setVentaOptions] = useState<any[]>([]); // añadir estado para ventas
  const [clienteInput, setClienteInput] = useState("");
  const [productoInput, setProductoInput] = useState("");
  const [ventaInput, setVentaInput] = useState("");
  const lastClienteSearch = useRef<string>("");
  const lastProductoSearch = useRef<string>("");
  const lastVentaSearch = useRef<string>(""); // nueva referencia para ventas

  const debouncedClienteSearch = useCallback(
    debounce(async (searchTerm: string) => {
      // Evitar llamadas repetidas con el mismo término
      if (searchTerm === lastClienteSearch.current) return;
      // Solo busca si hay más de 2 caracteres o si el campo está limpio
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = await clienteApi.search(searchTerm);
          setClienteOptions(() => data || []); // Reemplaza en vez de mezclar
          lastClienteSearch.current = searchTerm;
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
      if (searchTerm === lastProductoSearch.current) return;
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = (await productApi.search(searchTerm)) as ProductoListDTO[];
          setProductoOptions(() => data || []);
          lastProductoSearch.current = searchTerm;
        } catch (error) {
          console.error("Error buscando productos:", error);
          setProductoOptions([]);
        }
      }
    }, 500),
    []
  );

  // debounced search (añadir similar a cliente/producto)
  const debouncedVentaSearch = useCallback(
    debounce(async (term: string) => {
      if (term === lastVentaSearch.current) return;
      if (term.length > 1 || term.length === 0) {
        try {
          const data = await saleApi.search(term); // o saleApi.getByCliente(...)
          setVentaOptions(data || []);
          lastVentaSearch.current = term;
        } catch (err) {
          console.error("Error buscando ventas:", err);
          setVentaOptions([]);
        }
      }
    }, 400),
    []
  );

  // Cancelar debounced al desmontar para evitar llamadas rezagadas
  useEffect(() => {
    return () => {
      debouncedClienteSearch.cancel();
      debouncedProductoSearch.cancel();
      debouncedVentaSearch.cancel(); // cancelar también para ventas
    };
  }, [debouncedClienteSearch, debouncedProductoSearch, debouncedVentaSearch]);

  // Disparadores de búsqueda
  useEffect(() => {
    debouncedClienteSearch(clienteInput);
  }, [clienteInput, debouncedClienteSearch]);

  useEffect(() => {
    debouncedProductoSearch(productoInput);
  }, [productoInput, debouncedProductoSearch]);

  useEffect(() => {
    debouncedVentaSearch(ventaInput);
  }, [ventaInput, debouncedVentaSearch]);

  // Manejo de Edición/Carga Inicial
  useEffect(() => {
    if (garantia) {
      // Si estamos editando, precargar las opciones con los datos del registro actual
      if (
        garantia.clientId &&
        !clienteOptions.some((c) => c.id === garantia.clientId)
      ) {
        clienteApi
          .getById(garantia.clientId)
          .then((clienteData) =>
            setClienteOptions((prev) => [
              ...prev.filter((c) => c.id !== clienteData.id),
              clienteData,
            ])
          )
          .catch((e) =>
            console.error("No se pudo cargar el cliente para edición", e)
          );
      }
      if (
        garantia.productId &&
        !productoOptions.some((p) => p.id === garantia.productId)
      ) {
        productApi
          .getById(garantia.productId)
          .then((productoData) => {
            // Normalizar el producto a ProductoListDTO (asegurar stockActual presente)
            const normalized = {
              ...productoData,
              stockActual:
                (productoData as any).stockActual ??
                (productoData as any).stock ??
                0,
            } as ProductoListDTO;
            setProductoOptions((prev) => [
              ...prev.filter((p) => p.id !== normalized.id),
              normalized,
            ]);
          })
          .catch((e) =>
            console.error("No se pudo cargar el producto para edición", e)
          );
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
        saleId: garantia.saleId || undefined,
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

  useEffect(() => {
    // Solo se ejecuta si el diálogo está abierto Y estamos en modo edición (garantia existe)
    if (open && garantia && garantia.id) {
      // Carga Asíncrona del Cliente (solo si el cliente no está YA en las opciones)
      if (
        garantia.clientId &&
        !clienteOptions.some((c) => c.id === garantia.clientId)
      ) {
        clienteApi
          .getById(garantia.clientId)
          .then((clienteData) => {
            // Carga el cliente y lo añade a las opciones para que el Autocomplete lo encuentre
            setClienteOptions((prev) => [
              ...prev.filter((c) => c.id !== clienteData.id),
              clienteData,
            ]);
          })
          .catch((e) =>
            console.error("Error al precargar cliente para edición:", e)
          );
      }

      // Carga Asíncrona del Producto (solo si el producto no está YA en las opciones)
      if (
        garantia.productId &&
        !productoOptions.some((p) => p.id === garantia.productId)
      ) {
        productApi
          .getById(garantia.productId)
          .then((productoData) => {
            // Carga el producto y lo añade a las opciones
            setProductoOptions((prev) => [
              ...prev.filter((p) => p.id !== productoData.id),
              productoData,
            ]);
          })
          .catch((e) =>
            console.error("Error al precargar producto para edición:", e)
          );
      }
    }
  }, [garantia, open, clienteOptions.length, productoOptions.length]);

  // --- NUEVO HOOK PARA CARGA INICIAL CONTROLADA ---
  useEffect(() => {
    // Solo se ejecuta una vez al abrir el diálogo
    if (open) {
      const loadInitialOptions = async () => {
        try {
          // 1. Cargar una lista base de clientes
          const initialClientes = await clienteApi.search("");
          setClienteOptions(initialClientes || []);

          // 2. Cargar una lista base de productos
          const initialProductos = await productApi.search("");
          setProductoOptions(initialProductos || []);
        } catch (error) {
          console.error("Error cargando opciones iniciales:", error);
          setClienteOptions([]);
          setProductoOptions([]);
        }
      };

      loadInitialOptions();
    }

    // Al cerrar el diálogo, limpiar las opciones para la próxima vez
    if (!open) {
      setClienteOptions([]);
      setProductoOptions([]);
    }
  }, [open]); // Depende solo de 'open' para cargarse y limpiarse
  // ----------------------------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Si es saleId convertir a number o undefined
    if (name === "saleId") {
      setForm(prev => ({ ...prev, [name]: value === "" ? undefined : parseInt(value, 10) }));
      return;
    }

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
    // Validación ahora incluye saleId
    if (!form.clientId || !form.productId || !form.fechaVenta || !form.saleId) {
      alert("Faltan datos obligatorios: Cliente, Producto, Fecha de Venta y Venta (ventaId).");
      return;
    }

    setIsSaving(true);
    try {
      console.log('GarantiaFormDialog: saving payload', form);
      await onSave(form); // onSave debe propagar error si API falla
      // sólo cerrar si onSave tuvo éxito
      onClose();
    } catch (e: any) {
      console.error('Error al guardar garantía (UI):', e);
      const serverMsg =
        e?.response?.data?.message || e?.response?.data || e?.message || 'Error desconocido';
      alert(`No se pudo guardar la garantía: ${serverMsg}`);
      // No hacer fallback local ni cerrar dialog — forzar corrección
    } finally {
      setIsSaving(false);
    }
  };

  // FUNCIONES DE BÚSQUEDA DEFENSIVAS (CORRECCIÓN CLAVE CONTRA EL ERROR UNDEFINED)
  const findClienteById = (id: number | undefined) => {
    // Si no hay ID o si las opciones no se han cargado (están vacías), devuelve null
    if (!id || clienteOptions.length === 0) return null;
    return clienteOptions.find((c) => c.id === id) || null;
  };

  const findProductoById = (id: number | undefined) => {
    // Si no hay ID o si las opciones no se han cargado (están vacías), devuelve null
    if (!id || productoOptions.length === 0) return null;
    return productoOptions.find((p) => p.id === id) || null;
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
            filterOptions={(x) => x} // <-- importante: evitar filtrado local
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            inputValue={clienteInput}
            onInputChange={(event, newInputValue, reason) => {
              // Sólo actualizar input si proviene del usuario (typing or clear)
              if (reason === "input" || reason === "clear") {
                setClienteInput(newInputValue);
              }
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
              setClienteInput(
                selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido || ""}` : ""
              );
              // guardar el término para evitar re-búsqueda inmediata
              lastClienteSearch.current = selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellido || ""}` : '';
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

          {/* Autocomplete Producto */}
          <Autocomplete
            options={productoOptions}
            getOptionLabel={(producto) =>
              `${producto.nombre} - ${producto.codigo || ""}`
            }
            filterOptions={(x) => x}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            inputValue={productoInput}
            onInputChange={(event, newInputValue, reason) => {
              if (reason === "input" || reason === "clear") {
                setProductoInput(newInputValue);
              }
            }}
            onChange={(event, selectedProducto) => {
              setForm((prevForm) => ({
                ...prevForm,
                productId: selectedProducto ? selectedProducto.id : undefined,
                productoNombre: selectedProducto ? selectedProducto.nombre : "",
              }));
              setProductoInput(selectedProducto ? selectedProducto.nombre : "");
              lastProductoSearch.current = selectedProducto ? selectedProducto.nombre : "";
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

          {/* Autocomplete Venta (nuevo) */}
          <Autocomplete
            options={ventaOptions}
            getOptionLabel={(v) =>
              v.numeroVenta ? `${v.numeroVenta} — ${v.clienteNombre || v.clientName || ''}` : `Venta #${v.id}`
            }
            filterOptions={(x) => x}
            isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
            inputValue={ventaInput}
            onInputChange={(_e, newVal, reason) => {
              if (reason === "input" || reason === "clear") setVentaInput(newVal);
            }}
            value={ventaOptions.find((s) => s.id === form.saleId) || null}
            onChange={(_e, selected) => {
              setForm((prev) => ({
                ...prev,
                saleId: selected ? selected.id : undefined,
                // opcional: precargar cliente/producto en el form
                clientId: selected?.clientId ?? prev.clientId,
                productId: selected?.productId ?? prev.productId,
              }));
              setVentaInput(selected ? (selected.numeroVenta?.toString() ?? `Venta ${selected.id}`) : "");
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Venta (asociar)"
                required
                error={!form.saleId && !isSaving}
                helperText={!form.saleId ? "Seleccione la venta asociada" : ""}
                fullWidth
              />
            )}
          />

          {/* CAMPO FECHA DE VENTA REINTRODUCIDO */}
          <TextField
            label="Fecha de Venta"
            name="fechaVenta"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.fechaVenta || ""}
            onChange={handleChange}
            fullWidth
            required
            error={!form.fechaVenta && !isSaving}
            helperText={
              !form.fechaVenta ? "Introduzca la fecha de la venta" : ""
            }
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

          {/* INPUT PARA VENTA (ventaId) */}
          <TextField
            label="ID Venta (ventaId)"
            name="saleId"
            type="number"
            value={form.saleId ?? ""}
            onChange={handleChange}
            fullWidth
            required
            error={!form.saleId && !isSaving}
            helperText={!form.saleId ? "ID de la venta asociado (obligatorio)" : ""}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          {form.id
            ? isSaving
              ? "Guardando..."
              : "Guardar Cambios"
            : isSaving
            ? "Guardando..."
            : "Crear Garantía"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GarantiaFormDialog;
