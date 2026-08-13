import { Command, Flags } from '@oclif/core';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse verify` — run the contract's deterministic gate command. "Done" is this exit code. */
export default class PulseVerify extends Command {
  static description = "Run the contract's gate command (e.g. `npm run check`) and report pass/fail. Never an LLM opinion.";
  static examples = ['<%= config.bin %> pulse verify'];
  static flags = {
    cwd: Flags.string({ description: 'Directory to run the gate in (default: current repo).' }),
  };

  async run() {
    const { flags } = await this.parse(PulseVerify);
    const result = await runPulse('verify', { cwd: flags.cwd });
    this.log(JSON.stringify(result, null, 2));
    if (!result.green) this.exit(1); // non-zero so CI / scripts can gate on it
  }
}
