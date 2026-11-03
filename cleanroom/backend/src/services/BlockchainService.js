const { getBlockchainContext } = require('../config/blockchain');

class BlockchainService {
  /**
   * Registers a certificate hash on the smart contract.
   * Requires:
   *  - Connected JSON-RPC provider and authorized signer.
   *  - Mined transaction confirmation.
   *  - Verification of state on the contract.
   */
  static async registerCertificate(certHash, recipientIdHash = '', metadataURI = '') {
    const { contract, signer } = getBlockchainContext();
    if (!contract || !signer) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or signer wallet is not connected.'
      };
    }

    try {
      const tx = await contract.registerCertificate(
        certHash,
        recipientIdHash,
        metadataURI,
        { gasLimit: 400000 }
      );
      const receipt = await tx.wait(1);

      if (receipt.status !== 1) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: 'Transaction reverted during EVM execution.'
        };
      }

      // Verify contract state immediately following mined transaction
      const stateCheck = await contract.verifyCertificate(certHash);
      if (!stateCheck.exists) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: 'Post-mining state verification failed: certificate hash not present on-chain.'
        };
      }

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: true
      };
    } catch (err) {
      return {
        txHash: null,
        onChain: false,
        error: err.message
      };
    }
  }

  /**
   * Revokes a certificate hash on-chain.
   * Requires mined transaction receipt and confirmed on-chain revocation state.
   */
  static async revokeCertificate(certHash, reason = 'Administrative revocation') {
    const { contract, signer } = getBlockchainContext();
    if (!contract || !signer) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or signer wallet is not connected.'
      };
    }

    try {
      const tx = await contract.revokeCertificate(certHash, reason, { gasLimit: 250000 });
      const receipt = await tx.wait(1);

      if (receipt.status !== 1) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: 'Revocation transaction reverted during EVM execution.'
        };
      }

      const stateCheck = await contract.verifyCertificate(certHash);
      if (!stateCheck.isRevoked) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: 'Post-mining state check failed: certificate is not flagged as revoked.'
        };
      }

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: true
      };
    } catch (err) {
      return {
        txHash: null,
        onChain: false,
        error: err.message
      };
    }
  }

  /**
   * Queries on-chain verification state directly from the smart contract view method.
   */
  static async verifyCertificate(certHash) {
    const { contract } = getBlockchainContext();
    if (!contract) {
      return {
        exists: false,
        isRevoked: false,
        onChain: false,
        error: 'Blockchain smart contract not connected.'
      };
    }

    try {
      const res = await contract.verifyCertificate(certHash);
      return {
        exists: Boolean(res.exists),
        isRevoked: Boolean(res.isRevoked),
        issuer: res.issuer,
        issuedAt: res.issuedAt.toNumber ? res.issuedAt.toNumber() : Number(res.issuedAt),
        revokedAt: res.revokedAt.toNumber ? res.revokedAt.toNumber() : Number(res.revokedAt),
        recipientIdHash: res.recipientIdHash,
        metadataURI: res.metadataURI,
        onChain: true
      };
    } catch (err) {
      return {
        exists: false,
        isRevoked: false,
        onChain: false,
        error: err.message
      };
    }
  }

  /**
   * Authorizes an academic institution on-chain via root contract owner.
   */
  static async authorizeInstitution(walletAddress, name, domain) {
    const { contract, signer } = getBlockchainContext();
    if (!contract || !signer) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or signer wallet is not connected.'
      };
    }

    try {
      const tx = await contract.setInstitutionStatus(walletAddress, name, domain, 2); // 2 = Authorized
      const receipt = await tx.wait(1);
      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: receipt.status === 1
      };
    } catch (err) {
      return {
        txHash: null,
        onChain: false,
        error: err.message
      };
    }
  }
}

module.exports = BlockchainService;
