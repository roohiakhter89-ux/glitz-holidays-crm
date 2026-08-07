/**
 * class-validator's @IsOptional() skips validation for `null` as well as
 * `undefined`, so `{"travelDate": null}` reaches the service as a real null.
 * `new Date(null)` is 1970-01-01, not an error — which means "clear this date"
 * silently writes an epoch date instead.
 *
 * Use this for every nullable date column that a PATCH can touch.
 */
export function toDateOrNull(
  value: string | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
