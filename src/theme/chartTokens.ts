// Chart tokens for libraries that don't read the MUI theme (Recharts).
// These are CSS variable references — valid as `fill`/`stroke`/`color` in SVG
// and HTML — so charts follow the active color scheme with zero re-render.
//
// Usage:
//   import { CHART_SERIES, CHART_AXIS, CHART_GRID, CHART_TOOLTIP_BG } from '@/theme/chartTokens'
//   <Bar fill={CHART_SERIES[0]} />
//   <CartesianGrid stroke={CHART_GRID} />
//   <XAxis tick={{ fill: CHART_AXIS }} stroke={CHART_AXIS} />
//   <Tooltip contentStyle={{ backgroundColor: CHART_TOOLTIP_BG, border: 'none' }} />
//
// Never hardcode a series color in a chart component — pick by index from
// CHART_SERIES (stable order = stable meaning across the app).

const v = (name: string) => `var(--mui-palette-charts-${name})`;

export const CHART_SERIES: readonly string[] = [
  v('serie1'),
  v('serie2'),
  v('serie3'),
  v('serie4'),
  v('serie5'),
  v('serie6'),
  v('serie7'),
  v('serie8'),
];

export const CHART_AXIS = v('axis');
export const CHART_GRID = v('grid');
export const CHART_TOOLTIP_BG = v('tooltipBg');

/** Text color for tooltip content, follows the scheme. */
export const CHART_TOOLTIP_TEXT = 'var(--mui-palette-text-primary)';

/** Pick a series color by index, cycling when there are more series than tokens. */
export const chartSerie = (index: number): string =>
  CHART_SERIES[index % CHART_SERIES.length];
