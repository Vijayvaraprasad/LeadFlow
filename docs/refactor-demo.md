# Refactor Demonstration: From Chaos to Clean Architecture

This document demonstrates the practical application of our engineering standards by refactoring a problematic legacy route handler into a clean, layered architecture.

## BEFORE (The Bad Code)

This represents the current state of the codebase. It's a monolithic route handler that mixes HTTP concerns, business logic, validation, authentication, direct database access, and side effects.

```javascript
// server.js (Legacy snippet)
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
// Hardcoded DB connection!
const db = new sqlite3.Database('c:/data/prod.db'); 
const sendEmail = require('./utils/mailer');

app.put('/api/leads/:id', async (req, res) => {
  try {
    // 1. Inline Auth (Hardcoded and brittle)
    const userEmail = req.headers['x-user-email'];
    if (userEmail !== 'admin@company.com') {
      console.log('Unauthorized access attempt');
      return res.status(403).send('Not allowed');
    }

    // 2. Inline Validation
    const id = req.params.id;
    const { status, assignedTo, value } = req.body;
    
    if (!status) {
      return res.status(400).send('Status is required');
    }
    if (status !== 'New' && status !== 'Contacted' && status !== 'Qualified') {
       return res.status(400).send('Invalid status');
    }
    
    // 3. String concatenation SQL (SQL Injection vulnerability!)
    let query = "UPDATE leads SET status = '" + status + "'";
    
    if (assignedTo) {
      query += ", assigned_to = '" + assignedTo + "'";
    }
    if (value) {
      query += ", value = " + value;
    }
    
    query += " WHERE id = " + id;
    
    console.log('Running query:', query); // Noisy logging

    db.run(query, function(err) {
      if (err) {
        console.log(err);
        return res.status(500).send('Something went wrong'); // Generic error, unhelpful
      }
      
      if (this.changes === 0) {
        return res.status(404).send('Lead not found');
      }

      // 4. Inline side-effects mixed with DB logic
      if (status === 'Qualified') {
        // Magic string for email template
        sendEmail('sales@company.com', 'New Qualified Lead', 'Lead ' + id + ' is qualified!');
      }

      res.status(200).json({ message: 'Updated successfully' });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});
```

---

## AFTER (The Refactored Code)

We break this down using the Layered Architecture pattern.

### 1. Route Definition (The Wiring)
Clean, readable, and defines the middleware pipeline.

```javascript
// routes/lead.routes.js
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateLeadSchema } from '../schemas/lead.schema.js';
import { LeadController } from '../controllers/lead.controller.js';

const router = Router();
const leadController = new LeadController();

router.put(
  '/:id',
  requireAuth,
  requireRole('ADMIN'),
  validate(updateLeadSchema),
  leadController.updateLead
);

export default router;
```

### 2. Validation Schema (Reusable)
Uses Zod to guarantee the shape of the data before it hits our controller.

```javascript
// schemas/lead.schema.js
import { z } from 'zod';

export const updateLeadSchema = z.object({
  body: z.object({
    status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']),
    assignedTo: z.string().uuid().optional(),
    value: z.number().positive().optional()
  }),
  params: z.object({
    id: z.string().uuid()
  })
});
```

### 3. Controller (HTTP Concerns Only)
Parses the request, calls the service, and formats the HTTP response. Knows nothing about SQL.

```javascript
// controllers/lead.controller.js
import { LeadService } from '../services/lead.service.js';

export class LeadController {
  constructor() {
    this.leadService = new LeadService();
  }

  updateLead = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedLead = await this.leadService.updateLead(id, updates);
      
      res.status(200).json({
        status: 'success',
        data: { lead: updatedLead }
      });
    } catch (error) {
      next(error); // Passes to global error handler middleware
    }
  };
}
```

### 4. Service (Business Logic)
The core logic. It orchestrates database calls and triggers side effects.

```javascript
// services/lead.service.js
import { LeadRepository } from '../repositories/lead.repository.js';
import { NotificationService } from './notification.service.js';
import { NotFoundError } from '../utils/errors.js';

export class LeadService {
  constructor() {
    this.leadRepo = new LeadRepository();
    this.notificationService = new NotificationService();
  }

  async updateLead(id, updates) {
    const lead = await this.leadRepo.findById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID ${id} not found`);
    }

    const updatedLead = await this.leadRepo.update(id, updates);

    // Business Rule: Notify sales when a lead is qualified
    if (updates.status === 'Qualified' && lead.status !== 'Qualified') {
      await this.notificationService.notifySalesOfQualifiedLead(updatedLead);
    }

    return updatedLead;
  }
}
```

### 5. Repository (Data Access)
Handles database interaction using Parameterized Queries to prevent SQL injection.

```javascript
// repositories/lead.repository.js
import { db } from '../config/database.js'; // Connection pool initialized elsewhere

export class LeadRepository {
  async update(id, updates) {
    // Parameterized query eliminates SQL injection
    const stmt = db.prepare(`
      UPDATE leads 
      SET 
        status = COALESCE(@status, status),
        assigned_to = COALESCE(@assignedTo, assigned_to),
        value = COALESCE(@value, value)
      WHERE id = @id
      RETURNING *
    `);
    
    return stmt.get({ id, ...updates });
  }
  
  async findById(id) {
    const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
    return stmt.get(id);
  }
}
```

---

## Commentary & Analysis

### What Improved and Why

1.  **Security (SQLi Eliminated):** By moving to the Repository pattern and using `db.prepare()`, we eliminated the critical SQL injection vulnerability. Input is now treated strictly as data.
2.  **Security (Auth Standardization):** Authentication is no longer a hardcoded email check inline. It uses standard JWT middleware (`requireAuth`) and role checks (`requireRole`), ensuring consistency across the application.
3.  **Reliability (Validation):** The Zod schema ensures that the Controller and Service *never* receive malformed data. We don't have to write messy `if (!req.body.status)` checks in our business logic anymore.
4.  **Maintainability (Separation of Concerns):** The `server.js` file is no longer a dumping ground. If we need to change how emails are sent, we touch `notification.service.js`. If we change the DB schema, we touch `lead.repository.js`.

### The Testing Story

The legacy code was practically untestable. You had to spin up an Express server and a real database just to test the email notification logic.

Now, we can test everything in isolation:
*   **Unit Test `LeadService`:** We can mock `LeadRepository` and `NotificationService` to instantly test that the email triggers *only* when the status changes to 'Qualified', without hitting a real database.
*   **Integration Test `LeadRepository`:** We can test SQL queries against an in-memory SQLite instance.
*   **E2E Test the API:** We can use Supertest to hit the route and ensure the middleware pipeline (Auth -> Validate -> Controller) works correctly.

### Safe Refactoring Strategy (Strangler Fig)

To ship this safely to production:
1.  **Don't delete the old code yet.** Keep `app.put('/api/leads/:id')` running.
2.  Build the new architecture alongside it, exposing it on a new versioned route: `router.put('/api/v2/leads/:id')`.
3.  Write comprehensive tests for the `v2` endpoint.
4.  Update the frontend to point to the `v2` endpoint.
5.  Monitor logs for errors and fallback if necessary.
6.  Once verified, remove the legacy `app.put` code.
