# Claude Code Dashboard

Personal dashboard aggregating Claude Code session data, project metadata, and backlogs into a static site.

## Stack

Vite 8 + React 19 + TypeScript strict + Tailwind 3.4 + CVA + date-fns + lucide-react. No router, no charting library. Static site on Vercel.

## Commands

```bash
npm run dev       # localhost:5174
npm run build     # tsc -b && vite build
npm run refresh   # tsx scripts/refresh.ts — regenerates src/data/*.json
```

## Architecture

```
src/
  App.tsx                  # Tab state + data loading + pre-refresh empty state
  components/
    layout/                # DashboardLayout, TabNav
    ui/                    # stat-card, badge, horizontal-bar, empty-state
    activity/              # ActivityHeatmap, SessionFeed, SessionCard
    projects/              # ProjectGrid, ProjectCard
    backlogs/              # BacklogView, BacklogSection
    usage/                 # UsageSummary, ProjectUsageBars, DailyTrend, ModelBreakdown
  lib/
    types.ts               # All interfaces
    utils.ts               # cn(), formatTokens(), formatDuration(), timeAgo()
    cost.ts                # Multi-model pricing + calculateSessionCost()
    colors.ts              # Deterministic project-to-color mapping
  data/                    # Generated JSON (committed — Vercel can't access ~/.claude/)
scripts/
  refresh.ts               # Parses ~/.claude/ + project dirs → JSON files
```

**Data flow:** `npm run refresh` runs locally, parses `~/.claude/` and project dirs, writes JSON to `src/data/`. JSON files are committed. Vercel builds the static site from committed JSON.

## Conventions

- FC with explicit props, `@/` path alias, `cn()` utility, named exports
- No comments unless non-obvious
- Shadcn-style UI primitives (CVA + clsx + tailwind-merge)
- No charting library — heatmap = CSS Grid, bars = divs, trend = SVG polyline

## Current State

MVP complete. All 4 tabs (Activity, Projects, Backlogs, Usage) implemented and deployed.
- 159 sessions, 18 projects, 33-day data span, 90.6% history match rate
- Data pipeline: 2.2s for 209 MB of JSONL files, ~106 KB output
- Build: 104 KB gzipped

## Deploy

Vercel auto-deploys on push to `main`.
**Production:** https://claude-code-dashboard-dnorth123-projects.vercel.app
**GitHub:** https://github.com/dnorth123/claude-code-dashboard
