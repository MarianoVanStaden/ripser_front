import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { empresaService } from '../../services/empresaService';
import type { Empresa } from '../../types/tenant.types';

interface Props {
  value: Empresa | null;
  onChange: (empresa: Empresa | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  sx?: object;
  helperText?: string;
}

/**
 * Selector de empresa por nombre (Autocomplete sobre /api/empresas/activas).
 * Pensado para pantallas de superadmin/platform owner donde antes se tipeaba
 * el ID numérico a mano.
 */
export default function EmpresaAutocomplete({
  value, onChange, label = 'Empresa', required, disabled, sx, helperText,
}: Props) {
  const [opciones, setOpciones] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    empresaService.getActive()
      .then((emps) => { if (!cancel) setOpciones(emps); })
      .catch(() => { /* el caller ve el select vacío; no rompemos la página */ })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, []);

  return (
    <Autocomplete
      options={opciones}
      value={value}
      onChange={(_, v) => onChange(v)}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(e) => `${e.nombre} (#${e.id})`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      sx={sx}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} helperText={helperText} />
      )}
    />
  );
}
