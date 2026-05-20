import api from '../config';
import type { CostoEnvioDTO, Provincia } from '../../types/costoEnvio.types';

const BASE = '/api/costos-envio';

export const costoEnvioApi = {
  getAll: (): Promise<CostoEnvioDTO[]> =>
    api.get(BASE).then((r) => (Array.isArray(r.data) ? r.data : [])),

  getByProvincia: (provincia: Provincia): Promise<CostoEnvioDTO> =>
    api.get(`${BASE}/${provincia}`).then((r) => r.data),

  update: (provincia: Provincia, precio: number): Promise<CostoEnvioDTO> =>
    api.put(`${BASE}/${provincia}`, { precio }).then((r) => r.data),

  seed: (): Promise<void> =>
    api.post(`${BASE}/seed`).then(() => undefined),
};
