/**
 * runPulse.test.js — proves the plugin seam is a correct, thin passthrough to the core, WITHOUT needing
 * @oclif/core installed. We inject a createEngine that binds to a temp .pulse/ dir on disk, then drive the
 * verbs and assert they route to the right engine methods. The discipline itself is tested in @agentpulselabs/pulse;
 * here we only verify the seam.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEngine } from '@agentpulselabs/pulse';
import { runPulse, ACTIONS } from '../src/runPulse.js';

function tmpRepo() {
  // os.tmpdir + a fixed suffix (no Date/random per harness rules) — cleaned at process exit best-effort.
  const dir = path.join(os.tmpdir(), 'pulse-plugin-test-repo');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Bind runPulse to a temp repo + a fixed clock via an injected createEngine.
function boundOpts(cwd) {
  return { cwd, createEngine: (o) => createEngine({ ...o, now: () => '2026-08-03T00:00:00Z' }) };
}

test('ACTIONS mirrors the documented verb surface', () => {
  assert.deepEqual(ACTIONS, ['start', 'next', 'submit', 'gate', 'verify', 'status', 'board', 'claim', 'sync']);
});

test('start → next → submit → gate routes through to the engine over a real .pulse/', async () => {
  const cwd = tmpRepo();
  const opts = boundOpts(cwd);

  const started = await runPulse('start', { requirements: 'Build a widget store', name: 'widgets' }, opts);
  assert.equal(started.phase, 'Discovery');
  assert.ok(fs.existsSync(path.join(cwd, '.pulse', 'engagement.json')), '.pulse/ written to disk');

  const wl = await runPulse('next', {}, opts);
  assert.equal(wl.phase, 'Discovery');
  assert.equal(wl.tasks.length, 4);

  const submitted = await runPulse('submit', { results: [
    { id: 'risks', data: { findings: [] } },
    { id: 'contradictions', data: { findings: [] } },
    { id: 'archfit', data: { findings: [{ title: 'blob in db', severity: 'high', kind: 'architecture', detail: 'd', recommendation: 'GCS pointer', invariant: 'No blobs in the DB (PD #7)' }] } },
    { id: 'gaps', data: { findings: [] } },
  ] }, opts);
  assert.equal(submitted.ready, true, 'no product blockers → ready');
  assert.equal(submitted.autoResolved.length, 1);

  const gated = await runPulse('gate', { approved: true, decisions: [] }, opts);
  assert.equal(gated.phase, 'Stories');
  assert.equal(gated.advanced, true);

  const status = await runPulse('status', {}, opts);
  assert.equal(status.phase, 'Stories');
});

test('submit accepts results as a JSON string (CLI file content) too', async () => {
  const cwd = tmpRepo();
  const opts = boundOpts(cwd);
  await runPulse('start', { requirements: 'r', name: 'x' }, opts);
  await runPulse('next', {}, opts);
  const asString = JSON.stringify([
    { id: 'risks', data: { findings: [] } }, { id: 'contradictions', data: { findings: [] } },
    { id: 'archfit', data: { findings: [] } }, { id: 'gaps', data: { findings: [] } },
  ]);
  const res = await runPulse('submit', { results: asString }, opts);
  assert.equal(res.ok, true);
});

test('unknown action errors clearly', async () => {
  await assert.rejects(() => runPulse('frobnicate', {}, boundOpts(tmpRepo())), /unknown pulse action "frobnicate"/);
});
