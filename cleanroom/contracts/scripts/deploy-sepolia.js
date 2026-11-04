const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const KNOWN_DEV_KEY_SHA256 = new Set([
  '60a09e4357868c1e9b801052726d061c370429f723db84523ed58ac354f6eb8a',
  'bc1a50966c9e6486bc4ebf880b51611a2a97fcb8e7a6976e9b81a9e3e8ca0e3c'
]);

async function main() {
  console.log("=================================================================");
  console.log("🚀 EMERTECH CERTIFY: PUBLIC TESTNET DEPLOYMENT (SEPOLIA)");
  console.log("=================================================================");

  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Connected Network: ${hre.network.name} (ChainID: ${network.chainId})`);

  if (network.chainId === 1) {
    throw new Error("SECURITY VIOLATION: Deployment to Ethereum Mainnet is prohibited.");
  }

  const rawKey = (process.env.SEPOLIA_PRIVATE_KEY || "").trim();
  if (!rawKey) {
    console.warn("⚠️  SEPOLIA_PRIVATE_KEY is not configured.");
    console.warn("   To deploy to Ethereum Sepolia, supply a funded testnet account in .env:");
    console.warn("   SEPOLIA_RPC_URL=https://rpc.sepolia.org");
    console.warn("   SEPOLIA_PRIVATE_KEY=0x<your_testnet_private_key>");
    console.warn("   Application will remain in resilient offline demonstration mode until deployed.");
    process.exit(0);
  }

  const normalizedKey = rawKey.toLowerCase();
  const keyHash = crypto.createHash("sha256").update(normalizedKey).digest("hex");
  if (KNOWN_DEV_KEY_SHA256.has(keyHash)) {
    throw new Error("SECURITY VIOLATION: Known Hardhat development key cannot be used on public testnets.");
  }

  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.getBalance();
  console.log(`👤 Deployer Address: ${deployer.address}`);
  console.log(`💰 Account Balance:  ${hre.ethers.utils.formatEther(balance)} ETH`);

  if (balance.eq(0)) {
    throw new Error(`Insufficient funds: Deployer wallet ${deployer.address} has 0 ETH on Sepolia. Acquire testnet ETH from a Sepolia faucet.`);
  }

  console.log("\n📦 Deploying EmertechCertificateRegistry...");
  const RegistryFactory = await hre.ethers.getContractFactory("EmertechCertificateRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.deployed();

  const deployReceipt = await registry.deployTransaction.wait(2); // Wait 2 confirmations for safety

  console.log("\n=================================================================");
  console.log("🎉 CONTRACT SUCCESSFULLY DEPLOYED TO SEPOLIA TESTNET!");
  console.log("=================================================================");
  console.log(`📍 Contract Address:     ${registry.address}`);
  console.log(`📜 Deployment Tx Hash:   ${registry.deployTransaction.hash}`);
  console.log(`🧱 Block Number:         ${deployReceipt.blockNumber}`);
  console.log(`⛽ Gas Used:             ${deployReceipt.gasUsed.toString()}`);
  console.log(`🔍 Etherscan Explorer:   https://sepolia.etherscan.io/address/${registry.address}`);
  console.log("=================================================================\n");

  const deployData = {
    address: registry.address,
    network: "sepolia",
    chainId: network.chainId,
    deployer: deployer.address,
    txHash: registry.deployTransaction.hash,
    blockNumber: deployReceipt.blockNumber,
    deployedAt: new Date().toISOString(),
    explorerUrl: `https://sepolia.etherscan.io/address/${registry.address}`
  };

  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, "sepolia.json"),
    JSON.stringify(deployData, null, 2)
  );
  console.log("Deployment metadata persisted to deployments/sepolia.json");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error.message);
  process.exitCode = 1;
});
