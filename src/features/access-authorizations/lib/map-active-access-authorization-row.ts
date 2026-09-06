/** Exact shape returned by `public.get_patient_active_access_authorizations`. */
export type ActiveAccessAuthorizationRow = {
  authorizationId: string;
  professionalId: string;
  professionalFullName: string | null;
  grantedAt: string;
};

type RawActiveAccessAuthorizationRow = {
  authorization_id: string;
  professional_id: string;
  professional_full_name: string | null;
  granted_at: string;
};

function isRawActiveAccessAuthorizationRow(
  value: unknown
): value is RawActiveAccessAuthorizationRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.authorization_id === "string" &&
    typeof record.professional_id === "string" &&
    (record.professional_full_name === null ||
      typeof record.professional_full_name === "string") &&
    typeof record.granted_at === "string"
  );
}

/**
 * Validates and extracts every row `get_patient_active_access_authorizations`
 * returns. The project has no generated Database types, so the RPC response
 * is treated as `unknown` and checked at runtime rather than trusted via an
 * unsafe type assertion. Returns `null` when the response shape does not
 * match what the RPC is documented to return -- the caller must treat that
 * as unavailable, never as an empty list.
 */
export function parseActiveAccessAuthorizationRows(
  data: unknown
): ActiveAccessAuthorizationRow[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const rows: ActiveAccessAuthorizationRow[] = [];

  for (const item of data) {
    if (!isRawActiveAccessAuthorizationRow(item)) {
      return null;
    }

    rows.push({
      authorizationId: item.authorization_id,
      professionalId: item.professional_id,
      professionalFullName: item.professional_full_name,
      grantedAt: item.granted_at,
    });
  }

  return rows;
}
