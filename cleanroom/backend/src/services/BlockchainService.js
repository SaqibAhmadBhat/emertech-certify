const { getBlockchainContext } = require('../config/blockchain');
const KeyVaultService = require('./KeyVaultService');

class BlockchainService {
  /**
   * Registers a certificate hash on the smart contract.
   * Signs with the institution's authorized signer when issuerWalletAddress is provided.
   * Requires:
   *  - Connected JSON-RPC provider and authorized signer.
   *  - Mined transaction confirmation.
   *  - Verification that on-chain issuer matches the authorized institution.
   */
  static async registerCertificate(certHash, recipientIdHash = '', metadataURI = '', issuerWalletAddress = null) {
    const { contract, signer: defaultSigner, provider } = getBlockchainContext();
    if (!contract || !provider) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or provider is not connected.'
      };
    }

    try {
      let activeSigner = defaultSigner;
      if (issuerWalletAddress) {
        activeSigner = await KeyVaultService.getSigner(issuerWalletAddress, provider);
      }

      if (!activeSigner) {
        return {
          txHash: null,
          onChain: false,
          error: `No valid transaction signer resolved for issuer wallet: ${issuerWalletAddress}`
        };
      }

      const boundContract = contract.connect(activeSigner);
      const tx = await boundContract.registerCertificate(
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

      const expectedIssuer = (issuerWalletAddress || (await activeSigner.getAddress())).toLowerCase();
      if (stateCheck.issuer.toLowerCase() !== expectedIssuer) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: `On-chain issuer mismatch: expected ${expectedIssuer}, recorded ${stateCheck.issuer}`
        };
      }

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: true,
        onChainIssuer: stateCheck.issuer
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
   * Signed by the issuing institution's wallet or authorized emergency contract owner.
   */
  static async revokeCertificate(certHash, reason = 'Administrative revocation', revokerWalletAddress = null) {
    const { contract, signer: defaultSigner, provider } = getBlockchainContext();
    if (!contract || !provider) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or provider is not connected.'
      };
    }

    try {
      let activeSigner = defaultSigner;
      if (revokerWalletAddress) {
        activeSigner = await KeyVaultService.getSigner(revokerWalletAddress, provider);
      }

      if (!activeSigner) {
        return {
          txHash: null,
          onChain: false,
          error: `No valid transaction signer resolved for revoker wallet: ${revokerWalletAddress}`
        };
      }

      const boundContract = contract.connect(activeSigner);
      const tx = await boundContract.revokeCertificate(certHash, reason, { gasLimit: 250000 });
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
        onChain: true,
        revoker: await activeSigner.getAddress()
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
   * Authorizes an academic institution on-chain via root contract owner (Status: 2 = Authorized).
   */
  static async authorizeInstitution(walletAddress, name, domain) {
    const { contract, signer } = getBlockchainContext();
    if (!contract || !signer) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or root signer wallet is not connected.'
      };
    }

    try {
      const tx = await contract.setInstitutionStatus(walletAddress, name, domain, 2, { gasLimit: 250000 });
      const receipt = await tx.wait(1);

      if (receipt.status !== 1) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: 'Transaction reverted during on-chain institution authorization.'
        };
      }

      // Verify contract state immediately
      const instRecord = await contract.getInstitution(walletAddress);
      if (instRecord.status !== 2) {
        return {
          txHash: receipt.transactionHash,
          onChain: false,
          error: `Post-mining verification failed: on-chain status is ${instRecord.status}, expected 2 (Authorized).`
        };
      }

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: true,
        status: 2
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
   * Suspends an academic institution on-chain via root contract owner (Status: 3 = Suspended).
   */
  static async suspendInstitution(walletAddress, name, domain) {
    const { contract, signer } = getBlockchainContext();
    if (!contract || !signer) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or root signer wallet is not connected.'
      };
    }

    try {
      const tx = await contract.setInstitutionStatus(walletAddress, name, domain, 3, { gasLimit: 250000 });
      const receipt = await tx.wait(1);

      const instRecord = await contract.getInstitution(walletAddress);
      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: receipt.status === 1 && instRecord.status === 3,
        status: 3
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
   * Revokes an academic institution on-chain via root contract owner (Status: 4 = Revoked).
   */
  static async revokeInstitution(walletAddress, name, domain) {
    const { contract, signer } = getBlockchainContext();
    if (!contract || !signer) {
      return {
        txHash: null,
        onChain: false,
        error: 'Blockchain smart contract or root signer wallet is not connected.'
      };
    }

    try {
      const tx = await contract.setInstitutionStatus(walletAddress, name, domain, 4, { gasLimit: 250000 });
      const receipt = await tx.wait(1);

      const instRecord = await contract.getInstitution(walletAddress);
      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        onChain: receipt.status === 1 && instRecord.status === 4,
        status: 4
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
   * Reads on-chain institution status.
   */
  static async getInstitution(walletAddress) {
    const { contract } = getBlockchainContext();
    if (!contract) {
      return { onChain: false, error: 'Contract not connected.' };
    }
    try {
      const inst = await contract.getInstitution(walletAddress);
      return {
        name: inst.name,
        officialDomain: inst.officialDomain,
        status: Number(inst.status),
        registeredAt: Number(inst.registeredAt),
        onChain: true
      };
    } catch (err) {
      return { onChain: false, error: err.message };
    }
  }
}

module.exports = BlockchainService;
