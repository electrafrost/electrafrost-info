# Review Workflow — every 4 days

A 30-minute ritual that turns visitor questions into corpus improvements.
The single most important practice for keeping the bot honest.

**Cadence: every 4 days.** Not weekly. Short cycles match the corpus's
current rate of growth and Electra's working pattern. Long cycles let
quality issues compound; short ones keep them visible.

**Calendar this.** Without the recurring trigger, the loop doesn't loop.

---

## Why 4 days

- The corpus is new — gaps surface fast and need addressing fast
- Activator + Strategic working pattern: short cycles preserve momentum where weekly rituals lose it
- Fewer questions to triage per session = lower friction = ritual sticks
- Article evidence accumulates faster (more cycles documented = richer case study)

If the queue is empty for two cycles in a row, drop to weekly. If three
cycles in a row produce 10+ FAQs each, increase to every 2 days
temporarily.

---

## Setup (one time)

1. Calendar reminder: **every 4 days, "Chat review — 30 min."** Whatever app you use.
2. Bookmark in browser:
   - Admin panel: `https://electra-chat.electrafrost.workers.dev/admin?key=YOUR_KEY`
   - Live ASK tab: `https://graph.electrafrost.com/#ask`
3. Save the Claude Code session prompt: `chat/CLAUDE_CODE_PROMPT.md` (in this folder). Paste it into Claude Code at the start of each session.
4. Have PowerShell ready at `C:\Users\elect\claudeprojects\electrafrost-info-live`.

---

## The 30-minute ritual

### 1. Look (5 min)

Open the admin panel. Note the four numbers:
- **Total questions** — engagement signal; rising = visitors finding the bot
- **Thin · unaddressed** — your work queue
- **Unaddressed** — total backlog
- **Addressed** — total improvements you've made

If thin · unaddressed is **zero**, jump to step 5 (chronological sample).
If thin · unaddressed is **15+**, the corpus is genuinely thin in important
areas; budget 60 min or split across two sessions.
If thin · unaddressed is **1–14**, you're in the sweet spot. Continue.

### 2. Triage (10 min)

Default view = "Thin retrieval first". For each row, decide one action:

| Decision | What it means | What to do |
|----------|---------------|------------|
| **One-off** | Idiosyncratic, not worth a corpus entry | Mark addressed, note "one-off" |
| **Clarification** | Bot was wrong/conflated; correct in 2-4 sentences | Write FAQ entry; mark addressed with FAQ id |
| **New position** | Reveals a topic you have a developed view on but haven't written | Add a node in `data.json`; mark addressed with node id |
| **Genuine gap** | Corpus genuinely doesn't have this; needs fresh writing | Note in writing pile; leave unaddressed |

**Critical rule**: only write FAQ content for things you actually know to be
true. If the bot was wrong but you don't yet have a clear position on the
topic, that's a writing-pile item, not an FAQ. Empty corpus is better than
fabricated corpus.

### 3. Write (10 min)

For each clarification, add an entry to the `faqs` array in `src/data.json`.
Schema is in `chat/FAQS.md`. Common pattern:

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
  "context": "Added after visitor question #<id> on <date>."
}
```

Voice rules:
- Plain English. Short sentences mixed with longer ones.
- Specific-to-general (start concrete, end with the general claim)
- No "fiscal" — use "tax" or rework the sentence
- Don't repeat the question inside the answer
- 100-400 words

For new positions, use the `nodes` array instead, with `era`, `title`,
`subtitle`, `body`, `tags` per the existing schema.

### 4. Re-embed and verify (5 min)

```powershell
cd C:\Users\elect\claudeprojects\electrafrost-info-live
git add src/data.json
git commit -m "Add FAQs: <topics> (cycle <date>)"
git push
```

Vercel auto-rebuilds the graph in the background. Then re-embed:

```powershell
$env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e"
$env:CF_API_TOKEN  = "<token>"
node chat/embed-corpus.mjs
```

Verify the chunk count went up. Then test:

```powershell
$body = @{ question = "<the visitor's original question>" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://electra-chat.electrafrost.workers.dev/ask" -Method POST -Body $body -ContentType "application/json"
```

The answer should ground in the new FAQ. The citation should show
`[CANONICAL FAQ: ...]` with score 0.7+.

### 5. Mark addressed (2 min)

Refresh the admin panel. For each addressed question:
- Paste the FAQ id (or commit SHA) in the note field
- Click **Mark addressed**

Switch to "Addressed" view. The number ticks up. That number is the literal
measurement of corpus improvement over time.

### 6. Quick chronological sample (3 min)

Switch to "All chronological". Scan the last 3-5 questions. Even questions
above the 0.6 threshold can have wrong answers — the threshold is a heuristic.
If you spot a bad answer, treat it like a thin question.

### 7. Log the cycle (5 min)

Update `chat/BUILDLOG.md` with a section at the bottom:

```markdown
## Cycle 2026-MM-DD

- Triaged: <N> questions
- FAQs added: faq-<id-1>, faq-<id-2>, ...
- Marked addressed: question #1, #4, #7
- Writing pile: "<topic>" (note the gap)
- Surprises: <what the bot did unexpectedly, or what retrieval pattern emerged>
```

This running log becomes article material later. Each cycle's notes are
direct evidence of the corpus learning from visitor demand.

Commit and push.

---

## What good looks like over a month

8 cycles in a month (every 4 days):
- "Thin · unaddressed" should hover near zero most cycles
- "Addressed" should be 20-40 by month's end
- FAQ array should have 15-30 entries
- Bot answers on common topics should be consistently grounded
- BUILDLOG should have 8 cycle entries documenting what happened

After 3 months (~22 cycles):
- Bot answers feel like *you* would have written them on common topics
- The corpus is a working artifact, growing in response to demand
- The article writes itself from the cycle logs

---

## What bad looks like

- **Thin · unaddressed climbing every cycle** → the bot has more visitors than the corpus can keep up with. Increase cycle frequency, or accept inconsistency on under-served topics.
- **Writing pile growing without movement** → genuine gaps you're avoiding. Schedule deliberate writing time outside the cycle to address.
- **You skip a cycle** → fine occasionally. Two in a row → re-anchor the calendar reminder.
- **FAQs you wrote aren't being retrieved** → check that `embed-corpus.mjs` ran cleanly; verify FAQ id is in Vectorize. Also: the FAQ's `question` field needs to use the visitor's likely phrasing, not just topic words.

---

## When the article gets written

The cycle logs in `BUILDLOG.md` *are* the article material. When you sit down to write:
- **Addressed count** is your concrete metric ("over 8 weeks, 47 FAQs added")
- **FAQ entries** are your demonstration of curated knowledge
- **Thin-retrieval logs** are your evidence of where AI-grounded conversation breaks down without curation
- **Cycle notes** are your specific examples (which questions, what the bot got wrong, what the correction looked like)

You will never have to invent an example. The system has been producing them for you.

---

## See also

- `RUNBOOK.md` — operational commands when you forget the syntax
- `FAQS.md` — full FAQ schema and category meanings
- `BUILDLOG.md` — the build story + running cycle log
- `CLAUDE_CODE_PROMPT.md` — the prompt to paste into Claude Code at the start of each cycle
