# Clasp Node Project Design

**Date:** 2026-03-20
**Status:** Approved

## Overview

Convert the existing Google Apps Script project (`Import.gs`) to a TypeScript-first local development workflow. TypeScript source is bundled via esbuild into a single `dist/Code.js` file, which is pushed to Google Apps Script using clasp.

## Goals

- Write and maintain the script in TypeScript locally
- Bundle TypeScript into a single `.gs`-compatible file using esbuild
- Push to Google Apps Script via clasp from the `dist/` directory
- Support future automated deployments via CLI/CI

## Project Structure

```
ottoadman-sheet-script/
├── src/
│   ├── index.ts        # Entry point — assigns GAS functions to globalThis
│   ├── api.ts          # BitJita API fetch helpers
│   ├── sheet.ts        # Spreadsheet read/write helpers
│   └── update.ts       # Core update() / setup() / populateConfig() logic
├── dist/               # esbuild output — what clasp pushes
│   ├── Code.js         # Generated, not committed
│   └── appsscript.json # GAS manifest — committed
├── .clasp.json         # rootDir: "dist", scriptId
├── build.js            # esbuild build script (Node)
├── package.json
├── tsconfig.json
└── .gitignore          # covers dist/Code.js, node_modules/
```

## Build Pipeline

- **Bundler:** esbuild
- **Entry:** `src/index.ts`
- **Output:** `dist/Code.js`
- **Format:** `iife` — required for GAS (no ES module support)
- **Platform:** `browser` (GAS runs in a browser-like V8 environment)
- **Target:** `es2019` (compatible with GAS V8 runtime)
- **Build script:** `build.js` — small Node script driving esbuild API directly

## npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `node build.js` | Compile TypeScript → `dist/Code.js` |
| `push` | `clasp push` | Push `dist/` to Google Apps Script |
| `deploy` | `npm run build && npm run push` | Build and push in one step |

## clasp Configuration (`.clasp.json`)

```json
{ "scriptId": "<your-script-id>", "rootDir": "dist" }
```

## TypeScript Configuration (`tsconfig.json`)

- Target: `ES2019`
- Strict mode enabled
- Includes `@types/google-apps-script` for GAS API type definitions

## Dependencies

```json
{
  "devDependencies": {
    "esbuild": "latest",
    "typescript": "latest",
    "@types/google-apps-script": "latest",
    "@google/clasp": "latest"
  }
}
```

## Source Skeleton

### `src/index.ts`
Assigns the three GAS entry-point functions to `globalThis` so they survive the IIFE bundle:
```typescript
import { setup, update, populateConfig } from './update';

globalThis.setup = setup;
globalThis.update = update;
globalThis.populateConfig = populateConfig;
```

### `src/update.ts`
Stub exports for the three GAS functions — to be filled with migrated logic:
```typescript
export function setup() {}
export function update() {}
export function populateConfig() {}
```

### `src/api.ts`
Placeholder for BitJita API helpers:
```typescript
export function fetchJson(url: string) {
  return JSON.parse(UrlFetchApp.fetch(url).getContentText());
}
```

### `src/sheet.ts`
Placeholder for spreadsheet helpers:
```typescript
export function getSheet(name: string) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)!;
}
```

### `dist/appsscript.json`
GAS manifest — committed to the repo, not generated:
```json
{
  "timeZone": "Europe/Helsinki",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

## Migration Notes

- The existing `Import.gs` remains in the repo root until an explicit migration task is undertaken
- When migrating, the logic in `Import.gs` maps to: API calls → `api.ts`, sheet operations → `sheet.ts`, orchestration → `update.ts`

## Future: Automated Deployments

The `deploy` script is the hook for CI. When ready, a GitHub Actions workflow (or equivalent) can run `npm run deploy` after authenticating clasp with a service account or OAuth token stored as a secret.
