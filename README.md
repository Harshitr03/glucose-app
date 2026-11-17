# Sweety – Blood Glucose Tracker

A web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and monthly reports. Patients can share their reports with a doctor, who can view them read-only and leave notes.

**Stack:** Node.js + Express 5, PostgreSQL 17, React 19 (Vite), plain CSS. The assignment brief is in [docs/ASSIGNMENT.md](docs/ASSIGNMENT.md).

## Features

- **Sign up and log in** with name, email and password. Passwords are hashed with bcrypt and sessions use JWTs. Each user only sees their own data.
- **Readings:** add, edit and delete readings with a date, time slot (Morning (fasting), After breakfast, After lunch, After dinner) and a value in mg/dl. Every validation rule from the brief is enforced on both the server and the client, with the brief's exact error messages.
- **Reports:** daily, month-to-date and previous-month reports showing highest, lowest, average (to 1 decimal) and number of readings, plus how many fell in the 70–180 mg/dl range. The daily report lists each reading with its slot. Periods with no readings show an empty state.
- **Logbook:** readings grouped by date, one row per day and one column per slot, browsed month by month in oldest-first or newest-first order.
- **Quick logging:**
  - The form picks the next empty slot for the time of day.
  - A High, Low or In range hint appears while you type.
  - Saving shows a confirmation and highlights the slot on the Today strip.
  - Deleting a reading or note can be undone.
- **Other touches:**
  - A badge on "My doctors" when an invitation is waiting.
  - A clear message when a session expires.
  - The report date and logbook month stay in the URL.
  - The chart can show this month, 7 days or 30 days.
  - A show/hide password toggle.
  - A welcome message for new patients.
  - Doctors see each patient's last reading and 30-day in-range percentage.
- **Bonus: pagination** on `GET /api/readings?page=1&limit=20`.
- **Bonus: chart** of readings with one line per slot (Recharts), for this month, the last 7 or 30 days, or a custom range of up to a year picked in a two-click range calendar.
- **Bonus: Docker** setup for PostgreSQL and Redis in `docker-compose.yml`.
- **Bonus: Redis caching** of report results, cleared whenever the user's readings change.
- **Bonus: frontend tests** for the reading form with Vitest and React Testing Library.
- **Bonus: doctor role.** A doctor invites a patient by email, and the patient accepts in the app. The doctor can then view the patient's reports and readings, but not change them, and can add, edit and delete notes that the patient sees on their Reports page.

## Project layout

```
sweety/
├── docker-compose.yml        # PostgreSQL and Redis for development and tests
├── docker/postgres/init/     # creates the sweety_test database
├── server/                   # Express API
│   ├── src/
│   │   ├── routes/           # HTTP endpoints
│   │   ├── services/         # database queries and business rules
│   │   ├── validation/       # request validation with user-facing messages
│   │   ├── middleware/       # requireAuth, requireRole
│   │   └── db/               # connection pool and schema.sql
│   ├── scripts/              # migrate.js, seed.js
│   └── tests/                # Jest + Supertest API tests
├── client/                   # React app (Vite)
│   └── src/
│       ├── pages/            # patient and doctor screens
│       └── components/       # form, logbook, reports, chart, notes
└── docs/                     # assignment brief, screenshots
```

## Getting started

### Prerequisites

