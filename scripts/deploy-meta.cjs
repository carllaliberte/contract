const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("Network:", network.name, network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH");

  const META = await hre.ethers.getContractFactory("META");
  const meta = await META.deploy();
  await meta.waitForDeployment();

  const address = await meta.getAddress();
  const rpcUrl =
    process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

  console.log("META deployed to:", address);

  const deployment = {
    contractAddress: address,
    deployer: deployer.address,
    chainId: Number(network.chainId),
    network: network.name,
    rpcUrl,
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "..", "google-app", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("Wrote", deploymentPath);

  return deployment;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
