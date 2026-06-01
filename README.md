# Nonogram / Picross

A fully self-contained nonogram (picross) puzzle game built as a single HTML file — no dependencies, no install, just open and play.

## Play

Download `nonogram.html` and open it in any modern browser.

Or clone the repo:
```bash
git clone https://github.com/sashaironfist/Claude-Code-Nonogram.git
```
Then open `nonogram.html` directly in your browser.

https://sashaironfist.github.io/Claude-Code-Nonogram/

## What is a Nonogram?

Nonograms (also called Picross or Griddlers) are logic puzzles where you fill in cells on a grid based on number clues along each row and column. The numbers tell you how many consecutive filled cells appear in that line, in order.

## Features

- **47 puzzles** across five sizes: 5×5, 8×8, 10×10, 15×15, 20×20
- **7 brush colours** — paint cells in Red, Blue, Green, Yellow, Purple, Orange, or Cyan to colour-code your logic
- **16 themes** — Dark, Blue/Black, Red/Black, Green/Black, Retro, Modern, Spring, Summer, Autumn, Winter, Ocean, Neon, Candy, Forest, Grayscale, Sunset
- **Win stats** — tracks total wins, current streak, and best streak (persisted in localStorage)
- **Undo / Redo** — full history stack
- **Hints** — reveals a random unfilled correct cell
- **Check** — highlights incorrect cells without spoiling the solution
- **Timer** — tracks how long each puzzle takes
- **Zoom** — adjustable cell size
- **Row/column done indicators** — clues turn green when that line is correctly solved
- **Drag to paint** — click and drag to fill or mark multiple cells at once

## Controls

| Input | Action |
|---|---|
| Left click / drag | Paint with active brush |
| Right click / drag | Toggle ✕ mark |
| `1` – `7` | Select brush colour |
| `0` | Select eraser |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `H` | Hint |

## Streak Rules

- Solve a puzzle → Streak +1
- Hit **Reset** on an unsolved puzzle → Streak resets to 0
- Load a new puzzle or use **Next Puzzle** → Streak is unaffected

## Built With

Pure HTML, CSS, and vanilla JavaScript — no frameworks, no build tools, no external assets.
