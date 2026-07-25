import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { seed } from '../src/db/seed.js';

describe('Auth & Authorization', () => {
  beforeAll(() => {
    seed();
  });

  const login = async (email, password) => {
    const res = await request(app).post('/api/auth/login').send({ email, password });
    return res.body.token;
  };

  it('1. POST /api/auth/login with valid admin credentials -> 200, has token and user object', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leadflow.app', password: 'Admin123!' });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('2. POST /api/auth/login with wrong password -> 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leadflow.app', password: 'wrong' });
    
    expect(res.status).toBe(401);
  });

  it('3. POST /api/auth/login with non-existent email -> 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nope@leadflow.app', password: 'password' });
    
    expect(res.status).toBe(401);
  });

  it('4. GET /api/leads without token -> 401', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('5. GET /api/leads with invalid token -> 401', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(res.status).toBe(401);
  });

  it('6. GET /api/users with member token -> 403', async () => {
    const token = await login('sarah@leadflow.app', 'Member123!');
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
  });

  it('7. GET /api/users with admin token -> 200', async () => {
    const token = await login('admin@leadflow.app', 'Admin123!');
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('8. DELETE /api/leads/1 with member token -> 403', async () => {
    const token = await login('sarah@leadflow.app', 'Member123!');
    const res = await request(app)
      .delete('/api/leads/1')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(403);
  });

  it('9. POST /api/users with member token -> 403', async () => {
    const token = await login('sarah@leadflow.app', 'Member123!');
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', email: 'test@test.com', password: 'test' });
    
    expect(res.status).toBe(403);
  });
});
