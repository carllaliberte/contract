import { Capacitor } from "@capacitor/core";

const KEY_PREFIX = "cf.secure.";

/**
 * Platform-aware secure storage.
 * - iOS/Android native: Keychain / EncryptedSharedPreferences via @aparajita/capacitor-secure-storage
 * - Web: sessionStorage fallback (never localStorage for secrets)
 */
async function getNativeStore() {
  if (!Capacitor.isNativePlatform()) return null;
  const { SecureStorage } = await import("@aparajita/capacitor-secure-storage");
  return SecureStorage;
}

function webGet(key: string): string | null {
  try {
    return sessionStorage.getItem(`${KEY_PREFIX}${key}`);
  } catch {
    return null;
  }
}

function webSet(key: string, value: string): void {
  sessionStorage.setItem(`${KEY_PREFIX}${key}`, value);
}

function webRemove(key: string): void {
  sessionStorage.removeItem(`${KEY_PREFIX}${key}`);
}

export async function secureGet(key: string): Promise<string | null> {
  const store = await getNativeStore();
  if (store) {
    const value = await store.getItem(key);
    return typeof value === "string" ? value : value === null ? null : String(value);
  }
  return webGet(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  const store = await getNativeStore();
  if (store) {
    await store.setItem(key, value);
    return;
  }
  webSet(key, value);
}

export async function secureRemove(key: string): Promise<void> {
  const store = await getNativeStore();
  if (store) {
    await store.removeItem(key);
    return;
  }
  webRemove(key);
}

export async function secureClear(keys: readonly string[]): Promise<void> {
  await Promise.all(keys.map((key) => secureRemove(key)));
}
