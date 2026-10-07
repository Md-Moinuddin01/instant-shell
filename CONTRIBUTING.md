# Contributing to Instant Shell ⚡

Thank you for your interest in contributing to **Instant Shell**!

Instant Shell is built to make common developer terminal workflows instant, simple, and reliable.

---

## 🧭 Principles

1. **Simple**: Commands must be intuitive, memorable, and require minimal keystrokes.
2. **Fast**: Zero bloat. Sub-50ms startup time. Avoid heavyweight dependencies.
3. **Safe**: Destructive operations (deleting files, terminating processes) MUST require explicit user confirmation unless passed with a `--yes` flag.
4. **Cross-Platform**: Support Windows, macOS, and Linux seamlessly.

---

## 🛠️ Development Setup

1. Clone repository:
   ```bash
   git clone https://github.com/instant-shell/instant-shell.git
   cd instant-shell
   ```

2. Link CLI locally:
   ```bash
   npm link
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Test commands:
   ```bash
   node bin/is.js doctor
   node bin/is.js ports
   node bin/is.js clean --dry-run
   node bin/is.js info
   node bin/is.js git
   ```

---

## 🌿 Creating a New Command

1. Add your command logic under `src/commands/<command-name>.js`.
2. Register your command in `src/cli.js`.
3. Add descriptions to `src/commands/help.js`.
4. Add automated test cases in `test/cli.test.js`.

---

## 🔒 Safety First

Never implement a command that deletes files or terminates processes without:
- An explicit prompt (`confirm()`).
- A dry-run mode (`--dry-run`).
- Clear indication of what is about to be affected.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
