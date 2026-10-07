import { colors, symbols } from '../utils/colors.js';
import { runSync, runInteractive, hasCommand } from '../utils/exec.js';
import { confirm, input } from '../utils/prompt.js';

function isGitRepo() {
  const res = runSync('git', ['rev-parse', '--is-inside-work-tree']);
  return res.success && res.stdout === 'true';
}

function showGitStatus() {
  const branchRes = runSync('git', ['branch', '--show-current']);
  const branch = branchRes.stdout || 'detached';

  // Ahead / behind upstream
  let upstreamInfo = '';
  const upstreamRes = runSync('git', ['rev-parse', '--abbrev-ref', '@{upstream}']);
  if (upstreamRes.success && upstreamRes.stdout) {
    const counts = runSync('git', ['rev-list', '--left-right', '--count', `${branch}...@{upstream}`]);
    if (counts.success && counts.stdout) {
      const [ahead, behind] = counts.stdout.split(/\s+/).map((n) => parseInt(n, 10));
      const parts = [];
      if (ahead > 0) parts.push(colors.green(`↑${ahead} ahead`));
      if (behind > 0) parts.push(colors.red(`↓${behind} behind`));
      if (parts.length > 0) upstreamInfo = ` (${parts.join(', ')})`;
      else upstreamInfo = ` (${colors.dim('synced')})`;
    }
  }

  console.log(`\n${colors.bold(colors.brightCyan('🌿 Instant Shell Git'))} ${colors.dim('— Current Branch:')} ${colors.bold(colors.brightMagenta(branch))}${upstreamInfo}\n`);

  // Parse porcelain status
  const statusRes = runSync('git', ['status', '--porcelain']);
  if (!statusRes.stdout) {
    console.log(`  ${symbols.check} ${colors.green('Working directory is completely clean!')}\n`);
    return;
  }

  const lines = statusRes.stdout.split('\n');
  const staged = [];
  const unstaged = [];
  const untracked = [];

  for (const line of lines) {
    if (!line) continue;
    const indexStatus = line[0];
    const workTreeStatus = line[1];
    const file = line.slice(3).trim();

    if (indexStatus === '?' && workTreeStatus === '?') {
      untracked.push(file);
    } else {
      if (indexStatus !== ' ' && indexStatus !== '?') {
        staged.push({ status: indexStatus, file });
      }
      if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
        unstaged.push({ status: workTreeStatus, file });
      }
    }
  }

  if (staged.length > 0) {
    console.log(colors.bold(colors.green(`  Staged Changes (${staged.length}):`)));
    for (const item of staged) {
      console.log(`    ${colors.green('+')} ${item.file} ${colors.dim(`[${item.status}]`)}`);
    }
    console.log();
  }

  if (unstaged.length > 0) {
    console.log(colors.bold(colors.yellow(`  Unstaged Changes (${unstaged.length}):`)));
    for (const item of unstaged) {
      console.log(`    ${colors.yellow('M')} ${item.file}`);
    }
    console.log();
  }

  if (untracked.length > 0) {
    console.log(colors.bold(colors.dim(`  Untracked Files (${untracked.length}):`)));
    for (const file of untracked.slice(0, 10)) {
      console.log(`    ${colors.dim('?')} ${colors.dim(file)}`);
    }
    if (untracked.length > 10) {
      console.log(`    ${colors.dim(`... and ${untracked.length - 10} more`)}`);
    }
    console.log();
  }

  console.log(colors.dim('Commands: is git save [msg] | is git sync | is git undo | is git log\n'));
}

async function handleSave(args) {
  let message = args.slice(1).join(' ').trim();
  if (!message) {
    message = await input('Commit message');
    if (!message) {
      console.log(colors.red('Aborted: Commit message is required.\n'));
      return;
    }
  }

  console.log(`\n${colors.dim('Staging all changes and committing...')}`);
  const addRes = runSync('git', ['add', '-A']);
  if (!addRes.success) {
    console.log(colors.red(`Failed to stage changes: ${addRes.stderr}`));
    return;
  }

  const commitRes = runSync('git', ['commit', '-m', message]);
  if (!commitRes.success) {
    console.log(colors.red(`Commit failed: ${commitRes.stderr || commitRes.stdout}`));
    return;
  }

  console.log(`${symbols.check} ${colors.green('Committed successfully:')} ${colors.bold(message)}\n`);
}

