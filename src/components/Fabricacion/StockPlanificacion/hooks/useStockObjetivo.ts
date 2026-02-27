import { useState, useCallback, useEffect } from 'react';
import { stockObjetivoApi } from '../../../../api/services/stockObjetivoApi';
import type {
  EvaluacionStockDTO,
  StockObjetivoResponseDTO,
  CreateStockObjetivoDTO,
  UpdateStockObjetivoDTO,
  GenerarOrdenDTO,
} from '../../../../types';

export function useStockObjetivo() {
  const [evaluacion, setEvaluacion] = useState<EvaluacionStockDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state (create / edit objetivo)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockObjetivoResponseDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Generar orden state
  const [generarOrdenTarget, setGenerarOrdenTarget] = useState<EvaluacionStockDTO | null>(null);
  const [generarOrdenOpen, setGenerarOrdenOpen] = useState(false);
  const [generandoOrden, setGenerandoOrden] = useState(false);

  const loadEvaluacion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stockObjetivoApi.getEvaluacion();
      setEvaluacion(data);
    } catch (err) {
      setError((err as Error)?.message || 'Error al cargar la evaluación de stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvaluacion();
  }, [loadEvaluacion]);

  // ── Crear objetivo ──
  const handleCreate = useCallback(
    async (dto: CreateStockObjetivoDTO) => {
      setSaving(true);
      try {
        await stockObjetivoApi.create(dto);
        await loadEvaluacion();
      } finally {
        setSaving(false);
      }
    },
    [loadEvaluacion],
  );

  // ── Actualizar objetivo ──
  const handleUpdate = useCallback(
    async (id: number, dto: UpdateStockObjetivoDTO) => {
      setSaving(true);
      try {
        await stockObjetivoApi.update(id, dto);
        await loadEvaluacion();
      } finally {
        setSaving(false);
      }
    },
    [loadEvaluacion],
  );

  // ── Abrir form de edición: fetch del DTO completo para obtener `activo` ──
  const openEdit = useCallback(async (row: EvaluacionStockDTO) => {
    try {
      const full = await stockObjetivoApi.getById(row.stockObjetivoId);
      setEditing(full);
      setFormOpen(true);
    } catch {
      // Si falla el fetch, abrir igualmente con los datos disponibles
      setEditing({
        id: row.stockObjetivoId,
        tipo: row.tipo,
        modelo: row.modelo,
        medida: row.medida,
        color: row.color,
        cantidadObjetivo: row.cantidadObjetivo,
        activo: true,
        createdAt: '',
      });
      setFormOpen(true);
    }
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
  }, []);

  // ── Generar orden preventiva ──
  const openGenerarOrden = useCallback((row: EvaluacionStockDTO) => {
    setGenerarOrdenTarget(row);
    setGenerarOrdenOpen(true);
  }, []);

  const closeGenerarOrden = useCallback(() => {
    setGenerarOrdenOpen(false);
    setGenerarOrdenTarget(null);
  }, []);

  const handleGenerarOrden = useCallback(
    async (dto: GenerarOrdenDTO) => {
      if (!generarOrdenTarget) return;
      setGenerandoOrden(true);
      try {
        await stockObjetivoApi.generarOrden(generarOrdenTarget.stockObjetivoId, dto);
        await loadEvaluacion();
        closeGenerarOrden();
      } finally {
        setGenerandoOrden(false);
      }
    },
    [generarOrdenTarget, loadEvaluacion, closeGenerarOrden],
  );

  return {
    evaluacion,
    loading,
    error,
    // Form
    formOpen,
    editing,
    saving,
    handleCreate,
    handleUpdate,
    openCreate,
    openEdit,
    closeForm,
    // Generar orden
    generarOrdenOpen,
    generarOrdenTarget,
    generandoOrden,
    openGenerarOrden,
    closeGenerarOrden,
    handleGenerarOrden,
    // Utils
    refresh: loadEvaluacion,
  };
}
