// Helpers para rutear operaciones CRUD entre /api/productos (materiales)
// y /api/productos-terminados (reventa) según el flag esReventa de la categoría.

import type { CategoriaProducto, Producto, ProductoTerminado } from '../../types';
import { TipoEntidadProducto } from '../../types';
import { productApi } from './productApi';
import { productoTerminadoApi } from './productoTerminadoApi';

export const isCategoriaReventa = (categoria?: Pick<CategoriaProducto, 'esReventa'> | null): boolean =>
  Boolean(categoria?.esReventa);

export const getTipoEntidadByCategoria = (categoria?: Pick<CategoriaProducto, 'esReventa'> | null): TipoEntidadProducto =>
  isCategoriaReventa(categoria) ? TipoEntidadProducto.PRODUCTO_TERMINADO : TipoEntidadProducto.MATERIAL;

export const isReventa = (
  producto: Pick<Producto, 'tipoEntidad'> | Pick<ProductoTerminado, 'tipoEntidad'>,
): boolean => producto.tipoEntidad === TipoEntidadProducto.PRODUCTO_TERMINADO;

// Devuelve el endpoint base correspondiente. Útil para mensajes/logs/QA.
export const getProductoEndpoint = (categoriaEsReventa: boolean): string =>
  categoriaEsReventa ? '/api/productos-terminados' : '/api/productos';

// Lee un producto del endpoint correcto según su tipoEntidad.
export const fetchProductoById = async (
  id: number,
  tipoEntidad: TipoEntidadProducto,
): Promise<Producto | ProductoTerminado> => {
  if (tipoEntidad === TipoEntidadProducto.PRODUCTO_TERMINADO) {
    const pt = await productoTerminadoApi.getById(id);
    return { ...pt, tipoEntidad };
  }
  const p = await productApi.getById(id);
  return { ...p, tipoEntidad };
};

// Actualiza un producto rutéandolo al endpoint correcto.
export const updateProducto = async (
  id: number,
  payload: Partial<Producto> & Partial<ProductoTerminado>,
  tipoEntidad: TipoEntidadProducto,
): Promise<Producto | ProductoTerminado> => {
  if (tipoEntidad === TipoEntidadProducto.PRODUCTO_TERMINADO) {
    const updated = await productoTerminadoApi.update(id, payload as Partial<ProductoTerminado>);
    return { ...updated, tipoEntidad };
  }
  const updated = await productApi.update(id, payload);
  return { ...updated, tipoEntidad };
};

// Elimina un producto rutéandolo al endpoint correcto.
export const deleteProducto = async (id: number, tipoEntidad: TipoEntidadProducto): Promise<void> => {
  if (tipoEntidad === TipoEntidadProducto.PRODUCTO_TERMINADO) {
    await productoTerminadoApi.delete(id);
    return;
  }
  await productApi.delete(id);
};

export interface ProductoUnificado extends Omit<Producto, 'tipoEntidad'> {
  tipoEntidad: TipoEntidadProducto;
}

// Lista materiales + productos terminados unificados, anotando tipoEntidad en cada uno.
// El backend de productos terminados no devuelve PageResponse, así que normalizamos.
export const fetchProductosUnificados = async (): Promise<ProductoUnificado[]> => {
  const [materialesPage, terminados] = await Promise.all([
    productApi.getAll({ page: 0, size: 10000 }),
    productoTerminadoApi.getAll().catch(() => [] as ProductoTerminado[]),
  ]);

  const materiales: ProductoUnificado[] = (materialesPage.content ?? []).map((p) => ({
    ...p,
    tipoEntidad: TipoEntidadProducto.MATERIAL,
  }));

  // Defensivo: el endpoint puede devolver un array directo, o (en escenarios mockeados/legacy)
  // un objeto paginado tipo {content: []}. Normalizamos a array.
  const terminadosList: ProductoTerminado[] = Array.isArray(terminados)
    ? terminados
    : ((terminados as unknown as { content?: ProductoTerminado[] })?.content ?? []);

  const reventas: ProductoUnificado[] = terminadosList.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    costo: p.costo ?? null,
    stockActual: p.stockActual,
    stockMinimo: p.stockMinimo,
    codigo: p.codigo,
    categoriaProducto: p.categoriaProducto,
    categoriaProductoId: p.categoriaProductoId ?? p.categoriaProducto?.id,
    categoriaProductoNombre: p.categoriaProductoNombre ?? p.categoriaProducto?.nombre,
    activo: p.activo,
    fechaCreacion: p.fechaCreacion,
    tipoEntidad: TipoEntidadProducto.PRODUCTO_TERMINADO,
  }));

  return [...materiales, ...reventas];
};
