# Canonical FAQs — guide

The `faqs` array in `src/data.json` holds **canonical clarifications** —
high-trust short answers to questions where the broader corpus is thin,
ambiguous, or contradictory.

These are the most powerful chunks the chatbot can retrieve. The Worker's
system prompt tells Claude to prioritise FAQ chunks over other retrieved
material when both are relevant. So an FAQ entry becomes the authoritative
answer the next time someone asks the question it addresses.

## When to write an FAQ entry

After running the bot for a while, you'll see (via the admin panel) questions
that produced bad answers. For each one, decide:

- **Does the corpus already have the truth, just scattered or thin?**
  → Write an FAQ to consolidate it.

- **Did the bot fabricate or conflate ideas from different eras?**
  → Write an FAQ to clarify the distinction.

- **Is this a question many visitors will ask?**
  → Write an FAQ so the answer is consistent every time.

- **Is the question one-off and idiosyncratic?**
  → Don't write an FAQ. The bot's "I haven't written about that" is fine.

FAQs should be **short** (100–400 words), **specific**, **dated**, and
**accurate**. They are not blog posts. They are corrections.

## Schema

Every FAQ entry has these fields:

```json
{
  "id": "faq-bitcoin-vs-ai-narratives",
  "type": "faq",
  "date_added": "2026-04-29",
  "category": "clarification",
  "question": "Did Bitcoin change the accountant's role, or did AI?",
  "answer": "Two separate arguments at different times. Bitcoin (~2013–2014 onwards) changes what the unit of account is — the substance the profession measures in. AI (2025+) changes what the profession does — the practitioner's role and capability. The 'AI changes the role rather than eliminating it' line belongs to the AI Governance era, not the Bitcoin Conviction era. They're easy to conflate but they aren't the same claim.",
  "tags": ["bitcoin", "ai", "narrative", "clarification"],
  "supersedes": null,
  "context": "Added after the chatbot conflated the two narratives in an early test answer."
}
```

### Field meanings

- **`id`** — kebab-case unique ID, prefixed `faq-`. Stable; don't change after publication.
- **`type`** — always `"faq"`.
- **`date_added`** — ISO date. Helps you sort and audit.
- **`category`** — one of:
  - `clarification` — fixing a misconception or conflation
  - `correction` — replacing an inaccurate earlier post or node
  - `definition` — canonical definition of a term you use repeatedly
  - `position` — your stance on a contested or commonly-asked question
  - `biographical` — biographical fact (origin story, timeline, etc.)
  - `template` — documentation/example only; the embedding script skips these
- **`question`** — the natural-language question this FAQ answers. Phrased the way a visitor would ask it. Helps semantic retrieval surface this chunk for similar questions.
- **`answer`** — your canonical answer. Written in your voice, plain English, specific. Don't repeat the question inside the answer. Use line breaks (`\n\n`) for paragraphs.
- **`tags`** — keywords for grouping; not strictly used by the bot but useful for human triage.
- **`supersedes`** — if this FAQ replaces a specific node ID or earlier FAQ, list the IDs here. Otherwise `null`.
- **`context`** — why you wrote this FAQ. Often: "After the chatbot answered question X with Y, I wrote this to correct it." Useful provenance for the article and for future you.

## Workflow

When you write a new FAQ:

1. Open `src/data.json` in a text editor
2. Find the `faqs` array (near the bottom)
3. Add your new entry
4. Save, commit, push to GitHub (Vercel rebuilds the graph)
5. Re-run the embedding script:
   ```powershell
   cd $HOME\claudeprojects\electrafrost-info-live
   node chat/embed-corpus.mjs
   ```
6. Test: visit graph.electrafrost.com → ASK tab → ask the question your FAQ addresses
7. The answer should now be grounded in your FAQ. The citation pill below the answer should show `[CANONICAL FAQ: ...]` with high similarity score.
8. In the admin panel, mark the original triggering question as **addressed** with a note pointing to the FAQ ID or commit SHA.

## When NOT to use FAQs

- **For long-form thinking** → write a node in `data.json` instead. FAQs are short corrections; nodes are foundational positions.
- **For posts you actually wrote elsewhere** → those go in `posts.json` with their original date and source.
- **For incomplete thoughts** → if the answer is "I haven't worked this out yet," let the bot say so honestly. Don't fake a position.

## The improvement loop, end to end

```
Visitor question → bad/thin answer
        ↓
Admin panel surfaces it (default view: thin retrieval first)
        ↓
You write FAQ entry in data.json → commit → push → re-embed
        ↓
Same question asked again → bot retrieves FAQ → answer is correct
        ↓
You mark original question 'addressed' with FAQ id in note
```

Over time, the corpus accumulates a dense layer of canonical answers,
and the bot becomes increasingly hard to trick into fabrication. Every
admin-panel session that produces an FAQ is the corpus learning from
real visitor curiosity.
