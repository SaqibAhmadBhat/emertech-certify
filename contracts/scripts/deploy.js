const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("Emertech Certify - Smart Contract Deployment");
  console.log("Developer: Saqib Ahmad Bhat");
  console.log("Institution: Government College of Engineering, Tirunelveli");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const contract = await CertificateRegistry.deploy();
  await contract.deployed();

  console.log("\n Contract deployed successfully!");
  console.log(" Contract Address:", contract.address);

  // Write ABI to backend/abi/CertificateRegistry.json
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  );
  const backendAbiDir = path.join(__dirname, "../../backend/abi");
  const backendAbiPath = path.join(backendAbiDir, "CertificateRegistry.json");

  if (!fs.existsSync(backendAbiDir)) {
    fs.mkdirSync(backendAbiDir, { recursive: true });
  }

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(backendAbiPath, JSON.stringify(artifact, null, 2));
    console.log(" ABI synced to:", backendAbiPath);
  }

  console.log("\n Update your backend/.env with:");
  console.log(`CONTRACT_ADDRESS=${contract.address}`);
  console.log("=================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
