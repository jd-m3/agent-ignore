# agent-ignore

Add AI agent folders to your `.gitignore` with a single command.

## Usage

```bash
npx agent-ignore
```

Or install globally:

```bash
npm install -g agent-ignore
agent-ignore
```

## What it Does

Scans your repository for AI coding agent folders and adds them to your `.gitignore`. The script is idempotent - running it multiple times will update the section if needed.

Works with monorepos - patterns match at any directory depth.

## How it Works

1. Fetches the latest agent list from [vercel-labs/skills](https://github.com/vercel-labs/skills/blob/main/src/agents.ts)
2. Falls back to a bundled static list if offline
3. Checks which agent folders actually exist in your repository
4. Adds only the existing folders to `.gitignore`

## Supported Agents

The script recognizes folders from 30+ AI coding agents including:

- Claude Code (`.claude/`)
- Cursor (`.cursor/`)
- GitHub Copilot (`.github/skills/`)
- Windsurf (`.windsurf/`)
- Cline (`.cline/`)
- And many more...

## License

MIT
