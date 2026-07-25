# Engineering Standards

These are the standards I would introduce after stabilizing the codebase. I would keep them practical and enforce the parts that prevent real bugs.

## Code Reviews

- Every change to `main` needs one review.
- Security, permissions, data changes, and business logic should get the most attention.
- Formatting should be automated so reviews do not become style debates.
- Large pull requests should be split unless there is a clear reason not to.

## Testing

Tests should focus first on behavior that can break the business:

- Login and token handling.
- Admin versus member permissions.
- Lead capture.
- Lead assignment.
- Status changes.
- Notes and activity history.

For bug fixes, I would ask for a regression test when practical. I would not demand full coverage of old code before anyone can ship. That usually makes teams resist testing instead of adopting it.

## API Rules

- Use the right HTTP status codes.
- Validate request bodies and query params.
- Return JSON errors consistently.
- Paginate list endpoints.
- Do not expose password hashes or internal secrets.
- Keep response shapes stable once the frontend depends on them.

## Data Access

- No SQL string concatenation with user input.
- Use prepared statements or a query builder.
- Keep database calls out of React components.
- Put data access behind backend services or repositories.

## Security

- No secrets in Git.
- Passwords must be hashed.
- Admin routes must check both authentication and role.
- Public endpoints should have rate limits.
- Permission rules need tests, not only UI checks.

## Git Workflow

- Use short-lived branches.
- Keep commits focused.
- Squash merge is fine for feature branches.
- Use clear commit messages like `fix lead assignment permissions` or `add lead notes test`.

## How I Would Get The Team To Adopt This

I would not start by dropping a huge rules document on the team. I would start with changes that make their work easier.

First, add formatting and a simple test command. Then add tests around the riskiest flows. Then use those tests to make one painful refactor safer.

If someone says tests slow them down, I would not argue in theory. I would pick one recent production bug and show how a small test would have caught it. That is usually more convincing than a lecture.

If someone says service layers are overengineering, I would show one route before and after. The point is not to add folders. The point is to make business rules testable without starting the whole app.

The standard I would push hardest is this: when touching risky code, leave it easier to understand than when you found it. That is realistic for a busy team and still moves the codebase forward.
