const QRCode = require('qrcode');

async function generateQRCodeDataURI(text) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'H' });
}

module.exports = { generateQRCodeDataURI };
