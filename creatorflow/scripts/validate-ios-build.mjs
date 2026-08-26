/**
 * Pre-flight checks for iOS / App Store builds.
 * Invoked by `npm run build:ios` before Vite build.
 */
const fatal = (message) => {
  console.error(`\n[FATAL ios-build] ${message}\n`);
  process.exit(1);
};

if (process.env.VITE_AUTH_STUB === "true") {
  fatal(
    "VITE_AUTH_STUB=true is forbidden for iOS builds. Remove it from .env and never set it for App Store archives.",
  );
}

if (process.env.VITE_BASE_PATH && process.env.VITE_BASE_PATH !== "/") {
  fatal(
    `VITE_BASE_PATH must be "/" for native iOS (got "${process.env.VITE_BASE_PATH}"). Use npm run build:ios, not npm run build.`,
  );
}

console.log("[ios-build] Pre-flight checks passed (no VITE_AUTH_STUB, base path OK).");
