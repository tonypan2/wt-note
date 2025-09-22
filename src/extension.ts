import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

let item: vscode.StatusBarItem;

export async function activate(ctx: vscode.ExtensionContext) {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = 'gitNote.editInline';
  ctx.subscriptions.push(item);

  ctx.subscriptions.push(
    vscode.commands.registerCommand('gitNote.refresh', update),
    vscode.commands.registerCommand('gitNote.editInline', editInline),
    vscode.commands.registerCommand('gitNote.enableWorktreeConfig', enableWorktreeConfig),
    vscode.commands.registerCommand('gitNote.disableWorktreeConfig', disableWorktreeConfig),

    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.workspace.onDidChangeWorkspaceFolders(update),
    vscode.window.onDidChangeWindowState(update),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('gitNote')) update();
    })
  );

  update();
}

/** Inline editing via InputBox; ensures workspace-specific config before saving. */
async function editInline() {
  const folder = currentWorkspaceFolder();
  if (!folder) return void vscode.window.showInformationMessage('Open a Git repository first.');
  const cwd = folder.uri.fsPath;

  let hasWtConfig = await isWorktreeConfigEnabled(cwd);

  // Always prompt if worktree config is not enabled
  if (!hasWtConfig) {
    const choice = await vscode.window.showWarningMessage(
      'Workspace-specific notes are disabled. Enable them for this repository?',
      'Enable', 'Cancel'
    );
    if (choice !== 'Enable') return;
    await enableWorktreeConfig();
    hasWtConfig = true; // Update after enabling
  }

  // Always use --worktree flag when worktree config is enabled
  const current = await readNote(cwd, true);
  const input = vscode.window.createInputBox();
  input.title = 'Workspace Note';
  input.value = current ?? '';
  input.prompt = 'Enter to save, Esc to cancel (stored via: git config --worktree worktree.note "<text>")';
  input.ignoreFocusOut = true;

  // Live preview in the status bar while typing
  const prev = current ?? '';
  input.onDidChangeValue(val => {
    if (val.trim() === '') {
      renderNote('(no note)');
    } else {
      renderNote(val);
    }
  });

  let saved = false;

  input.onDidAccept(async () => {
    try {
      // Save or clear the note (always use --worktree flag)
      await writeNote(cwd, input.value, true);
      saved = true;

      // If input is empty, we cleared the note
      if (input.value.trim() === '') {
        // We successfully cleared the note, show "(no note)"
        renderNote('(no note)');
        item.command = 'gitNote.editInline';
      } else {
        // We saved a non-empty note
        renderNote(input.value);
      }
    } catch (e: unknown) {
      // Only show error and revert if there was an actual error
      vscode.window.showErrorMessage(`Failed to save note: ${e instanceof Error ? e.message : String(e)}`);
      renderNote(prev);
    } finally {
      input.dispose();
    }
  });

  input.onDidHide(() => {
    if (!saved) {
      renderNote(prev);
    }
    input.dispose();
  });

  input.show();
}

async function update() {
  const folder = currentWorkspaceFolder();
  if (!folder) {
    renderNote('(no workspace)');
    item.command = undefined;
    return;
  }
  const cwd = folder.uri.fsPath;
  const hasWtConfig = await isWorktreeConfigEnabled(cwd);

  // If worktree config is not enabled, show hint
  if (!hasWtConfig) {
    renderHint('Enable workspace notes', 'Click to enable workspace-specific notes for this repo.');
    item.command = 'gitNote.enableWorktreeConfig';
    return;
  }

  // Always use --worktree flag when worktree config is enabled
  const note = await readNote(cwd, true);
  if (note?.trim().length) {
    renderNote(note);
    item.command = 'gitNote.editInline';
  } else {
    renderNote('(no note)');
    item.command = 'gitNote.editInline';
  }
}

function currentWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const e = vscode.window.activeTextEditor;
  if (e) {
    const f = vscode.workspace.getWorkspaceFolder(e.document.uri);
    if (f) return f;
  }
  return vscode.workspace.workspaceFolders?.[0];
}

async function git(args: string[], cwd: string) {
  return await execFileAsync('git', args, { cwd });
}

// Removed isWorktree function - no longer needed with simplified approach

async function isWorktreeConfigEnabled(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await git(['config', '--type', 'bool', '--get', 'extensions.worktreeConfig'], cwd);
    return stdout.trim() === 'true';
  } catch {
    return false; // not set
  }
}

async function enableWorktreeConfig() {
  const folder = currentWorkspaceFolder();
  if (!folder) return void vscode.window.showInformationMessage('Open a Git repository first.');
  const cwd = folder.uri.fsPath;

  try {
    await git(['config', 'extensions.worktreeConfig', 'true'], cwd);
    vscode.window.showInformationMessage('Workspace-specific notes enabled for this repository.');
    await update();
  } catch (e: unknown) {
    vscode.window.showErrorMessage(`Failed to enable workspace-specific notes: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function disableWorktreeConfig() {
  const folder = currentWorkspaceFolder();
  if (!folder) return void vscode.window.showInformationMessage('Open a Git repository first.');
  const cwd = folder.uri.fsPath;

  const confirm = await vscode.window.showWarningMessage(
    'Disable workspace-specific notes for this repository? Your notes will be preserved but not displayed.',
    { modal: true },
    'Disable', 'Cancel'
  );
  if (confirm !== 'Disable') return;

  try {
    await git(['config', 'extensions.worktreeConfig', 'false'], cwd);
    vscode.window.showInformationMessage('Workspace-specific notes disabled for this repository.');
    await update();
  } catch (e: unknown) {
    vscode.window.showErrorMessage(`Failed to disable workspace-specific notes: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function renderNote(text: string) {
  const cfg = vscode.workspace.getConfiguration('gitNote');
  const maxLen = cfg.get<number>('statusBarMaxLength', 60);
  const single = text.replace(/\s+/g, ' ');
  const clipped = single.length > maxLen ? `${single.slice(0, maxLen - 1)}…` : single;
  item.text = `📝 ${clipped}`;
  item.tooltip = text;
  item.show();
}

function renderHint(label: string, tooltip: string) {
  item.text = `📝 ${label}`;
  item.tooltip = tooltip;
  item.show();
}

async function readNote(cwd: string, useWorktree: boolean): Promise<string | undefined> {
  try {
    // Always use --worktree flag when useWorktree is true
    const args = useWorktree
      ? ['config', '--worktree', '--get', 'worktree.note']
      : ['config', '--get', 'worktree.note'];
    const { stdout } = await git(args, cwd);
    return stdout.replace(/\r?\n$/, '');
  } catch {
    return undefined;
  }
}

async function writeNote(cwd: string, text: string, useWorktree: boolean): Promise<void> {
  if (text.trim() === '') {
    // When clearing, we want to remove the config key entirely
    const args = useWorktree
      ? ['config', '--worktree', '--unset', 'worktree.note']
      : ['config', '--unset', 'worktree.note'];
    try {
      await git(args, cwd);
    } catch (e: any) {
      // git config --unset returns exit code 5 when the key doesn't exist
      // This is NOT an error - it means the note is already cleared
      if (e.code !== 5) {
        throw e;
      }
    }
  } else {
    const args = useWorktree
      ? ['config', '--worktree', 'worktree.note', text]
      : ['config', 'worktree.note', text];
    await git(args, cwd);
  }
}

export function deactivate() {}
