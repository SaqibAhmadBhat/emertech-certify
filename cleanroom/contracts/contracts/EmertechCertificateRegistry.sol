// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EmertechCertificateRegistry
 * @author Saqib Ahmad Bhat
 * @notice Clean-room decentralized registry for academic credential verification.
 * @dev Anchors deterministic SHA-256 cryptographic digests without storing sensitive PII on-chain.
 */
contract EmertechCertificateRegistry {

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

    // State Variables
    address public immutable owner;
    uint256 public totalCertificatesIssued;
    uint256 public totalCertificatesRevoked;

    mapping(address => InstitutionRecord) private institutions;
    mapping(bytes32 => CertificateRecord) private certificates;

    // Events
    event InstitutionStatusUpdated(
        address indexed institution,
        InstitutionStatus status,
        string name,
        uint64 updatedAt
    );

    event CertificateRegistered(
        bytes32 indexed certHash,
        address indexed issuer,
        uint64 issuedAt,
        string recipientIdHash,
        string metadataURI
    );

    event CertificateRevoked(
        bytes32 indexed certHash,
        address indexed revoker,
        uint64 revokedAt,
        string reason
    );

    // Custom Errors for Gas Optimization
    error OnlyContractOwnerAllowed();
    error OnlyAuthorizedInstitutionAllowed();
    error InvalidAddress();
    error InvalidHash();
    error CertificateAlreadyRegistered();
    error CertificateNotFound();
    error CertificateAlreadyRevoked();
    error UnauthorizedRevocation();

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyContractOwnerAllowed();
        _;
    }

    modifier onlyAuthorized() {
        if (institutions[msg.sender].status != InstitutionStatus.Authorized && msg.sender != owner) {
            revert OnlyAuthorizedInstitutionAllowed();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        // Authorize contract deployer by default
        institutions[msg.sender] = InstitutionRecord({
            name: "Emertech Certify Root Authority",
            officialDomain: "emertech-certify.edu",
            status: InstitutionStatus.Authorized,
            registeredAt: uint64(block.timestamp)
        });

        emit InstitutionStatusUpdated(
            msg.sender,
            InstitutionStatus.Authorized,
            "Emertech Certify Root Authority",
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Updates the authorization status of an academic institution.
     */
    function setInstitutionStatus(
        address institutionWallet,
        string calldata name,
        string calldata officialDomain,
        InstitutionStatus status
    ) external onlyOwner {
        if (institutionWallet == address(0)) revert InvalidAddress();

        institutions[institutionWallet] = InstitutionRecord({
            name: name,
            officialDomain: officialDomain,
            status: status,
            registeredAt: institutions[institutionWallet].registeredAt == 0 ? uint64(block.timestamp) : institutions[institutionWallet].registeredAt
        });

        emit InstitutionStatusUpdated(
            institutionWallet,
            status,
            name,
            uint64(block.timestamp)
        );
    }

    /**
     * @notice Registers an academic certificate's SHA-256 digest on-chain.
     */
    function registerCertificate(
        bytes32 certHash,
        string calldata recipientIdHash,
        string calldata metadataURI
    ) external onlyAuthorized returns (bool) {
        if (certHash == bytes32(0)) revert InvalidHash();
        if (certificates[certHash].issuedAt != 0) revert CertificateAlreadyRegistered();

        certificates[certHash] = CertificateRecord({
            certHash: certHash,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            isRevoked: false,
            recipientIdHash: recipientIdHash,
            metadataURI: metadataURI
        });

        totalCertificatesIssued++;

        emit CertificateRegistered(
            certHash,
            msg.sender,
            uint64(block.timestamp),
            recipientIdHash,
            metadataURI
        );

        return true;
    }

    /**
     * @notice Revokes an existing certificate on-chain.
     */
    function revokeCertificate(
        bytes32 certHash,
        string calldata reason
    ) external returns (bool) {
        if (certHash == bytes32(0)) revert InvalidHash();
        CertificateRecord storage cert = certificates[certHash];
        
        if (cert.issuedAt == 0) revert CertificateNotFound();
        if (cert.isRevoked) revert CertificateAlreadyRevoked();
        if (msg.sender != cert.issuer && msg.sender != owner) revert UnauthorizedRevocation();

        cert.isRevoked = true;
        cert.revokedAt = uint64(block.timestamp);

        totalCertificatesRevoked++;

        emit CertificateRevoked(
            certHash,
            msg.sender,
            uint64(block.timestamp),
            reason
        );

        return true;
    }

    /**
     * @notice Pure view method to verify any certificate digest.
     */
    function verifyCertificate(
        bytes32 certHash
    ) external view returns (
        bool exists,
        bool isRevoked,
        address issuer,
        uint64 issuedAt,
        uint64 revokedAt,
        string memory recipientIdHash,
        string memory metadataURI
    ) {
        CertificateRecord memory cert = certificates[certHash];
        if (cert.issuedAt == 0) {
            return (false, false, address(0), 0, 0, "", "");
        }
        return (
            true,
            cert.isRevoked,
            cert.issuer,
            cert.issuedAt,
            cert.revokedAt,
            cert.recipientIdHash,
            cert.metadataURI
        );
    }

    /**
     * @notice Quick boolean check for verification clients.
     */
    function isCertificateValid(bytes32 certHash) external view returns (bool) {
        CertificateRecord memory cert = certificates[certHash];
        return (cert.issuedAt != 0 && !cert.isRevoked);
    }

    /**
     * @notice Retrieve information regarding an institution.
     */
    function getInstitution(address wallet) external view returns (
        string memory name,
        string memory officialDomain,
        InstitutionStatus status,
        uint64 registeredAt
    ) {
        InstitutionRecord memory inst = institutions[wallet];
        return (inst.name, inst.officialDomain, inst.status, inst.registeredAt);
    }
}
