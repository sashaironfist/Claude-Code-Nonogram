# AI Bridge — Firefox Extension

One-click transfer of AI responses between Claude and ChatGPT.

## Installation

1. Open Firefox → `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` from the `ai-bridge-extension` folder
4. Done! The panel appears on claude.ai and chatgpt.com

### For permanent install (without reloading each time)

1. Go to `about:config`, set `xpinstall.signatures.required` to `false`
2. Or use [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/):
   ```
   cd ai-bridge-extension
   npx web-ext run
   ```

## Usage

A floating panel appears in the bottom-right corner on Claude and ChatGPT pages.

- **Копировать последний ответ** — grabs the last AI answer, formats it with a prompt asking the other AI to review it, and copies to clipboard
- **Копировать с контекстом** — grabs the last few messages for fuller context
- **Вставить от [other AI]** — inserts the copied response into the current AI's input field

### Keyboard shortcut

`Ctrl+Shift+B` — toggle panel visibility

## How it works

1. You're on Claude → click "Копировать последний ответ"
2. Switch to ChatGPT tab → click "Вставить от Claude"
3. ChatGPT reviews Claude's response
4. Click "Копировать последний ответ" on ChatGPT
5. Switch back to Claude → click "Вставить от ChatGPT"

The extension uses browser local storage to pass data between tabs — no external servers, no API keys, no extra costs.
