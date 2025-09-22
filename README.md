# Git Note Status Bar

A VS Code extension that displays workspace-specific notes in the status bar. Store separate notes for each git repository or worktree, helping you remember what you're working on in each workspace.

**🔒 100% Local**: All notes are stored locally in your git config files. No data is ever sent to external servers or cloud services. Your notes stay on your machine.

## Features

- 📝 **Status Bar Notes**: Display custom notes directly in the VS Code status bar
- 🌳 **Workspace-Specific**: Each repository or worktree can have its own note
- ✏️ **Inline Editing**: Click the status bar item to edit your note
- 💾 **Persistent Storage**: Notes are saved locally in git config files
- 🔐 **Privacy First**: No network requests, no telemetry, no external dependencies

## Usage

On first use, the extension will prompt you to enable workspace-specific notes. Once enabled, click the 📝 icon in the status bar to add or edit your note.

Each repository and worktree can have its own separate note, helping you track what you're working on in each workspace.

## Commands

- `Git Note: Edit` - Edit the current note
- `Git Note: Refresh` - Refresh the status bar display
- `Git Note: Enable workspace-specific notes` - Enable separate notes for each workspace
- `Git Note: Disable workspace-specific notes` - Disable workspace-specific notes

## Configuration

- `gitNote.statusBarMaxLength` (default: 60) - Maximum characters shown in the status bar

## How It Works

### Storage (100% Local)
Notes are stored using Git's worktree configuration system:
- When enabled, notes are stored via `git config --worktree worktree.note "your note"`
- Regular repos: Stored in `.git/config.worktree`
- Worktrees: Stored in `.git/worktrees/*/config`
- **No cloud sync**: Notes are never uploaded anywhere - they live only in your local git configuration files

### Simple & Consistent
The extension uses the same approach for all repositories - no complex detection logic. Just enable workspace notes and start adding them!

## Requirements

- VS Code 1.85.0 or higher
- Git installed and accessible from command line

## Installation

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to create the `.vsix` package in the `out/` directory
4. Install via `npm run install-extension` or manually install `out/git-note-statusbar.vsix`

### Development
1. Open in VS Code
2. Press `F5` to run the extension in development mode

### Building
The extension builds to the `out/` directory which is gitignored. The packaged `.vsix` file will be created at `out/git-note-statusbar.vsix`.

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Build and package the extension
npm run build

# Build, package, and install to VS Code
npm run install-extension

# Run in VS Code
Press F5 in VS Code
```