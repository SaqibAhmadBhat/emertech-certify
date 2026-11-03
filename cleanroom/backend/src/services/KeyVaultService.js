const crypto = require('crypto');
const { ethers } = require('ethers');
const config = require('../config/env');
const Institution = require('../models/Institution');

/**
 * KeyVaultService
 * Provides hardened encrypted custody (AES-256-GCM) for academic institution signing credentials.
 * Key derivation uses PBKDF2 (100,000 iterations, HMAC-SHA256) with a unique per-record salt.
 * Binds credentials to institution wallet identity using Authenticated Additional Data (AAD).
 * Plaintext private keys are never stored, logged, or exposed over API responses.
 */
class KeyVaultService {
  /**
   * In-memory cache of encrypted institutional keys.
   * Maps lowercase walletAddress -> { encryptedKey: string, iv: string, authTag: string, salt: string, aad: string, keyVersion: number }
   */
  static _vault = new Map();

  /**
   * Derives a deterministic 256-bit vault key via PBKDF2 from KEY_VAULT_SECRET and record salt.
   * Strictly requires KEY_VAULT_SECRET to be configured (no hardcoded fallback).
   */
  static deriveKey(recordSalt, customSecret = null) {
    const master = customSecret || config.keyVaultSecret;
    if (!master || typeof master !== 'string' || master.trim().length === 0) {
      throw new Error('KeyVault Error: Master KEY_VAULT_SECRET is not configured.');
    }
    if (master.trim().length < 32) {
      throw new Error('KeyVault Error: Custom key vault secret must be at least 32 characters long.');
    }
    if (!recordSalt) {
      throw new Error('KeyVault Error: Record derivation salt is required.');
    }
    const saltBuffer = Buffer.isBuffer(recordSalt) ? recordSalt : Buffer.from(recordSalt, 'hex');
    return crypto.pbkdf2Sync(master.trim(), saltBuffer, 100000, 32, 'sha256');
  }

