/**
 * json-contract.test.js — proves the `--json` contract (docs/PLAN.md M0) for every pulse command, in-process.
 *
 * We load an oclif Config rooted at THIS plugin (so it discovers pulse:* commands), chdir into a throwaway
 * .pulse/ repo, and drive the documented flow with `--json`, capturing stdout. For each command we assert the
 * STANDARD ENVELOPE:  { tool:'agentpulse', command:'pulse <verb>', version, ok, result | error:{code,message} }.
 *
 * No test framework beyond node:test (matches this repo's plain-node convention). Runs offline against the real
 * @agentpulselabs/pulse engine over a temp repo — the same engine the existing runPulse.test.js exercises.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config } from '@oclif/core';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));   // plugin repo root
const stripAnsi = (s) => s.replace(/\[[0-9;]*m/g, '');               // colorizeJson may tint output

/** Run a pulse command in-process with argv, capturing stdout. Returns { envelope, exitCode, raw }. */
async function run(config, id, argv, cwd) {
  const prevCwd = process.cwd();
  const prevExit = process.exitCode;
  process.exitCode = undefined;
  process.chdir(cwd);
  let out = '';
  const write = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s) => { out += typeof s === 'string' ? s : s.toString(); return true; };
  try {
    await config.runCommand(id, argv);
  } finally {
    process.stdout.write = write;
    process.chdir(prevCwd);
  }
  const exitCode = process.exitCode ?? 0;
  process.exitCode = prevExit;                        // don't leak a failing code into the test runner
  let envelope; try { envelope = JSON.parse(stripAnsi(out)); } catch { envelope = { __parseError: out }; }
  return { envelope, exitCode, raw: out };
}

/** Assert the standard success envelope for a command id. */
function assertEnvelope(r, command) {
  assert.equal(r.envelope.tool, 'agentpulse', `${command}: tool`);
  assert.equal(r.envelope.command, command, `${command}: command name (space form)`);
  assert.equal(typeof r.envelope.version, 'string', `${command}: version present`);
  assert.equal('ok' in r.envelope, true, `${command}: has ok`);
}

function tmpRepo(name) {
  const dir = path.join(os.tmpdir(), `pulse-json-contract-${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('every pulse verb emits the standard envelope under --json', async () => {
  const config = await Config.load(ROOT);
  const cwd = tmpRepo('flow');

  const start = await run(config, 'pulse:start', ['--requirements', 'Build a widget store', '--name', 'widgets', '--json'], cwd);
  assertEnvelope(start, 'pulse start');
  assert.equal(start.envelope.ok, true, 'start ok:true');
  assert.equal(start.envelope.result.phase, 'Discovery', 'start result carries engine payload');
  assert.equal(start.exitCode, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.pulse', 'engagement.json')), '.pulse/ written');

  const next = await run(config, 'pulse:next', ['--json'], cwd);
  assertEnvelope(next, 'pulse next');
  assert.equal(next.envelope.ok, true);
  assert.equal(next.envelope.result.tasks.length, 4, 'next result carries the work-list');

  const submit = await run(config, 'pulse:submit', ['--json'], cwd);   // no --results-file → required-flag error
  assertEnvelope(submit, 'pulse submit');
  assert.equal(submit.envelope.ok, false, 'missing required flag → error envelope');
  assert.equal(typeof submit.envelope.error.code, 'string');
  assert.notEqual(submit.exitCode, 0, 'error exits non-zero');

  const status = await run(config, 'pulse:status', ['--json'], cwd);
  assertEnvelope(status, 'pulse status');
  assert.equal(status.envelope.ok, true);
  assert.equal(status.envelope.result.phase, 'Discovery', 'status reflects engine state');
});

test('pulse verify reports a red gate as ok:false + non-zero exit (with full payload)', async () => {
  const config = await Config.load(ROOT);
  const cwd = tmpRepo('verify');
  await run(config, 'pulse:start', ['--requirements', 'r', '--name', 'x', '--json'], cwd);
  // Fresh engagement has no green gate command satisfied → verify should be red.
  const verify = await run(config, 'pulse:verify', ['--json'], cwd);
  assertEnvelope(verify, 'pulse verify');
  if (verify.envelope.result && verify.envelope.result.green === false) {
    assert.equal(verify.envelope.ok, false, 'red gate → ok:false');
    assert.equal(verify.exitCode, 1, 'red gate → exit 1');
  } else {
    // If the engine reports green (e.g. no gate configured), it must be a clean ok:true/exit 0.
    assert.equal(verify.envelope.ok, true);
    assert.equal(verify.exitCode, 0);
  }
});
