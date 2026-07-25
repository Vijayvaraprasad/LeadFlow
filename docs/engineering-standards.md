# Engineering Standards Proposal & Adoption Strategy

**Objective:** Establish a baseline of engineering quality for the LeadFlow platform to increase deployment confidence, reduce production bugs, and accelerate feature development over the long term.

---

## Part 1: Engineering Standards

### 1. Code Review Protocol
*   **Requirement:** All changes targeting `main` require at least 1 approval from a peer.
*   **No Self-Merges:** Authors may not merge their own pull requests.
*   **SLA:** Reviews should be completed within 4 working hours to prevent blocking.
*   **Focus:** Reviewers should focus on architecture, security, and logic. Style should be handled by automated tools.

### 2. Testing Requirements
*   **New Code:** Must be accompanied by automated tests.
*   **Bug Fixes:** Must include a regression test that fails without the fix and passes with it.
*   **Coverage Targets:** 
    *   Services (Business Logic): 70% Unit Test Coverage.
    *   API Endpoints (Critical Paths): Integration tests via Supertest.

### 3. Git Workflow
*   **Branching:** Trunk-based development. Branches should be short-lived (merged within 2 days).
*   **Naming:** `feature/TICKET-brief-desc`, `fix/TICKET-brief-desc`.
*   **Merging:** Squash and merge to `main`. This keeps the main history clean and readable.
*   **Commits:** Follow Conventional Commits (e.g., `feat: add user login`, `fix: handle null pointer`).

### 4. API Design Standards
*   **RESTful:** Use correct HTTP methods (GET, POST, PUT, DELETE).
*   **Status Codes:** Use appropriate codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error).
*   **Validation:** All incoming request bodies and query parameters must be validated at the edge (via middleware) before reaching controllers.
*   **Pagination:** All endpoints returning lists must implement limit/offset pagination.

### 5. Security Standards
*   **Zero Secrets:** No passwords, API keys, or JWT secrets in code. Use environment variables.
*   **SQL Injection:** Raw string concatenation for SQL queries is strictly prohibited. Parameterized queries or query builders must be used.
*   **Sanitization:** Assume all user input is malicious. Validate and sanitize.

### 6. Architecture Patterns
*   **Layered Architecture:** 
    *   `Routes`: HTTP wiring only.
    *   `Controllers`: Request parsing and response formatting.
    *   `Services`: Core business rules and orchestration.
    *   `Repositories`: Database interactions.
*   **Single Responsibility Principle:** A function or class should do one thing. If a file exceeds 300 lines, it should likely be split.

### 7. Code Style & Tooling
*   **Automation:** Prettier and ESLint will be configured.
*   **Enforcement:** Code must pass linting and formatting checks in CI before merging.

---

## Part 2: Adoption Strategy (Winning Over the Team)

Introducing standards to a team accustomed to a "wild west" codebase requires empathy and strategy. Mandates from above build resentment; demonstrating value builds adoption.

### Addressing Common Objections

**Objection: "We don't have time for this, we need to ship features."**
*   *Response:* "I hear you, and shipping is our top priority. However, debugging production crashes and dealing with merge conflicts is currently eating up 30% of our week. These standards are an investment to buy that time back. Let's start small: I'll set up automated formatting so we never have to argue about indentation in PRs again. That saves time on day one."

**Objection: "It's worked fine so far."**
*   *Response:* "It got us to where we are, which is great. But as we add more customers, the cracks are showing. We had a near-miss with data exposure last month. We need an architecture that supports our growth, not one that breaks under it."

**Objection: "Writing tests slows us down."**
*   *Response:* "Writing tests *does* take time upfront. But manual QA and fixing regressions takes longer. We will only require tests for *new* features and bug fixes initially. We aren't going to stop feature work to write tests for old code. I will pair with anyone to help write their first few tests."

**Objection: "You're over-engineering it with Services and Repositories."**
*   *Response:* "I understand it feels like extra boilerplate. Let me walk you through the `updateLead` refactor I did. By splitting it out, I was able to test the email notification logic in 2 seconds without spinning up a database. It makes testing easier, not harder."

### The Rollout Playbook

1.  **Start with Developer Experience (DX) Wins:** Don't start by demanding 100% test coverage. Start by adding Prettier on a pre-commit hook. The team gets immediate value (auto-formatting) with zero effort.
2.  **The "Boy Scout" Rule for Legacy Code:** We will NOT rewrite the app just to meet standards. The rule is: *Leave the campground cleaner than you found it.* If you touch a legacy file for a feature, improve its formatting and extract a piece of logic. 
3.  **Lead by Example, Not Mandate:** As a Tech Lead, I will take the hardest, messiest tickets. I will deliver them using the new architecture, with tests, and clearly documented PRs. People emulate what works.
4.  **Automate the "Bad Cop":** As humans, we shouldn't nitpick style in PRs. Let the CI pipeline (GitHub Actions) reject code that fails linting or drops test coverage. Developers don't argue with bots.
5.  **Provide Templates:** Make the right way the easy way. I will create a `generate-endpoint` script that scaffolds the Route, Controller, Service, and Test file instantly. 
6.  **Celebrate Saves:** When a unit test catches a bug *before* it gets merged, call it out in Slack or Standup. Make the value visible.
7.  **Iterative Retrospectives:** After one month, we will review these standards as a team. What's working? What's too painful? We will adjust them together. Standards are a living agreement, not a sacred text.
