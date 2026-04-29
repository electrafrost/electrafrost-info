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

### Step 1 — Set the Anthropic API key as a Worker secret

From the project root:
```powershell
cd $HOME\claudeprojects\electrafrost-info-fresh\chat
wrangler secret put ANTHROPIC_API_KEY
```
Paste the key when prompted. It's stored encrypted on Cloudflare. Never visible again.

### Step 2 — Embed the corpus into Vectorize

Set the env vars for the embedding script (PowerShell):
```powershell
$env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e"
$env:CF_API_TOKEN  = "<the-cloudflare-token-from-prerequisite-4>"
```

Then from the project root:
```powershell
cd $HOME\claudeprojects\electrafrost-info-fresh
node chat/embed-corpus.mjs
```

Expected output:
```
Loading corpus…
  data.json    : 55 nodes, 14 eras, 88 CPD records
  posts.json   : 658 posts
Chunking complete: ~720 chunks
Embedding + uploading…
  720/720 (12.5 chunks/sec, 58s)
✓ Complete. 720 vectors uploaded to electra-corpus in 58.0s
```

### Step 3 — Deploy the Worker

```powershell
cd $HOME\claudeprojects\electrafrost-info-fresh\chat
wrangler deploy
```

Expected output:
```
✓ Deployed electra-chat triggers
  https://electra-chat.electrafrost.workers.dev
```

### Step 4 — Test the Worker

```powershell
curl -X POST https://electra-chat.electrafrost.workers.dev/ask `
  -H "Content-Type: application/json" `
  -d '{\"question\": \"What is CREDU?\"}'
```

You should get a JSON response with `answer` and `citations`.

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
