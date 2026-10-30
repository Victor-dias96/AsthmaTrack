"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { MAIN_CONTENT_ID } from "./main-content";

/**
 * After a pathname change, move focus to the main region only when the
 * previous control has unmounted and focus would otherwise sit on the body.
 */
export function RestoreFocusOnPathnameChange() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    const active = document.activeElement;
    const focusLost =
      active == null ||
      active === document.body ||
      active === document.documentElement;

    if (!focusLost) {
      return;
    }

    const main = document.getElementById(MAIN_CONTENT_ID);
    if (main instanceof HTMLElement) {
      main.focus();
    }
  }, [pathname]);

  return null;
}
