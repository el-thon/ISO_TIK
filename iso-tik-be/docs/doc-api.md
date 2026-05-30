# ISO TIK Backend API Documentation

## 1. Overview

Backend `iso-tik-be` adalah rebuild Laravel untuk sistem ISO TIK yang dibuat agar frontend lama `ISO-TIK-FE-v2` dapat memakai backend baru tanpa perubahan source code frontend. API memakai prefix `/api/v1`, database PostgreSQL, custom bearer token berbasis tabel `auth.session_tokens`, storage lokal Laravel disk `public`, dan response compatibility key untuk frontend lama.

Baseline final:

- Framework: Laravel 13.8.0
- Database: PostgreSQL
- Container: Podman
- API prefix: `/api/v1`
- Route final: 104 route termasuk health check dan Document CRUD
- Auth: bearer token custom
- Role global: `admin`, `product_owner`, `member`
- Role participant forum: `auditor`, `auditee`
- Workflow final: `in_review`; `published` hanya alias compatibility
- Audit retention: tidak diterapkan
- Audit hash chain: tidak diterapkan

## 2. Final Backend Status

| Item | Status |
|------|--------|
| Route final | 104 route termasuk health check |
| ProductionSeederTest | 4 passed, 13 assertions |
| API V1 final | 47 passed, 718 assertions |
| Full feature final | 52 passed, 740 assertions |
| Readiness | Siap lanjut deployment dengan catatan go-live |

Catatan sebelum go-live: browser click-through penuh masih perlu verifikasi manual, SMTP/email OTP production belum dikunci, domain/CORS final harus diisi saat deployment, dan daftar clause/topic document master resmi perlu diverifikasi organisasi.

## 3. Base URL

```text
Development: http://localhost:8080/api/v1
Production: https://api-domain-production/api/v1
```

Production base URL harus disesuaikan dengan domain final.

## 4. Authentication

API memakai bearer token dari endpoint login. Token dikirim melalui header:

```http
Authorization: Bearer <access_token>
Accept: application/json
Content-Type: application/json
```

Endpoint auth:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/login/otp/resend`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Login production rules:

- User hanya boleh login jika `status=active`.
- `inactive`, `suspended`, dan `account_locked_at != null` ditolak.
- Failed login dikunci setelah 5 kali gagal.
- Login sukses mereset `failed_login_attempts`.
- Logout merevoke access token.

## 5. Role and Authorization

| Role | Keterangan |
|------|------------|
| `admin` | Full access untuk admin/domain write. |
| `product_owner` | Global read-only; boleh GET, ditolak POST/PUT/PATCH/DELETE domain/admin. |
| `member` | User biasa; akses data dan self-service sesuai endpoint. |

Participant role forum:

| Role | Keterangan |
|------|------------|
| `auditor` | Role participant forum. |
| `auditee` | Role participant forum. |

Catatan:

- `auditor` dan `auditee` bukan role global.
- Create/update period admin-only.
- Product owner tetap boleh self-service profile/auth.
- Dashboard dapat diakses admin, product owner, dan member.

## 6. Standard Response Format

Success response:

```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

Compatibility response dapat menyediakan root key tambahan:

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "items": [],
  "meta": {},
  "pagination": {}
}
```

Root alias seperti `users`, `items`, `forums`, `rooms`, `topics`, `documents`, `statistics`, dan `recentActivities` dipertahankan untuk kompatibilitas frontend lama.

## 7. Standard Error Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": {}
}
```

Status umum:

| Status | Arti |
|--------|------|
| 400 | Bad request |
| 401 | Unauthorized/token invalid |
| 403 | Forbidden |
| 404 | Resource/file not found |
| 422 | Validation error |
| 500 | Unexpected fallback; valid error tidak boleh sengaja memakai 500 |

## 8. Pagination Format

List endpoint menyediakan:

```json
{
  "data": {
    "items": []
  },
  "items": [],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 0,
    "last_page": 1
  },
  "pagination": {}
}
```

Query umum:

```text
page
per_page
search
q
keyword
status
```

## 9. File Upload and Download

Upload memakai `multipart/form-data`.

