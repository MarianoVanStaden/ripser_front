import { useState, useEffect, useCallback } from 'react';
import { leadApi } from '../api/services/leadApi';
import { EstadoLeadEnum } from '../types/lead.types';
import type { LeadDTO, LeadFilterState } from '../types/lead.types';

/**
 * Hook personalizado para gestionar leads
 */
export const useLeads = () => {
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar todos los leads
   */
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadApi.getAll();
      setLeads(data);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Error al cargar los leads');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar leads por estado
   */
  const loadLeadsByEstado = useCallback(async (estado: EstadoLeadEnum) => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadApi.getByEstado(estado);
      setLeads(data);
    } catch (err) {
      console.error('Error loading leads by estado:', err);
      setError('Error al cargar los leads');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear un nuevo lead
   */
  const createLead = useCallback(async (leadData: Omit<LeadDTO, 'id' | 'dias' | 'fechaConversion'>) => {
    try {
      setError(null);
      const newLead = await leadApi.create(leadData);
      setLeads((prev) => [...prev, newLead]);
      return newLead;
    } catch (err) {
      console.error('Error creating lead:', err);
      setError('Error al crear el lead');
      throw err;
    }
  }, []);

  /**
   * Actualizar un lead
   */
  const updateLead = useCallback(async (id: number, leadData: LeadDTO) => {
    try {
      setError(null);
      const updatedLead = await leadApi.update(id, leadData);
      setLeads((prev) => prev.map((lead) => (lead.id === id ? updatedLead : lead)));
      return updatedLead;
    } catch (err) {
      console.error('Error updating lead:', err);
      setError('Error al actualizar el lead');
      throw err;
    }
  }, []);

  /**
   * Eliminar un lead
   */
  const deleteLead = useCallback(async (id: number) => {
    try {
      setError(null);
      await leadApi.delete(id);
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    } catch (err) {
      console.error('Error deleting lead:', err);
      setError('Error al eliminar el lead');
      throw err;
    }
  }, []);

  /**
   * Filtrar leads localmente
   */
  const filterLeads = useCallback((filters: LeadFilterState): LeadDTO[] => {
    return leads.filter((lead) => {
      // Filtro por estados
      if (filters.estados && filters.estados.length > 0) {
        if (!filters.estados.includes(lead.estadoLead)) {
          return false;
        }
      }

      // Filtro por canales
      if (filters.canales && filters.canales.length > 0) {
        if (!filters.canales.includes(lead.canal)) {
          return false;
        }
      }

      // Filtro por provincias
      if (filters.provincias && filters.provincias.length > 0) {
        if (!lead.provincia || !filters.provincias.includes(lead.provincia)) {
          return false;
        }
      }

      // Filtro por búsqueda (nombre o teléfono)
      if (filters.busqueda && filters.busqueda.trim() !== '') {
        const busqueda = filters.busqueda.toLowerCase();
        const nombreMatch = lead.nombre.toLowerCase().includes(busqueda);
        const telefonoMatch = lead.telefono.toLowerCase().includes(busqueda);
        if (!nombreMatch && !telefonoMatch) {
          return false;
        }
      }

      return true;
    });
  }, [leads]);

  /**
   * Obtener estadísticas de los leads
   */
  const getLeadStats = useCallback(() => {
    const total = leads.length;
    const byEstado = leads.reduce((acc, lead) => {
      acc[lead.estadoLead] = (acc[lead.estadoLead] || 0) + 1;
      return acc;
    }, {} as Record<EstadoLeadEnum, number>);

    const byCanal = leads.reduce((acc, lead) => {
      acc[lead.canal] = (acc[lead.canal] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const convertidos = byEstado[EstadoLeadEnum.CONVERTIDO] || 0;
    const tasaConversion = total > 0 ? (convertidos / total) * 100 : 0;

    return {
      total,
      byEstado,
      byCanal,
      convertidos,
      tasaConversion: tasaConversion.toFixed(2)
    };
  }, [leads]);

  return {
    leads,
    loading,
    error,
    loadLeads,
    loadLeadsByEstado,
    createLead,
    updateLead,
    deleteLead,
    filterLeads,
    getLeadStats
  };
};

/**
 * Hook para gestionar un lead individual
 */
export const useLead = (id?: number) => {
  const [lead, setLead] = useState<LeadDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLead = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await leadApi.getById(id);
      setLead(data);
    } catch (err) {
      console.error('Error loading lead:', err);
      setError('Error al cargar el lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  return {
    lead,
    loading,
    error,
    reload: loadLead
  };
};
