import { Command, Flags } from '@oclif/core';
import { runPulse } from '../../runPulse.js';

/** `agentpulse pulse start` — begin an engagement in the current repo (.pulse/). Thin argv→core shim. */
export default class PulseStart extends Command {
  static description = 'Begin a Pulse engagement in the current repo (.pulse/).';
  static examples = ['<%= config.bin %> pulse start --requirements "Build a widget store" --name widgets'];
  static flags = {
    requirements: Flags.string({ description: 'Raw requirements text (or use --requirements-file).', required: false }),
    'requirements-file': Flags.string({ description: 'Path to a file containing the requirements.' }),
    grounding: Flags.string({ description: 'Optional domain grounding notes.' }),
    name: Flags.string({ description: 'Short engagement name (used for filenames).', default: 'engagement' }),
  };

  async run() {
    const { flags } = await this.parse(PulseStart);
    const fs = await import('node:fs');
    const requirements = flags['requirements-file']
      ? fs.readFileSync(flags['requirements-file'], 'utf8')
      : (flags.requirements || '');
    const result = await runPulse('start', { requirements, grounding: flags.grounding, name: flags.name });
    this.log(JSON.stringify(result, null, 2));
  }
}
