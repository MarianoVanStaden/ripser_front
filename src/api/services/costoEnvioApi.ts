import api from '../config';
import type { CostoEnvioDTO, Provincia } from '../../types/costoEnvio.types';

export const costoEnvioApi = {
  getAll: (): Promise<CostoEnvioDTO[]> =>
    api.get('/costos-envio').then((r) => r.data),

  getByProvincia: (provincia: Provincia): Promise<CostoEnvioDTO> =>
    api.get(`/costos-envio/${provincia}`).then((r) => r.data),

  update: (provincia: Provincia, precio: number): Promise<CostoEnvioDTO> =>
    api.put(`/costos-envio/${provincia}`, { precio }).then((r) => r.data),

  seed: (): Promise<void> =>
    api.post('/costos-envio/seed').then(() => undefined),
};
