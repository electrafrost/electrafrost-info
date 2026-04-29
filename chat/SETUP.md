# Chat Setup — graph.electrafrost.com

The conversational layer over the intellectual provenance graph.
Visitors ask questions in natural language; Claude answers grounded in
Electra's own corpus (655+ posts, 55 thesis nodes, 88 CPD records, 14 eras).

## Architecture

```
Visitor on graph.electrafrost.com OR electrafrost.com
                 ↓ POST /ask
        Cloudflare Worker (electra-chat)
                 ↓
        Embed question → Workers AI (bge-base-en-v1.5)
                 ↓
        Query Vectorize index `electra-corpus` (top 8 chunks)
                 ↓
        Send to Claude Haiku 4.5 with voice-calibrated system prompt
                 ↓
        Stream answer + structured citations back
```

**One Worker, one Vectorize index, two frontends.**

## Decisions on file

- **Hosting**: Cloudflare Workers (free tier covers expected traffic)
- **Frontend**: Stays on Vercel (no migration)
- **DNS**: Nameservers stay at VentraIP. Worker uses `electrafrost.workers.dev` URL.
- **Embedding model**: `@cf/baai/bge-base-en-v1.5` (768 dims, free)
- **Generation model**: `claude-haiku-4-5-20251001` (fast, cheap, voice-friendly)
- **API key handling**: Anthropic key lives only as a Cloudflare Worker secret. Never in code, never in git.

## Files

| File | Purpose |
|------|---------|
| `worker.mjs` | The Worker. Handles `/ask` requests. |
| `wrangler.toml` | Cloudflare deploy config + bindings. |
| `embed-corpus.mjs` | Run-once script. Reads corpus, chunks, embeds, uploads to Vectorize. |
| `SETUP.md` | This file. |

## Initial deploy (one-time)

### Prerequisites

1. **Wrangler installed and authenticated**
   ```powershell
   npm install -g wrangler
   wrangler login
   wrangler whoami   # confirm
   ```

2. **Vectorize index `electra-corpus` exists** (already created Apr 2026)
   ```powershell
   cd $HOME
   wrangler vectorize list
   # Should show: electra-corpus, 768 dims, cosine
   ```

3. **Anthropic API key saved** in your password manager.
   If lost, regenerate at console.anthropic.com → API Keys.

4. **Cloudflare API token for the embedding script**.
   Create at dash.cloudflare.com → My Profile → API Tokens → Create Token → Custom token:
   - Permissions: `Account → Vectorize → Edit`, `Account → Workers AI → Read`
   - Account resources: include your account
   - Save the token in your password manager.

### Step 1 — Create the D1 database (question log)

```powershell
cd $HOME\claudeprojects\electrafrost-info-live\chat
wrangler d1 create electra-chat-log
```

Wrangler prints something like:
```
✅ Successfully created DB 'electra-chat-log'
[[d1_databases]]
binding = "DB"
database_name = "electra-chat-log"
database_id = "abc123def456-..."
```

**Copy the `database_id`** and paste it into `wrangler.toml`, replacing `REPLACE_WITH_DATABASE_ID_FROM_WRANGLER_D1_CREATE`.

Then create the schema:
```powershell
wrangler d1 execute electra-chat-log --remote --file=schema.sql
```

### Step 2 — Set the Anthropic API key as a Worker secret

```powershell
$key = "<paste-your-anthropic-key>"
$key | wrangler secret put ANTHROPIC_API_KEY
```

### Step 3 — Set the admin key (for the question review panel)

Generate a long random string for protecting the admin panel. In PowerShell:

```powershell
$adminKey = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
$adminKey  # save this somewhere — it's how you'll access the admin panel
$adminKey | wrangler secret put ADMIN_KEY
```

### Step 4 — Embed the corpus into Vectorize

Set the env vars for the embedding script (PowerShell):
```powershell
$env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e"
$env:CF_API_TOKEN  = "<the-cloudflare-token-from-prerequisite-4>"
```

Then from the project root:
```powershell
cd $HOME\claudeprojects\electrafrost-info-live
node chat/embed-corpus.mjs
```

### Step 5 — Deploy the Worker

```powershell
cd $HOME\claudeprojects\electrafrost-info-live\chat
wrangler deploy
```

### Step 6 — Test

Health:
```powershell
curl.exe https://electra-chat.electrafrost.workers.dev/health
```

Ask:
```powershell
$body = @{ question = "What is CREDU?" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://electra-chat.electrafrost.workers.dev/ask" -Method POST -Body $body -ContentType "application/json"
```

Admin panel — visit in browser (replace YOUR_ADMIN_KEY):
```
https://electra-chat.electrafrost.workers.dev/admin?key=YOUR_ADMIN_KEY
```

You should see the question you just asked logged, with retrieval scores and citation chunks.

## The corpus improvement loop

This is the key workflow. Every visitor question becomes data for improving the corpus:

1. Visit the admin panel weekly
2. Default view = thin retrieval first (red border, top score < 0.6)
3. For each thin question:
   a. Read the question and the bot's answer
   b. Decide what the corpus is missing (an FAQ entry, a new node, a clarification)
   c. Add it to `src/data.json` (locally)
   d. Commit and push (Vercel rebuilds the graph)
   e. Re-run `node chat/embed-corpus.mjs` (re-embeds the new content)
   f. In the admin panel, click **Mark addressed** with the commit SHA in the note field
4. Over time, the corpus grows in response to actual visitor curiosity.

This is the magic loop. Your corpus becomes more comprehensive every week, driven by what people actually ask, not what you guess they'll ask.

## Weekly corpus update flow

When you update `src/data.json` or `public/posts.json`:

1. Commit and push to GitHub as normal — Vercel rebuilds the graph
2. Re-run the embedding script:
   ```powershell
   cd $HOME\claudeprojects\electrafrost-info-fresh
   node chat/embed-corpus.mjs
   ```
   This re-embeds everything (idempotent — same IDs overwrite).
   ~1 minute for the full corpus.

That's it. Worker code rarely needs to change.

## Pretty subdomain (optional, later)

To use `chat.electrafrost.com` instead of `electra-chat.electrafrost.workers.dev`:

1. At VentraIP, add ONE CNAME:
   ```
   chat  CNAME  electra-chat.electrafrost.workers.dev
   ```
2. In Cloudflare → Workers → electra-chat → Settings → Triggers → Add Custom Domain → `chat.electrafrost.com`
3. Update the frontend fetch URL.

No nameserver change. Email at Proton stays untouched.

## Cost expectations

- Workers requests: free up to 100k/day
- Vectorize: free up to 30M queried dimensions/month
- Workers AI embeddings: ~10k neurons/day free
- Claude Haiku 4.5: ~$0.001 per question

For graph.electrafrost.com traffic, expect ~$0–5/month total.

## Troubleshooting

**"vectorize index not found"** — confirm the index exists with `wrangler vectorize list`.

**"unauthorized"** — re-run `wrangler login`, check token permissions.

**"answers feel generic"** — the chunking might need tuning, or the corpus is thin on that topic. Check by querying Vectorize directly:
```powershell
wrangler vectorize query electra-corpus --vector "[...]" --top-k 5
```

**"Anthropic 401"** — the secret didn't save. Re-run `wrangler secret put ANTHROPIC_API_KEY`.
