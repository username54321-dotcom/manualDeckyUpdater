# Refactor: Split monolith into modules

Split `main.ts` into focused modules around a shared config. No behavior changes.

## Structure

```
config.ts        — all hardcoded strings (GH owner/repo/workflow, paths, download)
lib/
  github.ts      — fetchLatestVersion() → {created_at, url, size}
  install.ts     — checkLocalVersion(), downloadZip(), extractZip()
  prompts.ts     — spinner, confirm, display helpers
main.ts          — thin orchestrator, proper async error handling
```

## Modules

**config.ts**
- `GITHUB` — owner, repo, workflow_id
- `PATHS` — services subdir, exe filenames
- `DOWNLOAD` — archive output path

**lib/github.ts**
- `fetchLatestVersion()` — calls listWorkflowRuns → listWorkflowRunArtifacts, returns relevant fields

**lib/install.ts**
- `checkLocalVersion(homeDir)` — checks both exes exist via fs.access, returns mtime or null
- `downloadZip(url, destPath)` — HTTP get + write file, returns success boolean
- `extractZip(src, destDir)` — unzip, throws on failure

**lib/prompts.ts**
- `createSpinner()` — thin ora wrapper
- `confirmDownload()` / `confirmInstall()` — inquirer confirm wrappers
- `displayVersions(local, latest)` / `displayStatus(msg)` — console output

**main.ts**
- Imports and wires the flow
- Top-level `(async () => { ... })().catch(...)` replaces broken try/catch
- Removes unused imports (commander, mkdir from node:fs)

## What stays the same

- Same GitHub API calls, same workflow
- Same user prompts and spinner behavior
- Same file paths and download logic
- Same exit behavior

## What changes

- No unused imports
- Proper async error handling
- Hardcoded strings in one config file
