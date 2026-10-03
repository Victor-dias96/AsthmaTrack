export const PWA_INSTALL_BUTTON_LABEL = "Instalar AsthmaTrack";
export const PWA_INSTALL_BUSY_LABEL = "Preparando instalação...";
export const PWA_INSTALL_ACCEPTED_MESSAGE = "Instalação iniciada.";
export const PWA_INSTALL_DISMISSED_MESSAGE = "Instalação cancelada.";
export const PWA_INSTALL_SUCCESS_MESSAGE = "AsthmaTrack instalado com sucesso.";
export const PWA_INSTALL_ERROR_MESSAGE =
  "Não foi possível iniciar a instalação. Tente novamente pelo menu do navegador.";
export const PWA_INSTALL_BROWSER_MENU_NOTE =
  "A instalação pode estar disponível pelo menu do navegador.";

export type PwaInstallFeedback =
  "accepted" | "dismissed" | "error" | "installed" | null;

export type PwaInstallCardModel = {
  showCard: boolean;
  showButton: boolean;
  buttonLabel: string;
  buttonDisabled: boolean;
  statusMessage: string | null;
  showBrowserMenuNote: boolean;
};

export function getPwaInstallCardModel(input: {
  canInstall: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  installCompleted: boolean;
  feedback: PwaInstallFeedback;
}): PwaInstallCardModel {
  const showButton =
    !input.isInstalled &&
    !input.installCompleted &&
    (input.canInstall || input.isInstalling);

  const showCard = input.installCompleted || !input.isInstalled;

  let statusMessage: string | null = null;

  if (input.installCompleted || input.feedback === "installed") {
    statusMessage = PWA_INSTALL_SUCCESS_MESSAGE;
  } else if (input.feedback === "accepted") {
    statusMessage = PWA_INSTALL_ACCEPTED_MESSAGE;
  } else if (input.feedback === "dismissed") {
    statusMessage = PWA_INSTALL_DISMISSED_MESSAGE;
  } else if (input.feedback === "error") {
    statusMessage = PWA_INSTALL_ERROR_MESSAGE;
  }

  const showBrowserMenuNote =
    showCard &&
    !showButton &&
    statusMessage !== PWA_INSTALL_SUCCESS_MESSAGE &&
    statusMessage !== PWA_INSTALL_ACCEPTED_MESSAGE &&
    statusMessage !== PWA_INSTALL_ERROR_MESSAGE;

  return {
    showCard,
    showButton,
    buttonLabel: input.isInstalling
      ? PWA_INSTALL_BUSY_LABEL
      : PWA_INSTALL_BUTTON_LABEL,
    buttonDisabled: input.isInstalling || !input.canInstall,
    statusMessage: showCard ? statusMessage : null,
    showBrowserMenuNote,
  };
}
