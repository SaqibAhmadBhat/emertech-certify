const { getBlockchainContext } = require('../config/blockchain');

class BlockchainService {
  /**
   * Registers a certificate hash on the smart contract.
   */
  static async registerCertificate(certHash, recipientIdHash = '', metadataURI = '') {
    const { contract } = getBlockchainContext();
    if (!contract) {
      console.warn('[Blockchain] Smart contract not connected. Operating in off-chain simulation mode.');
      return { txHash: '0xSIMULATED_BLOCKCHAIN_TX_' + Date.now(), onChain: false };
    }

    try {
      const tx = await contract.registerCertificate(
        certHash,
        recipientIdHash,
        metadataURI,
        { gasLimit: 300000 }
      );
      const receipt = await tx.wait();
      return { txHash: receipt.transactionHash, blockNumber: receipt.blockNumber, onChain: true };
    } catch (err) {
      console.error('[Blockchain] Smart contract registration error:', err.message);
      return { txHash: '0xERROR_FALLBACK', onChain: false, error: err.message };
    }
  }

  /**
   * Revokes a certificate hash on-chain.
   */
  static async revokeCertificate(certHash, reason = 'Administrative revocation') {
    const { contract } = getBlockchainContext();
    if (!contract) {
      return { txHash: '0xSIMULATED_REVOKE_TX_' + Date.now(), onChain: false };
    }

    try {
      const tx = await contract.revokeCertificate(certHash, reason, { gasLimit: 200000 });
      const receipt = await tx.wait();
      return { txHash: receipt.transactionHash, onChain: true };
    } catch (err) {
      console.error('[Blockchain] Smart contract revocation error:', err.message);
      return { txHash: '0xERROR_FALLBACK', onChain: false, error: err.message };
    }
  }

  /**
   * Queries on-chain verification state.
   */
  static async verifyCertificate(certHash) {
    const { contract } = getBlockchainContext();
    if (!contract) {
      return { exists: false, isRevoked: false, onChain: false };
    }

    try {
      const res = await contract.verifyCertificate(certHash);
      return {
        exists: res.exists,
        isRevoked: res.isRevoked,
        issuer: res.issuer,
        issuedAt: res.issuedAt.toNumber ? res.issuedAt.toNumber() : Number(res.issuedAt),
        revokedAt: res.revokedAt.toNumber ? res.revokedAt.toNumber() : Number(res.revokedAt),
        recipientIdHash: res.recipientIdHash,
        metadataURI: res.metadataURI,
        onChain: true
      };
    } catch (err) {
      console.error('[Blockchain] Verification query error:', err.message);
      return { exists: false, isRevoked: false, onChain: false, error: err.message };
    }
  }

  /**
   * Authorizes an academic institution on-chain.
   */
  static async authorizeInstitution(walletAddress, name, domain) {
    const { contract } = getBlockchainContext();
    if (!contract) return { onChain: false };

    try {
      const tx = await contract.setInstitutionStatus(walletAddress, name, domain, 2); // 2 = Authorized
      const receipt = await tx.wait();
      return { txHash: receipt.transactionHash, onChain: true };
    } catch (err) {
      console.error('[Blockchain] Institution authorization error:', err.message);
      return { onChain: false, error: err.message };
    }
  }
}

module.exports = BlockchainService;
