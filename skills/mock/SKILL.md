---
name: mock
description: "Builds a local plain HTML configurator mock for UI design questions: a realistic preview the user clicks through with segmented settings, then copies a short code (key=value, locks, alternative requests, notes) that drives the next round. Use when the user asks how something should look, says \"mock this up\", \"try some options\", \"show me alternatives\", \"design variations\", or wants to compare layouts, placements or styles before building them."
---

# Mock

One self-contained HTML file the user opens locally, flips settings in, and answers with a pasteable code. The code is the spec.

## Rules

- One `.html` file in the scratchpad or temp dir. Never commit it to the project, never publish it to a hosted artifact service, never drive the user's browser with automation tools. Serve it for the round trip (below), or open it with `open <file>`.
- Plain HTML, CSS and JS, no framework, no build. But the preview must look like the real app: read the project's components, tokens, fonts, radii and icon set first and copy them into the preview styles. If the project uses a CDN icon set, load it with the CSS-mask `ic()` pattern in the template.
- Realistic labels and data shapes taken from the real product, never lorem ipsum.
- UI text has no `:` or ` - ` separators and no help text clutter. Descriptions go in tooltips.

## Build

Copy [scripts/configurator.html](scripts/configurator.html) and replace the marked parts:

| Marker | Replace with |
|---|---|
| `/* REPLACE: preview styles */` | The target project's look. The other style block is the configurator chrome, keep it. |
| `/* REPLACE: config */` | `TITLE`, `STORE` (unique storage prefix per mock), `ROUND`, `OPTIONS`, `DEFAULT`, `DEFAULT_LOCKED`, `PREVIEW`, `PV_DEFAULT`, `VIEWPORTS` |
| `/* REPLACE: preview */` | `renderPreview(c, pv)`: `c` holds the chosen value per setting key, `pv` the preview data values; return HTML |

`OPTIONS` entries are `{ key, label, group?, opts: [[value, label, hint, today?]] }`. `hint` is the hover tooltip, `today` (1) puts a dot on the value that matches the current look.

What the chrome already does, so do not rebuild it:

- Floating, minimisable settings panel. Per row: lock (`!` in the code, row collapses to its value, "Hide locked" hides it), alternatives request (`?`), note popover (copied as `key: note`, shown as the icon tooltip). One auto-growing general note, copied as `general: ...`.
- Separate "Preview data" panel for preview-only toggles, never part of the code.
- Copy button puts the code line plus note lines on the clipboard and shows "Copied". When served, a Send to Claude button posts the same text.
- Storage: locks persist across rounds, choices, notes and `?` requests are keyed by `ROUND`. Notes are never cleared on copy, only by "Clear notes".
- Viewport pill (Small, Medium, Full width; pixel widths in tooltips) that zooms the preview to fit.

## Scale

- `VIEWPORTS` only for full pages, layouts, or components whose behaviour depends on width (tables, toolbars, wrapping tag rows). For a button, pill or card set `VIEWPORTS = []`: the pill disappears and the preview is centred at its natural width. Show variants side by side in the preview when comparing them at a glance helps.
- `PREVIEW` only when content volume changes the design (long text, many items, empty state). Otherwise `PREVIEW = []` hides the panel.

## Option design

- 3 to 7 settings, 2 to 4 values each. More settings means a second group, not longer rows.
- Short codes and labels: `hdr=flat`, label "Flat". The first value or the `today` dot marks how it looks now.
- Each value must be a real, buildable variant that differs visibly. Cover extremes in the preview data: long names, many items, empty.
- Combinations must all render. When two settings conflict, make one win and say so in the hint.

## Round loop

1. Write the file, verify it (below), and show it. Run `node <this skill's dir>/scripts/serve.mjs <file> --timeout 2h` with the Bash tool and `run_in_background: true` from the main session (a subagent's background command dies with it), tell the user it is ready, and end the turn. It serves the file on 127.0.0.1 under a random token and opens the browser; their **Send to Claude** prints the code between `=== ANSWERS BEGIN ===` and `=== ANSWERS END ===` and exits 0, which re-invokes you (if the notification shows only the task id, read the task output). Exit 2 means it timed out. Each run takes one submit, so earlier tabs go stale. In `-p` or cloud sessions, or without Node, `open <file>` instead and the user pastes. Keep the reply short.
2. The code arrives (sent or pasted) like:
   ```
   hdr=flat! flt=chips? st=badge dens=compact act=menu
   act: icons feel too small
   general: header spacing is too loose
   ```
3. Next round:
   - Copy the current file to `<name>.vN.html` first.
   - `!` locks: set `DEFAULT` to that value and build it in. Drop the row once nothing else depends on it.
   - `?` requests: replace the rejected values with 2 or 3 new alternatives for that setting.
   - Notes: apply the tweak, or turn a real choice into new values.
   - Values the user moved away from without comment can be narrowed or dropped.
   - Bump `ROUND` (`r1` to `r2`) so notes and requests start empty.
4. Verify, then serve again (same file path, so locks and notes survive; the previous tab goes stale) or reopen.

## Verify every round

One headless Chrome screenshot, then look at it, and crop to check detail:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --virtual-time-budget=3000 \
  --screenshot=<scratch>/shot.png --window-size=1600,1000 file://<scratch>/<name>.html
sips -c <h> <w> --cropOffset <y> <x> <scratch>/shot.png --out <scratch>/crop.png
```

Check every value of the settings you changed, not just the defaults. Headless cannot click: to check other combinations, temporarily change `DEFAULT`.

## When done

The final code is the spec. Build exactly that into the real code with the project's own components, then leave the mock in the scratch dir.