| File Type | Allowed Extension | Max Size |
|-----------|-------------------|----------|
| Profile photo | `jpg`, `jpeg`, `png`, `webp` | 2 MB |
| Signature | `jpg`, `jpeg`, `png` | 2 MB |
| Attachment | `pdf`, `doc`, `docx`, `odt`, `rtf`, `txt`, `xls`, `xlsx`, `csv` | 20 MB |
| Document | `pdf`, `doc`, `docx`, `odt`, `rtf`, `txt`, `xls`, `xlsx`, `csv` | 20 MB |

Storage:

- Disk: `public`
- Root: `storage/app/public`
- Path response bersifat relatif.
- Absolute server path tidak diekspos.
- Missing file dan `seed://` return JSON 404 aman.

Download endpoints mengembalikan binary response `application/octet-stream` atau JSON 404 jika file tidak tersedia.

## 10. Audit Log Policy

Audit log aktif untuk action penting:

- admin user CRUD/status/reset
- period/forum/participant action
- topic/input/workflow action
- `document_uploaded`
- `document_updated`
- `document_deleted`
- `document_downloaded`
- `attachment_downloaded`
- `signature_downloaded`
- `user_signature_downloaded`

Audit retention tidak diterapkan. Hash chain tidak diterapkan. Audit log disimpan sebagai record biasa.

## 11. Seeder and Production Data

Seeder production:

- `SEED_DEMO_DATA` mengontrol demo data.
- `SEED_PRODUCTION_ADMIN` membuat admin production dari env.
- `SEED_PRODUCTION_PRODUCT_OWNER` membuat product owner production dari env.
- Password production minimal 12 karakter dan tidak boleh `password`.
- Password `password` hanya untuk local/testing/demo.

Data wajib:

- roles: `admin`, `product_owner`, `member`
- settings: `security.login_otp.enabled`
- sample clauses
- active topic document master

## 12. API Module Summary

| Module | Endpoint Count | Description |
|--------|----------------|-------------|
| Health | 1 | Health check API. |
| Auth | 5 | Login, OTP resend, refresh, logout, auth me. |
| Users/Profile/Session/Signature | 21 | User search, profile, security session, login history, signature. |
| Admin | 27 | Users, roles, settings, clauses, topic document masters. |
| Period | 7 | Period CRUD, join, join requests, forums by period. |
| Forum/Participants | 16 | Forum list/detail/state/participants/leave/join. |
| Topic/Input/Workflow/Version | 16 | Topic list/create/detail, input items, workflow, versions. |
| Attachment | 4 | Forum attachments and downloads. |
| Document | 7 | Document list/create/detail/update/delete/download. |
| Dashboard | 1 | Dashboard statistics. |

## 13. Endpoint Documentation

All endpoints below use `/api/v1` prefix.

### Common cURL Headers

```bash
-H "Accept: application/json"
-H "Authorization: Bearer <access_token>"
```

For JSON requests:

```bash
-H "Content-Type: application/json"
```

For uploads, omit JSON content type and use `-F`.

## 14. Endpoint Modules Detail

### 14.1 Health

#### GET `/api/v1/health`

Description: Check API and database health.

Authentication: Not required.

Success:

```json
{
  "success": true,
  "message": "API is healthy",
  "data": {
    "app": "ok",
    "database": "connected"
  }
}
```

cURL:

```bash
curl -H "Accept: application/json" http://localhost:8080/api/v1/health
```

### 14.2 Auth

#### POST `/api/v1/auth/login`

Authentication: Not required.

Request:

```json
{
  "login": "admin@iso-tik.test",
  "password": "password",
  "otp": "123456"
}
```

Aliases accepted: `login`, `email`, `username`.

Success contains `data.access_token`, `data.refresh_token`, `data.accessToken`, `data.refreshToken`, `data.token`, `data.user`, `data.roles`, and root token aliases.

Errors: 401 invalid credentials, 403 inactive/suspended/locked, 422 validation error.

#### POST `/api/v1/auth/login/otp/resend`

Request:

```json
{
  "login": "admin@iso-tik.test"
}
```

Description: Resend login OTP when OTP setting is enabled.

#### POST `/api/v1/auth/refresh`

Request:

```json
{
  "refresh_token": "<refresh_token>"
}
```

Aliases accepted: `refresh_token`, `refreshToken`.

#### POST `/api/v1/auth/logout`

Authentication: Bearer token required.

Description: Revoke current access token.

#### GET `/api/v1/auth/me`

Authentication: Bearer token required.

Success includes `data.user`, `data.roles`, root `user`, and root `roles`.

### 14.3 Users and Profile

