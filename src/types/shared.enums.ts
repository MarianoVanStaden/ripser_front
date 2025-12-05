/**
 * Enum para las provincias de Argentina + CABA
 * Sincronizado con el backend: com.ripser_back.enums.Provincia
 */
export const ProvinciaEnum = {
  BUENOS_AIRES: 'BUENOS_AIRES',
  CABA: 'CABA',
  CATAMARCA: 'CATAMARCA',
  CHACO: 'CHACO',
  CHUBUT: 'CHUBUT',
  CORDOBA: 'CORDOBA',
  CORRIENTES: 'CORRIENTES',
  ENTRE_RIOS: 'ENTRE_RIOS',
  FORMOSA: 'FORMOSA',
  JUJUY: 'JUJUY',
  LA_PAMPA: 'LA_PAMPA',
  LA_RIOJA: 'LA_RIOJA',
  MENDOZA: 'MENDOZA',
  MISIONES: 'MISIONES',
  NEUQUEN: 'NEUQUEN',
  RIO_NEGRO: 'RIO_NEGRO',
  SALTA: 'SALTA',
  SAN_JUAN: 'SAN_JUAN',
  SAN_LUIS: 'SAN_LUIS',
  SANTA_CRUZ: 'SANTA_CRUZ',
  SANTA_FE: 'SANTA_FE',
  SANTIAGO_DEL_ESTERO: 'SANTIAGO_DEL_ESTERO',
  TIERRA_DEL_FUEGO: 'TIERRA_DEL_FUEGO',
  TUCUMAN: 'TUCUMAN'
} as const;

export type ProvinciaEnum = typeof ProvinciaEnum[keyof typeof ProvinciaEnum];

/**
 * Labels legibles para las provincias
 */
export const PROVINCIA_LABELS: Record<ProvinciaEnum, string> = {
  BUENOS_AIRES: 'Buenos Aires',
  CABA: 'CABA',
  CATAMARCA: 'Catamarca',
  CHACO: 'Chaco',
  CHUBUT: 'Chubut',
  CORDOBA: 'Córdoba',
  CORRIENTES: 'Corrientes',
  ENTRE_RIOS: 'Entre Ríos',
  FORMOSA: 'Formosa',
  JUJUY: 'Jujuy',
  LA_PAMPA: 'La Pampa',
  LA_RIOJA: 'La Rioja',
  MENDOZA: 'Mendoza',
  MISIONES: 'Misiones',
  NEUQUEN: 'Neuquén',
  RIO_NEGRO: 'Río Negro',
  SALTA: 'Salta',
  SAN_JUAN: 'San Juan',
  SAN_LUIS: 'San Luis',
  SANTA_CRUZ: 'Santa Cruz',
  SANTA_FE: 'Santa Fe',
  SANTIAGO_DEL_ESTERO: 'Santiago del Estero',
  TIERRA_DEL_FUEGO: 'Tierra del Fuego',
  TUCUMAN: 'Tucumán'
};
