import { Chip } from '@mui/material';

interface BadgeMoraProps {
  dias: number;
  size?: 'small' | 'medium';
}

export const BadgeMora: React.FC<BadgeMoraProps> = ({ dias, size = 'small' }) => {
  if (dias === 0) {
    return <Chip label="Al día" color="success" size={size} />;
  }

  const { label, color } = (() => {
    if (dias <= 30) return { label: `${dias} días mora`, color: '#FF9800' };
    if (dias <= 60) return { label: `${dias} días mora`, color: '#FF5722' };
    return { label: `${dias} días mora`, color: '#F44336' };
  })();

  return (
    <Chip
      label={label}
      size={size}
      sx={{ bgcolor: color, color: 'white', fontWeight: 700 }}
    />
  );
};
