import { Flags } from '@oclif/core';
import BaseCommand from '../../lib/BaseCommand.js';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse submit` — validate the model's structured results against schema + contract. */
export default class PulseSubmit extends BaseCommand {
  static description = "Submit your model's structured results (JSON). Pulse validates them vs schema + contract.";
  static examples = ['<%= config.bin %> pulse submit --results-file discovery-results.json'];
  static flags = {
    'results-file': Flags.string({ description: 'Path to a JSON file: [{ id, data }, …] (one per work-list task).', required: true }),
  };

  async run() {
    const { flags } = await this.parse(PulseSubmit);
    const fs = await import('node:fs');
    const results = JSON.parse(fs.readFileSync(flags['results-file'], 'utf8'));
    const result = await runPulse('submit', { results });
    this.log(JSON.stringify(result, null, 2)); // default: raw JSON (auto-silenced under --json)
    return result;                              // --json: standard envelope
  }
}
