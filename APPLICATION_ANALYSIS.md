# Billing Application — Complete Analysis & Feature Map

> Generated: 2026-08-02
> Status: Comprehensive audit of all features, gaps, and recommendations

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Feature Map (What Exists)](#feature-map)
3. [Module-by-Module Feature Details](#module-details)
4. [Critical Issues & Bugs](#critical-issues)
5. [Missing Features & Gaps](#missing-features)
6. [Performance Issues](#performance-issues)
7. [Security Concerns](#security-concerns)
8. [UX/Accessibility Problems](#ux-accessibility)
9. [Test Coverage Gaps](#test-coverage)
10. [Prioritized Recommendations](#recommendations)

---

## Application Overview <a name="application-overview"></a>

**Type:** School/Institution Fee Management System (Admin-only, no student portal)

**Stack:**
- Backend: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 16
- Frontend: Next.js 14 (App Router) + Tailwind CSS + React Query + Zod
- Deployment: Docker Compose (3 services)
- Auth: JWT (access + refresh tokens, cookie-based)

**Scale:** ~30,000 lines of code, 20 DB models, 80+ API endpoints, 18 route modules

---

## Feature Map <a name="feature-map"></a>

### ✅ Fully Working Features

| # | Feature | Backend | Frontend | Tests |
|---|---------|---------|----------|-------|
| 1 | Student CRUD (add/edit/soft-delete) | ✅ | ✅ | ✅ |
| 2 | Student Excel import (with mapping) | ✅ | ✅ | ✅ |
| 3 | Fee collection with billing cycles | ✅ | ✅ | ✅ |
| 4 | Monthly/Bi-monthly/Quarterly cycles | ✅ | ✅ | ✅ |
| 5 | Payment recording (append-only ledger) | ✅ | ✅ | ✅ |
| 6 | Payment reversal (negative entry) | ✅ | ✅ | ✅ |
| 7 | Receipt generation (view/print) | ✅ | ✅ | ✅ |
| 8 | Bill number auto-generation | ✅ | ✅ | ✅ |
| 9 | JWT auth with refresh tokens | ✅ | ✅ | ✅ |
| 10 | User registration & permissions | ✅ | ✅ | ✅ |
| 11 | Rate limiting on login | ✅ | — | ✅ |
| 12 | Student savings (deposit/withdraw) | ✅ | ✅ | ✅ |
| 13 | Dashboard with summary stats | ✅ | ✅ | ✅ |
| 14 | Reports (daily/monthly/pending) | ✅ | ✅ | ✅ |
| 15 | CSV exports (students/payments/pending) | ✅ | ✅ | ✅ |
| 16 | Billing settings (cycle config) | ✅ | ✅ | ✅ |
| 17 | Institution settings/branding | ✅ | ✅ | ✅ |
| 18 | Expense tracking (monthly) | ✅ | ✅ | ✅ |
| 19 | Annual revenue report | ✅ | ✅ | Partial |
| 20 | PDF receipt download | ✅ | ✅ | ✅ |

### ⚠️ Partially Working Features

| # | Feature | What Works | What's Missing |
|---|---------|------------|----------------|
| 21 | Staff management | Add/list/delete | No edit functionality |
| 22 | Salary records | Record/PDF slip | No edit, no duplicate month check |
| 23 | Student attendance | Bulk mark/view | No edit after save, no reports |
| 24 | Staff attendance | Bulk mark/view | No reports, no summary |
| 25 | Exams & marks | Create exam, add marks | No bulk entry, UUID input for marks (unusable) |
| 26 | Report cards | PDF generation | Hardcoded grade thresholds |
| 27 | Fee structures | Create/delete | No edit, no student assignment UI |
| 28 | Discounts | Create/delete | No edit, no student discount UI |
| 29 | CMS (public website) | Content CRUD | Basic, no rich editor |
| 30 | Academic management | Years/classes/subjects | No edit/delete, no validation |
| 31 | Enquiry management | Submit/list/delete | No follow-up workflow |
| 32 | File uploads | Upload/serve/delete | No file type validation in UI |
| 33 | Student promotions | Mass promote | No undo, no confirmation |
| 34 | Transfer certificate | PDF generation | ASCII-only (crashes on non-English) |
| 35 | WhatsApp integration | Deep links for reminders | No actual messaging |
| 36 | Database backup | JSON export | No restore, no automated backups |
| 37 | Database reset | Full wipe | No selective reset, no backup trigger |
| 38 | Public website | Homepage/news/gallery/about/contact | Basic static content |

---

## Module-by-Module Feature Details <a name="module-details"></a>

### 1. Authentication & Users

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/auth/login` | Login with username/password | ✅ Working |
| `POST /api/auth/refresh` | Refresh access token | ✅ Working |
| `GET /api/auth/me` | Get current user info | ✅ Working |
| `POST /api/auth/register` | Create new user (admin only) | ✅ Working |
| `POST /api/auth/setup-password` | First-time password set | ✅ Working |
| `PATCH /api/auth/users/{id}/permissions` | Update permissions | ✅ Working |
| `DELETE /api/auth/users/{id}` | Delete user | ⚠️ No cascade check |
| `GET /api/auth/permissions` | List available permissions | ✅ Working |

**Permissions system:** 14 granular permissions exist (can_collect, can_view_reports, etc.) but are **NOT enforced** in route handlers — only admin vs non-admin is checked.

---

### 2. Students

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/students` | Create student | ✅ |
| `GET /api/students` | List with search/filter/pagination | ✅ |
| `GET /api/students/{id}` | Get student detail | ✅ |
| `PATCH /api/students/{id}` | Update student | ✅ |
| `DELETE /api/students/{id}` | Hard delete (inactive + no payments only) | ✅ |
| `POST /api/students/import/preview` | Preview Excel upload | ✅ |
| `POST /api/students/import` | Bulk import from Excel | ✅ |
| `GET /api/students/{id}/billing-overview` | Monthly billing status | ✅ |
| `PATCH /api/students/{id}/fee` | Update expected fee | ✅ |
| `GET /api/students/balances` | All students with balance | ⚠️ Slow |

---

### 3. Payments & Billing

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/payments` | Record payment | ✅ |
| `GET /api/payments` | List with filters | ✅ |
| `POST /api/payments/{id}/reverse` | Reverse payment | ✅ |
| `GET /api/payments/{id}/receipt` | Get receipt data | ✅ |
| `GET /api/payments/{id}/receipt.pdf` | Download PDF | ✅ |

**Billing cycle modes:** Monthly (1 month), Bi-monthly (2), Quarterly (3), Tri-monthly (3)

---

### 4. Reports & Exports

| Endpoint | Function | Status |
|----------|----------|--------|
| `GET /api/reports/summary` | Dashboard totals | ⚠️ Loads ALL students |
| `GET /api/reports/pending` | Pending fees list | ⚠️ No pagination |
| `GET /api/reports/daily` | Daily collection by mode | ✅ |
| `GET /api/reports/monthly-students` | Per-student monthly status | ⚠️ No pagination |
| `GET /api/reports/annual` | Annual revenue | ✅ |
| `GET /api/export/students.csv` | Export all students | ⚠️ No streaming |
| `GET /api/export/payments.csv` | Export payments | ⚠️ No streaming |
| `GET /api/export/pending.csv` | Export pending | ⚠️ No streaming |

---

### 5. Staff & Salary

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/staff` | Create staff | ✅ |
| `GET /api/staff` | List staff | ✅ |
| `PATCH /api/staff/{id}` | Update staff | ✅ Backend, ❌ No UI |
| `DELETE /api/staff/{id}` | Delete staff | ⚠️ Hard delete, FK risk |
| `POST /api/staff/salary` | Record salary | ⚠️ No duplicate check |
| `GET /api/staff/salary/records` | List salary records | ⚠️ N+1 query |
| `GET /api/staff/salary/{id}/slip.pdf` | Salary slip PDF | ✅ |

---

### 6. Attendance

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/attendance/students` | Bulk mark student attendance | ⚠️ No existence check |
| `GET /api/attendance/students` | List for a date | ✅ |
| `GET /api/attendance/students/{id}/summary` | Summary stats | ✅ |
| `GET /api/attendance/students/{id}/history` | History | ✅ |
| `POST /api/attendance/staff` | Bulk mark staff attendance | ⚠️ No existence check |
| `GET /api/attendance/staff` | List for a date | ✅ |

---

### 7. Exams & Marks

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/exams` | Create exam | ✅ |
| `GET /api/exams` | List exams | ✅ |
| `DELETE /api/exams/{id}` | Delete exam | ⚠️ Cascade unclear |
| `POST /api/exams/marks` | Add single mark | ⚠️ No validation |
| `POST /api/exams/marks/bulk` | Bulk marks | ⚠️ No duplicate check |
| `GET /api/exams/marks` | List marks | ⚠️ N+1 query |
| `GET /api/exams/{id}/report-card/{student_id}.pdf` | Report card | ✅ |
| `POST /api/exams/{id}/calculate-grades` | Auto-grade | ⚠️ Hardcoded thresholds |

---

### 8. Fee Management

| Endpoint | Function | Status |
|----------|----------|--------|
| `POST /api/fees/structures` | Create fee structure | ✅ |
| `GET /api/fees/structures` | List structures | ⚠️ No pagination |
| `PATCH /api/fees/structures/{id}` | Update | ⚠️ Uses Create schema |
| `DELETE /api/fees/structures/{id}` | Delete | ⚠️ Hard delete |
| `POST /api/fees/discounts` | Create discount | ✅ |
| `DELETE /api/fees/discounts/{id}` | Soft-delete | ✅ |
| `POST /api/fees/student-discounts` | Assign to student | ⚠️ No duplicate check |

---

### 9. Other Modules

| Module | Key Features | Status |
|--------|-------------|--------|
| CMS | Web content, gallery photos | ✅ Basic |
| Enquiries | Submit, list, update, delete | ✅ Basic |
| Academic | Years, classes, subjects | ✅ Basic |
| Uploads | File upload/serve/delete | ✅ |
| Utilities | Backup, promote, TC, WhatsApp, birthdays | ⚠️ Multiple issues |

---

## Critical Issues & Bugs <a name="critical-issues"></a>

### 🔴 Critical (Must Fix)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **No academic year rollover / year-to-year transition** | Entire system | Students stuck in old batch, no way to mass-update codes/fees/periods for new year |
| 2 | **N+1 query problem throughout** | salary records, marks, attendance, student balances | Severe performance degradation with data growth |
| 3 | **ASCII-only PDF generation** | `utilities.py` (TC), possibly salary slips | Crashes on non-English names (Tamil, Hindi) |
| 4 | **Untyped `dict` payloads** (no validation) | `utilities.py` (promote, fee-reminder), `savings.py` (retract) | Any malformed JSON accepted, potential crashes |
| 5 | **Global receipt sequence lock** | `payments.py` | ALL payments serialize globally — throughput bottleneck |
| 6 | **Reports load ALL students into memory** | `reports.py` (summary, pending, monthly-students) | OOM/timeout for institutions with 5000+ students |
| 7 | **Exam marks entry requires UUID input** | Frontend `academic/page.tsx` | Completely unusable for normal admin users |
| 8 | **Permissions system is unused** | All route files | 14 permissions defined but never checked — any user can do anything |

### 🟠 High Priority

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 8 | Hard deletes violate data integrity | staff, exams, fee structures | FK constraint errors, orphaned records |
| 9 | No pagination on report endpoints | `/pending`, `/monthly-students` | Response too large for big schools |
| 10 | Payment reversal available to any user | `payments.py` | Non-admin can reverse any payment |
| 11 | Write-on-read pattern (GET creates records) | `get_student_fee`, `get_institution_settings` | Side effects on read operations |
| 12 | Search uses unescaped LIKE wildcards | `students.py`, `staff.py` | `%` and `_` in search terms match unintended rows |
| 13 | No edit UI for staff, fee structures, discounts | Frontend | Users must delete and recreate to correct mistakes |
| 14 | `add_months()` breaks with negative values | `billing.py` | Potential crash in edge-case billing calculations |
| 15 | Autocomplete not keyboard-accessible | Collect page | Keyboard-only users cannot select students |

---

## Missing Features & Gaps <a name="missing-features"></a>

### High Priority Missing Features

| # | Feature | Why It's Needed | Effort |
|---|---------|-----------------|--------|
| 1 | **Granular permission enforcement** | 14 permissions exist but aren't checked — security gap | Medium |
| 2 | **Staff edit functionality** | No way to update staff info after creation | Small |
| 3 | **Bulk marks entry with student/subject dropdowns** | Current UUID input is unusable | Medium |
| 4 | **Attendance reports & analytics** | Data collected but no summarization | Medium |
| 5 | **Fee structure assignment to students** | Structures exist but no link to students | Medium |
| 6 | **Student discount assignment UI** | Backend exists but no frontend | Small |
| 7 | **Password reset / forgot password** | Locked-out users have no recovery | Medium |
| 8 | **Notification system** (email/SMS) | Fee reminders are only WhatsApp links | Large |
| 9 | **Audit log** | No trail of who did what, when | Medium |
| 10 | **Data backup automation** | Only manual JSON export exists | Medium |

### Medium Priority Missing Features

| # | Feature | Why It's Needed |
|---|---------|-----------------|
| 11 | Edit/delete for academic years, classes, subjects | Can only create, not modify |
| 12 | Fee structure edit functionality | Only create/delete |
| 13 | Discount edit functionality | Only create/soft-delete |
| 14 | Partial payment support | Current system only allows exact cycle amounts |
| 15 | Student/parent mobile app or portal | Currently admin-only |
| 16 | Multi-language support (i18n) | UI is English-only, many users prefer Tamil/Hindi |
| 17 | Dashboard financial overview | Missing today's collection, total outstanding |
| 18 | Attendance correction/edit | Once saved, no way to fix mistakes |
| 19 | Report card template customization | Grade thresholds are hardcoded |
| 20 | Configurable receipt template | Fixed layout, no customization |

### 🔴 Year-to-Year Transition (Academic Year Rollover) — MAJOR GAP

The current system has **no proper academic year rollover/transition workflow**. When a student completes one academic year (e.g., 2025-2026) and moves to the next (2026-2027), the following things need to happen but **DON'T**:

| # | What Should Happen | Current State | Impact |
|---|-------------------|---------------|--------|
| 1 | **Update batch** (e.g., "2025-2026" → "2026-2027") | ❌ Only manual bulk promote changes class, optionally batch | Old billing periods visible, new year doesn't start fresh |
| 2 | **Reset billing periods** for new academic year | ❌ Old billing periods persist forever | System shows all-months-paid from last year mixed with new year |
| 3 | **Update student_code/roll number** for new year | ❌ No mechanism at all | Students keep old codes, IDs don't reflect new class |
| 4 | **Update fee amount** for new year (fees usually change) | ❌ Must manually edit each student's fee | Admin must individually update 100s of students |
| 5 | **Archive previous year's payment history** | ❌ All history stays mixed together | Reports mix current and past year data |
| 6 | **Update billing_start_month and billing_end_month** | ❌ Must be done manually per student | Billing cycle may point to old year dates |
| 7 | **Promote class (VI → VII, VII → VIII, etc.)** | ⚠️ Partial — only class_name + batch update | No section reassignment, no roll number update, no fee update |
| 8 | **Handle graduated/left students** | ❌ No "completed" status | Final-year students stay as "active" indefinitely |
| 9 | **Carry forward pending dues** from old year | ❌ Not tracked separately | Old dues mixed with new year dues |
| 10 | **Link student to academic year** | ❌ No FK between student and academic_year | Cannot query "students of 2025-2026 vs 2026-2027" |

#### What Currently Exists

The **only** year transition tool is `POST /api/utils/promote-students`:
```python
# Current promote_students — ALL it does:
student.class_name = to_class      # Update class name
student.batch = new_batch          # Optionally update batch string
# That's it. Nothing else changes.
```

#### What's Needed: Complete Year Transition Workflow

A proper "Academic Year Rollover" should be a **multi-step wizard** that does:

1. **Select source year** (2025-2026) → **target year** (2026-2027)
2. **Class mapping** (VI→VII, VII→VIII, VIII→IX, final year→Alumni/Completed)
3. **For each student being promoted:**
   - Update `class_name` (e.g., "VII" → "VIII")
   - Update `section` (reassign if needed)
   - Update `batch` (e.g., "2025-2026" → "2026-2027")
   - Update or regenerate `student_code` (e.g., "2025-VII-001" → "2026-VIII-001")
   - Update `serial_no` (new roll number for new class)
   - Update `billing_start_month` and `billing_end_month` for new year
   - Reset/create new billing periods for the new batch
   - Apply new fee structure (based on target class fee structure)
   - Mark old billing periods as "archived/previous year"
4. **For students NOT being promoted** (detained/failed):
   - Keep same class, update batch year only
5. **For final-year students** (e.g., X or XII):
   - Mark as `status = completed` (new status needed)
   - Generate TC if needed
6. **Carry forward unpaid dues** from old year as a separate "arrears" entry
7. **Create an audit record** of the entire promotion batch

#### Database Changes Required

```sql
-- New status for graduated students
ALTER TYPE student_status ADD VALUE 'completed';

-- Link students to academic year
ALTER TABLE students ADD COLUMN academic_year_id UUID REFERENCES academic_years(id);

-- Archive marker for billing periods
ALTER TABLE student_billing_periods ADD COLUMN academic_year_id UUID REFERENCES academic_years(id);

-- Promotion history table
CREATE TABLE promotion_history (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    from_class VARCHAR(100),
    to_class VARCHAR(100),
    from_batch VARCHAR(20),
    to_batch VARCHAR(20),
    from_academic_year_id UUID REFERENCES academic_years(id),
    to_academic_year_id UUID REFERENCES academic_years(id),
    promoted_at TIMESTAMP WITH TIME ZONE,
    promoted_by UUID REFERENCES users(id)
);

-- Arrears tracking
CREATE TABLE student_arrears (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    from_academic_year_id UUID REFERENCES academic_years(id),
    amount NUMERIC(12,2),
    description TEXT,
    is_cleared BOOLEAN DEFAULT FALSE,
    cleared_payment_id UUID REFERENCES payments(id)
);
```

---

### Low Priority Missing Features

| # | Feature | Why It's Needed |
|---|---------|-----------------|
| 21 | Dark/light theme toggle | Hardcoded dark theme |
| 22 | Data import from other systems | Only Excel import exists |
| 23 | Parent communication log | Track all messages sent |
| 24 | Fee concession workflow | Approval process for discounts |
| 25 | Academic calendar | No holiday/event tracking |
| 26 | Student ID card generation | Common school admin need |
| 27 | Library management | Common add-on module |
| 28 | Transport management | Route/bus/stop tracking |
| 29 | Hostel management | Room allocation, fees |
| 30 | Online payment gateway | Currently cash/UPI/bank only (manual) |

---

## Performance Issues <a name="performance-issues"></a>

| # | Issue | Where | Fix |
|---|-------|-------|-----|
| 1 | N+1 queries in list endpoints | Staff salary, marks, attendance, balances | Use `joinedload`/`selectinload` |
| 2 | `/reports/summary` loads ALL students | Reports API | Use aggregate SQL queries instead of Python loops |
| 3 | `/reports/pending` no pagination | Reports API | Add `limit/offset` params |
| 4 | Student balances computed per-student in loop | Students API | Batch computation or materialized view |
| 5 | Global receipt lock serializes all payments | Payments API | Use per-sequence partitioning or optimistic locking |
| 6 | Backup export loads entire DB into memory | Utilities API | Streaming JSON export |
| 7 | Birthday calculation iterates all students | Utilities API | SQL date comparison query |
| 8 | No DB indexes on commonly filtered columns | Multiple | Add indexes on `student.class_name`, `payment.paid_at` |
| 9 | Excel import processes all rows in memory | Students API | Streaming/chunked processing |
| 10 | Frontend re-renders on every billing overview change | Collect page | Memoize computed values |

---

## Security Concerns <a name="security-concerns"></a>

| # | Concern | Severity | Location |
|---|---------|----------|----------|
| 1 | Permissions defined but never enforced | HIGH | All routes |
| 2 | Any user can reverse payments | HIGH | `payments.py` |
| 3 | Any user can create students/payments | MEDIUM | `students.py`, `payments.py` |
| 4 | Rate limiter is per-process (bypassed with multiple workers) | MEDIUM | `auth.py` |
| 5 | No token revocation/blacklist | MEDIUM | Auth system |
| 6 | Database reset only needs confirmation text | MEDIUM | `settings.py` |
| 7 | Backup endpoint exposes all data in one file | MEDIUM | `utilities.py` |
| 8 | No file type/content validation on upload | MEDIUM | `uploads.py` |
| 9 | Edge middleware doesn't verify JWT expiry | LOW | `middleware.ts` |
| 10 | No CSRF protection (relies on SameSite cookies) | LOW | Frontend |
| 11 | User hard-delete may leave orphan references | LOW | `auth.py` |

---

## UX & Accessibility Problems <a name="ux-accessibility"></a>

### UX Issues

| # | Problem | Page | Impact |
|---|---------|------|--------|
| 1 | Exam marks require UUID text input | Academic | Feature unusable |
| 2 | No edit for staff/fee structures/discounts | Multiple | Must delete & recreate |
| 3 | No unsaved changes warning | All forms | Data loss on navigation |
| 4 | Import workflow has no stepper/progress | Settings | Complex 4-step in one dialog |
| 5 | Dashboard missing financial overview | Dashboard | Key data not visible |
| 6 | Tab navigation not URL-persistent | Staff, Academic | Refresh loses tab state |
| 7 | No bulk mark entry for exams | Academic | One-by-one is too slow |
| 8 | Attendance has no "undo" after save | Staff | Mistakes are permanent |
| 9 | Discount value not cleared on type switch | Fees | 500 fixed → 500% on switch |
| 10 | No offline/error recovery guidance | Global | Users stuck on failures |

### Accessibility Issues

| # | Problem | Pages Affected | WCAG Violation |
|---|---------|---------------|----------------|
| 1 | Color-only status differentiation | Collect, Students | 1.4.1 Use of Color |
| 2 | Missing `aria-label` on icon buttons | Multiple | 4.1.2 Name, Role, Value |
| 3 | No proper `role="tablist"` on tabs | Staff, Academic | 4.1.2 Name, Role, Value |
| 4 | Autocomplete lacks `role="listbox"` | Collect | 4.1.2 Name, Role, Value |
| 5 | No `<label htmlFor>` on many inputs | Settings, Staff | 1.3.1 Info and Relationships |
| 6 | Muted text fails contrast requirements | Global | 1.4.3 Contrast (Minimum) |
| 7 | No skip-to-content link | Global | 2.4.1 Bypass Blocks |
| 8 | No heading hierarchy (h1/h2/h3) | Global | 1.3.1 Info and Relationships |
| 9 | Focus not returned after dialog close | Multiple | 2.4.3 Focus Order |
| 10 | Small touch targets on attendance buttons | Staff | 2.5.5 Target Size |

---

## Test Coverage Gaps <a name="test-coverage"></a>

### Current Coverage: ~39% of backend routes tested

| Tested ✅ | Untested ❌ |
|-----------|------------|
| Auth (17 tests) | Attendance |
| Payments (9 tests) | Staff & Salary |
| Students (8 tests) | Exams & Marks |
| Reports (7 tests) | Fee Management |
| Savings (4 tests) | CMS |
| Settings (5 tests) | Enquiries |
| — | Academic |
| — | Public endpoints |
| — | Utilities |
| — | Uploads |
| — | Exports (only basic) |

### Frontend: ~1% coverage (1 smoke test)

**Missing frontend tests:**
- Payment collection flow (most critical user journey)
- Student search/selection
- Form validations (Zod schemas)
- Auth flow (login/refresh/logout)
- Permission-based UI visibility

### CI/CD Gaps

| Present ✅ | Missing ❌ |
|-----------|-----------|
| Pytest with real Postgres | Coverage reporting & gates |
| Frontend build check | Linting (ruff/eslint) |
| Dependency caching | Security scanning (pip-audit) |
| — | Migration validation |
| — | E2E tests |
| — | Docker build check |
| — | Deployment automation |

---

## Prioritized Recommendations <a name="recommendations"></a>

### 🔴 Phase 1 — Critical Fixes (Week 1-2)

1. **Build Academic Year Rollover system** — Multi-step wizard: class mapping → student code regeneration → batch update → fee update → billing period reset → arrears carry-forward
2. **Fix N+1 queries** — Add `selectinload`/`joinedload` to all list endpoints
3. **Fix PDF encoding** — Switch TC and salary PDFs to UTF-8 (use reportlab/weasyprint)
4. **Add Pydantic schemas** to untyped endpoints (promote, fee-reminder, retract)
5. **Add pagination** to `/reports/pending` and `/reports/monthly-students`
6. **Fix exam marks UI** — Replace UUID inputs with searchable student/subject dropdowns
7. **Enforce permissions** in route handlers (check `user.permissions` list)
8. **Restrict payment reversal** to admin users

### 🟠 Phase 2 — High Priority (Week 3-4)

8. **Add edit functionality** for staff, fee structures, discounts
9. **Soft-delete instead of hard-delete** for staff, exams, fee structures
10. **Optimize reports** — Use SQL aggregations instead of Python loops
11. **Add autocomplete keyboard support** on collect page
12. **Fix report summary** to use aggregate queries (not load all students)
13. **Add duplicate checks** (salary per month, marks per student+exam+subject, discount assignment)
14. **Add input validation**: marks ≤ max_marks, discount ≤ 100%, dates in range

### 🟡 Phase 3 — Medium Priority (Week 5-8)

15. **Add test coverage** for untested modules (attendance, staff, exams, fee_mgmt)
16. **Add frontend tests** for collect flow, student CRUD, auth
17. **Add CI improvements** — coverage gates, linting, security scanning
18. **Add audit log** for payment/reversal/delete actions
19. **Add attendance reports** and analytics
20. **Add bulk marks entry** UI with class roster view
21. **Fix accessibility** — ARIA roles, labels, contrast, heading hierarchy
22. **Add password reset** flow
23. **Move rate limiter** to Redis (for multi-worker support)
24. **Add URL-persistent tabs** on staff/academic pages

### 🟢 Phase 4 — Enhancements (Month 2-3)

25. Add notification system (email/SMS fee reminders)
26. Add data backup automation (scheduled)
27. Add i18n support (Tamil/Hindi)
28. Add partial payment support
29. Add student/parent portal
30. Add online payment gateway integration
31. Add student ID card generation
32. Add academic calendar
33. Add theme toggle (light/dark)
34. Add configurable receipt/report card templates

---

## Active Issues & Feature Requests (User-Reported) <a name="user-reported"></a>

### 🔴 Bugs (Must Fix Now)

| # | Issue | Area | Details | Status |
|---|-------|------|---------|--------|
| 1 | **Logout not working in deployed app** | Auth | Cookie `secure` flag mismatch — login sets `secure: true` in production but logout was hardcoded to `secure: false`, so cookies weren't cleared | ✅ FIXED |
| 2 | **Expense API returning 404** | Expenses | Likely `BACKEND_API_BASE_URL` env var misconfigured in deployment (missing `/api` suffix). Check deployment env vars. Also: router-level `require_admin_user` blocks non-admin users from even reading expenses (returns 403, not 404) | 🔍 Check deployment env |
| 3 | **Duplicate "Add" buttons** on Fees page and other pages | UI | Header "Add" button shows simultaneously with Empty State "Add" button — should hide header button when empty state is rendered | 📋 To fix |

### 🟠 Application Feature Requests

| # | Feature | Area | Details | Status |
|---|---------|------|---------|--------|
| 4 | **Attendance filtered by class** | Attendance | Changed to dropdown, students load only after class selected | ✅ Done |
| 5 | **Year-to-year carry forward (easy method)** | Academic Rollover | Full rollover wizard: class mapping, dynamic roll numbers, fee update, arrears carry-forward, promotion history | ✅ Done |
| 6 | **Savings linked by persistent student ID** | Savings | Already works — savings uses student UUID (never changes), not student_code. Roll number changes don't affect savings. | ✅ Already Working |
| 7 | **Staff attendance → Login/Logout model** | Staff Attendance | Clock-in/clock-out with timestamps, auto late detection, total hours, monthly analytics | ✅ Done |
| 8 | **Edit features (single + bulk)** | Students & Staff | Student edit dialog, staff edit dialog, bulk edit with checkboxes + progress | ✅ Done |
| 9 | **Student management page UI overhaul** | UI/UX | Class/section/status filter dropdowns, improved table with badges/links/actions, responsive, empty states | ✅ Done |
| 10 | **Roll number dynamic generation on carry-forward** | Promotion | Included in rollover wizard — auto-generates codes like 0601 (class 6, roll 1) | ✅ Done |

### 🟢 Website (Public Pages) Feature Requests

| # | Feature | Details | Status |
|---|---------|---------|--------|
| 11 | **Change website colors** | Vibrant blue/orange/green palette applied | ✅ Done |
| 12 | **Marquee/ticker for news** | Scrolling news bar with admin-editable content | ✅ Done |
| 13 | **Bigger navbar font sizes** | Nav links increased to text-base/text-lg | ✅ Done |
| 14 | **Hero banner on homepage** | Full-width gradient banner with CTAs | ✅ Done |
| 15 | **Animated number counters** | Count-up from 0 → target on scroll (IntersectionObserver) | ✅ Done |
| 16 | **Alumni page** | Full page with notable alumni, stats, batch listing, registration CTA | ✅ Done |
| 17 | **Feature parity with dbegmore.com** | Faculty page + Facilities/Why Choose Us page added | ✅ Partial (key pages done) |

### 📊 dbegmore.com Feature Comparison (Web Scrape Results)

**Site:** Don Bosco Matriculation Hr. Sec. School, Egmore, Chennai
**Built by:** Boscosoft Technologies

| # | Feature on dbegmore.com | We Have? | Priority |
|---|------------------------|----------|----------|
| 1 | **Flash News / Marquee ticker** (scrolling announcements) | ❌ | HIGH — requested above |
| 2 | **Hero banner/slider** with school images | ❌ | HIGH — requested above |
| 3 | **Animated number counters** (2500+ Students, 150+ Faculty) | ❌ | HIGH — requested above |
| 4 | **"Why Choose Us" section** with facility cards (Labs, Library, Sports, Arts, Computer, Transport) | ❌ | MEDIUM |
| 5 | **Video gallery** (YouTube channel integration) | ❌ | MEDIUM |
| 6 | **Alumni section** (Membership Form, News & Views, Awards & Scholarships, Notable Alumni, Executive Members, Alumni History) | ❌ | HIGH — requested above |
| 7 | **Faculty pages** (Teaching Staff, Non-Teaching Staff) with photos | ❌ | MEDIUM |
| 8 | **Student sections** (Rules, Counselor's Desk, Best Students of Week, Outstanding Students, Student Leaders, Houses, Activities, Medals & Awards, School Toppers, Dress Code) | ❌ Most | MEDIUM |
| 9 | **Management section** (Principal's Message, Rector's Message, House Council, House Community) | ❌ | MEDIUM |
| 10 | **Academics section** (Examinations, Study Material downloads, Programmes) | ❌ | MEDIUM |
| 11 | **About section** (Vision & Mission, History, About Founder) | ⚠️ Basic "About" exists | LOW |
| 12 | **Class Timetable display** | ❌ | MEDIUM |
| 13 | **Quick Links sidebar** with important pages | ❌ | LOW |
| 14 | **Social media links** in footer | ❌ | LOW |
| 15 | **Contact info in header** (phone + email always visible) | ❌ | LOW |
| 16 | **Admissions Open banner** | ❌ | MEDIUM |
| 17 | **Latest News & Events** section with dates | ⚠️ We have News page but no date-based listing on homepage |
| 18 | **Achievements carousel** on homepage | ⚠️ We have Achievements page but not on homepage |
| 19 | **Photo Gallery grid** on homepage | ⚠️ We have Gallery page but not embedded on homepage |
| 20 | **Doctor's Desk** (health/counseling link) | ❌ | LOW |
| 21 | **Mega dropdown navigation** with sub-pages | ❌ (we have simple nav) | MEDIUM |
| 22 | **Online Payment Terms & Conditions page** | ❌ | LOW |
| 23 | **Magazines/Publications section** | ❌ | LOW |

**Key takeaway:** dbegmore.com is a **content-rich school website** with many informational pages. Our public site is minimal. The biggest gaps are: Alumni section, Flash news ticker, Hero banner, Animated counters, Faculty pages, Student achievement showcases, and the "Why Choose Us" facilities section.

---

## Summary Scorecard

| Area | Score | Notes |
|------|-------|-------|
| Core Billing Logic | 9/10 | Robust append-only ledger, cycles work well |
| Authentication | 7/10 | JWT works, but permissions unused |
| Student Management | 8/10 | Full CRUD + import, minor issues |
| Payment Collection | 8/10 | Works well, performance concern with lock |
| Reporting | 5/10 | Functional but doesn't scale |
| Staff Management | 4/10 | No edit, hard delete, N+1 |
| Academic/Exams | 3/10 | UUID input makes marks unusable |
| Attendance | 5/10 | Works but no reports or corrections |
| Fee Structures | 4/10 | Not linked to students, no edit |
| Frontend UX | 6/10 | Functional but accessibility gaps |
| Test Coverage | 4/10 | Core paths tested, 60% untested |
| Security | 5/10 | Auth works, permissions not enforced |
| Performance | 5/10 | N+1 everywhere, reports load all data |
| **Overall** | **5.6/10** | **Solid core, needs polish on newer modules** |

---

## File Structure Quick Reference

```
billing/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # 18 route modules (80+ endpoints)
│   │   ├── core/             # config, security, database, limiter
│   │   ├── models/           # 20 SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── services/         # billing logic, PDF generation, WhatsApp
│   ├── alembic/versions/     # 17 DB migrations
│   └── tests/                # 7 test files (~51 tests)
├── frontend/
│   ├── app/
│   │   ├── (auth)/           # login, setup-password
│   │   ├── (app)/            # 13 admin pages
│   │   ├── (public)/         # 6 public pages
│   │   └── api/              # Next.js route handlers (proxy)
│   ├── components/           # UI components (custom, no shadcn)
│   ├── lib/                  # API client, utils
│   └── tests/                # 1 smoke test
├── docker-compose.yml
├── Makefile
└── README.md
```
