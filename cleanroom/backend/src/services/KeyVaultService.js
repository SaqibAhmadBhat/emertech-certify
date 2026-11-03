const crypto = require('crypto');
const { ethers } = require('ethers');
const config = require('../config/env');
const Institution = require('../models/Institution');

/**
 * KeyVaultService
 * Provides encrypted custody (AES-256-GCM) for academic institution signing credentials.
 * Key derivation uses PBKDF2 (100,000 iterations, HMAC-SHA256) from independent KEY_VAULT_SECRET.
 * Never stores or exposes plaintext private keys.
 */
class KeyVaultService {
  /**
   * In-memory cache of encrypted institutional keys.
   * Maps lowercase walletAddress -> { encryptedKey: string, iv: string, authTag: string }
   */
  static _vault = new Map();

  /**
   * Derives a deterministic 256-bit vault key via PBKDF2 from KEY_VAULT_SECRET.
   */
  static getVaultKey() {
    const master = config.keyVaultSecret || 'emertech_dev_vault_master_key_secret_2026_unrestricted';
    return crypto.pbkdf2Sync(master, 'emertech-keyvault-kdf-salt-v2', 100000, 32, 'sha256');
  }

  /**
   * Encrypts a private key using authenticated AES-256-GCM.
   */
  static encryptPrivateKey(privateKey) {
    if (!privateKey) {
      throw new Error('KeyVault Error: Private key is required for encryption.');
    }
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.getVaultKey(), iv);

    let encrypted = cipher.update(privateKey.trim(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedKey: encrypted,
      iv: iv.toString('hex'),
      authTag
    };
  }

  /**
   * Decrypts an encrypted private key using authenticated AES-256-GCM.
   */
  static decryptPrivateKey(encryptedKey, ivHex, authTagHex) {
    if (!encryptedKey || !ivHex || !authTagHex) {
      throw new Error('KeyVault Error: Missing ciphertext, IV, or authentication tag.');
    }
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.getVaultKey(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Stores an institution's private key in encrypted custody (in-memory cache).
   */
  static registerInstitutionKey(walletAddress, privateKey) {
    if (!walletAddress || !privateKey) {
      throw new Error('KeyVault Error: Wallet address and private key are required.');
    }
    const encrypted = this.encryptPrivateKey(privateKey);
    this._vault.set(walletAddress.toLowerCase(), encrypted);
    return encrypted;
  }

  /**
   * Persists an institution's private key into MongoDB in encrypted form (AES-256-GCM).
   * Identifier can be MongoDB ObjectId, institutionCode, or walletAddress.
   */
  static async storeInstitutionEncryptedKey(identifier, privateKey) {
    if (!identifier || !privateKey) {
      throw new Error('KeyVault Error: Identifier and private key are required for persistent custody.');
    }

    const encrypted = this.encryptPrivateKey(privateKey);

    let query;
    if (ethers.utils.isAddress(identifier)) {
      query = { walletAddress: identifier.toLowerCase() };
    } else if (typeof identifier === 'string' && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: identifier };
    } else {
      query = { institutionCode: identifier.toUpperCase() };
    }

    const institution = await Institution.findOneAndUpdate(
      query,
      {
        encryptedPrivateKey: encrypted.encryptedKey,
        keyVaultIv: encrypted.iv,
        keyVaultTag: encrypted.authTag
      },
      { new: true }
    );

    if (!institution) {
      throw new Error(`KeyVault Error: Institution record not found for identifier: ${identifier}`);
    }

    // Cache in memory for quick subsequent access
    this._vault.set(institution.walletAddress.toLowerCase(), encrypted);

    return {
      success: true,
      institutionCode: institution.institutionCode,
      walletAddress: institution.walletAddress
    };
  }

  /**
   * Resolves an authorized ethers.Signer for an institution wallet.
   * Priority:
   * 1. Decrypt from in-memory encrypted cache if present.
   * 2. Query MongoDB Institution record, decrypt stored AES-256-GCM ciphertext, and construct ethers.Wallet.
   * 3. Local development fallback: Unlocked Hardhat JSON-RPC signer.
   */
  static async getSigner(walletAddress, provider) {
    if (!walletAddress) {
      throw new Error('KeyVault Error: Wallet address is required to resolve signer.');
    }
    const cleanAddr = walletAddress.toLowerCase();

    // 1. Check in-memory encrypted cache
    if (this._vault.has(cleanAddr)) {
      const record = this._vault.get(cleanAddr);
      const privateKey = this.decryptPrivateKey(record.encryptedKey, record.iv, record.authTag);
      return new ethers.Wallet(privateKey, provider);
    }

    // 2. Query persistent MongoDB encrypted storage
    try {
      const institution = await Institution.findOne({
        walletAddress: cleanAddr
      });

      if (institution && institution.encryptedPrivateKey && institution.keyVaultIv && institution.keyVaultTag) {
        const privateKey = this.decryptPrivateKey(
          institution.encryptedPrivateKey,
          institution.keyVaultIv,
          institution.keyVaultTag
        );
        // Cache decrypted record
        this._vault.set(cleanAddr, {
          encryptedKey: institution.encryptedPrivateKey,
          iv: institution.keyVaultIv,
          authTag: institution.keyVaultTag
        });
        return new ethers.Wallet(privateKey, provider);
      }
    } catch (dbErr) {
      // If DB query fails or during unit tests with disconnected DB, continue to fallback
    }

    // 3. Local development fallback: Unlocked Hardhat JSON-RPC signer
    if (config.isLocalNetwork && provider) {
      try {
        const signer = provider.getSigner(walletAddress);
        const resolvedAddress = await signer.getAddress();
        if (resolvedAddress.toLowerCase() === cleanAddr) {
          return signer;
        }
      } catch (err) {
        // Signer not unlocked in provider
      }
    }

    throw new Error(`KeyVault Error: No authorized signing credential found for institution wallet: ${walletAddress}`);
  }

  /**
   * Clears in-memory vault (used during test resets).
   */
  static resetVault() {
    this._vault.clear();
  }
}

module.exports = KeyVaultService;
