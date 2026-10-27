# AI Bridge — Chrome Extension

One-click transfer of AI responses between Claude and ChatGPT.

## Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `ai-bridge-extension` folder
5. Done! The panel appears on claude.ai and chatgpt.com

## Usage

A floating panel appears in the bottom-right corner on Claude and ChatGPT pages.

- **Copy last response** — grabs the last AI answer, formats it with a prompt asking the other AI to review it, and copies to clipboard
- **Copy with context** — grabs the last few messages for fuller context
- **Paste from [other AI]** — inserts the copied response into the current AI's input field

### Keyboard shortcut

`Ctrl+Shift+B` — toggle panel visibility

## How it works

1. You're on Claude → click "Copy last response"
2. Switch to ChatGPT tab → click "Paste from Claude"
3. ChatGPT reviews Claude's response
4. Click "Copy last response" on ChatGPT
5. Switch back to Claude → click "Paste from ChatGPT"

The extension uses Chrome's local storage to pass data between tabs — no external servers, no API keys, no extra costs.
