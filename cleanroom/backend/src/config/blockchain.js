const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const config = require('./env');

let provider = null;
let signer = null;
let contractInstance = null;
let contractABI = null;

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
  if (!signer && config.deployerPrivateKey) {
    try {
      signer = new ethers.Wallet(config.deployerPrivateKey, provider);
    } catch (e) {
      console.warn('[Blockchain] Signer wallet initialization skipped:', e.message);
    }
  }
  if (!contractInstance && contractABI && config.contractAddress && signer) {
    contractInstance = new ethers.Contract(config.contractAddress, contractABI, signer);
  }
  return { provider, signer, contract: contractInstance, abi: contractABI };
}

loadContractArtifact();

module.exports = {
  getBlockchainContext,
  loadContractArtifact
};
