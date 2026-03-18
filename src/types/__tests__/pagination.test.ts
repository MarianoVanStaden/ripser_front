import { describe, it, expect } from 'vitest';
import { EMPTY_PAGE, arrayToPage } from '../pagination.types';

describe('pagination.types', () => {
  describe('EMPTY_PAGE', () => {
    it('has empty content', () => {
      expect(EMPTY_PAGE.content).toEqual([]);
      expect(EMPTY_PAGE.totalElements).toBe(0);
      expect(EMPTY_PAGE.totalPages).toBe(0);
      expect(EMPTY_PAGE.empty).toBe(true);
      expect(EMPTY_PAGE.first).toBe(true);
      expect(EMPTY_PAGE.last).toBe(true);
    });
  });

  describe('arrayToPage', () => {
    it('wraps an array into a PageResponse', () => {
      const items = ['a', 'b', 'c'];
      const page = arrayToPage(items);

      expect(page.content).toEqual(['a', 'b', 'c']);
      expect(page.totalElements).toBe(3);
      expect(page.totalPages).toBe(1);
      expect(page.empty).toBe(false);
      expect(page.first).toBe(true);
      expect(page.last).toBe(true);
    });

    it('paginates correctly', () => {
      const items = Array.from({ length: 50 }, (_, i) => `item${i}`);

      const page0 = arrayToPage(items, 0, 20);
      expect(page0.content).toHaveLength(20);
      expect(page0.first).toBe(true);
      expect(page0.last).toBe(false);
      expect(page0.totalPages).toBe(3);

      const page1 = arrayToPage(items, 1, 20);
      expect(page1.content).toHaveLength(20);
      expect(page1.first).toBe(false);
      expect(page1.last).toBe(false);

      const page2 = arrayToPage(items, 2, 20);
      expect(page2.content).toHaveLength(10);
      expect(page2.last).toBe(true);
    });

    it('handles empty array', () => {
      const page = arrayToPage([]);
      expect(page.content).toEqual([]);
      expect(page.totalElements).toBe(0);
      expect(page.empty).toBe(true);
    });

    it('handles custom page size', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const page = arrayToPage(items, 0, 2);

      expect(page.content).toEqual(['a', 'b']);
      expect(page.totalPages).toBe(3);
      expect(page.numberOfElements).toBe(2);
    });

    it('returns empty content for out-of-range page', () => {
      const items = ['a', 'b'];
      const page = arrayToPage(items, 5, 20);

      expect(page.content).toEqual([]);
      expect(page.empty).toBe(true);
    });
  });
});