#### GET `/api/v1/users`

Authentication: required.

Query: `page`, `per_page`, `search`, `q`, `keyword`, `role`, `status`.

Response aliases: `data.users`, `data.items`, root `users`, root `items`, `meta`, `pagination`.

#### GET `/api/v1/users/{userId}/signature/download`

Authentication: required.

Path parameter: `userId`.

Response: binary file or JSON 404 `File not found`. Audit action: `user_signature_downloaded`.

#### GET `/api/v1/profile`

Authentication: required.

Response aliases: `data.user`, `data.profile`, `data.contact`, `data.address`, `data.employment`, and root equivalents.

#### PUT `/api/v1/profile`

Request fields: `name`, `full_name`, `phone`, `email_personal`, `address`, `city`, `province`, `country`.

#### PUT `/api/v1/profile/employment`

Request fields: `employee_id`, `unit`, `department`, `functional_position`, `employment_status`.

#### POST `/api/v1/profile/change-password`

Request:

```json
{
  "current_password": "password",
  "new_password": "new-password",
  "new_password_confirmation": "new-password"
}
```

Aliases accepted: `old_password`, `password`, `password_confirmation`.

#### POST `/api/v1/profile/photo`

Multipart fields: `photo`, `image`, or `file`.

Allowed: `jpg`, `jpeg`, `png`, `webp`; max 2 MB.

#### DELETE `/api/v1/profile/photo`

Delete current profile photo metadata/file reference.

#### GET `/api/v1/profile/sessions`

List current user's sessions. Aliases: `sessions`, `items`, `meta`, `pagination`.

#### DELETE `/api/v1/profile/sessions/{sessionId}`

Revoke one session.

#### DELETE `/api/v1/profile/sessions/all`

Revoke all other sessions.

#### GET `/api/v1/profile/login-history`

List login history.

#### GET `/api/v1/profile/security/sessions`

Alias for profile sessions.

#### DELETE `/api/v1/profile/security/sessions`

Alias for revoke all sessions.

#### DELETE `/api/v1/profile/security/sessions/{sessionId}`

Alias for revoke one session.

#### GET `/api/v1/profile/security/login-history`

Alias for login history.

#### GET `/api/v1/profile/signature`

Return current user's signature metadata or `signature: null` if absent.

#### POST `/api/v1/profile/signature`

Multipart fields: `signature`, `file`, or `image`.

Allowed: `jpg`, `jpeg`, `png`; max 2 MB.

#### DELETE `/api/v1/profile/signature`

Delete current signature.

#### GET `/api/v1/profile/signature/download`

Response: binary file or JSON 404. Audit action: `signature_downloaded`.

### 14.4 Admin

Admin read endpoints allow `admin` and `product_owner`. Admin write endpoints require `admin`; product owner write returns 403.

#### GET `/api/v1/admin/users`

Query: `page`, `per_page`, `search`, `q`, `keyword`, `status`, `role`.

Response aliases: `users`, `items`, `meta`, `pagination`.

#### POST `/api/v1/admin/users`

Admin only.

Request fields: `name`, `email`, `username`, `password`, `status`, `roles`, `role_id`, profile/contact/employment fields.

#### GET `/api/v1/admin/users/{userId}`

Return user detail.

#### PUT `/api/v1/admin/users/{userId}`

Admin only. Same fields as create; all optional.

#### DELETE `/api/v1/admin/users/{userId}`

Admin only. Optional body: `reason`.

#### GET `/api/v1/admin/users/statistics`

Return admin user statistics.

#### POST `/api/v1/admin/users/bulk-update-status`

Admin only.

Request:

```json
{
  "user_ids": ["uuid"],
  "status": "active"
}
```

Aliases: `ids`.

#### GET `/api/v1/admin/users/{userId}/roles`

Return assigned roles.

#### POST `/api/v1/admin/users/{userId}/assign-role`

Admin only. Body: `role_id` or `role`.

#### DELETE `/api/v1/admin/users/{userId}/roles/{roleId}`

Admin only.

#### PATCH `/api/v1/admin/users/{userId}/activate`

Admin only.

#### PATCH `/api/v1/admin/users/{userId}/deactivate`

Admin only. Optional body: `reason`.

#### POST `/api/v1/admin/users/{userId}/reset-password`

Admin only. Body: `password` or `new_password`.

#### POST `/api/v1/admin/users/{userId}/restore`

