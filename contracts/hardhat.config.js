require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({ path: '../backend/.env' });

const accounts = process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY.length === 66
  ? [process.env.ETH_PRIVATE_KEY]
  : (process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY.length === 64
      ? [`0x${process.env.ETH_PRIVATE_KEY}`]
      : []);

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: process.env.RPC_URL || "https://rpc.sepolia.org",
      accounts: accounts,
      chainId: 11155111
    }
  }
};
