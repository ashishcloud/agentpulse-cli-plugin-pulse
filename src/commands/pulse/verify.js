import { Flags } from '@oclif/core';
import BaseCommand from '../../lib/BaseCommand.js';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse verify` — run the contract's deterministic gate command. "Done" is this exit code. */
export default class PulseVerify extends BaseCommand {
  static description = "Run the contract's gate command (e.g. `npm run check`) and report pass/fail. Never an LLM opinion.";
  static examples = ['<%= config.bin %> pulse verify'];
  static flags = {
    cwd: Flags.string({ description: 'Directory to run the gate in (default: current repo).' }),
  };

  async run() {
    const { flags } = await this.parse(PulseVerify);
    const result = await runPulse('verify', { cwd: flags.cwd });
    this.log(JSON.stringify(result, null, 2)); // default: raw JSON (auto-silenced under --json)
    // A red gate is a SUCCESSFUL run reporting ok:false + exit 1 (so CI/scripts gate on it) — not a thrown error.
    if (!result.green) return this.problem(result, 1);
    return result;                              // --json: standard envelope
  }
}
