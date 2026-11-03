const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying EmertechCertificateRegistry (Clean-Room)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const RegistryFactory = await hre.ethers.getContractFactory("EmertechCertificateRegistry");
  const registry = await RegistryFactory.deploy();
  await registry.deployed();

  console.log("EmertechCertificateRegistry deployed to:", registry.address);

  const deployData = {
    address: registry.address,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outDir, `${hre.network.name}.json`),
    JSON.stringify(deployData, null, 2)
  );

  console.log("Deployment metadata written to deployments/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
