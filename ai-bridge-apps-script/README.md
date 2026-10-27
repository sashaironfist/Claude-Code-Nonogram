# AI Bridge — Google Apps Script

Automatically collects and summarizes comments from a Google Doc, formatted for easy copy-paste between Claude and ChatGPT.

## Installation

1. Open your Google Doc
2. Go to **Extensions → Apps Script**
3. Delete any existing code, paste the contents of `Code.gs`
4. Click **Run → setupTrigger** (authorize when prompted)
5. Done! The script checks for new comments every 5 minutes

## Usage

### Automatic mode
The script runs every 5 minutes. When it finds new comments, it appends a formatted summary at the bottom of the doc with ready-to-copy prompts for each AI.

### Manual mode
Use the menu: **🤖 AI Bridge → Collect summary now**

### Comment format
Mark your AI-pasted comments with prefixes so the script knows the source:
- `[CLAUDE] <response text>` — for Claude's responses
- `[CHATGPT] <response text>` — for ChatGPT's responses

### What you get
The summary includes:
- Grouped comments by source (Claude / ChatGPT / You)
- Ready-to-copy prompts for each AI, including the other's comments
- Timestamp and count

## No API keys needed
This script uses only Google Apps Script built-in services (DocumentApp, Drive API). No external calls, no costs.
