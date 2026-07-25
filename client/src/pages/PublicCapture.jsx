import React, { useState } from 'react';
import { api } from '../services/api';

export const PublicCapture = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.captureLead(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="capture-page fade-in">
      <div className="glass-card auth-card slide-up" style={{ maxWidth: '600px' }}>
        <h1 className="auth-logo">LeadFlow</h1>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Let's Connect</h2>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' }}>Fill out the form below and our team will get in touch.</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✨</div>
            <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Thank You!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Your information has been received. We'll be in touch shortly.</p>
            <button className="btn btn-primary" onClick={() => setSuccess(false)} style={{ marginTop: '2rem' }}>
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Company</label>
                <input type="text" name="company" className="form-input" value={formData.company} onChange={handleChange} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">How did you hear about us?</label>
              <select name="source" className="form-select" value={formData.source} onChange={handleChange}>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Submit'}
            </button>
          </form>
        )}
      </div>

      <footer className="footer" style={{ marginTop: '3rem' }}>
        <p>Built for Digital Heroes Training Task | <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer">digitalheroesco.com</a></p>
      </footer>
    </div>
  );
};
