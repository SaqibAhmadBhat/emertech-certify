
const PinataClient = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');

// Create a reusable pinata client instance
const pinata = new PinataClient({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_API_SECRET
});

// Upload file to Pinata
async function uploadFileToPinata(filepath, customName) {
  try {
    const readableStreamForFile = fs.createReadStream(filepath);

    // Pick filename (either passed explicitly or from filepath)
    const filename = customName || path.basename(filepath);

    const result = await pinata.pinFileToIPFS(readableStreamForFile, {
      pinataMetadata: {
        name: filename || `certificate-${Date.now()}`,
      },
    });

    return result; // { IpfsHash, PinSize, Timestamp }
  } catch (err) {
    console.error("Pinata file upload error:", err);
    throw err;
  }
}

// Upload JSON to Pinata
async function uploadJSONToPinata(json, customName = `metadata-${Date.now()}`) {
  try {
    const result = await pinata.pinJSONToIPFS(json, {
      pinataMetadata: {
        name: customName,
      },
    });
    return result;
  } catch (err) {
    console.error("Pinata JSON upload error:", err);
    throw err;
  }
}

module.exports = { pinata, uploadFileToPinata, uploadJSONToPinata };
