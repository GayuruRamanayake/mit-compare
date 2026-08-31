# MIT Compare — Project Context

A contract/SOW comparison tool. Upload an "Original" and "Revised" document
(.docx or .pdf), it aligns clauses, classifies risk with Gemini, and shows a
two-pane review UI with author/comment attribution pulled from Word's
tracked-changes data.

## Stack

- **Backend**: FastAPI (Python), SQLite (SQLModel), Gemini 3.1 Flash-Lite,
  `sentence-transformers` (local embeddings, no API cost)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Deployment**: Railway (two services: `backend/`, `frontend/`)

## Repo layout

```
backend/
  app/
    main.py               # FastAPI app, CORS
    database.py            # SQLite engine (DB_PATH env var)
    models.py               # Comparison + Clause tables (SQLModel)
    storage.py               # DB read/write functions
    routers/comparisons.py    # all API endpoints
    services/
      parser.py                # core text/authors/comments/numbering extraction
      numbering.py               # reconstructs Word's auto-numbers ("3.4")
      comments.py                  # reads word/comments.xml
      aligner.py                    # fuzzy + semantic clause matching
      embeddings.py                  # local sentence-transformers wrapper
      gemini_analysis.py              # AI summary + risk, batched, rate-limited
      report.py                        # generates downloadable .docx report
frontend/
  src/
    pages/DashboardPage.tsx    # upload screen (dark hero)
    pages/ComparisonPage.tsx    # review screen (light theme)
    components/upload/UploadPanel.tsx
    components/comparison/ClauseText.tsx  # renders clause text + tables
    api/comparisons.ts           # fetch wrappers
    api/types.ts                  # AlignedClause, Comment types
```

## Core pipeline

1. **Upload** (`POST /comparisons/upload`) — validates file (.docx/.pdf,
   ≤50MB), parses both files, stores parsed paragraph lists in SQLite,
   returns a `comparison_id`.
2. **Parse** (`parser.py`) — reads `word/document.xml` directly via `lxml`
   (NOT `python-docx`'s simple API — see "Critical bugs found" below).
   Extracts: text (respecting tracked ins/del), authors, comments, table
   content, reconstructed auto-numbers.
3. **Align** (`GET /comparisons/{id}/clauses`, called inside `/analysis`) —
   `align_clauses()` in `aligner.py`. Two passes:
   - Fuzzy match (`rapidfuzz`) — clauses scoring ≥60% similarity (≥90% for
     strings <15 chars, to avoid short-string false matches like
     "Name:" vs "Note:") are paired as `modified`/`unchanged`.
   - Semantic fallback — leftover `deleted`/`added` clauses (≥40 chars)
     get compared via local embeddings (cosine similarity ≥0.68) to catch
     heavy rewordings fuzzy matching misses.
   - Every clause carries `authors_original`/`authors_revised` and
     `comments_original`/`comments_revised` — **both sides always
     preserved**, not just one (this was a real bug, fixed).
4. **AI analysis** (`GET /comparisons/{id}/analysis`) — checks SQLite cache
   first (instant if already computed). Otherwise batches changed clauses
   (10/batch) and sends to Gemini concurrently (semaphore-capped at 2,
   free tier is ~15 req/min) for `ai_summary` + `risk_level`
   (high/medium/low/cosmetic). Saves result to SQLite.
5. **Review UI** — two-pane (Original | Revised), sidebar with filters
   (All/Flagged/Unreviewed/High risk) + live counts, Mark reviewed/Flag
   buttons (persisted via `PATCH /clauses/{clause_id}`), author/comment
   display per side.
6. **Report** (`GET /comparisons/{id}/report`) — generates a real Word
   doc on demand from cached clause data (color-coded risk, real tables,
   authors, comments). Nothing pre-generated or saved to disk.

## "Original baseline" mode (advanced feature)

Upload has a checkbox: *"The original document has tracked changes —
compare from its pre-edit state."* When checked, `parse_document(...,
mode="original")` is used for the **original file only**:

- `mode="accepted"` (default): keeps `<w:ins>` text, drops `<w:del>` text
  → current/final document state.
- `mode="original"`: keeps `<w:delText>` (the actual pre-edit wording,
  previously never read at all), drops `<w:ins>` text → the document as
  it looked BEFORE any tracked edits.

Use case: comparing a single working-draft file (with live Track Changes)
against a separately-finalized file, to get a true "beginning → end" diff
instead of "draft → final".

## Critical bugs found and fixed (all verified against real documents)

1. **`python-docx`'s `paragraph.text` silently drops text inside
   `<w:ins>`** (tracked insertions are nested one level deeper than
   direct-child runs). Fixed by reading `word/document.xml` directly with
   `lxml`. This was the root cause of several downstream issues.
2. **Same bug existed in table cells** — fixed with a parallel `lxml`-based
   table extractor. Also fixed: table cells with multiple lines were being
   concatenated with no separator (garbled text) — fixed using a distinct
   `\u2028` marker for intra-cell line breaks vs. `\n` for row breaks.
3. **Numbering reconstruction** (`numbering.py`) — Word never stores
   "3.4" as literal text for auto-numbered lists, only a list/level
   reference. Reconstructing it correctly required:
   - Tracking per-list, per-level counters, incrementing on match,
     resetting deeper levels when a shallower level increments.
   - Only counting a slot if the paragraph has non-empty text (a truly
     blank numbered paragraph does NOT consume a slot in real Word —
     verified via LibreOffice ground truth).
   - Bullet-format levels return a resolved symbol (mapped from known
     Wingdings/Symbol codepoints, else a level-based fallback sequence)
     instead of counting up.
   - In `mode="original"`, a paragraph whose own MARK was deleted (not
     just its text) does NOT render as visible content even in Word's
     true "Original" view — confirmed against real Word AND an
     independent reconstruction script. Text is suppressed entirely for
     these in original mode, not just the number.
4. **Fuzzy-matching false positives on short strings** ("Name:" matching
   "Note:") — fixed with a stricter 90% threshold for strings <15 chars.
5. **Semantic-match false positives on structurally-similar short text**
   (two different headings like "Example 4 - Project Title: X" vs
   "Example 5 - Project Title: Y") — fixed by excluding text <40 chars
   from the semantic fallback pass entirely (headings should resolve via
   fuzzy matching or not at all).
6. **O(n²) bug in original `parse_docx`** (before the `lxml` rewrite) —
   was doing a linear scan of `doc.paragraphs` for every element; fixed
   by building an element→paragraph lookup dict once.
7. **Duplicate `Clause` model definition** — was defined once in
   `models.py` and accidentally re-pasted into `storage.py`, causing a
   SQLAlchemy table-registration crash. `storage.py` must only `import`
   `Clause`, never redefine it.

## Known limitations (accepted, not "bugs")

- **Paragraph-splitting mismatch**: if the same sentence is split into a
  different number of paragraphs in each document (found on a real audit
  clause), the 1-paragraph-to-1-paragraph alignment assumption breaks —
  shows as spurious deleted+modified instead of one clean match. Would
  require many-to-one paragraph matching to fully fix; not built.
- **Manual strikethrough formatting** (a `<w:strike/>` font style used to
  simulate a redline) is NOT the same as a real `<w:del>` tracked
  deletion — our parser correctly treats it as live text per the OOXML
  spec, which can look "wrong" visually if a document uses this pattern
  instead of real Track Changes.
- **Large documents (hundreds of clauses) are slow** — `align_clauses`
  is O(n×m) brute-force fuzzy matching. A 200-page synthetic stress test
  (~1,800 clauses) took over a minute even after fixing the O(n²) parsing
  bug. Not yet optimized (candidate: pre-filter by length/first-words
  before running full `fuzz.ratio` on every pair).
- **No authentication** — anyone with the URL can upload/view/modify any
  comparison. Not built yet.
- **PDF parsing has no tracked-changes/numbering/authors support** —
  PDFs are flattened by nature, only `.docx` gets the rich extraction.
- **Document/file storage was built then removed** — there was a PDF
  viewer feature (`/file/{side}` endpoint, `save_file`/`get_file_path` in
  storage.py) that got fully reverted due to reliability issues and
  because the Word report export serves the same underlying need better.
  Don't re-add unless deliberately revisiting that decision.

## Deployment notes (Railway)

- Two services from the same repo: `backend/` (root dir `backend`, start
  command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`), `frontend/`
  (root dir `frontend`, build `npm run build`, start
  `npm run preview -- --host 0.0.0.0 --port $PORT`).
