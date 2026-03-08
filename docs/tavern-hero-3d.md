# 3D Tavern Hero (Asset + Runtime Notes)

This document covers how tavern hero art assets are organized and how to debug loading issues in local development.

## Model File Location

Place tavern model assets under:
- `public/models/tavern/`

Current project layout:
- `public/models/tavern/Cozy Tavern - First Floor 2/model.obj`
- `public/models/tavern/Cozy Tavern - First Floor 2/materials.mtl`

## Supported Formats and Naming Guidance

Current repository support level:
- Source 3D assets currently stored as `.obj` + `.mtl` in `public/models/tavern/`.
- Runtime hero rendering in app is currently image/CSS based (`HeroDogma`), not a live 3D loader.

Naming guidance for model folders/files:
- Keep one model per folder under `public/models/tavern/`.
- Use stable, descriptive folder names (example: `Cozy Tavern - First Floor 2`).
- Use lowercase, hyphenated filenames for new assets when possible (example: `model.obj`, `materials.mtl`, `albedo.png`).
- Keep texture files colocated with the model/MTL files to avoid broken relative paths.

## Attribution Requirements

Use this exact attribution text in documentation and UI credit surfaces:

"Cozy Tavern - First Floor 2 by Nick Slough [CC-BY] via Poly Pizza"

Where it appears in UI:
- Tavern hero/auth visual caption area (`AuthGate` scene caption in `src/features/auth/components/AuthGate.tsx`).
- If a dedicated 3D hero credit label is added later, include the same text there as well.

## Local Run Instructions

1. Install deps:
```bash
npm install
```

2. Run dev server:
```bash
npm run dev
```

3. Validate static model files are served:
- Open `http://localhost:5173/models/tavern/Cozy%20Tavern%20-%20First%20Floor%202/model.obj`
- Open `http://localhost:5173/models/tavern/Cozy%20Tavern%20-%20First%20Floor%202/materials.mtl`

If both URLs load, Vite static serving is working.

## Troubleshooting Model Load Issues

### 404 for model or MTL file
- Confirm files exist under `public/models/tavern/...`.
- Confirm URL path matches exact folder/file names (including spaces/case).
- Restart `npm run dev` after large asset moves/renames.

### Model present but textures/materials missing
- Check `materials.mtl` references and ensure texture filenames exist in the same folder.
- Use relative paths in MTL that match actual file casing.

### Wrong base URL in deployed builds
- Ensure model URLs are built using Vite base-aware paths (for example with `import.meta.env.BASE_URL` when wiring runtime loader code).

## Performance Notes and Fallback Behavior

Performance:
- Keep OBJ/texture sizes small for quick local iteration and lower memory use.
- Prefer optimized textures and avoid very large uncompressed maps.
- Treat `public/models/tavern/` assets as static payload; large files impact first-load/network time.

Fallback behavior (current implementation):
- `HeroDogma` first tries `dogma-reference.jpg`.
- If hero image fails to load, `HeroDogma` automatically falls back to a CSS-rendered tavern illustration.
- The app does not currently perform runtime 3D model rendering; model files are prepared assets for future 3D integration.
