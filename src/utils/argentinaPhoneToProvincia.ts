import { ProvinciaEnum } from '../types/shared.enums';

/**
 * Mapeo de código de área argentino → provincia.
 *
 * Lookup por longest-prefix match: si el teléfono matchea `2945` y también
 * `294`, gana `2945`. Por eso la lógica busca de prefijos más largos a más
 * cortos (ver `provinciaFromTelefono`).
 *
 * Notas:
 * - "11" (CABA + Gran Buenos Aires) lo mapeamos a BUENOS_AIRES porque la
 *   mayoría de los leads con ese código vienen de GBA, no de Capital. Si en el
 *   futuro se separa explícitamente, mover a CABA.
 * - La tabla cubre los prefijos del plan oficial. Si un número no matchea
 *   ningún prefijo (ej. teléfonos extranjeros o números mal cargados), la
 *   función devuelve `null` y el form deja la provincia vacía.
 */
const AREA_CODE_TO_PROVINCIA: Record<string, ProvinciaEnum> = {
  // ===== CABA + GBA =====
  '11': ProvinciaEnum.BUENOS_AIRES,

  // ===== Buenos Aires (interior) =====
  '220': ProvinciaEnum.BUENOS_AIRES, '221': ProvinciaEnum.BUENOS_AIRES,
  '223': ProvinciaEnum.BUENOS_AIRES, '224': ProvinciaEnum.BUENOS_AIRES,
  '225': ProvinciaEnum.BUENOS_AIRES, '226': ProvinciaEnum.BUENOS_AIRES,
  '227': ProvinciaEnum.BUENOS_AIRES, '228': ProvinciaEnum.BUENOS_AIRES,
  '229': ProvinciaEnum.BUENOS_AIRES,
  '230': ProvinciaEnum.BUENOS_AIRES, '236': ProvinciaEnum.BUENOS_AIRES,
  '237': ProvinciaEnum.BUENOS_AIRES, '249': ProvinciaEnum.BUENOS_AIRES,
  '291': ProvinciaEnum.BUENOS_AIRES, '348': ProvinciaEnum.BUENOS_AIRES,
  '2241': ProvinciaEnum.BUENOS_AIRES, '2242': ProvinciaEnum.BUENOS_AIRES,
  '2243': ProvinciaEnum.BUENOS_AIRES, '2244': ProvinciaEnum.BUENOS_AIRES,
  '2245': ProvinciaEnum.BUENOS_AIRES, '2246': ProvinciaEnum.BUENOS_AIRES,
  '2252': ProvinciaEnum.BUENOS_AIRES, '2254': ProvinciaEnum.BUENOS_AIRES,
  '2255': ProvinciaEnum.BUENOS_AIRES, '2257': ProvinciaEnum.BUENOS_AIRES,
  '2261': ProvinciaEnum.BUENOS_AIRES, '2262': ProvinciaEnum.BUENOS_AIRES,
  '2264': ProvinciaEnum.BUENOS_AIRES, '2265': ProvinciaEnum.BUENOS_AIRES,
  '2266': ProvinciaEnum.BUENOS_AIRES, '2267': ProvinciaEnum.BUENOS_AIRES,
  '2268': ProvinciaEnum.BUENOS_AIRES, '2271': ProvinciaEnum.BUENOS_AIRES,
  '2272': ProvinciaEnum.BUENOS_AIRES, '2273': ProvinciaEnum.BUENOS_AIRES,
  '2274': ProvinciaEnum.BUENOS_AIRES, '2281': ProvinciaEnum.BUENOS_AIRES,
  '2283': ProvinciaEnum.BUENOS_AIRES, '2284': ProvinciaEnum.BUENOS_AIRES,
  '2285': ProvinciaEnum.BUENOS_AIRES, '2286': ProvinciaEnum.BUENOS_AIRES,
  '2291': ProvinciaEnum.BUENOS_AIRES, '2292': ProvinciaEnum.BUENOS_AIRES,
  '2296': ProvinciaEnum.BUENOS_AIRES, '2297': ProvinciaEnum.BUENOS_AIRES,
  '2314': ProvinciaEnum.BUENOS_AIRES, '2316': ProvinciaEnum.BUENOS_AIRES,
  '2317': ProvinciaEnum.BUENOS_AIRES, '2320': ProvinciaEnum.BUENOS_AIRES,
  '2323': ProvinciaEnum.BUENOS_AIRES, '2324': ProvinciaEnum.BUENOS_AIRES,
  '2325': ProvinciaEnum.BUENOS_AIRES, '2326': ProvinciaEnum.BUENOS_AIRES,
  '2331': ProvinciaEnum.BUENOS_AIRES, '2342': ProvinciaEnum.BUENOS_AIRES,
  '2343': ProvinciaEnum.BUENOS_AIRES, '2344': ProvinciaEnum.BUENOS_AIRES,
  '2345': ProvinciaEnum.BUENOS_AIRES, '2346': ProvinciaEnum.BUENOS_AIRES,
  '2352': ProvinciaEnum.BUENOS_AIRES, '2353': ProvinciaEnum.BUENOS_AIRES,
  '2354': ProvinciaEnum.BUENOS_AIRES, '2355': ProvinciaEnum.BUENOS_AIRES,
  '2356': ProvinciaEnum.BUENOS_AIRES, '2357': ProvinciaEnum.BUENOS_AIRES,
  '2358': ProvinciaEnum.BUENOS_AIRES, '2392': ProvinciaEnum.BUENOS_AIRES,
  '2393': ProvinciaEnum.BUENOS_AIRES, '2394': ProvinciaEnum.BUENOS_AIRES,
  '2395': ProvinciaEnum.BUENOS_AIRES, '2396': ProvinciaEnum.BUENOS_AIRES,
  '2473': ProvinciaEnum.BUENOS_AIRES, '2474': ProvinciaEnum.BUENOS_AIRES,
  '2475': ProvinciaEnum.BUENOS_AIRES, '2477': ProvinciaEnum.BUENOS_AIRES,
  '2924': ProvinciaEnum.BUENOS_AIRES,
  '2925': ProvinciaEnum.BUENOS_AIRES, '2926': ProvinciaEnum.BUENOS_AIRES,
  '2927': ProvinciaEnum.BUENOS_AIRES, '2928': ProvinciaEnum.BUENOS_AIRES,
  '2929': ProvinciaEnum.BUENOS_AIRES, '2932': ProvinciaEnum.BUENOS_AIRES,
  '2933': ProvinciaEnum.BUENOS_AIRES, '2935': ProvinciaEnum.BUENOS_AIRES,
  '2936': ProvinciaEnum.BUENOS_AIRES, '2983': ProvinciaEnum.BUENOS_AIRES,

  // ===== Córdoba =====
  '351': ProvinciaEnum.CORDOBA, '353': ProvinciaEnum.CORDOBA,
  '358': ProvinciaEnum.CORDOBA,
  '3521': ProvinciaEnum.CORDOBA, '3522': ProvinciaEnum.CORDOBA,
  '3524': ProvinciaEnum.CORDOBA, '3525': ProvinciaEnum.CORDOBA,
  '3532': ProvinciaEnum.CORDOBA, '3533': ProvinciaEnum.CORDOBA,
  '3537': ProvinciaEnum.CORDOBA, '3541': ProvinciaEnum.CORDOBA,
  '3542': ProvinciaEnum.CORDOBA, '3543': ProvinciaEnum.CORDOBA,
  '3544': ProvinciaEnum.CORDOBA, '3546': ProvinciaEnum.CORDOBA,
  '3547': ProvinciaEnum.CORDOBA, '3548': ProvinciaEnum.CORDOBA,
  '3549': ProvinciaEnum.CORDOBA, '3562': ProvinciaEnum.CORDOBA,
  '3563': ProvinciaEnum.CORDOBA, '3564': ProvinciaEnum.CORDOBA,
  '3571': ProvinciaEnum.CORDOBA, '3572': ProvinciaEnum.CORDOBA,
  '3573': ProvinciaEnum.CORDOBA, '3574': ProvinciaEnum.CORDOBA,
  '3575': ProvinciaEnum.CORDOBA, '3576': ProvinciaEnum.CORDOBA,
  '3582': ProvinciaEnum.CORDOBA, '3583': ProvinciaEnum.CORDOBA,
  '3584': ProvinciaEnum.CORDOBA, '3585': ProvinciaEnum.CORDOBA,

  // ===== Santa Fe =====
  '341': ProvinciaEnum.SANTA_FE, '342': ProvinciaEnum.SANTA_FE,
  '3401': ProvinciaEnum.SANTA_FE, '3402': ProvinciaEnum.SANTA_FE,
  '3404': ProvinciaEnum.SANTA_FE, '3405': ProvinciaEnum.SANTA_FE,
  '3406': ProvinciaEnum.SANTA_FE, '3407': ProvinciaEnum.SANTA_FE,
  '3408': ProvinciaEnum.SANTA_FE, '3409': ProvinciaEnum.SANTA_FE,
  '3461': ProvinciaEnum.SANTA_FE, '3462': ProvinciaEnum.SANTA_FE,
  '3463': ProvinciaEnum.SANTA_FE, '3464': ProvinciaEnum.SANTA_FE,
  '3465': ProvinciaEnum.SANTA_FE, '3466': ProvinciaEnum.SANTA_FE,
  '3467': ProvinciaEnum.SANTA_FE, '3468': ProvinciaEnum.SANTA_FE,
  '3469': ProvinciaEnum.SANTA_FE, '3471': ProvinciaEnum.SANTA_FE,
  '3476': ProvinciaEnum.SANTA_FE, '3482': ProvinciaEnum.SANTA_FE,
  '3483': ProvinciaEnum.SANTA_FE, '3491': ProvinciaEnum.SANTA_FE,
  '3492': ProvinciaEnum.SANTA_FE, '3493': ProvinciaEnum.SANTA_FE,
  '3496': ProvinciaEnum.SANTA_FE, '3498': ProvinciaEnum.SANTA_FE,

  // ===== Entre Ríos =====
  '343': ProvinciaEnum.ENTRE_RIOS, '345': ProvinciaEnum.ENTRE_RIOS,
  '3435': ProvinciaEnum.ENTRE_RIOS, '3436': ProvinciaEnum.ENTRE_RIOS,
  '3437': ProvinciaEnum.ENTRE_RIOS, '3438': ProvinciaEnum.ENTRE_RIOS,
  '3442': ProvinciaEnum.ENTRE_RIOS, '3444': ProvinciaEnum.ENTRE_RIOS,
  '3445': ProvinciaEnum.ENTRE_RIOS, '3446': ProvinciaEnum.ENTRE_RIOS,
  '3447': ProvinciaEnum.ENTRE_RIOS, '3454': ProvinciaEnum.ENTRE_RIOS,
  '3455': ProvinciaEnum.ENTRE_RIOS, '3456': ProvinciaEnum.ENTRE_RIOS,
  '3458': ProvinciaEnum.ENTRE_RIOS,

  // ===== Mendoza =====
  '261': ProvinciaEnum.MENDOZA, '263': ProvinciaEnum.MENDOZA,
  '2622': ProvinciaEnum.MENDOZA, '2624': ProvinciaEnum.MENDOZA,
  '2625': ProvinciaEnum.MENDOZA, '2626': ProvinciaEnum.MENDOZA,

  // ===== San Juan =====
  '264': ProvinciaEnum.SAN_JUAN,

  // ===== San Luis =====
  '266': ProvinciaEnum.SAN_LUIS,
  '2651': ProvinciaEnum.SAN_LUIS, '2652': ProvinciaEnum.SAN_LUIS,
  '2655': ProvinciaEnum.SAN_LUIS, '2656': ProvinciaEnum.SAN_LUIS,
  '2657': ProvinciaEnum.SAN_LUIS, '2658': ProvinciaEnum.SAN_LUIS,

  // ===== La Rioja =====
  '380': ProvinciaEnum.LA_RIOJA,
  '3825': ProvinciaEnum.LA_RIOJA, '3826': ProvinciaEnum.LA_RIOJA,
  '3827': ProvinciaEnum.LA_RIOJA,

  // ===== Catamarca =====
  '383': ProvinciaEnum.CATAMARCA,
  '3832': ProvinciaEnum.CATAMARCA, '3833': ProvinciaEnum.CATAMARCA,
  '3834': ProvinciaEnum.CATAMARCA, '3835': ProvinciaEnum.CATAMARCA,
  '3837': ProvinciaEnum.CATAMARCA, '3838': ProvinciaEnum.CATAMARCA,

  // ===== Santiago del Estero =====
  '385': ProvinciaEnum.SANTIAGO_DEL_ESTERO,
  '3841': ProvinciaEnum.SANTIAGO_DEL_ESTERO, '3842': ProvinciaEnum.SANTIAGO_DEL_ESTERO,
  '3843': ProvinciaEnum.SANTIAGO_DEL_ESTERO, '3844': ProvinciaEnum.SANTIAGO_DEL_ESTERO,
  '3845': ProvinciaEnum.SANTIAGO_DEL_ESTERO, '3846': ProvinciaEnum.SANTIAGO_DEL_ESTERO,
  '3854': ProvinciaEnum.SANTIAGO_DEL_ESTERO, '3855': ProvinciaEnum.SANTIAGO_DEL_ESTERO,
  '3856': ProvinciaEnum.SANTIAGO_DEL_ESTERO, '3857': ProvinciaEnum.SANTIAGO_DEL_ESTERO,
  '3858': ProvinciaEnum.SANTIAGO_DEL_ESTERO,

  // ===== Tucumán =====
  '381': ProvinciaEnum.TUCUMAN,
  '3863': ProvinciaEnum.TUCUMAN, '3865': ProvinciaEnum.TUCUMAN,
  '3892': ProvinciaEnum.TUCUMAN,

  // ===== Salta =====
  '387': ProvinciaEnum.SALTA,
  '3868': ProvinciaEnum.SALTA, '3877': ProvinciaEnum.SALTA,
  '3878': ProvinciaEnum.SALTA,

  // ===== Jujuy =====
  '388': ProvinciaEnum.JUJUY,
  '3884': ProvinciaEnum.JUJUY, '3885': ProvinciaEnum.JUJUY,
  '3886': ProvinciaEnum.JUJUY, '3887': ProvinciaEnum.JUJUY,
  '3888': ProvinciaEnum.JUJUY,

  // ===== Chaco =====
  '362': ProvinciaEnum.CHACO, '364': ProvinciaEnum.CHACO,
  '3624': ProvinciaEnum.CHACO, '3725': ProvinciaEnum.CHACO,
  '3731': ProvinciaEnum.CHACO, '3735': ProvinciaEnum.CHACO,

  // ===== Formosa =====
  '370': ProvinciaEnum.FORMOSA,
  '3711': ProvinciaEnum.FORMOSA, '3715': ProvinciaEnum.FORMOSA,
  '3716': ProvinciaEnum.FORMOSA, '3717': ProvinciaEnum.FORMOSA,
  '3718': ProvinciaEnum.FORMOSA,

  // ===== Misiones =====
  '376': ProvinciaEnum.MISIONES,
  '3741': ProvinciaEnum.MISIONES, '3743': ProvinciaEnum.MISIONES,
  '3744': ProvinciaEnum.MISIONES, '3751': ProvinciaEnum.MISIONES,
  '3752': ProvinciaEnum.MISIONES, '3754': ProvinciaEnum.MISIONES,
  '3755': ProvinciaEnum.MISIONES, '3756': ProvinciaEnum.MISIONES,
  '3757': ProvinciaEnum.MISIONES, '3758': ProvinciaEnum.MISIONES,

  // ===== Corrientes =====
  '379': ProvinciaEnum.CORRIENTES,
  '3772': ProvinciaEnum.CORRIENTES, '3773': ProvinciaEnum.CORRIENTES,
  '3774': ProvinciaEnum.CORRIENTES, '3775': ProvinciaEnum.CORRIENTES,
  '3777': ProvinciaEnum.CORRIENTES, '3781': ProvinciaEnum.CORRIENTES,
  '3782': ProvinciaEnum.CORRIENTES, '3783': ProvinciaEnum.CORRIENTES,

  // ===== La Pampa =====
  '2302': ProvinciaEnum.LA_PAMPA, '2333': ProvinciaEnum.LA_PAMPA,
  '2334': ProvinciaEnum.LA_PAMPA, '2335': ProvinciaEnum.LA_PAMPA,
  '2336': ProvinciaEnum.LA_PAMPA, '2337': ProvinciaEnum.LA_PAMPA,
  '2338': ProvinciaEnum.LA_PAMPA, '2952': ProvinciaEnum.LA_PAMPA,
  '2953': ProvinciaEnum.LA_PAMPA, '2954': ProvinciaEnum.LA_PAMPA,

  // ===== Neuquén =====
  '299': ProvinciaEnum.NEUQUEN,
  '2942': ProvinciaEnum.NEUQUEN, '2948': ProvinciaEnum.NEUQUEN,

  // ===== Río Negro =====
  '294': ProvinciaEnum.RIO_NEGRO, '298': ProvinciaEnum.RIO_NEGRO,
  '2920': ProvinciaEnum.RIO_NEGRO, '2934': ProvinciaEnum.RIO_NEGRO,
  '2940': ProvinciaEnum.RIO_NEGRO, '2941': ProvinciaEnum.RIO_NEGRO,

  // ===== Chubut =====
  '280': ProvinciaEnum.CHUBUT,
  '2945': ProvinciaEnum.CHUBUT, '2965': ProvinciaEnum.CHUBUT,

  // ===== Santa Cruz =====
  '2902': ProvinciaEnum.SANTA_CRUZ, '2962': ProvinciaEnum.SANTA_CRUZ,
  '2963': ProvinciaEnum.SANTA_CRUZ, '2966': ProvinciaEnum.SANTA_CRUZ,

  // ===== Tierra del Fuego =====
  '2901': ProvinciaEnum.TIERRA_DEL_FUEGO, '2964': ProvinciaEnum.TIERRA_DEL_FUEGO,
};

