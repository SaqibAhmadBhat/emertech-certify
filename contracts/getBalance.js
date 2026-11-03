const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
  try {
    // Get private key from .env file
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      console.error("❌ Private key not found in .env file");
      return;
    }
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    console.log("Wallet address:", wallet.address);
    
    // Create provider for Sepolia testnet
    const rpcUrl = process.env.RPC_URL;
    
    if (!rpcUrl) {
      console.error("❌ RPC URL not found in .env file");
      return;
    }
    
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Connect wallet to provider
    const connectedWallet = wallet.connect(provider);
    
    // Get balance
    const balance = await provider.getBalance(wallet.address);
    const ethBalance = ethers.utils.formatEther(balance);
    
    console.log("Balance on Sepolia:", ethBalance, "ETH");
    
    if (balance.eq(ethers.constants.Zero)) {
      console.log("❌ You don't have any ETH on Sepolia yet. Please get some from a faucet.");
    } else {
      console.log("✅ You have ETH on Sepolia! You can deploy your contract now.");
    }
  } catch (error) {
    console.error("Error checking balance:", error);
  }
}

main();