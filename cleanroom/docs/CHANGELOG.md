# Changelog — Emertech Certify (Clean-Room Architecture)

All notable changes to the clean-room implementation of **Emertech Certify** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-03

### Clean-Room Reengineering Milestone
Complete independent ground-up reimplementation of Emertech Certify with zero copied code from upstream repositories.

### Added
- **Independent Smart Contract (`EmertechCertificateRegistry.sol`)**:
  - Authored from scratch in Solidity `^0.8.20`.
  - Gas-optimized packed struct `CertificateRecord` and custom errors.
  - Role-based institution management (`InstitutionStatus`).
  - 14/14 automated Hardhat tests passing with 100% coverage.
- **Pure Vector PDF Engine (`PdfVectorService`)**:
  - Direct vector PDF generation using `pdf-lib` and `qrcode`.
  - Decorative gold/navy security borders, university emblem, and dynamic QR verification stamps.
  - Replaced legacy Puppeteer headless Chrome dependency, reducing RAM usage by 95%.
- **Clean REST API v2 (`cleanroom/backend/`)**:
  - Independent controller architecture: `AuthController`, `InstitutionController`, `CertificateController`, `VerifyController`, `AdminController`.
  - Multi-modal verification engine (Hash, PDF file, QR code, OCR).
  - 18/18 automated integration tests passing with 100% coverage.
- **Original Frontend & UI Identity (`cleanroom/frontend/`)**:
  - Original vector SVG logo: Interlocking cryptographic hexagon and graduation cap.
  - Custom CSS design system with glassmorphic dark theme.
  - Original views: `LandingPage`, `PublicVerifyPage`, `InstitutionDashboard`, `StudentDashboard`, `AdminDashboard`.
- **Full Provenance & Legal Documentation**:
  - Authored `PROVENANCE_AUDIT.md`, `ARCHITECTURE.md`, `SETUP.md`, `API_DOCUMENTATION.md`, `SMART_CONTRACTS.md`, `SECURITY.md`, `TESTING.md`, `CITATION.cff`, `REFERENCES.md`.
