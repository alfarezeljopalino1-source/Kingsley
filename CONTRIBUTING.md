# 🤝 Contributing to Kingsley

Thank you for your interest in contributing to **Kingsley**! We welcome contributions from developers worldwide to help build the best cross-platform terminal multiplexer and agent workspace.

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: v18.0.0 or later (LTS recommended)
- **npm** or **bun** / **pnpm**
- **Git**
- **Platform Compilers** (for native `node-pty` compilation if rebuilding):
  - **Windows**: Visual Studio C++ Build Tools or Windows SDK
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `build-essential`, `python3`, `make`, `gcc`, `g++`

### Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/alfarezeljopalino1-source/Kingsley.git
   cd Kingsley
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Compile TypeScript & verify production build:**
   ```bash
   npm run build
   ```

---

## 🎨 Architectural Standards & Philosophy

Kingsley is built with an uncompromising focus on engineering precision, zero latency, and **Anti AI-Slop design**:

1. **Precision UI**:
   - 1px hairline borders (`rgba(255, 255, 255, 0.08)`).
   - High-contrast dark surfaces with calibrated typography.
   - Micro-animations must feel physical, buttery smooth, and purpose-driven.
   - Avoid generic AI templates, purposeless gradients, or excessive border-radius.

2. **Performance First**:
   - Keep PTY buffer throughput high.
   - All drag dividers must handle mouse events smoothly (60-120 FPS).
   - Never block the UI thread during disk transfers, process scans, or Git checks.

3. **Cross-Platform Compatibility**:
   - Respect platform conventions:
     - **Windows**: ConPTY with PowerShell, CMD, Git Bash, WSL.
     - **macOS**: POSIX PTY with Zsh / Bash.
     - **Linux**: POSIX PTY with Bash / Zsh.
   - Always use `path.join()` or platform-agnostic path resolvers; never hardcode drive letters.

---

## 🚀 Submitting a Pull Request (PR)

1. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add support for custom keybindings in split panes"
   ```
3. Push to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request against the `main` branch.

---

## 📄 License

By contributing to Kingsley, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
