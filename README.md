# @agentpulselabs/cli-plugin-pulse

An [oclif](https://oclif.io) plugin that adds the **`pulse`** topic — a portable, contract-enforced build
discipline — to the `agentpulse` CLI. It is a thin `argv → core → stdout` seam over
[`@agentpulselabs/pulse`](https://github.com/ashishcloud/agentpulse-pulse); all discipline lives in the core.

> **Published to public npm** under the `@agentpulselabs` org (`publishConfig.access: "public"`). The CLI
> (`@agentpulselabs/cli`) supports plugins via `@oclif/plugin-plugins`; this plugin installs through it.

## Install

```bash
npm i -g @agentpulselabs/cli                              # the CLI (if not already installed)
agentpulse plugins install @agentpulselabs/cli-plugin-pulse
agentpulse pulse --help
```

This is the **user-installed** integration path (design decision): opt-in, decoupled release cadence, and the
same mechanism any third party uses to add `agentpulse` commands.

## Commands

| Command | What it does |
|---|---|
| `agentpulse pulse start --requirements "…" --name <name>` | Begin an engagement in the current repo (`.pulse/`). |
| `agentpulse pulse next` | Emit the current phase work-list (prompts + JSON schema; contract injected). |
| `agentpulse pulse submit --results-file r.json` | Validate your model's structured results vs schema + contract. |
| `agentpulse pulse gate --approved [--decisions-file d.json]` | The human gate — advance the phase; lock product decisions. |
| `agentpulse pulse verify` | Run the contract's gate command (`npm run check`); exits non-zero if red. |
| `agentpulse pulse status` | Phase, contract, board progress. |

The MCP server (`pulse-mcp`, shipped by `@agentpulselabs/pulse`) is the primary seam for interactive agents
(Cursor/Codex/Claude). This CLI plugin is the universal shell fallback: same core, same `.pulse/` state.

## Architecture

```
argv → src/commands/pulse/<verb>.js  (thin oclif Command, parses flags)
          → src/runPulse.js           (pure: verb → engine method; no oclif, testable)
             → @agentpulselabs/pulse       (the brain: state machine + contract + validator + gates)
                → .pulse/ in the repo  (durable, git-tracked truth)
```

## Test

```bash
node --test "test/**/*.test.js"   # exercises runPulse over a real .pulse/, no @oclif/core needed
```
