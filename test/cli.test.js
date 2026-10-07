import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { formatBytes, formatUptime, stripAnsi } from '../src/utils/format.js';
import { getListeningPorts } from '../src/utils/system.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN_PATH = path.resolve(__dirname, '../bin/is.js');

function runCLI(args = []) {
  return spawnSync('node', [BIN_PATH, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Format Utilities', () => {
  test('formatBytes formats sizes accurately', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1024 * 1024 * 5), '5 MB');
    assert.equal(formatBytes(1024 * 1024 * 1024 * 2.5), '2.5 GB');
  });

  test('stripAnsi removes color codes', () => {
    const colored = '\x1b[31mError\x1b[39m';
    assert.equal(stripAnsi(colored), 'Error');
  });

  test('formatUptime produces human-readable strings', () => {
    assert.ok(formatUptime(3600).includes('1h'));
    assert.ok(formatUptime(86400 * 2).includes('2d'));
  });
});

describe('System Utilities', () => {
  test('getListeningPorts returns an array of port objects', () => {
    const ports = getListeningPorts();
    assert.ok(Array.isArray(ports));
    if (ports.length > 0) {
      assert.ok(typeof ports[0].port === 'number');
      assert.ok(ports[0].protocol === 'TCP');
    }
  });
});

describe('Instant Shell CLI Commands', () => {
  test('is --help displays help banner and command table', () => {
    const res = runCLI(['--help']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('INSTANT SHELL'));
    assert.ok(res.stdout.includes('doctor'));
    assert.ok(res.stdout.includes('ports'));
    assert.ok(res.stdout.includes('clean'));
    assert.ok(res.stdout.includes('info'));
    assert.ok(res.stdout.includes('git'));
  });

  test('is help displays help banner', () => {
    const res = runCLI(['help']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('INSTANT SHELL'));
  });

  test('is --version displays version', () => {
    const res = runCLI(['--version']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('instant-shell v0.1.0'));
  });

  test('is info displays system specs and workspace info', () => {
    const res = runCLI(['info']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('SYSTEM SPECIFICATIONS'));
    assert.ok(res.stdout.includes('CURRENT WORKSPACE'));
    assert.ok(res.stdout.includes('instant-shell'));
  });

  test('is doctor executes diagnostics', () => {
    const res = runCLI(['doctor']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('Instant Shell Doctor'));
    assert.ok(res.stdout.includes('Node.js'));
    assert.ok(res.stdout.includes('Diagnostics Result'));
  });

  test('is ports displays listening ports without error', () => {
    const res = runCLI(['ports']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('Active Listening Ports') || res.stdout.includes('No active'));
  });

  test('is clean --dry-run previews cleanable files safely', () => {
    const res = runCLI(['clean', '--dry-run']);
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('Instant Shell Clean'));
    assert.ok(
      res.stdout.includes('Workspace is already sparkling clean') ||
      res.stdout.includes('Dry run completed')
    );
  });

  test('is unknown handles unrecognized commands gracefully', () => {
    const res = runCLI(['nonexistent-command-xyz']);
    assert.equal(res.status, 1);
    assert.ok(res.stdout.includes('Unknown command'));
    assert.ok(res.stdout.includes('is help'));
  });
});
