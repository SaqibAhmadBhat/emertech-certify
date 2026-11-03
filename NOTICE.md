# Notice & Attribution

## Project Information

**Emertech Certify**  
*AI-Assisted Blockchain-Based Academic Certificate Verification System*

- **Developer & Maintainer**: Saqib Ahmad Bhat  
- **Institution**: Government College of Engineering, Tirunelveli  
- **Department**: Computer Science and Engineering  
- **Academic Context**: Academic demonstration in connection with an internship as an AI and Blockchain Engineer Intern at Emertech Innovations Private Limited.  

---

## Upstream Repository & License Attribution

This software repository is a customized and significantly re-engineered fork based upon the open-source **Certiport** project originally created by **Alwin James**.

- **Original Project Name**: Certiport
- **Upstream Repository**: [https://github.com/J7-Alwin/Certiport](https://github.com/J7-Alwin/Certiport)
- **Original Author**: Alwin James
- **Original License**: MIT License (included in full in the `LICENSE` file)

### Disclaimer of Official Endorsement & Ownership

1. **Independent Academic Work**: This project is an independent academic software engineering project developed by Saqib Ahmad Bhat for educational and demonstration purposes.
2. **No Corporate Endorsement**: The project uses the "Emertech Certify" project identity to contextualize the author's internship experience at Emertech Innovations Private Limited. It does not imply that Emertech Innovations Private Limited officially owns, commissioned, funded, or commercially endorses this independent repository.
3. **No Trademark Infringement**: No proprietary corporate logos or protected assets of Emertech Innovations Private Limited are included in this repository without authorization.
4. **Original Source Attribution**: Saqib Ahmad Bhat does not claim original authorship of the upstream Certiport codebase. Original copyright notices and the MIT license are fully preserved.

---

## Major Modifications and Enhancements

The following major enhancements and architectural changes were implemented by Saqib Ahmad Bhat:

1. **Security Hardening**:
   - Complete removal of exposed plaintext private keys (`contracts/getAddress.js`).
   - Removal of plaintext credential logging in the authentication pipeline.
   - Comprehensive environment variable abstraction and `.env` isolation.
   - Role-based route guards and client-side authorization security.

2. **Smart Contract Architecture**:
   - Re-engineered `CertificateRegistry.sol` to support SHA-256 cryptographic document fingerprints (`bytes32`).
   - Added on-chain certificate revocation (`revokeCertificate`) and status query functions (`isRevoked`, `verifyCertificateHash`).
   - Added access control and event emission for transparent auditing.

3. **Storage Fallback System**:
   - Built a local decentralized-compatible file storage fallback enabling zero-cost local operation without paid Pinata or third-party IPFS subscriptions.

4. **AI-Assisted OCR Module**:
   - Integrated a zero-cost, locally executable OCR module using Tesseract.js for extracting academic text, student names, degree titles, and register numbers from certificate documents with manual administrator verification.

5. **Multi-Modal Verification Engine**:
   - Verification via Certificate ID.
   - Verification via original PDF binary file upload with client-side/server-side SHA-256 hash comparison.
   - Verification via QR Code parsing.

6. **UI/UX Redesign**:
   - Complete visual redesign featuring a modern white/light layout with navy blue and purple academic accents, responsive data tables, live status badges, and Lucide icons.
   - Added user feedback modals, system settings, and clear academic disclaimer footers.

---

## Clean-Room v2.0 Architecture Scope

The `cleanroom/` directory contains an independently engineered, clean-room reimplementation (`Emertech Certify v2.0`). It was developed using specification-driven clean-room methodology:
- Authored independently by Saqib Ahmad Bhat.
- Fully decoupled from upstream legacy files.
- Governed by its own separately scoped license (`cleanroom/LICENSE`).
- Verified via reproducible provenance scanning (`cleanroom/tools/provenance_scan.py`).
- All tests execute against real EVM consensus without simulated transaction fallbacks.


