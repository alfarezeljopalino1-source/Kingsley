<div align="center">

# ⚡ Kingsley

**Next-Generation Cross-Platform Terminal Multiplexer & Agentic Workspace**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-emerald.svg)](https://github.com/alfarezeljopalino1-source/Kingsley)
[![Electron](https://img.shields.io/badge/Electron-33.x-cyan.svg)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

*High-Performance • Native PTY • Draggable Split Panes • Anti AI-Slop Design • Open Source*

</div>

---

## 🌟 Overview

**Kingsley** is an ultra-fast, bespoke desktop terminal multiplexer and developer workstation designed for modern software engineers, AI agent orchestrators, and power users.

It combines the raw speed of native pseudoterminals (**Windows ConPTY**, macOS Zsh, and Linux Bash) with a fluid binary split-pane multiplexer, seamless file inspection for AI coding agents (**OMP, Claude Code, OpenCode**), and an instant dual-synchronized theme engine.

---

## 🚀 Key Features

### 🖥️ Native Zero-Latency PTY Engine
- **Windows**: Powered by `node-pty` connected directly to the native Windows Pseudo Console (ConPTY) API. Spawns PowerShell 7 / Windows PowerShell with instant switching to Command Prompt, WSL Linux, or Git Bash.
- **macOS & Linux**: Native POSIX pseudo-terminal execution with `/bin/zsh`, `/bin/bash`, or your system `$SHELL`.
- Full 24-bit TrueColor ANSI support, UTF-8 unicode rendering, and hardware-accelerated terminal canvas.

### 🔀 Dynamic Binary Split Multiplexer
- **Horizontal & Vertical Splits**: Split sessions side-by-side (`Ctrl+Shift+E`) or stacked vertically (`Ctrl+Shift+D`).
- **Draggable Dividing Borders**: Smooth 60–120 FPS resizing handles with visual grip indicators and cyan glow feedback.
- **Independent Lifecycles**: Each pane maintains its own isolated process lifecycle, working directory (`cwd`), scrollback buffer, and auto-fitting dimensions.

### 📂 Drag-and-Drop File Inspection for AI Agents
- Drag files, screenshots, or entire folders from your OS File Explorer straight into the terminal prompt.
- **Clean Workspace Guarantee**: External files are fed directly to your terminal prompt as referenced paths without duplicating or cluttering your project repository.
- Formatted automatically for AI CLI agents (**OMP, Claude Code, OpenCode, Aider**) as well as standard shells.

### 🎨 Settings Studio & 20+ Developer Themes
- Dual-Sync Theme Engine: Instantly updates both the desktop window frame and the terminal ANSI palette with zero reload.
- Handcrafted themes: *Kingsley Obsidian, Golden Premium, Catppuccin Mocha, Tokyo Night, Dracula Pro, One Dark Pro, Nord Arctic, Gruvbox, Monokai Pro, Cyberpunk*, and more.
- Customizable typography, font ligatures, line height, padding, and cursor animations.

### 🌲 Real-Time Git Changes & Diff Viewer
- Live detection of added, modified, or untracked files (`git status`).
- Integrated side-by-side or inline Diff Viewer showing syntax-highlighted additions (`+`) and deletions (`-`).

---

## ⌨️ Essential Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + T` | Open New Workspace Tab |
| `Ctrl + W` | Close Active Workspace Tab |
| `Ctrl + Shift + E` | Split Pane Vertically (Right) |
| `Ctrl + Shift + D` | Split Pane Horizontally (Down) |
| `Ctrl + Shift + W` | Close Active Terminal Pane |
| `Ctrl + B` | Toggle Collapsible Sidebar |
| `Ctrl + K` | Open Command Palette |
| `Ctrl + ,` | Open Settings Studio |
| `Escape` | Dismiss Modals & Overlays |

*(On macOS, use `Cmd` in place of `Ctrl`)*

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Git**

### Installation

```bash
# 1. Clone repository
git clone https://github.com/alfarezeljopalino1-source/Kingsley.git
cd Kingsley

# 2. Install dependencies
npm install

# 3. Launch in development mode
npm run dev
```

---

## 📦 Building from Source

To compile and package self-contained desktop binaries:

```bash
# Compile TypeScript & bundle renderer
npm run build

# Package unpacked Windows binary
npm run pack

# Package standalone Windows NSIS Installer (.exe)
npm run dist

# Package standalone Linux package (AppImage & .deb)
npm run dist:linux

# Package standalone macOS package (.dmg & .zip)
npm run dist:mac
```

All built executables and installers are output to the `release/` folder.

---

## 🏗️ Architecture

```
kingsley/
├── src/
│   ├── main/             # Electron Main Process (PtyManager, IPC bridges)
│   ├── preload/          # Secure Context Isolation API Bridge
│   └── renderer/         # React 18 + TailwindCSS + @xterm/xterm
│       └── src/
│           ├── components/
│           │   ├── terminal/   # TerminalPane, PaneHeader, xterm wrapper
│           │   ├── layout/     # SplitLayout, ResizeHandle
│           │   ├── git/        # GitChangesPanel, FileTree
│           │   ├── sidebar/    # Sidebar, Workspace manager
│           │   ├── settings/   # SettingsModal, appearance, themes
│           │   └── intro/      # Cinematic Intro & Operator setup
│           ├── context/        # Theme, Language & Features providers
│           └── types/          # Layout & IPC typings
└── .github/workflows/    # Multi-platform CI/CD release automation
```

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are warmly welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code standards and pull request process.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal, educational, and commercial use.

**Created with precision by [Alfarezel Jopalino](https://github.com/alfarezeljopalino1-source) & Kingsley Contributors.**
