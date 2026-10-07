import os from 'node:os';
import process from 'node:process';
import { colors, symbols } from '../utils/colors.js';
import { runSync, hasCommand } from '../utils/exec.js';
import { checkConnectivity, getDiskSpace } from '../utils/system.js';
import { formatBytes } from '../utils/format.js';

export async function runDoctor(args = []) {
  console.log(`\n${colors.bold(colors.brightCyan('🩺 Instant Shell Doctor'))} ${colors.dim('— Environment & Tool Diagnostics')}\n`);

  const checks = [];

  // 1. Node.js
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (major >= 18) {
    checks.push({
      category: 'Runtime',
      name: 'Node.js',
      status: 'pass',
      message: `${nodeVersion} (Recommended: v18+)`,
    });
  } else {
    checks.push({
      category: 'Runtime',
      name: 'Node.js',
      status: 'warn',
      message: `${nodeVersion} (Recommended to upgrade to v18+ or v20 LTS)`,
    });
  }

  // 2. npm / package managers
  const npmRes = runSync('npm', ['--version']);
  if (npmRes.success) {
    checks.push({
      category: 'Package Manager',
      name: 'npm',
      status: 'pass',
      message: `v${npmRes.stdout}`,
    });
  } else {
    checks.push({
      category: 'Package Manager',
      name: 'npm',
      status: 'fail',
      message: 'npm is not installed or not in PATH',
    });
  }

  // Additional package managers
  const pnpmRes = runSync('pnpm', ['--version']);
  if (pnpmRes.success) {
    checks.push({
      category: 'Package Manager',
      name: 'pnpm',
      status: 'pass',
      message: `v${pnpmRes.stdout}`,
    });
  }

  const yarnRes = runSync('yarn', ['--version']);
  if (yarnRes.success) {
    checks.push({
      category: 'Package Manager',
      name: 'yarn',
      status: 'pass',
      message: `v${yarnRes.stdout}`,
    });
  }

  // 3. Git
  const gitRes = runSync('git', ['--version']);
  if (gitRes.success) {
    const gitUser = runSync('git', ['config', 'user.name']).stdout;
    const gitEmail = runSync('git', ['config', 'user.email']).stdout;
    let gitMsg = gitRes.stdout;
    let gitStatus = 'pass';
    if (!gitUser || !gitEmail) {
      gitMsg += ` (Notice: git user/email not configured)`;
      gitStatus = 'warn';
    }
    checks.push({
      category: 'Version Control',
      name: 'Git',
      status: gitStatus,
      message: gitMsg,
    });
  } else {
    checks.push({
      category: 'Version Control',
      name: 'Git',
      status: 'fail',
      message: 'Git is not installed or not in PATH',
    });
  }

  // 4. Python
  const pyRes = runSync('python', ['--version']);
  const py3Res = !pyRes.success ? runSync('python3', ['--version']) : null;
  const activePy = pyRes.success ? pyRes : (py3Res?.success ? py3Res : null);

  if (activePy) {
    checks.push({
      category: 'Runtime',
      name: 'Python',
      status: 'pass',
      message: activePy.stdout || activePy.stderr,
    });
  } else {
    checks.push({
      category: 'Runtime',
      name: 'Python',
      status: 'warn',
      message: 'Python not found (optional for non-Python projects)',
    });
  }

  // 5. Docker
  if (hasCommand('docker')) {
    const dockerInfo = runSync('docker', ['info'], { timeout: 1500 });
    if (dockerInfo.success) {
      checks.push({
        category: 'Containers',
        name: 'Docker',
        status: 'pass',
        message: 'Installed and daemon is running',
      });
    } else {
      checks.push({
        category: 'Containers',
        name: 'Docker',
        status: 'warn',
        message: 'Installed, but daemon is not running',
      });
    }
  } else {
    checks.push({
      category: 'Containers',
      name: 'Docker',
      status: 'info',
      message: 'Not installed (optional)',
    });
  }

  // 6. Rust / Cargo
  if (hasCommand('cargo')) {
    const cargoRes = runSync('cargo', ['--version']);
    checks.push({
      category: 'Runtime',
      name: 'Rust / Cargo',
      status: 'pass',
      message: cargoRes.stdout,
    });
  }

  // 7. Go
  if (hasCommand('go')) {
    const goRes = runSync('go', ['version']);
    checks.push({
      category: 'Runtime',
      name: 'Go',
      status: 'pass',
      message: goRes.stdout,
    });
  }

  // 8. Editor / IDE
  const hasCode = hasCommand('code');
  const hasCursor = hasCommand('cursor');
  if (hasCode || hasCursor) {
    const editors = [];
    if (hasCode) editors.push('VS Code');
    if (hasCursor) editors.push('Cursor');
    checks.push({
      category: 'Editor',
      name: 'Editor CLI',
      status: 'pass',
      message: `${editors.join(', ')} detected in PATH`,
    });
  }

  // 9. Memory Check
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const freePercent = (freeMem / totalMem) * 100;
  if (freePercent < 10) {
    checks.push({
      category: 'System',
      name: 'RAM Available',
      status: 'warn',
      message: `Low memory: ${formatBytes(freeMem)} free of ${formatBytes(totalMem)} (${freePercent.toFixed(1)}%)`,
    });
  } else {
    checks.push({
      category: 'System',
      name: 'RAM Available',
      status: 'pass',
      message: `${formatBytes(freeMem)} free of ${formatBytes(totalMem)} (${freePercent.toFixed(1)}%)`,
    });
  }

  // 10. Disk Space
  const disk = getDiskSpace();
  if (disk) {
    const freeGb = disk.free / (1024 * 1024 * 1024);
    if (freeGb < 5) {
      checks.push({
        category: 'System',
        name: `Disk Space (${disk.drive})`,
        status: 'warn',
        message: `Low disk space: ${formatBytes(disk.free)} free of ${formatBytes(disk.total)}`,
      });
    } else {
      checks.push({
        category: 'System',
        name: `Disk Space (${disk.drive})`,
        status: 'pass',
        message: `${formatBytes(disk.free)} free of ${formatBytes(disk.total)}`,
      });
    }
  }

  // 11. Network Connectivity
  const netGitHub = await checkConnectivity('github.com');
  const netNpm = await checkConnectivity('registry.npmjs.org');
  if (netGitHub.ok && netNpm.ok) {
    checks.push({
      category: 'Network',
      name: 'Internet Connection',
      status: 'pass',
      message: 'Connected (GitHub & npm registry reachable)',
    });
  } else if (netGitHub.ok || netNpm.ok) {
    checks.push({
      category: 'Network',
      name: 'Internet Connection',
      status: 'warn',
      message: 'Partial connectivity (some developer services unreachable)',
    });
  } else {
    checks.push({
      category: 'Network',
      name: 'Internet Connection',
      status: 'fail',
      message: 'Offline or DNS resolution failure',
    });
  }

  // Print results grouped or formatted
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const item of checks) {
    let icon = symbols.check;
    let badge = colors.green('PASS');
    if (item.status === 'pass') {
      passCount++;
    } else if (item.status === 'warn') {
      icon = symbols.warning;
      badge = colors.yellow('WARN');
      warnCount++;
    } else if (item.status === 'fail') {
      icon = symbols.cross;
      badge = colors.red('FAIL');
      failCount++;
    } else {
      icon = symbols.info;
      badge = colors.dim('INFO');
    }

    const nameCol = colors.bold(item.name.padEnd(20));
    console.log(`  ${icon} ${nameCol} ${colors.dim(item.message)}`);
  }

  console.log('\n' + colors.dim('─'.repeat(55)));
  const summaryParts = [];
  summaryParts.push(colors.green(`${passCount} passed`));
  if (warnCount > 0) summaryParts.push(colors.yellow(`${warnCount} warnings`));
  if (failCount > 0) summaryParts.push(colors.red(`${failCount} failed`));

  console.log(`  ${colors.bold('Diagnostics Result:')} ${summaryParts.join(colors.dim(' • '))}`);

  if (failCount === 0 && warnCount === 0) {
    console.log(`\n  ${colors.brightGreen('🚀 Everything looks great! Your environment is ready to build.')}\n`);
  } else if (failCount > 0) {
    console.log(`\n  ${colors.brightRed('❗ Some critical tools are missing. Check the FAIL items above.')}\n`);
  } else {
    console.log(`\n  ${colors.brightYellow('💡 Minor warnings detected. You can build, but check recommendations.')}\n`);
  }
}
