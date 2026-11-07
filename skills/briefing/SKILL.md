---
name: briefing
description: "Writes a local HTML briefing: a one-page memo that states the ask, then plain-language question cards grouped by theme, each with Claude's recommended option marked, and sends the answers straight back to the session with one click. Use when Claude needs decisions or input that are more than one-liners, has several related questions at once, or wants a plan, proposal, migration or design reviewed before acting. For one or two simple choices, use the built-in AskUserQuestion picker instead."
---

# Briefing

A local page the user reads top to bottom: a memo that says what you need and why, a collapsed list of what is already settled, then question cards grouped by theme. A sticky left column shows every question, the progress and **Send to Claude**, which delivers the answers to the session as the output of a background task.

## Page or picker

- **Picker** (AskUserQuestion): 1 or 2 independent questions whose options fit on a line and need no background.
- **Page**: anything that needs explaining first, 3 or more questions, or answers where a note matters as much as the pick.

## The core: low effort for the user

The user has little spare attention. Every rule below exists to save it.

1. **Ask few questions.** Only what needs the user's judgment. Everything else (facts, obvious fixes, things you would do anyway) goes into `asIs`, the collapsed "already settled" list under the memo. Aim for under 12 questions; if you have more, decide more yourself, batch them, or split into rounds. Many similar items (files, rows, findings) become one batch question ("Delete these 55?") with options like approve all, let me pick (note), not now, and the item list under evidence.
2. **Nothing is preselected.** The recommended option carries a tag, but the user picks, or skips what they have no opinion on.
3. **Plain-language titles.** A question a smart outsider understands: no IDs, no jargon, no file names, no internal codes. "Should the three copies of the filter code become one?", not "L2: consolidate parseFilters".
4. **Meaning in 1 or 2 sentences**: what this decides and why it matters.
5. **"Today" with a number.** The current state, measured: "11 queries per search", "0 of 40 services have alerts". Numbers, never adjectives.
6. **2 or 3 options**, each a short label plus one line of consequence. Exactly one tagged recommended. No option needs the evidence to be understood.
7. **Evidence behind "Show evidence"**: file paths, counts, quotes, PRs, what you verified and what you assume. Collapsed; the question must stand without it.
8. **Notes are always optional** and nuance is welcome; each card has "Add a note" and the page ends with an "Anything else?" box.

## Build

Copy [assets/template.html](assets/template.html) and replace only the `PAGE` object between the `REPLACE` markers. The template does the layout, progress, sidebar links, localStorage drafts, light and dark theme, and the answer text. Clicking a picked option unpicks it.

```js
const PAGE = {
  store: "search-speed-r1",
  eyebrow: "Briefing · search",
  title: "Help me pick how to make search fast",
  tldr: "Search takes 4.2 seconds. I found changes that bring it under 1 second; <b>3 need your call.</b>",
  why: "2 of the last 5 support tickets were search timeouts.",
  need: "3 choices in 2 themes, about 2 minutes. Each shows what I recommend, but nothing is picked for you. Skip any you have no opinion on.",
  after: "I make the changes on one branch and open a PR. You review the diff like any other.",
  asIs: ["Add an index on <code>products.updated_at</code> (no behaviour change)."],
  groups: [
    { title: "How results are counted", blurb: "The numbers next to each filter.",
      questions: [
        { id: "facets", short: "Filter counts",
          title: "How should the filter counts be calculated?",
          meaning: "The numbers next to each filter are what make search slow.",
          today: "11 database queries per search, one per filter.",
          options: [["All at once", "One query, counted in memory.", true], ["Cache them", "Reuse results for 5 minutes."]],
          details: "<p>Trace from <code>search-handler.ts:84</code>: 3.6 s of the 4.2 s total.</p>" },
      ] },
  ],
}
```

- `title` is the ask, stated as what you need from the user, not the page's topic. It is also the first line of the answers.
- `tldr` is the situation and the count of calls needed; `why` what goes wrong without them; `need` the count, the minutes (about 1.5 questions a minute) and that nothing is preselected; `after` what you do with the answers. `why` and `after` are optional.
- Groups are themes: 2 to 4, each a plain title and a one-line `blurb`. Use one group when the questions share a theme; the theme labels then disappear.
- `short` is the 2 to 3 word sidebar label. `id` is for you, never shown. Short and stable: answers come back keyed by it.
- `true` as the third option element tags the recommendation. A code reference for an option goes at the end of its consequence as `<code class="ref">MetricRepository.deleteMetric</code>`.
- Values are HTML: escape `<` and `&` in code samples. `store` is unique per page; bump it (`-r2`) for a new round with empty drafts. Helper data for long evidence may sit above `PAGE` inside the markers.

## Where the file goes

- Work that spans sessions (a plan, a migration, a multi-phase project): a durable folder that already holds the project's notes, named after the decision (`phase-1.html`). Never inside a team repo's tracked tree unless asked.
- One-off questions: the session scratchpad.
- Never publish it as an Artifact or Claude Doc, and never drive the user's browser with automation tools.

## Send loop

Check it renders: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=2000 --screenshot=<scratch>/shot.png --window-size=1400,1000 file://<page>`, then look at the image. Add `--force-dark-mode` to check dark.

Serve it with the Bash tool and `run_in_background: true`, from the main session (a background command started by a subagent dies when the subagent ends):

```bash
node <this skill's dir>/scripts/serve.mjs <page.html> --timeout 2h
```

The script serves the page on `127.0.0.1` under a random token, opens the browser, and waits. Tell the user in one line that the page is open, then end the turn; do not poll. When the user presses Send, the script prints the answers and exits 0, and the harness re-invokes you with the task result:

```
=== ANSWERS BEGIN ===
Help me pick how to make search fast
parser: Merge into one
facets: Cache them | only for large tenants
general: ship before Friday
skipped: rollout
=== ANSWERS END ===
```

- If the notification shows only the task id, read the task's output file.
- Exit 2: timeout without answers. Exit 64 or 66: bad arguments or missing file.
- The port comes from the file path, so re-serving the same file keeps drafts. Each run accepts one submit and has a new token: earlier tabs go stale (Send fails, Copy still works). `--no-open` skips opening a tab, for tests or when you hand over the printed URL.
- If the user answers in chat instead, stop the background task.
- Background commands are stopped in `-p` and cloud sessions. There, or without Node, `open <page.html>`: as a file the page shows only **Copy answers** and the user pastes the same text.

## Process the answers

- Every answered question comes back as `id: pick | note` (`(no pick)` when only a note was written). `skipped:` lists the questions left open.
- Skipped is not consent to the recommendation. Decide those yourself only where the stakes are low and say so in the reply; otherwise ask again (picker if simple) or leave them out of the work.
- A note outranks its pick: "All at once | but not for the export job" is a variant, not a plain yes.
- Reply with what you will do per answer in one line, and at most one follow-up question.
- Record the decisions where the work is tracked (issue comment, plan file, decisions log, the project's notes folder) before acting, including the already-settled list. With no tracker, the conversation is the record.
- Follow-up round: same file, only the new and skipped questions, bumped `store`, serve again.
