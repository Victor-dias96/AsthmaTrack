"use client";

import { useEffect } from "react";

const TITLE_SUFFIX = " | AsthmaTrack";

/**
 * Next.js keeps the matched page's static metadata when notFound() renders
 * a nested not-found boundary. Set the generic inaccessible title after
 * render so the document title matches the heading and never keeps a
 * patient name, record id or health value.
 */
export function InaccessibleDocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title}${TITLE_SUFFIX}`;
  }, [title]);

  return null;
}
