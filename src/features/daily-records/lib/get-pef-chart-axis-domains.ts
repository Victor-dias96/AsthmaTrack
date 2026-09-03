type NumberDomain = readonly [min: number, max: number];

const Y_DOMAIN_PADDING_RATIO = 0.1;
const Y_DOMAIN_MIN_SPAN_PADDING = 10;
const Y_EQUAL_VALUE_PADDING_RATIO = 0.1;
const Y_EQUAL_VALUE_MIN_PADDING = 20;
const X_EQUAL_TIMESTAMP_PADDING_MS = 60 * 60 * 1000;

function sanitizeObservedPefBound(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

/**
 * Neutral visual Y domain from observed PEF values.
 * Includes every finite supplied value, never goes negative, and keeps a
 * non-zero interval when all points share the same PEF.
 */
export function getPefYAxisDomain([
  dataMin,
  dataMax,
]: NumberDomain): NumberDomain {
  const observedMin = sanitizeObservedPefBound(Math.min(dataMin, dataMax));
  const observedMax = sanitizeObservedPefBound(Math.max(dataMin, dataMax));

  if (observedMin === observedMax) {
    const padding = Math.max(
      Y_EQUAL_VALUE_MIN_PADDING,
      Math.round(observedMin * Y_EQUAL_VALUE_PADDING_RATIO)
    );
    const lower = Math.max(0, Math.floor(observedMin - padding));
    const upper = Math.ceil(observedMax + padding);

    if (upper <= lower) {
      return [lower, lower + Y_EQUAL_VALUE_MIN_PADDING];
    }

    return [lower, upper];
  }

  const span = observedMax - observedMin;
  const padding = Math.max(
    Y_DOMAIN_MIN_SPAN_PADDING,
    Math.round(span * Y_DOMAIN_PADDING_RATIO)
  );
  const lower = Math.max(0, Math.floor(observedMin - padding));
  const upper = Math.ceil(observedMax + padding);

  if (upper <= lower) {
    return [lower, lower + Y_DOMAIN_MIN_SPAN_PADDING];
  }

  return [lower, upper];
}

/**
 * Data-based X domain from recorded timestamps.
 * Pads only when every point shares the same instant so a single point
 * remains visible.
 */
export function getPefXAxisDomain([
  dataMin,
  dataMax,
]: NumberDomain): NumberDomain {
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return [0, 1];
  }

  const min = Math.min(dataMin, dataMax);
  const max = Math.max(dataMin, dataMax);

  if (min === max) {
    return [
      min - X_EQUAL_TIMESTAMP_PADDING_MS,
      max + X_EQUAL_TIMESTAMP_PADDING_MS,
    ];
  }

  return [min, max];
}
