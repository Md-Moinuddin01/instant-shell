import http from 'node:http';
import os from 'node:os';
import process from 'node:process';
import { colors, symbols } from '../utils/colors.js';
import { formatBytes, formatUptime } from '../utils/format.js';
import { getListeningPorts, killProcess, checkConnectivity, getDiskSpace } from '../utils/system.js';
import { runSync } from '../utils/exec.js';

function getHostDetails() {
  const nets = os.networkInterfaces();
  const interfaces = [];
  let mainIp = '127.0.0.1';
  let hostId = '';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
        interfaces.push({
          name,
          address: net.address,
          mac: net.mac,
        });
        if (!mainIp || mainIp === '127.0.0.1') {
          mainIp = net.address;
          hostId = net.mac;
        }
      }
    }
  }

  return {
    hostname: os.hostname(),
    platform: process.platform,
    osType: `${os.type()} ${os.release()} (${os.arch()})`,
    localhost: '127.0.0.1',
    localIp: mainIp,
    hostId: hostId || 'N/A',
    interfaces,
  };
}

export async function runUi(args = []) {
  const hostDetails = getHostDetails();
  const port = parseInt(args[0], 10) || 3456;

  const server = http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // API Routes
    if (url.pathname === '/api/info') {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const cpus = os.cpus();
      const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown';
      const disk = getDiskSpace();

      const data = {
        host: hostDetails,
        cpu: { model: cpuModel, cores: cpus.length },
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          percent: Math.round((usedMem / totalMem) * 100),
          formattedTotal: formatBytes(totalMem),
          formattedUsed: formatBytes(usedMem),
          formattedFree: formatBytes(freeMem),
        },
        uptime: formatUptime(os.uptime()),
        nodeVersion: process.version,
        disk,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (url.pathname === '/api/ports') {
      const ports = getListeningPorts();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ports }));
      return;
    }

    if (url.pathname === '/api/ports/kill' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const { pid } = JSON.parse(body);
          if (!pid) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'PID is required' }));
            return;
          }
          const success = killProcess(pid);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // Serve HTML Dashboard
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getDashboardHtml(hostDetails, port));
  });

  server.listen(port, () => {
    const localUrl = `http://localhost:${port}`;
    const networkUrl = `http://${hostDetails.localIp}:${port}`;

    console.log(`\n${colors.bold(colors.brightCyan('⚡ INSTANT SHELL WEB DASHBOARD'))}`);
    console.log(`  ${colors.bold('Localhost:')}    ${colors.bold(colors.brightGreen(localUrl))}`);
    console.log(`  ${colors.bold('Network:')}      ${colors.cyan(networkUrl)}`);
    console.log(`  ${colors.bold('Host ID:')}      ${colors.yellow(hostDetails.hostId)}`);
    console.log(`  ${colors.bold('Hostname:')}     ${colors.magenta(hostDetails.hostname)}`);
    console.log(`\n${colors.dim('Press Ctrl+C to stop server')}\n`);

    // Auto-open browser on Windows/macOS/Linux
    if (process.platform === 'win32') {
      runSync('cmd.exe', ['/c', 'start', localUrl]);
    } else if (process.platform === 'darwin') {
      runSync('open', [localUrl]);
    } else {
      runSync('xdg-open', [localUrl]);
    }
  });
}

