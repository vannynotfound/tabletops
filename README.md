# Tabletop

A responsive frontend for the multi-table API, with account registration, sign-in, and an authenticated dashboard for users, categories, products, and orders.

## Run locally

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

The app uses `https://api-multi-db-tables.onrender.com` by default. To connect a different backend, set `NEXT_PUBLIC_API_URL` in `.env.local`.

## Routes

- `/` — landing page
- `/register` — creates an account through `POST /auth/register`
- `/login` — signs in through `POST /auth/login`
- `/dashboard` — loads the authenticated `/users`, `/categories`, `/products`, and `/orders` endpoints

The dashboard refreshes access tokens with `POST /auth/refresh` when needed and signs out through `POST /auth/logout`.
