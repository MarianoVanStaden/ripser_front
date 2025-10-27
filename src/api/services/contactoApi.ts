import api from '../config';
import dayjs from 'dayjs';
import type { ContactoProveedorDTO } from '../../types';

export const contactoApi = {
  getAll: async (): Promise<ContactoProveedorDTO[]> => {
    const res = await api.get('/api/contactos-proveedor');
    return res.data;
  },
  getById: async (id: number): Promise<ContactoProveedorDTO> => {
    const res = await api.get(`/api/contactos-proveedor/${id}`);
    return res.data;
  },
  getByProveedorId: async (proveedorId: number): Promise<ContactoProveedorDTO[]> => {
    const res = await api.get(`/api/contactos-proveedor/proveedor/${proveedorId}`);
    return res.data;
  },
  create: async (data: ContactoProveedorDTO): Promise<ContactoProveedorDTO> => {
    const payload = {
      ...data,
      fechaContacto: data.fechaContacto
        ? dayjs(data.fechaContacto).isValid()
          ? dayjs(data.fechaContacto).format('YYYY-MM-DDTHH:mm:ss')
          : undefined
        : undefined,
      proximoContacto: data.proximoContacto
        ? dayjs(data.proximoContacto).isValid()
          ? dayjs(data.proximoContacto).format('YYYY-MM-DDTHH:mm:ss')
          : undefined
        : undefined,
    };
    const res = await api.post('/api/contactos-proveedor', payload);
    return res.data;
  },
  update: async (id: number, data: ContactoProveedorDTO): Promise<ContactoProveedorDTO> => {
    const payload = {
      ...data,
      fechaContacto: data.fechaContacto
        ? dayjs(data.fechaContacto).isValid()
          ? dayjs(data.fechaContacto).format('YYYY-MM-DDTHH:mm:ss')
          : undefined
        : undefined,
      proximoContacto: data.proximoContacto
        ? dayjs(data.proximoContacto).isValid()
          ? dayjs(data.proximoContacto).format('YYYY-MM-DDTHH:mm:ss')
          : undefined
        : undefined,
    };
    const res = await api.put(`/api/contactos-proveedor/${id}`, payload);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/contactos-proveedor/${id}`);
  },
};