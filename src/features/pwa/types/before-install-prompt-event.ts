/**
 * Narrow local types for the non-standard Chromium installation event.
 * Only the fields this feature calls are modeled. The event stays in
 * client memory and is never serialized, stored, or sent to the server.
 */
export type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
};

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
}

export function isBeforeInstallPromptEvent(
  event: Event
): event is BeforeInstallPromptEvent {
  if (!("prompt" in event) || !("userChoice" in event)) {
    return false;
  }

  const prompt = event.prompt;
  const userChoice = event.userChoice;

  return typeof prompt === "function" && isThenable(userChoice);
}

function isThenable(
  value: unknown
): value is Promise<BeforeInstallPromptChoice> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof value.then === "function"
  );
}
