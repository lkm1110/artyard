# 📊 ArtYard Database SQL Scripts

This folder contains SQL scripts for setting up and maintaining the ArtYard database.

## 🚀 Initial Setup (Fresh Install)

### 1. Main Schema Installation
```sql
FINAL-INSTALL.sql
```
Complete database schema with all tables, indexes, and RLS policies.

### 2. Admin System
```sql
admin-schema.sql
```
Admin dashboard, reports, user management, and moderation features.

### 3. Advanced Features
```sql
advanced-features-schema.sql
ai-ml-schema.sql
```
Advanced filtering, AI/ML recommendation system, and analytics.

---

## 🔧 Maintenance & Fixes

### RLS & Permissions
```sql
FINAL-RLS-FIX.sql
```
**Purpose:** Fix 406 RLS errors for likes, bookmarks, and follows tables.
**When to use:** If you see 406 (Not Acceptable) errors in console.

### Account Management
```sql
delete-user-account-rpc.sql
```
**Purpose:** Enable user account deletion feature.
**When to use:** Required for profile "Delete Account" button.

### Admin Setup
```sql
set-admin-lavlna280.sql
```
**Purpose:** Set specific user as admin.
**When to use:** To grant admin privileges to lavlna280@gmail.com.

### Category System
```sql
add-category-column.sql
```
**Purpose:** Add category column to artworks table.
**When to use:** Enable category filtering in the app.

---

## 📦 Feature-Specific Scripts

### Chat System
```sql
fix-chat-foreign-keys.sql
fix-chats-updated-at.sql
add-message-read-status.sql
fix-existing-messages-read-status.sql
add-message-edit-delete.sql
fix-message-edit-delete.sql
create-unread-count-rpc.sql
```

### Profiles & Users
```sql
fix-profiles-rls.sql
```

### Artworks
```sql
fix-artworks-rls.sql
fix-material-constraint.sql
add-location-columns.sql
```

### Storage
```sql
storage-bucket-setup.sql
```

---

## 📋 Execution Order (New Project)

1. **FINAL-INSTALL.sql** - Base schema
2. **admin-schema.sql** - Admin features
3. **advanced-features-schema.sql** - Advanced features
4. **ai-ml-schema.sql** - AI/ML system
5. **FINAL-RLS-FIX.sql** - Fix RLS issues
6. **delete-user-account-rpc.sql** - Account deletion
7. **add-category-column.sql** - Category system
8. **set-admin-lavlna280.sql** - Set admin user
9. **storage-bucket-setup.sql** - Storage setup

---

## ⚠️ Important Notes

- Always backup your database before running SQL scripts
- Test on a development database first
- Some scripts modify existing data - review carefully
- RLS policies may need adjustment based on your security requirements

---

## 🔍 Troubleshooting

### 406 Errors
Run: `FINAL-RLS-FIX.sql`

### Missing Admin Features
Run: `admin-schema.sql` + `set-admin-lavlna280.sql`

### Category Filter Not Working
Run: `add-category-column.sql`

### Account Deletion Not Working
Run: `delete-user-account-rpc.sql`

---

## 📝 Schema Maintenance

When adding new features:
1. Create a descriptive SQL file
2. Add it to this README
3. Test thoroughly before production
4. Document any dependencies

---

**Last Updated:** 2025-01-26
**Database Version:** PostgreSQL 15+ (Supabase)

