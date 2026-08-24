import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import { ContractFactory, JsonRpcProvider } from "ethers";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const localRpc = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
const publicRpc = process.env.PUBLIC_RPC_URL || process.env.SEPOLIA_RPC_URL || localRpc;

function compileMeta() {
  const source = fs.readFileSync(path.join(rootDir, "meta.sol"), "utf8");
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

async function main() {
  const provider = new JsonRpcProvider(localRpc);
  const signer = await provider.getSigner(0);
  const network = await provider.getNetwork();
  const deployer = await signer.getAddress();

  const { abi, bytecode } = compileMeta();
  const factory = new ContractFactory(abi, bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const deployment = {
    contractAddress: await contract.getAddress(),
    deployer,
    chainId: Number(network.chainId),
    network: network.name,
    rpcUrl: publicRpc,
    localRpcUrl: localRpc,
    deployedAt: new Date().toISOString(),
    environment: Number(network.chainId) === 31337 ? "anvil-demo" : "remote",
  };

  const deploymentPath = path.join(rootDir, "google-app", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
