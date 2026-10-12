# Afterparty — development notes

## Direction

The selected idea was a cleaning robot in one party room. The theme connects two kinds of leftovers: recyclable mess and meaningful personal belongings. A leaving-party story gives the room a reason to exist beyond the cleanup challenge.

The creator requested English text, a repository named `CtrlAIJam_Afterparty`, a polished README, GitHub publication under her account, and fullscreen play.

## First implementation

- Fixed top-down living room rendered in Canvas, with a consistent muted mint, coral, and warm wood palette.
- Deterministic layout of 72 collectible leftovers, with placement avoiding furniture and keepsakes.
- Suction particles, finite bag capacity, three sorting categories, and three scrap-funded upgrades.
- Noise accumulation, proximity to the sofa, furniture collisions, quiet movement, and sleep recovery.
- Four keepsakes revealing a leaving-party story; a separate shelf interaction returns them safely.
- Six-minute timer, complete win conditions, two failure conditions, pause, and restart.
- Browser-generated sound effects; no external assets or runtime AI requests.

## Verification and refinement

- Nine automated tests exercise reachability through a robot-sized floor flood fill, collection limits, noise, sorting, upgrades, victory, defeat, reset, and modal pause behavior.
- Desktop browser check confirmed the menu launches, the room renders, movement works, and the vacuum collects an item.
- Visual review found that canvas focus could scroll the status bar out of view. Focus now preserves the scroll position, and desktop sizing fits the room and status indicators into the available viewport.
- Fullscreen is requested from the player's start click, retaining a separate fullscreen control and a graceful fallback for restricted embeds.
- A browser check confirmed entry into fullscreen and the pause screen; a second layout adjustment prevents the room from being clipped by the fullscreen container.
- A self-contained ZIP is generated with exactly `index.html`, `style.css`, and `game.js` at its top level.

## Submission check still needed

Version **1.0.1** replaces the initial page layout with a single viewport that never scrolls, fits all menu cards, preserves the complete room's aspect ratio, and keeps the timer visible. Additional QA fixes and browser evidence are documented in [QA.md](QA.md).

Upload the packaged ZIP to itch.io and play the actual embedded build once. Verify fullscreen permissions and the embed dimensions there; a local browser check cannot establish the host page's settings. This repository's publication does not submit an itch.io entry.

## AI disclosure

OpenAI Codex assisted throughout concept development, implementation, visual work in code, tests, documentation, and packaging. SouBeatrizKaroline provided the creative selection and project direction. No AI-generated raster art, external music, voice cloning, or live AI API is included.
