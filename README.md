# FWD 12 — CRUD Frontends

Two simple frontends for testing the Express + MySQL APIs in the [CRUD assignment](https://docs.google.com/document/d/1TN7WepsLAXB4gmPMkBZL65Sl6WJT74V3FZ_mDoT42To/edit).

## Run

Start your backend on `http://127.0.0.1:3000`, then choose a frontend:

```sh
cd marketplace-frontend
npm install
npm run dev
```

Open http://127.0.0.1:5174/marketplace/.

For LMS, run the same commands inside `lms-frontend` and open http://127.0.0.1:5173/lms/.

Use Node.js 22.12+ or 24+. Each frontend forwards `/api` requests to your backend through Vite's proxy.

## Use

- View, add, edit, and delete products or courses.
- Manage categories and view their related products or courses.
- Enable **Fitur bonus** to use the assignment's search, filters, sorting, and rating labels.
- Success and validation messages appear in the page or form.

With **Fitur bonus** enabled, the forms also offer optional participant/download counts. This is an optional extension beyond the assignment. Blank or unchanged counts are omitted from requests. If you enter a count, the frontend checks the saved record and shows a notice if the backend did not save it or the result could not be verified.

The marketplace uses `/api/products` and `/api/categories`. LMS uses `/api/courses` and `/api/categories`. Each resource uses GET for list/detail, POST for creation, PUT for updates, and DELETE for deletion. Follow the assignment's fields and JSON response format. No additional endpoints or custom headers are required by these frontends.

## Code

Each frontend keeps its code in `src/`. `api.js` sends requests, `App.jsx` loads and displays data, and `components/` contains the forms and other UI components.

```sh
npm run format
npm run format:check
npm test
npm run build
```

This repository contains only the frontends. Build your backend separately using the assignment requirements.
