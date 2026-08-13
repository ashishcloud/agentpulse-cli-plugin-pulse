/**
 * runPulse.js — the PURE command core for the pulse CLI topic. Maps a verb + args → an engine call → a
 * JSON-serializable result. No oclif, no I/O of its own (the engine's state.js owns fs). This is what makes
 * the plugin testable without installing @oclif/core, and keeps the seam thin: the oclif command classes
 * (src/commands/pulse/*.js) are ~5-line wrappers that parse flags and call this.
 *
 * Mirror of the MCP seam's tools.js: one verb == one engine method. All discipline lives in @agentpulselabs/pulse.
 */

import { createEngine } from '@agentpulselabs/pulse';

/** The verbs this topic exposes, each → an engine method. Kept in sync with the MCP tool surface. */
export const ACTIONS = ['start', 'next', 'submit', 'gate', 'verify', 'status', 'board', 'claim', 'sync'];

/**
 * @param {string} action - one of ACTIONS
 * @param {Object} args   - parsed flags/inputs for the action
 * @param {Object} [opts] - { cwd, createEngine } (createEngine injectable for tests)
 * @returns {Promise<Object>} JSON-serializable result
 */
export async function runPulse(action, args = {}, opts = {}) {
  const make = opts.createEngine || createEngine;
  const engine = make({ cwd: opts.cwd || process.cwd() });

  switch (action) {
    case 'start':
      return engine.start({ requirements: args.requirements, grounding: args.grounding, name: args.name });
    case 'next':
      return engine.next();
    case 'submit':
      return engine.submit({ results: parseResults(args.results) });
    case 'gate':
      return engine.gate({ approved: !!args.approved, decisions: parseJson(args.decisions, []) });
    case 'verify':
      return await engine.verify({ cwd: args.cwd });
    case 'status':
      return engine.status();
    case 'board':
      return engine.boardUpdate({ id: args.id, status: args.status });
    case 'claim':
      return engine.claim({ id: args.id, agentId: args.agentId });
    case 'sync':
      return engine.sync({ ids: parseJson(args.ids, undefined) });
    default:
      throw new Error(`unknown pulse action "${action}" — expected one of ${ACTIONS.join(', ')}`);
  }
}

// results may arrive as a JSON string (from --results-file content) or already-parsed array.
function parseResults(r) {
  if (Array.isArray(r)) return r;
  return parseJson(r, []);
}
function parseJson(v, fallback) {
  if (v == null) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}