Admin only.

#### GET `/api/v1/admin/users/{userId}/activity-logs`

Return user activity logs.

#### GET `/api/v1/admin/rbac/roles`

Return global roles.

#### GET `/api/v1/admin/system/settings`

Return settings, including `security.login_otp.enabled`.

#### PUT `/api/v1/admin/system/settings`

Admin only. Body may use flat settings or nested `settings`.

#### GET `/api/v1/admin/system/clauses`

Query: `page`, `per_page`, `search`, `q`, `keyword`, `is_active`.

#### POST `/api/v1/admin/system/clauses`

Admin only. Fields: `code`, `name`, `description`, `is_active`.

#### PUT `/api/v1/admin/system/clauses/{clauseId}`

Admin only.

#### DELETE `/api/v1/admin/system/clauses/{clauseId}`

Admin only.

#### GET `/api/v1/admin/topic-document-masters`

Query: `page`, `per_page`, `search`, `q`, `keyword`, `is_active`.

#### POST `/api/v1/admin/topic-document-masters`

Admin only. Fields: `document_number`, `revision_number`, `published_at`, `is_active`.

#### PUT `/api/v1/admin/topic-document-masters/{id}`

Admin only.

#### DELETE `/api/v1/admin/topic-document-masters/{id}`

Admin only.

#### GET `/api/v1/topic-document-masters/active`

Return active topic document master.

### 14.5 Period and Forum

#### GET `/api/v1/period`

Query: `page`, `per_page`, `search`, `q`, `keyword`, `status`, `period_type`, `is_active`, `include_archived`.

#### POST `/api/v1/period`

Admin only. Body: `name`, `period_type`, `start_date`, `end_date`, `join_code`, `is_join_code_active`.

Allowed internal `period_type`: `semester`, `annual`, `custom`. Legacy `audit` is mapped to `custom`.

#### GET `/api/v1/period/{periodId}`

Return period detail.

#### PUT `/api/v1/period/{periodId}`

Admin only. Same fields as create.

#### POST `/api/v1/period/join`

Body: `join_code` or `code`; optional `period_id`.

#### GET `/api/v1/period/{periodId}/join-requests`

Roles: `admin`, `product_owner`.

#### POST `/api/v1/period/{periodId}/join-requests/{joinRequestId}/approve`

Admin only.

#### GET `/api/v1/period/{periodId}/forums`

List forums for period.

#### POST `/api/v1/period/{periodId}/forums`

Admin only. Body: `name`, `description`, `visibility`, `responsible_user_id`, `join_code`, `is_join_code_active`, `participants`, `participant_ids`, `auditor_ids`, `auditee_ids`.

#### GET `/api/v1/forums`

List forums. Query: `page`, `per_page`, `search`, `q`, `keyword`, `status`, `period_id`, `include_archived`.

#### POST `/api/v1/forums/join`

Body: `join_code`, `code`, or `forum_id`.

#### GET `/api/v1/forums/{roomId}`

Forum detail with aliases `forum` and `room`, plus current user participant fields.

#### PUT `/api/v1/forums/{roomId}`

Admin only.

#### DELETE `/api/v1/forums/{roomId}`

Admin only.

#### POST `/api/v1/forums/{roomId}/lock`

Admin only.

#### POST `/api/v1/forums/{roomId}/unlock`

Admin only.

#### POST `/api/v1/forums/{roomId}/archive`

Admin only.

#### POST `/api/v1/forums/{roomId}/restore`

Admin only.

#### GET `/api/v1/forums/{roomId}/participants`

List participants.

#### POST `/api/v1/forums/{roomId}/participants`

Admin only. Body supports `participants`, `user_ids`, `participant_ids`, `auditor_ids`, `auditee_ids`, `role`.

#### PUT `/api/v1/forums/{roomId}/participants/{participantId}`

Admin only. Body: `role`, `is_responsible_user`.

#### DELETE `/api/v1/forums/{roomId}/participants/{participantId}`

Admin only.

#### POST `/api/v1/forums/{roomId}/leave`

Current user leaves forum if allowed.

### 14.6 Topic, Input Item, Workflow, Version

#### GET `/api/v1/forums/{roomId}/topics`

List topics in forum.

#### GET `/api/v1/topics`

Query: `page`, `per_page`, `search`, `q`, `keyword`, `status`, `workflow_status`, `forum_id`, `period_id`, `mine`.

