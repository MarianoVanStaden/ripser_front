/**
 * Mirrors Spring Boot's Page<T> response structure.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Parameters to send to paginated endpoints.
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Empty page constant for initial state.
 */
export const EMPTY_PAGE: PageResponse<never> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
};

/**
 * Wraps a plain array into a PageResponse structure.
 * Useful for mock/fallback APIs.
 */
export function arrayToPage<T>(items: T[], page = 0, size = 20): PageResponse<T> {
  const start = page * size;
  const content = items.slice(start, start + size);
  return {
    content,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    size,
    number: page,
    first: page === 0,
    last: start + size >= items.length,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}
