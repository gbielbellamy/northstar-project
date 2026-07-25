# Brand logos

Most technology logos come from the `simple-icons` package at build time — see
`src/components/ui/SkillIcon.tsx`. Nothing needs to live here for those.

This folder is for the handful of brands `simple-icons` doesn't carry. Drop a
file in named after the skill's `icon` slug and it wins over everything else:

| Skill               | Put a file here named | Notes                          |
| ------------------- | --------------------- | ------------------------------ |
| Playwright          | `playwright.svg`      | The two theatre masks          |
| VS Code             | `vscode.svg`          | The blue folded ribbon         |
| Zustand             | `zustand.svg`         | The bear                       |

`.svg` is preferred because it stays sharp at any size; `.png` and `.webp` also
work. The file is matched by name, so `playwright.png` is picked up just the
same. Until a file exists, the card falls back to the two-letter monogram — the
app is never broken by a missing logo.
