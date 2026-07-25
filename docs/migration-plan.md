# Migration Plan

The goal is to improve the system without taking it offline or doing a risky rewrite. I would modernize it in small releases, keeping the old behavior working while replacing the most dangerous parts first.

## Week 1: Stabilize The Existing App

This week is about security and deploy confidence, not architecture cleanup.

### What ships

- Secrets moved out of the repo and rotated.
- Admin routes protected with auth and role checks.
- Unsafe SQL replaced in the highest-risk routes.
- Passwords hashed for new users.
- Basic error middleware added.
- First API tests added for login, permissions, and lead creation.

### Why this comes first

These issues can directly cause data loss or data exposure. They also do not require redesigning the whole application.

### Rollback approach

Each fix ships separately. If a route breaks, only that change is rolled back. Rotated secrets should not be rolled back to leaked values.

### How I would verify it

- Unauthenticated admin request returns `401`.
- Member hitting admin route returns `403`.
- Admin can still do admin work.
- SQL injection strings are stored/search as plain text, not executed.
- Existing users can still log in after the password migration path.

## Month 1: Create Safer Boundaries

After the worst risks are handled, I would start separating responsibilities.

### What ships

- Frontend stops connecting directly to the database.
- Backend exposes API endpoints for the frontend.
- Route handlers are split into route, controller, and service layers.
- Request validation is added to important endpoints.
- CI runs tests on every pull request.
- Staging environment is created with its own database.

### How to avoid a big-bang rewrite

Do one workflow at a time:

1. Add a new backend endpoint.
2. Test it.
3. Move one frontend screen to the endpoint.
4. Deploy.
5. Watch logs.
6. Remove the old path only after the new one is stable.

For example, I would migrate lead list first because it is read-heavy and easier to verify. Then lead update, notes, assignment, and admin user management.

## Quarter 1: Make It Maintainable

Once the app is safer, I would invest in the work that helps the team move faster.

### What ships

- More tests around lead lifecycle and permissions.
- Database migrations instead of manual schema edits.
- Versioned API routes if external clients depend on the API.
- Better logging and basic monitoring.
- Smaller frontend components.
- Documented engineering standards.

### Success criteria

- A new developer can run the app locally from the README.
- Every pull request runs tests.
- Permission changes have test coverage.
- The frontend has no database credentials.
- Production has useful logs when something fails.
- Schema changes are reviewed and repeatable.

## What I Would Not Do

I would not pause feature work for a full rewrite. I would also avoid introducing too many tools at once. The app already has production risk; the migration should reduce that risk, not create a second unfinished system beside it.

The right approach is boring on purpose: small changes, tests around the changed behavior, and frequent deploys.
