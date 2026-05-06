# Claude Code Session Prompt — chat.electrafrost review

**Paste the block below into Claude Code at the start of every 4-day review session.**

The prompt makes Claude Code read the right files, follow the right workflow,
and not fabricate corpus content. It's been written to be reusable session
after session — date-agnostic, picks up the current state of the system from
the files themselves.

---

## The prompt

```
I'm Electra Frost. I'm running a corpus chatbot at graph.electrafrost.com that lets visitors ask questions of my intellectual provenance graph (655+ posts, 55 thesis nodes, 88 CPD records, 14 eras, 2000-2026). The infrastructure is live; the corpus improves via a feedback loop where I write canonical FAQ entries in response to bot answers that were wrong or thin.

We are running a 4-day review cycle. This is one of those sessions.

WORKING DIRECTORY
The repo is at C:\Users\elect\claudeprojects\electrafrost-info-live\.
Confirm you can see the chat/ folder before doing anything else.

REQUIRED READING — DO ALL OF THIS BEFORE ASKING ME QUESTIONS
Read these files in order. They contain everything you need:
1. chat/BUILDLOG.md — the story of how this got built and what the system is for. Read all of it including any cycle notes at the bottom.
2. chat/RUNBOOK.md — operational commands you'll need
3. chat/REVIEW.md — the 4-day review workflow we're following
4. chat/FAQS.md — the schema and patterns for canonical FAQ entries
5. src/data.json — look at meta, eras[], a sample of nodes[] (5 entries), and faqs[] specifically. Note the existing schema and any FAQs already written.

After reading, summarise back to me in 5-8 sentences:
- What the chat system does
- The improvement loop (what triggers a corpus update)
- Where FAQs live and what their schema is
- Any FAQs already in the corpus and what they cover
- Anything you noticed that surprised you

THEN, AND ONLY THEN, START THE REVIEW

Step A — Pull latest and check the admin panel
Run: git pull (in the repo root)
Tell me to open the admin panel at https://electra-chat.electrafrost.workers.dev/admin?key=<KEY>
Ask me to paste the four stat numbers (total / thin·unaddressed / unaddressed / addressed) and the contents of any thin-retrieval rows.

Step B — Triage with me
For each thin-retrieval question I paste, help me decide one of four actions:
  • One-off → mark addressed with note "one-off"
  • Clarification → write an FAQ entry (most common case)
  • New position → write a node entry
  • Genuine gap → log to writing pile, leave unaddressed

Critical rule: if I'm deciding between clarification and new position, ASK ME WHAT I ACTUALLY THINK before drafting anything. Do not draft FAQ content based on what the chunks suggest — draft based on what I tell you is true. If I say "this is a topic I haven't worked out yet," that goes in the writing pile, NOT a fabricated FAQ.

Step C — Write the FAQ entries
For each clarification I want to add, draft the FAQ following the schema in chat/FAQS.md. Show me the JSON entry. I will say yes/no/edit. When I say yes, append it to the faqs[] array in src/data.json.

Voice rules for FAQ answers:
  • Plain English. Short sentences mixed with longer ones.
  • Specific-to-general (start with the concrete instance, end with the general claim)
  • No "fiscal" — use "tax" or rework the sentence
  • Don't say "Great question" or "I'd be happy to help"
  • 100-400 words per FAQ
  • Don't repeat the question inside the answer
  • If I haven't given you the truth, ASK rather than infer

Step D — Re-embed
Once we're done writing entries:
  - cd to repo root
  - git add src/data.json
  - git commit -m "Add FAQs: <topics> (cycle YYYY-MM-DD)"
  - git push
  - Set environment vars: $env:CF_ACCOUNT_ID = "ae72bbf8f20dfbcf063e4e1539ea7d5e" and $env:CF_API_TOKEN (I'll paste the token)
  - node chat/embed-corpus.mjs
  - Verify chunk count went up by the number of FAQs we added

Step E — Verify retrieval
For each FAQ we wrote, test the retrieval:
  $body = @{ question = "<the visitor's original question>" } | ConvertTo-Json
  Invoke-RestMethod -Uri "https://electra-chat.electrafrost.workers.dev/ask" -Method POST -Body $body -ContentType "application/json"
The answer should now ground in our new FAQ. The citation should reference the FAQ id with score 0.7+.

Step F — Mark addressed in admin panel
Tell me which questions to mark addressed and what FAQ id to put in the note field.

Step G — Quick wins
Check chat/BUILDLOG.md for the "What's NOT running yet" section. If anything in there can be quickly knocked off (5-15 min) and I'm willing, do it. Examples:
  • Real topic chips (if I'm ready to provide questions)
  • Floating widget on electrafrost.com (separate small PR)
  • Sonnet upgrade (if Haiku keeps fabricating after FAQs)

Step H — End-of-session log entry
Do all of these:
  1. Update chat/BUILDLOG.md with a "Cycle YYYY-MM-DD" section at the bottom noting:
     - Triaged: <N> questions
     - FAQs added: faq-<id-1>, faq-<id-2>, ...
     - Marked addressed: question #1, #4, #7
     - Writing pile: "<topic>" (note any gaps deferred)
     - Surprises: what the bot did unexpectedly, what retrieval pattern emerged
  2. Commit BUILDLOG update with message "Add cycle YYYY-MM-DD notes to BUILDLOG"
  3. Push
  4. Tell me when the next 4-day review is due (today's date + 4 days)

CONSTRAINTS — IMPORTANT
- Do not fabricate corpus content. If I say "I don't know yet," that's the answer. We'd rather have an empty FAQ than a wrong one.
- Do not change the Worker code unless I explicitly ask. The infrastructure works; we're improving content, not architecture.
- Do not move the bot to Sonnet without me explicitly approving. Haiku is on probation; we're testing whether FAQ density alone is enough.
- Do not commit without showing me the diff first.
- If you don't understand something in the corpus, ASK ME rather than guessing.

WHAT TO HOLD ONTO ACROSS SESSIONS
The thesis: an accountant noticed the first bot fabrication immediately because she had ground truth. Most users wouldn't. That's the whole argument for human-curated AI-discoverable provenance, captured live. Every FAQ we write is one more piece of that argument's evidence. We are building, in real time, the case study that becomes the article.

Begin by reading the required files. Don't skip.
```

---

## Notes on usage

- **Don't paraphrase the prompt.** Paste it exactly. The constraints around fabrication and Worker changes matter.
- **The required-reading list is non-optional.** Without it, Claude Code will try to operate from what it can guess. The files contain the system's memory.
- **The Cloudflare API token** for embed-corpus.mjs lives in your password manager. Paste it when Claude Code asks for it. Don't paste it into git or anywhere it could be logged.
- **If a session goes off-track** — Claude Code starts modifying Worker code, drafting FAQs without asking, or skipping the diff-before-commit rule — pause and re-paste the constraints section.

## When to update this prompt

- After the first 3-4 cycles, if the workflow needs adjustment
- If the constraints surface new failure modes
- If the system grows new components (e.g., the floating widget on electrafrost.com goes live and needs its own review process)

The prompt is a living document. Treat it like the system prompt for your
co-author: tighten as you learn what they need to be told.
