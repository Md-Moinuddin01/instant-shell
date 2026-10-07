import { colors } from './colors.js';

// Remove ANSI escape codes to calculate visual string width
export function stripAnsi(str) {
  return String(str).replace(/\x1b\[[0-9;]*m/g, '');
}

export function stringWidth(str) {
  return stripAnsi(str).length;
}

export function padEnd(str, length) {
  const diff = length - stringWidth(str);
  return diff > 0 ? str + ' '.repeat(diff) : str;
}

export function padStart(str, length) {
  const diff = length - stringWidth(str);
  return diff > 0 ? ' '.repeat(diff) + str : str;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${Math.floor(seconds)}s`);
  return parts.join(' ');
}

export function renderProgressBar(percentage, width = 20) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledLength = Math.round((clamped / 100) * width);
  const emptyLength = width - filledLength;

  let colorFn = colors.green;
  if (clamped > 85) colorFn = colors.red;
  else if (clamped > 65) colorFn = colors.yellow;

  const bar = colorFn('█'.repeat(filledLength)) + colors.dim('░'.repeat(emptyLength));
  return `[${bar}] ${clamped.toFixed(0)}%`;
}

export function renderTable(headers, rows, options = {}) {
  const { padding = 2, align = [] } = options;
  const colWidths = headers.map((h, i) => {
    let max = stringWidth(h);
    for (const row of rows) {
      const cell = row[i] !== undefined ? String(row[i]) : '';
      const w = stringWidth(cell);
      if (w > max) max = w;
    }
    return max;
  });

  const lines = [];

  // Header line
  const headerStr = headers
    .map((h, i) => {
      const isRight = align[i] === 'right';
      const padded = isRight ? padStart(h, colWidths[i]) : padEnd(h, colWidths[i]);
      return colors.bold(colors.brightCyan(padded));
    })
    .join(' '.repeat(padding));

  lines.push(headerStr);

  // Separator line
  const sepStr = colWidths
    .map((w) => colors.dim('─'.repeat(w)))
    .join(' '.repeat(padding));
  lines.push(sepStr);

  // Rows
  for (const row of rows) {
    const rowStr = headers
      .map((_, i) => {
        const cell = row[i] !== undefined ? String(row[i]) : '';
        const isRight = align[i] === 'right';
        return isRight ? padStart(cell, colWidths[i]) : padEnd(cell, colWidths[i]);
      })
      .join(' '.repeat(padding));
    lines.push(rowStr);
  }

  return lines.join('\n');
}

export function renderBox(title, content, options = {}) {
  const { borderColor = colors.cyan, minWidth = 48 } = options;
  const lines = content.split('\n');
  let maxWidth = Math.max(minWidth, stringWidth(title) + 4);
  for (const line of lines) {
    maxWidth = Math.max(maxWidth, stringWidth(line));
  }

  const borderH = '─'.repeat(maxWidth + 2);
  const top = borderColor(`╭─ ${colors.bold(title)} ${'─'.repeat(Math.max(0, maxWidth - stringWidth(title) - 1))}╮`);
  const bottom = borderColor(`╰${borderH}╯`);

  const body = lines
    .map((line) => {
      const pad = ' '.repeat(maxWidth - stringWidth(line));
      return `${borderColor('│')} ${line}${pad} ${borderColor('│')}`;
    })
    .join('\n');

  return `${top}\n${body}\n${bottom}`;
}
