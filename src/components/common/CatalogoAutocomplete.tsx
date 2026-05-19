import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, type AutocompleteProps } from '@mui/material';

/**
 * Wrapper de MUI Autocomplete pensado para los catálogos globales (Bancos,
 * Obras Sociales, ART) — combina freeSolo con un fetcher: si la lista cargó,
 * muestra sugerencias; si el usuario tipea algo que no está, queda como
 * string libre (compatible con el modelo actual que persiste solo el nombre).
 *
 * Se le pasa el fetcher (api.list) y un selector para extraer el label
 * (default: row => row.nombre). El value es siempre un string.
 */
interface Props<T> {
  label: string;
  value: string;
  onChange: (val: string) => void;
  fetcher: () => Promise<T[]>;
  /** Cómo extraer el texto a mostrar de cada opción. Default: `(o: any).nombre` */
  getLabel?: (option: T) => string;
  /** Filtrar solo activos del catálogo. Default: true. */
  onlyActive?: boolean;
  helperText?: string;
  placeholder?: string;
  size?: AutocompleteProps<any, false, false, true>['size'];
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function CatalogoAutocomplete<T extends { nombre: string; activo?: boolean }>(
  { label, value, onChange, fetcher, getLabel = (o) => o.nombre, onlyActive = true,
    helperText, placeholder, size, fullWidth = true, disabled }: Props<T>
) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then(list => {
        if (cancelled) return;
        const filtered = onlyActive ? list.filter(o => o.activo !== false) : list;
        setOptions(filtered.map(getLabel));
      })
      .catch(() => { if (!cancelled) setOptions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value || null}
      onChange={(_, v) => onChange(typeof v === 'string' ? v : '')}
      onInputChange={(_, v) => onChange(v ?? '')}
      loading={loading}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} helperText={helperText} />
      )}
    />
  );
}
