import { Command } from '@oclif/core';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse status` — where does the engagement stand? Phase, contract, board progress. */
export default class PulseStatus extends Command {
  static description = 'Show engagement status: phase, contract, board progress.';
  static examples = ['<%= config.bin %> pulse status'];

  async run() {
    const result = await runPulse('status', {});
    this.log(JSON.stringify(result, null, 2));
  }
}