// Cache de prefijos ordenados por longitud descendente — evita reordenar en
// cada lookup. Se calcula una sola vez al cargar el módulo.
const PREFIXES_BY_LENGTH = Object.keys(AREA_CODE_TO_PROVINCIA)
  .sort((a, b) => b.length - a.length);

/**
 * Devuelve los últimos 10 dígitos del teléfono (= número significativo
 * nacional argentino, código de área + abonado), igual que PhoneNormalizer
 * del backend. Strippea +54 y el 9 inicial de móvil si están presentes.
 *
 * Devuelve null si no hay 10 dígitos disponibles (número incompleto / inválido).
 */
const normalizeArgentinaPhone = (telefono: string): string | null => {
  if (!telefono) return null;
  const digits = telefono.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
};

/**
 * Detecta la provincia argentina de un teléfono mirando el código de área.
 * Usa longest-prefix match contra `AREA_CODE_TO_PROVINCIA`.
 *
 * @returns la provincia detectada o `null` si no matchea ningún prefijo
 *          conocido (teléfono extranjero, mal cargado, etc.).
 */
export const provinciaFromTelefono = (telefono: string): ProvinciaEnum | null => {
  const normalized = normalizeArgentinaPhone(telefono);
  if (!normalized) return null;

  for (const prefix of PREFIXES_BY_LENGTH) {
    if (normalized.startsWith(prefix)) {
      return AREA_CODE_TO_PROVINCIA[prefix];
    }
  }
  return null;
};
