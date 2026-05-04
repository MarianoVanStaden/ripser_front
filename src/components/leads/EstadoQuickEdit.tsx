import { useState } from 'react';
import { Menu, MenuItem, Box, CircularProgress } from '@mui/material';
import { EstadoLeadEnum, ESTADO_LABELS, ESTADO_COLORS } from '../../types/lead.types';
import { LeadStatusBadge } from './LeadStatusBadge';

interface EstadoQuickEditProps {
  leadId: number;
  currentEstado: EstadoLeadEnum;
  options: EstadoLeadEnum[];
  onUpdate: (leadId: number, newEstado: EstadoLeadEnum) => Promise<void>;
  /** Si true, sólo se muestra el badge sin permitir abrir el menú. */
  disabled?: boolean;
}

export const EstadoQuickEdit = ({ leadId, currentEstado, options, onUpdate, disabled = false }: EstadoQuickEditProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [updating, setUpdating] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = async (estado: EstadoLeadEnum) => {
    if (estado === currentEstado) {
      handleClose();
      return;
    }

    try {
      setUpdating(true);
      await onUpdate(leadId, estado);
      handleClose();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          display: 'inline-block',
          '&:hover': disabled ? undefined : { opacity: 0.8 }
        }}
      >
        {updating ? (
          <CircularProgress size={20} />
        ) : (
          <LeadStatusBadge status={currentEstado} />
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
      >
        {options.map((estado) => (
          <MenuItem
            key={estado}
            onClick={() => handleSelect(estado)}
            selected={estado === currentEstado}
            sx={{
              '&:hover': {
                backgroundColor: `${ESTADO_COLORS[estado]}20`
              }
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: ESTADO_COLORS[estado],
                mr: 1
              }}
            />
            {ESTADO_LABELS[estado]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
