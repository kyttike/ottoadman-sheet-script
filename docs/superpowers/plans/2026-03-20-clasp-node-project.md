# Clasp Node Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a TypeScript + esbuild + clasp development workflow so the Apps Script project can be written locally in TypeScript and pushed to Google Apps Script from `dist/`.

**Architecture:** TypeScript source files in `src/` are bundled by esbuild into a single IIFE-format `dist/Code.js`. Clasp is configured with `rootDir: "dist"` so only the bundle and the GAS manifest are pushed to Apps Script. TypeScript is used for type-checking only (`noEmit: true`); esbuild handles transpilation.

**Tech Stack:** Node.js, TypeScript, esbuild (JS API), `@google/clasp`, `@types/google-apps-script`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `package.json` | npm scripts, devDependencies |
| Create | `tsconfig.json` | TypeScript config (type-check only, noEmit) |
| Create | `build.js` | esbuild JS API invocation |
| Create | `src/index.ts` | Entry point — assigns GAS functions to `globalThis` |
| Create | `src/update.ts` | Stub exports: `setup`, `update`, `populateConfig` |
| Create | `src/api.ts` | Stub: `fetchJson` helper |
| Create | `src/sheet.ts` | Stub: `getSheet` helper |
| Create | `dist/appsscript.json` | GAS manifest (committed, not generated) |
| Modify | `.gitignore` | Replace bare `dist` with `dist/Code.js` |
| Create | `.clasp.json` | Clasp config: `rootDir: "dist"`, `scriptId` placeholder |

---

## Task 1: Initialize `package.json`

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create `package.json`**

Create `/home/kyttike/git/ottoadman-sheet-script/package.json`:

```json
{
  "name": "ottoadman-sheet-script",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "node build.js",
    "typecheck": "tsc --noEmit",
    "push": "clasp push",
    "deploy": "npm run build && npm run push"
  },
  "devDependencies": {
    "@google/clasp": "latest",
    "@types/google-apps-script": "latest",
    "esbuild": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` written, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialize npm project with esbuild, typescript, clasp"
```

---

## Task 2: Create `tsconfig.json`

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: Create `tsconfig.json`**

Create `/home/kyttike/git/ottoadman-sheet-script/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "lib": ["ES2019"],
    "types": ["google-apps-script"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add tsconfig for GAS TypeScript type-checking"
```

---

## Task 3: Create `build.js`

**Files:**
- Create: `build.js`

- [ ] **Step 1: Create `build.js`**

Create `/home/kyttike/git/ottoadman-sheet-script/build.js`:

```javascript
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/Code.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2019',
  treeShaking: false,
}).catch(() => process.exit(1));
```

- [ ] **Step 2: Commit**

```bash
git add build.js
git commit -m "chore: add esbuild build script"
```

---

## Task 4: Create TypeScript source skeleton

**Files:**
- Create: `src/update.ts`
- Create: `src/api.ts`
- Create: `src/sheet.ts`
- Create: `src/index.ts`

- [ ] **Step 1: Create `src/update.ts`**

```typescript
export function setup(): void {}
export function update(): void {}
export function populateConfig(): void {}
```

- [ ] **Step 2: Create `src/api.ts`**

```typescript
export function fetchJson(url: string): unknown {
  return JSON.parse(UrlFetchApp.fetch(url).getContentText());
}
```

- [ ] **Step 3: Create `src/sheet.ts`**

```typescript
export function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)!;
}
```

- [ ] **Step 4: Create `src/index.ts`**

```typescript
import { setup, update, populateConfig } from './update';

const g = globalThis as any;
g.setup = setup;
g.update = update;
g.populateConfig = populateConfig;
```

- [ ] **Step 5: Run type-check to verify no errors**

```bash
npm run typecheck
```

Expected: exits with code 0, no errors printed.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add TypeScript source skeleton"
```

---

## Task 5: Set up `dist/` and fix `.gitignore`

**Files:**
- Create: `dist/appsscript.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create `dist/appsscript.json`**

Create `/home/kyttike/git/ottoadman-sheet-script/dist/appsscript.json`:

```json
{
  "timeZone": "Europe/Helsinki",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

- [ ] **Step 2: Update `.gitignore`**

In `.gitignore`, find line 83 — the bare `dist` entry under the `# Nuxt.js build / generate output` comment — and replace it with `dist/Code.js`. The surrounding lines should look like:

```
# Nuxt.js build / generate output
.nuxt
dist/Code.js
```

- [ ] **Step 3: Force-add `dist/appsscript.json`**

The `dist/` directory was previously gitignored, so the manifest must be force-added:

```bash
git add -f dist/appsscript.json
```

- [ ] **Step 4: Verify staging**

```bash
git status
```

Expected: `dist/appsscript.json` appears as a new tracked file. `dist/` directory itself is no longer fully excluded.

- [ ] **Step 5: Commit**

```bash
git add .gitignore
git commit -m "chore: add GAS manifest and update gitignore for dist/"
```

---

## Task 6: Create `.clasp.json`

**Files:**
- Create: `.clasp.json`

- [ ] **Step 1: Create `.clasp.json`**

Create `/home/kyttike/git/ottoadman-sheet-script/.clasp.json`:

```json
{
  "scriptId": "<your-script-id>",
  "rootDir": "dist"
}
```

To find your `scriptId`: open the Apps Script project in the browser, go to **Project Settings** (gear icon), and copy the **Script ID**. Alternatively it is the ID in the editor URL: `https://script.google.com/home/projects/<scriptId>/edit`.

- [ ] **Step 2: Verify `.clasp.json` is NOT gitignored**

```bash
git check-ignore -v .clasp.json
```

Expected: no output (file is not ignored). If it is ignored, add an exception line `!.clasp.json` to `.gitignore`.

- [ ] **Step 3: Commit**

```bash
git add .clasp.json
git commit -m "chore: add clasp config with rootDir pointing to dist/"
```

---

## Task 7: Verify the full build pipeline

**Goal:** Confirm `npm run build` produces a valid `dist/Code.js` and that the file exposes the GAS entry points.

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: exits with code 0. `dist/Code.js` is created.

- [ ] **Step 2: Verify output contains the entry point assignments**

```bash
grep -c "g\.setup\|g\.update\|g\.populateConfig" dist/Code.js
```

Expected: output is `3` (all three assignments present in the bundle).

- [ ] **Step 3: Run type-check as a final sanity check**

```bash
npm run typecheck
```

Expected: exits with code 0, no errors.

- [ ] **Step 4: Verify `dist/Code.js` is gitignored**

```bash
git check-ignore -v dist/Code.js
```

Expected: output shows `dist/Code.js` is ignored (matched by `.gitignore`).

- [ ] **Step 5: Commit**

No new files to commit. If the build produced `dist/Code.js` and it is correctly ignored, the setup is complete.

---

## Post-Setup: First Push (manual step)

Before running `clasp push` for the first time:

1. Authenticate clasp locally if not already done:
   ```bash
   npx clasp login
   ```
2. Replace the `<your-script-id>` placeholder in `.clasp.json` with your actual Script ID.
3. Run the deploy:
   ```bash
   npm run deploy
   ```
4. After the first push, open the Apps Script editor and **manually delete the existing `Import.gs` file** to avoid duplicate function definitions (`setup`, `update`, `populateConfig`). The new `Code.js` is the source of truth going forward.
