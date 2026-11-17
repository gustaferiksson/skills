# Other diagrams

Everything that is neither an AWS wiring diagram nor a spec. Same palette and rules as SKILL.md.

## High-level overview

For explaining a whole system to someone new: which parts exist and how they relate, not how they are deployed.

- Group boxes by domain or responsibility (`rounded=0;fillColor=none;strokeColor=#232F3E`), each with a bold title in its top-left corner (`verticalAlign=top;align=left;spacingLeft=12;spacingTop=8;fontStyle=1`).
- Inside each group, a few icons (40x40) with short captions saying what they do ("Search", "Billing"), not resource names.
- Connect groups rather than every component; double-headed arrows for two-way traffic between groups.
- External actors (users, clients, incoming files) at the left or right edge.
- No AWS Cloud frame, no stack borders.

## Flowchart and decision

Template: `examples/flowchart.xml`.

- Top to bottom. `ellipse` for start and end (`fillColor=#ECEFF1`), rounded rectangles for steps (verb first: "Look up the order"), `rhombus` for decisions phrased as yes/no questions, in the accent colour.
- From a decision, "yes" continues down the main column and "no" goes right. Label both.
- Rejoin the main column with a waypoint below the side branch, entering the target from its side.

## State machine

- Rounded rectangles for states (nouns or adjectives: "Pending", "Shipped"), a small filled `ellipse` (20x20, `fillColor=#232F3E`) for the initial state.
- Every edge is labelled with the event that causes the transition. Self-transitions loop out of the right side with two waypoints.

## Sequence

Template: `examples/sequence.xml`.

- Participants as boxes (120x40) along the top, 200 apart. Lifelines are dashed `#CFD8DC` vertical edges with `endArrow=none` and `sourcePoint`/`targetPoint`, ending 40 below the last message.
- Messages are horizontal edges between lifeline x positions (also `sourcePoint`/`targetPoint`), 40 apart vertically, labelled with the call. The label sits above the line (`<mxPoint y="-10" as="offset"/>`). Dashed with `endArrow=open` for responses.
- A message that passes a lifeline slides its label clear of it (`<mxGeometry x="-0.5" relative="1">`).
- An action inside one participant ("user signs in") is a small note box on its lifeline, not a message.
