import { useState } from 'react';
import { Menu, MenuItem, Box, CircularProgress } from '@mui/material';
import { PrioridadLeadEnum, PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '../../types/lead.types';
import { LeadPriorityBadge } from './LeadPriorityBadge';

interface PriorityQuickEditProps {
  leadId: number;
  currentPriority?: PrioridadLeadEnum;
  onUpdate: (leadId: number, newPriority: PrioridadLeadEnum) => Promise<void>;
}

export const PriorityQuickEdit = ({ leadId, currentPriority, onUpdate }: PriorityQuickEditProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [updating, setUpdating] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = async (priority: PrioridadLeadEnum) => {
    if (priority === currentPriority) {
      handleClose();
      return;
    }

    try {
      setUpdating(true);
      await onUpdate(leadId, priority);
      handleClose();
    } catch (error) {
      console.error('Error al actualizar prioridad:', error);
    } finally {
      setUpdating(false);
    }
  };

  const prioridades: PrioridadLeadEnum[] = [
    PrioridadLeadEnum.HOT,
    PrioridadLeadEnum.WARM,
    PrioridadLeadEnum.COLD
  ];

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          position: 'relative',
          display: 'inline-block',
          '&:hover': { opacity: 0.8 }
        }}
      >
        {updating ? (
          <CircularProgress size={20} />
        ) : currentPriority ? (
          <LeadPriorityBadge priority={currentPriority} size="small" />
        ) : (
          <Box
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              border: '1px dashed',
              borderColor: 'grey.400',
              borderRadius: 2,
              px: 1,
              py: 0.5,
              minWidth: 80,
              textAlign: 'center'
            }}
          >
            Sin prioridad
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
      >
        {prioridades.map((priority) => (
          <MenuItem
            key={priority}
            onClick={() => handleSelect(priority)}
            selected={priority === currentPriority}
            sx={{
              '&:hover': {
                backgroundColor: `${PRIORIDAD_COLORS[priority]}20`
              }
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: PRIORIDAD_COLORS[priority],
                mr: 1
              }}
            />
            {PRIORIDAD_LABELS[priority]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
