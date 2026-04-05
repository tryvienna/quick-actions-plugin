/**
 * Terminal launching — opens a new terminal window and runs a command.
 *
 * Runs in the main process via GraphQL schema resolvers.
 */

import { spawn, execFile } from 'node:child_process';
import { platform } from 'node:os';

/**
 * Open a new Terminal.app window and run a shell command.
 *
 * Uses a two-step AppleScript approach to handle shells with blocking
 * prompts (e.g. oh-my-zsh update prompt):
 *
 * 1. `do script ""` — Creates a new Terminal window and sends an empty line.
 *    If oh-my-zsh is showing `[Y/n]`, the empty line dismisses it (default "no").
 *    If the shell is clean, it's just a harmless blank command.
 * 2. `delay 2` — Wait for shell initialization to complete.
 * 3. `do script "..." in w` — Send the real command to the now-ready shell.
 *    Prefixed with `clear;` to wipe any startup noise.
 */
function openMacTerminal(shellCommand: string): void {
  const escaped = shellCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const appleScript = `tell application "Terminal"
activate
set w to do script ""
delay 2
do script "clear; ${escaped}" in w
end tell`;

  execFile('osascript', ['-e', appleScript], { timeout: 10000 }, () => {
    // fire-and-forget
  });
}

/**
 * Run a pnpm script in a new terminal window.
 * Returns { success, error } indicating whether the terminal was launched.
 */
export function runScriptInTerminal(
  script: string,
  cwd: string,
): { success: boolean; error: string | null } {
  try {
    const command = `pnpm run ${script}`;
    const os = platform();

    if (os === 'darwin') {
      // Unset ESBUILD_BINARY_PATH — the packaged Electron app sets this to its
      // bundled esbuild, which breaks dev builds run in an external terminal.
      openMacTerminal(`unset ESBUILD_BINARY_PATH; cd '${cwd.replace(/'/g, "'\\''")}' && ${command}`);
    } else if (os === 'win32') {
      spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `cd /d "${cwd}" && ${command}`], {
        detached: true,
        stdio: 'ignore',
      }).unref();
    } else {
      const terminals = ['x-terminal-emulator', 'gnome-terminal', 'xterm'];
      for (const term of terminals) {
        try {
          spawn(term, ['-e', `bash -c 'cd "${cwd}" && ${command}; exec bash'`], {
            detached: true,
            stdio: 'ignore',
          }).unref();
          break;
        } catch {
          continue;
        }
      }
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
