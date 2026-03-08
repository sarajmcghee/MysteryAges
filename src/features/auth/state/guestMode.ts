const GUEST_MODE_KEY = "party-leader-guest-mode-v1";

export function isGuestModeEnabled(): boolean {
  return window.localStorage.getItem(GUEST_MODE_KEY) === "true";
}

export function setGuestModeEnabled(enabled: boolean): void {
  if (enabled) {
    window.localStorage.setItem(GUEST_MODE_KEY, "true");
    return;
  }
  window.localStorage.removeItem(GUEST_MODE_KEY);
}
