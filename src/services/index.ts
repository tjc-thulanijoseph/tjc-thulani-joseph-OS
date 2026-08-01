import { unconfiguredServices } from "./providers/unconfigured";
import type { ServiceContainer } from "./types";

/**
 * Service locator. Swap the active container here (or call `setServices`
 * during bootstrap) when a backend provider is introduced — no component,
 * hook or route needs to change.
 */
let container: ServiceContainer = unconfiguredServices;

export function setServices(next: ServiceContainer) {
  container = next;
}

export function services(): ServiceContainer {
  return container;
}

export const authService = {
  getSession: () => container.auth.getSession(),
  signIn: (...args: Parameters<ServiceContainer["auth"]["signIn"]>) => container.auth.signIn(...args),
  signOut: () => container.auth.signOut(),
  requestPasswordReset: (email: string) => container.auth.requestPasswordReset(email),
  updatePassword: (password: string) => container.auth.updatePassword(password),
  onAuthStateChange: (listener: Parameters<ServiceContainer["auth"]["onAuthStateChange"]>[0]) =>
    container.auth.onAuthStateChange(listener),
};

export * from "./types";
