import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tipoParadaLabel } from './tripWizardShared';
import type { DeliveryFormState } from './useTripWizard';

export interface SortableDeliveryListProps {
  deliveries: DeliveryFormState[];
  /** Quita la entrega en `index` (el hook valida si se puede). */
  onRemove: (index: number) => void;
  /** ¿Se puede quitar esta entrega? (nuevas siempre; persistidas según rol/estado). */
  canRemove: (delivery: DeliveryFormState) => boolean;
  /** Intercambia con la vecina (flechas ↑/↓). */
  onMove: (index: number, direction: -1 | 1) => void;
  /** Mueve de una posición a otra (drag and drop). */
  onReorder: (fromIndex: number, toIndex: number) => void;
  /** true = flechas ↑/↓ (mobile); false = drag handle (desktop). */
  useArrows: boolean;
  /** Padding compacto (drawer desktop). */
  dense?: boolean;
}

const rowKey = (delivery: DeliveryFormState, index: number): string =>
  delivery.id != null ? `persisted-${delivery.id}` : `new-${index}`;

interface RowProps {
  rowId: string;
  delivery: DeliveryFormState;
  index: number;
  total: number;
  dense: boolean;
  useArrows: boolean;
  removable: boolean;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

const SortableDeliveryRow: React.FC<RowProps> = ({
  rowId, delivery, index, total, dense, useArrows, removable, onRemove, onMove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rowId, disabled: useArrows });

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1 : 'auto',
      }}
    >
      <CardContent sx={dense ? { py: 1, px: 2 } : { py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box display="flex" alignItems="flex-start" gap={1}>
          {!useArrows && (
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ cursor: isDragging ? 'grabbing' : 'grab', mt: 0.25, touchAction: 'none' }}
              aria-label="Arrastrar para reordenar"
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          )}

          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip label={`Parada ${index + 1}`} size="small" sx={{ fontWeight: 600 }} />
              <Typography variant="body2" fontWeight="medium">
                {delivery.direccionEntrega}
              </Typography>
            </Box>
            {delivery.factura && (
              <Chip
                label={delivery.factura.numeroDocumento}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, mr: 0.5 }}
              />
            )}
            {(delivery as any).ordenServicio && (
              <Chip
                label={(delivery as any).ordenServicio.numeroOrden}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ mt: 0.5, mr: 0.5 }}
              />
            )}
            {(delivery as any).tipoParada && (
              <Chip
                label={tipoParadaLabel((delivery as any).tipoParada)}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ mt: 0.5, mr: 0.5 }}
              />
            )}
            {delivery.id != null && delivery.estado && delivery.estado !== 'PENDIENTE' && (
              <Chip
                label={delivery.estado === 'ENTREGADA' ? 'Entregada' : 'No entregada'}
                size="small"
                color={delivery.estado === 'ENTREGADA' ? 'success' : 'error'}
                sx={{ mt: 0.5 }}
              />
            )}
            {delivery.observaciones && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                📝 {delivery.observaciones}
              </Typography>
            )}
          </Box>

          <Box display="flex" alignItems="center">
            {useArrows && (
              <>
                <IconButton
                  size="small"
                  onClick={() => onMove(index, -1)}
                  disabled={index === 0}
                  aria-label="Subir parada"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onMove(index, 1)}
                  disabled={index === total - 1}
                  aria-label="Bajar parada"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {removable && (
              <IconButton size="small" onClick={() => onRemove(index)} aria-label="Quitar entrega">
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Lista de entregas del wizard con reorden: drag and drop en desktop y
 * flechas ↑/↓ en mobile. Muestra el número de parada (posición 1..n) y el
 * botón de quitar según `canRemove` (incluye entregas ya persistidas).
 */
const SortableDeliveryList: React.FC<SortableDeliveryListProps> = ({
  deliveries, onRemove, canRemove, onMove, onReorder, useArrows, dense = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const rowIds = deliveries.map(rowKey);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = rowIds.indexOf(String(active.id));
    const toIndex = rowIds.indexOf(String(over.id));
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex);
  };

  const rows = deliveries.map((delivery, index) => (
    <SortableDeliveryRow
      key={rowIds[index]}
      rowId={rowIds[index]}
      delivery={delivery}
      index={index}
      total={deliveries.length}
      dense={dense}
      useArrows={useArrows}
      removable={canRemove(delivery)}
      onRemove={onRemove}
      onMove={onMove}
    />
  ));

  if (useArrows) {
    return <Stack spacing={1}>{rows}</Stack>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        <Stack spacing={1}>{rows}</Stack>
      </SortableContext>
    </DndContext>
  );
};

export default SortableDeliveryList;
