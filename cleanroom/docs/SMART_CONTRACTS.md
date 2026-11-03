# Emertech Certify — Smart Contracts Architecture (Solidity ^0.8.20)

**Contract**: `EmertechCertificateRegistry.sol`  
**Compiler**: Solidity `^0.8.20`  
**License**: MIT  
**Author**: Saqib Ahmad Bhat  

---

## 1. Architectural Highlights

- **Fixed-Size Hashes (`bytes32`)**: Avoids dynamic memory strings in EVM storage. A 256-bit hash consumes exactly one 32-byte storage slot, reducing minting gas by ~20,000 gas compared to string arrays.
- **Custom Errors**: Replaces long revert strings with Solidity 0.8.4+ custom errors (`revert UnauthorizedInstitution()`), reducing compiled bytecode size.
- **Role-Based Institution Access**: Universities must be registered with `InstitutionStatus.Authorized` to mint certificates.
- **On-Chain Revocation**: Issuers can revoke degrees with cryptographic timestamp logging and reason strings.

---

## 2. Key Data Structures

```solidity
enum InstitutionStatus {
    Unregistered,
    Pending,
    Authorized,
    Suspended,
    Revoked
}

struct InstitutionRecord {
    string name;
    string officialDomain;
    InstitutionStatus status;
    uint64 registeredAt;
}

struct CertificateRecord {
    bytes32 certHash;
    address issuer;
    uint64 issuedAt;
    uint64 revokedAt;
    bool isRevoked;
    string recipientIdHash;
    string metadataURI;
}
```

---

## 3. Function Interface

### `registerCertificate(bytes32 certHash, string recipientIdHash, string metadataURI)`
- Modifier: `onlyAuthorized`
- Verifies: `certHash != bytes32(0)` and `certificates[certHash].issuedAt == 0`.
- Emits: `CertificateRegistered`.

### `revokeCertificate(bytes32 certHash, string reason)`
- Restricts to: original `issuer` address or contract `owner`.
- Verifies: certificate exists and `!isRevoked`.
- Sets: `isRevoked = true`, `revokedAt = block.timestamp`.
- Emits: `CertificateRevoked`.

### `verifyCertificate(bytes32 certHash)`
- View function ($O(1)$ constant time EVM lookup).
- Returns: `(exists, isRevoked, issuer, issuedAt, revokedAt, recipientIdHash, metadataURI)`.

---

## 4. Test Suite Coverage (14/14 Tests Passing)

1. Owner assignment on deployment.
2. Deployer automatically authorized as root authority.
3. Owner authorizes academic institution.
4. Non-owners prevented from updating institution status.
5. Authorized institution registers certificate.
6. Rejection of zero-hash registration.
7. Prevention of duplicate certificate registrations.
8. Rejection of issuance from unauthorized callers.
9. Verification of authentic certificate hash.
10. Unregistered hash returns non-existent state.
11. Issuing institution revokes certificate.
12. Contract owner emergency revocation.
13. Unauthorized third parties prevented from revoking.
14. Rejection of revoking an already revoked certificate.
