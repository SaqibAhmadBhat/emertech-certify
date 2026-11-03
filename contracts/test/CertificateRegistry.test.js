const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry (Emertech Certify)", function () {
  let CertificateRegistry;
  let registry;
  let owner;
  let university;
  let unauthorizedUser;

  const sampleCertId = "UN01-CERT-2026-0001";
  const samplePdfHash = ethers.utils.id("Sample PDF Certificate Content - Saqib Ahmad Bhat");
  const sampleIpfsHash = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

  beforeEach(async function () {
    [owner, university, unauthorizedUser] = await ethers.getSigners();
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
    await registry.deployed();
  });

  it("Should set the deployer as owner and authorized issuer", async function () {
    expect(await registry.owner()).to.equal(owner.address);
    expect(await registry.authorizedIssuers(owner.address)).to.be.true;
  });

  it("Should allow the owner to authorize an institution wallet", async function () {
    await registry.authorizeIssuer(university.address);
    expect(await registry.authorizedIssuers(university.address)).to.be.true;
  });

  it("Should issue a certificate with SHA-256 document hash", async function () {
    await registry.authorizeIssuer(university.address);

    const tx = await registry.connect(university).issueCertificate(
      sampleCertId,
      samplePdfHash,
      sampleIpfsHash
    );
    await tx.wait();

    const cert = await registry.getCertificate(sampleCertId);
    expect(cert.id).to.equal(sampleCertId);
    expect(cert.documentHash).to.equal(samplePdfHash);
    expect(cert.ipfsHash).to.equal(sampleIpfsHash);
    expect(cert.issuer).to.equal(university.address);
    expect(cert.isRevoked).to.be.false;
    expect(await registry.totalCertificatesIssued()).to.equal(1);
  });

  it("Should prevent duplicate certificate IDs", async function () {
    await registry.issueCertificate(sampleCertId, samplePdfHash, sampleIpfsHash);

    await expect(
      registry.issueCertificate(sampleCertId, samplePdfHash, sampleIpfsHash)
    ).to.be.revertedWith("Certificate ID already exists");
  });

  it("Should reject issuance from unauthorized callers", async function () {
    await expect(
      registry.connect(unauthorizedUser).issueCertificate(
        "UN01-CERT-FAKE-01",
        samplePdfHash,
        sampleIpfsHash
      )
    ).to.be.revertedWith("Caller is not authorized to issue certificates");
  });

  it("Should verify authentic certificates with matching SHA-256 hash", async function () {
    await registry.issueCertificate(sampleCertId, samplePdfHash, sampleIpfsHash);

    const [isValid, status] = await registry.verifyCertificate(sampleCertId, samplePdfHash);
    expect(isValid).to.be.true;
    expect(status).to.equal("AUTHENTIC");
  });

  it("Should detect tampered certificate with mismatched hash", async function () {
    await registry.issueCertificate(sampleCertId, samplePdfHash, sampleIpfsHash);

    const fakeHash = ethers.utils.id("Tampered Academic Record - Altered GPA");
    const [isValid, status] = await registry.verifyCertificate(sampleCertId, fakeHash);
    expect(isValid).to.be.false;
    expect(status).to.equal("TAMPERED_HASH_MISMATCH");
  });

  it("Should support certificate revocation and update verification status", async function () {
    await registry.authorizeIssuer(university.address);
    await registry.connect(university).issueCertificate(
      sampleCertId,
      samplePdfHash,
      sampleIpfsHash
    );

    // Revoke
    await registry.connect(university).revokeCertificate(
      sampleCertId,
      "Administrative correction required"
    );

    const cert = await registry.getCertificate(sampleCertId);
    expect(cert.isRevoked).to.be.true;
    expect(cert.revocationReason).to.equal("Administrative correction required");

    // Verification check should now return REVOKED
    const [isValid, status] = await registry.verifyCertificate(sampleCertId, samplePdfHash);
    expect(isValid).to.be.false;
    expect(status).to.equal("REVOKED");
  });

  it("Should prevent unauthorized revocation by third parties", async function () {
    await registry.authorizeIssuer(university.address);
    await registry.connect(university).issueCertificate(
      sampleCertId,
      samplePdfHash,
      sampleIpfsHash
    );

    await expect(
      registry.connect(unauthorizedUser).revokeCertificate(sampleCertId, "Malicious attempt")
    ).to.be.revertedWith("Only the original issuer or contract owner can revoke");
  });
});

