// Match aproximado de strings para el importador de listados de precios.
// Pensado para nombres con variaciones tipográficas habituales: tildes, espacios
// extra, signos (1,20 vs 1.20 mts), mayúsculas, palabras intercaladas
// ("Heladera Exhibidora CUBE 1.20 mts" vs "Heladera CUBE 1,20").

// Normaliza: minúsculas, sin tildes, sin signos no alfanuméricos, espacios
// colapsados. Mantenemos los dígitos para que "1.20" y "1,20" colapsen al
// mismo "120".
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // sin tildes
    .replace(/[.,]/g, '')                                // "1.20" → "120"
    .replace(/[^a-z0-9\s]/g, ' ')                        // resto a espacio
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (s: string): string[] => normalize(s).split(' ').filter(Boolean);

/**
 * Jaccard sobre tokens + bonus si los tokens "numéricos" coinciden.
 * Los números son la señal más fuerte (1,20 vs 1,50 son productos distintos
 * aunque tengan 95% de palabras en común).
 */
export const similarity = (a: string, b: string): number => {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;

  let inter = 0;
  ta.forEach(t => { if (tb.has(t)) inter++; });
  const union = ta.size + tb.size - inter;
  const jaccard = inter / union;

  // Penalización fuerte si difieren los tokens numéricos.
  const numsA = [...ta].filter(t => /\d/.test(t)).sort().join(',');
  const numsB = [...tb].filter(t => /\d/.test(t)).sort().join(',');
  if (numsA && numsB && numsA !== numsB) {
    return jaccard * 0.5; // los números no matchean → la match es débil
  }
  return jaccard;
};

export interface MatchCandidate<T> {
  item: T;
  score: number;
}

/**
 * Para una entrada de listado, devuelve top-N candidatos ordenados por score.
 */
export const findCandidates = <T>(
  query: string,
  catalog: T[],
  getText: (t: T) => string,
  topN = 5,
): MatchCandidate<T>[] => {
  return catalog
    .map(item => ({ item, score: similarity(query, getText(item)) }))
    .filter(c => c.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};
