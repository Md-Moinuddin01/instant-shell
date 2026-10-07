import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { colors, symbols } from '../utils/colors.js';
import { formatBytes, formatUptime, renderProgressBar, renderBox } from '../utils/format.js';
import { runSync } from '../utils/exec.js';

function detectProject(dir = process.cwd()) {
  const result = {
    isProject: false,
    name: path.basename(dir),
    type: 'Generic Directory',
    version: null,
    packageManager: null,
    git: null,
  };

  // Node.js project
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    result.isProject = true;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) result.name = pkg.name;
      if (pkg.version) result.version = pkg.version;

      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps.next) result.type = 'Next.js App';
      else if (deps.nuxt) result.type = 'Nuxt App';
      else if (deps.vite) result.type = 'Vite App';
      else if (deps.react) result.type = 'React App';
      else if (deps.vue) result.type = 'Vue App';
      else if (deps.express || deps.fastify || deps.koa) result.type = 'Node.js Backend';
      else if (deps.typescript) result.type = 'TypeScript Project';
      else result.type = 'Node.js Project';
    } catch {}

    if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) result.packageManager = 'pnpm';
    else if (fs.existsSync(path.join(dir, 'yarn.lock'))) result.packageManager = 'yarn';
    else if (fs.existsSync(path.join(dir, 'bun.lockb')) || fs.existsSync(path.join(dir, 'bun.lock'))) result.packageManager = 'bun';
    else if (fs.existsSync(path.join(dir, 'package-lock.json'))) result.packageManager = 'npm';
    else result.packageManager = 'npm';
  }

  // Python project
  if (fs.existsSync(path.join(dir, 'pyproject.toml')) || fs.existsSync(path.join(dir, 'requirements.txt'))) {
    result.isProject = true;
    result.type = 'Python Project';
    result.packageManager = fs.existsSync(path.join(dir, 'poetry.lock')) ? 'poetry' : 'pip';
  }

  // Rust project
  if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
    result.isProject = true;
    result.type = 'Rust Crate';
    result.packageManager = 'cargo';
  }

  // Git status
  const gitBranch = runSync('git', ['branch', '--show-current']);
  if (gitBranch.success && gitBranch.stdout) {
    const branch = gitBranch.stdout;
    const gitStatus = runSync('git', ['status', '--porcelain']);
    const isClean = gitStatus.success && gitStatus.stdout.length === 0;
    const gitLastCommit = runSync('git', ['log', '-1', '--format=%s (%h)']);

    result.git = {
      branch,
      isClean,
      lastCommit: gitLastCommit.success ? gitLastCommit.stdout : 'No commits yet',
    };
  }

  return result;
}

export function runInfo(args = []) {
  console.log(`\n${colors.bold(colors.brightCyan('💻 Instant Shell Info'))} ${colors.dim('— System & Project Dashboard')}\n`);

  // System Specs
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = (usedMem / totalMem) * 100;
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown';

  console.log(colors.bold(colors.yellow('SYSTEM SPECIFICATIONS')));
  console.log(`  ${colors.bold('OS:')}         ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`  ${colors.bold('Platform:')}   ${process.platform} [${os.hostname()}]`);
  console.log(`  ${colors.bold('CPU:')}        ${cpuModel} (${cpus.length} cores)`);
  console.log(`  ${colors.bold('Memory:')}     ${formatBytes(usedMem)} / ${formatBytes(totalMem)} ${renderProgressBar(memPercent, 15)}`);
  console.log(`  ${colors.bold('Uptime:')}     ${formatUptime(os.uptime())}`);
  console.log(`  ${colors.bold('Node:')}       ${process.version} (V8: ${process.versions.v8})`);

  console.log();

  // Project Info
  const project = detectProject();
  console.log(colors.bold(colors.yellow('CURRENT WORKSPACE')));
  console.log(`  ${colors.bold('Directory:')}  ${process.cwd()}`);
  console.log(`  ${colors.bold('Project:')}    ${colors.bold(colors.brightCyan(project.name))} ${project.version ? colors.dim(`v${project.version}`) : ''}`);
  console.log(`  ${colors.bold('Type:')}       ${project.type}`);
  if (project.packageManager) {
    console.log(`  ${colors.bold('Package Mgr:')}${colors.cyan(project.packageManager)}`);
  }

  if (project.git) {
    const gitStatusStr = project.git.isClean ? colors.green('✔ Working tree clean') : colors.yellow('● Uncommitted changes');
    console.log(`  ${colors.bold('Git Branch:')} ${colors.brightMagenta(project.git.branch)} (${gitStatusStr})`);
    console.log(`  ${colors.bold('Last Commit:')} ${colors.dim(project.git.lastCommit)}`);
  } else {
    console.log(`  ${colors.bold('Git:')}        ${colors.dim('Not a Git repository')}`);
  }

  console.log();
}
