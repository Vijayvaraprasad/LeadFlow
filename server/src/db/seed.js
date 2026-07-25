import db from './database.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

export function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');
  
  const hash = (password) => bcrypt.hashSync(password, 10);
  
  const insertUser = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
  const adminId = insertUser.run('admin@leadflow.app', hash('Admin123!'), 'Alex Thompson', 'admin').lastInsertRowid;
  const sarahId = insertUser.run('sarah@leadflow.app', hash('Member123!'), 'Sarah Chen', 'member').lastInsertRowid;
  const jamesId = insertUser.run('james@leadflow.app', hash('Member123!'), 'James Wilson', 'member').lastInsertRowid;

  const insertLead = db.prepare('INSERT INTO leads (name, email, phone, company, status, source, value, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const leads = [
    ['Alice Smith', 'alice@acmecorp.com', '555-0101', 'Acme Corp', 'new', 'website', 1000, null],
    ['Bob Jones', 'bob@techvision.com', '555-0102', 'TechVision', 'contacted', 'referral', 5000, sarahId],
    ['Charlie Brown', 'charlie@globalscale.com', '555-0103', 'GlobalScale', 'qualified', 'social', 10000, jamesId],
    ['Diana Prince', 'diana@amazon.com', '555-0104', 'Amazon', 'proposal', 'email', 25000, sarahId],
    ['Evan Wright', 'evan@stark.com', '555-0105', 'Stark Industries', 'negotiation', 'phone', 50000, jamesId],
    ['Fiona Gallagher', 'fiona@gallagher.com', '555-0106', 'Gallagher Inc', 'won', 'other', 15000, sarahId],
    ['George Miller', 'george@miller.com', '555-0107', 'Miller LLC', 'lost', 'website', 2000, jamesId],
    ['Hannah Abbott', 'hannah@abbott.com', '555-0108', 'Abbott Co', 'new', 'referral', 0, null],
    ['Ian Malcolm', 'ian@ingen.com', '555-0109', 'InGen', 'contacted', 'social', 8000, sarahId],
    ['Jack Torrance', 'jack@overlook.com', '555-0110', 'Overlook Hotel', 'qualified', 'email', 12000, jamesId],
    ['Kevin Flynn', 'kevin@encom.com', '555-0111', 'Encom', 'proposal', 'phone', 30000, sarahId],
    ['Laura Palmer', 'laura@twinpeaks.com', '555-0112', 'Twin Peaks', 'negotiation', 'other', 18000, jamesId],
    ['Martin Brody', 'martin@amity.com', '555-0113', 'Amity Police', 'won', 'website', 5000, sarahId],
    ['Nancy Wheeler', 'nancy@hawkins.com', '555-0114', 'Hawkins Post', 'lost', 'referral', 1000, jamesId],
    ['Oliver Twist', 'oliver@orphan.com', '555-0115', 'Orphanage', 'new', 'social', 500, null]
  ];

  const leadIds = [];
  for (const lead of leads) {
    leadIds.push(insertLead.run(...lead).lastInsertRowid);
  }

  const insertNote = db.prepare('INSERT INTO notes (lead_id, user_id, content) VALUES (?, ?, ?)');
  insertNote.run(leadIds[1], sarahId, 'Had a great initial call. Needs more info on pricing.');
  insertNote.run(leadIds[2], jamesId, 'Sent follow up email. Waiting for reply.');
  
  const insertActivity = db.prepare('INSERT INTO activity_log (lead_id, user_id, action, details) VALUES (?, ?, ?, ?)');
  insertActivity.run(leadIds[0], null, 'Lead captured', JSON.stringify({ source: 'website' }));
  insertActivity.run(leadIds[1], sarahId, 'Lead assigned', 'Sarah Chen');
  insertActivity.run(leadIds[1], sarahId, 'Status changed', 'new -> contacted');

  console.log('Seeding complete.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
