# META Google App

This folder contains a Google-friendly app for the `META` ERC-20 smart contract in [`meta.sol`](https://github.com/carllaliberte/contract/blob/main/meta.sol).

## What is included

1. **Web dashboard** (`google-app/`) — Vite + TypeScript app that reads token and wallet data from the blockchain.
2. **Firebase Hosting config** — deploy the dashboard to Google Firebase.
3. **Google Apps Script** (`google-app/apps-script/`) — sync contract data into Google Sheets.

## Quick start (local dashboard)

```bash
cd google-app
npm install
cp .env.example .env
# Edit .env with your deployed contract address and RPC URL
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Current deployment (prefilled)

Demo contract and config are in `google-app/deployment.json`:

| Field | Value |
| --- | --- |
| Contract | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Chain | Anvil local (chain ID `31337`) |
| RPC URL | `https://rendering-parker-mesh-henderson.trycloudflare.com` |
| Live dashboard | `https://some-turtles-tickle.loca.lt` |

Config is prefilled in:

- `google-app/.env.example`
- `google-app/src/config.ts`
- `google-app/apps-script/Code.gs`

**Note:** This demo uses a temporary public tunnel to a local Anvil node. For production, deploy the contract on Sepolia/mainnet and host on Firebase (see below).

### One-command demo redeploy

With Anvil running on `http://127.0.0.1:8545`:

```bash
npm install
npm run deploy:demo
```

## Deploy to Firebase Hosting

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/).
4. Set your project ID in `google-app/.firebaserc` (default: `carllaliberte-meta-dashboard`).
5. Build and deploy:

```bash
cd google-app
npm run build
npx firebase deploy --only hosting
```

Or with a CI token:

```bash
export FIREBASE_TOKEN=your_token_from_firebase_login_ci
cd google-app && npm run build && npx firebase deploy --only hosting
```

## Google Sheets integration

1. Create a new Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Copy `google-app/apps-script/Code.gs` into the script editor.
4. Set `CONTRACT_ADDRESS` and `RPC_URL` at the top of the file.
5. Save and reload the sheet. Use the **META Token** menu to refresh data.
6. On the **Wallet Balances** sheet, put wallet addresses in column A starting at row 2.

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_CONTRACT_ADDRESS` | Deployed `META` contract address |
| `VITE_RPC_URL` | JSON-RPC endpoint for the chain where the contract is deployed |

## Regenerate contract ABI

After changing `meta.sol` at the repo root:

```bash
cd google-app
npm run compile-contract
```

## Contract notes

The GitHub contract is a reflection-style ERC-20 token (`METAVERSE` / `META`) with:

- 2% transfer fee
- max transaction limit
- 20-second sell lock after buys from the Uniswap pair
- owner-only admin functions

This Google app is **read-only**. It does not deploy or transact with the contract.
