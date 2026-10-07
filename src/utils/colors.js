// Zero-dependency terminal color and styling utilities
import process from 'node:process';

const enabled = !process.env.NO_COLOR && (
  process.env.FORCE_COLOR !== '0' &&
  (process.stdout.isTTY || process.env.FORCE_COLOR === '1' || process.env.CI)
);

const format = (open, close) => {
  return (str) => (enabled ? `\x1b[${open}m${str}\x1b[${close}m` : String(str));
};

export const colors = {
  reset: format(0, 0),
  bold: format(1, 22),
  dim: format(2, 22),
  italic: format(3, 23),
  underline: format(4, 24),
  inverse: format(7, 27),

  // Foreground
  black: format(30, 39),
  red: format(31, 39),
  green: format(32, 39),
  yellow: format(33, 39),
  blue: format(34, 39),
  magenta: format(35, 39),
  cyan: format(36, 39),
  white: format(37, 39),
  gray: format(90, 39),

  // Bright
  brightRed: format(91, 39),
  brightGreen: format(92, 39),
  brightYellow: format(93, 39),
  brightBlue: format(94, 39),
  brightMagenta: format(95, 39),
  brightCyan: format(96, 39),
  brightWhite: format(97, 39),

  // Backgrounds
  bgRed: format(41, 49),
  bgGreen: format(42, 49),
  bgYellow: format(43, 49),
  bgBlue: format(44, 49),
  bgCyan: format(46, 49),
  bgWhite: format(47, 49),
};

export const symbols = {
  check: colors.green('✔'),
  cross: colors.red('✖'),
  warning: colors.yellow('⚠'),
  info: colors.cyan('ℹ'),
  bullet: colors.dim('•'),
  arrow: colors.cyan('›'),
  sparkle: '⚡',
  rocket: '🚀',
  tool: '🧰',
  stethoscope: '🩺',
  network: '🌐',
  git: '🌿',
  broom: '🧹',
  box: '📦',
  computer: '💻',
  lock: '🔒',
};
