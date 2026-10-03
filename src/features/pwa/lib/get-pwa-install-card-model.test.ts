import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  PWA_INSTALL_ACCEPTED_MESSAGE,
  PWA_INSTALL_BUSY_LABEL,
  PWA_INSTALL_BUTTON_LABEL,
  PWA_INSTALL_DISMISSED_MESSAGE,
  PWA_INSTALL_ERROR_MESSAGE,
  PWA_INSTALL_SUCCESS_MESSAGE,
  getPwaInstallCardModel,
} from "./get-pwa-install-card-model";

const hidden = {
  canInstall: false,
  isInstalled: false,
  isInstalling: false,
  installCompleted: false,
  feedback: null,
} as const;

describe("getPwaInstallCardModel", () => {
  test("hides the button when installation is unavailable", () => {
    const model = getPwaInstallCardModel(hidden);

    assert.equal(model.showCard, true);
    assert.equal(model.showButton, false);
    assert.equal(model.showBrowserMenuNote, true);
    assert.equal(model.statusMessage, null);
  });

  test("shows the install label when an opportunity exists", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      canInstall: true,
    });

    assert.equal(model.showButton, true);
    assert.equal(model.buttonDisabled, false);
    assert.equal(model.buttonLabel, PWA_INSTALL_BUTTON_LABEL);
    assert.equal(model.buttonLabel, "Instalar AsthmaTrack");
    assert.equal(model.showBrowserMenuNote, false);
  });

  test("shows the busy label while a prompt is in progress", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      isInstalling: true,
    });

    assert.equal(model.showButton, true);
    assert.equal(model.buttonDisabled, true);
    assert.equal(model.buttonLabel, PWA_INSTALL_BUSY_LABEL);
    assert.equal(model.buttonLabel, "Preparando instalação...");
  });

  test("does not present dismissal as a technical failure", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      feedback: "dismissed",
    });

    assert.equal(model.showButton, false);
    assert.equal(model.statusMessage, PWA_INSTALL_DISMISSED_MESSAGE);
    assert.equal(model.statusMessage, "Instalação cancelada.");
    assert.notEqual(model.statusMessage, PWA_INSTALL_ERROR_MESSAGE);
  });

  test("keeps accepted feedback modest and separate from success", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      feedback: "accepted",
    });

    assert.equal(model.statusMessage, PWA_INSTALL_ACCEPTED_MESSAGE);
    assert.equal(model.statusMessage, "Instalação iniciada.");
    assert.equal(model.showButton, false);
    assert.notEqual(model.statusMessage, PWA_INSTALL_SUCCESS_MESSAGE);
  });

  test("uses the safe error sentence", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      feedback: "error",
    });

    assert.equal(model.statusMessage, PWA_INSTALL_ERROR_MESSAGE);
    assert.equal(
      model.statusMessage,
      "Não foi possível iniciar a instalação. Tente novamente pelo menu do navegador."
    );
    assert.equal(model.showButton, false);
    assert.equal(model.showBrowserMenuNote, false);
  });

  test("hides the action after appinstalled and announces success once", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      isInstalled: true,
      installCompleted: true,
      feedback: "installed",
    });

    assert.equal(model.showCard, true);
    assert.equal(model.showButton, false);
    assert.equal(model.statusMessage, PWA_INSTALL_SUCCESS_MESSAGE);
    assert.equal(model.statusMessage, "AsthmaTrack instalado com sucesso.");
  });

  test("hides the card when the app was already standalone", () => {
    const model = getPwaInstallCardModel({
      ...hidden,
      isInstalled: true,
    });

    assert.equal(model.showCard, false);
    assert.equal(model.showButton, false);
    assert.equal(model.statusMessage, null);
  });
});
