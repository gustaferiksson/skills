---
name: grill-me
description: Relentlessly interrogates the user about a plan or design, walking down each branch of the decision tree one question at a time until shared understanding is reached. Use when the user wants to stress-test a non-code plan, asks to be grilled or interviewed about a design, or says "grill me", "poke holes", "interrogate this", or "walk me through every decision". For code work that should also update domain docs (CONTEXT.md, ADRs) inline, prefer grill-with-docs.
---

Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.
