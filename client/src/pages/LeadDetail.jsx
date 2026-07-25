import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const addToast = useToast();
  
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activity, setActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editValue, setEditValue] = useState('');

  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leadData = await api.getLead(id);
        setLead(leadData);
        setNotes(leadData.notes || []);
        setActivity(leadData.activities || []);
        setEditValue(leadData.value || 0);
        
        const activityData = await api.getActivity(id);
        setActivity(activityData.activity || []);

        if (isAdmin) {
          const usersData = await api.getUsers();
          setUsers(usersData.users || []);
        }
      } catch (error) {
        addToast('Failed to load lead details', 'error');
        navigate('/leads');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAdmin, addToast, navigate]);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === lead.status) return;
    if (!window.confirm(`Change status to ${newStatus}?`)) return;
    
    try {
      await api.updateLead(id, { status: newStatus });
      setLead({ ...lead, status: newStatus });
      addToast(`Status updated to ${newStatus}`, 'success');
      
      const activityData = await api.getActivity(id);
      setActivity(activityData.activity || []);
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleAssigneeChange = async (e) => {
    const newAssigneeId = e.target.value;
    try {
      await api.updateLead(id, { assigned_to: newAssigneeId || null });
      setLead({ ...lead, assigned_to: newAssigneeId });
      addToast('Assignee updated', 'success');
    } catch (error) {
      addToast('Failed to update assignee', 'error');
    }
  };

  const handleValueSave = async () => {
    try {
      await api.updateLead(id, { value: Number(editValue) });
      setLead({ ...lead, value: Number(editValue) });
      setIsEditingValue(false);
      addToast('Value updated', 'success');
    } catch (error) {
      addToast('Failed to update value', 'error');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setIsSubmittingNote(true);
    try {
      await api.addNote(id, newNote);
      setNewNote('');
      addToast('Note added', 'success');
      
      const activityData = await api.getActivity(id);
      setActivity(activityData.activity || []);
      const leadData = await api.getLead(id);
      setNotes(leadData.notes || []);
    } catch (error) {
      addToast('Failed to add note', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This cannot be undone.')) return;
    
    try {
      await api.deleteLead(id);
      addToast('Lead deleted', 'success');
      navigate('/leads');
    } catch (error) {
      addToast('Failed to delete lead', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="loading-spinner lg"></div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <button className="btn btn-sm btn-ghost" onClick={() => navigate('/leads')} style={{ marginBottom: '1rem' }}>
            ← Back to Leads
          </button>
          <h1>{lead.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{lead.company || 'No Company'}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Lead
          </button>
        )}
      </div>

      <div className="stepper slide-up">
        {statuses.map((status, index) => {
          const currentIndex = statuses.indexOf(lead.status);
          const isCompleted = index < currentIndex || (lead.status === 'won' && index === currentIndex) || (lead.status === 'lost' && index === currentIndex);
          const isCurrent = status === lead.status;
          
          return (
            <div 
              key={status} 
              className={`step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              onClick={() => handleStatusChange(status)}
            >
              <div className="step-dot"></div>
              <div className="step-label">{status}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Contact Info</h3>
            <div className="grid grid-cols-2" style={{ gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Email</div>
                <div><a href={`mailto:${lead.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{lead.email}</a></div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Phone</div>
                <div>{lead.phone || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Source</div>
                <div>{lead.source || '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Lead Value</div>
                {isEditingValue ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" className="form-input" style={{ padding: '0.25rem 0.5rem' }} value={editValue} onChange={e => setEditValue(e.target.value)} />
                    <button className="btn btn-sm btn-primary" onClick={handleValueSave}>Save</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setIsEditingValue(false)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: 'var(--success)' }}>${lead.value ? lead.value.toLocaleString() : '0'}</span>
                    <button className="btn-icon btn-ghost" onClick={() => setIsEditingValue(true)}>✏️</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Assignment</h3>
              <select className="form-select" value={lead.assigned_to || ''} onChange={handleAssigneeChange} style={{ width: '100%' }}>
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', position: 'sticky', top: '-1.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.5rem 0', zIndex: 2 }}>Notes</h3>
            
            {notes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No notes yet.</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="note-card glass-card" style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <div className="note-header">
                    <div className="note-author">
                      <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                        {note.author_name ? note.author_name[0].toUpperCase() : 'U'}
                      </div>
                      {note.author_name}
                    </div>
                    <div className="note-time">{new Date(note.created_at).toLocaleString()}</div>
                  </div>
                  <div className="note-content">{note.content}</div>
                </div>
              ))
            )}

            <form onSubmit={handleAddNote} style={{ marginTop: '1.5rem' }}>
              <textarea 
                className="form-input" 
                style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem', resize: 'vertical' }} 
                placeholder="Add a note..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              ></textarea>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingNote || !newNote.trim()}>
                {isSubmittingNote ? 'Saving...' : 'Add Note'}
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Activity History</h3>
            <div className="activity-timeline">
              {activity.map(act => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <strong>{act.author_name || 'System'}</strong> {act.action.replace('_', ' ')}
                    </div>
                    {act.details && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {act.details}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>No activity recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
