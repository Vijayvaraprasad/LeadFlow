# Refactor Demo

This is a realistic example of the kind of route I would expect to find in the inherited codebase: too much logic in one place, direct SQL, weak auth, and no clean way to test it.

## Before

```javascript
app.put('/api/leads/:id', async (req, res) => {
  const userEmail = req.headers['x-user-email'];

  if (userEmail !== 'admin@company.com') {
    return res.status(403).send('Not allowed');
  }

  const { status, assignedTo } = req.body;

  if (!status) {
    return res.status(400).send('Status is required');
  }

  const sql =
    "UPDATE leads SET status = '" +
    status +
    "', assigned_to = '" +
    assignedTo +
    "' WHERE id = " +
    req.params.id;

  db.run(sql, function (err) {
    if (err) {
      console.log(err);
      return res.status(500).send('Something went wrong');
    }

    if (this.changes === 0) {
      return res.status(404).send('Lead not found');
    }

    if (status === 'qualified') {
      sendEmail('sales@company.com', 'Lead qualified', 'Lead is ready');
    }

    res.json({ ok: true });
  });
});
```

## Problems

- Auth is a hardcoded email check.
- SQL is built with string concatenation.
- Validation is incomplete.
- Email side effects are mixed into the route.
- The route is hard to test without running the server and database.
- Errors are inconsistent and not very useful.

## After

### Route

```javascript
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateLeadUpdate,
  updateLead
);
```

### Controller

```javascript
export async function updateLead(req, res, next) {
  try {
    const lead = await leadService.updateLead({
      id: req.params.id,
      updates: req.body,
      actorId: req.user.id
    });

    res.json(lead);
  } catch (error) {
    next(error);
  }
}
```

### Service

```javascript
export async function updateLead({ id, updates, actorId }) {
  const currentLead = await leadRepository.findById(id);

  if (!currentLead) {
    throw new NotFoundError('Lead not found');
  }

  const updatedLead = await leadRepository.update(id, updates);

  if (updates.status === 'qualified' && currentLead.status !== 'qualified') {
    await notificationService.sendQualifiedLeadAlert(updatedLead);
  }

  await activityService.record({
    leadId: id,
    userId: actorId,
    action: 'lead_updated',
    details: updates
  });

  return updatedLead;
}
```

### Repository

```javascript
export async function update(id, updates) {
  const stmt = db.prepare(`
    UPDATE leads
    SET status = COALESCE(@status, status),
        assigned_to = COALESCE(@assignedTo, assigned_to)
    WHERE id = @id
    RETURNING *
  `);

  return stmt.get({ id, ...updates });
}
```

## What Improved

The route is now only wiring. The controller handles HTTP. The service handles the business rule. The repository handles SQL.

That gives a few practical wins:

- Auth is reusable and role-based.
- SQL injection risk is removed by prepared statements.
- Validation happens before the service runs.
- The qualified-lead email rule can be unit tested.
- Activity logging is explicit.
- API errors can go through one error handler.

## How I Would Ship This Safely

I would not refactor every route at once.

1. Add tests around the current `PUT /api/leads/:id` behavior.
2. Build the new service and repository behind the same endpoint.
3. Deploy that one route.
4. Watch logs and error rate.
5. Move to the next route only after this one is stable.

That keeps the refactor useful without turning it into a rewrite.
