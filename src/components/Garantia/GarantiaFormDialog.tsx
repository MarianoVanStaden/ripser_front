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
  Producto,
  VentaSearchDTO, // Importar VentaSearchDTO
} from "../../types";
import { debounce } from "lodash";
import { clienteApi } from "../../api/services/clienteApi";
import { productApi } from "../../api/services/productApi";
import { ventaApi } from "../../api/services/ventaApi"; // Usamos ventaApi (como lo llamas en el backend)

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

const initialFormState: Garantia = {
  id: "",
  clienteNombre: "",
  clienteApellido: "",
  productoNombre: "",
  fechaVenta: "",
  estado: "VIGENTE",
  observaciones: "",
  clientId: undefined,
  productId: undefined,
  saleId: undefined, // <-- ventaId
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
  const [ventaOptions, setVentaOptions] = useState<VentaSearchDTO[]>([]); // Tipado correcto


  // ELIMINADOS: clienteInput, productoInput, ventaInput y las referencias useRef


  // 1. DEBOUNCER: Cliente
  const debouncedClienteSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = await clienteApi.search(searchTerm);
          setClienteOptions(data || []);
        } catch (error) {
          console.error("Error buscando clientes:", error);
          setClienteOptions([]);
        }
      }
    }, 500),
    []
  );

  // 2. DEBOUNCER: Producto
  const debouncedProductoSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = (await productApi.search(searchTerm)) as ProductoListDTO[];
          setProductoOptions(data || []);
        } catch (error) {
          console.error("Error buscando productos:", error);
          setProductoOptions([]);
        }
      }
    }, 500),
    []
  );

  // 3. DEBOUNCER: Venta
  const debouncedVentaSearch = useCallback(
    debounce(async (searchTerm: string) => {
      // Usamos VentaSearchDTO
      if (searchTerm.length > 2 || searchTerm.length === 0) {
        try {
          const data = await ventaApi.search(searchTerm);
          setVentaOptions(data || []);
        } catch (error) {
          console.error("Error buscando ventas:", error);
          setVentaOptions([]);
        }
      }
    }, 500),
    []
  );

  // Cancelar debounced al desmontar
  useEffect(() => {
    return () => {
      debouncedClienteSearch.cancel();
      debouncedProductoSearch.cancel();
      debouncedVentaSearch.cancel();
    };
  }, [debouncedClienteSearch, debouncedProductoSearch, debouncedVentaSearch]);

  // --- CARGA INICIAL CONTROLADA (Lógica Unificada) ---
  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        // Carga inicial de Opciones
        const initialClientes = await clienteApi.search("");
        setClienteOptions(initialClientes || []);

        const initialProductos = await productApi.search("");
        setProductoOptions(initialProductos || []);

        const initialVentas = await ventaApi.search(""); // Carga inicial de Venta
        setVentaOptions(initialVentas || []);
      } catch (error) {
        console.error("Error cargando opciones iniciales:", error);
        setClienteOptions([]);
        setProductoOptions([]);
        setVentaOptions([]);
      }
    };

    if (open) {
      loadInitialOptions();
      // Reinicia el formulario si no hay garantía (modo Creación)
      if (!garantia) {
        setForm(initialFormState);
      }
    }

    // Limpiar al cerrar
    if (!open) {
      setClienteOptions([]);
      setProductoOptions([]);
      setVentaOptions([]);
      setForm(initialFormState); // Asegura que el estado esté limpio al cerrar
    }
  }, [open, garantia]);


  // --- MANEJO DE EDICIÓN Y PRECARGA (Solo cuando garantía cambia) ---
  useEffect(() => {
    if (garantia) {
      setForm({
        ...garantia,
        // Asegura que los IDs se mapeen correctamente
        clientId: garantia.clientId || undefined,
        productId: garantia.productId || undefined,
        saleId: garantia.saleId || undefined,
        // El resto de mapeos que tenías...
        id: garantia.id || "",
        fechaVenta: garantia.fechaVenta || "",
        observaciones: garantia.observaciones || "",
        estado: garantia.estado?.toUpperCase() || "VIGENTE",
        warrantyNumber: garantia.warrantyNumber || "",
        startDate: garantia.startDate || "",
        endDate: garantia.endDate || "",
        status: (garantia.status?.toUpperCase() as WarrantyStatus) || "VIGENTE",
        description: garantia.description || "",
      });

      // Carga asíncrona de las entidades seleccionadas (Cliente, Producto, Venta)
      // para asegurar que estén en 'Options' para el Autocomplete
      const loadSelectedEntities = async () => {
        // 1. Cliente
        if (garantia.clientId && !clienteOptions.some(c => c.id === garantia.clientId)) {
            try {
                const clienteData = await clienteApi.getById(garantia.clientId);
                setClienteOptions(prev => [...prev.filter(c => c.id !== clienteData.id), clienteData]);
            } catch (e) { console.error("Error precargando cliente:", e); }
        }

        // 2. Producto
        if (garantia.productId && !productoOptions.some(p => p.id === garantia.productId)) {
            try {
                const productoData = await productApi.getById(garantia.productId);
                setProductoOptions(prev => [...prev.filter(p => p.id !== productoData.id), productoData]);
            } catch (e) { console.error("Error precargando producto:", e); }
        }
        
        // 3. Venta (Nuevo)
        if (garantia.saleId && !ventaOptions.some(v => v.id === garantia.saleId)) {
            try {
                // Necesitas una forma de obtener el VentaSearchDTO por ID, si no existe un endpoint directo:
                // Hacemos un GET de la venta completa y la mapeamos al DTO ligero.
                const ventaCompleta = await ventaApi.getById(garantia.saleId);
                const ventaSearch: VentaSearchDTO = {
                    id: ventaCompleta.id,
                    numeroVenta: ventaCompleta.numeroVenta || '',
                    clienteNombreCompleto: `${ventaCompleta.cliente?.nombre || ''} ${ventaCompleta.cliente?.apellido || ''}`.trim() || '',
                    productosResumen: ventaCompleta.detalleVentas?.map(d => d.productoNombre).join(', ') || ''
                };
                setVentaOptions(prev => [...prev.filter(v => v.id !== ventaSearch.id), ventaSearch]);
            } catch (e) { console.error("Error precargando venta:", e); }
        }
      };

      loadSelectedEntities();
    }
  }, [garantia, clienteOptions.length, productoOptions.length, ventaOptions.length]); // Dependencias para reintentar la carga si las opciones no están listas


  // --- HELPERS PARA AUTOCMPLETE (Defensivos) ---
  const findClienteById = (id: number | undefined) => {
    if (!id) return null;
    return clienteOptions.find((c) => c.id === id) || null;
  };

  const findProductoById = (id: number | undefined) => {
    if (!id) return null;
    return productoOptions.find((p) => p.id === id) || null;
  };
  
  const findVentaById = (id: number | undefined) => {
    if (!id) return null;
    return ventaOptions.find((v) => v.id === id) || null;
  };


  // --- HANDLERS ---
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
    // Validación ahora incluye saleId
    if (!form.clientId || !form.productId || !form.fechaVenta || !form.saleId) {
      alert("Faltan datos obligatorios: Cliente, Producto, Fecha de Venta y Venta (ventaId).");
      return;
    }

    setIsSaving(true);
    try {
      // Simplemente pasa el form, GarantiasPage.tsx se encarga del mapeo a DTO
      await onSave(form); 
      onClose();
    } catch (e: any) {
      console.error('Error al guardar garantía:', e);
      const errorMsg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || 'Error desconocido';
      alert(`No se pudo guardar la garantía: ${errorMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER ---
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {form.id ? "Editar Garantía" : "Nueva Garantía"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>

          {/* Autocomplete Venta (Nuevo y Limpio) */}
         <Autocomplete
            options={ventaOptions}
            getOptionLabel={(v) =>
              `Venta #${v.numeroVenta} - Cliente: ${v.clienteNombreCompleto} - Prod: ${v.productosResumen}`
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            filterOptions={(x) => x}
            
            // Disparador directo de la búsqueda DEBOUNCED
            onInputChange={(_e, newInputValue, reason) => {
              if (reason === 'input') {
                debouncedVentaSearch(newInputValue);
              }
            }}

             value={findVentaById(form.saleId)}
            onChange={async (_e, selectedVenta) => {
              if (selectedVenta) {
                try {
                  // Cargar la venta completa para obtener todos los datos
                  const ventaCompleta = await ventaApi.getById(selectedVenta.id);
                  
                  console.log('🔄 Auto-completando desde venta:', ventaCompleta);
                  
                  // Obtener el primer producto de la venta
                  const primerDetalle = ventaCompleta.detalleVentas?.[0];
                  
                  setForm((prev) => ({
                    ...prev,
                    saleId: selectedVenta.id,
                    // Auto-completar cliente
                    clientId: ventaCompleta.clienteId,
                    clienteNombre: ventaCompleta.cliente 
                      ? `${ventaCompleta.cliente.nombre} ${ventaCompleta.cliente.apellido || ''}`.trim()
                      : '',
                    // Auto-completar fecha
                    fechaVenta: ventaCompleta.fechaVenta?.split('T')[0] || '',
                    startDate: ventaCompleta.fechaVenta?.split('T')[0] || '',
                    // Auto-completar producto (primer producto de la venta)
                    productId: primerDetalle?.productoId,
                    productoNombre: primerDetalle?.productoNombre || '',
                  }));
                  
                  // Asegurar que el cliente esté en las opciones del autocomplete
                  if (ventaCompleta.cliente && !clienteOptions.some(c => c.id === ventaCompleta.clienteId)) {
                    setClienteOptions(prev => [...prev, ventaCompleta.cliente!]);
                  }
                  
                  // Asegurar que el producto esté en las opciones del autocomplete
                  if (primerDetalle?.productoId && !productoOptions.some(p => p.id === primerDetalle.productoId)) {
                    // Crear un objeto compatible con ProductoListDTO
                    const productoParaAutocomplete = {
                      id: primerDetalle.productoId,
                      nombre: primerDetalle.productoNombre || '',
                      codigo: '', // No tenemos el código en el detalle
                      precio: primerDetalle.precioUnitario,
                      stockActual: 0, // No lo conocemos desde el detalle
                      categoriaProductoNombre: '',
                      activo: true,
                    };
                    setProductoOptions(prev => [...prev, productoParaAutocomplete]);
                  }
                  
                } catch (error) {
                  console.error("Error cargando venta:", error);
                  alert("Error al cargar los datos de la venta");
                }
              } else {
                // Si deselecciona la venta, limpiar campos
                setForm((prev) => ({
                  ...prev,
                  saleId: undefined,
                  clientId: undefined,
                  clienteNombre: '',
                  productId: undefined,
                  productoNombre: '',
                  fechaVenta: '',
                  startDate: '',
                }));
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar Venta"
                required
                error={!form.saleId && !isSaving}
                helperText={!form.saleId ? "Seleccione una venta" : ""}
              />
            )}
          />
          
          {/* Autocomplete Cliente (Limpio) */}
          <Autocomplete
           disabled={!!form.saleId}
            options={clienteOptions}
            getOptionLabel={(cliente) =>
              `${cliente.nombre} ${cliente.apellido || ""} - ${
                cliente.cuit || ""
              }`
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            filterOptions={(x) => x} 
            
            // Disparador directo de la búsqueda DEBOUNCED
            onInputChange={(event, newInputValue, reason) => {
              if (reason === 'input') {
                debouncedClienteSearch(newInputValue);
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

          {/* Autocomplete Producto (Limpio) */}
          <Autocomplete
          disabled={!!form.saleId}
            options={productoOptions}
            getOptionLabel={(producto) =>
              `${producto.nombre} - ${producto.codigo || ""}`
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            filterOptions={(x) => x} 
            
            // Disparador directo de la búsqueda DEBOUNCED
            onInputChange={(event, newInputValue, reason) => {
              if (reason === 'input') {
                debouncedProductoSearch(newInputValue);
              }
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

          
          {/* CAMPO FECHA DE VENTA */}
          <TextField
          disabled={!!form.saleId}
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
          
          {/* Select de Estado */}
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
          
          {/* Campo Número de Serie (Añadir al final si el DTO lo requiere) */}
          {/* <TextField
            label="Número de Serie"
            name="numeroSerie"
            value={form.warrantyNumber}
            onChange={handleChange}
            fullWidth
          /> */}
        
        {/* ELIMINADO: TextField de ID Venta que era redundante */}

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