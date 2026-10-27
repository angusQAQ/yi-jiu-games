# Game project workflow

The user has explicitly requested that all future game changes be made in this GitHub project and deployed to its fixed game URL.

- Canonical repository: https://github.com/angusQAQ/yi-jiu-games
- Main branch: `main`
- Fixed game URL: https://angusqaq.github.io/yi-jiu-games/
- The HTML, JavaScript, CSS and all runtime assets live in `dist/`. This is a buildless application; there is no generated source/build separation.

For future requested changes, fetch the latest GitHub state, preserve existing work, edit this checkout, run `npm run check`, and verify affected flows in the real browser. Commit and push the completed change to this repository as part of the user's requested work. The existing GitHub Actions workflow checks and deploys `dist/` on every main-branch push. Wait for its deployment result and confirm the live game reflects the change before reporting completion. Keep this repository and fixed URL; do not create replacement repositories or change visibility without a new user request. Do not force-push.

The old `ocean-classroom` Sites checkout is a legacy mirror. It must not be used as the sole source for later changes.

Preserve the user's teaching requirements: large bold Kai Chinese and clear full-width punctuation, Times New Roman toneless Cantonese pinyin only on option word cards, pictures for action vocabulary, natural Hong Kong Cantonese audio, no timers, direct freeze on pause without overlays, immediate teacher question jumps, and complete illustrated/audio sentence reviews. Keep art at its native proportions. The train has seven or eight carriages depending on phrase chunks; never assume a constant count. Its first three levels have word-length clues and a blue single-star beginner badge; its last two use equal blanks and a gold double-star advanced badge.

When changing words, update their sentence-review text, pronunciation metadata, pictures and voice clips together. Use new versioned audio IDs after changing spoken text so browser caches cannot replay an older sentence. Retain asset provenance and third-party notices in `references/` and `dist/assets/`.

The teacher uses the character variant「牀」in all game text, including「起牀」. Preserve its U+7240 Kai font supplement and source notice. Its Cantonese pronunciation remains hei cong.
