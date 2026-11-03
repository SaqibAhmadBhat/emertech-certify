# Emertech Certify — Technical & Academic References (v2.0)

This document records the foundational academic literature, cryptographic specifications, open-source dependencies, and industry context that guided the clean-room reengineering of **Emertech Certify v2.0**.

---

## 1. Technical Standards & Cryptographic Foundations

1. **NIST FIPS PUB 180-4: Secure Hash Standard (SHS)**
   - National Institute of Standards and Technology (2015).
   - Standard specification for the SHA-256 algorithm utilized to generate deterministic 256-bit cryptographic digests of academic documents.
2. **W3C Verifiable Credentials Data Model v2.0**
   - World Wide Web Consortium (W3C Recommendation).
   - Conceptual baseline for off-chain credential subject separation, claims representation, and cryptographic proof binding.
3. **RFC 7519: JSON Web Token (JWT)**
   - Internet Engineering Task Force (IETF).
   - Stateless session authorization for role-based access control (Admin, Institution, Student).
4. **Ethereum Yellow Paper (Wood, 2014)**
   - Formal specification of the Ethereum Virtual Machine (EVM), gas mechanics, and state mappings.
5. **PDF 1.7 / ISO 32000-1 Specification**
   - Document structure, font embedding, and vector graphics rendering implemented via `pdf-lib`.

---

## 2. Academic Literature

1. **Sharples, M., & Domingue, J. (2016).** *The Blockchain and Kudos: A Distributed System for Educational Record, Reputation and Reward.* Adaptive and Adaptable Learning (pp. 490-496). Springer.
2. **Smith, R. (2007).** *An Overview of the Tesseract OCR Engine.* Ninth International Conference on Document Analysis and Recognition (ICDAR 2007). IEEE.
3. **Nakamoto, S. (2008).** *Bitcoin: A Peer-to-Peer Electronic Cash System.* Decentralized proof-of-work and immutable hash chaining.

---

## 3. Third-Party Open-Source Runtime Libraries

All runtime dependencies are utilized under their standard open-source licenses:

| Library | Version | License | Authors / Organization |
|---|---|---|---|
| **Solidity** | `^0.8.20` | GPL-3.0 / MIT | Ethereum Foundation |
| **Hardhat** | `^2.19.4` | MIT | Nomic Foundation |
| **Ethers.js** | `^5.7.2` | MIT | Richard Moore |
| **React** | `^19.1.1` | MIT | Meta Platforms, Inc. |
| **Express** | `^4.18.2` | MIT | StrongLoop, Inc. |
| **Mongoose** | `^7.5.2` | MIT | Automattic, Inc. |
| **pdf-lib** | `^1.17.1` | MIT | Andrew Dillon |
| **Tesseract.js** | `^5.1.1` | Apache-2.0 | Naptha / Jerome Wu |
| **Lucide React** | `^0.544.0` | ISC | Lucide Contributors |
| **Bcryptjs** | `^2.4.3` | MIT | Daniel Wirtz |

---

## 4. Industry Context & Academic Disclaimers

> [!IMPORTANT]
> **Academic Context Disclaimer**:  
> - Emertech Certify is an **independent academic project** authored by Saqib Ahmad Bhat for degree evaluation at Government College of Engineering, Tirunelveli.  
> - Saqib Ahmad Bhat served as an **AI and Blockchain Engineer Intern** at Emertech Innovations Private Limited ([https://emertech.io/](https://emertech.io/)).  
> - Emertech Innovations Private Limited **does not officially own, fund, or commercially endorse** this software repository.  
> - Industry precedents (such as supply-chain provenance platforms) are cited strictly as real-world domain context.
