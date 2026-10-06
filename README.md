# DebugFlow — AI-Assisted Debugging Workspace

**DebugFlow** is a full-stack debugging workspace built on DeepSpace. It helps developers investigate software errors, generate AI-powered hypotheses, track experiments, and document verified solutions.

Instead of treating debugging as a one-time conversation with an AI assistant, DebugFlow provides a structured workflow that captures the reasoning behind each fix.

**Live Application:** https://debugflow.app.space

## Features

- **Debugging Sessions:** Create and manage sessions containing error messages, stack traces, descriptions, and code snippets.
- **AI-Generated Hypotheses:** Generate possible root causes and suggested debugging steps using AI.
- **Hypothesis Tracking:** Organize hypotheses using four statuses: Untested, Testing, Confirmed, and Rejected.
- **Investigation Notes:** Record observations, experiment results, and debugging progress.
- **Resolution Tracking:** Document the final root cause and solution, resolve sessions, and reopen them when necessary.
- **Session History:** Revisit previous investigations and their solutions.
- **Realtime Synchronization:** Keep saved session records synchronized through DeepSpace.
- **Authentication:** Manage debugging sessions through authenticated user accounts.

## How It Works

1. **Create a session:** Describe the problem and provide the error message, stack trace, and relevant code.
2. **Generate hypotheses:** Use AI to identify potential causes and suggest ways to validate them.
3. **Investigate:** Test the hypotheses in your development environment and update their statuses.
4. **Document findings:** Save experiment notes and observations throughout the investigation.
5. **Resolve:** Record the verified root cause and final solution.
6. **Revisit:** Access completed investigations later for reference.

AI assists with generating hypotheses, but developers remain responsible for validating findings and confirming solutions.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Styling | Tailwind CSS |
| Backend | DeepSpace SDK, Cloudflare Workers |
| Database | DeepSpace Records |
| Realtime | DeepSpace RecordProvider and subscriptions |
| Authentication | DeepSpace Auth |
| AI | DeepSpace AI integration |
| Testing | Vitest, Playwright |
| Deployment | DeepSpace (`app.space`) |
| Development | VS Code, Codex |

## Architecture

DebugFlow uses DeepSpace's built-in infrastructure for authentication, data persistence, realtime synchronization, and AI integration.

**Core data model:**

- `debug_sessions` — stores debugging problems, context, status, root cause, and final solution.
- `debug_hypotheses` — stores hypotheses linked to individual sessions through `sessionId`.
- Investigation notes — preserve observations and debugging progress.

When a user requests AI-generated hypotheses, a server-side action validates access to the debugging session, invokes the DeepSpace AI integration, processes the structured response, and stores the generated hypotheses.

DeepSpace record subscriptions keep the interface updated when saved records change.

## Getting Started

### Prerequisites

- Node.js compatible with the installed DeepSpace SDK
- npm
- A DeepSpace account

### Installation

```bash
git clone https://github.com/vbodhani11/debugflow.git
cd debugflow
npm install
```

### Authentication

```bash
npx deepspace auth login
```

### Local Development

```bash
npx deepspace dev start
```

Open:

http://localhost:5173

### Testing

```bash
npx tsc --noEmit
npx vitest run
```

The project also includes browser tests using Playwright.

### Deployment

```bash
npx deepspace deploy
```

Live application:

https://debugflow.app.space

## Design Decisions and Tradeoffs

The main engineering decision was to prioritize a **complete debugging workflow over a large feature set**.

Rather than building a general-purpose AI coding assistant, DebugFlow focuses on turning debugging into a structured investigation.

DeepSpace's existing authentication, records, realtime synchronization, and AI capabilities were used instead of introducing unnecessary external infrastructure.

I intentionally excluded GitHub, Jira, Slack, browser extensions, and IDE extensions from the initial release. These could improve future workflows, but adding them within the exercise window would increase complexity without improving the core experience enough.

The AI proposes possible explanations rather than automatically declaring a bug resolved. Developers validate hypotheses and record the final outcome themselves.

## AI-Assisted Development

Codex was used as a coding assistant during implementation, including understanding DeepSpace SDK patterns, developing components, implementing the data model and AI workflow, and improving tests.

The development process emphasized incremental implementation, reviewing generated changes, debugging integration issues, and validating functionality rather than generating the entire application in a single step.

## Future Improvements

- **IDE integration:** Create and update debugging sessions directly from VS Code, Cursor, or coding agents.
- **Repository context:** Allow AI to analyze relevant files from a connected repository.
- **Resolution assistance:** Draft a suggested resolution from confirmed hypotheses and investigation notes for developer review.
- **Collaboration:** Support shared debugging investigations with teammates.
- **Improved search:** Make previous solutions easier to discover and reuse.

## Project Context

This application was built as part of the DeepSpace full-stack engineering build exercise.

The goal was to demonstrate practical use of DeepSpace's platform capabilities through a focused, functional product.

---

**Built with DeepSpace, React, TypeScript, and AI-assisted development.**
