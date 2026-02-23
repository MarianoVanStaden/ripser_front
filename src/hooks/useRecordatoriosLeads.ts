import { useState, useCallback } from 'react';
import { recordatorioLeadApi } from '../api/services/recordatorioLeadApi';
import { leadApi } from '../api/services/leadApi';
import type {
  RecordatorioConLeadDTO,
  RecordatorioGlobalFilterParams,
  ConteosRecordatoriosDTO,
} from '../api/services/recordatorioLeadApi';
import type { InteraccionLeadDTO } from '../types/lead.types';

const PRIORIDAD_ORDER: Record<string, number> = { HOT: 0, WARM: 1, COLD: 2 };

const sortRecordatorios = (list: RecordatorioConLeadDTO[]) =>
  [...list].sort((a, b) => {
    if (a.fechaRecordatorio !== b.fechaRecordatorio)
      return a.fechaRecordatorio.localeCompare(b.fechaRecordatorio);
    const pa = PRIORIDAD_ORDER[a.lead?.prioridad ?? 'COLD'] ?? 2;
    const pb = PRIORIDAD_ORDER[b.lead?.prioridad ?? 'COLD'] ?? 2;
    if (pa !== pb) return pa - pb;
    return (b.lead?.score ?? 0) - (a.lead?.score ?? 0);
  });

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const computeConteos = (list: RecordatorioConLeadDTO[]): ConteosRecordatoriosDTO => {
  const today = getTodayStr();
  const yesterday = getYesterdayStr();
  return {
    totalPendientes: list.length,
    vencidos: list.filter((r) => r.fechaRecordatorio <= yesterday).length,
    hoy: list.filter((r) => r.fechaRecordatorio === today).length,
  };
};

/**
 * Fallback: carga todos los leads y aplana sus recordatorios pendientes.
 * Usado cuando el endpoint global /api/recordatorios no está disponible.
 */
const loadViaLeads = async (
  filters: RecordatorioGlobalFilterParams
): Promise<RecordatorioConLeadDTO[]> => {
  const leadsResponse = await leadApi.getAll(
    { page: 0, size: 500 },
    { sucursalId: filters.sucursalId ?? undefined }
  );

  const enriched: RecordatorioConLeadDTO[] = [];

  await Promise.all(
    leadsResponse.content.map(async (lead) => {
      try {
        const recs = await leadApi.getRecordatorios(lead.id!);
        for (const rec of recs) {
          if (rec.enviado) continue;
          if (filters.prioridad && lead.prioridad !== filters.prioridad) continue;
          if (filters.tipo && rec.tipo !== filters.tipo) continue;
          if (filters.usuarioId && rec.usuarioId !== filters.usuarioId) continue;
          if (filters.fechaDesde && rec.fechaRecordatorio < filters.fechaDesde) continue;
          if (filters.fechaHasta && rec.fechaRecordatorio > filters.fechaHasta) continue;

          enriched.push({
            ...rec,
            lead: {
              id: lead.id!,
              nombre: lead.nombre,
              apellido: lead.apellido,
              telefono: lead.telefono,
              email: lead.email,
              estadoLead: lead.estadoLead,
              prioridad: lead.prioridad,
              score: lead.score,
              usuarioAsignadoId: lead.usuarioAsignadoId,
            },
          });
        }
      } catch {
        // Ignorar si un lead falla
      }
    })
  );

  return sortRecordatorios(enriched);
};

const INITIAL_CONTEOS: ConteosRecordatoriosDTO = {
  totalPendientes: 0,
  vencidos: 0,
  hoy: 0,
};

