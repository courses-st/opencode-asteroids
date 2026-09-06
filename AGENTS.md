# AGENTS.md

Plain ES6 Asteroids clone. No frameworks, no bundler, no package.json, no tests, no lint, no CI — do not invent a toolchain.

## Run
- Open `index.html` directly in a browser, or `npx serve .` (see `README.md`).

## Gotchas
- `game.js` is loaded as a **classic script** (`<script src>`), not a module. No `import`/`export`/ESM, no `require`; everything runs in global script scope.
- Canvas size is hardcoded in **two places** that must stay in sync: `width="800" height="600"` in `index.html` and the `W`/`H` constants at the top of `game.js`.
- All user-facing text is Spanish (HUD strings like `NIVEL`, `PUNTAJE`, overlay text, comments, README). Write new UI strings and comments in Spanish.

## Style conventions (from `game.js`)
- Section banner comments with `// ── ... ─` separators; entities as classes (`Asteroid`, `Ship`, `Bullet`, `Particle`).
- Entity lifecycle via `dead` flag + `filter()` on the per-frame update (see `update()`).
- Game state machine via `state` variable: `'playing' | 'dead' | 'gameover'`.