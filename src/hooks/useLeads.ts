import { useState, useEffect, useCallback } from 'react';
import { leadApi } from '../api/services/leadApi';
import { EstadoLeadEnum } from '../types/lead.types';
import type { LeadDTO, LeadFilterState } from '../types/lead.types';
import type { PageResponse } from '../types/pagination.types';

/**
 * Hook personalizado para gestionar leads
 */
export const useLeads = () => {
  const [leads, setLeads] = useState<LeadDTO[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar leads (paginated + filters)
   */
  const loadLeads = useCallback(async (filters: LeadFilterState = {}, page = 0, size = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      // Map filters to API params
      // LeadFilterState keys generally match LeadFilterParams, but we pass them directly
      const response: PageResponse<LeadDTO> = await leadApi.getAll(
        { page, size }, 
        filters 
      );
      
      setLeads(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error loading leads:', err);
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
      // For paginated lists, we usually don't append. 
      // But preserving existing behavior of appending might be less disruptive for small lists logic.
      // However, if we view page 1 and add item, it might appear.
      setLeads((prev) => [newLead, ...prev]); 
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

  // Removed legacy methods: loadLeadsByEstado, filterLeads, getLeadStats
  // Use leadMetricasApi for stats.

  return {
    leads,
    totalElements,
    totalPages,
    loading,
    error,
    loadLeads,
    createLead,
    updateLead,
    deleteLead
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
