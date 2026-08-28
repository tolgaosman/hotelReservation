import type { FormResult } from "./types";

/**
 * Laravel's 422 envelope is `{ success, message, data: { field: [msgs] } }`;
 * api.ts's response interceptor already camelCases those field keys, so a
 * key here matches the camelCase prop the frontend already sends the field
 * under (e.g. `guest_id` -> `guestId`).
 */
export function extractFormError(err: any, fallback: string): FormResult & { ok: false } {
  const status = err?.response?.status;
  const fieldErrors: Record<string, string[]> | undefined =
    status === 422 ? err.response?.data?.errors : undefined;

  return {
    ok: false,
    error: err?.response?.data?.message || fallback,
    fieldErrors,
  };
}

/** First message for a field, for a single-line `FormField error=` prop. */
export function fieldError(fieldErrors: Record<string, string[]> | undefined, field: string): string | undefined {
  return fieldErrors?.[field]?.[0];
}
