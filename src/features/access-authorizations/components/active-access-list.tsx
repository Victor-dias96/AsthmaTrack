import { ActiveAccessItem } from "./active-access-item";
import type { ActiveAccessAuthorization } from "../types/active-access-authorization";

type ActiveAccessListProps = {
  authorizations: readonly ActiveAccessAuthorization[];
};

/**
 * Reusable, presentational active-access list (Issue 104). Performs no
 * Supabase query, no authentication and no revocation; accepts only
 * minimal serializable display data and never mutates it. The authorization
 * id is used solely as the stable React key.
 */
export function ActiveAccessList({ authorizations }: ActiveAccessListProps) {
  return (
    <ul className="space-y-3">
      {authorizations.map((authorization) => (
        <ActiveAccessItem key={authorization.id} authorization={authorization} />
      ))}
    </ul>
  );
}
