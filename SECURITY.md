# Security Policy

## Supported Versions

Emertech Certify maintains security support strictly for the v2.0 Clean-Room Architecture:

| Version | Supported          | Security Status |
| ------- | ------------------ | ---------------- |
| 2.0.x (Clean-Room)   | :white_check_mark: | Active Security Maintenance |
| 1.0.x (Historical)   | :x:                | Deprecated / Historical Archive |

## Reporting a Vulnerability

The Emertech Certify project takes the security of academic verification systems seriously. If you identify a potential security vulnerability, please report it responsibly:

1. **Do not create a public GitHub issue.**
2. Send an advisory email to:
   - **Maintainer**: Saqib Ahmad Bhat
   - **Contact**: `saqibahmadbhat885@gmail.com`
3. Include the following details:
   - Type of vulnerability (e.g. smart contract logic, cryptographic digest tampering, privilege escalation, authentication bypass).
   - Step-by-step reproduction instructions.
   - Proof of Concept (PoC) script or curl command.
   - Impact assessment on certificate authenticity or privacy.

### Response Timeline
- **Initial Acknowledgement**: Within 24 hours.
- **Triage & Severity Assessment**: Within 48 hours.
- **Fix Delivery & Coordinated Disclosure**: Typically within 7 calendar days.

## Core Security Invariants

Emertech Certify implements rigorous defense-in-depth principles:
- **NIST FIPS 180-4 SHA-256**: All certificate content hashes are computed deterministically and anchored on EVM state.
- **Immutable Smart Contracts**: Custom error handling, zero-hash rejection, multi-tenant isolation, and explicit role-based revocation authority.
- **PBKDF2/AES-256-GCM Key Custody**: Institutional private keys are stored encrypted at rest with 100,000 PBKDF2 iterations, unique 128-bit salts, and 96-bit IVs.
- **Authenticated Identity Claiming**: Student account claiming requires verified matching email addresses and atomic conditional database transitions to eliminate concurrency race conditions.
- **Principle of Least Privilege**: Super Administrator provisioning is restricted to an atomic one-time CLI bootstrap; public registration strictly enforces non-privileged STUDENT roles.
