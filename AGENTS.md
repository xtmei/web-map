# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Single-file browser-based hex-grid tactical wargame ("Stalingrad: Tactical Commander") built with p5.js. The entire application lives in `index.html` — no build system, package manager, or backend.

### Running the application

Serve `index.html` with any static HTTP server:

```
python3 -m http.server 8080 --directory /workspace
```

Then open `http://localhost:8080/index.html` in Chrome.

Internet access is required for the p5.js CDN dependency (`cdn.jsdelivr.net`).

### Lint / Test / Build

There is no linting configuration, automated test suite, or build step. The project is vanilla HTML/CSS/JS with no tooling.

### Known caveats

- p5.js reserves `key` as a built-in global variable. The codebase uses `hexKey()` instead to avoid this conflict. If adding helper functions, avoid shadowing other p5.js globals (e.g., `mouseX`, `width`, `height`, `key`, `keyCode`).
