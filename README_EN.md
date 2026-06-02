# 📋 TodoStickyNote

A Windows desktop sticky note app for managing todos, built with Electron. Always stays on top of your desktop so you can capture tasks at any time.

## Features

- **Todo Management** — Add, edit, complete, and delete todo items
- **Due Dates** — Set due dates with three-color priority indicators (safe / warning / urgent)
- **Sorting** — Sort todos by creation time or due date
- **Batch Import** — Import todos from a .txt file
- **Data Export** — Export all todos to a text file with one click
- **Always on Top** — Floats above all windows, with a pin button for quick toggle
- **Opacity Control** — Adjust window transparency freely
- **Font Scaling** — Customize interface font size
- **Themes** — System, Light, or Dark mode
- **Auto-delete Done** — Optionally auto-delete done items (7/30/90/180 days)
- **Launch at startup** — Optionally start automatically with Windows

## Installation

1. Go to the [Releases](https://github.com/LeslieHoHoHo/TodoStickyNote/releases) page and download the latest `TodoStickyNote-Setup-x.x.x.exe`
2. Double-click to run the installer
3. Choose the install path and complete the installation
4. Launch from the desktop shortcut or Start Menu

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm (included with Node.js)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/LeslieHoHoHo/TodoStickyNote.git
cd TodoStickyNote

# 2. Install dependencies
npm install

# 3. Run in development mode
npm start

# 4. Build the installer
npm run build
```

After the build completes, the installer can be found at `dist/TodoStickyNote-Setup-x.x.x.exe`.

### Tech Stack

- [Electron](https://www.electronjs.org/) v28 — Desktop app framework
- [electron-store](https://github.com/sindresorhus/electron-store) — Local data persistence
- [electron-builder](https://www.electron.build/) — App packaging
