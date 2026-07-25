# Task B Assessment

This is how I would assess a lead-management codebase that is already in production but has no tests, weak boundaries, direct database access from the frontend, and secrets in the repo.

The main rule: do not start with a rewrite. The product has customers, so the first job is to reduce risk while keeping the app online.

## Fix First

### 1. Secrets in the repo

This is the first thing I would handle. If production keys, database passwords, or JWT secrets are committed, I would assume they are compromised.

Risk if ignored: leaked production access, user impersonation, and database exposure.

Fix:

- Move secrets to environment variables.
- Rotate every exposed key.
- Keep `.env` out of Git.
- Check old commits for leaked values and treat them as burned.

This can ship quickly because it should not change product behavior.

### 2. Unprotected admin routes

Any endpoint that edits users, deletes leads, or changes ownership needs authentication and role checks.

Risk if ignored: a normal user, or even an unauthenticated request, could damage production data.

Fix:

- Add auth middleware.
- Add role middleware for admin-only actions.
- Write a few request-level tests before touching the routes.

I would verify this manually and with automated tests because mistakes here are expensive.

### 3. SQL injection

String-built SQL is not acceptable in a production CRM. Lead data usually includes names, emails, phone numbers, and business context, so a breach would be serious.

Risk if ignored: data theft, deleted records, modified records, or privilege escalation.

Fix:

- Replace string concatenation with parameterized queries.
- Start with login, lead search, lead update, and user management queries.
- Add tests for normal input and suspicious input.

### 4. Plain-text passwords

If passwords are stored directly, that has to be fixed immediately.

Risk if ignored: one database leak becomes an account takeover event.

Fix:

- Hash new passwords with bcrypt.
- Migrate existing users through forced reset or hash-on-next-login.
- Never log password values.

## Fix This Sprint

### 5. Frontend database access

The frontend should not know how to connect to the database. It should call an API.

Risk if ignored: validation, auth, rate limits, and logging can all be bypassed.

Fix:

- Add backend endpoints for the frontend workflows.
- Move data access into backend services.
- Replace frontend DB calls with a small API client.

### 6. No validation

Bad input should be rejected before it reaches business logic.

Risk if ignored: corrupt data, crashes, and security bugs.

Fix:

- Validate request bodies and query params.
- Return consistent `400` responses for invalid input.
- Add tests for invalid status, missing email, empty notes, and bad pagination.

### 7. No tests

No tests means every deploy depends on manual clicking and luck.

Risk if ignored: regressions will keep reaching customers.

Fix:

- Start with integration tests for login, lead capture, lead assignment, notes, and admin permissions.
- Do not chase a big coverage number on day one.
- Require tests for new behavior from this point forward.

### 8. Error handling

Route handlers should not crash the server or leak raw stack traces to users.

Risk if ignored: avoidable downtime and poor debugging.

Fix:

- Add global Express error middleware.
- Log useful context server-side.
- Return consistent JSON errors.

## Fix This Month

### 9. Business logic inside routes

Large route files make the app harder to test and easier to break.

Risk if ignored: duplicated logic, slow onboarding, and fragile changes.

Fix:

- Keep routes as wiring.
- Put request/response handling in controllers.
- Put business decisions in services.
- Put SQL in repositories or data-access helpers.

### 10. No environment separation

Development, staging, and production should not share the same database or secrets.

Risk if ignored: local testing can accidentally affect real customers.

Fix:

- Separate env files and Render/GitHub secrets.
- Add a staging deploy.
- Use seed data outside production.

### 11. Weak observability

`console.log` is fine while building, but not enough for a customer-facing system.

Risk if ignored: production issues take longer to understand.

Fix:

- Add structured logs.
- Log request IDs.
- Track failed logins, API errors, and slow endpoints.

## My Priority Order

1. Rotate secrets and remove them from code.
2. Protect admin routes.
3. Replace unsafe SQL.
4. Fix password storage.
5. Add tests around auth and lead workflows.
6. Move frontend data access behind an API.
7. Extract route logic into services.
8. Add CI, staging, and basic monitoring.

That order keeps the business running while reducing the worst risks first.
