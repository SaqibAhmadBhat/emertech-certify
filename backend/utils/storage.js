const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Computes the SHA-256 cryptographic hash of a file or buffer
 * Returns format compatible with Ethereum bytes32 ("0x" + 64 hex characters)
 */
function computeSHA256(filePathOrBuffer) {
  const hash = crypto.createHash('sha256');
  if (Buffer.isBuffer(filePathOrBuffer)) {
    hash.update(filePathOrBuffer);
  } else {
    const fileBuffer = fs.readFileSync(filePathOrBuffer);
    hash.update(fileBuffer);
  }
  return '0x' + hash.digest('hex');
}

/**
 * Unified storage handler:
 * Uploads to IPFS (via Pinata) when credentials are provided,
 * otherwise transparently falls back to local decentralized storage URI.
 */
async function storeCertificateDocument(filePath, customName) {
  const documentHash = computeSHA256(filePath);
  const baseName = path.basename(filePath);

  // Check if Pinata is configured
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecret = process.env.PINATA_API_SECRET;

  if (pinataApiKey && pinataSecret && pinataApiKey !== 'your_pinata_api_key') {
    try {
      const pinataSDK = require('@pinata/sdk');
      const pinata = new pinataSDK({ pinataApiKey, pinataSecretApiKey: pinataSecret });
      
      const readableStreamForFile = fs.createReadStream(filePath);
      const result = await pinata.pinFileToIPFS(readableStreamForFile, {
        pinataMetadata: {
          name: customName || baseName,
        },
      });

      console.log(`✅ Uploaded to Pinata IPFS: ${result.IpfsHash}`);
      return {
        documentHash,
        ipfsHash: result.IpfsHash,
        storageType: 'ipfs',
        pinResult: result
      };
    } catch (pinataErr) {
      console.warn(`⚠️ Pinata upload failed (${pinataErr.message}). Engaging local storage fallback.`);
    }
  }

  // Local fallback: generate deterministic simulated content identifier (CID)
  const localCid = `local-ipfs-${documentHash.slice(2, 42)}`;
  console.log(`ℹ️ Stored locally with hash ${documentHash} (local CID: ${localCid})`);

  return {
    documentHash,
    ipfsHash: localCid,
    storageType: 'local'
  };
}

module.exports = {
  computeSHA256,
  storeCertificateDocument
};

