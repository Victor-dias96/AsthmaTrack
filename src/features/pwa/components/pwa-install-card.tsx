"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { AppButton } from "@/components/ui/app-button";
import { AppCard, AppCardHeader } from "@/components/ui/app-card";
import {
  PWA_INSTALL_BROWSER_MENU_NOTE,
  getPwaInstallCardModel,
  type PwaInstallFeedback,
} from "../lib/get-pwa-install-card-model";
import { usePwaInstallationContext } from "./pwa-installation-provider";

const CARD_DESCRIPTION =
  "Adicione o AsthmaTrack à tela inicial quando o navegador oferecer essa opção.";

export function PwaInstallCard() {
  const installation = usePwaInstallationContext();
  const [feedback, setFeedback] = useState<PwaInstallFeedback>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const model = getPwaInstallCardModel({
    canInstall: installation.canInstall,
    isInstalled: installation.isInstalled,
    isInstalling: installation.isInstalling,
    installCompleted: installation.installCompleted,
    feedback,
  });

  async function handleInstall() {
    const result = await installation.install();

    if (!mountedRef.current || result.status === "unavailable") {
      return;
    }

    if (
      result.status === "accepted" ||
      result.status === "dismissed" ||
      result.status === "error"
    ) {
      setFeedback(result.status);
    }
  }

  if (!model.showCard) {
    return null;
  }

  return (
    <AppCard>
      <AppCardHeader
        title="Aplicativo"
        description={
          installation.installCompleted ? undefined : CARD_DESCRIPTION
        }
      />
      <div className="flex min-w-0 flex-col items-stretch gap-3 sm:items-start">
        {model.showButton ? (
          <AppButton
            type="button"
            variant="outline"
            onClick={handleInstall}
            disabled={model.buttonDisabled}
            aria-busy={installation.isInstalling}
            className="h-auto min-h-12 w-full whitespace-normal px-4 py-2.5 sm:w-auto"
          >
            <Download size={16} aria-hidden="true" />
            {model.buttonLabel}
          </AppButton>
        ) : null}
        {model.showBrowserMenuNote ? (
          <p className="max-w-full text-sm leading-relaxed text-[var(--at-text-secondary)]">
            {PWA_INSTALL_BROWSER_MENU_NOTE}
          </p>
        ) : null}
        <div aria-live="polite">
          {model.statusMessage ? (
            <p
              role="status"
              className="max-w-full text-sm leading-relaxed text-[var(--at-text-secondary)]"
            >
              {model.statusMessage}
            </p>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
}
