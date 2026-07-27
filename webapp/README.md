# QU Schedule Planner

A Qatar University-branded chatbot that helps an undergraduate student build a
realistic plan for the next academic term. It gathers the student's program,
completed courses, target term, credit limit, work commitments, and preferences
before proposing a schedule with a rationale.

Live site: https://qu-schedule-planner.vercel.app

## Main safeguards

- The completed-course picker blocks courses until their modeled prerequisites
  are selected.
- Required prerequisites use AND logic; `prerequisites_one_of` accepts any one
  valid alternative.
- Removing a prerequisite is blocked while a selected dependent course still
  relies on it.
- The server rejects clearly unrelated requests before calling Groq.
- A proposed schedule is checked against program data, prerequisites,
  corequisites, catalog credits, the 12-18 credit range, the student's latest
  limit, the confirmed term, total arithmetic, and the advisor note.
- If a generated schedule fails validation, the model gets one hidden repair
  attempt. An unverified schedule is not displayed.

## Stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- Groq SDK
  - text: `llama-3.3-70b-versatile`
  - academic-image turns: `qwen/qwen3.6-27b`
- Vercel deployment
- Browser `localStorage` for device-local conversation history

## Project structure

```text
app/
  api/chat/              Request validation, scope gate, and model orchestration
components/
  chat/                  Landing page, messages, and composer
  onboarding/            Program and completed-course intake
  sidebar/               Saved planning sessions
data/                    Program-specific catalog/prerequisite records
lib/
  groq/                  Provider client, models, and retry behavior
  guardrails/            Deterministic schedule-only scope gate
  program-data/          Program loading, formatting, and picker rules
  prompt/                Canonical system prompt and prompt assembly
  scheduling/            Post-generation schedule validation and repair
  storage/               Device-local conversation persistence
```

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `GROQ_API_KEY` in `.env.local`. The key is read only by the server route and
must never use a `NEXT_PUBLIC_` prefix.

## Build checks

```bash
npm run lint
npm run build
```
