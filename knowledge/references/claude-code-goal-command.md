# Claude Code /goal Command

Source: X/blog post (community breakdown)
Saved: 2026-05-17

## What It Does

Autonomous multi-turn execution with a model-verified exit condition.
You set a completion condition, Claude works turn after turn until met.
No babysitting, no "continue" prompts.

## Mechanic

1. Type `/goal` followed by a clear completion condition
2. Claude takes a full turn (reasons, plans, edits, runs tests)
3. Fast evaluator model (Haiku by default) reads the transcript and checks: "Is the goal condition met?"
4. If no → Claude starts another turn automatically
5. If yes → goal auto-clears, control returns to you

A loop with a model-verified exit condition.

## What Good Goals Look Like

Must be specific, measurable, and verifiable from the transcript.

**Good:**
```
/goal all tests in test/auth pass and the lint step is clean
/goal CHANGELOG.md has an entry for every PR merged this week
/goal every call site of the old API has been migrated and the build succeeds
```

**Bad:**
- "make the code better" (vague, no exit condition)
- "refactor everything" (unmeasurable)
- "fix all bugs" (no observable end state)

Pattern: describe an observable end state that Claude can demonstrate
and the evaluator can confirm from output.

Mental model: write acceptance criteria for a very literal junior dev
who never gets tired.

## Project Setup for /goal Success

1. **CLAUDE.md at project root** -- architecture decisions, coding conventions,
   definition of done. Claude reads it every turn.
2. **Hooks for auto-validation** -- auto-run lint/typecheck after every file edit
   so Claude catches issues mid-run.
3. **Auto Mode enabled** -- reduces permission prompts. Without it, a 30-turn
   run stalls waiting for approval on every file write.

## Workflow Patterns

- Combine `/goal` with Agent View (multi-session dashboard) to manage a team
  of autonomous agents across different codebase areas
- Let Claude write the goal for you: "Write me a /goal prompt. Ask me what
  I'm trying to do first, then keep asking follow-up questions until you can
  describe 'done' in specific, measurable terms."

## Where It Falls Short

- **Token burn on vague goals** -- loose conditions = Claude spins without progress
- **Evaluator only sees transcript** -- if Claude doesn't print test results
  or diffs, evaluator can't verify
- **Complex multi-step overwhelms it** -- "redesign auth + add OAuth + write
  tests + update docs + deploy" is too much. Break into sequential goals.
- **No built-in token budget** -- keeps going until done or Ctrl+C.
  Community plugins add token caps and adversarial review.

## /goal vs /loop vs Stop Hooks

| Command | Trigger | Best For |
|---------|---------|----------|
| `/goal` | Stops when condition is model-verified met | Outcome-based work with clear finish line |
| `/loop` | Repeats on a schedule | Polling, periodic tasks |
| Stop hooks | Custom eval logic after every turn | More flexible, more setup |

## Relevance to Agent Machines

This is the pattern our cron system approximates: Hermes runs scheduled
tasks autonomously with defined outcomes. The `/goal` pattern could be
surfaced in the console as a "run until done" mode where the user sets
a completion condition and the agent loops autonomously, with the activity
stream showing each turn's progress in real time.

Key differences from our current chat model:
- Chat is single-turn request/response
- /goal is multi-turn autonomous with verified exit
- Our cron jobs are the closest analog (scheduled + autonomous)
- A "goal mode" in the console would bridge this gap
