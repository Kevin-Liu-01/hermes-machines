# Matt Epstein -- Launch Agent System (Claude Code)

Source: X post by Matt Epstein
Saved: 2026-05-17

## Summary

Describes a multi-agent system built inside Claude Code that runs 21
specialized agents through a managed pipeline to produce viral launch
content. 30 launches, 26 viral. The system uses Claude as an "operating
system for launches," not as a writer.

## Architecture: 21 Specialized Agents

Each agent has one job. Work passes through a Manager agent that checks
quality and provides feedback before forwarding.

### Pipeline Phases
1. **Research** -- market, product, competitors, category, founder story, customer language
2. **Viral pattern analysis** -- studies what went viral in similar categories
3. **Bold claim extraction** -- the novel positioning that differentiates
4. **Hook writing** -- must answer: what is being launched, why it matters, why it never existed
5. **Hook critique + rewrite** -- iterative attack/rewrite cycle
6. **Body / demo-driven narrative** -- prove the hook, show the product
7. **Weapons check** -- every line scored on invention novelty + copy intensity
8. **Mom test** -- trained on a 61-year-old non-technical person to catch jargon
9. **Filler cut** -- aggressive removal of generic/weak lines
10. **Final human edit** -- 5% taste pass

### Key Principles
- Claude is NOT allowed to "just write the launch" -- that produces slop
- Every piece gets attacked, rewritten, scored, and improved
- Research uses 200+ data sources: YouTube outliers, Reddit, every X launch
- The "BOLD CLAIM" drives 95% of success -- novel positioning + big pain point
- Body must prove the hook through demo-driven narrative, not marketing language
- Dead phrases: "built a platform", "help teams save time", "streamline workflows"
- Full paper trail: research, positioning options, hook iterations, rejected versions

### Data Sources for Research
- YouTube outliers
- Deep Reddit research
- Every launch on X
- 200+ other data sources
- Existing customer language around the problem

### Quality Gates
- **Invention novelty**: Does this line make the product feel like something new?
- **Copy intensity**: Is the line sharp enough that someone feels something?
- **Mom test**: Would a non-technical 61-year-old understand this?
- **Filler check**: If a line doesn't make the product feel more important, it's gone

## Relevance to Agent Machines

This is a real-world example of:
1. Multi-agent orchestration with a manager/worker pattern
2. Specialized agents with single responsibilities
3. Quality gates between pipeline stages
4. Using Claude Code as the runtime (not a chatbot)
5. Human-in-the-loop for final 5% taste pass
6. Research-driven positioning over founder assumptions
