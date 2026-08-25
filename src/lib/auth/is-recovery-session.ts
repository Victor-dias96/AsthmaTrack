type AmrEntry = {
  method?: string;
};

function readAmr(claims: unknown): AmrEntry[] | null {
  if (!claims || typeof claims !== "object") {
    return null;
  }

  const amr = (claims as { amr?: unknown }).amr;
  if (!Array.isArray(amr)) {
    return null;
  }

  return amr as AmrEntry[];
}

export function hasRecoveryAmr(claims: unknown): boolean {
  const amr = readAmr(claims);
  if (!amr) {
    return false;
  }

  return amr.some((entry) => entry?.method === "recovery");
}
