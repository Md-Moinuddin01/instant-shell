import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { colors, symbols } from '../utils/colors.js';
import { runSync } from '../utils/exec.js';
import { select, input, confirm } from '../utils/prompt.js';

const TEMPLATES = [
  {
    id: 'node-ts',
    name: 'Node.js + TypeScript',
    description: 'Modern TypeScript CLI / Node project with ESM',
  },
  {
    id: 'api-express',
    name: 'Node.js Express API',
    description: 'Lightweight REST API boilerplate with health check',
  },
  {
    id: 'python-starter',
    name: 'Python Project',
    description: 'Python project with pyproject.toml, main.py & virtualenv setup',
  },
  {
    id: 'web-minimal',
    name: 'Minimal Frontend',
    description: 'Modern HTML5, vanilla CSS design tokens, and JS',
  },
  {
    id: 'repo-scaffold',
    name: 'Repository Skeleton',
    description: 'Clean .gitignore, README.md, and .editorconfig',
  },
];

const DEFAULT_GITIGNORE = `# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing & Coverage
coverage/
*.lcov
.nyc_output/

# Production & Build
dist/
build/
out/
.next/
.nuxt/
.svelte-kit/
.vite/

# Cache
.cache/
.turbo/
.parcel-cache/
.eslintcache/
*.tsbuildinfo

# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
.pytest_cache/

# Rust
target/

# Environment & Secrets
.env
.env.local
.env.*.local
*.pem

# OS Files
.DS_Store
Thumbs.db
`;

const DEFAULT_EDITORCONFIG = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.py]
indent_size = 4
`;

export async function runInit(args = []) {
  console.log(`\n${colors.bold(colors.brightCyan('📦 Instant Shell Init'))} ${colors.dim('— Project Initializer')}\n`);

  const currentDir = process.cwd();
  const dirName = path.basename(currentDir);

  const selectedTemplate = await select('Choose a project template', TEMPLATES, 0);

  const projectName = await input('Project name', dirName);

  console.log(`\n${colors.dim(`Initializing ${selectedTemplate.name} in current directory...`)}`);

  // Common files
  if (!fs.existsSync(path.join(currentDir, '.gitignore'))) {
    fs.writeFileSync(path.join(currentDir, '.gitignore'), DEFAULT_GITIGNORE);
    console.log(`  ${symbols.check} Created .gitignore`);
  }

  if (!fs.existsSync(path.join(currentDir, '.editorconfig'))) {
    fs.writeFileSync(path.join(currentDir, '.editorconfig'), DEFAULT_EDITORCONFIG);
    console.log(`  ${symbols.check} Created .editorconfig`);
  }

  switch (selectedTemplate.id) {
    case 'node-ts': {
      const pkg = {
        name: projectName,
        version: '0.1.0',
        type: 'module',
        main: './dist/index.js',
        scripts: {
          build: 'tsc',
          start: 'node dist/index.js',
          dev: 'tsx watch src/index.ts',
        },
        devDependencies: {
          typescript: '^5.4.0',
          '@types/node': '^20.0.0',
          tsx: '^4.7.0',
        },
      };
      fs.writeFileSync(path.join(currentDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

      const tsconfig = {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src/**/*'],
      };
      fs.writeFileSync(path.join(currentDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n');

      fs.mkdirSync(path.join(currentDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(currentDir, 'src', 'index.ts'),
        `console.log('⚡ Hello from ${projectName}!');\n`
      );
      console.log(`  ${symbols.check} Created package.json, tsconfig.json, and src/index.ts`);
      break;
    }

    case 'api-express': {
      const pkg = {
        name: projectName,
        version: '0.1.0',
        type: 'module',
        main: './src/server.js',
        scripts: {
          start: 'node src/server.js',
          dev: 'node --watch src/server.js',
        },
        dependencies: {
          express: '^4.19.2',
        },
      };
      fs.writeFileSync(path.join(currentDir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
      fs.mkdirSync(path.join(currentDir, 'src'), { recursive: true });
      fs.writeFileSync(
        path.join(currentDir, 'src', 'server.js'),
        `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Welcome to ${projectName} API', status: 'healthy' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running at http://localhost:\${PORT}\`);\n});\n`
      );
      console.log(`  ${symbols.check} Created package.json and src/server.js`);
      break;
    }

    case 'python-starter': {
      const pyproject = `[project]\nname = "${projectName}"\nversion = "0.1.0"\ndescription = "Instant Shell Python starter"\nrequires-python = ">=3.10"\ndependencies = []\n`;
      fs.writeFileSync(path.join(currentDir, 'pyproject.toml'), pyproject);
      fs.writeFileSync(
        path.join(currentDir, 'main.py'),
        `def main():\n    print("⚡ Hello from ${projectName}!")\n\nif __name__ == "__main__":\n    main()\n`
      );
      console.log(`  ${symbols.check} Created pyproject.toml and main.py`);
      break;
    }

    case 'web-minimal': {
      fs.writeFileSync(
        path.join(currentDir, 'index.html'),
        `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${projectName}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="container">\n    <h1>⚡ ${projectName}</h1>\n    <p>Ready to build something incredible.</p>\n  </main>\n  <script src="app.js"></script>\n</body>\n</html>\n`
      );
      fs.writeFileSync(
        path.join(currentDir, 'style.css'),
        `:root {\n  --bg: #0d1117;\n  --text: #f0f6fc;\n  --accent: #58a6ff;\n}\nbody {\n  margin: 0;\n  font-family: system-ui, -apple-system, sans-serif;\n  background: var(--bg);\n  color: var(--text);\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n.container {\n  text-align: center;\n}\nh1 {\n  color: var(--accent);\n}\n`
      );
      fs.writeFileSync(
        path.join(currentDir, 'app.js'),
        `console.log('⚡ ${projectName} initialized');\n`
      );
      console.log(`  ${symbols.check} Created index.html, style.css, and app.js`);
      break;
    }

    case 'repo-scaffold':
    default: {
      if (!fs.existsSync(path.join(currentDir, 'README.md'))) {
        fs.writeFileSync(
          path.join(currentDir, 'README.md'),
          `# ${projectName}\n\nProject initialized with Instant Shell.\n`
        );
        console.log(`  ${symbols.check} Created README.md`);
      }
      break;
    }
  }

  // Initialize git if not present
  if (!fs.existsSync(path.join(currentDir, '.git'))) {
    const gitInit = runSync('git', ['init']);
    if (gitInit.success) {
      console.log(`  ${symbols.check} Initialized Git repository`);
    }
  }

  console.log(`\n${symbols.check} ${colors.bold(colors.green(`Project "${projectName}" ready!`))}`);
  console.log(`  Run ${colors.brightCyan('is setup')} to install dependencies and configure environment.\n`);
}
