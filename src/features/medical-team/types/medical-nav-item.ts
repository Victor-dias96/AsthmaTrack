import type { ComponentType } from "react";

/**
 * One medical-team navigation destination. Deliberately narrow: no patient
 * links, no dynamic patient routes, no badges or counts. `icon` is an
 * un-rendered Lucide icon component so desktop and mobile navigation can
 * each size it independently from one shared, typed configuration.
 */
export type MedicalNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
};
