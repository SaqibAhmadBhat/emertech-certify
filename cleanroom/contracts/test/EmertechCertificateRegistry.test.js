const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EmertechCertificateRegistry (Clean-Room Architecture)", function () {
  let registry;
  let owner;
  let university;
  let unauthorizedUser;
  let student;

  const sampleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CERTv2|GCE|SAQIB|BE_CSE|2026-05"));
  const sampleHash2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("CERTv2|GCE|STUDENT2|BE_ECE|2026-05"));
  const recipientHash = ethers.utils.id("950020104001");
  const metadataURI = "ipfs://QmCleanRoomSampleHash123456789";

  beforeEach(async function () {
    [owner, university, unauthorizedUser, student] = await ethers.getSigners();

    const RegistryFactory = await ethers.getContractFactory("EmertechCertificateRegistry");
    registry = await RegistryFactory.deploy();
    await registry.deployed();
  });

  describe("1. Deployment & Administrative Authority", function () {
    it("Should correctly assign the contract owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should automatically authorize the deployer as a root authority", async function () {
      const inst = await registry.getInstitution(owner.address);
      expect(inst.status).to.equal(2); // Authorized = 2
      expect(inst.name).to.equal("Emertech Certify Root Authority");
    });

    it("Should allow the owner to authorize an academic institution", async function () {
      await expect(
        registry.setInstitutionStatus(university.address, "Govt College of Engg Tirunelveli", "gce.edu", 2)
      )
        .to.emit(registry, "InstitutionStatusUpdated")
        .withArgs(university.address, 2, "Govt College of Engg Tirunelveli", (val) => val > 0);

      const inst = await registry.getInstitution(university.address);
      expect(inst.status).to.equal(2);
      expect(inst.name).to.equal("Govt College of Engg Tirunelveli");
    });

    it("Should prevent non-owners from updating institution authorization", async function () {
      await expect(
        registry.connect(unauthorizedUser).setInstitutionStatus(university.address, "Fake Univ", "fake.edu", 2)
      ).to.be.revertedWithCustomError(registry, "OnlyContractOwnerAllowed");
    });
  });

  describe("2. Certificate Registration & Hashing", function () {
    beforeEach(async function () {
      await registry.setInstitutionStatus(university.address, "Govt College of Engg Tirunelveli", "gce.edu", 2);
    });

    it("Should permit an authorized institution to register a certificate", async function () {
      await expect(
        registry.connect(university).registerCertificate(sampleHash, recipientHash, metadataURI)
      )
        .to.emit(registry, "CertificateRegistered")
        .withArgs(sampleHash, university.address, (val) => val > 0, recipientHash, metadataURI);

      expect(await registry.totalCertificatesIssued()).to.equal(1);
    });

    it("Should reject registration with a zero hash", async function () {
      await expect(
        registry.connect(university).registerCertificate(ethers.constants.HashZero, recipientHash, metadataURI)
      ).to.be.revertedWithCustomError(registry, "InvalidHash");
    });

    it("Should prevent duplicate certificate registration", async function () {
      await registry.connect(university).registerCertificate(sampleHash, recipientHash, metadataURI);

      await expect(
        registry.connect(university).registerCertificate(sampleHash, recipientHash, metadataURI)
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyRegistered");
    });

    it("Should reject issuance from an unauthorized institution", async function () {
      await expect(
        registry.connect(unauthorizedUser).registerCertificate(sampleHash, recipientHash, metadataURI)
      ).to.be.revertedWithCustomError(registry, "OnlyAuthorizedInstitutionAllowed");
    });
  });

  describe("3. Verification State & Diagnostics", function () {
    beforeEach(async function () {
      await registry.setInstitutionStatus(university.address, "Govt College of Engg Tirunelveli", "gce.edu", 2);
      await registry.connect(university).registerCertificate(sampleHash, recipientHash, metadataURI);
    });

    it("Should correctly verify an authentic certificate hash", async function () {
      const res = await registry.verifyCertificate(sampleHash);
      expect(res.exists).to.be.true;
      expect(res.isRevoked).to.be.false;
      expect(res.issuer).to.equal(university.address);
      expect(res.recipientIdHash).to.equal(recipientHash);
      expect(res.metadataURI).to.equal(metadataURI);
      expect(await registry.isCertificateValid(sampleHash)).to.be.true;
    });

    it("Should return non-existent state for an unregistered certificate", async function () {
      const res = await registry.verifyCertificate(sampleHash2);
      expect(res.exists).to.be.false;
      expect(res.isRevoked).to.be.false;
      expect(await registry.isCertificateValid(sampleHash2)).to.be.false;
    });
  });

  describe("4. Revocation Lifecycle", function () {
    beforeEach(async function () {
      await registry.setInstitutionStatus(university.address, "Govt College of Engg Tirunelveli", "gce.edu", 2);
      await registry.connect(university).registerCertificate(sampleHash, recipientHash, metadataURI);
    });

    it("Should allow the issuing institution to revoke a certificate", async function () {
      await expect(
        registry.connect(university).revokeCertificate(sampleHash, "Academic record update")
      )
        .to.emit(registry, "CertificateRevoked")
        .withArgs(sampleHash, university.address, (val) => val > 0, "Academic record update");

      const res = await registry.verifyCertificate(sampleHash);
      expect(res.exists).to.be.true;
      expect(res.isRevoked).to.be.true;
      expect(await registry.isCertificateValid(sampleHash)).to.be.false;
      expect(await registry.totalCertificatesRevoked()).to.equal(1);
    });

    it("Should allow the contract owner to revoke a certificate in emergencies", async function () {
      await registry.connect(owner).revokeCertificate(sampleHash, "Emergency admin revocation");
      expect(await registry.isCertificateValid(sampleHash)).to.be.false;
    });

    it("Should prevent unauthorized third parties from revoking certificates", async function () {
      await expect(
        registry.connect(unauthorizedUser).revokeCertificate(sampleHash, "Malicious attempt")
      ).to.be.revertedWithCustomError(registry, "UnauthorizedRevocation");
    });

    it("Should reject revoking an already revoked certificate", async function () {
      await registry.connect(university).revokeCertificate(sampleHash, "First revocation");
      await expect(
        registry.connect(university).revokeCertificate(sampleHash, "Second revocation")
      ).to.be.revertedWithCustomError(registry, "CertificateAlreadyRevoked");
    });
  });
});
