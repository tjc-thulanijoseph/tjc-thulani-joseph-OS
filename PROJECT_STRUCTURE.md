# PROJECT_STRUCTURE.md

## Purpose

This document explains how the project is organized so that any AI assistant or developer can immediately understand the architecture before making changes.

The project must remain organized, scalable, and easy to maintain.

---

# Main Goal

TJC OS is a complete digital operating system for:

- Personal Brand
- Business Management
- Media Management
- Content Publishing
- Team Collaboration
- Customer Management
- AI Automation

Everything should be modular.

---

# Folder Structure

src/

components/
Reusable UI components

pages/
Website pages

dashboard/
Dashboard pages

layouts/
Shared layouts

hooks/
Custom React hooks

services/
Supabase providers
Authentication
Repositories

lib/
Utilities
Supabase Client

contexts/
React Context

types/
TypeScript Types

utils/
Helper Functions

assets/
Images
Videos
Music
Icons

styles/
Global styling

---

Database

Supabase

Tables

profiles

user_roles

posts

songs

videos

gallery

projects

biography

homepage_sections

navigation

seo_settings

site_configuration

analytics

contacts

messages

newsletter

activity_logs

---

Storage Buckets

images

videos

music

documents

avatars

---

Authentication

Supabase Auth

Roles

CEO

Admin

Editor

Team

Visitor

Permissions

CEO

Full access

Admin

Almost full access

Editor

Content management only

Team

Assigned modules only

Visitor

Public website only

---

Future Modules

Dashboard

Analytics

Media Manager

Blog

Projects

Music Manager

Video Manager

Gallery

Messages

Contact Forms

Newsletter

SEO

Website Settings

AI Assistant

Notifications

File Manager

User Management

Activity Logs

API Keys

Automation

---

Coding Rules

Never duplicate code.

Always create reusable components.

Keep business logic inside services.

Keep UI inside components.

Never hardcode secrets.

Use environment variables.

Always use TypeScript.

Always use Supabase.

Follow Row Level Security.

Everything should remain modular.

---

Important

Never change folder names without updating imports.

Never remove existing features.

Never break compatibility.

Never replace Supabase.

Never remove role permissions.

Always maintain backward compatibility.

---

End of File
