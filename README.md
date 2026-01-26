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

Appends a list of common AI coding agent folders to your `.gitignore`. The script is idempotent - running it multiple times won't create duplicates.

Works with monorepos - patterns match at any directory depth.

## Folders ignored

See `agent-folders.txt` for list.

## License

MIT
