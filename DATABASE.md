# TJC OS Database Documentation

## Purpose

This document describes the complete database architecture for TJC OS.

Every AI assistant and developer must read this document before making database changes.

The database is powered entirely by Supabase PostgreSQL.

No external database services should ever replace the primary database without approval.

---

# Database Overview

Database Provider

Supabase PostgreSQL

Authentication

Supabase Auth

Storage

Supabase Storage

Security

Row Level Security (RLS)

Role-Based Access Control (RBAC)

---

# Database Principles

The database must always be:

- Secure
- Scalable
- Modular
- Well documented
- Normalized where practical
- Easy to extend

Every new table must follow the existing architecture.

---

# Core Tables

## profiles

Purpose

Stores information about registered users.

Columns

id

email

display_name

avatar_url

created_at

updated_at

Relationship

Linked 1:1 with auth.users.

---

## user_roles

Purpose

Stores permission roles.

Roles

CEO

Admin

Editor

Team

Visitor

One user may have multiple roles if required.

---

# Content Tables

These tables power the website.

media_library

songs

videos

gallery

posts

biography

projects

homepage_sections

navigation

seo_settings

site_configuration

analytics

Every content table contains:

id

title

slug

description

body

status

metadata

created_at

updated_at

created_by

updated_by

deleted_at

---

# Communication Tables

contacts

Stores website contact form submissions.

messages

Stores direct messages.

newsletter

Stores newsletter subscriptions.

---

# Audit Table

activity_logs

Tracks:

User actions

Database events

Content edits

Login activity

Administrative actions

Future automation events

---

# Storage Buckets

images

Purpose

Website images

Public

Yes

---

videos

Purpose

Video uploads

Public

Yes

---

music

Purpose

Audio uploads

Public

Yes

---

avatars

Purpose

User profile images

Public

Yes

---

documents

Purpose

Private documents

Public

No

Accessible only by authorized staff.

---

# User Roles

CEO

Complete system ownership.

Can manage:

Everything.

Admins

Editors

Database

Storage

Website

Users

Settings

API Keys

Security

---

Admin

Can manage nearly every module except reserved CEO actions.

---

Editor

Can create and edit content.

Cannot manage system settings.

---

Team

Limited dashboard access.

Only assigned modules.

---

Visitor

Public website only.

---

# Row Level Security

Enabled on every table.

Policies include:

Users read their own profile.

Users update their own profile.

Staff read all content.

Staff create content.

Staff update content.

Staff delete content.

Visitors read published content only.

Anyone may submit contact forms.

Staff manage submissions.

CEO/Admin view activity logs.

---

# Database Relationships

auth.users

↓

profiles

↓

user_roles

Content Tables

↓

activity_logs

Communication Tables

↓

Dashboard

---

# Future Tables

Future versions may include:

orders

customers

payments

products

inventory

appointments

calendar

tasks

notifications

chat

support_tickets

ai_memory

ai_prompts

analytics_events

audit_events

settings_history

These tables should follow the same architecture.

---

# Migration Rules

Never delete production tables.

Prefer ALTER TABLE over dropping data.

Always create migrations.

Never remove existing columns without approval.

Backup before destructive changes.

---

# Naming Standards

Tables

snake_case

Columns

snake_case

Primary Keys

UUID

Foreign Keys

Reference parent table IDs.

Indexes

Add indexes for frequently queried columns.

---

# AI Rules

Before creating a table:

Check if one already exists.

Reuse existing relationships.

Enable Row Level Security.

Create policies.

Document the change.

Update this file.

---

# Database Checklist

Before deployment verify:

Tables exist.

Relationships work.

RLS enabled.

Policies active.

Storage buckets created.

Authentication works.

CRUD operations pass.

Uploads succeed.

Role permissions work.

No SQL errors remain.

---

# Mission

The database is the foundation of TJC OS.

Every future database change must improve scalability, security, maintainability, and long-term stability.

End of File
