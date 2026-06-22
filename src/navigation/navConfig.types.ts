import type { ReactNode } from 'react';
import type { Modulo } from '../types';

/**
 * Un ítem de navegación (una pantalla). Puede declarar su propio `modulo`
 * para sobreescribir el de la sección que lo contiene (útil cuando una
 * sección agrupa rutas gateadas por permisos distintos).
 */
export interface NavItem {
  text: string;
  icon: ReactNode;
  path: string;
  modulo?: Modulo;
}

/**
 * Un módulo del sidebar: un título de sección + sus ítems.
 */
export interface NavModule {
  title: string;
  modulo: Modulo;
  items: NavItem[];
}
