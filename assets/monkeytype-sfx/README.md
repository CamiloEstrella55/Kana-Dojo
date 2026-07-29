# Monkeytype SFX Export

This directory contains Monkeytype website sound-effect WAV files exported from:

- Repository: https://github.com/monkeytypegame/monkeytype
- Source folder: `frontend/static/sound`
- Reference source: `frontend/src/ts/controllers/sound-controller.ts`

Selection rule:

- Includes all `.wav` files referenced by Monkeytype's sound controller.
- Preserves original filenames and subfolder structure.
- WAV-only export (no transcoding).

Regeneration (PowerShell):

1. Fresh-clone Monkeytype to `C:\Users\reser\monkeytype`.
2. Parse `sound-controller.ts` for `../sound/...wav` references.
3. Copy those files from `frontend/static/sound` to this directory.
4. Rebuild `manifest.json`.
