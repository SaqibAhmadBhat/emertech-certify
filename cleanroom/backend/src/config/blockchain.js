const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const config = require('./env');

let provider = null;
let signer = null;
let contractInstance = null;
let contractABI = null;
let currentContractAddress = config.contractAddress;

function loadContractArtifact() {
  const artifactPath = path.resolve(
    __dirname,
    '../../../contracts/artifacts/contracts/EmertechCertificateRegistry.sol/EmertechCertificateRegistry.json'
  );
  if (fs.existsSync(artifactPath)) {
    const raw = fs.readFileSync(artifactPath, 'utf8');
    const parsed = JSON.parse(raw);
    contractABI = parsed.abi;
  } else {
    // Minimal fallback ABI
    contractABI = [
      "function registerCertificate(bytes32 certHash, string calldata recipientIdHash, string calldata metadataURI) external returns (bool)",
      "function revokeCertificate(bytes32 certHash, string calldata reason) external returns (bool)",
      "function verifyCertificate(bytes32 certHash) external view returns (bool exists, bool isRevoked, address issuer, uint64 issuedAt, uint64 revokedAt, string memory recipientIdHash, string memory metadataURI)",
      "function isCertificateValid(bytes32 certHash) external view returns (bool)",
      "function setInstitutionStatus(address institutionWallet, string calldata name, string calldata officialDomain, uint8 status) external",
      "function getInstitution(address wallet) external view returns (string memory name, string memory officialDomain, uint8 status, uint64 registeredAt)"
    ];
  }
  return contractABI;
}

function getBlockchainContext() {
  if (!provider) {
    provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  }

  // Obtain signer:
  if (!signer) {
    if (config.deployerPrivateKey) {
      try {
        signer = new ethers.Wallet(config.deployerPrivateKey, provider);
      } catch (e) {
        console.warn('[Blockchain] Signer wallet initialization from private key skipped:', e.message);
      }
    } else if (config.isLocalNetwork) {
      // For local Hardhat node, use unlocked JSON-RPC account #0
      try {
        signer = provider.getSigner(0);
      } catch (e) {
        console.warn('[Blockchain] Unlocked local signer access skipped:', e.message);
      }
    }
  }

  const targetAddress = currentContractAddress || config.contractAddress;
  if (!contractInstance && contractABI && targetAddress && ethers.utils.isAddress(targetAddress)) {
    // If signer is available, bind with signer (allows state mutations). Otherwise, bind with provider (read-only).
    const executor = signer || provider;
    contractInstance = new ethers.Contract(targetAddress, contractABI, executor);
  }

  return {
    provider,
    signer,
    contract: contractInstance,
    abi: contractABI,
    contractAddress: targetAddress
  };
}

/**
 * Reconfigures blockchain connection dynamically (used during automated integration tests).
 */
function reconfigureBlockchain({ rpcUrl, contractAddress, deployerPrivateKey }) {
  if (rpcUrl) {
    provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }
  if (deployerPrivateKey) {
    signer = new ethers.Wallet(deployerPrivateKey, provider);
  } else if (rpcUrl && (rpcUrl.includes('127.0.0.1') || rpcUrl.includes('localhost'))) {
    signer = provider.getSigner(0);
  }
  if (contractAddress) {
    currentContractAddress = contractAddress;
  }
  loadContractArtifact();
  const executor = signer || provider;
  if (currentContractAddress && ethers.utils.isAddress(currentContractAddress) && contractABI) {
    contractInstance = new ethers.Contract(currentContractAddress, contractABI, executor);
  }
  return getBlockchainContext();
}

loadContractArtifact();

module.exports = {
  getBlockchainContext,
  loadContractArtifact,
  reconfigureBlockchain
};