  /**
   * Encrypts a private key using authenticated AES-256-GCM with unique salt, IV, and optional AAD.
   */
  static encryptPrivateKey(privateKey, aadString = null, customSalt = null, customSecret = null) {
    if (!privateKey || typeof privateKey !== 'string') {
      throw new Error('KeyVault Error: Private key is required for encryption.');
    }

    const salt = customSalt
      ? (Buffer.isBuffer(customSalt) ? customSalt : Buffer.from(customSalt, 'hex'))
      : crypto.randomBytes(32); // High-entropy 256-bit per-record salt

    const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
    const key = this.deriveKey(salt, customSecret);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    if (aadString) {
      cipher.setAAD(Buffer.from(aadString, 'utf8'));
    }

    let encrypted = cipher.update(privateKey.trim(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedKey: encrypted,
      iv: iv.toString('hex'),
      authTag,
      salt: salt.toString('hex'),
      keyVersion: 1
    };
  }

  /**
   * Decrypts an encrypted private key using authenticated AES-256-GCM.
   */
  static decryptPrivateKey(encryptedKey, ivHex, authTagHex, saltHex, aadString = null, customSecret = null) {
    if (!encryptedKey || !ivHex || !authTagHex || !saltHex) {
      throw new Error('KeyVault Error: Missing ciphertext, IV, authentication tag, or derivation salt.');
    }

    const key = this.deriveKey(saltHex, customSecret);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    if (aadString) {
      decipher.setAAD(Buffer.from(aadString, 'utf8'));
    }

    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Stores an institution's private key in encrypted custody (in-memory cache).
   */
  static registerInstitutionKey(walletAddress, privateKey, customSecret = null) {
    if (!walletAddress || !privateKey) {
      throw new Error('KeyVault Error: Wallet address and private key are required.');
    }

    // Validate that the private key matches the wallet address
    let derivedAddress;
    try {
      derivedAddress = new ethers.Wallet(privateKey.trim()).address;
    } catch (e) {
      throw new Error(`KeyVault Error: Invalid private key format: ${e.message}`);
    }

    if (derivedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error(`KeyVault Error: Private key derives wallet address ${derivedAddress}, which does not match expected wallet ${walletAddress}.`);
    }

    const aad = walletAddress.toLowerCase();
    const encrypted = this.encryptPrivateKey(privateKey, aad, null, customSecret);
    this._vault.set(walletAddress.toLowerCase(), {
      ...encrypted,
      aad
    });
    return encrypted;
  }

  /**
   * Persists an institution's private key into MongoDB in encrypted form (AES-256-GCM).
   * Validates that the private key actually derives the registered institution wallet address.
   * Identifier can be MongoDB ObjectId, institutionCode, or walletAddress.
   */
  static async storeInstitutionEncryptedKey(identifier, privateKey, customSecret = null) {
    if (!identifier || !privateKey) {
      throw new Error('KeyVault Error: Identifier and private key are required for persistent custody.');
    }

    let query;
    const idStr = identifier.toString ? identifier.toString().trim() : String(identifier).trim();
    if (ethers.utils.isAddress(idStr)) {
      query = { walletAddress: idStr.toLowerCase() };
    } else if (idStr.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: idStr };
    } else {
      query = { institutionCode: idStr.toUpperCase() };
    }

    const institution = await Institution.findOne(query);
    if (!institution) {
      throw new Error(`KeyVault Error: Institution record not found for identifier: ${identifier}`);
    }

    // Validate private key matches institution's wallet address
    let derivedAddress;
    try {
      derivedAddress = new ethers.Wallet(privateKey.trim()).address;
    } catch (e) {
      throw new Error(`KeyVault Error: Invalid private key format: ${e.message}`);
    }

    if (derivedAddress.toLowerCase() !== institution.walletAddress.toLowerCase()) {
      throw new Error(`KeyVault Error: Private key derives wallet address ${derivedAddress}, which does not match registered institution wallet ${institution.walletAddress}.`);
    }

    // Encrypt with AAD bound to the institution's wallet address
    const aad = institution.walletAddress.toLowerCase();
    const encrypted = this.encryptPrivateKey(privateKey, aad, null, customSecret);

    institution.encryptedPrivateKey = encrypted.encryptedKey;
    institution.keyVaultIv = encrypted.iv;
    institution.keyVaultTag = encrypted.authTag;
    institution.keyDerivationSalt = encrypted.salt;
    institution.keyVersion = encrypted.keyVersion;
    await institution.save();

    // Cache in memory for quick subsequent access
    this._vault.set(institution.walletAddress.toLowerCase(), {
      ...encrypted,
      aad
    });

    return {
      success: true,
      institutionCode: institution.institutionCode,
      walletAddress: institution.walletAddress,
      keyVersion: encrypted.keyVersion
    };
  }

  /**
   * Resolves an authorized ethers.Signer for an institution wallet.
   * Priority:
   * 1. Decrypt from in-memory encrypted cache if present.
   * 2. Query MongoDB Institution record, decrypt stored AES-256-GCM ciphertext, validate address, and construct ethers.Wallet.
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
      const privateKey = this.decryptPrivateKey(
        record.encryptedKey,
        record.iv,
        record.authTag,
        record.salt,
        record.aad || cleanAddr
      );
      const wallet = new ethers.Wallet(privateKey, provider);
      if (wallet.address.toLowerCase() !== cleanAddr) {
        throw new Error(`KeyVault Error: Decrypted signing key derives ${wallet.address}, mismatch with expected ${cleanAddr}.`);
      }
      return wallet;
    }

    // 2. Query persistent MongoDB encrypted storage
    try {
      const institution = await Institution.findOne({
        walletAddress: cleanAddr
      });

      if (
        institution &&
        institution.encryptedPrivateKey &&
        institution.keyVaultIv &&
        institution.keyVaultTag &&
        institution.keyDerivationSalt
      ) {
        const privateKey = this.decryptPrivateKey(
          institution.encryptedPrivateKey,
          institution.keyVaultIv,
          institution.keyVaultTag,
          institution.keyDerivationSalt,
          cleanAddr
        );
        const wallet = new ethers.Wallet(privateKey, provider);
        if (wallet.address.toLowerCase() !== cleanAddr) {
          throw new Error(`KeyVault Error: Decrypted database key derives ${wallet.address}, mismatch with expected ${cleanAddr}.`);
        }
        // Cache decrypted record
        this._vault.set(cleanAddr, {
          encryptedKey: institution.encryptedPrivateKey,
          iv: institution.keyVaultIv,
          authTag: institution.keyVaultTag,
          salt: institution.keyDerivationSalt,
          aad: cleanAddr,
          keyVersion: institution.keyVersion || 1
        });
        return wallet;
      }
    } catch (dbErr) {
      // Re-throw if error was a cryptographic integrity or address mismatch error
      if (dbErr.message && dbErr.message.includes('KeyVault Error')) {
        throw dbErr;
      }
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
   * Clears in-memory vault (used during test resets and process isolation).
   */
  static resetVault() {
    this._vault.clear();
  }
}

module.exports = KeyVaultService;
