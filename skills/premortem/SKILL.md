---
name: premortem
description: "Run a premortem on any plan, launch, product, hire, strategy, or decision. Assumes it already failed 6 months from now and works backward to find every reason why. Produces a revised plan with blind spots exposed. TRIGGERS: 'premortem this', 'premortem my', 'run a premortem', 'what could kill this', 'stress test this plan', 'find the blind spots', 'poke holes in this'. Trigger when the user has a concrete plan or commitment where the cost of being wrong is high."
---

# Premortem

A premortem flips a postmortem: assume the plan has already failed 6 months from now and work backward to explain why. The frame matters — asking "what could go wrong?" produces hedged answers; asserting "this is dead, tell me why" produces specific, honest failure modes.

## When to run one

**Good targets:** a product/feature you're about to build, a launch with money or reputation at stake, a pricing or business model change, a hire, a strategy pivot, a partnership, any commitment where being wrong is expensive.

**Bad targets:** vague ideas with no concrete plan (help them plan first), questions with one right answer (just answer), draft feedback (that's editing), decisions already made and irreversible.

## Step 1: Gather minimum context

Before asking the user anything, scan for context that's already available:
- The current conversation
- Workspace files: `CLAUDE.md`, any `memory/` folder, attached/referenced files, briefs or plans

Use `Glob` and quick `Read` calls. Don't spend more than 30 seconds.

You need three things before proceeding:
1. **What is it?** — Be able to describe the thing being premortemed in one sentence.
2. **Who is it for / who does it affect?** — Audience, customers, team, stakeholders.
3. **What does success look like?** — Failure is the inversion of success.

If anything is missing, ask one focused question at a time. Don't interrogate. If you can infer, infer.

## Step 2: Set the frame explicitly

Once you have enough context, say something like:

> "OK, I have enough context. Let's run the premortem. Here's the premise: it's 6 months from now. [The plan] has failed. We're looking back and figuring out what went wrong."

This shifts the mode from "evaluate this plan" to "explain why this died" — that's the whole psychological mechanism.

## Step 3: Generate failure reasons

Produce a comprehensive list of genuine reasons the plan could have died. Each reason in 1–2 sentences. Each reason must be:
- Specific to this plan (not generic advice)
- Grounded in details the user provided
- A genuine threat (not a minor inconvenience or extreme edge case)

Don't pad. Don't stop early. Some plans have 4 real failure modes, others have 9 — let the count be honest.

## Step 4: Spawn deep-dive agents in parallel

Spawn one sub-agent per failure reason, **all in parallel**. Each takes its assigned reason and goes deep independently.

**Sub-agent prompt:**

```
You are an investigator in a premortem analysis. You've been assigned one specific failure reason.

The plan:
---
[full context: what it is, who it's for, what success looks like, plus relevant workspace context]
---

PREMORTEM FRAME: It is 6 months from now. This plan has failed.

YOUR ASSIGNED FAILURE REASON: [the specific failure reason]

Write the story of how this specific failure played out. Be specific. Use details from the plan. Make it feel like a real case study.

Output:

1. THE FAILURE STORY: 2-3 paragraph narrative of how this failure played out. Name specific moments where things went wrong.

2. THE UNDERLYING ASSUMPTION: The one thing the user took for granted that made this failure possible. One sentence.

3. EARLY WARNING SIGNS: 1-2 concrete, observable signals that would indicate this failure mode is starting. Things you can see or measure, not vague feelings.

Under 300 words. Direct. Don't hedge. Don't sugarcoat.
```

## Step 5: Synthesize

After all agents complete, produce the synthesis:

1. **Most Likely Failure** — Which is most probable given what you know? Why? This is what to focus on first.
2. **Most Dangerous Failure** — Which would cause the most damage if it happened, even if less likely? This is what to insure against.
3. **Hidden Assumption** — Across all analyses, the single biggest assumption the user probably hasn't questioned. Often where the real value lives.
4. **Revised Plan** — Concrete changes mapped to specific failure modes. Not "consider your pricing" — "test pricing at $X with 20 people before committing publicly."
5. **Pre-Launch Checklist** — 3–5 specific things to verify, test, or put in place before executing. Each one prevents or detects one failure mode.

## Step 6: Output

Reply in chat with a concise three-sentence summary: most likely failure, hidden assumption, single most important revision.

Then save the full transcript to `premortem-transcript-[timestamp].md` in the user's workspace, including the gathered context, the raw failure reasons, all agent deep-dives, and the full synthesis.

## Principles

- **Always parallel.** Sequential agent spawning wastes time and lets earlier responses contaminate later ones.
- **Always set the frame explicitly.** "This has already failed" is the mechanism. Without it, you get polite risk assessment.
- **Comprehensive, not padded.** Find every genuine reason. Don't stop at 3 if there are 7. Don't force 7 if there are 3.
- **The synthesis is the product.** Make it specific and actionable.
- **Don't sugarcoat.** The point is to tell the user things they don't want to hear before reality does.
- **Revisions must be concrete.** Each one should be something the user can do this week.
- **Respect the context threshold.** Better to ask one more question than produce a generic premortem.
