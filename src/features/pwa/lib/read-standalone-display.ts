const STANDALONE_DISPLAY_QUERY = "(display-mode: standalone)";

type DisplayModeQueryList = {
  matches: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

export type StandaloneDisplaySource = {
  matchMedia?: (query: string) => DisplayModeQueryList;
  navigator?: object;
};

/**
 * Installed-mode check. A browser tab is not treated as installed.
 * `navigator.standalone` covers older iOS WebKit without replacing the
 * standard display-mode query.
 */
export function readStandaloneDisplay(
  source: StandaloneDisplaySource
): boolean {
  try {
    if (source.matchMedia?.(STANDALONE_DISPLAY_QUERY)?.matches === true) {
      return true;
    }
  } catch {
    // An unusual browsing context must not be reported as installed.
  }

  return readNavigatorStandalone(source.navigator);
}

export function subscribeStandaloneDisplay(
  source: StandaloneDisplaySource,
  onChange: () => void
): () => void {
  let media: DisplayModeQueryList;

  try {
    const queryList = source.matchMedia?.(STANDALONE_DISPLAY_QUERY);
    if (!queryList) {
      return () => {};
    }
    media = queryList;
  } catch {
    return () => {};
  }

  if (typeof media.addEventListener !== "function") {
    return () => {};
  }

  const listener = () => {
    onChange();
  };

  media.addEventListener("change", listener);

  return () => {
    if (typeof media.removeEventListener === "function") {
      media.removeEventListener("change", listener);
    }
  };
}

function readNavigatorStandalone(navigator: object | undefined): boolean {
  if (!navigator || !("standalone" in navigator)) {
    return false;
  }

  const standalone = navigator.standalone;
  return standalone === true;
}
