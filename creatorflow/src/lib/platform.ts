import { Capacitor } from "@capacitor/core";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isNativeIos(): boolean {
  return Capacitor.getPlatform() === "ios";
}

export function isNativeAndroid(): boolean {
  return Capacitor.getPlatform() === "android";
}
