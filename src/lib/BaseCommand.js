import { Command } from '@oclif/core';

/**
 * BaseCommand — the pulse plugin's half of the machine-readable CLI contract (docs/PLAN.md M0), matching the host
 * CLI's BaseCommand so `agentpulse pulse <verb> --json` yields the SAME standard envelope as first-party commands:
 *
 *   success:  { tool:'agentpulse', command:'pulse status', version, ok:true,  result }
 *   error:    { tool:'agentpulse', command:'pulse status', version, ok:false, error:{ code, message } }
 *
 * Behavior note (deliberate, back-compat): pulse output is machine-oriented (work-lists with prompts + JSON
 * schemas an agent consumes), so the DEFAULT (no --json) still prints the raw engine result as pretty JSON —
 * exactly as before. `--json` layers the standard envelope on top. Both are JSON; --json is the stable contract.
 */
export default class BaseCommand extends Command {
  static enableJsonFlag = true;

  toSuccessJson(result) {
    const marked = result && typeof result === 'object' && result.__ap === true;
    const ok = marked ? result.ok : true;
    const payload = marked ? result.result : result;
    return { tool: 'agentpulse', command: this.commandName(), version: this.config?.version, ok, result: payload };
  }

  toErrorJson(err) {
    return {
      tool: 'agentpulse', command: this.commandName(), version: this.config?.version, ok: false,
      error: { code: (err && err.code) || 'E_ERROR', message: (err && err.message) || String(err) },
    };
  }

  commandName() { return String(this.id || this.ctor?.id || '').replace(/:/g, ' '); }

  fail(code, message, exit = 1) { process.exitCode = exit; this.error(message, { code, exit }); }

  /** A successful run that reports ok:false and exits non-zero, carrying its full payload (e.g. `verify` red). */
  problem(payload, exit = 1) { process.exitCode = exit; return { __ap: true, ok: false, result: payload }; }
}
