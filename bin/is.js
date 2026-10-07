#!/usr/bin/env node

import process from 'node:process';
import { cli } from '../src/cli.js';

cli(process.argv.slice(2)).catch((err) => {
  console.error('\nInstant Shell Error:', err);
  process.exit(1);
});
