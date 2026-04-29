# RUNBOOK — chat.electrafrost

Operational reference. Open this when you've forgotten what command to run.

For *why* and *how it was built*, see [BUILDLOG.md](./BUILDLOG.md).
For *the FAQ schema*, see [FAQS.md](./FAQS.md).
For *full setup from scratch*, see [SETUP.md](./SETUP.md).

---

## Daily / on-demand operations

### "I just added new posts to data.json or posts.json — re-embed the corpus"

```powershell
cd C:\Users\elect\claudeprojects\electrafrost-info-live
$env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e"
$env:CF_API_TOKEN  = "<cloudflare-token-from-password-manager>"
node chat/embed-corpus.mjs
```

Takes ~1 minute. Idempotent — re-embedding overwrites existing chunks with the same IDs. New chunks (e.g. new FAQ entries) are added.

### "I edited the Worker code — redeploy it"

```powershell
cd C:\Users\elect\claudeprojects\electrafrost-info-live
git pull
cd chat
wrangler deploy
```

Takes ~10 seconds. Live immediately.

### "I want to see what visitors have been asking"

Open in browser:

```
https://electra-chat.electrafrost.workers.dev/admin?key=<your-admin-key>
```

Default view is **thin retrieval first** — questions where the top similarity score was below 0.6, meaning the bot was probably stretching to answer. These are the gaps the corpus needs to fill.

### "The bot just gave a bad answer — I want to fix it"

This is the **corpus improvement loop**. See [WEEKLY_REVIEW.md](./WEEKLY_REVIEW.md) for the structured version. Quick form:

1. Open the admin panel; find the bad question
2. Decide: is this a one-off, a clarification, or a position?
   - One-off → do nothing; mark addressed if irrelevant
   - Clarification → write an FAQ entry in `src/data.json` faqs[]
   - Position → consider a full node in `src/data.json` nodes[]
3. Save, commit, push to GitHub
4. Run `node chat/embed-corpus.mjs` to re-embed
5. Test: ask the same question via the live site or curl
6. In admin panel, click **Mark addressed** with the commit SHA in the note field

### "I want to test a question without using the live site"

```powershell
$body = @{ question = "your question here" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://electra-chat.electrafrost.workers.dev/ask" -Method POST -Body $body -ContentType "application/json"
```

### "I want to see the live Worker logs"

Cloudflare dashboard → Workers & Pages → electra-chat → Logs (Real-time). Shows every request, including any errors thrown.

### "I want to query the database directly"

```powershell
wrangler d1 execute electra-chat-log --remote --command="SELECT id, timestamp, question, top_score, thin_retrieval, addressed FROM questions ORDER BY timestamp DESC LIMIT 20"
```

For ad-hoc analytics. The admin panel covers most needs.

---

## Recurring operations

### Weekly review (30 min, every Sunday or Monday)

See [WEEKLY_REVIEW.md](./WEEKLY_REVIEW.md). Set a recurring calendar reminder.

### Monthly: rotate API keys (5 min)

- Anthropic key: console.anthropic.com → API Keys → delete old, create new → `wrangler secret put ANTHROPIC_API_KEY`
- Cloudflare API token: dash.cloudflare.com → My Profile → API Tokens → delete old, create new → save in password manager
- Admin key: only if you suspect it's been exposed. Generate new one and `wrangler secret put ADMIN_KEY`. Update password manager.

### Quarterly: review costs

- Cloudflare: dash.cloudflare.com → Workers & Pages → electra-chat → Analytics. Should be in free tier.
- Anthropic: console.anthropic.com → Plans & Billing → Usage. ~$0.001 per question on Haiku.

---

## Rare operations

### "I want to wipe all logged questions and start fresh"

```powershell
wrangler d1 execute electra-chat-log --remote --command="DELETE FROM questions"
```

Won't fail; just clears the table. Use for clean-slate launches or after testing.

### "I want to rebuild the Vectorize index from scratch"

```powershell
wrangler vectorize delete electra-corpus
wrangler vectorize create electra-corpus --dimensions=768 --metric=cosine
node chat/embed-corpus.mjs
```

Useful if chunking strategy changed and stale chunk IDs are sticking around.

### "I want to add a pretty subdomain — chat.electrafrost.com"

1. At VentraIP DNS panel, add ONE CNAME:
   ```
   chat  CNAME  electra-chat.electrafrost.workers.dev
   ```
2. In Cloudflare → Workers → electra-chat → Settings → Triggers → Add Custom Domain → `chat.electrafrost.com`
3. Update frontend fetch URL in `src/AskTab.jsx` (`CHAT_ENDPOINT`)
4. `wrangler deploy` and Vercel redeploys frontend

No nameserver change. Email at Proton stays untouched.

---

## Troubleshooting

### "Bot returns `invalid x-api-key`"

The Anthropic API key isn't right. Either it was pasted with extra characters, the key was disabled, or the wrong account's key was set. Test the key directly:

```powershell
$key = "<paste-key>"
$headers = @{ "x-api-key" = $key; "anthropic-version" = "2023-06-01"; "Content-Type" = "application/json" }
$body = @{ model = "claude-haiku-4-5-20251001"; max_tokens = 50; messages = @(@{ role = "user"; content = "Say hi" }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://api.anthropic.com/v1/messages" -Method POST -Headers $headers -Body $body
```

If that works, re-set the secret in the same session: `$key | wrangler secret put ANTHROPIC_API_KEY`.

### "Admin panel shows 'Auth failed or D1 not bound'"

Check:
1. The `?key=` value matches the admin key you saved
2. `wrangler.toml` has the `[[d1_databases]]` block with the right `database_id`
3. Latest `wrangler deploy` output showed `env.DB (electra-chat-log)` in the bindings list

### "Wrangler CPU limits error on deploy"

You're on the free Workers plan. Make sure `wrangler.toml` does NOT contain a `[limits]` block. Free plan provides 10s CPU per request, sufficient for our pipeline.

### "Permission error in C:\Windows\System32"

Don't run wrangler from `System32`. Always:
```powershell
cd $HOME
# or any folder under your user directory
```

### "Local git won't pull because of conflicts"

You edited a tracked file directly without committing. Two paths:
1. **Discard local change**: `git checkout chat/wrangler.toml` (loses local edit)
2. **Keep local change**: `git stash; git pull; git stash pop` then resolve conflict

### "embed-corpus.mjs fails partway through"

The script is idempotent — re-running picks up where it failed because chunk IDs match. If it fails repeatedly:
- Check `$env:CF_API_TOKEN` is set and has Vectorize:Edit + Workers AI:Read
- Check Cloudflare Workers AI dashboard for rate limits hit

---

## Key locations

| Resource | Location |
|----------|----------|
| Local repo | `C:\Users\elect\claudeprojects\electrafrost-info-live\` |
| GitHub | https://github.com/electrafrost/electrafrost-info |
| Vercel deploys | https://vercel.com/electra-frosts-projects/electrafrost-info/deployments |
| Cloudflare dashboard | https://dash.cloudflare.com/ae72bbf8f20dfbcf063e4e1539ea7d5e |
| Worker | https://electra-chat.electrafrost.workers.dev |
| Admin panel | https://electra-chat.electrafrost.workers.dev/admin?key=... |
| Live graph | https://graph.electrafrost.com |

## Secrets locations

In your password manager (1Password / Proton Pass / etc):
- Anthropic API key (sk-ant-api03-...)
- Cloudflare API token (for embed-corpus.mjs)
- Admin key (40-char random, for /admin URL)
- Cloudflare account password (for dashboard)
