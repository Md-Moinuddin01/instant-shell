# ⚡ Instant Shell

> **Instant access to your developer shell.**

**Instant Shell** is a lightweight developer CLI that turns common terminal workflows into simple, memorable commands.

Instead of remembering long commands for setup, diagnostics, Git, ports, cleanup, and project utilities, use one small command:

```bash
is
```

## Why Instant Shell?

Modern development often means jumping between dozens of terminal commands.

You remember some.

You Google some.

You forget the rest.

**Instant Shell sits on top of the terminal and gives you simple shortcuts for the workflows developers use repeatedly.**

---

## 🚀 Example

Instead of running multiple commands to inspect your environment:

```bash
is doctor
```

Need to check ports?

```bash
is ports
```

Need project information?

```bash
is info
```

Need to clean temporary files?

```bash
is clean
```

Need Git shortcuts?

```bash
is git
```

The goal is simple:

> **Less command hunting. More building.**

---

## ✨ Features

- ⚡ Fast CLI startup
- 🧰 Developer utility commands
- 🩺 Environment diagnostics
- 🌐 Port inspection & process termination
- 🌿 Git workflow shortcuts
- 🧹 Project cleanup with dry-run & safety confirmation
- 📦 Project initialization with curated templates
- 💻 System & project information dashboard
- 🔌 Extensible command architecture
- 🔒 Confirmation before destructive actions
- 🎨 Interactive launcher menu

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/<your-username>/instant-shell.git
cd instant-shell
```

Install dependencies:

```bash
npm install
npm link
```

Then run:

```bash
is help
```

Or simply run without arguments for the interactive menu:

```bash
is
```

---

## 🛠️ Commands

| Command | Description |
|---|---|
| `is ui` | Launch interactive web dashboard on localhost |
| `is init` | Initialize a project with templates |
| `is setup` | Setup project dependencies & environment |
| `is doctor` | Diagnose your development environment |
| `is ports` | Inspect active ports & kill processes |
| `is git` | Run useful Git shortcuts & status summary |
| `is clean` | Remove temporary/build artifacts safely |
| `is info` | Show system and project information |
| `is help` | Show available commands |

---

## 🧠 Philosophy

Instant Shell follows three principles:

### Simple

Commands should be easy to remember.

### Fast

A utility should save time, not add another layer of complexity.

### Extensible

Today's shortcuts can become tomorrow's developer automation platform.

---

## 🔐 Safety

Instant Shell should never silently execute destructive operations.

Commands that can modify or delete files provide clear warnings and require confirmation by default.

---

## 📄 License

This project is licensed under the **MIT License**.

