import { useEffect, useMemo, useState } from 'react';
import {
  ofertaPrecioApi,
  type OfertaPrecioDTO,
  type TipoReferenciaOferta,
} from '../api/services/ofertaPrecioApi';

export interface PrecioConOferta {
  precioBase: number;
  precioEfectivo: number;
  hayOferta: boolean;
  oferta?: OfertaPrecioDTO;
}

/**
 * Carga una sola vez las ofertas vigentes y expone helpers para resolver el
 * "precio efectivo" sincrónicamente. Pensado para pantallas de venta
 * (presupuestos, facturación, notas de pedido) que necesitan aplicar la oferta
 * al seleccionar un item de catálogo sin esperar otra request.
 */
export const useOfertasVigentes = () => {
  const [ofertas, setOfertas] = useState<OfertaPrecioDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await ofertaPrecioApi.findVigentes();
        if (!cancelled) setOfertas(data.filter(o => o.vigente));
      } catch (err) {
        console.warn('No se pudieron cargar ofertas vigentes:', err);
        if (!cancelled) setOfertas([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Map (tipo:refId) → mejor oferta (precio más bajo)
  const map = useMemo(() => {
    const m = new Map<string, OfertaPrecioDTO>();
    for (const o of ofertas) {
      const key = `${o.tipo}:${o.referenciaId}`;
      const prev = m.get(key);
      if (!prev || o.precioOferta < prev.precioOferta) m.set(key, o);
    }
    return m;
  }, [ofertas]);

  const getOferta = (tipo: TipoReferenciaOferta, refId: number): OfertaPrecioDTO | undefined =>
    map.get(`${tipo}:${refId}`);

  const getPrecioEfectivo = (
    tipo: TipoReferenciaOferta,
    refId: number,
    precioBase: number,
  ): PrecioConOferta => {
    const oferta = getOferta(tipo, refId);
    if (oferta) {
      return {
        precioBase,
        precioEfectivo: Number(oferta.precioOferta),
        hayOferta: true,
        oferta,
      };
    }
    return { precioBase, precioEfectivo: precioBase, hayOferta: false };
  };

  return { ofertas, loading, getOferta, getPrecioEfectivo };
};
