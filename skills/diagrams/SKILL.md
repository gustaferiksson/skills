---
name: diagrams
description: "Draws draw.io diagrams as editable .drawio.svg files that render on GitHub and in any browser: AWS architecture diagrams with the official AWS icons, spec diagrams for a design or PR, and other diagrams (overviews, flowcharts, state machines). Renders a JPG preview so the agent can review its own work. Use when asked to draw, diagram, sketch or visualise an architecture, stack, data flow, design or process, or to edit an existing .drawio.svg."
---

# Diagrams

Every diagram is one `<name>.drawio.svg`: an SVG picture with the draw.io model embedded, so it shows on GitHub and opens editable in draw.io. `scripts/diagram.mjs` (Node 18+, no dependencies) builds it from a draw.io model you write. Script and example paths below are relative to this skill's directory.

## Pick the category

| The reader wants to know | Category | Read |
| --- | --- | --- |
| What runs where in AWS and how it is wired, for one service or stack | AWS architecture | [AWS.md](AWS.md) |
| What a proposed change adds or changes, and what each part does | Spec | [SPEC.md](SPEC.md) |
| Anything else: a high-level overview, a flow, a decision, states | Other | [OTHER.md](OTHER.md) |

Each reference names an example in `examples/` (`.xml` source and built `.drawio.svg`). Copy its styles instead of inventing new ones.

## Workflow

1. Read the category reference and its example `.xml`.
2. Find icons: `node scripts/diagram.mjs icons <words>` lists titles of the newest [AWS icon library](https://github.com/m-radzikowski/diagrams-aws-icons) (cached in `~/.cache/diagrams-aws-icons`). Titles are full names (`Amazon Simple Queue Service`), so abbreviations like `sqs` match nothing; search `queue`. Every word must match.
3. Write the model as a bare `<mxGraphModel>` in the scratchpad. Use readable ids (`queue`, `e-queue-worker`). An icon is a vertex whose style contains `awsIcon=<exact title>`; build swaps in the image.
4. `node scripts/diagram.mjs build model.xml docs/img/<name>.drawio.svg`. Fix every warning; each one is a defect a reader would see.
5. `node scripts/diagram.mjs render docs/img/<name>.drawio.svg <scratchpad>/<name>.jpg`, then Read the JPG. For a diagram wider than about 1400px, also render halves with `--region x,y,w,h` (diagram coordinates) so the text is legible.
6. Check the picture against the review list below, fix the model, rebuild. Stop when a round finds nothing; four rounds at most, then say what is still off.

To change an existing diagram: `node scripts/diagram.mjs extract <file>.drawio.svg model.xml`, edit, build to the same path. Extract reads files saved by draw.io too (compressed or not).

`render` needs `rsvg-convert` and `magick` (`brew install librsvg imagemagick`); no browser and no draw.io install.

## Rules for every diagram

- **One question per diagram.** Split when it answers two questions, not at a box count; a system overview shows every part it has.
- **Names, not prose.** Labels are names and a short phrase at most. Explanations belong in the document around the diagram. No file names, no "this could be...", no paragraphs under nodes.
- **Text never under a line.** No edge, border or icon crosses a label. Build warns about every crossing; fix them by moving nodes, changing exit or entry points, or adding waypoints.
- **One main direction.** The main flow runs left to right (or top to bottom for flowcharts). Side effects branch off at right angles.
- **Grid.** Vertex x and y are multiples of 10. Nodes in a row share a centre y and nodes in a column share a centre x; waypoints sit on those centres even when that is off the grid.
- **Draw.io routes it the same way.** Give every edge that bends `exitX/exitY` and `entryX/entryY`, plus `<Array as="points">` waypoints, so draw.io draws the route the renderer drew. Straight edges between aligned nodes need neither.
- **One accent colour.** Neutral greys (`#232F3E` text and lines, `#607D8B` secondary text and edge labels, `#CFD8DC` borders) plus one highlight colour, amber `#F9A825` by default, that a legend or the subtitle explains. Pale role tints for spec lanes are the only other colour (SPEC.md).

## Renderer subset

The SVG picture is drawn by `diagram.mjs`, not draw.io, and it covers rectangles (rounded or not), text, `ellipse`, `rhombus`, images, containers, orthogonal and straight edges with waypoints, edge labels, dashes, opacity and HTML labels with `<br>`, `<b>` and coloured `<span>`. Build warns about any other shape. Use draw.io's built-in AWS shapes (`mxgraph.aws4.*`) and swimlanes only if you will open and save the file in draw.io, which then redraws the picture itself.

## Review list

- Every label readable, nothing clipped, nothing overlapping.
- Arrows point the way data or control actually flows; dashed edges mean something the legend or the reference defines.
- Every node is connected or deliberately standalone; nothing important is missing compared to the code or the spec.
- Spacing is even; no long empty band or cramped corner. Frames and lanes end about 40 below their last node.
- Edges cross each other as little as possible (build does not check this).
- Every name matches the real resource or the spec's own wording.