- `nixpacks.toml` NOT currently used (LibreOffice-based .docx→PDF preview
  was tried and deliberately abandoned for resource-cost reasons on
  Railway's free tier — see "storage was built then removed" above).
- CORS origins hardcoded in `main.py` to include the deployed frontend URL
  + `localhost:5173`.
- `DB_PATH` env var points SQLite at a Railway Volume mount so it survives
  redeploys (`comparisons.db` otherwise resets on the ephemeral
  filesystem).
- Hit a real 502/OOM crash on a large document — Railway free tier's
  shared vCPU/limited RAM struggled with embedding model + alignment +
  concurrent Gemini calls together. Mitigations discussed but not fully
  built: lower `GEMINI_CONCURRENCY_LIMIT`, add a document-size guardrail,
  or upgrade to Hobby plan.
- `frontend/.env`'s `VITE_API_BASE_URL` is a BUILD-TIME value (baked into
  the JS bundle) — changing it requires a fresh build, not just a
  restart.

## Design system (current, light theme)

- Dashboard (`DashboardPage.tsx`): dark (`bg-void` `#08090C`), orange
  gradient CTA, Space Grotesk + JetBrains Mono fonts, a live "diff" hero
  animation (crimson strikethrough → teal insertion) as the signature
  visual.
- ComparisonPage: light theme (`bg-gray-50`), risk-level colors own the
  border/background of each clause card (red/amber/blue/gray for
  high/medium/low/cosmetic), status (`modified`/`added`/`deleted`) shown
  as a separate neutral gray badge — NOT color, to avoid two competing
  color systems on one card (this was a deliberate fix after user
  feedback).
- Sidebar buttons: soft-tint style (`bg-{color}-50 border-{color}-200
  text-{color}-700`), NOT solid fills — "New comparison" = orange,
  "Download report" = teal (deliberately different from any risk-level
  color to avoid confusion with the `low` risk badge, which is blue).

## Things explicitly NOT built yet (discussed as possible next steps)

- Async/background job processing for large documents (currently
  synchronous within the request).
- Alignment performance optimization for large documents.
- Authentication.
- A dedicated "raw comment/revision history" view, separate from
  clause-attached comments (discussed as an alternative to including
  paragraph-mark-deleted content in the main comparison).
