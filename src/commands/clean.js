import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { colors, symbols } from '../utils/colors.js';
import { formatBytes, renderTable } from '../utils/format.js';
import { confirm } from '../utils/prompt.js';

// Targets to scan for cleanup
const CLEANABLE_DIRS = [
  // Build / Outputs
  'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.vite', '.output', '.astro',
  // Dependencies & caches
  'node_modules', '.turbo', '.parcel-cache', '.cache', '.nyc_output', 'coverage',
  // Python
  '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache',
  // Rust
  'target',
];

const CLEANABLE_FILE_PATTERNS = [
  /^npm-debug\.log.*$/,
  /^yarn-error\.log.*$/,
  /^pnpm-debug\.log.*$/,
  /^\.DS_Store$/,
  /^\.eslintcache$/,
  /^tsconfig\.tsbuildinfo$/,
];

function getDirectorySize(dirPath) {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          total += getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          total += stats.size;
        }
      } catch {
        // Ignore file read errors (permission/locked)
      }
    }
  } catch {
    // Ignore folder read errors
  }
  return total;
}

function scanCleanable(targetDir = process.cwd(), maxDepth = 2, currentDepth = 0) {
  const items = [];
  if (currentDepth > maxDepth) return items;

  let entries = [];
  try {
    entries = fs.readdirSync(targetDir, { withFileTypes: true });
  } catch {
    return items;
  }

  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);
    const relPath = path.relative(process.cwd(), fullPath);

    if (entry.isDirectory()) {
      if (CLEANABLE_DIRS.includes(entry.name)) {
        const size = getDirectorySize(fullPath);
        items.push({
          name: relPath || entry.name,
          fullPath,
          type: 'dir',
          size,
        });
      } else if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        // Recurse into subdirectories (e.g. monorepo packages)
        items.push(...scanCleanable(fullPath, maxDepth, currentDepth + 1));
      }
    } else if (entry.isFile()) {
      if (CLEANABLE_FILE_PATTERNS.some((pat) => pat.test(entry.name))) {
        let size = 0;
        try {
          size = fs.statSync(fullPath).size;
        } catch {}
        items.push({
          name: relPath || entry.name,
          fullPath,
          type: 'file',
          size,
        });
      }
    }
  }

  return items;
}

export async function runClean(args = []) {
  const flags = new Set(args.filter((a) => a.startsWith('-')));
  const isDryRun = flags.has('--dry-run') || flags.has('-d');
  const isYes = flags.has('--yes') || flags.has('-y');

  console.log(`\n${colors.bold(colors.brightCyan('🧹 Instant Shell Clean'))} ${colors.dim('— Project Artifact Cleaner')}\n`);

  console.log(`${colors.dim('Scanning for build artifacts, temporary files, and caches...')}`);
  const items = scanCleanable();

  if (items.length === 0) {
    console.log(`\n${symbols.check} ${colors.green('Workspace is already sparkling clean! No artifacts found.')}\n`);
    return;
  }

  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);

  const headers = ['Artifact', 'Type', 'Reclaimable Space'];
  const rows = items.map((item) => [
    colors.bold(colors.yellow(item.name)),
    colors.dim(item.type === 'dir' ? 'directory' : 'file'),
    colors.brightGreen(formatBytes(item.size)),
  ]);

  console.log(`\n${renderTable(headers, rows, { padding: 4, align: ['left', 'left', 'right'] })}`);
  console.log(colors.dim('─'.repeat(50)));
  console.log(`  ${colors.bold('Total Reclaimable Space:')} ${colors.bold(colors.brightGreen(formatBytes(totalBytes)))}\n`);

  if (isDryRun) {
    console.log(`${symbols.info} ${colors.cyan('Dry run completed. No files were deleted.')}\n`);
    return;
  }

  // Safety confirmation
  let proceed = isYes;
  if (!proceed) {
    console.log(`${symbols.warning} ${colors.bold(colors.brightYellow('Safety Confirmation:'))}`);
    console.log(`  This will delete ${colors.bold(String(items.length))} items and free up ${colors.bold(formatBytes(totalBytes))}.`);
    proceed = await confirm('Do you want to permanently remove these artifacts?', false);
  }

  if (!proceed) {
    console.log(colors.dim('\nCleanup cancelled. No changes made.\n'));
    return;
  }

  let deletedCount = 0;
  let freedBytes = 0;

  for (const item of items) {
    try {
      if (item.type === 'dir') {
        fs.rmSync(item.fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(item.fullPath);
      }
      deletedCount++;
      freedBytes += item.size;
    } catch (err) {
      console.log(`  ${symbols.cross} ${colors.red(`Failed to remove ${item.name}: ${err.message}`)}`);
    }
  }

  console.log(`\n${symbols.check} ${colors.bold(colors.green(`Cleaned ${deletedCount} items, freed ${formatBytes(freedBytes)}!`))}\n`);
}