async function handleSync() {
  console.log(`\n${colors.dim('Syncing with remote...')}`);
  console.log(`  ${colors.dim('1. Pulling with rebase...')}`);
  const pullRes = runSync('git', ['pull', '--rebase']);
  if (!pullRes.success) {
    console.log(colors.red(`Pull failed: ${pullRes.stderr || pullRes.stdout}\n`));
    return;
  }

  console.log(`  ${colors.dim('2. Pushing commits...')}`);
  const pushRes = runSync('git', ['push']);
  if (!pushRes.success) {
    console.log(colors.red(`Push failed: ${pushRes.stderr || pushRes.stdout}\n`));
    return;
  }

  console.log(`\n${symbols.check} ${colors.green('Successfully synchronized with remote branch!')}\n`);
}

async function handleUndo() {
  const lastCommit = runSync('git', ['log', '-1', '--format=%s (%h)']);
  if (!lastCommit.success || !lastCommit.stdout) {
    console.log(colors.yellow('No commit to undo.\n'));
    return;
  }

  console.log(`\n${colors.bold('Last commit:')} ${colors.cyan(lastCommit.stdout)}`);
  const ok = await confirm('Undo this commit? (Changes will remain safely staged)', true);
  if (!ok) {
    console.log(colors.dim('Aborted.\n'));
    return;
  }

  const resetRes = runSync('git', ['reset', '--soft', 'HEAD~1']);
  if (resetRes.success) {
    console.log(`\n${symbols.check} ${colors.green('Commit undone! All changes kept in staged area.')}\n`);
  } else {
    console.log(colors.red(`Failed to undo commit: ${resetRes.stderr}\n`));
  }
}

function handleLog() {
  console.log(`\n${colors.bold(colors.brightCyan('🌿 Recent Git Commits:'))}\n`);
  const logRes = runSync('git', [
    'log',
    '-8',
    '--graph',
    '--pretty=format:%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset',
  ]);

  if (logRes.success && logRes.stdout) {
    console.log(logRes.stdout);
    console.log();
  } else {
    console.log(colors.dim('No commits found in repository.\n'));
  }
}

async function handleCleanBranches() {
  console.log(`\n${colors.dim('Checking for merged branches...')}`);
  const mergedRes = runSync('git', ['branch', '--merged']);
  if (!mergedRes.success || !mergedRes.stdout) {
    console.log(colors.yellow('Could not query branches.\n'));
    return;
  }

  const currentBranch = runSync('git', ['branch', '--show-current']).stdout;
  const branches = mergedRes.stdout
    .split('\n')
    .map((b) => b.trim().replace(/^\*\s*/, ''))
    .filter((b) => b && b !== 'main' && b !== 'master' && b !== currentBranch);

  if (branches.length === 0) {
    console.log(`${symbols.check} ${colors.green('No obsolete merged branches to clean!')}\n`);
    return;
  }

  console.log(`${colors.yellow('Merged branches that can be deleted:')}`);
  branches.forEach((b) => console.log(`  ${colors.dim('•')} ${colors.red(b)}`));

  const proceed = await confirm(`Delete these ${branches.length} merged branch(es)?`, false);
  if (!proceed) {
    console.log(colors.dim('Aborted.\n'));
    return;
  }

  for (const b of branches) {
    runSync('git', ['branch', '-d', b]);
    console.log(`  ${symbols.check} Deleted ${b}`);
  }
  console.log(`\n${symbols.check} ${colors.green('Cleaned merged branches successfully.')}\n`);
}

export async function runGit(args = []) {
  if (!hasCommand('git')) {
    console.log(`\n${symbols.cross} ${colors.red('Git is not installed or not in your PATH.')}\n`);
    return;
  }

  if (!isGitRepo()) {
    console.log(`\n${symbols.warning} ${colors.yellow('Current directory is not a Git repository.')}`);
    const init = await confirm('Initialize a new Git repository here?', false);
    if (init) {
      const res = runSync('git', ['init']);
      if (res.success) {
        console.log(`\n${symbols.check} ${colors.green('Initialized empty Git repository.')}\n`);
      } else {
        console.log(colors.red(`Git init failed: ${res.stderr}\n`));
      }
    }
    return;
  }

  const subCommand = args[0] ? args[0].toLowerCase() : 'status';

  switch (subCommand) {
    case 'status':
      showGitStatus();
      break;
    case 'save':
    case 'commit':
      await handleSave(args);
      break;
    case 'sync':
    case 'push':
      await handleSync();
      break;
    case 'undo':
      await handleUndo();
      break;
    case 'log':
      handleLog();
      break;
    case 'clean-branches':
    case 'prune':
      await handleCleanBranches();
      break;
    default:
      showGitStatus();
      break;
  }
}
