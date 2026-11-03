const crypto = require('crypto');

class CryptoService {
  /**
   * Deterministically canonicalizes certificate attributes.
   */
  static buildCanonicalString(data) {
    const parts = [
      'EMERTECHv2',
      (data.institutionCode || '').trim().toUpperCase(),
      (data.studentIdentifier || '').trim().toUpperCase(),
      (data.studentName || '').trim(),
      (data.degreeTitle || '').trim(),
      (data.majorProgram || '').trim(),
      (data.graduationDate || '').trim(),
      (data.issuedAtTimestamp || '').toString().trim()
    ];
    return parts.join('|');
  }

  /**
   * Computes deterministic SHA-256 digest in lowercase 0x hex format.
   */
  static computeSha256(data) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return `0x${hash.toLowerCase()}`;
  }

  /**
   * Calculates certificate hash from payload.
   */
  static computeCertificateHash(data) {
    const canonical = this.buildCanonicalString(data);
    const hash = this.computeSha256(canonical);
    return { canonicalString: canonical, certHash: hash };
  }

  /**
   * Checks whether two hashes match bitwise.
   */
  static verifyHashMatch(hashA, hashB) {
    if (!hashA || !hashB) return false;
    const cleanA = hashA.startsWith('0x') ? hashA.toLowerCase() : `0x${hashA.toLowerCase()}`;
    const cleanB = hashB.startsWith('0x') ? hashB.toLowerCase() : `0x${hashB.toLowerCase()}`;
    return cleanA === cleanB;
  }
}

module.exports = CryptoService;
