import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { seed } from '../src/db/seed.js';

describe('Leads API', () => {
  let adminToken;
  let memberToken; // sarah
  let leadId;

  beforeAll(async () => {
    seed();
    
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leadflow.app', password: 'Admin123!' });
    adminToken = adminRes.body.token;

    const memberRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@leadflow.app', password: 'Member123!' });
    memberToken = memberRes.body.token;
  });

  it('1. POST /api/leads/capture creates a lead without auth -> 201', async () => {
    const res = await request(app)
      .post('/api/leads/capture')
      .send({ name: 'Test Lead', email: 'test@lead.com' });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Lead');
    leadId = res.body.id;
  });

  it('2. New lead appears in admin lead list', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    const leads = res.body.leads;
    expect(leads.some(l => l.id === leadId)).toBe(true);
  });

  it('3. Admin can assign lead to member', async () => {
    const sarahRes = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    const sarahId = sarahRes.body.find(u => u.email === 'sarah@leadflow.app').id;

    const res = await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigned_to: sarahId });
    
    expect(res.status).toBe(200);
    expect(res.body.assigned_to).toBe(sarahId);
  });

  it('4. Member can see assigned leads but not unassigned leads', async () => {
    const unassignedLeadRes = await request(app)
      .post('/api/leads/capture')
      .send({ name: 'Unassigned Lead', email: 'unassigned@lead.com' });
    
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${memberToken}`);
    
    expect(res.status).toBe(200);
    const leads = res.body.leads;
    expect(leads.some(l => l.id === leadId)).toBe(true); // Assigned to sarah
    expect(leads.some(l => l.id === unassignedLeadRes.body.id)).toBe(false); // Unassigned
  });

  it('5. Status update creates activity log entry', async () => {
    await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'contacted' });
    
    const res = await request(app)
      .get(`/api/leads/${leadId}/activity`)
      .set('Authorization', `Bearer ${memberToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.some(a => a.action === 'Status changed')).toBe(true);
  });

  it('6. POST /api/leads/:id/notes adds a note -> 201', async () => {
    const res = await request(app)
      .post(`/api/leads/${leadId}/notes`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ content: 'Test note' });
    
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Test note');
  });

  it('7. Note appears in lead detail', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.notes.length).toBeGreaterThan(0);
    expect(res.body.notes[0].content).toBe('Test note');
  });

  it('8. Activity trail shows all actions', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadId}/activity`)
      .set('Authorization', `Bearer ${memberToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('9. GET /api/leads?status=new filters correctly', async () => {
    const res = await request(app)
      .get('/api/leads?status=new')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    res.body.leads.forEach(l => {
      expect(l.status).toBe('new');
    });
  });

  it('10. GET /api/leads?page=1&limit=2 paginates correctly', async () => {
    const res = await request(app)
      .get('/api/leads?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.leads.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('11. Admin can delete lead, member gets 403', async () => {
    const memberRes = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(memberRes.status).toBe(403);

    const adminRes = await request(app)
      .delete(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
  });
});
