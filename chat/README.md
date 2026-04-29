# Chat / Ask Layer

This folder contains the conversational layer over the corpus: a Cloudflare
Worker that answers questions in Electra's voice, grounded in the same
`src/data.json` and `public/posts.json` that power the graph itself.

**See [SETUP.md](./SETUP.md)** for the full deploy guide.

## Quick reference

| Resource | Value |
|----------|-------|
| Worker URL | `https://electra-chat.electrafrost.workers.dev` |
| Endpoint | `POST /ask` with JSON `{ "question": "..." }` |
| Vectorize index | `electra-corpus` (768 dims, cosine) |
| Embedding model | `@cf/baai/bge-base-en-v1.5` |
| Generation model | `claude-haiku-4-5-20251001` |
| Cloudflare Account ID | `ae72bbf8f20dfbcf063e4e1539ea7d5e` |

## Files

- `worker.mjs` — the Worker. Receives questions, embeds, retrieves, calls Claude, returns answers + citations. Also serves the admin panel.
- `wrangler.toml` — deploy config + AI/Vectorize/D1 bindings.
- `embed-corpus.mjs` — run-once script to populate Vectorize from the corpus files.
- `schema.sql` — D1 table schema for the question log.
- **[`SETUP.md`](./SETUP.md)** — full setup from scratch, including D1 + admin key.
- **[`RUNBOOK.md`](./RUNBOOK.md)** — operational reference. Daily and recurring commands.
- **[`WEEKLY_REVIEW.md`](./WEEKLY_REVIEW.md)** — the 30-minute Monday ritual that turns visitor questions into corpus improvements.
- **[`FAQS.md`](./FAQS.md)** — schema and workflow for canonical FAQ entries.
- **[`BUILDLOG.md`](./BUILDLOG.md)** — honest log of how this got built (29 April 2026), with all the friction. Source material for the article.
