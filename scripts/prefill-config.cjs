const fs = require("fs");
const path = require("path");

const deploymentPath = path.join(__dirname, "..", "google-app", "deployment.json");
const googleAppDir = path.join(__dirname, "..", "google-app");

function readDeployment() {
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Missing ${deploymentPath}. Deploy the contract first.`);
  }
  return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
}

function writeEnvFile(filePath, vars) {
  const lines = Object.entries(vars).map(([key, value]) => `${key}=${value}`);
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}

function updateAppsScript(deployment) {
  const appsScriptPath = path.join(googleAppDir, "apps-script", "Code.gs");
  let content = fs.readFileSync(appsScriptPath, "utf8");
  content = content.replace(
    /const CONTRACT_ADDRESS = '[^']*';/,
    `const CONTRACT_ADDRESS = '${deployment.contractAddress}';`,
  );
  content = content.replace(
    /const RPC_URL = '[^']*';/,
    `const RPC_URL = '${deployment.rpcUrl}';`,
  );
  fs.writeFileSync(appsScriptPath, content);
}

function main() {
  const deployment = readDeployment();
  const envVars = {
    VITE_CONTRACT_ADDRESS: deployment.contractAddress,
    VITE_RPC_URL: deployment.rpcUrl,
  };

  writeEnvFile(path.join(googleAppDir, ".env"), envVars);
  writeEnvFile(path.join(googleAppDir, ".env.production"), envVars);
  updateAppsScript(deployment);

  const configTsPath = path.join(googleAppDir, "src", "config.ts");
  let configTs = fs.readFileSync(configTsPath, "utf8");
  configTs = configTs.replace(
    /export const DEFAULT_RPC_URL = '[^']*'/,
    `export const DEFAULT_RPC_URL = '${deployment.rpcUrl}'`,
  );
  configTs = configTs.replace(
    /export const DEFAULT_CONTRACT_ADDRESS = '[^']*'/,
    `export const DEFAULT_CONTRACT_ADDRESS = '${deployment.contractAddress}'`,
  );
  fs.writeFileSync(configTsPath, configTs);

  console.log("Prefilled config for", deployment.contractAddress);
}

main();
