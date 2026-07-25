import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="empty-state fade-in" style={{ height: '100%', justifyContent: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>404</div>
      <h2>Page Not Found</h2>
      <p style={{ marginBottom: '2rem' }}>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
    </div>
  );
};
