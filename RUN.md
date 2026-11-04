# Running VSPH CRM on your laptop

A two-part app: an Express + Prisma API (`backend/`) and a Vite + React UI (`frontend/`), backed by MySQL.

| Part | Default URL |
|---|---|
| Backend API | http://localhost:5000 |
| Frontend | http://localhost:5173 |
| MySQL | localhost:3306, database `crm` |

## Prerequisites

- **Node.js 20 or newer** (`node -v`)
- **MySQL 8 / MariaDB** running locally (Laragon, XAMPP, or a normal MySQL install)
- **Git**
- npm (comes with Node)

## 1. Get the code

```bash
git clone https://github.com/hardik0924/CRM.git
cd CRM
```

## 2. Create the database

Start MySQL, then create an empty database named `crm`:

```sql
CREATE DATABASE crm;
```

With Laragon/XAMPP you can do this in phpMyAdmin instead. Note your MySQL user and password — usually `root` with no password on Laragon, or a password you chose.

## 3. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 4. Configure the backend

Create `backend/.env` (copy the values below and adjust the database login):

```env
PORT=5000
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/crm"
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=YOUR_PASSWORD
DATABASE_NAME=crm

# Local development only — change before deploying anywhere public
INTEGRATION_HMAC_SECRET=dev-local-hmac-secret-change-me
INTEGRATION_API_KEY=dev-local-integration-key
INTEGRATION_MAX_SKEW_SECONDS=300
INVITATION_BASE_URL=http://localhost:5173
INVITATION_TTL_HOURS=72
ENFORCE_ENTITLEMENT=true
```

- If your MySQL `root` has no password, use `DATABASE_URL="mysql://root:@localhost:3306/crm"` and leave `DATABASE_PASSWORD=` empty.
- The database name must match the one you created in step 2.
- The double quotes around `DATABASE_URL` matter because the value contains `://`.

## 5. Configure the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

If you change the backend port, update this value to match.

## 6. Create the tables and demo data

From the `backend` folder:

```bash
cd backend
npx prisma db push          # creates/updates all tables and generates the Prisma client
npm run seed                # demo tenant, superadmin and client user
npm run backfill:onboarding # idempotent: gives existing tenants an entitlement and owner
```

`prisma db push` is the supported setup path for this project; you do not need to run migrations on a fresh laptop.

## 7. Start the servers

Open **two terminals**.

Terminal 1 — backend:

```bash
cd CRM/backend
npm run dev
```

Wait for `Server running on port 5000` (or `CRM API Running`).

Terminal 2 — frontend:

```bash
cd CRM/frontend
npm run dev
```

Vite prints the URL, normally **http://localhost:5173**. Open it in a browser.

## 8. Sign in

| Role | Email | Password | Lands on |
|---|---|---|---|
| Superadmin | `superadmin@crm.com` | `0000` | `/superadmin` |
| Client administrator | `client@vsph.com` | `0000` | `/v2/dashboard` |
| ABC administrator | `admin.abc@vsph.in` | `Admin1234` | `/v2/dashboard` |
| ABC owner | `abc@vsph.in` | `0000` | `/v2/dashboard` |
| ABC employee | `abcsales@vsph.in` | `0000` | `/v2/dashboard` |

New client users and employees sign in on the same page with the email and password set for them. Invitation links use `INVITATION_BASE_URL`, so keep it pointed at the frontend URL you actually run.

## Everyday commands

```bash
# Backend unit tests
cd backend
npm test

# Frontend production build (sanity check)
cd frontend
npx vite build

# Optional frontend lint
npm run lint
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Port 5000 is already in use` | Stop the other process, or change `PORT` in `backend/.env` **and** `VITE_API_URL` in `frontend/.env`. |
| `Can't reach database server` / auth error | Check MySQL is running, the database `crm` exists, and the user/password in `DATABASE_URL` are correct. |
| Login says invalid password | Run `npm run seed` again from `backend/`; it recreates the demo users. |
| Tables missing / Prisma client errors | Re-run `npx prisma db push` from `backend/`, then restart the API. |
| Frontend loads but every request fails | Confirm the API is on port 5000 and `frontend/.env` has `VITE_API_URL=http://localhost:5000`; restart Vite after changing `.env`. |
| Blank page after pulling new code | Stop Vite, delete `frontend/node_modules/.vite`, then run `npm run dev` again. |
| Invitation link points to the wrong port | Set `INVITATION_BASE_URL` in `backend/.env` to your frontend URL and restart the API. |

## Updating an existing database

For a laptop that already has the schema, `npx prisma db push` keeps it in sync with `backend/prisma/schema.prisma`. If you deploy to a shared or production database, take a backup first and run the SQL in `backend/prisma/migrations/` deliberately. Do not run `prisma migrate reset` against data you care about.
