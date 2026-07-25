import db from '../db/database.js';

export const leadService = {
  getLeads({ page = 1, limit = 20, status, assigned_to, search, sort = 'created_at', order = 'desc', userId, userRole }) {
    let query = 'SELECT leads.*, users.name as assigned_user_name FROM leads LEFT JOIN users ON leads.assigned_to = users.id WHERE 1=1';
    const params = [];

    if (userRole === 'member') {
      query += ' AND leads.assigned_to = ?';
      params.push(userId);
    }

    if (status) {
      query += ' AND leads.status = ?';
      params.push(status);
    }

    if (assigned_to) {
      if (userRole !== 'member' || parseInt(assigned_to) === userId) {
        query += ' AND leads.assigned_to = ?';
        params.push(assigned_to);
      }
    }

    if (search) {
      query += ' AND (leads.name LIKE ? OR leads.email LIKE ? OR leads.company LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const totalCountQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const total = db.prepare(totalCountQuery).get(...params).total;

    const allowedSort = ['created_at', 'updated_at', 'name', 'value', 'status'];
    const safeSort = allowedSort.includes(sort) ? sort : 'created_at';
    const safeOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';

    query += ` ORDER BY leads.${safeSort} ${safeOrder}`;
    
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const leads = db.prepare(query).all(...params);

    return {
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  getLeadById(id, userId, userRole) {
    const lead = db.prepare('SELECT leads.*, users.name as assigned_user_name FROM leads LEFT JOIN users ON leads.assigned_to = users.id WHERE leads.id = ?').get(id);
    
    if (!lead) {
      const err = new Error('Lead not found');
      err.status = 404;
      throw err;
    }

    if (userRole === 'member' && lead.assigned_to !== userId) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }

    lead.notes = db.prepare('SELECT notes.*, users.name as user_name FROM notes JOIN users ON notes.user_id = users.id WHERE notes.lead_id = ? ORDER BY notes.created_at DESC').all(id);
    lead.activities = db.prepare('SELECT activity_log.*, users.name as user_name FROM activity_log LEFT JOIN users ON activity_log.user_id = users.id WHERE activity_log.lead_id = ? ORDER BY activity_log.created_at DESC').all(id);

    return lead;
  },

  createLead(data) {
    const { name, email, phone, company, source = 'website' } = data;
    
    const insertLead = db.prepare('INSERT INTO leads (name, email, phone, company, source) VALUES (?, ?, ?, ?, ?)');
    const result = insertLead.run(name, email, phone, company, source);
    const leadId = result.lastInsertRowid;

    const insertActivity = db.prepare('INSERT INTO activity_log (lead_id, action, details) VALUES (?, ?, ?)');
    insertActivity.run(leadId, 'Lead captured', JSON.stringify({ source }));

    return db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  },

  updateLead(id, data, userId, userRole) {
    const currentLead = this.getLeadById(id, userId, userRole);
    
    const fields = [];
    const params = [];
    
    const allowedFields = ['name', 'email', 'phone', 'company', 'status', 'source', 'value', 'assigned_to'];
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (fields.length === 0) return currentLead;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    
    const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);
    
    db.prepare(query).run(...params);

    if (data.status && data.status !== currentLead.status) {
      db.prepare('INSERT INTO activity_log (lead_id, user_id, action, details) VALUES (?, ?, ?, ?)')
        .run(id, userId, 'Status changed', `${currentLead.status} -> ${data.status}`);
    }

    if (data.assigned_to !== undefined && data.assigned_to !== currentLead.assigned_to) {
      let assignedUserName = 'Unassigned';
      if (data.assigned_to) {
         const user = db.prepare('SELECT name FROM users WHERE id = ?').get(data.assigned_to);
         if (user) assignedUserName = user.name;
      }
      db.prepare('INSERT INTO activity_log (lead_id, user_id, action, details) VALUES (?, ?, ?, ?)')
        .run(id, userId, 'Lead assigned', assignedUserName);
    }

    return this.getLeadById(id, userId, userRole);
  },

  deleteLead(id) {
    const result = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    if (result.changes === 0) {
      const err = new Error('Lead not found');
      err.status = 404;
      throw err;
    }
    return true;
  },

  addNote(leadId, userId, content) {
    const result = db.prepare('INSERT INTO notes (lead_id, user_id, content) VALUES (?, ?, ?)').run(leadId, userId, content);
    db.prepare('INSERT INTO activity_log (lead_id, user_id, action) VALUES (?, ?, ?)').run(leadId, userId, 'Note added');
    
    return db.prepare('SELECT notes.*, users.name as user_name FROM notes JOIN users ON notes.user_id = users.id WHERE notes.id = ?').get(result.lastInsertRowid);
  },

  getActivity(leadId) {
    return db.prepare('SELECT activity_log.*, users.name as user_name FROM activity_log LEFT JOIN users ON activity_log.user_id = users.id WHERE activity_log.lead_id = ? ORDER BY activity_log.created_at DESC').all(leadId);
  },

  getStats(userId, userRole) {
    let baseWhere = '1=1';
    let params = [];
    if (userRole === 'member') {
      baseWhere = 'assigned_to = ?';
      params.push(userId);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE ${baseWhere}`).get(...params).count;
    
    const byStatus = db.prepare(`SELECT status, COUNT(*) as count FROM leads WHERE ${baseWhere} GROUP BY status`).all(...params);
    
    const valueRow = db.prepare(`SELECT SUM(value) as total_value FROM leads WHERE ${baseWhere}`).get(...params);
    const total_value = valueRow.total_value || 0;
    
    const wonCountRow = db.prepare(`SELECT COUNT(*) as count FROM leads WHERE status = 'won' AND ${baseWhere}`).get(...params);
    const wonCount = wonCountRow ? wonCountRow.count : 0;
    
    const conversion_rate = total > 0 ? (wonCount / total) * 100 : 0;
    
    const recent = db.prepare(`SELECT * FROM leads WHERE ${baseWhere} ORDER BY created_at DESC LIMIT 5`).all(...params);

    return { total, byStatus, total_value, conversion_rate, recent };
  }
};
