# Weekly Review Workflow

A 30-minute Sunday/Monday ritual that turns visitor questions into corpus
improvements. The single most important practice for keeping the bot honest.

**Calendar this. Without the recurring trigger, the loop doesn't loop.**

---

## Setup (one time)

1. Calendar reminder: **every Monday 9:00 AM, "Chat review — 30 min"**
2. Bookmark the admin panel URL with key in your browser:
   `https://electra-chat.electrafrost.workers.dev/admin?key=YOUR_KEY`
3. Bookmark the live graph: `https://graph.electrafrost.com/#ask`
4. Have a PowerShell window open at `C:\Users\elect\claudeprojects\electrafrost-info-live`

---

## The 30-minute ritual

### 1. Look (5 min)

Open the admin panel. Note the four numbers at top:
- **Total questions** — engagement signal; rising = visitors finding the bot
- **Thin · unaddressed** — your work queue
- **Unaddressed** — total backlog
- **Addressed** — total improvements you've made

If thin · unaddressed is **zero**, jump to step 5 (recent chronological review).
If thin · unaddressed is **15+**, your corpus is genuinely thin in important areas; budget 60 min.
If thin · unaddressed is **1–14**, you're in the sweet spot. Continue.

### 2. Triage (10 min)

Default view = "Thin retrieval first". Read each row:
- The question
- The answer the bot gave
- The chunks it pulled (similarity scores in orange)

For each question, decide one of four actions:

| Decision | What it means | What to do |
|----------|---------------|------------|
| **One-off** | Idiosyncratic question, not worth a corpus entry | Click **Mark addressed**, note "one-off" |
| **Clarification** | Answer was wrong/conflated; you can correct in 2-4 sentences | Write an FAQ entry; mark addressed with FAQ id |
| **New position** | Question reveals a topic you actually have a developed view on but haven't written about | Add a new node in `data.json`; mark addressed with node id |
| **Genuine gap** | The corpus genuinely doesn't have this; you need to write something fresh | Note for the writing pile; leave unaddressed for now |

### 3. Write (10 min)

For each clarification or new position, make the entry.

**FAQ entries** (most common). Open `src/data.json`, find the `faqs` array near the bottom. Add an entry following the schema in `chat/FAQS.md`. Common pattern:

```json
{
  "id": "faq-<descriptive-kebab-case>",
  "type": "faq",
  "date_added": "2026-MM-DD",
  "category": "clarification",
  "question": "<paraphrase the visitor's question naturally>",
  "answer": "<your true answer in 100–400 words, plain English, in your voice>",
  "tags": ["topic1", "topic2"],
  "supersedes": null,
  "context": "Added after visitor question #<id from admin panel> on <date>."
}
```

**New nodes** (rarer). Same idea but in the `nodes` array, with `era`, `title`, `subtitle`, `body`, `tags` per the existing schema.

### 4. Re-embed and verify (5 min)

In PowerShell:

```powershell
cd C:\Users\elect\claudeprojects\electrafrost-info-live
git add src/data.json
git commit -m "Add FAQ: <topic> (addresses question #<id>)"
git push
```

Vercel auto-rebuilds the graph (1-2 min in the background; you don't need to wait).

```powershell
$env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e"
$env:CF_API_TOKEN  = "<your-token>"
node chat/embed-corpus.mjs
```

Verify the new chunk(s) are in the count. Should be ~847 + however many you added.

Test the new FAQ retrieves cleanly:

```powershell
$body = @{ question = "<the visitor's original question>" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://electra-chat.electrafrost.workers.dev/ask" -Method POST -Body $body -ContentType "application/json"
```

The answer should now ground in your FAQ. The citation should show `[CANONICAL FAQ: ...]` with score 0.7+.

### 5. Mark addressed (2 min)

Back in the admin panel, refresh. For each question you addressed:
- Click the **note** field, paste the FAQ id (or commit SHA)
- Click **Mark addressed**

Switch to "Addressed" view. Watch the "Addressed" stat tick up. That number is the literal measurement of corpus improvement.

### 6. Quick sample of recent chronological (3 min)

Switch to "All chronological". Scroll the most recent 5–10 questions. Even if retrieval was good (above 0.6 threshold), the **answer** might still be off. The threshold is a heuristic, not a guarantee.

If you spot a bad answer in this view, treat it like a thin question: triage, write, re-embed, mark.

---

## What good looks like over time

After a month of weekly reviews:
- "Thin · unaddressed" should be small (<5) most weeks
- "Addressed" should grow steadily — each week's count of FAQs/nodes added
- The FAQ array in `data.json` should have 10+ entries
- Bot answers to common questions should be consistently grounded in real material

After three months:
- Bot answers feel like *you* would have written them, on the topics that visitors actually ask
- The corpus has become a working artifact, growing in response to demand
- You have a publishable case study for the article

---

## What bad looks like

- **Thin · unaddressed is climbing each week** → the bot is getting traffic but the corpus isn't keeping up. Either budget more time, or accept the bot will be inconsistent on those topics.
- **You're writing FAQs that don't get retrieved** → check `embed-corpus.mjs` ran cleanly; verify the FAQ id appears in Vectorize. Also verify the question text in the FAQ uses the visitor's likely phrasing, not just your topic words.
- **You skip a week** → fine occasionally; gets dangerous if it becomes habit. The whole system depends on the weekly trigger.

---

## When the article gets written

The data accumulating in this system *is* the article material. When you sit down to write:
- The "Addressed" count is your concrete metric
- The FAQ entries are your demonstration of curated knowledge
- The thin-retrieval logs are your evidence of where AI-grounded conversation breaks down without curation
- The build log (`BUILDLOG.md`) is the technical method

You'll never have to invent an example. The system has been producing them for you.
