# Agent Instructions

## Essential rules
- Keep this file accurate and current at all times.
- Clean up anything that no longer applies (remove stale commands or rules).

## Purpose
- Build a simple side-scrolling game similar to classic Mario.
- Use Phaser (required) with TypeScript modules for all gameplay.
- Provide a complete, runnable `index.html` plus build setup.
- Use placeholder sprites/tiles that are easy to replace later.
- Include a start screen with instructions.
- Start with one well designed world level and leave room for more.

## Current repo status
- This repo currently contains only `AGENTS.md` and `opencode.json`.
- No build, lint, or test tooling exists yet.
- If you add tooling, update this file with the exact commands.
- Vite is to be used for builds.
- Eslint is to be used for linting.
- Vitest is to be used for tests.

### Build
-`npm run build` runs Vite for builds

### Lint
- `npm run lint` runs eslint and tsc

### Test
- `npm run test` runs Vitest

### Run a single test
- Vitest: `npx vitest run path/to/file.test.ts`.
- Vitest by name: `npx vitest run -t "test name"`.

## Game rules
- Arrow keys control left, right, jump, crouch.
- World has regular blocks, powerup blocks, and smashable blocks.
- Powerup blocks emit mushrooms when bumped from underneath.
- Smashable blocks are destroyed when bumped from underneath.
- Enemies include Koopas and Goombas (animated obstacles).
- Picking up a mushroom increases trip level by +1.
- Taking damage decreases trip level by -1.
- Trip level starts at 0. Going below 0 triggers game over.
- Each trip level increases player size and adds a psychedelic distortion.

## Design goals
- One complete world level with clear boundaries and room for expansion.
- Placeholder art should be simple and easily swappable.
- Keep the start screen simple and readable.
- Add short instructions for controls and run steps.

## Code style guidelines

### Language and project structure
- Use TypeScript for game logic and scene setup.
- Keep `index.html` minimal and load the compiled bundle.
- Prefer a `src/` directory with `main.ts` and `scenes/`.
- If you add assets, keep them under `assets/`.

### Imports
- Use ES module syntax (`import ... from ...`).
- Group imports: external modules first, then internal modules.
- Keep import order stable; avoid circular imports.
- Prefer named imports over default where practical.

### Formatting
- Formatting follows ESLint rules; prefer auto-fixable rules.
- Use a common ESLint baseline: `eslint:recommended` + `@typescript-eslint/recommended` + `eslint-plugin-import`.
- Ensure a root `.editorconfig` exists and matches the ESLint formatting choices.
- Use consistent indentation (2 spaces if no formatter exists).
- Prefer single quotes for strings unless escaping becomes noisy.
- Keep lines under ~100 characters when possible.
- Always include trailing commas in multi-line objects/arrays.

### Types
- Prefer explicit types for public functions and exported values.
- Use type aliases for domain concepts (e.g., `TripLevel`).
- Use enums or union types for small finite sets.
- Avoid `any`; use `unknown` and narrow when needed.

### Naming
- `camelCase` for variables and functions.
- `PascalCase` for classes and types.
- `SCREAMING_SNAKE_CASE` for constants that are true globals.
- Use clear, domain-specific names (e.g., `powerupBlock`).

### Functions and classes
- Keep functions small and single-purpose.
- Prefer pure functions for calculations (physics, scoring).
- Encapsulate Phaser-specific wiring in scene classes.
- Avoid deep nesting; return early on error cases.

### Error handling
- Fail fast on missing assets or misconfigured state.
- Use guard clauses when required data is missing.
- Log errors with context once; avoid noisy loops.

### State management
- Keep authoritative state in the scene, not globals.
- Use small, typed state objects for player/enemy state.
- Update UI/state in one place to avoid drift.

### Gameplay logic
- Keep trip level changes centralized (one function).
- Separate collision detection from response logic.
- Ensure consistent damage cooldown to avoid rapid hits.

### Assets and placeholders
- Generate placeholder sprites via Phaser graphics.
- Provide size constants for all sprites/tiles.
- Keep a clear mapping from tile IDs to behavior.

### Comments
- Add comments only where behavior is non-obvious.
- Document any custom physics tweaks or filters.
- Avoid narrating obvious code.

### Performance
- Avoid per-frame allocations inside `update`.
- Use object pools for projectiles or particles if added.
- Keep animation lists short and reuse frames.

### Testing guidance
- Unit tests should target pure logic (collisions, scoring).
- Avoid testing Phaser internals; mock minimal surfaces.
- Keep test fixtures simple and deterministic.

## Files to keep in sync
- If you add build tooling, update `AGENTS.md` commands.
- If you add tests, include single-test invocation examples.
- If you add rules for Cursor or Copilot, mention them here.

## Output expectations for agents
- Produce a complete, runnable `index.html` and build setup.
- Use Phaser (required) and TypeScript modules.
- Include start screen with instructions to play/run.
- Provide one complete world level with room for more.
