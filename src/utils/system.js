import os from 'node:os';
import dns from 'node:dns/promises';
import process from 'node:process';
import { runSync, execCommand } from './exec.js';

/**
 * Check internet connectivity via fast DNS resolve.
 */
export async function checkConnectivity(host = 'github.com', timeoutMs = 2000) {
  try {
    const lookupPromise = dns.lookup(host);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    await Promise.race([lookupPromise, timeoutPromise]);
    return { ok: true, host };
  } catch (err) {
    return { ok: false, error: err.message, host };
  }
}

/**
 * Get disk free and total space for current working drive.
 */
export function getDiskSpace(targetPath = process.cwd()) {
  try {
    if (process.platform === 'win32') {
      const driveLetter = targetPath.slice(0, 2).toUpperCase(); // e.g. "C:"
      const psCmd = `Get-PSDrive -Name "${driveLetter.replace(':', '')}" | Select-Object -Property Free,Used | ConvertTo-Json`;
      const res = runSync('powershell', ['-NoProfile', '-Command', psCmd]);
      if (res.success && res.stdout) {
        try {
          const parsed = JSON.parse(res.stdout);
          const free = Number(parsed.Free || 0);
          const used = Number(parsed.Used || 0);
          const total = free + used;
          return { free, total, used, drive: driveLetter };
        } catch {
          // fallback
        }
      }
    } else {
      const res = runSync('df', ['-k', targetPath]);
      if (res.success && res.stdout) {
        const lines = res.stdout.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          const total = parseInt(parts[1], 10) * 1024;
          const used = parseInt(parts[2], 10) * 1024;
          const free = parseInt(parts[3], 10) * 1024;
          return { free, total, used, drive: parts[0] };
        }
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Map PIDs to Process Names efficiently on Windows.
 */
function getWindowsProcessMap() {
  const map = new Map();
  const res = runSync('tasklist', ['/fo', 'csv', '/nh']);
  if (res.success && res.stdout) {
    const lines = res.stdout.split('\r\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      // CSV format: "Image Name","PID","Session Name","Session#","Mem Usage"
      const match = line.match(/^"([^"]+)","([0-9]+)"/);
      if (match) {
        const [, imageName, pid] = match;
        map.set(parseInt(pid, 10), imageName);
      }
    }
  }
  return map;
}

/**
 * List active listening TCP ports across platforms.
 */
export function getListeningPorts() {
  const ports = [];

  if (process.platform === 'win32') {
    const procMap = getWindowsProcessMap();
    const res = runSync('netstat', ['-ano', '-p', 'tcp']);
    if (res.success && res.stdout) {
      const lines = res.stdout.split('\r\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Look for LISTENING TCP connections
        // e.g. TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
        if (trimmed.startsWith('TCP') && trimmed.includes('LISTENING')) {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 5) {
            const localAddr = parts[1];
            const state = parts[3];
            const pid = parseInt(parts[4], 10);
            const portMatch = localAddr.match(/:(\d+)$/);
            if (portMatch) {
              const portNum = parseInt(portMatch[1], 10);
              const processName = procMap.get(pid) || 'Unknown';
              ports.push({
                protocol: 'TCP',
                localAddress: localAddr,
                port: portNum,
                pid,
                processName,
                state,
              });
            }
          }
        }
      }
    }
  } else {
    // macOS / Linux via lsof or ss
    const lsof = runSync('lsof', ['-iTCP', '-sTCP:LISTEN', '-n', '-P']);
    if (lsof.success && lsof.stdout) {
      const lines = lsof.stdout.split('\n').slice(1);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 9) {
          const processName = parts[0];
          const pid = parseInt(parts[1], 10);
          const nameField = parts[8];
          const portMatch = nameField.match(/:(\d+)$/);
          if (portMatch) {
            ports.push({
              protocol: 'TCP',
              localAddress: nameField,
              port: parseInt(portMatch[1], 10),
              pid,
              processName,
              state: 'LISTEN',
            });
          }
        }
      }
    } else {
      // Fallback to ss
      const ss = runSync('ss', ['-tulpn']);
      if (ss.success && ss.stdout) {
        const lines = ss.stdout.split('\n').slice(1);
        for (const line of lines) {
          if (!line.includes('LISTEN')) continue;
          const parts = line.trim().split(/\s+/);
          const localAddr = parts[4] || '';
          const portMatch = localAddr.match(/:(\d+)$/);
          const procMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
          if (portMatch) {
            ports.push({
              protocol: 'TCP',
              localAddress: localAddr,
              port: parseInt(portMatch[1], 10),
              pid: procMatch ? parseInt(procMatch[2], 10) : 0,
              processName: procMatch ? procMatch[1] : 'Unknown',
              state: 'LISTEN',
            });
          }
        }
      }
    }
  }

  // Deduplicate by port + pid and sort by port number
  const unique = [];
  const seen = new Set();
  for (const item of ports) {
    const key = `${item.port}-${item.pid}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.sort((a, b) => a.port - b.port);
}

/**
 * Kill process by PID safely.
 */
export function killProcess(pid) {
  try {
    if (process.platform === 'win32') {
      const res = runSync('taskkill', ['/F', '/PID', String(pid)]);
      return res.success;
    } else {
      process.kill(pid, 'SIGKILL');
      return true;
    }
  } catch {
    return false;
  }
}
