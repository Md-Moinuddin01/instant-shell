import readline from 'node:readline';
import process from 'node:process';
import { colors } from './colors.js';

export function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Ask a yes/no question. Default is false (safe).
 */
export async function confirm(question, defaultValue = false) {
  if (!process.stdin.isTTY) {
    // If not a TTY (e.g. CI or pipe), return default
    return defaultValue;
  }

  const rl = createInterface();
  const hint = defaultValue ? '[Y/n]' : '[y/N]';
  const promptText = `${colors.bold(question)} ${colors.dim(hint)} `;

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (!trimmed) {
        resolve(defaultValue);
      } else if (trimmed === 'y' || trimmed === 'yes') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Prompt user for text input.
 */
export async function input(question, defaultValue = '') {
  if (!process.stdin.isTTY) {
    return defaultValue;
  }

  const rl = createInterface();
  const hint = defaultValue ? ` ${colors.dim(`(${defaultValue})`)}` : '';
  const promptText = `${colors.bold(question)}${hint}: `;

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      const val = answer.trim();
      resolve(val || defaultValue);
    });
  });
}

/**
 * Prompt user to select from an array of options.
 */
export async function select(question, choices, defaultIndex = 0) {
  if (!process.stdin.isTTY) {
    return choices[defaultIndex];
  }

  console.log(`\n${colors.bold(colors.cyan('?'))} ${colors.bold(question)}:`);
  choices.forEach((choice, index) => {
    const isDefault = index === defaultIndex;
    const prefix = colors.cyan(`  ${index + 1})`);
    const label = choice.label || choice.title || choice.name || choice;
    const desc = choice.description ? ` ${colors.dim(`- ${choice.description}`)}` : '';
    const defHint = isDefault ? ` ${colors.dim('(default)')}` : '';
    console.log(`${prefix} ${label}${desc}${defHint}`);
  });

  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(colors.dim(`\nSelect [1-${choices.length}] (default: ${defaultIndex + 1}): `), (answer) => {
      rl.close();
      const num = parseInt(answer.trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= choices.length) {
        resolve(choices[num - 1]);
      } else {
        resolve(choices[defaultIndex]);
      }
    });
  });
}
