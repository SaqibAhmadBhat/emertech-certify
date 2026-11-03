const crypto = require('crypto');
const { ethers } = require('ethers');
const config = require('../config/env');

/**
 * KeyVaultService
 * Provides encrypted custody (AES-256-GCM) for academic institution signing credentials.
 * Never stores or exposes plaintext private keys.
 */
class KeyVaultService {
  /**
   * In-memory cache of encrypted institutional keys.
   * Maps lowercase walletAddress -> { encryptedKey: string, iv: string, authTag: string }
   */
  static _vault = new Map();

  /**
   * Derives a deterministic 256-bit vault key from master configuration.
   */
  static getVaultKey() {
    const master = process.env.KEY_VAULT_SECRET || config.jwtSecret || 'emertech_default_keyvault_secret_32b';
    return crypto.createHash('sha256').update(master).digest();
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
   * Stores an institution's private key in encrypted custody.
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
   * Resolves an authorized ethers.Signer for an institution wallet.
   * Priority:
   * 1. Decrypt from encrypted vault custody if registered.
   * 2. In local development or test mode, resolve unlocked JSON-RPC signer from Hardhat node.
   */
  static async getSigner(walletAddress, provider) {
    if (!walletAddress) {
      throw new Error('KeyVault Error: Wallet address is required to resolve signer.');
    }
    const cleanAddr = walletAddress.toLowerCase();

    // 1. Check encrypted custody
    if (this._vault.has(cleanAddr)) {
      const record = this._vault.get(cleanAddr);
      const privateKey = this.decryptPrivateKey(record.encryptedKey, record.iv, record.authTag);
      return new ethers.Wallet(privateKey, provider);
    }

    // 2. Local development fallback: Unlocked Hardhat JSON-RPC signer
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
