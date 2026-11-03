import React from 'react';

export default function VerificationBadge({ status }) {
  const norm = (status || '').toUpperCase();

  switch (norm) {
    case 'AUTHENTIC':
      return (
        <span className="status-pill authentic">
          <span className="dot" />
          Verified Authentic
        </span>
      );
    case 'TAMPER_DETECTED':
      return (
        <span className="status-pill tampered">
          <span className="dot" />
          Tamper Detected
        </span>
      );
    case 'REVOKED':
      return (
        <span className="status-pill revoked">
          <span className="dot" />
          Certificate Revoked
        </span>
      );
    case 'NOT_FOUND':
    default:
      return (
        <span className="status-pill not-found">
          <span className="dot" />
          Not Found
        </span>
      );
  }
}
