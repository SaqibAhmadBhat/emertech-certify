const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const CryptoService = require('./CryptoService');

class StorageService {
  static ensureStorageDirectory() {
    const dir = config.storageDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Persists file buffer locally with content-addressed SHA-256 naming.
   */
  static async persistDocument(fileBuffer, originalExtension = 'pdf', customIdentifier = null) {
    const storageDir = this.ensureStorageDirectory();
    const digest = CryptoService.computeSha256(fileBuffer);
    const cleanHash = (customIdentifier || digest).replace('0x', '').toLowerCase();
    const filename = `${cleanHash}.${originalExtension}`;
    const filePath = path.join(storageDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    // Also persist with content hash if customIdentifier was given
    if (customIdentifier) {
      const contentFilename = `${digest.replace('0x', '').toLowerCase()}.${originalExtension}`;
      await fs.promises.writeFile(path.join(storageDir, contentFilename), fileBuffer);
    }

    // Mock IPFS CID based on content hash
    const ipfsCID = `ipfs://bafybeic${digest.substring(2, 34)}`;

    return {
      storagePath: filePath,
      filename,
      fileSize: fileBuffer.length,
      ipfsCID,
      contentHash: digest
    };
  }

  /**
   * Reads a stored document by its content hash.
   */
  static async getDocumentByHash(contentHash, extension = 'pdf') {
    const cleanHash = contentHash.replace('0x', '').toLowerCase();
    const storageDir = this.ensureStorageDirectory();
    const filePath = path.join(storageDir, `${cleanHash}.${extension}`);

    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath);
    }
    return null;
  }
}

module.exports = StorageService;
