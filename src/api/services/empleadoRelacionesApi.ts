import api from '../config';
import type {
  ContactoEmergencia,
  CargaFamiliar,
  IdiomaEmpleadoItem,
} from '../../types/rrhh.types';

// CRUD para las entidades relacionales del empleado (Fase 2 RRHH).
// Todos los endpoints viven bajo /api/empleados/{empleadoId}/{recurso} y
// se mapean directamente a EmpleadoRelacionesController en el backend.

type Payload<T> = Omit<T, 'id' | 'empleadoId'> & { id?: number };

export const contactosEmergenciaApi = {
  getByEmpleado: async (empleadoId: number): Promise<ContactoEmergencia[]> => {
    const { data } = await api.get(`/api/empleados/${empleadoId}/contactos-emergencia`);
    return data;
  },
  create: async (empleadoId: number, dto: Payload<ContactoEmergencia>): Promise<ContactoEmergencia> => {
    const { data } = await api.post(`/api/empleados/${empleadoId}/contactos-emergencia`, dto);
    return data;
  },
  update: async (empleadoId: number, id: number, dto: Payload<ContactoEmergencia>): Promise<ContactoEmergencia> => {
    const { data } = await api.put(`/api/empleados/${empleadoId}/contactos-emergencia/${id}`, dto);
    return data;
  },
  delete: async (empleadoId: number, id: number): Promise<void> => {
    await api.delete(`/api/empleados/${empleadoId}/contactos-emergencia/${id}`);
  },
};

export const cargasFamiliaresApi = {
  getByEmpleado: async (empleadoId: number): Promise<CargaFamiliar[]> => {
    const { data } = await api.get(`/api/empleados/${empleadoId}/cargas-familiares`);
    return data;
  },
  create: async (empleadoId: number, dto: Payload<CargaFamiliar>): Promise<CargaFamiliar> => {
    const { data } = await api.post(`/api/empleados/${empleadoId}/cargas-familiares`, dto);
    return data;
  },
  update: async (empleadoId: number, id: number, dto: Payload<CargaFamiliar>): Promise<CargaFamiliar> => {
    const { data } = await api.put(`/api/empleados/${empleadoId}/cargas-familiares/${id}`, dto);
    return data;
  },
  delete: async (empleadoId: number, id: number): Promise<void> => {
    await api.delete(`/api/empleados/${empleadoId}/cargas-familiares/${id}`);
  },
};

export const idiomasEmpleadoApi = {
  getByEmpleado: async (empleadoId: number): Promise<IdiomaEmpleadoItem[]> => {
    const { data } = await api.get(`/api/empleados/${empleadoId}/idiomas`);
    return data;
  },
  create: async (empleadoId: number, dto: Payload<IdiomaEmpleadoItem>): Promise<IdiomaEmpleadoItem> => {
    const { data } = await api.post(`/api/empleados/${empleadoId}/idiomas`, dto);
    return data;
  },
  update: async (empleadoId: number, id: number, dto: Payload<IdiomaEmpleadoItem>): Promise<IdiomaEmpleadoItem> => {
    const { data } = await api.put(`/api/empleados/${empleadoId}/idiomas/${id}`, dto);
    return data;
  },
  delete: async (empleadoId: number, id: number): Promise<void> => {
    await api.delete(`/api/empleados/${empleadoId}/idiomas/${id}`);
  },
};
