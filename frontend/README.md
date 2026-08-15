# Campus Complaint System — Frontend

React single-page application for the Campus Complaint System. Provides
role-based dashboards (Student, Faculty, HOD, Dean, Principal, Admin),
complaint submission, status tracking, and a Lost & Found board.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Environment

Copy `.env.example` to `.env` and set:

| Variable             | Description                                  |
|---------------------|----------------------------------------------|
| `REACT_APP_API_URL` | Backend API base URL (e.g. `http://127.0.0.1:8000/api`) |

## Available Scripts

- `npm start` — run the app in development mode (`http://localhost:3000`)
- `npm run build` — build the production bundle into `build/`
- `npm test` — launch the test runner

## Project Structure

```
src/
├── components/   Reusable UI (modals, admin widgets, route guards)
├── context/      AuthContext (JWT auth state)
├── layouts/      Shared page layout
├── pages/        Route-level screens (dashboards, forms)
└── services/     API client (axios instance + API_URL)
```

The API client in `src/services/api.js` automatically attaches the JWT token
to every request. All endpoints are derived from `REACT_APP_API_URL`, so the
app can target different back-ends without code changes.

See the [root README](../README.md) for full-stack setup and the API overview.
