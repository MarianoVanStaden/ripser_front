import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { stockObjetivoApi } from '../../../../api/services/stockObjetivoApi';
import type {
  EvaluacionStockDTO,
  StockObjetivoResponseDTO,
  CreateStockObjetivoDTO,
  UpdateStockObjetivoDTO,
  GenerarOrdenDTO,
} from '../../../../types';

export function useStockObjetivo() {
  const queryClient = useQueryClient();
  const evaluacionQuery = useQuery({
    queryKey: ['stock-objetivo', 'evaluacion'],
    queryFn: () => stockObjetivoApi.getEvaluacion(),
  });
  const evaluacion: EvaluacionStockDTO[] = evaluacionQuery.data ?? [];
  const loading = evaluacionQuery.isPending;
  const error = evaluacionQuery.error
    ? ((evaluacionQuery.error as Error)?.message || 'Error al cargar la evaluación de stock')
    : null;

  // Form state (create / edit objetivo)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StockObjetivoResponseDTO | null>(null);
  const [saving, setSaving] = useState(false);

  // Generar orden state
  const [generarOrdenTarget, setGenerarOrdenTarget] = useState<EvaluacionStockDTO | null>(null);
  const [generarOrdenOpen, setGenerarOrdenOpen] = useState(false);
  const [generandoOrden, setGenerandoOrden] = useState(false);

  const loadEvaluacion = useCallback(
    async () => { await queryClient.invalidateQueries({ queryKey: ['stock-objetivo'] }); },
    [queryClient],
  );

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
