// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificateRegistry
 * @dev Emertech Certify: Decentralized Academic Certificate Verification Registry
 * Developed and customized by Saqib Ahmad Bhat (Government College of Engineering, Tirunelveli)
 * Academic demonstration in connection with AI and Blockchain Engineer Intern context.
 * Based on the upstream Certiport open-source architecture by Alwin James (MIT License).
 */
contract CertificateRegistry {
    address public owner;

    struct Certificate {
        string certificateId;      // Unique human-readable identifier (e.g. UN01-CERT-ABC123-2026)
        bytes32 documentHash;      // Cryptographic SHA-256 hash of the certificate PDF / content
        string ipfsHash;          // IPFS CID or decentralized storage fallback reference
        address issuer;           // Ethereum address of the issuing authority
        uint256 issuedAt;         // Block timestamp when issued
        bool isRevoked;           // Revocation status
        string revocationReason;  // Reason recorded upon revocation
        uint256 revokedAt;        // Block timestamp when revoked
    }

    // Mapping from certificateId to Certificate
    mapping(string => Certificate) private certificates;
    
    // Mapping of authorized university / institution addresses
    mapping(address => bool) public authorizedIssuers;
    
    // Total count of issued certificates
    uint256 public totalCertificatesIssued;

    // Events
    event CertificateIssued(
        string indexed certificateId,
        bytes32 indexed documentHash,
        string ipfsHash,
        address indexed issuer,
        uint256 issuedAt
    );

    event CertificateRevoked(
        string indexed certificateId,
        address indexed revokedBy,
        string reason,
        uint256 revokedAt
    );

    event IssuerAuthorized(address indexed issuer);
    event IssuerDeauthorized(address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "Caller is not authorized to issue certificates"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @notice Authorize an institution wallet to issue certificates
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    /**
     * @notice Deauthorize an institution wallet
     */
    function deauthorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerDeauthorized(issuer);
    }

    /**
     * @notice Issue a new certificate on-chain with SHA-256 document hash
     * @param certificateId Unique certificate identifier
     * @param documentHash Cryptographic SHA-256 hash of the generated certificate document
     * @param ipfsHash IPFS content CID or storage URI
     */
    function issueCertificate(
        string memory certificateId,
        bytes32 documentHash,
        string memory ipfsHash
    ) public onlyAuthorized {
        require(bytes(certificateId).length > 0, "Invalid certificate ID");
        require(documentHash != bytes32(0), "Invalid document hash");
        require(certificates[certificateId].issuedAt == 0, "Certificate ID already exists");

        certificates[certificateId] = Certificate({
            certificateId: certificateId,
            documentHash: documentHash,
            ipfsHash: ipfsHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            isRevoked: false,
            revocationReason: "",
            revokedAt: 0
        });

        totalCertificatesIssued++;

        emit CertificateIssued(certificateId, documentHash, ipfsHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke an issued certificate
     * @param certificateId Unique certificate identifier
     * @param reason Reason for revocation
     */
    function revokeCertificate(string memory certificateId, string memory reason) public {
        Certificate storage cert = certificates[certificateId];
        require(cert.issuedAt > 0, "Certificate does not exist");
        require(!cert.isRevoked, "Certificate is already revoked");
        require(
            msg.sender == owner || msg.sender == cert.issuer,
            "Only the original issuer or contract owner can revoke"
        );

        cert.isRevoked = true;
        cert.revocationReason = reason;
        cert.revokedAt = block.timestamp;

        emit CertificateRevoked(certificateId, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Retrieve certificate details
     */
    function getCertificate(string memory certificateId) external view returns (
        string memory id,
        bytes32 documentHash,
        string memory ipfsHash,
        address issuer,
        uint256 issuedAt,
        bool isRevoked,
        string memory revocationReason,
        uint256 revokedAt
    ) {
        Certificate storage c = certificates[certificateId];
        require(c.issuedAt > 0, "Certificate does not exist");
        return (
            c.certificateId,
            c.documentHash,
            c.ipfsHash,
            c.issuer,
            c.issuedAt,
            c.isRevoked,
            c.revocationReason,
            c.revokedAt
        );
    }

    /**
     * @notice Verifies if a given document hash matches the on-chain recorded hash
     * @param certificateId Unique certificate identifier
     * @param checkHash SHA-256 hash to test against the on-chain record
     * @return isValid True if certificate exists, is authentic, not revoked, and hash matches
     * @return status Verification status string
     */
    function verifyCertificate(string memory certificateId, bytes32 checkHash) external view returns (
        bool isValid,
        string memory status
    ) {
        Certificate storage c = certificates[certificateId];
        if (c.issuedAt == 0) {
            return (false, "NOT_FOUND");
        }
        if (c.isRevoked) {
            return (false, "REVOKED");
        }
        if (c.documentHash != checkHash) {
            return (false, "TAMPERED_HASH_MISMATCH");
        }
        return (true, "AUTHENTIC");
    }
}
