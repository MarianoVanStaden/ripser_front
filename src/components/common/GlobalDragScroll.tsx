import { useGlobalDragScroll } from '../../hooks/useGlobalDragScroll';

/**
 * Habilita el arrastre horizontal (drag-to-scroll) en TODA tabla que desborde,
 * sin tocar cada página. Componente de comportamiento puro: no renderiza nada.
 *
 * Se monta una sola vez, cerca de la raíz. Como escucha delegado en `document`,
 * también cubre las tablas dentro de diálogos (que se montan en portales) y las
 * páginas públicas fuera del Layout.
 *
 * Ver `useGlobalDragScroll` para los escapes `data-drag-scroll="self" | "off"`.
 */
const GlobalDragScroll: React.FC = () => {
  useGlobalDragScroll();
  return null;
};

export default GlobalDragScroll;
