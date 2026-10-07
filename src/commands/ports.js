import { colors, symbols } from '../utils/colors.js';
import { renderTable } from '../utils/format.js';
import { getListeningPorts, killProcess } from '../utils/system.js';
import { confirm } from '../utils/prompt.js';

export async function runPorts(args = []) {
  const flags = new Set(args.filter((a) => a.startsWith('-')));
  const nonFlags = args.filter((a) => !a.startsWith('-'));

  const isKillMode = flags.has('--kill') || flags.has('-k');
  const isYes = flags.has('--yes') || flags.has('-y');

  // Check if a specific port number was passed as argument
  let targetPort = null;
  const killFlagIndex = args.findIndex((a) => a === '--kill' || a === '-k');
  if (killFlagIndex !== -1 && args[killFlagIndex + 1] && !args[killFlagIndex + 1].startsWith('-')) {
    targetPort = parseInt(args[killFlagIndex + 1], 10);
  } else if (nonFlags.length > 0) {
    const num = parseInt(nonFlags[0], 10);
    if (!isNaN(num)) {
      targetPort = num;
    }
  }

  const allPorts = getListeningPorts();

  if (targetPort && isKillMode) {
    // Kill specific port
    const match = allPorts.find((p) => p.port === targetPort);
    if (!match) {
      console.log(`\n${symbols.warning} ${colors.yellow(`No process currently listening on port ${targetPort}.`)}\n`);
      return;
    }

    console.log(`\n${colors.bold('Found process on port')} ${colors.cyan(targetPort)}:`);
    console.log(`  Process: ${colors.bold(colors.brightRed(match.processName))} (PID: ${match.pid})`);

    let proceed = isYes;
    if (!proceed) {
      proceed = await confirm(`Are you sure you want to terminate PID ${match.pid} (${match.processName})?`, false);
    }

    if (!proceed) {
      console.log(colors.dim('Aborted. Process was not killed.\n'));
      return;
    }

    const killed = killProcess(match.pid);
    if (killed) {
      console.log(`\n${symbols.check} ${colors.green(`Successfully killed PID ${match.pid} (${match.processName}) on port ${targetPort}.`)}\n`);
    } else {
      console.log(`\n${symbols.cross} ${colors.red(`Failed to kill process PID ${match.pid}. You may need elevated / administrator permissions.`)}\n`);
    }
    return;
  }

  // Filter if port specified without kill flag
  let displayPorts = allPorts;
  if (targetPort) {
    displayPorts = allPorts.filter((p) => p.port === targetPort);
    if (displayPorts.length === 0) {
      console.log(`\n${symbols.info} ${colors.yellow(`Port ${targetPort} is currently free.`)}\n`);
      return;
    }
  }

  console.log(`\n${colors.bold(colors.brightCyan('🌐 Active Listening Ports'))} ${colors.dim(`(${displayPorts.length} found)`)}\n`);

  if (displayPorts.length === 0) {
    console.log(`  ${colors.dim('No active listening TCP ports detected.')}\n`);
    return;
  }

  const headers = ['Port', 'Proto', 'Process', 'PID', 'Local Address', 'State'];
  const rows = displayPorts.map((p) => {
    // Highlight common dev ports
    const isDevPort = [3000, 3001, 5173, 8000, 8080, 4200, 5000, 8888].includes(p.port);
    const portStr = isDevPort
      ? colors.bold(colors.brightGreen(String(p.port)))
      : colors.cyan(String(p.port));

    return [
      portStr,
      p.protocol,
      colors.bold(p.processName),
      colors.dim(String(p.pid)),
      colors.dim(p.localAddress),
      colors.green(p.state),
    ];
  });

  console.log(renderTable(headers, rows, { padding: 3, align: ['right', 'left', 'left', 'right', 'left', 'left'] }));

  console.log(`\n${colors.dim('Tips:')}`);
  console.log(`  ${colors.dim('• Free a port:')} ${colors.brightCyan('is ports --kill <port>')}`);
  console.log(`  ${colors.dim('• Inspect one port:')} ${colors.brightCyan('is ports <port>')}\n`);
}