function getDashboardHtml(host, port) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚡ Instant Shell Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 30, 49, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f1f5f9;
      --text-dim: #94a3b8;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --green: #10b981;
      --red: #f43f5e;
      --yellow: #f59e0b;
      --purple: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: radial-gradient(circle at 15% 15%, #131b2e 0%, var(--bg) 60%);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem 1.5rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .logo-badge {
      background: linear-gradient(135deg, #38bdf8, #818cf8);
      color: #030712;
      padding: 0.25rem 0.6rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .host-pill {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: var(--accent);
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .card h3 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-dim);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.5rem;
    }
    .progress-bar {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      border-radius: 9999px;
      background: linear-gradient(90deg, var(--accent), #818cf8);
      transition: width 0.3s ease;
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.5rem;
      overflow-x: auto;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .table-header h2 { font-size: 1.25rem; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th {
      padding: 0.75rem 1rem;
      color: var(--text-dim);
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 0.9rem;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-dev { background: rgba(16, 185, 129, 0.15); color: var(--green); }
    .badge-sys { background: rgba(148, 163, 184, 0.15); color: var(--text-dim); }
    .btn {
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      border: 1px solid rgba(244, 63, 94, 0.3);
      background: rgba(244, 63, 94, 0.1);
      color: var(--red);
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover {
      background: var(--red);
      color: #fff;
    }
    .refresh-btn {
      padding: 0.5rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--card-border);
      background: rgba(255, 255, 255, 0.05);
      color: var(--text);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .refresh-btn:hover { background: rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">
        <span>⚡ Instant Shell</span>
        <span class="logo-badge">v0.1.0</span>
      </div>
      <div class="host-pill">
        <span>ID: <strong>${host.hostId}</strong></span>
        <span>•</span>
        <span>${host.localhost} (${host.localIp})</span>
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <h3>💻 System & Hostname</h3>
        <div class="metric-value">${host.hostname}</div>
        <p style="color: var(--text-dim); font-size: 0.85rem;">${host.osType}</p>
      </div>

      <div class="card">
        <h3>🧠 Memory Usage</h3>
        <div class="metric-value" id="memText">Loading...</div>
        <div class="progress-bar">
          <div class="progress-fill" id="memBar" style="width: 0%"></div>
        </div>
      </div>

      <div class="card">
        <h3>⏱️ Uptime & Node</h3>
        <div class="metric-value" id="uptimeText">Loading...</div>
        <p style="color: var(--text-dim); font-size: 0.85rem;" id="nodeText"></p>
      </div>

      <div class="card">
        <h3>🌐 Network Host ID</h3>
        <div class="metric-value mono" style="font-size: 1.3rem;">${host.hostId}</div>
        <p style="color: var(--text-dim); font-size: 0.85rem;">Local IP: ${host.localIp}</p>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">
        <h2>Active Listening Ports (<span id="portCount">0</span>)</h2>
        <button class="refresh-btn" onclick="fetchPorts()">↻ Refresh</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Port</th>
            <th>Protocol</th>
            <th>Process</th>
            <th>PID</th>
            <th>Local Address</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="portsTableBody">
          <tr><td colspan="6" style="text-align: center; color: var(--text-dim);">Loading active ports...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    async function fetchInfo() {
      try {
        const res = await fetch('/api/info');
        const data = await res.json();
        document.getElementById('memText').textContent = data.memory.formattedUsed + ' / ' + data.memory.formattedTotal;
        document.getElementById('memBar').style.width = data.memory.percent + '%';
        document.getElementById('uptimeText').textContent = data.uptime;
        document.getElementById('nodeText').textContent = 'Node ' + data.nodeVersion + ' • ' + data.cpu.cores + ' Cores';
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchPorts() {
      try {
        const res = await fetch('/api/ports');
        const data = await res.json();
        const tbody = document.getElementById('portsTableBody');
        document.getElementById('portCount').textContent = data.ports.length;

        if (data.ports.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-dim);">No active listening ports detected.</td></tr>';
          return;
        }

        const devPorts = [3000, 3001, 3456, 5173, 8000, 8080, 4200, 5000];

        tbody.innerHTML = data.ports.map(p => {
          const isDev = devPorts.includes(p.port);
          const badgeClass = isDev ? 'badge-dev' : 'badge-sys';
          return \`
            <tr>
              <td><span class="badge \${badgeClass} mono">\${p.port}</span></td>
              <td class="mono">\${p.protocol}</td>
              <td><strong>\${p.processName}</strong></td>
              <td class="mono" style="color: var(--text-dim);">\${p.pid}</td>
              <td class="mono" style="color: var(--text-dim);">\${p.localAddress}</td>
              <td>
                <button class="btn" onclick="killPort(\${p.pid}, '\${p.processName}', \${p.port})">Kill</button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (e) {
        console.error(e);
      }
    }

    async function killPort(pid, name, port) {
      if (!confirm(\`Are you sure you want to terminate \${name} (PID \${pid}) on port \${port}?\`)) return;
      try {
        const res = await fetch('/api/ports/kill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pid })
        });
        const data = await res.json();
        if (data.success) {
          alert(\`Process \${name} (PID \${pid}) terminated.\`);
          fetchPorts();
        } else {
          alert('Failed to terminate process.');
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }

    fetchInfo();
    fetchPorts();
    setInterval(fetchInfo, 5000);
  </script>
</body>
</html>`;
}
