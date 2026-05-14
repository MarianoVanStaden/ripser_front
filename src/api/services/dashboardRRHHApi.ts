import api from '../config';
import type { DashboardRRHHDTO } from '../../types/dashboardRRHH.types';

const BASE_PATH = '/api/rrhh/dashboard';

export const dashboardRRHHApi = {
  get: async (): Promise<DashboardRRHHDTO> => {
    const response = await api.get<DashboardRRHHDTO>(BASE_PATH);
    return response.data;
  },
};

export default dashboardRRHHApi;
