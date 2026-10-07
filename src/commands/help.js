import { colors, symbols } from '../utils/colors.js';
import { renderTable } from '../utils/format.js';

export function showHelp() {
  console.log(`
${colors.bold(colors.brightCyan('  ⚡ INSTANT SHELL'))} ${colors.dim('—')} ${colors.italic('Instant access to your developer shell')}
  ${colors.dim('One small command for all common terminal workflows.')}
`);

  console.log(colors.bold(colors.yellow('USAGE:')));
  console.log(`  ${colors.brightGreen('is')} ${colors.cyan('<command>')} ${colors.dim('[options]')}`);
  console.log(`  ${colors.brightGreen('is')}                ${colors.dim('# Launches interactive menu')}\n`);

  console.log(colors.bold(colors.yellow('COMMANDS:')));

  const commands = [
    ['ui', 'Launch interactive localhost dashboard (ports, info, health)'],
    ['doctor', 'Diagnose environment, dev tools, runtimes & network'],
    ['ports', 'Inspect active listening ports & kill processes'],
    ['info', 'Show system specs & current project metadata'],
    ['clean', 'Safely remove temporary build artifacts & caches'],
    ['git', 'Fast Git shortcuts: status, save, sync, undo & branches'],
    ['init', 'Initialize a new project with starter templates'],
    ['setup', 'Set up dependencies, environment (.env), and tools'],
    ['help', 'Display this help screen or command-specific help'],
  ];

  const headers = ['Command', 'Description'];
  const rows = commands.map(([cmd, desc]) => [
    colors.brightGreen(`is ${cmd}`),
    colors.dim(desc),
  ]);

  console.log(renderTable(headers, rows, { padding: 4 }));

  console.log(`\n${colors.bold(colors.yellow('EXAMPLES:'))}`);
  console.log(`  ${colors.dim('$')} ${colors.brightCyan('is doctor')}            ${colors.dim('# Verify Node, Git, Python, Docker health')}`);
  console.log(`  ${colors.dim('$')} ${colors.brightCyan('is ports')}             ${colors.dim('# List listening ports and process names')}`);
  console.log(`  ${colors.dim('$')} ${colors.brightCyan('is ports --kill 3000')}  ${colors.dim('# Terminate process blocking port 3000')}`);
  console.log(`  ${colors.dim('$')} ${colors.brightCyan('is clean --dry-run')}   ${colors.dim('# Preview safe cleanup without deleting')}`);
  console.log(`  ${colors.dim('$')} ${colors.brightCyan('is git save "feat"')}   ${colors.dim('# Stage and commit changes in one go')}`);
  console.log(`  ${colors.dim('$')} ${colors.brightCyan('is info')}              ${colors.dim('# Show hardware, OS, and repo details')}`);

  console.log(`\n${colors.bold(colors.yellow('SAFETY:'))}`);
  console.log(`  ${symbols.lock} Destructive operations always require explicit confirmation unless overridden.`);

  console.log(`\n${colors.dim('Learn more or report issues: https://github.com/instant-shell/instant-shell')}\n`);
}
