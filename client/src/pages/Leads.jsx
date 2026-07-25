import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Leads = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const currentStatus = searchParams.get('status') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentAssignee = searchParams.get('assigned_to') || '';

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      try {
        const params = {
          status: currentStatus,
          search: currentSearch,
          assigned_to: currentAssignee
        };
        const data = await api.getLeads(params);
        setLeads(data.leads || []);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [currentStatus, currentSearch, currentAssignee]);

  useEffect(() => {
    if (isAdmin) {
      api.getUsers().then(data => setUsers(data.users || [])).catch(console.error);
    }
  }, [isAdmin]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Leads</h1>
        <button className="btn btn-primary" onClick={() => window.open('/capture', '_blank')}>
          + New Lead (Public Form)
        </button>
      </div>

      <div className="glass-card slide-up" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search leads by name, email, company..." 
              value={currentSearch}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <select 
            className="form-select" 
            value={currentStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {isAdmin && (
            <select 
              className="form-select" 
              value={currentAssignee}
              onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
            >
              <option value="">All Assignees</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="loading-spinner lg"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3>No leads found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Value</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{lead.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td>{lead.company || '-'}</td>
                    <td><span className={`badge badge-${lead.status}`}>{lead.status}</span></td>
                    <td>{lead.assignee_name || <span style={{color: 'var(--text-muted)'}}>Unassigned</span>}</td>
                    <td>${lead.value ? lead.value.toLocaleString() : '0'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
