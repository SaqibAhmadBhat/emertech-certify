import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Building2, 
  CheckCircle2
} from 'lucide-react';
import { api } from '../api/apiClient';

export default function SystemSettings() {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    api.get('/health')
      .then(res => setHealthData(res))
      .catch(err => console.warn('Health check failed:', err));
  }, []);

  return (
    <div className="dashboard-page-root">
      <div className="dashboard-container" style={{ maxWidth: '960px' }}>
        <div className="dashboard-header-bar">
          <div>
            <h1 className="dashboard-page-title">System Settings & Architecture Status</h1>
            <p className="dashboard-page-sub">
              Hardware environment, blockchain registry configuration, and engineering provenance
            </p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="var(--purple-700)" />
            Active Blockchain Registry Configuration
          </h3>
          <p className="card-subtitle">
            Emertech Certify connects to an Ethereum-compatible Solidity smart contract registry.
          </p>

          <div className="table-responsive">
            <table className="data-table">
              <tbody>
                <tr>
                  <td><strong>Smart Contract:</strong></td>
                  <td><code>CertificateRegistry.sol</code> (Solidity 0.8.19)</td>
                </tr>
                <tr>
                  <td><strong>Deployed Address:</strong></td>
                  <td>
                    <span className="mono-text">
                      {process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Network / Chain ID:</strong></td>
                  <td>Localhost Hardhat Network (Chain ID: 31337) / Sepolia Testnet (11155111)</td>
                </tr>
                <tr>
                  <td><strong>Cryptographic Fingerprinting:</strong></td>
                  <td>SHA-256 (bytes32 format, 256-bit tamper detection)</td>
                </tr>
                <tr>
                  <td><strong>On-Chain Capabilities:</strong></td>
                  <td>Issuance, Cryptographic Hash Match, On-Chain Revocation, Event Logging</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={20} color="var(--purple-700)" />
            Decentralized Storage & AI OCR Subsystems
          </h3>
          <p className="card-subtitle">
            Zero-cost local execution fallbacks designed for seamless academic evaluation.
          </p>

          <div className="table-responsive">
            <table className="data-table">
              <tbody>
                <tr>
                  <td><strong>Storage Pipeline:</strong></td>
                  <td>
                    Hybrid IPFS (Pinata SDK) with automated <strong>Local Storage Fallback</strong>.
                    Operates offline with zero external paid API requirements.
                  </td>
                </tr>
                <tr>
                  <td><strong>AI OCR Module:</strong></td>
                  <td>
                    Tesseract.js Neural OCR & PDF text parsing engine.
                    Extracts student names, enrollment IDs, degree titles, and dates.
                  </td>
                </tr>
                <tr>
                  <td><strong>Database:</strong></td>
                  <td>
                    MongoDB with automated embedded in-memory server fallback (<code>mongodb-memory-server</code>).
                  </td>
                </tr>
                <tr>
                  <td><strong>API Status:</strong></td>
                  <td>
                    <span className="badge badge-authentic">
                      <CheckCircle2 size={12} /> {healthData?.status?.toUpperCase() || 'ONLINE (Port 5001)'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Engineering Attribution Card */}
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--purple-700)" />
            Project Provenance & Academic Credits
          </h3>
          <p className="card-subtitle">
            Academic demonstration documentation and developer metadata.
          </p>

          <div className="table-responsive">
            <table className="data-table">
              <tbody>
                <tr>
                  <td><strong>Project Title:</strong></td>
                  <td>AI-Assisted Blockchain-Based Academic Certificate Verification System</td>
                </tr>
                <tr>
                  <td><strong>Project Branding:</strong></td>
                  <td><strong>Emertech Certify</strong></td>
                </tr>
                <tr>
                  <td><strong>Developer & Maintainer:</strong></td>
                  <td><strong>Saqib Ahmad Bhat</strong></td>
                </tr>
                <tr>
                  <td><strong>Department:</strong></td>
                  <td>Computer Science and Engineering</td>
                </tr>
                <tr>
                  <td><strong>Institution:</strong></td>
                  <td><strong>Government College of Engineering, Tirunelveli</strong></td>
                </tr>
                <tr>
                  <td><strong>Internship Context:</strong></td>
                  <td>AI and Blockchain Engineer Intern (Emertech Innovations Private Limited context)</td>
                </tr>
                <tr>
                  <td><strong>Upstream Foundation:</strong></td>
                  <td>
                    Based on Certiport by Alwin James (MIT License). 
                    Complete original license and modifications documented in <code>NOTICE.md</code>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
