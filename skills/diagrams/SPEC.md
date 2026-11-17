# Spec diagrams

Shows a proposed design in a spec or PR: the parts, what each one does in a phrase, and what is new compared to today. It is a picture of the change for reviewers, not infrastructure documentation. Template: `examples/spec.xml`.

## Layout

- **Title and subtitle** top left: the title names the design (fontSize 21, bold), and the subtitle is the one sentence the reader must not miss, usually the key invariant ("Prices are only written in one place...").
- **Legend** top right, in the highlight colour, saying what the colour means.
- **Lanes** are the stages the data or request passes through, left to right: for example IMPORT, STORE, SEARCH, SERVE. Use 3 to 5 lanes, each 320 wide, with 50 between them so edge labels sit in the gap. Lane colours: the source of truth `fillColor=#F6FBF0;strokeColor=#7AA116`, the lane the change is about `fillColor=#F6F7FF;strokeColor=#3334B9`, the rest `fillColor=#FAFAFA;strokeColor=#B0BEC5`. Five lanes are wider than 1400px, so review them in halves with `render --region`.
- **Cards** (280x62) inside the lanes, with 58 between them vertically, in the order the flow reaches them. Start each lane's cards at the top and end the lanes about 40 below the lowest card; leave a slot empty only when that keeps an edge straight.

## Cards

Each card is four cells: the rounded box with the bold name, a 34x34 icon at its left, a grey description line and, if new, a `new` badge top right. Copy them from the template.

- The name is the real resource or service name, as in the code or the spec.
- The description is `<Service> · <what it does>`, at most about 8 words: `Lambda · validates each row against the product schema`.
- **New service:** amber border (`strokeColor=#F9A825`) and the `new` badge.
- **Existing service that gains something:** grey border, plus an amber span at the end of the description: `<span style='color:#F9A825'>· new: price history</span>`.
- **Unchanged:** grey border (`#CFD8DC`), no amber.
- Components that aren't AWS use the same card without an icon: `spacingLeft=12` on the card, and the description cell starts 12 from the card's left edge and is 24 narrower than the card. Say where it lives in the description: `HTTPS · the customer's URL, outside AWS`.

## Edges and notes

- Rounded orthogonal edges in `#232F3E`; dashed `#607D8B` for derived or occasional paths (a full rebuild, a backfill).
- Label edges with the thing that moves or the trigger: `rows`, `stream`, `query`, `on upload`. A 50px gap fits about 7 characters at fontSize 10; slide a longer label into a lane with `<mxGeometry x="0.5" relative="1">`.
- At most two short notes, as plain text (`fontColor=#33691E`) in the lane they are about, stating a rule the design guarantees.
