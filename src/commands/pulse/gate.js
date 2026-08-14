import { Flags } from '@oclif/core';
import BaseCommand from '../../lib/BaseCommand.js';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse gate` — the human-in-the-loop barrier. Advance only with --approved. */
export default class PulseGate extends BaseCommand {
  static description = 'The human gate. Advance the phase ONLY with --approved. Lock product decisions here.';
  static examples = ['<%= config.bin %> pulse gate --approved --decisions-file decisions.json'];
  static flags = {
    approved: Flags.boolean({ description: 'Approve this phase (silence/omission = not approved).', default: false }),
    'decisions-file': Flags.string({ description: 'Path to a JSON file of human product decisions to lock: [{ title, decision, rationale }].' }),
  };

  async run() {
    const { flags } = await this.parse(PulseGate);
    let decisions = [];
    if (flags['decisions-file']) {
      const fs = await import('node:fs');
      decisions = JSON.parse(fs.readFileSync(flags['decisions-file'], 'utf8'));
    }
    const result = await runPulse('gate', { approved: flags.approved, decisions });
    this.log(JSON.stringify(result, null, 2)); // default: raw JSON (auto-silenced under --json)
    return result;                              // --json: standard envelope
  }
}
