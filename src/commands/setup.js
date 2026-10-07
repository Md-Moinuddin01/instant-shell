import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { colors, symbols } from '../utils/colors.js';
import { runInteractive, runSync, hasCommand } from '../utils/exec.js';
import { confirm } from '../utils/prompt.js';
import { runDoctor } from './doctor.js';

export async function runSetup(args = []) {
  console.log(`\n${colors.bold(colors.brightCyan('🧰 Instant Shell Setup'))} ${colors.dim('— Development Environment Setup')}\n`);

  const currentDir = process.cwd();

  // 1. Check for .env file
  const envCandidates = ['.env.example', '.env.sample', '.env.template'];
  const envFile = path.join(currentDir, '.env');

  if (!fs.existsSync(envFile)) {
    for (const candidate of envCandidates) {
      const candidatePath = path.join(currentDir, candidate);
      if (fs.existsSync(candidatePath)) {
        console.log(`${symbols.info} Found template: ${colors.cyan(candidate)}`);
        const copy = await confirm(`Create .env from ${candidate}?`, true);
        if (copy) {
          fs.copyFileSync(candidatePath, envFile);
          console.log(`  ${symbols.check} ${colors.green('Created .env successfully')}`);
        }
        break;
      }
    }
  } else {
    console.log(`  ${symbols.check} ${colors.dim('.env file already present')}`);
  }

  // 2. Install dependencies if needed
  const pkgPath = path.join(currentDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const hasNodeModules = fs.existsSync(path.join(currentDir, 'node_modules'));
    if (!hasNodeModules) {
      console.log(`\n${symbols.info} Node.js dependencies not found in node_modules.`);
      let pm = 'npm';
      if (fs.existsSync(path.join(currentDir, 'pnpm-lock.yaml')) && hasCommand('pnpm')) pm = 'pnpm';
      else if (fs.existsSync(path.join(currentDir, 'yarn.lock')) && hasCommand('yarn')) pm = 'yarn';
      else if ((fs.existsSync(path.join(currentDir, 'bun.lockb')) || fs.existsSync(path.join(currentDir, 'bun.lock'))) && hasCommand('bun')) pm = 'bun';

      console.log(`${colors.cyan(`Running ${pm} install...`)}`);
      try {
        await runInteractive(pm, ['install']);
        console.log(`  ${symbols.check} ${colors.green('Dependencies installed successfully')}`);
      } catch (err) {
        console.log(`  ${symbols.cross} ${colors.red(`Failed to install dependencies: ${err.message}`)}`);
      }
    } else {
      console.log(`  ${symbols.check} ${colors.dim('Node dependencies already installed')}`);
    }
  }

  // Python dependencies
  const pyReq = path.join(currentDir, 'requirements.txt');
  if (fs.existsSync(pyReq)) {
    const venvDir = path.join(currentDir, '.venv');
    if (!fs.existsSync(venvDir)) {
      console.log(`\n${symbols.info} Python requirements.txt found, but .venv does not exist.`);
      const makeVenv = await confirm('Create Python virtual environment (.venv) and install dependencies?', true);
      if (makeVenv) {
        console.log(colors.dim('Creating .venv...'));
        const venvRes = runSync('python', ['-m', 'venv', '.venv']);
        if (venvRes.success) {
          const pipPath = process.platform === 'win32'
            ? path.join(venvDir, 'Scripts', 'pip.exe')
            : path.join(venvDir, 'bin', 'pip');
          console.log(colors.dim('Installing requirements.txt...'));
          await runInteractive(pipPath, ['install', '-r', 'requirements.txt']);
          console.log(`  ${symbols.check} ${colors.green('Python virtual environment ready!')}`);
        }
      }
    }
  }

  // 3. Run doctor
  console.log(`\n${colors.bold(colors.yellow('Verifying Developer Tools:'))}`);
  await runDoctor(['--compact']);

  console.log(`${symbols.sparkle} ${colors.bold(colors.green('Setup complete! Happy coding.'))}\n`);
}
