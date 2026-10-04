import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest does not expose afterEach as a global, so React Testing Library
// does not register cleanup on its own. Register it once here.
afterEach(() => {
  cleanup();
});
