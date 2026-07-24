import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface FechaFieldProps {
  label: string;
  /** ISO yyyy-mm-dd; '' = vacío. */
  value: string;
  onChange: (iso: string) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  /** ISO yyyy-mm-dd. */
  minDate?: string;
  maxDate?: string;
}

/**
 * Campo de fecha con formato DD/MM/YYYY (DatePicker de MUI). Reemplaza los
 * TextField type="date" nativos, que muestran mes/día/año según el locale
 * del navegador. El valor sigue viajando como ISO yyyy-mm-dd.
 */
const FechaField: React.FC<FechaFieldProps> = ({
  label, value, onChange,
  size = 'small', fullWidth = true,
  required, disabled, error, helperText, minDate, maxDate,
}) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      label={label}
      format="DD/MM/YYYY"
      value={value ? dayjs(value) : null}
      onChange={(v) => onChange(v?.isValid() ? v.format('YYYY-MM-DD') : '')}
      disabled={disabled}
      minDate={minDate ? dayjs(minDate) : undefined}
      maxDate={maxDate ? dayjs(maxDate) : undefined}
      slotProps={{ textField: { fullWidth, size, required, error, helperText } }}
    />
  </LocalizationProvider>
);

export default FechaField;
