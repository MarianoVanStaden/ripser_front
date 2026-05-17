// Hook compartido entre AsistenciasPage y LicenciasPage para gestionar
// excepciones de asistencia (carga por período, alta, eliminación).
// Se extrajo de AsistenciasPage cuando agregamos la tab "Excepciones" a
// la página de Licencias.
import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { excepcionAsistenciaApi } from '../../../../api/services/excepcionAsistenciaApi';
import { asistenciaAutomaticaApi } from '../../../../api/services/asistenciaAutomaticaApi';
import { createInitialExcepcionForm } from '../constants';
import type { ExcepcionFormData } from '../types';

interface UseExcepcionesOptions {
  /** Días hacia atrás para la carga inicial. Default 30. */
  diasHistoria?: number;
  /** Hook al que se le pasa el id de empleado/día para inferir horaEntrada base (LLEGADA_TARDE). */
  getHoraEntradaBase?: (empleadoId: number, fecha: string) => string | null;
}

export function useExcepciones({
  diasHistoria = 30,
  getHoraEntradaBase,
}: UseExcepcionesOptions = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [excepciones, setExcepciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState<ExcepcionFormData>(createInitialExcepcionForm);

  const reload = useCallback(
    async (desde?: string, hasta?: string) => {
      try {
        setLoading(true);
        const from = desde ?? dayjs().subtract(diasHistoria, 'days').format('YYYY-MM-DD');
        const to = hasta ?? dayjs().format('YYYY-MM-DD');
        const data = await excepcionAsistenciaApi.getByPeriodo(from, to).catch(() => []);
        setExcepciones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('useExcepciones reload:', err);
        setError('Error al cargar excepciones');
      } finally {
        setLoading(false);
      }
    },
    [diasHistoria]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const openCreateDialog = useCallback(() => {
    setForm(createInitialExcepcionForm());
    setOpenDialog(true);
  }, []);

  const closeDialog = useCallback(() => {
    setOpenDialog(false);
    setForm(createInitialExcepcionForm());
  }, []);

  /**
   * Persiste la excepción aplicando la misma lógica condicional que tenía
   * AsistenciasPage.handleSaveExcepcion (cálculo de horaEntradaReal para
   * LLEGADA_TARDE, conversión de números, ramas por tipo).
   */
  const saveExcepcion = useCallback(async () => {
    try {
      setError(null);

      const debeTrabajar = await asistenciaAutomaticaApi.debeTrabajar(
        parseInt(form.empleadoId),
        form.fecha
      );
      if (!debeTrabajar && form.tipo !== 'INASISTENCIA') {
        setError('El empleado no tiene configurado trabajar este día');
        return false;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        empleadoId: parseInt(form.empleadoId),
        fecha: form.fecha,
        tipo: form.tipo,
        justificado: form.justificado,
        observaciones: form.observaciones,
      };

      if (form.tipo === 'LLEGADA_TARDE' && form.minutosTardanza) {
        const minutos = parseInt(form.minutosTardanza);
        payload.minutosTardanza = minutos;
        const horaBase = getHoraEntradaBase?.(parseInt(form.empleadoId), form.fecha);
        if (horaBase) {
          const [hh, mm] = horaBase.split(':').map(Number);
          const total = hh * 60 + mm + minutos;
          payload.horaEntradaReal = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(
            total % 60
          ).padStart(2, '0')}:00`;
        }
      }
      if (form.tipo === 'HORAS_EXTRAS' && form.horasExtras) {
        payload.horasExtras = parseFloat(form.horasExtras);
      }
      if (['SALIDA_ANTICIPADA', 'MODIFICACION_HORARIO'].includes(form.tipo)) {
        if (form.horaEntradaReal) payload.horaEntradaReal = form.horaEntradaReal;
        if (form.horaSalidaReal) payload.horaSalidaReal = form.horaSalidaReal;
      }
      if (form.tipo === 'INASISTENCIA' && form.motivo) {
        payload.motivo = form.motivo;
      }

      await excepcionAsistenciaApi.create(payload);
      await reload();
      closeDialog();
      return true;
    } catch (err) {
      console.error('useExcepciones saveExcepcion:', err);
      setError('Error al guardar excepción');
      return false;
    }
  }, [closeDialog, form, getHoraEntradaBase, reload]);

  const deleteExcepcion = useCallback(
    async (id: number) => {
      try {
        await excepcionAsistenciaApi.delete(id);
        await reload();
      } catch (err) {
        console.error('useExcepciones deleteExcepcion:', err);
        setError('Error al eliminar excepción');
      }
    },
    [reload]
  );

  return {
    excepciones,
    loading,
    error,
    setError,
    openDialog,
    form,
    setForm,
    openCreateDialog,
    closeDialog,
    saveExcepcion,
    deleteExcepcion,
    reload,
  };
}
