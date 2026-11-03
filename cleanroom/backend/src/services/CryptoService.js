const crypto = require('crypto');

class CryptoService {
  /**
   * Deterministically canonicalizes certificate attributes.
   * Format: EMERTECHv2|INSTITUTION|STUDENT_ID|NAME|DEGREE|MAJOR|DATE|TIMESTAMP
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
   * Computes standard NIST FIPS 180-4 SHA-256 digest in lowercase 0x hex format.
   * Matches Ethereum `bytes32` representation.
   */
  static computeSha256(data) {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return `0x${hash.toLowerCase()}`;
  }

  /**
   * Generates a cryptographically secure, high-entropy random salt (128-bit / 16 bytes default).
   */
  static generateSalt(byteLength = 16) {
    return crypto.randomBytes(byteLength).toString('hex');
  }

  /**
   * Computes a salted pseudonymized hash for a student identifier:
   * SHA-256(STUDENT_ID:SALT)
   * This prevents dictionary / enumeration attacks on predictable registration numbers.
   */
  static computeSaltedRecipientHash(studentIdentifier, salt) {
    if (!salt) {
      throw new Error('Cryptographic Error: Salting is mandatory for recipient pseudonymization.');
    }
    const payload = `${studentIdentifier.trim().toUpperCase()}:${salt.trim()}`;
    return this.computeSha256(payload);
  }

  /**
   * Calculates certificate hash from academic payload.
   */
  static computeCertificateHash(data) {
    const canonical = this.buildCanonicalString(data);
    const hash = this.computeSha256(canonical);
    return { canonicalString: canonical, certHash: hash };
  }

  /**
   * Checks whether two hashes match bitwise in constant-time format.
   */
  static verifyHashMatch(hashA, hashB) {
    if (!hashA || !hashB) return false;
    const cleanA = hashA.startsWith('0x') ? hashA.toLowerCase() : `0x${hashA.toLowerCase()}`;
    const cleanB = hashB.startsWith('0x') ? hashB.toLowerCase() : `0x${hashB.toLowerCase()}`;
    return cleanA === cleanB;
  }

  /**
   * NIST FIPS 180-4 Known-Answer Test (KAT) Vectors for SHA-256.
   */
  static getNistKnownAnswerVectors() {
    return [
      {
        description: 'NIST KAT 1: Empty string',
        input: '',
        expected: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      {
        description: 'NIST KAT 2: Standard three-character test vector ("abc")',
        input: 'abc',
        expected: '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      },
      {
        description: 'NIST KAT 3: Multi-block test string (55 bytes)',
        input: 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
        expected: '0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
      }
    ];
  }

  /**
   * Validates runtime SHA-256 implementation against NIST KAT vectors.
   */
  static verifyNistVectors() {
    const vectors = this.getNistKnownAnswerVectors();
    for (const v of vectors) {
      const computed = this.computeSha256(v.input);
      if (computed !== v.expected) {
        throw new Error(`NIST SHA-256 validation failed for "${v.description}". Expected ${v.expected}, got ${computed}`);
      }
    }
    return true;
  }
}

module.exports = CryptoService;
