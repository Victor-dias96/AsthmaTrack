import type { Metadata } from "next";
import { OfflinePage } from "@/features/pwa/components/offline-page";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Sem conexão",
};

export default function OfflineRoutePage() {
  return <OfflinePage />;
}