`status=published` is accepted as compatibility alias for `in_review`.

#### POST `/api/v1/forums/{forumId}/topics`

Body: `title`, `name`, `description`, `topic_document_master_id`, `document_master_id`, `deadline_at`, `status`, `input_items`, `items`, `findings`.

#### GET `/api/v1/topics/{topicId}`

Return topic detail, input items, workflow, participants, versions.

#### GET `/api/v1/topics/{topicId}/input-items`

List input items.

#### POST `/api/v1/topics/{topicId}/input-items`

Body supports `input_items`, `items`, `findings`, or single item fields `type`, `label`, `value`, `metadata`.

#### PUT `/api/v1/input-items/{inputItemId}`

Update input item.

#### POST `/api/v1/topics/{topicId}/publish`

Result: `status=in_review`, `workflow_status=in_review`, `status_alias=published`.

#### POST `/api/v1/topics/{topicId}/approve`

Result: `approved`.

#### POST `/api/v1/topics/{topicId}/request-changes`

Body: `reason` or `comment`. Result: `changes_requested`.

#### POST `/api/v1/topics/{topicId}/close`

Result: `closed`.

#### POST `/api/v1/topics/{topicId}/reopen`

Result: `draft`.

#### POST `/api/v1/topics/{topicId}/freeze`

Body: `reason`, `freeze_reason`, `until`, `frozen_until`.

Freeze sets `is_frozen=true` and does not damage main workflow status.

#### POST `/api/v1/topics/{topicId}/unfreeze`

Sets `is_frozen=false`.

#### GET `/api/v1/topics/{topicId}/versions`

List topic versions.

#### POST `/api/v1/topics/{topicId}/versions/{versionId}/revert`

Body: `reason` optional.

### 14.7 Attachment

#### GET `/api/v1/forums/{forumId}/attachments`

List forum attachments. Aliases: `attachments`, `files`, `items`, `evidence`, `documents`.

#### POST `/api/v1/forums/{forumId}/attachments`

Multipart fields: `file`, `attachment`, `document`, `evidence`, or `upload`.

Optional fields: `description`, `notes`, `type`, `topic_id`, `input_item_id`, `metadata`.

Allowed extensions: `pdf`, `doc`, `docx`, `odt`, `rtf`, `txt`, `xls`, `xlsx`, `csv`.

#### GET `/api/v1/attachments/{attachmentId}/download-info`

Return file metadata and `exists`.

#### GET `/api/v1/attachments/{attachmentId}/download`

Response: binary file or JSON 404. Audit action: `attachment_downloaded`.

### 14.8 Document

#### GET `/api/v1/documents`

Query: `page`, `per_page`, `search`, `q`, `keyword`, `status`, `is_active`.

#### POST `/api/v1/documents`

Admin only. Multipart fields: `file`, `document`, `attachment`, or `upload`.

Metadata fields: `title`, `name`, `description`, `document_number`, `revision_number`, `document_type`, `status`, `is_active`, `topic_id`, `forum_id`, `topic_document_master_id`, `metadata`.

#### GET `/api/v1/documents/{documentId}`

Return `data.document` and root `document`.

#### PUT `/api/v1/documents/{documentId}`

Admin only. JSON metadata or multipart file replacement. File optional.

#### DELETE `/api/v1/documents/{documentId}`

Admin only. Soft delete metadata; file is not hard deleted by default.

#### GET `/api/v1/documents/{documentId}/download-info`

Return metadata and `exists`.

#### GET `/api/v1/documents/{documentId}/download`

Response: binary file or JSON 404. Audit action: `document_downloaded`.

### 14.9 Dashboard

#### GET `/api/v1/dashboard/statistics`

Roles: admin, product owner, member.

Query: `period_id`, `forum_id`, `date_from`, `date_to`, `from`, `to`, `start_date`, `end_date`, `finding_type`, `status`, `workflow_status`, `scope`, `mine`.

Response keys:

```json
{
  "statistics": {},
  "stats": {},
  "summary": {},
  "cards": [],
  "charts": {},
  "recent_activities": [],
  "recentActivities": []
}
```

Topic count includes both `in_review` and `published`.

## 15. Workflow Status

Final statuses:

```text
draft
in_review
changes_requested
approved
closed
```

Compatibility:

