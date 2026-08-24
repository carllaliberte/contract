import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import { ContractFactory, JsonRpcProvider, Wallet, formatEther } from "ethers";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DEFAULT_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

function compileMeta() {
  const sourcePath = path.join(rootDir, "meta.sol");
  const source = fs.readFileSync(sourcePath, "utf8");
  const input = {
    language: "Solidity",
    sources: { "meta.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors) {
    const fatal = output.errors.filter((error) => error.severity === "error");
    if (fatal.length > 0) {
      throw new Error(fatal.map((error) => error.formattedMessage).join("\n"));
    }
  }

  const artifact = output.contracts["meta.sol"].META;
  return {
    abi: artifact.abi,
    bytecode: `0x${artifact.evm.bytecode.object}`,
  };
}

async function requestFaucet(address) {
  const endpoints = [
    {
      name: "sepoliafaucet.com",
      url: "https://sepoliafaucet.com/",
      body: null,
    },
  ];

  try {
    const response = await fetch("https://faucet.quicknode.com/ethereum/sepolia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (response.ok) {
      console.log("QuickNode faucet response:", await response.text());
      return true;
    }
  } catch {
    // ignore faucet errors
  }

  for (const endpoint of endpoints) {
    console.log(`Tried faucet: ${endpoint.name}`);
  }

  return false;
}

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY before deploying.");
  }

  const provider = new JsonRpcProvider(DEFAULT_RPC_URL);
  const wallet = new Wallet(privateKey, provider);
  const network = await provider.getNetwork();
  let balance = await provider.getBalance(wallet.address);

  console.log("Network:", network.name, network.chainId.toString());
  console.log("Deployer:", wallet.address);
  console.log("Balance:", formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("Balance is zero. Requesting test ETH from public faucet...");
    await requestFaucet(wallet.address);
    await new Promise((resolve) => setTimeout(resolve, 15000));
    balance = await provider.getBalance(wallet.address);
    console.log("Balance after faucet:", formatEther(balance), "ETH");
  }

  if (balance === 0n) {
    throw new Error(
      "Deployer wallet has no Sepolia ETH. Send test ETH to " + wallet.address,
    );
  }

  const { abi, bytecode } = compileMeta();
  const factory = new ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  const deployment = {
    contractAddress,
    deployer: wallet.address,
    chainId: Number(network.chainId),
    network: network.name,
    rpcUrl: DEFAULT_RPC_URL,
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(rootDir, "google-app", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("META deployed to:", contractAddress);
  console.log("Wrote", deploymentPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
