/**
 * Widen Y-axis range so low test counts still read clearly on charts (not flat bumps).
 */
export function pronouncedChartMax(values: number[], minCeiling = 4): number {
  const m = values.length ? Math.max(0, ...values) : 0;
  if (m === 0) return minCeiling;
  if (m <= 1) return minCeiling;
  if (m <= 2) return Math.max(minCeiling, 4);
  return Math.max(minCeiling, Math.ceil(m * 1.2) + 1);
}

/** Boost sparkline amplitudes for display while preserving shape. */
export function emphasizeSparklineValues(values: number[]): number[] {
  const max = Math.max(0, ...values);
  if (max === 0) return values;
  const ceiling = pronouncedChartMax(values, 4);
  if (max >= ceiling * 0.6) return values;
  const factor = ceiling / max;
  return values.map((v) => (v <= 0 ? 0 : Math.min(ceiling, v * factor)));
}