- Node.js 20.19 or newer (developed on Node 26)
- Docker, for PostgreSQL. A local PostgreSQL 14+ also works; see [Database setup](#database-setup).

### Install

```bash
git clone <repo-url> sweety
cd sweety
npm install --prefix server
npm install --prefix client
```

### Environment variables

The server reads `server/.env`. Copy the example; its defaults match `docker-compose.yml`:

```bash
cp server/.env.example server/.env
```

| Variable | Purpose | Default in example |
|---|---|---|
| `PORT` | Port the API listens on | `4000` |
| `DATABASE_URL` | PostgreSQL connection string for the app | `postgres://sweety:sweety@localhost:5432/sweety` |
| `TEST_DATABASE_URL` | Separate database used by the tests | `postgres://sweety:sweety@localhost:5432/sweety_test` |
| `JWT_SECRET` | Secret used to sign login tokens; use a long random string | `change-me-to-a-long-random-string` |
| `JWT_EXPIRES_IN` | How long a login lasts | `7d` |
| `CLIENT_ORIGIN` | URL of the React app, allowed by CORS | `http://localhost:5173` |
| `APP_TIMEZONE` | Time zone used to decide what "today" is | `Asia/Kolkata` |
| `REDIS_URL` | Redis for the report cache. Optional: leave it out to turn caching off | `redis://localhost:6379/0` |
| `TEST_REDIS_URL` | Redis database used by the tests (flushed before each test) | `redis://localhost:6379/1` |
| `REPORT_CACHE_TTL_SECONDS` | How long a cached report lives | `3600` |

The client needs no environment variables. In development, Vite forwards `/api` requests to `http://localhost:4000`.

### Database setup

Start PostgreSQL and Redis. This creates the `sweety` database and, on first start, a second `sweety_test` database for the tests:

```bash
docker compose up -d
```

Create the tables in both databases:

```bash
npm --prefix server run db:migrate
```

```bash
npm --prefix server run db:migrate:test
```

Without Docker, create two databases yourself (for example `createdb sweety` and `createdb sweety_test`), point `DATABASE_URL` and `TEST_DATABASE_URL` at them, then run the two migrate commands.

### Seed demo data

```bash
npm --prefix server run db:seed
```

This creates two linked demo accounts, both with the password `demo1234`:

| Role | Email | What it has |
|---|---|---|
| Patient | `demo.patient@sweety.test` | About 160 readings from the 1st of last month to today |
| Doctor | `demo.doctor@sweety.test` | Linked to the demo patient, with two notes |

Running it again replaces only these two accounts and their data.

### Run the server

```bash
npm --prefix server run dev
```

The API runs at http://localhost:4000. `GET /api/health` returns `{"status":"ok"}` when it can reach the database.

### Run the client

In a second terminal:

```bash
npm --prefix client run dev
```

Open http://localhost:5173 and log in with a demo account, or sign up.

### Run the tests

**API tests** (Jest + Supertest) use the `sweety_test` database and Redis database 1, and empty both before each test, so they never touch your development data. Redis must be running.

```bash
npm --prefix server test
```

The 65 tests cover:
- sign up and login
- every reading validation rule
- the daily limits
- editing within the same slot
- ownership checks
- pagination
- report maths and date ranges, including January and leap years
- doctor access rules
- notes
- the seed script

**Frontend tests** (Vitest + React Testing Library) need no database or server:

```bash
npm --prefix client test
```

The 27 tests cover the reading form and the slot suggestion:
- each validation message
- that nothing is saved while the form is invalid
- saving values as numbers
- the Yesterday button
- server errors appearing under the right field
- the preset slot from the Today strip
- edit mode with save, cancel and delete
- the live High/Low hint
- choosing a date in the calendar, with future days blocked
- which slot is suggested at different times of day

## API

All endpoints except register, login and health need an `Authorization: Bearer <token>` header. Errors return `{ "error": "message", "field": "name" }`.

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Anyone | Create an account `{ name, email, password, role? }` |
| POST | `/api/auth/login` | Anyone | Log in `{ email, password }` |
| GET | `/api/auth/me` | Logged in | Current user |
| GET | `/api/readings?from=&to=&page=&limit=` | Patient | List own readings |
| POST | `/api/readings` | Patient | Add a reading `{ date, slot, value }` |
| PUT | `/api/reading?id=` | Patient | Edit a reading |
| DELETE | `/api/reading?id=` | Patient | Delete a reading |
| GET | `/api/reports?date=` | Patient | Daily, month-to-date and previous-month reports |
| GET | `/api/doctors` | Patient | Linked doctors and pending invitations |
| POST | `/api/doctor/accept?id=` | Patient | Accept a doctor's invitation |
| DELETE | `/api/doctor?id=` | Patient | Decline an invitation or stop sharing |
| GET | `/api/patients` | Doctor | Linked and invited patients |
| POST | `/api/patients` | Doctor | Invite a patient `{ email }` |
| DELETE | `/api/patient?id=` | Doctor | Remove a patient or cancel an invitation |
| GET | `/api/patient/reports?id=&date=` | Doctor | A linked patient's reports |
| GET | `/api/patient/readings?id=&from=&to=` | Doctor | A linked patient's readings |
| GET | `/api/notes?patientId=` | Patient, Doctor | Patients see all notes about them; doctors see their own notes for one patient |
| POST | `/api/notes` | Doctor | Add a note `{ patientId, body }` |
| PUT | `/api/note?id=` | Doctor | Edit own note |
| DELETE | `/api/note?id=` | Doctor | Delete own note |

## Screenshots

Screenshots of the app are in [docs/screenshots](docs/screenshots).

## Notes

### Assumptions

- **"Today"** on the server is the date in `APP_TIMEZONE` (default Asia/Kolkata), so a server running in UTC does not reject an Indian user's reading as "in the future" before 5:30 am. The client uses the browser's local date.
- **Max 4 per day overlaps with one per slot.** With exactly 4 slots, the one-per-slot rule alone would always fire first. The server checks the daily count before the slot so both messages can appear. A database `UNIQUE (user_id, reading_date, slot)` constraint backs up the slot rule if two requests arrive at once.
- **Editing** a reading can keep its own slot. It is only rejected when it moves into a slot or date that another reading already uses.
- **Values** must be whole numbers; 120.5 is rejected with the range message.
- **Monthly** means the calendar month before the selected date: 15 Oct gives 1–30 Sep. The report date cannot be in the future.
- **Emails** are case-insensitive: they are stored in lowercase.
- **Someone else's reading** returns 404, the same as one that doesn't exist, so ids can't be probed.
- **Edit and delete** endpoints take the id as a query parameter (`/api/reading?id=5`), by choice.
- **Doctor role:**
  - Anyone can sign up as a doctor; there is no verification.
  - Invitations appear in the app rather than being emailed.
  - A doctor sees nothing until the patient accepts.
  - Doctors can never change readings.
  - Notes stay visible to the patient after the patient removes the doctor.
- **The 70–180 mg/dl target range** behind the High and Low tags and the "in range" count is the commonly used general range. It is shown for information only and is not medical advice.
- **The chart** covers the selected month, starting from the first reading in that month.
- **Pagination** is available on the API, but the logbook loads one month at a time. A month has at most 124 readings, so the API's page limit allows up to 200.
- **The login token** is stored in `localStorage`, which is simple but readable by any script running on the page.
- **Report cache:**
  - Reports are cached per user and date for an hour.
  - Each user has a version number in the cache key. Adding, editing or deleting a reading bumps it, so every cached report for that user is skipped at once. One reading can affect its own day, later days of that month and the next month's "previous month" summary, so this is simpler than finding each affected key.
  - If Redis is down, reports come straight from PostgreSQL. When Redis reconnects, all cached reports are cleared, because changes made during the outage could not bump versions.

### What I'd improve with more time

- **Versioned migrations** with a tool like `node-pg-migrate`, instead of one `schema.sql` that only creates missing tables.
- **Auth hardening:** an httpOnly cookie instead of `localStorage`, refresh tokens, rate limiting on login, and password reset.
- **More frontend tests** for the logbook, reports and doctor screens, plus end-to-end tests with Playwright.
- **Doctor features:**
  - Real email invitations.
  - Verifying doctor accounts.
  - Structured prescriptions (drug, dose, frequency) instead of free-text notes.
  - An audit log of who viewed which patient's data.
- **Per-slot target ranges,** for example 80–130 fasting, and per-user time zones.
- **The full app in Docker Compose,** plus CI that runs the tests on every push.
- **The remaining bonus:** a BullMQ job for daily reminders.
