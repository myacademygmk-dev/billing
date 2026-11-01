# Institute Management (Billing, Academics and Website)

Management application for student records, fee collection, savings, expenses, reports, staff, attendance, exams and website content. The public website exposes published content and enquiry forms.

Core rules:
- Payments are append-only (reverse via negative payment).
- Students are soft-deleted via `status=inactive`.
- Pending is computed: `expected_fee - sum(payments.amount)`.
- Receipt numbers are generated server-side atomically.

## Stack

- Backend: FastAPI + SQLAlchemy + Alembic + Postgres
- Frontend: Next.js App Router + Tailwind + React Query

## Quickstart (Docker)

1) Start services

`make up`

2) Run migrations (creates schema)

`make migrate`

3) Create an administrator with an explicitly chosen password

`docker compose exec backend python -m app.bootstrap_admin`

The command securely prompts for a password; no default administrator password is installed.

4) Open apps

- Frontend: `http://localhost:4000`
- Backend OpenAPI: `http://localhost:8000/docs`

Login with the username (`admin` by default) and password chosen during provisioning.

## Local Dev (no Docker)

### Backend

1) Create a Postgres database (e.g. `billing`).

2) Set env vars (copy `backend/.env.example` to `backend/.env`)

3) Install deps and run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m app.bootstrap_admin
uvicorn app.main:app --reload
```

### Frontend

Set env vars (copy `frontend/.env.example` to `frontend/.env.local`).

```bash
cd frontend
npm install
npm run dev
```

Local Next.js development uses port 3000; Docker exposes port 4000.

## Upgrading existing installations

- Back up PostgreSQL and uploaded files before upgrading. Migration `0027_mark_integrity` checks existing marks for duplicate student/subject/exam entries and invalid score ranges. If found, it stops with counts so they can be reviewed without deleting or changing historical records.
- Reset any legacy default administrator password with `docker compose exec backend python -m app.bootstrap_admin --username admin --reset-password`. Rotate `JWT_SECRET` and restart the backend to invalidate existing sessions after a compromised/default password is replaced. Existing accounts are not silently reset by migrations.
- The backend now mounts `billing_uploads` at `/app/uploads`. Before replacing an older container, copy its `/app/uploads` directory to a backup and restore those files into the new volume, owned by the backend's `appuser`. Database backups alone do not contain uploaded files. Keep both volumes in the backup plan.
- Use `COOKIE_SECURE=true` behind HTTPS. Keep it false only for local HTTP development.
- Staff read access now follows module permissions. Reports may read transactions, expenses and savings; dashboard access grants the summary only. Student lookup is shared by authorized student, collection, savings, transaction and reporting workflows. Exam staff use a separate roster containing only names and roll numbers.

## Exams and marks

Open **Academics → Exams & Marks**, select an exam, then **Open marks sheet**. Students appear in rows and class subjects in columns. Choose a class, enter scores or paste a rectangular range from a spreadsheet, and save the populated cells together. Tab moves across subjects; Enter/Shift+Enter moves down/up a subject column. Search filters the visible rows; saving still includes all populated cells in the class.

Blank cells remain unrecorded, while zero is a valid score. The server validates score ranges, two-decimal precision, subject maximums, class/year membership and duplicate entries. Saved cells stay locked; failures preserve unsaved entries. Conflicts can be resolved by reloading saved marks before retrying. Recorded totals include only entered subjects and are not final percentages or rankings.

Rosters use each student's current class and active status. The student model does not store historical class enrolments, so use the sheet before academic rollover for that cohort. Existing historical scores remain available in the recorded marks table.

## Exports

- Students CSV: `GET /api/export/students.csv`
- Payments CSV: `GET /api/export/payments.csv?from=&to=`
- Pending CSV: `GET /api/export/pending.csv`

## Tests

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm test
```
