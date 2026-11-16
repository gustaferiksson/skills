---
name: goldfish
description: "Checks a written design, plan, spec or knowledge file with fresh-context subagents (goldfish) that see only the document and the files it cites, never the conversation. Finds context the document silently leans on, gaps a critic would catch, and design decisions still left to the implementer. Use after drafting a design or plan for a feature with real decisions and before any code is written, when asked to 'goldfish' something, or to check whether a CLAUDE.md or README stands on its own. Skip for small, well-understood changes."
---

# Goldfish

Write with memory, review without it (Dave Rensin's Elephant Goldfish Model). This session is the elephant: it holds the conversation. A goldfish is a fresh subagent that knows only what the document says.

## Run

1. The document must be a file. If it only exists in the conversation, write it first.
2. Spawn each goldfish as a fresh `general-purpose` subagent, never a fork: a fork inherits this conversation and is not a goldfish. Its prompt is the document path, the task below and "read the document and the files it cites; nothing else from me". Add no summary of the discussion.
3. Run the three in parallel. Each writes its report next to the document (`<doc>.goldfish-<n>.md`) and returns only a short summary.
   - **Explain:** explain the system or change back in your own words, section by section. Mark each place where you had to guess.
   - **Critic:** as a senior expert, list what is missing, wrong or overbuilt, most important first. No style nits.
   - **Ready:** could an engineer build this on the first pass without making a design decision? List every decision still open.
4. Fix the document, not the conversation: every guess, gap and open decision becomes text in the document, or a stated reason it doesn't. To contest a finding, point at something checkable (a file, a line, a constraint); "this was intentional" is not evidence.
5. Rerun only the goldfish whose findings changed the document, at most once more. Stop when what comes back is nitpicks.
6. Decisions the document can't settle go to the user (the `briefing` skill when there are several). The user approves the design, not the goldfish.

## Rules

- Goldfish review the document, not code. For code, run it and test it instead.
- Never paste goldfish reports into the chat; summarize the changes made to the document in a few lines.
