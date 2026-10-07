import { spawn, spawnSync, execSync } from 'node:child_process';
import process from 'node:process';

export function runSync(command, args = [], options = {}) {
  try {
    if (process.platform === 'win32') {
      const winCmds = ['npm', 'npx', 'pnpm', 'yarn', 'bun'];
      if (winCmds.includes(command.toLowerCase())) {
        const fullCmd = [command, ...args].join(' ');
        const res = spawnSync(fullCmd, {
          encoding: 'utf8',
          windowsHide: true,
          shell: true,
          timeout: options.timeout || 3000,
          stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
          ...options,
        });
        return {
          status: res.status ?? 1,
          stdout: (res.stdout || '').trim(),
          stderr: (res.stderr || '').trim(),
          success: res.status === 0,
        };
      }
    }

    const res = spawnSync(command, args, {
      encoding: 'utf8',
      windowsHide: true,
      shell: options.shell || false,
      timeout: options.timeout || 3000,
      stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    return {
      status: res.status ?? 1,
      stdout: (res.stdout || '').trim(),
      stderr: (res.stderr || '').trim(),
      success: res.status === 0,
    };
  } catch (err) {
    return {
      status: 1,
      stdout: '',
      stderr: err.message,
      success: false,
    };
  }
}

export function execCommand(cmd, options = {}) {
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    });
    return { success: true, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return {
      success: false,
      stdout: err.stdout ? String(err.stdout).trim() : '',
      stderr: err.stderr ? String(err.stderr).trim() : err.message,
    };
  }
}

export function runInteractive(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

export function hasCommand(bin) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const res = spawnSync(checkCmd, [bin], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return res.status === 0;
}
