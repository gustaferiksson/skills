---
name: briefing
description: "Writes a local HTML briefing: a calm stepper that asks one plain-language question per screen, marks Claude's recommended option, and sends the answers straight back to the session with one click. Use when Claude needs decisions or input that are more than one-liners, has several related questions at once, or wants a plan, proposal, migration or design reviewed before acting. For one or two simple choices, use the built-in AskUserQuestion picker instead."
---

# Briefing

A local page the user clicks through at their own pace: an intro screen, one question per screen, and a review screen listing every answer, with skipped questions marked. **Send to Claude** delivers the answers to the session as the output of a background task.

## Page or picker

- **Picker** (AskUserQuestion): 1 or 2 independent questions whose options fit on a line and need no background.
- **Page**: anything that needs explaining first, 3 or more questions, or answers where a note matters as much as the pick.

## The core: low effort for the user

The user has little spare attention. Every rule below exists to save it.

1. **Ask few questions.** Only what needs the user's judgment. Everything else (facts, obvious fixes, things you would do anyway) goes into `asIs`, one collapsed "already decided" list on the intro screen. Aim for under 12 questions; if you have more, decide more yourself or split into rounds.
2. **Nothing is preselected.** The recommended option carries a tag, but the user picks, or skips what they have no opinion on.
3. **Plain-language titles.** A question a smart outsider understands: no IDs, no jargon, no file names, no internal codes. "Should the three copies of the filter code become one?", not "L2: consolidate parseFilters".
4. **Meaning in 1 or 2 sentences**: what this decides and why it matters.
5. **"Today:" with a number.** The current state, measured: "11 queries per search", "0 of 40 services have alerts". Numbers, never adjectives.
6. **2 or 3 options**, each a short label plus one line of consequence. Exactly one tagged recommended. No option needs the details to be understood.
7. **Evidence behind "Show details"**: file paths, counts, quotes, PRs, what you verified and what you assume. Collapsed; the question must stand without it.
8. **Notes are always optional** and nuance is welcome; the end screen has an "Anything else" box.

## Build

Copy [assets/template.html](assets/template.html) and replace only the `PAGE` object between the `REPLACE` markers. The template does the stepper (progress, Back and Next, keys: Left and Right move screens, Up and Down cycle options, 1 to 9 pick, Enter next, Esc leaves a note, clicking a picked option unpicks it), localStorage drafts, light and dark theme, and the answer text.

```js
const PAGE = {
  title: "Speeding up search",
  store: "search-speed-r1",
  intro: "What this is about and what you found, in 1 to 3 sentences.",
  asIs: ["Add an index on <code>products.updated_at</code> (no behaviour change)."],
  questions: [
    { id: "facets", title: "How should the filter counts be calculated?",
      meaning: "The numbers next to each filter are what make search slow.",
      today: "11 database queries per search, one per filter.",
      options: [["All at once", "One query, counted in memory.", true], ["Cache them", "Reuse results for 5 minutes."]],
      details: "<p>Trace from <code>search-handler.ts:84</code>: 3.6 s of the 4.2 s total.</p>" },
  ],
}
```

- `id` is for you, never shown. Short and stable: answers come back keyed by it.
- `true` as the third option element tags the recommendation. The intro screen states the question count and minutes itself.
- Values are HTML: escape `<` and `&` in code samples. `store` is unique per page; bump it (`-r2`) for a new round with empty drafts.

## Where the file goes

- Work that spans sessions (a plan, a migration, a multi-phase project): a durable folder that already holds the project's notes, named after the decision (`phase-1.html`). Never inside a team repo's tracked tree unless asked.
- One-off questions: the session scratchpad.
- Never publish it as an Artifact or Claude Doc, and never drive the user's browser with automation tools.

## Send loop

Check it renders: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=2000 --screenshot=<scratch>/shot.png --window-size=900,900 file://<page>`, then look at the image.

Serve it with the Bash tool and `run_in_background: true`, from the main session (a background command started by a subagent dies when the subagent ends):

```bash
node <this skill's dir>/scripts/serve.mjs <page.html> --timeout 2h
```

The script serves the page on `127.0.0.1` under a random token, opens the browser, and waits. Tell the user in one line that the page is open, then end the turn; do not poll. When the user presses Send, the script prints the answers and exits 0, and the harness re-invokes you with the task result:

```
=== ANSWERS BEGIN ===
Speeding up search
parser: Merge into one
facets: Cache them | only for large tenants
general: ship before Friday
skipped: cache-ttl, rollout
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
- Record the decisions where the work is tracked (issue comment, plan file, decisions log, the project's notes folder) before acting, including the already-decided list. With no tracker, the conversation is the record.
- Follow-up round: same file, only the new and skipped questions, bumped `store`, serve again.
