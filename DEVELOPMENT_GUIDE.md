# TJC OS Development Guide

## Purpose

This document defines the official development process for TJC OS.

Every developer or AI assistant must follow this guide before making changes.

The goal is to keep the project stable, scalable, secure, and easy to maintain.

---

# Core Development Philosophy

TJC OS is designed to be:

- Modular
- Scalable
- Secure
- Maintainable
- Independent from any AI platform
- Independent from Lovable
- Powered by Supabase

Every new feature must improve the system without breaking existing functionality.

---

# Golden Rules

Rule 1

Never change the UI unless specifically requested.

Rule 2

Never delete existing features without approval.

Rule 3

Never hardcode credentials.

Always use environment variables.

Rule 4

Every feature must work with Supabase.

Rule 5

Always preserve backward compatibility.

Rule 6

Every change must be tested before deployment.

Rule 7

Never duplicate code.

Create reusable components.

Rule 8

Keep business logic inside Services.

Keep UI inside Components.

Rule 9

Always use TypeScript.

Rule 10

Write clean, readable code.

---

# Development Workflow

Step 1

Understand the feature request.

↓

Step 2

Analyze existing architecture.

↓

Step 3

Identify affected modules.

↓

Step 4

Create implementation plan.

↓

Step 5

Implement changes.

↓

Step 6

Run tests.

↓

Step 7

Fix errors.

↓

Step 8

Verify compatibility.

↓

Step 9

Deploy.

↓

Step 10

Document changes.

---

# Before Writing Code

Always ask:

Does this already exist?

Can it be reused?

Will it break another feature?

Does it follow the architecture?

Can it scale?

Is it secure?

---

# Feature Checklist

Every feature must include:

UI

Backend

Database

Authentication

Permissions

Validation

Error Handling

Loading States

Success Messages

Documentation

Testing

---

# Code Style

Use meaningful variable names.

Use reusable functions.

Avoid deeply nested logic.

Keep files small.

Split large components.

Comment only complex logic.

Prefer composition over duplication.

---

# Database Rules

Never bypass Supabase.

Never disable Row Level Security.

Always validate data.

Never expose Service Role keys.

Always use authenticated users.

---

# Authentication Rules

Authentication must always use Supabase Auth.

Protected pages must require login.

Unauthorized users must be redirected.

CEO permissions override all others.

---

# File Upload Rules

Images → images bucket

Videos → videos bucket

Music → music bucket

Documents → documents bucket

Avatars → avatars bucket

Always validate:

File size

File type

Upload success

Permissions

---

# Error Handling

Every operation must return:

Loading

Success

Failure

Meaningful error messages.

No silent failures.

---

# Performance Rules

Lazy load pages.

Optimize images.

Avoid unnecessary queries.

Cache when appropriate.

Minimize bundle size.

---

# Security Rules

Use Row Level Security.

Validate every request.

Never trust client input.

Protect admin routes.

Protect dashboard routes.

Protect API calls.

---

# Testing Checklist

Authentication

Database CRUD

Uploads

Downloads

Dashboard

Permissions

Responsive Design

Performance

SEO

Accessibility

---

# Git Workflow

Create descriptive commits.

Example:

feat: add media manager

fix: correct login redirect

docs: update deployment guide

refactor: improve dashboard service

Never push broken code.

---

# AI Assistant Rules

Before making changes:

Read:

README.md

AI_RULES.md

PROJECT_STRUCTURE.md

DEVELOPMENT_GUIDE.md

DATABASE.md

SECURITY.md

ROADMAP.md

Understand the architecture first.

Never guess.

If uncertain, analyze before coding.

---

# Mission

Every update should move TJC OS closer to becoming a complete digital operating system while maintaining quality, stability, security, and scalability.

End of File
