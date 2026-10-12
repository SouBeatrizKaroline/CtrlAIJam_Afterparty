# Afterparty 1.0.1 — technical QA

## Fixed issues

| Issue | Correction |
| --- | --- |
| Page overflow and inconsistent fullscreen sizing | Replaced guessed height offsets and minimum widths with a viewport-filling grid. The scene receives the remaining height. |
| Room clipped in short windows or fullscreen | The Canvas uses `object-fit: contain` in a bounded scene area. The full room remains visible at its original aspect ratio. |
| Scrollable or clipped menus | Cards are fitted to both available width and height after each screen change and resize. Low-height landscape menus use a wider, compact layout. |
| Timer disappeared on smaller widths | All four mission indicators remain present at every tested width. |
| Keepsake progress looked unchanged after discovery | The HUD now separates discovered keepsakes from safely returned keepsakes. |
| Stale progress behind the main menu | Returning to the title resets the room, keepsakes, particles, and quiet-mode state. |
| Keyboard focus remained on header controls | Sound and fullscreen actions restore Canvas focus during play. |
| Space could not activate menu buttons | Space is intercepted only during play; focused menu buttons can be activated normally. |
| Movement or suction looked active in menus | Opening a menu clears held inputs and active movement/vacuum state. Fullscreen changes clear held inputs as well. |
| Potential duplicate upgrade charge | Upgrades require the dock, sufficient scrap, and an upgrade not already installed. |

## Automated checks

`npm test` runs 14 checks covering floor reachability, collection capacity, quiet mode, sleep recovery, correct and incorrect sorting, upgrade transactions, win and loss conditions, pause, resets, keepsake status, card fitting, and complete collection/sorting/upgrade/keepsake interactions.

The complete-flow test positions the robot at reachable interaction targets; it checks state transitions rather than claiming a timed manual playthrough. A separate flood-fill check verifies the robot can reach all collectibles around furniture.

## Browser verification

Viewport checks: **1920 × 1080**, **1366 × 768**, **1024 × 600**, **800 × 450**, **640 × 360**, **390 × 844**, **844 × 390**, and **320 × 568**.

Verified that document dimensions match the viewport, mission timer remains visible, and the title card stays within the scene. Mobile dimensions were checked in a desktop browser, not on physical phones.

Embedded player checks: **800 × 450**, **640 × 360**, **1024 × 600**, and **390 × 844**, with native fullscreen explicitly denied. Verified document dimensions and service-station card bounds after layout stabilizes.

Through the embedded player's real controls, verified movement, vacuum collection, keepsake discovery, returning to the dock, correct sorting, Space activation of a focused sorting button, pause, and restart. Native fullscreen was checked in the standalone player.

Use `http://localhost:4173/tools/qa-embed.html` to reproduce the iframe tests. The harness is excluded from the distributed HTML5 ZIP.

## Remaining host check

Upload the new ZIP to itch.io, select **Click to launch in fullscreen**, and test the actual hosted page. The game's internal viewport has no scrolling. The surrounding itch.io project page is controlled by itch.io and can still scroll outside the launched player.
