# LeadFlow - Lead Management Platform

LeadFlow is a modern, full-stack lead management CRM built to capture, track, and convert potential customers. Designed with security, performance, and clean architecture in mind.

## Live Demo
*   **URL:** [To be filled after deployment]
*   **Admin Account:** `admin@leadflow.app` / `Admin123!`
*   **Member Account:** `sarah@leadflow.app` / `Member123!`

---

## Features
*   **Public Lead Capture:** Secure, rate-limited public endpoint for ingesting leads from marketing websites.
*   **Role-Based Access Control (RBAC):** Strict separation between `Admin` and `Member` privileges.
*   **Pipeline Management:** Track leads across 7 lifecycle stages (New, Contacted, Qualified, Proposal, Won, Lost, Nurture).
*   **Activity Trail:** Immutable audit logging for all status changes and assignments.
*   **Notes System:** Append timestamped notes to individual leads.
*   **Analytics Dashboard:** High-level metrics for sales performance.
*   **RESTful API:** Fully documented, paginated, and secure JSON API.

---

## Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js, Express 4 |
| **Database** | SQLite (via `better-sqlite3`) |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs |
| **Frontend** | React 18, Vite |
| **Testing** | Vitest, Supertest |
| **Deployment** | Render.com |

---

## Quick Start

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)

### Installation & Execution

```bash
# 1. Clone the repository
git clone <repo-url>
cd LeadFlow

# 2. Setup Backend
cd server
npm install
cp .env.example .env
# Ensure JWT_SECRET is set in .env
npm run dev

# 3. Setup Frontend (in a new terminal window)
cd ../client
npm install
npm run dev
```

*   **Server API:** `http://localhost:3001`
*   **Client App:** `http://localhost:5173`

---

## API Documentation

*   **Base URL:** `/api`
*   **Authentication:** Include `Authorization: Bearer <your_jwt_token>` in headers.

### 1. Authentication
**`POST /api/auth/login`**
*   **Auth:** None
*   **Body:** `{"email": "admin@leadflow.app", "password": "..."}`
*   **Response (200):** `{"token": "eyJhbG...", "user": {"id": 1, "role": "ADMIN"}}`

### 2. Leads (Public)
**`POST /api/leads/capture`**
*   **Auth:** None (Rate limited)
*   **Body:** `{"firstName": "John", "lastName": "Doe", "email": "john@example.com", "source": "Website"}`
*   **Response (201):** `{"message": "Lead captured successfully"}`

### 3. Leads (Protected)
**`GET /api/leads`**
*   **Auth:** Required (Member/Admin)
*   **Params:** `?page=1&limit=10&status=New&sort=createdAt&order=desc`
*   **Response (200):** `{"data": [...], "meta": {"total": 45, "page": 1, "totalPages": 5}}`

**`GET /api/leads/:id`**
*   **Auth:** Required (Member/Admin)
*   **Response (200):** `{"data": {"id": 1, "firstName": "John", ...}}`

**`PUT /api/leads/:id`**
*   **Auth:** Required (Member/Admin)
*   **Body:** `{"status": "Contacted", "assignedTo": 2}`
*   **Response (200):** `{"data": {"id": 1, "status": "Contacted", ...}}`

**`DELETE /api/leads/:id`**
*   **Auth:** Required (Admin ONLY)
*   **Response (204):** No Content

### 4. Lead Interactions
**`POST /api/leads/:id/notes`**
*   **Auth:** Required (Member/Admin)
*   **Body:** `{"content": "Spoke on phone, very interested."}`
*   **Response (201):** `{"data": {"id": 10, "content": "..."}}`

**`GET /api/leads/:id/activity`**
*   **Auth:** Required (Member/Admin)
*   **Response (200):** `{"data": [{"action": "STATUS_CHANGE", "timestamp": "...", "by": 2}]}`

### 5. Administration
**`GET /api/users`**
*   **Auth:** Required (Admin ONLY)
*   **Response (200):** `{"data": [{"id": 1, "email": "...", "role": "ADMIN"}, ...]}`

**`POST /api/users`**
*   **Auth:** Required (Admin ONLY)
*   **Body:** `{"email": "new@leadflow.app", "password": "...", "role": "MEMBER"}`
*   **Response (201):** `{"data": {"id": 3, "email": "..."}}`

---

## Data Model

| Table | Description | Key Fields |
| :--- | :--- | :--- |
| `users` | System users (Admins, Sales) | id, email, password_hash, role |
| `leads` | Potential customers | id, first_name, last_name, email, status, source, assigned_to |
| `notes` | Text notes attached to leads | id, lead_id, author_id, content, created_at |
| `activities` | Immutable audit log | id, lead_id, user_id, action_type, metadata, created_at |

---

## Auth & Permissions Matrix

| Action | Public | Member | Admin |
| :--- | :--- | :--- | :--- |
| Capture Lead | ✅ | ✅ | ✅ |
| View Leads | ❌ | ✅ | ✅ |
| Update Lead Status | ❌ | ✅ | ✅ |
| Add Notes | ❌ | ✅ | ✅ |
| Delete Lead | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## Testing

The project uses `Vitest` for unit tests and `Supertest` for API integration tests.

```bash
cd server
npm test
```
**Coverage Areas:**
*   JWT generation and verification logic.
*   Role-based access control middleware (ensuring Members cannot hit Admin routes).
*   Lead lifecycle validation (preventing invalid status transitions).
*   Pagination logic accuracy.

---

## Task B Documentation

As part of the technical assessment, the following architectural documents have been prepared and are located in the `/docs` directory:

*   [Assessment Document](./docs/task-b-assessment.md): A critical review of legacy codebase anti-patterns.
*   [Migration Plan](./docs/migration-plan.md): A zero-downtime strategy to modernize the legacy code.
*   [Refactor Demo](./docs/refactor-demo.md): A before/after code comparison demonstrating layered architecture.
*   [Engineering Standards](./docs/engineering-standards.md): Proposed team standards and adoption strategy.

---

## AI Usage Statement

AI tools (Google Gemini / Claude) were used throughout this project for  architecture planning, and documentation drafting. All generated things were reviewed, tested, and adapted to fit the specific requirements of this project. Key decisions around data modeling, permission architecture, and API design reflect my own technical judgment. The assessment documents and engineering standards reflect genuine professional experience and opinions.

---

