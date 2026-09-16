# MIT Compare

A contract/SOW comparison tool. Upload an "Original" and a "Revised" document
(`.docx` or `.pdf`), and it aligns clauses between them, classifies each
change's risk with Gemini, and shows a two-pane review UI with
author/comment attribution pulled straight from Word's tracked-changes data.

> This project is under active development — the feature set below reflects
> what's built today, not a finished scope. See
> [`MIT_COMPARE_PROJECT_CONTEXT.md`](./MIT_COMPARE_PROJECT_CONTEXT.md) for
> the full architecture notes, known bugs already fixed, accepted
> limitations, and deployment details.

## What it does

- Parses `.docx` files by reading `word/document.xml` directly (not
  `python-docx`'s text API), so tracked insertions/deletions, per-run
  authors, comments, and Word's auto-numbering ("3.4") all come through
  correctly.
- Aligns clauses between the two documents in two passes: fuzzy text
  matching first, then a local sentence-embedding fallback for heavily
  reworded clauses that fuzzy matching misses.
- Sends every *changed* clause to Gemini for a plain-English summary and a
  `high` / `medium` / `low` / `cosmetic` risk rating.
- Two-pane review UI (Original | Revised) with filters (All / Flagged /
  Unreviewed / High risk) and per-clause Mark reviewed / Flag actions.
- Generates a real Word report on demand — color-coded by risk, with
  tables, authors, and comments carried over.
- Optional "original baseline" mode: compare a document from *before* its
  own tracked changes were applied, instead of its current accepted state.

## Stack

| Layer    | Tech |
|----------|------|
| Backend  | FastAPI (Python), SQLite via SQLModel, Gemini 3.1 Flash-Lite, local `sentence-transformers` embeddings |
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Deploy   | Railway (two services) **or** Docker Compose, for local/VM use |

## Project structure

```
backend/
  app/
    main.py                     # FastAPI app, CORS, startup DB init
    database.py                 # SQLite engine (DB_PATH env var)
    models.py                   # Comparison + Clause tables (SQLModel)
    storage.py                  # DB read/write functions
    routers/comparisons.py      # all API endpoints
    services/
      parser.py                 # core text/authors/comments/numbering extraction
      numbering.py               # reconstructs Word's auto-numbers ("3.4")
      comments.py                 # reads word/comments.xml
      aligner.py                  # fuzzy + semantic clause matching
      embeddings.py                # local sentence-transformers wrapper
      gemini_analysis.py            # AI summary + risk, batched, rate-limited
      report.py                      # generates downloadable .docx report
frontend/
  src/
    pages/DashboardPage.tsx      # upload screen
    pages/ComparisonPage.tsx     # review screen
    components/upload/UploadPanel.tsx
    components/comparison/ClauseText.tsx
    api/comparisons.ts           # fetch wrappers
    api/types.ts                 # AlignedClause, Comment types
```

## Getting started

### Option A — Docker Compose (local machine or a VM)

1. Copy `.env.example` to `.env` and fill in both values:
   ```
   GEMINI_API_KEY=your-key-here
   VITE_API_BASE_URL=http://<this-machine's-ip>:8000
   ```
   `VITE_API_BASE_URL` is baked into the frontend at build time — the
   frontend calls the backend directly by URL, not through a proxy.
2. From the repo root:
   ```
   docker compose up --build
   ```
3. Open `http://localhost:8080`. The backend listens on `8000`; SQLite data
   persists in the `backend_data` volume across restarts.

### Option B — run backend and frontend directly

**Backend:**
```
cd backend
python -m venv venv
venv\Scripts\activate            # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
```
Set `GEMINI_API_KEY` (e.g. in `backend/.env` — `python-dotenv` loads it
automatically), then:
```
uvicorn app.main:app --reload
```

**Frontend:**
```
cd frontend
npm install
```
Set `VITE_API_BASE_URL=http://localhost:8000` in `frontend/.env`, then:
```
npm run dev
```

### Option C — company VM (Docker Swarm)

Deployed as `mitcompare` on the shared VM behind `common_nginx`, following
the internal MIT VM Deployment Runbook. Uses `docker-stack.yml` (not
`docker-compose.yml`) plus `scripts/build.sh` / `scripts/start.sh` — see the
"Deployment notes (Company VM / Docker Swarm)" section in
[`MIT_COMPARE_PROJECT_CONTEXT.md`](./MIT_COMPARE_PROJECT_CONTEXT.md) for
the full picture, and `deploy/nginx-server-block.conf.example` for the
reverse-proxy config. Once set up, shipping a change is:
```
git pull && bash scripts/build.sh && bash scripts/start.sh
```

## Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `GEMINI_API_KEY` | backend | Required for risk analysis; loaded via `python-dotenv` |
| `VITE_API_BASE_URL` | frontend | Build-time value — changing it requires a fresh build/restart of `npm run dev` |
| `DB_PATH` | backend | Optional; where the SQLite file lives (defaults to a local file, set to a mounted volume path in Docker/Railway) |

## API overview

All endpoints live in `backend/app/routers/comparisons.py`, prefixed with
`/comparisons`:

- `POST /upload` — submit the Original + Revised files, returns a `comparison_id`
- `GET /{id}` — status and paragraph counts
- `GET /{id}/clauses` — aligned clauses, recomputed on every call (no AI, no cache)
- `GET /{id}/analysis` — aligned **and** Gemini-rated clauses; cached in SQLite after the first call
- `PATCH /{id}/clauses/{clause_id}` — mark a clause `reviewed` and/or `flagged`
- `GET /{id}/report` — generate and download the `.docx` report (requires `/analysis` to have run first)

## Known limitations

- No authentication — anyone with a comparison's URL can view or edit it.
- PDF inputs are flattened — no tracked-changes, author, or numbering data for that format.
- Alignment is O(n×m) and gets slow past a few hundred clauses; the
  semantic-matching fallback is greedy, not a globally optimal assignment.
- A failed Gemini call silently falls back to a generic `medium` rating
  rather than surfacing the failure.

Full details, plus the reasoning behind each design decision, are in
[`MIT_COMPARE_PROJECT_CONTEXT.md`](./MIT_COMPARE_PROJECT_CONTEXT.md).
