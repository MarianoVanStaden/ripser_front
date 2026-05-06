export type RubroEnum =
  | 'PANADERIA'
  | 'CARNICERIA'
  | 'FIAMBRERIA'
  | 'VERDULERIA'
  | 'HELADERIA'
  | 'RESTAURANTE'
  | 'BAR'
  | 'CAFETERIA'
  | 'ROTISERIA'
  | 'SUPERMERCADO'
  | 'AUTOSERVICIO'
  | 'KIOSCO'
  | 'HOTEL'
  | 'CATERING'
  | 'FARMACIA'
  | 'OTRO';

export const RUBRO_OPTIONS: { value: RubroEnum; label: string }[] = [
  { value: 'PANADERIA', label: 'Panadería' },
  { value: 'CARNICERIA', label: 'Carnicería' },
  { value: 'FIAMBRERIA', label: 'Fiambrería' },
  { value: 'VERDULERIA', label: 'Verdulería' },
  { value: 'HELADERIA', label: 'Heladería' },

  { value: 'RESTAURANTE', label: 'Restaurante' },
  { value: 'BAR', label: 'Bar' },
  { value: 'CAFETERIA', label: 'Cafetería' },
  { value: 'ROTISERIA', label: 'Rotisería' },

  { value: 'SUPERMERCADO', label: 'Supermercado' },
  { value: 'AUTOSERVICIO', label: 'Autoservicio' },
  { value: 'KIOSCO', label: 'Kiosco' },

  { value: 'HOTEL', label: 'Hotel' },
  { value: 'CATERING', label: 'Catering' },

  { value: 'FARMACIA', label: 'Farmacia' },

  { value: 'OTRO', label: 'Otro (especificar)' },
];

export const RUBRO_LABELS: Record<RubroEnum, string> =
  Object.fromEntries(
    RUBRO_OPTIONS.map(({ value, label }) => [value, label])
  ) as Record<RubroEnum, string>;