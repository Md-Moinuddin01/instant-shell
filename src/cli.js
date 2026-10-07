import process from 'node:process';
import { colors } from './utils/colors.js';
import { select } from './utils/prompt.js';
import { showHelp } from './commands/help.js';
import { runDoctor } from './commands/doctor.js';
import { runPorts } from './commands/ports.js';
import { runClean } from './commands/clean.js';
import { runInfo } from './commands/info.js';
import { runGit } from './commands/git.js';
import { runInit } from './commands/init.js';
import { runSetup } from './commands/setup.js';
import { runUi } from './commands/ui.js';

const VERSION = '0.1.0';

const MENU_OPTIONS = [
  { id: 'ui',     label: '🌐 Web UI', description: 'Launch interactive localhost dashboard' },
  { id: 'doctor', label: '🩺 Doctor', description: 'Diagnose tools, runtimes, memory & network' },
  { id: 'ports',  label: '🌐 Ports',  description: 'Inspect active listening ports and kill processes' },
  { id: 'info',   label: '💻 Info',   description: 'View system specifications and project metadata' },
  { id: 'clean',  label: '🧹 Clean',  description: 'Safely scan and clean build clutter and caches' },
  { id: 'git',    label: '🌿 Git',    description: 'Quick Git status, save, sync, undo & branches' },
  { id: 'setup',  label: '🧰 Setup',  description: 'Setup .env, install dependencies, verify tools' },
  { id: 'init',   label: '📦 Init',   description: 'Initialize a new project with starter templates' },
  { id: 'help',   label: '❓ Help',   description: 'Show commands reference and examples' },
  { id: 'exit',   label: '✖ Exit',   description: 'Close Instant Shell' },
];

export async function cli(rawArgs = process.argv.slice(2)) {
  const args = [...rawArgs];

  // Global flags
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`instant-shell v${VERSION}`);
    return;
  }

  if (args.length === 0 || args[0] === '-i' || args[0] === 'interactive') {
    // If interactive or no args, launch picker menu
    if (process.stdin.isTTY) {
      console.log(`\n${colors.bold(colors.brightCyan('⚡ INSTANT SHELL'))} ${colors.dim(`v${VERSION}`)}`);
      const choice = await select('What would you like to do?', MENU_OPTIONS, 0);
      if (choice.id === 'exit') {
        console.log(colors.dim('Goodbye!\n'));
        return;
      }
      return executeCommand(choice.id, []);
    } else {
      showHelp();
      return;
    }
  }

  const command = args[0].toLowerCase();
  const subArgs = args.slice(1);

  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  await executeCommand(command, subArgs);
}

async function executeCommand(cmd, args) {
  switch (cmd) {
    case 'ui':
    case 'web':
    case 'dashboard':
      await runUi(args);
      break;
    case 'doctor':
      await runDoctor(args);
      break;
    case 'ports':
    case 'port':
      await runPorts(args);
      break;
    case 'clean':
    case 'cleanup':
      await runClean(args);
      break;
    case 'info':
    case 'status':
      runInfo(args);
      break;
    case 'git':
      await runGit(args);
      break;
    case 'init':
    case 'create':
      await runInit(args);
      break;
    case 'setup':
    case 'install':
      await runSetup(args);
      break;
    case 'help':
      showHelp();
      break;
    default:
      console.log(`\n${colors.red(`Unknown command: "${cmd}"`)}`);
      console.log(`Run ${colors.brightCyan('is help')} to see all available commands.\n`);
      process.exitCode = 1;
      break;
  }
}