- `published` is an alias only.
- Publish endpoint returns `in_review`.
- Freeze uses `is_frozen` and `freeze_status`; it does not overwrite main status.
- Dashboard returns counts for both `in_review` and `published`.

## 16. File MIME Rules

| File Type | Allowed Extension | Max Size |
|-----------|-------------------|----------|
| Profile photo | jpg, jpeg, png, webp | 2 MB |
| Signature | jpg, jpeg, png | 2 MB |
| Attachment | pdf, doc, docx, odt, rtf, txt, xls, xlsx, csv | 20 MB |
| Document | pdf, doc, docx, odt, rtf, txt, xls, xlsx, csv | 20 MB |

## 17. Production Environment Variables

```env
APP_ENV=production
APP_URL=https://api-domain-production
FRONTEND_URL=https://frontend-domain-production
CORS_ALLOWED_ORIGINS=https://frontend-domain-production

DB_CONNECTION=pgsql
DB_HOST=
DB_PORT=5432
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

FILESYSTEM_DISK=public

SEED_DEMO_DATA=false
SEED_PRODUCTION_ADMIN=true
SEED_PRODUCTION_PRODUCT_OWNER=false
PRODUCTION_ADMIN_NAME="System Administrator"
PRODUCTION_ADMIN_EMAIL=
PRODUCTION_ADMIN_PASSWORD=
PRODUCTION_PRODUCT_OWNER_NAME="Product Owner"
PRODUCTION_PRODUCT_OWNER_EMAIL=
PRODUCTION_PRODUCT_OWNER_PASSWORD=
DEMO_USER_PASSWORD=

AUDIT_HASH_CHAIN_ENABLED=false
AUDIT_RETENTION_ENABLED=false

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"
```

## 18. Deployment Checklist

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Podman note:

```bash
podman exec iso-tik-be-app php artisan migrate --force
podman exec iso-tik-be-app php artisan db:seed --force
podman exec iso-tik-be-app php artisan storage:link
```

## 19. Testing Checklist

```bash
php artisan test tests/Feature/ProductionSeederTest.php
php artisan test tests/Feature/Api/V1
php artisan test tests/Feature
```

Final result:

```text
ProductionSeederTest: 4 passed, 13 assertions
API V1 final: 47 passed, 718 assertions
Full feature final: 52 passed, 740 assertions
```

## 20. Known Notes Before Go-Live

- SMTP/email OTP production final perlu diverifikasi.
- Email admin production final perlu diisi.
- Email product owner production final perlu diisi.
- `SEED_DEMO_DATA` production perlu diputuskan.
- Clause resmi organisasi perlu diverifikasi.
- Topic document master resmi perlu diverifikasi.
- Domain frontend/backend final perlu diisi.
- CORS origin final perlu diisi.
- Browser DevTools click-through penuh perlu dilakukan sebelum go-live.
- Frontend lama memiliki warning build `deleteInputItem` undefined import.
- Storage local/public perlu dipantau untuk kebutuhan jangka panjang.

## 21. Backlog / Not Included

Tidak termasuk production API saat ini:

- comments
- labels
- assignments
- groups
- reviews
- timeline
- audit retention
- audit hash chain
- DLP
- dual-control
- security alerts
- notification API

## 22. Appendix

### Role Matrix

| Action | admin | product_owner | member |
|--------|-------|---------------|--------|
| GET dashboard | yes | yes | yes |
| GET admin data | yes | yes | no |
| Admin write | yes | no | no |
| Period create/update | yes | no | no |
| Profile self-service | yes | yes | yes |
| Document create/update/delete | yes | no | no |

### Status Code Matrix

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created when used by implementation |
| 401 | Missing/invalid token or invalid credentials |
| 403 | Forbidden/read-only/account rejected |
| 404 | Resource or file not found |
| 422 | Validation error |

### Common cURL Examples

Login:

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@iso-tik.test","password":"password"}'
```

Dashboard:

```bash
curl -X GET http://localhost:8080/api/v1/dashboard/statistics \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <access_token>"
```

Upload attachment:

```bash
curl -X POST http://localhost:8080/api/v1/forums/<forum_id>/attachments \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@evidence.pdf" \
  -F "description=Evidence"
```

Download document:

```bash
curl -X GET http://localhost:8080/api/v1/documents/<document_id>/download \
  -H "Accept: application/octet-stream" \
  -H "Authorization: Bearer <access_token>" \
  --output document.bin
```
