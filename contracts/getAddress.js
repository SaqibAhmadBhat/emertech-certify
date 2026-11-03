require('dotenv').config({ path: '../backend/.env' });
const { ethers } = require("ethers");

const privateKey = process.env.ETH_PRIVATE_KEY;

if (!privateKey) {
  console.log("Usage: Ensure ETH_PRIVATE_KEY is set in your .env file.");
  console.log("Example format: ETH_PRIVATE_KEY=0x<your_64_character_hex_private_key>");
  process.exit(0);
}

try {
  const wallet = new ethers.Wallet(privateKey);
  console.log("Configured wallet address:", wallet.address);
} catch (error) {
  console.error("Invalid private key format:", error.message);
  process.exit(1);
}
