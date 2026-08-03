# AI_RULES.md

# TJC OS — Artificial Intelligence Development Rules

Version 1.0

---

# Purpose

This document defines the mandatory rules every AI assistant must follow while working on TJC OS.

These rules protect the architecture, security, stability, and long-term vision of the project.

These rules apply to every AI assistant without exception.

---

# Rule 1

Always read these files before making changes.

README.md

AI_CONTEXT.md

AI_RULES.md

PROJECT_STATUS.md

---

# Rule 2

Never redesign the website unless the owner explicitly requests it.

Do not change:

• Layout

• Branding

• Colors

• Fonts

• Navigation

• Animations

• User Experience

---

# Rule 3

Never remove working features.

If improving a feature:

Improve it.

Do not replace it unnecessarily.

Maintain backward compatibility.

---

# Rule 4

Protect the backend.

The backend must always remain:

Supabase Authentication

Supabase Database

Supabase Storage

Supabase RLS

Never migrate away from Supabase without explicit approval.

---

# Rule 5

Never reconnect the project to Lovable backend services.

Only use:

The owner's Supabase project.

---

# Rule 6

Never expose secrets.

Never hardcode:

API Keys

Passwords

Tokens

Secrets

Service Keys

Always use environment variables.

---

# Rule 7

CEO permissions are protected.

Only CEOs may:

Promote another CEO.

Remove another CEO.

Manage security settings.

Manage authentication.

Manage system configuration.

Never reduce CEO permissions.

---

# Rule 8

Never delete user data without approval.

If deleting data:

Explain the consequences.

Request confirmation.

Prefer soft delete where possible.

---

# Rule 9

Every new feature must follow the existing architecture.

Avoid duplicate code.

Prefer reusable components.

Maintain clean folder structure.

---

# Rule 10

Write maintainable code.

Use meaningful names.

Keep functions small.

Avoid unnecessary complexity.

Document important logic.

---

# Rule 11

Protect performance.

Avoid unnecessary database queries.

Avoid unnecessary API requests.

Lazy load large modules where appropriate.

Optimize images and media.

---

# Rule 12

Protect security.

Follow RLS.

Validate user permissions.

Never trust client-side authorization alone.

Keep authentication secure.

---

# Rule 13

Every completed task must update:

PROJECT_STATUS.md

CHANGELOG.md

Relevant documentation.

---

# Rule 14

Never guess.

If project information is missing:

Read documentation.

Inspect the code.

Ask for clarification if necessary.

---

# Rule 15

Respect the project vision.

Every decision should support:

Scalability

Security

Maintainability

Performance

Professional quality

Long-term growth

---

# Rule 16

Testing is mandatory.

Before marking work complete:

Verify functionality.

Check for errors.

Confirm compatibility.

Ensure no existing features are broken.

---

# Rule 17

Documentation comes first.

Whenever architecture changes:

Update documentation before considering the task complete.

---

# Rule 18

Code Quality Standards

Write readable code.

Avoid duplication.

Prefer modular design.

Keep files organized.

Use consistent naming conventions.

---

# Rule 19

Future Compatibility

Write code that can continue evolving.

Avoid unnecessary dependencies.

Prefer open standards.

Keep the project portable across platforms.

---

# Rule 20

Mission

Your responsibility is not simply to write code.

Your responsibility is to protect, improve, and maintain TJC OS as a professional software platform while respecting the owner's vision and decisions.

Every modification should leave the project better than it was before.

End of Rules.
