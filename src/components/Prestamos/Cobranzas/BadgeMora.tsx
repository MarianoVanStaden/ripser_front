import { Chip } from '@mui/material';
import { statusSx, type StatusRole } from '../../../theme/statusRoles';

interface BadgeMoraProps {
  dias: number;
  size?: 'small' | 'medium';
}

export const BadgeMora: React.FC<BadgeMoraProps> = ({ dias, size = 'small' }) => {
  if (dias === 0) {
    return <Chip label="Al día" color="success" size={size} />;
  }

  const { label, role } = (() => {
    if (dias <= 30) return { label: `${dias} días mora`, role: 'warning' as StatusRole };
    if (dias <= 60) return { label: `${dias} días mora`, role: 'danger' as StatusRole };
    return { label: `${dias} días mora`, role: 'danger' as StatusRole };
  })();

  return (
    <Chip
      label={label}
      size={size}
      sx={{ ...statusSx(role), fontWeight: 700 }}
    />
  );
};
