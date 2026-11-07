# BACKSTAGE MAYHEM — 30-minute classroom edition

An original, unofficial **school Thanksgiving play** adventure inspired by the premise of *Arthur’s Thanksgiving*. Original cartoon character, artwork and gameplay. Not affiliated with Marc Brown, his publisher, or the Arthur television series.

## What's new

- **5 chapters, 4 acts per chapter, 46 active rounds overall.** The very first chapter now contains 9 playable rounds instead of one one-minute mission.
- Three grade settings: **Pre-K–1 (Super Starter)**, **grades 2–3 (Adventurer)**, and **grades 4–5 (Stage Legend)**.
- Extended alternating objectives: script/prop collection, obstacle relays, coded lights, badges and vaults, power towers, and a multi-phase Mayhem Machine finale.
- Each round requires **active movement and problem solving**. No artificial wait screens or forced countdowns. Designed as a roughly **25–35 minute** class experience; actual time varies widely by student skill, grade level, and how carefully they explore.
- Pausing is supported. The game saves **completed act checkpoints**, best scores, and unlocked chapters in each browser on that iPad. Unfinished rounds do not survive closing the tab.
- Original custom HTML5 Canvas graphics, responsive controls, touch joystick, BOOST, INTERACT/BLAST, keyboard controls, and synthesized sound effects. Mission briefings include a **HEAR THIS MISSION** button for supported browsers.
- No logins, student names, tracking, analytics, external assets, or server required.

## GitHub Pages — easiest method

Use the `Backstage_Mayhem_30_Minute_One_File.zip` package. Unzip and upload **only `index.html`** to the root of a new GitHub repository. In **Settings → Pages**, select **Deploy from a branch**, `main`, `/(root)`, then Save.

## GitHub Pages — offline-installable version

Use the complete ZIP. Upload its files **directly into the repo root** (`index.html`, `style.css`, `game.js`, `manifest.webmanifest`, `sw.js`, and PNG icons); enable GitHub Pages the same way. The service worker supports caching after first load, and updates are network-first when online.

On the iPad, use Safari in **landscape mode**. Add to Home Screen for the full-screen installable experience. On-screen: drag the left joystick, tap **BOOST** to dash, **INTERACT** for consoles/trunks/exits, or **BLAST** against the boss. On desktop: WASD/arrow keys, Shift, and E/Space.

## Classroom use

Read *Arthur’s Thanksgiving* first or revisit its central challenge: nobody wants to take the turkey role in the school play. Students then play an original backstage adventure about teamwork, leadership, rehearsal, and persistence. Younger students may benefit from a partner or teacher reading prompts aloud. A 5-minute discussion afterward can ask what made the team successful and how they resolved challenges without giving up.

## Developer testing

Automated browser validation completed all **46 active rounds** through the finale in grades 2–3 mode with no reported JavaScript errors. The grade-level choices, act transitions, endgame sequence, and per-round objectives were exercised by a scripted browser test. The advertised session length is a design target rather than a guarantee; no in-person 30-minute student playtest has been performed.
