import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="loading-spinner lg"></div>
      </div>
    );
  }

  const defaultStats = {
    totalLeads: 0,
    wonDeals: 0,
    conversionRate: 0,
    activePipeline: 0,
    pipeline: { new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 },
    recentLeads: []
  };

  const data = stats || defaultStats;
  const statusColors = {
    new: '#3b82f6', contacted: '#8b5cf6', qualified: '#06b6d4', 
    proposal: '#f59e0b', negotiation: '#f97316', won: '#10b981', lost: '#ef4444'
  };

  const totalPipeline = Object.values(data.pipeline).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Welcome back, {user?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-card stats-card slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stats-header">
            <span>Total Leads</span>
            <span>👥</span>
          </div>
          <div className="stats-value">{data.totalLeads}</div>
        </div>
        
        <div className="glass-card stats-card slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="stats-header">
            <span>Won Deals</span>
            <span>🏆</span>
          </div>
          <div className="stats-value">${data.wonDeals.toLocaleString()}</div>
        </div>
        
        <div className="glass-card stats-card slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="stats-header">
            <span>Conversion Rate</span>
            <span>📈</span>
          </div>
          <div className="stats-value">{data.conversionRate.toFixed(1)}%</div>
        </div>
        
        <div className="glass-card stats-card slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="stats-header">
            <span>Active Pipeline</span>
            <span>⚡</span>
          </div>
          <div className="stats-value">{data.activePipeline}</div>
        </div>
      </div>

      <div className="glass-card slide-up" style={{ padding: '1.5rem', marginBottom: '2rem', animationDelay: '0.5s' }}>
        <h3 style={{ marginBottom: '1rem' }}>Pipeline Status</h3>
        <div className="pipeline-bar">
          {Object.entries(data.pipeline).map(([status, count]) => (
            count > 0 && (
              <div 
                key={status} 
                className="pipeline-segment" 
                style={{ 
                  width: `${(count / totalPipeline) * 100}%`, 
                  backgroundColor: statusColors[status],
                }}
                title={`${status}: ${count}`}
              ></div>
            )
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {Object.entries(data.pipeline).map(([status, count]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: statusColors[status] }}></div>
              <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{status}</span>
              <span style={{ fontWeight: '600' }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card slide-up" style={{ padding: '1.5rem', animationDelay: '0.6s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>Recent Leads</h3>
          <Link to="/leads" className="btn btn-sm btn-ghost">View All</Link>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLeads.length > 0 ? (
                data.recentLeads.map(lead => (
                  <tr key={lead.id} onClick={() => window.location.href = `/leads/${lead.id}`}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td>{lead.company || '-'}</td>
                    <td><span className={`badge badge-${lead.status}`}>{lead.status}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No recent leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
