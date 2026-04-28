import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordatorioLeadApi } from '../api/services/recordatorioLeadApi';
import { leadApi } from '../api/services/leadApi';
import type {
  RecordatorioConLeadDTO,
  RecordatorioGlobalFilterParams,
  ConteosRecordatoriosDTO,
} from '../api/services/recordatorioLeadApi';
import type { InteraccionLeadDTO } from '../types/lead.types';
import { QUERY_KEYS } from '../utils/queryKeys';

// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------

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

interface RecordatoriosResult {
  content: RecordatorioConLeadDTO[];
  totalElements: number;
  usingFallback: boolean;
}

/**
 * Fallback: carga todos los leads y aplana sus recordatorios pendientes.
 * Usado cuando el endpoint global /api/recordatorios responde 403/404.
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

// ---------------------------------------------------------------------------
// Hook — React Query + invalidación SSE-driven
//
// Acepta los filtros como argumento; la queryKey reacciona automáticamente
// cuando cambian. Las mutaciones invalidan localmente; los eventos SSE
// (crm.recordatorio.actualizado) los invalida también vía EVENT_QUERY_MAP.
// ---------------------------------------------------------------------------
export const useRecordatoriosLeads = (
  filters: RecordatorioGlobalFilterParams = {}
) => {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Query principal: lista de recordatorios filtrada
  // -------------------------------------------------------------------------
  const recordatoriosQuery = useQuery<RecordatoriosResult, Error>({
    queryKey: QUERY_KEYS.RECORDATORIOS(filters),
    queryFn: async () => {
      try {
        const PAGE_SIZE = 2000;
        const first = await recordatorioLeadApi.getAll(
          { page: 0, size: PAGE_SIZE },
          { enviado: false, ...filters }
        );
        let all = first.content;
        if (first.totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: first.totalPages - 1 }, (_, i) =>
              recordatorioLeadApi.getAll(
                { page: i + 1, size: PAGE_SIZE },
                { enviado: false, ...filters }
              )
            )
          );
          for (const r of rest) all = all.concat(r.content);
        }
        return {
          content: sortRecordatorios(all),
          totalElements: first.totalElements,
          usingFallback: false,
        };
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 403 && status !== 404) throw err;
        console.warn(
          `[Recordatorios] Endpoint global respondió ${status}. Usando fallback via /api/leads.`
        );
        const data = await loadViaLeads(filters);
        return {
          content: data,
          totalElements: data.length,
          usingFallback: true,
        };
      }
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  // -------------------------------------------------------------------------
  // Query de conteos globales (sin filtro de fecha — refleja totales reales)
  // -------------------------------------------------------------------------
  const conteosQuery = useQuery<ConteosRecordatoriosDTO, Error>({
    queryKey: QUERY_KEYS.RECORDATORIOS_CONTEOS(filters.sucursalId, filters.usuarioId),
    queryFn: async () => {
      try {
        return await recordatorioLeadApi.getConteos({
          sucursalId: filters.sucursalId,
          usuarioId: filters.usuarioId,
        });
      } catch {
        // Fallback: derivar conteos del dataset cargado vía leads.
        const data = await loadViaLeads({
          sucursalId: filters.sucursalId,
          usuarioId: filters.usuarioId,
        });
        return computeConteos(data);
      }
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  // -------------------------------------------------------------------------
  // Mutations
  //
  // Invalidan proactivamente (mejor UX que esperar al evento SSE de retorno,
  // sobre todo si la conexión está degradada). El evento SSE actúa como
  // confirmación / sincronización para otras pestañas y otros usuarios.
  // -------------------------------------------------------------------------
  const usingFallback = recordatoriosQuery.data?.usingFallback ?? false;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['recordatorios'] });
    queryClient.invalidateQueries({ queryKey: ['recordatoriosConteos'] });
  };

  const marcarCompletadoMutation = useMutation({
    mutationFn: async ({
      recordatorioId,
      leadId,
    }: {
      recordatorioId: number;
      leadId: number;
    }) => {
      if (!usingFallback) {
        try {
          await recordatorioLeadApi.marcarEnviado(recordatorioId);
          return;
        } catch {
          await leadApi.marcarRecordatorioEnviado(leadId, recordatorioId);
          return;
        }
      }
      await leadApi.marcarRecordatorioEnviado(leadId, recordatorioId);
    },
    onSuccess: invalidateAll,
  });

  const reprogramarMutation = useMutation({
    mutationFn: async ({
      recordatorioId,
      leadId,
      nuevaFecha,
    }: {
      recordatorioId: number;
      leadId: number;
      nuevaFecha: string;
    }) => {
      if (!usingFallback) {
        try {
          await recordatorioLeadApi.update(recordatorioId, {
            fechaRecordatorio: nuevaFecha,
          });
          return;
        } catch {
          // fallthrough al per-lead
        }
      }
      await leadApi.updateRecordatorio(leadId, recordatorioId, {
        fechaRecordatorio: nuevaFecha,
      });
    },
    onSuccess: invalidateAll,
  });

  const crearInteraccionMutation = useMutation({
    mutationFn: async ({
      leadId,
      interaccion,
    }: {
      leadId: number;
      interaccion: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>;
    }) => {
      return await leadApi.createInteraccion(leadId, interaccion);
    },
    // No invalida recordatorios: la interacción es una entidad separada.
  });

  const crearRecordatorioMutation = useMutation({
    mutationFn: async ({
      leadId,
      data,
    }: {
      leadId: number;
      data: Parameters<typeof leadApi.createRecordatorio>[1];
    }) => {
      return await leadApi.createRecordatorio(leadId, data);
    },
    onSuccess: invalidateAll,
  });

  // -------------------------------------------------------------------------
  // API estable hacia la página (compat con el hook anterior + refetch)
  // -------------------------------------------------------------------------
  const recordatorios = recordatoriosQuery.data?.content ?? [];
  const totalElements = recordatoriosQuery.data?.totalElements ?? 0;
  const conteos = conteosQuery.data ?? INITIAL_CONTEOS;
  const error = recordatoriosQuery.error
    ? 'Error al cargar los recordatorios. Verifique la conexión con el servidor.'
    : null;

  return useMemo(
    () => ({
      recordatorios,
      totalElements,
      conteos,
      loading: recordatoriosQuery.isLoading,
      isFetching: recordatoriosQuery.isFetching,
      error,
      usingFallback,
      /** Force-resync manual (botón de refresh). La lista se actualiza sola vía SSE. */
      refetch: () => {
        recordatoriosQuery.refetch();
        conteosQuery.refetch();
      },
      marcarCompletado: (recordatorioId: number, leadId: number) =>
        marcarCompletadoMutation.mutateAsync({ recordatorioId, leadId }),
      reprogramar: (recordatorioId: number, leadId: number, nuevaFecha: string) =>
        reprogramarMutation.mutateAsync({ recordatorioId, leadId, nuevaFecha }),
      crearInteraccion: (
        leadId: number,
        interaccion: Omit<InteraccionLeadDTO, 'id' | 'leadId' | 'fechaCreacion'>
      ) => crearInteraccionMutation.mutateAsync({ leadId, interaccion }),
      crearRecordatorio: (
        leadId: number,
        data: Parameters<typeof leadApi.createRecordatorio>[1]
      ) => crearRecordatorioMutation.mutateAsync({ leadId, data }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      recordatorios,
      totalElements,
      conteos,
      recordatoriosQuery.isLoading,
      recordatoriosQuery.isFetching,
      error,
      usingFallback,
    ]
  );
};
