# AWS architecture diagrams

Shows what runs where and how it is wired for one service or stack, using the names from the infrastructure code. Template: `examples/aws-architecture.xml`.

## Layout

- **AWS Cloud frame.** One `AWS Cloud` rectangle around everything that runs in AWS, with the logo (`awsIcon=AWS Cloud group`, 30x30) in its top-left corner. Clients, third-party APIs and uploaded files sit outside it: inputs on the left, outputs on the right.
- **The stack under discussion** gets a dashed border inside the frame, labelled with a short stack name in its top-left corner.
- **Neighbours** from other stacks that connect directly sit outside the dashed border at `opacity=40;textOpacity=50`, so the reader sees the boundary without the noise. Leave out neighbours that don't connect. Label one as `<service><br><owner> stack` when its resource name isn't yours to know.
- **Two stacks side by side:** split them with a dashed vertical line (an edge with `endArrow=none` and `sourcePoint`/`targetPoint`) and a small label on each side at the bottom.
- **Grid:** icons 50x50, columns 180 apart, rows 130 apart. The trigger is on the left, the main path runs along the top row, and side effects (dead-letter queues, tables read on the side, backups) sit in the row below the node they belong to.

## Icons and labels

- One icon per resource. Use the service icon (`Amazon Simple Queue Service`, `AWS Lambda`, `Amazon DynamoDB`). Use a resource icon (`Amazon Simple Queue Service Queue`, `Amazon DynamoDB Stream`) only to mark a special role of a resource that already has its service drawn, such as a dead-letter queue.
- Labels sit below the icon, two lines: the short service name, then the resource name from the code: `AWS Lambda<br>CreateOrder`. Nothing else. A resource without a name in the code gets its role instead: `Amazon EventBridge<br>nightly schedule`.
- A side node fed from two columns (one dead-letter queue for two functions) sits centred between them in the row below; each edge leaves its source below the label and enters the top of the side node at its own point (`entryX=0.3` and `entryX=0.7`).
- N similar consumers: draw two or three, link them with a dotted line (`dashed=1;endArrow=none`) and label only the last one with what they have in common.

## Edges

- Solid: a synchronous call or the main data path. Dashed: asynchronous or exceptional paths (failures to a dead-letter queue, backup and restore, fan-out to optional consumers).
- Label an edge only when the two ends don't already say it: `Triggers`, `Publish`, `Subscribe`, `after 3 failures`, `Backup/Restore`. Never repeat the target's name.
- An edge leaving an icon downwards starts below its label: `exitX=0.5;exitY=1;exitDy=36` (36 is two label lines at fontSize 12). An edge entering from below uses `entryY=1;entryDy=36`.
- Put edge labels where no frame border runs (`<mxGeometry x="-0.5" relative="1">` slides a label along the edge, -1 is the source end, 1 the target end).

## Avoid

- Descriptions, handler file names or explanations under icons. A paragraph under every node makes the diagram unreadable; move those sentences into the document.
- Edges that loop around the whole diagram to reach the far side; move the node instead.
- More than about 12 icons. Split by stack, or draw the overview from OTHER.md instead.
