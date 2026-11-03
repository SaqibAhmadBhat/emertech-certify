require('dotenv').config({ path: '../backend/.env' });
const { ethers } = require("ethers");

const privateKey = process.env.ETH_PRIVATE_KEY;

if (!privateKey) {
  console.log("Usage: Ensure ETH_PRIVATE_KEY is set in your .env file.");
  console.log("Example format: ETH_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  process.exit(0);
}

try {
  const wallet = new ethers.Wallet(privateKey);
  console.log("Configured wallet address:", wallet.address);
} catch (error) {
  console.error("Invalid private key format:", error.message);
  process.exit(1);
}