export const useRecordatoriosLeads = () => {
  const [recordatorios, setRecordatorios] = useState<RecordatorioConLeadDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [conteos, setConteos] = useState<ConteosRecordatoriosDTO>(INITIAL_CONTEOS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  /**
   * Carga los conteos globales (totalPendientes, vencidos, hoy).
   * No depende del filtro de fecha activo — siempre muestra el total real.
   */
  const loadConteos = useCallback(
    async (params?: { usuarioId?: number; sucursalId?: number }) => {
      try {
        const data = await recordatorioLeadApi.getConteos(params);
        setConteos(data);
      } catch {
        // El endpoint de conteos es opcional — si falla, se calculan desde los datos cargados
      }
    },
    []
  );

  const loadRecordatorios = useCallback(
    async (filters: RecordatorioGlobalFilterParams = {}) => {
      setLoading(true);
      setError(null);
      try {
        // Cargar conteos globales en paralelo (sin filtro de fecha)
        loadConteos({
          usuarioId: filters.usuarioId,
          sucursalId: filters.sucursalId,
        });

        // Intentar endpoint global primero
        try {
          const response = await recordatorioLeadApi.getAll(
            { page: 0, size: 500 },
            { enviado: false, ...filters }
          );
          const sorted = sortRecordatorios(response.content);
          setRecordatorios(sorted);
          setTotalElements(response.totalElements);
          setUsingFallback(false);
          // Si conteos no cargó (aún), calcular desde el dataset completo sin filtro de fecha
          // El loadConteos async ya se encargó de eso
          return;
        } catch (err: any) {
          const status = err?.response?.status;
          if (status !== 403 && status !== 404) throw err;
          console.warn(
            `[Recordatorios] Endpoint global respondió ${status}. Usando fallback via /api/leads.`
          );
          setUsingFallback(true);
        }

        // Fallback: cargar via leads individuales
        const data = await loadViaLeads(filters);
        setRecordatorios(data);
        setTotalElements(data.length);
        // Calcular conteos client-side desde todos los leads (sin filtro de fecha)
        // Para el fallback usamos los datos ya cargados como aproximación
        const dataTodos = await loadViaLeads({ sucursalId: filters.sucursalId, usuarioId: filters.usuarioId });
        setConteos(computeConteos(dataTodos));
      } catch (err) {
        console.error('Error loading recordatorios:', err);
        setError('Error al cargar los recordatorios. Verifique la conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    },
    [loadConteos]
  );

  /**
   * Marca como completado usando el endpoint per-lead (funcional).
   * También intenta el endpoint global si está disponible.
   */
  const marcarCompletado = useCallback(async (recordatorioId: number, leadId: number) => {
    if (!usingFallback) {
      try {
        await recordatorioLeadApi.marcarEnviado(recordatorioId);
      } catch {
        // Fallback a per-lead
        await leadApi.marcarRecordatorioEnviado(leadId, recordatorioId);
      }
    } else {
      await leadApi.marcarRecordatorioEnviado(leadId, recordatorioId);
    }

    setRecordatorios((prev) => prev.filter((r) => r.id !== recordatorioId));
    setTotalElements((prev) => Math.max(0, prev - 1));
    setConteos((prev) => ({
      ...prev,
      totalPendientes: Math.max(0, prev.totalPendientes - 1),
    }));
  }, [usingFallback]);

  /**
   * Reprograma la fecha usando el endpoint per-lead (funcional).
   */
  const reprogramar = useCallback(
    async (recordatorioId: number, leadId: number, nuevaFecha: string) => {
      if (!usingFallback) {
        try {
          const updated = await recordatorioLeadApi.update(recordatorioId, {
            fechaRecordatorio: nuevaFecha,
          });
          setRecordatorios((prev) =>
            prev.map((r) =>
              r.id === recordatorioId
                ? { ...r, fechaRecordatorio: updated.fechaRecordatorio, hora: updated.hora }
                : r
            )
          );
          return;
        } catch {
          // Fallback a per-lead
        }
      }
      const updated = await leadApi.updateRecordatorio(leadId, recordatorioId, {
        fechaRecordatorio: nuevaFecha,
      });
      setRecordatorios((prev) =>
        prev.map((r) =>
          r.id === recordatorioId
            ? { ...r, fechaRecordatorio: updated.fechaRecordatorio }
            : r
        )
      );
    },
    [usingFallback]
  );

  /**
   * Registra una interacción en un lead.
   */
  const crearInteraccion = useCallback(
    async (
      leadId: number,
      interaccion: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>
    ) => {
      return await leadApi.createInteraccion(leadId, interaccion);
    },
    []
  );

  /**
   * Crea un nuevo recordatorio para un lead.
   */
  const crearRecordatorio = useCallback(
    async (
      leadId: number,
      data: Parameters<typeof leadApi.createRecordatorio>[1]
    ) => {
      return await leadApi.createRecordatorio(leadId, data);
    },
    []
  );

  return {
    recordatorios,
    totalElements,
    conteos,
    loading,
    error,
    usingFallback,
    loadRecordatorios,
    loadConteos,
    marcarCompletado,
    reprogramar,
    crearInteraccion,
    crearRecordatorio,
  };
};
