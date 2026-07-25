import db from '../db/database.js';
import bcrypt from 'bcryptjs';

export const userService = {
  getUsers() {
    return db.prepare('SELECT id, email, name, role, avatar, created_at FROM users ORDER BY created_at').all();
  },

  createUser({ name, email, password, role = 'member' }) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      const err = new Error('Email already exists');
      err.status = 409;
      throw err;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashedPassword, role);
    
    return this.getUserById(result.lastInsertRowid);
  },

  getUserById(id) {
    return db.prepare('SELECT id, email, name, role, avatar, created_at FROM users WHERE id = ?').get(id);
  }
};
