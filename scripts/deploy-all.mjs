#!/usr/bin/env node
/**
 * Full deploy: local Anvil contract + prefill + build + GitHub Pages.
 * Requires: anvil on LOCAL_RPC_URL (default http://127.0.0.1:8545)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function waitForRpc(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
      });
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`RPC not ready at ${url}`);
}

async function main() {
  const localRpc = process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545';
  const publicRpc = process.env.PUBLIC_RPC_URL || process.env.SEPOLIA_RPC_URL || localRpc;

  await waitForRpc(localRpc);

  run('node', ['scripts/deploy-local.mjs'], {
    env: { LOCAL_RPC_URL: localRpc, PUBLIC_RPC_URL: publicRpc },
  });
  run('node', ['scripts/prefill-config.cjs']);

  const deployment = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'google-app', 'deployment.json'), 'utf8'),
  );

  run('npm', ['run', 'build'], {
    cwd: path.join(rootDir, 'google-app'),
    env: {
      VITE_BASE_PATH: process.env.VITE_BASE_PATH || '',
      VITE_CONTRACT_ADDRESS: deployment.contractAddress,
      VITE_RPC_URL: deployment.rpcUrl,
    },
  });

  if (process.env.SKIP_GH_PAGES !== '1') {
    run('npx', ['gh-pages', '-d', 'dist', '-m', 'Deploy META dashboard'], {
      cwd: path.join(rootDir, 'google-app'),
    });
  }

  console.log('\nDeployment complete:');
  console.log(JSON.stringify(deployment, null, 2));
  console.log('\nGitHub Pages: https://carllaliberte.github.io/contract/');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
