# Campus Complaint System

A full-stack web application that lets students of a campus raise complaints
(infrastructure, academics, harassment, etc.), track their status, and browse a
Lost & Found board — with role-based dashboards for Students, Faculty, HODs,
Deans, the Principal, and Administrators.

## Tech Stack

| Layer    | Technology                                                |
|----------|-----------------------------------------------------------|
| Backend  | Django 6, Django REST Framework, Simple JWT (auth)        |
| Database | Microsoft SQL Server (via `mssql` / ODBC Driver 17)       |
| Frontend | React 19, React Router 7, Tailwind CSS, Recharts, MUI     |
| Comms    | RESTful JSON API over HTTPS, JWT bearer tokens            |

## Project Layout

```
campus_complaint_system/
├── backend/        Django project (users, complaints, lostfound apps)
│   ├── core_project/   Settings, URLs, WSGI/ASGI
│   ├── users/          Auth, roles, profiles, dashboards
│   ├── complaints/     Complaint model, views, escalation logic
│   └── lostfound/      Lost & Found items and claim requests
└── frontend/       React SPA (Create React App)
    └── src/            Pages, components, context, services
```

## Prerequisites

- Python 3.12+
- Node.js 18+
- Microsoft SQL Server (local or remote) with ODBC Driver 17 for SQL Server
- `pip` and `npm`

---

## Backend Setup

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env and set SECRET_KEY, database credentials, etc.

# 4. Apply migrations
python manage.py migrate

# 5. Create an admin superuser
python manage.py createsuperuser

# 6. Run the development server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/` and the Django
admin at `http://127.0.0.1:8000/admin/`.

### Configuration

All configuration is environment-driven (see `.env.example`). Key variables:

| Variable               | Description                                  |
|-----------------------|----------------------------------------------|
| `DEBUG`               | `True` for development, `False` in prod      |
| `SECRET_KEY`          | Django secret key (keep secret!)             |
| `ALLOWED_HOSTS`       | Comma-separated allowed hosts                |
| `DB_*`                | SQL Server connection settings               |
| `CORS_ALLOWED_ORIGINS`| Comma-separated front-end origins            |
| `JWT_ACCESS_DAYS`     | Access-token lifetime in days                |
| `LOG_LEVEL`           | Logging verbosity (`INFO`, `DEBUG`, ...)     |

When `DEBUG=False`, production security headers (HSTS, secure cookies,
SSL redirect) are enabled automatically.

---

## Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Set REACT_APP_API_URL to your backend API base URL

# 3. Run the development server
npm start
```

The app runs at `http://localhost:3000` by default.

### Build for production

```bash
npm run build      # outputs to frontend/build/
```

---

## API Overview

| Endpoint                          | Method | Description                          |
|-----------------------------------|--------|--------------------------------------|
| `/api/auth/login/`                | POST   | Login (email + password)             |
| `/api/auth/register/`             | POST   | Self-registration                    |
| `/api/auth/login/student/`        | POST   | Student login (register no. + ID)    |
| `/api/dashboard/<role>/`          | GET    | Role-specific dashboard data         |
| `/api/complaints/`                | POST   | Create a complaint                   |
| `/api/complaints/all/`            | GET    | All complaints (staff/principal)     |
| `/api/complaints/<id>/status/`    | PATCH  | Update complaint status              |
| `/api/lost-found/`                | GET/POST | Lost & Found items                 |
| `/api/users/`, `/api/roles/`, ... | GET    | Admin management endpoints           |

All authenticated requests require an `Authorization: Bearer <token>` header.

---

## Notes

- `.env` files and `venv/` are git-ignored and must never be committed.
- Media uploads (complaint images, item photos) live in `backend/media/`.
- Logs are written to `backend/logs/django.log` in addition to the console.
