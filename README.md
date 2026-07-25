# LeadFlow

LeadFlow is a small lead-management app built for the Digital Heroes training task. It has a public lead capture form and a logged-in sales workspace with admin/member roles.

## Live Demo

- URL: https://leadflow-1-yo9c.onrender.com/
- Admin: `admin@leadflow.app` / `Admin123!`
- Member: `sarah@leadflow.app` / `Member123!`

## What It Does

- Public lead capture at `/capture`
- Login with JWT auth
- Admin and member roles
- Lead list with search, status filter, assignment filter, and pagination
- Lead detail page with status pipeline, assignment, value, notes, and activity
- Admin-only team/user management
- JSON API used by the React app
- API tests for auth rules and lead flows

The app also includes the required footer credit:

`Built for Digital Heroes Training Task`

linked to `https://digitalheroesco.com`.

## Tech Stack

| Part | Tech |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | SQLite with `better-sqlite3` |
| Auth | JWT, bcrypt |
| Tests | Vitest, Supertest |
| Deploy | Render |

## Running Locally

Install dependencies:

```bash
npm run install:all
```

Start backend and frontend together:

```bash
npm run dev
```

Or run them separately:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Environment Variables

For local backend development:

```env
JWT_SECRET=replace-with-a-local-secret
DB_PATH=./data/leadflow.db
```

On Render, I used:

```env
NODE_ENV=production
JWT_SECRET=<stored in Render env vars>
DB_PATH=/tmp/leadflow.db
```

Note: `/tmp` storage on Render free tier is not persistent. It is fine for this demo, but a real version should use Postgres or another persistent database.

## API Docs

Base URL:

```text
/api
```

Protected routes require:

```text
Authorization: Bearer <token>
```

### Auth

#### `POST /api/auth/login`

Body:

```json
{
  "email": "admin@leadflow.app",
  "password": "Admin123!"
}
```

Success: `200`

```json
{
  "token": "...",
  "user": {
    "id": 1,
    "email": "admin@leadflow.app",
    "name": "Alex Thompson",
    "role": "admin"
  }
}
```

Invalid login: `401`

### Leads

#### `POST /api/leads/capture`

Public route. Used by the capture form.

Body:

```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "phone": "555-0101",
  "company": "Acme",
  "source": "website"
}
```

Success: `201`

#### `GET /api/leads`

Requires admin or member token.

Query params:

- `page`
- `limit`
- `status`
- `assigned_to`
- `search`
- `sort`
- `order`

Example:

```text
/api/leads?page=1&limit=10&status=new
```

Success: `200`

```json
{
  "leads": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Members only see leads assigned to them. Admins can see all leads.

#### `GET /api/leads/:id`

Returns one lead with notes and activities.

Success: `200`

Not found: `404`

Forbidden for an unassigned member: `403`

#### `PUT /api/leads/:id`

Updates lead fields.

Example body:

```json
{
  "status": "contacted",
  "assigned_to": 2,
  "value": 5000
}
```

Success: `200`

Status and assignment changes are written to the activity log.

#### `DELETE /api/leads/:id`

Admin only.

Success: `200`

Member access: `403`

#### `POST /api/leads/:id/notes`

Adds a note to a lead.

Body:

```json
{
  "content": "Called the lead and scheduled a follow-up."
}
```

Success: `201`

#### `GET /api/leads/:id/activity`

Returns activity entries for the lead.

Success: `200`

#### `GET /api/leads/stats`

Returns dashboard stats. Members only get stats for their assigned leads.

Success: `200`

### Users

#### `GET /api/users`

Admin only.

Success: `200`

#### `POST /api/users`

Admin only.

Body:

```json
{
  "name": "New Member",
  "email": "new.member@example.com",
  "password": "Member123!",
  "role": "member"
}
```

Success: `201`

Duplicate email: `409`

## Permission Summary

| Action | Public | Member | Admin |
| --- | --- | --- | --- |
| Submit public lead | Yes | Yes | Yes |
| Login | Yes | Yes | Yes |
| View assigned leads | No | Yes | Yes |
| View all leads | No | No | Yes |
| Update lead status | No | Assigned only | Yes |
| Add notes | No | Assigned only | Yes |
| Delete leads | No | No | Yes |
| Manage users | No | No | Yes |

## Tests

Run backend tests:

```bash
cd server
npm test
```

Current test coverage includes:

- Valid and invalid login
- Missing or invalid token
- Member blocked from admin routes
- Member blocked from lead delete
- Public lead capture
- Admin lead assignment
- Member lead visibility rules
- Status update activity logging
- Notes
- Filtering and pagination

## Task B Docs

The written Task B deliverables are in `/docs`:

- [Assessment](./docs/task-b-assessment.md)
- [Migration plan](./docs/migration-plan.md)
- [Refactor demo](./docs/refactor-demo.md)
- [Engineering standards](./docs/engineering-standards.md)

## Notes

This project was built as a practical assessment app, not as a production CRM. The main production change I would make next is replacing SQLite-on-Render with a persistent hosted database.
