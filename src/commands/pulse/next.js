import { Command } from '@oclif/core';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse next` — emit the current phase work-list (prompts + schema, contract injected). */
export default class PulseNext extends Command {
  static description = 'Emit the current phase work-list: tasks (prompt + JSON schema) your model must run.';
  static examples = ['<%= config.bin %> pulse next'];

  async run() {
    const result = await runPulse('next', {});
    this.log(JSON.stringify(result, null, 2));
  }
}
